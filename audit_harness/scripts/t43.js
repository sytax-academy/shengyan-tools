const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');const log=[];const L=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');log.push(s);console.log(s);};
const U='http://127.0.0.1:8099/4-3/';
async function mk(b,w=1200){const ctx=await b.newContext({viewport:{width:w,height:1000},locale:'zh-TW'});
 const p=await ctx.newPage();const errs=[],dlg=[];
 p.on('pageerror',e=>errs.push('PAGEERR: '+String(e).slice(0,250)));
 p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text().slice(0,200))});
 p.on('dialog',async d=>{dlg.push(d.type()+'|'+d.message().replace(/\s+/g,' ').slice(0,80));await d.accept().catch(()=>{})});
 await p.goto(U,{waitUntil:'networkidle',timeout:60000});await p.waitForTimeout(500);
 return {ctx,p,errs,dlg};}
const state=p=>p.evaluate(()=>({
 mode:[...document.querySelectorAll('#mAuto,#mAvg,#mTrend')].filter(b=>b.getAttribute('aria-pressed')==='true'||b.className.includes('on')).map(b=>b.id),
 saved:(document.getElementById('saved')||{}).textContent?.trim().slice(0,40),
 ls:(()=>{try{const k=Object.keys(localStorage);return k.map(x=>({k:x,len:(localStorage.getItem(x)||'').length}))}catch(e){return 'blocked'}})(),
 invalidCells:document.querySelectorAll('.bad,.invalid,[aria-invalid=true]').length,
 gridInputs:document.querySelectorAll('input[inputmode],table input').length,
 runway:(document.getElementById('runway')||{}).innerText?.replace(/\s+/g,' ').slice(0,80)}));
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

L('##### 4-3 BASELINE #####');
{const {ctx,p,errs,dlg}=await mk(b);
 L(' quirks/compat:',await p.evaluate(()=>document.compatMode),' lang:',await p.evaluate(()=>document.documentElement.lang||'(null)'));
 L(' state:',JSON.stringify(await state(p)));
 L(' demo button click...');
 await p.click('#btnDemo');await p.waitForTimeout(900);
 L(' after demo:',JSON.stringify(await state(p)));
 L(' dialogs:',JSON.stringify(dlg),' errs:',JSON.stringify(errs));
 // localStorage persistence across reload
 await p.waitForTimeout(1200);
 const before=await p.evaluate(()=>{try{return localStorage.getItem(Object.keys(localStorage)[0])?.length||0}catch(e){return -1}});
 L(' localStorage bytes after demo:',before);
 await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(800);
 L(' after reload:',JSON.stringify(await state(p)));
 const restored=await p.evaluate(()=>[...document.querySelectorAll('table input')].filter(i=>i.value&&/\d/.test(i.value)).length);
 L(' numeric cells restored after reload:',restored);
 await ctx.close();}

L('\n##### 4-3 INVALID INPUT + AUTOSAVE GUARD #####');
{const {ctx,p,errs,dlg}=await mk(b);
 await p.click('#btnDemo');await p.waitForTimeout(800);
 const cells=await p.$$('table input');
 L(' grid input count:',cells.length);
 // find a numeric cell
 let target=null;
 for(const c of cells){const v=await c.inputValue();if(/^[\d,]+$/.test(v)&&v.length>2){target=c;break}}
 if(target){
  for(const bad of ['abc','-100','1e5','3.14159','999999999999999999']){
   await target.fill(bad);await target.dispatchEvent('input');await target.dispatchEvent('blur');await p.waitForTimeout(500);
   const s=await p.evaluate(()=>({invalid:document.querySelectorAll('.bad,.invalid,[aria-invalid=true]').length,
     saved:(document.getElementById('saved')||{}).textContent?.trim().slice(0,42)}));
   L(`  cell="${bad}" ->`,JSON.stringify(s));
  }
  await target.fill('50000');await target.dispatchEvent('input');await p.waitForTimeout(700);
  L('  restored valid ->',JSON.stringify(await p.evaluate(()=>({invalid:document.querySelectorAll('.bad,.invalid,[aria-invalid=true]').length,saved:(document.getElementById('saved')||{}).textContent?.trim().slice(0,40)}))));
 }
 L(' errs:',JSON.stringify(errs),' dlg:',JSON.stringify(dlg));
 await ctx.close();}

L('\n##### 4-3 EXPORT JSON / XLSX + IMPORT ROUNDTRIP #####');
{const {ctx,p,errs,dlg}=await mk(b);
 await p.click('#btnDemo');await p.waitForTimeout(800);
 // JSON save
 const d1=p.waitForEvent('download',{timeout:15000}).catch(()=>null);
 await p.click('#btnSave');const dl1=await d1;
 L(' JSON download:',dl1?dl1.suggestedFilename():'NONE');
 let jsonPath=null;
 if(dl1){jsonPath='audit_harness/results/4-3_progress.json';await dl1.saveAs(jsonPath);
  const raw=fs.readFileSync(jsonPath,'utf8');L('  bytes:',raw.length,' parses:',(()=>{try{JSON.parse(raw);return true}catch(e){return false}})());
  const o=JSON.parse(raw);L('  top-level keys:',JSON.stringify(Object.keys(o)));}
 // XLSX
 const d2=p.waitForEvent('download',{timeout:20000}).catch(()=>null);
 await p.click('#btnXlsx');const dl2=await d2;
 L(' XLSX download:',dl2?dl2.suggestedFilename():'NONE');
 if(dl2){const xp='audit_harness/results/4-3_export.xlsx';await dl2.saveAs(xp);L('  bytes:',fs.statSync(xp).size);}
 L(' dialogs:',JSON.stringify(dlg),' errs:',JSON.stringify(errs));
 // import roundtrip in a clean context
 if(jsonPath){
  const {ctx:c2,p:p2,errs:e2,dlg:g2}=await mk(b);
  await p2.setInputFiles('#file',jsonPath);await p2.waitForTimeout(1500);
  const n=await p2.evaluate(()=>[...document.querySelectorAll('table input')].filter(i=>i.value&&/\d/.test(i.value)).length);
  L(' IMPORT roundtrip -> numeric cells:',n,' dialogs:',JSON.stringify(g2),' errs:',JSON.stringify(e2));
  L('  state:',JSON.stringify(await state(p2)));
  await c2.close();
 }
 await ctx.close();}

L('\n##### 4-3 MALFORMED / HOSTILE IMPORT #####');
for(const [name,content] of [
  ['not-json','this is not json at all'],
  ['empty-object','{}'],
  ['wrong-shape','{"v":5,"inflow":"notanarray","outflow":null,"open":"abc"}'],
  ['proto-pollution','{"v":5,"__proto__":{"polluted":"YES"},"constructor":{"prototype":{"p2":"YES"}},"inflow":[],"outflow":[]}'],
  ['xss-names','{"v":5,"startMonth":"2026-06","actualThrough":3,"open":null,"inflow":[{"name":"<img src=x onerror=window.__X=1>","fixed":false,"values":[1,2,3,4,5,6,7]}],"outflow":[],"fixed":null,"cash":null,"cashOverride":false,"mode":"auto"}'],
  ['huge-values','{"v":5,"startMonth":"2026-06","actualThrough":3,"open":1e308,"inflow":[{"name":"x","fixed":false,"values":[1e308,-1e308,null,0,1,2,3]}],"outflow":[],"fixed":null,"cash":null,"cashOverride":false,"mode":"auto"}'],
]){
 const fp='audit_harness/results/imp_'+name+'.json';fs.writeFileSync(fp,content);
 const {ctx,p,errs,dlg}=await mk(b);
 await p.setInputFiles('#file',fp);await p.waitForTimeout(1400);
 const r=await p.evaluate(()=>({polluted:({}).polluted||null,p2:({}).p2||null,
   xss:window.__X===1?'EXECUTED':'safe',
   bodyOk:document.querySelectorAll('table input').length>0,
   noteText:(document.getElementById('saved')||{}).textContent?.trim().slice(0,50)}));
 L(` ${name.padEnd(16)} -> dialogs=${JSON.stringify(dlg)} result=${JSON.stringify(r)} errs=${JSON.stringify(errs.slice(0,2))}`);
 await ctx.close();
}

L('\n##### 4-3 CLEAR / RESET + NARROW WIDTH #####');
{const {ctx,p,errs,dlg}=await mk(b,320);
 await p.click('#btnDemo');await p.waitForTimeout(700);
 L(' 320px overflow:',await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth,overflow:document.documentElement.scrollWidth>window.innerWidth+1})));
 L(' table scroll container:',await p.evaluate(()=>{const t=document.querySelector('table');if(!t)return null;let e=t.parentElement;while(e&&e!==document.body){const cs=getComputedStyle(e);if(cs.overflowX==='auto'||cs.overflowX==='scroll')return {cls:e.className.slice(0,30),clientW:e.clientWidth,scrollW:e.scrollWidth};e=e.parentElement}return 'NO SCROLL CONTAINER'}));
 await p.click('#btnClear');await p.waitForTimeout(900);
 L(' after clear:',JSON.stringify(await state(p)),' dialogs:',JSON.stringify(dlg));
 const nz=await p.evaluate(()=>[...document.querySelectorAll('table input')].filter(i=>i.value&&/[1-9]/.test(i.value)).length);
 L(' non-zero numeric cells after clear:',nz);
 L(' errs:',JSON.stringify(errs));
 await ctx.close();}
await b.close();
fs.writeFileSync('audit_harness/results/t43_log.txt',log.join('\n'));
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
