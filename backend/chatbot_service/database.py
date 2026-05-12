from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import get_settings


_client: AsyncIOMotorClient | None = None


def get_database() -> AsyncIOMotorDatabase:
    global _client

    settings = get_settings()
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)

    return _client[settings.database_name]


async def close_database() -> None:
    global _client

    if _client is not None:
        _client.close()
        _client = None
