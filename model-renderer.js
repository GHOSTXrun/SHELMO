// Dependency-free shaded geometry renderer for the NODUVI product model.
export function createProductModel(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(a=>a/n);};
 const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
 const materials={
  ceramic:{color:[218,211,184],roughness:.55,spec:.13},
  rim:{color:[171,170,144],roughness:.4,spec:.18},
  graphite:{color:[25,37,30],roughness:.5,spec:.16},
  glass:{color:[9,24,21],roughness:.16,spec:.6},
  lime:{color:[169,211,53],roughness:.4,spec:.25},
  moss:{color:[66,88,56],roughness:.55,spec:.15},
  metal:{color:[47,65,50],roughness:.35,spec:.23},
  dark:{color:[16,31,23],roughness:.65,spec:.1},
  light:{color:[188,245,99],emission:.9,roughness:.2,spec:.15}
 };
 let width=1,height=1,scale=1,yaw=.48,pitch=.36,zoom=1,selected=0,geometry=[],hits=[];
 const surface=document.createElement('canvas'),surfaceContext=surface.getContext('2d');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const light=normalize([-0.65,1,0.85]);
 function rotate(v,r){let [x,y,z]=v;let c=Math.cos(r[0]),s=Math.sin(r[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(r[1]);s=Math.sin(r[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(r[2]);s=Math.sin(r[2]);return [x*c-y*s,x*s+y*c,z];}
 function vertex(p,n,center,rotation){const q=rotate(p,rotation);return {p:q.map((v,i)=>v+center[i]),n:rotate(n,rotation)};}
 function tri(a,b,c,material){geometry.push({v:[a,b,c],material});}
 function roundedBox(center,size,radius,material,rotation=[0,0,0],steps=5){
  const half=size.map(n=>n/2),radii=half.map(n=>Math.min(radius,n*.99)),core=half.map((n,i)=>n-radii[i]);
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const u=(axis+1)%3,v=(axis+2)%3;
   // Sample bevel boundaries explicitly; broad faces stay planar.
   const values=a=>{const out=[-half[a]];for(let k=1;k<=steps;k++)out.push(-core[a]-radii[a]*Math.cos(k*Math.PI/(2*steps)));out.push(0);for(let k=0;k<steps;k++)out.push(core[a]+radii[a]*Math.sin(k*Math.PI/(2*steps)));out.push(half[a]);return [...new Set(out)];};
   const us=values(u),vs=values(v),grid=[];
   for(let i=0;i<us.length;i++){grid[i]=[];for(let j=0;j<vs.length;j++){const p=[0,0,0];p[axis]=sign*half[axis];p[u]=us[i];p[v]=vs[j];const closest=p.map((n,k)=>Math.max(-core[k],Math.min(core[k],n)));const unit=normalize(p.map((n,k)=>(n-closest[k])/radii[k]));const point=closest.map((n,k)=>n+unit[k]*radii[k]);const normal=normalize(unit.map((n,k)=>n/radii[k]));grid[i][j]=vertex(point,normal,center,rotation);}}
   for(let i=0;i<us.length-1;i++)for(let j=0;j<vs.length-1;j++){tri(grid[i][j],grid[i+1][j],grid[i+1][j+1],material);tri(grid[i][j],grid[i+1][j+1],grid[i][j+1],material);}
  }
 }
 function cylinder(center,radius,height,material,rotation=[0,0,0],sides=48){
  const at=(p,n)=>vertex(p,n,center,rotation);
  for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides;const na=[Math.cos(a),0,Math.sin(a)],nb=[Math.cos(b),0,Math.sin(b)];const p=[Math.cos(a)*radius,0,Math.sin(a)*radius],q=[Math.cos(b)*radius,0,Math.sin(b)*radius];
   tri(at([0,height/2,0],[0,1,0]),at([q[0],height/2,q[2]],[0,1,0]),at([p[0],height/2,p[2]],[0,1,0]),material);
   const a0=at([p[0],-height/2,p[2]],na),a1=at([p[0],height/2,p[2]],na),b0=at([q[0],-height/2,q[2]],nb),b1=at([q[0],height/2,q[2]],nb);tri(a0,b0,b1,material);tri(a0,b1,a1,material);
  }
 }
 function torus(center,radius,tube,material){for(let i=0;i<64;i++)for(let j=0;j<6;j++){
  const point=(i,j)=>{const a=i*Math.PI*2/64,b=j*Math.PI*2/6,n=[Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)];return vertex([(radius+tube*Math.cos(b))*Math.cos(a),tube*Math.sin(b),(radius+tube*Math.cos(b))*Math.sin(a)],n,center,[0,0,0]);};
  const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);tri(a,b,c,material);tri(a,c,d,material);
 }}
 function build(){geometry=[];hits=[];
  cylinder([0,-38,0],176,10,materials.dark);cylinder([0,-31,0],173,5,materials.metal);cylinder([0,-27,0],170,3,materials.graphite);torus([0,-25,0],166,.55,materials.moss);
  // Separate low-profile docks keep the computer itself as the focal point.
  for(let i=0;i<6;i++){const a=i*Math.PI/3+.22,x=Math.cos(a)*129,z=Math.sin(a)*129;const m=i===selected?materials.lime:materials.moss;
   cylinder([x,-21,z],22,6,materials.dark);torus([x,-17.5,z],20,.7,i===selected?materials.lime:materials.metal);
   roundedBox([x,-9,z],[31,14,25],3,m,[0,-a,0],2);roundedBox([x,-.8,z],[23,1,17],1,materials.graphite,[0,-a,0],2);
   hits.push({p:[x,3,z],index:i});
  }
  // Rubber feet and a continuous lower shell, rather than stacked wire boxes.
  for(const x of [-40,40])for(const z of [-28,28])roundedBox([x,-17,z],[17,13,17],5,materials.graphite,[0,0,0],3);
  roundedBox([0,66,0],[118,156,104],16,materials.ceramic,[0,0,0],7);
  // Recessed seam around the screen bezel.
  roundedBox([-4,91,51],[101,94,9],15,materials.rim,[0,0,0],5);
  roundedBox([-4,92,56],[91,82,9],13,materials.graphite,[0,0,0],5);
  roundedBox([-4,94,61],[78,66,5],11,materials.glass,[0,0,0],6);
  // Machined side port and a detachable lime cartridge.
  roundedBox([59,66,4],[5,46,58],7,materials.rim,[0,0,0],4);
  roundedBox([62,66,4],[5,37,49],5,materials.graphite,[0,0,0],4);
  roundedBox([82,66,4],[42,32,43],5,materials.lime,[0,0,0],5);
  roundedBox([102,66,4],[4,26,36],4,materials.lime,[0,0,0],3);
  roundedBox([104.2,66,4],[1.3,15,12],3,materials.moss,[0,0,0],3);
  // Raised terminal glyphs sit just above the glass and catch no hard outlines.
  roundedBox([-19,104,64.1],[18,3.4,1.1],1.5,materials.light,[0,0,-.72],3);
  roundedBox([-19,93,64.1],[18,3.4,1.1],1.5,materials.light,[0,0,.72],3);
  roundedBox([4,87,64.1],[15,3.2,1.1],1.5,materials.light,[0,0,0],3);
  cylinder([-33,16,52],9.2,2.6,materials.graphite,[Math.PI/2,0,0],32);
  cylinder([-33,16,53.7],6.9,2.4,materials.lime,[Math.PI/2,0,0],32);
  for(let i=0;i<2;i++)roundedBox([24,17-i*10,51.8],[27,3,3],1.4,materials.graphite,[0,0,0],2);
  for(let i=0;i<5;i++)roundedBox([-25+i*12,141,3],[4,1,28],1.2,materials.rim,[0,0,0],2);
 }
 function project(p){const x=p[0]*Math.cos(yaw)-p[2]*Math.sin(yaw),z=p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw),y=p[1]-45;const d=z*Math.cos(pitch)+y*Math.sin(pitch);const k=820/(820-d);return {x:width*.48+x*scale*k,y:height*.54+(-y*Math.cos(pitch)+z*Math.sin(pitch))*scale*k,d};}
 function shade(material,normal,center){const diffuse=Math.max(0,dot(normal,light));const up=normal[1]*.5+.5;const camera=[Math.sin(yaw)*820*Math.cos(pitch),820*Math.sin(pitch)+45,Math.cos(yaw)*820*Math.cos(pitch)];const view=normalize(camera.map((n,i)=>n-center[i]));const half=normalize(light.map((n,i)=>n+view[i]));const shine=Math.pow(Math.max(0,dot(normal,half)),material.roughness<.2?95:28)*material.spec;const ambient=.43+.17*up;const luminance=material.emission?1:ambient+diffuse*.43;
  return material.color.map(c=>Math.max(0,Math.min(255,c*luminance+shine*110+(material.emission?10:0))));
 }
 function shadow(center,rx,rz,opacity){const p=project(center),x=project([center[0]+rx,center[1],center[2]]),z=project([center[0],center[1],center[2]+rz]);ctx.save();ctx.translate(p.x,p.y);ctx.transform(x.x-p.x,x.y-p.y,z.x-p.x,z.y-p.y,0,0);const gradient=ctx.createRadialGradient(0,0,.05,0,0,1);gradient.addColorStop(0,'rgba(0,0,0,'+opacity+')');gradient.addColorStop(.5,'rgba(0,0,0,'+opacity*.5+')');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();}
 function paint(){ctx.clearRect(0,0,width,height);shadow([5,-44,5],220,205,.34);
  const rw=surface.width,rh=surface.height,factor=rw/width;
  const image=surfaceContext.createImageData(rw,rh),pixels=image.data,depth=new Float32Array(rw*rh),cache=new Map();
  const camera=[Math.sin(yaw)*820*Math.cos(pitch),820*Math.sin(pitch)+45,Math.cos(yaw)*820*Math.cos(pitch)];
  function transformed(v,m){if(cache.has(v))return cache.get(v);const p=project(v.p),out={x:p.x*factor,y:p.y*factor,z:1/(820-p.d),color:shade(m,v.n,v.p)};cache.set(v,out);return out;}
  for(const shape of geometry){
   const normals=normalize(shape.v.reduce((v,a)=>v.map((n,i)=>n+a.n[i]),[0,0,0]));const center=shape.v.reduce((v,a)=>v.map((n,i)=>n+a.p[i]/3),[0,0,0]);
   if(dot(normals,camera.map((n,i)=>n-center[i]))<=0)continue;
   const [a,b,c]=shape.v.map(v=>transformed(v,shape.material));
   const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(denominator)<.00001)continue;
   const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(rw-1,Math.ceil(Math.max(a.x,b.x,c.x)));
   const minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(rh-1,Math.ceil(Math.max(a.y,b.y,c.y)));
   const dx0=(b.y-c.y)/denominator,dy0=(c.x-b.x)/denominator,dx1=(c.y-a.y)/denominator,dy1=(a.x-c.x)/denominator;
   let row0=((b.y-c.y)*(minX+.5-c.x)+(c.x-b.x)*(minY+.5-c.y))/denominator;
   let row1=((c.y-a.y)*(minX+.5-c.x)+(a.x-c.x)*(minY+.5-c.y))/denominator;
   for(let y=minY;y<=maxY;y++){let u=row0,v=row1;let index=y*rw+minX;
    for(let x=minX;x<=maxX;x++,index++,u+=dx0,v+=dx1){const w=1-u-v;if(u<-.00001||v<-.00001||w<-.00001)continue;const z=u*a.z+v*b.z+w*c.z;if(z<=depth[index])continue;depth[index]=z;const i=index*4;pixels[i]=u*a.color[0]+v*b.color[0]+w*c.color[0];pixels[i+1]=u*a.color[1]+v*b.color[1]+w*c.color[1];pixels[i+2]=u*a.color[2]+v*b.color[2]+w*c.color[2];pixels[i+3]=255;}
    row0+=dy0;row1+=dy1;
   }
  }
  surfaceContext.putImageData(image,0,0);ctx.drawImage(surface,0,0,width,height);
  // A restrained reflection and engraved faceplate finish the display.
  if(Math.cos(yaw)>.15){const a=project([-38,121,64.7]),b=project([30,121,64.7]),c=project([-38,69,64.7]);ctx.save();ctx.transform((b.x-a.x)/68,(b.y-a.y)/68,(c.x-a.x)/52,(c.y-a.y)/52,a.x,a.y);const reflection=ctx.createLinearGradient(0,0,55,45);reflection.addColorStop(0,'rgba(186,217,207,.13)');reflection.addColorStop(.55,'rgba(186,217,207,0)');ctx.fillStyle=reflection;ctx.beginPath();ctx.moveTo(1,5);ctx.quadraticCurveTo(2,0,8,0);ctx.lineTo(40,0);ctx.lineTo(3,39);ctx.closePath();ctx.fill();ctx.restore();
   const p=project([-36,38,53]),q=project([36,38,53]),r=project([-36,28,53]);ctx.save();ctx.transform((q.x-p.x)/72,(q.y-p.y)/72,(r.x-p.x)/10,(r.y-p.y)/10,p.x,p.y);ctx.fillStyle='#65705a';ctx.font='5px Arial';ctx.fillText('N O D U V I',0,5);ctx.fillStyle='#77816a';ctx.font='3px Arial';ctx.fillText('PERSONAL WORK COMPUTER',39,5);ctx.restore();
  }
 }
 function resize(){const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);surface.width=Math.max(1,Math.round(Math.min(width*1.25,1150)));surface.height=Math.max(1,Math.round(height*surface.width/width));ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width/455,height/355)*zoom;paint();}
 build();
 return {resize,paint,setView(a,b,z=zoom){yaw=a;pitch=b;zoom=z;scale=Math.min(width/455,height/355)*zoom;paint();},select(i){selected=i;build();paint();},hit(x,y){return hits.map(t=>({...t,...project(t.p)})).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).find(t=>Math.hypot(t.x-x,t.y-y)<40)?.index;}};
}
