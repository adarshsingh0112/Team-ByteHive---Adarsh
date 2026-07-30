const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory projects storage
let savedProjects = [];

// Dynamic Win Probability Calculator
function calculateDynamicWinProb(idea, stack, team, time) {
  let score = 78;
  const ideaLen = (idea || '').length;
  if (ideaLen > 20) score += 4;
  if (ideaLen > 120) score += 3;

  const techCount = (stack || '').split(',').filter(Boolean).length;
  if (techCount >= 3) score += 3;
  if (techCount > 6) score -= 6; // Too complex tech stack penalty

  if ((team || '').includes('Solo')) score -= 4;
  if ((team || '').includes('4+')) score += 3;

  if ((time || '').includes('48')) score += 4;
  if ((time || '').includes('24')) score -= 3;

  // Deterministic seed hash
  let hash = 0;
  for (let i = 0; i < ideaLen; i++) {
    hash = (hash << 5) - hash + (idea || '').charCodeAt(i);
    hash |= 0;
  }
  score += Math.abs(hash % 11) - 5;

  return Math.min(97, Math.max(58, score));
}

// Helper for calling Gemini REST API with fallback engine
async function callGeminiAPI(prompt, apiKeyOverride) {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 15) {
    return null; // Triggers fallback
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;
    return JSON.parse(rawText.replace(/```json|```/g, '').trim());
  } catch (err) {
    console.error("Gemini API call failed, falling back:", err.message);
    return null;
  }
}

// Handler for Deep Project Analysis
const analyzeHandler = async (req, res) => {
  const { idea, stack, team, time, apiKey } = req.body;
  const winProb = calculateDynamicWinProb(idea, stack, team, time);

  const prompt = `
    Act as an elite Hackathon Coach and Head Judge.
    Analyze this project proposal:
    Idea: "${idea}"
    Tech Stack: "${stack}"
    Team Size: "${team}"
    Hackathon Time Limit: "${time}"

    RETURN EXACTLY THIS JSON STRUCTURE:
    {
      "winning_probability": ${winProb},
      "confidence_score": 90,
      "critiqueText": "Direct, honest scope critique for ${idea.substring(0, 30)}. Highlight feature bloat to cut.",
      "scope_review": { "status": "Scope Pruned & MVP Ready", "reason": "Cut secondary features to guarantee a working demo." },
      "sprint_plan": [
        { "phase": "Sprint 1 (Hr 0-4)", "title": "Core DB Schema & Server Setup", "assignee": "Backend Lead", "priority": "HIGH" },
        { "phase": "Sprint 2 (Hr 4-12)", "title": "Interactive Dashboard & Primary Flow", "assignee": "Frontend Lead", "priority": "HIGH" },
        { "phase": "Sprint 3 (Hr 12-18)", "title": "Gemini AI Pipeline Orchestration", "assignee": "AI Engineer", "priority": "HIGH" },
        { "phase": "Sprint 4 (Hr 18-24)", "title": "Demo Script & Pre-Flight Verification", "assignee": "Pitch Lead", "priority": "HIGH" }
      ],
      "risks": [
        { "title": "Network Latency & Auth Blocker", "desc": "Probability: Medium | Impact: High", "action": "> COACH INTERVENTION: Hardcode 1-click Guest Demo mode." }
      ],
      "architecture": { "frontend": "${(stack || 'React').split(',')[0]}", "backend": "Node.js Express", "database": "Supabase PostgreSQL" },
      "elevator_pitch": "Strategy hook for ${idea.substring(0, 40)}.",
      "demo_flow": ["1. Open active workspace in guest mode", "2. Execute core feature", "3. Show judge panel"],
      "backup_demo_plan": ["Pre-recorded 60s HD video walkthrough"],
      "revenue_model": ["Freemium individual access", "Enterprise tier ($499/event)"]
    }
  `;

  const aiResult = await callGeminiAPI(prompt, apiKey);

  if (aiResult) {
    if (!aiResult.winning_probability) aiResult.winning_probability = winProb;
    return res.json(aiResult);
  }

  // Smart Dynamic Fallback Generator tailored to user input
  const mainTech = (stack || 'React, Node').split(',')[0].trim();
  const shortIdea = (idea || 'Hackathon Project').substring(0, 35);

  const fallbackData = {
    winning_probability: winProb,
    confidence_score: 91,
    critiqueText: `Building auth & custom analytics for <b>${shortIdea}</b> with <b>${stack || 'your stack'}</b> in <b>${time || '24h'}</b> will burn critical demo prep time. <b>Cut bloat features immediately!</b> Focus 100% on the core interactive loop.`,
    scope_review: { status: "Scope Pruned & MVP Ready", reason: `Pruned secondary tabs to protect primary ${mainTech} build.` },
    sprint_plan: [
      { phase: "Sprint 1 (Hr 0-4)", title: "Core DB Schema & Server Setup", assignee: "Backend Lead", priority: "HIGH" },
      { phase: "Sprint 2 (Hr 4-12)", title: `Interactive UI for ${shortIdea}`, assignee: "Frontend Lead", priority: "HIGH" },
      { phase: "Sprint 3 (Hr 12-18)", title: "Core Engine Integration", assignee: "AI Lead", priority: "HIGH" },
      { phase: "Sprint 4 (Hr 18-24)", title: "Demo Script & Pre-Flight Verification", assignee: "Pitch Lead", priority: "HIGH" }
    ],
    risks: [
      { title: "API Delay & Mocking Blocker", desc: "Frontend waiting on real backend endpoints.", action: "> COACH: Implement mock JSON responses directly in frontend service.", isSlipping: true },
      { title: "Deployment Cold Start Failure", desc: "Host environment variables unconfigured.", action: "> COACH: Deploy early to Vercel at Hour 4 to test CORS.", isSlipping: false }
    ],
    architecture: {
      frontend: mainTech,
      backend: "Node.js Express",
      database: "Supabase PostgreSQL"
    },
    elevator_pitch: `Introducing ${shortIdea}: an intelligent engine powered by ${mainTech} that solves core workflow bottlenecks in real time.`,
    demo_flow: ["1. Open active workspace directly in guest mode", "2. Enter raw project idea and trigger pipeline", "3. Show 5-judge simulation panel"],
    backup_demo_plan: ["Pre-recorded 60s HD video walkthrough"],
    revenue_model: ["Freemium individual participant access", "Enterprise event tier ($499/event)"],
    head_judge: {
      overall_score: (winProb * 0.97).toFixed(1),
      winning_probability: winProb,
      one_line_verdict: `High impact project with ${winProb}% predicted win probability if core demo flow stays tight.`,
      project_status: "Top Contender",
      mission_status: "PROCEED TO PITCH"
    }
  };

  // Auto-save to server array
  savedProjects.unshift({
    id: `proj_${Date.now()}`,
    idea: idea,
    stack: stack,
    winProbability: winProb,
    data: fallbackData
  });

  res.json(fallbackData);
};

app.post('/api/analyze', analyzeHandler);
app.post('/api/analyze-project', analyzeHandler);

// Handler for 5-Slide Pitch Generator Endpoint
const pitchHandler = async (req, res) => {
  const { idea, stack } = req.body;

  const prompt = `
    Act as a Y Combinator Pitch Coach.
    Create a 5-Slide Hackathon Pitch Script for: "${idea}" built with "${stack}".
    RETURN JSON with "slides" array of 5 objects containing "num", "title", "script".
  `;

  const aiResult = await callGeminiAPI(prompt, req.body.apiKey);
  if (aiResult) return res.json(aiResult);

  res.json({
    slides: [
      { num: 1, title: "Slide 1: Hook & Pain Point", script: `Every team building ${(idea || 'project').substring(0,30)} faces massive friction. We waste hours on manual overhead instead of executing.` },
      { num: 2, title: "Slide 2: Solution & Value Prop", script: `Introducing our platform: an intelligent engine that automates complex decisions in real time using ${stack || 'modern tech'}.` },
      { num: 3, title: "Slide 3: System Architecture", script: `Powered by ${stack || 'our stack'}. Designed for low-latency API execution with resilient fallback engines.` },
      { num: 4, title: "Slide 4: Live Demo Flow", script: "Start directly in the active execution workspace. Show 1-click action, instant analysis, and dynamic output." },
      { num: 5, title: "Slide 5: Future Horizon & Wrap", script: "From hackathon MVP to production scale — our modular design allows seamless expansion to enterprise workflows." }
    ]
  });
};

app.post('/api/pitch', pitchHandler);
app.post('/api/generate-pitch', pitchHandler);

// Handler for Pitch Deck Auditor Endpoint & 5-Judge Simulation
const judgeHandler = async (req, res) => {
  const { deckText, project_name, problem_statement, tech_stack } = req.body;

  if (project_name || problem_statement) {
    const win = calculateDynamicWinProb(problem_statement || project_name, tech_stack, "3", "24");
    return res.json({
      technical_judge: { score: Math.min(98, win + 2), strengths: ["Low latency architecture", "Clean code structure"], weaknesses: ["Needs DB connection pooling"] },
      innovation_judge: { score: Math.min(96, win + 4), strengths: ["Novel AI agent orchestration"], weaknesses: ["Niche market size"] },
      business_judge: { score: Math.max(60, win - 3), strengths: ["Clear Freemium model"], weaknesses: ["High user acquisition cost"] },
      uiux_judge: { score: Math.min(99, win + 5), strengths: ["Glassmorphism aesthetic", "Instant feedback"], weaknesses: ["Mobile navbar spacing"] },
      presentation_judge: { score: win, strengths: ["Strong elevator pitch"], weaknesses: ["Pacing during live demo"] },
      head_judge: {
        overall_score: (win * 0.98).toFixed(1),
        winning_probability: win,
        one_line_verdict: `Strong execution potential with ${win}% predicted win chance.`,
        project_status: "Top Contender",
        mission_status: "PROCEED TO PITCH"
      }
    });
  }

  const prompt = `
    Act as a Hackathon Judge reviewing pitch deck text: "${deckText || 'Default content'}"
    RETURN JSON with "storyScore" string and "critiques" array.
  `;

  const aiResult = await callGeminiAPI(prompt, req.body.apiKey);
  if (aiResult) return res.json(aiResult);

  res.json({
    storyScore: "8.2",
    critiques: [
      { type: "red", title: "🔴 Paragraph Overload", desc: "Slide 2 contains too much prose. Convert long sentences into 3 punchy bullet points." },
      { type: "orange", title: "⚠️ Missing Tech Stack Callout", desc: "Be explicit about why your backend architecture solves latency or scaling challenges." },
      { type: "green", title: "🟢 Strong Demo Hook", desc: "Your planned demo flow focuses straight on the core value proposition without setup fluff." }
    ]
  });
};

app.post('/api/judge', judgeHandler);
app.post('/api/audit-pitch-deck', judgeHandler);

// Handler for Real-time Coach Chat Assistant Endpoint
const chatHandler = async (req, res) => {
  const { message, context } = req.body;

  if (!message || message.trim() === '') {
    return res.json({ reply: "👋 How can I assist with your hackathon sprint or pitch deck?" });
  }

  const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 15) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `You are KrishnaAI Coach. Context: ${context}. Message: ${message}` }] }] })
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.json({ reply: text, aiSource: "Gemini 1.5 Flash" });
      }
    } catch (e) { console.error("Chat API error:", e.message); }
  }

  // Intelligent local coach responses tailored to query keywords
  let reply = "";
  const lower = (message || '').toLowerCase();
  if (lower.includes('auth') || lower.includes('login')) {
    reply = "💡 **Coach Advice**: Skip full OAuth/JWT for now! Hardcode a `guest-demo` button in the UI that loads pre-seeded state. Spending 3 hours fixing CORS/Auth tokens during a hackathon is a classic trap.";
  } else if (lower.includes('pitch') || lower.includes('deck') || lower.includes('hook') || lower.includes('present')) {
    reply = "🎤 **Coach Advice**: Start your presentation with a 15-second story hook. Do NOT explain your database setup first. Show the working product in the first 45 seconds!";
  } else if (lower.includes('database') || lower.includes('db') || lower.includes('sql') || lower.includes('game')) {
    reply = "🗄️ **Coach Advice**: For fast hackathon builds, use Supabase or Firebase for instant real-time sync. Avoid writing raw socket servers from scratch unless necessary!";
  } else if (lower.includes('api') || lower.includes('backend') || lower.includes('slow')) {
    reply = "⚡ **Coach Advice**: If your backend is slow or hitting rate limits, create a local `mock-data.json` fallback in your frontend API client. Never let a live demo fail due to network hiccups.";
  } else {
    reply = `🚀 **Coach Advice**: Regarding "${message.substring(0, 30)}..." — Focus on completing one single 'happy path' loop from end to end. A working 1-feature MVP beats a broken 5-feature system 100% of the time!`;
  }

  res.json({ reply, aiSource: "Krishna AI Engine" });
};

app.post('/api/chat', chatHandler);
app.post('/api/coach-chat', chatHandler);

// Projects Storage API Endpoints
app.get('/api/projects', (req, res) => {
  res.json(savedProjects);
});

app.post('/api/projects', (req, res) => {
  const proj = req.body;
  if (proj) {
    savedProjects.unshift(proj);
  }
  res.json({ status: "ok", count: savedProjects.length });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 KrishnaAI Hackathon Coach Server running on port ${PORT}`);
    console.log(`👉 Open http://localhost:${PORT} in your web browser`);
    console.log(`====================================================`);
  });
}

module.exports = app;

