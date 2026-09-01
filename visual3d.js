/* EMNET Event Game Core - 3D presentation layer */
(() => {
  const host = document.getElementById('three-stage');
  if (!host || !window.THREE) {
    document.documentElement.classList.add('three-fallback');
    return;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030308, 0.035);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 120);
  camera.position.set(0, 3.1, 12.5);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  // Futuristic arena floor
  const grid = new THREE.GridHelper(38, 38, 0x00eaff, 0x3c145f);
  grid.position.y = -3.3;
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  group.add(grid);

  // Central energy rings
  const ringMatA = new THREE.MeshBasicMaterial({ color: 0x00eaff, transparent: true, opacity: 0.38, side: THREE.DoubleSide });
  const ringMatB = new THREE.MeshBasicMaterial({ color: 0xff24d7, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
  const rings = [];
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6 + i * 0.72, 0.018 + i * 0.004, 6, 128), i % 2 ? ringMatA : ringMatB);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.6 + i * 0.25;
    ring.rotation.z = i * 0.18;
    group.add(ring);
    rings.push(ring);
  }

  // Star / particle field
  const count = 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - .5) * 42;
    pos[i * 3 + 1] = (Math.random() - .5) * 22;
    pos[i * 3 + 2] = (Math.random() - .5) * 42;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.7 }));
  scene.add(stars);

  // Side light pillars
  for (const x of [-7.4, 7.4]) {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(.03, .25, 11, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: x < 0 ? 0x00eaff : 0xff24d7, transparent: true, opacity: .17, side: THREE.DoubleSide })
    );
    beam.position.set(x, 0.5, -3);
    beam.rotation.z = x < 0 ? -0.16 : 0.16;
    scene.add(beam);
  }

  let mode = 'idle';
  let punch = 0;
  let targetZ = 12.5;
  let targetY = 3.1;
  const clock = new THREE.Clock();

  function setMode(next) {
    mode = next;
    document.body.dataset.visualMode = next;
    if (next === 'spin') {
      targetZ = 9.6;
      targetY = 2.5;
      punch = 0.7;
    } else if (next === 'reveal') {
      targetZ = 8.2;
      targetY = 2.0;
      punch = 1.25;
    } else if (next === 'vs') {
      targetZ = 6.6;
      targetY = 1.2;
      punch = 2.2;
    } else if (next === 'battle') {
      targetZ = 11.0;
      targetY = 2.0;
      punch = 0.5;
    } else {
      targetZ = 12.5;
      targetY = 3.1;
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const speed = mode === 'spin' ? 1.8 : mode === 'vs' ? 2.6 : 0.35;
    rings.forEach((r, i) => {
      r.rotation.z += 0.0015 * speed * (i % 2 ? 1 : -1) * (i + 1);
      r.scale.setScalar(1 + Math.sin(t * 1.4 + i) * 0.012);
    });
    stars.rotation.y += 0.00035 * speed;
    group.rotation.y = Math.sin(t * .25) * .04;

    camera.position.z += (targetZ - camera.position.z) * 0.045;
    camera.position.y += (targetY - camera.position.y) * 0.045;
    if (punch > 0.01) {
      camera.position.x = (Math.random() - .5) * punch * .13;
      camera.position.y += (Math.random() - .5) * punch * .08;
      punch *= .91;
    } else {
      camera.position.x *= .88;
    }
    camera.lookAt(0, -0.4, 0);
    renderer.render(scene, camera);
  }
  animate();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  addEventListener('emnet:spin-start', () => setMode('spin'));
  addEventListener('emnet:selection-revealed', () => setMode('reveal'));
  addEventListener('emnet:vs-start', () => setMode('vs'));
  addEventListener('emnet:battle-enter', () => setMode('battle'));
  addEventListener('emnet:back-select', () => setMode('idle'));
  addEventListener('emnet:reset', () => setMode('idle'));

  window.EMNET3D = { setMode };
})();
