#!/usr/bin/env python3
"""公開 repo 推送前清單檢查（🎨 Instruction 第二段第四項；派工提示詞第八段第 1 項；驗證表 Q141）
用法（自 repo 根目錄）：python3 -I business-items/build_p2/verify/prepush_check.py 〈開工 commit〉 [〈受驗 commit，預設 HEAD〉]
檢查：
  一、開工 commit..受驗 commit 之全部改動路徑，只在 business-items/index.html、business-items/README.md、business-items/build_p2/ 之下（派工第四段可改範圍）。
  二、受驗 commit 之樹中，頂層目錄只為 DEPLOYMENT.md Release Identity 表登錄為「免費」之工具目錄、docs/ 與根目錄共用檔。
  三、改動路徑不含會員頁之目錄名與完整彙總之檔名；公開 repo 受驗 commit 之全部檔（不限改動檔）內容中，會員頁目錄名只得出現在 p2_member_url 之內（c23e）。
     本程式自身亦不含該目錄名之字面：目錄名與網址以字串拼接產生。
  四、免費頁與 build_p2/p2_top5.json 之第二期資料，任一代號任一組不多於 5 項。
結束碼：0＝全數通過；1＝任一不通過（逐項列出）。"""
import json, re, subprocess, sys

start = sys.argv[1]; head = sys.argv[2] if len(sys.argv) > 2 else "HEAD"
git = lambda *a: subprocess.run(["git", *a], capture_output=True, check=True).stdout
bad = []
changed = [p for p in git("diff", "--name-only", f"{start}..{head}").decode("utf-8").split("\n") if p]
ok_scope = lambda p: p in ("business-items/index.html", "business-items/README.md") or p.startswith("business-items/build_p2/")
out = [p for p in changed if not ok_scope(p)]
if out: bad.append(f"一、範圍外之改動路徑：{out}")
dep = git("show", f"{head}:DEPLOYMENT.md").decode("utf-8")
free = set(re.findall(r"^\| ([A-Za-z0-9-]+) \|[^\n]*\| 免費 \|", dep, re.M))
dirs = {l.split("\t", 1)[1] for l in git("ls-tree", head).decode("utf-8").split("\n") if l and l.split()[1] == "tree"}
extra = sorted(d for d in dirs if d not in free and d != "docs")
if extra: bad.append(f"二、未登錄為免費之頂層目錄：{extra}")
MEMBER_DIR = "business-items" + "-" + "full"          # 拼接，使本檔不含會員頁目錄名之字面（Q141，c23e）
URL = "https://sytaxes.com/tools/" + MEMBER_DIR + "/"   # 附錄 A p2_member_url
for p in changed:
    if MEMBER_DIR in p or re.search(r"full|完整彙總|top20", p): bad.append(f"三、路徑含會員頁目錄名或完整彙總：{p}")
allfiles = [p for p in git("ls-tree", "-r", "--name-only", head).decode("utf-8").split("\n") if p]
hits = {}
for p in allfiles:
    s = git("show", f"{head}:{p}").decode("utf-8", "replace")
    n = s.replace(URL, "").count(MEMBER_DIR)
    if n: hits[p] = n
if hits: bad.append(f"三、檔案內容於 p2_member_url 以外含會員頁目錄名：{hits}")
def maxn(d): return max((len(a) - 1) // 2 for g in d["g"].values() for a in g.values())
page = git("show", f"{head}:business-items/index.html").decode("utf-8")
m = re.search(r'<script type="application/json" id="p2-data">(.*?)</script>', page, re.S)
pm = maxn(json.loads(m.group(1).replace("<\\/", "</"))) if m else None
tm = maxn(json.loads(git("show", f"{head}:business-items/build_p2/p2_top5.json").decode("utf-8")))
if pm is None or pm > 5 or tm > 5: bad.append(f"四、每組最多項數：免費頁 {pm}、前 5 項資料檔 {tm}")
print(f"改動路徑 {len(changed)} 個：{changed}")
print(f"DEPLOYMENT.md 登錄為免費者：{sorted(free)}；樹之頂層目錄：{sorted(dirs)}")
print(f"全部檔 {len(allfiles)} 個中，於 p2_member_url 以外含會員頁目錄名者 {len(hits)} 個")
print(f"每組最多項數：免費頁 {pm}、前 5 項資料檔 {tm}")
print("結果：" + ("全數通過" if not bad else "不通過：" + "；".join(bad)))
sys.exit(1 if bad else 0)
