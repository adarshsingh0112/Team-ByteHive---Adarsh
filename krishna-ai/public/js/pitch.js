// ============================================================================
// KRISHNA AI — PITCH LAB MODULE (VERSION B)
// ============================================================================

async function renderPitchSection(idea, stack) {
  const slidesContainer = document.getElementById('slides');
  if (!slidesContainer) return;

  slidesContainer.innerHTML = `<div class="loader-ring" style="width:30px;height:30px;margin:20px auto;"></div><p style="text-align:center;font-size:12px;color:var(--purple);">Generating YC-style 5-slide pitch script...</p>`;

  const data = await apiGeneratePitch({ idea, stack });
  if (!data || !data.slides) return;

  let html = '';
  data.slides.forEach(slide => {
    html += `
      <div class="command-card" style="border-left: 3px solid var(--purple);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="font-family:var(--font-heading); color:var(--purple); font-size:14px; margin:0;">${slide.title}</h4>
          <span class="badge-mini">SLIDE ${slide.num}</span>
        </div>
        <p style="font-size:12.5px; color:var(--text-main); line-height:1.5; font-style:italic;">"${slide.script}"</p>
      </div>`;
  });

  slidesContainer.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  const btnPitch = document.getElementById('generatePitch');
  if (btnPitch) {
    btnPitch.addEventListener('click', () => {
      const idea = document.getElementById('idea') ? document.getElementById('idea').value : '';
      const stack = document.getElementById('stack') ? document.getElementById('stack').value : '';
      renderPitchSection(idea, stack);
    });
  }
});
