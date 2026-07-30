// ============================================================================
// KRISHNA AI — CLIENT API & RESILIENCE FALLBACK ENGINE (VERSION B)
// ============================================================================

function calculateLocalWinProb(idea, stack, team, time) {
  let score = 75;
  const ideaLen = (idea || '').length;
  if (ideaLen > 100) score += 8;
  else if (ideaLen > 40) score += 4;

  const stackLower = (stack || '').toLowerCase();
  if (stackLower.includes('supabase') || stackLower.includes('express') || stackLower.includes('vercel') || stackLower.includes('next')) {
    score += 6;
  }

  const teamLower = (team || '').toLowerCase();
  if (teamLower.includes('3') || teamLower.includes('2')) score += 4;

  const timeLower = (time || '').toLowerCase();
  if (timeLower.includes('24')) score += 3;

  return Math.min(96, Math.max(68, score));
}

function generateLocalMissionData(idea, stack, team, time) {
  const winOdds = calculateLocalWinProb(idea, stack, team, time);
  const mainTech = (stack || 'React, Express').split(',')[0].trim();
  const shortIdea = (idea || 'Hackathon Project').substring(0, 35);
  const tableName = shortIdea.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);

  return {
    winOdds: winOdds,
    scoreLabel: `${winOdds}%`,
    missionDna: {
      buildability: Math.min(98, winOdds + 2),
      wow: Math.min(96, winOdds + 4),
      resilience: Math.min(94, winOdds - 1)
    },
    critique: `Building authentication & custom multi-tenant analytics for <b>${shortIdea}</b> in <b>${time || '24h'}</b> will burn critical demo prep time. <b>Cut bloat features immediately!</b> Focus 100% on the core interactive loop.`,
    scopeReview: { status: "Scope Pruned & MVP Ready", reason: `Pruned secondary administrative screens to protect primary ${mainTech} MVP build.` },
    architecture: {
      frontend: mainTech,
      backend: "Node.js Express",
      database: "Supabase PostgreSQL",
      mermaid: `graph TD\n  Client[User Browser UI] -->|API Request| Express[Express Node.js Server]\n  Express -->|Query| DB[(Supabase PostgreSQL)]\n  Express -->|LLM Prompt| AI[Claude 3.5 / Gemini Engine]\n  AI -->|Structured JSON| Express\n  Express -->|Real-time Sync| Client`,
      sql: `-- PostgreSQL Schema for ${shortIdea}\nCREATE TABLE ${tableName}_projects (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  title VARCHAR(255) NOT NULL,\n  tech_stack TEXT[],\n  win_probability INT DEFAULT ${winOdds},\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX idx_${tableName}_created ON ${tableName}_projects(created_at DESC);`
    },
    demoFlow: [
      "1. Open active workspace directly in guest mode (0s - 15s)",
      "2. Enter raw project idea and trigger 12-step pipeline (15s - 90s)",
      "3. Demonstrate 1-click scope cut and 5-judge simulation panel (90s - 180s)"
    ],
    sprints: [
      { phase: "Sprint 1 (Hr 0-4)", title: "Core DB Schema & Server Setup", assignee: "Backend Lead", priority: "HIGH" },
      { phase: "Sprint 2 (Hr 4-12)", title: `Interactive UI for ${shortIdea}`, assignee: "Frontend Lead", priority: "HIGH" },
      { phase: "Sprint 3 (Hr 12-18)", title: "Core AI Engine Integration", assignee: "AI Lead", priority: "HIGH" },
      { phase: "Sprint 4 (Hr 18-24)", title: "Demo Script & Pre-Flight Verification", assignee: "Pitch Lead", priority: "HIGH" }
    ],
    risks: [
      { title: "API Delay & Mocking Blocker", desc: "Frontend waiting on real backend endpoints.", action: "> COACH INTERVENTION: Implement mock JSON responses directly in frontend service.", isSlipping: true },
      { title: "Deployment Cold Start Failure", desc: "Host environment variables unconfigured.", action: "> COACH INTERVENTION: Deploy early to Vercel at Hour 4 to test CORS.", isSlipping: false }
    ]
  };
}

async function apiAnalyzeProject(payload) {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn("Backend API offline, utilizing client-side fallback engine:", e);
  }

  // Resilient Client-Side Fallback
  return generateLocalMissionData(payload.idea, payload.stack, payload.team, payload.time);
}

async function apiSimulate5Judges(payload) {
  try {
    const res = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Judge API offline, using local simulation:", e);
  }

  const win = calculateLocalWinProb(payload.problem_statement || payload.project_name, payload.tech_stack, "3", "24");
  return {
    technical_judge: { score: Math.min(98, win + 2), strengths: ["Low latency architecture", "Clean code modularity"], weaknesses: ["Needs DB connection pooling"] },
    innovation_judge: { score: Math.min(96, win + 4), strengths: ["Novel AI agent orchestration"], weaknesses: ["Niche target market size"] },
    business_judge: { score: Math.max(65, win - 3), strengths: ["Clear Freemium event tier"], weaknesses: ["High user acquisition cost"] },
    uiux_judge: { score: Math.min(99, win + 5), strengths: ["Glassmorphic dark aesthetic", "Instant feedback"], weaknesses: ["Mobile navbar padding"] },
    presentation_judge: { score: win, strengths: ["Strong elevator pitch hook"], weaknesses: ["Pacing during live demo"] },
    head_judge: {
      overall_score: (win * 0.98).toFixed(1),
      winning_probability: win,
      one_line_verdict: `High impact project with ${win}% predicted win chance if core demo stays tight.`,
      project_status: "Top Contender",
      mission_status: "PROCEED TO PITCH"
    }
  };
}

async function apiGeneratePitch(payload) {
  try {
    const res = await fetch('/api/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Pitch API offline, using local fallback generator:", e);
  }

  const idea = payload.idea || 'Project';
  const stack = payload.stack || 'Tech Stack';
  return {
    slides: [
      { num: 1, title: "Slide 1: Hook & Pain Point", script: `Every team building ${idea.substring(0, 30)} faces massive friction. We waste hours on manual overhead instead of executing.` },
      { num: 2, title: "Slide 2: Solution & Value Prop", script: `Introducing our platform: an intelligent engine that automates complex decisions in real time using ${stack}.` },
      { num: 3, title: "Slide 3: System Architecture", script: `Powered by ${stack}. Designed for low-latency API execution with resilient fallback engines.` },
      { num: 4, title: "Slide 4: Live Demo Flow", script: "Start directly in the active execution workspace. Show 1-click action, instant analysis, and dynamic output." },
      { num: 5, title: "Slide 5: Future Horizon & Wrap", script: "From hackathon MVP to production scale — our modular design allows seamless expansion to enterprise workflows." }
    ]
  };
}

async function apiCoachChat(message, context) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });
    if (res.ok) return await res.json();
  } catch (e) {}

  return {
    reply: `🤖 **Krishna AI Local Strategy for "${message.substring(0, 35)}..."**:\n\n• **Scope Focus**: Cut non-essential bloat features immediately.\n• **Pitch Hook**: Show the working live demo within the first 45 seconds.\n• **Resilience**: Pre-seed guest demo data so network issues don't ruin your judge presentation.`,
    aiSource: "Krishna Local AI Engine"
  };
}

async function apiFetchSavedProjects() {
  try {
    const res = await fetch('/api/projects');
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}
