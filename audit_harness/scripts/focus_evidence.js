// Evidence for NR-02: real-keyboard focus-visibility sweep across all six tools.
// Supersedes the programmatic element.focus() probe in flows.js.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const out={method:'real Tab key events, 70 presses per tool, computed style read at each stop',
 note:'Compare with the programmatic focus() probe which reported 23 false positives on 3-2.',tools:{}};
for(const id of ['1-1','2-1','2-2','3-2','4-1','4-3']){
 const ctx=await b.newContext({viewport:{width:1200,height:900},locale:'zh-TW'});const p=await ctx.newPage();
 await p.goto(`http://127.0.0.1:8099/${id}/`,{waitUntil:'networkidle'});await p.waitForTimeout(400);
 await p.evaluate(()=>{window.scrollTo(0,0);document.body.setAttribute('tabindex','-1');document.body.focus()});
 const stops=[],bad=[],tiny=[];const seen=new Set();
 for(let i=0;i<70;i++){
  await p.keyboard.press('Tab');
  const info=await p.evaluate(()=>{const el=document.activeElement;if(!el||el===document.body)return null;
   const cs=getComputedStyle(el),r=el.getBoundingClientRect();
   return {tag:el.tagName,id:el.id,txt:(el.textContent||el.value||'').toString().trim().slice(0,22),
    outlineStyle:cs.outlineStyle,outlineWidth:cs.outlineWidth,boxShadow:(cs.boxShadow||'none').slice(0,44),
    visible:(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||(cs.boxShadow&&cs.boxShadow!=='none'),
    w:Math.round(r.width),h:Math.round(r.height)}});
  if(!info)continue;
  const k=info.tag+'|'+info.id+'|'+info.txt+'|'+info.w+'x'+info.h;
  if(seen.has(k))continue;seen.add(k);stops.push(info);
  if(!info.visible)bad.push(info);
  if(info.w<24||info.h<24)tiny.push({tag:info.tag,txt:info.txt,w:info.w,h:info.h});
 }
 out.tools[id]={uniqueStops:stops.length,noVisibleFocus:bad,tinyTargets:tiny,sampleStops:stops.slice(0,8)};
 console.log(`${id}: stops=${stops.length} noVisibleFocus=${bad.length} tinyTargets=${tiny.length}`);
 await ctx.close();
}
await b.close();
fs.writeFileSync('audit_harness/results/focus_evidence.json',JSON.stringify(out,null,2));
console.log('written audit_harness/results/focus_evidence.json');
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
