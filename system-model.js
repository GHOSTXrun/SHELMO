(() => {
  const canvas=document.querySelector('#systemModel');
  const ctx=canvas.getContext('2d');
  if(!ctx){document.querySelector('#nodeDescription').textContent='Your browser does not support the model canvas. Use the module buttons below to read the architecture.';return;}
  const modules=[
    {name:'Radar',title:'01 / Project Radar',description:'Read public source pages, compare saved text snapshots, and collect a dated brief with links and excerpts. Network access is explicitly authorized.'},
    {name:'Studio',title:'02 / Content Studio',description:'Turn supplied facts into a release draft and review checklist. Local drafting works without a model; optional AI assistance requires separate permission and a configured provider.'},
    {name:'Watch',title:'03 / Site Watch',description:'Inspect page responses and a bounded set of same-site links. The report records observed HTTP results, not an unperformed full-site audit.'},
    {name:'Permissions',title:'04 / Permission boundary',description:'The task declares public web access, local persistence and optional model data sharing before execution. Private network destinations are rejected by the public-page tools.'},
    {name:'Execution',title:'05 / Task execution',description:'The local service validates and runs tasks, records progress and supports cancellation. Completed, failed, cancelled and interrupted states remain visible in task history.'},
    {name:'Deliverables',title:'06 / Reviewable output',description:'Reports and content drafts stay attached to their tasks. Read the evidence, download Markdown, reuse task inputs, or remove saved task data.'}
  ];
  let yaw=.55,pitch=.58,zoom=1,selected=0,auto=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=1,height=1,scale=1,frame=0,last=0,drag=null,moved=false,visible=true;
  let shapes=[],targets=[],layer=0;
  const palette={line:'#9abe57',dim:'#476b36',lime:'#c4f34b',cream:'#ddd8b6',board:'#102b1c',side:'#0c2116'};
  function project(p){const [x,y,z]=p;const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);const depth=b*Math.cos(pitch)+y*Math.sin(pitch);const perspective=900/(900-depth);return {x:width/2+a*scale*perspective,y:height*.52+(-y*Math.cos(pitch)+b*Math.sin(pitch))*scale*perspective,d:depth};}
  function polygon(points,fill,stroke=palette.dim,line=1){const p=points.map(project);shapes.push({depth:p.reduce((n,v)=>n+v.d,0)/p.length+layer,draw(){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}});}
  function line(points,color=palette.dim,size=1){const p=points.map(project);shapes.push({depth:p.reduce((n,v)=>n+v.d,0)/p.length+.1+layer,draw(){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.strokeStyle=color;ctx.lineWidth=size;ctx.stroke();}});}
  function ring(x,y,z,r,color=palette.line,size=1){const points=[];for(let i=0;i<=64;i++){const a=i*Math.PI*2/64;points.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r]);}line(points,color,size);}
  function cylinder(x,y,z,r,h,fill=palette.board,stroke=palette.line){const n=48;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;polygon([[x+r*Math.cos(a),y,z+r*Math.sin(a)],[x+r*Math.cos(b),y,z+r*Math.sin(b)],[x+r*Math.cos(b),y+h,z+r*Math.sin(b)],[x+r*Math.cos(a),y+h,z+r*Math.sin(a)]],fill,null);}const top=[];for(let i=0;i<n;i++){const a=i*Math.PI*2/n;top.push([x+r*Math.cos(a),y+h,z+r*Math.sin(a)]);}polygon(top,fill,stroke);ring(x,y,z,r,stroke);ring(x,y+h,z,r,stroke);}
  function box(x,y,z,w,h,d,fill='#193522',stroke=palette.line){const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];const top=p=>[p[0],p[1]+h,p[2]];polygon([a,b,top(b),top(a)],fill,stroke);polygon([b,c,top(c),top(b)],fill,stroke);polygon([c,e,top(e),top(c)],fill,stroke);polygon([e,a,top(a),top(e)],fill,stroke);polygon([top(a),top(b),top(c),top(e)],fill,stroke);}
  function build(){shapes=[];targets=[];
    cylinder(0,-88,0,226,13,palette.side,palette.dim);cylinder(0,-75,0,220,13,palette.board,palette.line);ring(0,-60,0,209,palette.line);ring(0,-60,0,202,palette.dim);
    for(let i=0;i<32;i++){const a=i*Math.PI*2/32;line([[Math.cos(a)*213,-60,Math.sin(a)*213],[Math.cos(a)*218,-60,Math.sin(a)*218]],i%4===0?palette.lime:palette.dim);}
    cylinder(0,-61,0,76,13,'#183321',palette.cream);ring(0,-47,0,68,palette.line);
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3+.2,x=Math.cos(angle)*151,z=Math.sin(angle)*151,active=i===selected;
      line([[Math.cos(angle)*77,-59,Math.sin(angle)*77],[x*.73,-59,z*.73],[x,-59,z]],active?palette.lime:palette.dim,active?1.7:1);
      cylinder(x,-60,z,29,18,palette.board,active?palette.lime:palette.line);ring(x,-41,z,23,active?palette.lime:palette.dim);
      box(x,-40,z,32,10,21,active?'#395825':'#1c3923',active?palette.lime:palette.line);
      for(let k=-1;k<=1;k++)box(x+k*9,-42,z+16,3,4,7,'#263f25',palette.dim);
      for(let k=0;k<4;k++){const a=k*Math.PI/2;ring(x+Math.cos(a)*20,-40,z+Math.sin(a)*20,1.5,active?palette.lime:palette.dim);}
      targets.push({...project([x,-20,z]),index:i});
    }
    box(0,-46,0,103,126,86,'#253a28',palette.cream);
    box(0,-50,0,108,8,91,'#172e1e',palette.cream);
    // Composite the front panel only when it faces the camera.
    if(Math.cos(yaw)>0){layer=1000;
    polygon([[-43,66,44],[43,66,44],[43,-6,44],[-43,-6,44]],'#556044',palette.cream);
    layer=2000;
    polygon([[-35,59,45],[35,59,45],[38,55,45],[38,4,45],[34,0,45],[-34,0,45],[-38,4,45],[-38,55,45]],'#07190e',palette.line,1.2);
    layer=3000;
    line([[-23,44,46],[-12,33,46],[-23,22,46]],palette.lime,3);
    line([[-5,20,46],[8,20,46]],palette.lime,3);
    polygon([[-32,-18,45],[-22,-18,45],[-20,-23,45],[-22,-28,45],[-32,-28,45],[-35,-23,45]],'#a1d537',palette.lime);
    line([[8,-21,45],[32,-21,45]],palette.cream,2);line([[8,-29,45],[32,-29,45]],palette.dim,2);
    layer=0;}
    // Replaceable cartridge on the machine's right side.
    box(62,-2,5,39,30,38,'#53772b',palette.lime);box(84,2,5,8,22,29,'#83a93e',palette.lime);
    for(let i=0;i<5;i++)line([[79,5+i*3,21],[86,5+i*3,21]],'#bfe775',1);
    box(-34,-58,25,13,9,13,'#213a23',palette.cream);box(34,-58,25,13,9,13,'#213a23',palette.cream);
  }
  function paint(){if(!visible)return;ctx.clearRect(0,0,width,height);build();shapes.sort((a,b)=>a.depth-b.depth);shapes.forEach(s=>s.draw());
    targets.forEach(t=>{const selectedNode=t.index===selected;ctx.font=`${Math.max(8,Math.min(10,width/85))}px Consolas, monospace`;ctx.textAlign='center';ctx.fillStyle=selectedNode?'#def5ad':'#8eaa78';ctx.fillText(String(t.index+1).padStart(2,'0')+' / '+modules[t.index].name.toUpperCase(),t.x,t.y-13);});
  }
  function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);scale=Math.min(width/650,height/480)*zoom;paint();}
  function select(index){selected=index;document.querySelector('#nodeTitle').textContent=modules[index].title;document.querySelector('#nodeDescription').textContent=modules[index].description;document.querySelector('#selectedModule').textContent=modules[index].name.toUpperCase();document.querySelectorAll('[data-node]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.node)===index)));paint();}
  document.querySelectorAll('[data-node]').forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.node))));
  function autoLabel(){const button=document.querySelector('#rotateModel');button.textContent=auto?'PAUSE ROTATION':'AUTO ROTATE';button.setAttribute('aria-pressed',String(auto));}
  document.querySelector('#rotateModel').onclick=()=>{auto=!auto;autoLabel();};
  document.querySelector('#resetModel').onclick=()=>{yaw=.55;pitch=.58;zoom=1;resize();};
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(e.clientX-drag.startX)+Math.abs(e.clientY-drag.startY)>5)moved=true;if(moved){auto=false;autoLabel();yaw+=dx*.007;pitch=Math.max(.25,Math.min(1, pitch+dy*.004));}drag.x=e.clientX;drag.y=e.clientY;paint();});
  canvas.addEventListener('pointerup',e=>{if(!moved){const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left,y=e.clientY-rect.top;const target=targets.map(t=>({...t,distance:Math.hypot(t.x-x,t.y-y)})).sort((a,b)=>a.distance-b.distance)[0];if(target&&target.distance<45)select(target.index);}drag=null;});
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();zoom=Math.max(.7,Math.min(1.4,zoom-e.deltaY*.001));resize();},{passive:false});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();auto=false;autoLabel();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1,pitch+.05);if(e.key==='ArrowDown')pitch=Math.max(.25,pitch-.05);if(e.key==='Home'){yaw=.55;pitch=.58;}paint();});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)paint();}).observe(canvas);
  function animate(time){if(auto&&visible&&!document.hidden){if(last)yaw+=Math.min(time-last,40)*.00008;paint();}last=time;frame=requestAnimationFrame(animate);}
  addEventListener('pagehide',()=>cancelAnimationFrame(frame));select(0);autoLabel();resize();frame=requestAnimationFrame(animate);
})();
