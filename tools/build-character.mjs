import * as T from '../vendor/three.module.min.js';
import {writeFileSync,mkdirSync} from 'node:fs';
const parts=[];
const colors={shell:'#34352f',rim:'#30312b',seal:'#10120d',glass:'#080b06',lime:'#a7de00',eye:'#b6ff00',ivory:'#f3e8d2',port:'#080a06',metal:'#636858'};
const materials=Object.entries(colors).map(([name,c])=>({name,pbrMetallicRoughness:{baseColorFactor:[...new T.Color(c).toArray(),1],metallicFactor:name==='rim'?.14:name==='shell'?.08:0,roughnessFactor:name==='glass'?.19:name==='lime'?.3:name==='ivory'?.34:.46},...(name==='eye'?{emissiveFactor:new T.Color('#b6ff00').toArray(),extensions:{KHR_materials_emissive_strength:{emissiveStrength:1.0}}}:{}),extensions:{...(name==='eye'?{KHR_materials_emissive_strength:{emissiveStrength:1}}:{}),KHR_materials_clearcoat:{clearcoatFactor:name==='glass'?.9:name==='lime'?.5:.18,clearcoatRoughnessFactor:name==='glass'?.12:.3}}}));
const mi=name=>Object.keys(colors).indexOf(name);
function roundedPolygon(points,radius=.1){const s=new T.Shape(),n=points.length;for(let i=0;i<n;i++){const p=new T.Vector2(...points[i]),prev=new T.Vector2(...points[(i+n-1)%n]),next=new T.Vector2(...points[(i+1)%n]);const r=Math.min(radius,p.distanceTo(prev)*.44,p.distanceTo(next)*.44);const a=prev.sub(p).normalize().multiplyScalar(r).add(p),b=next.sub(p).normalize().multiplyScalar(r).add(p);if(i===0)s.moveTo(a.x,a.y);else s.lineTo(a.x,a.y);s.quadraticCurveTo(p.x,p.y,b.x,b.y);}s.closePath();return s;}
function rect(w,h,r){return roundedPolygon([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],r);}
function stepped(w,h,k=.28,r=.12){const x=w/2,y=h/2;return roundedPolygon([[-x+k,-y],[x-k,-y],[x-k,-y+k],[x,-y+k],[x,y-k],[x-k,y-k],[x-k,y],[-x+k,y],[-x+k,y-k],[-x,y-k],[-x,-y+k],[-x+k,-y+k]],r);}
function add(name,shape,depth,bevel,material,x=0,y=0,z=0,rotation=null){
 const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:6,curveSegments:12});g.translate(0,0,-depth/2);if(rotation){g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);}g.translate(x,y,z);g.deleteAttribute('uv');parts.push({name,geometry:g,material:mi(material)});
}
add('continuous-stepped-enclosure',stepped(4.78,2.74,.29,.15),.91,.115,'shell',0,0,-.10);
const frame=stepped(4.89,2.82,.29,.12),hole=stepped(4.25,2.18,.24,.16);frame.holes.push(new T.Path(hole.getPoints(12).reverse()));
add('single-piece-beveled-face-frame',frame,.14,.072,'rim',0,0,.476);
const seal=stepped(4.30,2.23,.25,.15),sealHole=stepped(4.18,2.11,.23,.16);seal.holes.push(new T.Path(sealHole.getPoints(12).reverse()));
add('recessed-screen-gasket',seal,.035,.016,'seal',0,0,.546);
add('inset-smoked-glass',stepped(4.18,2.11,.23,.15),.025,.023,'glass',0,0,.559);
for(const side of [-1,1]){
 const eye=roundedPolygon([[-.5,-.24],[.48,-.24],[.48,.16],[.06,.16],[.06,.32],[-.5,.43]].map(([x,y])=>[x*side,y]),.095);
 add(side===1?'left-luminous-eye':'right-luminous-eye',eye,.012,.012,'eye',-side*1.12,.12,.605);
}
add('ivory-status-mouth',rect(.72,.115,.055),.018,.018,'ivory',0,-.59,.61);
// Cartridge recess lies horizontally in the upper right shoulder.
add('cartridge-recess',rect(1.46,.84,.18),.04,.025,'seal',1.16,1.51,-.07,[Math.PI/2,0,0]);
add('ivory-cartridge-connector',rect(1.20,.34,.06),.54,.035,'ivory',1.16,1.68,-.07);
const cap=roundedPolygon([[-.63,-.21],[.63,-.21],[.63,.28],[.17,.28],[.17,.035],[-.17,.035],[-.17,.28],[-.63,.28]],.095);
add('rounded-notched-lime-cartridge',cap,.59,.067,'lime',1.16,2.02,-.07);
// Three evenly recessed side ventilation slots and their molded lips.
for(let i=0;i<3;i++){
 add('vent-lip-'+i,rect(.55,.09,.04),.015,.012,'shell',2.52,-.42+i*.18,-.15,[0,Math.PI/2,0]);
 add('vent-recess-'+i,rect(.48,.054,.025),.01,.008,'port',2.535,-.42+i*.18,-.15,[0,Math.PI/2,0]);
}
add('rear-panel',rect(3.88,2.10,.25),.025,.03,'rim',0,0,-.693);
for(let i=0;i<2;i++)add('rear-connector-'+i,rect(.56,.13,.035),.015,.012,'port',-.45+i*.9,-.49,-.735);
for(const x of [-1.6,1.6])for(const y of [-.8,.8]){const g=new T.CylinderGeometry(.034,.034,.01,20);g.rotateX(Math.PI/2);g.translate(x,y,-.74);parts.push({name:'rear-fastener',geometry:g,material:mi('metal')});}
// Smooth coincident bevel vertices while retaining intentional 90-degree seams.
for(const p of parts){
 const source=p.geometry.index?p.geometry.toNonIndexed():p.geometry;p.geometry=source;
 const pos=source.attributes.position,n=source.attributes.normal,groups=new Map();
 for(let i=0;i<pos.count;i++){const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*1e5)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
 const original=new Float32Array(n.array);
 for(const ids of groups.values())for(const i of ids){const a=new T.Vector3().fromArray(original,i*3),sum=new T.Vector3();const unique=new Set();for(const j of ids){const v=new T.Vector3().fromArray(original,j*3),key=[v.x,v.y,v.z].map(x=>Math.round(x*1000)).join(',');if(a.dot(v)>.5&&!unique.has(key)){sum.add(v);unique.add(key);}}sum.normalize();n.setXYZ(i,sum.x,sum.y,sum.z);}
}
// Standard binary glTF 2.0 asset: explicit meshes, normals, materials and mesh names.
const gltf={asset:{version:'2.0',generator:'NODQEN reference mesh builder 2'},extensionsUsed:['KHR_materials_clearcoat','KHR_materials_emissive_strength'],scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials,accessors:[],bufferViews:[],buffers:[]};
const buffers=[];let offset=0;
function attribute(arr,type){const b=Buffer.from(arr.buffer,arr.byteOffset,arr.byteLength);const view=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:b.length,target:34962});buffers.push(b);offset+=b.length;const pad=(4-offset%4)%4;if(pad){buffers.push(Buffer.alloc(pad));offset+=pad;}const a={bufferView:view,componentType:5126,count:arr.length/3,type};if(type==='VEC3'){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<arr.length;i++) {a.min[i%3]=Math.min(a.min[i%3],arr[i]);a.max[i%3]=Math.max(a.max[i%3],arr[i]);}}gltf.accessors.push(a);return gltf.accessors.length-1;}
for(const p of parts){const g=p.geometry.index?p.geometry.toNonIndexed():p.geometry;const position=attribute(g.attributes.position.array,'VEC3'),normal=attribute(g.attributes.normal.array,'VEC3');const mesh=gltf.meshes.length;gltf.meshes.push({name:p.name,primitives:[{attributes:{POSITION:position,NORMAL:normal},material:p.material}]});gltf.scenes[0].nodes.push(gltf.nodes.length);gltf.nodes.push({name:p.name,mesh});}
gltf.buffers=[{byteLength:offset}];let j=Buffer.from(JSON.stringify(gltf));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);const bin=Buffer.concat(buffers);const header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);jh.writeUInt32LE(j.length,0);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);mkdirSync('assets',{recursive:true});writeFileSync('assets/nodqen-character.glb',Buffer.concat([header,jh,j,bh,bin]));
console.log(JSON.stringify({meshes:parts.length,triangles:parts.reduce((n,p)=>n+p.geometry.attributes.position.count/3,0),bytes:28+j.length+bin.length}));
