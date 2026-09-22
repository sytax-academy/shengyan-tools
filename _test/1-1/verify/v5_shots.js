/* 驗證五：390 寬與 1280 寬各截 q1、q4、結果頁，共六張；另檢查字型無法載入時版面不崩壞 */
const path=require('path');
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const PAGE='file://'+path.resolve(__dirname,'..','index.html');
const OUT=path.resolve(__dirname,'..');

const STATES={
  q1:{ans:{},cursor:'q1'},
  q4:{ans:{q1:'no',q2:'yes',q3b:'no',q3c:'free'},cursor:'q4'},
  /* 結果頁（兩者皆可）：與設計稿同一組作答 */
  result:{ans:{q1:'no',q2:'yes',q3b:'unsure',q3c:'free',q4:'low',q5:'no',q5b:'no',q6:'solo',q7:'care'},cursor:'result'}
};

(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const report={shots:[],fontFallback:[],webfontRequests:[]};

  for(const w of [390,1280]){
    const ctx=await browser.newContext({viewport:{width:w,height:w===390?844:900},deviceScaleFactor:1});
    const page=await ctx.newPage();
    const reqs=[];
    page.on('requestfinished',r=>{if(/fonts\.(googleapis|gstatic)\.com/.test(r.url()))reqs.push('ok '+r.url().slice(0,60));});
    page.on('requestfailed',r=>{if(/fonts\.(googleapis|gstatic)\.com/.test(r.url()))reqs.push('failed '+r.url().slice(0,60));});
    await page.goto(PAGE,{waitUntil:'load'});
    for(const [name,st] of Object.entries(STATES)){
      await page.evaluate(s=>{window.__tool.set(s.ans);window.__tool.goto(s.cursor);},st);
      await page.waitForTimeout(120);
      const file=`shot-${w}-${name}.png`;
      await page.screenshot({path:path.join(OUT,file),fullPage:true});
      const m=await page.evaluate(()=>({
        docScrollW:document.documentElement.scrollWidth, winW:window.innerWidth,
        overflowing:[...document.querySelectorAll('.screen *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1).length,
        serifFont:getComputedStyle(document.querySelector('.qh,.rh')).fontFamily.split(',')[0],
        heading:(document.querySelector('.qh,.rh')||{}).textContent
      }));
      report.shots.push({file,width:w,state:name,...m,noHorizontalScroll:m.docScrollW<=m.winW+1});
    }
    report.webfontRequests.push({width:w,requests:[...new Set(reqs)]});
    await ctx.close();
  }

  /* 字型層備援：阻擋網路字型，並另外模擬系統未安裝 Noto TC（強制退到 serif／sans-serif） */
  for(const w of [390,1280]){
    for(const mode of ['blockWebfont','blockWebfont+noNotoTC']){
      const ctx=await browser.newContext({viewport:{width:w,height:w===390?844:900}});
      const page=await ctx.newPage();
      await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
      await page.goto(PAGE,{waitUntil:'load'});
      if(mode.indexOf('noNotoTC')>=0)
        await page.addStyleTag({content:':root{--serif:serif!important;--sans:sans-serif!important}'});
      for(const [name,st] of Object.entries(STATES)){
        await page.evaluate(s=>{window.__tool.set(s.ans);window.__tool.goto(s.cursor);},st);
        await page.waitForTimeout(60);
        const m=await page.evaluate(()=>({
          docScrollW:document.documentElement.scrollWidth, winW:window.innerWidth,
          overflowing:[...document.querySelectorAll('.screen *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1)
            .map(e=>e.className+' right='+Math.round(e.getBoundingClientRect().right)),
          font:getComputedStyle(document.querySelector('.qh,.rh')).fontFamily,
          headingVisible:(()=>{const h=document.querySelector('.qh,.rh');const r=h.getBoundingClientRect();return r.width>50&&r.height>10;})(),
          choicesInside:[...document.querySelectorAll('.choice')].every(c=>c.getBoundingClientRect().right<=window.innerWidth+1)
        }));
        report.fontFallback.push({width:w,mode,state:name,ok:m.docScrollW<=m.winW+1&&m.overflowing.length===0&&m.headingVisible&&m.choicesInside,...m});
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(report,null,1));
})();
