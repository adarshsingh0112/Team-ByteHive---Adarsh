import http.server
import socketserver
import json
import os
import urllib.request
import urllib.error
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 3000
BASE_DIR = os.path.dirname(__file__)
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'projects_db.json')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)

if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

def load_db():
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_db(data):
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error writing DB: {e}")

def call_openai_api(user_message, system_context, api_key):
    if not api_key or len(api_key) < 15:
        return None
    url = "https://api.openai.com/v1/chat/completions"
    system_prompt = f"You are KrishnaAI, an elite Hackathon Coach and Senior Tech Lead. Help the hackathon team win with direct, practical, encouraging advice. Project context: {system_context}"
    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"OpenAI API call exception: {e}")
        return None

def call_gemini_api(prompt, api_key_override=None):
    api_key = api_key_override or os.environ.get("GEMINI_API_KEY", "")
    if not api_key or len(api_key) < 15:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = raw_text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
    except Exception as e:
        print(f"Gemini API call exception: {e}")
        return None

class KrishnaAIHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        req_path = path.split('?')[0]
        if req_path == '/':
            req_path = '/index.html'
        return os.path.normpath(os.path.join(PUBLIC_DIR, req_path.lstrip('/')))

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/api/projects':
            projects = load_db()
            self.send_json_response(projects)
        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)
        body = {}
        if body_bytes:
            try:
                body = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                pass

        path = self.path.split('?')[0]

        if path in ['/api/analyze', '/api/analyze-project']:
            self.handle_analyze(body)
        elif path in ['/api/chat', '/api/coach-chat']:
            self.handle_chat(body)
        elif path in ['/api/pitch', '/api/generate-pitch']:
            self.handle_pitch(body)
        elif path in ['/api/judge', '/api/audit-pitch-deck']:
            self.handle_judge(body)
        elif path == '/api/export':
            self.handle_export(body)
        elif path == '/api/projects':
            self.handle_save_project(body)
        else:
            self.send_error(404, "Endpoint Not Found")

    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def handle_analyze(self, body):
        idea = body.get('idea', 'Hackathon Idea')
        stack = body.get('stack', 'Next.js, Supabase')
        team = body.get('team', '3 Developers')
        time_limit = body.get('time', '24 Hours')
        api_key = body.get('apiKey', '')

        prompt = f"""
        Act as an elite Hackathon Coach and Head Judge.
        Execute full production readiness evaluation for:
        Idea: "{idea}", Stack: "{stack}", Team: "{team}", Time: "{time_limit}"

        RETURN EXACTLY THIS JSON STRUCTURE:
        {{
          "winProbability": 89,
          "critiqueText": "Direct scope critique. Highlight bloat features.",
          "sprintPlan": [
            {{ "phase": "Sprint 1 (Hr 0-4)", "title": "Core DB & API Setup", "desc": "Setup database models and backend routes.", "assignee": "Backend Lead", "slipping": false, "isFat": false, "priority": "HIGH" }},
            {{ "phase": "Sprint 2 (Hr 4-12)", "title": "Frontend MVP Core Flow", "desc": "Build primary user interactive views.", "assignee": "Frontend Lead", "slipping": false, "isFat": false, "priority": "HIGH" }},
            {{ "phase": "Sprint 3 (Hr 12-18)", "title": "Complex Real-Time Analytics", "desc": "Secondary bloat features.", "assignee": "Fullstack Dev", "slipping": true, "isFat": true, "priority": "LOW" }},
            {{ "phase": "Sprint 4 (Hr 18-24)", "title": "Demo & Pitch Preparation", "desc": "Pre-seed sample data & record 60s backup video.", "assignee": "Pitch Lead", "slipping": false, "isFat": false, "priority": "HIGH" }}
          ],
          "risks": [
            {{ "title": "API Latency & Auth Blocker", "desc": "Frontend waiting on complex user authentication.", "action": "> COACH INTERVENTION: Hardcode 1-click Guest Demo mode.", "isSlipping": true }},
            {{ "title": "Deployment Cold Start Failure", "desc": "Production environment variables missing.", "action": "> COACH INTERVENTION: Deploy early to Vercel/Render at hour 4.", "isSlipping": false }}
          ],
          "recoveryPlan": {{
            "headline": "Emergency Scope Cut & Pivot Protocol",
            "steps": [
              "Drop custom auth — use pre-authenticated guest user context.",
              "Freeze CSS updates at Hour 18 — focus exclusively on happy path demo loop.",
              "Pre-render static fallback charts in case live API hits rate limits."
            ]
          }},
          "architecture": {{
            "score": 8.8,
            "feedback": "Strong stack. DB connection pooling required to prevent cold-start latency.",
            "missing": ["Database Seed Script", "Graceful API Error Fallback UI"]
          }},
          "demoReadiness": {{
            "score": 8.7,
            "checklist": [
              "Database pre-seeded with 10+ realistic records?",
              "60-second backup demo video recorded & saved locally?",
              "1-click Guest Demo login enabled without password prompt?",
              "Error handling verified under simulated poor network conditions?"
            ]
          }},
          "judgeSimulation": {{
            "overallScore": "8.9/10",
            "feedback": "Judges will love the immediate problem-solution fit if live demo runs without hitch.",
            "sampleQuestions": [
              {{ "q": "How does your system handle offline or API rate limiting during live pitch?", "a": "We have an embedded local fallback engine that serves pre-computed JSON snapshots instantly." }},
              {{ "q": "What is your secret technical edge over existing tools?", "a": "Our multi-agent orchestration pipeline prioritizes scope pruning in real-time." }}
            ]
          }}
        }}
        """
        ai_res = call_gemini_api(prompt, api_key)
        if not ai_res:
            short_topic = idea[:30] if idea else "Project"
            main_tech = stack.split(',')[0].strip() if stack else "React"
            ai_res = {
                "winProbability": 87,
                "critiqueText": f"Building complex auth & custom dashboards for <b>{short_topic}</b> with <b>{stack}</b> in <b>{time_limit}</b> will burn time. <b>Cut bloat features immediately!</b> Focus 100% on the core interactive loop.",
                "sprintPlan": [
                    { "phase": "Sprint 1 (Hr 0-4)", "title": "Core DB & API Setup", "desc": f"Setup backend services using {main_tech}.", "assignee": "Backend Lead", "slipping": False, "isFat": False, "priority": "HIGH" },
                    { "phase": "Sprint 2 (Hr 4-12)", "title": "Primary User Flow UI", "desc": f"Build dynamic UI views for {short_topic}.", "assignee": "Frontend Lead", "slipping": False, "isFat": False, "priority": "HIGH" },
                    { "phase": "Sprint 3 (Hr 12-18)", "title": "Custom Analytics & Reporting", "desc": "Secondary reporting tab.", "assignee": "Unassigned", "slipping": True, "isFat": True, "priority": "LOW" },
                    { "phase": "Sprint 4 (Hr 18-24)", "title": "Demo Script & Backup Video", "desc": "Record 60s backup walkthrough video & seed database.", "assignee": "Pitch Lead", "slipping": False, "isFat": False, "priority": "HIGH" }
                ],
                "risks": [
                    { "title": "API Delay & Mocking Blocker", "desc": "Frontend waiting on real backend endpoints.", "action": "> COACH INTERVENTION: Implement mock JSON responses directly in frontend service.", "isSlipping": True },
                    { "title": "Deployment Cold Start Failure", "desc": "Host environment variables unconfigured.", "action": "> COACH INTERVENTION: Deploy early to Vercel/Render at Hour 4 to test CORS.", "isSlipping": False }
                ],
                "recoveryPlan": {
                    "headline": "Emergency Scope Cut & Pivot Protocol",
                    "steps": [
                        "Drop custom auth — use hardcoded guest user context.",
                        "Freeze UI tweaks at Hour 18 — verify 1-click happy path demo flow.",
                        "Save pre-computed JSON snapshots locally in case live APIs timeout."
                    ]
                },
                "architecture": {
                    "score": 8.7,
                    "feedback": f"Strong technical stack with {main_tech}. Ensure DB is pre-seeded with sample data.",
                    "missing": ["Database Seed Script", "Fallback Error State UI"]
                },
                "demoReadiness": {
                    "score": 8.7,
                    "checklist": [
                        "Database pre-seeded with sample records?",
                        "60-second backup walkthrough video saved locally?",
                        "1-click Guest Demo Mode enabled without auth prompt?",
                        "Live API error handling displays friendly fallback state?"
                    ]
                },
                "judgeSimulation": {
                    "overallScore": "8.8/10",
                    "feedback": "Judges will praise solving a real pain point if live demo delivers instantaneous visual impact.",
                    "sampleQuestions": [
                        { "q": "How does your system handle offline network failures during live demo?", "a": "Our application uses an embedded local fallback engine that serves pre-cached data instantly." },
                        { "q": "Why is this team capable of taking this product further?", "a": "We established modular separation between core API logic and presentation layers." }
                    ]
                }
            }

        db_data = load_db()
        new_project = {
            "id": f"proj_{len(db_data) + 1}",
            "idea": idea,
            "stack": stack,
            "team": team,
            "time": time_limit,
            "winProbability": ai_res.get("winProbability", 87),
            "timestamp": "Just now",
            "data": ai_res
        }
        db_data.insert(0, new_project)
        save_db(db_data)

        self.send_json_response(ai_res)

    def handle_chat(self, body):
        message = body.get('message', '')
        context = body.get('context', '')
        user_key = body.get('apiKey', '') or body.get('openAiKey', '')
        
        openai_key = os.environ.get("OPENAI_API_KEY", "") or (user_key if user_key.startswith("sk-") else "")

        # 1. Primary Priority: Try OpenAI API directly if OpenAI Key is available
        if openai_key:
            openai_reply = call_openai_api(message, context, openai_key)
            if openai_reply:
                return self.send_json_response({"reply": openai_reply, "source": "OpenAI ChatGPT"})

        # 2. Secondary Priority: Try Gemini API if Gemini Key is available
        gemini_key = user_key if not user_key.startswith("sk-") else os.environ.get("GEMINI_API_KEY", "")
        if gemini_key:
            prompt = f"You are KrishnaAI, an elite Hackathon Coach. Project context: {context}. User question: {message}. Give brief, practical advice with markdown."
            gemini_res = call_gemini_api(prompt, gemini_key)
            if gemini_res and isinstance(gemini_res, dict) and "reply" in gemini_res:
                return self.send_json_response({"reply": gemini_res["reply"], "source": "Gemini AI"})

        # 3. Fallback Engine
        lower = message.lower()
        if 'auth' in lower or 'login' in lower:
            reply = "💡 **Coach Advice**: Skip full OAuth/JWT for now! Hardcode a `guest-demo` button in the UI that loads pre-seeded state. Spending 3 hours fixing CORS/Auth tokens during a hackathon is a classic trap."
        elif 'pitch' in lower or 'deck' in lower or 'present' in lower:
            reply = "🎤 **Coach Advice**: Start your presentation with a 15-second story hook. Do NOT explain database setup first. Show the working product in the first 45 seconds!"
        elif 'api' in lower or 'backend' in lower or 'slow' in lower:
            reply = "⚡ **Coach Advice**: If your backend is slow or hitting rate limits, create a local `mock-data.json` fallback in your frontend API client. Never let a live demo fail due to network hiccups."
        else:
            reply = "🚀 **Coach Advice**: Focus on completing one single 'happy path' loop from end to end. A working 1-feature MVP beats a broken 5-feature system 100% of the time in hackathon judging!"

        self.send_json_response({"reply": reply, "source": "Smart Engine"})

    def handle_pitch(self, body):
        idea = body.get('idea', 'Project')
        stack = body.get('stack', 'Tech Stack')
        api_key = body.get('apiKey', '')

        prompt = f"""
        Act as a Y Combinator Pitch Coach.
        Create a 5-Slide Pitch Script for: "{idea}" built with "{stack}".
        RETURN EXACTLY THIS JSON:
        {{
          "slides": [
            {{ "num": 1, "title": "Slide 1: Hook & Pain Point", "script": "Direct 15-second opening hook stating the exact problem." }},
            {{ "num": 2, "title": "Slide 2: Solution & Value Prop", "script": "Clear value proposition explaining how your app solves it." }},
            {{ "num": 3, "title": "Slide 3: Technical Architecture", "script": "Brief technical breakdown of {stack}." }},
            {{ "num": 4, "title": "Slide 4: Live Demo Focus", "script": "Step-by-step guide on what to demonstrate live." }},
            {{ "num": 5, "title": "Slide 5: Future Horizon & Impact", "script": "Closing statement on scalability and impact." }}
          ]
        }}
        """
        ai_res = call_gemini_api(prompt, api_key)
        if not ai_res:
            ai_res = {
                "slides": [
                    { "num": 1, "title": "Slide 1: Hook & Pain Point", "script": f"Every team building {idea[:30]} faces massive friction. We waste hours on manual overhead." },
                    { "num": 2, "title": "Slide 2: Solution & Value Prop", "script": f"Introducing our platform: an intelligent engine that automates decisions using {stack}." },
                    { "num": 3, "title": "Slide 3: System Architecture", "script": f"Powered by {stack}. Designed for low-latency API execution with resilient fallback engines." },
                    { "num": 4, "title": "Slide 4: Live Demo Flow", "script": "Start directly in active execution workspace. Demonstrate 1-click action and instant analysis." },
                    { "num": 5, "title": "Slide 5: Future Horizon & Impact", "script": "From hackathon MVP to production scale — our modular design allows seamless expansion." }
                ]
            }
        self.send_json_response(ai_res)

    def handle_judge(self, body):
        deck_text = body.get('deckText', '')
        api_key = body.get('apiKey', '')
        prompt = f"""
        Act as a Hackathon Judge reviewing pitch deck text: "{deck_text}"
        RETURN EXACTLY THIS JSON:
        {{
          "storyScore": "8.5",
          "critiques": [
            {{ "type": "red", "title": "🔴 Paragraph Overload", "desc": "Reduce paragraph lengths into bullet points." }},
            {{ "type": "orange", "title": "⚠️ Missing Architecture Diagram", "desc": "Add a visual architecture flowchart." }},
            {{ "type": "green", "title": "🟢 Clear Problem Statement", "desc": "Target pain point is clearly identified." }}
          ]
        }}
        """
        ai_res = call_gemini_api(prompt, api_key)
        if not ai_res:
            ai_res = {
                "storyScore": "8.5",
                "critiques": [
                    { "type": "red", "title": "🔴 Paragraph Overload", "desc": "Slide 2 contains too much prose. Convert long sentences into 3 punchy bullet points." },
                    { "type": "orange", "title": "⚠️ Missing Tech Stack Callout", "desc": "Be explicit about why your backend architecture solves latency or scaling challenges." },
                    { "type": "green", "title": "🟢 Strong Demo Hook", "desc": "Your planned demo flow focuses straight on core value proposition without setup fluff." }
                ]
            }
        self.send_json_response(ai_res)

    def handle_export(self, body):
        self.send_json_response({
            "status": "success",
            "exportUrl": "/api/export",
            "summary": "Report exported cleanly."
        })

    def handle_save_project(self, body):
        db_data = load_db()
        db_data.insert(0, body)
        save_db(db_data)
        self.send_json_response({"status": "saved", "id": body.get("id")})

print("====================================================")
print(f"KrishnaAI Hackathon Coach Server on port {PORT}")
print(f"Open http://localhost:{PORT} in your web browser")
print("====================================================")

with socketserver.TCPServer(("", PORT), KrishnaAIHandler) as httpd:
    httpd.serve_forever()
