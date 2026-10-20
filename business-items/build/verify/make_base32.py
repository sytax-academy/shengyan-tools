#!/usr/bin/env python3
"""營業項目查詢：驗證表 v1_20 判定方式三十二之基準頁產生程式（c20b）。

自 tools a47269e 之 business-items/index.html git blob（SHA-256 核對）產生外殼 F10、X06 之基準頁：
只把顯名元素（p#attribution，連同其行尾換行）由候選區之下搬至頁尾收合列（details.basis）之 summary 之後、
為 summary 之後第一個內文元素（規格 v1_22 拘29、第十一節）；其他位元組不變（以程式核對：基準頁去除搬入之一行後與原檔逐位元組相同）。
用法：python3 -I make_base32.py 〔repo 根目錄〕 〔輸出路徑〕；標準輸出為 JSON（commit、原檔與基準頁之位元組數與 SHA-256）。
"""
import hashlib, json, subprocess, sys

COMMIT = "a47269e"
SHA_SRC = "399672649fdcefe76de5f6cc8df9c8c1a6a76171f08011a09106adf9329d4219"
OPEN = b'<p class="attribution" id="attribution">'
SUMMARY_OPEN = b'<details class="basis">\n<summary>'


def main():
    repo, out = sys.argv[1], sys.argv[2]
    src = subprocess.run(["git", "-C", repo, "cat-file", "-p", COMMIT + ":business-items/index.html"], capture_output=True, check=True).stdout
    if hashlib.sha256(src).hexdigest() != SHA_SRC:
        sys.exit(COMMIT + " 之 business-items/index.html SHA-256 不符")
    if src.count(OPEN) != 1:
        sys.exit("p#attribution 之開始標記不為恰一處")
    i = src.index(OPEN)
    j = src.index(b"</p>\n", i) + len(b"</p>\n")
    line = src[i:j]
    if src[i - 1:i] != b"\n":
        sys.exit("p#attribution 不在行首")
    rest = src[:i] + src[j:]
    if rest.count(SUMMARY_OPEN) != 1:
        sys.exit("頁尾收合列之 summary 不為恰一處")
    k = rest.index(SUMMARY_OPEN)
    k = rest.index(b"</summary>\n", k) + len(b"</summary>\n")
    if k <= i:
        sys.exit("頁尾收合列不在顯名之後")
    page = rest[:k] + line + rest[k:]
    # 自檢：去除搬入之一行後與原檔去除原位之一行相同；長度不變
    if len(page) != len(src) or page[:k] + page[k + len(line):] != rest:
        sys.exit("自檢未通過")
    with open(out, "wb") as f:
        f.write(page)
    print(json.dumps({"程式": "business-items/build/verify/make_base32.py", "來源": f"tools {COMMIT}:business-items/index.html",
                      "來源位元組數": len(src), "來源SHA256": SHA_SRC, "搬移": "p#attribution（候選區 section#results 之後）→ details.basis 之 summary 之後第一個內文元素",
                      "搬移之位元組數": len(line), "基準頁位元組數": len(page), "基準頁SHA256": hashlib.sha256(page).hexdigest()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
