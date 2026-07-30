// App State & Controller
let globalProjectData = null;

// Application Submission & 12-Step Pipeline Execution
document.getElementById('btnSubmit').addEventListener('click', async () => {
  const idea = document.getElementById('mainPrompt').value.trim();
  const stack = document.getElementById('inTech').value.trim();
  const team = document.getElementById('inTeam').value;
  const time = document.getElementById('inTime').value;

  if (!idea) {
    gsap.to('#mainPrompt', { borderColor: 'var(--red)', duration: 0.2, yoyo: true, repeat: 1 });
    return;
  }

  document.getElementById('projTitle').innerText = idea.split(' ').slice(0, 4).join(' ') + '...';

  // Transition View 1 -> View 2 (Loading)
  gsap.to('.init-content', {
    opacity: 0,
    y: -20,
    duration: 0.5,
    onComplete: () => {
      document.getElementById('view-init').classList.remove('active');
      document.getElementById('view-loading').classList.add('active');
      gsap.to('#view-loading', { opacity: 1, duration: 0.4 });
      let tl = gsap.timeline();
      [1, 2, 3, 4].forEach(i => tl.to('#l' + i, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2"));
    }
  });

  // Call API for deep analysis across all 12 steps
  globalProjectData = await apiAnalyzeProject(idea, stack, team, time);
  renderDashboardData(globalProjectData, idea, stack);
});

function renderDashboardData(data, idea, stack) {
  if (!data) return;

  // 1 & 12: Win Probability & Scope Review
  const winProb = data.winning_probability || data.winProbability || 88;
  document.getElementById('winProbDisplay').innerText = `${winProb}%`;
  document.getElementById('winMeterFill').style.width = `${winProb}%`;

  const scope = data.scope_review || {};
  let critiqueHTML = `
    <div class="critique-box">
      <h4>Scope Review — ${scope.status || 'Scope Pruned'}</h4>
      <p>${data.critiqueText || scope.reason || 'Cut secondary features to guarantee core working demo.'}</p>
      <button class="btn-cut" id="cutFatBtn">✂️ 1-Click Cut Scope</button>
    </div>`;

  if (scope.features_to_remove && scope.features_to_remove.length > 0) {
    critiqueHTML += `
      <div class="critique-item red" style="margin-top:10px;">
        <h5 style="color:var(--red);">✂️ Features to Prune immediately:</h5>
        <ul style="margin:4px 0 0; padding-left:18px; font-size:12px; color:var(--text-dim);">
          ${scope.features_to_remove.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>`;
  }
  document.getElementById('scopeCritiqueBody').innerHTML = critiqueHTML;

  // 4 & 5: Sprint Plan & Team Role Allocation
  let planHTML = '';
  const sprintTasks = data.sprintPlan || data.sprint_plan || [];
  sprintTasks.forEach(t => {
    planHTML += `
      <div class="task-item" ${t.isFat ? 'id="bloatTask"' : ''}>
        <div class="task-info">
          <div class="task-head">
            <div style="display:flex; align-items:center; gap:8px;">
              <h4>${t.title}</h4>
              <span class="assignee-badge">${t.assignee || t.phase}</span>
              <span class="priority-badge" style="${t.priority === 'HIGH' ? '' : 'background:rgba(255,255,255,0.1); color:#fff; border-color:transparent;'}">${t.priority || 'HIGH'}</span>
            </div>
            <span class="time-badge ${t.slipping ? 'slipping' : ''}">${t.phase || t.time || 'Hr 0-4'}</span>
          </div>
          <p>${t.desc || 'Core milestone task'}</p>
        </div>
      </div>`;
  });

  if (data.role_allocation) {
    planHTML += `<h5 style="color:var(--purple); margin:12px 0 6px;">👥 Team Member Responsibilities</h5>`;
    data.role_allocation.forEach(r => {
      planHTML += `
        <div class="critique-item" style="margin-bottom:6px;">
          <h5 style="color:var(--blue); margin:0;">${r.role}</h5>
          <p style="font-size:11.5px; margin:2px 0 0;">${r.tasks}</p>
        </div>`;
    });
  }
  document.getElementById('planPanelBody').innerHTML = planHTML;

  // 6 & 8: Risk Detection & Recovery Interventions
  let radarHTML = '';
  const risks = data.risks || data.risk_analysis || [];
  risks.forEach(r => {
    radarHTML += `
      <div class="risk-card ${r.isSlipping || r.impact === 'High' ? 'slipping' : ''}">
        <div class="risk-head">
          <span class="risk-tag ${r.isSlipping || r.impact === 'High' ? 'slipping' : ''}">${r.probability || 'MEDIUM'} RISK</span>
        </div>
        <h4>${r.title || r.risk}</h4>
        <p>${r.desc || `Impact: ${r.impact || 'High'}`}</p>
        <div class="coach-action">${r.action || `> MITIGATION: ${r.mitigation}`}</div>
      </div>`;
  });

  if (data.recoveryPlan) {
    const rec = data.recoveryPlan;
    radarHTML += `
      <div class="recovery-card">
        <h4>🚨 ${rec.headline}</h4>
        <ul>${rec.steps.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>`;
  }
  document.getElementById('radarPanelBody').innerHTML = radarHTML;

  // Architecture & Database Schema
  const arch = data.architecture || { frontend: "Next.js", backend: "Express", database: "Supabase PostgreSQL" };
  let archHTML = `
    <div class="score-card">
      <h3>Architecture Viability</h3>
      <span class="score-val">${data.judge_score?.technical_depth || 85}<span style="font-size:14px; color:var(--text-dimmer);">/100</span></span>
    </div>
    <div class="critique-item">
      <h5 style="color:var(--blue);">Production Tech Stack</h5>
      <p style="font-size:12px; margin:4px 0 0;">Frontend: <strong>${arch.frontend || 'Next.js'}</strong><br>Backend: <strong>${arch.backend || 'Express TypeScript'}</strong><br>Database: <strong>${arch.database || 'Supabase PostgreSQL'}</strong></p>
    </div>`;

  if (data.database_schema) {
    archHTML += `
      <div class="critique-item green">
        <h5 style="color:var(--green);">🗄️ PostgreSQL Database Tables:</h5>
        <ul style="margin:4px 0 0; padding-left:18px; font-size:11.5px; color:var(--text-dim);">
          ${data.database_schema.map(db => `<li>${db}</li>`).join('')}
        </ul>
      </div>`;
  }
  document.getElementById('archPanelBody').innerHTML = archHTML;

  // Pitch Elevator Pitch & Slides
  if (data.elevator_pitch) {
    document.getElementById('elevatorPitchBox').innerHTML = `
      <div class="critique-box" style="background:rgba(76,139,255,0.1); border-color:rgba(76,139,255,0.3);">
        <h4 style="color:var(--blue);">⚡ 15-Second Elevator Pitch Hook</h4>
        <p style="font-size:13px; font-style:italic;">"${data.elevator_pitch}"</p>
      </div>`;
  }
  renderPitchSection(idea, stack);

  // 9: 5-Judge Simulation Panel rendering
  renderFiveJudgesSection(idea, stack);

  // 10: Demo Flow & Backup Fallback Plan Panel
  let demoHTML = '';
  const flow = data.demo_flow || [
    "1. Open active workspace directly in guest mode",
    "2. Enter raw project idea and trigger 12-step pipeline",
    "3. Demonstrate 1-click scope cut and 5-judge simulation panel"
  ];
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

  // 11: Business Model & Future Scope Panel
  let busHTML = '';
  if (data.revenue_model) {
    busHTML += `
      <div class="critique-item green">
        <h5 style="color:var(--green);">💰 Revenue & Pricing Model</h5>
        <ul style="margin:4px 0 0; padding-left:18px; font-size:12px; color:var(--text-dim);">
          ${(data.revenue_model || []).map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>`;
  }
  if (data.competitive_advantage) {
    busHTML += `
      <div class="critique-item" style="margin-top:10px;">
        <h5 style="color:var(--purple);">⚡ Competitive Advantage & USP</h5>
        <ul style="margin:4px 0 0; padding-left:18px; font-size:12px; color:var(--text-dim);">
          ${(data.competitive_advantage || []).map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>`;
  }
  document.getElementById('businessPanelBody').innerHTML = busHTML;

  // Demo Readiness Checklist Modal
  const demoReadiness = data.demoReadiness || {};
  const demoScoreVal = demoReadiness.score || data.demoScore || "8.5";
  document.getElementById('demoScoreDisplay').innerText = String(demoScoreVal).includes('/10') ? demoScoreVal : `${demoScoreVal}/10`;

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

  // Transition View 2 -> View 3 (Dashboard)
  setTimeout(() => {
    gsap.to('#view-loading', {
      opacity: 0, duration: 0.4, onComplete: () => {
        document.getElementById('view-loading').classList.remove('active');
        document.getElementById('view-dash').classList.add('active');
        gsap.to('#view-dash', { opacity: 1, duration: 0.1 });
        gsap.fromTo('.panel-anim', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "cubic-bezier(0.25, 1, 0.5, 1)" });
      }
    });
  }, 1000);
}

// 5-Judge Simulation Panel Rendering Logic
async function renderFiveJudgesSection(idea, stack) {
  const panel = document.getElementById('fiveJudgesPanelBody');
  if (!panel) return;

  panel.innerHTML = `<div class="loader-ring" style="width:30px;height:30px;margin:20px auto;"></div><p style="text-align:center;font-size:12px;color:var(--purple);">Evaluating project with 5 Independent International Judges (Technical, Innovation, Business, UI/UX, Presentation)...</p>`;

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

// File Upload Deck Inspector
const uploadZone = document.getElementById('uploadZone');
const deckFileInput = document.getElementById('deckFileInput');

if (uploadZone && deckFileInput) {
  uploadZone.addEventListener('click', () => deckFileInput.click());
  deckFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        <p style="font-size:11px;">Stack: ${p.stack} | Win: <strong>${p.winProbability}%</strong></p>
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
    document.getElementById('projTitle').innerText = found.idea.split(' ').slice(0, 4).join(' ') + '...';
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

// Export PDF Report logic
document.getElementById('btnExport').addEventListener('click', () => {
  if (!globalProjectData) return;

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>KrishnaAI Hackathon Report</title>
      <style>
        body { font-family: sans-serif; color: #111; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1, h2, h3 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 8px;}
        .card { border: 1px solid #ccc; padding: 16px; margin-bottom: 16px; border-radius: 8px; page-break-inside: avoid; }
        .tag { display: inline-block; padding: 4px 8px; background: #eee; border-radius: 4px; font-size: 12px; font-weight: bold;}
        .high-priority { background: #fee2e2; color: #991b1b; }
        .risk { border-left: 4px solid #ef4444; }
      </style>
    </head>
    <body>
      <h1>KrishnaAI — Production Hackathon Execution Report</h1>
      <p><strong>Winning Probability:</strong> ${globalProjectData.winning_probability || globalProjectData.winProbability || 88}%</p>
      <p><strong>Elevator Pitch:</strong> "${globalProjectData.elevator_pitch || ''}"</p>
      
      <h2>1. Scope & Execution Strategy</h2>
      <div class="card"><p>${(globalProjectData.critiqueText || globalProjectData.scope_review?.reason || '').replace(/<[^>]*>?/gm, '')}</p></div>

      <h2>2. Sprint Plan & Role Allocation</h2>
      ${(globalProjectData.sprintPlan || globalProjectData.sprint_plan || []).map(t => `
        <div class="card">
          <h4 style="margin:0 0 8px;">${t.title} <span class="tag">${t.assignee}</span></h4>
          <p style="margin:0;">${t.desc || ''} <em>(${t.phase || t.time})</em></p>
        </div>
      `).join('')}

      <h2>3. 5-Judge Simulation Verdict</h2>
      <div class="card">
        <p><strong>Head Judge Verdict:</strong> ${globalProjectData.head_judge?.one_line_verdict || 'A high-impact hackathon tool.'}</p>
        <p><strong>Overall Score:</strong> ${globalProjectData.head_judge?.overall_score || 85.7}/100</p>
      </div>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank');
  printWin.document.write(printHtml);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => { printWin.print(); }, 300);
});

// ============================================================================
// 🤖 KRISHNA AI COACH CHAT DRAWER UX CONTROLLER
// Features: Smooth animations, click-outside auto-close, Escape key listener
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

// 1. Click Outside Listener (Auto-Close Drawer)
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

// Prevent click events inside chat window from closing the drawer
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

  let replyText = res.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
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
