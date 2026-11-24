#!/usr/bin/env python3
"""公開 repo 推送前清單檢查（c25；自 build_p2/verify/prepush_check_v130.py 改可改範圍為 business-items/build_c25/，其餘檢查不變）
自 prepush_check.py（c23e）改：項數上限 5 改 20（拘31、拘41，c24）；前 20 項資料檔 p2_top20.json 之路徑不視為完整彙總；
免費頁全文不得含會員頁目錄名（c24 起免費頁不連會員頁）；DEPLOYMENT.md 為登錄表，依 Q168 須記會員頁停用，其內容不在第三項之內容檢查。
用法（自 repo 根目錄）：python3 -I business-items/build_p2/verify/prepush_check_v130.py 〈開工 commit〉 [〈受驗 commit，預設 HEAD〉] [--allow-deployment]
  --allow-deployment：合入批（同一範圍另許 DEPLOYMENT.md）用；施作批不加。
檢查：
  一、開工 commit..受驗 commit 之改動路徑，只在 business-items/index.html、business-items/README.md、business-items/build_p2/ 之下（合入批另許 DEPLOYMENT.md）。
  二、受驗 commit 之樹中，頂層目錄只為 DEPLOYMENT.md 登錄為「免費」之工具目錄與 docs/。
  三、改動路徑不含會員頁目錄名與完整彙總字樣；受驗 commit 之全部檔（DEPLOYMENT.md 除外）內容中，會員頁目錄名只得出現在 p2_member_url 之內，且 business-items/index.html 全文不含之。
  四、免費頁內嵌資料與 p2_top20.json 任一代號任一組不多於 20 項；p2_top5.json（c23 歷史檔）不多於 5 項。
結束碼：0＝全數通過；1＝任一不通過。本程式不含會員頁目錄名之字面（以拼接產生）。"""
import json, re, subprocess, sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
allow_dep = "--allow-deployment" in sys.argv
start = args[0]; head = args[1] if len(args) > 1 else "HEAD"
git = lambda *a: subprocess.run(["git", *a], capture_output=True, check=True).stdout
bad = []
changed = [p for p in git("diff", "--name-only", f"{start}..{head}").decode("utf-8").split("\n") if p]
ok_scope = lambda p: p in ("business-items/index.html", "business-items/README.md") or p.startswith("business-items/build_c25/") or (allow_dep and p == "DEPLOYMENT.md")
out = [p for p in changed if not ok_scope(p)]
if out: bad.append(f"一、範圍外之改動路徑：{out}")
dep = git("show", f"{head}:DEPLOYMENT.md").decode("utf-8")
free = set(re.findall(r"^\| ([A-Za-z0-9-]+) \|[^\n]*\| 免費 \|", dep, re.M))
dirs = {l.split("\t", 1)[1] for l in git("ls-tree", head).decode("utf-8").split("\n") if l and l.split()[1] == "tree"}
extra = sorted(d for d in dirs if d not in free and d != "docs")
if extra: bad.append(f"二、未登錄為免費之頂層目錄：{extra}")
MEMBER_DIR = "business-items" + "-" + "full"
URL = "https://sytaxes.com/tools/" + MEMBER_DIR + "/"
for p in changed:
    if p == "DEPLOYMENT.md":
        continue
    if MEMBER_DIR in p or re.search(r"full|完整彙總", p): bad.append(f"三、路徑含會員頁目錄名或完整彙總：{p}")
allfiles = [p for p in git("ls-tree", "-r", "--name-only", head).decode("utf-8").split("\n") if p]
hits = {}
for p in allfiles:
    if p == "DEPLOYMENT.md":
        continue
    s = git("show", f"{head}:{p}").decode("utf-8", "replace")
    n = s.replace(URL, "").count(MEMBER_DIR)
    if n: hits[p] = n
if hits: bad.append(f"三、檔案內容於 p2_member_url 以外含會員頁目錄名：{hits}")
page = git("show", f"{head}:business-items/index.html").decode("utf-8")
if MEMBER_DIR in page: bad.append(f"三、免費頁含會員頁目錄名 {page.count(MEMBER_DIR)} 處")
def maxn(d): return max((len(a) - 1) // 2 for g in d["g"].values() for a in g.values())
m = re.search(r'<script type="application/json" id="p2-data">(.*?)</script>', page, re.S)
pm = maxn(json.loads(m.group(1).replace("<\\/", "</"))) if m else None
t20 = maxn(json.loads(git("show", f"{head}:business-items/build_p2/p2_top20.json").decode("utf-8")))
t5 = maxn(json.loads(git("show", f"{head}:business-items/build_p2/p2_top5.json").decode("utf-8")))
if pm is None or pm > 20 or t20 > 20 or t5 > 5: bad.append(f"四、每組最多項數：免費頁 {pm}、前 20 項資料檔 {t20}、前 5 項資料檔 {t5}")
print(f"改動路徑 {len(changed)} 個：{changed}")
print(f"DEPLOYMENT.md 登錄為免費者：{sorted(free)}；樹之頂層目錄：{sorted(dirs)}")
print(f"全部檔 {len(allfiles)} 個（DEPLOYMENT.md 除外）中，於 p2_member_url 以外含會員頁目錄名者 {len(hits)} 個；免費頁含 {page.count(MEMBER_DIR)} 處")
print(f"每組最多項數：免費頁 {pm}、前 20 項資料檔 {t20}、前 5 項資料檔 {t5}")
print("結果：" + ("全數通過" if not bad else "不通過：" + "；".join(bad)))
sys.exit(1 if bad else 0)
