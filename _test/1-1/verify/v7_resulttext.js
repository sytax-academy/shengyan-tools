/* 補充驗證：結果頁每一句文字均可回溯至規格原文（含〔變數〕樣板還原） */
const {open,specText}=require('./lib');
const STATES=[
 {n:'型一未確認',a:{q1:'unsure'}},{n:'型一未確認(q1a)',a:{q1:'yes',q1a:'unsure'}},{n:'型一排除',a:{q1:'yes',q1a:'yes'}},
 {n:'型二g100',a:{q1:'no',q2:'no',q2c:'online',q3a:'g100',q3:'below'}},
 {n:'型二g50',a:{q1:'no',q2:'no',q2c:'online',q3a:'g50',q3:'below'}},
 {n:'型二mixed',a:{q1:'no',q2:'no',q2c:'online',q3a:'mixed',q3:'below'}},
 {n:'型二mixed+混合範圍',a:{q1:'yes',q1a:'no',q2:'no',q2c:'online',q3a:'mixed',q3:'below'}},
 {n:'型三 固定場所/偏公司/solo',a:{q1:'no',q2:'yes',q3b:'no',q3c:'free',q4:'high',q5:'yes',q5b:'yes',q6:'solo',q7:'care'}},
 {n:'型三 固定場所/偏行號/partner',a:{q1:'no',q2:'yes',q3b:'no',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'partner',q7:'ok'}},
 {n:'型三 兩者皆可(否決)/solo',a:{q1:'no',q2:'yes',q3b:'yes',q3c:'free',q4:'low',q5:'unsure',q5b:'unsure',q6:'solo',q7:'care'}},
 {n:'型三 q3c=company',a:{q1:'no',q2:'yes',q3b:'unsure',q3c:'company',q4:'unsure',q5:'no',q5b:'no',q6:'solo',q7:'ok'}},
 {n:'型三 q3c=unsure/partner',a:{q1:'no',q2:'no',q2c:'unsure',q3b:'yes',q3c:'unsure',q4:'high',q5:'yes',q5b:'no',q6:'partner',q7:'care'}},
 {n:'型三 不能定論(q3a unsure)',a:{q1:'no',q2:'no',q2c:'online',q3a:'unsure',q3b:'no',q3c:'free',q4:'unsure',q5:'unsure',q5b:'yes',q6:'solo',q7:'ok'}},
 {n:'型三 網路達起徵點+混合範圍',a:{q1:'yes',q1a:'no',q2:'no',q2c:'online',q3a:'g100',q3:'reached',q3b:'no',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'partner',q7:'ok'}}
];
const VARS=[
 ['另外銷售貨物／其他非專業性勞務的銷售額','〔銷售額語〕'],
 ['另外銷售貨物／其他非專業性勞務的部分','〔範圍語〕'],
 ['跨 10 萬元組與 5 萬元組（百分比合計）','〔業別群文字〕'],
 ['目前營業活動','〔範圍語〕'],['月銷售額','〔銷售額語〕'],
 ['10 萬元組','〔業別群文字〕'],['5 萬元組','〔業別群文字〕'],
 ['合夥行號','〔行號名稱〕'],['獨資行號','〔行號名稱〕']
];
function templatize(s){ let o=s; for(const [a,b] of VARS) o=o.split(a).join(b); return o; }
/* 規格以〔〕標示變數、或把「混合範圍時加」的插入句寫在句中，
   以下三式為規格明載之組合形態，逐式標明其規格出處後採認 */
function composed(L,flat){
  let m=L.match(/^設立(公司|獨資行號|合夥行號)：完整說明$/);
  if(m && flat.indexOf('設立〔名稱〕：完整說明')>=0)
    return '規格第六節型三第 5 點「每卡標題為「設立〔名稱〕：完整說明」」';
  if(/^若後續確認沒有組織型態限制，依你目前其他回答，可優先參考：/.test(L)
     && flat.indexOf('可優先參考：〔兩者皆可／設立公司／設立行號名稱〕。')>=0)
    return '規格第六節型三第 4 點「可優先參考：〔兩者皆可／設立公司／設立行號名稱〕。」';
  if(L.indexOf('顯示暫免。')>0){
    const parts=L.split('顯示暫免。');
    const head=templatize(parts[0]+'顯示暫免。'), tail=parts[1];
    if(flat.indexOf(head)>=0 && (tail==='' || flat.indexOf(tail)>=0))
      return '規格第六節型二「仍須留意」第二則，混合範圍時加句於「顯示暫免。」後';
  }
  return null;
}
(async()=>{
  const md=specText(), flat=md.replace(/【/g,'').replace(/】/g,'');
  const {browser,page,errs}=await open();
  const seen=new Set(), miss=[], viaComposed=[]; let viaVar=0;
  for(const st of STATES){
    const lines=await page.evaluate(a=>{window.__tool.set(a);window.__tool.goto('result');
      const r=document.querySelector('.rpage');
      return [...r.querySelectorAll('.tag-sum,.tag-lab,.rh,.rnote,h2,h3,.pts li p,.nums li p,.c-body p,.org-h,.org dt,.org dd,.o-t,.more summary span')]
        .map(e=>e.textContent.trim()).filter(Boolean);},st.a);
    for(const L of lines){
      if(seen.has(L)) continue; seen.add(L);
      if(flat.indexOf(L)>=0) continue;
      const t=templatize(L);
      if(flat.indexOf(t)>=0){ viaVar++; continue; }
      const c=composed(L,flat);
      if(c){ viaComposed.push({line:L,source:c}); continue; }
      miss.push({state:st.n,line:L,templatized:t});
    }
  }
  await browser.close();
  console.log(JSON.stringify({distinctLines:seen.size,matchedLiteral:seen.size-viaVar-viaComposed.length-miss.length,matchedViaVars:viaVar,matchedViaComposition:viaComposed,unmatched:miss,pageErrors:[...new Set(errs)]},null,1));
})();
