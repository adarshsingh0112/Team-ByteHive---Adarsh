// ============================================================================
// KRISHNA AI — HACKATHON COMMAND CENTER SERVER (VERSION B)
// ============================================================================

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let savedProjects = [
  {
    id: "proj_default_1",
    idea: "KrishnaAI — Hackathon Command Center OS",
    stack: "Next.js, Supabase, Express, Vercel",
    winProbability: 92,
    data: {
      winOdds: 92,
      scoreLabel: "92%",
      missionDna: { buildability: 94, wow: 95, resilience: 90 },
      critique: "Cut secondary multi-tenant admin dashboards to focus 100% on core station navigation.",
      scopeReview: { status: "Scope Pruned & MVP Ready", reason: "Focusing on 5 core station workflows." },
      architecture: { frontend: "Next.js", backend: "Express TypeScript", database: "Supabase PostgreSQL" },
      demoFlow: ["1. Open active workspace in guest mode", "2. Execute intake analysis", "3. Show 5-judge simulation panel"],
      sprints: [
        { phase: "Sprint 1", title: "Core DB & Server", assignee: "Backend Lead" },
        { phase: "Sprint 2", title: "5-Station UI Shell", assignee: "Frontend Lead" }
      ],
      risks: [
        { title: "Network Latency", desc: "API response delay", action: "> COACH: Hardcode local fallback engines." }
      ]
    }
  }
];

function calculateWinProb(idea, stack, team, time) {
  let score = 75;
  const ideaStr = String(idea || '');
  if (ideaStr.length > 100) score += 8;
  else if (ideaStr.length > 40) score += 4;

  const stackLower = String(stack || '').toLowerCase();
  if (stackLower.includes('supabase') || stackLower.includes('express') || stackLower.includes('vercel') || stackLower.includes('next')) {
    score += 6;
  }
  return Math.min(96, Math.max(68, score));
}

// 1. POST /api/analyze Endpoint
const analyzeHandler = async (req, res) => {
  const rawIdea = req.body.idea;
  const idea = typeof rawIdea === 'string' ? rawIdea : (rawIdea && rawIdea.idea ? String(rawIdea.idea) : String(rawIdea || ''));
  const rawStack = req.body.stack;
  const stack = typeof rawStack === 'string' ? rawStack : String(rawStack || '');
  const { team, time } = req.body;

  const winOdds = calculateWinProb(idea, stack, team, time);
  const mainTech = (stack || 'React, Express').split(',')[0].trim();
  const shortIdea = idea.substring(0, 35);
  const tableName = shortIdea.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);

  const responseData = {
    winOdds: winOdds,
    winning_probability: winOdds,
    scoreLabel: `${winOdds}%`,
    missionDna: {
      buildability: Math.min(98, winOdds + 2),
      wow: Math.min(96, winOdds + 4),
      resilience: Math.min(94, winOdds - 1)
    },
    critique: `Building auth & custom analytics for <b>${shortIdea}</b> with <b>${stack || 'your stack'}</b> in <b>${time || '24h'}</b> will burn critical demo prep time. <b>Cut bloat features immediately!</b> Focus 100% on the core interactive loop.`,
    scopeReview: { status: "Scope Pruned & MVP Ready", reason: `Pruned secondary tabs to protect primary ${mainTech} build.` },
    architecture: {
      frontend: mainTech,
      backend: "Node.js Express",
      database: "Supabase PostgreSQL",
      mermaid: `graph TD\n  Client[User Browser UI] -->|API Request| Express[Express Node.js Server]\n  Express -->|Query| DB[(Supabase PostgreSQL)]\n  Express -->|LLM Prompt| AI[Claude 3.5 / Gemini Engine]\n  AI -->|Structured JSON| Express\n  Express -->|Real-time Sync| Client`,
      sql: `-- PostgreSQL Schema for ${shortIdea}\nCREATE TABLE ${tableName}_projects (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  title VARCHAR(255) NOT NULL,\n  tech_stack TEXT[],\n  win_probability INT DEFAULT ${winOdds},\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`
    },
    demoFlow: [
      "1. Open active workspace directly in guest mode (0s - 15s)",
      "2. Enter raw project idea and trigger 12-step pipeline (15s - 90s)",
      "3. Show 5-judge simulation panel (90s - 180s)"
    ],
    sprints: [
      { phase: "Sprint 1 (Hr 0-4)", title: "Core DB Schema & Server Setup", assignee: "Backend Lead" },
      { phase: "Sprint 2 (Hr 4-12)", title: `Interactive UI for ${shortIdea}`, assignee: "Frontend Lead" },
      { phase: "Sprint 3 (Hr 12-18)", title: "Core AI Engine Integration", assignee: "AI Lead" },
      { phase: "Sprint 4 (Hr 18-24)", title: "Demo Script & Pre-Flight Verification", assignee: "Pitch Lead" }
    ],
    risks: [
      { title: "API Delay & Mocking Blocker", desc: "Frontend waiting on real backend endpoints.", action: "> COACH: Implement mock JSON responses directly in frontend service.", isSlipping: true },
      { title: "Deployment Cold Start Failure", desc: "Host environment variables unconfigured.", action: "> COACH: Deploy early to Vercel at Hour 4 to test CORS.", isSlipping: false }
    ]
  };

  savedProjects.unshift({
    id: `proj_${Date.now()}`,
    idea: idea,
    stack: stack,
    winProbability: winOdds,
    data: responseData
  });

  res.json(responseData);
};

app.post('/api/analyze', analyzeHandler);
app.post('/api/analyze-project', analyzeHandler);

// 2. POST /api/judge Endpoint
const judgeHandler = async (req, res) => {
  const { project_name, problem_statement, tech_stack } = req.body;
  const idea = problem_statement || project_name || 'Hackathon Project';
  const win = calculateWinProb(idea, tech_stack, "3", "24");

  res.json({
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
  });
};

app.post('/api/judge', judgeHandler);
app.post('/api/audit-pitch-deck', judgeHandler);

// 3. POST /api/pitch Endpoint
const pitchHandler = async (req, res) => {
  const { idea, stack } = req.body;
  const ideaStr = String(idea || 'Project');
  const stackStr = String(stack || 'Tech Stack');

  res.json({
    slides: [
      { num: 1, title: "Slide 1: Hook & Pain Point", script: `Every team building ${ideaStr.substring(0, 30)} faces massive friction. We waste hours on manual overhead instead of executing.` },
      { num: 2, title: "Slide 2: Solution & Value Prop", script: `Introducing our platform: an intelligent engine that automates complex decisions in real time using ${stackStr}.` },
      { num: 3, title: "Slide 3: System Architecture", script: `Powered by ${stackStr}. Designed for low-latency API execution with resilient fallback engines.` },
      { num: 4, title: "Slide 4: Live Demo Flow", script: "Start directly in the active execution workspace. Show 1-click action, instant analysis, and dynamic output." },
      { num: 5, title: "Slide 5: Future Horizon & Wrap", script: "From hackathon MVP to production scale — our modular design allows seamless expansion to enterprise workflows." }
    ]
  });
};

app.post('/api/pitch', pitchHandler);
app.post('/api/generate-pitch', pitchHandler);

// 4. POST /api/chat Endpoint
const chatHandler = async (req, res) => {
  const { message } = req.body;
  const msgStr = String(message || '');

  res.json({
    reply: `🤖 **Krishna AI Strategy for "${msgStr.substring(0, 35)}..."**:\n\n• **Scope Focus**: Cut non-essential bloat features immediately and focus 100% on your core demo flow.\n• **Pitch Hook**: Open your presentation with the primary pain point in the first 15 seconds.\n• **Demo Resilience**: Pre-seed guest demo data so network issues don't interrupt your judge presentation.`,
    aiSource: "Krishna AI Engine"
  });
};

app.post('/api/chat', chatHandler);
app.post('/api/coach-chat', chatHandler);

// 5. GET/POST /api/projects Endpoint
app.get('/api/projects', (req, res) => {
  res.json(savedProjects);
});

app.post('/api/projects', (req, res) => {
  if (req.body) savedProjects.unshift(req.body);
  res.json({ status: "ok", count: savedProjects.length });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 KrishnaAI Hackathon Command Center Server running on port ${PORT}`);
    console.log(`👉 Open http://localhost:${PORT} in your web browser`);
    console.log(`====================================================`);
  });
}

module.exports = app;
