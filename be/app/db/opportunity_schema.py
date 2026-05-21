from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional


class OpportunitySchema(BaseModel):
    client: str
    BU: str
    mode: str
    team: str
    skill: str
    month: str
    reqdate: date
    location: str
    no_of_positions: int
    experience: str
    expected_start_date: str
    technical_poc: str
    priority: str
    doable_headcount: int
    file_id: Optional[str] = None
    vertical: str
    open_status: Optional[list]
    hiring_manager_name: Optional[str]
    hiring_manager_email: Optional[EmailStr]
    hiring_location: Optional[str]