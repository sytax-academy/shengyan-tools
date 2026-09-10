const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');const log=[];const L=(...a)=>{const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ');log.push(s);console.log(s);};
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1200,height:1000},locale:'zh-TW'});const p=await ctx.newPage();
const errs=[],dlg=[];
p.on('pageerror',e=>errs.push('PAGEERR: '+String(e).slice(0,250)));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text().slice(0,180))});
p.on('dialog',async d=>{dlg.push(d.type()+'|'+d.message().replace(/\s+/g,' ').slice(0,70));await d.accept().catch(()=>{})});
await p.goto('http://127.0.0.1:8099/4-1/',{waitUntil:'networkidle'});await p.waitForTimeout(400);
const rd=()=>p.evaluate(()=>({verdict:[...document.querySelectorAll('[id*=erdict],[class*=erdict]')].filter(e=>e.offsetParent).map(e=>e.innerText.replace(/\s+/g,' ').slice(0,60))[0]||null,
  be:[...document.querySelectorAll('[id*=be],[class*=result]')].filter(e=>e.offsetParent&&e.innerText.trim()).map(e=>e.innerText.replace(/\s+/g,' ').slice(0,80))[0]||null,
  scenRows:document.querySelectorAll('#scenBody tr').length,
  assetRows:document.querySelectorAll('#assetList > *').length,
  localStorage:(()=>{try{return Object.keys(localStorage).length}catch(e){return 'blocked'}})()}));
L('## 4-1 baseline:',JSON.stringify(await rd()));
// business type
for(const b2 of await p.$$('button')){const t=(await b2.textContent()).trim();if(t==='賣商品'){await b2.click();break}}
await p.waitForTimeout(350);
const set=async(sel,v)=>{const e=await p.$(sel);if(e&&await e.isVisible()){await e.fill(String(v));await e.dispatchEvent('input');await p.waitForTimeout(120);return true}return false};
L(' set price:',await set('#price',500),' vcost:',await set('#vcost',200));
L(' all visible ids:',JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('input,select')].filter(e=>e.offsetParent&&e.id).map(e=>e.id))));
// fill fixed cost rows
const amts=await p.$$('input[id^=amount-]');L(' fixed-cost rows:',amts.length);
if(amts.length){await amts[0].fill('100000');await amts[0].dispatchEvent('input');}
await p.waitForTimeout(600);L(' after fixed cost:',JSON.stringify(await rd()));
// asset row
L(' asset cost set:',await set('#asset-1-cost','120000'),' months:',await set('#asset-1-months','60'));
await p.waitForTimeout(600);
L(' asset monthly:',await p.evaluate(()=>[...document.querySelectorAll('.asset-monthly-value')].map(e=>e.textContent.trim()).slice(0,3)));
// current volume + target profit
for(const id of ['#qtyNow','#qty','#curQty','#nowQty','#target','#targetProfit','#profit']){const ok=await set(id,'400');if(ok)L('  set '+id)}
await p.waitForTimeout(700);L(' after volumes:',JSON.stringify(await rd()));
L(' page numbers snapshot:',await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').match(/損益兩平[^。]{0,80}/g)?.slice(0,2)));
// scenario table
L(' scenario rows:',await p.evaluate(()=>[...document.querySelectorAll('#scenBody tr')].map(r=>[...r.cells].map(c=>c.innerText.trim().slice(0,12)).join(' | ')).slice(0,5)));
// reset
let resetClicked=false;
for(const b3 of await p.$$('button')){const t=(await b3.textContent()).trim();if(/重新|清空|重設/.test(t)&&await b3.isVisible()){L(' clicking reset:',t);await b3.click();resetClicked=true;await p.waitForTimeout(800);break}}
L(' reset clicked:',resetClicked,' after reset:',JSON.stringify(await rd()));
if(resetClicked)L('  price value after reset:',await p.evaluate(()=>document.querySelector('#price')?.value));
// reload persistence
await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(500);
L(' after reload price:',await p.evaluate(()=>document.querySelector('#price')?.value),' (4-1 has no localStorage persistence by design?)');
L(' dialogs:',JSON.stringify(dlg));L(' errors:',JSON.stringify(errs));
await b.close();fs.writeFileSync('audit_harness/results/t41_log.txt',log.join('\n'));
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
