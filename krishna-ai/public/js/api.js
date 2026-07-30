// API Service for KrishnaAI Production Engine

const API_BASE = ''; 

async function apiAnalyzeProject(idea, stack, team, time, apiKey) {
  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, stack, team, time, apiKey })
    });
    if (!res.ok) throw new Error("Backend API error");
    return await res.json();
  } catch (err) {
    console.warn("Using client-side fallback due to error:", err.message);
    return getLocalFallbackData(idea, stack, team);
  }
}

async function apiGeneratePitch(idea, stack, apiKey) {
  try {
    const res = await fetch(`${API_BASE}/api/pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, stack, apiKey })
    });
    if (!res.ok) throw new Error("Pitch API error");
    return await res.json();
  } catch (err) {
    return {
      slides: [
        { num: 1, title: "Slide 1: Hook & Pain Point", script: `Every team building ${idea.substring(0,30)} faces massive friction.` },
        { num: 2, title: "Slide 2: Solution & Value Prop", script: `Our app automates complex decisions in real time using ${stack}.` },
        { num: 3, title: "Slide 3: Technical Architecture", script: `Powered by ${stack} with optimized low-latency data pipelines.` },
        { num: 4, title: "Slide 4: Live Demo Focus", script: "Jump directly into the workspace to demonstrate 1-click execution." },
        { num: 5, title: "Slide 5: Immediate Impact", script: "Ready to deploy from hackathon MVP to enterprise scale." }
      ]
    };
  }
}

async function apiAuditPitchDeck(deckText, apiKey) {
  try {
    const res = await fetch(`${API_BASE}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deckText, apiKey })
    });
    if (!res.ok) throw new Error("Audit API error");
    return await res.json();
  } catch (err) {
    return {
      storyScore: "8.5",
      critiques: [
        { type: "red", title: "🔴 Too Much Text", desc: "Slide 2 has over 150 words. Convert to visual bullet points." },
        { type: "orange", title: "⚠️ Missing Architecture Diagram", desc: "Include an explicit architecture flowchart." },
        { type: "green", title: "🟢 Strong Opening Hook", desc: "Clear problem statement in the first 15 seconds." }
      ]
    };
  }
}

async function apiCoachChat(message, context, apiKey) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, apiKey })
    });
    if (!res.ok) throw new Error("Coach Chat API error");
    return await res.json();
  } catch (err) {
    return { reply: "🚀 **Coach Advice**: Focus on building a clean 1-feature MVP that never crashes during live demo!" };
  }
}

async function apiFetchSavedProjects() {
  try {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

function getLocalFallbackData(idea, stack, team) {
  const topic = (idea || 'Hackathon Project').substring(0, 30);
  return {
    winProbability: 87,
    critiqueText: `Building complex auth and custom dashboards for <b>${topic}</b> with <b>${stack}</b> will burn time. <b>Cut bloat features immediately!</b> Focus 100% on core user API workflows.`,
    sprintPlan: [
      { phase: "Sprint 1 (Hr 0-4)", title: "1. Core API & Database Schema", desc: `Setup DB models for ${topic}.`, time: "Est: 2h", assignee: "Backend Lead", slipping: false, isFat: false, priority: "HIGH" },
      { phase: "Sprint 2 (Hr 4-12)", title: "2. Frontend UI Flow", desc: `Connect UI views to APIs using ${stack.split(',')[0] || 'React'}.`, time: "Est: 3.5h", assignee: "Frontend Lead", slipping: false, isFat: false, priority: "HIGH" },
      { phase: "Sprint 3 (Hr 12-18)", title: "3. Advanced Analytics & Custom Charts", desc: "Complex secondary analytics reporting tab.", time: "Est: 5h+", assignee: "Unassigned", slipping: true, isFat: true, priority: "LOW" },
      { phase: "Sprint 4 (Hr 18-24)", title: "4. Demo Script & Backup Video", desc: "Record 60s backup walkthrough video.", time: "Est: 1.5h", assignee: "Pitch Lead", slipping: false, isFat: false, priority: "HIGH" }
    ],
    risks: [
      { title: "API Delay & Mocking Blocker", desc: "Frontend stalled waiting for backend authentication endpoints.", action: "> COACH INTERVENTION: Mock API response directly in client state.", isSlipping: true },
      { title: "Deployment Crash Risk", desc: "Production environment variables missing on host server.", action: "> COACH INTERVENTION: Deploy early to Vercel/Render at hour 4 to test CORS.", isSlipping: false }
    ],
    recoveryPlan: {
      headline: "Emergency Scope Cut & Pivot Protocol",
      steps: [
        "Drop custom auth — use pre-authenticated guest user context.",
        "Freeze CSS updates at Hour 18 — focus exclusively on happy path demo loop.",
        "Pre-render static fallback charts in case live API hits rate limits."
      ]
    },
    architecture: {
      score: 8.7,
      feedback: `Solid technical architecture. Ensure sample data is pre-seeded so demo doesn't show blank state.`,
      missing: ["Database Seed Script", "Fallback Error State UI"]
    },
    demoReadiness: {
      score: 8.7,
      checklist: [
        "Database pre-seeded with sample records?",
        "60-second backup walkthrough video saved locally?",
        "1-click Guest Demo Mode enabled without auth prompt?",
        "Live API error handling displays friendly fallback state?"
      ]
    },
    judgeSimulation: {
      overallScore: "8.8/10",
      feedback: "Judges will praise solving a real pain point if live demo delivers instantaneous visual impact.",
      sampleQuestions: [
        { q: "How does your system handle offline network failures during live pitch?", a: "We have an embedded local fallback engine that serves pre-computed JSON snapshots instantly." }
      ]
    }
  };
}
