"""Database session management.

Driver normalization (psycopg v3), SQLite PRAGMAs for dev, and Neon-compatible
per-connection Postgres timeouts applied via event listeners (Neon's pooler
rejects startup parameters, so they must be SET per connection).
"""

from collections.abc import Generator
from typing import Any

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from orbit.config.settings import settings
from orbit.db.base import Base

# Normalise the database URL to psycopg (v3). Users may set postgresql:// or
# postgresql+psycopg2:// -- both map to psycopg v3.
_db_url = settings.database_url
if _db_url.startswith(("postgresql://", "postgresql+psycopg2://")):
    _db_url = _db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)

_is_sqlite = "sqlite" in _db_url
_engine_kwargs: dict[str, object] = {"echo": settings.database_echo}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs["pool_size"] = settings.db_pool_size
    _engine_kwargs["max_overflow"] = settings.db_max_overflow
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_recycle"] = settings.db_pool_recycle_seconds
    _engine_kwargs["connect_args"] = {"connect_timeout": settings.db_connect_timeout_seconds}

engine = create_engine(_db_url, **_engine_kwargs)


if _is_sqlite:

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection: Any, _connection_record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

else:
    _stmt_timeout_ms = settings.db_statement_timeout_seconds * 1000
    _idle_tx_timeout_ms = settings.db_idle_transaction_timeout_seconds * 1000

    @event.listens_for(engine, "connect")
    def _set_pg_timeout(dbapi_connection: Any, _connection_record: Any) -> None:
        """Set timeouts per-connection (compatible with Neon pooler)."""
        cursor = dbapi_connection.cursor()
        cursor.execute(f"SET statement_timeout = {_stmt_timeout_ms}")
        cursor.execute(f"SET idle_in_transaction_session_timeout = {_idle_tx_timeout_ms}")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_session() -> Generator[Session]:
    """Yield a database session, committing only if there are pending changes."""
    session = SessionLocal()
    try:
        yield session
        if session.new or session.dirty or session.deleted:
            session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """Create tables (dev convenience; production uses Alembic migrations)."""
    Base.metadata.create_all(bind=engine)


def get_engine() -> Engine:
    """Return the SQLAlchemy engine."""
    return engine
