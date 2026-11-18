#!/usr/bin/env python3
"""營業項目查詢 v1.3.0｜免費頁改版程式（公開 repo shengyan-tools；規格 v1_31 第十一之三節四之 2，契約 c24）

以 v1.2.1（shengyan-tools main d8f5e3e 之 business-items/index.html）為底稿，只改下列各處，其餘一字不改：
  一、meta tool-version → ext_c24 附錄 A tool_version
  二、版本行 p.as-of → version_line
  三、查詢鈕 #p2SearchBtn 之文字 → p2_search_btn
  四、內嵌字樣 p2-str：刪 member_link、member_url、member_scope 三鍵；top_note → p2_top_note_free
  五、刪除顯示會員連結之程式一句（if(S.member_link){…}）
  六、內嵌資料 p2-data → 本目錄 p2_top20.json（每代號每組前 20 項；取自會員頁 v1.0.0 之內嵌資料）
  七、頁尾 p2_attribution 之開頭「稅籍行業共現」→「同業登記統計」（逐字等於 ext_c24 之 p2_attribution）

用法（自 repo 根目錄；python3 -I 執行）：
  python3 -I business-items/build_p2/insert_p2_v130.py --ext 〔knowledge inbox/工具十三/第二期全列/ext_c24_輸出.json〕 --top20-sha256 〔資料檔雜湊；v1.3.0 為 TOP20_SHA_V130〕
選項：--base 〔底稿〕（預設 git show d8f5e3e:business-items/index.html）；--out（預設 business-items/index.html）
核對：底稿、ext_c24 之 SHA-256 須等於本檔所記，p2_top20.json 須等於 --top20-sha256；p2_top20.json 之 topn 須為 20，每一數列首為家數、其後代號與次數成對，且任一代號任一組不多於 20 項；
      輸出超過 1,000,000 位元組即中止（P42）。任一不符即中止、不寫輸出。
"""
import argparse, hashlib, html, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
BASE_COMMIT = "d8f5e3e"
BASE_SHA = "e8de7e449259146753d46da5dbf7248513161c161022c65c7e5730201786a5f6"   # business-items v1.2.1（441,777 位元組）
EXT_SHA = "91e55950c6a7a1140740d2bc29d2713fa20d3f5613934ffa11d33c05bd65d0c4"    # knowledge ext_c24_輸出.json
TOP20_SHA_V130 = "c74bfbae44f27ce5e9c5e2593baffcb7d7f24e318f5a6beb07a67b75bff6d474"  # v1.3.0 之 p2_top20.json（538,835 位元組；取自會員頁 v1.0.0）
MAX_BYTES = 1_000_000


def die(m):
    print("中止：" + m, file=sys.stderr)
    sys.exit(2)


def once(s, old, new, label):
    if s.count(old) != 1:
        die(f"{label}：錨點不為恰一處（{s.count(old)}）")
    return s.replace(old, new, 1)


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--ext", required=True)
    ap.add_argument("--top20-sha256", required=True, help="前 20 項資料檔之 SHA-256；v1.3.0 為 TOP20_SHA_V130，日後季更取建置報告所記")
    ap.add_argument("--base")
    ap.add_argument("--out", default=str(REPO / "business-items" / "index.html"))
    a = ap.parse_args(argv)
    base = Path(a.base).read_bytes() if a.base else subprocess.run(
        ["git", "-C", str(REPO), "show", f"{BASE_COMMIT}:business-items/index.html"], check=True, capture_output=True).stdout
    if hashlib.sha256(base).hexdigest() != BASE_SHA:
        die("底稿不是 v1.2.1")
    eb = Path(a.ext).read_bytes()
    if hashlib.sha256(eb).hexdigest() != EXT_SHA:
        die("ext_c24_輸出.json 之 SHA-256 不符")
    A = json.loads(eb.decode("utf-8"))["appendix_a"]
    tb = (HERE / "p2_top20.json").read_bytes()
    if hashlib.sha256(tb).hexdigest() != a.top20_sha256.strip().lower():
        die("p2_top20.json 之 SHA-256 不等於 --top20-sha256")
    T = json.loads(tb.decode("utf-8"))
    if T.get("topn") != 20:
        die("p2_top20.json 之 topn 不是 20")
    for g in ("company", "firm"):
        for code, arr in T["g"][g].items():
            if not arr or not all(isinstance(x, int) for x in arr):
                die(f"{g} {code} 數列空白或含非整數")
            if (len(arr) - 1) % 2 != 0:
                die(f"{g} {code} 數列之代號與次數未成對")
            if (len(arr) - 1) // 2 > 20:
                die(f"{g} {code} 多於 20 項")
    esc = lambda t: html.escape(t, quote=True)
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

    s = base.decode("utf-8")
    # 一、二
    s = once(s, '<meta name="tool-version" content="business-items v1.2.1">', f'<meta name="tool-version" content="{esc(A["tool_version"])}">', "tool-version")
    s = once(s, '<p class="as-of">版本 v1.2.1｜除個別標示者外均為已官方查證；法規如有修正，以主管機關公告為準。</p>', f'<p class="as-of">{esc(A["version_line"])}</p>', "版本行")
    # 三
    s = once(s, '<button type="submit" class="btn-secondary" id="p2SearchBtn">查詢共現統計</button>',
             f'<button type="submit" class="btn-secondary" id="p2SearchBtn">{esc(A["p2_search_btn"])}</button>', "查詢鈕")
    # 四
    i = s.index('<script type="application/json" id="p2-str">') + len('<script type="application/json" id="p2-str">')
    j = s.index("</script>", i)
    S = json.loads(s[i:j])
    for k in ("member_link", "member_url", "member_scope"):
        if k not in S:
            die(f"p2-str 無 {k}")
        del S[k]
    if S["top_note"] != "每組顯示前 5 項。":
        die("p2-str 之 top_note 不是 v1.2.1 之字樣")
    S["top_note"] = A["p2_top_note_free"]
    s = s[:i] + dump(S) + s[j:]
    # 五
    s = once(s, '  if(S.member_link){f.appendChild(document.createTextNode(" "));var a=el("a","p2-mlink",S.member_link);a.href=S.member_url;f.appendChild(a);f.appendChild(document.createTextNode(" "));f.appendChild(el("span","p2-mscope",S.member_scope));}\n',
             "", "會員連結程式")
    # 六
    i = s.index('<script type="application/json" id="p2-data">') + len('<script type="application/json" id="p2-data">')
    j = s.index("</script>", i)
    s = s[:i] + dump(T) + s[j:]
    # 七
    old_att = '<p class="attribution" id="p2Attribution">稅籍行業共現之資料來源：'
    if not A["p2_attribution"].startswith("同業登記統計之資料來源："):
        die("ext_c24 之 p2_attribution 開頭不符")
    s = once(s, old_att, '<p class="attribution" id="p2Attribution">同業登記統計之資料來源：', "顯名開頭")
    out = s.encode("utf-8")
    if len(out) > MAX_BYTES:
        die(f"免費頁 {len(out)} 位元組，超過 {MAX_BYTES}（P42）")
    Path(a.out).write_bytes(out)
    print(f"ok 免費頁 {len(out)} 位元組 {hashlib.sha256(out).hexdigest()}")


if __name__ == "__main__":
    main(sys.argv[1:])
