#!/usr/bin/env python3
"""自 verify/results/結果.json 產生 verify/results/執行紀錄.md（不手抄結果）。
用法（自 repo 根目錄）：python3 -I business-items/build/verify/make_record.py
"""
import json
import os

V = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(V, "results", "結果.json"), encoding="utf-8"))
L = ["# 營業項目查詢（business-items）驗證執行紀錄", "",
     "- 驗證表：《營業項目查詢工具_驗證表》v1_6（knowledge 68605af）期別一 76 列（工具頁 70、開發中頁 6）",
     f"- 受驗檔：business-items/index.html（SHA-256 {d['tool_sha256']}）、business-items/dev/index.html（SHA-256 {d['dev_sha256']}）",
     "- 環境：Chromium 無頭（Playwright）；頁面以本機 http 伺服器提供，上一頁返回以同源測試頁 /other.html 代替 sytaxes.com（判定方式十）",
     "- 程式：business-items/build/verify/verify.js；本檔由 make_record.py 自 results/結果.json 產生", "",
     "## 一、結果計數", "",
     f"通過 {d['count']['通過']}、未通過 {d['count']['未通過']}、未執行 {d['count']['未執行']}（合計 {sum(d['count'].values())}）", "",
     f"驗證表列號與腳本輸出列號之差集：表有而腳本無 {d['row_ids_missing_vs_table']}；腳本有而表無 {d['extra_ids']}", "",
     "## 二、逐列", "", "| 列號 | 結果 | 摘要 |", "|---|---|---|"]
for k, v in d["rows"].items():
    det = v["detail"] if isinstance(v["detail"], str) else ""
    if k == "Q107":
        det = "Chromium：重新整理與上一頁返回均清空、autocomplete 均為 off、儲存寫入 0（" + ("通過" if v["detail"]["chromium"]["ok"] else "未通過") + "）；Firefox、WebKit 未安裝，三引擎未齊，記未執行"
    L.append(f"| {k} | {v['result']} | {det} |")
L += ["", "## 三、刻意錯誤版", "", "| 編號 | 應抓到之列 | 各列結果 | 全數抓到 |", "|---|---|---|---|"]
for k, v in d["deliberate_errors"].items():
    got = "、".join(f"{r}：{x}" for r, x in v.get("got", {}).items()) or v.get("error", "")
    L.append(f"| {k} | {'、'.join(v['expect'])} | {got} | {'是' if v.get('allCaught') else '否'} |")
caught = {}
for k, v in d["deliberate_errors"].items():
    for r in v.get("caught", []):
        caught.setdefault(r, []).append(k)
prog = [r for r, v in d["rows"].items() if not (isinstance(v["detail"], str) and v["result"] == "未執行")]
L += ["", f"可程式判定列中，無任何刻意錯誤版使之判未通過者：{[r for r in prog if r not in caught]}", "",
      "X01～X21 為本會話補充之刻意錯誤（驗證表 E01～E54 未涵蓋之可程式判定列各至少一個）。", "",
      "## 四、改版前之版本", "", "```", json.dumps(d["pre_revision"], ensure_ascii=False, indent=1), "```", "",
      "## 五、逐列明細", "", "見 results/結果.json 之 rows.〔列號〕.detail。", ""]
open(os.path.join(V, "results", "執行紀錄.md"), "w", encoding="utf-8", newline="\n").write("\n".join(L))
print("ok", [r for r in prog if r not in caught])
