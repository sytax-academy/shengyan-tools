// 第一期迴歸：以 data-phrases 全部說法、代碼表名稱及若干句，對 v1.4.0 與 v1.5.0 各查一次，比對 #results（移除 p3_to_tax 按鈕後）innerText 與候選卡順序。
const {chromium}=require('playwright');
const [newP,oldP]=process.argv.slice(2,4);
(async()=>{const b=await chromium.launch();const errs=[];
const pa=await b.newPage(),pb=await b.newPage();for(const p of [pa,pb])p.on('pageerror',e=>errs.push(e.message));
await pa.goto('file://'+newP);await pb.goto('file://'+oldP);
const ph=await pa.$eval('#data-phrases',e=>JSON.parse(e.textContent));const codes=await pa.$eval('#data-codes',e=>JSON.parse(e.textContent));
const inputs=new Set(['咖啡廳','在家開咖啡廳，順便賣蛋糕','電腦維修','進口葡萄酒','雜貨店','手搖飲','製造','企業顧問 修理','做業務','',' ','a']);
for(const k in ph)for(const w of ph[k])inputs.add(w);for(const r of codes)inputs.add(r[1]);
const q=async(p,s)=>{await p.fill('#biz',s);await p.click('#searchBtn');return p.$eval('#results',e=>{const c=e.cloneNode(true);c.querySelectorAll('.to-tax').forEach(x=>x.remove());return {t:c.innerText,codes:[...c.querySelectorAll('article.cand')].map(a=>a.getAttribute('data-code')),btn:c.querySelectorAll('button').length,nb:e.querySelectorAll('.to-tax').length,nc:e.querySelectorAll('article.cand').length};});};
let diff=0,n=0,badBtn=0;const L=[...inputs];
for(const s of L){const a=await q(pa,s),c=await q(pb,s);n++;if(a.t!==c.t||JSON.stringify(a.codes)!==JSON.stringify(c.codes)||a.btn!==c.btn){diff++;if(diff<4)console.log('DIFF',s);}if(a.nb!==a.nc)badBtn++;}
console.log(`第一期輸入 ${n} 句（全部常見說法＋790 個代碼表名稱＋12 句）：v1.5.0 與 v1.4.0 結果（移除 p3_to_tax 後之 innerText、候選卡順序、按鈕數）不同者 ${diff}；按鈕數不等於候選卡數者 ${badBtn}；JS 錯誤 ${errs.length}`);await b.close();})();
