"""FastAPI application for orbit."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import orbit
from orbit.api.auth import router as auth_router
from orbit.api.contacts import router as contacts_router
from orbit.api.oauth import router as oauth_router
from orbit.config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Create and dispose the shared httpx client used for OAuth calls.

    On Vercel, Mangum runs with lifespan="off"; deps.get_http_client creates
    the client lazily there instead.
    """
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await app.state.http_client.aclose()


app = FastAPI(title="orbit", version=orbit.__version__, lifespan=lifespan)

# CORS: allowlist the configured origins plus the frontend origin derived from
# settings.frontend_url. Auth is Bearer-header (no cookies), so credentials off.
_cors_origins = list(settings.cors_origins)
if settings.frontend_url:
    _parsed = urlparse(settings.frontend_url)
    _frontend_origin = f"{_parsed.scheme}://{_parsed.netloc}"
    if _frontend_origin and _frontend_origin not in _cors_origins:
        _cors_origins.append(_frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(contacts_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": orbit.__version__}
