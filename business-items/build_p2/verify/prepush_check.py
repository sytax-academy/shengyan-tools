#!/usr/bin/env python3
"""公開 repo 推送前清單檢查（🎨 Instruction 第二段第四項；派工提示詞第八段第 1 項；驗證表 Q141）
用法（自 repo 根目錄）：python3 -I business-items/build_p2/verify/prepush_check.py 〈開工 commit〉 [〈受驗 commit，預設 HEAD〉]
檢查：
  一、開工 commit..受驗 commit 之全部改動路徑，只在 business-items/index.html、business-items/README.md、business-items/build_p2/ 之下（派工第四段可改範圍）。
  二、受驗 commit 之樹中，頂層目錄只為 DEPLOYMENT.md Release Identity 表登錄為「免費」之工具目錄、docs/ 與根目錄共用檔。
  三、改動路徑不含會員頁之代號字串（business-items-full）與完整彙總之檔名；改動檔之內容中，該代號字串只得出現在會員頁網址 https://sytaxes.com/tools/business-items-full/ 之內。
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
tops = {p.split("/")[0] for p in git("ls-tree", "-r", "--name-only", head).decode("utf-8").split("\n") if p}
dirs = {t for t in tops if "." not in t}
extra = sorted(d for d in dirs if d not in free and d != "docs")
if extra: bad.append(f"二、未登錄為免費之頂層目錄：{extra}")
URL = "https://sytaxes.com/tools/business-items-full/"
for p in changed:
    if "business-items-full" in p or re.search(r"full|完整彙總|top20", p): bad.append(f"三、路徑含會員頁代號或完整彙總：{p}")
    try: s = git("show", f"{head}:{p}").decode("utf-8", "replace")
    except subprocess.CalledProcessError: continue
    rest = s.replace(URL, "")
    if "business-items-full" in rest:
        if p.endswith("prepush_check.py"):
            continue   # 本程式自身之檢查字串
        bad.append(f"三、{p} 之內容於會員頁網址以外含 business-items-full（{rest.count('business-items-full')} 處）")
def maxn(d): return max((len(a) - 1) // 2 for g in d["g"].values() for a in g.values())
page = git("show", f"{head}:business-items/index.html").decode("utf-8")
m = re.search(r'<script type="application/json" id="p2-data">(.*?)</script>', page, re.S)
pm = maxn(json.loads(m.group(1).replace("<\\/", "</"))) if m else None
tm = maxn(json.loads(git("show", f"{head}:business-items/build_p2/p2_top5.json").decode("utf-8")))
if pm is None or pm > 5 or tm > 5: bad.append(f"四、每組最多項數：免費頁 {pm}、前 5 項資料檔 {tm}")
print(f"改動路徑 {len(changed)} 個：{changed}")
print(f"DEPLOYMENT.md 登錄為免費者：{sorted(free)}；樹之頂層目錄：{sorted(dirs)}")
print(f"每組最多項數：免費頁 {pm}、前 5 項資料檔 {tm}")
print("結果：" + ("全數通過" if not bad else "不通過：" + "；".join(bad)))
sys.exit(1 if bad else 0)
