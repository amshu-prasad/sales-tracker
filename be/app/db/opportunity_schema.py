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
    priority: Optional[str] = None
    doable_headcount: Optional[str] = None
    file_id: Optional[str] = None
    vertical: str
    open_status: Optional[list] = None
    hiring_manager_name: Optional[str] = None
    hiring_manager_email: Optional[EmailStr] = None
    hiring_location: Optional[str] = None
    hiring_manager_phno: Optional[str] = None
    client_bu: Optional[str] = None
    expected_closure_date: Optional[str] = None
    comments: Optional[str] = None
    job_desc: Optional[str] = None
    client_details: bool