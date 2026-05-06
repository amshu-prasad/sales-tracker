import jwt
import requests as http_requests
from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import AUTH_SERVICE_URL, JWT_SECRET, MANAGER_ROLE_ID, MODULE_ID

security = HTTPBearer(auto_error=False)


def make_token(username: str) -> str:
    return jwt.encode({"sub": username}, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    try:
        response = http_requests.post(
            AUTH_SERVICE_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={"module": MODULE_ID},
        )

        if response.status_code == 403:
            raise HTTPException(status_code=403, detail="Permission denied")
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Unauthorized")

        response_data = response.json()

        if not response_data.get("isValid"):
            raise HTTPException(status_code=401, detail="Token invalid")

        user  = response_data.get("user")
        roles = user.get("role", [])

        is_manager = (
            MANAGER_ROLE_ID in roles
            if isinstance(roles, list)
            else roles == MANAGER_ROLE_ID
        )

        if is_manager:
            return "manager"

        username = user.get("user_name") or user.get("sub")
        usr = username.split("@")[0].capitalize()

        if not usr:
            raise HTTPException(status_code=401, detail="Invalid token claims")

        return usr

    except HTTPException:
        raise
    except http_requests.exceptions.RequestException:
        raise HTTPException(status_code=401, detail="Authorization failed")
