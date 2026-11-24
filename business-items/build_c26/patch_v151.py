#!/usr/bin/env python3
"""patch_v151.py：自 business-items v1.5.0（main 089d041）產生 v1.5.1（契約 c26a；規格 v1_34 第四十九節）。
只改四處：meta tool-version、版本行、p3-str 之 p3_attribution、頁尾 p3Attribution（末加授權句，網址以連結呈現）。
用法（自 repo 根目錄）：python3 -I business-items/build_c26/patch_v151.py"""
import hashlib, json, re
P = "business-items/index.html"
b = open(P, "rb").read()
assert hashlib.sha256(b).hexdigest() == "ce00dd5dbf90c6dd3f6f8208f5e4186634ccf421ec3520bd4f51952409de7969", "底稿非 v1.5.0"
s = b.decode("utf-8")
SENT_T = "兩份資料均依政府資料開放授權條款第 1 版利用（https://data.gov.tw/license）。"
def rep(o, n):
    global s
    assert s.count(o) == 1, o[:60]; s = s.replace(o, n)
rep('<meta name="tool-version" content="business-items v1.5.0">', '<meta name="tool-version" content="business-items v1.5.1">')
rep('<p class="as-of">版本 v1.5.0｜', '<p class="as-of">版本 v1.5.1｜')
END = "串接結果由本工具推得，非經濟部或財政部提供，內容未經其認可。"
rep(END + '"}</script>', END + SENT_T + '"}</script>')
k0 = s.index('<p class="attribution" id="p2Attribution">'); k1 = s.index("</p>", k0)
anchor = re.search(r'<a href="https://data.gov.tw/license"[^>]*>https://data.gov.tw/license</a>', s[k0:k1]).group(0)
rep(END + "</p>", END + "兩份資料均依政府資料開放授權條款第 1 版利用（" + anchor + "）。</p>")
o = s.encode("utf-8"); open(P, "wb").write(o)
print(P, len(o), hashlib.sha256(o).hexdigest())
