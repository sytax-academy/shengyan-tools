#!/usr/bin/env python3
"""自 verify/results/結果.json 與 x4_c17_*.json 產生 verify/results/執行紀錄.md（不手抄結果）。
用法（自 repo 根目錄）：python3 -I business-items/build/verify/make_record.py
"""
import json
import os

V = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(V, "results")
d = json.load(open(os.path.join(RES, "結果.json"), encoding="utf-8"))
x4 = {}
for lab, fn in (("Q80、Q99", "x4_c17_Q80Q99.json"), ("Q127", "x4_c17_Q127.json")):
    p = os.path.join(RES, fn)
    if os.path.exists(p):
        x4[lab] = (fn, json.load(open(p, encoding="utf-8"))["summary"])


def pct(x):
    return f"{x['hit']}／{x['total']}（{x['ratio'] * 100:.1f}%）"


def q107brief(x):
    ps = lambda c: "、".join(f"persisted={y['persisted']}／navigation type={y['nav']}" for y in c.get("back", {}).get("pageshow", []))
    name = {"chromium_playwright_default": "Chromium（Playwright 預設，停用往返快取）", "chromium_bfcache_enabled": "Chromium（完整版，啟用往返快取）", "firefox": "Firefox", "webkit": "WebKit"}
    out = []
    for key, c in x["settings"].items():
        t = f"{name.get(key, key)}：{c['verdict']}"
        if c.get("back"):
            t += f"，上一頁返回之 pageshow：{ps(c)}；重新整理與返回清空 {c['ok']}"
        if c.get("error"):
            t += f"（{c['error']}）"
        elif c.get("note"):
            t += f"（{c['note']}）"
        out.append(t)
    return "；".join(out)


def brief(v):
    det = v["detail"]
    if isinstance(det, str):
        return det.replace("\n", " ").replace("|", "｜")
    return ""


L = ["# 營業項目查詢（business-items）驗證執行紀錄（契約 c17）", "",
     f"- 驗證表：《營業項目查詢工具_驗證表》v1_16（knowledge f429c0d）期別一 97 列、刻意錯誤 155 列（6 列不在射程）；規格 v1_19（契約 c17）",
     f"- 受驗檔：business-items/index.html（SHA-256 {d['tool_sha256']}；受驗 commit {d.get('tested_commit')}，受驗頁與該 commit 之檔逐位元組相同：{d.get('tested_page_from_head')}；build.py 依規格 v1_19 產出，同輸入兩次逐位元組相同）",
     f"- 期望值：business-items/build/ext_c17_輸出.json（SHA-256 {d['ext_sha256']}；ext_c17.py 之抽出，與驗證表 v1_16 同一 commit 凍結，knowledge f429c0d）；Q132 另以獨立推導檔（knowledge f429c0d 之 inbox/工具十三/營業項目查詢_獨立推導_c17_v1_0.json，SHA-256 {d['flags']['indep_sha256']}；不入本 repo）",
     "- 環境：Chromium 無頭（Node 之 Playwright 1.56.1，Chromium 141）；頁面以本機 http 伺服器提供，上一頁返回以同源測試頁 /other.html 代替 sytaxes.com（判定方式十）",
     f"- 瀏覽器啟動：{'成功' if not d.get('browser_launch_error') else '失敗（判定方式二十五，相關列與刻意錯誤記未執行）：' + d['browser_launch_error']}",
     f"- 測試模式旗標：{d['flags']['build_test_mode']}（Q02 依驗證表寫明；Q04 同）",
     "- 程式：business-items/build/verify/verify.js（`--spec 〔規格 v1_19〕 --indep 〔獨立推導 c17 v1_0〕 --spec-v1-10 〔規格 v1_10〕 --spec-v1-12 〔規格 v1_12〕 --shots`）；Q80、Q99、Q127 為 run_x4_c10.py（Python 之 Playwright 1.56.0；c17 只增檔頭說明一行，執行內容未改）；本檔由 make_record.py 自 results/ 之 JSON 產生", "",
     "## 一、結果計數", "",
     f"通過 {d['count']['通過']}、未通過 {d['count']['未通過']}、未執行 {d['count']['未執行']}（合計 {sum(d['count'].values())}）", "",
     f"驗證表列號與腳本輸出列號之差集：表有而腳本無 {d['row_ids_missing_vs_table']}；腳本有而表無 {d['extra_ids']}", "",
     "不在射程（不執行、不記結果）：" + "、".join(d["out_of_scope"]) + "（開發中頁；驗證表 v1_16 第九之二節）", "",
     "## 二、逐列", "", "| 列號 | 結果 | 摘要（未通過與未執行列之原因；明細見 結果.json） |", "|---|---|---|"]
for k, v in d["rows"].items():
    det = brief(v)
    if k == "Q107" and isinstance(v["detail"], dict):
        det = q107brief(v["detail"]) + "。判定方式二十六：無未通過而 Firefox、WebKit 未跑（七題之七，115/10/23 後本機補跑），本列記未執行"
    elif k == "Q128" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = f"全部 {x['inputs']} 句（ext all_inputs {x['expectInputs']} 句，全部列逐列比對並比 results_heading 之 N；其中 mode 為 empty 者 {x['emptyInputs']} 句依 Q130）：不一致 {len(x['mismatches'])} 句" + ("：" + "、".join(json.dumps(m["input"], ensure_ascii=False) for m in x["mismatches"]) if x["mismatches"] else "")
        z = x.get("zoneHintSupplement")
        if z:
            det += f"；補充（派工要求，不入本列判定）：zone_hint 之有無與 candidates[該句].zone_hint 逐句比對（期望為真 {z['expectTrue']} 句），不一致 {len(z['mismatches'])} 句" + ("：" + "、".join(json.dumps(m["input"], ensure_ascii=False) for m in z["mismatches"]) if z["mismatches"] else "")
    elif k == "Q129" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = (f"判定方式十九：:root 宣告值與抽出值逐字相等 {x['declaredEqual']}；h1、body 之 computed 除引號外相等 {x['equalIgnoringQuotes']}；"
               f"computed h1＝{x['computed']['h1']}；body＝{x['computed']['body']}")
    elif k == "Q121" and isinstance(v["detail"], dict):
        x = v["detail"]
        def q121(r):
            t = f"{r['w']}×{r['h']}「{r['input'][:12]}」走{r['走哪一款']}" + ("" if r['走哪一款'].startswith("乙") else "款")
            t += f"（標籤上緣 {r['labelTop']:.2f}、results_heading 上緣 {r['headingTop']:.2f}、scrollY {r['scrollY']}、最小所需 {r['minNeed']:.2f}、差 {r['scrollMinusMinNeed']:.2f}、視窗高 {r['vh']}、標籤至第一筆下緣 {r['span']:.2f}、results_heading 至第一筆下緣 {r['spanFromHeading']:.2f}" + (f"；須{r['mustBranch']}" if r.get('mustBranch') else "") + f"；{'通過' if r['ok'] else '未通過'}）"
            return t
        det = "；".join(q121(r) for r in x["rows"]) + "。乙一＝results_heading 對齊；乙二＝括號情形（判定方式二十一）"
    elif k == "Q132" and isinstance(v["detail"], dict):
        x = v["detail"]
        bad = [r["input"] for r in x["sentences"] if not (r["page_ext"] and r["page_indep"] and r["ext_indep"])]
        det = f"{len(x['sentences'])} 句三方（頁面、ext_c17、獨立推導 c17）比對（mode、得分列、補列、phrase_tag 全文、N、zone_hint 之有無）：不一致 {len(bad)} 句" + ("：" + "、".join(bad) if bad else "")
    elif k == "Q134" and isinstance(v["detail"], list):
        det = "；".join(f"「{json.dumps(r['input'], ensure_ascii=False)[1:-1]}」期望 zone_hint {'有' if r.get('expect') else '無'}，頁面 {r.get('n', r.get('after'))} 處" + ("" if r.get("ok") else "（不符）") for r in v["detail"])
        det += "（v1_13：顯示者另判焦點在 no_result、border 各邊 0、15px、color 同 candidate_notice、左右內距 16px；v1_16：margin-top -6px；寬 390 列另判 scrollWidth 不大於 clientWidth 且右緣不大於視窗寬）"
    elif k == "Q135" and isinstance(v["detail"], dict):
        det = "；".join(f"{lab}「{r['input']}」期望{'顯示' if r['expectShown'] else '不顯示'}，register_note {r['n']} 處" + (f"、在 candidate_notice 之後 {r['afterNotice']}、在第一筆候選之前 {r['beforeFirstCard']}、在 phrase_legend 之前 {r['beforeLegend']}" if r['expectShown'] else "") + ("" if r["ok"] else "（不符）") for lab, r in v["detail"].items())
    elif k == "Q42" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = (f"一、二、三：radio {x['一']['radios']}／{x['二']['radios']}／{x['三']['radios']}、fieldset {x['一']['fieldsets']}／{x['二']['fieldsets']}／{x['三']['fieldsets']}、innerText 含 org_label_old、org_required_old、org_options_old 者："
               + "、".join(lab for lab in ("一", "二", "三") if x[lab]['label'] or x[lab]['required'] or x[lab]['options']) + "（無則空）；"
               f"四：原始碼含 *_old 六鍵之全文 {x['四']['sourceHasOld'] or '無'}；application/json 區塊 {len(x['四']['jsonScripts'])} 個（{'、'.join(x['四']['jsonScripts'])}）；"
               f"script 元素 {len(x['四'].get('scripts', []))} 個（無 type 者 {sum(1 for t in x['四'].get('scripts', []) if t is None)} 個）；template 元素 {x['四'].get('templates')} 個")
    elif k == "Q01" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = f"重建所得 index.html 之 SHA-256 {x.get('rebuiltSha256')}；受驗頁（{x.get('testedFrom')}）{x.get('testedPageSha256')}；逐位元組相同 {x.get('sameAsTestedCommitIndex')}"
    elif k == "Q12" and isinstance(v["detail"], dict):
        x = v["detail"]; c = x.get("card") or {}
        det = (f"兩類之下白話說明 {[len(f['items']) for f in c.get('plain', [])]} 處；兩類之後 {len(c.get('outside', []))} 處：" + "、".join(f"「{o['text']}」（在第七類 restriction_note 之後 {o['afterLastRn']}）" for o in c.get("outside", []))
               + f"；innerText 含 dual_category_note_old {x['innerTextHasOld']}、原始碼含 {x['sourceHasOld']}")
    elif k == "Q136" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = "；".join(f"{code} {'通過' if r is True or (isinstance(r, dict) and r.get('ok')) else '不符'}" for code, r in x.items() if code != "basis_item_4") + f"；依據說明展開後 basis_item_4 可見 {x.get('basis_item_4', {}).get('visible')} 處"
        ind = [code for code, r in x.items() if isinstance(r, dict) and r.get("indepPlainSame") is False]
        det += f"（獨立推導 c17 之 plain 與 ext 不同者：{ind or '無'}；不入判定）"
    elif k == "Q130" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = (f"空白類 {len({r['input'] for r in x['empty']})} 句：{sum(1 for r in x['empty'] if r['n'] == 1 and r['role'] == 'alert')}／{len(x['empty'])} 次 input_required 恰一處且 role 為 alert；"
               "v1_12 兩句（v1_14 刪組織型態之分述）：" + "；".join(f"「{r['input']}」mode {r['extMode']}、input_required {r['inputRequired']}、no_result {r['noResult']}" + ("" if r["ok"] else "（不符）") for r in x["v1_12"]))
    elif k == "Q116" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = (f"二之按鈕「{x['二']['button']}」；六之按鈕「{x['六']['button']}」；七（製造）之按鈕「{x['七']['button']}」；"
               f"補列 section（aria-labelledby＝sibling_heading 之 id，含 heading、note 與全部補列，不含得分列）：一 {x['一']['sibState']['section']['labelled']} 個、二 {x['二']['after']['sibState']['section']['labelled']} 個、六 {x['六']['after']['sibState']['section']['labelled']} 個；"
               f"三、四、七之 aria-labelledby 指向 sibling_heading 者：{[x['三四'][q]['labelledByHeading'] for q in x['三四']] + [x['七']['labelledByHeading']]}；"
               f"v1_12、v1_13 版面（最後一筆得分列與 sibling_heading 之間無其他元素〔只排除 section 本身與該得分列之後代〕；section 之父元素為 #results；section 之 display、flex-direction、row-gap 同 #results，border、padding、margin 各邊 0）：一 {x['一']['sibState']['layout']['ok']}、二 {x['二']['after']['sibState']['layout']['ok']}、六 {x['六']['after']['sibState']['layout']['ok']}")
    elif v["result"] == "未通過" and not det:
        det = json.dumps(v["detail"], ensure_ascii=False)[:600].replace("|", "｜")
    L.append(f"| {k} | {v['result']} | {det} |")

ec = d["rows"]["Q128"]["detail"] if "Q128" in d["rows"] and isinstance(d["rows"]["Q128"]["detail"], dict) else None
L += ["", "## 三、Q128：全部輸入逐句一致（ext_c17_輸出.json 之 all_inputs）", ""]
if ec:
    L += [f"全部 {ec['inputs']} 句（得分列與順序、補列、phrase_tag 全文、code_not_found 之代碼與順序、results_heading 之 N；全部列逐列比對；mode 為 empty 者依 Q130）：不一致 {len(ec['mismatches'])} 句。", ""]
    for m in ec["mismatches"]:
        L.append(f"- {json.dumps(m, ensure_ascii=False)}")
    z = ec.get("zoneHintSupplement")
    if z:
        L += ["", f"補充（派工要求 {ec['inputs']} 句逐句一致含 zone_hint；驗證表 Q128 之應得輸出未列 zone_hint，故只記錄、不入 Q128 之判定）：zone_hint 之有無不一致 {len(z['mismatches'])} 句（期望為真者 {z['expectTrue']} 句）。"]

L += ["", "## 四、刻意錯誤版", "", "| 編號 | 應抓到之列 | 各列結果 | 全數抓到 |", "|---|---|---|---|"]
for k, v in d["deliberate_errors"].items():
    if v.get("notRun"):
        L.append(f"| {k} | {'、'.join(v['expect'])} | 未執行：{v.get('error', '')} | － |")
        continue
    got = "、".join(f"{r}：{x}" for r, x in v.get("got", {}).items()) or v.get("error", "")
    if v.get("rule"):
        got += f"；{v['rule']}；完整 Chromium 啟用往返快取之設定：{(v.get('fullBfcacheSetting') or {}).get('verdict')}（{(v.get('fullBfcacheSetting') or {}).get('error', '')}）"
    if v.get("exceptions"):
        got += f"；判未通過之原因為例外者：{json.dumps(v['exceptions'], ensure_ascii=False)}"
    if v.get("mustCatch"):
        got += f"；必抓之句「企管顧問 進出口」{'在' if v['mustCatch']['ok'] else '不在'}不一致清單；不一致之句：{'、'.join(v['mustCatch']['mismatchInputs'] or [])}"
    L.append(f"| {k} | {'、'.join(v['expect'])} | {got} | {'是' if v.get('allCaught') else '否'} |")
caught = {}
for k, v in d["deliberate_errors"].items():
    for r in v.get("caught", []) or []:
        caught.setdefault(r, []).append(k)
prog = [r for r, v in d["rows"].items() if not (isinstance(v["detail"], str) and v["result"] == "未執行")]
L += ["", f"可程式判定列中，無任何刻意錯誤版使之判未通過者：{[r for r in prog if r not in caught]}", "",
      "E80 之「說法表代碼之順序」依實作取為：補列依說法表對到之得分列（頁面順序）逐一取其同類代碼，同類內仍依字母序（驗證表未寫明，前批已列入疑義）。", "",
      "E81、E82 加回之兩對自規格 v1_12（knowledge 30902f4，SHA-256 核對）附錄 D 機械抽出；E95 之「備援補捲」取為規格第七節第一項捲動第 3 點最後一步（results_heading 對齊後仍未完整可見時之補捲）。", "",
      "X01～X21 為補充之刻意錯誤（驗證表 E 列未涵蓋之可程式判定列各至少一個；沿用 v1_6 執行時之設計，補丁依 c11 之頁面改寫）。", "",
      "c12 之頁面改寫使 E76、E86、E89、E97、E102 之補丁原字串改變，補丁依 c12 原文改寫，改動之意旨不變（E76：列印不隱藏查詢鈕；E86：刪空白判定；E89：刪 sibling_note；E97：列印不隱藏未選之組織型態；E102：第一筆補列置於 sibling_heading 之前）。c13 之頁面改寫未改動既有補丁之原字串。c14 之頁面改寫使 E112、E114 之補丁原字串改變（E112 依驗證表 v1_13 改寫為反向；E114 之意旨不變）。", "",
      "E112～E118（v1_12）之補丁：E112 客戶位置之終點刪斜線、加號；E113 不顯示 zone_hint；E114 文字比對一律顯示 zone_hint（有候選時置於 candidate_notice 之後）；E115 zone_hint 置於 no_result 之前；E116 補列 section 加框線與內距；E117 空白判定之字母數字檢查不先做 NFKC；E118 自打之詞改為每一處出現均不與客戶位置重疊才計。", "",
      "E112 依驗證表 v1_13 改寫：客戶位置之終點加回斜線、加號（回 v1_15）。E119～E128（v1_13）之補丁：E119 zone_hint 之條件回 v1_15（客戶位置之終點須恰為全文末）；E120 內嵌之 zone_hint 換為 v1_15 之字樣（自 tools 3624af9 之工具頁內嵌字樣取出，SHA-256 核對）；E121 zone_hint 設 tabindex 並為焦點；E122 zone_hint 加 white-space:nowrap；E123 補列 section 外再包一層有框線與內距之 div；E124 代碼直查有查無代碼時於其後顯示 zone_hint；E125 不檢查客戶位置不為空；E126 不檢查延伸至句末（只要客戶位置不為空）；E127 原輸入以空白結尾者不顯示 zone_hint（句末空白視為終點，其後不視同延伸至全文末）；E128 zone_hint 加框線。", "",
      "c15（驗證表 v1_14）依新義改寫之補丁：E06 第七類之代碼不標類別原文（刪該類之 cat-title）；E07 依固定之組織型態（有限公司）判衝突，於卡末附 conflict_prefix_old 加類別原文（衝突之類別取規格 v1_17 第八節保留之對照表「有限公司」欄：一、三、四、五、十一、十二、十三、十四類）；"
      "E67 加回組織型態之 fieldset（自 tools 058fa6f 之工具頁原樣取出，SHA-256 核對；不加 JS）；E68 查詢時一律顯示 org_required_old（role alert）且不產生候選（頁面無選項，故恆為未選）；"
      "E97 帶組織型態限制之代碼（九、十類以外之限制）附 org_undecided_note_old；E104 業務描述欄內按 Enter 不送出（刪 keydown 之 run()）；E111 查詢後焦點移至第一張卡而不移至 results_heading；"
      "E129 內嵌之 zone_hint 換為 v1_16 之字樣（自 tools 058fa6f 之工具頁內嵌字樣取出，SHA-256 核對）。舊字樣一律取自 ext_c15 之附錄 A *_old 鍵，不手抄。", "",
      "c16（驗證表 v1_15）新增之補丁：E130 於查詢鈕之前加一段 p，文字為 org_options_old（無 radio）；E131 於 data-str 加 org_required_old 鍵（畫面不顯示）；E132 於 data-excepts 之前植入 tools 3624af9 之工具頁之 data-org 區塊（原樣，SHA-256 核對）；"
      "E133 白話說明之類別對應第十四類改 plain_co；E134 第九類加 plain_co；E135 HZ07011 之第七類不附白話說明；E136 白話說明 font-weight 700；E137 刪 register_note；E138 代碼直查不顯示 register_note；"
      "E139 刪「空白之前一字或後一字為斜線、加號者不為終點」之條件（回 v1_17）；E140 zone_hint 判定刪右括號、右引號（回 v1_17）；E141 內嵌之 zone_hint 換為 v1_17 之字樣（自 tools fcba277 之工具頁內嵌字樣取出，SHA-256 核對）。"
      "c16 之頁面改寫使 E105、E119、E125～E127 與 E114 之補丁原字串改變：E105 依含斜線、加號條件之原文只刪「起始字後緊接之空白略過」；ZH_C16（原 ZH_C14）為含右括號、右引號之 zone_hint 條件，E125 之替換字串保留右括號、右引號（只刪「不為空」之檢查），意旨不變。", "",
      "c15 之頁面改寫使 E43、E102、E108 之補丁原字串改變：E43 回顯卡只含輸入（頁面無組織型態）；E102 card() 不再帶組織型態參數；E108 原為列印規則與組織型態之 :has() 選擇器合列，c15 之列印規則已無組織型態，改為於隱藏查詢鈕之選擇器清單前加 v1_13 原文之 fieldset:not(:has(input:checked))，意旨（與 :has() 合列）不變。"
      "補充刻意錯誤 X06、X07、X10（原改衝突對照表）改為自一覽表刪去 F112010 之第五類、J905010 之第十四類、H101021 之第一類；X13（Q42）改為頁面留一個空 fieldset；X14（Q43）改為兩類並列不附 dual_category_note。", "",
      "c17（驗證表 v1_16）新增之補丁：E142 改動 index.html 主程式註解之一字（「v1_19」→「v1_18」，不經 build.py）；E143 於 data-str 之前加 template 元素（內含文字，不含 *_old 字樣）；E144 於 data-str 之前加無 type 之 script 元素（內容為空陣列字面）；"
      "E145 白話說明（含 plain_dual）不加 plain_label；E146 白話說明移到括號註記與 restriction_note 之後；E147 PLAIN_BY_CODE 之第八類改 plain_co；E148 plain_cond 五碼改依類別（第五類 plain_sa、第七類 plain_co）；"
      "E149 HZ07011 兩類之下各附依類別之白話說明（plain_sa、plain_co），不附 plain_dual；E150 HZ07011 之 plain_dual 換為 dual_category_note_old（字樣取自 ext_c17 之附錄 A）；"
      "E151 內嵌之 plain_co_biz 換為 v1_18 之字樣、E152 依據說明第四項換為 v1_18 之 basis_item_4、E153 CLOSERS 換為 c16 之宣告（三者均自 tools 2b6e7f0 之工具頁取出，SHA-256 核對）；E154 zone_hint 之上緣負邊距改為 0；"
      "E155 為驗證程式之自檢（判定方式二十七）：頁面不改，令完整 Chromium 啟用往返快取之設定於啟動時拋錯，抓到＝Q107 記未執行並附錯誤訊息。", "",
      "c17 之頁面改寫使 E133～E135 與 X14 之補丁原字串改變：白話說明改為逐代碼之 PLAIN_BY_CODE，E133（第十四類改 plain_co）、E134（第九類加 plain_co）、E135（HZ07011 只附一類：第五類附 plain_sa）改以 PLAIN_BY_CODE 為之；X14 改為兩類並列不附 plain_dual；意旨不變。", ""]
nc = [k for k, v in d["deliberate_errors"].items() if v.get("allCaught") is False]
L += [f"未全數抓到之刻意錯誤：{nc or '無'}", ""]

pre = d["pre_revision"]
L += ["## 五、改版前之版本（tools 2b6e7f0 之工具頁，c16；派工：以 2b6e7f0 之頁面跑驗證表 v1_16 改動之列與 Q136〔Q81 截圖不跑〕）", "",
      "派工寫明照記判定，本節不判與期望相符與否。", ""]
if "rows" in pre:
    L += [f"受驗檔：{pre['page']['commit']}:business-items/index.html（SHA-256 {pre['page']['sha256']}）", "",
          "| 列號 | 結果 | 驗證表之期望 | 與期望相符 |", "|---|---|---|---|"]
    for r, v in pre["rows"].items():
        exp = "須判未通過" if r in pre["expectFail"] else "應判通過" if r in pre.get("expectPass", []) else "驗證表未列，照記" if r in pre["passAsRecorded"] else ""
        match = (v["result"] == "未通過") if r in pre["expectFail"] else (v["result"] == "通過") if r in pre.get("expectPass", []) else "（照記）"
        if r == "Q107" and isinstance(v["detail"], dict):
            exp += "；" + q107brief(v["detail"])
        L.append(f"| {r} | {v['result']} | {exp} | {'是' if match is True else '否' if match is False else match} |")
    L.append("")
else:
    L += [f"未執行：{pre.get('error', '')}", ""]
L += [f"其餘回測：{pre.get('earlier', '')}", ""]

L += ["## 六、人工列 Q80、Q99、Q127（只報數字，判定記未執行，交使用者）", ""]
for lab, (fn, s) in x4.items():
    L += [f"### {lab}（results/{fn}）", "",
          f"- 對照組：{s['control_group']}（SHA-256 {s['control_group_sha256']}），{s['cases']} 則；受驗頁 SHA-256 {s['page_sha256']}",
          f"- 方法：{s['method']}",
          f"- 涵蓋比例：計入 ZZ99999 {pct(s['coverage_incl_zz'])}；不計入 ZZ99999 {pct(s['coverage_excl_zz'])}；其中經同類補列進入前 30 列者 {s['hits_via_sibling_rows']} 個；ZZ99999 於前 30 列者 {s['zz99999_hits']} 則",
          "", "| 則 | 組織型態（對照組欄位；頁面未操作） | 前 30 列命中（含 ZZ） | 不含 ZZ | 得分列 | 補列 | 標 phrase_tag 之代碼 | 未命中之內部版候選 |", "|---|---|---|---|---|---|---|---|"]
    for c in s["per_case"]:
        L.append(f"| {c['no']} | {c['org']} | {c['hit30_all10']} | {c['hit30_excl_zz']} | {c['n_scored']} | {c['n_sibling']} | {'、'.join(c['tagged_codes'])} | {'、'.join(c['missed'])} |")
    L += ["", f"- 未命中說法表之例（任一列皆無 phrase_tag）：{s['q99_untagged_cases'] or '無'}（比例 {s['q99_untagged_ratio'] * 100:.1f}%）",
          "- 說法對到而內部版未列：" + ("；".join(f"第 {x['no']} 則 {x['code']}「{x['tag']}」（第 {x['rank']} 列）" for x in s["q99_tagged_not_internal"]) or "無"), ""]
L += ["Q80 之註記（驗證表 v1_9）：第二批說法表取材自 X4 對照組（dc370a4），Q80 之數字偏樂觀，與 Q127（未用於起草第二批說法表）並列判讀。涵蓋仍以前 30 列（得分列加補列，依頁面顯示順序）計（判定方式十六）；results_heading 之 N 改為只計得分列不影響此計法。", ""]

L += ["## 七、Q81 截圖", "", ("本批全部重產（c17 之頁面白話說明之位置、標示與字樣有變；驗證表 v1_16 增 Q136 之 D101011、IZ17010 二張，Q43 之 HZ07011 重產）" if d.get("screenshots_regenerated") else "本批未重產") + "；verify/screenshots/：" + "、".join(d["screenshots"]), ""]
open(os.path.join(RES, "執行紀錄.md"), "w", encoding="utf-8", newline="\n").write("\n".join(L))
print("ok", [r for r in prog if r not in caught])
