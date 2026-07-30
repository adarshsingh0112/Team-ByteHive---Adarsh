// Three.js Deep Space Particle System
(function initParticles(){
  const canvas = document.getElementById('particle-canvas');
  if(!canvas) return;
  
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;
  
  function createStarLayer(count, size, opacity, colorHex) {
    const positions = new Float32Array(count * 3);
    for(let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 25;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size,
      color: colorHex,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    return points;
  }

  const layer1 = createStarLayer(800, 0.015, 0.15, 0xffffff);
  const layer2 = createStarLayer(350, 0.025, 0.3, 0x8ab4f8);
  const layer3 = createStarLayer(100, 0.04, 0.5, 0xa855f7);
  
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX - window.innerWidth / 2) * 0.0005;
    targetY = (e.clientY - window.innerHeight / 2) * 0.0005;
  });

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;
    
    layer1.rotation.y = t * 0.005 + mouseX * 0.5; layer1.rotation.x = mouseY * 0.5;
    layer2.rotation.y = t * 0.01 + mouseX * 0.8; layer2.rotation.x = mouseY * 0.8;
    layer3.rotation.y = t * 0.015 + mouseX * 1.2; layer3.rotation.x = mouseY * 1.2;
    layer3.material.opacity = 0.3 + Math.sin(t * 2) * 0.2;
    
    renderer.render(scene, camera);
  }
  animate();
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
