"""API dependencies for dependency injection."""

from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from orbit.core.auth.tokens import verify_token
from orbit.db.models import User
from orbit.db.session import get_session

security = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    """Resolve the current user from a Bearer access token (two-pass tv check)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    # First pass: decode to get user_id, so we can look up the current tv.
    token_data = verify_token(token, token_type="access")
    if token_data is None or token_data.user_id is None:
        raise credentials_exception

    user = session.execute(select(User).where(User.id == token_data.user_id)).scalar_one_or_none()
    if user is None:
        raise credentials_exception

    # Second pass: reject tokens whose tv doesn't match the user's current one.
    if verify_token(token, token_type="access", expected_tv=user.token_version) is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    return user


def get_http_client(request: Request) -> httpx.AsyncClient:
    """Return a shared httpx client.

    Uses the lifespan-created client on app.state when present (local/uvicorn).
    On Vercel, Mangum runs with lifespan="off" so app.state.http_client is never
    set -- create one lazily and cache it on app.state so OAuth callbacks work.
    """
    client: httpx.AsyncClient | None = getattr(request.app.state, "http_client", None)
    if client is None:
        client = httpx.AsyncClient(timeout=10.0)
        request.app.state.http_client = client
    return client


CurrentUser = Annotated[User, Depends(get_current_user)]
DatabaseSession = Annotated[Session, Depends(get_session)]
HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]
