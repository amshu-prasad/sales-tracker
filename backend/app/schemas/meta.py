from typing import Any, Dict
from pydantic import BaseModel


class MetaUpdate(BaseModel):
    """Accepts any subset of CLIENTS / VERTICALS / AMS keys."""

    class Config:
        extra = "allow"

    def allowed_fields(self) -> Dict[str, Any]:
        allowed = {"CLIENTS", "VERTICALS", "AMS"}
        return {k.upper(): v for k, v in self.dict().items() if k.upper() in allowed}
