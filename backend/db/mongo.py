import dns.resolver
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from fastapi import Request

# Force dnspython (used by pymongo for SRV lookup) to use Google DNS.
# This is needed on machines where the system resolver doesn't return SRV records.
_resolver = dns.resolver.Resolver(configure=False)
_resolver.nameservers = ["8.8.8.8", "8.8.4.4"]
dns.resolver.default_resolver = _resolver


def get_db(request: Request) -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the active Motor database."""
    return request.app.state.db


async def connect_db(app, uri: str, db_name: str) -> None:
    """Called at app startup. Creates the Motor client and attaches it to app state."""
    client: AsyncIOMotorClient = AsyncIOMotorClient(
        uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
    )
    app.state.mongo_client = client
    app.state.db = client[db_name]


async def close_db(app) -> None:
    """Called at app shutdown."""
    app.state.mongo_client.close()
