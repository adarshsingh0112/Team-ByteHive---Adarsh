from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid

from database import create_db_and_tables, get_session
from models import (
    Project,
    ProjectCreateInput,
    CheckinInput,
    HealthSummaryResponse,
    CheckinResponse
)
from claude_service import (
    analyze_concept,
    generate_roadmap,
    generate_pitch_outline,
    run_checkin_coach
)

app = FastAPI(
    title="Hackathon Project Coach API",
    description="Backend AI agent for hackathon scope analysis, roadmap generation, pitch outlines, and live coaching.",
    version="1.0.0"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Initializes SQLite database and tables on server startup."""
    create_db_and_tables()

# --- Root Health Endpoint ---
@app.get("/health", tags=["Health"])
def root_health():
    """Root health check endpoint."""
    return {"status": "healthy", "service": "Hackathon Project Coach API"}

# --- Endpoint 1: POST /project/create ---
@app.post("/project/create", response_model=Project, status_code=status.HTTP_201_CREATED, tags=["Project"])
def create_project(payload: ProjectCreateInput, session: Session = Depends(get_session)):
    """
    Creates a new project record.
    Calls Claude for Concept Analysis and populates the analysis JSON field.
    """
    if not payload.idea_text.strip():
        raise HTTPException(status_code=400, detail="idea_text cannot be empty.")
    
    # 1. Call Claude for Concept Analysis
    analysis_data = analyze_concept(payload.idea_text)
    
    # 2. Create project DB record with empty roadmap, pitch_outline, risks, checkin_history
    new_project = Project(
        idea_text=payload.idea_text,
        analysis=analysis_data,
        roadmap=[],
        pitch_outline={},
        risks=[],
        checkin_history=[]
    )
    
    session.add(new_project)
    session.commit()
    session.refresh(new_project)
    
    return new_project

# --- Endpoint 2: POST /project/{id}/roadmap ---
@app.post("/project/{id}/roadmap", response_model=List[Dict[str, Any]], tags=["Project"])
def create_roadmap(id: str, session: Session = Depends(get_session)):
    """
    Generates an hour-by-hour build roadmap (5-9 milestones) using Claude.
    Updates and returns the roadmap array.
    """
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id '{id}' not found.")
    
    # Generate roadmap from stored idea_text + analysis
    roadmap_items = generate_roadmap(project.idea_text, project.analysis)
    
    project.roadmap = roadmap_items
    session.add(project)
    session.commit()
    session.refresh(project)
    
    return project.roadmap

# --- Endpoint 3: POST /project/{id}/pitch ---
@app.post("/project/{id}/pitch", response_model=Dict[str, Any], tags=["Project"])
def create_pitch(id: str, session: Session = Depends(get_session)):
    """
    Generates a 3-5 minute demo pitch outline using Claude.
    Updates and returns pitch_outline JSON object.
    """
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id '{id}' not found.")
    
    pitch_data = generate_pitch_outline(project.idea_text, project.analysis, project.roadmap)
    
    project.pitch_outline = pitch_data
    session.add(project)
    session.commit()
    session.refresh(project)
    
    return project.pitch_outline

# --- Endpoint 4: POST /project/{id}/checkin ---
@app.post("/project/{id}/checkin", response_model=CheckinResponse, tags=["Project"])
def process_checkin(id: str, payload: CheckinInput, session: Session = Depends(get_session)):
    """
    Processes mid-hackathon check-in update.
    Calls Claude to update roadmap item statuses, add new risks, and return coaching response.
    """
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id '{id}' not found.")
    
    if not payload.update_text.strip():
        raise HTTPException(status_code=400, detail="update_text cannot be empty.")
    
    # Call Claude for Check-in Coach logic
    coach_res = run_checkin_coach(project.roadmap, project.risks, payload.update_text)
    
    coaching_msg = coach_res.get("coaching_response", "Keep pushing forward on your core demo MVP!")
    updated_items = coach_res.get("updated_roadmap_items", [])
    new_risks = coach_res.get("new_risks", [])
    
    # 1. Update roadmap statuses
    status_map = {item["id"]: item["new_status"] for item in updated_items if "id" in item and "new_status" in item}
    roadmap_changes = []
    
    current_roadmap = list(project.roadmap)
    for r_item in current_roadmap:
        r_id = r_item.get("id")
        if r_id in status_map:
            old_status = r_item.get("status", "not_started")
            new_status = status_map[r_id]
            r_item["status"] = new_status
            roadmap_changes.append({"item_id": r_id, "old_status": old_status, "new_status": new_status})
    
    # 2. Append new risks
    current_risks = list(project.risks)
    for r_risk in new_risks:
        current_risks.append({
            "id": f"risk_{str(uuid.uuid4())[:8]}",
            "description": r_risk.get("description", "Unspecified risk"),
            "severity": r_risk.get("severity", "medium"),
            "raised_at": datetime.now(timezone.utc).isoformat(),
            "resolved": False
        })
    
    # 3. Append to checkin_history
    current_history = list(project.checkin_history)
    current_history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "update_text": payload.update_text,
        "agent_response": coaching_msg,
        "roadmap_changes": roadmap_changes
    })
    
    # Save updates back to DB
    project.roadmap = current_roadmap
    project.risks = current_risks
    project.checkin_history = current_history
    
    session.add(project)
    session.commit()
    session.refresh(project)
    
    return CheckinResponse(
        coaching_response=coaching_msg,
        project=project
    )

# --- Endpoint 5: GET /project/{id} ---
@app.get("/project/{id}", response_model=Project, tags=["Project"])
def get_project(id: str, session: Session = Depends(get_session)):
    """Returns the full project state."""
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id '{id}' not found.")
    return project

# --- Endpoint 6: GET /project/{id}/health ---
@app.get("/project/{id}/health", response_model=HealthSummaryResponse, tags=["Project"])
def get_project_health(id: str, session: Session = Depends(get_session)):
    """
    Computes summary metrics in Python (no LLM call):
    - percent_complete: percentage of done roadmap items
    - blocked_count: number of blocked roadmap items
    - high_risk_count: number of unresolved high-severity risks
    - on_track: true if blocked_count == 0 and high_risk_count == 0
    """
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id '{id}' not found.")
    
    roadmap = project.roadmap or []
    risks = project.risks or []
    
    total_items = len(roadmap)
    done_items = sum(1 for item in roadmap if item.get("status") == "done")
    blocked_count = sum(1 for item in roadmap if item.get("status") == "blocked")
    
    high_risk_count = sum(
        1 for r in risks 
        if str(r.get("severity", "")).lower() == "high" and not r.get("resolved", False)
    )
    
    percent_complete = round((done_items / total_items) * 100.0, 1) if total_items > 0 else 0.0
    on_track = (blocked_count == 0) and (high_risk_count == 0)
    
    return HealthSummaryResponse(
        percent_complete=percent_complete,
        blocked_count=blocked_count,
        high_risk_count=high_risk_count,
        on_track=on_track
    )
