const fs=require('fs'), path=require('path');
const PW='/opt/node22/lib/node_modules/playwright';
const {chromium}=require(PW);
const PAGE='file://'+path.resolve(__dirname,'..','index.html');
/* 規格 md 之路徑：預設取本目錄的 spec.md，或以環境變數 SPEC 指定 */
const SPEC=process.env.SPEC||path.resolve(__dirname,'spec.md');

function specText(){return fs.readFileSync(SPEC,'utf8');}

/* 由規格第二節機械抽出題幹、說明、選項 */
function parseSec2(){
  const md=specText();
  const sec=md.split('## 二、題目全文')[1].split('\n## 三、')[0];
  const blocks=sec.split(/\n### /).slice(1);
  const out={};
  for(const b of blocks){
    const lines=b.split('\n');
    const id=lines[0].trim();
    const o={id,stem:null,notes:[],choices:[]};
    let mode=null;
    for(let i=1;i<lines.length;i++){
      const L=lines[i];
      if(/^題幹：/.test(L)){o.stem=L.replace(/^題幹：/,'').trim();mode=null;continue;}
      if(/^說明：\s*$/.test(L)){mode='notes';continue;}
      if(/^選項（值｜顯示文字）：\s*$/.test(L)){mode='choices';continue;}
      if(!L.trim())continue;
      if(mode==='notes'){
        if(/^- /.test(L)) o.notes.push([L.replace(/^- /,'')]);
        else if(/^\s+\S/.test(L) && o.notes.length) o.notes[o.notes.length-1].push(L.trim());
      }else if(mode==='choices'){
        if(/^- /.test(L)){
          const t=L.replace(/^- /,'');
          const k=t.split('｜');
          o.choices.push([k[0].trim(),k.slice(1).join('｜').trim()]);
        }
      }
    }
    out[id]=o;
  }
  return out;
}
async function open(){
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await ctx.newPage();
  const errs=[];
  page.on('pageerror',e=>errs.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await page.goto(PAGE);
  return {browser,page,errs};
}
module.exports={parseSec2,specText,open,PAGE,SPEC};
