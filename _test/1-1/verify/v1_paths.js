/* 驗證一：列出全部可達路徑，逐路徑以程式模擬作答，核對結果頁型別與主標 */
const {open}=require('./lib');

/* ---- 以下為規格第四節／第六節之獨立轉寫（不引用工具程式） ---- */
const OPTS={q1:['yes','no','unsure'],q1a:['yes','no','unsure'],q2:['yes','no'],
  q2c:['online','other','unsure'],q3a:['g100','g50','mixed','unsure'],q3:['reached','below'],
  q3b:['no','yes','unsure'],q3c:['free','company','unsure'],q4:['low','high','unsure'],
  q5:['yes','no','unsure'],q5b:['yes','no','unsure'],q6:['solo','partner'],q7:['care','ok']};
function nx(id,v){
  if(id==='q1')  return v==='unsure'?{t:1,k:'unconfirmed'}:(v==='yes'?'q1a':'q2');
  if(id==='q1a') return v==='yes'?{t:1,k:'excluded'}:(v==='unsure'?{t:1,k:'unconfirmed'}:'q2');
  if(id==='q2')  return v==='yes'?'q3b':'q2c';
  if(id==='q2c') return v==='online'?'q3a':'q3b';
  if(id==='q3a') return v==='unsure'?'q3b':'q3';
  if(id==='q3')  return v==='below'?{t:2}:'q3b';
  if(id==='q3b') return 'q3c';
  if(id==='q3c') return 'q4';
  if(id==='q4')  return 'q5';
  if(id==='q5')  return 'q5b';
  if(id==='q5b') return 'q6';
  if(id==='q6')  return 'q7';
  if(id==='q7')  return {t:3};
  throw new Error('bad '+id);
}
function enumerate(){
  const out=[];
  (function rec(node,acc){
    if(typeof node!=='string'){ out.push({steps:acc.slice(),term:node}); return; }
    for(const v of OPTS[node]){ acc.push([node,v]); rec(nx(node,v),acc); acc.pop(); }
  })('q1',[]);
  return out;
}
const T1H={unconfirmed:'先確認執行業務者／收入性質，再繼續判斷',excluded:'專業性勞務部分目前不需要進入一般營業人稅籍登記判斷'};
const T1N={unconfirmed:'目前關鍵身分或收入範圍尚未確認；在確認前，稅籍登記部分先不要下確定結論。',
           excluded:'依你目前的回答，只有執行業務者專業性勞務，沒有另外銷售貨物或提供其他非專業性勞務。若日後增加其他銷售行為，再重新判斷。'};
function expectPage(steps,term){
  const a={}; for(const [q,v] of steps) a[q]=v;
  if(term.t===1) return {label:'範圍確認',head:T1H[term.k],note:T1N[term.k]};
  if(term.t===2) return {label:'判斷結果',head:'目前可暫免辦理稅籍登記',
    note:'此結論只適用於本工具已納入的「無固定營業場所＋網路銷售＋已確認法定業別群＋未達起徵點」情境。'};
  let sc=0;
  if(a.q4==='low')sc-=2; else if(a.q4==='high')sc+=1;
  if(a.q7==='care')sc+=2; else if(a.q7==='ok')sc-=2;
  let lean = sc>0?'company':(sc===0?'both':'firm'), veto=false;
  if(a.q7==='care'&&lean!=='company'){veto=true;lean='both';}
  const fn = a.q6==='partner'?'合夥行號':'獨資行號';
  if(a.q3c==='company') return {label:'判斷結果',head:'已確認組織限制：可優先參考公司形式規劃',
    note:'依你目前提供的資訊，該業務有公司或特定公司組織限制，因此本工具先以公司形式作為主要參考方向；實際仍應依該產業主管法規及主管機關要求確認。'};
  if(a.q3c==='unsure') return {label:'判斷結果',head:'先確認組織型態限制，再決定行號或公司',
    note:'目前尚未確認產業法規是否限制組織型態；可先比較行號與公司的差異，待確認產業規定後再作最後決定。'};
  if(lean==='both') return {label:'判斷結果',head:fn+'與公司皆可考慮',
    note: veto?'你的其他條件偏向行號，但你明確表示在意責任風險，因此兩者請一併評估後再決定。'
               :'依你目前的回答，沒有足夠理由明確偏向其中一種形式，建議再依實際財務與營運需求比較後決定。'};
  return {label:'判斷結果',head:'建議：設立'+(lean==='company'?'公司':fn),
    note:'這是依你目前提供的所得結構、責任風險與其他條件整理的初步方向；實際選擇仍應綜合完整財務與產業法規判斷。'};
}

(async()=>{
  const paths=enumerate();
  const {browser,page,errs}=await open();
  const fails=[]; let pass=0; const typeCount={1:0,2:0,3:0};
  const CH=500;
  const t0=Date.now();
  for(let i=0;i<paths.length;i+=CH){
    const batch=paths.slice(i,i+CH);
    const got=await page.evaluate(batch=>batch.map(p=>{
      window.__tool.reset();
      for(const s of p.steps) window.__tool.answer(s[0],s[1]);
      const t=document.getElementById('track');
      const rh=t.querySelector('.rh'), lab=t.querySelector('.tag-lab'), note=t.querySelector('.rnote');
      const term=window.__tool.walk(window.__tool.answers).terminal;
      return {cursor:window.__tool.cursor, head:rh?rh.textContent:null, label:lab?lab.textContent:null,
              note:note?note.textContent:null, answers:JSON.stringify(window.__tool.answers),
              term: term&&term.t?term.t:null, sum:t.querySelector('.tag-sum')?t.querySelector('.tag-sum').textContent:null};
    }),batch.map(p=>({steps:p.steps})));
    for(let j=0;j<batch.length;j++){
      const p=batch[j], g=got[j], e=expectPage(p.steps,p.term);
      const expAns=JSON.stringify(Object.fromEntries(p.steps));
      const why=[];
      if(g.cursor!=='result') why.push('未到結果頁（cursor='+g.cursor+'）');
      if(g.term!==p.term.t) why.push('型別 期望'+p.term.t+' 實得'+g.term);
      if(g.head!==e.head) why.push('主標 期望「'+e.head+'」實得「'+g.head+'」');
      if(g.label!==e.label) why.push('標籤 期望「'+e.label+'」實得「'+g.label+'」');
      if(g.note!==e.note) why.push('註 期望「'+e.note+'」實得「'+g.note+'」');
      if(g.sum!=='專業判斷摘要') why.push('缺小標籤「專業判斷摘要」');
      if(g.answers!==expAns) why.push('作答狀態 期望'+expAns+' 實得'+g.answers);
      if(why.length){ if(fails.length<12) fails.push({steps:p.steps.map(s=>s.join('=')).join(','),why}); }
      else { pass++; typeCount[p.term.t]++; }
    }
  }
  await browser.close();
  console.log(JSON.stringify({total:paths.length,passed:pass,failed:paths.length-pass,
    byType:typeCount,seconds:((Date.now()-t0)/1000).toFixed1||((Date.now()-t0)/1000).toFixed(1),
    sampleFailures:fails,pageErrors:[...new Set(errs)]},null,1));
})();
