/* 補充驗證：步驟徽章、進度條、側欄狀態與設計稿五個畫面一致（規格第四、五節） */
const {open}=require('./lib');
const CASES=[
 {name:'桌機 D1｜q1（尚未作答）',ans:{},cursor:'q1',
  badge:'第 1 步，最多 13 步',bar:'7.7',editing:false,
  marks:['1','2','3','4','5','6','7','8','9','10','11','12','13',''],
  cls:['s-cur','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut']},
 {name:'桌機 D2｜q2（修改已完成步驟）',ans:{q1:'no',q2:'yes',q3b:'no',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'solo',q7:'care'},cursor:'q2',
  badge:'第 2 步，共 9 步',bar:'22.2',editing:true,
  marks:['✓','－','2','－','－','－','✓','✓','✓','✓','✓','✓','✓',''],
  cls:['s-done','s-skip','s-cur','s-skip','s-skip','s-skip','s-done','s-done','s-done','s-done','s-done','s-done','s-done','s-fut']},
 {name:'桌機 D3｜q3b（未作答）',ans:{q1:'no',q2:'yes'},cursor:'q3b',
  badge:'第 3 步，共 9 步',bar:'33.3',editing:false,
  marks:['✓','－','✓','－','－','－','3','4','5','6','7','8','9',''],
  cls:['s-done','s-skip','s-done','s-skip','s-skip','s-skip','s-cur','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut']},
 {name:'桌機 D4｜q4（未作答）',ans:{q1:'no',q2:'yes',q3b:'no',q3c:'free'},cursor:'q4',
  badge:'第 5 步，共 9 步',bar:'55.6',editing:false,
  marks:['✓','－','✓','－','－','－','✓','✓','5','6','7','8','9',''],
  cls:['s-done','s-skip','s-done','s-skip','s-skip','s-skip','s-done','s-done','s-cur','s-fut','s-fut','s-fut','s-fut','s-fut']},
 {name:'桌機 D5｜結果頁',ans:{q1:'no',q2:'yes',q3b:'unsure',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'solo',q7:'care'},cursor:'result',
  badge:null,bar:'100.0',editing:false,
  marks:['✓','－','✓','－','－','－','✓','✓','✓','✓','✓','✓','✓','✓'],
  cls:['s-done','s-skip','s-done','s-skip','s-skip','s-skip','s-done','s-done','s-done','s-done','s-done','s-done','s-done','s-cur']},
 {name:'最長路徑 13 題｜q3（混合範圍、g100）',ans:{q1:'yes',q1a:'no',q2:'no',q2c:'online',q3a:'g100'},cursor:'q3',
  badge:'第 6 步，最多 13 步',bar:'46.2',editing:false,
  marks:['✓','✓','✓','✓','✓','6','7','8','9','10','11','12','13',''],
  cls:['s-done','s-done','s-done','s-done','s-done','s-cur','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut','s-fut']}
];
(async()=>{
  const {browser,page,errs}=await open();
  const out=[];
  for(const c of CASES){
    const g=await page.evaluate(c=>{
      window.__tool.set(c.ans); window.__tool.goto(c.cursor);
      const t=document.getElementById('track');
      const steps=[...document.querySelectorAll('#dsteps .step')];
      const mk=s=>{const m=s.querySelector('.mk');
        if(m.querySelector('svg')) return m.querySelector('path').getAttribute('d').indexOf('M6 12h12')===0?'－':'✓';
        return m.textContent;};
      return {badge:t.querySelector('.badge')?t.querySelector('.badge').textContent:null,
        bar:document.getElementById('mbar').getAttribute('aria-valuenow'),
        barW:document.getElementById('mbar').firstChild.style.width,
        mstep:document.getElementById('mstep').textContent,
        editing:!!t.querySelector('.editing'),
        marks:steps.map(mk), cls:steps.map(s=>s.className.replace('step ','').trim()),
        names:steps.map(s=>s.querySelector('.nm').textContent)};
    },c);
    const bad=[];
    if(g.badge!==c.badge) bad.push(`徽章 期望 ${JSON.stringify(c.badge)} 實得 ${JSON.stringify(g.badge)}`);
    if(g.bar!==c.bar) bad.push(`進度 期望 ${c.bar} 實得 ${g.bar}`);
    if(parseFloat(g.barW)!==parseFloat(c.bar)) bad.push(`進度條寬 ${g.barW}`);
    if(g.editing!==c.editing) bad.push(`「正在修改已完成步驟」 期望 ${c.editing} 實得 ${g.editing}`);
    if(JSON.stringify(g.marks)!==JSON.stringify(c.marks)) bad.push(`序號 期望 ${JSON.stringify(c.marks)} 實得 ${JSON.stringify(g.marks)}`);
    if(JSON.stringify(g.cls)!==JSON.stringify(c.cls)) bad.push(`狀態 期望 ${JSON.stringify(c.cls)} 實得 ${JSON.stringify(g.cls)}`);
    out.push({name:c.name,ok:bad.length===0,detail:bad,mstep:g.mstep});
  }
  await browser.close();
  console.log(JSON.stringify({cases:out,pageErrors:[...new Set(errs)]},null,1));
})();
