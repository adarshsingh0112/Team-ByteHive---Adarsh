/* ============================================================================
   🌌 $100M SaaS INTERACTIVE ENGINE — HERO ORBIT, 3D PARALLAX & GRAPH ENGINE
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Mouse Cursor Spotlight Effect
  const spotlight = document.getElementById('cursor-spotlight');
  if (spotlight) {
    document.addEventListener('mousemove', (e) => {
      spotlight.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
  }

  // 2. Hero Interactive Canvas (Orbiting Ecosystem & Node Particles)
  initHeroOrbitCanvas();

  // 3. Count-Up Stats Engine (Intersection Observer)
  initCountUpStats();

  // 4. Live Preview 3D Mouse Tilt & Reflection
  initLivePreview3DTilt();

  // 5. Interactive Feature Graph SVG Connection Highlight
  initFeatureGraphHighlight();

  // 6. Workflow Pulsing Packet Engine
  initWorkflowPackets();

  // 7. FAQ Accordion Controller
  initFaqAccordion();

  // 8. Testimonials Auto-Carousel
  initTestimonialsSlider();
});

/* ============================================================================
   🌀 1. HERO ORBITING ECOSYSTEM CANVAS ENGINE
   ============================================================================ */
function initHeroOrbitCanvas() {
  const canvas = document.getElementById('hero-orbit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = canvas.parentElement.offsetWidth);
  let height = (canvas.height = canvas.parentElement.offsetHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  });

  const centerX = width / 2;
  const centerY = height / 2;

  // Orbiting Node Icons Data
  const nodes = [
    { label: 'Slack', r: 130, angle: 0, speed: 0.008, color: '#4A154B', icon: '💬' },
    { label: 'GitHub', r: 190, angle: 1.2, speed: 0.006, color: '#2DBA4E', icon: '🐙' },
    { label: 'Figma', r: 250, angle: 2.5, speed: 0.005, color: '#F24E1E', icon: '🎨' },
    { label: 'Linear', r: 310, angle: 3.8, speed: 0.004, color: '#5E6AD2', icon: '⚡' },
    { label: 'OpenAI', r: 370, angle: 5.0, speed: 0.003, color: '#10A37F', icon: '🧠' }
  ];

  // Floating background particles
  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.2
  }));

  let mouseX = centerX;
  let mouseY = centerY;
  let rippleRadius = 0;
  let rippleX = 0;
  let rippleY = 0;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    rippleX = e.clientX - rect.left;
    rippleY = e.clientY - rect.top;
    rippleRadius = 1;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2 + (mouseX - width / 2) * 0.04;
    const cy = height / 2 + (mouseY - height / 2) * 0.04;

    // Draw background particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(94, 160, 255, ${p.alpha})`;
      ctx.fill();
    });

    // Draw Orbit Rings
    [130, 190, 250, 310, 370].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Central AI Core Glow
    const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
    gradient.addColorStop(0, '#4F8CFF');
    gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.5)');
    gradient.addColorStop(1, 'rgba(79, 140, 255, 0)');

    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Central Core Node
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#4F8CFF';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Orbiting Nodes & Connecting Lines
    nodes.forEach(node => {
      node.angle += node.speed;
      const nx = cx + node.r * Math.cos(node.angle);
      const ny = cy + node.r * Math.sin(node.angle);

      // Connecting Glowing Bezier Line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo((cx + nx) / 2 + 20, (cy + ny) / 2 - 20, nx, ny);
      ctx.strokeStyle = 'rgba(79, 140, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Node Outer Circle
      ctx.beginPath();
      ctx.arc(nx, ny, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(17, 17, 17, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      // Draw Icon
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.icon, nx, ny);
    });

    // Draw Ripple Click Effect
    if (rippleRadius > 0) {
      rippleRadius += 4;
      const alpha = Math.max(0, 1 - rippleRadius / 150);
      ctx.beginPath();
      ctx.arc(rippleX, rippleY, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(94, 160, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (alpha <= 0) rippleRadius = 0;
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ============================================================================
   📈 2. COUNT-UP STATS ENGINE
   ============================================================================ */
function initCountUpStats() {
  const statElements = document.querySelectorAll('.stat-number');
  if (statElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseFloat(el.getAttribute('data-target'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 2000;
        const start = performance.now();

        function update(now) {
          const time = Math.min(1, (now - start) / duration);
          const value = (time * targetVal).toFixed(targetVal % 1 === 0 ? 0 : 2);
          el.innerText = `${prefix}${value}${suffix}`;
          if (time < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statElements.forEach(el => observer.observe(el));
}

/* ============================================================================
   💻 3. LIVE PREVIEW 3D MOUSE TILT & REFLECTION
   ============================================================================ */
function initLivePreview3DTilt() {
  const card = document.getElementById('interactive-browser');
  if (!card) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = (-y / rect.height) * 14;
    const rotY = (x / rect.width) * 14;

    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  });
}

/* ============================================================================
   🔗 4. FEATURE GRAPH HIGHLIGHT ENGINE
   ============================================================================ */
function initFeatureGraphHighlight() {
  const cards = document.querySelectorAll('.feature-graph-card');
  const lines = document.querySelectorAll('.graph-path');

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const targetId = card.getAttribute('data-connection');
      lines.forEach(line => {
        if (line.getAttribute('data-id') === targetId) {
          line.setAttribute('stroke', '#4F8CFF');
          line.setAttribute('stroke-width', '3');
        }
      });
    });

    card.addEventListener('mouseleave', () => {
      lines.forEach(line => {
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.15)');
        line.setAttribute('stroke-width', '1.5');
      });
    });
  });
}

/* ============================================================================
   ⚡ 5. WORKFLOW PACKETS ENGINE
   ============================================================================ */
function initWorkflowPackets() {
  const packets = document.querySelectorAll('.pulse-packet');
  if (packets.length === 0) return;

  let offset = 0;
  setInterval(() => {
    offset = (offset + 2) % 100;
    packets.forEach(p => {
      p.setAttribute('stroke-dashoffset', -offset);
    });
  }, 50);
}

/* ============================================================================
   ❓ 6. FAQ ACCORDION CONTROLLER
   ============================================================================ */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const btn = item.querySelector('.faq-btn');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (!btn || !content) return;

    btn.addEventListener('click', () => {
      const isOpen = content.style.maxHeight;

      // Close all items
      items.forEach(i => {
        const c = i.querySelector('.faq-content');
        const ic = i.querySelector('.faq-icon');
        if (c) c.style.maxHeight = null;
        if (ic) ic.style.transform = 'rotate(0deg)';
      });

      // Toggle clicked item
      if (!isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(45deg)';
      }
    });
  });
}

/* ============================================================================
   💬 7. TESTIMONIALS SLIDER CONTROLLER
   ============================================================================ */
function initTestimonialsSlider() {
  const track = document.getElementById('testimonials-track');
  if (!track) return;

  let index = 0;
  const cards = track.children;
  if (cards.length <= 1) return;

  setInterval(() => {
    index = (index + 1) % cards.length;
    track.style.transform = `translateX(-${index * 100}%)`;
  }, 4500);
}
