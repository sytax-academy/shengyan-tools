/* 驗證三：改答後不可達題目之答案已清除（規格第四節末段） */
const {open}=require('./lib');
const OPTS={q1:['yes','no','unsure'],q1a:['yes','no','unsure'],q2:['yes','no'],
  q2c:['online','other','unsure'],q3a:['g100','g50','mixed','unsure'],q3:['reached','below'],
  q3b:['no','yes','unsure'],q3c:['free','company','unsure'],q4:['low','high','unsure'],
  q5:['yes','no','unsure'],q5b:['yes','no','unsure'],q6:['solo','partner'],q7:['care','ok']};
const IDS=['q1','q1a','q2','q2c','q3a','q3','q3b','q3c','q4','q5','q5b','q6','q7'];
function nx(id,v){
  if(id==='q1')  return v==='unsure'?null:(v==='yes'?'q1a':'q2');
  if(id==='q1a') return v==='yes'?null:(v==='unsure'?null:'q2');
  if(id==='q2')  return v==='yes'?'q3b':'q2c';
  if(id==='q2c') return v==='online'?'q3a':'q3b';
  if(id==='q3a') return v==='unsure'?'q3b':'q3';
  if(id==='q3')  return v==='below'?null:'q3b';
  if(id==='q3b') return 'q3c';
  if(id==='q3c') return 'q4';
  if(id==='q4')  return 'q5';
  if(id==='q5')  return 'q5b';
  if(id==='q5b') return 'q6';
  if(id==='q6')  return 'q7';
  if(id==='q7')  return null;
}
/* 獨立計算：在目前作答下仍有可能到達之題目 */
function reach(a){
  const seen={};
  (function rec(node){
    if(!node||seen[node])return; seen[node]=true;
    const v=a[node], opts=(v!==undefined)?[v]:OPTS[node];
    for(const o of opts) rec(nx(node,o));
  })('q1');
  return seen;
}
function enumerate(){
  const out=[];
  (function rec(node,acc){
    if(node===null){out.push(Object.fromEntries(acc));return;}
    for(const v of OPTS[node]){acc.push([node,v]);rec(nx(node,v),acc);acc.pop();}
  })('q1',[]);
  return out;
}
const SCEN=[
  {name:'q3a 由 g100 改為 unsure → q3 之答案應清除',
   base:{q1:'no',q2:'no',q2c:'online',q3a:'g100',q3:'reached',q3b:'no',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'solo',q7:'care'},
   change:['q3a','unsure'], cleared:['q3'], kept:['q3b','q3c','q4','q5','q5b','q6','q7']},
  {name:'q1 由 yes 改為 no → q1a 之答案應清除',
   base:{q1:'yes',q1a:'no',q2:'yes',q3b:'no',q3c:'free',q4:'high',q5:'yes',q5b:'yes',q6:'partner',q7:'ok'},
   change:['q1','no'], cleared:['q1a'], kept:['q2','q3b','q3c','q4','q5','q5b','q6','q7']},
  {name:'q2 由 no 改為 yes → q2c、q3a、q3 之答案應清除',
   base:{q1:'no',q2:'no',q2c:'online',q3a:'g50',q3:'below'},
   change:['q2','yes'], cleared:['q2c','q3a','q3'], kept:[]},
  {name:'q2c 由 online 改為 other → q3a、q3 之答案應清除，組織題組保留',
   base:{q1:'no',q2:'no',q2c:'online',q3a:'mixed',q3:'reached',q3b:'yes',q3c:'unsure',q4:'unsure',q5:'unsure',q5b:'no',q6:'solo',q7:'ok'},
   change:['q2c','other'], cleared:['q3a','q3'], kept:['q3b','q3c','q4','q5','q5b','q6','q7']},
  {name:'q1a 由 no 改為 yes → 其後全部題目之答案應清除',
   base:{q1:'yes',q1a:'no',q2:'yes',q3b:'no',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'solo',q7:'ok'},
   change:['q1a','yes'], cleared:['q2','q3b','q3c','q4','q5','q5b','q6','q7'], kept:[]},
  {name:'（反向對照）q2 由 yes 改為 no → 組織題組仍可達，答案不得清除',
   base:{q1:'no',q2:'yes',q3b:'no',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'solo',q7:'care'},
   change:['q2','no'], cleared:[], kept:['q3b','q3c','q4','q5','q5b','q6','q7']},
  {name:'q3 由 below 改為 reached → 無題目不可達，答案不得清除',
   base:{q1:'no',q2:'no',q2c:'online',q3a:'g100',q3:'below'},
   change:['q3','reached'], cleared:[], kept:['q2c','q3a']}
];

(async()=>{
  const {browser,page,errs}=await open();
  const out={scenarios:[],exhaustive:null,pageErrors:null};

  /* (A) 以實際 DOM 操作（點側欄步驟 → 點選項）驗證 */
  for(const s of SCEN){
    await page.evaluate(b=>{window.__tool.set(b);window.__tool.goto('result');},s.base);
    /* 點側欄該步驟跳回修改 */
    await page.click(`#dsteps button[data-go="${s.change[0]}"]`);
    const onQ=await page.evaluate(()=>window.__tool.cursor);
    await page.click(`#track .choice[data-v="${s.change[1]}"]`);
    const after=await page.evaluate(()=>JSON.parse(JSON.stringify(window.__tool.answers)));
    const bad=[];
    if(onQ!==s.change[0]) bad.push('點側欄未跳至 '+s.change[0]+'（實得 '+onQ+'）');
    for(const c of s.cleared) if(after[c]!==undefined) bad.push(c+' 之答案未清除（仍為 '+after[c]+'）');
    for(const k of s.kept) if(after[k]===undefined) bad.push(k+' 之答案被誤清');
    if(after[s.change[0]]!==s.change[1]) bad.push('改答未生效');
    out.scenarios.push({name:s.name,ok:bad.length===0,detail:bad,answersAfter:after});
  }

  /* (B) 窮盡：全部完整路徑 × 每題 × 每個其他選項，改答後保留之答案須恰為可達者 */
  const paths=enumerate();
  const cases=[];
  for(const p of paths) for(const id of Object.keys(p)) for(const v of OPTS[id])
    if(v!==p[id]) cases.push([p,id,v]);
  let ok=0; const fails=[];
  const CH=4000;
  for(let i=0;i<cases.length;i+=CH){
    const batch=cases.slice(i,i+CH);
    const got=await page.evaluate(batch=>batch.map(c=>{
      const a=Object.assign({},c[0]); a[c[1]]=c[2];
      window.__tool.set(a); window.__tool.prune(window.__tool.answers);
      return JSON.stringify(window.__tool.answers);
    }),batch.map(c=>[c[0],c[1],c[2]]));
    for(let j=0;j<batch.length;j++){
      const [p,id,v]=batch[j];
      const a=Object.assign({},p); a[id]=v;
      const R=reach(a), exp={};
      for(const k of IDS) if(a[k]!==undefined&&R[k]) exp[k]=a[k];
      if(got[j]===JSON.stringify(exp)) ok++;
      else if(fails.length<10) fails.push({base:p,change:id+'='+v,expected:exp,got:JSON.parse(got[j])});
    }
  }
  out.exhaustive={cases:cases.length,passed:ok,failed:cases.length-ok,sampleFailures:fails};
  await browser.close();
  out.pageErrors=[...new Set(errs)];
  console.log(JSON.stringify(out,null,1));
})();
