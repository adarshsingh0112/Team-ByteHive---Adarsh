const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// 1. Deep Project Analysis Endpoint
app.post('/api/analyze-project', async (req, res) => {
  const { idea, stack, team, time, apiKey } = req.body;

  const prompt = `
    Act as an elite Hackathon Coach and Head Judge.
    Analyze this project proposal:
    Idea: "${idea}"
    Tech Stack: "${stack}"
    Team Size: "${team}"
    Hackathon Time Limit: "${time}"

    Provide a strict critique focused on scope management, practical build steps, tech architecture, judging alignment, and demo readiness.
    RETURN EXACTLY THIS JSON STRUCTURE:
    {
      "critiqueText": "Direct, honest scope critique. Highlight features that are 'bloat' and must be cut for a working MVP.",
      "tasks": [
        { "title": "1. Core API & Database", "desc": "Detailed milestone description", "time": "Est: 2h", "assignee": "Backend Dev", "slipping": false, "isFat": false, "priority": "HIGH" },
        { "title": "2. Frontend MVP Flow", "desc": "Detailed milestone description", "time": "Est: 4h", "assignee": "Frontend Dev", "slipping": false, "isFat": false, "priority": "HIGH" },
        { "title": "3. Advanced Analytics & Custom Charts", "desc": "High risk feature description", "time": "Est: 6h", "assignee": "Fullstack Dev", "slipping": true, "isFat": true, "priority": "LOW" },
        { "title": "4. Pitch Deck & 60s Video Backup", "desc": "Prepare demo slides and backup screen recording", "time": "Est: 2h", "assignee": "Team Leader", "slipping": false, "isFat": false, "priority": "HIGH" }
      ],
      "risks": [
        { "title": "Integration Bottleneck", "desc": "Frontend stalled waiting for backend auth APIs.", "action": "> COACH: Bypass auth with mock user context immediately.", "isSlipping": true },
        { "title": "Deployment Crash Risk", "desc": "Production environment variables unverified.", "action": "> COACH: Run continuous deployment on Vercel/Render at hour 4.", "isSlipping": false }
      ],
      "architecture": {
        "score": 8,
        "feedback": "Robust stack choices. Ensure database connection pooling is set up to prevent cold start latency.",
        "missing": ["Real-time Sync Mechanism", "Fallback Seed Data Scripts"]
      },
      "demoScore": "8.4",
      "judgeFeedback": {
        "overall": "Strong narrative potential with high practical value if the MVP core flow is completed.",
        "improvement": "Focus 80% of live demo time on the primary user problem. Do not waste time showing login screens."
      },
      "checklist": [
        "DB pre-seeded with realistic sample data?",
        "60-second backup video recorded & locally accessible?",
        "One-click guest/demo login enabled without password prompt?",
        "Core feature verified under poor network condition?"
      ]
    }
  `;

  const aiResult = await callGeminiAPI(prompt, apiKey);

  if (aiResult) {
    return res.json(aiResult);
  }

  // Smart Fallback Generator tailored to user input
  const mainTech = (stack || 'React, Node').split(',')[0].trim();
  const shortIdea = (idea || 'Hackathon Project').substring(0, 35);

  const fallbackData = {
    critiqueText: `Building full auth & custom dashboards for <b>${shortIdea}</b> with <b>${stack || 'your stack'}</b> in <b>${time || '24h'}</b> will burn critical demo prep time. <b>Cut bloat features immediately!</b> Focus 100% on the core interactive loop.`,
    tasks: [
      { title: "1. Core API & Data Models", desc: `Setup lightweight backend services using ${mainTech}.`, time: "Est: 2.5h", assignee: "Backend Lead", slipping: false, isFat: false, priority: "HIGH" },
      { title: "2. Primary User Flow UI", desc: `Build dynamic UI for ${shortIdea}.`, time: "Est: 4h", assignee: "Frontend Lead", slipping: false, isFat: false, priority: "HIGH" },
      { title: "3. Real-time Analytics & Export", desc: "Complex secondary reporting tab.", time: "Est: 5h+", assignee: "Unassigned", slipping: true, isFat: true, priority: "LOW" },
      { title: "4. Demo Script & Backup Video", desc: "Record 60s walkthrough video for safety.", time: "Est: 1.5h", assignee: "Pitcher", slipping: false, isFat: false, priority: "HIGH" }
    ],
    risks: [
      { title: "API Delay & Mocking Blocker", desc: "Frontend waiting on real backend endpoints.", action: "> COACH: Implement mock JSON responses directly in frontend service.", isSlipping: true },
      { title: "Deployment Cold Start Failure", desc: "Host environment variables unconfigured.", action: "> COACH: Deploy early to Vercel/Render at Hour 4 to test production CORS.", isSlipping: false }
    ],
    architecture: {
      score: 8,
      feedback: `Strong choice using ${mainTech}. Make sure to pre-seed your database so demo doesn't show empty state.`,
      missing: ["Database Seed Script", "Graceful API Error Fallbacks"]
    },
    demoScore: "8.2",
    judgeFeedback: {
      overall: "Judges will praise solving a real pain point if the live demo delivers instantaneous visual impact.",
      improvement: "Start the demo directly inside the active app state. Do not show login/registration forms."
    },
    checklist: [
      "Database pre-seeded with realistic sample records?",
      "Backup 60s screen recording saved locally?",
      "No login required — instant 1-click Demo Mode enabled?",
      "Live API error handling displays friendly fallback state?"
    ]
  };

  res.json(fallbackData);
});

// 2. 5-Slide Pitch Generator Endpoint
app.post('/api/generate-pitch', async (req, res) => {
  const { idea, stack } = req.body;

  const prompt = `
    Act as a Y Combinator Pitch Coach.
    Create a high-impact 5-Slide Hackathon Pitch Script for this project: "${idea}" built with "${stack}".
    RETURN EXACTLY THIS JSON:
    {
      "slides": [
        { "num": 1, "title": "Slide 1: Hook & Problem", "script": "Direct 15-second opening hook stating the exact problem and who suffers from it." },
        { "num": 2, "title": "Slide 2: The Solution", "script": "Clear value proposition explaining how your app solves the problem in 2 steps." },
        { "num": 3, "title": "Slide 3: Architecture & Tech Stack", "script": "Brief technical breakdown highlighting why this stack (${stack}) enables speed and reliability." },
        { "num": 4, "title": "Slide 4: Live Demo Focus", "script": "Step-by-step guide on what to click and highlight during the 2-minute live demo." },
        { "num": 5, "title": "Slide 5: Future Roadmap & Impact", "script": "Closing statement on scalability, immediate next steps, and hackathon execution win." }
      ]
    }
  `;

  const aiResult = await callGeminiAPI(prompt, req.body.apiKey);
  if (aiResult) return res.json(aiResult);

  // Fallback pitch script
  res.json({
    slides: [
      { num: 1, title: "Slide 1: Hook & Pain Point", script: `Every team building ${idea.substring(0,30) || 'a project'} faces massive friction. We waste hours on manual overhead instead of executing.` },
      { num: 2, title: "Slide 2: Solution & Value Prop", script: `Introducing our platform: an intelligent engine that automates complex decisions in real time using ${stack}.` },
      { num: 3, title: "Slide 3: System Architecture", script: `Powered by ${stack}. Designed for low-latency API execution with resilient fallback engines.` },
      { num: 4, title: "Slide 4: Live Demo Flow", script: "Start directly in the active execution workspace. Show 1-click action, instant analysis, and dynamic output." },
      { num: 5, title: "Slide 5: Future Horizon & Wrap", script: "From hackathon MVP to production scale — our modular design allows seamless expansion to enterprise workflows." }
    ]
  });
});

// 3. Pitch Deck Auditor Endpoint
app.post('/api/audit-pitch-deck', async (req, res) => {
  const { deckText } = req.body;

  const prompt = `
    Act as a Hackathon Judge reviewing pitch deck text:
    "${deckText || 'Default presentation content'}"

    Critique the slide text for length, clarity, technical depth, and judge interest.
    RETURN EXACTLY THIS JSON:
    {
      "storyScore": "7.5",
      "critiques": [
        { "type": "red", "title": "🔴 Text Density Alert", "desc": "Reduce paragraph lengths. Judges digest visual bullet points faster." },
        { "type": "orange", "title": "⚠️ Missing Architecture Diagram", "desc": "Add a clear visual architecture flowchart to demonstrate tech rigor." },
        { "type": "green", "title": "🟢 Clear Problem Statement", "desc": "The target pain point is clearly identified in the opening." }
      ]
    }
  `;

  const aiResult = await callGeminiAPI(prompt, req.body.apiKey);
  if (aiResult) return res.json(aiResult);

  res.json({
    storyScore: "7.8",
    critiques: [
      { type: "red", title: "🔴 Paragraph Overload", "desc": "Slide 2 contains too much prose. Convert long sentences into 3 punchy bullet points." },
      { type: "orange", title: "⚠️ Missing Tech Stack Callout", "desc": "Be explicit about why your backend architecture solves latency or scaling challenges." },
      { type: "green", title: "🟢 Strong Demo Hook", "desc": "Your planned demo flow focuses straight on the core value proposition without setup fluff." }
    ]
  });
});

// 4. Real-time Coach Chat Assistant Endpoint
app.post('/api/coach-chat', async (req, res) => {
  const { message, context } = req.body;

  const prompt = `
    You are KrishnaAI, an expert Hackathon Coach & Senior Tech Lead.
    Project context: "${context || 'General hackathon build'}"
    Team message: "${message}"

    Provide a concise, direct, motivating, and actionable response (under 100 words). Use markdown formatting and clear recommendations.
  `;

  const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 15) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.json({ reply: text });
      }
    } catch (e) { console.error("Chat API error:", e.message); }
  }

  // Intelligent local coach responses
  let reply = "Here is my advice: ";
  const lower = (message || '').toLowerCase();
  if (lower.includes('auth') || lower.includes('login')) {
    reply = "💡 **Coach Advice**: Skip full OAuth/JWT for now! Hardcode a `guest-demo` button in the UI that loads pre-seeded state. Spending 3 hours fixing CORS/Auth tokens during a hackathon is a classic trap.";
  } else if (lower.includes('pitch') || lower.includes('deck') || lower.includes('present')) {
    reply = "🎤 **Coach Advice**: Start your presentation with a 15-second story hook. Do NOT explain your database setup first. Show the working product in the first 45 seconds!";
  } else if (lower.includes('api') || lower.includes('backend') || lower.includes('slow')) {
    reply = "⚡ **Coach Advice**: If your backend is slow or hitting rate limits, create a local `mock-data.json` fallback in your frontend API client. Never let a live demo fail due to network hiccups.";
  } else {
    reply = "🚀 **Coach Advice**: Focus on completing one single 'happy path' loop from end to end. A working 1-feature MVP beats a broken 5-feature system 100% of the time in hackathon judging!";
  }

  res.json({ reply });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 KrishnaAI Hackathon Coach Server running on port ${PORT}`);
  console.log(`👉 Open http://localhost:${PORT} in your web browser`);
  console.log(`====================================================`);
});
