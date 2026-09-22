/* 驗證四：鍵盤可完整操作、切題時焦點落在題幹、可收合區塊 aria-expanded 同步 */
const path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const PAGE='file://'+path.resolve(__dirname,'..','index.html');

function desc(){ /* 在頁面內執行 */ }
const DESC=`(()=>{const e=document.activeElement;if(!e)return null;
 const id=e.id?'#'+e.id:'';
 const cls=e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):'';
 const t=(e.getAttribute&&e.getAttribute('data-v'))||(e.getAttribute&&e.getAttribute('data-go'))||'';
 return e.tagName.toLowerCase()+id+cls+(t?'['+t+']':'')+'｜'+(e.textContent||'').trim().slice(0,18);})()`;
const FOCUSABLES=`[...document.querySelectorAll('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')]
 .filter(e=>e.offsetParent!==null||e===document.activeElement)
 .filter(e=>{let p=e.parentElement;while(p){if(p.tagName==='DETAILS'&&!p.open&&e.tagName!=='SUMMARY')return false;p=p.parentElement;}return true;})
 .map(e=>e.tagName.toLowerCase()+(e.getAttribute('data-v')||e.getAttribute('data-go')||'')+'｜'+(e.textContent||'').trim().slice(0,18))`;

(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const out={desktop:{},mobile:{},evidence:{}};

  for(const [mode,vp] of [['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]){
    const ctx=await browser.newContext({viewport:vp});
    const page=await ctx.newPage();
    await page.goto(PAGE);
    const R={};

    /* 1. 初次繪製後焦點須在題幹 */
    R.focusOnLoad=await page.evaluate(`document.activeElement===document.querySelector('.qh')`);
    R.focusOnLoadDesc=await page.evaluate(DESC);

    /* 2. Tab 走訪整個文件，比對可聚焦元素清單（q1 頁） */
    await page.evaluate(`document.body.setAttribute('tabindex','-1');document.body.focus()`);
    const expected=await page.evaluate(FOCUSABLES);
    const visited=[];
    for(let i=0;i<expected.length+4;i++){
      await page.keyboard.press('Tab');
      const d=await page.evaluate(`(()=>{const e=document.activeElement;if(!e||e===document.body)return 'BODY';
        return e.tagName.toLowerCase()+(e.getAttribute('data-v')||e.getAttribute('data-go')||'')+'｜'+(e.textContent||'').trim().slice(0,18);})()`);
      if(d==='BODY') break;
      if(visited.indexOf(d)>=0 && visited[0]===d) break;
      visited.push(d);
    }
    R.tabExpectedCount=expected.length;
    R.tabVisitedCount=visited.length;
    R.tabUnreached=expected.filter(e=>visited.indexOf(e)<0);
    R.tabOrderMatches=JSON.stringify(expected)===JSON.stringify(visited.slice(0,expected.length));
    R.noPositiveTabindex=await page.evaluate(`[...document.querySelectorAll('[tabindex]')].every(e=>parseInt(e.getAttribute('tabindex'),10)<=0)`);
    R.allSvgAriaHidden=await page.evaluate(`[...document.querySelectorAll('svg')].every(s=>s.getAttribute('aria-hidden')==='true')`);
    if(mode==='desktop') out.evidence.tabOrderDesktop=visited;
    else out.evidence.tabOrderMobile=visited;

    /* 3. 全程只用鍵盤走完一條路徑（q1=no → q2=yes → 組織題組七題） */
    await page.evaluate(`window.__tool.reset()`);
    const plan=[['q1','no'],['q2','yes'],['q3b','unsure'],['q3c','free'],['q4','low'],['q5','no'],['q5b','no'],['q6','solo'],['q7','care']];
    const trail=[];
    for(const [q,v] of plan){
      const okQ=await page.evaluate(`window.__tool.cursor`)===q;
      /* 以 Tab 由題幹前進到該選項，再按 Enter */
      let hit=false;
      for(let i=0;i<40 && !hit;i++){
        await page.keyboard.press('Tab');
        hit=await page.evaluate(`document.activeElement.getAttribute&&document.activeElement.getAttribute('data-v')===${JSON.stringify(v)}`);
      }
      if(!hit){ trail.push({q,error:'鍵盤無法到達選項 '+v}); break; }
      await page.keyboard.press('Enter');
      const st=await page.evaluate(`({cursor:window.__tool.cursor,
        focus:document.activeElement===document.querySelector('.qh')?'qh':(document.activeElement===document.querySelector('.rh')?'rh':${DESC})})`);
      trail.push({answered:q+'='+v,cursorWas:okQ,now:st.cursor,focusAfter:st.focus});
    }
    R.keyboardRun=trail;
    R.keyboardReachedResult=await page.evaluate(`window.__tool.cursor==='result'`);
    R.focusOnResult=await page.evaluate(`document.activeElement===document.querySelector('.rh')`);

    /* 4. 鍵盤按「上一題」→ 焦點回到題幹 */
    await page.evaluate(`window.__tool.goto('q4')`);
    let found=false;
    for(let i=0;i<60 && !found;i++){
      await page.keyboard.press('Tab');
      found=await page.evaluate(`document.activeElement.getAttribute&&document.activeElement.getAttribute('data-act')==='back'`);
    }
    await page.keyboard.press('Enter');
    R.backByKeyboard=await page.evaluate(`({cursor:window.__tool.cursor,focusIsQh:document.activeElement===document.querySelector('.qh'),stem:document.querySelector('.qh').textContent.slice(0,14)})`);

    /* 5. 以鍵盤點側欄已答步驟 → 焦點回到題幹 */
    await page.evaluate(`window.__tool.goto('result')`);
    R.sidebarByKeyboard=null;
    if(mode==='desktop'){
      await page.evaluate(`document.body.focus()`);
      let f=false;
      for(let i=0;i<20 && !f;i++){
        await page.keyboard.press('Tab');
        f=await page.evaluate(`document.activeElement.getAttribute&&document.activeElement.getAttribute('data-go')==='q1'`);
      }
      await page.keyboard.press('Enter');
      R.sidebarByKeyboard=await page.evaluate(`({reachedByTab:${f},cursor:window.__tool.cursor,focusIsQh:document.activeElement===document.querySelector('.qh')})`);
    }

    /* 6. aria-expanded 同步 */
    await page.evaluate(`window.__tool.reset()`);
    const before=await page.evaluate(`[...document.querySelectorAll('details')].map(d=>({
      cls:d.className,open:d.open,aria:d.querySelector('summary').getAttribute('aria-expanded')}))`);
    /* 逐一以鍵盤開合，每次比對 */
    const sync=[];
    const n=await page.evaluate(`document.querySelectorAll('details').length`);
    for(let i=0;i<n;i++){
      for(const act of ['open','close']){
        await page.evaluate(`(()=>{const d=document.querySelectorAll('details')[${i}];d.querySelector('summary').focus();})()`);
        await page.keyboard.press('Enter');
        const s=await page.evaluate(`(()=>{const d=document.querySelectorAll('details')[${i}];
          return {cls:d.className,open:d.open,aria:d.querySelector('summary').getAttribute('aria-expanded')};})()`);
        sync.push({i,act,...s,ok:String(s.open)===s.aria});
      }
    }
    R.detailsInitial=before;
    R.detailsToggleSync=sync;
    R.detailsSyncAllOk=sync.every(s=>s.ok)&&before.every(b=>String(b.open)===b.aria);
    /* 手機流程摘要預設收合 */
    R.mflowDefaultClosed=await page.evaluate(`(()=>{window.__tool.reset();const d=document.getElementById('mflow');
      return {open:d.open,aria:document.getElementById('mflowsum').getAttribute('aria-expanded')};})()`);
    R.refGroupsDefault=await page.evaluate(`[...document.querySelectorAll('.rgrp')].map(d=>d.open)`);
    /* aria-pressed / aria-current */
    R.ariaPressed=await page.evaluate(`(()=>{window.__tool.set({q1:'no'});window.__tool.goto('q1');
      return [...document.querySelectorAll('.choice')].map(c=>c.getAttribute('data-v')+'='+c.getAttribute('aria-pressed'));})()`);
    R.ariaCurrent=await page.evaluate(`(()=>{window.__tool.set({q1:'no',q2:'yes'});window.__tool.goto('q3b');
      const box=document.getElementById(window.matchMedia('(min-width:1024px)').matches?'dsteps':'msteps');
      const c=box.querySelectorAll('[aria-current="step"]');
      const all=document.querySelectorAll('[aria-current="step"]');
      return {inActiveList:c.length,inWholeDom:all.length,texts:[...c].map(e=>e.textContent.trim())};})()`);
    out[mode]=R;
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out,null,1));
})();
