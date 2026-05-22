import logging
import requests as http_requests
from fastapi import Depends, HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import MODULE_ID



AUTH_SERVICE_URL = "http://localhost/smart-auth-be/api/v1/validate-token"
logger = logging.getLogger("Authenticator")

security = HTTPBearer()
def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    try:
        headers = {"Authorization": f"Bearer {token}"}
        params = {"module": MODULE_ID}
        response = http_requests.post(AUTH_SERVICE_URL, headers=headers, params=params)
        
        if response.status_code == 403:
            raise HTTPException(status_code=403, detail="Permission denied")
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Unauthorized")

        response_data = response.json()

        if not response_data.get("isValid"):
            raise HTTPException(status_code=401, detail="Token invalid")

        user = response_data.get("user")

        # Map role to manager/am
        roles = user.get("role", [])
        
        if isinstance(roles, list):
            is_manager = "13evreg4420-b6a1-4fec-8a93-dverr42329bs51" in roles
        else:
            is_manager = roles == "13evreg4420-b6a1-4fec-8a93-dverr42329bs51"

        if is_manager:
            return "manager"

        username = user.get("user_name") or user.get("sub")
        usr = username.split("@")[0].capitalize()
        if not usr:
            raise HTTPException(status_code=401, detail="Invalid token claims")

        return usr

    except HTTPException:
        raise
    except http_requests.exceptions.RequestException as ex:
        raise HTTPException(status_code=401, detail="Authorization failed")