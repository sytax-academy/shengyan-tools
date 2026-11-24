#!/usr/bin/env python3
"""公開 repo 推送前清單檢查（c26；自 build_c25/prepush_check_c25.py 改：可改範圍為 business-items/build_c26/，並增 c26 檢查）
用法（自 repo 根目錄）：python3 -I business-items/build_c26/prepush_check_c26.py 〈開工 commit〉 〈規格 v1_33.md〉 [〈受驗 commit，預設 HEAD〉] [--allow-deployment]
檢查：
  一、開工 commit..受驗 commit 之改動路徑只在 business-items/index.html、business-items/README.md、business-items/build_c26/ 之下（合入批另許 DEPLOYMENT.md）；無 .xls 檔。
  二、受驗 commit 之樹中，頂層目錄只為 DEPLOYMENT.md 登錄為「免費」之工具目錄與 docs/。
  三、會員頁目錄名：改動路徑不含；免費頁全文不含；他檔只得出現於 p2_member_url 之內。
  四、免費頁 p2-data 每組最多 20 項。
  五、c26：頁面 ≤ 1,000,000 位元組；tool-version 與版本行為 v1.5.0 且不含 v1.4.0；規格附錄 A 之 p2_/p3_/version 鍵字樣逐字出現於頁面；
      第一期 search 函式本體、data-codes、data-phrases 與開工 commit 之 v1.4.0 逐位元組相同；內嵌 p3-data 與 build_c26/p3_data.json 相同。
結果：0＝全數通過；1＝任一不通過。本程式不含會員頁目錄名之字面（以拼接產生）。"""
import json, re, subprocess, sys, hashlib

args = [a for a in sys.argv[1:] if not a.startswith("--")]
allow_dep = "--allow-deployment" in sys.argv
start, specp = args[0], args[1]; head = args[2] if len(args) > 2 else "HEAD"
git = lambda *a: subprocess.run(["git", *a], capture_output=True, check=True).stdout
bad = []
changed = [p for p in git("diff", "--name-only", f"{start}..{head}").decode("utf-8").split("\n") if p]
ok_scope = lambda p: p in ("business-items/index.html", "business-items/README.md") or p.startswith("business-items/build_c26/") or (allow_dep and p == "DEPLOYMENT.md")
out = [p for p in changed if not ok_scope(p)]
if out: bad.append(f"一、範圍外之改動路徑：{out}")
xls = [p for p in git("ls-tree", "-r", "--name-only", head).decode("utf-8").split("\n") if p.lower().endswith((".xls", ".xlsx"))]
if xls: bad.append(f"一、樹中含 Excel 檔：{xls}")
dep = git("show", f"{head}:DEPLOYMENT.md").decode("utf-8")
free = set(re.findall(r"^\| ([A-Za-z0-9-]+) \|[^\n]*\| 免費 \|", dep, re.M))
dirs = {l.split("\t", 1)[1] for l in git("ls-tree", head).decode("utf-8").split("\n") if l and l.split()[1] == "tree"}
extra = sorted(d for d in dirs if d not in free and d != "docs")
if extra: bad.append(f"二、未登錄為免費之頂層目錄：{extra}")
MEMBER_DIR = "business-items" + "-" + "full"
URL = "https://sytaxes.com/tools/" + MEMBER_DIR + "/"
for p in changed:
    if p != "DEPLOYMENT.md" and (MEMBER_DIR in p or re.search(r"full|完整彙總", p)): bad.append(f"三、路徑含會員頁目錄名或完整彙總：{p}")
hits = {}
for p in [p for p in git("ls-tree", "-r", "--name-only", head).decode("utf-8").split("\n") if p and p != "DEPLOYMENT.md"]:
    n = git("show", f"{head}:{p}").decode("utf-8", "replace").replace(URL, "").count(MEMBER_DIR)
    if n: hits[p] = n
if hits: bad.append(f"三、於 p2_member_url 以外含會員頁目錄名：{hits}")
pageb = git("show", f"{head}:business-items/index.html"); page = pageb.decode("utf-8")
old = git("show", f"{start}:business-items/index.html").decode("utf-8")
if MEMBER_DIR in page: bad.append("三、免費頁含會員頁目錄名")
m = re.search(r'<script type="application/json" id="p2-data">(.*?)</script>', page, re.S)
pm = max((len(a) - 1) // 2 for g in json.loads(m.group(1))["g"].values() for a in g.values())
if pm > 20: bad.append(f"四、p2-data 每組最多項數 {pm} > 20")
# 五
if len(pageb) > 1000000: bad.append(f"五、頁面 {len(pageb)} 位元組超過 1,000,000")
spec = open(specp, encoding="utf-8").read()
if hashlib.sha256(spec.encode("utf-8")).hexdigest() != "ba557422935ae139026b53bd6bb8005d44ff83fcd1207c6ae511a4a0ba7df2ce": bad.append("五、規格非 v1_33")
A = {}
for ln in spec[spec.index("## 附錄 A　逐字字樣"):spec.index("## 附錄 B　")].split("\n"):
    mm = re.match(r"^- ([A-Za-z0-9_]+)：「(.*)」$", ln)
    if mm: A[mm.group(1)] = mm.group(2)
import html
keys = [k for k in A if re.match(r"^(p3_|p2_lead$|p2_name_label$|p2_name_placeholder$|p2_note_not_items$|version_line$|tool_version$)", k)]
miss = [k for k in keys if not any(v in page for v in (A[k], html.escape(A[k], quote=False), html.escape(A[k]), json.dumps(A[k], ensure_ascii=False)[1:-1]))]
if miss: bad.append(f"五、字樣未逐字出現：{miss}")
p3s = json.loads(re.search(r'id="p3-str">(.*?)</script>', page, re.S).group(1).replace("<\\/", "</"))
wrong = [k for k in p3s if p3s[k] != A[k]]
if wrong or not set(p3s) <= set(A): bad.append(f"五、p3-str 與附錄 A 不符：{wrong}")
tv = re.search(r'<meta name="tool-version" content="([^"]*)"', page).group(1)
if tv != A["tool_version"] or "v1.4.0" in page or A["version_line"] not in html.unescape(page): bad.append(f"五、版號不符：{tv}")
def sect(t, a, b): i = t.index(a); return t[i:t.index(b, i)]
if sect(page, "function search(q){", "\nfunction card(row){") != sect(old, "function search(q){", "\nfunction card(row){"): bad.append("五、第一期 search 函式本體與 v1.4.0 不同")
for sid in ("data-codes", "data-phrases"):
    g = lambda t: re.search(rf'<script type="application/json" id="{sid}">(.*?)</script>', t, re.S).group(1).encode("utf-8")
    if g(page) != g(old): bad.append(f"五、{sid} 與 v1.4.0 不同")
emb = re.search(r'id="p3-data">(.*?)</script>', page, re.S).group(1).replace("<\\/", "</")
if emb != git("show", f"{head}:business-items/build_c26/p3_data.json").decode("utf-8"): bad.append("五、p3-data 與 build_c26/p3_data.json 不同")
print(f"改動路徑 {len(changed)} 個：{changed}")
print(f"免費目錄：{sorted(free)}；頂層：{sorted(dirs)}；頁面 {len(pageb)} 位元組 SHA-256 {hashlib.sha256(pageb).hexdigest()}")
print(f"附錄 A 檢查之鍵 {len(keys)} 個，未逐字出現 {len(miss)}；p3-str 鍵 {len(p3s)}；tool-version {tv}")
print("結果：" + ("全數通過" if not bad else "不通過：" + "；".join(bad)))
sys.exit(1 if bad else 0)
