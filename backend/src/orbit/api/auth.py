"""Authentication API endpoints: token refresh, profile, logout, account delete.

OAuth-only. Login is handled by the OAuth router.
"""

from typing import Annotated

from fastapi import APIRouter, Depends

from orbit.api.deps import CurrentUser, DatabaseSession
from orbit.schemas.auth import (
    MessageResponse,
    RefreshTokenRequest,
    Token,
    UserResponse,
    UserUpdate,
)
from orbit.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def get_auth_service(session: DatabaseSession) -> AuthService:
    return AuthService(session)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/refresh")
def refresh_token(token_request: RefreshTokenRequest, auth_service: AuthServiceDep) -> Token:
    """Refresh the access token using a valid refresh token."""
    return auth_service.refresh_tokens(token_request.refresh_token)


@router.get("/me")
def get_me(current_user: CurrentUser, auth_service: AuthServiceDep) -> UserResponse:
    """Return the current user's profile."""
    return auth_service.get_user_response(current_user)


@router.post("/logout")
def logout(current_user: CurrentUser, auth_service: AuthServiceDep) -> MessageResponse:
    """Log out, invalidating all outstanding tokens server-side."""
    auth_service.logout(current_user)
    return MessageResponse(message="Successfully logged out")


@router.put("/me")
def update_profile(
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
    updates: UserUpdate,
) -> UserResponse:
    """Update the current user's profile."""
    updated = auth_service.update_profile(current_user, updates.full_name)
    return auth_service.get_user_response(updated)


@router.delete("/account")
def delete_account(current_user: CurrentUser, auth_service: AuthServiceDep) -> MessageResponse:
    """Permanently delete the current user's account and all data."""
    auth_service.delete_account(current_user)
    return MessageResponse(message="Account and all data permanently deleted")
