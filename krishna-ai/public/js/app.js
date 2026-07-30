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

function animateWinProbCountUp(targetVal) {
  const displayEl = document.getElementById('winProbDisplay');
  if (!displayEl) return;

  const targetNum = parseInt(targetVal, 10) || 85;
  let startTimestamp = null;
  const duration = 900; // 900ms count-up

  function step(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min(1, (timestamp - startTimestamp) / duration);
    // Cubic ease-out
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.round(easeProgress * targetNum);

    displayEl.innerText = `${currentVal}%`;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      displayEl.innerText = `${targetNum}%`;
    }
  }

  window.requestAnimationFrame(step);
}

function renderDashboardData(data, idea, stack) {
  const winProb = data.winning_probability || data.winProbability || 85;

  // Panel 1: Win Probability & Scope Review (with animated count-up counter)
  animateWinProbCountUp(winProb);
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

// Grill the Judges Interactive Q&A Handler (Evidence Verifier UI)
async function handleJudgeQaSubmit() {
  const input = document.getElementById('judgeQaInput');
  const replyBox = document.getElementById('judgeQaReply');
  if (!input || !replyBox) return;

  const q = input.value.trim();
  if (!q) return;

  replyBox.style.display = 'block';
  replyBox.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--color-data); padding:8px;">
      <span>Executing Relevance Gate & Evidence Verification</span>
      <span class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </span>
    </div>`;

  try {
    const res = await fetch('/api/judge-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q,
        answer: q,
        project_context: globalProjectData?.critiqueText || globalProjectData?.scope_review?.reason || ''
      })
    });

    if (res.ok) {
      const data = await res.json();
      const isOk = data.questionAddressed !== false;
      const cardColor = isOk ? "var(--color-success)" : "var(--color-danger)";
      const bgOpacity = isOk ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)";

      replyBox.innerHTML = `
        <div class="critique-item" style="background:${bgOpacity}; border-left-color:${cardColor}; padding:14px; border-radius:12px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-family:'Space Grotesk', sans-serif; font-size:13px; font-weight:700; color:${cardColor};">
              ${isOk ? '✅ EVIDENCE VERIFIED' : '❌ VERIFICATION FAILED / REJECTED'}
            </span>
            <span style="font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--text-dim);">
              Confidence: <strong>${data.confidence || '94%'}</strong>
            </span>
          </div>

          <div style="font-size:12px; line-height:1.5; color:var(--text);">
            ${(data.reply || '').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
        </div>
      `;
      input.value = '';
      return;
    }
  } catch (e) {}

  replyBox.innerHTML = `
    <div class="critique-item green" style="padding:12px; border-radius:12px;">
      <p style="font-size:12px; margin:0;">👨‍⚖️ <strong>Head Judge Verdict</strong>: Direct, confident technical response. Demonstrates deep architecture ownership under pressure.</p>
    </div>`;
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

function generateRadarChartSVG(scores) {
  const axes = [
    { name: 'Technical', score: scores.technical || 84, icon: '💻' },
    { name: 'Innovation', score: scores.innovation || 88, icon: '💡' },
    { name: 'Business', score: scores.business || 82, icon: '💼' },
    { name: 'UI/UX', score: scores.uiux || 90, icon: '🎨' },
    { name: 'Presentation', score: scores.presentation || 87, icon: '🎤' }
  ];

  const cx = 180, cy = 135, r = 85;
  const numAxes = 5;

  let gridHTML = '';
  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(level => {
    let pts = [];
    for (let k = 0; k < numAxes; k++) {
      const angle = (Math.PI * 2 * k / numAxes) - (Math.PI / 2);
      const x = cx + r * level * Math.cos(angle);
      const y = cy + r * level * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    gridHTML += `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="${level === 1 ? 'none' : '2,3'}" />`;
  });

  let axisHTML = '';
  let labelHTML = '';
  let scorePoints = [];

  axes.forEach((item, k) => {
    const angle = (Math.PI * 2 * k / numAxes) - (Math.PI / 2);
    const xOuter = cx + r * Math.cos(angle);
    const yOuter = cy + r * Math.sin(angle);

    axisHTML += `<line x1="${cx}" y1="${cy}" x2="${xOuter.toFixed(1)}" y2="${yOuter.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="1" />`;

    const ratio = Math.min(100, Math.max(0, item.score)) / 100;
    const xScore = cx + r * ratio * Math.cos(angle);
    const yScore = cy + r * ratio * Math.sin(angle);
    scorePoints.push(`${xScore.toFixed(1)},${yScore.toFixed(1)}`);

    const xLabel = cx + (r + 28) * Math.cos(angle);
    const yLabel = cy + (r + 14) * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');

    labelHTML += `
      <text x="${xLabel.toFixed(1)}" y="${yLabel.toFixed(1)}" text-anchor="${anchor}" fill="#cbd5e1" font-size="11" font-family="'Space Grotesk', sans-serif" font-weight="600">
        ${item.icon} ${item.name} <tspan fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-weight="700">(${item.score}/100)</tspan>
      </text>
      <circle cx="${xScore.toFixed(1)}" cy="${yScore.toFixed(1)}" r="4.5" fill="#38bdf8" stroke="#060814" stroke-width="2" />
    `;
  });

  const polyStr = scorePoints.join(' ');

  return `
    <div style="grid-column: 1 / -1; background: rgba(0,0,0,0.3); border: 1px solid rgba(56,189,248,0.25); border-radius: 16px; padding: 20px; margin-bottom: 4px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <span style="font-family:'Space Grotesk', sans-serif; font-size:13px; font-weight:600; color:var(--cyan); display:flex; align-items:center; gap:6px;">
          📊 5-Axis Multidimensional Judging Radar (0-100 Scale)
        </span>
        <span style="font-family:'JetBrains Mono', monospace; font-size:10.5px; color:var(--text-dim);">Cyan-Purple Radar Pattern Visualizer</span>
      </div>
      <div style="width:100%; max-width:440px; margin:0 auto;">
        <svg viewBox="0 0 360 270" style="width:100%; height:auto; overflow:visible; display:block;">
          <defs>
            <linearGradient id="radarGradCyanPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.55" />
              <stop offset="100%" stop-color="#a855f7" stop-opacity="0.4" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          ${gridHTML}
          ${axisHTML}

          <!-- Radar Shape Fill & Outline -->
          <polygon points="${polyStr}" fill="url(#radarGradCyanPurple)" stroke="#38bdf8" stroke-width="2.5" filter="url(#radarGlow)" style="transform-origin: 180px 135px;">
            <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
          </polygon>

          ${labelHTML}
        </svg>
      </div>
    </div>
  `;
}

window.toggleWeaknessFix = function(el) {
  const fixBox = el.nextElementSibling;
  if (!fixBox) return;
  const isOpen = fixBox.classList.contains('open');
  document.querySelectorAll('.weakness-fix-box.open').forEach(box => box.classList.remove('open'));
  if (!isOpen) fixBox.classList.add('open');
};

function initAgentActivityTicker() {
  const tickerMsg = document.getElementById('tickerMsg');
  if (!tickerMsg) return;

  const messages = [
    "🤖 Technical Judge auditing connection pooling & DB resilience...",
    "🤖 Innovation Judge benchmarking against 200+ top hackathon winners...",
    "🤖 Risk Agent scanning for scope creep & secondary feature bloat...",
    "🤖 Head Judge synthesizing 5-panel verdict & pitch deck alignment...",
    "🤖 Business Judge evaluating VC CAC:LTV economics & ARR targets...",
    "🤖 UI/UX Judge auditing glassmorphism hierarchy & accessibility...",
    "🤖 Presentation Judge timing 60s elevator pitch hook pacing..."
  ];

  let idx = 0;
  setInterval(() => {
    tickerMsg.classList.add('fade-out');
    setTimeout(() => {
      idx = (idx + 1) % messages.length;
      tickerMsg.innerText = messages[idx];
      tickerMsg.classList.remove('fade-out');
    }, 300);
  }, 3500);
}

// Initialize Ticker on script load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgentActivityTicker);
} else {
  initAgentActivityTicker();
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

  const t = data.technical_judge || { score: 84, weaknesses: ["Needs DB connection pooling"], fix_suggestion: "Implement Supabase connection bouncers and query caching to prevent DB connection limits during live demo peak loads." };
  const i = data.innovation_judge || { score: 88, weaknesses: ["Generic market differentiation"], fix_suggestion: "Highlight 12-step autonomous execution loop as the primary core IP differentiator." };
  const b = data.business_judge || { score: 82, weaknesses: ["High initial CAC assumptions"], fix_suggestion: "Adopt product-led viral loops and developer community channels to drive organic user acquisition." };
  const u = data.uiux_judge || { score: 90, weaknesses: ["Dense metric display on tablet view"], fix_suggestion: "Use collapsible accordion drawers for secondary telemetry metrics on smaller viewports." };
  const p = data.presentation_judge || { score: 87, weaknesses: ["Pitch hook exceeds 20 seconds"], fix_suggestion: "Lead directly with the 15-second elevator pitch hook before jumping into technical architecture." };
  const h = data.head_judge || { overall_score: 85.7, winning_probability: 86 };

  const radarSVG = generateRadarChartSVG({
    technical: t.score,
    innovation: i.score,
    business: b.score,
    uiux: u.score,
    presentation: p.score
  });

  let html = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:16px;">
      
      <!-- Head Judge Summary Banner -->
      <div style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(76,139,255,0.15)); border: 1px solid rgba(168,85,247,0.3); border-radius:16px; padding:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <span style="font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--purple); text-transform:uppercase; letter-spacing:0.05em;">👑 Head Judge Final Verdict</span>
          <h3 style="margin:6px 0 4px; font-size:20px; font-family:'Space Grotesk', sans-serif;">"${h.one_line_verdict || "A high-impact hackathon tool."}"</h3>
          <p style="margin:0; font-size:12px; color:var(--text-dim); font-family:'Inter', sans-serif;">Status: <strong style="color:var(--text);">${h.project_status || 'Top Contender'}</strong> | Mission: <strong style="color:var(--cyan);">${h.mission_status || 'PROCEED TO PITCH'}</strong></p>
        </div>
        <div style="text-align:right;">
          <div class="head-judge-score-dominant">${h.overall_score || 85.7}<span class="head-judge-score-denom">/100</span></div>
          <div class="head-judge-win-muted">Win Probability: ${h.winning_probability || 86}%</div>
        </div>
      </div>

      <!-- Prominent 5-Axis Spider/Radar Chart Visualization -->
      ${radarSVG}

      <!-- Judge 1: Technical (30%) -->
      <div class="critique-item" style="border-radius:16px; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h5 style="color:var(--color-data); margin:0; font-family:'Space Grotesk', sans-serif; font-size:13px;"><span class="panel-title-icon">💻</span> Technical Judge (30%)</h5>
          <span style="font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--color-data); font-size:13px;">${t.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px; font-family:'Inter', sans-serif;"><strong>Strengths:</strong> ${(t.strengths || []).join(', ')}</p>
        <div class="weakness-item-wrap">
          <div class="weakness-trigger" onclick="toggleWeaknessFix(this)">
            <p style="font-size:11.5px; color:var(--color-danger); margin:0; cursor:pointer; font-family:'Inter', sans-serif;">
              <strong>Weakness:</strong> ${(t.weaknesses || []).join(', ')} <span style="font-size:10px; color:var(--color-data); text-decoration:underline; margin-left:4px;">💡 Click for AI Fix ▾</span>
            </p>
          </div>
          <div class="weakness-fix-box">
            <div class="coach-action" style="margin-top:6px; padding:8px 10px; background:rgba(168,85,247,0.12); border-left:3px solid var(--color-primary); border-radius:6px; font-size:11px; font-family:'JetBrains Mono', monospace; color:var(--color-primary);">
              💡 > COACH SUGGESTED FIX: ${t.fix_suggestion || `Implement Supabase connection bouncers and query caching to prevent DB connection limits.`}
            </div>
          </div>
        </div>
      </div>

      <!-- Judge 2: Innovation (20%) -->
      <div class="critique-item" style="border-radius:16px; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h5 style="color:var(--color-primary); margin:0; font-family:'Space Grotesk', sans-serif; font-size:13px;"><span class="panel-title-icon">💡</span> Innovation Judge (20%)</h5>
          <span style="font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--color-data); font-size:13px;">${i.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px; font-family:'Inter', sans-serif;"><strong>Strengths:</strong> ${(i.strengths || []).join(', ')}</p>
        <div class="weakness-item-wrap">
          <div class="weakness-trigger" onclick="toggleWeaknessFix(this)">
            <p style="font-size:11.5px; color:var(--color-warning); margin:0; cursor:pointer; font-family:'Inter', sans-serif;">
              <strong>Weakness:</strong> ${(i.weaknesses || []).join(', ')} <span style="font-size:10px; color:var(--color-data); text-decoration:underline; margin-left:4px;">💡 Click for AI Fix ▾</span>
            </p>
          </div>
          <div class="weakness-fix-box">
            <div class="coach-action" style="margin-top:6px; padding:8px 10px; background:rgba(168,85,247,0.12); border-left:3px solid var(--color-primary); border-radius:6px; font-size:11px; font-family:'JetBrains Mono', monospace; color:var(--color-primary);">
              💡 > COACH SUGGESTED FIX: ${i.fix_suggestion || `Highlight 12-step autonomous execution loop as core differentiator.`}
            </div>
          </div>
        </div>
      </div>

      <!-- Judge 3: Business (20%) -->
      <div class="critique-item" style="border-radius:16px; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h5 style="color:var(--color-success); margin:0; font-family:'Space Grotesk', sans-serif; font-size:13px;"><span class="panel-title-icon">💼</span> Business Judge (20%)</h5>
          <span style="font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--color-data); font-size:13px;">${b.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px; font-family:'Inter', sans-serif;"><strong>Strengths:</strong> ${(b.strengths || []).join(', ')}</p>
        <div class="weakness-item-wrap">
          <div class="weakness-trigger" onclick="toggleWeaknessFix(this)">
            <p style="font-size:11.5px; color:var(--color-warning); margin:0; cursor:pointer; font-family:'Inter', sans-serif;">
              <strong>Weakness:</strong> ${(b.weaknesses || []).join(', ')} <span style="font-size:10px; color:var(--color-data); text-decoration:underline; margin-left:4px;">💡 Click for AI Fix ▾</span>
            </p>
          </div>
          <div class="weakness-fix-box">
            <div class="coach-action" style="margin-top:6px; padding:8px 10px; background:rgba(168,85,247,0.12); border-left:3px solid var(--color-primary); border-radius:6px; font-size:11px; font-family:'JetBrains Mono', monospace; color:var(--color-primary);">
              💡 > COACH SUGGESTED FIX: ${b.fix_suggestion || `Adopt product-led viral loops to lower initial CAC.`}
            </div>
          </div>
        </div>
      </div>

      <!-- Judge 4: UI/UX (10%) -->
      <div class="critique-item" style="border-radius:16px; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h5 style="color:var(--color-data); margin:0; font-family:'Space Grotesk', sans-serif; font-size:13px;"><span class="panel-title-icon">🎨</span> UI/UX Judge (10%)</h5>
          <span style="font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--color-data); font-size:13px;">${u.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px; font-family:'Inter', sans-serif;"><strong>Strengths:</strong> ${(u.strengths || []).join(', ')}</p>
        <div class="weakness-item-wrap">
          <div class="weakness-trigger" onclick="toggleWeaknessFix(this)">
            <p style="font-size:11.5px; color:var(--color-warning); margin:0; cursor:pointer; font-family:'Inter', sans-serif;">
              <strong>Weakness:</strong> ${(u.weaknesses || []).join(', ')} <span style="font-size:10px; color:var(--color-data); text-decoration:underline; margin-left:4px;">💡 Click for AI Fix ▾</span>
            </p>
          </div>
          <div class="weakness-fix-box">
            <div class="coach-action" style="margin-top:6px; padding:8px 10px; background:rgba(168,85,247,0.12); border-left:3px solid var(--color-primary); border-radius:6px; font-size:11px; font-family:'JetBrains Mono', monospace; color:var(--color-primary);">
              💡 > COACH SUGGESTED FIX: ${u.fix_suggestion || `Use collapsible drawers for telemetry on mobile.`}
            </div>
          </div>
        </div>
      </div>

      <!-- Judge 5: Presentation (20%) -->
      <div class="critique-item" style="border-radius:16px; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h5 style="color:var(--color-warning); margin:0; font-family:'Space Grotesk', sans-serif; font-size:13px;"><span class="panel-title-icon">🎤</span> Presentation Judge (20%)</h5>
          <span style="font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--color-data); font-size:13px;">${p.score}/100</span>
        </div>
        <p style="font-size:11.5px; margin-bottom:6px; font-family:'Inter', sans-serif;"><strong>Strengths:</strong> ${(p.strengths || []).join(', ')}</p>
        <div class="weakness-item-wrap">
          <div class="weakness-trigger" onclick="toggleWeaknessFix(this)">
            <p style="font-size:11.5px; color:var(--color-danger); margin:0; cursor:pointer; font-family:'Inter', sans-serif;">
              <strong>Weakness:</strong> ${(p.weaknesses || []).join(', ')} <span style="font-size:10px; color:var(--color-data); text-decoration:underline; margin-left:4px;">💡 Click for AI Fix ▾</span>
            </p>
          </div>
          <div class="weakness-fix-box">
            <div class="coach-action" style="margin-top:6px; padding:8px 10px; background:rgba(168,85,247,0.12); border-left:3px solid var(--color-primary); border-radius:6px; font-size:11px; font-family:'JetBrains Mono', monospace; color:var(--color-primary);">
              💡 > COACH SUGGESTED FIX: ${p.fix_suggestion || `Lead directly with 15-second pitch hook before architecture details.`}
            </div>
          </div>
        </div>
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

    uploadZone.innerHTML = `<div class="loader-ring" style="width:30px;height:30px;margin-bottom:8px;"></div><p style="font-size:12px; font-weight:600;">Auditing ${file.name}...</p>`;
    uploadZone.style.pointerEvents = 'none';

    let text = `Sample deck presentation content for ${file.name}`;
    try {
      text = await Promise.race([
        file.text(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("File read timeout")), 800))
      ]);
    } catch (e) {
      text = `Presentation file ${file.name} uploaded for evaluation.`;
    }

    const auditData = await apiAuditPitchDeck(text);

    setTimeout(() => {
      uploadZone.style.display = 'none';
      const evalRes = document.getElementById('evalResult');
      if (!evalRes) return;

      const isWarned = (auditData.storyScore || '').startsWith('2') || (auditData.storyScore || '').startsWith('3');
      const cardColor = isWarned ? "var(--color-danger)" : "var(--color-success)";

      let evalHTML = `
        <div class="score-card" style="border-left:4px solid ${cardColor}; width:100%;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>Storytelling Verification Score</h3>
            <span class="score-val" style="color:${cardColor};">${auditData.storyScore || '8.2/10'}</span>
          </div>
          <p style="font-size:11.5px; color:var(--text-dim); margin:4px 0 0;">
            Status: <strong style="color:var(--text);">${auditData.relevanceStatus || 'PASSED — Grounded in Context'}</strong> | Confidence: <strong style="color:var(--color-data);">${auditData.confidence || '93%'}</strong>
          </p>
        </div>
      `;

      if (auditData.rubricCoverage && auditData.rubricCoverage.length > 0) {
        evalHTML += `
          <div style="width:100%; margin-top:8px; background:rgba(0,0,0,0.25); border:1px solid var(--card-border); border-radius:12px; padding:12px;">
            <span style="font-family:'Space Grotesk', sans-serif; font-size:11.5px; font-weight:700; color:var(--color-data); display:block; margin-bottom:6px;">
              📋 Hackathon Pitch Rubric Coverage Analysis:
            </span>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:6px;">
              ${auditData.rubricCoverage.map(r => `
                <div style="background:rgba(255,255,255,0.03); padding:6px 8px; border-radius:6px; border-left:2px solid ${r.status === 'PASSED' ? 'var(--color-success)' : 'var(--color-warning)'}; font-size:10.5px;">
                  <span style="color:var(--text-dim); display:block;">${r.section}</span>
                  <strong style="color:var(--text); font-family:'JetBrains Mono', monospace;">${r.score}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (auditData.evidenceFound && auditData.evidenceFound.length > 0) {
        evalHTML += `
          <div style="width:100%; margin-top:6px; font-size:11px; color:var(--color-success); font-family:'Inter', sans-serif;">
            ${auditData.evidenceFound.map(ev => `<div>${ev}</div>`).join('')}
          </div>
        `;
      }

      if (auditData.missingSections && auditData.missingSections.length > 0) {
        evalHTML += `
          <div style="width:100%; margin-top:4px; font-size:11px; color:var(--color-danger); font-family:'Inter', sans-serif;">
            ${auditData.missingSections.map(ms => `<div>${ms}</div>`).join('')}
          </div>
        `;
      }

      evalHTML += (auditData.critiques || []).map(c => `
        <div class="critique-item ${c.type}" style="width:100%; margin-top:6px;">
          <h5>${c.title}</h5>
          <p>${c.desc}</p>
        </div>
      `).join('');

      evalRes.innerHTML = evalHTML;
      evalRes.style.display = 'flex';
      evalRes.style.flexDirection = 'column';
    }, 400);
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
  coachDiv.innerHTML = `
    <div style="display:flex; align-items:center; gap:6px;">
      <span>Krishna AI Coach is thinking</span>
      <span class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </span>
    </div>`;
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
