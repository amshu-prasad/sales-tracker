from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class ProfileSchema(BaseModel):
    opportunity_id: str
    source: str
    engg_name: str
    ss_id: Optional[str] = None
    projected_experience: Optional[str] = None
    profile_status: str
    selection_date: Optional[date] = None
    remarks: Optional[str] = None
    
class OffboardingProfileSchema(BaseModel):
    opportunity_id: str
    informed_date: Optional[date] = None
    type: str
    offboarding_month: str
    offboarding_date: date
    emp_id: str
    engg_name: str
    department: str
    vertical_head: str
    acc_manager: str
    client_name: str
    client_offboarding_loc: str
    reason: str
    revenu_impact_comments: Optional[str] = None
    