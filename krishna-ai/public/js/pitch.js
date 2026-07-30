// Pitch Script Generator & Deck Evaluator logic

let globalPitchSlides = [];

async function renderPitchSection(idea, stack, apiKey) {
  const pitchBody = document.getElementById('pitchScriptBody');
  if (!pitchBody) return;

  pitchBody.innerHTML = `<div class="loader-ring" style="width:30px;height:30px;margin:20px auto;"></div><p style="text-align:center;font-size:12px;color:var(--purple);">Generating 5-Slide Pitch Script...</p>`;

  const pitchData = await apiGeneratePitch(idea, stack, apiKey);
  globalPitchSlides = pitchData.slides || [];

  let html = `<div style="display:flex; flex-direction:column; gap:10px;">`;
  globalPitchSlides.forEach(s => {
    html += `
      <div class="slide-card">
        <h4>${s.title}</h4>
        <p>"${s.script}"</p>
      </div>
    `;
  });
  html += `</div>`;
  pitchBody.innerHTML = html;
}
