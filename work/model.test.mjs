import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modelConfig,refineReport} from './model.mjs';
const config={ready:true,key:'test-placeholder',model:'test-model',inputRate:3,outputRate:15};
test('AI is disabled until model, key and valid rates are all configured',()=>{
 assert.equal(modelConfig({}).ready,false);
 assert.equal(modelConfig({ANTHROPIC_API_KEY:'test',NODUVI_MODEL:'test',NODUVI_INPUT_USD_PER_MILLION:'3',NODUVI_OUTPUT_USD_PER_MILLION:'15'}).ready,true);
 assert.equal(modelConfig({ANTHROPIC_API_KEY:'test',NODUVI_MODEL:'test',NODUVI_INPUT_USD_PER_MILLION:'-3',NODUVI_OUTPUT_USD_PER_MILLION:'15'}).ready,false);
});
test('the adapter counts tokens, bounds output, preserves usage and exposes truncation',async()=>{
 const requests=[];const mock=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>url.endsWith('count_tokens')?{input_tokens:1000}:{content:[{type:'text',text:'A sourced deliverable.'}],usage:{input_tokens:1000,output_tokens:100},stop_reason:'max_tokens'}};};
 let usage;const result=await refineReport({title:'Task',notes:'Verified facts',budget:0.1},'Evidence text',{config,fetcher:mock,onUsage:value=>usage=value});
 assert.equal(requests.length,2);assert.ok(requests[0].url.endsWith('count_tokens'));assert.ok(requests[1].body.max_tokens<=2048);assert.equal(result.text,'A sourced deliverable.');assert.equal(usage.cost,0.0045);assert.equal(result.truncated,true);
});
test('insufficient budget never sends a paid generation request',async()=>{
 let calls=0;await assert.rejects(refineReport({title:'Task',budget:0.01},'Evidence',{config,fetcher:async()=>{calls++;return {ok:true,json:async()=>({input_tokens:100000})};}}),/budget is too small/);assert.equal(calls,1);
});
test('provider errors are surfaced without exposing credentials or silently retrying',async()=>{
 let calls=0;await assert.rejects(refineReport({title:'Task',budget:0.1},'Evidence',{config,fetcher:async()=>{calls++;return {ok:false,status:429};}}),/HTTP 429/);assert.equal(calls,1);
});
