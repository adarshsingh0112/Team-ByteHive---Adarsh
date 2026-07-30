// App State & Controller
let globalProjectData = null;

// API Key UI Badge updates
const apiKeyInput = document.getElementById('apiKeyInput');
const apiStatusBadge = document.getElementById('apiStatusBadge');

if (apiKeyInput) {
  apiKeyInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.startsWith('sk-')) {
      apiStatusBadge.className = "api-status live";
      apiStatusBadge.innerHTML = `🟢 Mode: Live OpenAI API (ChatGPT)`;
    } else if (val.length > 15) {
      apiStatusBadge.className = "api-status live";
      apiStatusBadge.innerHTML = `🟢 Mode: Live Gemini API`;
    } else {
      apiStatusBadge.className = "api-status mock";
      apiStatusBadge.innerHTML = `⚙️ Mode: Smart Backend Engine`;
    }
  });
}

// Application Submission & 11-Step Pipeline Execution
document.getElementById('btnSubmit').addEventListener('click', async () => {
  const idea = document.getElementById('mainPrompt').value.trim();
  const stack = document.getElementById('inTech').value.trim();
  const team = document.getElementById('inTeam').value;
  const time = document.getElementById('inTime').value;
  const apiKey = apiKeyInput.value.trim();

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

  // Call API for deep analysis across all 11 steps
  globalProjectData = await apiAnalyzeProject(idea, stack, team, time, apiKey);
  renderDashboardData(globalProjectData, idea, stack, apiKey);
});

function renderDashboardData(data, idea, stack, apiKey) {
  // 1 & 11: Win Probability & Scope Critique Panel
  const winProb = data.winProbability || 88;
  document.getElementById('winProbDisplay').innerText = `${winProb}%`;
  document.getElementById('winMeterFill').style.width = `${winProb}%`;

  let critiqueHTML = `
    <div class="critique-box">
      <h4>Scope & Execution Review</h4>
      <p>${data.critiqueText}</p>
      <button class="btn-cut" id="cutFatBtn">✂️ 1-Click Cut Scope</button>
    </div>`;
  document.getElementById('scopeCritiqueBody').innerHTML = critiqueHTML;

  // 3 & 4: Sprint Plan & Team Role Allocation Panel
  let planHTML = '';
  const sprintTasks = data.sprintPlan || data.tasks || [];
  sprintTasks.forEach(t => {
    planHTML += `
      <div class="task-item" ${t.isFat ? 'id="bloatTask"' : ''}>
        <div class="task-info">
          <div class="task-head">
            <div style="display:flex; align-items:center; gap:8px;">
              <h4>${t.title}</h4>
              <span class="assignee-badge">${t.assignee || t.phase}</span>
              <span class="priority-badge" style="${t.priority === 'HIGH' ? '' : 'background:rgba(255,255,255,0.1); color:#fff; border-color:transparent;'}">${t.priority}</span>
            </div>
            <span class="time-badge ${t.slipping ? 'slipping' : ''}" ${t.isFat ? 'style="color:var(--red);"' : ''}>${t.time || t.phase}</span>
          </div>
          <p>${t.desc}</p>
        </div>
      </div>`;
  });
  document.getElementById('planPanelBody').innerHTML = planHTML;

  // 5, 6, 7: Risk Detection, Active Interventions & Recovery Plan
  let radarHTML = '';
  (data.risks || []).forEach(r => {
    radarHTML += `
      <div class="risk-card ${r.isSlipping ? 'slipping' : ''}">
        <div class="risk-head">
          <span class="risk-tag ${r.isSlipping ? 'slipping' : ''}">${r.isSlipping ? 'VELOCITY RISK' : 'TECHNICAL BLOCKER'}</span>
        </div>
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
        <div class="coach-action">${r.action}</div>
      </div>`;
  });

  if (data.recoveryPlan) {
    const rec = data.recoveryPlan;
    radarHTML += `
      <div class="recovery-card">
        <h4>🚨 ${rec.headline}</h4>
        <ul>
          ${rec.steps.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>`;
  }
  document.getElementById('radarPanelBody').innerHTML = radarHTML;

  // Architecture Panel
  const arch = data.architecture || { score: 8.5, feedback: "Solid stack.", missing: [] };
  let archHTML = `
    <div class="score-card">
      <h3>Architecture Score</h3>
      <span class="score-val">${arch.score}<span style="font-size:14px; color:var(--text-dimmer);">/10</span></span>
    </div>
    <div class="critique-item">
      <h5 style="color:var(--blue);">System Architecture Feedback</h5>
      <p>${arch.feedback}</p>
    </div>
    <div class="critique-item red">
      <h5 style="color:var(--red);">Missing Infrastructure</h5>
      <ul style="margin:4px 0 0; padding-left:18px; font-size:12px; color:var(--text-dim);">
        ${(arch.missing || []).map(m => `<li>${m}</li>`).join('')}
      </ul>
    </div>`;
  document.getElementById('archPanelBody').innerHTML = archHTML;

  // 8: PPT & Pitch Script Generator
  renderPitchSection(idea, stack, apiKey);

  // 9: Simulated Judges Panel
  const judgeSim = data.judgeSimulation || data.judgeFeedback || {};
  let judgeHTML = `
    <div class="critique-item green">
      <h5 style="color:var(--green);">Judge Perspective Rating</h5>
      <p>${judgeSim.feedback || judgeSim.overall || "Strong project outline."}</p>
    </div>`;

  if (judgeSim.sampleQuestions) {
    judgeHTML += `<div class="qa-box"><h5 style="color:var(--purple); margin-top:4px;">Q&A Defense Preparation:</h5>`;
    judgeSim.sampleQuestions.forEach(item => {
      judgeHTML += `
        <div class="qa-item">
          <h5>❓ "${item.q}"</h5>
          <p>👉 <strong>Model Answer:</strong> ${item.a}</p>
        </div>`;
    });
    judgeHTML += `</div>`;
  }
  document.getElementById('judgePanelBody').innerHTML = judgeHTML;

  // 10: Demo Readiness Checklist
  const demoReadiness = data.demoReadiness || {};
  const demoScoreVal = demoReadiness.score || data.demoScore || "8.5";
  document.getElementById('demoScoreDisplay').innerText = String(demoScoreVal).includes('/10') ? demoScoreVal : `${demoScoreVal}/10`;

  let chkHTML = '';
  const chkList = demoReadiness.checklist || data.checklist || [];
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
    const apiKey = apiKeyInput.value.trim();
    const auditData = await apiAuditPitchDeck(text, apiKey);

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
        <h5 style="color:var(--cyan);">${p.idea.substring(0, 32)}...</h5>
        <p style="font-size:11px;">Stack: ${p.stack} | Win: <strong>${p.winProbability}%</strong></p>
      </div>`;
  });
  historyList.innerHTML = html;
}

if (btnToggleHistory) {
  btnToggleHistory.addEventListener('click', () => {
    historyDrawer.classList.toggle('active');
    if (historyDrawer.classList.contains('active')) loadHistoryList();
  });
}
if (btnCloseHistory) btnCloseHistory.addEventListener('click', () => historyDrawer.classList.remove('active'));

window.loadSavedProject = async function(id) {
  const projects = await apiFetchSavedProjects();
  const found = projects.find(p => p.id === id);
  if (found && found.data) {
    globalProjectData = found.data;
    document.getElementById('projTitle').innerText = found.idea.split(' ').slice(0, 4).join(' ') + '...';
    document.getElementById('view-init').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    renderDashboardData(found.data, found.idea, found.stack, apiKeyInput.value.trim());
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
      <p><strong>Winning Probability:</strong> ${globalProjectData.winProbability || 88}%</p>
      <p><strong>Predicted Demo Score:</strong> ${globalProjectData.demoScore || 8.7}/10</p>
      
      <h2>1. Scope & Execution Strategy</h2>
      <div class="card"><p>${(globalProjectData.critiqueText || '').replace(/<[^>]*>?/gm, '')}</p></div>

      <h2>2. Sprint Plan & Role Allocation</h2>
      ${(globalProjectData.sprintPlan || []).map(t => `
        <div class="card">
          <h4 style="margin:0 0 8px;">${t.title} <span class="tag">${t.assignee}</span> <span class="tag ${t.priority === 'HIGH' ? 'high-priority' : ''}">${t.priority}</span></h4>
          <p style="margin:0;">${t.desc} <em>(${t.phase || t.time})</em></p>
        </div>
      `).join('')}

      <h2>3. Blocker & Recovery Plan</h2>
      ${(globalProjectData.risks || []).map(r => `
        <div class="card risk">
          <h4 style="margin:0 0 8px; color: #ef4444;">${r.title}</h4>
          <p style="margin:0;">${r.desc}</p>
          <p style="margin:8px 0 0; font-family:monospace; color: #6b21a8;">${r.action}</p>
        </div>
      `).join('')}

      <h2>4. PPT Slide Outline</h2>
      ${(globalPitchSlides || []).map(s => `
        <div class="card">
          <h4>${s.title}</h4>
          <p>"${s.script}"</p>
        </div>
      `).join('')}
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank');
  printWin.document.write(printHtml);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => { printWin.print(); }, 300);
});

// Krishna Coach Chat Drawer (Supports OpenAI ChatGPT integration)
const coachToggleBtn = document.getElementById('coachToggleBtn');
const btnToggleCoach = document.getElementById('btnToggleCoach');
const coachChatWindow = document.getElementById('coachChatWindow');
const btnCloseChat = document.getElementById('btnCloseChat');
const chatInput = document.getElementById('chatInput');
const btnSendChat = document.getElementById('btnSendChat');
const chatMessages = document.getElementById('chatMessages');

function toggleCoachChat() {
  coachChatWindow.classList.toggle('active');
  if (coachChatWindow.classList.contains('active')) {
    chatInput.focus();
  }
}

if (coachToggleBtn) coachToggleBtn.addEventListener('click', toggleCoachChat);
if (btnToggleCoach) btnToggleCoach.addEventListener('click', toggleCoachChat);
if (btnCloseChat) btnCloseChat.addEventListener('click', toggleCoachChat);

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
  coachDiv.innerText = 'Consulting OpenAI Krishna Coach...';
  chatMessages.appendChild(coachDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const apiKey = apiKeyInput.value.trim();
  const context = globalProjectData ? globalProjectData.critiqueText : '';
  const res = await apiCoachChat(text, context, apiKey);

  let replyText = res.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  if (res.source) {
    replyText += `<br><span style="font-size:10px; color:var(--text-dimmer); display:block; margin-top:4px;">🤖 Powered by ${res.source}</span>`;
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
