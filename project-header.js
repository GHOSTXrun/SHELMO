(() => {
 const config=window.NODUVI_LINKS||{};
 const address=document.querySelector('#contractAddress');
 const copy=document.querySelector('#copyContract');
 const twitter=document.querySelector('#officialTwitter');
 const github=document.querySelector('#officialGithub');
 const notice=document.querySelector('#projectLinkNotice');
 let timer;
 function message(text){notice.textContent=text;notice.hidden=false;clearTimeout(timer);timer=setTimeout(()=>notice.hidden=true,4500);}
 const ca=String(config.contractAddress||'').trim();
 address.value=ca||'TBA';address.title=ca||'The official NODUVI contract address has not been provided.';copy.disabled=!ca;
 copy.title=ca?'Copy contract address':'Contract address pending';
 address.onclick=()=>{if(ca)address.select();};
 copy.onclick=async()=>{if(!ca)return;try{await navigator.clipboard.writeText(ca);copy.textContent='COPIED';setTimeout(()=>copy.textContent='COPY',1800);}catch{address.focus();address.select();message('Select the address and press Ctrl+C to copy.');}};
 function validUrl(raw,hosts){try{const url=new URL(raw);if(url.protocol==='https:'&&!url.username&&!url.password&&hosts.includes(url.hostname.toLowerCase()))return url.href;}catch{}return null;}
 const xUrl=validUrl(config.twitterUrl,['x.com','www.x.com','twitter.com','www.twitter.com']);
 twitter.title=xUrl?'Open NODUVI on X / Twitter':'Official X / Twitter link pending';
 twitter.onclick=()=>{if(xUrl)window.open(xUrl,'_blank','noopener,noreferrer');else message('The official NODUVI X / Twitter link has not been provided yet.');};
 const githubUrl=validUrl(config.githubUrl,['github.com','www.github.com']);
 if(githubUrl)github.href=githubUrl;else{github.removeAttribute('href');github.addEventListener('click',()=>message('GitHub repository link is not configured.'));}
})();
