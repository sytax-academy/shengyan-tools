const fs=require('fs');
const ids=['1-1','2-1','2-2','3-2','4-1','4-3','3-2v156'];
const files={'1-1':'1-1/index.html','2-1':'2-1/index.html','2-2':'2-2/index.html','3-2':'3-2/index.html','4-1':'4-1/index.html','4-3':'4-3/index.html','3-2v156':'audit_harness/inputs/3-2_v1.5.6_manifest_named.html'};
const res={};
for(const id of ids){
 const html=fs.readFileSync(files[id],'utf8');
 let js='';for(const n of [1,2,3]){try{js+=fs.readFileSync(`audit_harness/results/extracted/${id}_script${n}.js`,'utf8')}catch(e){}}
 let appJs=js; if(id==='4-3'){try{appJs=fs.readFileSync('audit_harness/results/extracted/4-3_script2.js','utf8')}catch(e){}}
 const css=fs.readFileSync(`audit_harness/results/extracted/${id}_all.css`,'utf8');
 const count=(s,re)=>(s.match(re)||[]).length;
 const idAttr=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 const dupIds=Object.entries(idAttr.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{})).filter(([,c])=>c>1);
 const inline=[...html.matchAll(/\son(click|change|input|submit|keydown|keyup|focus|blur)\s*=/gi)].map(m=>m[1]);
 res[id]={
  bytes:html.length, htmlLang:/<html[^>]*\blang=/i.test(html), doctype:/^\s*<!DOCTYPE html>/i.test(html),
  viewport:(html.match(/<meta[^>]*name=["']?viewport["']?[^>]*>/i)||[''])[0],
  metaDescription:/<meta[^>]*name=["']?description/i.test(html),
  duplicateIds:dupIds, inlineHandlers:inline.length,
  innerHTML_assign:count(appJs,/\.innerHTML\s*=/g), insertAdjacentHTML:count(appJs,/insertAdjacentHTML/g),
  outerHTML:count(appJs,/\.outerHTML\s*=/g), documentWrite:count(appJs,/document\.write/g),
  eval:count(appJs,/\beval\s*\(/g), newFunction:count(appJs,/new\s+Function\s*\(/g),
  textContent:count(appJs,/\.textContent\s*=/g), createElement:count(appJs,/createElement\(/g),
  addEventListener:count(appJs,/addEventListener\(/g), removeEventListener:count(appJs,/removeEventListener\(/g),
  localStorage:count(js,/localStorage/g), sessionStorage:count(js,/sessionStorage/g), indexedDB:count(js,/indexedDB/g),
  tryCatch:count(appJs,/\btry\s*\{/g), jsonParse:count(appJs,/JSON\.parse\(/g), jsonStringify:count(appJs,/JSON\.stringify\(/g),
  parseFloat:count(appJs,/parseFloat\(/g), parseInt:count(appJs,/parseInt\(/g), numberCast:count(appJs,/Number\(/g),
  toFixed:count(appJs,/toFixed\(/g), mathRound:count(appJs,/Math\.round\(/g),
  historyApi:count(appJs,/history\.(pushState|replaceState|back)/g), hashchange:count(appJs,/hashchange/g), popstate:count(appJs,/popstate/g),
  console:count(appJs,/console\.(log|warn|error|debug|info)\(/g), debugger:count(appJs,/\bdebugger\b/g),
  todoFixme:count(js,/\b(TODO|FIXME|XXX|HACK)\b/g), alertConfirmPrompt:count(appJs,/\b(alert|confirm|prompt)\s*\(/g),
  fetchXhr:count(appJs,/\b(fetch\(|XMLHttpRequest)/g), createObjectURL:count(appJs,/createObjectURL/g),
  revokeObjectURL:count(appJs,/revokeObjectURL/g), fileReader:count(appJs,/FileReader/g),
  downloadAnchor:count(appJs,/\.download\s*=/g), print:count(appJs,/window\.print/g),
  buttonTags:count(html,/<button\b/gi), divRoleButton:count(html,/role="button"/gi),
  inputs:count(html,/<input\b/gi), labels:count(html,/<label\b/gi),
  ariaLabel:count(html,/aria-label(?:ledby)?=/gi), ariaLive:count(html,/aria-live=/gi),
  ariaExpanded:count(html,/aria-expanded=/gi), ariaHidden:count(html,/aria-hidden=/gi),
  roleAttr:count(html,/\srole=/gi), tabindex:count(html,/tabindex=/gi), tabindexPositive:count(html,/tabindex="[1-9]/gi),
  imgTags:count(html,/<img\b/gi), imgAlt:count(html,/<img[^>]*\salt=/gi), svgTags:count(html,/<svg\b/gi),
  h1:count(html,/<h1\b/gi),h2:count(html,/<h2\b/gi),h3:count(html,/<h3\b/gi),h4:count(html,/<h4\b/gi),
  mainTag:count(html,/<main\b/gi),navTag:count(html,/<nav\b/gi), formTag:count(html,/<form\b/gi),
  tableTag:count(html,/<table\b/gi),thTag:count(html,/<th\b/gi),scopeAttr:count(html,/\bscope=/gi), dialogTag:count(html,/<dialog\b/gi),
  cssBytes:css.length,
  mediaQueries:[...new Set([...css.matchAll(/@media[^{]+\{/g)].map(m=>m[0].replace(/\s+/g,' ').trim()))],
  importantCount:count(css,/!important/g), focusVisible:count(css,/:focus-visible/g), focusPlain:count(css,/:focus\b/g),
  outlineNone:count(css,/outline:\s*(none|0)/g), prefersReducedMotion:count(css,/prefers-reduced-motion/g),
  prefersColorScheme:count(css,/prefers-color-scheme/g), printMedia:count(css,/@media\s+print/g),
  cssVars:count(css,/--[a-z-]+\s*:/g), positionFixed:count(css,/position:\s*fixed/g), overflowXAuto:count(css,/overflow-x:\s*auto/g),
  minWidthPx:[...new Set([...css.matchAll(/min-width:\s*(\d{3,})px/g)].map(m=>+m[1]))].sort((a,b)=>b-a).slice(0,8),
 };
}
fs.writeFileSync('audit_harness/results/static_report.json',JSON.stringify(res,null,2));
console.log('written');
