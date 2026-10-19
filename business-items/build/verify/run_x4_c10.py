"""Q80、Q99、Q127：以 c10 之 business-items/index.html 實跑 🛠️ 對照組（驗證表 v1_7）。
以 knowledge inbox/工具十三/X4判定/run_x4.py（dc370a4 之 X4 判定所用；SHA-256 dab2be2d…8d66）為底另存，改動如下：
  一、讀出全部列：得分列與同類補列（規格 v1_11 拘39；.cand 與 .cand-sib），含按「顯示全部」後之列；
      前 30 列依頁面顯示順序計（得分列在前、補列在後，驗證表判定方式十六）。
  二、可讀第二組（Q127，20 則）；對照組檔以 SHA-256 核對，不符即中止。
  三、輸出彙總：涵蓋比例（計入與不計入 ZZ99999）、每則明細；Q99 之未命中說法表之例與「說法對到而內部版未列」清單。
  四（c15，驗證表 v1_14）：頁面無組織型態（規格 v1_17 拘13），查詢不選組織型態；對照組之組織型態欄只照錄於輸出，不操作頁面。
本程式只報數字，不作判定（Q80、Q99、Q127 為人工列，交使用者）。
用法（自 repo 根目錄）：python3 -I business-items/build/verify/run_x4_c10.py 〔對照組 md〕 〔index.html〕 〔輸出 json〕 〔列號標示，如 Q80Q99 或 Q127〕
需要：python 之 playwright（Chromium）。頁面以本機 http 伺服器提供，不連外網。
"""
import functools
import hashlib
import http.server
import json
import os
import re
import sys
import threading

from playwright.sync_api import sync_playwright

KNOWN = {  # 對照組檔之 SHA-256 → (名稱, 則數)；驗證表 v1_7 Q80（dc370a4）、Q127（9f7905b）
    "f996ec0ecc70c53132097a6eb439b131782b8fce371d1bebe8d7d3508798d93f": ("營業項目查詢_對照組_v1_0.md（X4，dc370a4）", 40),
    "f7a96550f5506d987b659081189db5fa9e498b3a171293347ced18d914786cb5": ("營業項目查詢_對照組_第二組_v1_0.md（9f7905b）", 20),
}
TOP = 30

x4_path, html_path, out_path, label = sys.argv[1:5]
x4_bytes = open(x4_path, "rb").read()
x4_sha = hashlib.sha256(x4_bytes).hexdigest()
if x4_sha not in KNOWN:
    sys.exit(f"對照組檔之 SHA-256 不在已知清單：{x4_sha}")
x4_name, n_expect = KNOWN[x4_sha]
html_sha = hashlib.sha256(open(html_path, "rb").read()).hexdigest()

rows = []
for line in x4_bytes.decode("utf-8").splitlines():
    m = re.match(r"^\| (\d+) \| (.+?) \| (獨資|合夥|有限公司|股份有限公司|有限合夥|未定) \| (.+) \|$", line)
    if not m:
        continue
    cells = [c.strip() for c in m.group(4).split(" | ")]
    assert len(cells) == 11, (m.group(1), len(cells))
    cands = [c.split(" ", 1)[0] for c in cells[:10]]
    assert all(re.fullmatch(r"[A-Z]{1,2}[0-9A-Z]{5,6}", c) for c in cands), cands
    assert cells[10] == "待使用者裁定"
    rows.append({"no": int(m.group(1)), "desc": m.group(2), "org": m.group(3), "internal": cands})
assert [r["no"] for r in rows] == list(range(1, n_expect + 1)), f"應為 {n_expect} 則"

d = os.path.dirname(os.path.abspath(html_path)); fn = os.path.basename(html_path)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


H = functools.partial(Quiet, directory=d)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{srv.server_address[1]}/{fn}"

with sync_playwright() as p:
    b = p.chromium.launch()
    for r in rows:
        pg = b.new_page()
        pg.goto(url)
        pg.fill("#biz", r["desc"])
        pg.click("#searchBtn")
        btn = pg.query_selector("#showAll")
        r["show_all_btn"] = btn.text_content() if btn else None
        if btn:
            btn.click()
        r["web"] = pg.eval_on_selector_all("#results .cand", """els => els.map(e => {
            const t = s => { const x = e.querySelector(s); return x ? x.textContent : null; };
            return {code: e.dataset.code, name: t('.cand-name'), tag: t('.phrase-tag'), sibling: e.classList.contains('cand-sib')}; })""")
        r["results_text_head"] = pg.inner_text("#results")[:300]
        pg.close()
    b.close()
srv.shutdown()

for r in rows:
    pos = {c["code"]: i + 1 for i, c in enumerate(r["web"])}
    r["n_scored"] = sum(1 for c in r["web"] if not c["sibling"])
    r["n_sibling"] = sum(1 for c in r["web"] if c["sibling"])
    r["internal_rank_in_web"] = {c: pos.get(c) for c in r["internal"]}
    r["internal_in_top30_by_sibling"] = [c for c in r["internal"] if pos.get(c) and pos[c] <= TOP and r["web"][pos[c] - 1]["sibling"]]
    r["hit30_all10"] = sum(1 for c in r["internal"] if pos.get(c) and pos[c] <= TOP)
    r["hit30_excl_zz"] = sum(1 for c in r["internal"] if c != "ZZ99999" and pos.get(c) and pos[c] <= TOP)
    r["n_internal_excl_zz"] = sum(1 for c in r["internal"] if c != "ZZ99999")
    r["tagged"] = [(c["code"], c["tag"], pos[c["code"]]) for c in r["web"] if c["tag"]]
    r["tagged_not_internal"] = [t for t in r["tagged"] if t[0] not in r["internal"]]

n_all = sum(len(r["internal"]) for r in rows)
n_ex = sum(r["n_internal_excl_zz"] for r in rows)
h_all = sum(r["hit30_all10"] for r in rows)
h_ex = sum(r["hit30_excl_zz"] for r in rows)
h_sib = sum(len(r["internal_in_top30_by_sibling"]) for r in rows)
untagged = [r["no"] for r in rows if not r["tagged"]]
summary = {
    "label": label,
    "control_group": x4_name, "control_group_sha256": x4_sha, "cases": len(rows),
    "page": os.path.relpath(html_path), "page_sha256": html_sha,
    "method": "內部版前 10 名中出現在網頁版前 30 列（得分列加補列，依頁面顯示順序）者；按「顯示全部」後讀出全部列",
    "coverage_incl_zz": {"hit": h_all, "total": n_all, "ratio": round(h_all / n_all, 4)},
    "coverage_excl_zz": {"hit": h_ex, "total": n_ex, "ratio": round(h_ex / n_ex, 4)},
    "hits_via_sibling_rows": h_sib,
    "zz99999_hits": sum(1 for r in rows if r["internal_rank_in_web"].get("ZZ99999") and r["internal_rank_in_web"]["ZZ99999"] <= TOP),
    "per_case": [{"no": r["no"], "org": r["org"], "hit30_all10": r["hit30_all10"], "hit30_excl_zz": r["hit30_excl_zz"],
                  "n_scored": r["n_scored"], "n_sibling": r["n_sibling"], "tagged_codes": [t[0] for t in r["tagged"]],
                  "missed": [c for c in r["internal"] if not (r["internal_rank_in_web"].get(c) and r["internal_rank_in_web"][c] <= TOP)]}
                 for r in rows],
    "q99_untagged_cases": untagged,
    "q99_untagged_ratio": round(len(untagged) / len(rows), 4),
    "q99_tagged_not_internal": [{"no": r["no"], "code": t[0], "tag": t[1], "rank": t[2]} for r in rows for t in r["tagged_not_internal"]],
}
json.dump({"summary": summary, "rows": rows}, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in summary.items() if k not in ("per_case",)}, ensure_ascii=False))
