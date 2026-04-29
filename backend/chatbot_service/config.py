from functools import lru_cache
from urllib.parse import urlparse

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _database_name_from_uri(uri: str) -> str:
    parsed = urlparse(uri)
    path = parsed.path.strip("/")
    return path or "clinix"


class Settings(BaseSettings):
    app_name: str = "CliniX Chatbot Service"
    mongo_uri: str = Field(default="mongodb://127.0.0.1:27017/clinix", alias="MONGO_URI")
    mongo_database: str | None = Field(default=None, alias="MONGO_DATABASE")
    jwt_secret: str = Field(default="", alias="JWT_SECRET")
    chatbot_gateway_secret: str = Field(default="", alias="CHATBOT_GATEWAY_SECRET")
    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openai/gpt-4o-mini", alias="OPENROUTER_MODEL")
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1",
        alias="OPENROUTER_BASE_URL",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def database_name(self) -> str:
        return self.mongo_database or _database_name_from_uri(self.mongo_uri)


@lru_cache
def get_settings() -> Settings:
    return Settings()
