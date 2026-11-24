#!/usr/bin/env python3
"""patch_v140.py：自 business-items v1.3.0 產生 v1.4.0（契約 c25；規格 v1_32 第七節第二項、附錄 E）。
用法：python3 -I patch_v140.py 〔v1.3.0 index.html〕 〔輸出 index.html〕 〔ext_c25_輸出.json〕
附錄 E 之詞表與門檻、附錄 A generic_hint、附錄 B 之說法表，一律取自 ext_c25_輸出.json，不手抄。"""
import sys, json, hashlib, re
src, dst, extp = sys.argv[1:4]
s = open(src, encoding="utf-8").read()
assert hashlib.sha256(s.encode("utf-8")).hexdigest() == "f87fdeccc21b098622e8d175866c7aef7592e28929e9986e28cd38d83a0f26c1", "底稿非 v1.3.0"
ext = json.load(open(extp, encoding="utf-8"))
E = ext["appendix_e"]
def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:80])
    s = s.replace(old, new)

# 版號
rep('content="business-items v1.3.0"', 'content="business-items v1.4.0"', s.count('content="business-items v1.3.0"'))
for old in re.findall(r"v1\.3\.0", s):
    pass
n130 = s.count("v1.3.0")
s = s.replace("v1.3.0", "v1.4.0")

# data-str：增 generic_hint（附錄 A）
m = re.search(r'(<script type="application/json" id="data-str">)(.*?)(</script>)', s, re.S)
ds = json.loads(m.group(2))
assert "generic_hint" not in ds
ds["generic_hint"] = ext["appendix_a"]["generic_hint"]
newds = json.dumps(ds, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
s = s[:m.start(2)] + newds + s[m.end(2):]

# data-phrases：依附錄 B（c25 增 JA02010 五說法、新增 F401171 四說法）
m = re.search(r'(<script type="application/json" id="data-phrases">)(.*?)(</script>)', s, re.S)
ph = json.loads(m.group(2))
tbl = ext["phrases"]["table"]
ADD = {("JA02010", "電腦維修"), ("JA02010", "手機維修"), ("JA02010", "筆電維修"), ("JA02010", "平板維修"), ("JA02010", "3C維修"),
       ("F401171", "進口酒"), ("F401171", "酒類進口"), ("F401171", "進口紅酒"), ("F401171", "進口葡萄酒")}
assert set(tbl) == set(ph) | {"F401171"} and "F401171" not in ph
for k in tbl:
    assert ph.get(k, []) == [p for p in tbl[k] if (k, p) not in ADD], k
newph = json.dumps(tbl, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
s = s[:m.start(2)] + newph + s[m.end(2):]

# 常數：附錄 E（緊接 TRIG 之後）
J = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":"))
rep('var TRIG=TRIGGERS.map(norm);\n',
    'var TRIG=TRIGGERS.map(norm);\n'
    '/* 附錄 E（c25；規格 v1_32 第七節第二項第 4 步之（4）、第 5 步之（4）（5））：動作詞、停用詞、物品詞字尾與廣泛詞門檻；由 patch_v140.py 自 ext_c25_輸出.json 代入 */\n'
    'var ACT_W=' + J(E["action_words"]) + ',STOP_W=' + J(E["stop_words"]) + ',OBJ_SUFX=' + J(E["obj_suffixes"]) + ',DF_MAX=' + str(E["df_max"]) + ';\n'
    'var ACTN=ACT_W.map(norm),STOPN=STOP_W.map(norm),SUFXN=OBJ_SUFX.map(norm);\n'
    'var ACT_LONG=ACTN.map(function(w,i){return [w,i];}).sort(function(a,b){return (cps(b[0]).length-cps(a[0]).length)||(a[1]-b[1]);}).map(function(p){return p[0];});\n'
    '/* 廣泛度：正規化名稱或定義含該詞之代碼數 */\n'
    'var DFC={};function dfOf(w){if(!has(DFC,w)){var c=0;ORDER.forEach(function(k){if(BY[k].n.indexOf(w)>=0||BY[k].d.indexOf(w)>=0)c++;});DFC[w]=c;}return DFC[w];}\n'
    '/* 泛用詞（第 5 步之（4））：動作詞、停用詞、廣泛詞，或依序刪去全部動作詞後無剩餘字者 */\n'
    'function isPlain(w){if(ACTN.indexOf(w)>=0||STOPN.indexOf(w)>=0||dfOf(w)>DF_MAX)return true;var r=w;ACT_LONG.forEach(function(g){r=r.split(g).join("");});return r==="";}\n'
    '/* 二字片段之特定性：不含動作詞、不為動作詞之一部分、不為停用詞、不為廣泛詞 */\n'
    'function specPair(b){return !ACTN.some(function(g){return g.indexOf(b)>=0||b.indexOf(g)>=0;})&&STOPN.indexOf(b)<0&&dfOf(b)<=DF_MAX;}\n'
    '/* 兜底項目：名稱以「其他」或「未分類其他」開頭 */\n'
    'function catchAll(k){return /^(其他|未分類其他)/.test(BY[k].name);}\n'
    '/* 物品詞（第 4 步之（4），c25）：名稱（拘30 補正後）末字「業」去除、正規化後，自末端反覆去除物品詞字尾，再以頓號、「及」「與」「和」拆開，二字以上之各段 */\n'
    'var OBJW={};\n'
    'ORDER.forEach(function(k){var n=BY[k].name;var core=norm(n.slice(-1)==="業"?n.slice(0,-1):n);var ch=true;\n'
    '  while(ch){ch=false;SUFXN.forEach(function(x){if(core.length>x.length&&core.slice(-x.length)===x){core=core.slice(0,-x.length);ch=true;}});}\n'
    '  core.split(/[、及與和]+/).forEach(function(p){if(cps(p).length>=2)OBJW[p]=true;});});\n')

# search 之文字比對段
old_from = s.index('  var W=Object.keys(words);\n')
old_to = s.index('  /* 第 9 步（v1_15；v1_16；v1_18；v1_19）')
old_mid = s[old_from:old_to]
assert old_mid.count("rows.sort(") == 1 and "第 13 步" in old_mid
new_mid = r'''  /* 第 4 步之（4）（c25）：物品詞，不在前述詞集合、非泛用詞、至少一處出現不與客戶位置重疊者；只比對名稱 */
  var objOnly={};
  Object.keys(OBJW).forEach(function(w){if(!has(words,w)&&!isPlain(w)&&occ(x,w).some(function(o){return !overlaps(o,zs);})){words[w]=true;objOnly[w]=true;}});
  var W=Object.keys(words);
  /* 第 5 步（1）R1：長說法內之短說法不另對到他碼（附錄 D 之例外除外） */
  var pw=W.filter(function(w){return has(PH,w);}),supp={};
  pw.forEach(function(w){
    var all=occ(x,w),ow=all.filter(function(o){return !overlaps(o,zs);});if(!ow.length)ow=all;
    var longer=pw.filter(function(L){return L!==w&&L.indexOf(w)>=0;});
    Object.keys(PH[w]).forEach(function(k){
      var covered=function(o){return longer.some(function(L){
        if(PH[L][k]||EXC[w+"\u0000"+L+"\u0000"+k])return false;
        return occ(x,L).some(function(lo){return lo[0]<=o[0]&&o[1]<=lo[1];});
      });};
      if(ow.length&&ow.every(covered))supp[w+"\u0000"+k]=true;
    });
  });
  var plain={};W.forEach(function(w){plain[w]=isPlain(w);});
  function pairHit(w,nd){var c=cps(w);if(c.length<3)return false;var need=Math.ceil((c.length-1)/2),hit=0,sp=0;
    for(var i=0;i<c.length-1;i++){var b=c[i]+c[i+1];if(nd.indexOf(b)>=0){hit++;if(specPair(b))sp++;}}
    return hit>=need&&sp>0;}
  var rows=[];
  ORDER.forEach(function(k){
    var e=BY[k],nh=0,tot=0,via=[],spec=0,viaSpec=false,viaPlain=false;
    W.forEach(function(w){
      var s=0,v=false;
      if(has(PH,w)&&PH[w][k]&&!supp[w+"\u0000"+k]){s=3;v=true;}
      else if(e.n.indexOf(w)>=0)s=3;
      else if(!objOnly[w]&&e.d.indexOf(w)>=0)s=2;
      else if(typed[w]&&pairHit(w,e.n+e.d))s=1;
      if(s>0){nh++;tot+=s;if(!plain[w])spec++;if(v){via.push(w);if(plain[w])viaPlain=true;else viaSpec=true;}}
    });
    /* 第 5 步之（5）入列：至少一個非泛用詞得分；或經泛用說法對到（c25） */
    if(nh&&(spec>0||viaPlain))rows.push({code:k,nh:nh,tot:tot,spec:spec,via:via.length>0,viaSpec:viaSpec,tag:via.length?tagText(k,via,q,x):null});
  });
  /* 第 6 步（c25）：經非泛用說法對到者在前，其次非泛用詞得分數、得分詞數、總分、代碼 */
  rows.sort(function(a,b){return (b.viaSpec-a.viaSpec)||(b.spec-a.spec)||(b.nh-a.nh)||(b.tot-a.tot)||(a.code<b.code?-1:a.code>b.code?1:0);});
  /* 第 13 步：同類補列（拘39；c25 起只取經非泛用說法對到、且非兜底項目者之前 4 碼；許可業務〔尾碼 1〕不補列） */
  var pre={},scored={};
  rows.forEach(function(r){scored[r.code]=true;if(r.viaSpec&&!catchAll(r.code))pre[r.code.slice(0,4)]=true;});
  var sib=ORDER.filter(function(k){return pre[k.slice(0,4)]&&!scored[k]&&k.slice(-1)!=="1";}).map(function(k){return {code:k,tag:null,sib:true};});
  /* 第 9 步之二（c25）：無任一得分列有非泛用詞得分，且輸入含二字以上之動作詞（至少一處不與客戶位置重疊）者，顯示 generic_hint */
  var gh=!rows.some(function(r){return r.spec>0;})&&ACTN.some(function(g){return cps(g).length>=2&&occ(x,g).some(function(o){return !overlaps(o,zs);});});
'''
s = s[:old_from] + new_mid + s[old_to:]
rep('return {mode:"text",rows:rows,siblings:sib,missing:[],tagged:rows.some(function(r){return r.via;}),zoneHint:zh};',
    'return {mode:"text",rows:rows,siblings:sib,missing:[],tagged:rows.some(function(r){return r.via;}),zoneHint:zh,genericHint:gh};')

# 畫面：generic_hint
rep('      if(r.zoneHint){var zh=el("p","zone-hint",S.zone_hint);zh.id="zoneHint";results.appendChild(zh);n.setAttribute("aria-describedby","zoneHint");}}',
    '      if(r.zoneHint){var zh=el("p","zone-hint",S.zone_hint);zh.id="zoneHint";results.appendChild(zh);n.setAttribute("aria-describedby","zoneHint");}\n'
    '      /* generic_hint（c25）：查無時緊接於 no_result（與 zone_hint）之下，外觀同 zone_hint；no_result 之 aria-describedby 一併指向 */\n'
    '      if(r.genericHint){var gh=el("p","zone-hint generic-hint",S.generic_hint);gh.id="genericHint";results.appendChild(gh);n.setAttribute("aria-describedby",(r.zoneHint?"zoneHint ":"")+"genericHint");}}')
rep('    if(r.tagged){var lg=el("p","legend",S.phrase_legend);lg.id="phraseLegend";results.appendChild(lg);}\n',
    '    if(r.tagged){var lg=el("p","legend",S.phrase_legend);lg.id="phraseLegend";results.appendChild(lg);}\n'
    '    /* generic_hint（c25）：有候選時置於 phrase_legend（無者 register_note）之後、第一筆候選之前，同 candidate_notice 之提示樣式 */\n'
    '    if(r.genericHint){var gn=el("p","notice generic-hint",S.generic_hint);gn.id="genericHint";results.appendChild(gn);}\n')
# c25 審查後（使用者 115/11/24「全部照建議修」）：核心泛用詞與尾字、特定片段之位置、廣泛詞之退回、補列只排除槍砲與爆炸物
def rep2(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:50]); s = s.replace(a, b)
# isPlain split into core + broad
rep2('function isPlain(w){if(ACTN.indexOf(w)>=0||STOPN.indexOf(w)>=0||dfOf(w)>DF_MAX)return true;var r=w;ACT_LONG.forEach(function(g){r=r.split(g).join("");});return r==="";}',
 'var TAILC=["業","商","店","廠","行","站"];\n'
 'function plainCore(w){if(ACTN.indexOf(w)>=0||STOPN.indexOf(w)>=0)return true;var r=w;ACT_LONG.forEach(function(g){r=r.split(g).join("");});if(r==="")return true;'
 'var c=cps(w);if(c.length>=3&&TAILC.indexOf(c[c.length-1])>=0)return plainCore(c.slice(0,-1).join(""));return false;}\n'
 'function isBroad(w){return !plainCore(w)&&dfOf(w)>DF_MAX;}\n'
 'function isPlain(w){return plainCore(w)||dfOf(w)>DF_MAX;}')
# siblings exclusion
rep2('&&k.slice(-1)!=="1"','&&!/槍|砲|爆炸物/.test(BY[k].name)')
# scoring block -> function
a=s.index('  /* 第 4 步之（4）（c25）');b=s.index('  /* 第 13 步')
blk=s[a:b]
new='''  /* 第 5 步（2）之特定片段（c25 審查後）：片段之位置與該自打之詞內二字以上之動作詞、停用詞重疊者不為特定片段 */
  var MASKW=ACTN.concat(STOPN).filter(function(g){return cps(g).length>=2;});
  function pairHit(w,nd){var c=cps(w);if(c.length<3)return false;var need=Math.ceil((c.length-1)/2),hit=0,sp=0,ws=c.join(""),mk={};
    MASKW.forEach(function(g){var i=ws.indexOf(g);while(i>=0){for(var j=0;j<cps(g).length;j++)mk[cps(ws.slice(0,i)).length+j]=true;i=ws.indexOf(g,i+1);}});
    for(var i=0;i<c.length-1;i++){var b=c[i]+c[i+1];if(nd.indexOf(b)>=0){hit++;if(specPair(b)&&!mk[i]&&!mk[i+1])sp++;}}
    return hit>=need&&sp>0;}
  var base=Object.keys(words);
  /* 第 4 步之（4）與第 5 步（1）至（5）；fb 為真時依第 5 步（6）把廣泛詞視為非泛用詞 */
  function score(fb){
    var wd={},objOnly={};base.forEach(function(w){wd[w]=true;});
    Object.keys(OBJW).forEach(function(w){if(!has(wd,w)&&(!isPlain(w)||(fb&&isBroad(w)))&&occ(x,w).some(function(o){return !overlaps(o,zs);})){wd[w]=true;objOnly[w]=true;}});
    var W=Object.keys(wd);
    /* 第 5 步（1）R1：長說法內之短說法不另對到他碼（附錄 D 之例外除外） */
    var pw=W.filter(function(w){return has(PH,w);}),supp={};
    pw.forEach(function(w){
      var all=occ(x,w),ow=all.filter(function(o){return !overlaps(o,zs);});if(!ow.length)ow=all;
      var longer=pw.filter(function(L){return L!==w&&L.indexOf(w)>=0;});
      Object.keys(PH[w]).forEach(function(k){
        var covered=function(o){return longer.some(function(L){
          if(PH[L][k]||EXC[w+"\\u0000"+L+"\\u0000"+k])return false;
          return occ(x,L).some(function(lo){return lo[0]<=o[0]&&o[1]<=lo[1];});
        });};
        if(ow.length&&ow.every(covered))supp[w+"\\u0000"+k]=true;
      });
    });
    var plain={};W.forEach(function(w){plain[w]=isPlain(w)&&!(fb&&isBroad(w));});
    /* 第 5 步（1）至（5）計分與入列 */
    var rows=[];
    ORDER.forEach(function(k){
      var e=BY[k],nh=0,tot=0,via=[],spec=0,viaSpec=false,viaPlain=false;
      W.forEach(function(w){
        var s=0,v=false;
        if(has(PH,w)&&PH[w][k]&&!supp[w+"\\u0000"+k]){s=3;v=true;}
        else if(e.n.indexOf(w)>=0)s=3;
        else if(!objOnly[w]&&e.d.indexOf(w)>=0)s=2;
        else if(typed[w]&&pairHit(w,e.n+e.d))s=1;
        if(s>0){nh++;tot+=s;if(!plain[w])spec++;if(v){via.push(w);if(plain[w])viaPlain=true;else viaSpec=true;}}
      });
      if(nh&&(spec>0||viaPlain))rows.push({code:k,nh:nh,tot:tot,spec:spec,via:via.length>0,viaSpec:viaSpec,tag:via.length?tagText(k,via,q,x):null});
    });
    /* 第 6 步（c25）：經非泛用說法對到者在前，其次非泛用詞得分數、得分詞數、總分、代碼 */
    rows.sort(function(a,b){return (b.viaSpec-a.viaSpec)||(b.spec-a.spec)||(b.nh-a.nh)||(b.tot-a.tot)||(a.code<b.code?-1:a.code>b.code?1:0);});
    return rows;
  }
  /* 第 5 步（6）廣泛詞之退回（c25 審查後）：無任一代碼有非泛用詞得分而有廣泛詞者重算 */
  var rows=score(false),strictNoSpec=!rows.some(function(r){return r.spec>0;});
  var hasBroad=strictNoSpec&&base.concat(Object.keys(OBJW)).some(function(w){return isBroad(w)&&occ(x,w).some(function(o){return !overlaps(o,zs);});});
  if(hasBroad){var r2=score(true);if(r2.some(function(r){return r.spec>0;}))rows=r2;}
'''
s=s[:a]+new+s[b:]
rep2('var gh=!rows.some(function(r){return r.spec>0;})&&ACTN.some(','var gh=strictNoSpec&&(hasBroad||ACTN.some(')
rep2('occ(x,g).some(function(o){return !overlaps(o,zs);});});\n','occ(x,g).some(function(o){return !overlaps(o,zs);});}));\n')
rep2("  /* 第 9 步之二（c25）：無任一得分列有非泛用詞得分，且輸入含二字以上之動作詞（至少一處不與客戶位置重疊）者，顯示 generic_hint */",
     "  /* 第 9 步之二（c25）：依第 5 步（5）無任一得分列有非泛用詞得分，且輸入含二字以上之動作詞（至少一處不與客戶位置重疊）或依第 5 步（6）有廣泛詞者，顯示 generic_hint */")
rep2("  /* 第 13 步：同類補列（拘39；c25 起只取經非泛用說法對到、且非兜底項目者之前 4 碼；許可業務〔尾碼 1〕不補列） */",
     "  /* 第 13 步：同類補列（拘39；c25 起只取經非泛用說法對到、且非兜底項目者之前 4 碼；名稱含槍、砲、爆炸物者不補列） */")
rep2("（4）（5））：動作詞、停用詞、物品詞字尾與廣泛詞門檻", "（4）（5）（6））：動作詞、停用詞、物品詞字尾與廣泛詞門檻")
open(dst, "w", encoding="utf-8").write(s)
b = s.encode("utf-8")
print("v1.3.0→v1.4.0 字樣替換", n130, "處；輸出", len(b), "位元組", hashlib.sha256(b).hexdigest())
