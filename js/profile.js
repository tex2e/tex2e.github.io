(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px), (max-height: 650px)');
  const field = document.getElementById('field-canvas');
  const fieldContext = field.getContext('2d');
  if (!fieldContext) return;
  document.documentElement.classList.add('canvas-ready');
  const chapters = [...document.querySelectorAll('.chapter')];
  const labels = ['RANDOMNESS', 'CRYPTOGRAPHY', 'PROTOCOLS'];
  const captions = ['A LITTLE UNPREDICTABLE.', 'A SECRET, TRANSFORMED.', 'A SHARED SET OF RULES.'];
  const colors = ['#9ce7dc', '#e0c48a', '#8ccbeb'];
  let sceneTime = 0, motionPaused = reduced.matches;
  document.addEventListener('oceanframe', event => {
    sceneTime = event.detail.time; motionPaused = event.detail.paused;
    if (visible(field) || [...document.querySelectorAll('[data-static-scene]')].some(visible)) queue();
  });
  const fieldNumber = document.getElementById('field-number');
  const fieldLabel = document.getElementById('field-label');
  const fieldCaption = document.getElementById('field-caption');
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rand = random(2026);
  const particles = Array.from({length: 112}, (_, i) => ({x: .1 + rand() * .8, y: .12 + rand() * .76, r: 1 + rand() * 2, bit: i % 2}));
  const dimensions = new WeakMap();
  function size(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(rect.width), h = Math.round(rect.height);
    const key = `${w},${h},${dpr}`;
    if (dimensions.get(canvas) !== key) { canvas.width = w*dpr; canvas.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); dimensions.set(canvas,key); }
    return {w,h};
  }
  function visible(el) { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }
  function fieldDraw(progress, canvas = field, ctx = fieldContext, phase = 0) {
    const {w,h} = size(canvas,ctx);
    ctx.clearRect(0,0,w,h);
    const a = Math.floor(progress), b = Math.min(2,a+1), t = smooth(progress-a);
    const time = reduced.matches || motionPaused ? 0 : sceneTime;
    const streamY = (x,row) => .27 + row*.15 + Math.sin(x*6.28+row*.9)*.055;
    function keyPosition(i) {
      if(i<60) {
        const side = i/60*6, vertex = Math.floor(side), part = side-vertex;
        const angle = vertex*Math.PI/3-Math.PI/2;
        const radius = Math.min(w*.17,h*.22);
        return {x:.32 + mix(Math.cos(angle),Math.cos(angle+Math.PI/3),part)*radius/w,
                y:.46 + mix(Math.sin(angle),Math.sin(angle+Math.PI/3),part)*radius/h};
      }
      const joint = .32 + Math.sqrt(3)/2*Math.min(w*.17,h*.22)/w;
      const path = [[joint,.44],[.83,.44],[.83,.61],[.76,.61],[.76,.52],[.69,.52],[.69,.62],[.62,.62],[.62,.49],[joint,.49]];
      const value = (i-60)/51*(path.length-1), index = Math.min(path.length-2,Math.floor(value));
      return {x:mix(path[index][0],path[index+1][0],value-index),y:mix(path[index][1],path[index+1][1],value-index)};
    }
    function position(p,i,scene) {
      if(scene === 0) return {x:(p.x+Math.sin(time*.25+i*1.7)*.045)*w,y:(p.y+Math.sin(time*.19+i*.8)*.055)*h};
      if(scene === 1) {const k=keyPosition(i);return {x:k.x*w,y:k.y*h};}
      const row = Math.floor(i/28), col = i%28;
      const drift = (col/28 + (phase*.3 + time*.045)*(row%2?-1:1) + 100) % 1;
      const x=.12+drift*.76;
      return {x:x*w, y:streamY(x,row)*h};
    }
    // A current replaces the old orbital rings and carries packets between endpoints.
    for(let row=0;row<4;row++) {
      ctx.strokeStyle=progress>1?'#8ccbeb50':'#8ccbeb14';ctx.lineWidth=1;
      ctx.beginPath();
      for(let i=0;i<=40;i++) {const x=.09+i*.82/40,y=streamY(x,row)*h;i?ctx.lineTo(x*w,y):ctx.moveTo(x*w,y);}
      ctx.stroke();
    }
    if(progress>1) {
      ctx.globalAlpha=progress-1;
      ctx.fillStyle=colors[2];ctx.font='9px monospace';ctx.textAlign='left';ctx.fillText('ENDPOINT A',w*.07,h*.13);ctx.textAlign='right';ctx.fillText('ENDPOINT B',w*.93,h*.13);
      for(const x of [.075,.925])for(let row=0;row<4;row++){
        const y=streamY(x,row)*h;ctx.beginPath();
        for(let j=0;j<6;j++){const angle=j*Math.PI/3;const px=x*w+Math.cos(angle)*6,py=y+Math.sin(angle)*6;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}
        ctx.closePath();ctx.strokeStyle='#8ccbeb99';ctx.stroke();
      }
      ctx.globalAlpha=1;
    }
    particles.forEach((p,i)=>{
      const from=position(p,i,a),to=position(p,i,b),x=mix(from.x,to.x,t),y=mix(from.y,to.y,t);
      ctx.fillStyle=colors[Math.round(progress)];ctx.globalAlpha=.45+(i%5)*.12;
      ctx.beginPath();ctx.arc(x,y,progress<.65?p.r:1.8,0,Math.PI*2);ctx.fill();
      if(i%19===0){ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();}
      if(progress<.65&&i%13===0){ctx.globalAlpha=.65;ctx.font='10px monospace';ctx.fillText(String(p.bit),x+8,y+3);}
    });
    ctx.globalAlpha=1;
    if(progress>.55 && progress<1.5){ctx.fillStyle=colors[1];ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('A KEY TO THE INVISIBLE',w/2,h*.86);}
  }
  let queued=false;
  function render(now) {
    queued=false;if(document.hidden)return;
    let progress=0;
    if(!compact.matches && !reduced.matches){const centers=chapters.map(c=>{const r=c.getBoundingClientRect();return r.top+r.height/2-innerHeight/2;});if(centers[0]<0){if(centers[1]>=0)progress=clamp(-centers[0]/(centers[1]-centers[0]));else progress=1+clamp(-centers[1]/(centers[2]-centers[1]));}}
    const current=Math.round(progress);
    fieldNumber.textContent=`0${current+1}`;fieldLabel.textContent=labels[current];fieldCaption.textContent=captions[current];
    document.querySelectorAll('.stage-progress i').forEach((el,i)=>el.classList.toggle('active',i===current));
    if(visible(field))fieldDraw(progress, field, fieldContext, reduced.matches ? 0 : clamp(-chapters[2].getBoundingClientRect().top / innerHeight, -.5, 1));
    if(compact.matches || reduced.matches) document.querySelectorAll('[data-static-scene]').forEach(canvas => { if(visible(canvas)) fieldDraw(Number(canvas.dataset.staticScene),canvas,canvas.getContext('2d')); });

  }
  function queue(){if(!queued&&!document.hidden){queued=true;requestAnimationFrame(render);}}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);addEventListener('pageshow',queue);document.addEventListener('visibilitychange',()=>{queued=false;queue();});reduced.addEventListener('change',queue);compact.addEventListener('change',queue);
  // Compact and reduced-motion views keep the explanations in the normal document flow.
  function openHash(){const target=document.getElementById(location.hash.slice(1));if(!target)return;const detail=target.closest('details');if(detail)detail.open=true;if(target.id==='activity-history'){const next=target.querySelector('details');if(next?.tagName==='DETAILS')next.open=true;}}
  addEventListener('hashchange',openHash);openHash();queue();
})();
