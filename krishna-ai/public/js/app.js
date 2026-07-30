let globalProjectData = null;
let activePersonaMode = 'hackathon'; // 'hackathon' | 'beginner' | 'enterprise'

document.addEventListener('DOMContentLoaded', () => {
  // Mode Switcher Controls
  const modeBtns = document.querySelectorAll('#modeSelector .mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePersonaMode = btn.getAttribute('data-mode') || 'hackathon';

      const badge = document.getElementById('dashModeBadge');
      if (badge) {
        if (activePersonaMode === 'hackathon') badge.innerText = '⚡ Hackathon Mode';
        else if (activePersonaMode === 'beginner') badge.innerText = '🐣 Beginner Mode';
        else badge.innerText = '💼 VC & Enterprise Mode';
      }

      if (globalProjectData) {
        renderDashboardData(globalProjectData, document.getElementById('mainPrompt').value, document.getElementById('inTech').value);
      }
    });
  });

  // Main Form Submit Handler
  const btnSubmit = document.getElementById('btnSubmit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', handleExecutePipeline);
  }

  // Grill the Judges Q&A Handler
  const btnSendJudgeQa = document.getElementById('btnSendJudgeQa');
  if (btnSendJudgeQa) {
    btnSendJudgeQa.addEventListener('click', handleJudgeQaSubmit);
  }

  // Voice Pitch Trainer Handlers
  setupVoicePitchTrainer();
});

async function handleExecutePipeline() {
  const idea = document.getElementById('mainPrompt').value.trim();
  const stack = document.getElementById('inTech').value.trim();
  const team = document.getElementById('inTeam').value;
  const time = document.getElementById('inTime').value;
  const apiKey = document.getElementById('customApiKey') ? document.getElementById('customApiKey').value.trim() : '';

  const errEl = document.getElementById('promptError');
  if (!idea) {
    if (errEl) errEl.style.display = 'block';
    document.getElementById('mainPrompt').focus();
    return;
  }
  if (errEl) errEl.style.display = 'none';

  // Transition to Loading View
  document.getElementById('view-init').classList.remove('active');
  document.getElementById('view-loading').classList.add('active');

  const l1 = document.getElementById('l1');
  const l2 = document.getElementById('l2');
  const l3 = document.getElementById('l3');
  const l4 = document.getElementById('l4');

  if (l1) l1.style.opacity = 1;
  if (l2) l2.style.opacity = 1;
  if (l3) l3.style.opacity = 1;
  if (l4) l4.style.opacity = 1;

  try {
    const data = await apiAnalyzeProject({ idea, stack, team, time, apiKey, mode: activePersonaMode });
    globalProjectData = data;

    setTimeout(() => {
      document.getElementById('view-loading').classList.remove('active');
      document.getElementById('view-dash').classList.add('active');

      const titleEl = document.getElementById('projTitle');
      if (titleEl) titleEl.innerText = idea.split(' ').slice(0, 4).join(' ') + '...';

      renderDashboardData(data, idea, stack);
    }, 600);
  } catch (err) {
    document.getElementById('view-loading').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
  }
}

function renderDashboardData(data, idea, stack) {
  const winProb = data.winning_probability || data.winProbability || 85;

  // Panel 1: Win Probability & Scope Review
  document.getElementById('winProbDisplay').innerText = `${winProb}%`;
  const winFill = document.getElementById('winMeterFill');
  if (winFill) winFill.style.width = `${winProb}%`;

  let scopeHTML = `<div class="critique-box">
    <h4>SCOPE REVIEW — SCOPE PRUNED & MVP READY</h4>
    <p>${data.critiqueText || 'Building non-essential features burns demo prep. Focus 100% on the core interactive loop.'}</p>
    <button class="btn-cut" id="cutFatBtn">✂ 1-Click Cut Secondary Bloat</button>
  </div>`;

  if (activePersonaMode === 'beginner' && data.beginner_glossary) {
    scopeHTML += `<div class="critique-item" style="margin-top:10px; border-left-color:var(--cyan);">
      <h5 style="color:var(--cyan);">🐣 Beginner Concept Glossary:</h5>
      <ul style="margin:4px 0 0; padding-left:18px; font-size:11.5px; color:var(--text-dim);">
        ${data.beginner_glossary.map(g => `<li><strong>${g.term}:</strong> ${g.def}</li>`).join('')}
      </ul>
    </div>`;
  }

  document.getElementById('scopeCritiqueBody').innerHTML = scopeHTML;

  // Panel 2: Sprint Plan & Team Role Allocation
  const sprintPlan = data.sprint_plan || data.sprintPlan || [];
  let planHTML = '';
  sprintPlan.forEach((task, idx) => {
    planHTML += `
      <div class="task-item" ${idx === 2 ? 'id="bloatTask"' : ''}>
        <div class="task-info">
          <div class="task-head">
            <h4>${task.title}</h4>
            <span class="assignee-badge">${task.assignee || 'Developer'}</span>
          </div>
          <p>${task.desc || task.phase || 'Core milestone task'}</p>
          <span class="priority-badge">${task.priority || 'HIGH'}</span>
          <span class="time-badge">${task.phase || task.time || 'Sprint ' + (idx + 1)}</span>
        </div>
      </div>`;
  });
  document.getElementById('planPanelBody').innerHTML = planHTML;

  // Panel 3: Risk Detection & Recovery Interventions
  const risks = data.risks || [];
  let radarHTML = '';
  risks.forEach(r => {
    radarHTML += `
      <div class="risk-card ${r.isSlipping ? 'slipping' : ''}">
        <div class="risk-head">
          <span class="risk-tag ${r.isSlipping ? 'slipping' : ''}">${r.isSlipping ? 'SLIPPING TASK' : 'MEDIUM RISK'}</span>
        </div>
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
        <div class="coach-action">${r.action}</div>
      </div>`;
  });
  document.getElementById('radarPanelBody').innerHTML = radarHTML;

  // Panel 4: System Architecture, Mermaid.js & SQL DDL Schema
  const arch = data.architecture || { frontend: (stack || 'React').split(',')[0], backend: "Express", database: "Supabase PostgreSQL" };
  let archHTML = `
    <div class="score-card">
      <h3>Architecture Viability</h3>
      <span class="score-val">${data.confidence_score || 91}<span style="font-size:14px; color:var(--text-dimmer);">/100</span></span>
    </div>
    <div class="critique-item">
      <h5 style="color:var(--blue);">Production Tech Stack</h5>
      <p style="font-size:12px; margin:4px 0 0;">Frontend: <strong>${arch.frontend || 'Next.js'}</strong><br>Backend: <strong>${arch.backend || 'Express TypeScript'}</strong><br>Database: <strong>${arch.database || 'Supabase PostgreSQL'}</strong></p>
    </div>`;

  if (data.mermaid_code) {
    archHTML += `
      <div style="margin-top:10px;">
        <span style="font-size:11px; font-weight:600; color:var(--purple); display:block; margin-bottom:4px;">📊 Interactive System Flowchart (Mermaid):</span>
        <div class="mermaid-box"><pre class="mermaid">${data.mermaid_code}</pre></div>
      </div>`;
  }

  if (data.sql_ddl) {
    archHTML += `
      <div style="margin-top:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:11px; font-weight:600; color:var(--cyan);">🗄️ PostgreSQL DDL Schema (Copy to Supabase):</span>
        </div>
        <div class="sql-ddl-box" id="sqlDdlContent">${data.sql_ddl}<button class="btn-copy-code" onclick="copySqlDdl()">📋 Copy SQL</button></div>
      </div>`;
  }

  archHTML += `
    <div style="margin-top:12px; text-align:center;">
      <a href="/api/starter-code" download class="btn btn-ghost" style="font-size:11px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">📦 Download Starter Codebase (.zip)</a>
    </div>`;

  document.getElementById('archPanelBody').innerHTML = archHTML;

  // Initialize Mermaid diagrams if loaded
  setTimeout(() => {
    if (window.mermaid) {
      try {
        window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      } catch (e) {}
    }
  }, 100);

  // Panel 5: Pitch Elevator Pitch & Slides
  if (data.elevator_pitch) {
    document.getElementById('elevatorPitchBox').innerHTML = `
      <div class="critique-box" style="background:rgba(76,139,255,0.1); border-color:rgba(76,139,255,0.3);">
        <h4 style="color:var(--blue);">⚡ 15-Second Elevator Pitch Hook</h4>
        <p style="font-size:13px; font-style:italic;">"${data.elevator_pitch}"</p>
      </div>`;
  }
  renderPitchSection(idea, stack);

  // Panel 6: 5-Judge Simulation Panel
  renderFiveJudgesSection(idea, stack);

  // Panel 7: Demo Flow & Backup Fallback Plan
  let demoHTML = '';
  const flow = data.demo_flow || ["1. Open active workspace in guest mode", "2. Enter raw project idea and trigger pipeline", "3. Show 5-judge simulation panel"];
  demoHTML += `
    <div class="critique-item">
      <h5 style="color:var(--cyan);">🎬 Live Demo Flow (3 Minutes)</h5>
      <ol style="margin:6px 0 0; padding-left:18px; font-size:12px; color:var(--text-dim); line-height:1.6;">
        ${flow.map(step => `<li>${step}</li>`).join('')}
      </ol>
    </div>`;

  const backupPlan = data.backup_demo_plan || ["Pre-recorded 60s HD video walkthrough", "Pre-cached local JSON response engine"];
  demoHTML += `
    <div class="critique-item red" style="margin-top:10px;">
      <h5 style="color:var(--red);">🛡️ Offline Fallback Plan (If Wi-Fi Fails)</h5>
      <ul style="margin:4px 0 0; padding-left:18px; font-size:12px; color:var(--text-dim);">
        ${backupPlan.map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>`;
  document.getElementById('demoFlowPanelBody').innerHTML = demoHTML;

  // Panel 8: Business Model & Enterprise Unit Economics
  let busHTML = '';
  if (activePersonaMode === 'enterprise' && data.unit_economics) {
    const u = data.unit_economics;
    busHTML += `
      <div class="unit-econ-card" style="margin-bottom:10px;">
        <h4>💼 VC Unit Economics & Enterprise Metrics</h4>
        <p style="font-size:11.5px; margin:2px 0;">CAC to LTV Ratio: <strong>${u.cac_ltv_ratio}</strong></p>
        <p style="font-size:11.5px; margin:2px 0;">Gross Margin: <strong>${u.gross_margin}</strong> | COGS: <strong>${u.cogs_per_user}</strong></p>
        <p style="font-size:11.5px; margin:2px 0;">3-Year Target ARR: <strong>${u.projected_arr_yr3}</strong></p>
        <p style="font-size:11.5px; margin:2px 0; color:var(--cyan);">Cloud Infra: <strong>${u.cloud_infra_cost}</strong></p>
        <p style="font-size:11px; margin:4px 0 0; color:var(--purple);">🛡️ Compliance: ${u.soc2_compliance_status}</p>
      </div>`;
  }

  if (data.revenue_model) {
    busHTML += `
      <div class="critique-item green">
        <h5 style="color:var(--green);">💰 Revenue & Pricing Model</h5>
        <ul style="margin:4px 0 0; padding-left:18px; font-size:12px; color:var(--text-dim);">
          ${(data.revenue_model || []).map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>`;
  }
  document.getElementById('businessPanelBody').innerHTML = busHTML;

  // Demo Readiness Checklist Modal
  const demoReadiness = data.demoReadiness || {};
  const demoScoreVal = demoReadiness.score || data.demoScore || (winProb / 10).toFixed(1);
  document.getElementById('demoScoreDisplay').innerText = `${demoScoreVal}/10`;

  let chkHTML = '';
  const chkList = demoReadiness.checklist || data.checklist || [
    "Database pre-seeded with sample records?",
    "60s backup video recorded locally?",
    "1-click guest demo mode verified?"
  ];
  chkList.forEach(c => {
    chkHTML += `<label class="check-item"><input type="checkbox"> <span>${c}</span></label>`;
  });
  document.getElementById('checklistBody').innerHTML = chkHTML;

  // 1-Click Scope Cut Button Action
  const cutBtn = document.getElementById('cutFatBtn');
  if (cutBtn) {
    cutBtn.addEventListener('click', function () {
      const task = document.getElementById('bloatTask');
      if (task) {
        gsap.to(task, {
          opacity: 0, x: 20, duration: 0.3, onComplete: () => {
            gsap.to(task, { height: 0, padding: 0, margin: 0, border: 'none', duration: 0.4, onComplete: () => task.remove() });
          }
        });
      }
      gsap.to(this, { background: "rgba(52, 211, 153, 0.15)", borderColor: "rgba(52, 211, 153, 0.3)", color: "var(--green)", duration: 0.3 });
      this.innerHTML = "✓ Scope Cut & Pruned!";
      this.style.pointerEvents = "none";
    });
  }
}

// Copy SQL DDL Helper
window.copySqlDdl = function() {
  const codeEl = document.getElementById('sqlDdlContent');
  if (!codeEl) return;
  const text = codeEl.innerText.replace('📋 Copy SQL', '').trim();
  navigator.clipboard.writeText(text);
  const btn = codeEl.querySelector('.btn-copy-code');
  if (btn) {
    btn.innerText = '✓ Copied!';
    setTimeout(() => { btn.innerText = '📋 Copy SQL'; }, 2000);
  }
};

// Grill the Judges Interactive Q&A Handler
async function handleJudgeQaSubmit() {
  const input = document.getElementById('judgeQaInput');
  const replyBox = document.getElementById('judgeQaReply');
  if (!input || !replyBox) return;

  const q = input.value.trim();
  if (!q) return;

  replyBox.style.display = 'block';
  replyBox.innerHTML = `<span style="font-size:11px; color:var(--text-dim);">Consulting International Judge Panel...</span>`;

  try {
    const res = await fetch('/api/judge-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, project_context: globalProjectData?.critiqueText || '' })
    });
    if (res.ok) {
      const data = await res.json();
      replyBox.innerHTML = `<div class="critique-item green" style="padding:10px;"><p style="font-size:12px; margin:0;">${data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p></div>`;
      input.value = '';
      return;
    }
  } catch (e) {}

  replyBox.innerHTML = `<div class="critique-item green" style="padding:10px;"><p style="font-size:12px; margin:0;">👨‍⚖️ <strong>Head Judge Verdict</strong>: Clear, direct technical explanation for "${q.substring(0, 30)}...". Demonstrates strong architecture ownership.</p></div>`;
  input.value = '';
}

// Voice Pitch Trainer (Web Speech API)
function setupVoicePitchTrainer() {
  const btnRecord = document.getElementById('btnRecordPitch');
  const btnStop = document.getElementById('btnStopPitch');
  const resultBox = document.getElementById('voicePitchResult');
  if (!btnRecord || !btnStop) return;

  let recognition = null;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
  }

  let startTime = 0;
  let transcriptText = '';

  btnRecord.addEventListener('click', () => {
    btnRecord.style.display = 'none';
    btnStop.style.display = 'inline-block';
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<span style="color:var(--purple); font-weight:600;">🎙️ Recording Pitch... Speak now!</span>`;
    startTime = Date.now();
    transcriptText = '';

    if (recognition) {
      recognition.start();
      recognition.onresult = (e) => {
        transcriptText = Array.from(e.results).map(r => r[0].transcript).join(' ');
      };
    }
  });

  btnStop.addEventListener('click', () => {
    btnStop.style.display = 'none';
    btnRecord.style.display = 'inline-block';

    const durationSec = Math.round((Date.now() - startTime) / 1000);
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }

    const words = transcriptText.split(' ').filter(Boolean).length;
    const wpm = durationSec > 0 ? Math.round((words / durationSec) * 60) : 130;
    const fillers = (transcriptText.match(/\b(um|uh|like|you know)\b/gi) || []).length;

    resultBox.innerHTML = `
      <div class="critique-item green" style="padding:10px; margin-top:6px;">
        <h5 style="color:var(--green); margin:0 0 4px;">🎙️ Pitch Analysis (${durationSec}s recorded)</h5>
        <p style="font-size:11px; margin:2px 0;">Speech Pacing: <strong>${wpm} WPM</strong> (${wpm > 160 ? 'Too Fast ⚠️' : 'Optimal Pace 🟢'})</p>
        <p style="font-size:11px; margin:2px 0;">Filler Words Detected: <strong>${fillers}</strong> (${fillers === 0 ? 'Zero Fillers! 🌟' : 'Try reducing um/uh count'})</p>
      </div>`;
  });
}

// 5-Judge Simulation Panel Rendering Logic
async function renderFiveJudgesSection(idea, stack) {
  const panel = document.getElementById('fiveJudgesPanelBody');
  if (!panel) return;

  panel.innerHTML = `<div class="loader-ring" style="width:30px;height:30px;margin:20px auto;"></div><p style="text-align:center;font-size:12px;color:var(--purple);">Evaluating project with 5 Independent International Judges...</p>`;

  const data = await apiSimulate5Judges({
    project_name: idea.substring(0, 30),
    problem_statement: idea,
    tech_stack: stack,
    features: "Autonomous 12-step execution pipeline"
  });

  if (!data) return;

  const t = data.technical_judge || { score: 84 };
  const i = data.innovation_judge || { score: 88 };
  const b = data.business_judge || { score: 82 };
  const u = data.uiux_judge || { score: 90 };
  const p = data.presentation_judge || { score: 87 };
  const h = data.head_judge || { overall_score: 85.7, winning_probability: 86 };

  let html = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
      
      <!-- Head Judge Summary Banner -->
      <div style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(76,139,255,0.15)); border: 1px solid rgba(168,85,247,0.3); border-radius:14px; padding:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <span style="font-family:'JetBrains Mono'; font-size:11px; color:var(--purple); text-transform:uppercase;">👑 Head Judge Final Verdict</span>
          <h3 style="margin:4px 0 2px; font-size:20px;">"${h.one_line_verdict || "A high-impact hackathon tool."}"</h3>
          <p style="margin:0; font-size:12px; color:var(--text-dim);">Status: <strong>${h.project_status || 'Top Contender'}</strong> | Mission: <strong>${h.mission_status || 'PROCEED TO PITCH'}</strong></p>
        </div>
        <div style="text-align:right;">
          <h1 style="margin:0; font-size:36px; color:var(--cyan);">${h.overall_score || 85.7}<span style="font-size:16px; color:var(--text-dimmer);">/100</span></h1>
          <p style="margin:0; font-size:11px; color:var(--green); font-family:'JetBrains Mono';">Win Probability: ${h.winning_probability || 86}%</p>
        </div>
      </div>

      <!-- Judge 1: Technical (30%) -->
      <div class="critique-item">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h5 style="color:var(--blue); margin:0;">💻 Technical Judge (30%)</h5>
          <span style="font-weight:700; color:var(--text);">${t.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px;"><strong>Strengths:</strong> ${(t.strengths || []).join(', ')}</p>
        <p style="font-size:11.5px; color:var(--red);"><strong>Weakness:</strong> ${(t.weaknesses || []).join(', ')}</p>
      </div>

      <!-- Judge 2: Innovation (20%) -->
      <div class="critique-item">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h5 style="color:var(--purple); margin:0;">💡 Innovation Judge (20%)</h5>
          <span style="font-weight:700; color:var(--text);">${i.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px;"><strong>Strengths:</strong> ${(i.strengths || []).join(', ')}</p>
        <p style="font-size:11.5px; color:var(--orange);"><strong>Weakness:</strong> ${(i.weaknesses || []).join(', ')}</p>
      </div>

      <!-- Judge 3: Business (20%) -->
      <div class="critique-item">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h5 style="color:var(--green); margin:0;">💼 Business Judge (20%)</h5>
          <span style="font-weight:700; color:var(--text);">${b.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px;"><strong>Strengths:</strong> ${(b.strengths || []).join(', ')}</p>
        <p style="font-size:11.5px; color:var(--orange);"><strong>Weakness:</strong> ${(b.weaknesses || []).join(', ')}</p>
      </div>

      <!-- Judge 4: UI/UX (10%) -->
      <div class="critique-item">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h5 style="color:var(--cyan); margin:0;">🎨 UI/UX Judge (10%)</h5>
          <span style="font-weight:700; color:var(--text);">${u.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px;"><strong>Strengths:</strong> ${(u.strengths || []).join(', ')}</p>
        <p style="font-size:11.5px; color:var(--orange);"><strong>Weakness:</strong> ${(u.weaknesses || []).join(', ')}</p>
      </div>

      <!-- Judge 5: Presentation (20%) -->
      <div class="critique-item">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h5 style="color:var(--orange); margin:0;">🎤 Presentation Judge (20%)</h5>
          <span style="font-weight:700; color:var(--text);">${p.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px;"><strong>Strengths:</strong> ${(p.strengths || []).join(', ')}</p>
        <p style="font-size:11.5px; color:var(--red);"><strong>Weakness:</strong> ${(p.weaknesses || []).join(', ')}</p>
      </div>

    </div>
  `;

  panel.innerHTML = html;
}

// File Upload Deck Inspector with Format & Extension Validation
const uploadZone = document.getElementById('uploadZone');
const deckFileInput = document.getElementById('deckFileInput');

if (uploadZone && deckFileInput) {
  uploadZone.addEventListener('click', () => deckFileInput.click());
  deckFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['pdf', 'txt', 'ppt', 'pptx', 'md'];

    if (!validExtensions.includes(ext)) {
      uploadZone.innerHTML = `
        <div style="color:var(--red); font-size:22px; margin-bottom:4px;">⚠️</div>
        <h4 style="color:var(--red);">Unsupported File Format</h4>
        <p style="font-size:11px; color:var(--text-dim); margin-top:4px;">"${file.name}" is not supported. Please upload a PDF, PPT, or TXT presentation file.</p>
        <button class="btn btn-ghost" onclick="location.reload()" style="margin-top:8px; font-size:11px;">Try Again</button>
      `;
      return;
    }

    uploadZone.innerHTML = `<div class="loader-ring" style="width:30px;height:30px;margin-bottom:8px;"></div><p style="font-size:12px;">Auditing ${file.name}...</p>`;
    uploadZone.style.pointerEvents = 'none';

    const text = await file.text().catch(() => "Sample deck content");
    const auditData = await apiAuditPitchDeck(text);

    setTimeout(() => {
      uploadZone.style.display = 'none';
      const evalHTML = `
        <div class="score-card">
          <h3>Storytelling Score</h3>
          <span class="score-val">${auditData.storyScore}<span style="font-size:14px; color:var(--text-dimmer);">/10</span></span>
        </div>
        ${auditData.critiques.map(c => `
          <div class="critique-item ${c.type}">
            <h5>${c.title}</h5>
            <p>${c.desc}</p>
          </div>
        `).join('')}
      `;
      const evalRes = document.getElementById('evalResult');
      evalRes.innerHTML = evalHTML;
      evalRes.style.display = 'flex';
    }, 1200);
  });
}

// History Drawer & Saved Projects
const btnToggleHistory = document.getElementById('btnToggleHistory');
const historyDrawer = document.getElementById('historyDrawer');
const btnCloseHistory = document.getElementById('btnCloseHistory');
const historyList = document.getElementById('historyList');

async function loadHistoryList() {
  historyList.innerHTML = `<p style="font-size:12px; color:var(--text-dim); text-align:center;">Loading saved projects...</p>`;
  const projects = await apiFetchSavedProjects();
  if (!projects || projects.length === 0) {
    historyList.innerHTML = `<p style="font-size:12px; color:var(--text-dim); text-align:center;">No saved projects yet. Submit an idea to auto-save!</p>`;
    return;
  }

  let html = '';
  projects.forEach(p => {
    html += `
      <div class="critique-item" style="cursor:pointer; margin-bottom:8px;" onclick="loadSavedProject('${p.id}')">
        <h5 style="color:var(--cyan);">${(p.idea || 'Project').substring(0, 32)}...</h5>
        <p style="font-size:11px;">Stack: ${p.stack || 'General'} | Win: <strong>${p.winProbability || 85}%</strong></p>
      </div>`;
  });
  historyList.innerHTML = html;
}

if (btnToggleHistory) {
  btnToggleHistory.addEventListener('click', (e) => {
    e.stopPropagation();
    historyDrawer.classList.toggle('active');
    if (historyDrawer.classList.contains('active')) loadHistoryList();
  });
}
if (btnCloseHistory) {
  btnCloseHistory.addEventListener('click', (e) => {
    e.stopPropagation();
    historyDrawer.classList.remove('active');
  });
}

window.loadSavedProject = async function(id) {
  const projects = await apiFetchSavedProjects();
  const found = projects.find(p => p.id === id);
  if (found && found.data) {
    globalProjectData = found.data;
    document.getElementById('projTitle').innerText = (found.idea || 'Saved Project').split(' ').slice(0, 4).join(' ') + '...';
    document.getElementById('view-init').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    renderDashboardData(found.data, found.idea, found.stack);
    historyDrawer.classList.remove('active');
  }
};

// Reset / New Project Button
document.getElementById('btnReset').addEventListener('click', () => {
  document.getElementById('view-dash').classList.remove('active');
  document.getElementById('view-init').classList.add('active');
  gsap.to('#view-init', { opacity: 1, y: 0, duration: 0.4 });
});

// Modal Pre-flight triggers
document.getElementById('btnPreflight').addEventListener('click', () => {
  document.getElementById('modalPreflight').classList.add('active');
});
document.getElementById('btnCloseModal').addEventListener('click', () => {
  document.getElementById('modalPreflight').classList.remove('active');
});

// Export PDF/HTML Report Logic (Direct Download without popup blocks)
document.getElementById('btnExport').addEventListener('click', () => {
  if (!globalProjectData) return;

  const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KrishnaAI Hackathon Report</title>
  <style>
    body { font-family: sans-serif; color: #111; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; background: #fafafa; }
    h1, h2, h3 { color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;}
    .card { background: #fff; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .tag { display: inline-block; padding: 4px 8px; background: #e2e8f0; border-radius: 4px; font-size: 12px; font-weight: bold;}
    .high-priority { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h1>KrishnaAI — Hackathon Execution Report</h1>
  <p><strong>Winning Probability:</strong> ${globalProjectData.winning_probability || globalProjectData.winProbability || 85}%</p>
  <p><strong>Elevator Pitch:</strong> "${globalProjectData.elevator_pitch || ''}"</p>
  
  <h2>1. Scope & Execution Strategy</h2>
  <div class="card"><p>${(globalProjectData.critiqueText || globalProjectData.scope_review?.reason || '').replace(/<[^>]*>?/gm, '')}</p></div>

  <h2>2. Sprint Plan & Role Allocation</h2>
  ${(globalProjectData.sprintPlan || globalProjectData.sprint_plan || []).map(t => `
    <div class="card">
      <h4 style="margin:0 0 8px;">${t.title} <span class="tag">${t.assignee || 'Team Member'}</span></h4>
      <p style="margin:0;">${t.desc || ''} <em>(${t.phase || t.time || 'Milestone'})</em></p>
    </div>
  `).join('')}

  <h2>3. 5-Judge Simulation Verdict</h2>
  <div class="card">
    <p><strong>Head Judge Verdict:</strong> ${globalProjectData.head_judge?.one_line_verdict || 'A high-impact hackathon tool.'}</p>
    <p><strong>Overall Score:</strong> ${globalProjectData.head_judge?.overall_score || 85.7}/100</p>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlReport], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KrishnaAI_Execution_Report_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ============================================================================
// 🤖 KRISHNA AI COACH CHAT DRAWER UX CONTROLLER
// ============================================================================

const coachToggleBtn = document.getElementById('coachToggleBtn');
const btnToggleCoach = document.getElementById('btnToggleCoach');
const coachChatWindow = document.getElementById('coachChatWindow');
const btnCloseChat = document.getElementById('btnCloseChat');
const chatInput = document.getElementById('chatInput');
const btnSendChat = document.getElementById('btnSendChat');
const chatMessages = document.getElementById('chatMessages');

let isCoachDrawerAnimating = false;

function openCoachChat() {
  if (coachChatWindow.classList.contains('active') || isCoachDrawerAnimating) return;
  isCoachDrawerAnimating = true;

  coachChatWindow.style.display = 'flex';
  coachChatWindow.classList.add('active');

  gsap.fromTo(coachChatWindow, 
    { opacity: 0, y: 30, scale: 0.94 }, 
    { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      duration: 0.35, 
      ease: 'power3.out', 
      onComplete: () => {
        isCoachDrawerAnimating = false;
        if (chatInput) chatInput.focus();
      }
    }
  );
}

function closeCoachChat() {
  if (!coachChatWindow.classList.contains('active') || isCoachDrawerAnimating) return;
  isCoachDrawerAnimating = true;

  gsap.to(coachChatWindow, {
    opacity: 0,
    y: 25,
    scale: 0.94,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: () => {
      coachChatWindow.classList.remove('active');
      coachChatWindow.style.display = 'none';
      isCoachDrawerAnimating = false;
    }
  });
}

function toggleCoachChat(e) {
  if (e) e.stopPropagation();
  if (coachChatWindow.classList.contains('active')) {
    closeCoachChat();
  } else {
    openCoachChat();
  }
}

// 1. Click Outside Listener
document.addEventListener('click', (e) => {
  if (!coachChatWindow || !coachChatWindow.classList.contains('active')) return;

  const isInsideChat = coachChatWindow.contains(e.target);
  const isToggleButton = (coachToggleBtn && coachToggleBtn.contains(e.target)) || 
                         (btnToggleCoach && btnToggleCoach.contains(e.target));
                         
  if (!isInsideChat && !isToggleButton) {
    closeCoachChat();
  }
});

// 2. Escape Key Listener
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && coachChatWindow && coachChatWindow.classList.contains('active')) {
    closeCoachChat();
  }
});

if (coachToggleBtn) coachToggleBtn.addEventListener('click', toggleCoachChat);
if (btnToggleCoach) btnToggleCoach.addEventListener('click', toggleCoachChat);
if (btnCloseChat) {
  btnCloseChat.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCoachChat();
  });
}

if (coachChatWindow) {
  coachChatWindow.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

async function handleSendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.innerText = text;
  chatMessages.appendChild(userDiv);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const coachDiv = document.createElement('div');
  coachDiv.className = 'chat-msg coach';
  coachDiv.innerText = 'Consulting Krishna AI Coach...';
  chatMessages.appendChild(coachDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const context = globalProjectData ? globalProjectData.critiqueText : '';
  const res = await apiCoachChat(text, context);

  let replyText = (res.reply || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  if (res.aiSource) {
    replyText += `<br><span style="font-size:10px; color:var(--text-dimmer); display:block; margin-top:4px;">🤖 Powered by ${res.aiSource}</span>`;
  }
  coachDiv.innerHTML = replyText;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (btnSendChat) btnSendChat.addEventListener('click', handleSendMessage);
if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });
}
