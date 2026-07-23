"""JWT token utilities (PyJWT).

Every token embeds a ``tv`` (token_version) claim mirroring ``User.token_version``.
Bumping the DB column on logout / account delete invalidates all outstanding
tokens for that user in one write -- no per-token blocklist.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from orbit.config.settings import settings
from orbit.schemas.auth import Token, TokenData, TokenPayload


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(days=settings.jwt_refresh_token_expire_days)
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_tokens(user_id: int, email: str, token_version: int = 0) -> Token:
    """Create an access + refresh token pair carrying the user's token_version."""
    token_data = {"sub": str(user_id), "email": email, "tv": token_version}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


def decode_token(token: str) -> TokenPayload | None:
    """Decode and validate a JWT token's signature/structure."""
    try:
        payload: dict[str, Any] = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return TokenPayload(
            sub=payload.get("sub", ""),
            email=payload.get("email", ""),
            exp=datetime.fromtimestamp(payload.get("exp", 0), tz=UTC),
            type=payload.get("type", "access"),
            tv=payload.get("tv"),
        )
    except jwt.PyJWTError:
        return None


def verify_token(
    token: str,
    token_type: str = "access",
    expected_tv: int | None = None,
) -> TokenData | None:
    """Verify a token and extract user data.

    When ``expected_tv`` is provided, the token's ``tv`` claim must match the
    user's current token_version. Legacy tokens with no ``tv`` are accepted as
    0 unless ``settings.jwt_strict_tv`` is set.
    """
    payload = decode_token(token)
    if payload is None or payload.type != token_type:
        return None
    if payload.exp < datetime.now(UTC):
        return None

    if expected_tv is not None:
        token_tv = payload.tv
        if token_tv is None:
            if settings.jwt_strict_tv:
                return None
            token_tv = 0
        if token_tv != expected_tv:
            return None

    try:
        user_id = int(payload.sub)
    except (TypeError, ValueError):
        return None

    return TokenData(user_id=user_id, email=payload.email)
