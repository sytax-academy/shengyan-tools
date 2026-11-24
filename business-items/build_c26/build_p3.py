#!/usr/bin/env python3
"""build_p3.py：營業項目代碼 → 稅務第 9 次修訂子類之串接資料建置（契約 c26；規格 v1_33 第四十八節第二項）。
用法：python3 -I build_p3.py 〈D5.xls〉 〈D5 SHA-256〉 〈D6.csv〉 〈D6 SHA-256〉 〈p3_data.json〉 〈p3_report.json〉
雜湊不符、讀取完整性不符（1,073 ≠ 1,055 + 18 等）一律中止。D5 原檔不入 repo（授權待確認）；本程式與輸出只含 D5 之稅務欄推導結果與 D6 子類名稱。"""
import sys, json, csv, re, hashlib, collections
import xlrd

d5, d5h, d6, d6h, out, rep = sys.argv[1:7]
def sha(p):
    with open(p, "rb") as f: return hashlib.sha256(f.read()).hexdigest()
if sha(d5) != d5h: sys.exit("中止：D5 雜湊不符")
if sha(d6) != d6h: sys.exit("中止：D6 雜湊不符")

CODE = re.compile(r"^[A-Z][A-Z0-9][0-9]{5}$")
def cell(v):
    if isinstance(v, float):
        assert v == int(v), v
        v = str(int(v))
    return str(v).strip()

sh = xlrd.open_workbook(d5).sheet_by_index(0)
numeric = 0
fine = collections.OrderedDict()     # 代碼 -> 稅務第 8 次細類（四碼，去重）
upper = collections.OrderedDict()    # 代碼 -> [(層級, 代碼, D5 名稱)]
codes = []                           # D5 之非空號代碼
empty_codes = []                     # D5 之空號代碼
cur = None
n_tax = n_done = 0
title_rows = []; cont_rows = []
for r in range(4, sh.nrows):         # 第 1 至 4 列為表頭，不計
    raw = sh.row_values(r)
    for x in raw[10:15]:
        if isinstance(x, float): numeric += 1
    v = [cell(x) for x in raw]
    is_code = bool(CODE.match(v[3]))
    is_title = (not is_code) and bool(v[0] or v[1] or v[2] or v[3])
    if is_code:
        cur = v[3]
        if cur not in fine:
            fine[cur] = []; upper[cur] = []
            if v[4] == "(空號)": empty_codes.append(cur)     # 空號列（稅務欄皆空）不計入營業項目代碼
            else: codes.append(cur)
    elif is_title:
        cur = None
    tax = v[10:15]
    if not any(tax[:4]): continue
    n_tax += 1
    if cur is None:                  # 標題列，及標題列之後、下一代碼列之前之無代碼列（視同標題列）
        (title_rows if is_title else cont_rows).append([r + 1] + [x for x in v[:5]] + tax)
        continue
    n_done += 1
    if tax[3]:
        assert re.match(r"^[0-9]{4}$", tax[3]), tax
        if tax[3] not in fine[cur]: fine[cur].append(tax[3])
    else:
        lv = "大類" if tax[0] else "中類" if tax[1] else "小類"
        code = tax[0] or tax[1] or tax[2]
        if (lv, code) not in [(a, b) for a, b, _ in upper[cur]]: upper[cur].append((lv, code, tax[4]))

for c in empty_codes:
    if fine[c] or upper[c]: sys.exit(f"中止：空號 {c} 有稅務欄")
n_head = len(title_rows) + len(cont_rows)
if n_tax != n_done + n_head: sys.exit(f"中止：稅務欄有值之列 {n_tax} ≠ 已處置 {n_done} ＋ 標題列 {n_head}")

rows = list(csv.DictReader(open(d6, encoding="utf-8")))
sub = [x for x in rows if x["層級"] == "子類"]
lvname = {(x["層級"], x["編號"]): x["行業名稱"] for x in rows}
full8 = collections.defaultdict(list); part8 = collections.defaultdict(list); t9 = {}
for x in sub:
    c = x["編號"].replace("-", ""); t9[c] = x["行業名稱"]
    for k in x["對照第8次修訂分類編號"].split():
        if k == "增訂": continue                     # 規則 4：「增訂」略過，其後之編號照用
        star = k.endswith("*"); k4 = k.replace("*", "")[:4]
        (part8 if star else full8)[k4].append(c)

m = {}; none_codes = []; upper_used = []; upper_ignored = []
for code in codes:
    if fine[code]:
        full, part = [], []
        for t8 in fine[code]:                        # 規則 5：逐細類判斷
            f = list(dict.fromkeys(full8.get(t8, [])))
            q = []
            for c in part8.get(t8, []):
                if c in f or c in q: continue
                (f if c[:4] == t8 else q).append(c)  # 同細類內拆分者就細類而言無「部分」可言
            if not f: f, q = q, []                   # 完整候選為空者，部分候選全數改列完整
            for c in f:
                if c not in full: full.append(c)
            for c in q:
                if c not in part: part.append(c)
        part = [c for c in part if c not in full]
        if upper[code]: upper_ignored.append([code, [list(u) for u in upper[code]]])
        rec = {"c": sorted(full), "p": sorted(part)}
    elif upper[code]:
        if len(upper[code]) != 1: sys.exit(f"中止：{code} 有多個上層列且無細類：{upper[code]}")
        lv, pre, _ = upper[code][0]
        if (lv, pre) not in lvname: sys.exit(f"中止：D6 無此層級代碼 {code} {lv} {pre}")
        cands = sorted(x["編號"].replace("-", "") for x in sub if x["編號"].replace("-", "").startswith(pre))
        rec = {"c": cands, "p": [], "u": [lv, pre, lvname[(lv, pre)]]}
        upper_used.append([code, lv, pre, lvname[(lv, pre)], len(cands)])
    else:
        rec = {"c": [], "p": []}
    if rec["c"] or rec["p"]: m[code] = rec
    else: none_codes.append(code)

n_part = sum(len(r["p"]) for r in m.values()); n_part_codes = sum(1 for r in m.values() if r["p"])
need = sorted({c for r in m.values() for c in r["c"] + r["p"]})
data = {"m": m, "t9": {c: t9[c] for c in need}}
with open(out, "w", encoding="utf-8", newline="\n") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
report = {
    "d5_sha256": d5h, "d6_sha256": d6h,
    "d5_codes": len(codes), "d5_empty_codes": len(empty_codes), "codes_with_candidates": len(m), "codes_without_candidates": len(none_codes), "codes_without_candidates_list": sorted(none_codes),
    "tax_rows": n_tax, "tax_rows_handled": n_done, "tax_rows_header_title": len(title_rows), "tax_rows_header_cont": len(cont_rows),
    "tax_rows_check": f"{n_tax} = {n_done} + {n_head}",
    "numeric_cells_tax_columns": numeric,
    "partial_candidates": n_part, "partial_candidate_codes": n_part_codes,
    "upper_used": upper_used, "upper_ignored": upper_ignored,
    "header_rows_skipped": title_rows + cont_rows,
    "t9_names": len(data["t9"]),
}
with open(rep, "w", encoding="utf-8", newline="\n") as f:
    json.dump(report, f, ensure_ascii=False, indent=1); f.write("\n")
exp = {"tax_rows": 1073, "tax_rows_handled": 1055, "header": 18, "numeric": 20, "codes": 790, "with": 778, "without": 12, "part": 62, "part_codes": 54}
got = {"codes": len(codes), "tax_rows": n_tax, "tax_rows_handled": n_done, "header": n_head, "numeric": numeric, "with": len(m), "without": len(none_codes), "part": n_part, "part_codes": n_part_codes}
print(json.dumps(got, ensure_ascii=False))
if got != exp: sys.exit(f"中止：與規格第二節第 7 項之實算不符：期望 {exp}")
print("通過：1,073 = 1,055 + 18；數值儲存格 20；有候選 778；無候選 12；部分候選 62 個分屬 54 個營業項目")
