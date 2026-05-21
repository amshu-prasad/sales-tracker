from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class ProfileSchema(BaseModel):
    opportunity_id: str
    source: str
    engg_name: str
    ss_id: Optional[str] = None
    projected_experience: str
    profile_status: str
    selection_date: Optional[date] = None
    open_status: Optional[str]
    BU_name: Optional[str]
    hiring_manager_name: Optional[str]
    hiring_manager_email: Optional[EmailStr]
    hiring_location: Optional[str]