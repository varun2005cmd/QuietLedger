import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase

from config import get_settings
from db.mongo import connect_db, close_db, get_db
from db.collections import USERS_COLLECTION, ENTRIES_COLLECTION
from routers import auth, entries, users

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to MongoDB and ensure indexes.
    Shutdown: close the Motor client.
    """
    settings = get_settings()
    await connect_db(app, settings.mongodb_uri, settings.mongodb_db_name)

    db: AsyncIOMotorDatabase = app.state.db

    try:
        # Ensure unique index on google_sub for fast login lookups
        await db[USERS_COLLECTION].create_index("google_sub", unique=True)
        await db[USERS_COLLECTION].create_index("email", unique=True)

        # Compound unique index: one entry per user per day
        await db[ENTRIES_COLLECTION].create_index(
            [("user_id", 1), ("date", 1)],
            unique=True,
            name="user_date_unique",
        )
        logger.info("MongoDB indexes verified.")
    except Exception as exc:
        logger.warning("Could not create MongoDB indexes at startup (will retry on first use): %s", exc)

    yield  # app is running

    await close_db(app)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="QuietLedger API",
        description="Private journaling backend. Never stores plaintext journal content.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    app.include_router(auth.router)
    app.include_router(entries.router)
    app.include_router(users.router)

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
