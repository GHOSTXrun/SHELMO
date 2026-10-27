import { createProductModel } from './model-renderer.js?v=product-3';
const canvas=document.querySelector('#systemModel');
const modules=[
    {name:'Radar',title:'01 / Project Radar',description:'Read public source pages, compare saved text snapshots, and collect a dated brief with links and excerpts. Network access is explicitly authorized.'},
    {name:'Studio',title:'02 / Content Studio',description:'Turn supplied facts into a release draft and review checklist. Local drafting works without a model; optional AI assistance requires separate permission and a configured provider.'},
    {name:'Watch',title:'03 / Site Watch',description:'Inspect page responses and a bounded set of same-site links. The report records observed HTTP results, not an unperformed full-site audit.'},
    {name:'Permissions',title:'04 / Permission boundary',description:'The task declares public web access, local persistence and optional model data sharing before execution. Private network destinations are rejected by the public-page tools.'},
    {name:'Execution',title:'05 / Task execution',description:'The local service validates and runs tasks, records progress and supports cancellation. Completed, failed, cancelled and interrupted states remain visible in task history.'},
    {name:'Deliverables',title:'06 / Reviewable output',description:'Reports and content drafts stay attached to their tasks. Read the evidence, download Markdown, reuse task inputs, or remove saved task data.'}
  ];
const renderer=createProductModel(canvas);
if(!renderer){document.querySelector('#nodeDescription').textContent='The model is unavailable in this browser. Use the module buttons to explore the architecture.';}
else{
 let yaw=.48,pitch=.36,zoom=1,selected=0,auto=false,drag=null,moved=false,visible=false,last=0,frame;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const label=()=>{document.querySelector('#rotateModel').textContent=auto?'PAUSE ROTATION':'AUTO ROTATE';document.querySelector('#rotateModel').setAttribute('aria-pressed',String(auto));};
 function draw(){renderer.setView(yaw,pitch,zoom);}
 function select(index){selected=index;renderer.select(index);document.querySelector('#nodeTitle').textContent=modules[index].title;document.querySelector('#nodeDescription').textContent=modules[index].description;document.querySelector('#selectedModule').textContent=modules[index].name.toUpperCase();document.querySelectorAll('[data-node]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.node)===index)));}
 document.querySelectorAll('[data-node]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.node))));
 document.querySelector('#rotateModel').onclick=()=>{auto=!auto;last=0;label();};
 document.querySelector('#resetModel').onclick=()=>{yaw=.48;pitch=.36;zoom=1;draw();};
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(e.clientX-drag.startX)+Math.abs(e.clientY-drag.startY)>5)moved=true;if(moved){auto=false;label();yaw+=dx*.006;pitch=Math.max(.18,Math.min(.8,pitch+dy*.003));draw();}drag.x=e.clientX;drag.y=e.clientY;});
 canvas.addEventListener('pointerup',e=>{if(!moved){const r=canvas.getBoundingClientRect(),index=renderer.hit(e.clientX-r.left,e.clientY-r.top);if(index!==undefined)select(index);}drag=null;});
 canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zoom=Math.max(.7,Math.min(1.16,zoom-e.deltaY*.001));draw();},{passive:false});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();auto=false;label();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(.8,pitch+.05);if(e.key==='ArrowDown')pitch=Math.max(.18,pitch-.05);if(e.key==='Home'){yaw=.48;pitch=.36;zoom=1;}draw();});
 new ResizeObserver(()=>renderer.resize()).observe(canvas);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)draw();}).observe(canvas);
 function animate(time){if(auto&&visible&&!document.hidden&&!reduced.matches&&time-last>65){yaw+=last?Math.min(time-last,100)*.00004:0;draw();last=time;}frame=requestAnimationFrame(animate);}
 addEventListener('pagehide',()=>cancelAnimationFrame(frame));select(0);label();renderer.resize();frame=requestAnimationFrame(animate);
}
