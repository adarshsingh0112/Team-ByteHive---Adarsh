// Google Antigravity — Interactive Engine & Morphing Physics Canvas

// 1. Dynamic Particle Physics Canvas (Particles Defying Gravity)
const canvas = document.getElementById('antigravityCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
const particleColors = ['#3186FF', '#FFE432', '#FC413D', '#00B95C'];

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let mouse = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class AntigravityParticle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * width;
    this.y = height + Math.random() * 100; // Start below screen (floating upward)
    this.radius = Math.random() * 3 + 1.5;
    this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
    this.vy = -(Math.random() * 1.2 + 0.5); // Upward float velocity (defying gravity)
    this.vx = (Math.random() - 0.5) * 0.5;
    this.opacity = Math.random() * 0.6 + 0.2;
  }

  update() {
    this.y += this.vy;
    this.x += this.vx;

    // Cursor Antigravity Interaction
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 140) {
      const force = (140 - dist) / 140;
      this.x -= (dx / dist) * force * 4;
      this.y -= (dy / dist) * force * 4;
    }

    // Reset when floating past top
    if (this.y < -20 || this.x < -20 || this.x > width + 20) {
      this.reset();
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

// Initialize 70 Floating Particles
for (let i = 0; i < 70; i++) {
  particles.push(new AntigravityParticle());
}

function animateParticles() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}

animateParticles();

// 2. Interactive Typing Text Effect
const typingPhrases = [
  "Autonomous Code Generation",
  "Real-time Multi-Agent Orchestration",
  "Zero-Latency Sandbox Execution",
  "Self-Healing CI/CD Pipelines"
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingEl = document.getElementById('typingText');

function typeEffect() {
  const currentPhrase = typingPhrases[phraseIndex];

  if (isDeleting) {
    typingEl.textContent = currentPhrase.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingEl.textContent = currentPhrase.substring(0, charIndex + 1);
    charIndex++;
  }

  let delay = isDeleting ? 40 : 90;

  if (!isDeleting && charIndex === currentPhrase.length) {
    delay = 2000; // Pause at end
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % typingPhrases.length;
    delay = 500;
  }

  setTimeout(typeEffect, delay);
}

typeEffect();

// 3. Floating Glass Custom Cursor Tracking Inside Hero Media Container
const heroMedia = document.getElementById('heroMediaWrapper');
const customCursor = document.getElementById('customCursor');

if (heroMedia && customCursor) {
  heroMedia.addEventListener('mousemove', (e) => {
    const rect = heroMedia.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    customCursor.style.left = `${x}px`;
    customCursor.style.top = `${y}px`;
  });
}

// 4. Interactive Component Carousel Slider
const track = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let carouselIndex = 0;

if (track && prevBtn && nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (carouselIndex < 2) {
      carouselIndex++;
      track.style.transform = `translateX(-${carouselIndex * 384}px)`;
    }
  });

  prevBtn.addEventListener('click', () => {
    if (carouselIndex > 0) {
      carouselIndex--;
      track.style.transform = `translateX(-${carouselIndex * 384}px)`;
    }
  });
}
