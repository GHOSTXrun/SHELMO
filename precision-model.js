import * as T from './vendor/three.module.min.js';
// The character is a standalone binary glTF asset, not geometry rebuilt on every page load.
async function readAsset(){
 const response=await fetch(new URL('./assets/nodqen-character.glb?v=mesh-1',import.meta.url));if(!response.ok)throw Error('Character asset HTTP '+response.status);
 const bytes=await response.arrayBuffer(),view=new DataView(bytes);
 if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.byteLength)throw Error('Invalid character GLB');
 const length=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,length)));
 return {bytes,json,offset:28+length};
}
const asset=await readAsset();
export function createProductModel(canvas){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch{return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0,0);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-4,4,2.7,-2.7,.1,80),rig=new T.Group();scene.add(rig);
 const {bytes,json,offset}=asset;
 const materials=json.materials.map(spec=>{
  const p=spec.pbrMetallicRoughness,coat=spec.extensions?.KHR_materials_clearcoat||{};
  let m=new T.MeshPhysicalMaterial({color:new T.Color().fromArray(p.baseColorFactor),roughness:p.roughnessFactor,metalness:p.metallicFactor,clearcoat:coat.clearcoatFactor||0,clearcoatRoughness:coat.clearcoatRoughnessFactor||0});
  if(spec.name==='eye'){m.dispose();m=new T.MeshBasicMaterial({color:'#b6ff00',toneMapped:false});}
  if(spec.name==='lime'){m.color.multiplyScalar(.65);m.envMapIntensity=.3;m.clearcoat=.3;m.specularIntensity=.45;}
  if(spec.name==='glass'){m.envMapIntensity=1.1;m.roughness=.13;}
  m.name=spec.name;return m;
 });
 const meshes=[];
 for(const node of json.nodes){const spec=json.meshes[node.mesh].primitives[0],g=new T.BufferGeometry();
  for(const [semantic,ai] of Object.entries(spec.attributes)){const a=json.accessors[ai],b=json.bufferViews[a.bufferView];const data=new Float32Array(bytes,offset+(b.byteOffset||0)+(a.byteOffset||0),a.count*3);g.setAttribute(semantic==='POSITION'?'position':'normal',new T.BufferAttribute(data,3));}
  const mesh=new T.Mesh(g,materials[spec.material]);mesh.name=node.name;rig.add(mesh);meshes.push(mesh);
 }
 // Large rectangular HDR softboxes give continuous reflections across the molded curves.
 const w=512,h=256,pixels=new Float32Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const theta=(y+.5)/h*Math.PI,phi=(x+.5)/w*Math.PI*2,dx=-Math.sin(phi)*Math.sin(theta),dy=Math.cos(theta),dz=-Math.cos(phi)*Math.sin(theta);
  let power=.15+Math.max(0,dy)*.12;
  if(dz>.18&&dx<-.25&&dx>-.7&&dy>-.05&&dy<.85)power+=4.3;
  if(dz>.2&&dx>.45&&dx<.65&&dy>-.25&&dy<.8)power+=2.0;
  if(dy>.82&&dz>-.3)power+=2.8;
  const i=(y*w+x)*4;pixels[i]=power;pixels[i+1]=power*.985;pixels[i+2]=power*.93;pixels[i+3]=1;
 }
 const hdr=new T.DataTexture(pixels,w,h,T.RGBAFormat,T.FloatType);hdr.mapping=T.EquirectangularReflectionMapping;hdr.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(hdr);scene.environment=environment.texture;scene.environmentIntensity=.85;hdr.dispose();pmrem.dispose();
 scene.add(new T.HemisphereLight('#f9ffe8','#89927e',1.5));
 const key=new T.DirectionalLight('#fff3dc',2.1);key.position.set(-3,5,6);scene.add(key);
 const fill=new T.DirectionalLight('#eff8e8',1.25);fill.position.set(4,2,5);scene.add(fill);
 const edge=new T.DirectionalLight('#baff65',1.65);edge.position.set(-4,3,-3);scene.add(edge);
 // Soft halo from the eye apertures, without changing the reference eye silhouettes.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
 const gc=glowCanvas.getContext('2d'),gg=gc.createRadialGradient(64,64,2,64,64,64);gg.addColorStop(0,'rgba(160,255,0,.23)');gg.addColorStop(.45,'rgba(160,255,0,.10)');gg.addColorStop(1,'rgba(160,255,0,0)');gc.fillStyle=gg;gc.fillRect(0,0,128,128);
 const glowTexture=new T.CanvasTexture(glowCanvas);
 for(const x of [-1.12,1.12]){const g=new T.Mesh(new T.PlaneGeometry(1.65,1.2),new T.MeshBasicMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));g.position.set(x,.17,.597);rig.add(g);}
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;const c=shadowCanvas.getContext('2d'),gradient=c.createRadialGradient(128,128,2,128,128,128);gradient.addColorStop(0,'rgba(0,0,0,.56)');gradient.addColorStop(.4,'rgba(0,0,0,.24)');gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(0,0,256,256);
 const shadow=new T.Mesh(new T.PlaneGeometry(6.4,3.0),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-1.95,0);scene.add(shadow);
 let width=1,height=1,yaw=.4,pitch=.2,zoom=1;
 function paint(){const radius=12;camera.position.set(Math.sin(yaw)*radius,Math.sin(pitch)*radius+.3,Math.cos(yaw)*Math.cos(pitch)*radius);camera.lookAt(0,.24,0);const half=Math.max(2.6,2.9/(width/height))/zoom;camera.top=half;camera.bottom=-half;camera.left=-half*width/height;camera.right=half*width/height;camera.updateProjectionMatrix();renderer.render(scene,camera);}
 const ray=new T.Raycaster(),point=new T.Vector2();
 function hit(x,y){point.set(x/width*2-1,1-y/height*2);ray.setFromCamera(point,camera);const name=ray.intersectObjects(meshes)[0]?.object.name;if(!name)return;return name.includes('eye')?name.startsWith('left')?0:1:name.includes('cartridge')?2:name.includes('vent')?3:name.includes('mouth')?5:4;}
 return {paint,resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);renderer.setSize(width,height,false);paint();},setView(a,b,z=zoom){yaw=a;pitch=b;zoom=z;paint();},select(){paint();},hover(){},hit};
}
