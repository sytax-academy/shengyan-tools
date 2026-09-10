const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const B='http://127.0.0.1:8099';
const log=[];const L=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');log.push(s);console.log(s);};
async function mk(browser,url,w=1200){
  const ctx=await browser.newContext({viewport:{width:w,height:900},locale:'zh-TW'});
  const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push('PAGEERROR: '+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text().slice(0,250));});
  page.on('requestfailed',r=>errs.push('REQFAIL: '+r.url().slice(0,110)+' '+(r.failure()||{}).errorText));
  await page.goto(url,{waitUntil:'networkidle',timeout:60000});await page.waitForTimeout(400);
  return {ctx,page,errs};
}
async function tabSweep(page,steps=70){
  await page.evaluate(()=>{window.scrollTo(0,0);document.body.setAttribute('tabindex','-1');document.body.focus();});
  const order=[],bad=[],offscreen=[];let trapAt=null,prevPath=null,same=0;
  for(let i=0;i<steps;i++){
    await page.keyboard.press('Tab');
    const info=await page.evaluate(()=>{const el=document.activeElement;if(!el||el===document.body)return null;
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      const path=(()=>{let p=el,s=[];while(p&&p!==document.body){s.unshift(p.tagName+(p.id?'#'+p.id:'')+':nth('+[...(p.parentElement?.children||[])].indexOf(p)+')');p=p.parentElement}return s.join('>')})();
      return {tag:el.tagName,id:el.id,type:el.type||'',cls:(el.className||'').toString().slice(0,40),txt:(el.textContent||el.value||'').toString().trim().slice(0,22),
        outlineStyle:cs.outlineStyle,outlineWidth:cs.outlineWidth,boxShadow:(cs.boxShadow||'none').slice(0,50),
        visible:(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||(cs.boxShadow&&cs.boxShadow!=='none'),
        w:Math.round(r.width),h:Math.round(r.height),path};});
    if(!info){order.push('(body/exit)');continue;}
    if(info.path===prevPath){same++;if(same>2&&!trapAt)trapAt=info.path;}else same=0;
    prevPath=info.path;
    order.push(`${info.tag}${info.id?'#'+info.id:''}[${info.txt}]`);
    if(!info.visible)bad.push(info);
    if(info.w<24||info.h<24)offscreen.push({t:info.tag,id:info.id,txt:info.txt,w:info.w,h:info.h});
  }
  return {steps,uniquePaths:new Set(order).size,noVisibleFocus:bad,trapAt,tinyFocusable:offscreen.slice(0,8),order:order.slice(0,40)};
}
const vis=async(page,sel)=>{const els=await page.$$(sel);const o=[];for(const e of els){if(await e.isVisible())o.push(e)}return o};

(async()=>{
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const out={};

L('########## TAB SWEEP (visible-focus + trap detection) ##########');
for(const id of ['1-1','2-1','2-2','3-2','4-1','4-3']){
  const {ctx,page}=await mk(browser,`${B}/${id}/`);
  const r=await tabSweep(page,70); out['tab_'+id]=r;
  L(`${id}: steps=${r.steps} uniqueStops=${r.uniquePaths} noVisibleFocus=${r.noVisibleFocus.length} trapAt=${r.trapAt||'none'} tinyFocusable=${r.tinyFocusable.length}`);
  if(r.noVisibleFocus.length)L('   NOFOCUS',JSON.stringify(r.noVisibleFocus.slice(0,4)));
  if(r.tinyFocusable.length)L('   TINY',JSON.stringify(r.tinyFocusable.slice(0,4)));
  L('   first stops:',JSON.stringify(r.order.slice(0,10)));
  await ctx.close();
}

L('\n########## 1-1 WIZARD ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/1-1/`);
 const st=()=>page.evaluate(()=>({q:(document.querySelector('h1')||{}).textContent?.trim().slice(0,34),
   opts:[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.closest('.stage,.card,main')&&!b.closest('.side,.sidebar,.mobile')).map(b=>b.textContent.trim().replace(/\s+/g,' ').slice(0,18))}));
 L(' start:',JSON.stringify(await st()));
 for(let i=0;i<14;i++){
   const opts=await vis(page,'button');
   const pick=[];for(const o of opts){const t=(await o.textContent()||'').trim();if(/^[1-9]/.test(t)&&!/上一|重新/.test(t))pick.push(o);}
   if(!pick.length){L(` step${i+1}: no option buttons -> stop`);break;}
   await pick[0].click();await page.waitForTimeout(320);
   const s=await st();L(` step${i+1} ->`,JSON.stringify(s).slice(0,180));
   if(!s.opts.length)break;
 }
 const resultTxt=await page.evaluate(()=>document.body.innerText.slice(0,160).replace(/\s+/g,' '));
 L(' end screen:',resultTxt);
 for(const label of ['上一題','重新開始']){
   const b=(await vis(page,`button:has-text("${label}")`))[0];
   L(` ${label} present:`,!!b);
   if(b){await b.click();await page.waitForTimeout(350);L(`  after ${label}:`,JSON.stringify(await st()).slice(0,160));}
 }
 L(' errors:',JSON.stringify(errs));out.flow11={errs};await ctx.close();}

L('\n########## 2-1 WIZARD ##########');
{const {ctx,page,errs}=await mk(browser,`${B}/2-1/`);
 const st=()=>page.evaluate(()=>({stage:(document.querySelector('#stage')||document.querySelector('main')).innerText.trim().replace(/\s+/g,' ').slice(0,70),
   btns:[...document.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>b.textContent.trim().slice(0,14))}));
 L(' start:',JSON.stringify(await st()));
 for(let i=0;i<14;i++){
   const opts=await vis(page,'#stage button, main button');
   const pick=[];for(const o of opts){const t=(await o.textContent()||'').trim();if(!/上一題|重新開始/.test(t))pick.push(o);}
   if(!pick.length){L(` step${i+1}: none`);break;}
   await pick[0].click();await page.waitForTimeout(320);
   L(` step${i+1}:`,JSON.stringify(await st()).slice(0,190));
 }
 L(' globals(inline-onclick deps):',JSON.stringify(await page.evaluate(()=>['back','restart','choose','pick','go','start','toggle'].reduce((a,k)=>(a[k]=typeof window[k],a),{}))));
 for(const label of ['上一題','重新開始']){
   const b=(await vis(page,`button:has-text("${label}")`))[0];L(` ${label}:`,!!b);
   if(b){await b.click();await page.waitForTimeout(350);L('  ->',JSON.stringify(await st()).slice(0,150));}
 }
 L(' errors:',JSON.stringify(errs));out.flow21={errs};await ctx.close();}

L('\n########## 3-2 SEARCH (both versions) ##########');
for(const [id,url] of [['3-2',`${B}/3-2/`],['3-2v156',`${B}/audit_harness/inputs/3-2_v1.5.6_manifest_named.html`]]){
 const {ctx,page,errs}=await mk(browser,url);
 const q=(await vis(page,'input'))[0];
 L(` -- ${id} input:`,!!q);
 if(q){
  for(const term of ['餐費','停車費','汽車','員工旅遊','zzz不存在']){
   await q.fill('');await q.type(term,{delay:10});await page.waitForTimeout(550);
   L(`   "${term}"`,JSON.stringify(await page.evaluate(()=>({state:document.body.dataset.state,
     heading:(document.getElementById('resultHeading')||{}).textContent?.trim().slice(0,34),
     cards:document.querySelectorAll('#results>*').length,
     dup:(()=>{const m={};document.querySelectorAll('[id]').forEach(e=>m[e.id]=(m[e.id]||0)+1);return Object.entries(m).filter(([,c])=>c>1)})()}))));
  }
  await q.fill('');await q.type('<img src=x onerror="window.__X=1">',{delay:4});await page.waitForTimeout(700);
  L('   XSS probe:',await page.evaluate(()=>window.__X===1?'VULNERABLE':'safe'),'injectedImgs:',await page.evaluate(()=>document.querySelectorAll('#results img,#searchCount img,main img').length));
  await q.fill('');await page.waitForTimeout(450);
  L('   after clear:',JSON.stringify(await page.evaluate(()=>({state:document.body.dataset.state,results:document.getElementById('results')?.innerHTML.length}))));
 }
 const cats=await vis(page,'.cat-card');
 L('   catCards:',cats.length);
 if(cats.length){await cats[0].click();await page.waitForTimeout(400);
  L('   opened:',JSON.stringify(await page.evaluate(()=>({hidden:document.getElementById('categoryDetail')?.hidden,expanded:[...document.querySelectorAll('.cat-card')].filter(b=>b.getAttribute('aria-expanded')==='true').length}))));
  await cats[0].click();await page.waitForTimeout(400);
  L('   toggled:',JSON.stringify(await page.evaluate(()=>({hidden:document.getElementById('categoryDetail')?.hidden,expanded:[...document.querySelectorAll('.cat-card')].filter(b=>b.getAttribute('aria-expanded')==='true').length}))));
  await cats[1]?.click();await page.waitForTimeout(400);
  L('   switch to cat2:',JSON.stringify(await page.evaluate(()=>({expanded:[...document.querySelectorAll('.cat-card')].filter(b=>b.getAttribute('aria-expanded')==='true').length}))));
 }
 L('   errors:',JSON.stringify(errs));out['flow_'+id]={errs};await ctx.close();
}
await browser.close();
fs.writeFileSync('audit_harness/results/flows2.json',JSON.stringify(out,null,2));
fs.writeFileSync('audit_harness/results/flows2_log.txt',log.join('\n'));
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
