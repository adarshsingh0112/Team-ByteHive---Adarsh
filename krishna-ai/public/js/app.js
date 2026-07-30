// ============================================================================
// KRISHNA AI — HACKATHON COMMAND CENTER MAIN CONTROLLER (VERSION B)
// ============================================================================

let currentActiveProject = null;
let countdownSeconds = 24 * 3600;

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCommandPalette();
  initFormListeners();
  initCountdownTimer();
  initJudgeRoom();
  initCoachWarRoom();
  initVaultRoom();
});

// 1. STATION NAVIGATION CONTROLLER
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      switchStation(target);
    });
  });

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}

window.switchStation = function(stationId) {
  const views = document.querySelectorAll('.view');
  const navItems = document.querySelectorAll('.nav-item');
  const titleEl = document.getElementById('viewTitle');

  const targetView = document.getElementById(stationId);
  if (!targetView) return;

  views.forEach(v => v.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));

  targetView.classList.add('active');

  const matchingNav = document.querySelector(`.nav-item[data-target="${stationId}"]`);
  if (matchingNav) matchingNav.classList.add('active');

  const stationTitles = {
    mission: 'Mission Control',
    pitch: 'Pitch Lab',
    judges: 'Judge Room',
    warroom: 'Coach War Room',
    vault: 'Project Vault'
  };

  if (titleEl) titleEl.innerText = stationTitles[stationId] || 'Command Station';

  // Hide Command Palette Modal if open
  const palette = document.getElementById('commandPalette');
  if (palette) palette.classList.remove('active');
};

// 2. COMMAND PALETTE (KEYBOARD SHORTCUTS 1-5, CMD+K)
function initCommandPalette() {
  const palette = document.getElementById('commandPalette');
  const commandBtn = document.getElementById('commandBtn');

  if (commandBtn && palette) {
    commandBtn.addEventListener('click', () => palette.classList.add('active'));
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette) palette.classList.toggle('active');
    } else if (e.key === 'Escape') {
      if (palette) palette.classList.remove('active');
    } else if (!isInputFocused()) {
      if (e.key === '1') switchStation('mission');
      else if (e.key === '2') switchStation('pitch');
      else if (e.key === '3') switchStation('judges');
      else if (e.key === '4') switchStation('warroom');
      else if (e.key === '5') switchStation('vault');
    }
  });
}

function isInputFocused() {
  const active = document.activeElement;
  return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
}

// 3. FORM INPUTS & QUICK SEEDS
function initFormListeners() {
  const ideaArea = document.getElementById('idea');
  const ideaCount = document.getElementById('ideaCount');
  const form = document.getElementById('analyzeForm');
  const quickAnalyzeBtn = document.getElementById('quickAnalyze');

  if (ideaArea && ideaCount) {
    ideaArea.addEventListener('input', () => {
      ideaCount.innerText = `${ideaArea.value.length} chars`;
    });
  }

  if (form) form.addEventListener('submit', handleFormExecution);
  if (quickAnalyzeBtn) {
    quickAnalyzeBtn.addEventListener('click', () => {
      switchStation('mission');
      handleFormExecution();
    });
  }
}

window.seedProject = function(type) {
  const ideaArea = document.getElementById('idea');
  const stackInput = document.getElementById('stack');
  if (!ideaArea) return;

  if (type === 'retail') {
    ideaArea.value = "Autonomous AI Retail Checkout Assistant with zero-wait camera vision and instant micro-payments.";
    if (stackInput) stackInput.value = "Next.js, Python OpenCV, Supabase, Express";
  } else if (type === 'accessibility') {
    ideaArea.value = "Real-time Haptic & Audio Spatial Guidance System for Visually Impaired Hackathon Participants.";
    if (stackInput) stackInput.value = "React Native, WebSockets, Node.js, Web Audio API";
  } else {
    ideaArea.value = "Web3 Cross-chain Game Assets Exchange with gasless meta-transactions and automated vault locking.";
    if (stackInput) stackInput.value = "Solidity, Next.js, Ethers.js, Supabase";
  }

  const ideaCount = document.getElementById('ideaCount');
  if (ideaCount) ideaCount.innerText = `${ideaArea.value.length} chars`;
};

async function handleFormExecution() {
  const idea = document.getElementById('idea').value.trim();
  const stack = document.getElementById('stack').value.trim();
  const team = document.getElementById('team').value;
  const time = document.getElementById('time').value;
  const apiKey = document.getElementById('apiKey') ? document.getElementById('apiKey').value.trim() : '';

  if (!idea) {
    document.getElementById('idea').focus();
    return;
  }

  const btnSubmit = document.querySelector('#analyzeForm button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.innerText = "⏳ Executing Analysis...";
    btnSubmit.disabled = true;
  }

  const data = await apiAnalyzeProject({ idea, stack, team, time, apiKey });

  if (btnSubmit) {
    btnSubmit.innerText = "🚀 Execute Mission Analysis";
    btnSubmit.disabled = false;
  }

  currentActiveProject = { idea, stack, team, time, data };
  renderMissionResults(data);
}

function renderMissionResults(data) {
  const winOdds = data.winOdds || data.winning_probability || 85;

  // Update Ring Meter Score
  const circle = document.getElementById('scoreCircle');
  const scoreValue = document.getElementById('scoreValue');
  if (scoreValue) scoreValue.innerText = `${winOdds}%`;

  if (circle) {
    const circumference = 314;
    const offset = circumference - (winOdds / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  // Update Mini Stats
  const scopeStat = document.getElementById('scopeStat');
  const riskStat = document.getElementById('riskStat');
  const sprintStat = document.getElementById('sprintStat');

  if (scopeStat) scopeStat.innerText = data.scopeReview?.status || "Pruned & Ready";
  if (riskStat) riskStat.innerText = (data.risks || []).length > 1 ? "Medium" : "Low";
  if (sprintStat) sprintStat.innerText = `${(data.sprints || data.sprint_plan || []).length} Sprints`;

  // Update DNA Signal Rails
  const dna = data.missionDna || { buildability: 88, wow: 92, resilience: 85 };
  const buildRail = document.getElementById('buildRail');
  const wowRail = document.getElementById('wowRail');
  const demoRail = document.getElementById('demoRail');

  if (buildRail) buildRail.style.width = `${dna.buildability}%`;
  if (wowRail) wowRail.style.width = `${dna.wow}%`;
  if (demoRail) demoRail.style.width = `${dna.resilience}%`;

  document.getElementById('buildRailVal').innerText = `${dna.buildability}%`;
  document.getElementById('wowRailVal').innerText = `${dna.wow}%`;
  document.getElementById('demoRailVal').innerText = `${dna.resilience}%`;

  // Render Result Cards
  document.getElementById('critique').innerHTML = `<p>${data.critique || data.critiqueText}</p>`;
  if (data.scopeReview) {
    document.getElementById('scopeReview').innerHTML = `<p style="font-size:11.5px; color:var(--cyan); margin-top:4px;"><strong>Status:</strong> ${data.scopeReview.reason}</p>`;
  }

  // Architecture Card
  const arch = data.architecture || {};
  document.getElementById('architecture').innerHTML = `
    <p style="font-size:12px; margin-bottom:8px;">
      Frontend: <strong>${arch.frontend || 'Next.js'}</strong><br>
      Backend: <strong>${arch.backend || 'Express'}</strong><br>
      Database: <strong>${arch.database || 'Supabase PostgreSQL'}</strong>
    </p>
    ${arch.mermaid ? `<div class="mermaid-box" style="margin-top:10px;"><pre class="mermaid">${arch.mermaid}</pre></div>` : ''}
  `;

  if (window.mermaid && arch.mermaid) {
    setTimeout(() => {
      try { window.mermaid.init(undefined, document.querySelectorAll('.mermaid')); } catch (e) {}
    }, 100);
  }

  // Demo Flow Card
  const demoList = data.demoFlow || data.demo_flow || [];
  document.getElementById('demoFlow').innerHTML = `
    <ol style="padding-left:16px; font-size:12px; line-height:1.6; color:var(--text-dim);">
      ${demoList.map(step => `<li>${step}</li>`).join('')}
    </ol>
  `;

  // Sprints Card
  const sprints = data.sprints || data.sprint_plan || [];
  document.getElementById('sprints').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${sprints.map(s => `
        <div style="background:rgba(0,0,0,0.3); padding:8px 10px; border-radius:6px; font-size:11.5px;">
          <div style="display:flex; justify-content:space-between; color:var(--green); font-weight:600;">
            <span>${s.title}</span>
            <span>${s.phase || s.time}</span>
          </div>
          <span style="color:var(--text-dimmer); font-size:10px;">Assignee: ${s.assignee || 'Team Member'}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Failure Modes & Risks Card
  const risks = data.risks || [];
  document.getElementById('risks').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${risks.map(r => `
        <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); padding:8px 10px; border-radius:6px; font-size:11.5px;">
          <strong style="color:var(--orange);">${r.title}</strong>
          <p style="color:var(--text-dim); margin:2px 0;">${r.desc}</p>
          <span style="color:var(--cyan); font-family:var(--font-mono); font-size:10px;">${r.action}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// 4. COUNTDOWN TIMER (24:00:00)
function initCountdownTimer() {
  const timerEl = document.getElementById('timeLeft');
  if (!timerEl) return;

  setInterval(() => {
    if (countdownSeconds > 0) countdownSeconds--;
    const hrs = String(Math.floor(countdownSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((countdownSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(countdownSeconds % 60).padStart(2, '0');
    timerEl.innerText = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// 5. JUDGE ROOM STATION
function initJudgeRoom() {
  const runBtn = document.getElementById('runJudges');
  if (runBtn) {
    runBtn.addEventListener('click', async () => {
      const idea = document.getElementById('idea') ? document.getElementById('idea').value : 'Hackathon Project';
      const stack = document.getElementById('stack') ? document.getElementById('stack').value : 'React, Node';
      
      const container = document.getElementById('judgesContainer');
      if (container) container.innerHTML = `<div class="loader-ring" style="width:30px;height:30px;margin:20px auto;"></div><p style="text-align:center;font-size:12px;color:var(--purple);">Evaluating project with 5 Independent International Judges...</p>`;

      const data = await apiSimulate5Judges({ project_name: idea.substring(0, 30), problem_statement: idea, tech_stack: stack });
      if (!data) return;

      const t = data.technical_judge || { score: 84 };
      const i = data.innovation_judge || { score: 88 };
      const b = data.business_judge || { score: 82 };
      const u = data.uiux_judge || { score: 90 };
      const p = data.presentation_judge || { score: 87 };
      const h = data.head_judge || { overall_score: 85.7, winning_probability: 86 };

      let html = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
          <div style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(76,139,255,0.15)); border: 1px solid rgba(168,85,247,0.3); border-radius:14px; padding:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <span style="font-family:'DM Mono'; font-size:11px; color:var(--purple);">👑 HEAD JUDGE VERDICT</span>
              <h3 style="margin:4px 0 2px; font-size:18px;">"${h.one_line_verdict || "A high-impact hackathon tool."}"</h3>
              <p style="margin:0; font-size:12px; color:var(--text-dim);">Status: <strong>${h.project_status || 'Top Contender'}</strong></p>
            </div>
            <div style="text-align:right;">
              <h1 style="margin:0; font-size:32px; color:var(--cyan);">${h.overall_score || 85.7}<span style="font-size:14px; color:var(--text-dimmer);">/100</span></h1>
              <p style="margin:0; font-size:11px; color:var(--green); font-family:'DM Mono';">Win Prob: ${h.winning_probability || 86}%</p>
            </div>
          </div>

          <div class="command-card">
            <h5 style="color:var(--blue); margin-bottom:6px;">💻 Technical Judge (30%) — ${t.score}/100</h5>
            <p style="font-size:11.5px;"><strong>Strengths:</strong> ${(t.strengths || []).join(', ')}</p>
            <p style="font-size:11.5px; color:var(--red);"><strong>Weakness:</strong> ${(t.weaknesses || []).join(', ')}</p>
          </div>

          <div class="command-card">
            <h5 style="color:var(--purple); margin-bottom:6px;">💡 Innovation Judge (20%) — ${i.score}/100</h5>
            <p style="font-size:11.5px;"><strong>Strengths:</strong> ${(i.strengths || []).join(', ')}</p>
            <p style="font-size:11.5px; color:var(--orange);"><strong>Weakness:</strong> ${(i.weaknesses || []).join(', ')}</p>
          </div>

          <div class="command-card">
            <h5 style="color:var(--green); margin-bottom:6px;">💼 Business Judge (20%) — ${b.score}/100</h5>
            <p style="font-size:11.5px;"><strong>Strengths:</strong> ${(b.strengths || []).join(', ')}</p>
            <p style="font-size:11.5px; color:var(--orange);"><strong>Weakness:</strong> ${(b.weaknesses || []).join(', ')}</p>
          </div>

          <div class="command-card">
            <h5 style="color:var(--cyan); margin-bottom:6px;">🎨 UI/UX Judge (10%) — ${u.score}/100</h5>
            <p style="font-size:11.5px;"><strong>Strengths:</strong> ${(u.strengths || []).join(', ')}</p>
            <p style="font-size:11.5px; color:var(--orange);"><strong>Weakness:</strong> ${(u.weaknesses || []).join(', ')}</p>
          </div>

          <div class="command-card">
            <h5 style="color:var(--orange); margin-bottom:6px;">🎤 Presentation Judge (20%) — ${p.score}/100</h5>
            <p style="font-size:11.5px;"><strong>Strengths:</strong> ${(p.strengths || []).join(', ')}</p>
            <p style="font-size:11.5px; color:var(--red);"><strong>Weakness:</strong> ${(p.weaknesses || []).join(', ')}</p>
          </div>
        </div>
      `;

      if (container) container.innerHTML = html;
    });
  }
}

// 6. COACH WAR ROOM CHAT
function initCoachWarRoom() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatMessage');
  const log = document.getElementById('chatLog');

  if (form && input && log) {
    form.addEventListener('submit', async () => {
      const msg = input.value.trim();
      if (!msg) return;

      const userDiv = document.createElement('div');
      userDiv.className = 'chat-msg user';
      userDiv.innerText = msg;
      log.appendChild(userDiv);
      input.value = '';
      log.scrollTop = log.scrollHeight;

      const coachDiv = document.createElement('div');
      coachDiv.className = 'chat-msg coach';
      coachDiv.innerText = 'Consulting Krishna AI Coach...';
      log.appendChild(coachDiv);
      log.scrollTop = log.scrollHeight;

      const context = currentActiveProject ? currentActiveProject.idea : '';
      const res = await apiCoachChat(msg, context);

      coachDiv.innerHTML = (res.reply || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      log.scrollTop = log.scrollHeight;
    });
  }
}

// 7. PROJECT VAULT
function initVaultRoom() {
  const refreshBtn = document.getElementById('refreshProjects');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadVaultGrid);
  }
}

async function loadVaultGrid() {
  const grid = document.getElementById('vaultGrid');
  if (!grid) return;

  grid.innerHTML = `<p class="placeholder-text">Loading saved project snapshots...</p>`;
  const projects = await apiFetchSavedProjects();

  if (!projects || projects.length === 0) {
    grid.innerHTML = `<p class="placeholder-text">No saved project snapshots yet. Submit a project in Mission Control!</p>`;
    return;
  }

  let html = '';
  projects.forEach(p => {
    html += `
      <div class="command-card" style="margin-bottom:12px;">
        <h4 style="color:var(--cyan); font-size:14px; margin-bottom:4px;">${(p.idea || 'Project').substring(0, 40)}...</h4>
        <p style="font-size:11.5px; color:var(--text-dim);">Stack: ${p.stack || 'General'} | Win Odds: <strong style="color:var(--green);">${p.winProbability || 85}%</strong></p>
      </div>`;
  });
  grid.innerHTML = html;
}
