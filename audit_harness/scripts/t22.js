const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');const log=[];const L=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');log.push(s);console.log(s);};
const read=p=>p.evaluate(()=>{const r=document.getElementById('res');
 const t=r?r.innerText.replace(/\s+/g,' '):'';
 return {on:r.className.includes('on'),visible:!!r.offsetParent,len:t.length,
  bracket:(t.match(/對應投保級距\s*([\d,]+)/)||[])[1]||null,
  salary:(t.match(/帳面月薪\s*([\d,.]+)/)||[])[1]||null,
  cost:(t.match(/人事成本\s*([\d,.]+)/)||[])[1]||null,
  inputVal:document.getElementById('eSal').value,
  ariaInvalid:document.getElementById('eSal').getAttribute('aria-invalid'),
  inputType:document.getElementById('eSal').type,
  head:t.slice(0,90)};});
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
L('##### 2-2 FRESH PAGE PER INPUT (employee path, #res) #####');
for(const v of ['45800','0','-5','abc','999999999','28590.7','1e5','0.4','   ']){
 const ctx=await b.newContext({viewport:{width:1200,height:900}});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,150)));
 await p.goto('http://127.0.0.1:8099/2-2/',{waitUntil:'networkidle'});
 await p.click('#rEmp');await p.waitForTimeout(200);
 await p.fill('#eSal',v);await p.waitForTimeout(150);
 await p.click('#goEmp');await p.waitForTimeout(600);
 L(` in="${v}" ->`,JSON.stringify(await read(p)),errs.length?('ERR '+errs):'');
 await ctx.close();
}
L('\n##### 2-2 SEQUENCE ON ONE PAGE: valid then invalid (stale-result probe) #####');
{const ctx=await b.newContext({viewport:{width:1200,height:900}});const p=await ctx.newPage();
 await p.goto('http://127.0.0.1:8099/2-2/',{waitUntil:'networkidle'});
 await p.click('#rEmp');await p.waitForTimeout(200);
 for(const v of ['45800','abc','-5','0','','999999999']){
  await p.fill('#eSal','');await p.waitForTimeout(80);
  await p.fill('#eSal',v);await p.waitForTimeout(120);
  await p.click('#goEmp');await p.waitForTimeout(500);
  L(`  typed "${v}" -> displayed`,JSON.stringify(await read(p)));
 }
 L('\n  -- does result auto-clear when input edited after a calc? --');
 await p.fill('#eSal','');await p.fill('#eSal','45800');await p.click('#goEmp');await p.waitForTimeout(450);
 L('   baseline:',JSON.stringify(await read(p)));
 await p.fill('#eSal','');await p.fill('#eSal','88888');await p.waitForTimeout(500);
 L('   after editing input WITHOUT clicking 計算:',JSON.stringify(await read(p)));
 await ctx.close();}
L('\n##### 2-2 BOSS PATH #####');
{const ctx=await b.newContext({viewport:{width:1200,height:900}});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto('http://127.0.0.1:8099/2-2/',{waitUntil:'networkidle'});
 await p.click('#rBoss');await p.waitForTimeout(350);
 L(' visible inputs:',JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('input,select')].filter(e=>e.offsetParent).map(e=>({id:e.id,type:e.type,name:e.name,val:String(e.value).slice(0,12)})))));
 for(const [id,v] of [['bMax','60000'],['bNhi','60000'],['bInc','60000']]){const el=await p.$('#'+id);if(el&&await el.isVisible()){await p.fill('#'+id,v)}}
 await p.waitForTimeout(200);
 const gb=await p.$('#goBoss');if(gb&&await gb.isVisible()){await gb.click();await p.waitForTimeout(700);}
 L(' boss result:',JSON.stringify(await read(p)));
 L(' errors:',JSON.stringify(errs));
 await ctx.close();}
await b.close();
fs.writeFileSync('audit_harness/results/t22_log.txt',log.join('\n'));
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
