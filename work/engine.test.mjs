import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTask,executeTask,isPublicAddress,publicUrl } from './engine.mjs';
const input={cartridge:'radar',title:'Release check',urls:'https://example.com/releases',network:true,budget:0};
const page={url:input.urls,status:200,title:'Releases',text:'New version released.',hash:'new',html:'<a href="/docs">Docs</a>',bytes:50};
test('network access and zero-cost budget are enforced before running',()=>{
 assert.throws(()=>validateTask({...input,network:false}),/grant public web access/);
 assert.throws(()=>validateTask({...input,budget:10}),/zero-cost/);
 assert.throws(()=>validateTask({...input,urls:'http://example.com'}),/HTTPS/);
 assert.throws(()=>validateTask({...input,urls:'https://user:pass@example.com'}),/credentials/);
 assert.throws(()=>validateTask({...input,urls:'https://example.com:8080'}),/port 443/);
 assert.equal(validateTask({...input,urls:input.urls+'\n'+input.urls}).urls.length,1);
});
test('private, mapped and reserved IP addresses cannot be used as fetch targets',async()=>{
 for(const ip of ['127.0.0.1','10.0.0.2','172.16.0.1','192.168.1.1','169.254.169.254','100.64.1.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1'])assert.equal(isPublicAddress(ip),false,ip);
 assert.equal(isPublicAddress('8.8.8.8'),true);assert.equal(isPublicAddress('2606:4700:4700::1111'),true);
 await assert.rejects(publicUrl('https://127.0.0.1'),/Private/);
});
test('Radar compares real text hashes and only updates successful baselines',async()=>{
 const task=validateTask(input);
 const result=await executeTask(task,{snapshots:{[input.urls]:{hash:'old',excerpt:'Previous version.'}},fetcher:async()=>page});
 assert.match(result.markdown,/Page text changed/);assert.match(result.markdown,/Previous version/);assert.match(result.markdown,/https:\/\/example.com\/releases/);assert.equal(result.snapshots[input.urls].hash,'new');
 const unavailable=await executeTask(task,{fetcher:async()=>({...page,status:404})});assert.equal(unavailable.warnings,1);assert.deepEqual(unavailable.snapshots,{});
});
test('all-source failure is a failed task rather than a fabricated deliverable',async()=>{
 await assert.rejects(executeTask(validateTask(input),{fetcher:async()=>{throw Error('Offline');}}),/No source could be retrieved/);
});
test('Watch checks a bounded same-origin sample and reports link failures',async()=>{
 let calls=0;const result=await executeTask(validateTask({...input,cartridge:'watch'}),{fetcher:async url=>{calls++;return calls===1?{...page,html:'<a href="/a">A</a><a href="/b">B</a><a href="/c">C</a><a href="/d">D</a><a href="https://other.example/">Other</a>'}:{...page,url,status:404};}});
 assert.equal(calls,4);assert.equal(result.warnings,3);assert.match(result.markdown,/HTTP 404/);assert.doesNotMatch(result.markdown,/other\.example/);
});
test('cancellation stops source execution without turning it into a warning',async()=>{
 const c=new AbortController();c.abort(new Error('Cancelled'));
 await assert.rejects(executeTask(validateTask(input),{signal:c.signal,fetcher:async()=>page}),/Cancelled/);
});
test('Studio produces a useful local draft without making network calls',async()=>{
 const task=validateTask({cartridge:'studio',title:'Release draft',notes:'Version 1 adds report downloads and clearer task history.',urls:'',budget:0,network:false});
 const result=await executeTask(task,{fetcher:async()=>{throw Error('Must not fetch');}});
 assert.match(result.markdown,/Version 1 adds report downloads/);assert.match(result.markdown,/Short post/);assert.match(result.markdown,/no language model/);assert.match(result.markdown,/No external research/);
});
