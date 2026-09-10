const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const B='http://127.0.0.1:8099';
const log=[]; const L=(...a)=>{log.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '));console.log(...a);};

async function mk(browser,url,w=1200){
  const ctx=await browser.newContext({viewport:{width:w,height:900},locale:'zh-TW'});
  const page=await ctx.newPage();
  const errs=[];
  page.on('pageerror',e=>errs.push('PAGEERROR: '+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text().slice(0,250));});
  page.on('requestfailed',r=>errs.push('REQFAIL: '+r.url().slice(0,120)+' '+(r.failure()||{}).errorText));
  await page.goto(url,{waitUntil:'networkidle',timeout:60000});
  await page.waitForTimeout(400);
  return {ctx,page,errs};
}
// REAL keyboard tab sweep -> :focus-visible resolution
async function keyboardFocusSweep(page,steps=45){
  await page.evaluate(()=>{document.body.focus();window.scrollTo(0,0);});
  const bad=[],seen=new Set();
  for(let i=0;i<steps;i++){
    await page.keyboard.press('Tab');
    const info=await page.evaluate(()=>{
      const el=document.activeElement; if(!el||el===document.body)return null;
      const cs=getComputedStyle(el);
      const matchesFV=(()=>{try{return el.matches(':focus-visible')}catch(e){return null}})();
      const r=el.getBoundingClientRect();
      return {tag:el.tagName,id:el.id,cls:(el.className||'').toString().slice(0,45),txt:(el.textContent||'').trim().slice(0,24),
        outlineStyle:cs.outlineStyle,outlineWidth:cs.outlineWidth,outlineColor:cs.outlineColor,
        boxShadow:(cs.boxShadow||'none').slice(0,60),bg:cs.backgroundColor,matchesFV,
        inView:r.top>=-5&&r.bottom<=window.innerHeight+5, w:Math.round(r.width),h:Math.round(r.height)};
    });
    if(!info)continue;
    const key=info.tag+'|'+info.id+'|'+info.txt;
    if(seen.has(key))continue; seen.add(key);
    const visible=(info.outlineStyle!=='none'&&parseFloat(info.outlineWidth)>0)||(info.boxShadow!=='none');
    if(!visible)bad.push(info);
  }
  return {tabbedUnique:seen.size,noVisibleFocus:bad};
}
const clickIf=async(page,sel)=>{const el=await page.$(sel);if(el){await el.click();await page.waitForTimeout(250);return true}return false};

(async()=>{
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const out={};

/* ---------- KEYBOARD FOCUS on all six ---------- */
L('\n########## KEYBOARD FOCUS SWEEP (real Tab, :focus-visible) ##########');
for(const id of ['1-1','2-1','2-2','3-2','4-1','4-3']){
  const {ctx,page,errs}=await mk(browser,`${B}/${id}/`);
  const r=await keyboardFocusSweep(page,45);
  out['focus_'+id]=r;
  L(`${id}: tabbed=${r.tabbedUnique} noVisibleFocus=${r.noVisibleFocus.length}`);
  r.noVisibleFocus.slice(0,6).forEach(b=>L('   NOFOCUS',JSON.stringify(b)));
  await ctx.close();
}

/* ---------- 1-1 wizard ---------- */
L('\n########## 1-1 WIZARD FLOW ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/1-1/`);
 const snap=async t=>L('  ',t,await page.evaluate(()=>({h1:(document.querySelector('h1')||{}).textContent?.trim().slice(0,40),btns:[...document.querySelectorAll('button')].map(b=>b.textContent.trim().slice(0,14)),step:document.body.dataset.step||''})));
 await snap('start');
 for(let i=0;i<6;i++){
   const btns=await page.$$('main button, .opt, [data-choice]');
   if(!btns.length)break;
   await btns[0].click(); await page.waitForTimeout(300);
   await snap('after click '+(i+1));
 }
 L('  back button present:',!!(await page.$('text=上一題'))||!!(await page.$('text=上一步')));
 const backOk=await clickIf(page,'button:has-text("上一")');
 L('  back clicked:',backOk); await snap('after back');
 const restartOk=await clickIf(page,'button:has-text("重新")');
 L('  restart clicked:',restartOk); await snap('after restart');
 L('  errors:',errs); out.flow_1_1={errs}; await ctx.close();}

/* ---------- 2-1 wizard ---------- */
L('\n########## 2-1 WIZARD FLOW ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/2-1/`);
 const snap=async t=>L('  ',t,await page.evaluate(()=>({stage:(document.querySelector('#stage')||{}).textContent?.trim().slice(0,45),btns:[...document.querySelectorAll('button')].map(b=>b.textContent.trim().slice(0,12))})));
 await snap('start');
 for(let i=0;i<7;i++){
   const btns=await page.$$('#stage button');
   if(!btns.length)break;
   await btns[0].click(); await page.waitForTimeout(300); await snap('step'+(i+1));
 }
 L('  back:',await clickIf(page,'button:has-text("上一題")')); await snap('after back');
 L('  restart:',await clickIf(page,'button:has-text("重新開始")')); await snap('after restart');
 // global fn dependency check (inline onclick)
 L('  globals:',await page.evaluate(()=>['back','restart','choose','go','start'].reduce((a,k)=>(a[k]=typeof window[k],a),{})));
 L('  errors:',errs); out.flow_2_1={errs}; await ctx.close();}

/* ---------- 3-2 search ---------- */
L('\n########## 3-2 SEARCH FLOW ##########');
for(const id of ['3-2','3-2v156']){
 const url=id==='3-2'?`${B}/3-2/`:`${B}/audit_harness/inputs/3-2_v1.5.6_manifest_named.html`;
 const {ctx,page,errs}=await mk(browser,url);
 const q=await page.$('input[type=search], input#q, input[type=text]');
 L(` -- ${id} searchbox:`,!!q);
 if(q){
  for(const term of ['餐費','停車','汽車','zzz沒有這種東西']){
    await q.fill(''); await q.type(term,{delay:12}); await page.waitForTimeout(500);
    const r=await page.evaluate(()=>({state:document.body.dataset.state,heading:(document.querySelector('#resultHeading')||{}).textContent?.trim().slice(0,40),
      cards:document.querySelectorAll('#results > *').length, dupIds:(()=>{const m={};document.querySelectorAll('[id]').forEach(e=>m[e.id]=(m[e.id]||0)+1);return Object.entries(m).filter(([,c])=>c>1)})()}));
    L(`   "${term}" ->`,JSON.stringify(r));
  }
  // XSS probe (escaping check)
  await q.fill(''); await q.type('<img src=x onerror=window.__X=1>',{delay:5}); await page.waitForTimeout(600);
  L('   XSS probe __X:',await page.evaluate(()=>window.__X===1?'EXECUTED-VULNERABLE':'not executed'),
    ' imgInjected:',await page.evaluate(()=>document.querySelectorAll('#results img, #searchCount img').length));
  await q.fill(''); await page.waitForTimeout(400);
  L('   cleared state:',await page.evaluate(()=>document.body.dataset.state));
 }
 // category browse
 const cat=await page.$('.cat-card');
 if(cat){await cat.click();await page.waitForTimeout(350);
  L('   category opened:',await page.evaluate(()=>({open:!document.getElementById('categoryDetail')?.hidden,expanded:[...document.querySelectorAll('.cat-card')].filter(b=>b.getAttribute('aria-expanded')==='true').length})));
  await cat.click();await page.waitForTimeout(300);
  L('   category toggled closed:',await page.evaluate(()=>!!document.getElementById('categoryDetail')?.hidden));}
 L('   errors:',errs); out['flow_'+id]={errs}; await ctx.close();
}

await browser.close();
fs.writeFileSync('audit_harness/results/flows_report.json',JSON.stringify(out,null,2));
fs.writeFileSync('audit_harness/results/flows_log.txt',log.join('\n'));
})().catch(e=>{console.error('ERR',e);process.exit(1)});
