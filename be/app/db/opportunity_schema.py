from pydantic import BaseModel
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
    start_date: date
    technical_poc: str
    priority: str
    doable_headcount: int
    file_id: Optional[str] = None
    vertical: str