import { createProductModel } from './model-renderer.js?v=motion-4';
const canvas=document.querySelector('#systemModel');
const modules=[
    {name:'Radar',title:'01 / Project Radar',description:'Read public source pages, compare saved text snapshots, and collect a dated brief with links and excerpts. Network access is explicitly authorized.'},
    {name:'Studio',title:'02 / Content Studio',description:'Turn supplied facts into a release draft and review checklist. Local drafting works without a model; optional AI assistance requires separate permission and a configured provider.'},
    {name:'Watch',title:'03 / Site Watch',description:'Inspect page responses and a bounded set of same-site links. The report records observed HTTP results, not an unperformed full-site audit.'},
    {name:'Permissions',title:'04 / Permission boundary',description:'The task declares public web access, local persistence and optional model data sharing before execution. Private network destinations are rejected by the public-page tools.'},
    {name:'Execution',title:'05 / Task execution',description:'The local service validates and runs tasks, records progress and supports cancellation. Completed, failed, cancelled and interrupted states remain visible in task history.'},
    {name:'Deliverables',title:'06 / Reviewable output',description:'Reports and content drafts stay attached to their tasks. Read the evidence, download Markdown, reuse task inputs, or remove saved task data.'}
  ];
const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sources=[
 {path:'work/engine.mjs',find:"if(task.cartridge==='radar')"},
 {path:'work/draft.mjs',find:'createDraft'},
 {path:'work/engine.mjs',find:'const links='},
 {path:'work/engine.mjs',find:'isPublicAddress'},
 {path:'work/server.mjs',find:'async function run'},
 {path:'work/engine.mjs',find:'return {markdown:'}
];
$('.node-detail').insertAdjacentHTML('beforeend','<div class="module-source"><div class="module-source-head"><span><i></i> SOURCE CHANNEL</span><span id="moduleSourcePath">work/engine.mjs</span></div><div class="module-code-scroll" id="moduleCodeScroll" tabindex="0" aria-label="Scrollable module source code"><pre id="moduleCode">Loading project source…</pre></div><div class="module-source-foot"><span id="moduleSourceState">READING SOURCE</span><span>SOURCE VIEW · NOT AN EXECUTION LOG</span></div></div>');
$('.model-panel>.panel-foot').remove();
$('.model-panel').insertAdjacentHTML('beforeend','<div class="model-status-grid"><div><small>CORE</small><b>NV—01</b><span id="viewerStatus">VIEWER READY</span></div><div><small>CARTRIDGE</small><b id="statusCartridge">RADAR</b><span>SELECT A MODULE</span></div><div><small>EXECUTION</small><b>LOCAL</b><span>PERMISSION BOUND</span></div><div><small>OUTPUT</small><b>MARKDOWN</b><span>REVIEWABLE FILES</span></div></div>');
let sourceRequest,codeTouchedUntil=0,codeHover=false;
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadSource(index){
 sourceRequest?.abort();const request=new AbortController();sourceRequest=request;const spec=sources[index];
 $('#moduleSourcePath').textContent=spec.path;$('#moduleSourceState').textContent='READING SOURCE';$('#moduleCode').textContent='Loading project source…';
 try{const response=await fetch(spec.path,{signal:request.signal});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(request.signal.aborted)return;const lines=text.trimEnd().split('\n');$('#moduleCode').innerHTML=lines.map((line,i)=>'<span class="module-code-line" data-line="'+i+'"><span>'+String(i+1).padStart(3,'0')+'</span>'+escape(line)+'</span>').join('');const indexLine=Math.max(0,lines.findIndex(l=>l.includes(spec.find))-3);$('#moduleCodeScroll').scrollTop=indexLine*19;$('#moduleSourceState').textContent=lines.length+' LINES / SCROLL TO EXPLORE';codeTouchedUntil=performance.now()+3000;
 }catch(error){if(request.signal.aborted)return;$('#moduleCode').textContent='Source unavailable. Run this project over HTTP to load the source.';$('#moduleSourceState').textContent='READ ERROR';}
}
const codeScroller=$('#moduleCodeScroll');
codeScroller.addEventListener('pointerenter',()=>codeHover=true);codeScroller.addEventListener('pointerleave',()=>codeHover=false);
for(const event of ['wheel','touchstart','keydown','pointerdown'])codeScroller.addEventListener(event,()=>codeTouchedUntil=performance.now()+8000,{passive:true});
setInterval(()=>{if(document.hidden||reduced.matches||codeHover||codeScroller.matches(':focus')||performance.now()<codeTouchedUntil)return;const r=codeScroller.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const max=codeScroller.scrollHeight-codeScroller.clientHeight;if(max>0)codeScroller.scrollTop=codeScroller.scrollTop>=max-1?0:Math.min(max,codeScroller.scrollTop+19);},1700);
const renderer=createProductModel(canvas);
if(!renderer){$('#nodeDescription').textContent='The model is unavailable in this browser. Use the module buttons to explore the architecture.';loadSource(0);}
else{
 let baseYaw=.48,basePitch=.36,yaw=baseYaw,pitch=basePitch,zoom=1,drag=null,moved=false,visible=false,last=0,frame,pointer={x:0,y:0,inside:false},pauseUntil=0;
 function draw(){renderer.setView(yaw,pitch,zoom);}
 function select(index){renderer.select(index);$('#nodeTitle').textContent=modules[index].title;$('#nodeDescription').textContent=modules[index].description;$('#selectedModule').textContent=modules[index].name.toUpperCase();$('#statusCartridge').textContent=modules[index].name.toUpperCase();document.querySelectorAll('[data-node]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.node)===index)));loadSource(index);}
 document.querySelectorAll('[data-node]').forEach(b=>{
  const index=Number(b.dataset.node);b.addEventListener('click',()=>select(index));
  b.addEventListener('pointerenter',()=>renderer.hover(index));b.addEventListener('pointerleave',()=>renderer.hover(-1));
  b.addEventListener('focus',()=>renderer.hover(index));b.addEventListener('blur',()=>renderer.hover(-1));
 });
 canvas.addEventListener('pointerenter',()=>{pointer.inside=true;canvas.closest('.model-stage').classList.add('is-hovered');});
 canvas.addEventListener('pointerleave',()=>{pointer.inside=false;renderer.hover(-1);canvas.style.cursor='grab';canvas.closest('.model-stage').classList.remove('is-hovered');});
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId);pauseUntil=Infinity;});
 canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;
  if(!drag){const hit=renderer.hit(e.clientX-r.left,e.clientY-r.top);renderer.hover(hit??-1);canvas.style.cursor=hit===undefined?'grab':'pointer';return;}
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(e.clientX-drag.startX)+Math.abs(e.clientY-drag.startY)>5)moved=true;
  if(moved){baseYaw+=dx*.006;basePitch=Math.max(.18,Math.min(.8,basePitch+dy*.003));yaw=baseYaw;pitch=basePitch;draw();}drag.x=e.clientX;drag.y=e.clientY;
 });
 canvas.addEventListener('pointerup',e=>{if(!moved){const r=canvas.getBoundingClientRect(),index=renderer.hit(e.clientX-r.left,e.clientY-r.top);if(index!==undefined)select(index);}drag=null;pauseUntil=performance.now()+1800;});
 canvas.addEventListener('pointercancel',()=>{drag=null;pauseUntil=performance.now()+1800;});
 canvas.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zoom=Math.max(.7,Math.min(1.16,zoom-e.deltaY*.001));draw();},{passive:false});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')baseYaw-=.1;if(e.key==='ArrowRight')baseYaw+=.1;if(e.key==='ArrowUp')basePitch=Math.min(.8,basePitch+.05);if(e.key==='ArrowDown')basePitch=Math.max(.18,basePitch-.05);if(e.key==='Home'){baseYaw=.48;basePitch=.36;zoom=1;}yaw=baseYaw;pitch=basePitch;pauseUntil=performance.now()+3000;draw();});
 new ResizeObserver(()=>renderer.resize()).observe(canvas);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)draw();}).observe(canvas);
 function animate(time){
  if(visible&&!document.hidden&&!reduced.matches&&!drag&&time-last>80&&time>pauseUntil){
   const targetYaw=baseYaw+Math.sin(time*.00023)*.16+(pointer.inside?pointer.x*.11:0);
   const targetPitch=basePitch+Math.cos(time*.00018)*.018+(pointer.inside?pointer.y*.045:0);
   yaw+=(targetYaw-yaw)*.16;pitch+=(targetPitch-pitch)*.16;draw();last=time;
  }
  frame=requestAnimationFrame(animate);
 }
 addEventListener('pagehide',()=>{cancelAnimationFrame(frame);sourceRequest?.abort();});
 select(0);renderer.resize();frame=requestAnimationFrame(animate);
}
