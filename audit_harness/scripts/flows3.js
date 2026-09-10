const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');const B='http://127.0.0.1:8099';
const log=[];const L=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');log.push(s);console.log(s);};
async function mk(browser,url,w=1200){
  const ctx=await browser.newContext({viewport:{width:w,height:900},locale:'zh-TW'});
  const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push('PAGEERROR: '+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text().slice(0,200));});
  page.on('dialog',d=>{errs.push('DIALOG['+d.type()+']: '+d.message().slice(0,120));d.accept('1').catch(()=>{});});
  await page.goto(url,{waitUntil:'networkidle',timeout:60000});await page.waitForTimeout(350);
  return {ctx,page,errs};
}
(async()=>{
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const out={};

/* ===== 1-1 ===== */
L('\n########## 1-1 WIZARD (.choice) ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/1-1/`);
 const st=()=>page.evaluate(()=>({q:(document.querySelector('#app h1')||document.querySelector('h1')).textContent.trim().replace(/\s+/g,' ').slice(0,32),
   choices:[...document.querySelectorAll('.choice')].filter(b=>b.offsetParent).length,
   step:[...document.querySelectorAll('.progress-step')].findIndex(s=>s.className.includes('current'))+1,
   backDisabled:(document.querySelector('.nav-action[onclick="back()"]')||{}).disabled,
   isResult:!!document.querySelector('.result-shell')}));
 L(' start:',JSON.stringify(await st()));
 const path=[];
 for(let i=0;i<15;i++){
   const c=await page.$$('.choice');const vis=[];for(const x of c){if(await x.isVisible())vis.push(x)}
   if(!vis.length)break;
   const t=(await vis[0].textContent()).trim().replace(/\s+/g,' ').slice(0,16);
   await vis[0].click();await page.waitForTimeout(300);
   const s=await st();path.push(s.step);L(` pick#${i+1} "${t}" ->`,JSON.stringify(s));
   if(s.isResult){L(' REACHED RESULT at step',s.step);break;}
 }
 L(' aria-pressed on choices:',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.choice')].map(b=>({txt:b.textContent.trim().slice(0,10),ap:b.getAttribute('aria-pressed'),sel:b.className.includes('selected')||b.className.includes('on')})).slice(0,4))));
 // back
 for(let i=0;i<3;i++){const bk=await page.$('.nav-action[onclick="back()"]');
  if(bk&&!(await bk.isDisabled())){await bk.click();await page.waitForTimeout(300);L(' back ->',JSON.stringify(await st()));}else{L(' back disabled/absent');break}}
 const rs=await page.$('.nav-action[onclick="restart()"]');
 if(rs){await rs.click();await page.waitForTimeout(350);L(' restart ->',JSON.stringify(await st()));}
 // progress nav jump-back
 L(' progress-step buttons enabled:',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.progress-action')].map(b=>b.disabled).slice(0,6))));
 L(' errors:',JSON.stringify(errs));out.f11={errs};await ctx.close();}

/* ===== 2-1 ===== */
L('\n########## 2-1 WIZARD (.opt) ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/2-1/`);
 const st=()=>page.evaluate(()=>({stage:(document.querySelector('#stage')||document.querySelector('main')).innerText.trim().replace(/\s+/g,' ').slice(0,55),
   opts:[...document.querySelectorAll('.opt')].filter(b=>b.offsetParent).length,
   isResult:!!document.querySelector('.result,.res,[class*=result]')}));
 L(' start:',JSON.stringify(await st()));
 for(let i=0;i<15;i++){
   const c=await page.$$('.opt');const vis=[];for(const x of c){if(await x.isVisible())vis.push(x)}
   if(!vis.length){L(' no more .opt at iter',i+1);break;}
   const t=(await vis[0].textContent()).trim().slice(0,12);
   await vis[0].click();await page.waitForTimeout(300);
   L(` pick#${i+1} "${t}" ->`,JSON.stringify(await st()));
 }
 L(' end innerText:',(await page.evaluate(()=>document.querySelector('#stage').innerText.replace(/\s+/g,' ').slice(0,200))));
 for(let i=0;i<3;i++){const bk=await page.$('button.btn:has-text("上一題")');
  if(bk&&!(await bk.isDisabled())){await bk.click();await page.waitForTimeout(300);L(' back ->',JSON.stringify(await st()));}else{L(' back disabled/absent');break}}
 const rs=await page.$('button.btn:has-text("重新開始")');
 if(rs){await rs.click();await page.waitForTimeout(350);L(' restart ->',JSON.stringify(await st()));}
 L(' globals:',JSON.stringify(await page.evaluate(()=>['answer','back','restart'].reduce((a,k)=>(a[k]=typeof window[k],a),{}))));
 L(' errors:',JSON.stringify(errs));out.f21={errs};await ctx.close();}

/* ===== 2-2 ===== */
L('\n########## 2-2 CALCULATOR ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/2-2/`);
 const res=()=>page.evaluate(()=>{const r=document.querySelector('#empResult,#bossResult,.result,[id*=Result]');
   return {shown:!!(r&&r.offsetParent),txt:r?r.innerText.replace(/\s+/g,' ').slice(0,150):null};});
 await page.click('#rEmp').catch(()=>{});await page.waitForTimeout(250);
 for(const v of ['45800','0','-5','abc','999999999','28590.7']){
   await page.fill('#eSal',''); await page.fill('#eSal',v); await page.waitForTimeout(150);
   const btn=await page.$('#goEmp'); if(btn) await btn.click(); await page.waitForTimeout(400);
   const r=await res();
   L(` eSal="${v}" -> shown=${r.shown} :: ${(r.txt||'').slice(0,110)}`);
 }
 // boss path
 const rb=await page.$('#rBoss'); if(rb){await rb.click();await page.waitForTimeout(300);
   L(' boss panel fields:',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('input,select')].filter(e=>e.offsetParent).map(e=>({id:e.id,type:e.type,val:e.value.slice(0,10)})).slice(0,10))));
   const bsal=await page.$('#bSal'); if(bsal){await page.fill('#bSal','60000');}
   const gb=await page.$('#goBoss'); if(gb){await gb.click();await page.waitForTimeout(450);L(' boss result:',JSON.stringify(await res()).slice(0,220));}
 }
 L(' errors:',JSON.stringify(errs));out.f22={errs};await ctx.close();}

/* ===== 4-1 ===== */
L('\n########## 4-1 BREAK-EVEN ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/4-1/`);
 const rd=()=>page.evaluate(()=>({be:(document.querySelector('#beResult,#result,[id*=Result]')||{}).innerText?.replace(/\s+/g,' ').slice(0,130),
   scen:document.querySelectorAll('#scenBody tr').length}));
 // pick a business type
 const bt=await page.$$('button');for(const b of bt){const t=(await b.textContent()).trim();if(t==='賣商品'){await b.click();break}}
 await page.waitForTimeout(300);
 const setIf=async(sel,v)=>{const e=await page.$(sel);if(e&&await e.isVisible()){await e.fill(String(v));await e.dispatchEvent('input');return true}return false};
 L(' price set:',await setIf('#price',500),' vcost:',await setIf('#vcost',200),' fixed:',await setIf('#fixed',100000)||await setIf('#fixedCost',100000));
 await page.waitForTimeout(600);L(' after basic:',JSON.stringify(await rd()));
 L(' visible number inputs:',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('input')].filter(e=>e.offsetParent).map(e=>({id:e.id,type:e.type,ph:(e.placeholder||'').slice(0,14),val:e.value})).slice(0,14))));
 // invalid input handling
 for(const bad of ['-100','abc','1e9','1.234','']){
   await setIf('#price',bad);await page.waitForTimeout(350);
   L(`  price="${bad}" err=`,JSON.stringify(await page.evaluate(()=>{const e=document.querySelector('#price');return {ariaInvalid:e?.getAttribute('aria-invalid'),err:[...document.querySelectorAll('[id*=err],[class*=err]')].filter(x=>x.offsetParent&&x.textContent.trim()).map(x=>x.textContent.trim().slice(0,40))[0]||null}})));
 }
 await setIf('#price',500);await page.waitForTimeout(400);
 // xlsx export
 const dl=page.waitForEvent('download',{timeout:12000}).catch(()=>null);
 const xb=await page.$$('button');let clicked=false;
 for(const b of xb){const t=(await b.textContent()).trim();if(/匯出|下載|Excel|存/.test(t)&&await b.isVisible()){L(' clicking export:',t);await b.click();clicked=true;break}}
 const d=clicked?await dl:null;
 L(' download:',d?('OK '+d.suggestedFilename()):'none');
 if(d){const p='audit_harness/results/4-1_export.xlsx';await d.saveAs(p);L('  saved bytes:',fs.statSync(p).size);}
 L(' errors:',JSON.stringify(errs));out.f41={errs};await ctx.close();}

await browser.close();
fs.writeFileSync('audit_harness/results/flows3.json',JSON.stringify(out,null,2));
fs.writeFileSync('audit_harness/results/flows3_log.txt',log.join('\n'));
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
