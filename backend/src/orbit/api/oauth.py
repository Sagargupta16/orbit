"""OAuth authentication endpoints (GitHub, Google).

Server-side authorization-code flow:
1. Frontend opens the provider authorize URL (built from /providers config).
2. Provider redirects to the frontend callback with a code.
3. Frontend POSTs the code here; backend exchanges it, fetches the profile,
   requires a verified email, then creates/links a user and returns JWTs.

State tokens are stateless and HMAC-signed with the server secret, so they
survive serverless cold starts while remaining unforgeable.
"""

import base64
import hashlib
import hmac
import logging
import secrets
import time
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status

from orbit.api.deps import DatabaseSession, HttpClient
from orbit.config.settings import settings
from orbit.schemas.auth import OAuthCallbackRequest, OAuthProviderConfig, Token
from orbit.services.auth_service import AuthService

logger = logging.getLogger("orbit.oauth")

router = APIRouter(prefix="/api/auth/oauth", tags=["oauth"])

_GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
_GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
_GITHUB_USER_URL = "https://api.github.com/user"
_GITHUB_EMAILS_URL = "https://api.github.com/user/emails"
_GITHUB_SCOPES = "read:user user:email"

_GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
_GOOGLE_SCOPES = "openid email profile"

_STATE_TTL = 600  # 10 minutes


def _state_secret() -> bytes:
    return settings.jwt_secret_key.encode()


def _sign_state(payload: str) -> str:
    digest = hmac.new(_state_secret(), payload.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")


def _generate_state() -> str:
    nonce = secrets.token_urlsafe(16)
    expiry = str(int(time.time()) + _STATE_TTL)
    payload = f"{nonce}.{expiry}"
    return f"{payload}.{_sign_state(payload)}"


def _validate_state(state: str | None) -> None:
    if not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing OAuth state parameter",
        )
    try:
        nonce, expiry_str, sig = state.split(".")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state parameter",
        ) from None

    payload = f"{nonce}.{expiry_str}"
    if not hmac.compare_digest(sig, _sign_state(payload)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state parameter",
        )
    try:
        expired = int(time.time()) > int(expiry_str)
    except ValueError:
        expired = True
    if expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expired OAuth state parameter",
        )


def _get_redirect_uri(provider: str) -> str:
    return f"{settings.frontend_url}/auth/callback/{provider}"


@router.get("/providers")
def get_oauth_providers() -> list[OAuthProviderConfig]:
    """Return enabled OAuth provider configs for the frontend."""
    providers: list[OAuthProviderConfig] = []

    if settings.github_client_id:
        providers.append(
            OAuthProviderConfig(
                provider="github",
                client_id=settings.github_client_id,
                authorize_url=_GITHUB_AUTHORIZE_URL,
                scope=_GITHUB_SCOPES,
                redirect_uri=_get_redirect_uri("github"),
                state=_generate_state(),
            )
        )

    if settings.google_client_id:
        providers.append(
            OAuthProviderConfig(
                provider="google",
                client_id=settings.google_client_id,
                authorize_url=_GOOGLE_AUTHORIZE_URL,
                scope=_GOOGLE_SCOPES,
                redirect_uri=_get_redirect_uri("google"),
                state=_generate_state(),
            )
        )

    return providers


async def _oauth_get(
    client: httpx.AsyncClient,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    error_detail: str = "OAuth request failed",
) -> dict[str, Any]:
    resp = await client.get(url, headers=headers)
    if resp.status_code != 200:
        logger.warning("%s: %s", error_detail, resp.status_code)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail)
    return resp.json()  # type: ignore[no-any-return]


def _bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@router.post("/github/callback")
async def github_callback(
    body: OAuthCallbackRequest,
    session: DatabaseSession,
    client: HttpClient,
) -> Token:
    """Exchange a GitHub authorization code for orbit JWT tokens."""
    _validate_state(body.state)

    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth is not configured",
        )

    resp = await client.post(
        _GITHUB_TOKEN_URL,
        data={
            "code": body.code,
            "client_id": settings.github_client_id,
            "client_secret": settings.github_client_secret,
            "redirect_uri": _get_redirect_uri("github"),
        },
        headers={"Accept": "application/json"},
    )
    if resp.status_code != 200:
        try:
            error_code = resp.json().get("error")
        except ValueError:
            error_code = None
        logger.warning(
            "GitHub token exchange failed: status=%s error=%s",
            resp.status_code,
            error_code or "unknown",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub token exchange failed",
        )

    access_token: str | None = resp.json().get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to obtain access token from GitHub",
        )

    user_info = await _oauth_get(
        client,
        _GITHUB_USER_URL,
        headers=_bearer(access_token),
        error_detail="Failed to fetch GitHub user profile",
    )
    email = user_info.get("email")
    if not email:
        email = await _fetch_github_primary_email(client, access_token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve a verified email from GitHub.",
        )

    return AuthService(session).oauth_login_or_register(
        email=email,
        full_name=user_info.get("name"),
        provider="github",
        provider_id=str(user_info.get("id", "")),
    )


async def _fetch_github_primary_email(client: httpx.AsyncClient, access_token: str) -> str | None:
    resp = await client.get(_GITHUB_EMAILS_URL, headers=_bearer(access_token))
    if resp.status_code != 200:
        return None
    emails: list[dict[str, Any]] = resp.json()
    for entry in emails:
        if entry.get("primary") and entry.get("verified"):
            return entry.get("email")
    for entry in emails:
        if entry.get("verified"):
            return entry.get("email")
    return None


@router.post("/google/callback")
async def google_callback(
    body: OAuthCallbackRequest,
    session: DatabaseSession,
    client: HttpClient,
) -> Token:
    """Exchange a Google authorization code for orbit JWT tokens."""
    _validate_state(body.state)

    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    resp = await client.post(
        _GOOGLE_TOKEN_URL,
        data={
            "code": body.code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": _get_redirect_uri("google"),
            "grant_type": "authorization_code",
        },
    )
    if resp.status_code != 200:
        try:
            error_code = resp.json().get("error")
        except ValueError:
            error_code = None
        logger.warning(
            "Google token exchange failed: status=%s error=%s",
            resp.status_code,
            error_code or "unknown",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token exchange failed",
        )

    access_token = resp.json().get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to obtain access token from Google",
        )

    user_info = await _oauth_get(
        client,
        _GOOGLE_USERINFO_URL,
        headers=_bearer(access_token),
        error_detail="Failed to fetch Google user profile",
    )
    email = user_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve email from Google",
        )
    if not user_info.get("verified_email", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google email is not verified",
        )

    return AuthService(session).oauth_login_or_register(
        email=email,
        full_name=user_info.get("name"),
        provider="google",
        provider_id=str(user_info.get("id", "")),
    )
