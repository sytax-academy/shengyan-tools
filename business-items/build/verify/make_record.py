#!/usr/bin/env python3
"""自 verify/results/結果.json 與 x4_c10_*.json 產生 verify/results/執行紀錄.md（不手抄結果）。
用法（自 repo 根目錄）：python3 -I business-items/build/verify/make_record.py
"""
import json
import os

V = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(V, "results")
d = json.load(open(os.path.join(RES, "結果.json"), encoding="utf-8"))
x4 = {}
for lab, fn in (("Q80、Q99", "x4_c10_Q80Q99.json"), ("Q127", "x4_c10_Q127.json")):
    p = os.path.join(RES, fn)
    if os.path.exists(p):
        x4[lab] = (fn, json.load(open(p, encoding="utf-8"))["summary"])


def pct(x):
    return f"{x['hit']}／{x['total']}（{x['ratio'] * 100:.1f}%）"


def brief(v):
    det = v["detail"]
    if isinstance(det, str):
        return det.replace("\n", " ").replace("|", "｜")
    return ""


L = ["# 營業項目查詢（business-items）驗證執行紀錄（契約 c10）", "",
     f"- 驗證表：《營業項目查詢工具_驗證表》v1_7（knowledge 2891e40）期別一 89 列；規格 v1_11（契約 c10）",
     f"- 受驗檔：business-items/index.html（SHA-256 {d['tool_sha256']}）",
     f"- 期望值：business-items/build/ext_c10_輸出.json（SHA-256 {d['ext_sha256']}；ext_c10.py 之抽出，與規格同一 commit 凍結）",
     "- 環境：Chromium 無頭（Playwright 1.56，Chromium 141）；頁面以本機 http 伺服器提供，上一頁返回以同源測試頁 /other.html 代替 sytaxes.com（判定方式十）",
     f"- 測試模式旗標：{d['flags']['build_test_mode']}（Q02 依驗證表 v1_7 寫明；Q04 同）",
     "- 程式：business-items/build/verify/verify.js（`--spec 〔規格 v1_11〕 --spec-v1-10 〔規格 v1_10〕`）；Q80、Q99、Q127 為 run_x4_c10.py；本檔由 make_record.py 自 results/ 之 JSON 產生", "",
     "## 一、結果計數", "",
     f"通過 {d['count']['通過']}、未通過 {d['count']['未通過']}、未執行 {d['count']['未執行']}（合計 {sum(d['count'].values())}）", "",
     f"驗證表列號與腳本輸出列號之差集：表有而腳本無 {d['row_ids_missing_vs_table']}；腳本有而表無 {d['extra_ids']}", "",
     "不在 c10 射程（不執行、不記結果）：" + "、".join(d["out_of_scope"]) + "（開發中頁；驗證表 v1_7 第九之二節）", "",
     "## 二、逐列", "", "| 列號 | 結果 | 摘要（未通過與未執行列之原因；明細見 結果.json） |", "|---|---|---|"]
for k, v in d["rows"].items():
    det = brief(v)
    if k == "Q107":
        c1, c2 = v["detail"]["chromium_playwright_default"], v["detail"]["chromium_bfcache_enabled"]
        ps = lambda c: "、".join(f"persisted={x['persisted']}／navigation type={x['nav']}" for x in c.get("back", {}).get("pageshow", [])) if isinstance(c, dict) else ""
        det = (f"Chromium（Playwright 預設，停用往返快取）：{'通過' if c1.get('ok') else '未通過'}，上一頁返回之 pageshow：{ps(c1)}；"
               f"Chromium（完整版，啟用往返快取）：{'通過' if c2.get('ok') else '未通過'}，上一頁返回之 pageshow：{ps(c2)}；"
               "重新整理與返回均清空、依據說明收合、autocomplete 均為 off、儲存寫入 0。Firefox、WebKit 未執行（七題之七，115/10/23 後本機補跑），三引擎未齊，記未執行")
    elif v["result"] == "未通過" and not det:
        det = json.dumps(v["detail"], ensure_ascii=False)[:600].replace("|", "｜")
    L.append(f"| {k} | {v['result']} | {det} |")

ec = d["ext_candidates_compare"]
L += ["", "## 三、與 ext_c10_輸出.json 之 candidates 逐句比對", "",
      f"全部 {ec['inputs']} 句（得分列與順序、補列、phrase_tag 全文、查無代碼；逾 40 筆者比前 30 列與總數）：不一致 {len(ec['mismatches'])} 句。", ""]
for m in ec["mismatches"]:
    L.append(f"- {json.dumps(m, ensure_ascii=False)}")

L += ["", "## 四、刻意錯誤版", "", "| 編號 | 應抓到之列 | 各列結果 | 全數抓到 |", "|---|---|---|---|"]
for k, v in d["deliberate_errors"].items():
    if v.get("notRun"):
        L.append(f"| {k} | {'、'.join(v['expect'])} | 未執行：{v.get('error', '')} | － |")
        continue
    got = "、".join(f"{r}：{x}" for r, x in v.get("got", {}).items()) or v.get("error", "")
    L.append(f"| {k} | {'、'.join(v['expect'])} | {got} | {'是' if v.get('allCaught') else '否'} |")
caught = {}
for k, v in d["deliberate_errors"].items():
    for r in v.get("caught", []) or []:
        caught.setdefault(r, []).append(k)
prog = [r for r, v in d["rows"].items() if not (isinstance(v["detail"], str) and v["result"] == "未執行")]
L += ["", f"可程式判定列中，無任何刻意錯誤版使之判未通過者：{[r for r in prog if r not in caught]}", "",
      "X01～X21 為補充之刻意錯誤（驗證表 E 列未涵蓋之可程式判定列各至少一個；沿用 v1_6 執行時之設計，補丁依 c10 之頁面改寫）。", ""]

pre = d["pre_revision"]
L += ["## 五、改版前之版本（tools b43ef1c 之工具頁 v1.0.0，c9；驗證表 v1_7 第十節末段）", ""]
if "rows" in pre:
    L += [f"受驗檔：b43ef1c:business-items/index.html（SHA-256 {pre['page']['sha256']}）", "",
          "| 列號 | 結果 | 驗證表之期望 | 與期望相符 |", "|---|---|---|---|"]
    for r, v in pre["rows"].items():
        exp = "須判未通過" if r in pre["expectFail"] else "v1.0.0 已有之行為，判通過者照記" if r in pre["passAsRecorded"] else ""
        match = (v["result"] == "未通過") if r in pre["expectFail"] else "（照記）"
        if r == "Q107":
            c1 = v["detail"]["chromium_playwright_default"] if isinstance(v["detail"], dict) else {}
            c2 = v["detail"]["chromium_bfcache_enabled"] if isinstance(v["detail"], dict) else {}
            exp += f"；Chromium 兩種設定：{'通過' if c1.get('ok') else '未通過'}／{'通過' if c2.get('ok') else '未通過'}（Firefox、WebKit 未執行）"
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
          "", "| 則 | 組織型態 | 前 30 列命中（含 ZZ） | 不含 ZZ | 得分列 | 補列 | 標 phrase_tag 之代碼 | 未命中之內部版候選 |", "|---|---|---|---|---|---|---|---|"]
    for c in s["per_case"]:
        L.append(f"| {c['no']} | {c['org']} | {c['hit30_all10']} | {c['hit30_excl_zz']} | {c['n_scored']} | {c['n_sibling']} | {'、'.join(c['tagged_codes'])} | {'、'.join(c['missed'])} |")
    L += ["", f"- 未命中說法表之例（任一列皆無 phrase_tag）：{s['q99_untagged_cases'] or '無'}（比例 {s['q99_untagged_ratio'] * 100:.1f}%）",
          "- 說法對到而內部版未列：" + ("；".join(f"第 {x['no']} 則 {x['code']}「{x['tag']}」（第 {x['rank']} 列）" for x in s["q99_tagged_not_internal"]) or "無"), ""]
L += ["Q80 之註記（驗證表 v1_7）：第二批說法表取材自 X4 對照組（dc370a4），Q80 之數字偏樂觀，與 Q127（未用於起草第二批說法表）並列判讀。", ""]

L += ["## 七、Q81 截圖", "", "verify/screenshots/：" + "、".join(d["screenshots"]), ""]
open(os.path.join(RES, "執行紀錄.md"), "w", encoding="utf-8", newline="\n").write("\n".join(L))
print("ok", [r for r in prog if r not in caught])
