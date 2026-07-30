import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"

def post(endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    payload = json.dumps(data).encode("utf-8") if data else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

print("=" * 70)
print("HACKATHON JUDGE OUTPUT EVALUATION REPORT")
print("=" * 70)

# Step 1: Submit Raw Idea & Concept Analysis
idea = "An AI-powered Crowdfunding platform with automated milestone verification using smart contracts and AI document scanning."
print(f"\n1. RAW PROJECT IDEA SUBMITTED:\n\"{idea}\"")

proj = post("/project/create", {"idea_text": idea})
proj_id = proj["id"]
analysis = proj["analysis"]

print("\n--- JUDGE OUTPUT 1: CONCEPT ANALYSIS & SCOPE CRITIQUE ---")
print(f"* Scope Critique: {analysis.get('scope_critique')}")
print("* Missing Technical Pieces:")
for item in analysis.get("missing_pieces", []):
    print(f"  - {item}")
print("* Feasibility Risks:")
for flag in analysis.get("feasibility_flags", []):
    print(f"  - {flag}")

# Step 2: Generate 24-Hour Build Roadmap
roadmap = post(f"/project/{proj_id}/roadmap")
print("\n--- JUDGE OUTPUT 2: 24-HOUR BUILD ROADMAP (5-9 MILESTONES) ---")
for m in roadmap:
    print(f"[{m.get('order')}] {m.get('title')} ({m.get('estimated_hours')}h) -> Status: {m.get('status')}")
    print(f"    Desc: {m.get('description')}")

# Step 3: Generate Pitch Outline
pitch = post(f"/project/{proj_id}/pitch")
print("\n--- JUDGE OUTPUT 3: 3-5 MINUTE PITCH OUTLINE ---")
print(f"* Problem: {pitch.get('problem')}")
print(f"* Solution: {pitch.get('solution')}")
print("* Demo Flow Steps:")
for step in pitch.get("demo_flow", []):
    print(f"  {step}")
print(f"* Impact: {pitch.get('impact')}")

# Step 4: Mid-Hackathon Live Check-in
update = "Completed milestone 1 & 2 (database and API). But we are facing CORS issues on frontend deployment."
print(f"\n4. MID-HACKATHON TEAM CHECK-IN UPDATE:\n\"{update}\"")
checkin = post(f"/project/{proj_id}/checkin", {"update_text": update})

print("\n--- JUDGE OUTPUT 4: AI COACH RESPONSE & NEW RISKS ---")
print(f"* Coach Guidance: {checkin.get('coaching_response')}")

# Step 5: Computed Health & Demo Readiness Summary
health = get(f"/project/{proj_id}/health")
print("\n--- JUDGE OUTPUT 5: COMPUTED DEMO READINESS HEALTH SUMMARY ---")
print(f"* Completion Rate: {health.get('percent_complete')}%")
print(f"* Blocked Milestones: {health.get('blocked_count')}")
print(f"* Unresolved High Risks: {health.get('high_risk_count')}")
print(f"* Overall On-Track Status: {'ON TRACK FOR WINNING DEMO' if health.get('on_track') else 'RISKS DETECTED'}")

print("\n" + "=" * 70)
print("FULL END-TO-END JUDGE OUTPUT EVALUATION COMPLETE!")
print("=" * 70)
