#!/usr/bin/env python3
"""營業項目查詢（business-items）第一期建置程式。

依據：《營業項目查詢工具_規格》v1_17（契約 c15）第七節第二項、第十節；驗證表 v1_14 Q01～Q04。
c15（規格 v1_17）：第一期不設組織型態（拘13、拘24、拘33）：頁面無組織型態之選項、必填提示、衝突提示與未定附記；
附錄 A 之 *_old 鍵（org_label_old 等五鍵與 booking_url_old、booking_aria_old）為不得出現於頁面之舊值，不代入頁面，並核對頁面不含其字樣。
自 repo 根目錄執行：python3 -I business-items/build/build.py [--spec 〔規格 v1_17 之路徑〕]
輸入（以 SHA-256 核對，不符即中止）：
  code_v8.xlsx        母本（拘7；S08；本目錄）
  business.pdf        一覽表 115.06.05 修訂（拘8、拘10；S07；本目錄）
  規格 v1_17          shengyan-knowledge inbox/工具十三/營業項目查詢工具_規格_v1_17.md（不入本公開 repo；預設路徑為本 repo 之同層
                      shengyan-knowledge 工作目錄，另可以 --spec 指定）。附錄 A（逐字字樣，含 v1_12 起之字型堆疊 css_font_serif、css_font_sans）、附錄 B（常見說法表）、附錄 D（R1 之例外）
                      與第七節第二項第 4 步之客戶位置起始字，一律由本程式自規格檔機械抽出內嵌，不手抄。
  ext_c15_輸出.json  ext_c15.py 自同一規格之抽出結果（與規格同一 commit 凍結；本目錄）。本程式之抽出須與之逐項相同，不同即中止。
  page_template.html  頁面樣板（不含任何字樣；字樣一律自規格之附錄 A 代入；本目錄）
輸出：business-items/index.html（單一檔，資料內嵌）、本目錄 build_report.md。
  開發中頁（business-items/dev/）自 c10 起不由本程式產出（規格 v1_17 第十一之二節：開發中頁 v0.2.0 已在 tools main，c10 起不改）。
選項：
  --spec 〔路徑〕  規格 v1_17 之路徑
  --crosscheck 〔business_items_data_v0_1.json〕  與 knowledge 資料建置 v0_1 之結果逐筆交叉核對，差異列入報告
  --test-no-hash   測試模式：關閉母本、一覽表、規格與 ext_c15_輸出.json 之 SHA-256 核對（只供驗證表 Q02、Q04 之錯誤版建置；不得用於正式建置）
需要：pdftotext（poppler-utils）、openpyxl。同輸入兩次輸出逐位元組相同（無時間戳記、無亂數、鍵序固定）。
不讀取任何網路資源；不讀取資料集 8295 之檔案（規格第十節第四項）。
"""
import hashlib
import html
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_HTML = os.path.join(os.path.dirname(HERE), "index.html")
OUT_REPORT = os.path.join(HERE, "build_report.md")
REPO = os.path.dirname(os.path.dirname(HERE))
SPEC_NAME = "營業項目查詢工具_規格_v1_17.md"
SPEC_DEFAULT = os.path.join(os.path.dirname(REPO), "shengyan-knowledge", "inbox", "工具十三", SPEC_NAME)

F_XLSX, F_PDF, F_EXT, F_TPL, F_SPEC = "code_v8.xlsx", "business.pdf", "ext_c15_輸出.json", "page_template.html", SPEC_NAME
SHA = {
    F_XLSX: "931126c9f6640329fadb06fc18dab8f53fd636e817d01f6e2aa23606e443a52b",
    F_PDF: "aa1c4e8bf1a9d1e5ce27888bd0c5b22fa7c4c359324c3ca5aa7a3c332408a710",
    F_EXT: "13a7e7f5a3e21e56b8dc28d5d4d67a71f3400a3954d37a75efd80cf6eefe6f17",
    F_SPEC: "871febf6fcce1f559544c6995bb5921dcea3d1b9e29f527eb03f4b62cef443d5",
}
SHA_CROSSCHECK = "8020cb1f96b220f8d98e23448aa91765226c214de4cca42d4437f21e38f4444c"
HEAD = ["營業項目代碼", "營業項目", "英文營業項目", "定義內容"]   # 規格第四節：只有四欄，以欄名讀取
DOWNLOAD_HINT = "請至經濟部商業發展署公司及商業登記營業項目檢索系統「資料下載」（https://gcis.nat.gov.tw/cod/downloads）取得"
# 拘30：母本名稱欄等於代碼者之補正值鍵（附錄 A ja02071_name）；出處 S07 第七類第 39 項
FIX_NAME = {"JA02071": ("ja02071_name", "S07 一覽表（115.06.05 修訂）第七類第 39 項")}
# 驗證表 Q66～Q68 與規格第十節第三項：與資料集 8295 之交叉核對期望（knowledge 比對報告 v1_0；8295 之 JSON 不入本 repo）
X8295_ONLY_8295 = ["G606011", "G901011", "G902011"]
X8295_ONLY_MASTER = ["D101101", "F212071", "I301060", "JA02071", "JZ99190"]
X8295_DIFF = ["C802170", "CB01081", "CI01030", "E503011", "F107060", "F207060", "G406051",
              "G406061", "G606021", "I102010", "I503010", "J604010", "J801030", "JZ99990"]
CN = "一二三四五六七八九十"
REQUIRED_KEYS = [
    "page_title", "purpose_lead", "purpose_item_1", "purpose_item_2", "purpose_item_3", "input_label",
    "input_placeholder", "privacy_hint", "search_btn", "show_all_btn",
    "no_result", "code_not_found", "old_text_hint", "permit_flag", "permit_link", "restriction_note",
    "dual_category_note", "zz_note", "zz_not_alone", "phrase_tag",
    "candidate_notice", "phrase_legend", "input_max_hint", "attribution", "disclaimer", "signature", "booking",
    "basis_title", "basis_item_1", "basis_item_2", "basis_item_3", "basis_item_4", "version_line", "meta_title",
    "meta_description", "tool_version", "forbidden_version_suffix", "ja02071_name", "permit_url", "signature_url",
    "booking_url", "booking_aria", "booking_url_old", "booking_aria_old",
    "org_label_old", "org_options_old", "org_required_old", "org_undecided_note_old", "conflict_prefix_old",
    "results_heading", "stale_hint", "sibling_heading", "new_window_suffix", "css_font_serif", "css_font_sans",
    "input_required", "sibling_note", "sibling_tag", "show_all_btn_sib", "zone_hint"]
RUNTIME_KEYS = ["phrase_tag", "show_all_btn", "no_result", "code_not_found", "old_text_hint", "permit_flag",
                "permit_link", "permit_url", "restriction_note", "dual_category_note",
                "zz_note", "zz_not_alone", "candidate_notice", "phrase_legend",
                "results_heading", "stale_hint", "sibling_heading", "new_window_suffix", "input_required", "sibling_note", "sibling_tag",
                "show_all_btn_sib", "zone_hint"]

LOG = []


def log(s=""):
    LOG.append(s)
    print(s)


def abort(reason):
    print("建置中止：" + reason, file=sys.stderr)
    print("未輸出 index.html 與 build_report.md。", file=sys.stderr)
    sys.exit(2)


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def check_files(no_hash, spec_path):
    info = {}
    for f in (F_XLSX, F_PDF, F_EXT, F_TPL, F_SPEC):
        p = spec_path if f == F_SPEC else os.path.join(HERE, f)
        if not os.path.isfile(p):
            extra = "；" + DOWNLOAD_HINT if f in (F_XLSX, F_PDF) else ""
            if f == F_SPEC:
                extra = "；規格不入本公開 repo，請以 --spec 指定 shengyan-knowledge 之 inbox/工具十三/" + SPEC_NAME
            abort(f"找不到 {f}（應置於 {os.path.dirname(p)}）{extra}；不改用開放平臺 API")
        info[f] = (os.path.getsize(p), sha256(p))
    if not no_hash:
        bad = [f"{f}：期望 {SHA[f]}，實際 {info[f][1]}" for f in SHA if info[f][1] != SHA[f]]
        if bad:
            abort("SHA-256 不符：" + "；".join(bad))
    return info


def load_master():
    import openpyxl
    ws = openpyxl.load_workbook(os.path.join(HERE, F_XLSX), read_only=True).active
    it = ws.iter_rows(values_only=True)
    head = [("" if h is None else str(h)) for h in next(it)]
    missing = [h for h in HEAD if h not in head]
    if missing or len(head) != len(HEAD):
        abort(f"母本欄名不符：實際欄名 {head}；期望 {HEAD}；缺 {missing}（不以欄位位置讀取）")
    idx = {h: head.index(h) for h in HEAD}
    rows, seen, dup = [], set(), []
    for r in it:
        code = r[idx["營業項目代碼"]]
        if code is None or str(code).strip() == "":
            continue
        code = str(code)
        if code in seen:
            dup.append(code)
        seen.add(code)
        rows.append({"code": code, "name": r[idx["營業項目"]] or "", "def": r[idx["定義內容"]] or ""})
    if dup:
        abort(f"母本代碼重複：{sorted(set(dup))}")
    return head, rows


def cn_num(s):
    if s == "十":
        return 10
    if s.startswith("十"):
        return 10 + CN.index(s[1]) + 1
    return CN.index(s) + 1


def parse_list():
    """一覽表解析：類別原文、各類代碼與括號註記照錄（PDF 換行處直接接續，不插入空白；半形括號照錄）。"""
    raw = subprocess.run(["pdftotext", "-layout", os.path.join(HERE, F_PDF), "-"], check=True,
                         stdout=subprocess.PIPE).stdout.decode("utf-8")
    cats, cur, item, remark = [], None, None, None
    for ln in raw.replace("\f", "\n").splitlines():
        s = ln.strip()
        if not s or re.match(r"^第\s*\d+\s*頁，共\s*\d+\s*頁", s) or re.fullmatch(r"\d+", s):
            continue
        m = re.match(r"^([一二三四五六七八九十]+)、(.*)$", s)
        if m and remark is None:
            cur = {"no": cn_num(m.group(1)), "no_cn": m.group(1), "title": m.group(2), "items": []}
            cats.append(cur)
            item = None
            continue
        if cur is None and remark is None:
            continue
        if s.startswith("備註："):
            remark = s[len("備註："):]
            cur = item = None
            continue
        if remark is not None:
            remark += s
            continue
        m = re.match(r"^(?:\d+\.)?([A-Z]{1,2}\d{5,6})(?![0-9])\s*(.*)$", s)
        if m and len(m.group(1)) == 7:
            item = {"code": m.group(1), "text": m.group(2)}
            cur["items"].append(item)
            continue
        if item is None:
            cur["title"] += s
        else:
            item["text"] += s
    for c in cats:
        for it in c["items"]:
            t = it.pop("text").strip()
            m = re.match(r"^([^（(]+?)\s*([（(].*[）)])?$", t)
            it["name"] = m.group(1).strip() if m else t
            it["note"] = (m.group(2) or "") if m else ""
    return cats, (remark or "").rstrip("。")


def spec_section(text, head):
    """規格中自「## 附錄 X」起至下一個「## 」止之一節。"""
    i = text.find("\n" + head)
    if i < 0:
        abort(f"規格中找不到「{head}」一節")
    j = text.find("\n## ", i + 1)
    return text[i + 1:] if j < 0 else text[i + 1:j]


def spec_extract(text):
    """自規格 v1_17 機械抽出：附錄 A（鍵與字樣）、附錄 B（代碼、名稱、說法）、附錄 D（R1 之例外）、客戶位置之起始字。
    各附錄之列格式見規格各該附錄之標題括號（「- 鍵：「字樣」」等）；格式不符之列不抽；抽出結果與 ext_c15_輸出.json 不同者由呼叫端中止。"""
    A = {}
    for ln in spec_section(text, "## 附錄 A").splitlines():
        m = re.fullmatch(r"- ([a-z0-9_]+)：「(.*)」", ln)
        if m:
            if m.group(1) in A:
                abort(f"規格附錄 A 鍵重複：{m.group(1)}")
            A[m.group(1)] = m.group(2)
    B, names = {}, {}
    for ln in spec_section(text, "## 附錄 B").splitlines():
        m = re.fullmatch(r"- ([A-Z0-9]{7})（(.+?)）：「(.*)」", ln)
        if m:
            if m.group(1) in B:
                abort(f"規格附錄 B 代碼重複：{m.group(1)}")
            B[m.group(1)] = m.group(3).split("、")
            names[m.group(1)] = m.group(2)
    D = []
    for ln in spec_section(text, "## 附錄 D").splitlines():
        m = re.fullmatch(r"- 第 (\d+) 對：「(.+?)」⊂「(.+?)」：(.+)", ln)
        if m:
            D.append({"g01_no": int(m.group(1)), "short": m.group(2), "long": m.group(3), "codes": m.group(4).split("、")})
    m = re.search(r"客戶位置之起始字：「([^」]+)」", text)
    if not m:
        abort("規格中找不到客戶位置之起始字（第七節第二項第 4 步之（三））")
    trig = m.group(1).split("、")
    return A, B, names, D, trig


def esc(s):
    return html.escape(s, quote=True)


def jdump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def crosscheck(path, items, cats_master, not_in_master):
    """與 knowledge 資料建置 v0_1（business_items_data_v0_1.json）逐筆交叉核對；回傳報告行。"""
    out = []
    if sha256(path) != SHA_CROSSCHECK:
        abort(f"交叉核對檔之 SHA-256 不符：期望 {SHA_CROSSCHECK}，實際 {sha256(path)}")
    with open(path, encoding="utf-8") as f:
        ref = {r["code"]: r for r in json.load(f)["items"]}
    mine = {r["code"]: r for r in items}
    out.append(f"- 對照檔：business_items_data_v0_1.json（{os.path.getsize(path)} 位元組，SHA-256 {SHA_CROSSCHECK}；不入本 repo）")
    out.append(f"- 代碼集合：本建置 {len(mine)} 筆、v0_1 {len(ref)} 筆；只在本建置 {sorted(set(mine) - set(ref))}；只在 v0_1 {sorted(set(ref) - set(mine))}")
    diffs = {"name": [], "def": [], "permit": [], "cats": [], "note": []}
    restr = {}
    for c in cats_master:
        for it in c["items"]:
            restr.setdefault(it["code"], []).append((c["no"], c["title"], it["note"]))
    for k in sorted(set(mine) & set(ref)):
        a, b = mine[k], ref[k]
        if a["name"] != b["name"]:
            diffs["name"].append(k)
        if a["def"] != (b["definition"] or ""):
            diffs["def"].append(k)
        if k.endswith("1") != bool(b["permit"]):
            diffs["permit"].append(k)
        ra = [(x[0], x[1]) for x in restr.get(k, [])]
        rb = [(x["category_no"], x["category_name"]) for x in b["restrictions"]]
        if ra != rb:
            diffs["cats"].append((k, ra, rb))
        na = [x[2] for x in restr.get(k, [])]
        nb = [(x["item_note"] or "") for x in b["restrictions"]]
        if na != nb:
            diffs["note"].append((k, na, nb))
    out.append(f"- 名稱不同：{len(diffs['name'])} 筆 {diffs['name']}")
    out.append(f"- 定義不同：{len(diffs['def'])} 筆 {diffs['def']}")
    out.append(f"- 許可旗標（尾碼 1）不同：{len(diffs['permit'])} 筆 {diffs['permit']}")
    out.append(f"- 限制旗標（類別序號與類別原文）不同：{len(diffs['cats'])} 筆")
    for k, ra, rb in diffs["cats"]:
        out.append(f"  - {k}：本建置 {ra}；v0_1 {rb}")
    out.append(f"- 括號註記不同：{len(diffs['note'])} 筆")
    for k, na, nb in diffs["note"]:
        out.append(f"  - {k}：本建置 {na}；v0_1 {nb}")
    out.append(f"- 一覽表與母本不一致（本建置）：{not_in_master}；v0_1 之 G606011 收錄與否：{'G606011' in ref}")
    total = sum(len(v) for v in diffs.values())
    out.append(f"- 差異合計：{total} 筆")
    return out


def main(argv):
    no_hash = "--test-no-hash" in argv
    cross = None
    if "--crosscheck" in argv:
        cross = argv[argv.index("--crosscheck") + 1]
    spec_path = argv[argv.index("--spec") + 1] if "--spec" in argv else SPEC_DEFAULT
    info = check_files(no_hash, spec_path)
    head, master = load_master()
    with open(spec_path, encoding="utf-8") as f:
        A, phrases, ph_names, excepts, triggers = spec_extract(f.read())
    with open(os.path.join(HERE, F_EXT), encoding="utf-8") as f:
        ext = json.load(f)
    # 本程式之抽出與 ext_c15_輸出.json（ext_c15.py 自同一規格抽出）逐項相同，不同即中止
    if not no_hash and ext.get("spec_sha256") != info[F_SPEC][1]:
        abort(f"ext_c15_輸出.json 之 spec_sha256 與規格不符：{ext.get('spec_sha256')}／{info[F_SPEC][1]}")
    for lab, mine, theirs in (("附錄 A", A, ext["appendix_a"]), ("附錄 B", phrases, ext["phrases"]["table"]),
                              ("附錄 D", excepts, ext["appendix_d"]), ("客戶位置起始字", triggers, ext["cust_triggers"])):
        if mine != theirs:
            abort(f"本程式自規格抽出之{lab}與 ext_c15_輸出.json 不同")
    if len(phrases) != ext["phrases"]["code_count"] or sum(len(v) for v in phrases.values()) != ext["phrases"]["phrase_count"]:
        abort("附錄 B 之代碼數或說法數與 ext_c15_輸出.json 不符")
    miss = [k for k in REQUIRED_KEYS if k not in A]
    if miss:
        abort(f"規格附錄 A 缺鍵：{miss}")
    # 規格 v1_17 附錄 A：鍵名以 _old 結尾者為不得出現於頁面之舊值，不代入頁面（RUNTIME_KEYS 亦不得含之）
    OLD_KEYS = sorted(k for k in A if k.endswith("_old"))
    if any(k.endswith("_old") for k in RUNTIME_KEYS):
        abort("RUNTIME_KEYS 含 _old 鍵")
    if any(A[k].count("N") != 1 for k in ("results_heading", "show_all_btn", "show_all_btn_sib")):
        abort("results_heading、show_all_btn 或 show_all_btn_sib 之 N 不是恰一處")

    codes = {r["code"] for r in master}
    fixed = []
    for r in master:
        if r["name"].strip() == r["code"]:
            if r["code"] not in FIX_NAME:
                abort(f"母本名稱欄等於代碼而無補正值：{r['code']}")
            key, src = FIX_NAME[r["code"]]
            fixed.append((r["code"], r["name"], A[key], src))
            r["name"] = A[key]
    cats, remark = parse_list()
    if remark != A["restriction_note"]:
        abort(f"一覽表備註與附錄 A restriction_note 不同：{remark}")
    if len(cats) != 15 or [c["no"] for c in cats] != list(range(1, 16)):
        abort(f"一覽表類別數或序號不符：{[c['no_cn'] for c in cats]}")
    occ = [(c["no"], it["code"]) for c in cats for it in c["items"]]
    list_codes = sorted({k for _, k in occ})
    not_in_master = sorted(k for k in list_codes if k not in codes)
    cats_master = [{"no": c["no"], "no_cn": c["no_cn"], "title": c["title"],
                    "items": [it for it in c["items"] if it["code"] in codes]} for c in cats]
    multi = sorted(k for k in list_codes if sum(1 for _, x in occ if x == k) > 1)
    tail_not_1 = sorted(k for k in list_codes if k in codes and not k.endswith("1"))
    bad_ph = sorted(k for k in phrases if k not in codes)
    if bad_ph:
        abort(f"常見說法表之代碼不在母本：{bad_ph}")
    master_name = {r["code"]: r["name"] for r in master}
    bad_nm = sorted(k for k in phrases if ph_names[k] != master_name[k])
    if bad_nm:
        abort(f"常見說法表括號內之名稱與母本（拘30 補正後）不同：{bad_nm}")
    n_phr = sum(len(v) for v in phrases.values())
    for e in excepts:
        if not all(e["short"] in phrases[k] for k in e["codes"]) or not any(e["long"] in v for v in phrases.values()):
            abort(f"附錄 D 第 {e['g01_no']} 對之說法或代碼不在附錄 B")

    # 頁面
    with open(os.path.join(HERE, F_TPL), encoding="utf-8") as f:
        tpl = f.read()
    url = "https://data.gov.tw/license"
    att = A["attribution"]
    if att.count(url) != 1:
        abort("attribution 之授權條款網址不是恰一處")
    i = att.index(url)
    att_html = (esc(att[:i]) + f'<a href="{url}" target="_blank" rel="noopener noreferrer" aria-label="{esc(url + A["new_window_suffix"])}">{url}</a>'
                + esc(att[i + len(url):]))
    data_codes = [[r["code"], r["name"], r["def"]] for r in sorted(master, key=lambda r: r["code"])]
    # 規格 v1_17 第十節第二項：字型堆疊（css_font_serif、css_font_sans）代入 <style> 內之 CSS，不做 HTML 跳脫（style 內不解碼實體）；
    # 只容許字型名稱、引號、逗號與空白，含其他字元（含 @font-face、@import、url(、分號、角括號）者中止
    font_re = re.compile(r'(?:"[A-Za-z0-9 ]+"|[A-Za-z-]+)(?:,(?:"[A-Za-z0-9 ]+"|[A-Za-z-]+))*')
    for k in ("css_font_serif", "css_font_sans"):
        if not font_re.fullmatch(A[k]):
            abort(f"附錄 A {k} 不是單純之字型名稱清單：{A[k]}")
    subst = {k: esc(v) for k, v in A.items() if k not in OLD_KEYS}
    subst.update({"css_font_serif": A["css_font_serif"], "css_font_sans": A["css_font_sans"]})
    subst.update({
        "attribution_html": att_html,
        "json_str": jdump({k: A[k] for k in RUNTIME_KEYS}),
        "json_codes": jdump(data_codes), "json_list": jdump(cats_master),
        "json_phrases": jdump(phrases),
        "json_excepts": jdump([[e["short"], e["long"], e["codes"]] for e in excepts]),
        "json_triggers": jdump(triggers),
    })
    used = set(re.findall(r"\{\{([a-z0-9_]+)\}\}", tpl))
    unknown = sorted(used - set(subst))
    if unknown:
        abort(f"樣板之代入鍵不存在：{unknown}")
    page = re.sub(r"\{\{([a-z0-9_]+)\}\}", lambda m: subst[m.group(1)], tpl)
    for k in not_in_master + X8295_ONLY_8295:
        if k in page:
            abort(f"頁面含不應出現之代碼 {k}（拘28）")
    for k in OLD_KEYS + ["forbidden_version_suffix"]:
        if A[k] in page:
            abort(f"頁面含不得出現之字樣 {k}：{A[k]}")
    if re.search(r"@font-face|@import|fonts\.googleapis|fonts\.gstatic|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|document\.cookie", page):
        abort("頁面含外部資源、網路請求或儲存之寫法（拘11、規格第十節第二項）")


    # 報告
    log("## 一、輸入核對")
    for f in (F_XLSX, F_PDF, F_SPEC, F_EXT, F_TPL):
        ok = "" if f not in SHA else ("（與期望值相符）" if info[f][1] == SHA[f] else "（不符；測試模式）")
        where = "（shengyan-knowledge inbox/工具十三/；不入本 repo）" if f == F_SPEC else ""
        log(f"- {f}{where}｜{info[f][0]} 位元組｜SHA-256 {info[f][1]}{ok}")
    log(f"- 母本欄名：{head}（以欄名讀取；英文營業項目不內嵌、不顯示）")
    log("")
    log("## 二、母本（D1）")
    log(f"- 筆數：{len(master)}；不重複代碼：{len(codes)}；重複：無")
    log(f"- 尾碼 1（許可業務）：{sum(1 for k in codes if k.endswith('1'))} 筆")
    log(f"- 拘30 名稱補正清單（{len(fixed)} 筆）：")
    for k, old, new, src in fixed:
        log(f"  - {k}：母本名稱欄「{old}」→「{new}」；出處 {src}")
    log("")
    log("## 三、一覽表（D2）解析")
    log(f"- 類別數：{len(cats)}；代碼出現處：{len(occ)}；不重複代碼：{len(list_codes)}")
    for c in cats:
        log(f"  - {c['no_cn']}、{c['title']}（{len(c['items'])} 項）")
    log(f"- 備註：{remark}（與附錄 A restriction_note 逐字相同）")
    log(f"- 列於兩類以上：{multi}")
    log(f"- 在母本而尾碼不是 1：{len(tail_not_1)} 個 {tail_not_1}")
    log(f"- 拘28「一覽表與母本不一致」清單（一覽表有、母本無；不產生旗標、不出現於頁面）：{not_in_master}")
    for c in cats:
        for it in c["items"]:
            if it["code"] in not_in_master:
                log(f"  - {it['code']}：第{c['no_cn']}類 {it['name']}{it['note']}")
    log("")
    log("## 四、與資料集 8295（D3）之交叉核對（規格第十節第三、四項）")
    log("- 8295 之 JSON 不入本 repo；期望值取自 knowledge《營業項目代碼表_8295與code_v8比對報告》v1_0（驗證表 Q66～Q68 直接列出代碼），本程式只核對母本內容。")
    log(f"- 只在 D3（不收錄）：{X8295_ONLY_8295}；在母本：{[k for k in X8295_ONLY_8295 if k in codes]}；在頁面：{[k for k in X8295_ONLY_8295 if k in page]}")
    log(f"- 只在 D1（收錄）：{X8295_ONLY_MASTER}；均在母本：{all(k in codes for k in X8295_ONLY_MASTER)}")
    log(f"- 名稱或定義實質不同（14 筆，一律以母本為準）：{X8295_DIFF}；均在母本：{all(k in codes for k in X8295_DIFF)}")
    if not all(k in codes for k in X8295_ONLY_MASTER + X8295_DIFF) or any(k in codes for k in X8295_ONLY_8295):
        abort("母本內容與 8295 交叉核對之期望不符")
    log("")
    log("## 五、常見說法表（附錄 B）")
    log(f"- 代碼數：{len(phrases)}；說法數：{n_phr}；均在母本且括號內名稱與母本相同：是（不符者中止建置）")
    log(f"- 附錄 D（R1 之例外）：{len(excepts)} 對；客戶位置之起始字：{'、'.join(triggers)}")
    log("- 附錄 A、附錄 B、附錄 D 與客戶位置之起始字均由本程式自規格抽出，並與 ext_c15_輸出.json 逐項核對相同")
    log("")
    log("## 六、輸出")
    log(f"- index.html：{len(page.encode('utf-8'))} 位元組；內嵌代碼表 {len(data_codes)} 筆（代碼、名稱、定義；不含英文營業項目）、一覽表 {len(cats_master)} 類 {sum(len(c['items']) for c in cats_master)} 處、常見說法表 {len(phrases)} 碼")
    log(f"- 字型堆疊（規格 v1_17 第十節第二項；附錄 A 抽出）：--serif {A['css_font_serif']}；--sans {A['css_font_sans']}")
    log(f"- head：title「{A['meta_title']}」；robots「index,follow」；tool-version「{A['tool_version']}」")
    if cross:
        log("")
        log("## 七、與 knowledge 資料建置 v0_1 之交叉核對")
        for line in crosscheck(cross, [{"code": r["code"], "name": r["name"], "def": r["def"]} for r in master],
                               cats_master, not_in_master):
            log(line)
    with open(OUT_HTML, "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    rep = ["# 營業項目查詢（business-items）建置報告", "",
           "- 程式：business-items/build/build.py（規格 v1_17 第十節；驗證表 v1_14 Q01～Q04）",
           "- 重跑指令（自 repo 根目錄；需 pdftotext、openpyxl）：`python3 -I business-items/build/build.py --spec 〔規格 v1_17 之路徑〕`"
           + ("（本報告另加 `--crosscheck 〔business_items_data_v0_1.json 之路徑〕`）" if cross else ""),
           "- 下方為程式之標準輸出；同輸入兩次輸出逐位元組相同。", "", "\n".join(LOG), ""]
    with open(OUT_REPORT, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(rep))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
