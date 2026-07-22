"""Authentication service: OAuth login/registration, token refresh, account ops.

Identity is keyed on (auth_provider, auth_provider_id), NOT email. Email only
links a provider to a pre-existing provider-less account; cross-provider linking
on a shared email is refused to prevent account takeover.
"""

import logging
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from orbit.core.auth import create_tokens, verify_token
from orbit.db.models import User
from orbit.schemas.auth import Token, UserResponse

logger = logging.getLogger("orbit.auth")


class AuthService:
    """Authentication business logic (OAuth-only)."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def refresh_tokens(self, refresh_token: str) -> Token:
        """Issue a new token pair from a valid, non-revoked refresh token."""
        token_data = verify_token(refresh_token, token_type="refresh")
        if token_data is None or token_data.user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = self._get_user_by_id(token_data.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # Re-verify against the current token_version so a logout/delete bump
        # invalidates outstanding refresh tokens.
        if (
            verify_token(refresh_token, token_type="refresh", expected_tv=user.token_version)
            is None
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return create_tokens(user.id, user.email, user.token_version)

    def oauth_login_or_register(
        self,
        *,
        email: str,
        full_name: str | None,
        provider: str,
        provider_id: str,
    ) -> Token:
        """Login or register a user from a provider-verified OAuth identity."""
        user = self._get_user_by_provider(provider, provider_id)

        if user is None:
            existing = self._get_user_by_email(email)
            if existing is not None:
                if existing.auth_provider and existing.auth_provider != provider:
                    logger.warning(
                        "OAuth login refused: email linked to %s, not %s",
                        existing.auth_provider,
                        provider,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            "This email is already registered with a different "
                            f"sign-in provider ({existing.auth_provider}). "
                            "Please sign in with that provider."
                        ),
                    )
                user = existing

        if user:
            user.auth_provider = provider
            user.auth_provider_id = provider_id
            if not user.full_name and full_name:
                user.full_name = full_name
            user.is_verified = True
            user.last_login = datetime.now(UTC)
            self.session.commit()
            logger.info("OAuth login for user_id=%s via %s", user.id, provider)
        else:
            user = User(
                email=email,
                full_name=full_name,
                is_verified=True,
                auth_provider=provider,
                auth_provider_id=provider_id,
                last_login=datetime.now(UTC),
            )
            self.session.add(user)
            self.session.commit()
            logger.info("New OAuth user registered: user_id=%s via %s", user.id, provider)

        return create_tokens(user.id, user.email, user.token_version)

    def logout(self, user: User) -> None:
        """Invalidate all outstanding tokens by bumping token_version."""
        user.token_version += 1
        self.session.commit()
        logger.info("Logout: bumped token_version for user_id=%s", user.id)

    def update_profile(self, user: User, full_name: str | None) -> User:
        """Update the user's display name."""
        if full_name is not None:
            user.full_name = full_name
            self.session.commit()
            self.session.refresh(user)
        return user

    def delete_account(self, user: User) -> None:
        """Permanently delete the user (contacts cascade via FK)."""
        user_id = user.id
        self.session.delete(user)
        self.session.commit()
        logger.info("Account deleted: user_id=%s", user_id)

    def get_user_response(self, user: User) -> UserResponse:
        """Convert a User to its public response schema."""
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            auth_provider=user.auth_provider,
            created_at=user.created_at.isoformat(),
            last_login=user.last_login.isoformat() if user.last_login else None,
        )

    def _get_user_by_email(self, email: str) -> User | None:
        return self.session.execute(select(User).where(User.email == email)).scalar_one_or_none()

    def _get_user_by_provider(self, provider: str, provider_id: str) -> User | None:
        if not provider_id:
            return None
        return self.session.execute(
            select(User).where(
                User.auth_provider == provider,
                User.auth_provider_id == provider_id,
            )
        ).scalar_one_or_none()

    def _get_user_by_id(self, user_id: int) -> User | None:
        return self.session.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
