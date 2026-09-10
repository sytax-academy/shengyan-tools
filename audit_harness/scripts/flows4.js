const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');const B='http://127.0.0.1:8099';
const log=[];const L=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');log.push(s);console.log(s);};
async function mk(browser,url,w=1200,ctxOpts={}){
  const ctx=await browser.newContext({viewport:{width:w,height:900},locale:'zh-TW',...ctxOpts});
  const page=await ctx.newPage();const errs=[];const dialogs=[];
  page.on('pageerror',e=>errs.push('PAGEERROR: '+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text().slice(0,200));});
  page.on('requestfailed',r=>errs.push('REQFAIL: '+r.url().slice(0,130)));
  page.on('dialog',async d=>{dialogs.push(d.type()+': '+d.message().replace(/\s+/g,' ').slice(0,90));await d.accept().catch(()=>{});});
  await page.goto(url,{waitUntil:'networkidle',timeout:60000});await page.waitForTimeout(350);
  return {ctx,page,errs,dialogs};
}
(async()=>{
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const out={};

/* ===== 1-1 404 + aria ===== */
L('########## 1-1 404 + choice semantics ##########');
{const ctx=await browser.newContext({viewport:{width:1200,height:900}});const page=await ctx.newPage();
 const f=[];page.on('response',r=>{if(r.status()>=400)f.push(r.status()+' '+r.url())});
 await page.goto(`${B}/1-1/`,{waitUntil:'networkidle'});await page.waitForTimeout(500);
 L(' 404 responses:',JSON.stringify(f));
 L(' choice semantics:',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.choice')].map(b=>({
   full:b.textContent.trim().replace(/\s+/g,' '),
   ariaPressed:b.getAttribute('aria-pressed'),role:b.getAttribute('role'),
   hiddenSpans:[...b.querySelectorAll('span')].map(s=>({t:s.textContent.trim().slice(0,8),disp:getComputedStyle(s).display,vis:getComputedStyle(s).visibility,op:getComputedStyle(s).opacity,ah:s.getAttribute('aria-hidden')}))
 })))));
 await ctx.close();}

/* ===== 2-2 VALIDATION, fresh page per case ===== */
L('\n########## 2-2 VALIDATION (fresh page per input) ##########');
for(const v of ['45800','0','-5','abc','999999999','28590.7','  ','1e5']){
  const {ctx,page,errs}=await mk(browser,`${B}/2-2/`);
  await page.click('#rEmp').catch(()=>{});await page.waitForTimeout(200);
  await page.fill('#eSal',v);await page.waitForTimeout(150);
  await page.click('#goEmp').catch(()=>{});await page.waitForTimeout(500);
  const r=await page.evaluate(()=>{
    const res=document.querySelector('#empResult')||[...document.querySelectorAll('[id*=esult]')][0];
    const errNodes=[...document.querySelectorAll('[class*=err],[id*=err],[aria-live],[class*=warn],[class*=hint]')].filter(e=>e.offsetParent&&e.textContent.trim()).map(e=>e.textContent.trim().replace(/\s+/g,' ').slice(0,60));
    return {resultVisible:!!(res&&res.offsetParent),resultLen:res?res.innerText.trim().length:0,
      bracket:(res?res.innerText.match(/對應投保級距\s*([\d,]+)/):null)?.[1]||null,
      salary:(res?res.innerText.match(/帳面月薪\s*([\d,.]+)/):null)?.[1]||null,
      cost:(res?res.innerText.match(/人事成本\s*([\d,.]+)/):null)?.[1]||null,
      inputVal:document.querySelector('#eSal').value, ariaInvalid:document.querySelector('#eSal').getAttribute('aria-invalid'),
      messages:errNodes.slice(0,3)};});
  L(` in="${v}" -> visible=${r.resultVisible} bracket=${r.bracket} salary=${r.salary} cost=${r.cost} ariaInvalid=${r.ariaInvalid} inputNow="${r.inputVal}" msgs=${JSON.stringify(r.messages)}`);
  await ctx.close();
}
L('\n-- 2-2 stale-result sequence (same page): valid -> invalid --');
{const {ctx,page}=await mk(browser,`${B}/2-2/`);
 await page.click('#rEmp');await page.waitForTimeout(200);
 const read=async()=>await page.evaluate(()=>{const r=document.querySelector('#empResult')||[...document.querySelectorAll('[id*=esult]')][0];
   return {vis:!!(r&&r.offsetParent),bracket:(r?r.innerText.match(/對應投保級距\s*([\d,]+)/):null)?.[1]||null,salary:(r?r.innerText.match(/帳面月薪\s*([\d,.]+)/):null)?.[1]||null};});
 for(const v of ['45800','abc','-5','0']){
  await page.fill('#eSal',v);await page.waitForTimeout(120);await page.click('#goEmp');await page.waitForTimeout(450);
  L(`  typed "${v}" -> displayed`,JSON.stringify(await read()));
 }
 await ctx.close();}

/* ===== 3-2 SEARCH ===== */
L('\n########## 3-2 SEARCH ##########');
for(const [id,url] of [['3-2',`${B}/3-2/`],['3-2v156',`${B}/audit_harness/inputs/3-2_v1.5.6_manifest_named.html`]]){
 const {ctx,page,errs}=await mk(browser,url);
 L(` -- ${id}`);
 const snap=()=>page.evaluate(()=>({state:document.body.dataset.state,
   heading:(document.getElementById('resultHeading')||{}).textContent?.trim().replace(/\s+/g,' ').slice(0,30),
   cards:document.querySelectorAll('#results>*').length,
   dup:(()=>{const m={};document.querySelectorAll('[id]').forEach(e=>m[e.id]=(m[e.id]||0)+1);return Object.entries(m).filter(([,c])=>c>1)})()}));
 for(const t of ['餐費','停車','汽車','員工旅遊','zzz不存在','  ']){
  await page.fill('#q','');await page.type('#q',t,{delay:8});await page.waitForTimeout(520);
  L(`   "${t}" ->`,JSON.stringify(await snap()));
 }
 await page.fill('#q','');await page.type('#q','<img src=x onerror="window.__X=1">',{delay:4});await page.waitForTimeout(700);
 L('   XSS:',await page.evaluate(()=>window.__X===1?'VULNERABLE':'safe'),'imgs:',await page.evaluate(()=>document.querySelectorAll('main img').length));
 await page.fill('#q','');await page.waitForTimeout(450);L('   cleared ->',JSON.stringify(await snap()));
 const cats=await page.$$('.cat-card');L('   catCards:',cats.length);
 if(cats.length>1){
  await cats[0].click();await page.waitForTimeout(400);
  L('   open cat0:',JSON.stringify(await page.evaluate(()=>({hidden:document.getElementById('categoryDetail').hidden,exp:[...document.querySelectorAll('.cat-card')].filter(b=>b.getAttribute('aria-expanded')==='true').length}))));
  await cats[1].click();await page.waitForTimeout(400);
  L('   switch cat1:',JSON.stringify(await page.evaluate(()=>({hidden:document.getElementById('categoryDetail').hidden,exp:[...document.querySelectorAll('.cat-card')].filter(b=>b.getAttribute('aria-expanded')==='true').length}))));
  await cats[1].click();await page.waitForTimeout(400);
  L('   toggle close:',JSON.stringify(await page.evaluate(()=>({hidden:document.getElementById('categoryDetail').hidden,exp:[...document.querySelectorAll('.cat-card')].filter(b=>b.getAttribute('aria-expanded')==='true').length}))));
 }
 L('   errors:',JSON.stringify(errs));await ctx.close();
}
await browser.close();
fs.writeFileSync('audit_harness/results/flows4_log.txt',log.join('\n'));
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
