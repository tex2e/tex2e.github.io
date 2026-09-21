(() => {
  'use strict';
  const canvas = document.getElementById('ocean-canvas');
  const ctx = canvas?.getContext('2d', { alpha: false });
  if (!ctx) return;
  const hero = document.getElementById('top');
  const toggle = document.getElementById('ocean-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  let width = 0, height = 0, frame = 0, previous = 0, elapsed = 0;
  let dirty = true, userPaused = false, heroHeight = 0;
  let lastReduced = reduced.matches;
  let pointer = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  let rings = 46, segments = 144, mesh;
  // Deterministic visual noise, never used as cryptographic randomness.
  const fract = x => x - Math.floor(x);
  const noise = i => fract(Math.sin(i * 127.1 + 311.7) * 43758.5453);
  const dust = Array.from({ length: 150 }, (_, i) => ({
    x: noise(i), y: noise(i + 200), z: .2 + noise(i + 400), phase: noise(i + 600) * TAU
  }));
  const paused = () => userPaused || reduced.matches;

  function resize() {
    width = innerWidth; height = innerHeight;
    heroHeight = hero.offsetHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    rings = width < 760 ? 36 : 52;
    segments = width < 760 ? 112 : 168;
    mesh = new Float32Array((rings + 1) * (segments + 1) * 2);
    dirty = true;
  }

  // A logarithmic ocean surface: fine, distant rings converge into an abyss.
  // The wave field and its radial lattice are an artistic metaphor, not a simulation of a cipher.
  function surface(u, angle, cx, cy, scale, time) {
    const radius = 22 * Math.exp(u * 3.9);
    const theta = angle + u * .72 + time * .035;
    const wave = Math.sin(theta * 3 + u * 11 - time * .55) * .055
      + Math.sin(theta * 7 - u * 8 + time * .3) * .023;
    const r = radius * (1 + wave * Math.min(1, u * 4));
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r * .54;
    return [cx + (x + y * .22) * scale,
      cy + (y - x * .19 - Math.sin(u * 8 - time * .35 + theta * 2) * radius * .07) * scale];
  }

  function draw() {
    const descent = Math.min(1, scrollY / Math.max(heroHeight, 1));
    const strength = 1 - descent * .88;
    const mobile = width < 760;
    const time = elapsed;
    const scale = mobile ? Math.max(width / 680, .6) : Math.max(width / 1500, .65);
    const cx = width * (mobile ? .65 : .735) + pointer.x * 18;
    const cy = height * (mobile ? .65 : .48) + pointer.y * 12 - descent * height * .18;
    ctx.fillStyle = '#020c18'; ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * .8);
    glow.addColorStop(0, '#020a16'); glow.addColorStop(.15, '#08283c');
    glow.addColorStop(.42, '#073045'); glow.addColorStop(1, '#020c18');
    ctx.globalAlpha = strength; ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

    // Oblique surface light with a slow tidal drift.
    for (let i = 0; i < 4; i++) {
      const x = width * (.48 + i * .15) + Math.sin(time * .09 + i) * 30;
      const light = ctx.createLinearGradient(x, 0, x - width * .35, height);
      light.addColorStop(0, '#79e5f01a'); light.addColorStop(1, '#79e5f000');
      ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + width * .035, 0);
      ctx.lineTo(x - width * .12, height); ctx.lineTo(x - width * .55, height); ctx.fill();
    }

    if (strength > .15) {
      for (let row = 0; row <= rings; row++) {
        const u = row / rings;
        ctx.beginPath();
        for (let col = 0; col <= segments; col++) {
          const p = surface(u, col / segments * TAU, cx, cy, scale, time);
          const k = (row * (segments + 1) + col) * 2;
          mesh[k] = p[0]; mesh[k + 1] = p[1];
          col ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
        }
        const alpha = (.13 + Math.sin(u * Math.PI) * .32) * strength;
        ctx.strokeStyle = `rgba(77,207,221,${alpha})`;
        ctx.lineWidth = row % 6 === 0 ? 1.15 : .65; ctx.stroke();
      }
      // Radial threads twist across wavefronts, revealing the lattice in depth.
      ctx.strokeStyle = `rgba(72,176,206,${.22 * strength})`; ctx.lineWidth = .65;
      ctx.beginPath();
      for (let col = 0; col < segments; col += 2) {
        for (let row = 0; row <= rings; row++) {
          const k = (row * (segments + 1) + col) * 2;
          row ? ctx.lineTo(mesh[k], mesh[k + 1]) : ctx.moveTo(mesh[k], mesh[k + 1]);
        }
      }
      ctx.stroke();
      // Long luminous currents make the scale legible before the first interaction.
      for (let strand = 0; strand < 9; strand++) {
        ctx.beginPath();
        for (let step = 0; step <= 160; step++) {
          const u = .12 + step / 160 * .91;
          const angle = strand * TAU / 9 + u * 1.5 + Math.sin(time * .12 + strand) * .08;
          const p = surface(u, angle, cx, cy, scale, time);
          step ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.strokeStyle = strand % 3 === 0 ? '#e8c88b90' : '#8cfff2a0';
        ctx.shadowColor = strand % 3 === 0 ? '#e8c88b' : '#55eadb';
        ctx.shadowBlur = 7;
        ctx.lineWidth = strand % 3 === 0 ? 1.3 : .9; ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // Packets move inward along the same continuous field, with a small luminous tail.
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 88; i++) {
        const u = .12 + fract(noise(i + 800) - time * (.018 + noise(i) * .018)) * .87;
        const angle = noise(i + 1000) * TAU + u * 1.5;
        const p = surface(u, angle, cx, cy, scale, time);
        const tail = surface(u + .012, angle + .018, cx, cy, scale, time);
        ctx.strokeStyle = i % 5 === 0 ? '#ffda92bb' : '#91ffefb0';
        ctx.lineWidth = .7 + u * 1.4; ctx.beginPath(); ctx.moveTo(...tail); ctx.lineTo(...p); ctx.stroke();
        ctx.fillStyle = i % 5 === 0 ? '#ffe4aa' : '#b5fff3';
        ctx.fillRect(p[0], p[1], 1.2 + u, 1.2 + u);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    for (const p of dust) {
      const x = fract(p.x + time * .002 * p.z) * width;
      const y = fract(p.y - time * .003 * p.z - descent * p.z * .06) * height;
      ctx.fillStyle = `rgba(161,227,239,${(.12 + p.z * .26) * (.7 + Math.sin(time * .4 + p.phase) * .3)})`;
      ctx.fillRect(x, y, p.z * 1.6, p.z * 1.6);
    }
    // Reserve calm water for readable editorial type on the left.
    const shade = ctx.createLinearGradient(0, 0, width, 0);
    shade.addColorStop(0, '#020c18e8'); shade.addColorStop(mobile ? .35 : .32, '#020c18b0');
    shade.addColorStop(.68, '#020c1800'); ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  }

  function updateButton() {
    if (!toggle) return;
    toggle.textContent = paused() ? '動きを再開する ▷' : '動きを止める Ⅱ';
    toggle.setAttribute('aria-pressed', String(paused())); toggle.hidden = reduced.matches;
  }
  function tick(now) {
    frame = 0;
    if (document.hidden) return;
    // Also synchronize in-frame: some browser media emulators defer change events.
    if (lastReduced !== reduced.matches) {
      lastReduced = reduced.matches;
      if (lastReduced) { pointer = { x: 0, y: 0 }; aim = { x: 0, y: 0 }; }
      dirty = true; updateButton();
    }
    if (now - previous >= 33 || dirty) {
      if (!paused() && previous) elapsed += Math.min((now - previous) / 1000, .08);
      if (!paused()) {
        pointer.x += (aim.x - pointer.x) * .055; pointer.y += (aim.y - pointer.y) * .055;
      }
      previous = now; dirty = false; draw();
      document.dispatchEvent(new CustomEvent('oceanframe', { detail: { time: elapsed, paused: paused() } }));
    }
    if (!paused()) frame = requestAnimationFrame(tick);
  }
  function request() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
  toggle?.addEventListener('click', () => { userPaused = !userPaused; dirty = true; previous = 0; updateButton(); request(); });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { pointer = { x: 0, y: 0 }; aim = { x: 0, y: 0 }; }
    dirty = true; previous = 0; updateButton(); request();
  });
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused()) return;
    aim.x = event.clientX / width * 2 - 1; aim.y = event.clientY / height * 2 - 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { aim = { x: 0, y: 0 }; });
  addEventListener('resize', () => { resize(); request(); });
  addEventListener('scroll', () => { dirty = true; request(); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    else { dirty = true; request(); }
  });
  resize(); updateButton(); request();
})();
