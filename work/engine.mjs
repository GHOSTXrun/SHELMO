import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';
import { createDraft } from './draft.mjs';
import { request } from 'node:https';
import { Readable } from 'node:stream';

export const cartridges = {
  radar: { name: 'Project Radar', output: 'project-brief.md', network: true },
  studio: { name: 'Content Studio', output: 'release-draft.md', network: false },
  watch: { name: 'Site Watch', output: 'site-report.md', network: true }
};
export function validateTask(input) {
  if (!input || !cartridges[input.cartridge]) throw new Error('Choose a valid work cartridge.');
  const title = String(input.title || '').trim();
  if (!title || title.length > 160) throw new Error('Task title must contain 1–160 characters.');
  const notes = String(input.notes || '').trim();
  if (notes.length > 20000) throw new Error('Source notes must be under 20,000 characters.');
  const urls = [...new Set(String(input.urls || '').split(/\s+/).filter(Boolean))];
  if (urls.length > 5) throw new Error('Use at most five source URLs per task.');
  for (const url of urls) { const u = new URL(url); if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) throw new Error('Use public HTTPS URLs on port 443 without credentials.'); }
  if (cartridges[input.cartridge].network && (!urls.length || input.network !== true)) throw new Error('Provide source URLs and grant public web access.');
  if (input.cartridge === 'studio' && notes.length < 20) throw new Error('Add at least 20 characters of verified source notes for Studio.');
  const useAI=input.useAI===true;const budget=Number(input.budget);
  if (!useAI && budget !== 0) throw new Error('Local execution uses zero-cost tools; select a $0 budget.');
  if (useAI && (input.aiPermission!==true || !Number.isFinite(budget) || budget<0.01 || budget>1)) throw new Error('AI requires explicit permission and a request budget between $0.01 and $1.');
  return { cartridge: input.cartridge, title, notes, urls, network: input.network === true, budget, useAI, aiPermission:input.aiPermission===true };
}
export function isPublicAddress(ip) {
  if (isIP(ip) === 4) {
    const [a,b] = ip.split('.').map(Number);
    return !(a===0 || a===10 || a===127 || a>=224 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&(b===168||b===0||b===2)) || (a===100&&b>=64&&b<=127) || (a===198&&(b===18||b===19||b===51)) || (a===203&&b===0));
  }
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    return /^[23][0-9a-f]{3}:/.test(v) && !v.startsWith('2001:db8:') && !v.startsWith('2001:0:') && !v.startsWith('2002:');
  }
  return false;
}
export async function publicUrl(raw) {
  const u = new URL(raw); const host = u.hostname.replace(/^\[|\]$/g, '');
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) throw new Error('Only public HTTPS URLs are supported.');
  const records = isIP(host) ? [{address:host}] : await lookup(host, {all:true});
  if (!records.length || records.some(r=>!isPublicAddress(r.address))) throw new Error('Private or reserved network addresses are not allowed.');
  u.hash=''; u.resolved=records.map(r=>({address:r.address,family:r.family||isIP(r.address)})); return u;
}
function pinnedFetch(url,signal) {
  return new Promise((resolve,reject)=>{
    const req=request(url,{signal,headers:{'User-Agent':'NODUVI/1.0 PublicPageCheck','Accept':'text/html,text/plain;q=0.9','Accept-Encoding':'identity'},lookup:(_host,options,callback)=>{
      if(options?.all)callback(null,url.resolved);else callback(null,url.resolved[0].address,url.resolved[0].family);
    }},res=>{const headers=new Headers();for(const [key,value]of Object.entries(res.headers)){if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(', '):value);}resolve({status:res.statusCode,headers,body:Readable.toWeb(res)});});
    req.on('error',reject);req.end();
  });
}
export async function fetchPage(raw, signal) {
  let url=await publicUrl(raw);
  for(let hop=0;hop<4;hop++) {
    signal?.throwIfAborted();
    const timeout=AbortSignal.timeout(12000); const combined=signal?AbortSignal.any([signal,timeout]):timeout;
    const res=await pinnedFetch(url,combined);
    if ([301,302,303,307,308].includes(res.status)) { const location=res.headers.get('location'); await res.body?.cancel(); if(!location)throw new Error('Redirect has no location.'); url=await publicUrl(new URL(location,url)); continue; }
    const type=res.headers.get('content-type')||'';
    if(!/text\/(html|plain)|application\/xhtml\+xml/i.test(type)){await res.body?.cancel();throw new Error('The URL does not return an HTML or text page.');}
    if(Number(res.headers.get('content-length'))>1_000_000){await res.body?.cancel();throw new Error('Page exceeds the 1 MB response limit.');}
    const reader=res.body.getReader();let bytes=0;const chunks=[];
    try {for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1_000_000)throw new Error('Page exceeds the 1 MB response limit.');chunks.push(value);}} finally {await reader.cancel().catch(()=>{});}
    const html=Buffer.concat(chunks).toString('utf8');
    const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||url.hostname).replace(/\s+/g,' ').trim();
    const text=html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
    return {url:url.href,status:res.status,title,text,hash:createHash('sha256').update(text).digest('hex'),html,bytes};
  }
  throw new Error('Too many redirects.');
}
export async function executeTask(task,{signal,log=()=>{},snapshots={},fetcher=fetchPage}={}) {
  signal?.throwIfAborted();
  const at=new Date().toISOString();const lines=[`# ${task.title}`,``,`${cartridges[task.cartridge].name} · ${at}`,``,`Execution: ${task.cartridge==='studio'?'local rules-based drafting; no language model':'live public HTTPS retrieval'}. Cost: $0.`,``];
  const updates={}; let successes=0;let warnings=0;
  if(task.cartridge==='studio') {
    log('Reading the source notes you supplied.');
    lines.push(createDraft(task.notes));
    log('Created a release draft and short-form excerpt.'); successes=1;
  } else {
    for(const url of task.urls){signal?.throwIfAborted();log('Reading '+url);
      try {const page=await fetcher(url,signal);successes++;const previous=snapshots[url];const ok=page.status>=200&&page.status<300;
        lines.push(`## ${page.title.replace(/[\r\n]/g,' ')}`,``,`Source: ${page.url}`,`HTTP status: ${page.status} · Received: ${page.bytes} bytes`,`Checked: ${at}`,``);
        if(!ok){warnings++;lines.push('Attention: the page returned an unsuccessful HTTP status.','');}
        if(task.cartridge==='radar') {lines.push(`Change status: ${!previous?'First snapshot — no previous baseline.':previous.hash===page.hash?'Unchanged since the previous successful snapshot.':'Page text changed since the previous snapshot.'}`,'','### Current page excerpt','',page.text.slice(0,2500)||'(No readable text returned.)','');
          if(previous&&previous.hash!==page.hash)lines.push('### Previous excerpt','',previous.excerpt||'(Unavailable)','');
          if(ok)updates[url]={hash:page.hash,excerpt:page.text.slice(0,2500),at};
        } else {
          const links=[...page.html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);const candidates=[];
          for(const raw of links){try{const link=new URL(raw,page.url);if(link.origin===new URL(page.url).origin&&!candidates.includes(link.href)&&link.href!==page.url){link.hash='';candidates.push(link.href);}}catch{}}
          lines.push(`Readable text: ${page.text.length} characters.`,`Same-origin link sample: up to 3 links from ${candidates.length} distinct discovered URLs.`,'');
          for(const link of candidates.slice(0,3)){signal?.throwIfAborted();try{const p=await fetcher(link,signal);const fine=p.status>=200&&p.status<300;if(!fine)warnings++;lines.push(`- HTTP ${p.status}: ${p.url}`);log('Checked link '+link);}catch(error){signal?.throwIfAborted();warnings++;lines.push(`- Unable to check ${link}: ${error.message}`);}}
          if(!candidates.length)lines.push('- No same-origin links found in the returned HTML.');
          lines.push('','This checks server-returned HTML only. JavaScript rendering, login flows, accessibility audits and full-site crawling are outside this check.','');
        }
        log('Finished '+url);
      }catch(error){signal?.throwIfAborted();warnings++;lines.push(`## Unable to read ${url}`,'',String(error.message),'');log('Source failed: '+error.message);}
    }
    if(!successes)throw new Error('No source could be retrieved. Check the URLs and network access; no successful report was produced.');
  }
  if(task.notes&&task.cartridge!=='studio')lines.push('## Your task notes','',task.notes,'');
  lines.push('---','Review this deliverable before sharing. Source excerpts are evidence, not independently verified conclusions.');
  return {markdown:lines.join('\n'),filename:cartridges[task.cartridge].output,snapshots:updates,warnings};
}
