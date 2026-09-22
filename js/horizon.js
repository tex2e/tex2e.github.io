(() => {
  'use strict';
  const canvas=document.getElementById('horizon-canvas');
  const ctx=canvas?.getContext('2d', {alpha:false});
  if(!ctx)return;
  const art=canvas.parentElement;
  const toggle=document.getElementById('horizon-motion');
  const globalToggle=document.getElementById('ocean-motion');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,ratio=0,visible=false,paused=globalToggle?.getAttribute('aria-pressed')==='true';
  const noise=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
  // Generated once per visible size. There is deliberately no animation render loop.
  function draw() {
    const rect=art.getBoundingClientRect();
    const w=Math.round(rect.width),h=Math.round(rect.height),dpr=Math.min(devicePixelRatio||1,1.5);
    if(!w||!h||(w===width&&h===height&&ratio===dpr))return;
    width=w;height=h;ratio=dpr;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const horizon=h*.22;
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#031321');sky.addColorStop(.18,'#102f40');sky.addColorStop(.22,'#1b4954');
    sky.addColorStop(.26,'#0e3345');sky.addColorStop(.65,'#061e30');sky.addColorStop(1,'#031321');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const haze=ctx.createRadialGradient(w*.58,horizon,0,w*.58,horizon,w*.5);
    haze.addColorStop(0,'#9ce5d014');haze.addColorStop(1,'#9ce5d000');
    ctx.save();ctx.translate(0,horizon*.68);ctx.scale(1,.32);ctx.fillStyle=haze;ctx.fillRect(0,-h,w,h*4);ctx.restore();
    // Perspective compresses many fine wavefronts toward the distant horizon.
    const rows=w<760?56:86,steps=w<760?110:210;
    for(let row=0;row<rows;row++) {
      const depth=(row+1)/rows;
      const y=horizon+Math.pow(depth,2.4)*(h-horizon)*1.16;
      const amplitude=.35+depth*depth*18;
      const phase=noise(row)*Math.PI*2;
      const line=ctx.createLinearGradient(0,0,w,0);
      const alpha=(.12+depth*.13)*(row%4===0?1.5:1);
      line.addColorStop(0,`rgba(93,170,185,${alpha*.4})`);
      line.addColorStop(.3,`rgba(93,170,185,${alpha})`);
      line.addColorStop(.58,`rgba(171,222,211,${alpha*1.35})`);
      line.addColorStop(1,`rgba(93,170,185,${alpha*.55})`);
      ctx.strokeStyle=line;ctx.lineWidth=row%5===0?1:.6;ctx.beginPath();
      for(let j=0;j<=steps;j++) {
        const x=j/steps*w;
        const wave=Math.sin(x/w*10+phase)*.5+Math.sin(x/w*23+phase*.7)*.28+Math.sin(x/w*41-phase)*.13;
        const py=y+wave*amplitude;
        j?ctx.lineTo(x,py):ctx.moveTo(x,py);
      }
      ctx.stroke();
      // Broken highlights, increasingly broad toward the viewer.
      if(row%2===0)for(let k=0;k<5;k++) {
        const x=noise(row*9+k+600)*w;
        const wave=Math.sin(x/w*10+phase)*.5+Math.sin(x/w*23+phase*.7)*.28+Math.sin(x/w*41-phase)*.13;
        ctx.fillStyle=`rgba(167,216,207,${.08+depth*.15})`;
        ctx.fillRect(x,y+wave*amplitude,1+depth*depth*28,.6);
      }
    }
    const rim=ctx.createLinearGradient(0,0,w,0);
    rim.addColorStop(0,'#8bcbc82a');rim.addColorStop(.58,'#c1e8d99c');rim.addColorStop(1,'#8bcbc822');
    ctx.strokeStyle=rim;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(w,horizon);ctx.stroke();
    for(let i=0;i<22;i++) {
      const x=noise(i+400)*w,y=horizon+noise(i+800)*3;
      ctx.fillStyle=i%7===0?'#decda984':'#a8dbd664';ctx.fillRect(x,y,i%4===0?2:1,.7);
    }
    // Fade only the near shore; the wavefronts continue past both screen edges.
    const fade=ctx.createLinearGradient(0,h*.7,0,h);
    fade.addColorStop(0,'#03132100');fade.addColorStop(1,'#031321');
    ctx.fillStyle=fade;ctx.fillRect(0,h*.7,w,h*.3);
    art.classList.add('horizon-ready');
  }
  function sync() {
    const stopped=paused||reduced.matches;
    art.dataset.motion=visible&&!document.hidden&&!stopped?'running':'paused';
    toggle.hidden=reduced.matches;
    toggle.textContent=stopped?'光の動きを再開する ▷':'光の動きを止める Ⅱ';
    toggle.setAttribute('aria-pressed',String(stopped));
  }
  toggle.addEventListener('click',()=>{
    if(globalToggle)globalToggle.click();else{paused=!paused;sync();}
  });
  document.addEventListener('oceanframe',event=>{
    if(paused===event.detail.paused)return;
    paused=event.detail.paused;sync();
  });
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;if(visible)draw();sync();
  }).observe(art);
  new ResizeObserver(()=>{if(visible)draw();}).observe(art);
  sync();
})();
