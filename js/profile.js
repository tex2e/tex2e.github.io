(() => {
  'use strict';
  // History anchors work even if Canvas is unavailable.
  function openHash() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    const detail = target.closest('details');
    if (detail) detail.open = true;
    if (target.id === 'activity-history') {
      const next = target.querySelector('details');
      if (next) next.open = true;
    }
  }
  addEventListener('hashchange', openHash); openHash();
  const canvas = document.getElementById('field-canvas');
  const ctx = canvas?.getContext('2d', { alpha: false });
  if (!ctx) return;
  const journey = document.querySelector('.evolution-journey');
  const stage = document.querySelector('.evolution-stage');
  const toggle = document.getElementById('evolution-motion');
  const oceanToggle = document.getElementById('ocean-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const atlas = document.createElement('canvas');
  const ink = atlas.getContext('2d');
  if (!ink) return;
  const titles = ['RANDOMNESS', 'CRYPTOGRAPHY', 'PROTOCOLS'];
  const colors = ['#8df0cf', '#f1cf8c', '#91cfff'];
  const names = [
    ['ENTROPY', 'TRNG', 'CSPRNG', 'DRBG', 'SEED', 'SAMPLING'],
    ['HASH', 'SYMMETRIC KEY', 'PUBLIC KEY', 'POST-QUANTUM', 'ZERO-KNOWLEDGE', 'SIGNATURE'],
    ['TLS 1.3', 'SSH', 'QUIC', 'IPsec', 'KEY EXCHANGE', 'AUTHENTICATION']
  ];
  let w = 0, h = 0, viewH = 0, worldH = 0, dpr = 1, mobile = false;
  let paths = [], leaves = [], labels = [], queued = false, inView = false;
  let time = 0, paused = reduced.matches, lastScene = -1;
  const hover = { x: 0, y: 0, active: false, leaveTime: -Infinity };
  let tapStart = null, ripples = [];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  let seed = 20260921;
  function random() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }
  function trunk(y) { return w * (mobile ? .5 : .65) + Math.sin(y / h * 3.6) * w * (mobile ? .055 : .035); }
  function point(path, t) {
    const s = 1 - t;
    return { x: s*s*s*path.x + 3*s*s*t*path.cx + 3*s*t*t*path.dx + t*t*t*path.ex,
      y: s*s*s*path.y + 3*s*s*t*path.cy + 3*s*t*t*path.dy + t*t*t*path.ey };
  }
  function trace(p) { ink.moveTo(p.x, p.y); ink.bezierCurveTo(p.cx, p.cy, p.dx, p.dy, p.ex, p.ey); }
  function branch(x, y, angle, length, depth, scene) {
    const ex = clamp(x + Math.cos(angle) * length, w * .025, w * .97);
    const ey = y + Math.sin(angle) * length;
    const bend = scene === 0 ? length * .32 : scene === 1 ? 0 : length * -.24;
    const p = { x, y, cx: x + (ex-x)*.35 - Math.sin(angle)*bend,
      cy: y + (ey-y)*.35 + Math.cos(angle)*bend,
      dx: x + (ex-x)*.75, dy: y + (ey-y)*.75, ex, ey, depth, scene, phase: random() };
    paths.push(p);
    if (depth === 0) { leaves.push({x:ex, y:ey, scene, phase:random()}); return; }
    const spread = scene === 1 ? .53 : .3 + random() * .38;
    for (const direction of [-1, 1]) {
      branch(ex, ey, angle + direction * spread + (random()-.5)*.18,
        length * (.61 + random()*.13), depth-1, scene);
    }
  }
  function build() {
    seed = 20260921; paths = []; leaves = []; labels = [];
    for (let scene = 0; scene < 3; scene++) {
      for (let i = 0; i < 6; i++) {
        const side = i % 2 ? 1 : -1;
        const y = h * (scene + (mobile ? .48 : .23) + Math.floor(i/2) * (mobile ? .14 : .23));
        const angle = side === 1 ? -.36 : Math.PI + .36;
        const length = w * (mobile ? .17 : .095) * (.9 + random()*.2);
        const rootIndex = paths.length;
        branch(trunk(y), y, angle, length, mobile ? 5 : 6, scene);
        const root = paths[rootIndex];
        labels.push({x:root.ex + side * (mobile ? 8 : 18), y:root.ey + (i % 2 ? 20 : -20), side, scene, text:names[scene][i]});
      }
    }
    ink.setTransform(dpr, 0, 0, dpr, 0, 0);
    ink.fillStyle = '#030f1b'; ink.fillRect(0, 0, w, worldH);
    // Each biome has a different atmosphere; the geometry belongs to one world space.
    for (let scene = 0; scene < 3; scene++) {
      const y = (scene + .55) * h, x = trunk(y);
      const halo = ink.createRadialGradient(x, y, 0, x, y, Math.max(w*.43, h*.5));
      halo.addColorStop(0, [ '#103b35', '#332e23', '#132d48' ][scene]);
      halo.addColorStop(1, '#030f1b00');
      ink.fillStyle = halo; ink.fillRect(0, 0, w, worldH);
      ink.strokeStyle = colors[scene] + '0d'; ink.lineWidth = .7;
      for (let ring=0; ring<7; ring++) {
        ink.beginPath(); ink.ellipse(x,y,w*(.12+ring*.035),h*(.19+ring*.035),-.3,0,Math.PI*2); ink.stroke();
      }
      for (let i = 0; i < 180; i++) {
        ink.fillStyle = colors[scene] + (i%5 ? '30' : '75');
        ink.fillRect(random()*w, (scene+random())*h, random()*1.5+.3, 1);
      }
    }
    // Render the expensive topology once. Animation only moves light along its paths.
    for (const p of paths) {
      ink.beginPath(); trace(p);
      ink.strokeStyle = colors[p.scene] + (p.depth > 3 ? 'a0' : p.depth > 1 ? '60' : '35');
      ink.lineWidth = .35 + p.depth * .24; ink.stroke();
      if (p.depth > 3) {
        ink.strokeStyle = colors[p.scene] + '0c'; ink.lineWidth = 7; ink.stroke();
      }
    }
    // Protocol branches acquire lateral links, turning a tree into a communicating network.
    const endpoints = leaves.filter(p=>p.scene===2);
    ink.strokeStyle = '#91cfff24'; ink.lineWidth = .6;
    for (let i=0;i<endpoints.length;i+=5) {
      const a=endpoints[i], b=endpoints[(i+39)%endpoints.length];
      if (Math.hypot(a.x-b.x,a.y-b.y)>w*.23) continue;
      ink.beginPath();ink.moveTo(a.x,a.y);ink.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-25,b.x,b.y);ink.stroke();
    }
    const gradient=ink.createLinearGradient(0,0,0,worldH);
    // Let the first trunk emerge from the heading before the earliest branch.
    gradient.addColorStop(0,colors[0]+'00');
    gradient.addColorStop(h*.25/worldH,colors[0]);
    colors.forEach((c,i)=>gradient.addColorStop((i+.5)/3,c));
    // An uninterrupted bundle: all six primary branches in every world attach to it.
    for (let strand=-3;strand<=3;strand++) {
      ink.beginPath();
      for (let y=0;y<=worldH;y+=3) {
        const x=trunk(y)+strand*2.5+Math.sin(y*.012+strand)*3;
        y ? ink.lineTo(x,y) : ink.moveTo(x,y);
      }
      ink.strokeStyle=gradient;ink.globalAlpha=strand===0?.95:.25;ink.lineWidth=strand===0?2:1;ink.stroke();
    }
    ink.globalAlpha=1;
    // Keep chapter copy calm without masking the shared trunk.
    if (!mobile) {
      const shade=ink.createLinearGradient(0,0,w*.48,0);
      shade.addColorStop(0,'#030f1bf8');shade.addColorStop(.7,'#030f1be0');shade.addColorStop(1,'#030f1b00');
      ink.fillStyle=shade;ink.fillRect(0,0,w,worldH);
    }
    if (mobile) {
      for (let scene=0;scene<3;scene++) {
        const top=scene*h;
        const shade=ink.createLinearGradient(0,top,0,top+h*.5);
        shade.addColorStop(0,'#030f1bf5');shade.addColorStop(.75,'#030f1be8');shade.addColorStop(1,'#030f1b00');
        ink.fillStyle=shade;ink.fillRect(0,top,w,h*.5);
      }
    }
    for (const label of labels) {
      ink.font=`${mobile?7:9}px ui-monospace, monospace`;
      const tw=ink.measureText(label.text).width;
      let x=label.side<0?label.x-tw:label.x;
      x=clamp(x,12,w-tw-12);
      ink.fillStyle='#030f1bd9';ink.fillRect(x-5,label.y-11,tw+10,17);
      ink.fillStyle=colors[label.scene];ink.fillText(label.text,x,label.y);
    }
    const entrance=ink.createLinearGradient(0,0,0,h*.28);
    entrance.addColorStop(0,'#030f1b');entrance.addColorStop(1,'#030f1b00');
    ink.fillStyle=entrance;ink.fillRect(0,0,w,h*.28);
    document.documentElement.classList.add('evolution-ready');
  }
  function resize() {
    const rect=stage.getBoundingClientRect();
    const nextW=Math.round(rect.width), nextH=Math.round(rect.height);
    if (!nextW||!nextH) return;
    const nextDpr=Math.min(devicePixelRatio||1,1.5);
    if(w===nextW&&viewH===nextH&&dpr===nextDpr)return;
    w=nextW;viewH=nextH;mobile=w<=760;h=Math.max(viewH,mobile?900:700);worldH=h*3;dpr=nextDpr;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(viewH*dpr);
    atlas.width=canvas.width;atlas.height=Math.round(worldH*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);build();queue();
  }
  function cameraOffset() {
    const rect=journey.getBoundingClientRect();
    return clamp(-rect.top/Math.max(1,rect.height-viewH))*(worldH-viewH);
  }
  function drawLeaves(camera) {
    const hoverPower=hover.active?1:clamp(1-(time-hover.leaveTime)/.5);
    ripples=ripples.filter(ripple=>time-ripple.start<1.25);
    for (const leaf of leaves) {
      if(leaf.y<camera-12||leaf.y>camera+viewH+12)continue;
      let alpha=mobile?clamp(((leaf.y%h)/h-.35)/.15):clamp((leaf.x/w-.18)/.34);
      if(leaf.y<h*.28)alpha*=clamp(leaf.y/(h*.28));
      if(alpha<=0)continue;
      let dx=0,dy=0,force=0;
      if(hoverPower>0) {
        const distance=Math.hypot(leaf.x-hover.x,leaf.y-hover.y);
        const nearby=hoverPower*clamp(1-distance/(mobile?105:150))**2;
        dx+=Math.sin(time*7+leaf.phase*6.28)*nearby*8;
        dy+=Math.cos(time*5+leaf.phase*6.28)*nearby*3;
        force+=nearby;
      }
      for(const ripple of ripples) {
        const age=time-ripple.start;
        const distance=Math.hypot(leaf.x-ripple.x,leaf.y-ripple.y);
        const wave=clamp(1-Math.abs(distance-age*180)/65)*(1-age/1.25);
        dx+=Math.sin(time*9+leaf.phase*6.28)*wave*10;
        dy+=Math.cos(time*7+leaf.phase*6.28)*wave*4;
        force+=wave;
      }
      const x=leaf.x+dx,y=leaf.y-camera+dy,scene=leaf.scene;
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=colors[scene]+'65';ctx.fillStyle=colors[scene]+'90';
      ctx.lineWidth=.6;
      if(scene===0) {
        ctx.beginPath();ctx.arc(x,y,.7+leaf.phase*1.8,0,Math.PI*2);ctx.fill();
        if(leaf.phase>.88||force>.35) {ctx.beginPath();ctx.arc(x,y,5+Math.min(force,1)*2,0,Math.PI*2);ctx.stroke();}
      } else if(scene===1) {
        const r=2+leaf.phase*3;
        ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.6,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.6,y);ctx.closePath();ctx.stroke();
      } else {
        ctx.fillRect(x-1,y-1,2,2);
        if(leaf.phase>.75||force>.35) {ctx.beginPath();ctx.arc(x,y,4+Math.min(force,1)*2,0,Math.PI*2);ctx.stroke();}
      }
    }
    ctx.globalAlpha=1;
  }
  function render() {
    queued=false;
    if(document.hidden||!inView||!w)return;
    const camera=cameraOffset();
    ctx.drawImage(atlas,0,camera*dpr,atlas.width,viewH*dpr,0,0,w,viewH);
    drawLeaves(camera);
    const scene=Math.min(2,Math.floor((camera+viewH*.5)/h));
    if(scene!==lastScene){
      document.getElementById('field-number').textContent=`0${scene+1}`;
      document.getElementById('field-label').textContent=titles[scene];lastScene=scene;
      stage.style.setProperty('--world-color',colors[scene]);
    }
    ctx.globalCompositeOperation='lighter';
    // A continuous pulse follows the trunk through all three habitats.
    for(let i=0;i<28;i++) {
      const y=((i/28*worldH+time*37)%worldH);
      if(y<camera-20||y>camera+viewH+20)continue;
      ctx.globalAlpha=(mobile?clamp(((y%h)/h-.35)/.15):1)*clamp(y/(h*.25));
      const col=colors[Math.min(2,Math.floor(y/h))];
      ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.beginPath();
      for(let j=0;j<18;j++){const py=y-j;j?ctx.lineTo(trunk(py),py-camera):ctx.moveTo(trunk(py),py-camera);}ctx.stroke();
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(trunk(y),y-camera,2,0,Math.PI*2);ctx.fill();
    }
    for(let i=0;i<paths.length;i+=mobile?7:9){
      const p=paths[i];if(Math.max(p.y,p.ey)<camera-60||Math.min(p.y,p.ey)>camera+viewH+60)continue;
      const pos=point(p,(p.phase+time*(p.scene===2?.15:.075))%1);
      ctx.fillStyle=colors[p.scene];ctx.globalAlpha=(.4+p.depth*.08)*(mobile?clamp(((pos.y%h)/h-.35)/.15):1);
      ctx.fillRect(pos.x,pos.y-camera,1.3,1.3);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  function queue(){if(!queued&&!document.hidden&&inView){queued=true;requestAnimationFrame(render);}}
  function worldPoint(event) {
    const rect=stage.getBoundingClientRect();
    return {x:event.clientX-rect.left,y:event.clientY-rect.top+cameraOffset()};
  }
  stage.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||paused)return;
    Object.assign(hover,worldPoint(event),{active:true});queue();
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{
    if(!hover.active)return;
    hover.active=false;hover.leaveTime=time;queue();
  });
  stage.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'||paused||event.target.closest('button,a'))return;
    tapStart={id:event.pointerId,x:event.clientX,y:event.clientY};
  },{passive:true});
  stage.addEventListener('pointerup',event=>{
    if(!tapStart||event.pointerId!==tapStart.id)return;
    if(!paused&&Math.hypot(event.clientX-tapStart.x,event.clientY-tapStart.y)<12) {
      ripples.push({...worldPoint(event),start:time});
      if(ripples.length>3)ripples.shift();
      queue();
    }
    tapStart=null;
  },{passive:true});
  stage.addEventListener('pointercancel',()=>{tapStart=null;});
  function syncButton(){toggle.hidden=reduced.matches;toggle.textContent=paused?'動きを再開する ▷':'動きを止める Ⅱ';toggle.setAttribute('aria-pressed',String(paused));}
  toggle.addEventListener('click',()=>oceanToggle?.click());
  document.addEventListener('oceanframe',event=>{
    const changed=paused!==event.detail.paused||toggle.hidden!==reduced.matches;
    paused=event.detail.paused;
    if(!paused)time=event.detail.time;
    if(changed){
      syncButton();
      if(paused){hover.active=false;hover.leaveTime=-Infinity;ripples=[];queue();}
    }
    if(!paused)queue();
  });
  reduced.addEventListener('change',()=>{paused=reduced.matches||oceanToggle?.getAttribute('aria-pressed')==='true';syncButton();queue();});
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView){resize();queue();}},{rootMargin:'100px'});
  observer.observe(journey);
  new ResizeObserver(resize).observe(stage);
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',()=>{resize();queue();});
  document.addEventListener('visibilitychange',queue);
  syncButton();resize();
})();
