/* EMNET Event Game Core - V3 Three.js cinematic layer */
(() => {
  const host = document.getElementById('three-stage');
  if (!host || !window.THREE) {
    document.documentElement.classList.add('three-fallback');
    return;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02030a, 0.028);

  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 160);
  camera.position.set(0, 1.4, 12.8);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
  const cyanLight = new THREE.PointLight(0x37f3ff, 55, 20, 1.8);
  cyanLight.position.set(-5, 2.5, 4);
  scene.add(cyanLight);
  const magentaLight = new THREE.PointLight(0xff2ad8, 55, 20, 1.8);
  magentaLight.position.set(5, 2.5, 4);
  scene.add(magentaLight);
  const topLight = new THREE.PointLight(0xffffff, 24, 18, 2);
  topLight.position.set(0, 7, 3);
  scene.add(topLight);

  const world = new THREE.Group();
  scene.add(world);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 40),
    new THREE.MeshStandardMaterial({ color: 0x050711, metalness: 0.86, roughness: 0.24, transparent: true, opacity: 0.92 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.15;
  floor.position.z = -3;
  world.add(floor);

  const grid = new THREE.GridHelper(42, 42, 0x36efff, 0x541b79);
  grid.position.y = -3.12;
  grid.position.z = -3;
  grid.material.transparent = true;
  grid.material.opacity = 0.34;
  world.add(grid);

  for (let i = -5; i <= 5; i++) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.025, 28),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x31eaff : 0xff31d6, transparent: true, opacity: 0.12 })
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(i * 1.7, -3.105, -5);
    world.add(strip);
  }

  const rings = [];
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.3 + i * 0.8, 0.018 + i * 0.003, 5, 128),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x38efff : 0xff31d6,
        transparent: true,
        opacity: 0.20,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.8 + i * 0.12;
    ring.position.z = -2.5;
    world.add(ring);
    rings.push(ring);
  }

  const STAR_COUNT = 1150;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 48;
    starPos[i * 3 + 1] = (Math.random() - 0.4) * 26;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xdde9ff, size: 0.045, transparent: true, opacity: 0.72, depthWrite: false })
  );
  scene.add(stars);

  const STREAK_COUNT = 180;
  const streakPos = new Float32Array(STREAK_COUNT * 6);
  for (let i = 0; i < STREAK_COUNT; i++) {
    const x = (Math.random() - 0.5) * 30;
    const y = (Math.random() - 0.5) * 14;
    const z = -4 - Math.random() * 25;
    const o = i * 6;
    streakPos[o] = x; streakPos[o + 1] = y; streakPos[o + 2] = z;
    streakPos[o + 3] = x; streakPos[o + 4] = y; streakPos[o + 5] = z + 0.4 + Math.random() * 1.2;
  }
  const streakGeo = new THREE.BufferGeometry();
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  const streaks = new THREE.LineSegments(
    streakGeo,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(streaks);

  const cinematic = new THREE.Group();
  cinematic.visible = false;
  scene.add(cinematic);

  const battleWorld = new THREE.Group();
  battleWorld.visible = false;
  scene.add(battleWorld);

  const textureLoader = new THREE.TextureLoader();
  const clock = new THREE.Clock();
  let mode = 'idle';
  let modeStart = performance.now();
  let fighterCards = [];
  let shockRings = [];
  let cameraShake = 0;
  let currentMatch = null;
  let battleFighters = [];
  let battleBursts = [];

  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeOutBack = t => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  function makeTextSprite(text, color = '#ffffff', accent = '#ff35d8', fontSize = 78) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 italic ${fontSize}px Arial, sans-serif`;
    ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.strokeText(text, 512, 128);
    ctx.shadowBlur = 30; ctx.shadowColor = accent;
    ctx.fillStyle = color; ctx.fillText(text, 512, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(5.6, 1.4, 1);
    return sprite;
  }

  function disposeGroup(group) {
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose?.();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(mat => { mat.map?.dispose?.(); mat.dispose?.(); });
      }
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  function makeCard(name, imageUrl, accent, width = 3.05, height = 4.15) {
    const group = new THREE.Group();
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(width + 0.45, height + 0.45),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.19, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.position.z = -0.11;
    group.add(glow);

    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.16, height + 0.16, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x070911, metalness: 0.88, roughness: 0.16, emissive: accent, emissiveIntensity: 0.14 })
    );
    group.add(shell);

    const tex = textureLoader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
    );
    photo.position.z = 0.101;
    group.add(photo);

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.94, 0.62),
      new THREE.MeshBasicMaterial({ color: 0x02030a, transparent: true, opacity: 0.90 })
    );
    plate.position.set(0, -height * 0.38, 0.112);
    group.add(plate);

    const nameSprite = makeTextSprite(name, '#ffffff', `#${accent.toString(16).padStart(6,'0')}`, 76);
    nameSprite.scale.set(width * 1.28, 0.74, 1);
    nameSprite.position.set(0, -height * 0.38, 0.125);
    group.add(nameSprite);

    group.userData.glow = glow;
    return group;
  }

  function addFighterCard(name, imageUrl, accent, start, target, rotStart, rotTarget, scale = 1) {
    const card = makeCard(name, imageUrl, accent);
    card.position.copy(start);
    card.rotation.y = rotStart;
    card.scale.setScalar(scale * 0.55);
    cinematic.add(card);
    fighterCards.push({ card, start, target, rotStart, rotTarget, scale, phase: Math.random() * Math.PI * 2 });
    return card;
  }

  function addShockRing(color, z = 1.5) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.62, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.position.set(0, 0, z);
    cinematic.add(ring);
    shockRings.push({ ring, born: performance.now() });
  }

  function buildMatch(match) {
    currentMatch = match;
    disposeGroup(cinematic);
    fighterCards = [];
    shockRings = [];
    cinematic.visible = true;
    const img = name => (typeof window.personImage === 'function' ? window.personImage(name) : 'question.png');

    addFighterCard(match.manager, img(match.manager), 0x31efff,
      new THREE.Vector3(-10.5, -0.1, -5.5), new THREE.Vector3(-3.7, -0.20, 1.0), 1.18, 0.10, 1.04);
    addFighterCard(match.main, img(match.main), 0xff31d6,
      new THREE.Vector3(10.5, -0.1, -5.5), new THREE.Vector3(3.7, -0.20, 1.0), -1.18, -0.10, 1.04);
    addFighterCard(match.sub, img(match.sub), 0xff69e5,
      new THREE.Vector3(10.0, 3.5, -8), new THREE.Vector3(6.35, 2.55, -0.3), -0.85, -0.20, 0.53);
    addFighterCard(match.judge, img(match.judge), 0xffdc57,
      new THREE.Vector3(-10.0, 3.6, -8), new THREE.Vector3(-6.35, 2.55, -0.3), 0.85, 0.20, 0.53);

    const agency = makeTextSprite(match.agency || '', '#ffffff', '#ff31d6', 58);
    agency.name = 'agencySprite';
    agency.position.set(0, -2.34, 1.3);
    agency.scale.set(7.4, 1.25, 1);
    cinematic.add(agency);

    const vs = makeTextSprite('VS', '#ffffff', '#ff9d1f', 138);
    vs.name = 'vsSprite';
    vs.position.set(0, 0.1, 2.0);
    vs.scale.set(3.8, 1.7, 1);
    vs.material.opacity = 0;
    cinematic.add(vs);
    addShockRing(0xffffff, 1.4);
  }


  function makeCutout(name, imageUrl, accent, side = -1) {
    const group = new THREE.Group();
    const tex = textureLoader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;

    // Layered planes create a subtle volumetric/parallax silhouette instead of a flat DOM image.
    for (let i = 0; i < 7; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.02,
        toneMapped: false,
        opacity: i === 6 ? 1 : 0.16,
        color: i === 6 ? 0xffffff : accent,
        blending: i === 6 ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: i === 6
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.8), mat);
      plane.position.z = (i - 3) * 0.035;
      plane.position.x = (i - 3) * 0.008 * side;
      group.add(plane);
    }

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.18, 96),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.position.set(0, -2.45, -0.35);
    halo.rotation.x = -Math.PI / 2;
    halo.scale.set(1.4, .55, 1);
    group.add(halo);

    const rim = new THREE.Mesh(
      new THREE.PlaneGeometry(4.7, 6.3),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    rim.position.z = -0.25;
    group.add(rim);

    const nameSprite = makeTextSprite(name, '#ffffff', `#${accent.toString(16).padStart(6,'0')}`, 68);
    nameSprite.position.set(0, -3.0, 0.35);
    nameSprite.scale.set(4.2, 0.92, 1);
    group.add(nameSprite);
    group.userData.halo = halo;
    group.userData.side = side;
    return group;
  }

  function profileFor(name) {
    return window.getFighterProfile ? window.getFighterProfile(name) : { codename:name, accent:'#ffffff', accent2:'#888888' };
  }

  function colorInt(hex, fallback) {
    try { return parseInt(String(hex).replace('#',''),16); } catch(e) { return fallback; }
  }

  function buildBattle(match) {
    currentMatch = match || currentMatch;
    if (!currentMatch) return;
    disposeGroup(battleWorld);
    battleFighters = [];
    battleBursts = [];
    battleWorld.visible = true;
    const img = name => (typeof window.personImage === 'function' ? window.personImage(name) : 'question.png');
    const p1 = profileFor(currentMatch.manager);
    const p2 = profileFor(currentMatch.main);
    const c1 = colorInt(p1.accent, 0x31efff);
    const c2 = colorInt(p2.accent, 0xff31d6);

    // Deep arena tunnel: repeating frames make perspective obvious even on a flat monitor.
    for (let z=-5; z>=-32; z-=3.2) {
      const depth = Math.abs(z);
      const w = 12.5 + depth * 0.22;
      const h = 7.0 + depth * 0.08;
      const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.08));
      const frame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({
        color: z % 6.4 === 0 ? c1 : c2, transparent:true, opacity:Math.max(.035,.20-depth*.004), blending:THREE.AdditiveBlending
      }));
      frame.position.set(0,.05,z);
      battleWorld.add(frame);
    }

    // Raised octagonal fighting platform.
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(8.6, 9.5, 0.8, 8, 1, false),
      new THREE.MeshStandardMaterial({ color:0x060811, metalness:.96, roughness:.18, emissive:0x10051a, emissiveIntensity:.8 })
    );
    platform.position.set(0,-3.08,-1.2);
    platform.rotation.y = Math.PI/8;
    battleWorld.add(platform);

    const platformRing = new THREE.Mesh(
      new THREE.TorusGeometry(7.6,.075,8,128),
      new THREE.MeshBasicMaterial({ color:0xffd447, transparent:true, opacity:.55, blending:THREE.AdditiveBlending })
    );
    platformRing.rotation.x=Math.PI/2;
    platformRing.position.set(0,-2.68,-1.2);
    platformRing.scale.set(1,.58,1);
    battleWorld.add(platformRing);

    // Perspective floor lanes shooting toward the vanishing point.
    for (let i=-9;i<=9;i++) {
      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(.025,30),
        new THREE.MeshBasicMaterial({ color:i<0?c1:c2, transparent:true, opacity:.12, blending:THREE.AdditiveBlending })
      );
      lane.rotation.x=-Math.PI/2;
      lane.position.set(i*.82,-2.66,-11.5);
      battleWorld.add(lane);
    }

    // Vertical energy towers give the stage real height.
    for (const side of [-1,1]) {
      const color = side<0?c1:c2;
      for (let i=0;i<5;i++) {
        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(.16, 3.2+i*.7, .16),
          new THREE.MeshStandardMaterial({ color:0x080b12, metalness:.9, roughness:.18, emissive:color, emissiveIntensity:1.7 })
        );
        tower.position.set(side*(5.6+i*.95), -1.5+i*.12, -3.8-i*1.3);
        battleWorld.add(tower);
        const cap = new THREE.PointLight(color, 18, 5.5, 2);
        cap.position.set(tower.position.x, tower.position.y+2, tower.position.z+.8);
        battleWorld.add(cap);
      }
    }

    // Fighters live at different depths and turn toward each other.
    const left = makeCutout(currentMatch.manager, img(currentMatch.manager), c1, -1);
    left.position.set(-3.65,-.04,1.15);
    left.rotation.y=.34;
    left.rotation.x=-.025;
    left.scale.setScalar(1.18);
    left.userData.home = left.position.clone();
    left.userData.codename = p1.codename;
    battleWorld.add(left);

    const right = makeCutout(currentMatch.main, img(currentMatch.main), c2, 1);
    right.position.set(3.85,.02,.15);
    right.rotation.y=-.34;
    right.rotation.x=.018;
    right.scale.setScalar(1.12);
    right.userData.home = right.position.clone();
    right.userData.codename = p2.codename;
    battleWorld.add(right);
    battleFighters=[left,right];

    // Comic-energy backplates sit behind, visibly tilted in 3D.
    for (const [side,color,x,z] of [[-1,c1,-4.3,.25],[1,c2,4.45,-.75]]) {
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(5.4,6.6),
        new THREE.MeshBasicMaterial({color,transparent:true,opacity:.055,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false})
      );
      plate.position.set(x,.0,z-.75);
      plate.rotation.y=side*-.50;
      plate.rotation.z=side*.06;
      battleWorld.add(plate);
    }

    const core = new THREE.Group();
    core.name='battleCore';
    for (let i=0;i<4;i++) {
      const ring=new THREE.Mesh(
        new THREE.TorusGeometry(1.1+i*.35,.035+i*.012,8,96),
        new THREE.MeshBasicMaterial({color:i%2?c1:c2,transparent:true,opacity:.34-i*.04,blending:THREE.AdditiveBlending,depthWrite:false})
      );
      ring.rotation.x=Math.PI/2 + i*.12;
      ring.rotation.y=i*.38;
      core.add(ring);
    }
    core.position.set(0,-.35,-2.1);
    battleWorld.add(core);

    const p1Name = makeTextSprite(p1.codename || currentMatch.manager,'#ffffff',p1.accent || '#19e6ff',58);
    p1Name.position.set(-4.0,-2.58,2.0); p1Name.scale.set(4.8,.85,1); p1Name.rotation.z=-.025; battleWorld.add(p1Name);
    const p2Name = makeTextSprite(p2.codename || currentMatch.main,'#ffffff',p2.accent || '#d92cff',58);
    p2Name.position.set(4.0,-2.58,1.0); p2Name.scale.set(4.8,.85,1); p2Name.rotation.z=.025; battleWorld.add(p2Name);
  }

  function battleImpact(detail = {}) {
    if (!battleWorld.visible) return;
    cameraShake = detail.damage >= 50 ? 0.72 : detail.damage >= 30 ? 0.46 : 0.28;
    const targetIndex = detail.attacker === 1 ? 1 : 0;
    const target = battleFighters[targetIndex];
    if (target) {
      target.userData.hitUntil = performance.now() + 220;
      target.userData.hitStrength = detail.damage || 10;
      for (let i=0;i<3;i++) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.25, 0.31, 64),
          new THREE.MeshBasicMaterial({ color: detail.attacker === 1 ? 0x31efff : 0xff31d6, transparent: true, opacity: .95, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        ring.position.copy(target.position);
        ring.position.z += 0.9 + i*0.05;
        ring.userData.born = performance.now() + i*45;
        battleWorld.add(ring);
        battleBursts.push(ring);
      }
    }
  }

  function setMode(next) {
    mode = next;
    modeStart = performance.now();
    document.body.dataset.visualMode = next;
    if (next === 'vs') cameraShake = 0.18;
    if (next === 'battle') {
      cinematic.visible = false;
      streaks.material.opacity = 0;
      buildBattle(currentMatch);
    } else if (next === 'idle') {
      cinematic.visible = false;
      battleWorld.visible = false;
      streaks.material.opacity = 0;
    } else {
      battleWorld.visible = false;
    }
  }

  function updateCinematic(now, t) {
    if (!cinematic.visible) return;
    const elapsed = (now - modeStart) / 1000;
    fighterCards.forEach((item, i) => {
      const p = Math.min(1, elapsed / (0.62 + i * 0.055));
      const e = easeOutBack(p);
      item.card.position.lerpVectors(item.start, item.target, e);
      item.card.rotation.y = THREE.MathUtils.lerp(item.rotStart, item.rotTarget, easeOutCubic(p));
      const s = item.scale * THREE.MathUtils.lerp(0.55, 1, Math.min(1, e));
      item.card.scale.setScalar(s);
      if (p >= 1) item.card.position.y = item.target.y + Math.sin(t * 1.8 + item.phase) * (item.scale < 0.7 ? 0.035 : 0.055);
      if (item.card.userData.glow) item.card.userData.glow.material.opacity = 0.13 + (Math.sin(t * 4.2 + item.phase) + 1) * 0.045;
    });

    const vs = cinematic.getObjectByName('vsSprite');
    if (vs) {
      const vp = Math.max(0, Math.min(1, (elapsed - 0.36) / 0.42));
      vs.material.opacity = easeOutCubic(vp);
      const s = 0.35 + easeOutBack(vp) * 0.65;
      vs.scale.set(3.8 * s, 1.7 * s, 1);
      vs.rotation.z = Math.sin(t * 5) * 0.025;
    }

    const agency = cinematic.getObjectByName('agencySprite');
    if (agency) {
      const ap = Math.max(0, Math.min(1, (elapsed - 0.48) / 0.45));
      agency.material.opacity = ap;
      agency.position.y = -2.5 + easeOutCubic(ap) * 0.16;
    }

    streaks.material.opacity = Math.min(0.48, elapsed * 0.65);
    streaks.position.z += 0.12;
    if (streaks.position.z > 8) streaks.position.z = 0;

    if (mode === 'vs' && elapsed > 0.62 && shockRings.length < 2) {
      addShockRing(0xffc26a, 1.5);
      cameraShake = 0.42;
    }

    shockRings.forEach(s => {
      const age = (now - s.born) / 1000;
      s.ring.scale.setScalar(1 + age * 9);
      s.ring.material.opacity = Math.max(0, 0.78 - age * 0.8);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const t = clock.getElapsedTime();
    const elapsed = (now - modeStart) / 1000;
    const speed = mode === 'spin' ? 2.1 : mode === 'vs' ? 2.9 : 0.42;

    rings.forEach((r, i) => {
      r.rotation.z += 0.0015 * speed * (i % 2 ? 1 : -1) * (i + 1);
      r.scale.setScalar(1 + Math.sin(t * 1.3 + i) * 0.014);
    });
    stars.rotation.y += 0.0003 * speed;
    world.rotation.y = Math.sin(t * 0.20) * 0.025;

    if (mode === 'vs' && cinematic.visible) {
      const cp = Math.min(1, elapsed / 1.15);
      camera.position.z = THREE.MathUtils.lerp(12.6, 8.25, easeOutCubic(cp));
      camera.position.y = THREE.MathUtils.lerp(1.8, 0.55, easeOutCubic(cp));
      camera.position.x = Math.sin(elapsed * 1.7) * 0.28 * (1 - cp * 0.5);
    } else if (mode === 'spin') {
      camera.position.z += (11.0 - camera.position.z) * 0.045;
      camera.position.y += (1.5 - camera.position.y) * 0.045;
      camera.position.x = Math.sin(t * 0.55) * 0.35;
    } else if (mode === 'battle') {
      // Slow cinematic orbit: perspective must be visible, not a flat front-on composition.
      const targetX = Math.sin(t * 0.23) * 1.05;
      const targetY = 0.48 + Math.sin(t * 0.31) * 0.12;
      const targetZ = 9.0 + Math.cos(t * 0.19) * 0.45;
      camera.position.x += (targetX - camera.position.x) * 0.035;
      camera.position.y += (targetY - camera.position.y) * 0.035;
      camera.position.z += (targetZ - camera.position.z) * 0.035;
    } else {
      camera.position.z += (12.8 - camera.position.z) * 0.04;
      camera.position.y += (1.4 - camera.position.y) * 0.04;
      camera.position.x = Math.sin(t * 0.22) * 0.2;
    }

    if (cameraShake > 0.003) {
      camera.position.x += (Math.random() - 0.5) * cameraShake;
      camera.position.y += (Math.random() - 0.5) * cameraShake * 0.55;
      cameraShake *= 0.88;
    }

    if (mode === 'battle' && battleWorld.visible) {
      battleFighters.forEach((fighter, i) => {
        const side = i === 0 ? -1 : 1;
        const home = fighter.userData.home || new THREE.Vector3(side*3.8,0,i?0.15:1.15);
        fighter.position.y = home.y + Math.sin(t * 1.7 + i * 1.2) * 0.065;
        fighter.rotation.y = side * (-0.34 + Math.sin(t * 0.7 + i) * 0.025);
        const hit = fighter.userData.hitUntil && now < fighter.userData.hitUntil;
        const recoil = hit ? Math.sin((fighter.userData.hitUntil - now) * 0.09) * 0.26 : 0;
        fighter.position.x = home.x + recoil * -side;
        fighter.position.z = home.z + (hit ? Math.abs(recoil)*.7 : 0);
        const baseScale = i===0 ? 1.18 : 1.12;
        fighter.scale.setScalar(hit ? baseScale*1.045 : baseScale);
        if (fighter.userData.halo) {
          fighter.userData.halo.rotation.z += 0.008 * side;
          fighter.userData.halo.material.opacity = hit ? 0.75 : 0.20 + (Math.sin(t * 3 + i) + 1) * 0.045;
        }
      });
      const core = battleWorld.getObjectByName('battleCore');
      if (core) { core.rotation.z += 0.01; core.scale.setScalar(1 + Math.sin(t*2.2)*0.05); }
      battleBursts = battleBursts.filter(ring => {
        const age = (now - ring.userData.born) / 1000;
        if (age < 0) { ring.visible = false; return true; }
        ring.visible = true;
        ring.scale.setScalar(1 + age * 9);
        ring.material.opacity = Math.max(0, .9 - age * 1.6);
        if (age > .65) { battleWorld.remove(ring); ring.geometry.dispose(); ring.material.dispose(); return false; }
        return true;
      });
    }

    cyanLight.intensity = 46 + Math.sin(t * 3.0) * 9;
    magentaLight.intensity = 46 + Math.sin(t * 3.0 + Math.PI) * 9;
    updateCinematic(now, t);
    camera.lookAt(0, -0.35, 0.7);
    renderer.render(scene, camera);
  }
  animate();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  addEventListener('emnet:spin-start', () => setMode('spin'));
  addEventListener('emnet:selection-revealed', e => { buildMatch(e.detail || {}); setMode('reveal'); });
  addEventListener('emnet:vs-start', () => setMode('vs'));
  addEventListener('emnet:battle-enter', () => setMode('battle'));
  addEventListener('emnet:battle-hit', e => battleImpact(e.detail || {}));
  addEventListener('emnet:back-select', () => setMode('idle'));
  addEventListener('emnet:reset', () => setMode('idle'));

  window.EMNET3D = { setMode, buildMatch, buildBattle, battleImpact };
})();
