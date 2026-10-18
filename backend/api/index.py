"""Vercel serverless entry point: Vercel's Python runtime serves the FastAPI ASGI ``app``."""

from orbit.api.main import app

__all__ = ["app"]
