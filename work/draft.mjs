export function createDraft(notes) {
  const text=String(notes).trim();
  return ['## Release announcement — draft for review','',text,'','## Short post — draft for review','',text.replace(/\s+/g,' ').slice(0,240)+(text.length>240?'…':''),'','## Review before publishing','','- Verify every claim against the supplied notes.','- Add release version, date and official link.','- Confirm the intended audience and call to action.','','No external research, automatic publishing, or AI generation was performed.'].join('\n');
}
