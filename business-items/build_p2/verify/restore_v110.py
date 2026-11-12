#!/usr/bin/env python3
"""營業項目查詢第二期｜還原頁產生程式（驗證表 v1_28 Q158；規格 v1_29 第四十四節）
自免費頁 v1.2.0 移除 section#p2（含其內之 style、資料與 script）與頁尾 p#p2Attribution，並把 tool-version 與版本行還原為 v1.1.0 之字樣，
輸出「還原頁」，供外殼 H02、V-E68、V-E90 以 v1.1.0 之同一判定執行；另比對還原頁與 v1.1.0（shengyan-tools main 8b2f375）之位元組與 SHA-256。
用法：python3 -I business-items/build_p2/verify/restore_v110.py --page 〔免費頁 v1.2.0〕 --out 〔還原頁〕 [--base 〔v1.1.0 頁；未給者以 git show 8b2f375 取〕]
結束碼：0＝還原頁與 v1.1.0 逐位元組相同；1＝不同（列出第一個相異位置）；2＝結構不符（找不到應移除之元素或不為恰一處）。"""
import argparse, hashlib, re, subprocess, sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--page", required=True); ap.add_argument("--out", required=True); ap.add_argument("--base")
a = ap.parse_args()

def die(m):
    print("還原中止：" + m, file=sys.stderr); sys.exit(2)

def once(s, old, new, label):
    if s.count(old) != 1:
        die(f"{label} 不為恰一處（{s.count(old)}）")
    return s.replace(old, new)

s = Path(a.page).read_bytes().decode("utf-8")
# 一、section#p2：自開始標籤起，以 section 標籤之開閉計數找出對應之結束標籤
start_tag = '<section class="p2" id="p2"'
if s.count(start_tag) != 1:
    die("section#p2 開始標籤不為恰一處")
i = s.index(start_tag); depth = 0
for m in re.compile(r"<section\b|</section>").finditer(s, i):
    depth += 1 if m.group(0) != "</section>" else -1
    if depth == 0:
        j = m.end(); break
else:
    die("section#p2 無對應之結束標籤")
if s[j:j + 1] == "\n":
    j += 1
s = s[:i] + s[j:]
# 二、頁尾 p#p2Attribution（插入程式於其前加一換行）
m = re.search(r'\n<p class="attribution" id="p2Attribution">.*?</p>', s, re.S)
if not m or len(re.findall(r'id="p2Attribution"', s)) != 1:
    die("p#p2Attribution 不為恰一處")
s = s[:m.start()] + s[m.end():]
# 三、tool-version 與版本行還原為 v1.1.0 之字樣
s = once(s, '<meta name="tool-version" content="business-items v1.2.0">', '<meta name="tool-version" content="business-items v1.1.0">', "tool-version")
s = re.sub(r'<p class="as-of">版本 v1\.2\.0｜', '<p class="as-of">版本 v1.1.0｜', s, count=1)
out = s.encode("utf-8")
Path(a.out).write_bytes(out)
base = Path(a.base).read_bytes() if a.base else subprocess.run(["git", "show", "8b2f3759c83321ed77bc77b027bd470aa6cc615d:business-items/index.html"], capture_output=True, check=True).stdout
h = lambda b: hashlib.sha256(b).hexdigest()
print(f"還原頁 {len(out)} 位元組 {h(out)}；v1.1.0 {len(base)} 位元組 {h(base)}")
if out == base:
    print("結果：還原頁與 v1.1.0 逐位元組相同"); sys.exit(0)
k = next((n for n, (x, y) in enumerate(zip(out, base)) if x != y), min(len(out), len(base)))
print(f"結果：不同；第一個相異位元組位置 {k}：還原頁 {out[max(0, k - 40):k + 40]!r}；v1.1.0 {base[max(0, k - 40):k + 40]!r}")
sys.exit(1)
