import * as T from './vendor/three.module.min.js';
export function createProductModel(canvas){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch{return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,100);
 const rig=new T.Group();scene.add(rig);
 const mat=(color,roughness=.4,metalness=.1)=>new T.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:.35,clearcoatRoughness:.25});
 const shell=mat('#30312c',.36,.22),rim=mat('#20211d',.3,.25),black=mat('#090b08',.17,.12),ivory=mat('#eee6ce',.32,0),lime=mat('#91d000',.37,.02);
 const eye=new T.MeshBasicMaterial({color:'#b6ff00',toneMapped:false});
 function shape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2,h/2);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
 function mesh(s,depth,bevel,material,x,y,z,parent=rig){const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:6,curveSegments:16,steps:1});g.translate(0,0,-depth/2);const m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(w,h,d,r,m,x,y,z,parent)=>mesh(shape(w,h,r),d,Math.min(r*.3,d*.24),m,x,y,z,parent);
 // One continuous molded enclosure. The inset face follows the same stepped silhouette.
 function stepped(w,h){const x=w/2,y=h/2,k=.22,r=.12,s=new T.Shape();
 const pts=[[-x+k,-y],[x-k,-y],[x-k,-y+k],[x,-y+k],[x,y-k],[x-k,y-k],[x-k,y],[-x+k,y],[-x+k,y-k],[-x,y-k],[-x,-y+k],[-x+k,-y+k]];
 for(let i=0;i<pts.length;i++){const p=pts[i],prev=pts[(i+pts.length-1)%pts.length],next=pts[(i+1)%pts.length];const a=new T.Vector2(...prev).sub(new T.Vector2(...p)).normalize().multiplyScalar(r).add(new T.Vector2(...p));const b=new T.Vector2(...next).sub(new T.Vector2(...p)).normalize().multiplyScalar(r).add(new T.Vector2(...p));if(i===0)s.moveTo(a.x,a.y);else s.lineTo(a.x,a.y);s.quadraticCurveTo(p[0],p[1],b.x,b.y);}s.closePath();return s;}
 box(3.6,2.35,.9,.28,shell,0,.5,-.08);
 mesh(stepped(3.72,2.45),.17,.065,rim,0,.5,.43);
 mesh(stepped(3.38,2.12),.055,.035,black,0,.5,.56);
 // Rounded angular eye polygons, extruded as a single piece rather than overlapping blocks.
 function eyeShape(mirror){const s=new T.Shape();const pts=[[-.42,-.17],[.38,-.17],[.38,.08],[.02,.08],[.02,.23],[-.42,.34]];pts.forEach(([x,y],i)=>i?s.lineTo(x*mirror,y):s.moveTo(x*mirror,y));s.closePath();return s;}
 mesh(eyeShape(1),.025,.035,eye,-.86,.56,.616);
 mesh(eyeShape(-1),.025,.035,eye,.86,.56,.616);
 box(.59,.085,.025,.04,ivory,0,-.08,.62);
 // A solid U-shaped lime cap and an ivory cartridge connector.
 box(1.04,.15,.68,.15,rim,1.0,1.79,-.10);
 box(.87,.24,.48,.06,ivory,1.0,1.94,-.10);
 const u=new T.Shape();u.moveTo(-.46,-.15);u.lineTo(.46,-.15);u.lineTo(.46,.25);u.lineTo(.14,.25);u.lineTo(.14,.02);u.lineTo(-.14,.02);u.lineTo(-.14,.25);u.lineTo(-.46,.25);u.closePath();
 mesh(u,.47,.055,lime,1.0,2.17,-.10);
 for(let i=0;i<3;i++){const vent=box(.42,.045,.02,.02,black,1.86,.18+i*.15,-.06);vent.rotation.y=Math.PI/2;}
 // Low, separated architecture cartridges replace the heavy pedestal.
 const nodes=[];for(let i=0;i<6;i++){const a=i*Math.PI/3+.2,g=new T.Group();g.position.set(Math.cos(a)*2.20,-1.02,Math.sin(a)*1.05-.1);g.rotation.y=-a*.25;rig.add(g);
 const m=mat('#45483c',.4,.1);box(.43,.19,.34,.055,m,0,0,0,g);box(.29,.025,.22,.02,black,0,.115,0,g);nodes.push({group:g,material:m});}
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(.45,'rgba(0,0,0,.28)');gradient.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);const floor=new T.Mesh(new T.PlaneGeometry(6,3.5),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.27;scene.add(floor);
 scene.add(new T.HemisphereLight('#f8ffe4','#42483a',1.4));
 function light(color,power,pos){const l=new T.DirectionalLight(color,power);l.position.set(...pos);scene.add(l);return l;}
 const key=light('#fff4de',2.8,[-3,6,5]);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;key.shadow.radius=5;
 light('#b6ff00',2.4,[4,3,-4]);light('#effaff',1.4,[4,1,5]);
 let width=1,height=1,yaw=.48,pitch=.36,zoom=1,selected=0,hovered=-1;
 function paint(){const radius=8.8/zoom;camera.position.set(Math.sin(yaw)*radius,1.05+Math.sin(pitch)*radius,Math.cos(yaw)*Math.cos(pitch)*radius);camera.lookAt(0,.48,0);renderer.render(scene,camera);}
 function highlight(){nodes.forEach((n,i)=>{const on=i===selected||i===hovered;n.material.color.set(on?'#b6ff00':'#45483c');n.material.emissive.set(on?'#739b00':'#000000');n.material.emissiveIntensity=.12;n.group.position.y=i===hovered?-.91:-1.02;});paint();}
 const ray=new T.Raycaster(),point=new T.Vector2();
 return {paint,resize(){const r=canvas.getBoundingClientRect();width=Math.max(r.width,1);height=Math.max(r.height,1);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();paint();},setView(a,b,z=zoom){yaw=a;pitch=b;zoom=z;paint();},select(i){selected=i;highlight();},hover(i){if(hovered===i)return;hovered=i;highlight();},hit(x,y){point.set(x/width*2-1,1-y/height*2);ray.setFromCamera(point,camera);const h=ray.intersectObjects(nodes.map(n=>n.group),true)[0];if(!h)return;return nodes.findIndex(n=>n.group===h.object.parent);}};
}
