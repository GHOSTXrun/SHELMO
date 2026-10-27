(() => {
  const files=[
    {name:'README.md',path:'README.md',language:'Markdown'},
    {name:'programs',id:'programs',folder:true,open:true},
    {name:'lib.rs',path:'repository-files/programs/shellwork/src/lib.rs',parent:'programs',language:'Rust'},
    {name:'work',id:'work',folder:true,open:true},
    ...['engine.mjs','server.mjs','model.mjs','draft.mjs','app.js','workspace.css','engine.test.mjs','model.test.mjs','server.test.mjs'].map(name=>({name,path:'work/'+name,parent:'work',language:name.endsWith('css')?'CSS':'JavaScript'})),
    {name:'src',id:'src',folder:true,open:false},
    ...['kernel.js','computer.js','component-store.js','permissions.js','manifest.js','license-providers.js','market-client.js','solana-codec.js'].map(name=>({name,path:'repository-files/src/'+name,parent:'src',language:'JavaScript'})),
    {name:'system-model.js',path:'system-model.js',language:'JavaScript'},
    {name:'model-renderer.js',path:'model-renderer.js',language:'JavaScript'},
    {name:'index.html',path:'index.html',language:'HTML'},
    {name:'unified.css',path:'unified.css',language:'CSS'},
    {name:'package.json',path:'package.json',language:'JSON'}
  ];
  const $=s=>document.querySelector(s);const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let active='',raw='',request;
  function tree(){$('#fileTree').replaceChildren();for(const file of files){const button=document.createElement('button');button.type='button';button.className='row';button.dataset.depth=file.parent?'1':'0';if(file.parent&&!files.find(f=>f.id===file.parent)?.open)button.hidden=true;button.classList.toggle('active',file.path===active);button.classList.toggle('open',Boolean(file.open));button.innerHTML=`<span class="chev">${file.folder?'▶':''}</span><span class="icon">${file.folder?'▱':'⋮'}</span><span class="name">${escape(file.name)}</span><span class="kind">${file.folder?'DIR':escape(file.name.split('.').pop().toUpperCase())}</span>`;button.onclick=()=>{if(file.folder){file.open=!file.open;tree();}else open(file);};$('#fileTree').append(button);}}
  function highlight(line){const pattern=/(\/\/.*$|^\s*#\s.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:pub|fn|let|const|return|async|await|import|from|export|function|if|else|for|while|struct|impl|use|mod|mut|new|try|catch|throw)\b|\b\d+(?:\.\d+)?\b)/g;let out='',index=0;for(const m of line.matchAll(pattern)){out+=escape(line.slice(index,m.index));const token=m[0];const type=token.startsWith('//')||/^\s*#\s/.test(token)?'comment':/^["']/.test(token)?'string':/^\d/.test(token)?'number':'key';out+='<span class="token-'+type+'">'+escape(token)+'</span>';index=m.index+token.length;}return out+escape(line.slice(index));}
  async function open(file){request?.abort();request=new AbortController();const signal=request.signal;active=file.path;raw='';tree();$('#currentPath').textContent=file.path.replaceAll('/',' / ');$('#languageLabel').textContent=file.language.toUpperCase();$('#loadState').textContent='READING SOURCE';$('#codeView').textContent='Loading source…';try{const response=await fetch(file.path,{signal});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(signal.aborted)return;raw=text;const lines=text.replace(/\n$/,'').split('\n');$('#lineCount').textContent=lines.length+' LINES';$('#codeView').innerHTML=lines.map((line,i)=>'<span class="code-line"><span class="num">'+String(i+1).padStart(3,'0')+'</span>'+highlight(line)+'</span>').join('');$('#codeScroll').scrollTo(0,0);$('#loadState').textContent='SOURCE LOADED';}catch(error){if(signal.aborted)return;$('#lineCount').textContent='0 LINES';$('#loadState').textContent='READ ERROR';$('#codeView').textContent='Unable to load source. Serve this project over HTTP. '+error.message;}}
  $('#copyButton').onclick=async()=>{if(!raw)return;try{await navigator.clipboard.writeText(raw);$('#copyButton').textContent='COPIED';}catch{$('#copyButton').textContent='COPY UNAVAILABLE';}setTimeout(()=>$('#copyButton').textContent='COPY',1600);};
  $('#downloadFile').onclick=()=>{if(!raw)return;const url=URL.createObjectURL(new Blob([raw],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=active.split('/').pop();a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('#printPaper').onclick=()=>window.print();
  const details=$('#runtime');const frame=$('#runtimeFrame');details.addEventListener('toggle',()=>{if(details.open&&!frame.hasAttribute('src')){frame.src=frame.dataset.src;}});
  frame.addEventListener('load',()=>{try{frame.contentDocument.querySelectorAll('a[href*="whitepaper.html"]').forEach(a=>{a.href=new URL('#whitepaper',location.href).href;a.target='_parent';});frame.contentDocument.querySelectorAll('a.system-name').forEach(a=>{a.href=new URL('#source',location.href).href;a.target='_parent';});}catch{}});
  if(location.hash==='#runtime')details.open=true;
  addEventListener('hashchange',()=>{if(location.hash==='#runtime')details.open=true;});
  tree();open(files.find(f=>f.name==='lib.rs'));
})();
