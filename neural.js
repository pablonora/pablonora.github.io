/* =========================================================
   Neural-network hero — three.js, points + dynamic links.
   Loaded as a module, deferred from LCP. Degrades gracefully:
   if WebGL/three fails, the static dark background remains.
   ========================================================= */

const canvas = document.getElementById('neural');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Respect reduced-motion and tiny/old devices: skip the heavy scene.
if (!canvas || reduceMotion) {
  // leave the CSS background as-is
} else {
  init().catch(() => { /* silent fallback to CSS background */ });
}

async function init() {
  const THREE = await import('three');

  const ACCENT = new THREE.Color('#45e3a0');
  const COOL = new THREE.Color('#7f8aa3');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 14;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setSize(innerWidth, innerHeight);

  // ---- node field -------------------------------------------------
  const isMobile = innerWidth < 760;
  const COUNT = isMobile ? 70 : 130;
  const SPREAD_X = 26, SPREAD_Y = 16, SPREAD_Z = 10;

  const positions = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seed = (n) => (Math.sin(n * 999.13) * 43758.5453) % 1; // deterministic-ish jitter

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (seed(i + 1) - 0.5) * SPREAD_X;
    positions[i * 3 + 1] = (seed(i + 7.3) - 0.5) * SPREAD_Y;
    positions[i * 3 + 2] = (seed(i + 13.7) - 0.5) * SPREAD_Z;
    velocities[i * 3]     = (seed(i + 2.1) - 0.5) * 0.010;
    velocities[i * 3 + 1] = (seed(i + 5.4) - 0.5) * 0.010;
    velocities[i * 3 + 2] = (seed(i + 8.8) - 0.5) * 0.006;

    const c = ACCENT.clone().lerp(COOL, seed(i + 3.3) * 0.7 + 0.15);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  // points
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // soft round sprite for nodes
  const sprite = makeDotTexture(THREE);
  const pMat = new THREE.PointsMaterial({
    size: isMobile ? 0.42 : 0.34,
    map: sprite, alphaTest: 0.02, transparent: true,
    vertexColors: true, depthWrite: false, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, opacity: 0.95,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // links (line segments rebuilt each frame for nearby nodes)
  const MAX_LINKS = COUNT * 6;
  const linkPos = new Float32Array(MAX_LINKS * 2 * 3);
  const linkCol = new Float32Array(MAX_LINKS * 2 * 3);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
  lGeo.setAttribute('color', new THREE.BufferAttribute(linkCol, 3));
  const lMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.32,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const links = new THREE.LineSegments(lGeo, lMat);
  scene.add(links);

  const LINK_DIST = isMobile ? 4.2 : 4.8;
  const LINK_DIST2 = LINK_DIST * LINK_DIST;

  // ---- interaction -------------------------------------------------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5);
    mouse.ty = (e.clientY / innerHeight - 0.5);
  }, { passive: true });

  // ---- resize ------------------------------------------------------
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }, { passive: true });

  // ---- animation loop ---------------------------------------------
  // Single-loop control: `active` guards against ever starting a second
  // requestAnimationFrame chain (the old bug that made motion compound/speed
  // up every time the tab regained focus). Motion is delta-time based and the
  // delta is clamped, so refresh rate and long tab-pauses never cause jumps.
  const pos = pGeo.attributes.position.array;
  let t = 0;
  let rafId = 0;
  let active = false;
  let last = 0;

  function start() {
    if (active) return;
    active = true;
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    active = false;
    cancelAnimationFrame(rafId);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  function loop(now) {
    if (!active) return;
    rafId = requestAnimationFrame(loop);

    // delta in seconds, clamped (avoids a big jump after the tab was hidden)
    let dt = (now - last) / 1000;
    last = now;
    if (!(dt > 0)) dt = 0.016;
    if (dt > 0.05) dt = 0.05;
    const step = dt * 60; // normalize per-frame velocities to a 60fps baseline
    t += dt;

    // drift nodes, bounce within bounds
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      pos[ix]     += velocities[ix] * step;
      pos[ix + 1] += velocities[ix + 1] * step;
      pos[ix + 2] += velocities[ix + 2] * step;
      if (pos[ix] > SPREAD_X / 2 || pos[ix] < -SPREAD_X / 2) velocities[ix] *= -1;
      if (pos[ix + 1] > SPREAD_Y / 2 || pos[ix + 1] < -SPREAD_Y / 2) velocities[ix + 1] *= -1;
      if (pos[ix + 2] > SPREAD_Z / 2 || pos[ix + 2] < -SPREAD_Z / 2) velocities[ix + 2] *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;

    // rebuild proximity links
    let l = 0;
    for (let i = 0; i < COUNT; i++) {
      const ax = pos[i * 3], ay = pos[i * 3 + 1], az = pos[i * 3 + 2];
      for (let j = i + 1; j < COUNT; j++) {
        const dx = ax - pos[j * 3];
        const dy = ay - pos[j * 3 + 1];
        const dz = az - pos[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < LINK_DIST2 && l < MAX_LINKS) {
          const fade = 1 - d2 / LINK_DIST2;
          const k = l * 6;
          linkPos[k] = ax; linkPos[k + 1] = ay; linkPos[k + 2] = az;
          linkPos[k + 3] = pos[j * 3]; linkPos[k + 4] = pos[j * 3 + 1]; linkPos[k + 5] = pos[j * 3 + 2];
          const cr = ACCENT.r * fade, cg = ACCENT.g * fade, cb = ACCENT.b * fade;
          linkCol[k] = cr; linkCol[k + 1] = cg; linkCol[k + 2] = cb;
          linkCol[k + 3] = cr; linkCol[k + 4] = cg; linkCol[k + 5] = cb;
          l++;
        }
      }
    }
    lGeo.setDrawRange(0, l * 2);
    lGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.color.needsUpdate = true;

    // parallax: ease camera toward mouse (exponential smoothing → frame-rate
    // independent) + a slow, gentle auto-orbit driven by elapsed seconds
    const sm = 1 - Math.exp(-dt * 4);
    mouse.x += (mouse.tx - mouse.x) * sm;
    mouse.y += (mouse.ty - mouse.y) * sm;
    camera.position.x = mouse.x * 6 + Math.sin(t * 0.25) * 0.6;
    camera.position.y = -mouse.y * 4 + Math.cos(t * 0.2) * 0.4;
    camera.lookAt(scene.position);
    points.rotation.y = t * 0.05;
    links.rotation.y = t * 0.05;

    renderer.render(scene, camera);
  }

  // reveal once the first frame is ready
  requestAnimationFrame(() => {
    start();
    canvas.classList.add('ready');
  });
}

/* radial-gradient dot texture for soft nodes */
function makeDotTexture(THREE) {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
