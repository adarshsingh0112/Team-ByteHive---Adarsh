from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, JSON, Column
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone

# --- Database SQLModel Table ---
class Project(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    idea_text: str = Field(nullable=False)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    # Complex fields stored as JSON in SQLite
    analysis: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    roadmap: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    pitch_outline: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    risks: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    checkin_history: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))

# --- Pydantic Request & Response Schemas ---
class ProjectCreateInput(BaseModel):
    idea_text: str

class CheckinInput(BaseModel):
    update_text: str

class HealthSummaryResponse(BaseModel):
    percent_complete: float
    blocked_count: int
    high_risk_count: int
    on_track: bool

class CheckinResponse(BaseModel):
    coaching_response: str
    project: Project
