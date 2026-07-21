from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import orbit
from orbit.config import settings

app = FastAPI(title="orbit", version=orbit.__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": orbit.__version__}
