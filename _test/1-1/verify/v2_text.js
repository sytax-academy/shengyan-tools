/* 驗證二：逐題核對題幹、說明、選項文字與規格逐字相同 */
const {parseSec2,specText,open}=require('./lib');

const REACH={
  q1:{}, q1a:{q1:'yes'}, q2:{q1:'no'}, q2c:{q1:'no',q2:'no'},
  q3a:{q1:'no',q2:'no',q2c:'online'}, q3:{q1:'no',q2:'no',q2c:'online',q3a:'g100'},
  q3b:{q1:'no',q2:'yes'}, q3c:{q1:'no',q2:'yes'}, q4:{q1:'no',q2:'yes'},
  q5:{q1:'no',q2:'yes'}, q5b:{q1:'no',q2:'yes'}, q6:{q1:'no',q2:'yes'}, q7:{q1:'no',q2:'yes'}
};
/* 動態狀態（規格第三節）：混合範圍、q3 依 q3a、q7 依 q6 */
const DYN=[
  ['q2 混合範圍','q2',{q1:'yes',q1a:'no'}],
  ['q2c 混合範圍','q2c',{q1:'yes',q1a:'no',q2:'no'}],
  ['q3a 混合範圍','q3a',{q1:'yes',q1a:'no',q2:'no',q2c:'online'}],
  ['q3 g100','q3',{q1:'no',q2:'no',q2c:'online',q3a:'g100'}],
  ['q3 g50','q3',{q1:'no',q2:'no',q2c:'online',q3a:'g50'}],
  ['q3 mixed','q3',{q1:'no',q2:'no',q2c:'online',q3a:'mixed'}],
  ['q3 g100 混合範圍','q3',{q1:'yes',q1a:'no',q2:'no',q2c:'online',q3a:'g100'}],
  ['q3 g50 混合範圍','q3',{q1:'yes',q1a:'no',q2:'no',q2c:'online',q3a:'g50'}],
  ['q3 mixed 混合範圍','q3',{q1:'yes',q1a:'no',q2:'no',q2c:'online',q3a:'mixed'}],
  ['q7 q6=solo','q7',{q1:'no',q2:'yes',q6:'solo'}],
  ['q7 q6=partner','q7',{q1:'no',q2:'yes',q6:'partner'}]
];

(async()=>{
  const spec=parseSec2(), md=specText();
  const {browser,page,errs}=await open();
  const diffs=[], notes2=[]; let checked=0;

  async function snap(id,ans){
    return await page.evaluate(({id,ans})=>{
      window.__tool.set(ans); window.__tool.goto(id);
      const t=document.getElementById('track');
      const paras=[...t.querySelectorAll('.explain .core, .explain .pts li p')].map(p=>p.textContent);
      const lis=[...t.querySelectorAll('.explain .pts li')].length;
      const ch=[...t.querySelectorAll('.choice')].map(b=>({
        v:b.getAttribute('data-v'),
        t:(b.querySelector('.main').textContent)+(b.querySelector('.meta')?b.querySelector('.meta').textContent:'')
      }));
      return {stem:t.querySelector('.qh').textContent, paras, lis, ch,
              folded:[...t.querySelectorAll('.explain details .pts li p')].map(p=>p.textContent)};
    },{id,ans});
  }
  const strip=s=>s.replace(/【/g,'').replace(/】/g,'');
  const flat=notes=>{const o=[];for(const n of notes)for(const p of n)o.push(strip(p));return o;};

  /* (A) 第二節基礎文字 */
  for(const id of Object.keys(REACH)){
    const s=spec[id]; if(!s){diffs.push(`[${id}] 規格第二節未取得該題`);continue;}
    const r=await snap(id,REACH[id]);
    checked++;
    if(r.stem!==s.stem) diffs.push(`[${id}] 題幹：規格「${s.stem}」／畫面「${r.stem}」`);
    /* q3 於規格第二節只有題幹，說明與選項由第三節依 q3a 生成，於 (B) 段核對 */
    if(id==='q3'){ notes2.push('q3：第二節僅有題幹，說明與選項依第三節生成（於 B 段核對）'); continue; }
    /* 說明：第一則若以「判斷的核心是：」起首，規格第三節末段要求去除該前綴 */
    const exp=flat(s.notes);
    if(exp.length) exp[0]=exp[0].replace(/^判斷的核心是：/,'');
    if(JSON.stringify(exp)!==JSON.stringify(r.paras)){
      diffs.push(`[${id}] 說明段落不符：\n  規格=${JSON.stringify(exp)}\n  畫面=${JSON.stringify(r.paras)}`);
    }
    if(s.notes.length && r.lis!==s.notes.length-1)
      diffs.push(`[${id}] 說明條目數：規格 ${s.notes.length-1}（核心以外）／畫面 ${r.lis}`);
    const expCh=s.choices.map(c=>({v:c[0],t:c[1]}));
    if(JSON.stringify(expCh)!==JSON.stringify(r.ch))
      diffs.push(`[${id}] 選項不符：\n  規格=${JSON.stringify(expCh)}\n  畫面=${JSON.stringify(r.ch)}`);
  }

  /* (B) 第三節動態文字：畫面每一句須逐字見於規格原文 */
  let dynLines=0;
  for(const [name,id,ans] of DYN){
    const r=await snap(id,ans); checked++;
    const lines=[r.stem].concat(r.paras);
    for(const L of lines){
      dynLines++;
      if(md.indexOf(L)<0 && md.indexOf(L.replace(/。$/,''))<0){
        /* 規格以【】標強調，比對時兩式皆試 */
        const withEm=[...md.matchAll(/【([^】]*)】/g)];
        if(strip(md).indexOf(L)<0) diffs.push(`[${name}] 畫面出現規格中找不到的文字：「${L}」`);
      }
    }
    for(const c of r.ch){
      dynLines++;
      if(strip(md).indexOf(c.t)<0) diffs.push(`[${name}] 選項文字規格中找不到：「${c.t}」`);
    }
  }

  await browser.close();
  console.log(JSON.stringify({checkedStates:checked,dynLinesChecked:dynLines,diffs,notes:notes2,pageErrors:errs},null,1));
})();
