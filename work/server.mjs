import http from 'node:http';
import { readFile,writeFile,mkdir,rename,stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { validateTask,executeTask } from './engine.mjs';
import { modelConfig,refineReport } from './model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const dataDir=process.env.NODUVI_DATA_DIR||path.join(root,'.noduvi');await mkdir(dataDir,{recursive:true});
let db={jobs:[],snapshots:{}};
try{db=JSON.parse(await readFile(path.join(dataDir,'data.json'),'utf8'));if(!Array.isArray(db.jobs)||!db.snapshots)throw Error('Invalid database');}catch(e){if(e.code!=='ENOENT')throw e;}
for(const job of db.jobs)if(['running','queued'].includes(job.status)){job.status='interrupted';job.error='Server restarted before this task finished.';}
let writes=Promise.resolve();
function save(){const content=JSON.stringify(db);writes=writes.catch(()=>{}).then(async()=>{const temp=path.join(dataDir,'data.tmp');await writeFile(temp,content);await rename(temp,path.join(dataDir,'data.json'));});return writes;}
await save();const running=new Map();
function publicJob(job){const {markdown,...rest}=job;return {...rest,hasReport:Boolean(markdown)};}
function json(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));}
async function body(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>100000)throw Error('Request is too large.');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
async function run(job){const controller=new AbortController();running.set(job.id,controller);job.status='running';job.startedAt=new Date().toISOString();await save();
 try{const result=await executeTask(job.task,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(180000)]),snapshots:db.snapshots,log:message=>{job.logs.push({at:new Date().toISOString(),message});}});
  if(job.task.useAI){job.logs.push({at:new Date().toISOString(),message:'Evidence collected. Counting model tokens before the authorized AI request.'});const ai=await refineReport(job.task,result.markdown,{signal:controller.signal,onUsage:usage=>{job.cost=usage.cost;job.model=usage.model;job.usage=usage.usage;}});result.markdown='# AI-assisted deliverable\n\n'+ai.text+'\n\n---\nModel: '+ai.model+' · Estimated token cost at configured rates: $'+ai.cost.toFixed(6)+(ai.truncated?'\nWarning: the model reached its output token limit.':'')+'\n\n# Source evidence / local tool output\n\n'+result.markdown;if(ai.truncated)result.warnings++;}
  controller.signal.throwIfAborted();job.markdown=result.markdown;job.filename=result.filename;job.warnings=result.warnings;Object.assign(db.snapshots,result.snapshots);job.status='completed';}
 catch(error){job.status=controller.signal.aborted?'cancelled':'failed';job.error=error.message;}
 finally{job.finishedAt=new Date().toISOString();running.delete(job.id);await save();}
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.md':'text/plain; charset=utf-8','.json':'application/json','.toml':'text/plain','.rs':'text/plain'};
const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{try{
 const base=`http://127.0.0.1:${port}`;const url=new URL(req.url,base);
 if(req.headers.host!==`127.0.0.1:${port}`&&req.headers.host!==`localhost:${port}`)return json(res,403,{error:'Invalid host.'});
 if(req.headers.origin&&![base,`http://localhost:${port}`].includes(req.headers.origin))return json(res,403,{error:'Cross-origin requests are not accepted.'});
 if(url.pathname.startsWith('/api/')){
  if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{status:'ready',mode:'local',version:1,ai:{ready:modelConfig().ready,model:modelConfig().ready?modelConfig().model:null}});
  if(req.method==='GET'&&url.pathname==='/api/jobs')return json(res,200,{jobs:db.jobs.map(publicJob)});
  if(req.method==='POST'&&url.pathname==='/api/jobs'){
   if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'Send application/json.'});
   if(running.size>=2)return json(res,429,{error:'Two tasks are already running. Wait or cancel one.'});
   const task=validateTask(await body(req));if(db.jobs.filter(j=>['running','queued'].includes(j.status)).length>=2)return json(res,429,{error:'Two tasks are already active. Wait or cancel one.'});if(task.useAI&&!modelConfig().ready)return json(res,409,{error:'AI is not configured on this server. Use local execution.'});const job={id:randomUUID(),task,status:'queued',createdAt:new Date().toISOString(),logs:[],cost:0};
   db.jobs.unshift(job);await save();void run(job).catch(error=>console.error('Task persistence failed:',error.message));return json(res,202,{job:publicJob(job)});
  }
  const match=url.pathname.match(/^\/api\/jobs\/([a-f0-9-]+)(?:\/(report|cancel))?$/);if(match){const job=db.jobs.find(j=>j.id===match[1]);if(!job)return json(res,404,{error:'Task not found.'});
   if(req.method==='GET'&&!match[2])return json(res,200,{job:publicJob(job)});
   if(req.method==='GET'&&match[2]==='report'){if(!job.markdown)return json(res,409,{error:'This task has no deliverable.'});res.writeHead(200,{'content-type':'text/markdown; charset=utf-8','content-disposition':`attachment; filename="${job.filename}"`,'cache-control':'no-store','x-content-type-options':'nosniff'});return res.end(job.markdown);}
   if(req.method==='POST'&&match[2]==='cancel'){const active=running.get(job.id);if(active)active.abort(new Error('Cancelled by user.'));return json(res,200,{cancelled:Boolean(active)});}
   if(req.method==='DELETE'&&!match[2]){if(running.has(job.id))return json(res,409,{error:'Cancel the running task before deleting it.'});db.jobs=db.jobs.filter(j=>j.id!==job.id);await save();return json(res,200,{deleted:true});}
  }return json(res,404,{error:'API route not found.'});
 }
 if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
 const decoded=decodeURIComponent(url.pathname);if(decoded.split('/').some(p=>p.startsWith('.')||p==='node_modules')||decoded.includes('\\'))return json(res,403,{error:'Private path.'});
 let file=path.resolve(root,'.'+decoded);const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))return json(res,403,{error:'Invalid path.'});
 try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','x-content-type-options':'nosniff','referrer-policy':'no-referrer','cache-control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);}catch(e){if(e.code==='ENOENT')return json(res,404,{error:'File not found.'});throw e;}
 }catch(error){json(res,400,{error:error.message});}});
server.listen(port,'127.0.0.1',()=>console.log(`NODUVI ready: http://127.0.0.1:${port}\nData stays in ${dataDir}\nPress Ctrl+C to stop.`));
async function shutdown(){for(const controller of running.values())controller.abort(new Error('Server stopped.'));server.close();await Promise.allSettled([...running.keys()].map(async id=>{while(running.has(id))await new Promise(r=>setTimeout(r,30));}));await writes;process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
