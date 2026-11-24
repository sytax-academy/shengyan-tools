#!/usr/bin/env python3
"""patch_v150.py：自 business-items v1.4.0 產生 v1.5.0（契約 c26；規格 v1_33 第四十八節）。
用法：python3 -I patch_v150.py 〈v1.4.0 index.html〉 〈輸出 index.html〉 〈p3_data.json〉 〈規格 v1_33.md〉
字樣一律由程式自規格附錄 A 抽出（格式「- 鍵：「字樣」」），不手抄；底稿與規格之 SHA-256 不符即中止。"""
import sys, json, hashlib, re, html

src, dst, p3p, specp = sys.argv[1:5]
def sha_b(b): return hashlib.sha256(b).hexdigest()
raw = open(src, "rb").read()
if sha_b(raw) != "bd090fede386cd5edf593c4543c893277073256573c716bb8f98e8db56d72c50": sys.exit("中止：底稿非 v1.4.0")
spec_b = open(specp, "rb").read()
if sha_b(spec_b) != "ba557422935ae139026b53bd6bb8005d44ff83fcd1207c6ae511a4a0ba7df2ce": sys.exit("中止：規格非 v1_33")
s = raw.decode("utf-8")
spec = spec_b.decode("utf-8")

# 附錄 A 抽出
a0 = spec.index("## 附錄 A　逐字字樣"); a1 = spec.index("## 附錄 B　")
A = {}
for ln in spec[a0:a1].split("\n"):
    m = re.match(r"^- ([A-Za-z0-9_]+)：「(.*)」$", ln)
    if m:
        assert m.group(1) not in A, m.group(1)
        A[m.group(1)] = m.group(2)
NEED = ["p2_lead", "p2_name_label", "p2_name_placeholder", "p2_note_not_items", "version_line", "tool_version",
        "p3_v8_heading", "p3_v8_heading_plain", "p3_v8_byname", "p3_v8_count", "p3_v8_zero", "p3_v8_partial", "p3_v8_upper",
        "p3_v8_count_note", "p3_v8_src", "p3_v8_none", "p3_v8_none_tail", "p3_v8_zz", "p3_v8_notfound", "p3_to_tax", "p3_attribution"]
for k in NEED: assert k in A, k
assert A["tool_version"] == "business-items v1.5.0" and A["version_line"].startswith("版本 v1.5.0｜")
S3 = {k: A[k] for k in NEED if k.startswith("p3_")}
P3 = open(p3p, encoding="utf-8").read()
json.loads(P3)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:70])
    s = s.replace(old, new)
J = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
E_ = html.escape

# 內嵌資料與字樣
rep('<script type="application/json" id="p2-data">',
    '<script type="application/json" id="p3-data">' + P3.replace("</", "<\\/") + '</script>\n'
    '<script type="application/json" id="p3-str">' + J(S3) + '</script>\n'
    '<script type="application/json" id="p2-data">')

# 第二期字樣（改字）
rep("不知道代號？輸入行業名稱找找看", E_(A["p2_name_label"], quote=False))
rep('placeholder="例：咖啡"', 'placeholder="' + E_(A["p2_name_placeholder"]) + '"')
rep("這裡是稅籍行業代號，不是上方的營業項目代碼，兩者沒有現行的官方對照。", E_(A["p2_note_not_items"], quote=False))
rep('<p class="p2-lead">輸入稅籍行業代號，或用行業名稱找代號，看看登記同一行業的公司與行號，通常還一併登記哪些稅籍行業。</p>',
    '<p class="p2-lead">' + E_(A["p2_lead"], quote=False) + '</p>')

# names 函式（第四十八節第四項）
i0 = s.index("function names(){"); i1 = s.index('nameEl.addEventListener("input",names);')
NEW_NAMES = r'''var P3=JSON.parse(document.getElementById("p3-data").textContent),S3=JSON.parse(document.getElementById("p3-str").textContent),V8=null,V8N={},V8K={};
function initV8(){if(V8)return;V8=JSON.parse(document.getElementById("data-codes").textContent);V8.forEach(function(r){V8N[r[0]]=r[1];V8K[r[0]]=r[1].normalize("NFKC").replace(/\s+/g,"").replace(/業$/,"").toUpperCase();});}
/* 家數：公司組與行號組該代號之 n 相加；兩組皆無者為 -1 */
function cnt(k){var t=0,f=false;["company","firm"].forEach(function(g){var r=D.g[g][k];if(r){t+=r[0];f=true;}});return f?t:-1;}
function chip(k,nm,extra,sp){var b=el("button","p2-chip");b.type="button";b.setAttribute("data-code",k);b.appendChild(el("b",null,k));b.appendChild(document.createTextNode((sp?" ":"")+nm));if(extra){b.appendChild(el("span","p3-meta",extra));b.setAttribute("aria-label",k+" "+nm+"，"+extra);}b.addEventListener("click",function(){addCode(k);});return b;}
function deadchip(k,nm){var b=el("span","p2-chip p3-dead");b.setAttribute("data-code",k);b.appendChild(el("b",null,k));b.appendChild(document.createTextNode(" "+nm));b.appendChild(el("span","p3-meta",S3.p3_v8_zero));return b;}
function v8box(code,words,byName){
  var box=el("div","p2-namelist p3-v8");box.setAttribute("data-v8",code);
  var r=P3.m[code],has=!!(r&&(r.c.length+r.p.length))&&code!=="ZZ99999";
  box.appendChild(el("h3",null,(has?S3.p3_v8_heading:S3.p3_v8_heading_plain).replace("〔代碼〕",code).replace("〔名稱〕",V8N[code])));
  if(byName)box.appendChild(el("p","p3-byname",S3.p3_v8_byname));
  if(code==="ZZ99999"){box.appendChild(el("p","p2-none p3-zz",S3.p3_v8_zz));return box;}
  if(!has){var p=el("p","p2-none p3-none",S3.p3_v8_none);p.appendChild(taxLink());p.appendChild(document.createTextNode(S3.p3_v8_none_tail));box.appendChild(p);return box;}
  if(r.u)box.appendChild(el("p","p3-upper",S3.p3_v8_upper.replace("〔層級〕",r.u[0]).replace("〔代碼〕",r.u[1]).replace("〔名稱〕",r.u[2])));
  /* 拘46 排序鍵：（一）排序詞命中數（二）名稱片段命中數（三）家數（四）代號字串 */
  var base=V8N[code].normalize("NFKC").replace(/業$/,""),bg=[];for(var i=0;i+1<base.length;i++){var t=base.substr(i,2);if(!/[、,()\s]/.test(t)&&bg.indexOf(t)<0)bg.push(t);}
  function nk(k){return (P3.t9[k]||"").normalize("NFKC");}
  function hit(k){var nm=nk(k),h=0;words.forEach(function(w){if(nm.indexOf(w)>=0)h++;});return h;}
  function sim(k){var nm=nk(k),h=0;bg.forEach(function(t){if(nm.indexOf(t)>=0)h++;});return h;}
  function srt(a,b){return (hit(b)-hit(a))||(sim(b)-sim(a))||(cnt(b)-cnt(a))||(a<b?-1:1);}
  function put(list,parent){list.slice().sort(srt).forEach(function(k){var n=cnt(k);parent.appendChild(n>=0?chip(k,P3.t9[k],S3.p3_v8_count.replace("〔N〕",fmt(n)),true):deadchip(k,P3.t9[k]));});}
  put(r.c,box);
  if(r.p.length){var d=el("details","p3-part"),sm=el("summary",null,S3.p3_v8_partial.replace("〔N〕",String(r.p.length)));d.appendChild(sm);var w=el("div","p3-partlist");put(r.p,w);d.appendChild(w);box.appendChild(d);}
  box.appendChild(el("p","p3-src p3-count-note",S3.p3_v8_count_note));
  box.appendChild(el("p","p3-src p3-v8src",S3.p3_v8_src));return box;
}
function isB(ch){return !ch||!/[A-Za-z0-9]/.test(ch);}
var CODE_RE=/[A-Za-z][A-Za-z0-9][0-9]{5}/g;
function names(){
  while(listEl.firstChild)listEl.removeChild(listEl.firstChild);
  initV8();
  if(nameEl.value.replace(/\s/g,"").length<2)return;
  var q=nameEl.value.normalize("NFKC");
  /* 營業項目代碼辨識（第四節第 2 款）：前後字元皆非英文字母或數字；依出現順序、去重；代碼處以空白取代（依位置，不依字串） */
  var cs=[],m,rest="",last=0;CODE_RE.lastIndex=0;
  while((m=CODE_RE.exec(q))){if(!isB(q.charAt(m.index-1))||!isB(q.charAt(m.index+7)))continue;var c=m[0].toUpperCase();if(cs.indexOf(c)<0)cs.push(c);rest+=q.slice(last,m.index)+" ";last=m.index+7;}
  rest=(rest+q.slice(last)).trim();
  var words=rest?rest.split(/[\s,，、]+/).map(function(w){return w.replace(/業$/,"");}).filter(function(w,i,a){return w.length>0&&a.indexOf(w)===i;}):[];
  var shown=0,valid=0,bad=[];
  cs.forEach(function(c){if(V8N[c]){listEl.appendChild(v8box(c,words,false));shown++;valid++;}else{bad.push(c);listEl.appendChild(el("p","p2-none p3-notfound",S3.p3_v8_notfound.replace("〔代碼〕",c)));}});
  if(valid)return;   /* 含在 D1 之代碼者，代碼以外之文字只用於排序（第 4 款） */
  /* 第 5 款（1）：整段全等，不分詞、不部分包含 */
  var whole=rest.replace(/\s+/g,"").replace(/業$/,"").toUpperCase();
  if(whole)V8.forEach(function(r){if(V8K[r[0]]===whole){listEl.appendChild(v8box(r[0],[],true));shown++;}});
  /* 第 5 款（2）：稅籍行業名稱比對（原始輸入，不做 NFKC；僅移除經辨識而查無之代碼原字元） */
  var rawIn=nameEl.value,rr="",rl=0;CODE_RE.lastIndex=0;
  var RAWRE=/[A-Za-zＡ-Ｚａ-ｚ][A-Za-z0-9Ａ-Ｚａ-ｚ０-９][0-9０-９]{5}/g,mm;
  while((mm=RAWRE.exec(rawIn))){var pv=rawIn.charAt(mm.index-1),nx=rawIn.charAt(mm.index+7);var pn=pv?pv.normalize("NFKC").slice(-1):"",nn=nx?nx.normalize("NFKC").charAt(0):"";if(!isB(pn)||!isB(nn))continue;if(bad.indexOf(mm[0].normalize("NFKC").toUpperCase())>=0){rr+=rawIn.slice(rl,mm.index)+" ";rl=mm.index+7;}}
  var raw=rr+rawIn.slice(rl);
  if(!raw.trim()){if(!shown&&!bad.length)listEl.appendChild(el("p","p2-none",S.name_none));return;}
  var ws=raw.trim().split(/\s+/),hit=[];
  for(var i=0;i<ORDER.length&&hit.length<20;i++){var k=ORDER[i],nm=D.names[k];if(!nm)continue;var all=true;for(var j=0;j<ws.length;j++){if(nm.indexOf(ws[j])<0){all=false;break;}}if(all)hit.push(k);}
  if(!hit.length){if(!shown)listEl.appendChild(el("p","p2-none",S.name_none));return;}
  var box=el("div","p2-namelist");box.appendChild(el("h3",null,S.name_result_heading));
  hit.forEach(function(k){box.appendChild(chip(k,D.names[k]));});
  listEl.appendChild(box);
}
'''
s = s[:i0] + NEW_NAMES + s[i1:]

# 樣式
CSS = ('.p2 .p3-v8{border:1px solid var(--stone-300);border-radius:8px;padding:12px}'
       '.p2 .p3-meta{margin-left:8px;font-size:.85rem;color:var(--graphite-600)}'
       '.p2 .p3-src,.p2 .p3-byname,.p2 .p3-upper{width:100%;margin:6px 0 0;font-size:.88rem;color:var(--graphite-600)}'
       '.p2 .p3-dead{cursor:default;opacity:.75}'
       '.p2 .p3-part{width:100%;margin-top:6px}.p2 .p3-part summary{cursor:pointer;font-size:.92rem}'
       '.p2 .p3-partlist{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}'
       '.to-tax{font:inherit;font-size:.92rem;margin-top:4px;align-self:flex-start;background:none;border:0;padding:0;color:var(--info-700);text-decoration:underline;cursor:pointer}\n')
rep('<style id="p2-style">\n', '<style id="p2-style">\n' + CSS)

# 第一期候選卡：p3_to_tax
anchor = 'a.appendChild(el("p","cand-def",e.def));'
btn = (anchor + 'var tb=el("button","to-tax",' + json.dumps(S3["p3_to_tax"], ensure_ascii=False) + ');tb.type="button";tb.setAttribute("data-p3","to-tax");'
       'tb.addEventListener("click",function(){var n=document.getElementById("p2Name");n.value=row.code;n.dispatchEvent(new Event("input"));document.getElementById("p2NameArea").scrollIntoView({block:"start"});});a.appendChild(tb);')
rep(anchor, btn)

# 頁尾：p3_attribution 接在第二期顯名之後
k0 = s.index('<p class="attribution" id="p2Attribution">'); k1 = s.index("</p>", k0) + 4
s = s[:k1] + '\n<p class="attribution" id="p3Attribution">' + E_(A["p3_attribution"], quote=False) + "</p>" + s[k1:]

# 版號
rep('<meta name="tool-version" content="business-items v1.4.0">', '<meta name="tool-version" content="' + A["tool_version"] + '">')
rep("版本 v1.4.0｜除個別標示者外均為已官方查證；法規如有修正，以主管機關公告為準。", E_(A["version_line"], quote=False))
assert "v1.4.0" not in s

out = s.encode("utf-8")
if len(out) > 1000000: sys.exit(f"中止：頁面 {len(out)} 位元組超過 1,000,000")
open(dst, "wb").write(out)
print(len(out), sha_b(out))
