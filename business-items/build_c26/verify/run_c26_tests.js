// run_c26_tests.js：驗證表 v1_32 第三之四節 Q186～Q216 中可程式判定者（c26）。
// 用法：node run_c26_tests.js 〈index.html〉 〈expected.json〉 〈規格 v1_33.md〉 〈v1.4.0 index.html〉
const {chromium}=require('playwright');const fs=require('fs');
const [page_, expP, specP, oldP]=process.argv.slice(2,6);
const exp=JSON.parse(fs.readFileSync(expP,'utf8'));const spec=fs.readFileSync(specP,'utf8');
const URL='file://'+page_,OLD='file://'+oldP;
const A={};{const a0=spec.indexOf('## 附錄 A　逐字字樣'),a1=spec.indexOf('## 附錄 B　');for(const ln of spec.slice(a0,a1).split('\n')){const m=ln.match(/^- ([A-Za-z0-9_]+)：「(.*)」$/);if(m)A[m[1]]=m[2];}}
const res=[];function R(q,ok,detail){res.push([q,ok]);console.log((ok?'PASS ':'FAIL ')+q+' '+detail);}
const eqa=(a,b)=>JSON.stringify(a)===JSON.stringify(b);const sameSet=(a,b)=>eqa([...a].sort(),[...b].sort());
(async()=>{
const br=await chromium.launch();const errs=[];const reqs=[];
const ctx=await br.newContext({viewport:{width:1000,height:900}});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
p.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))reqs.push(r.url());});
await p.goto(URL);
const inp=async(pg,s)=>{await pg.fill('#p2Name',s);await pg.dispatchEvent('#p2Name','input');};
const text=pg=>pg.$eval('#p2NameList',e=>e.innerText);
const boxes=pg=>pg.$$eval('#p2NameList .p3-v8',a=>a.map(e=>e.getAttribute('data-v8')));
const lists=pg=>pg.$eval('#p2NameList',e=>{const bx=e.querySelector('.p3-v8');if(!bx)return null;const f=[],q=[];bx.querySelectorAll('[data-code]').forEach(c=>{(c.closest('.p3-part')?q:f).push(c.getAttribute('data-code'));});return {f,q};});
const V8=await p.$eval('#data-codes',e=>JSON.parse(e.textContent));
// Q186
const P3=await p.$eval('#p3-data',e=>JSON.parse(e.textContent));
{let bad=[];for(const r of V8){const c=r[0],e=exp.exp[c],g=P3.m[c]||{c:[],p:[]};
 if(!eqa([...g.c].sort(),e.c)||!eqa([...g.p].sort(),e.p)||!eqa(g.u||null,e.u))bad.push(c);}
 const extraKeys=Object.keys(P3.m).filter(k=>!exp.exp[k]);
 let nameBad=0;for(const k in P3.t9)if(P3.t9[k]!==exp.name9[k])nameBad++;const need=new Set();for(const c in exp.exp)for(const k of exp.exp[c].c.concat(exp.exp[c].p))need.add(k);
 R('Q186',bad.length===0&&extraKeys.length===0&&nameBad===0&&Object.keys(P3.t9).length===need.size&&exp.tax_rows===1073&&exp.handled+exp.unhandled===1073&&exp.handled===1055&&exp.unhandled===18&&exp.numeric_tax_cells===20,
 `790 碼逐碼比對差異 ${bad.length}；多餘鍵 ${extraKeys.length}；t9 名稱差異 ${nameBad}、t9 個數 ${Object.keys(P3.t9).length}/${need.size}；獨立程式：tax_rows ${exp.tax_rows}＝${exp.handled}＋${exp.unhandled}、數值儲存格 ${exp.numeric_tax_cells}、有候選 ${exp.with_candidates}、無 ${exp.without.length}、部分 ${exp.partial_total}／${exp.partial_codes} 碼`);}
// Q187
await inp(p,'JA02020');let l=await lists(p);R('Q187',eqa(l,{f:['959100'],q:[]}),JSON.stringify(l));
// Q188
await inp(p,'F114030');l=await lists(p);R('Q188',sameSet(l.f,['465311','465312','465313','465314','465315','465316'])&&l.q.length===0,JSON.stringify(l));
// Q189
{let ok=true,o=[];for(const s of ['F114030 機車','F114030,機車','F114030、機車']){await inp(p,s);const x=await lists(p);o.push(x.f.join(','));if(!sameSet(x.f.slice(0,2),['465314','465316']))ok=false;}R('Q189',ok,o.join(' | '));}
// Q190
{await inp(p,'機車修理業');const a=await boxes(p),ab=await p.$$('#p2NameList .p3-byname');await inp(p,'機車修理');const b=await boxes(p),bb=await p.$$('#p2NameList .p3-byname');
 await inp(p,'JA02020');const c=await p.$$('#p2NameList .p3-byname');R('Q190',eqa(a,['JA02020'])&&eqa(b,['JA02020'])&&ab.length===1&&bb.length===1&&c.length===0,`業:${a} byname${ab.length}；無業:${b} byname${bb.length}；代碼 byname${c.length}`);}
// Q191
{const none=exp.without;let bad=[];for(const c of none){await inp(p,c);const t=await text(p),btn=await p.$$('#p2NameList button'),link=await p.$$('#p2NameList a[href]');
 if(c==='ZZ99999'){if(!t.includes(A.p3_v8_zz)||btn.length)bad.push(c);}else{if(!t.includes(A.p3_v8_none+'財政部')&&!t.includes(A.p3_v8_none)||!t.includes(A.p3_v8_none_tail)||btn.length||link.length!==1)bad.push(c);}}
 await inp(p,'F401010');const href=await p.$eval('#p2NameList a',a=>a.href+' | '+a.textContent+' | '+a.parentElement.innerText);
 R('Q191',bad.length===0,`12 碼不符 ${bad.length}；例 F401010：${href}`);}
// Q192
{await inp(p,'ZZ00000');const t1=(await text(p)).trim();await inp(p,'F102010');const t2=(await text(p)).trim();R('Q192',t1===A.p3_v8_notfound.replace('〔代碼〕','ZZ00000')&&t2===A.p3_v8_notfound.replace('〔代碼〕','F102010'),`${t1} | ${t2}`);}
// Q193
{await inp(p,'JA02020');const a=await text(p);await inp(p,'ja02020');const b=await text(p);await inp(p,'ＪＡ０２０２０');const c=await text(p);R('Q193',a===b&&b===c&&a.includes('959100'),`三者逐字相同=${a===b&&b===c}`);}
// Q194
{await p.fill('#p2Code','');await inp(p,'F114030');await p.click('#p2NameList [data-code="465314"]');await p.click('#p2NameList [data-code="465314"]');await p.click('#p2NameList [data-code="465316"]');const v1=await p.inputValue('#p2Code');
 await p.click('#searchBtn',{force:true}).catch(()=>{});await p.dispatchEvent('#p2Form','submit');const cards=await p.$$eval('#p2Results .p2-card',a=>a.map(e=>e.getAttribute('data-code')));
 let zr=[];for(const z of exp.zero){let found=null;for(const c in exp.exp){const e=exp.exp[c];if(e.c.concat(e.p).includes(z)){found=c;break;}}
  await inp(p,found);if(exp.exp[found].p.includes(z))await p.$eval('#p2NameList details',d=>d.open=true);
  const el=await p.$(`#p2NameList [data-code="${z}"]`);const info=await el.evaluate(e=>({tag:e.tagName,txt:e.innerText}));
  const before=await p.inputValue('#p2Code');await el.click({force:true});const after=await p.inputValue('#p2Code');zr.push(z+':'+info.tag+(before===after?'':'(改了欄)')+(info.txt.includes(A.p3_v8_zero)?'':'(無字樣)'));}
 const okz=zr.every(x=>/:SPAN$/.test(x));
 R('Q194',v1==='465314 465316'&&eqa(cards,['465314','465316'])&&okz&&eqa(exp.zero,['060015','170013','641212','859111']),`代號欄「${v1}」；查詢後卡 ${cards}；p3_v8_zero：${zr.join(' ')}；不在 button 內`);}
// Q195
{await p.goto(URL);await p.fill('#biz','咖啡廳');await p.click('#searchBtn');const cands=await p.$$('#results article.cand');const nb=[];for(const c of cands)nb.push((await c.$$('button.to-tax')).length);
 const codes=await p.$$eval('#results article.cand',a=>a.map(e=>e.getAttribute('data-code')));
 let bad=[],tested=0;for(let i=0;i<Math.min(cands.length,6);i++){await p.fill('#biz','咖啡廳');await p.click('#searchBtn');const cs=await p.$$('#results article.cand');await (await cs[i].$('button.to-tax')).click();
  const val=await p.inputValue('#p2Name'),bx=await boxes(p),top=await p.$eval('#p2Name',e=>e.getBoundingClientRect().top),cardsN=await p.$$('#p2Results .p2-card');const vh=await p.evaluate(()=>innerHeight);
  tested++;if(val!==codes[i]||!bx.includes(codes[i])||!(top>=0&&top<vh)||cardsN.length)bad.push([codes[i],val,bx,top]);}
 const top2=await p.$eval('#p2NameArea',e=>Math.round(e.getBoundingClientRect().top));
 R('Q195',nb.every(x=>x===1)&&nb.length>0&&bad.length===0,`候選卡 ${nb.length} 張，各恰一個按鈕=${nb.every(x=>x===1)}；點前 ${tested} 張：名稱欄值＝代碼、出現框、欄在視窗內、無統計卡，不符 ${bad.length}；名稱區頂端距視窗頂 ${top2}px`);}
// Q196
{const pb=await ctx.newPage();await pb.goto(OLD);let d=0,bx=0;const ss=['咖啡','批發業','機車 業','印刷電路板','電視購物','洗衣機零售','電視 購物','印刷 電路板','洗衣 機','租賃 住宅','民宿 清潔','ＫＴＶ','視唱中心（ＫＴＶ）','張（板）','）製'];
 for(const s of ss){await inp(p,s);await inp(pb,s);const a=await text(p),c=await text(pb);if(a!==c)d++;if(await p.$('#p2NameList .p3-v8'))bx++;}
 R('Q196',d===0&&bx===0,`${ss.length} 句與 v1.4.0 逐字不同者 ${d}；出現對照框者 ${bx}`);await pb.close();}
// Q197 與 Q202 之狀態收集
const banned=['較常見','就是','建議選','應選'];
{const states=['JA02020','機車修理業','F114030 機車','JZ99160','A299990','F401010','ZZ99999','ZZ00000','咖啡','F206020'];let hit=[];for(const s of states){await inp(p,s);await p.$$eval('#p2NameList details',a=>a.forEach(d=>d.open=true));const t=await p.evaluate(()=>document.body.innerText);for(const w of banned)if(t.includes(w))hit.push([s,w]);}
 await p.goto(URL);const t0=await p.evaluate(()=>document.body.innerText);for(const w of banned)if(t0.includes(w))hit.push(['初始',w]);
 R('Q197',hit.length===0,`${states.length+1} 狀態含禁字 ${hit.length}`);}
// Q198
{const size=fs.statSync(page_).size;const st=await p.evaluate(()=>({l:localStorage.length,s:sessionStorage.length,c:document.cookie.length}));const idb=await p.evaluate(async()=>{try{return (await indexedDB.databases()).length}catch(e){return -1}});
 R('Q198',size<=1000000&&reqs.length===0&&st.l===0&&st.s===0&&st.c===0&&idb<=0,`${size} 位元組；非 file/data 網路請求 ${reqs.length}；localStorage ${st.l}、sessionStorage ${st.s}、cookie ${st.c}、indexedDB ${idb}`);}
// Q199
{let bad=[];for(const w of [320,390]){const pg=await ctx.newPage();await pg.setViewportSize({width:w,height:800});await pg.goto(URL);for(const c of ['F206020','A102060','JZ99160','A399990','F106020']){await inp(pg,c);await pg.$$eval('#p2NameList details',a=>a.forEach(d=>d.open=true));const o=await pg.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth}));
 const inner=await pg.$eval('#p2NameList',e=>e.scrollWidth<=e.clientWidth+0);if(o.sw>o.cw||!inner)bad.push([w,c,o]);}await pg.close();}
 R('Q199',bad.length===0,`寬 320、390 × 5 碼（details 展開）水平溢出 ${bad.length} 處${bad.length?JSON.stringify(bad):''}`);}
// Q200
{const src=fs.readFileSync(page_,'utf8');const un=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,'&');const dec=un(src);
 const keys=Object.keys(A).filter(k=>/^(p3_|p2_lead$|p2_name_label$|p2_name_placeholder$|p2_note_not_items$|version_line$|tool_version$)/.test(k));const miss=keys.filter(k=>!dec.includes(A[k])&&!dec.includes(JSON.stringify(A[k]).slice(1,-1)));
 R('Q200',miss.length===0,`鍵 ${keys.length} 個（自規格附錄 A 程式抽出），未逐字出現 ${miss.length} ${miss}`);}
// Q201
{let ok=true,o=[];for(const s of ['JA02020 機車修理業','機車修理','機車修理業']){await inp(p,s);const t=await text(p);const hasBox=(await boxes(p)).includes('JA02020'),has959=!!(await p.$('#p2NameList [data-code="959100"]'));if(!hasBox||!has959||t.includes('找不到'))ok=false;o.push(s+':'+hasBox+','+has959);}
 await p.goto(URL);const none=await p.$eval('#p2-str',e=>JSON.parse(e.textContent).name_none);for(const s of ['JA02020 機車修理業','機車修理','機車修理業']){await inp(p,s);if((await text(p)).includes(none))ok=false;}R('Q201',ok,o.join('；')+`；不含 p2_name_none「${none}」`);}
// Q202
{let bad=[];for(const c of V8.map(r=>r[0])){await inp(p,c);const n=await p.$$eval('#p2NameList .p3-count-note',a=>a.length),s=await p.$$eval('#p2NameList .p3-v8src',a=>a.length);const e=exp.exp[c];const has=(e.c.length+e.p.length)>0&&c!=='ZZ99999';const tn=(await text(p));
  const nCount=tn.split(A.p3_v8_count_note).length-1,nSrc=tn.split(A.p3_v8_src).length-1;if(has?(nCount!==1||nSrc!==1||n!==1||s!==1):(nCount||nSrc))bad.push(c);}
 const dom=await p.evaluate(a=>({lead:document.querySelector('.p2-lead').textContent,att:document.getElementById('p3Attribution').textContent,vl:document.querySelector('.as-of').textContent,tv:document.querySelector('meta[name=tool-version]').content,notes:document.body.innerText.includes(a)}),A.p2_note_not_items);
 R('Q202',bad.length===0&&dom.lead===A.p2_lead&&dom.att===A.p3_attribution&&dom.vl===A.version_line&&dom.tv===A.tool_version&&dom.notes,`790 碼框內 count_note／src 數量不符 ${bad.length}；p2_lead、p3_attribution、version_line、tool_version、p2_note_not_items 逐字=${dom.lead===A.p2_lead&&dom.att===A.p3_attribution&&dom.vl===A.version_line&&dom.tv===A.tool_version&&dom.notes}`);}
// Q203
{await inp(p,'JZ99160');const o=await p.$eval('#p2NameList',e=>{const d=e.querySelector('details');return {open:d.open,inD:[...d.querySelectorAll('[data-code]')].map(x=>x.getAttribute('data-code')),outD:[...e.querySelectorAll('[data-code]')].filter(x=>!x.closest('details')).map(x=>x.getAttribute('data-code')),sum:d.querySelector('summary').textContent};});
 const pp=exp.exp.JZ99160.p.length;const sumOk=o.sum===A.p3_v8_partial.replace('〔N〕',String(pp));
 await inp(p,'F214020');const f=await lists(p),dn=(await p.$$('#p2NameList details')).length;await inp(p,'JH01011');const h=await lists(p),dn2=(await p.$$('#p2NameList details')).length;
 R('Q203',!o.open&&o.inD.includes('932211')&&!o.outD.includes('932211')&&o.outD.includes('969099')&&sumOk&&dn===0&&dn2===0&&sameSet(f.f,['484211','484212','484213'])&&h.q.length===0,`JZ99160 details 預設收合=${!o.open}；內 ${o.inD}；外含 969099=${o.outD.includes('969099')}；摘要「${o.sum}」；F214020 候選 ${f.f}、details ${dn}；JH01011 details ${dn2}`);}
// Q204
{let ok=true,o=[];for(const [c,lv,cd] of [['A299990','中類','02'],['A399990','中類','03']]){await inp(p,c);const t=await text(p),l2=await lists(p);const e=exp.exp[c];const want=A.p3_v8_upper.replace('〔層級〕',lv).replace('〔代碼〕',cd).replace('〔名稱〕',e.u[2]);if(!t.includes(want)||!sameSet(l2.f,e.c)||!e.c.every(k=>k.startsWith(cd)))ok=false;o.push(c+':'+want+'→'+l2.f.length+'個');}R('Q204',ok,o.join('；'));}
// Q205
{let ok=true,o=[];const none=await p.$eval('#p2-str',e=>JSON.parse(e.textContent).name_none);for(const s of ['ISO14001','CNS12345','JA020201','XJA02020','AB12345678','JA 02020']){await inp(p,s);const t=(await text(p)).trim(),b=await boxes(p);if(b.length||t.includes('查無營業項目代碼')||t!==none)ok=false;o.push(s+':'+(t===none?'none':t.slice(0,30)));}R('Q205',ok,o.join('；'));}
// Q206
{await inp(p,'機車 F114030 ZZ00000');const o=await p.$eval('#p2NameList',e=>[...e.children].map(c=>c.classList.contains('p3-v8')?'框:'+c.getAttribute('data-v8'):c.textContent));R('Q206',eqa(o,['框:F114030','查無營業項目代碼ZZ00000。']),JSON.stringify(o));}
// Q207
{let bad=[],n=0;for(const c in exp.exp){const e=exp.exp[c];if(!(e.c.length+e.p.length)||c==='ZZ99999')continue;await inp(p,c);await p.$$eval('#p2NameList details',a=>a.forEach(d=>d.open=true));
  const got=await p.$$eval('#p2NameList [data-code]',a=>a.map(x=>[x.getAttribute('data-code'),x.innerText]));for(const [k,t] of got){n++;const v=exp.cnt[k];const want=v<0?A.p3_v8_zero:A.p3_v8_count.replace('〔N〕',String(v).replace(/\B(?=(\d{3})+(?!\d))/g,','));if(!t.includes(want))bad.push([c,k,t,want]);}}
 R('Q207',bad.length===0&&n>0,`${n} 個候選位置之家數（獨立自 p2-data 兩組相加、千分位）不符 ${bad.length}${bad.length?JSON.stringify(bad.slice(0,3)):''}`);}
// Q208
{await inp(p,'機車修理');await p.reload();const v=await p.inputValue('#p2Name'),c=await p.$$('#p2NameList *');R('Q208',v===''&&c.length===0,`重新整理後名稱欄「${v}」、對照框子元素 ${c.length}`);}
// Q209：呼叫端另跑
// Q211
{let bad=[];for(const r of V8){for(const s of [r[1],r[1].replace(/業$/,'')]){if(!s)continue;await inp(p,s);const b=await boxes(p),t=await p.$eval('#p2NameList',e=>({h:e.querySelector('.p3-v8 h3')?.textContent,by:!!e.querySelector('.p3-byname')}));
  const e=exp.exp[r[0]];const wantHead=(e.c.length+e.p.length&&r[0]!=='ZZ99999')?A.p3_v8_heading:A.p3_v8_heading_plain;
  if(b.length!==1||b[0]!==r[0]||!t.by||t.h!==wantHead.replace('〔代碼〕',r[0]).replace('〔名稱〕',r[1]))bad.push([r[0],s,b.join(',')]);}}
 R('Q211',bad.length===0,`790 碼 × 原名與去「業」共 ${V8.length*2} 次輸入，不符 ${bad.length}${bad.length?JSON.stringify(bad.slice(0,5)):''}`);}
// Q212
{let bad=0;for(const r of V8){await inp(p,r[0]);const o=await p.$eval('#p2NameList',e=>({n:e.querySelectorAll('.p3-v8').length,by:!!e.querySelector('.p3-byname'),h:[...e.querySelectorAll('h3')].some(x=>x.textContent==='找到的稅籍行業（點選即加入代號欄）')}));const hh=await p.$eval('#p2-str',e=>JSON.parse(e.textContent).name_result_heading);const hx=await p.$$eval('#p2NameList h3',(a,hh)=>a.some(x=>x.textContent===hh),hh);if(o.n!==1||o.by||hx)bad++;}
 R('Q212',bad===0,`790 碼只輸入代碼：不符 ${bad}`);}
// Q213
{let bad=[];for(const k in exp.orders){const inputs=k;const s=inputs;await inp(p,s);await p.$$eval('#p2NameList details',a=>a.forEach(d=>d.open=true));const g=await lists(p);const w=exp.orders[k];if(!g||!eqa(g.f,w[0])||!eqa(g.q,w[1]))bad.push(k);}
 R('Q213',bad.length===0,`${Object.keys(exp.orders).length} 項（790 碼＋4 句）完整候選與部分候選順序與獨立程式不同者 ${bad.length}${bad.length?bad.slice(0,5):''}`);}
// Q214
{const o=[];for(const s of ['其他農、畜、水產品批發業','發電﹑輸電﹑配電機械製造業','發電、輸電、配電機械製造業']){await inp(p,s);o.push(s+'→'+(await boxes(p)));}
 R('Q214',o[0].endsWith('→F101990')&&o[1].endsWith('→CC01010')&&o[2].endsWith('→CC01010'),o.join('；'));}
// Q215
{const base=async s=>{await inp(p,s);return (await p.$$eval('#p2NameList .p2-namelist:not(.p3-v8)',a=>a.map(e=>e.innerText))).join('||');};const only=await base('咖啡');let ok=true,o=[];
 for(const s of ['ZZ00000 咖啡','咖啡 ZZ00000','F102010 咖啡','Ａｂ１２３４５ 咖啡']){await inp(p,s);const nf=await p.$$eval('#p2NameList .p3-notfound',a=>a.map(e=>e.textContent));const rest=await base(s);if(nf.length!==1||rest!==only)ok=false;o.push(s+':'+nf[0]);}
 await inp(p,'ZZ00000');const t=(await text(p)).trim();if(t!==A.p3_v8_notfound.replace('〔代碼〕','ZZ00000'))ok=false;R('Q215',ok&&only.length>0,o.join('；')+`；單獨 ZZ00000：${t}`);}
// Q216
{await inp(p,'衛星電視ku頻道、c頻道器材安裝業');const b=await boxes(p);const pb=await ctx.newPage();await pb.goto(OLD);let ok=eqa(b,['E701020']);const o=['衛星電視…→'+b];for(const s of ['㈱','…']){await inp(p,s);await inp(pb,s);const a=(await text(p)),c=await text(pb);if(a!==''||c!=='')ok=false;o.push(s+':[新'+a.length+'/舊'+c.length+']');}R('Q216',ok,o.join('；'));await pb.close();}
console.log('JS 錯誤',errs.length,errs.slice(0,3));
const f=res.filter(r=>!r[1]);console.log(`總計 ${res.length} 列，通過 ${res.length-f.length}，未通過 ${f.length} ${f.map(r=>r[0])}`);
await br.close();})();
