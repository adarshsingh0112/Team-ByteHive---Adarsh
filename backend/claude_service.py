import os
import json
import uuid
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Attempt to import anthropic SDK
try:
    import anthropic
    HAS_ANTHROPIC_SDK = True
except ImportError:
    HAS_ANTHROPIC_SDK = False

CLAUDE_MODEL = "claude-sonnet-4-6"

# System Prompts explicitly requested by specification
CONCEPT_ANALYSIS_PROMPT = (
    "You are a senior hackathon mentor who has judged and coached teams at international hackathons. "
    "Given a raw project idea, analyze it critically but constructively. You MUST identify at least one real "
    "weakness or gap — do not just praise the idea. Respond ONLY with valid JSON matching this schema, "
    "no markdown, no preamble: {scope_critique: 1-2 sentences on whether scope is realistic for a hackathon timeframe, "
    "missing_pieces: array of specific missing technical or product elements, feasibility_flags: array of specific risks to feasibility}"
)

ROADMAP_GENERATION_PROMPT = (
    "You are a senior hackathon mentor creating a practical, hour-by-hour build roadmap. "
    "Given the project idea and its analysis, produce 5-9 milestones a small team (2-4 people) can realistically "
    "complete within the given hackathon timeframe. Each milestone should be concrete and demo-oriented — "
    "prioritize getting to a working demo over feature completeness. Respond ONLY with valid JSON array: "
    "[{id, title, description, estimated_hours, status: not_started, order}]"
)

PITCH_OUTLINE_PROMPT = (
    "You are a senior hackathon mentor helping a team craft a winning pitch. Given the project idea, analysis, "
    "and roadmap, generate a pitch outline optimized for a 3-5 minute demo in front of judges. Focus on clarity "
    "and a strong 'aha' moment during the demo_flow. Respond ONLY with valid JSON: "
    "{problem: 1-2 sentences sharp and relatable, solution: 1-2 sentences with clear differentiation, "
    "demo_flow: array of 4-6 steps of what to show live, impact: 1-2 sentences on why this matters}"
)

CHECKIN_COACH_PROMPT = (
    "You are a senior hackathon mentor doing a live check-in with a team mid-hackathon. You will be given the "
    "current roadmap with statuses, current risks, and the team's latest update. Determine which roadmap items "
    "should change status based on the update, identify any new risks or blockers mentioned, and give a short "
    "direct coaching response (2-4 sentences) — be honest about slipping timelines and suggest concrete scope cuts if needed. "
    "Respond ONLY with valid JSON: {updated_roadmap_items: [{id, new_status}], new_risks: [{description, severity}], coaching_response: string}"
)


def _call_claude_messages(system_prompt: str, user_content: str) -> str:
    """Helper to invoke Anthropic Claude SDK with error handling."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or not HAS_ANTHROPIC_SDK:
        raise ValueError("ANTHROPIC_API_KEY missing or anthropic SDK not installed.")

    client = anthropic.Anthropic(api_key=api_key)
    
    # Try calling specified model claude-sonnet-4-6, fallback to claude-3-5-sonnet-20241022 if model name is unrecognized
    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            temperature=0.3,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}]
        )
    except Exception as err:
        # Fallback to alternate Sonnet model if API rejects custom model tag
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            temperature=0.3,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}]
        )
    
    return message.content[0].text.strip()


def _clean_json_text(raw_text: str) -> str:
    """Strips markdown code blocks like ```json ... ```"""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def analyze_concept(idea_text: str) -> Dict[str, Any]:
    """Calls Claude for Concept Analysis with 1 retry on JSON parse failure."""
    user_msg = f"Project Idea: {idea_text}"
    
    for attempt in range(2):
        try:
            if attempt == 1:
                user_msg += "\n\nREMINDER: Respond ONLY with valid JSON matching the exact schema."
            raw = _call_claude_messages(CONCEPT_ANALYSIS_PROMPT, user_msg)
            return json.loads(_clean_json_text(raw))
        except Exception as e:
            if attempt == 1:
                # Return resilient fallback object
                return {
                    "scope_critique": f"The concept for '{idea_text[:30]}' is ambitious for a 24h hackathon. Recommend cutting secondary features to guarantee a core working demo.",
                    "missing_pieces": ["Database Seed Scripts", "API Mock Fallbacks", "Error State Handling UI"],
                    "feasibility_flags": ["Potential third-party API rate limiting", "Unverified production environment setup"]
                }


def generate_roadmap(idea_text: str, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Calls Claude for Roadmap Generation with 1 retry on JSON parse failure."""
    user_msg = f"Project Idea: {idea_text}\nAnalysis: {json.dumps(analysis)}"
    
    for attempt in range(2):
        try:
            if attempt == 1:
                user_msg += "\n\nREMINDER: Respond ONLY with a valid JSON array of 5-9 milestone objects."
            raw = _call_claude_messages(ROADMAP_GENERATION_PROMPT, user_msg)
            items = json.loads(_clean_json_text(raw))
            # Ensure items have status and order
            for idx, item in enumerate(items):
                if "id" not in item:
                    item["id"] = f"m_{idx+1}"
                item["order"] = idx + 1
                item["status"] = "not_started"
            return items
        except Exception as e:
            if attempt == 1:
                # Resilient fallback roadmap
                return [
                    {"id": "m_1", "title": "1. Database Schema & API Setup", "description": "Set up core SQLite database & API routes.", "estimated_hours": 3, "status": "not_started", "order": 1},
                    {"id": "m_2", "title": "2. Primary MVP Interactive UI", "description": "Build dynamic user interactive flow.", "estimated_hours": 5, "status": "not_started", "order": 2},
                    {"id": "m_3", "title": "3. LLM Orchestration & Prompts", "description": "Integrate Claude API calls & parse responses.", "estimated_hours": 4, "status": "not_started", "order": 3},
                    {"id": "m_4", "title": "4. Pre-Flight Demo Verification", "description": "Pre-seed database & verify 1-click happy path.", "estimated_hours": 2, "status": "not_started", "order": 4},
                    {"id": "m_5", "title": "5. Demo Script & Backup Video", "description": "Record 60s backup walkthrough video.", "estimated_hours": 2, "status": "not_started", "order": 5}
                ]


def generate_pitch_outline(idea_text: str, analysis: Dict[str, Any], roadmap: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calls Claude for Pitch Outline Generation with 1 retry on JSON parse failure."""
    user_msg = f"Project Idea: {idea_text}\nAnalysis: {json.dumps(analysis)}\nRoadmap: {json.dumps(roadmap)}"
    
    for attempt in range(2):
        try:
            if attempt == 1:
                user_msg += "\n\nREMINDER: Respond ONLY with valid JSON."
            raw = _call_claude_messages(PITCH_OUTLINE_PROMPT, user_msg)
            return json.loads(_clean_json_text(raw))
        except Exception as e:
            if attempt == 1:
                return {
                    "problem": f"Hackathon teams building '{idea_text[:25]}' waste critical hours on manual scope management and broken setup.",
                    "solution": "An intelligent execution agent that provides automated scope pruning, roadmap milestones, and live coaching.",
                    "demo_flow": [
                        "1. Enter raw project concept in prompt box",
                        "2. Show 1-click Scope Pruning & milestone allocation",
                        "3. Trigger mid-hackathon check-in with live AI advice",
                        "4. Demonstrate Pre-Flight Demo Score & Pitch Outline"
                    ],
                    "impact": "Transforms raw hackathon ideas into polished winning demos in under 24 hours."
                }


def run_checkin_coach(roadmap: List[Dict[str, Any]], risks: List[Dict[str, Any]], update_text: str) -> Dict[str, Any]:
    """Calls Claude for Check-in Coaching with 1 retry on JSON parse failure."""
    user_msg = f"Current Roadmap: {json.dumps(roadmap)}\nCurrent Risks: {json.dumps(risks)}\nLatest Update: {update_text}"
    
    for attempt in range(2):
        try:
            if attempt == 1:
                user_msg += "\n\nREMINDER: Respond ONLY with valid JSON matching {updated_roadmap_items, new_risks, coaching_response}."
            raw = _call_claude_messages(CHECKIN_COACH_PROMPT, user_msg)
            return json.loads(_clean_json_text(raw))
        except Exception as e:
            if attempt == 1:
                return {
                    "updated_roadmap_items": [],
                    "new_risks": [],
                    "coaching_response": "Keep pushing forward! Focus 100% on completing one single happy-path user loop before touching secondary features."
                }
