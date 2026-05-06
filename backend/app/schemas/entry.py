from typing import Optional
from pydantic import BaseModel


class EntryCreate(BaseModel):
    date: str
    client: str
    vertical: str
    source: str          # Bench | Partner
    empType: str         # T&M | ODC
    type: str            # selection | onboarding | offboarding
    remarks: Optional[str] = ""
    candidateName: str


class EntryUpdate(BaseModel):
    date: Optional[str] = None
    client: Optional[str] = None
    vertical: Optional[str] = None
    source: Optional[str] = None
    empType: Optional[str] = None
    type: Optional[str] = None
    candidateName: Optional[str] = None
    remarks: Optional[str] = None
