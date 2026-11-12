#!/usr/bin/env python3
"""營業項目查詢第二期｜免費頁插入程式（公開 repo shengyan-tools；規格 v1_28 第十一之三節四之 2、拘41、拘44）

為何不以第一期之 build.py 重建：build.py 只在未合入之 test/business-items-v1，v1.1.0 之外殼改動（外殼 v1_3 第一段公開批）係直接施於 index.html，
以 build.py 重建會遺失外殼。故本批以 tools main 8b2f375 之 business-items/index.html（v1.1.0）為底稿，只做下列四處改動，第一期之其餘內容與外殼一字不改：
  一、meta tool-version：business-items v1.1.0 → 附錄 A tool_version（business-items v1.2.0）
  二、版本行 p.as-of：改為附錄 A version_line
  三、第一期候選區 <section id="results" aria-live="off"></section> 之後、main 結束（頁尾之前）插入第二期區塊 section#p2[data-region="p2"]
      （驗證表判定方式四十之第二期區塊；區塊內含其樣式、內嵌字樣、前 5 項資料與程式）
  四、頁尾收合列內，第一期顯名 p#attribution 之後插入第二期顯名 p#p2Attribution（拘42）

用法（自 repo 根目錄；python3 -I 執行）：
  python3 -I business-items/build_p2/insert_p2.py --ext 〔knowledge 1a620583 之 ext_c23d_輸出.json〕 --top5-sha256 〔私人 repo 建置報告所記之 TOP5_SHA256〕
選項：--base 〔底稿 index.html〕（預設以 git show 8b2f375:business-items/index.html 取得）；--out 〔輸出〕（預設 business-items/index.html）
核對：底稿 SHA-256 須等於 v1.1.0 之值；ext 須等於凍結值；前 5 項資料檔（本目錄 p2_top5.json）之 SHA-256 須等於 --top5-sha256；
      前 5 項資料檔任一代號任一組多於 5 項即中止（拘41、Q141）；輸出超過 1,000,000 位元組即中止（P42）。任一不符即中止、不寫輸出。
前 5 項資料檔之格式：見私人 repo 建置程式檔頭（{"min":30,"topn":5,"date":…,"names":{代號:名稱},"g":{"company":{代號:[n,B1,c1,…]},"firm":{…}}}）。
"""
import argparse, hashlib, html, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
BASE_COMMIT = "8b2f3759c83321ed77bc77b027bd470aa6cc615d"
BASE_SHA = "d096c805fcda373e366f5ee6b50f0160d42f95e6637f3ced89d5f55de0ee6f37"   # business-items v1.1.0（212,458 位元組）
EXT_SHA = "70f86db07a236bdceff9ffc98c5b45472f839745e4439e8843f5ebb3a0817c89"
LT1 = "未滿 1%"   # 規格第十一之三節二之 4 之字樣
MAX_BYTES = 1_000_000
ANCHOR_RESULTS = '<section id="results" aria-live="off"></section>\n'
OLD_TOOL_VERSION = '<meta name="tool-version" content="business-items v1.1.0">'


def die(m):
    print("插入中止：" + m, file=sys.stderr)
    sys.exit(2)


def once(s, old, new, label):
    if s.count(old) != 1:
        die(f"{label}：錨點不為恰一處（{s.count(old)}）")
    return s.replace(old, new, 1)


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--ext", required=True)
    ap.add_argument("--top5-sha256", required=True)
    ap.add_argument("--base")
    ap.add_argument("--out", default=str(REPO / "business-items" / "index.html"))
    a = ap.parse_args(argv)
    base = Path(a.base).read_bytes() if a.base else subprocess.run(["git", "-C", str(REPO), "show", f"{BASE_COMMIT}:business-items/index.html"], check=True, capture_output=True).stdout
    if hashlib.sha256(base).hexdigest() != BASE_SHA:
        die("底稿之 SHA-256 不是 v1.1.0")
    extb = Path(a.ext).read_bytes()
    if hashlib.sha256(extb).hexdigest() != EXT_SHA:
        die("ext_c23d_輸出.json 之 SHA-256 不符")
    ext = json.loads(extb.decode("utf-8"))
    A = dict(ext["appendix_a"]); A.update(ext["shell"])
    tb = (HERE / "p2_top5.json").read_bytes()
    tsha = hashlib.sha256(tb).hexdigest()
    if tsha != a.top5_sha256.strip().lower():
        die(f"前 5 項資料檔之 SHA-256 {tsha} 不等於私人 repo 建置報告所記 {a.top5_sha256}")
    T = json.loads(tb.decode("utf-8"))
    if T.get("topn") != 5:
        die("前 5 項資料檔之 topn 不是 5")
    for g in ("company", "firm"):
        for code, arr in T["g"][g].items():
            if (len(arr) - 1) // 2 > 5:
                die(f"前 5 項資料檔之 {g} {code} 多於 5 項")
    date = T["date"]
    esc = lambda t: html.escape(t, quote=True)
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    S = {"lt1": LT1, "name_missing": A["p2_name_missing"], "tax_query_link": A["p2_tax_query_link"], "tax_query_url": A["p2_tax_query_url"],
         "new_window_suffix": A["new_window_suffix"], "insufficient": A["p2_insufficient"], "base_count": A["p2_base_count"],
         "col_code": A["p2_col_code"], "col_name": A["p2_col_name"], "col_ratio": A["p2_col_ratio"], "col_count": A["p2_col_count"],
         "top_note": A["p2_top_note_free"], "member_link": A["p2_member_link"], "member_url": A["p2_member_url"], "member_scope": A["p2_member_scope"],
         "group_company": A["p2_group_company"], "group_firm": A["p2_group_firm"], "no_code": A["p2_no_code"], "not_advice": A["p2_note_not_advice"],
         "format_error": A["p2_format_error"], "not_entered": A["p2_not_entered"], "name_none": A["p2_name_none"], "name_result_heading": A["p2_name_result_heading"]}
    frag = (HERE / "p2_fragment.html").read_text(encoding="utf-8")
    frag = frag[frag.index("<section"):]
    rep = {"HEADING_BLOCK": f'<h2 id="p2Heading">{esc(A["p2_heading"])}</h2>\n<p class="p2-lead">{esc(A["p2_lead"])}</p>',
           "STR_JSON": dump(S), "DATA_JSON": dump(T)}
    for k in ("p2_code_label", "p2_code_placeholder", "p2_name_label", "p2_name_placeholder", "p2_search_btn", "p2_label_tax", "p2_note_max4", "p2_note_not_items"):
        rep[k] = esc(A[k])
    rep["p2_version"] = esc(A["p2_version"].replace("〔資料日期〕", date))
    for k, v in rep.items():
        if frag.count("{{" + k + "}}") != 1:
            die(f"片段之佔位 {k} 不為恰一處")
        frag = frag.replace("{{" + k + "}}", v)
    if "{{" in frag:
        die("片段尚有未代入之佔位")
    lic = "https://data.gov.tw/license"
    att = esc(A["p2_attribution"].replace("〔資料日期〕", date))
    if att.count(lic) != 1:
        die("p2_attribution 之授權條款網址不為恰一處")
    att = att.replace(lic, f'<a href="{lic}" target="_blank" rel="noopener noreferrer" aria-label="{lic}{esc(A["new_window_suffix"])}">{lic}</a>')

    s = base.decode("utf-8")
    s = once(s, OLD_TOOL_VERSION, f'<meta name="tool-version" content="{esc(A["tool_version"])}">', "tool-version")
    old_ver = '<p class="as-of">版本 v1.1.0｜除個別標示者外均為已官方查證；法規如有修正，以主管機關公告為準。</p>'
    s = once(s, old_ver, f'<p class="as-of">{esc(A["version_line"])}</p>', "版本行")
    s = once(s, ANCHOR_RESULTS, ANCHOR_RESULTS + frag, "第一期候選區")
    i = s.index('<p class="attribution" id="attribution">')
    j = s.index("</p>", i) + len("</p>")
    s = s[:j] + f'\n<p class="attribution" id="p2Attribution">{att}</p>' + s[j:]
    out = s.encode("utf-8")
    if len(out) > MAX_BYTES:
        die(f"免費頁 {len(out)} 位元組，超過 {MAX_BYTES}（P42）")
    Path(a.out).write_bytes(out)
    print(f"ok 免費頁 {len(out)} 位元組 {hashlib.sha256(out).hexdigest()}；前 5 項資料檔 SHA-256 {tsha}（相符）")


if __name__ == "__main__":
    main(sys.argv[1:])
