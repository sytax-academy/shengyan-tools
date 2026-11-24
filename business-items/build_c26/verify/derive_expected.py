#!/usr/bin/env python3
"""derive_expected.py：Q186、Q213 之期望值，獨立自 D5、D6、頁面內嵌 data-codes 與 p2-data，依規格 v1_33 第四十八節第二項串接規則與第三項拘46 推導。
不 import build_p3.py，亦不讀 p3_data.json。用法：python3 -I derive_expected.py D5.xls D6.csv index.html out_expected.json"""
import sys, re, csv, json, unicodedata, xlrd
d5, d6, pg, out = sys.argv[1:5]

# ---- D5：第 1 至 4 列（索引 0～3）為表頭
sh = xlrd.open_workbook(d5).sheet_by_index(0)
def txt(x): return str(int(x)) if isinstance(x, float) else str(x).strip()
rows = [[txt(x) for x in sh.row_values(i)] for i in range(4, sh.nrows)]
isnum = sum(1 for i in range(4, sh.nrows) for x in sh.row_values(i)[10:15] if isinstance(x, float))
codepat = re.compile(r"[A-Z][A-Z0-9]\d{5}")
owner = []          # 每列之所屬代碼，None 為標題列或其續列
cur = None
for v in rows:
    if codepat.fullmatch(v[3]): cur = v[3]
    elif v[0] or v[1] or v[2] or v[3]: cur = None
    owner.append(cur)
taxrows = [i for i, v in enumerate(rows) if v[10] or v[11] or v[12] or v[13]]
handled = [i for i in taxrows if owner[i]]
unh = [i for i in taxrows if not owner[i]]
names5 = {v[3]: v[4] for v in rows if codepat.fullmatch(v[3])}
codes5 = [c for c in names5 if names5[c] != "(空號)"]
fine = {c: [] for c in codes5}; up = {c: [] for c in codes5}
for i in handled:
    c = owner[i]; v = rows[i]
    if c not in fine: continue
    if v[13]:
        if v[13] not in fine[c]: fine[c].append(v[13])
    else:
        lv, cd = ("大類", v[10]) if v[10] else ("中類", v[11]) if v[11] else ("小類", v[12])
        if (lv, cd) not in up[c]: up[c].append((lv, cd))

# ---- D6
d6rows = list(csv.DictReader(open(d6, encoding="utf-8")))
levelname = {(r["層級"], r["編號"]): r["行業名稱"] for r in d6rows}
subs = [(r["編號"].replace("-", ""), r["行業名稱"], [t for t in r["對照第8次修訂分類編號"].split() if t != "增訂"]) for r in d6rows if r["層級"] == "子類"]
name9 = {c: n for c, n, _ in subs}

def candidates(t8):
    plain = {c for c, _, ts in subs if any(not t.endswith("*") and t[:4] == t8 for t in ts)}
    starred = {c for c, _, ts in subs if any(t.endswith("*") and t[:4] == t8 for t in ts)}
    full = set(plain) | {c for c in starred if c[:4] == t8}
    part = {c for c in starred if c[:4] != t8 and c not in full}
    if not full and part: full, part = part, set()
    return full, part

exp = {}
for c in codes5:
    if fine[c]:
        F, P = set(), set()
        for t8 in fine[c]:
            f, p = candidates(t8); F |= f; P |= p
        P -= F
        exp[c] = {"c": sorted(F), "p": sorted(P), "u": None}
    elif up[c]:
        assert len(up[c]) == 1
        lv, cd = up[c][0]
        exp[c] = {"c": sorted(k for k, _, _ in subs if k.startswith(cd)), "p": [], "u": [lv, cd, levelname[(lv, cd)]]}
    else:
        exp[c] = {"c": [], "p": [], "u": None}

# ---- 頁面資料：D1 名稱與第二期家數
s = open(pg, encoding="utf-8").read()
d1 = json.loads(re.search(r'id="data-codes">(.*?)</script>', s, re.S).group(1))
p2 = json.loads(re.search(r'id="p2-data">(.*?)</script>', s, re.S).group(1).replace("<\\/", "</"))
def cnt(k):
    n = [p2["g"][g][k][0] for g in ("company", "firm") if k in p2["g"][g]]
    return sum(n) if n else -1
d1names = {r[0]: r[1] for r in d1}
assert set(d1names) == set(codes5), (len(set(d1names) ^ set(codes5)))

def nk(x): return unicodedata.normalize("NFKC", x)
def order(code, text_rest):
    """拘46：text_rest 為輸入中代碼以外之文字（NFKC 後）。回傳 (完整, 部分) 排序後之代號串列。"""
    words = []
    for w in re.split(r"[\s,，、]+", nk(text_rest)):
        w = re.sub(r"業$", "", w)
        if w and w not in words: words.append(w)
    base = re.sub(r"業$", "", nk(d1names[code]))
    frags = []
    for i in range(len(base) - 1):
        t = base[i:i + 2]
        if re.search(r"[、,()\s]", t) or t in frags: continue
        frags.append(t)
    def key(k):
        n9 = nk(name9[k])
        return (-sum(1 for w in words if w in n9), -sum(1 for t in frags if t in n9), -cnt(k), k)
    e = exp[code]
    return sorted(e["c"], key=key), sorted(e["p"], key=key)

orders = {}
for code in codes5: orders[code] = list(order(code, ""))
extra = {"F114030 機車": ("F114030", "機車"), "F206020 美容 美容": ("F206020", "美容 美容"), "A101030 茶": ("A101030", "茶"), "F501030、手搖": ("F501030", "、手搖")}
for k, (c, t) in extra.items(): orders[k] = list(order(c, t))
ncand = sum(1 for e in exp.values() if e["c"] or e["p"])
res = {"codes": len(codes5), "with_candidates": ncand, "without": sorted(c for c, e in exp.items() if not (e["c"] or e["p"])),
       "partial_total": sum(len(e["p"]) for e in exp.values()), "partial_codes": sum(1 for e in exp.values() if e["p"]),
       "tax_rows": len(taxrows), "handled": len(handled), "unhandled": len(unh), "numeric_tax_cells": isnum,
       "exp": exp, "orders": orders, "name9": {k: name9[k] for e in exp.values() for k in e["c"] + e["p"]},
       "zero": sorted({k for e in exp.values() for k in e["c"] + e["p"] if cnt(k) < 0}),
       "zero_positions": sum(1 for e in exp.values() for k in e["c"] + e["p"] if cnt(k) < 0),
       "cnt": {k: cnt(k) for e in exp.values() for k in e["c"] + e["p"]}}
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print({k: res[k] for k in ("codes", "with_candidates", "without", "partial_total", "partial_codes", "tax_rows", "handled", "unhandled", "numeric_tax_cells", "zero", "zero_positions")})
