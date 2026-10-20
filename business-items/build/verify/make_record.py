#!/usr/bin/env python3
"""自 verify/results/結果.json、外殼v1_2_Q138.json 與 x4_c20_*.json 產生 verify/results/執行紀錄.md 與 外殼v1_2_Q138.md（不手抄結果）。
用法（自 repo 根目錄）：python3 -I business-items/build/verify/make_record.py
"""
import json
import os

V = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(V, "results")
d = json.load(open(os.path.join(RES, "結果.json"), encoding="utf-8"))
x4 = {}
for lab, fn in (("Q80、Q99", "x4_c20_Q80Q99.json"), ("Q127", "x4_c20_Q127.json")):
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


L = ["# 營業項目查詢（business-items）驗證執行紀錄（契約 c20）", "",
     f"- 驗證表：《營業項目查詢工具_驗證表》v1_19（knowledge 9dbfb58）期別一 99 列、刻意錯誤 175 列（6 列不在射程）；規格 v1_22（契約 c20）；Q138 另依《外殼一致化_外殼驗證表》v1_2 定稿（knowledge d938e6b），逐列結果另表 results/外殼v1_2_Q138.md",
     f"- 受驗檔：business-items/index.html（SHA-256 {d['tool_sha256']}；受驗 commit {d.get('tested_commit')}，受驗頁與該 commit 之檔逐位元組相同：{d.get('tested_page_from_head')}；build.py 依規格 v1_22 產出，同輸入兩次逐位元組相同）",
     f"- 期望值：business-items/build/ext_c20_輸出.json（SHA-256 {d['ext_sha256']}；ext_c19.py 對規格 v1_22 之抽出，與驗證表 v1_19 同一 commit 凍結，knowledge 9dbfb58）；Q132 另以獨立推導檔（knowledge 9dbfb58 之 inbox/工具十三/營業項目查詢_獨立推導_c19_v1_0.json，SHA-256 {d['flags']['indep_sha256']}；不入本 repo）；外殼之字樣自外殼規格 v1_2 附錄以程式抽出（SHA-256 核對）",
     "- 環境：Chromium 無頭（Node 之 Playwright 1.56.1，Chromium 141）；頁面以本機 http 伺服器提供，上一頁返回以同源測試頁 /other.html 代替 sytaxes.com（判定方式十）；對外請求一律於 browser context 層級記錄（派工固定段甲）；連結樣式量測不以點擊或 Enter 觸發導航（固定段乙）",
     f"- 瀏覽器啟動：{'成功' if not d.get('browser_launch_error') else '失敗（判定方式二十五，相關列與刻意錯誤記未執行）：' + d['browser_launch_error']}；Firefox 實測：{json.dumps(d['flags'].get('firefox_launch'), ensure_ascii=False)}",
     f"- 測試模式旗標：{d['flags']['build_test_mode']}（Q02 依驗證表寫明；Q04 同）",
     f"- 外殼補填（規格 v1_22 第十一節之 7）：knowledge {d['flags'].get('shell_fill_commit')} 之 inbox/外殼v1_2/執行/營業項目查詢批/",
     "- 程式：business-items/build/verify/verify.js 與 shell_v1_2.js（`--spec 〔規格 v1_22〕 --indep 〔獨立推導 c19 v1_0〕 --spec-v1-10 〔規格 v1_10〕 --spec-v1-12 〔規格 v1_12〕 --spec-v1-21 〔規格 v1_21〕 --shell-spec 〔外殼規格 v1_2〕 --shell-table 〔外殼驗證表 v1_2〕 --shell-precheck 〔靜態預檢 json〕 --shell-fill-commit 〔commit〕 --shots`）；Q80、Q99、Q127 為 run_x4_c10.py（Python 之 Playwright 1.56.0；c20 只增檔頭說明一行，執行內容未改）；本檔由 make_record.py 自 results/ 之 JSON 產生", "",
     "## 一、結果計數", "",
     f"通過 {d['count']['通過']}、未通過 {d['count']['未通過']}、未執行 {d['count']['未執行']}（合計 {sum(d['count'].values())}）", "",
     f"驗證表列號與腳本輸出列號之差集：表有而腳本無 {d['row_ids_missing_vs_table']}；腳本有而表無 {d['extra_ids']}", "",
     "不在射程（不執行、不記結果）：" + "、".join(d["out_of_scope"]) + "（開發中頁；驗證表 v1_19 第九之二節）", "",
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
        det = f"{len(x['sentences'])} 句三方（頁面、ext_c19、獨立推導 c19）比對（mode、得分列、補列、phrase_tag 全文、N、zone_hint 之有無）：不一致 {len(bad)} 句" + ("：" + "、".join(bad) if bad else "")
    elif k == "Q134" and isinstance(v["detail"], list):
        det = "；".join(f"「{json.dumps(r['input'], ensure_ascii=False)[1:-1]}」期望 zone_hint {'有' if r.get('expect') else '無'}，頁面 {r.get('n', r.get('after'))} 處" + ("" if r.get("ok") else "（不符）") for r in v["detail"])
        det += "（v1_13：顯示者另判焦點在 no_result、border 各邊 0、15px、color 同 candidate_notice、左右內距 16px；v1_16：margin-top -6px；v1_17：增左彎引號二句；寬 390 列另判 scrollWidth 不大於 clientWidth 且右緣不大於視窗寬）"
    elif k == "Q135" and isinstance(v["detail"], dict):
        det = "；".join(f"{lab}「{r['input']}」期望{'顯示' if r['expectShown'] else '不顯示'}，register_note {r['n']} 處" + (f"、在 candidate_notice 之後 {r['afterNotice']}、在第一筆候選之前 {r['beforeFirstCard']}、在 phrase_legend 之前 {r['beforeLegend']}" if r['expectShown'] else "") + ("" if r["ok"] else "（不符）") for lab, r in v["detail"].items())
    elif k == "Q42" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = (f"一、二、三：radio {x['一']['radios']}／{x['二']['radios']}／{x['三']['radios']}、fieldset {x['一']['fieldsets']}／{x['二']['fieldsets']}／{x['三']['fieldsets']}、innerText 含 org_label_old、org_required_old、org_options_old 者："
               + "、".join(lab for lab in ("一", "二", "三") if x[lab]['label'] or x[lab]['required'] or x[lab]['options']) + "（無則空）；"
               f"四：原始碼含 *_old 七鍵（全文）之全文 {x['四']['sourceHasOld'] or '無'}、summary 等於 basis_title_old {x['四'].get('summaryIsBasisTitleOld')}；application/json 區塊 {len(x['四']['jsonScripts'])} 個（{'、'.join(x['四']['jsonScripts'])}）；"
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
        det += f"（獨立推導 c19 之 plain 與 ext 不同者：{ind or '無'}；不入判定）"
    elif k == "Q137" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = f"建置來源 {x.get('buildFrom')}；受驗頁 {x.get('testedPageSha256')}；" + "；".join(
            f"{lab}（{' '.join(x[lab]['args'])}）結束碼 {x[lab]['exit']}、index.html 前後相同 {x[lab]['indexUnchanged']}、報告列出代碼與原因 {x[lab]['reportListsCodeAndReason']}、報告含註明 {x[lab]['reportHasNote']}、stderr 含註明 {x[lab]['stderrHasNote']}"
            for lab in ("一", "二", "三", "四", "五", "六") if lab in x and isinstance(x[lab], dict) and "args" in x[lab]) + (f"；六次後不注入之正常建置結束碼 {x['正常建置']['exit']}、所得 index.html 與受驗頁相同 {x['正常建置']['sameAsTestedCommitIndex']}" if "正常建置" in x else "")
    elif k == "Q138" and isinstance(v["detail"], dict):
        x = v["detail"]
        det = f"外殼表適用列 {len(x['適用列'])} 列：未通過 {x['未通過'] or '無'}；未執行 {x['未執行'] or '無'}；補填 commit {x.get('補填commit')}；逐列見 外殼v1_2_Q138.md"
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
L += ["", "## 三、Q128：全部輸入逐句一致（ext_c19_輸出.json 之 all_inputs）", ""]
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
    if v.get("rule") and "e75Equivalent" in v:
        e = v["e75Equivalent"]
        got += f"；{v['rule']}；E75 之補丁於此設定下：記未執行 {e['notRun']}、全數抓到欄 {e['allCaught']}、無法啟動之設定 {e['launchFailureSettings']}、錯誤訊息「{e['error']}」"
    elif v.get("rule"):
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
      "c17 之頁面改寫使 E133～E135 與 X14 之補丁原字串改變：白話說明改為逐代碼之 PLAIN_BY_CODE，E133（第十四類改 plain_co）、E134（第九類加 plain_co）、E135（HZ07011 只附一類：第五類附 plain_sa）改以 PLAIN_BY_CODE 為之；X14 改為兩類並列不附 plain_dual；意旨不變。", "",
      "c18（驗證表 v1_17）新增之補丁：E156 build.py 於建置停止時仍對 index.html 寫入（附加一行註解）；E157 建置停止之註明（STOP_NOTE）改為空字串；E158 刪「（3）名單之代碼列於兩類」之停止條件；"
      "E159 PLAIN_BY_CODE 之 D201011 改回 plain_sa；E160 CLOSERS 增左彎引號「“」「‘」；E161 為判定方式二十八之自檢：E75 之補丁（刪 pageshow 之 details 收合）加完整 Chromium 啟用往返快取之設定於啟動時拋錯，抓到＝E75 記未執行並附錯誤訊息（不記未抓到）。"
      "E155 依驗證表 v1_17 之判準文字：抓到＝該設定之判定為未執行且錯誤訊息含「判定方式二十七之自檢」，Q107 列之結果不單獨構成抓到。E151～E153 之舊值仍自 tools 2b6e7f0 之工具頁取出（改版前之版本改為 04b3761）。", ""]
L += ["c19（驗證表 v1_18）新增之補丁：E162 頁尾免責句換為 disclaimer_old；E163 頁尾收合列之 summary 換為 basis_title_old；E164 刪隱私句之 p；E165 預約之 ↗ span 刪除、改以 .sy-book-btn::after 呈現；"
      "E166 刪看全部工具連結；E167 列印規則回 c18 之 .btn-primary、.sy-book-btn（看全部工具照印）；E168 build.py 之「列於兩類而非第五、七類」只於同一類列兩次時停止（[2, 9] 不停止）；"
      "E169 build.py 之多類判定改以集合去重（[9, 9] 不停止）；E170 build.py 刪「--test-inject 無值即中止」並回 c18 之參數讀法（無值時照常建置）；E171 注入未觸發停止時改為不經 abort 直接結束（stderr 不附註明句）。"
      "c19 之頁面改寫使 E18（預約連結含 ↗ 之 span）、E44（免責句之 class 改 sy-disclaimer）、E76、E108（列印規則增 .sy-book-row、.sy-view-all）之補丁原字串改變，依 c19 原文改寫，意旨不變。", ""]
L += ["c20（驗證表 v1_19）新增之補丁：E172 看全部工具之 ↗ span 刪除、改以 .site-foot .sy-view-all::after 呈現；E173 .sy-book-row 加 align-self:flex-start（期望 Q138 之外殼 F02 未通過，另記其他列之交叉失敗，見下段）；"
      "E174 顯名之 p 移回候選區（section#results）之後、頁尾之前（回 v1_18）；E175 顯名之 p 移至頁尾收合列 ol 之後（basis_item_4 之後）。"
      "c20 之頁面改寫（顯名移入頁尾收合列）未改動既有補丁之原字串：E47（顯名移至版本行之後）、X15、X18（於顯名之前植入）照原補丁執行；X15、X18 之植入點因而隨顯名位於收合列內，其意旨（外部圖檔、水平溢出）之檢出見各該列結果。", ""]
e173 = d["deliberate_errors"].get("E173", {})
if e173.get("mustCatch"):
    m = e173["mustCatch"]
    L += [f"E173 之 F02：{m.get('F02')}；F02 不符樣本：{json.dumps(m.get('F02不符樣本'), ensure_ascii=False)[:600]}；其他列之交叉失敗：{'、'.join(m.get('其他列之交叉失敗') or []) or '無'}（扣除受測頁本身即未通過之列後：{'、'.join(m.get('其他列之交叉失敗_扣除受測頁本身即未通過之列') or []) or '無'}）", ""]
q138e = {k: v["Q138"] for k, v in d["deliberate_errors"].items() if v.get("Q138")}
if q138e:
    L += ["應抓 Q138 之刻意錯誤，Q138 相對受測頁新增之未通過列（受測頁本身之 Q138 即有未通過之列，Q138 未通過不單獨構成檢出證據）：" + "；".join(f"{k}：{'、'.join(v['相對受測頁新增之未通過列']) or '無'}" for k, v in q138e.items()), ""]
nc = [k for k, v in d["deliberate_errors"].items() if v.get("allCaught") is False]
L += [f"未全數抓到之刻意錯誤：{nc or '無'}", ""]

pre = d["pre_revision"]
L += ["## 五、改版前之版本（tools 64b2966 之工具頁，c19；派工：以 64b2966 之頁面跑驗證表 v1_19 改動之列〔Q42、Q63、Q72、Q73、Q123、Q125、Q137〕，Q137 以 64b2966 之 build.py 跑）", "",
      "派工寫明照記判定，本節不判與期望相符與否。", ""]
if "rows" in pre:
    L += [f"受驗檔：{pre['page']['commit']}:business-items/index.html（SHA-256 {pre['page']['sha256']}）", "",
          "| 列號 | 結果 | 驗證表之期望 | 與期望相符 |", "|---|---|---|---|"]
    for r, v in pre["rows"].items():
        exp = "須判未通過" if r in pre["expectFail"] else "應判通過" if r in pre.get("expectPass", []) else "驗證表未列，照記" if r in pre["passAsRecorded"] else ""
        match = (v["result"] == "未通過") if r in pre["expectFail"] else (v["result"] == "通過") if r in pre.get("expectPass", []) else "（照記）"
        if r == "Q107" and isinstance(v["detail"], dict):
            exp += "；" + q107brief(v["detail"])
        if r != "Q107" and v["result"] != "通過":
            exp += "；明細：" + json.dumps(v["detail"], ensure_ascii=False)[:500].replace("|", "｜").replace("\n", " ")
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

L += ["## 七、Q81 截圖", "", ("本批全部重產（不增張數；c20 之顯名移入頁尾收合列，其位置改變屬預期）" if d.get("screenshots_regenerated") else "本批未重產") + "；verify/screenshots/：" + "、".join(d["screenshots"]), ""]
sp = os.path.join(RES, "外殼v1_2_Q138.json")
if os.path.exists(sp):
    S = json.load(open(sp, encoding="utf-8"))
    def cell(v):
        det = v.get("detail")
        if v.get("result") == "不適用":
            return v.get("reason", "")
        if isinstance(det, dict):
            for k in ("不符數", "量測組數"):
                pass
            t = []
            if "量測組數" in det:
                t.append(f"量測 {det['量測組數']} 組（尺寸×狀態）")
            if det.get("不符"):
                t.append(f"不符 {det.get('不符數', len(det['不符']))} 組，例：" + json.dumps(det["不符"][:2], ensure_ascii=False)[:300])
            for k in ("說明", "期望六乙", "人工證據", "記錄方式"):
                if det.get(k):
                    t.append(f"{k}：{det[k]}")
            if not t:
                t.append(json.dumps(det, ensure_ascii=False)[:300])
            return "；".join(t).replace("|", "｜").replace("\n", " ")
        return json.dumps(det, ensure_ascii=False)[:300].replace("|", "｜")
    W = ["# 營業項目查詢｜外殼驗證表 v1_2 之逐列結果（驗證表 v1_19 Q138）", "",
         f"- 外殼驗證表：{S['外殼驗證表']}", f"- 受測頁：SHA-256 {S['受測頁']['sha256']}（{S['受測頁']['from']}）", f"- 比對基準：{S['比對基準']}（規格 v1_22 第十一節之 6；開發中頁 v0.2.0 不作基準；R02 之基準依本工具驗證表 v1_19 判定方式三十一為規格 v1_22 之收合列內文）",
         f"- 尺寸：寬 320、360、390、768、980、981、1024、1280、1440 × 高 600、639、640、768、900，另 1440×900 之縮放 110％、125％（CSS 視窗 1309×818、1152×720 加 deviceScaleFactor）；狀態：初始、輸入後、結果、顯示全部、查無",
         f"- Firefox：{json.dumps(S['Firefox'], ensure_ascii=False)}", f"- 補填：knowledge {S['補填commit']}", f"- Q138 之判定：{S['Q138結果']}", "",
         "## 一、新版（受測頁）", "", "| 外殼表列 | 結果 | 尺寸與狀態、證據摘要 |", "|---|---|---|"]
    for k, v in S["新版"].items():
        W.append(f"| {k} | {v['result'] if v['result'] != '不適用' else '射程標記：不適用'} | {cell(v)} |")
    W += ["", "射程標記「不適用」之列（外殼表表頭：不適用不是判定值，是射程標記）：", ""]
    for k, r in S["射程標記不適用"].items():
        W.append(f"- {k}：{r}")
    O = S["舊版回測"]
    W += ["", "## 二、舊版回測（a47269e）", "", f"R02 之基準：{O.get('R02之基準', '')}", "", f"static_precheck.py 對 a47269e 重抽之預期未通過清單：{'、'.join(O['預期未通過清單_static_precheck重抽'] or []) or O.get('重抽錯誤')}", "",
          f"預期未通過而舊版報通過之列：{O['預期未通過而舊版報通過'] or '無'}", "", "| 外殼表列 | 舊版結果 | 預期未通過 | 證據摘要 |", "|---|---|---|---|"]
    ex = set(O["預期未通過清單_static_precheck重抽"] or [])
    for k, v in O["rows"].items():
        W.append(f"| {k} | {v['result']} | {'是' if k in ex else ''} | {cell(v)} |")
    W += ["", "## 三、錯誤案例（外殼表第十五節；受測工具一律為營業項目查詢）", "", "| 案例 | 植錯 | 須報未通過之列（結果） | 全部未通過列 | 未預期之交叉失敗 | 判定 |", "|---|---|---|---|---|---|"]
    for k, v in S["錯誤案例"].items():
        got = "、".join(f"{r}：{x}" for r, x in (v.get("各列結果") or {}).items()) or "、".join(v["須報未通過之列"])
        W.append(f"| {k} | {v['植錯']} | {got} | {'、'.join(v.get('全部未通過列') or [])} | {'、'.join(v.get('未預期之交叉失敗') or []) or '無'} | {v['result']}{'：' + (v.get('reason') or v.get('說明') or '') if v.get('reason') or v.get('說明') else ''} |")
    W += ["", f"受測頁本身即未通過之外殼表列（c20）：{'、'.join(k for k, v in S['新版'].items() if v['result'] == '未通過') or '無'}；各案之「未預期之交叉失敗」已扣除此等列；所列之列全在此等列中者，判定欄註明不作檢出證據。"]
    W += ["", "植錯位置：一律為 index.html（以施作完成之頁面為底只改一處；補丁見 shell_v1_2.js 之 ZCASES）；畫面狀態與尺寸：每案執行全部適用列之全部狀態與尺寸。未預期之交叉失敗只記錄，不作所列列之獨立檢出證據（外殼表第十五節）。", "",
          "## 四、外殼表與本工具驗證表期望之比較（判定方式二十九：以外殼表為準）", "", "| 外殼列 | 本表列 | 不同之處 | 處理 |", "|---|---|---|---|"]
    for c in S["與本工具驗證表期望之比較"]:
        W.append(f"| {c['外殼列']} | {c['本表列']} | {c['不同']} | {c['依判定方式二十九']} |")
    open(os.path.join(RES, "外殼v1_2_Q138.md"), "w", encoding="utf-8", newline="\n").write("\n".join(W) + "\n")
open(os.path.join(RES, "執行紀錄.md"), "w", encoding="utf-8", newline="\n").write("\n".join(L))
print("ok", [r for r in prog if r not in caught])
