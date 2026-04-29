from fastapi import Header, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
import jwt

from .config import get_settings
from .database import get_database


def _validate_object_id(value: str) -> str:
    try:
        return str(ObjectId(value))
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user context",
        ) from None


async def get_current_user_id(
    authorization: str | None = Header(default=None),
    x_clinix_user_id: str | None = Header(default=None),
    x_clinix_gateway_secret: str | None = Header(default=None),
) -> str:
    settings = get_settings()

    if x_clinix_user_id:
        if settings.chatbot_gateway_secret and (
            x_clinix_gateway_secret != settings.chatbot_gateway_secret
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid chatbot gateway credentials",
            )
        return _validate_object_id(x_clinix_user_id)

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, no token",
        )

    if not settings.jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET is not configured",
        )

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, token failed",
        ) from exc

    user_id = payload.get("id") or payload.get("_id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, user context missing",
        )

    user_id = _validate_object_id(str(user_id))
    user = await get_database().users.find_one({"_id": ObjectId(user_id)}, {"_id": 1})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, user no longer exists",
        )

    return user_id
