#!/usr/bin/env node
/* 營業項目查詢（business-items）驗證程式：驗證表 v1_9（契約 c11）期別一 93 列、刻意錯誤 E01～E47、E52、E55～E104 與補充刻意錯誤 X01～X21、改版前之版本（tools ff0239e 之工具頁，c10b）。
 * 期望值一律取自 ../ext_c11_輸出.json（ext_c11.py 之抽出結果，與規格 v1_13 同一 commit 凍結）、獨立推導檔（Q132）與母本 code_v8.xlsx（master_dump.py 獨立讀取），不手抄字樣。
 * 用法（自 repo 根目錄）：node business-items/build/verify/verify.js --spec 〔規格 v1_13〕 --indep 〔獨立推導 c11 v1_0〕 [--spec-v1-10 〔規格 v1_10〕] [--spec-v1-12 〔規格 v1_12〕] [--only 列號,列號]
 *   --spec：建置列 Q01～Q04 之暫存建置所需（規格不入本公開 repo；SHA-256 由 build.py 核對）。
 *   --indep：Q132 所需（knowledge a5501fe 之 inbox/工具十三/營業項目查詢_獨立推導_c11_v1_0.json，SHA-256 7a2ff77d…ab5ff；不入本 repo）；未給者 Q132 記未執行。
 *   --spec-v1-10：E61（內嵌說法表回 v1_10 附錄 B）所需（knowledge 68605af 之 inbox/工具十三/營業項目查詢工具_規格_v1_10.md，SHA-256 0844c15c…c4fe）；未給者 E61 記未執行。
 *   --spec-v1-12：E81、E82（附錄 D 加回第 58、66 對）所需（knowledge 30902f4 之 inbox/工具十三/營業項目查詢工具_規格_v1_12.md，SHA-256 10edcf0a…7620）；兩對自該檔附錄 D 抽出，不手抄。
 * 不在射程而不執行：開發中頁 D01～D06、刻意錯誤 E48～E51、E53、E54（驗證表 v1_9 第九之二節、第十節）。
 * E79（字型堆疊改回 v1_11）之舊堆疊以 git 自 tools 7f2e6e1 之工具頁取出（SHA-256 核對），不手抄。
 * 人工列：Q80、Q99、Q127（以 run_x4_c10.py 報數字）、Q81（截圖）、Q126（手機鍵盤、Mac 注音），判定記未執行。
 * Q107：Chromium 以兩種設定各跑一次（Playwright 預設〔停用往返快取〕；完整 Chromium 並啟用往返快取）；Firefox、WebKit 記未執行（七題之七，115/10/23 後本機補跑）。
 * 需要：Node 之 playwright（Chromium）、python3（openpyxl、pdftotext）、git（取 ff0239e、7f2e6e1 之工具頁）。不連外網；頁面以本機 http 伺服器提供（同源測試頁代替 sytaxes.com，判定方式十）。
 * 輸出：verify/results/結果.json、verify/screenshots/（Q81）；執行紀錄.md 由 make_record.py 產生。
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http"), crypto = require("crypto");
const { execFileSync, spawnSync } = require("child_process");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require("/opt/node22/lib/node_modules/playwright"); }
const { chromium } = pw;

const VERIFY = __dirname, BUILD = path.dirname(VERIFY), TOOL = path.dirname(BUILD), REPO = path.dirname(TOOL);
const EXT_FILE = "ext_c11_輸出.json";
const E = JSON.parse(fs.readFileSync(path.join(BUILD, EXT_FILE), "utf8"));
const A = E.appendix_a, L = E.list, CAND = E.candidates;
const ARGV = process.argv.slice(2);
const argOf = k => { const i = ARGV.indexOf(k); return i >= 0 ? ARGV[i + 1] : null; };
const ONLY = argOf("--only") ? argOf("--only").split(",") : null;
const SPEC = argOf("--spec");
const SPEC_V1_10 = argOf("--spec-v1-10");
const SPEC_V1_12 = argOf("--spec-v1-12"), SHA_SPEC_V1_12 = "10edcf0af97a68fe54a025589e5fd5739d07d95591c17f2cd6b5701443857620";
const INDEP_FILE = argOf("--indep"), SHA_INDEP = "7a2ff77d00957de9611fc3b427111389ad9091bad3b0beee6f196a59723ab5ff";
const SHA_SPEC_V1_10 = "0844c15c5b25f4abf984c364675c27bfeea9626215ba04aceb370f6e4c70c4fe";
const PRE_COMMIT = "ff0239e", SHA_PRE_TOOL = "603a26e405113c78ccf6c410cce6a1b2e555e82364768956e6779ae4ae84b2f5"; // 改版前之版本：c10b 之工具頁（本批施作底本）
const C10_COMMIT = "7f2e6e1", SHA_C10_TOOL = "6d8a9a21def1acf3e1d34c69e26b3755947dae4cf95018899bfb37d7a816072e"; // E79：v1_11 之字型堆疊所在之工具頁
const M = JSON.parse(execFileSync("python3", ["-I", path.join(VERIFY, "master_dump.py"), path.join(BUILD, "code_v8.xlsx")], { encoding: "utf8", maxBuffer: 1 << 26 }));
const C8_PURPOSE = "輸入你要做的生意，列出可能適用的公司行號營業項目代碼，並標出須先取得許可、限專業經營、限公司組織等限制。"; // 規格 v1_13 附錄 A 前言所引之 c8 purpose
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "bi-verify-"));
const WIDTHS = [320, 390, 768, 1366];
const ORGS = A.org_options.split("、");
const LICENSE = "https://data.gov.tw/license";
// 規格 v1_13 第八節組織型態衝突對照表（判準：類別名稱之字面；列＝類別序號，欄＝有限公司、股份有限公司、獨資、合夥、有限合夥；未定一律不判斷）
const SPEC_CONFLICT = {};
[[[1, 3, 4, 5, 13], "10111"], [[2, 6, 7, 8], "00111"], [[9, 10], "00000"], [[11, 12], "11111"], [[14], "11001"], [[15], "00001"]]
  .forEach(([ns, s]) => ns.forEach(n => { SPEC_CONFLICT[n] = s.split("").map(c => c === "1"); }));
const cat = n => L.categories.find(c => c.no === n);
const noteOf = (code, n) => (cat(n).items.find(i => i.code === code) || {}).note || "";
const sha256 = b => crypto.createHash("sha256").update(b).digest("hex");
const setEq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const heading = n => A.results_heading.replace("N", String(n));
const notFound = k => A.code_not_found.replace("〔代碼〕", k);
const tagsOf = q => E.tag_text[q] || CAND[q].tags;
/* 依規格 v1_13 第七節第二項之 8：先列前 30 筆（得分列加補列合併計）；v1_9 起 ext 一律輸出全部列（P-G-10），rows_head 只供舊版相容 */
const allOf = q => { const c = CAND[q]; return c.rows ? c.rows.concat(c.siblings) : null; };

/* ───────── 本機伺服器：/〔變體〕/index.html、/other.html ───────── */
const ROOT = path.join(TMP, "www");
fs.mkdirSync(ROOT, { recursive: true });
fs.writeFileSync(path.join(ROOT, "other.html"), "<!doctype html><meta charset=utf-8><title>other</title><p>同源測試頁（代替 https://sytaxes.com/）</p>");
let PORT = 0;
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": p.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
  res.end(fs.readFileSync(p));
});
function publish(name, html) { const d = path.join(ROOT, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "index.html"), html); return `http://127.0.0.1:${PORT}/${name}/index.html`; }

/* ───────── 頁面工具 ───────── */
const INIT = () => {
  window.__w = { ls: 0, ss: 0, idb: 0, ck: 0, net: 0 };
  window.__ps = [];
  addEventListener("pageshow", e => { window.__ps.push({ persisted: e.persisted, nav: (performance.getEntriesByType("navigation")[0] || {}).type || null }); });
  const sp = Storage.prototype.setItem;
  Storage.prototype.setItem = function () { try { if (this === window.localStorage) window.__w.ls++; else window.__w.ss++; } catch (e) { window.__w.ss++; } return sp.apply(this, arguments); };
  try { const op = IDBFactory.prototype.open; IDBFactory.prototype.open = function () { window.__w.idb++; return op.apply(this, arguments); }; } catch (e) { }
  const d = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  Object.defineProperty(document, "cookie", { configurable: true, get() { return d.get.call(document); }, set(v) { window.__w.ck++; return d.set.call(document, v); } });
};
class Ctx {
  constructor(browser) { this.browser = browser; }
  async page(url, w = 1366, h = 768) {
    const ctx = await this.browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(INIT);
    const p = await ctx.newPage();
    p.__req = []; p.__errs = [];
    p.on("request", r => p.__req.push(r.url()));          // 自導覽開始（含載入期間）之全部請求（驗證表 v1_8 Q78）
    p.on("websocket", ws => p.__req.push(ws.url()));
    p.on("pageerror", e => p.__errs.push(e.message));
    p.__resp = await p.goto(url, { waitUntil: "load" });
    p.__raw = await p.__resp.text();
    p.__url = url;
    return p;
  }
}
async function close(p) { await p.context().close(); }
async function query(p, text, org) {
  await p.fill("#biz", text);
  if (org) await p.check(`input[name="org"][value="${org}"]`);
  else await p.evaluate(() => document.querySelectorAll('input[name="org"]').forEach(r => { r.checked = false; }));
  await p.click("#searchBtn");
}
async function showAll(p) { const b = await p.$("#showAll"); if (b) await b.click(); }
async function cards(p) {
  return p.$$eval("#results .cand", els => els.map(e => {
    const t = s => { const x = e.querySelector(s); return x ? x.textContent : null; };
    const pl = e.querySelector(".permit-link");
    return {
      code: e.dataset.code, name: t(".cand-name"), def: t(".cand-def"), tag: t(".phrase-tag"),
      permit: t(".flag-permit .flag-title"), link: pl ? { text: pl.textContent, href: pl.getAttribute("href"), target: pl.getAttribute("target") } : null,
      restr: [...e.querySelectorAll(".flag-restrict")].map(f => ({ cat: f.dataset.cat, title: (f.querySelector(".cat-title") || {}).textContent, note: (f.querySelector(".cat-note") || {}).textContent || "", rn: (f.querySelector(".restriction-note") || {}).textContent })),
      text: e.innerText,
    };
  }));
}
/* 候選區之讀出（不依實作之 id 與 class，只依字樣與 .cand）：得分列、補列（sibling_heading 之後者）、標示、code_not_found、各提示之數目與順序 */
async function resState(p) {
  return p.evaluate(K => {
    const res = document.querySelector("#results");
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const all = [...document.querySelectorAll("body *")];
    const leaf = t => all.filter(e => (e.textContent || "") === t && ![...e.children].some(c => (c.textContent || "") === t) && vis(e));
    const nfRe = new RegExp("^" + K.nf.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("〔代碼〕", "(.+)") + "$");
    const hRe = new RegExp("^" + K.rh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "(\\d+)") + "$");
    const out = { rows: [], sib: [], tags: {}, missing: [], missingEls: [], sibHeading: 0, sibHeadingBeforeFirstSib: null, sibHeadingTag: null, sibNote: leaf(K.sn).length, sibTagByCard: {}, headings: [], cardTitleTags: [] };
    let s = false, firstSibPrev = null;
    for (const e of res ? res.querySelectorAll("*") : []) {
      if (e.textContent === K.sh && ![...e.children].some(c => c.textContent === K.sh)) { s = true; out.sibHeading++; out.sibHeadingTag = e.tagName; continue; }
      if (e.classList.contains("cand")) {
        // v1_9：DOM 順序為 最後一筆得分列 → sibling_heading → sibling_note → 第一筆補列
        if (s && !out.sib.length) { const n1 = e.previousElementSibling, h1 = n1 && n1.previousElementSibling; firstSibPrev = !!n1 && n1.textContent === K.sn && !!h1 && h1.textContent === K.sh; }
        (s ? out.sib : out.rows).push(e.dataset.code);
        const t = e.querySelector(".phrase-tag"); if (t) out.tags[e.dataset.code] = t.textContent;
        out.sibTagByCard[e.dataset.code] = [...e.querySelectorAll("*")].filter(x => x.textContent === K.stg && !x.children.length).length;
        const h = e.querySelector(".cand-head"); out.cardTitleTags.push(h ? h.tagName : null);
      }
      const m = !e.children.length && (e.textContent || "").match(nfRe); if (m) out.missing.push(m[1]);
    }
    out.sibHeadingBeforeFirstSib = firstSibPrev;
    out.headings = all.filter(e => hRe.test((e.innerText || "").trim()) && vis(e)).map(e => ({ tag: e.tagName, text: e.innerText.trim(), id: e.id }));
    out.notice = leaf(K.cn).length; out.legend = leaf(K.lg).length; out.old = leaf(K.oh).length; out.stale = leaf(K.st).length; out.noResult = leaf(K.nr).length; out.inputRequired = leaf(K.ir).length;
    out.byTag = Object.keys(out.tags).length > 0;
    out.showAll = !!document.querySelector("#showAll");
    return out;
  }, { nf: A.code_not_found, rh: A.results_heading, sh: A.sibling_heading, sn: A.sibling_note, stg: A.sibling_tag, cn: A.candidate_notice, lg: A.phrase_legend, oh: A.old_text_hint, st: A.stale_hint, nr: A.no_result, ir: A.input_required });
}
/* 指定字樣之元素（葉）是否位於另一字樣元素之前（DOM 與縱座標） */
async function before(p, t1, t2isHeading) {
  return p.evaluate(([a, b, hbs]) => {
    const hb = hbs ? new RegExp(hbs) : null;
    const all = [...document.querySelectorAll("body *")];
    const find = t => all.find(e => (e.innerText || "").trim() === t && ![...e.children].some(c => (c.innerText || "").trim() === t));
    const x = find(a), y = hb ? all.find(e => hb.test((e.innerText || "").trim()) && !e.children.length) : find(b);
    if (!x || !y) return null;
    return !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top;
  }, [t1, null, t2isHeading ? "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$" : null]).catch(() => null);
}
const visibleTextCount = (p, text, sel = "body *") => p.$$eval(sel, (els, text) => els.filter(e => {
  if ((e.textContent || "").trim() !== text) return false;
  if ([...e.children].some(c => (c.textContent || "").trim() === text)) return false;
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
}).length, text);
const bodyText = p => p.evaluate(() => document.body.innerText);
const writes = p => p.evaluate(() => ({ ...window.__w, lsLen: localStorage.length, ssLen: sessionStorage.length, cookie: document.cookie }));
const w0 = x => x.ls + x.ss + x.idb + x.ck + x.lsLen + x.ssLen === 0 && x.cookie === "";
function ok(cond, detail) { return { ok: !!cond, detail }; }
/* 比對 ext 之 candidates[q]：得分列、補列、標示（逐字）；v1_9 起 ext 一律全部列（舊版 rows_head 之分支保留相容） */
function candMatch(st, q) {
  const c = CAND[q], got = st.rows.concat(st.sib);
  const rowsOk = c.rows ? same(st.rows, c.rows) && same(st.sib, c.siblings) : same(got.slice(0, 30), c.rows_head) && got.length === c.count;
  const tagsOk = setEq(Object.keys(st.tags), Object.keys(c.tags)) && Object.keys(c.tags).every(k => st.tags[k] === c.tags[k]);
  return { ok: rowsOk && tagsOk, rowsOk, tagsOk };
}

/* ───────── 列之定義 ───────── */
const R = {};
const CODE_ROW = async (ctx, url, code, org, check) => { const p = await ctx.page(url); try { await query(p, code, org); const c = await cards(p); return await check(c, p); } finally { await close(p); } };
function restrOk(c, code, nos) {
  return c && c.restr.length === nos.length && nos.every((n, i) => c.restr[i].cat === String(n) && c.restr[i].title === cat(n).title && c.restr[i].note === noteOf(code, n) && c.restr[i].rn === A.restriction_note);
}
R.Q05 = (ctx, u) => CODE_ROW(ctx, u.tool, "C802041", "有限公司", c => { const x = c[0]; return ok(x && x.code === "C802041" && x.permit === A.permit_flag && x.link && x.link.text === A.permit_link && x.link.href === A.permit_url && x.link.target === "_blank" && !/主管機關：/.test(x.text), x); });
R.Q06 = (ctx, u) => CODE_ROW(ctx, u.tool, "E801060", "有限公司", c => ok(c[0] && !c[0].permit && restrOk(c[0], "E801060", [10]), c[0]));
R.Q07 = (ctx, u) => CODE_ROW(ctx, u.tool, "J701010", "有限公司", c => ok(c[0] && !c[0].permit && restrOk(c[0], "J701010", [10]), c[0]));
R.Q08 = (ctx, u) => CODE_ROW(ctx, u.tool, "F112010", "股份有限公司", async (c, p) => ok(c[0] && !c[0].permit && restrOk(c[0], "F112010", [5]) && !(await bodyText(p)).includes(A.conflict_prefix), c[0]));
R.Q09 = (ctx, u) => CODE_ROW(ctx, u.tool, "J905010", "獨資", async (c, p) => ok(c[0] && restrOk(c[0], "J905010", [14]) && !(await bodyText(p)).includes(A.conflict_prefix), c[0]));
R.Q10 = (ctx, u) => CODE_ROW(ctx, u.tool, "H203011", "有限公司", c => ok(c[0] && c[0].permit === A.permit_flag && restrOk(c[0], "H203011", [9]), c[0]));
R.Q11 = (ctx, u) => CODE_ROW(ctx, u.tool, "I103060", "有限公司", async (c, p) => ok(c[0] && c[0].code === "I103060" && !c[0].permit && c[0].restr.length === 0 && !(await bodyText(p)).includes(A.restriction_note), c[0]));
R.Q12 = (ctx, u) => CODE_ROW(ctx, u.tool, "HZ07011", "股份有限公司", c => ok(c[0] && c[0].permit === A.permit_flag && restrOk(c[0], "HZ07011", [5, 7]) && c[0].text.includes(A.dual_category_note), c[0]));
R.Q13 = async (ctx, u, env) => {
  const m = env.report.match(/拘28「一覽表與母本不一致」清單[^：]*：(\[.*?\])/);
  const rep = m ? JSON.parse(m[1].replace(/'/g, '"')) : null;
  const p = await ctx.page(u.tool);
  try {
    await query(p, "G606011", "有限公司");
    const nf = await visibleTextCount(p, notFound("G606011"));
    const c1 = await cards(p);
    await query(p, "機場園區", "有限公司"); const c2 = await cards(p);
    return ok(rep && setEq(rep, L.not_in_master) && nf === 1 && c1.length === 0 && !c2.some(x => x.code === "G606011") && !env.src.tool.includes("G606011"), { report: rep, notFound: nf, airport: c2.map(x => x.code), srcHas: env.src.tool.includes("G606011") });
  } finally { await close(p); }
};
R.Q14 = (ctx, u) => CODE_ROW(ctx, u.tool, "H101021", "有限公司", c => ok(c[0] && c[0].text.includes(A.conflict_prefix + cat(1).title), c[0] && c[0].text));
R.Q15 = async (ctx, u) => {
  const a = await CODE_ROW(ctx, u.tool, "J905010", "有限公司", c => ok(c[0] && c[0].text.includes(A.conflict_prefix + cat(14).title), c[0] && c[0].text));
  const b = await CODE_ROW(ctx, u.tool, "J905010", "獨資", c => ok(c[0] && !c[0].text.includes(A.conflict_prefix), c[0] && c[0].text));
  return ok(a.ok && b.ok, { 有限公司: a.detail, 獨資: b.detail });
};
R.Q16 = (ctx, u) => CODE_ROW(ctx, u.tool, "ZZ99999", "有限公司", c => ok(c[0] && c[0].text.includes(A.zz_note) && c[0].text.includes(A.zz_not_alone), c[0] && c[0].text));
R.Q17 = async (ctx, u) => {
  const out = {}; let all = true;
  for (const [code, org] of [["E801060", "有限公司"], ["J701010", "有限公司"], ["F112010", "股份有限公司"], ["J905010", "獨資"], ["H203011", "有限公司"], ["HZ07011", "股份有限公司"], ["H101021", "有限公司"]]) {
    const r = await CODE_ROW(ctx, u.tool, code, org, c => ok(c[0] && c[0].restr.length > 0 && c[0].restr.every(x => x.rn === A.restriction_note && x.rn === L.remark), c[0] && c[0].restr));
    out[code] = r.ok; all = all && r.ok;
  }
  return ok(all, out);
};
R.Q42 = async (ctx, u) => { const p = await ctx.page(u.tool); try { await query(p, "咖啡廳", null); const c = await cards(p); const n = await visibleTextCount(p, A.org_required); return ok(c.length === 0 && n === 1, { cards: c.length, msg: n }); } finally { await close(p); } };
R.Q43 = async (ctx, u) => { const p = await ctx.page(u.tool); try { const o = await p.$$eval('input[name="org"]', els => els.map(e => ({ label: e.closest("label").textContent.trim(), value: e.value, checked: e.checked }))); return ok(same(o.map(x => x.label), ORGS) && o.every(x => !x.checked), o); } finally { await close(p); } };
R.Q44 = async (ctx, u) => {
  const out = {}; let all = true;
  for (const [code, n] of [["F112010", 5], ["H101021", 1], ["J905010", 14]]) {
    const r = await CODE_ROW(ctx, u.tool, code, "未定", c => ok(c[0] && !c[0].text.includes(A.conflict_prefix) && restrOk(c[0], code, [n]) && c[0].text.includes(A.org_undecided_note), c[0] && c[0].text));
    out[code] = r.ok; all = all && r.ok;
  }
  return ok(all, out);
};
R.Q18 = async (ctx, u) => { const p = await ctx.page(u.tool); try { await query(p, "室內設計", "有限公司"); await showAll(p); const c = await cards(p); const e = c.find(x => x.code === "E801060"); const i = c.find(x => x.code === "I503010"); return ok(e && restrOk(e, "E801060", [10]) && !e.permit && !(await bodyText(p)).includes("景觀、室內設計業") && (!i || i.name === "景觀設計業"), { codes: c.map(x => x.code) }); } finally { await close(p); } };
R.Q19 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try {
    await query(p, "室內設計", "有限公司"); await showAll(p); const c = await cards(p);
    const bad = c.filter(x => { const m = M[x.code]; const nm = x.code === "JA02071" ? A.ja02071_name : m[0]; return x.name !== nm || x.def !== m[2] || (m[1] && x.text.includes(m[1])); });
    const e = c.find(x => x.code === "E801060");
    const tagged = c.filter(x => x.tag !== null).map(x => x.code);
    return ok(c.length > 0 && bad.length === 0 && e && e.tag === E.tag_text["室內設計"]["E801060"] && e.name === "室內裝修業" && setEq(tagged, Object.keys(E.tag_text["室內設計"])), { bad: bad.map(x => x.code), tag: e && e.tag });
  } finally { await close(p); }
};
R.Q20 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const out = []; let all = true;
  try {
    for (const it of E.q20) {
      await query(p, it.input, "有限公司");
      const n = await visibleTextCount(p, A.old_text_hint);
      const st = await resState(p);
      let pos = null;
      if (n === 1) pos = st.rows.length ? await before(p, A.old_text_hint, true) : await p.evaluate(([oh, nr]) => { const all = [...document.querySelectorAll("body *")]; const f = t => all.find(e => e.textContent === t && !e.children.length); const x = f(oh), y = f(nr); return !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top; }, [A.old_text_hint, A.no_result]);
      const good = it.show_hint ? n === 1 && pos === true : n === 0;
      out.push({ input: it.input, nonspace_len: it.nonspace_len, expect: it.show_hint, shown: n, posAboveHeadingOrNoResult: pos, tagged: st.byTag }); all = all && good;
    }
    return ok(all, out);
  } finally { await close(p); }
};
R.Q21 = async (ctx, u) => { const p = await ctx.page(u.tool); try { await query(p, "qwerty火星挖礦", "有限公司"); const c = await cards(p); const n = await visibleTextCount(p, A.no_result); return ok(c.length === 0 && n === 1, { cards: c.map(x => x.code), noResult: n }); } finally { await close(p); } };
async function topN(ctx, url, input, codes, tagsExp) {
  const p = await ctx.page(url);
  try {
    await query(p, input, "有限公司"); await showAll(p);
    const c = await cards(p); const N = codes.length;
    const top = c.slice(0, N), rest = c.slice(N);
    const nr = await visibleTextCount(p, A.no_result);
    const good = setEq(top.map(x => x.code), codes) && top.every(x => x.tag !== null && (!tagsExp || x.tag === tagsExp[x.code])) && rest.every(x => x.tag === null) && nr === 0;
    return { ok: good, detail: { input, top: top.map(x => [x.code, x.tag]), restTagged: rest.filter(x => x.tag).map(x => x.code), count: c.length } };
  } finally { await close(p); }
}
const AC = E.appendix_c;
R.Q86 = (ctx, u) => topN(ctx, u.tool, AC[0].input, AC[0].codes, E.tag_text[AC[0].input]);
R.Q87 = (ctx, u) => topN(ctx, u.tool, AC[1].input, AC[1].codes, E.tag_text[AC[1].input]);
R.Q88 = async (ctx, u) => {
  const d = []; let all = true;
  for (const i of [5, 6, 7]) { const p = await ctx.page(u.tool); try { await query(p, AC[i].input, "有限公司"); const c = await cards(p); const g = c.length > 0 && c[0].code === AC[i].codes[0] && AC[i].codes.length === 1 && c[0].tag === E.tag_text[AC[i].input][c[0].code]; d.push({ input: AC[i].input, first: c[0] && [c[0].code, c[0].tag], count: c.length }); all = all && g; } finally { await close(p); } }
  return ok(all, d);
};
R.Q89 = async (ctx, u) => { const d = []; let all = true; for (const i of [2, 3, 4, 8, 9, 10]) { const x = await topN(ctx, u.tool, AC[i].input, AC[i].codes, E.tag_text[AC[i].input]); d.push(x.detail); all = all && x.ok; } return ok(all, d); };
R.Q90 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of [AC[10].input, E.q93.input]) {
    const p = await ctx.page(u.tool);
    try { await query(p, q, "有限公司"); await showAll(p); const c = await cards(p); const tg = c.filter(x => x.tag !== null).map(x => x.code); d[q] = c.filter(x => x.tag !== null).map(x => [x.code, x.tag]);
      // 「標」＝顯示 phrase_tag 且全文逐字等於 tag_text[該輸入][該代碼]（驗證表第三之二節前言）
      all = all && setEq(tg, E.phrase_hits[q]) && c.filter(x => x.tag !== null).every(x => x.tag === E.tag_text[q][x.code]); if (q === AC[10].input) all = all && tg.includes("E801060") && c.length > 1; } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q91 = async (ctx, u) => { const d = []; let all = true; for (const q of [E.placeholder_example, ...E.purpose_examples]) { const x = await topN(ctx, u.tool, q, E.phrase_hits[q], null); d.push(x.detail); all = all && x.ok && x.detail.count > 0; } return ok(all, d); };
const embedded = (src, id) => { const m = src.match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`)); return m ? JSON.parse(m[1]) : null; };
R.Q92 = async (ctx, u, env) => {
  const P = embedded(env.src.tool, "data-phrases"), C = embedded(env.src.tool, "data-codes");
  const codes = new Set(C.map(r => r[0])); const T = E.phrases.table;
  const nP = Object.values(P).reduce((s, v) => s + v.length, 0);
  const eq = Object.keys(T).every(k => P[k] && setEq(P[k], T[k])) && Object.keys(P).every(k => T[k]);
  const pure = Object.values(P).every(v => Array.isArray(v) && v.every(s => typeof s === "string"));
  return ok(Object.keys(P).length === E.phrases.code_count && nP === E.phrases.phrase_count && eq && Object.keys(P).every(k => codes.has(k)) && pure, { codes: Object.keys(P).length, phrases: nP, expect: [E.phrases.code_count, E.phrases.phrase_count], same: eq, pure });
};
R.Q93 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { await query(p, E.q93.input, "有限公司"); await showAll(p); const c = await cards(p); const idx = k => c.findIndex(x => x.code === k);
    const g = E.q93.phrase_codes.every(k => idx(k) >= 0 && c[idx(k)].tag) && E.q93.def_codes.every(k => idx(k) >= 0 && !c[idx(k)].tag) && Math.max(...E.q93.phrase_codes.map(idx)) < Math.min(...E.q93.def_codes.map(idx));
    return ok(g, c.map(x => [x.code, !!x.tag])); } finally { await close(p); }
};
R.Q94 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { await query(p, E.q94.word, "有限公司"); await showAll(p); const a = (await cards(p)).map(x => x.code); await query(p, E.q94.sentence, "有限公司"); await showAll(p); const b = (await cards(p)).map(x => x.code);
    return ok(E.q94.bigram_only.every(k => a.includes(k)) && !E.q94.excluded_in_sentence.some(k => b.includes(k)), { alone: a, sentence: b }); } finally { await close(p); }
};
R.Q100 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const [q, v] of Object.entries(E.q100)) { const p = await ctx.page(u.tool); try { await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); d[q] = { rows: st.rows, sib: st.sib }; all = all && same(st.rows, v.rows) && same(st.sib, v.siblings) && !v.with_he_sep_extra.some(k => st.rows.includes(k) || st.sib.includes(k)); } finally { await close(p); } }
  return ok(all, d);
};
async function topState(p) {
  return p.evaluate(([cn, lg, rhRe]) => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const find = t => [...document.querySelectorAll("body *")].filter(e => e.textContent === t && ![...e.children].some(c => c.textContent === t) && vis(e));
    const re = new RegExp(rhRe);
    const hs = [...document.querySelectorAll("body *")].filter(e => re.test((e.innerText || "").trim()) && ![...e.children].some(c => re.test((c.innerText || "").trim())) && vis(e));
    const a = find(cn), b = find(lg), first = document.querySelector("#results .cand");
    const bf = (x, y) => !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top;
    return { heading: hs.length, headingText: hs[0] ? hs[0].innerText.trim() : null, notice: a.length, legend: b.length,
      order: (a.length === 1 && first ? bf(a[0], first) : null), legendOrder: (b.length === 1 && a.length === 1 && first ? bf(a[0], b[0]) && bf(b[0], first) : null),
      headingOrder: (hs.length === 1 && a.length === 1 ? bf(hs[0], a[0]) : null), cards: document.querySelectorAll("#results .cand").length };
  }, [A.candidate_notice, A.phrase_legend, "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$"]);
}
R.Q101 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, AC[0].input, "有限公司"); d.s1 = await topState(p);
    await query(p, "機場園區", "有限公司"); d.s2 = await topState(p); d.s2codes = (await cards(p)).map(x => x.code);
    await query(p, "qwerty火星挖礦", "有限公司"); d.s3 = await topState(p); d.s3nr = await visibleTextCount(p, A.no_result);
    await query(p, "e801060", "有限公司"); d.s4 = await topState(p);
    const g = d.s1.heading === 1 && d.s1.headingText === heading(CAND[AC[0].input].scored_count) && d.s1.headingOrder && d.s1.notice === 1 && d.s1.legend === 1 && d.s1.order && d.s1.legendOrder
      && same(d.s2codes, CAND["機場園區"].rows) && d.s2.notice === 1 && d.s2.legend === 0 && d.s2.order
      && d.s3.heading === 0 && d.s3.notice === 0 && d.s3.legend === 0 && d.s3nr === 1
      && d.s4.notice === 1 && d.s4.legend === 0 && d.s4.order;
    return ok(g, d);
  } finally { await close(p); }
};
R.Q102 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of ["咖啡廳 手搖飲", "賣保養品", "接案設計logo", "接案設計LOGO", AC[0].input]) {
    const p = await ctx.page(u.tool);
    try { await query(p, q, "有限公司"); await showAll(p); const c = await cards(p); const tg = Object.fromEntries(c.filter(x => x.tag !== null).map(x => [x.code, x.tag])); d[q] = tg; const exp = E.tag_text[q];
      all = all && setEq(Object.keys(tg), Object.keys(exp)) && Object.keys(exp).every(k => tg[k] === exp[k]); } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q103 = async (ctx, u) => {
  // 驗證表 v1_8 Q103：標示之代碼集合恰等於〔抽：q103[該輸入].tags〕之鍵、全文等於其值；各碼名稱以母本 code_v8.xlsx 判（master_dump.py 獨立讀取；同 Q82）
  const d = {}; let all = true;
  const tagged = {};
  for (const [q, v] of Object.entries(E.q103)) {
    const p = await ctx.page(u.tool);
    try { await query(p, q, "有限公司"); await showAll(p); const c = await cards(p); const tg = Object.fromEntries(c.filter(x => x.tag !== null).map(x => [x.code, x.tag]));
      const nr = await visibleTextCount(p, A.no_result);
      const names = c.every(x => x.name === (x.code === "JA02071" ? A.ja02071_name : M[x.code][0]));
      const g = setEq(Object.keys(tg), Object.keys(v.tags)) && Object.keys(v.tags).every(k => tg[k] === v.tags[k]) && c.length === v.count && (v.count === 0 ? nr === 1 : nr === 0) && names;
      tagged[q] = Object.keys(tg);
      d[q] = { tagged: tg, count: c.length, expectCount: v.count, noResult: nr, names }; all = all && g; } finally { await close(p); }
  }
  // 驗證表 Q103「另：」各句（逐項明列；均已含於上開 tags 之比對）
  const removed = ["J201031", "ZZ99999", "H703090"];
  d.另 = { H601011_因保險經紀而標: (tagged["保險經紀"] || []).includes("H601011"), 已刪說法之碼被標: Object.values(tagged).flat().filter(k => removed.includes(k)), 裝修標E801010與E801060: ["E801010", "E801060"].every(k => (tagged["裝修"] || []).includes(k)) };
  all = all && !d.另.H601011_因保險經紀而標 && d.另.已刪說法之碼被標.length === 0 && d.另.裝修標E801010與E801060;
  return ok(all, d);
};
R.Q40 = async (ctx, u, env) => {
  const bp = fs.readFileSync(env.buildPy, "utf8");
  const bad = /data\.gcis\.nat\.gov\.tw/.test(env.src.tool) || /data\.gcis\.nat\.gov\.tw/.test(bp) || /^\s*(import|from)\s+(urllib|requests|http|socket)/m.test(bp);
  return ok(!bad, { toolHasCsvHost: /data\.gcis\.nat\.gov\.tw/.test(env.src.tool), buildHasCsvHost: /data\.gcis\.nat\.gov\.tw/.test(bp), buildImportsNet: /^\s*(import|from)\s+(urllib|requests|http|socket)/m.test(bp) });
};
async function attribState(p) {
  return p.evaluate(([att, disc, lic]) => {
    const els = [...document.querySelectorAll("body *")].filter(e => e.innerText === att && ![...e.children].some(c => c.innerText === att));
    const vis = els.filter(e => e.getBoundingClientRect().height > 0);
    const e = vis[0]; if (!e) return { n: 0 };
    const a = [...e.querySelectorAll("a")].find(x => x.getAttribute("href") === lic);
    const res = document.querySelector("#results"); const dd = [...document.querySelectorAll("body *")].find(x => x.textContent === disc);
    return { n: vis.length, link: !!a && a.getAttribute("target") === "_blank", fits: e.getBoundingClientRect().height <= window.innerHeight, afterResults: !!(res && (res.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)), beforeDisclaimer: !!(dd && (e.compareDocumentPosition(dd) & Node.DOCUMENT_POSITION_FOLLOWING)) };
  }, [A.attribution, A.disclaimer, LICENSE]);
}
R.Q63 = async (ctx, u) => {
  const d = []; let all = true;
  for (const w of [1366, 390]) {
    const p = await ctx.page(u.tool, w, 768);
    try {
      for (const [lab, q] of [["載入後", null], ["查詢後", AC[0].input], ["查無後", "qwerty火星挖礦"]]) {
        if (q) await query(p, q, "有限公司");
        const s = await attribState(p); d.push({ w, lab, ...s });
        all = all && s.n === 1 && s.link && s.fits && s.afterResults && s.beforeDisclaimer;
      }
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q65 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try {
    const r = await p.evaluate(() => {
      const ext = [];
      document.querySelectorAll("img,image,source,picture,object,embed").forEach(e => { const s = e.getAttribute("src") || e.getAttribute("href") || e.getAttribute("srcset") || e.getAttribute("data") || ""; if (s && !s.startsWith("data:")) ext.push(s); });
      document.querySelectorAll("*").forEach(e => { for (const pse of [null, "::before", "::after"]) { const b = getComputedStyle(e, pse).backgroundImage; if (b && b !== "none" && /url\(/.test(b) && !/url\("?data:/.test(b)) ext.push(b); } });
      return ext;
    });
    const t = await bodyText(p);
    const words = ["經濟部認可", "經濟部推薦", "官方工具"].filter(w => t.includes(w));
    return ok(r.length === 0 && words.length === 0, { externalImages: r, words });
  } finally { await close(p); }
};
R.Q66 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool); const d = {}; let all = true; const three = ["G606011", "G901011", "G902011"];
  try {
    for (const k of three) { await query(p, k, "有限公司"); const n = await visibleTextCount(p, notFound(k)); d[k] = n; all = all && n === 1; }
    for (const q of ["第一類電信", "第二類電信", "機場園區"]) { await query(p, q, "有限公司"); await showAll(p); const c = (await cards(p)).map(x => x.code); d[q] = c.filter(k => three.includes(k)); all = all && d[q].length === 0; }
    const emb = ["data-codes", "data-list", "data-phrases", "data-excepts"].map(id => (env.src.tool.match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`)) || [])[1] || "").join("");
    d.embedded = three.filter(k => emb.includes(k)); all = all && d.embedded.length === 0;
    return ok(all, d);
  } finally { await close(p); }
};
R.Q67 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {}; let all = true;
  try { for (const [q, k] of [["特定電力", "D101101"], ["加氫", "F212071"], ["網路廣告", "I301060"], ["獵槍", "JA02071"], ["寵物生命", "JZ99190"]]) { await query(p, q, "有限公司"); await showAll(p); const c = (await cards(p)).map(x => x.code); d[q] = c.includes(k); all = all && d[q]; } return ok(all, d); } finally { await close(p); }
};
R.Q68 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    for (const [k, n] of [["I102010", "一般投資顧問業"], ["I503010", "景觀設計業"], ["JA02071", A.ja02071_name]]) { await query(p, k, "有限公司"); const c = await cards(p); d[k] = c[0] && c[0].name; d[k + "_ok"] = !!c[0] && c[0].name === n; }
    const m = env.report.match(/拘30 名稱補正清單（(\d+) 筆）：\n((?:  - .*\n)*)/);
    d.report = m ? m[0] : null;
    const rep = m && m[1] === "1" && /JA02071：母本名稱欄「JA02071」→「甲式自製獵槍維修業」；出處 S07.*第七類第 39 項/.test(m[2]);
    return ok(d.I102010_ok && d.I503010_ok && d.JA02071_ok && rep, d);
  } finally { await close(p); }
};
R.Q69 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {}; let all = true;
  try { for (const q of ["e801060", " E801060 ", "E801060。"]) { await query(p, q, "有限公司"); await showAll(p); const c = await cards(p); const t = await bodyText(p); const s = await topState(p); const st = await resState(p);
      const g = c.length === 1 && same(c.map(x => x.code), CAND[q].rows) && restrOk(c[0], "E801060", [10]) && !t.includes("由常見說法") && s.notice === 1 && s.legend === 0 && st.sibHeading === 0 && st.sib.length === 0;
      d[q] = { codes: c.map(x => x.code), tagFree: !t.includes("由常見說法"), notice: s.notice, legend: s.legend, sibHeading: st.sibHeading }; all = all && g; }
    return ok(all, d); } finally { await close(p); }
};
R.Q82 = async (ctx, u, env) => {
  const C = embedded(env.src.tool, "data-codes");
  const bad = C.filter(r => { const m = M[r[0]]; return !m || r.length !== 3 || r[2] !== m[2] || (r[0] === "JA02071" ? r[1] !== A.ja02071_name : r[1] !== m[0]); }).map(r => r[0]);
  const tail1 = C.filter(r => /1$/.test(r[0])).length;
  const enIn = C.some(r => r.slice(1).some(v => v && M[r[0]] && v === M[r[0]][1] && M[r[0]][1] !== ""));
  return ok(C.length === E.master.count && bad.length === 0 && tail1 === E.master.tail_1 && !enIn, { count: C.length, bad, tail1, english: enIn });
};
R.Q83 = async (ctx, u, env) => {
  const LST = embedded(env.src.tool, "data-list");
  const exp = L.categories.map(c => ({ ...c, items: c.items.filter(i => !L.not_in_master.includes(i.code)) }));
  const occ = {}; LST.forEach(c => c.items.forEach(i => { occ[i.code] = (occ[i.code] || 0) + 1; }));
  const multi = Object.keys(occ).filter(k => occ[k] > 1).sort();
  return ok(LST.length === L.category_count && same(LST, exp) && same(multi, L.multi_category), { count: LST.length, equal: same(LST, exp), multi });
};
R.Q84 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const bad = []; let n = 0;
  try {
    for (const c of L.categories) {
      const code = c.items.find(i => !L.not_in_master.includes(i.code)).code;
      for (let oi = 0; oi < ORGS.length; oi++) {
        await query(p, code, ORGS[oi]); const cc = await cards(p); n++;
        const shown = !!cc[0] && cc[0].text.includes(A.conflict_prefix + c.title);
        const exp = ORGS[oi] === "未定" ? false : SPEC_CONFLICT[c.no][oi];
        if (shown !== exp || (ORGS[oi] === "未定" && cc[0] && cc[0].text.includes(A.conflict_prefix))) bad.push([c.no, code, ORGS[oi], shown]);
      }
    }
    return ok(n === 90 && bad.length === 0, { cells: n, bad });
  } finally { await close(p); }
};
async function footState(p) {
  return p.evaluate(([disc, sig, book, bt, ver]) => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const all = [...document.querySelectorAll("body *")];
    const leaf = t => all.filter(e => (e.innerText || "").trim() === t && ![...e.children].some(c => (c.innerText || "").trim() === t) && vis(e));
    const d = leaf(disc), s = all.filter(e => e.tagName === "A" && e.textContent.trim() === sig && vis(e)), b = all.filter(e => e.tagName === "A" && e.innerText.trim() === book && vis(e)), sm = all.filter(e => e.tagName === "SUMMARY" && e.textContent.trim() === bt && vis(e)), v = leaf(ver);
    const seq = [d[0], s[0], b[0], sm[0], v[0]];
    let dom = seq.every(Boolean), y = dom;
    for (let i = 0; dom && i < 4; i++) { dom = dom && !!(seq[i].compareDocumentPosition(seq[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING); y = y && seq[i].getBoundingClientRect().top < seq[i + 1].getBoundingClientRect().top; }
    return { disc: d.length, sig: s.length, book: b.length, summary: sm.length, ver: v.length, dom, y };
  }, [A.disclaimer, A.signature, A.booking, A.basis_title, A.version_line]);
}
async function eachWidth(ctx, url, fn, states = [null, "室內設計"], h = 768) {
  const d = []; let all = true;
  for (const w of WIDTHS) {
    const p = await ctx.page(url, w, h);
    try { for (const q of states) { if (q) await query(p, q, "有限公司"); const r = await fn(p, w, q); d.push({ w, q, ...r.detail }); all = all && r.ok; } } finally { await close(p); }
  }
  return ok(all, d);
}
R.Q70 = (ctx, u) => eachWidth(ctx, u.tool, async p => { const s = await footState(p); return ok(s.disc === 1 && s.sig === 1 && s.book === 1 && s.ver === 1 && s.summary === 1 && s.dom && s.y, s); });
R.Q71 = (ctx, u) => eachWidth(ctx, u.tool, async p => {
  const s = await p.evaluate(sig => { window.scrollTo(0, document.documentElement.scrollHeight); const a = [...document.querySelectorAll("a")].filter(e => e.textContent.trim() === sig); const e = a[0]; if (!e) return { n: 0 }; const r = e.getBoundingClientRect(); return { n: a.length, text: e.textContent, href: e.getAttribute("href"), target: e.getAttribute("target"), inView: r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth }; }, A.signature);
  return ok(s.n === 1 && s.text === A.signature && s.text.includes("\uFF5C") && s.href === A.signature_url && s.target === "_blank" && s.inView, s);
});
async function bookingState(p) {
  return p.evaluate(([book, url, oldU, oldA]) => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const links = [...document.querySelectorAll("a")].filter(a => (a.innerText.trim() === book || a.getAttribute("href") === url || (a.getAttribute("aria-label") || "").startsWith(book)) && vis(a) && a.tabIndex >= 0);
    const a = links[0];
    // 連結文字以 innerText 判定；「↗」以 ::after 或 aria-hidden 之元素呈現皆可（規格 v1_12 第七節第五項，G-08）
    const txt = a ? [...a.childNodes].filter(n => !(n.nodeType === 1 && n.getAttribute("aria-hidden") === "true")).map(n => n.textContent).join("").trim() : null;
    return { n: links.length, text: txt, href: a && a.getAttribute("href"), target: a && a.getAttribute("target"), rel: a && a.getAttribute("rel"), aria: a && a.getAttribute("aria-label"), domOld: document.documentElement.outerHTML.includes(oldU) || document.documentElement.outerHTML.includes(oldA) };
  }, [A.booking, A.booking_url, A.booking_url_old, A.booking_aria_old]);
}
const bookingOk = s => s.n === 1 && s.text === A.booking && s.href === A.booking_url && s.target === "_blank" && /noopener/.test(s.rel || "") && s.aria === A.booking_aria && !s.domOld;
R.Q72 = async (ctx, u, env) => {
  const r = await eachWidth(ctx, u.tool, async p => { const s = await bookingState(p); return ok(bookingOk(s), s); });
  const srcOld = env.src.tool.includes(A.booking_url_old) || env.src.tool.includes(A.booking_aria_old);
  return ok(r.ok && !srcOld, { srcOld, rows: r.detail });
};
R.Q73 = (ctx, u) => eachWidth(ctx, u.tool, async p => {
  const s = await p.evaluate(([bt, book, ver]) => {
    const sm = [...document.querySelectorAll("details > summary")].filter(e => e.textContent.trim() === bt); if (sm.length !== 1) return { n: sm.length };
    const det = sm[0].parentElement; const closed = !det.open;
    const b = [...document.querySelectorAll("a")].find(a => a.innerText.trim() === book); const v = [...document.querySelectorAll("body *")].find(e => e.textContent.trim() === ver && !e.children.length);
    const pos = !!b && !!v && !!(b.compareDocumentPosition(det) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(det.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING);
    det.open = true; const items = [...det.querySelectorAll("li")].map(l => l.innerText.trim()); det.open = false;
    return { n: 1, closed, pos, items };
  }, [A.basis_title, A.booking, A.version_line]);
  return ok(s.n === 1 && s.closed && s.pos && same(s.items, [A.basis_item_1, A.basis_item_2, A.basis_item_3, A.basis_item_4]), s);
});
R.Q74 = (ctx, u) => eachWidth(ctx, u.tool, async p => {
  const s = await p.evaluate(ver => { const a = [...document.querySelectorAll(".as-of")]; return { n: a.length, text: a[0] && a[0].innerText }; }, A.version_line);
  return ok(s.n === 1 && s.text === A.version_line && !s.text.includes(A.forbidden_version_suffix), s);
});
R.Q75 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { const h = await p.evaluate(() => ({ title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content, robots: (document.querySelector('meta[name="robots"]') || {}).content, tv: (document.querySelector('meta[name="tool-version"]') || {}).content, lang: document.documentElement.lang }));
    return ok(h.title === A.meta_title && h.desc === A.meta_description && h.robots === "index,follow" && h.tv === A.tool_version && !h.tv.includes(A.forbidden_version_suffix) && ["zh-Hant", "zh-TW"].includes(h.lang), h); } finally { await close(p); }
};
R.Q76 = async (ctx, u) => {
  const d = []; let all = true;
  const sw = p => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: window.innerWidth }));
  for (const w of WIDTHS) {
    const p = await ctx.page(u.tool, w, 768);
    try {
      const steps = [["載入後", async () => { }], ["製造", async () => query(p, "製造", "有限公司")], ["顯示全部", async () => showAll(p)],
        ["展開依據說明", async () => p.evaluate(() => { document.querySelector("details").open = true; })], ["附錄C第0句", async () => query(p, AC[0].input, "有限公司")],
        ["q20[0]", async () => query(p, E.q20[0].input, "有限公司")], ["300字", async () => { await p.fill("#biz", "咖".repeat(300)); await p.dispatchEvent("#biz", "input"); }],
        ["補列（寵物店 寵物美容 寵物旅館，顯示全部）", async () => { await query(p, "寵物店 寵物美容 寵物旅館", "有限公司"); await showAll(p); }],
        ["stale_hint", async () => { await query(p, "室內設計", "有限公司"); await p.fill("#biz", "室內設計 咖啡廳"); }]];
      for (const [lab, f] of steps) { await f(); const s = await sw(p); const g = s.sw <= s.iw && s.bw <= s.iw; d.push({ w, lab, ...s }); all = all && g; }
      const st = await resState(p); d.push({ w, lab: "（stale_hint 狀態核對）", stale: st.stale });
    } finally { await close(p); }
  }
  return ok(all, d);
};
async function firstVisible(p) {
  return p.evaluate(() => { const c = document.querySelector("#results .cand"); if (!c) return { ok: false }; const r1 = c.querySelector(".cand-code").getBoundingClientRect(), r2 = c.querySelector(".cand-name").getBoundingClientRect(); const inV = r => r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth; const top = document.elementFromPoint(r1.left + 2, r1.top + r1.height / 2); return { ok: inV(r1) && inV(r2) && !!top && c.contains(top), codeTop: r1.top, nameBottom: r2.bottom }; });
}
R.Q77 = async (ctx, u) => {
  const d = []; let all = true;
  for (const [w, h] of [[1366, 768], [1024, 640], [390, 844]]) {
    const p = await ctx.page(u.tool, w, h);
    try {
      await query(p, "室內設計", "有限公司"); await p.waitForTimeout(100);
      const s = await firstVisible(p);
      await p.evaluate(() => window.scrollTo(0, 0)); await query(p, "室內設計", null); await p.waitForTimeout(100);
      const m = await p.evaluate(t => { const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); if (!e) return false; const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }, A.org_required);
      d.push({ w, h, first: s.ok, orgRequired: m }); all = all && s.ok && m;
    } finally { await close(p); }
  }
  return ok(all, d);
};
const Q109_IN = ["E801060,E801010", "E801060、G606011", "G606011 G901011", "e801060 i103060 E801060"];
const Q109_TEXT = ["E801060 室內裝修", "E80106", "E8010600"]; // v1_9：有任一段不是 7 碼代碼即依文字比對
const Q112_IN = ["開豆花店", "保險經紀", "做婚禮花藝", "賣清潔用品", "做寵物美容", "賣化妝品", "腳底按摩", "室內裝修", "經營網路平台", "電商倉儲、電商", "車輛美容"]; // v1_9 增後五句
const Q113_IN = ["做手工皂", "跨境電商", "桌遊店"]; // v1_9：「室內裝修」移至 Q112
const Q113_LISTED = { 做手工皂: ["C802100", "F208040"], 桌遊店: ["F209060", "J701040"], 跨境電商: ["F399040", "F401010"] }; // 驗證表 Q113 應得輸出括號所列（與 tag_text 之鍵另行核對）
const Q114_IN = ["有一間小工廠做麵包，賣給早餐店跟超市，也有自己的門市", "進口橄欖油，賣給餐廳跟網路客人", "開早餐店，也做外送", "賣給超市\n開早餐店",
  "賣給餐廳 開早餐店", "做麵包，供應給餐廳", "賣給、早餐店", "開早餐店客戶是", "賣給超市！開早餐店", "賣給超市？開早餐店", "做麵包，賣給超市，供應給餐廳，也開早餐店"]; // v1_9 增後七句
const Q115_IN = ["果園", "土木工程", "理財規劃", "CNC加工", "安親", "茶葉", "在網路平台賣", "包裝", "手作", "工程行", "電商倉儲", "居家清潔用品", "賣油漆", "保單健檢", "租賃小客車", "企劃", "水電材料", "建築工程",
  "網路平台", "經營網路平台", "企業企劃", "車輛美容", "茶葉批發"]; // v1_9 增後五句
const Q78_QUERIES = [["C802041", "有限公司"], ["E801060", "有限公司"], ["J701010", "有限公司"], ["F112010", "股份有限公司"], ["J905010", "獨資"], ["H203011", "有限公司"], ["I103060", "有限公司"], ["HZ07011", "股份有限公司"], ["G606011", "有限公司"], ["機場園區", "有限公司"], ["H101021", "有限公司"], ["J905010", "有限公司"], ["ZZ99999", "有限公司"], ["室內設計", "有限公司"], ...E.q20.map(x => [x.input, "有限公司"]), ["qwerty火星挖礦", "有限公司"], ["咖啡廳", null], ["F112010", "未定"], ["H101021", "未定"], ["J905010", "未定"], ["G901011", "有限公司"], ["G902011", "有限公司"], ["第一類電信", "有限公司"], ["第二類電信", "有限公司"], ["特定電力", "有限公司"], ["加氫", "有限公司"], ["網路廣告", "有限公司"], ["獵槍", "有限公司"], ["寵物生命", "有限公司"], ["I102010", "有限公司"], ["I503010", "有限公司"], ["JA02071", "有限公司"], ["e801060", "有限公司"], [" E801060 ", "有限公司"], ["E801060。", "有限公司"], ...AC.map(x => [x.input, "有限公司"]), [E.placeholder_example, "有限公司"], ...E.purpose_examples.map(x => [x, "有限公司"]), [E.q93.input, "有限公司"], [E.q94.word, "有限公司"], ...Object.keys(E.q100).map(x => [x, "有限公司"]), ["咖啡廳 手搖飲", "有限公司"], ["賣保養品", "有限公司"], ["接案設計LOGO", "有限公司"], ...Object.keys(E.q103).map(x => [x, "有限公司"]), ["製造", "有限公司"], ["當舖", "有限公司"], ["咖啡廳 飲料", "有限公司"], ["室內、設計", "有限公司"],
  ...Q109_IN.map(x => [x, "有限公司"]), ...Q109_TEXT.map(x => [x, "有限公司"]), ["咖啡廳 一", "有限公司"], ["賣化妝品", "有限公司"], ["做業務", "有限公司"], ...Q112_IN.map(x => [x, "有限公司"]), ...Q113_IN.map(x => [x, "有限公司"]), ...Q114_IN.map(x => [x, "有限公司"]), ...Q115_IN.map(x => [x, "有限公司"]), ["寵物店 寵物美容 寵物旅館", "有限公司"], ["咖啡廳.蛋糕", "有限公司"], ["咖啡廳．蛋糕", "有限公司"], ["飲料店 餐飲業", "有限公司"],
  ...E.all_inputs.map(x => [x, "有限公司"])]; // v1_8：含 Q128 全部輸入
R.Q78 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    for (const [q, o] of Q78_QUERIES) { await query(p, q, o); await showAll(p); }
    await p.fill("#biz", "咖".repeat(300)); await p.dispatchEvent("#biz", "input"); await query(p, "賣保養品", "有限公司");
    await p.check('input[name="org"][value="獨資"]'); await p.fill("#biz", "賣保養品 改");
    await p.evaluate(() => { const d = document.querySelector("details"); d.open = true; d.open = false; });
    await p.emulateMedia({ media: "print" }); await p.emulateMedia({ media: "screen" });
    await p.waitForTimeout(300);
    const own = r => r === p.__url;
    const other = p.__req.filter(r => !own(r)); const wr = await writes(p);
    const srcBad = ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket"].filter(s => env.src.tool.includes(s));
    await p.reload({ waitUntil: "load" });
    const rl = await p.evaluate(() => ({ v: document.querySelector("#biz").value, cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent }));
    const wr2 = await writes(p);
    const ph = await p.evaluate(t => { const ta = document.querySelector("#biz"); const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); return !!e && Math.abs(e.getBoundingClientRect().top - ta.getBoundingClientRect().bottom) < 60; }, A.privacy_hint);
    const disc = (await bodyText(p)).includes("不會送出，也不會保存；重新整理即清空。");
    const other2 = p.__req.filter(r => !own(r));
    return ok(other.length === 0 && other2.length === 0 && srcBad.length === 0 && w0(wr) && w0(wr2) && rl.v === "" && rl.cards === 0 && rl.res === "" && ph && disc,
      { queries: Q78_QUERIES.length + 1, requestsTotal: p.__req.length, requestsOtherThanPage: other2, srcBad, writes: wr, writesAfterReload: wr2, reload: rl, privacyHint: ph, disclaimer: disc, pageErrors: p.__errs });
  } finally { await close(p); }
};
R.Q79 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, "咖啡廳 飲料", "有限公司"); await showAll(p); const a = await resState(p);
    const xa = CAND["咖啡廳 飲料"];
    d.a = { rows: a.rows, sib: a.sib, ok: a.rows[0] === "F501030" && same(a.rows, xa.rows) && same(a.sib, xa.siblings) };
    await query(p, "室內、設計", "有限公司"); await showAll(p); const b = await resState(p); const all = b.rows.concat(b.sib);
    const xb = CAND["室內、設計"];
    d.b = { count: all.length, head: all.slice(0, 30), ok: all.includes("E801060") && (xb.rows ? same(b.rows, xb.rows) && same(b.sib, xb.siblings) : same(all.slice(0, 30), xb.rows_head) && all.length === xb.count) };
    return ok(d.a.ok && d.b.ok, d);
  } finally { await close(p); }
};
R.Q85 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, "製造", "有限公司"); const n1 = (await cards(p)).length; const btn = await p.$("#showAll"); const bt = btn ? await btn.textContent() : null;
    if (btn) await btn.click(); const n2 = (await cards(p)).length; const gone = !(await p.$("#showAll"));
    await query(p, "當舖", "有限公司"); const n3 = (await cards(p)).length; const btn2 = await p.$("#showAll");
    const N = CAND["製造"].count;
    Object.assign(d, { first: n1, button: bt, all: n2, gone, pawn: n3, pawnButton: !!btn2 });
    return ok(n1 === 30 && bt === A.show_all_btn.replace("N", String(N)) && n2 === N && gone && n3 <= 30 && n3 > 0 && !btn2, d);
  } finally { await close(p); }
};
async function headState(p) {
  return p.evaluate(([t, lead, c8]) => {
    const h = [...document.querySelectorAll("h1")]; const r = h[0] && h[0].getBoundingClientRect();
    const ta = document.querySelector("#biz,textarea");
    const leadEl = [...document.querySelectorAll("p")].find(e => e.innerText.trim() === lead);
    const ol = leadEl && leadEl.nextElementSibling;
    const li = ol && ol.tagName === "OL" ? [...ol.children].map(x => x.innerText.trim()) : null;
    const after = (x, y) => !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { h1: h.length, text: h[0] && h[0].innerText, inView: !!r && r.top >= 0 && r.bottom <= window.innerHeight && window.scrollY === 0, leadAfterH1: after(h[0], leadEl), olBeforeInput: ta ? after(ol, ta) : true, li, c8: document.body.innerText.includes(c8) };
  }, [A.page_title, A.purpose_lead, C8_PURPOSE]);
}
function rawHas(raw) {
  raw = raw.replace(/<script[\s\S]*?<\/script>/g, ""); // 原始 HTML 之標記本身；script 內之字串不算
  const h1 = (raw.match(/<h1[\s>][\s\S]*?<\/h1>/g) || []);
  const strip = s => s.replace(/<[^>]+>/g, "");
  const hasLead = raw.includes(A.purpose_lead);
  const lis = [A.purpose_item_1, A.purpose_item_2, A.purpose_item_3].every(t => new RegExp(`<li>${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</li>`).test(raw));
  return { h1: h1.length, h1text: h1[0] && strip(h1[0]), hasLead, lis, c8: raw.includes(C8_PURPOSE) };
}
R.Q95 = async (ctx, u) => {
  const d = []; let all = true;
  for (const w of WIDTHS) { const p = await ctx.page(u.tool, w, 768); try { const s0 = await headState(p); await query(p, "室內設計", "有限公司"); const s1 = await headState(p); const rw = rawHas(p.__raw);
    const g = s0.h1 === 1 && s0.text === A.page_title && s0.inView && s1.h1 === 1 && s1.text === A.page_title && rw.h1 === 1 && rw.h1text === A.page_title; d.push({ w, load: s0, after: { h1: s1.h1, text: s1.text }, raw: rw }); all = all && g; } finally { await close(p); } }
  return ok(all, d);
};
R.Q96 = async (ctx, u, env) => {
  const d = []; let all = true;
  for (const w of WIDTHS) { const p = await ctx.page(u.tool, w, 768); try { const s0 = await headState(p); await query(p, "室內設計", "有限公司"); const s1 = await headState(p); const rw = rawHas(p.__raw);
    const items = [A.purpose_item_1, A.purpose_item_2, A.purpose_item_3];
    const g = [s0, s1].every(s => s.leadAfterH1 && s.olBeforeInput && same(s.li, items) && !s.c8) && rw.hasLead && rw.lis && !rw.c8 && !env.src.tool.includes(C8_PURPOSE); d.push({ w, load: s0, after: s1, raw: rw }); all = all && g; } finally { await close(p); } }
  return ok(all, d);
};
R.Q97 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { const s = await p.evaluate(() => { const ta = document.querySelector("#biz"); const lab = document.querySelector(`label[for="${ta.id}"]`); const ids = (ta.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean); return { label: lab && lab.textContent.trim(), ph: ta.getAttribute("placeholder"), described: ids.map(i => (document.getElementById(i) || {}).textContent) }; });
    return ok(s.label === A.input_label && s.ph === A.input_placeholder && s.described.includes(A.privacy_hint), s); } finally { await close(p); }
};
R.Q98 = async (ctx, u) => {
  const chk = p => p.evaluate(([i3, i4]) => { const det = document.querySelector("details"); det.open = true; const all = [...document.querySelectorAll("body *")].filter(e => e.innerText && e.innerText.trim() === i4 && !e.children.length); const e = all[0]; const t3 = [...document.querySelectorAll("li")].find(x => x.innerText.trim() === i3); const r = { n: all.length, inDetails: !!e && det.contains(e), after3: !!e && !!t3 && !!(t3.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) }; det.open = false; return r; }, [A.basis_item_3, A.basis_item_4]);
  const r = await eachWidth(ctx, u.tool, async p => { const s = await chk(p); return ok(s.n === 1 && s.inDetails && s.after3, s); }, [null]);
  const p = await ctx.page(u.tool); let s;
  try { await query(p, AC[0].input, "有限公司"); s = await chk(p); s.tagged = (await cards(p)).some(x => x.tag); } finally { await close(p); }
  return ok(r.ok && s.n === 1 && s.inDetails && s.after3 && s.tagged, { widths: r.detail, result: s });
};
R.Q104 = async (ctx, u) => {
  const st = p => p.evaluate(t => { const ta = document.querySelector("#biz"); const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; }; const hs = [...document.querySelectorAll("body *")].filter(e => e.textContent === t && !e.children.length && vis(e)); const ids = (ta.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean); return { len: [...ta.value].length, ml: ta.getAttribute("maxlength"), hints: hs.length, described: ids.some(i => { const e = document.getElementById(i); return e && e.textContent.includes(t) && vis(e); }) }; }, A.input_max_hint);
  const d = {}; const p = await ctx.page(u.tool);
  try {
    await p.check('input[name="org"][value="有限公司"]');
    await p.click("#biz"); await p.keyboard.type("咖啡廳".repeat(100) + "店"); d.typed = await st(p);
    await p.click("#searchBtn"); d.searchAfterTyped = await p.evaluate(() => ({ disabled: document.querySelector("#searchBtn").disabled, cards: document.querySelectorAll("#results .cand").length }));
    await p.fill("#biz", ""); await p.click("#biz"); await p.keyboard.insertText("店".repeat(400)); d.pasted = await st(p);
    await p.fill("#biz", ""); await p.click("#biz"); await p.keyboard.insertText("店".repeat(299)); d.n299 = await st(p);
    const g = [d.typed, d.pasted].every(s => s.len === 300 && s.ml === "300" && s.hints === 1 && s.described) && d.n299.hints === 0 && !d.searchAfterTyped.disabled && d.searchAfterTyped.cards > 0;
    return ok(g, d);
  } finally { await close(p); }
};
R.Q105 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, AC[0].input, "有限公司");
    d.s1 = await p.evaluate(input => {
      const res = document.querySelector("#results"); const above = e => !!e && (e.getBoundingClientRect().top < res.getBoundingClientRect().top) && !!(e.compareDocumentPosition(res) & Node.DOCUMENT_POSITION_FOLLOWING) && e.getBoundingClientRect().height > 0;
      const ta = document.querySelector("#biz"); const org = document.querySelector('input[name="org"]:checked');
      const echo = [...document.querySelectorAll("body *")].filter(e => e !== ta && !e.children.length && (e.textContent || "").includes(input)).length;
      return { h1: above(document.querySelector("h1")), ol: above(document.querySelector("ol")), ta: above(ta), taVal: ta.value === input, org: org && org.value, btn: above(document.querySelector("#searchBtn")), echo };
    }, AC[0].input);
    await p.fill("#biz", "qwerty火星挖礦"); await p.click("#searchBtn");
    d.s2 = { cards: (await cards(p)).length, nr: await visibleTextCount(p, A.no_result) };
    await p.fill("#biz", "製造"); await p.click("#searchBtn"); await showAll(p);
    await p.fill("#biz", "早餐店"); await p.click("#searchBtn");
    const st = await resState(p);
    d.s4 = { rows: st.rows, sib: st.sib, btn: st.showAll, notice: st.notice, hint: st.old, stale: st.stale };
    const x = CAND["早餐店"];
    const g = d.s1.h1 && d.s1.ol && d.s1.ta && d.s1.taVal && d.s1.org === "有限公司" && d.s1.btn && d.s1.echo === 0 && d.s2.cards === 0 && d.s2.nr === 1 && same(st.rows, x.rows) && same(st.sib, x.siblings) && !st.showAll && st.notice === 1 && st.old === 0 && st.stale === 0;
    return ok(g, d);
  } finally { await close(p); }
};
R.Q106 = async (ctx, u) => {
  const snap = p => p.evaluate(([disc, ver, att]) => { document.querySelectorAll("details").forEach(x => { x.open = false; }); const all = [...document.querySelectorAll("body *")]; const d = all.find(e => e.textContent === disc && !e.children.length); const v = all.find(e => e.textContent === ver && !e.children.length); let f = d; while (f && !(f.contains(v))) f = f.parentElement; const a = all.find(e => e.innerText === att && ![...e.children].some(c => c.innerText === att)); return { foot: f ? f.outerHTML : null, att: a ? a.outerHTML : null }; }, [A.disclaimer, A.version_line, A.attribution]);
  const d = []; let all = true;
  for (const w of [1366, 390]) {
    const p = await ctx.page(u.tool, w, 768);
    try { const s = [await snap(p)]; await query(p, AC[0].input, "有限公司"); s.push(await snap(p)); await query(p, "qwerty火星挖礦", "有限公司"); s.push(await snap(p)); await query(p, "製造", "有限公司"); await showAll(p); s.push(await snap(p));
      const g = s.every(x => x.foot && x.foot === s[0].foot && x.att && x.att === s[0].att); d.push({ w, sameFoot: s.map(x => x.foot === s[0].foot), sameAtt: s.map(x => x.att === s[0].att) }); all = all && g; } finally { await close(p); }
  }
  return ok(all, d);
};
async function q107Engine(browser, url, origin) {
  const ctx = new Ctx(browser); const p = await ctx.page(url);
  const st = () => p.evaluate(() => ({ v: document.querySelector("#biz").value, org: !!document.querySelector('input[name="org"]:checked'), res: document.querySelector("#results").textContent, cards: document.querySelectorAll("#results .cand").length, detailsOpen: [...document.querySelectorAll("details")].some(d => d.open), ac: [document.querySelector("#biz").getAttribute("autocomplete"), ...[...document.querySelectorAll('input[name="org"]')].map(r => r.getAttribute("autocomplete"))], pageshow: window.__ps.slice() }));
  const openBasis = () => p.evaluate(() => { document.querySelectorAll("details").forEach(d => { d.open = true; }); });
  try {
    await query(p, AC[0].input, "有限公司"); await openBasis(); await p.reload({ waitUntil: "load" }); const a = await st();
    await query(p, AC[0].input, "有限公司"); await openBasis(); await p.goto(origin + "/other.html", { waitUntil: "load" });
    await p.goBack({ waitUntil: "commit" }); await p.waitForTimeout(800); const b = await st();
    const wr = await writes(p);
    const clean = s => s.v === "" && !s.org && s.res === "" && s.cards === 0 && !s.detailsOpen && s.ac.every(x => x === "off");
    return { ok: clean(a) && clean(b) && w0(wr), reload: a, back: b, writes: wr };
  } finally { await close(p); }
}
R.Q107 = async (ctx, u) => {
  const origin = `http://127.0.0.1:${PORT}`;
  const c1 = await q107Engine(ctx.browser, u.tool, origin);
  let c2;
  try { const b = await chromium.launch({ channel: "chromium", ignoreDefaultArgs: ["--disable-back-forward-cache"] }); try { c2 = await q107Engine(b, u.tool, origin); } finally { await b.close(); } }
  catch (e) { c2 = { ok: false, error: String(e.message).split("\n")[0] }; }
  const chromiumOk = c1.ok && c2.ok;
  const detail = { chromium_playwright_default: c1, chromium_bfcache_enabled: c2, firefox: "未執行", webkit: "未執行", note: "Chromium 以 Playwright 預設（停用往返快取）與完整 Chromium 啟用往返快取兩種設定各跑一次；Firefox、WebKit 依七題之七於 115/10/23 後以本機 Code 會話補跑，三引擎未齊，本列記未執行" };
  return { ok: chromiumOk ? null : false, detail };
};
R.Q108 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    await p.waitForTimeout(300);
    const res = await p.evaluate(() => [...document.querySelectorAll("link,script,img,source,iframe")].map(e => e.getAttribute("src") || e.getAttribute("href")).filter(s => s && !s.startsWith("data:")));
    const words = ["fonts.googleapis.com", "fonts.gstatic.com", "@font-face", "@import"].filter(w => env.src.tool.includes(w));
    const ff = await p.evaluate(() => getComputedStyle(document.body).fontFamily);
    return ok(res.length === 0 && words.length === 0 && p.__req.length === 1, { nonDataRefs: res, words, requests: p.__req, fontFamily: ff });
  } finally { await close(p); }
};
/* ───────── 八之二、c10 新增 ───────── */
R.Q109 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q109_IN.concat(Q109_TEXT)) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const t = await topState(p); const c = CAND[q];
      const nfOrder = await p.evaluate(([texts]) => { const all = [...document.querySelectorAll("body *")]; const els = texts.map(t => all.filter(e => e.textContent === t && !e.children.length)); const h = document.querySelector("#results h2"); return { counts: els.map(x => x.length), aboveHeading: els.every(x => !x[0] || !h || (!!(x[0].compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) && x[0].getBoundingClientRect().top < h.getBoundingClientRect().top)) }; }, [c.missing.map(notFound)]);
      let g;
      if (Q109_TEXT.includes(q)) { // v1_9 三句：mode 為 text；得分列、補列與標示等於 candidates；不顯示 code_not_found
        const m = candMatch(st, q);
        g = c.mode === "text" && m.ok && st.missing.length === 0 && (c.rows.length ? t.heading === 1 && t.headingText === heading(c.scored_count) : t.heading === 0);
        d[q] = { mode: c.mode, rows: st.rows, sib: st.sib, tags: st.tags, missingShown: st.missing, match: m, heading: t.headingText };
      } else {
        g = c.mode === "code" && same(st.rows, c.rows) && same(st.missing, c.missing) && nfOrder.counts.every(n => n === 1) && nfOrder.aboveHeading && Object.keys(st.tags).length === 0 && st.sibHeading === 0 && st.sib.length === 0
          && (c.rows.length === 0 ? t.heading === 0 && t.notice === 0 : t.heading === 1 && t.headingText === heading(c.scored_count));
        d[q] = { mode: c.mode, rows: st.rows, missing: st.missing, nf: nfOrder, heading: t.heading, headingText: t.headingText, notice: t.notice, sibHeading: st.sibHeading };
      }
      all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q110 = async (ctx, u) => {
  const d = {};
  for (const q of ["咖啡廳 一", "咖啡廳"]) { const p = await ctx.page(u.tool); try { await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); d[q] = { rows: st.rows, sib: st.sib, tags: st.tags }; } finally { await close(p); } }
  const x = CAND["咖啡廳"];
  return ok(same(d["咖啡廳 一"], d["咖啡廳"]) && same(d["咖啡廳"].rows, x.rows) && same(d["咖啡廳"].sib, x.siblings) && same(d["咖啡廳"].tags, x.tags), d);
};
R.Q111 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of ["賣化妝品", "咖啡廳 飲料", "做業務", "飲料店 餐飲業"]) { // v1_8 增第四句
    const p = await ctx.page(u.tool);
    try {
      await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const c = CAND[q];
      const tagged = st.rows.map(k => !!st.tags[k]); const lastT = tagged.lastIndexOf(true), firstU = tagged.indexOf(false);
      const orderOk = c.rows ? same(st.rows, c.rows) : same(st.rows.concat(st.sib).slice(0, 30), c.rows_head);
      let g = (lastT < 0 || firstU < 0 || lastT < firstU) && orderOk;
      if (q === "賣化妝品") g = g && st.rows[0] === "F208040" && !!st.tags.F208040;
      d[q] = { head: st.rows.slice(0, 8), taggedFirst: lastT < 0 || firstU < 0 || lastT < firstU, orderOk }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q112 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q112_IN) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const exp = tagsOf(q);
      const supCodes = [...new Set(CAND[q].suppressed.map(x => x[1]))].filter(k => !(k in exp));
      let g = setEq(Object.keys(st.tags), Object.keys(exp)) && Object.keys(exp).every(k => st.tags[k] === exp[k]) && supCodes.every(k => !st.tags[k]);
      if (q === "開豆花店") g = g && !st.rows.includes("F201070") && !st.sib.includes("F201070");
      if (q === "保險經紀") g = g && !st.tags.J602010;
      // v1_9 增列之句之明列條件
      if (q === "腳底按摩") g = g && !st.tags.JF01020;
      if (q === "室內裝修") g = g && !st.tags.E801010;
      if (q === "經營網路平台") g = g && !!st.tags.I301030 && !st.tags.F399040;
      if (q === "電商倉儲、電商") g = g && !!st.tags.F399040;
      if (q === "車輛美容") g = g && !!st.tags.JA01010 && !st.tags.JZ99080;
      d[q] = { tags: st.tags, suppressed: CAND[q].suppressed, suppressedCodesUntagged: supCodes.every(k => !st.tags[k]) }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q113 = async (ctx, u, env) => {
  const d = {}; let all = true;
  for (const q of Q113_IN) {
    const p = await ctx.page(u.tool);
    try { await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const exp = tagsOf(q); d[q] = st.tags; all = all && setEq(Object.keys(st.tags), Object.keys(exp)) && Object.keys(exp).every(k => st.tags[k] === exp[k]) && setEq(Object.keys(st.tags), Q113_LISTED[q]); } finally { await close(p); }
  }
  const X = embedded(env.src.tool, "data-excepts");
  d.embeddedExcepts = X ? X.length : null;
  const exOk = !!X && same(X, E.appendix_d.map(e => [e.short, e.long, e.codes]));
  d.embeddedEqualsAppendixD = exOk;
  return ok(all && exOk && E.appendix_d.length === 13 && X.length === 13, d); // v1_9：13 對（刪第 58、66 對）
};
R.Q114 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q114_IN) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const m = candMatch(st, q);
      let g = m.ok;
      if (q === Q114_IN[0]) g = g && !st.rows.includes("F301020") && !st.rows.includes("F501060");
      if (q === Q114_IN[1]) g = g && !st.tags.F501060;
      if (q === Q114_IN[2] || q === Q114_IN[3]) g = g && !!st.tags.F501060;
      if (q === "賣給餐廳 開早餐店") g = g && !!st.tags.F501060;
      if (q === "做麵包，供應給餐廳") g = g && !st.rows.includes("F501060");
      d[JSON.stringify(q)] = { rows: st.rows, sib: st.sib, tags: st.tags, match: m }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q115 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const q of Q115_IN) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const exp = tagsOf(q); const n = st.rows.length + st.sib.length;
      let g = setEq(Object.keys(st.tags), Object.keys(exp)) && Object.keys(exp).every(k => st.tags[k] === exp[k]) && n === CAND[q].count;
      if (["包裝", "手作", "工程行", "網路平台", "企劃"].includes(q)) g = g && Object.keys(st.tags).length === 0; // v1_9 增後二
      if (q === "茶葉") g = g && setEq(Object.keys(st.tags), ["C111010", "F102050", "F203010"]); // v1_9
      d[q] = { tags: st.tags, count: n, expectCount: CAND[q].count }; all = all && g;
    } finally { await close(p); }
  }
  return ok(all, d);
};
/* 補列之標題、說明與小標（v1_9）：sibling_heading 為 h3（tabindex -1），其後緊接 sibling_note，其前為最後一筆得分列 */
async function sibState(p) {
  return p.evaluate(([sh, sn, stg]) => {
    const res = document.querySelector("#results"); const all = [...res.querySelectorAll("*")];
    const hs = all.filter(e => e.textContent === sh && ![...e.children].some(c => c.textContent === sh));
    const h = hs[0], next = h && h.nextElementSibling, prev = h && h.previousElementSibling, ae = document.activeElement;
    return { n: hs.length, tag: h ? h.tagName : null, tabindex: h ? h.getAttribute("tabindex") : null, noteNext: !!next && next.textContent === sn && !next.children.length,
      afterNote: next && next.nextElementSibling && next.nextElementSibling.classList.contains("cand") ? next.nextElementSibling.dataset.code : null,
      prevCode: prev && prev.classList.contains("cand") ? prev.dataset.code : null,
      notes: all.filter(e => e.textContent === sn && !e.children.length).length, sibTags: all.filter(e => e.textContent === stg && !e.children.length).length,
      active: !!h && ae === h, activeDesc: ae ? (ae.dataset && ae.dataset.code) || ae.tagName + (ae.id ? "#" + ae.id : "") : null };
  }, [A.sibling_heading, A.sibling_note, A.sibling_tag]);
}
const sibCardsOk = (st, x) => x.siblings.every(k => st.sibTagByCard[k] === 1) && x.rows.every(k => st.sibTagByCard[k] === 0) && st.sib.every(k => !st.tags[k]);
async function q116Show(ctx, u, w, h) {
  const q = "寵物店 寵物美容 寵物旅館", p = await ctx.page(u.tool, w, h);
  try {
    await query(p, q, "有限公司"); const s0 = await resState(p); const first = s0.rows.length + s0.sib.length;
    const bt = await p.$("#showAll"); const btText = bt ? await bt.textContent() : null; await showAll(p); const s1 = await resState(p); const ss = await sibState(p); const x = CAND[q];
    const headingFirstNew = x.rows.length === first && x.siblings.length > 0; // 新列出之第一個元素為 sibling_heading 者
    const g = first === 30 && btText === A.show_all_btn.replace("N", String(x.count)) && same(s1.rows, x.rows) && same(s1.sib, x.siblings) && s1.sibHeading === 1 && s1.sibHeadingBeforeFirstSib === true
      && ss.tag === "H3" && ss.noteNext && ss.prevCode === x.rows[x.rows.length - 1] && sibCardsOk(s1, x) && (!headingFirstNew || ss.active);
    return { ok: g, detail: { w, h, first, firstSibHeading: s0.sibHeading, button: btText, after: { rows: s1.rows.length, sib: s1.sib.length, sibHeading: s1.sibHeading, adjacent: s1.sibHeadingBeforeFirstSib, sibState: ss }, headingFirstNew, activeAfterShowAll: ss.activeDesc } };
  } finally { await close(p); }
}
R.Q116 = async (ctx, u) => {
  const d = {}; let all = true;
  { const p = await ctx.page(u.tool, 1366, 768);
    try { await query(p, "室內設計", "有限公司"); const st = await resState(p); const t = await topState(p); const ss = await sibState(p); const x = CAND["室內設計"];
      const g = same(st.rows, x.rows) && st.sibHeading === 1 && st.sibHeadingBeforeFirstSib === true && ss.tag === "H3" && ss.tabindex === "-1" && ss.noteNext && ss.notes === 1 && ss.prevCode === x.rows[x.rows.length - 1] && ss.afterNote === x.siblings[0]
        && same(st.sib, x.siblings) && sibCardsOk(st, x) && ss.sibTags === x.siblings.length && t.headingText === heading(x.scored_count);
      d.一 = { rows: st.rows, sib: st.sib, sibHeading: st.sibHeading, adjacent: st.sibHeadingBeforeFirstSib, sibState: ss, sibTagByCard: st.sibTagByCard, sibTagged: st.sib.filter(k => st.tags[k]), heading: t.headingText, expectHeading: heading(x.scored_count) }; all = all && g; } finally { await close(p); } }
  { const r = await q116Show(ctx, u, 1366, 768); d.二 = r.detail; all = all && r.ok; }
  d.三四 = {};
  for (const q of ["機場園區", "e801060", "E801060,E801010", "當舖"]) { const p = await ctx.page(u.tool, 1366, 768); try { await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const ss = await sibState(p); d.三四[q] = { sibHeading: st.sibHeading, sibNote: ss.notes, sibTag: ss.sibTags, sib: st.sib, tagged: Object.keys(st.tags) }; all = all && st.sibHeading === 0 && ss.notes === 0 && ss.sibTags === 0 && st.sib.length === 0 && (q !== "當舖" || Object.keys(st.tags).length > 0); } finally { await close(p); } }
  { const r = await q116Show(ctx, u, 390, 844); d.五 = r.detail; all = all && r.ok; }
  return ok(all, d);
};
R.Q117 = async (ctx, u) => {
  const d = {};
  const p = await ctx.page(u.tool);
  try {
    await query(p, "室內設計", "有限公司");
    d.一 = await p.evaluate(([re, cn, oh]) => {
      const rx = new RegExp(re); const hs = [...document.querySelectorAll("h2")].filter(h => rx.test(h.innerText.trim()));
      const h = hs[0]; const res = document.querySelector("#results"); const all = [...document.querySelectorAll("body *")];
      const notice = all.find(e => e.textContent === cn && !e.children.length); const old = all.find(e => e.textContent === oh && !e.children.length);
      const bf = (x, y) => !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { h2: hs.length, text: h && h.innerText.trim(), active: !!h && document.activeElement === h, labelled: !!h && !!h.id && res.getAttribute("aria-labelledby") === h.id,
        aboveNotice: bf(h, notice), belowOld: !old || bf(old, h), cardTitles: [...res.querySelectorAll(".cand")].map(c => (c.querySelector(".cand-head") || {}).tagName) };
    }, ["^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$", A.candidate_notice, A.old_text_hint]);
    for (const [k, q, t] of [["二", "qwerty火星挖礦", A.no_result], ["三", "G606011", notFound("G606011")]]) {
      await query(p, q, "有限公司");
      d[k] = await p.evaluate(([re, t]) => { const rx = new RegExp(re); const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); return { heading: [...document.querySelectorAll("body *")].filter(h => rx.test((h.innerText || "").trim()) && !h.children.length).length, role: e && e.getAttribute("role"), active: !!e && document.activeElement === e }; }, ["^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$", t]);
    }
    // 四（v1_9）：部分查無時焦點在 results_heading，不在 code_not_found
    await query(p, "E801060、G606011", "有限公司");
    d.四 = await p.evaluate(([re, nf]) => { const rx = new RegExp(re); const h = [...document.querySelectorAll("#results h2")].find(x => rx.test(x.innerText.trim())); const e = [...document.querySelectorAll("body *")].find(x => x.textContent === nf && !x.children.length); return { heading: !!h, active: !!h && document.activeElement === h, activeIsNotFound: !!e && document.activeElement === e }; }, ["^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$", notFound("G606011")]);
  } finally { await close(p); }
  const a = d.一;
  const g = a.h2 === 1 && a.text === heading(CAND["室內設計"].scored_count) && a.active && a.labelled && a.aboveNotice && a.belowOld && a.cardTitles.length > 0 && a.cardTitles.every(t => t === "H3")
    && ["二", "三"].every(k => d[k].heading === 0 && d[k].role === "status" && d[k].active) && d.四.heading && d.四.active && !d.四.activeIsNotFound;
  return ok(g, d);
};
R.Q118 = async (ctx, u) => {
  const d = {};
  const fresh = async () => { const p = await ctx.page(u.tool); await p.check('input[name="org"][value="有限公司"]'); await p.click("#biz"); return p; };
  const nCards = p => p.evaluate(() => document.querySelectorAll("#results .cand").length);
  let p = await fresh();
  try { await p.keyboard.type("咖啡廳"); await p.keyboard.press("Enter"); d.一 = { cards: await nCards(p), value: await p.inputValue("#biz") }; } finally { await close(p); }
  p = await fresh();
  try {
    await p.keyboard.type("咖啡廳"); await p.keyboard.press("Shift+Enter"); await p.keyboard.type("飲料");
    d.二 = { value: await p.inputValue("#biz"), cardsBefore: await nCards(p) };
    await p.keyboard.press("Enter"); await showAll(p); const st = await resState(p); d.二.rows = st.rows; d.二.sib = st.sib;
    d.二.match = same(st.rows, CAND["咖啡廳 飲料"].rows) && same(st.sib, CAND["咖啡廳 飲料"].siblings);
  } finally { await close(p); }
  p = await fresh();
  try { await p.keyboard.type("咖啡廳"); await p.keyboard.press("Control+Enter"); d.三 = { cards: await nCards(p) }; } finally { await close(p); }
  p = await fresh();
  try {
    await p.keyboard.type("咖啡廳");
    d.四 = await p.evaluate(() => { const ta = document.querySelector("#biz"); const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", isComposing: true, bubbles: true, cancelable: true }); ta.dispatchEvent(ev); return { cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent }; });
    d.五 = await p.evaluate(() => document.querySelector("#biz").getAttribute("enterkeyhint"));
  } finally { await close(p); }
  // 六（v1_9）：Shift＋Ctrl＋Enter 送出
  p = await fresh();
  try { await p.keyboard.type("咖啡廳"); await p.keyboard.press("Shift+Control+Enter"); d.六 = { cards: await nCards(p), value: await p.inputValue("#biz") }; } finally { await close(p); }
  // 七（v1_9）：keyCode 229 而 isComposing 為假之 Enter 不送出
  p = await fresh();
  try {
    await p.keyboard.type("咖啡廳");
    d.七 = await p.evaluate(() => { const ta = document.querySelector("#biz"); const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 229, isComposing: false, bubbles: true, cancelable: true }); ta.dispatchEvent(ev); return { keyCode: ev.keyCode, isComposing: ev.isComposing, cards: document.querySelectorAll("#results .cand").length }; });
  } finally { await close(p); }
  // 八、九（v1_9；判定方式十八）：派發 compositionend 後 50 毫秒、300 毫秒再派發 Enter keydown（isComposing 為假）
  for (const [k, ms] of [["八", 50], ["九", 300]]) {
    p = await fresh();
    try {
      await p.keyboard.type("咖啡廳");
      d[k] = await p.evaluate(async ms => {
        const ta = document.querySelector("#biz");
        ta.dispatchEvent(new CompositionEvent("compositionend", { data: "廳", bubbles: true }));
        const t0 = performance.now(); await new Promise(r => setTimeout(r, ms));
        const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", isComposing: false, bubbles: true, cancelable: true }); const dt = performance.now() - t0; ta.dispatchEvent(ev);
        return { delayMs: Math.round(dt), cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent.length };
      }, ms);
    } finally { await close(p); }
  }
  const g = d.一.cards > 0 && !d.一.value.includes("\n") && d.二.value === "咖啡廳\n飲料" && d.二.cardsBefore === 0 && d.二.match && d.三.cards > 0 && d.四.cards === 0 && d.四.res === "" && d.五 === "search"
    && d.六.cards > 0 && d.七.keyCode === 229 && !d.七.isComposing && d.七.cards === 0 && d.八.delayMs < 100 && d.八.cards === 0 && d.八.res === 0 && d.九.delayMs >= 100 && d.九.cards > 0;
  return ok(g, d);
};
/* Q119（v1_9）：視窗 1366×768、390×844、844×390 各一次；五為查詢後以鍵盤方向鍵改選 */
async function q119At(ctx, u, w, h) {
  const d = { w, h };
  const resSnap = t => ({ codes: [...document.querySelectorAll("#results .cand")].map(c => c.dataset.code), conflict: document.body.innerText.includes(t), y: window.scrollY, active: document.activeElement && (document.activeElement.id || document.activeElement.value || document.activeElement.tagName) });
  let p = await ctx.page(u.tool, w, h);
  try {
    await p.fill("#biz", "咖啡廳"); await p.click("#searchBtn");
    d.一 = await p.evaluate(t => {
      const all = [...document.querySelectorAll("body *")]; const m = all.filter(e => e.textContent === t && !e.children.length);
      const e = m[0]; const fs = document.querySelector('input[name="org"]').closest("fieldset"); const radios = [...document.querySelectorAll('input[name="org"]')]; const btn = document.querySelector("#searchBtn");
      const r = e && e.getBoundingClientRect(), lr = fs.querySelector("legend").getBoundingClientRect();
      return { n: m.length, inFieldset: !!e && fs.contains(e), afterLastOption: !!e && !!(radios[radios.length - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING), beforeBtn: !!e && !!(e.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING),
        role: e && (e.getAttribute("role") || (e.closest("[role]") || { getAttribute: () => null }).getAttribute("role")), active: document.activeElement === radios[0], activeValue: document.activeElement && document.activeElement.value,
        visible: !!r && r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0, legendVisible: lr.top >= 0 && lr.bottom <= window.innerHeight, alertTop: r && Math.round(r.top), alertBottom: r && Math.round(r.bottom), legendTop: Math.round(lr.top), scrollY: window.scrollY, cards: document.querySelectorAll("#results .cand").length };
    }, A.org_required);
    await p.click('label:has(input[value="獨資"])');
    d.二 = { n: await visibleTextCount(p, A.org_required) };
  } finally { await close(p); }
  p = await ctx.page(u.tool, w, h);
  try {
    await query(p, "J905010", "有限公司");
    const hd = await p.$("#results h2"); const before0 = await p.evaluate(resSnap, A.conflict_prefix);
    // 以程式改選（不經點擊，避免瀏覽器本身之點擊移焦），判定頁面不重新查詢、不捲動、不移焦點
    await p.evaluate(() => { const r = document.querySelector('input[name="org"][value="獨資"]'); r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); });
    const after0 = await p.evaluate(resSnap, A.conflict_prefix);
    const sameNode = hd ? await p.evaluate(x => x === document.querySelector("#results h2") && x.isConnected, hd) : null;
    d.三 = { before: before0, after: after0, sameHeadingNode: sameNode };
  } finally { await close(p); }
  p = await ctx.page(u.tool, w, h);
  try { await p.check('input[name="org"][value="合夥"]'); d.四 = { cards: await p.evaluate(() => document.querySelectorAll("#results .cand").length), res: await p.evaluate(() => document.querySelector("#results").textContent) }; } finally { await close(p); }
  // 五（v1_9）：查詢後以鍵盤方向鍵改選。焦點先以 focus() 置於已選之選項（如使用者以 Tab 到達，瀏覽器將其捲入可見），其後記錄狀態再按方向鍵；
  // 方向鍵移焦屬瀏覽器本身之行為，判頁面不另移焦點、不重新查詢、不捲動
  p = await ctx.page(u.tool, w, h);
  try {
    await query(p, "J905010", "有限公司");
    await p.evaluate(() => document.querySelector('input[name="org"]:checked').focus()); await p.waitForTimeout(50);
    const hd = await p.$("#results h2"); const b5 = await p.evaluate(resSnap, A.conflict_prefix);
    await p.keyboard.press("ArrowRight"); await p.waitForTimeout(50);
    const a5 = await p.evaluate(resSnap, A.conflict_prefix);
    const checked = await p.evaluate(() => { const r = document.querySelector('input[name="org"]:checked'); return { value: r && r.value, focused: !!r && document.activeElement === r }; });
    const sameNode = hd ? await p.evaluate(x => x === document.querySelector("#results h2") && x.isConnected, hd) : null;
    d.五 = { before: b5, after: a5, checked, sameHeadingNode: sameNode, orgRequired: await visibleTextCount(p, A.org_required) };
  } finally { await close(p); }
  const a = d.一, c = d.三, f = d.五;
  // J905010（第十四類）：有限公司「衝突」、股份有限公司「衝突」、獨資「不衝突」（第八節對照表）
  const exp5 = SPEC_CONFLICT[14][ORGS.indexOf(f.checked.value)];
  const g = a.n === 1 && a.inFieldset && a.afterLastOption && a.beforeBtn && a.role === "alert" && a.active && a.activeValue === "有限公司" && a.visible && a.cards === 0
    && d.二.n === 0
    && same(c.before.codes, c.after.codes) && c.before.conflict && !c.after.conflict && c.before.y === c.after.y && c.before.active === c.after.active && c.sameHeadingNode === true
    && d.四.cards === 0 && d.四.res === ""
    && same(f.before.codes, f.after.codes) && f.before.y === f.after.y && f.checked.value !== "有限公司" && f.checked.focused && f.sameHeadingNode === true && f.orgRequired === 0 && f.after.conflict === exp5;
  return { ok: g, detail: d };
}
R.Q119 = async (ctx, u) => {
  const d = []; let all = true;
  for (const [w, h] of [[1366, 768], [390, 844], [844, 390]]) { const r = await q119At(ctx, u, w, h); d.push(r.detail); all = all && r.ok; }
  return ok(all, d);
};
/* 指定字樣之元素（葉）是否位於另一字樣之元素（葉）之前（DOM 與縱座標） */
const beforeText = (p, a, b) => p.evaluate(([a, b]) => { const all = [...document.querySelectorAll("body *")]; const f = t => all.find(e => e.textContent === t && !e.children.length); const x = f(a), y = f(b); return !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top; }, [a, b]);
const staleRole = p => p.evaluate(t => { const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); return e ? e.getAttribute("role") : null; }, A.stale_hint);
R.Q120 = async (ctx, u) => {
  const d = {};
  let p = await ctx.page(u.tool);
  try {
    await query(p, "室內設計", "有限公司"); d.一 = (await resState(p)).stale;
    await p.fill("#biz", "室內設計 咖啡廳"); d.二 = { n: (await resState(p)).stale, above: await before(p, A.stale_hint, true), role: await staleRole(p) };
    await p.fill("#biz", "室內設計"); d.三 = (await resState(p)).stale;
    await p.fill("#biz", "室內設計 咖啡廳"); await p.click("#searchBtn"); d.四 = (await resState(p)).stale;
    await p.check('input[name="org"][value="獨資"]'); d.五 = (await resState(p)).stale;
  } finally { await close(p); }
  // 六、七（v1_9）：stale_hint 位於第一個 code_not_found 之上；位於 no_result 之上
  p = await ctx.page(u.tool);
  try {
    await query(p, "G606011 G901011", "有限公司"); await p.fill("#biz", "G606011 G901011 改");
    d.六 = { n: (await resState(p)).stale, aboveFirstNotFound: await beforeText(p, A.stale_hint, notFound("G606011")), role: await staleRole(p) };
    await query(p, "qwerty火星挖礦", "有限公司"); await p.fill("#biz", "qwerty火星挖礦 改");
    d.七 = { n: (await resState(p)).stale, aboveNoResult: await beforeText(p, A.stale_hint, A.no_result), role: await staleRole(p) };
  } finally { await close(p); }
  return ok(d.一 === 0 && d.二.n === 1 && d.二.above === true && d.二.role === "status" && d.三 === 0 && d.四 === 0 && d.五 === 0
    && d.六.n === 1 && d.六.aboveFirstNotFound && d.六.role === "status" && d.七.n === 1 && d.七.aboveNoResult && d.七.role === "status", d);
};
/* Q121（v1_9，判定方式十三；F-G-09）：甲＝標籤上緣距視窗上緣 0 至 1 像素或已捲至最底；
 * 乙＝以標籤對齊時第一筆候選之名稱下緣會超出視窗，且 results_heading 之上緣距視窗上緣 0 至 1 像素，
 *     或（results_heading 對齊後第一筆候選仍不能完整可見時）第一筆候選完整可見且捲動量不大於使其可見所需 */
async function q121Measure(p) {
  await p.waitForTimeout(100);
  const s = await p.evaluate(re => {
    const rx = new RegExp(re);
    const lab = document.querySelector('label[for="biz"]'); const c = document.querySelector("#results .cand"); if (!c) return null;
    const hd = [...document.querySelectorAll("#results h2")].find(x => rx.test(x.innerText.trim()));
    const Y = window.scrollY, vh = window.innerHeight;
    const lr = lab.getBoundingClientRect(), nr = c.querySelector(".cand-name").getBoundingClientRect(), hr = hd ? hd.getBoundingClientRect() : null;
    const atBottom = Y + vh >= document.documentElement.scrollHeight - 1;
    const nameBottomPage = nr.bottom + Y, labelTopPage = lr.top + Y, headTopPage = hr ? hr.top + Y : null;
    return { labelTop: lr.top, headingTop: hr ? hr.top : null, atBottom, span: nameBottomPage - labelTopPage, spanFromHeading: hr ? nameBottomPage - headTopPage : null, vh, scrollY: Y, needScroll: Math.ceil(nameBottomPage - vh) };
  }, "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "\\d+") + "$");
  const f = await firstVisible(p);
  const jia = !!s && ((s.labelTop >= 0 && s.labelTop <= 1) || s.atBottom);
  const yiPremise = !!s && s.span > s.vh;
  const yiConcl = !!s && ((s.headingTop !== null && s.headingTop >= 0 && s.headingTop <= 1) || (s.spanFromHeading !== null && s.spanFromHeading > s.vh && f.ok && s.scrollY <= s.needScroll + 1));
  const yi = yiPremise && yiConcl;
  return { s, firstVisible: f.ok, jia, yiPremise, yi, branch: jia ? "甲" : yi ? "乙" : "無" };
}
R.Q121 = async (ctx, u) => {
  const d = []; let all = true, contra = null;
  for (const [w, h, q, must] of [[1366, 768, "室內設計", null], [1024, 640, "室內設計", null], [390, 844, "室內設計", null], [390, 844, E.q20[3].input, "乙"]]) {
    const p = await ctx.page(u.tool, w, h);
    try {
      await query(p, q, "有限公司");
      const m = await q121Measure(p);
      let g = m.firstVisible && (m.jia || m.yi);
      // 「v1_9 之長句須落在乙款」：乙款以「標籤對齊時第一筆候選之名稱下緣會超出視窗」為前提；前提不成立者屬驗證表之假設與版面不符（矛盾），不以之判未通過
      if (must === "乙") { if (!m.yiPremise) contra = { w, h, input: q, span: m.s && m.s.span, vh: m.s && m.s.vh }; else g = g && m.yi; }
      d.push({ w, h, input: q, mustBranch: must, ...m.s, firstVisible: m.firstVisible, 甲: m.jia, 乙之前提: m.yiPremise, 乙: m.yi, 走哪一款: m.branch }); all = all && g;
    } finally { await close(p); }
  }
  // 補充量測（非驗證表之輸入，不作判定）：同一長句於較矮之視窗，記錄備援捲動實際走哪一款
  const extra = [];
  for (const [w, h] of [[390, 600], [390, 240]]) {
    const p = await ctx.page(u.tool, w, h);
    try { await query(p, E.q20[3].input, "有限公司"); const m = await q121Measure(p); extra.push({ w, h, ...m.s, firstVisible: m.firstVisible, 甲: m.jia, 乙之前提: m.yiPremise, 乙: m.yi, 走哪一款: m.branch }); } finally { await close(p); }
  }
  const detail = { rows: d, supplementary_not_judged: extra };
  if (!all) return ok(false, detail);
  if (contra) return { ok: null, detail: { ...detail, contradiction: contra, note: "驗證表 v1_9 Q121 謂 q20[3] 於 390×844 須落在乙款；實測以標籤上緣對齊時第一筆候選已完整可見（名稱下緣距標籤上緣 " + Math.round(contra.span) + " 像素，小於視窗高 " + contra.vh + "），依規格第七節第一項之捲動第 3 點應停在甲款，乙款之前提不成立。其餘三視窗通過。依派工記未執行並列入疑義；補充量測見 supplementary_not_judged" } };
  return ok(true, detail);
};
R.Q122 = async (ctx, u) => {
  const p = await ctx.page(u.tool, 1366, 768);
  try {
    await query(p, "當舖", "有限公司");
    const s = await p.evaluate(([pl, sig, lic]) => {
      const a = [...document.querySelectorAll("a")]; const f = pred => a.filter(pred).map(x => ({ aria: x.getAttribute("aria-label"), target: x.getAttribute("target"), text: x.innerText.trim() }));
      return { permit: f(x => x.innerText.trim() === pl), sig: f(x => x.innerText.trim() === sig), lic: f(x => x.getAttribute("href") === lic) };
    }, [A.permit_link, A.signature, LICENSE]);
    const b = await bookingState(p);
    const one = (arr, text) => arr.length === 1 && arr[0].aria === text + A.new_window_suffix && arr[0].target === "_blank";
    return ok(one(s.permit, A.permit_link) && s.permit[0].text === A.permit_link && one(s.sig, A.signature) && s.sig[0].text === A.signature && one(s.lic, LICENSE) && s.lic[0].text === LICENSE && bookingOk(b), { ...s, booking: b });
  } finally { await close(p); }
};
R.Q123 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { const s = await attribState(p); const t = await p.evaluate(att => { const e = [...document.querySelectorAll("body *")].find(x => x.innerText === att && ![...x.children].some(c => c.innerText === att)); return e ? e.innerText : null; }, A.attribution);
    return ok(E.appendix_a_halfwidth_issues.length === 0 && s.n === 1 && t === A.attribution && !/license ）/.test(t), { halfwidthIssues: E.appendix_a_halfwidth_issues, attributionFound: s.n, innerTextEquals: t === A.attribution }); } finally { await close(p); }
};
R.Q124 = async (ctx, u) => {
  const d = {}; let all = true; const x = CAND["咖啡廳.蛋糕"];
  for (const q of ["咖啡廳.蛋糕", "咖啡廳．蛋糕"]) { const p = await ctx.page(u.tool); try { await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); d[q] = { rows: st.rows, sib: st.sib }; all = all && same(st.rows, x.rows) && same(st.sib, x.siblings) && st.rows.includes("C104020"); } finally { await close(p); } }
  return ok(all, d);
};
R.Q125 = async (ctx, u) => {
  // 驗證表 v1_9 Q125：「不繪出」＝元素本身或其任一祖先之 computed display 為 none（以外層容器隱藏亦符合）
  const read = p => p.evaluate(([book, att, disc, sig]) => {
    const disp = e => e ? getComputedStyle(e).display : null;
    const hid = e => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) if (getComputedStyle(x).display === "none") return "none"; return e ? "shown" : null; };
    const all = [...document.querySelectorAll("body *")];
    const leaf = t => all.find(e => (e.innerText || e.textContent || "").trim() === t && ![...e.children].some(c => (c.textContent || "").trim() === t));
    const fs = document.querySelector('input[name="org"]').closest("fieldset");
    return {
      orgOptions: [...document.querySelectorAll('input[name="org"]')].map(r => ({ value: r.value, checked: r.checked, label: hid(r.closest("label")) })),
      fieldset: hid(fs), legend: hid(fs.querySelector("legend")),
      searchBtn: hid(document.querySelector("#searchBtn")),
      booking: hid([...document.querySelectorAll("a")].find(a => a.getAttribute("aria-label") && a.getAttribute("aria-label").startsWith(book))),
      cards: [...document.querySelectorAll("#results .cand")].map(disp),
      attribution: disp(all.find(e => e.textContent.replace(/\s+/g, "") === att.replace(/\s+/g, "") && ![...e.children].some(c => c.textContent.replace(/\s+/g, "") === att.replace(/\s+/g, "")))),
      disclaimer: disp(leaf(disc)), signature: disp([...document.querySelectorAll("a")].find(a => a.textContent.trim() === sig)),
    };
  }, [A.booking, A.attribution, A.disclaimer, A.signature]);
  const d = {};
  let p = await ctx.page(u.tool);
  try { await query(p, "室內設計", "有限公司"); await p.emulateMedia({ media: "print" }); d.一 = await read(p); await p.emulateMedia({ media: "screen" }); } finally { await close(p); }
  // 二（v1_9）：未選任何組織型態，只輸入不查詢
  p = await ctx.page(u.tool);
  try { await p.fill("#biz", "室內設計"); await p.emulateMedia({ media: "print" }); d.二 = await read(p); await p.emulateMedia({ media: "screen" }); } finally { await close(p); }
  const s = d.一;
  const g = s.orgOptions.length === 6 && s.orgOptions.every(o => o.value === "有限公司" ? o.checked && o.label === "shown" : !o.checked && o.label === "none") && s.fieldset === "shown"
    && s.searchBtn === "none" && s.booking === "none"
    && s.cards.length > 0 && s.cards.every(x => x !== "none") && s.attribution && s.attribution !== "none" && s.disclaimer && s.disclaimer !== "none" && s.signature && s.signature !== "none"
    && d.二.orgOptions.every(o => !o.checked) && d.二.fieldset === "none" && d.二.legend === "none";
  return ok(g, d);
};
/* Q128（v1_8 新增；v1_9 改）：〔抽：all_inputs〕之每一輸入逐句與 candidates、tag_text 一致；全部列逐列比對，並比 results_heading 之 N；mode 為 empty 者依 Q130 */
const headingN = p => p.evaluate(re => { const rx = new RegExp(re); const h = [...document.querySelectorAll("body *")].filter(e => rx.test((e.innerText || "").trim()) && ![...e.children].some(c => rx.test((c.innerText || "").trim()))); return h.map(e => Number(e.innerText.trim().match(rx)[1])); },
  "^" + A.results_heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("N", "(\\d+)") + "$");
R.Q128 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const mism = []; let n = 0;
  try {
    for (const q of E.all_inputs) {
      await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const c = CAND[q]; n++;
      const tg = tagsOf(q), hn = await headingN(p);
      let rowsOk, tagsOk, missOk, nOk;
      if (c.mode === "empty") { // 依 Q130：不產生候選、不顯示 results_heading 與 no_result，顯示 input_required
        rowsOk = st.rows.length === 0 && st.sib.length === 0; tagsOk = Object.keys(st.tags).length === 0; missOk = st.missing.length === 0; nOk = hn.length === 0 && st.noResult === 0 && st.inputRequired === 1;
      } else {
        rowsOk = same(st.rows, c.rows) && same(st.sib, c.siblings);
        tagsOk = setEq(Object.keys(st.tags), Object.keys(tg)) && Object.keys(tg).every(k => st.tags[k] === tg[k]);
        missOk = same(st.missing, c.missing);
        nOk = c.rows.length ? same(hn, [c.scored_count]) : hn.length === 0;
      }
      if (!(rowsOk && tagsOk && missOk && nOk)) mism.push({ input: q, mode: c.mode, rowsOk, tagsOk, missOk, nOk, got: { rows: st.rows, sib: st.sib, tags: st.tags, missing: st.missing, headingN: hn }, expect: { rows: c.rows, siblings: c.siblings, tags: tg, missing: c.missing, scored_count: c.scored_count } });
    }
  } finally { await close(p); }
  return ok(n === E.all_inputs.length && mism.length === 0, { inputs: n, expectInputs: E.all_inputs.length, emptyInputs: E.all_inputs.filter(q => CAND[q].mode === "empty").length, over40: E.all_inputs.filter(q => !CAND[q].rows).length, mismatches: mism });
};
/* Q129（v1_8 新增；判定方式十九，使用者 115/10/18 裁定甲）：:root 之 --serif、--sans 宣告值逐字等於 css_font_serif、css_font_sans，
 * 且 h1、body 之 computed font-family 除引號外相等（另記結果標題與代碼之 computed 值）；原始碼不含 @font-face、@import 與外部字型網址（同 Q108） */
R.Q129 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    const read = () => p.evaluate(() => {
      const ff = e => e ? getComputedStyle(e).fontFamily : null;
      const rs = getComputedStyle(document.documentElement);
      return { h1: ff(document.querySelector("h1")), body: ff(document.body), resultsHeading: ff(document.querySelector("#results h2")), code: ff(document.querySelector("#results .cand-code")), declSerif: rs.getPropertyValue("--serif").trim(), declSans: rs.getPropertyValue("--sans").trim() };
    });
    const s0 = await read(); await query(p, "室內設計", "有限公司"); const s1 = await read();
    const unq = x => x === null ? null : x.replace(/,\s+/g, ",").replace(/"/g, "");
    const declared = s0.declSerif === A.css_font_serif && s0.declSans === A.css_font_sans;
    const unquoted = unq(s0.h1) === unq(A.css_font_serif) && unq(s0.body) === unq(A.css_font_sans);
    const others = { resultsHeading: unq(s1.resultsHeading) === unq(A.css_font_serif), code: unq(s1.code) === unq(A.css_font_serif) };
    const words = ["@font-face", "@import", "fonts.googleapis.com", "fonts.gstatic.com"].filter(w => env.src.tool.includes(w));
    return ok(declared && unquoted && words.length === 0, { expect: { serif: A.css_font_serif, sans: A.css_font_sans }, computed: { h1: s0.h1, body: s0.body, resultsHeading: s1.resultsHeading, code: s1.code }, declared: { serif: s0.declSerif, sans: s0.declSans }, declaredEqual: declared, equalIgnoringQuotes: unquoted, othersEqualIgnoringQuotes: others, srcWords: words });
  } finally { await close(p); }
};
/* Q130（v1_9 新增）：空白輸入 */
R.Q130 = async (ctx, u) => {
  const ins = E.all_inputs.filter(q => CAND[q].mode === "empty");
  const d = []; let all = true;
  for (const org of ["有限公司", null]) for (const q of ins) {
    const p = await ctx.page(u.tool);
    try {
      await query(p, q, org);
      const st = await resState(p); const hn = await headingN(p);
      const s = await p.evaluate(([ir, orq]) => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; };
        const all = [...document.querySelectorAll("body *")]; const els = all.filter(e => e.textContent === ir && !e.children.length && vis(e));
        const ta = document.querySelector("#biz"); const ids = (ta.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
        const e = els[0];
        return { n: els.length, role: e && e.getAttribute("role"), described: !!e && !!e.id && ids.includes(e.id), active: document.activeElement === ta, orgRequired: all.filter(x => x.textContent === orq && !x.children.length && vis(x)).length };
      }, [A.input_required, A.org_required]);
      await p.keyboard.type("咖");
      const gone = await visibleTextCount(p, A.input_required);
      const g = st.rows.length === 0 && st.sib.length === 0 && hn.length === 0 && st.noResult === 0 && s.n === 1 && s.role === "alert" && s.described && s.active && s.orgRequired === 0 && gone === 0;
      d.push({ input: JSON.stringify(q), org, cards: st.rows.length + st.sib.length, heading: hn.length, noResult: st.noResult, ...s, afterTypingOneChar: gone }); all = all && g;
    } finally { await close(p); }
  }
  return ok(all && ins.length === 5, d);
};
/* Q132（v1_9 新增）：頁面、ext_c11 之 candidates、獨立推導檔三方相同（得分列與順序、標示與 phrase_tag 全文、補列、results_heading 之 N） */
R.Q132 = async (ctx, u) => {
  if (!INDEP_FILE) return { ok: null, detail: "未給 --indep（獨立推導檔之路徑），不能執行" };
  const buf = fs.readFileSync(INDEP_FILE);
  if (sha256(buf) !== SHA_INDEP) return { ok: false, detail: "獨立推導檔之 SHA-256 不符：" + sha256(buf) };
  const IND = JSON.parse(buf.toString("utf8"))["結果"];
  const p = await ctx.page(u.tool); const d = []; let all = true;
  try {
    for (const q of E.q132_inputs) {
      await query(p, q, "有限公司"); await showAll(p); const st = await resState(p); const hn = await headingN(p);
      const c = CAND[q], x = IND[q], tg = tagsOf(q);
      const page = { rows: st.rows, siblings: st.sib, tags: st.tags, N: hn.length === 1 ? hn[0] : null };
      const ext = { rows: c.rows, siblings: c.siblings, tags: tg, N: c.scored_count };
      const ind = x ? { rows: x.rows, siblings: x.siblings, tags: x.tags, N: x.N } : null;
      const eq = (a, b) => !!a && !!b && same(a.rows, b.rows) && same(a.siblings, b.siblings) && setEq(Object.keys(a.tags), Object.keys(b.tags)) && Object.keys(a.tags).every(k => a.tags[k] === b.tags[k]) && a.N === b.N;
      const r = { input: q, page_ext: eq(page, ext), page_indep: eq(page, ind), ext_indep: eq(ext, ind), page: { rows: page.rows.length, siblings: page.siblings.length, tagged: Object.keys(page.tags), N: page.N } };
      d.push(r); all = all && r.page_ext && r.page_indep && r.ext_indep;
    }
  } finally { await close(p); }
  return ok(all && E.q132_inputs.length === 15 && Object.keys(IND).length === 15, { indepSha256: SHA_INDEP, sentences: d });
};
/* 建置列 Q01～Q04（於暫存目錄複製 build/ 執行，不動 repo 之輸出） */
function buildSandbox(name, patchPy, mutate) {
  const root = path.join(TMP, "build-" + name + "-" + crypto.randomBytes(4).toString("hex")), b = path.join(root, "business-items", "build");
  fs.mkdirSync(b, { recursive: true });
  for (const f of ["build.py", "code_v8.xlsx", "business.pdf", EXT_FILE, "page_template.html"]) fs.copyFileSync(path.join(BUILD, f), path.join(b, f));
  if (patchPy) fs.writeFileSync(path.join(b, "build.py"), patchPy(fs.readFileSync(path.join(b, "build.py"), "utf8")));
  if (mutate) mutate(b);
  return { root, b };
}
function runBuild(sb, args = []) {
  const r = spawnSync("python3", ["-I", path.join(sb.b, "build.py"), "--spec", SPEC, ...args], { encoding: "utf8" });
  const idx = path.join(sb.root, "business-items", "index.html");
  return { code: r.status, out: r.stdout, err: r.stderr, index: fs.existsSync(idx), report: fs.existsSync(path.join(sb.b, "build_report.md")) ? fs.readFileSync(path.join(sb.b, "build_report.md"), "utf8") : null };
}
const pyXlsx = (file, code) => execFileSync("python3", ["-I", "-c", `import openpyxl,sys\nwb=openpyxl.load_workbook(sys.argv[1])\nws=wb.active\n${code}\nwb.save(sys.argv[1])`, file]);
const NEED_SPEC = { ok: null, detail: "未給 --spec（規格 v1_13 之路徑），建置列不能執行" };
R.Q01 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const sb = buildSandbox("Q01", env.patchBuild);
  const r = runBuild(sb);
  const rep = r.report || "";
  const g = r.code === 0 && r.index && !!r.report && rep.includes("code_v8.xlsx｜92149 位元組｜SHA-256 931126c9f6640329fadb06fc18dab8f53fd636e817d01f6e2aa23606e443a52b") && rep.includes("business.pdf｜159336 位元組｜SHA-256 aa1c4e8bf1a9d1e5ce27888bd0c5b22fa7c4c359324c3ca5aa7a3c332408a710") && rep.includes(`筆數：${E.master.count}；不重複代碼：${E.master.count}；重複：無`) && rep.includes(`尾碼 1（許可業務）：${E.master.tail_1} 筆`);
  const sameIdx = r.index && sha256(fs.readFileSync(path.join(sb.root, "business-items", "index.html"))) === sha256(fs.readFileSync(path.join(TOOL, "index.html")));
  return ok(g, { exit: r.code, index: r.index, report: !!r.report, sameAsRepoIndex: sameIdx, err: r.err.trim() || undefined });
};
R.Q02 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const sb = buildSandbox("Q02", env.patchBuild, b => pyXlsx(path.join(b, "code_v8.xlsx"), "ws.cell(row=1,column=4).value='定義內客'"));
  const r = runBuild(sb, ["--test-no-hash"]);
  return ok(r.code !== 0 && !r.index && r.err.includes("實際欄名") && r.err.includes("定義內客"), { exit: r.code, index: r.index, err: r.err.trim(), flag: "--test-no-hash", mode: "測試模式（build.py --test-no-hash：只關閉 SHA-256 核對）；雜湊核對先行於欄名核對，故欄名一例須關閉雜湊核對方能觸發（驗證表 v1_8 Q02、七題之二）" });
};
R.Q03 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const s1 = buildSandbox("Q03a", env.patchBuild, b => fs.unlinkSync(path.join(b, "code_v8.xlsx")));
  const r1 = runBuild(s1);
  const s2 = buildSandbox("Q03b", env.patchBuild, b => { const f = path.join(b, "code_v8.xlsx"); const x = fs.readFileSync(f); x[x.length - 1] ^= 0x01; fs.writeFileSync(f, x); });
  const actual = sha256(fs.readFileSync(path.join(s2.b, "code_v8.xlsx")));
  const r2 = runBuild(s2);
  const bp = fs.readFileSync(path.join(s1.b, "build.py"), "utf8");
  const g = r1.code !== 0 && !r1.index && r1.err.includes("資料下載") && r2.code !== 0 && !r2.index && r2.err.includes("931126c9f6640329fadb06fc18dab8f53fd636e817d01f6e2aa23606e443a52b") && r2.err.includes(actual) && !/^\s*(import|from)\s+(urllib|requests|http)/m.test(bp);
  return ok(g, { 例一: { exit: r1.code, index: r1.index, err: r1.err.trim() }, 例二: { exit: r2.code, index: r2.index, err: r2.err.trim() } });
};
R.Q04 = async (ctx, u, env) => {
  if (!SPEC) return NEED_SPEC;
  const sb = buildSandbox("Q04", env.patchBuild, b => pyXlsx(path.join(b, "code_v8.xlsx"), "ws.append([c.value for c in ws[2]])"));
  const r = runBuild(sb, ["--test-no-hash"]);
  return ok(r.code !== 0 && !r.index && r.err.includes("代碼重複") && r.err.includes(Object.keys(M).sort()[0]), { exit: r.code, index: r.index, err: r.err.trim(), flag: "--test-no-hash" });
};

const ROW_ORDER = ["Q01", "Q02", "Q03", "Q04", "Q05", "Q06", "Q07", "Q08", "Q09", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q42", "Q43", "Q44", "Q18", "Q19", "Q20", "Q21", "Q86", "Q87", "Q88", "Q89", "Q90", "Q91", "Q92", "Q93", "Q94", "Q100", "Q101", "Q102", "Q103", "Q40", "Q63", "Q65", "Q66", "Q67", "Q68", "Q69", "Q82", "Q83", "Q84", "Q70", "Q71", "Q72", "Q73", "Q74", "Q75", "Q76", "Q77", "Q78", "Q79", "Q85", "Q95", "Q96", "Q97", "Q98", "Q104", "Q105", "Q106", "Q107", "Q108",
  "Q109", "Q110", "Q111", "Q112", "Q113", "Q114", "Q115", "Q116", "Q117", "Q118", "Q119", "Q120", "Q121", "Q122", "Q123", "Q124", "Q125", "Q126", "Q128", "Q129", "Q130", "Q132", "Q80", "Q81", "Q99", "Q127"];
const MANUAL = {
  Q80: "人工列：以 run_x4_c10.py（程式未改）對 X4 對照組（dc370a4，40 則）報數字（results/x4_c11_Q80Q99.json），交使用者裁定；判定記未執行",
  Q99: "人工列：以 Q80 同一次執行之輸出報未命中與「說法對到而內部版未列」清單（results/x4_c11_Q80Q99.json），交使用者判讀；判定記未執行",
  Q127: "人工列：以 run_x4_c10.py（程式未改）對第二組（9f7905b，20 則）報數字（results/x4_c11_Q127.json），只報數字；判定記未執行",
  Q81: "人工列：截圖已全部重產（c11 之補列標題、sibling_note、sibling_tag 與 results_heading 之 N 已改；verify/screenshots/，驗證表 v1_9 之清單），交使用者與設計稿並排核可；判定記未執行",
  Q126: "人工列：Android 手機 Chrome 之鍵盤、Mac Safari 注音選字之 Enter（v1_9），須使用者實機操作；iOS 使用者無裝置；判定記未執行",
};
const OUT_OF_SCOPE = { D01: "不在射程（驗證表 v1_9 第九之二節）", D02: "同上", D03: "同上", D04: "同上", D05: "同上", D06: "同上" };

/* ───────── 刻意錯誤版 ───────── */
function sub(s, a, b) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`補丁之原字串出現 ${n} 次：${a.slice(0, 60)}`); return s.replace(a, () => b); }
function patchJson(s, id, f) { const re = new RegExp(`(id="${id}">)([\\s\\S]*?)(</script>)`); const m = s.match(re); const o = JSON.parse(m[2]); const n = f(o) || o; return s.replace(re, (_, a, __, c) => a + JSON.stringify(n).replace(/</g, "\\u003c") + c); }
const T = "tool", B = "build";
function phrasesV1_10() { // 規格 v1_10 附錄 B（knowledge 68605af；SHA-256 核對）
  if (!SPEC_V1_10 || !fs.existsSync(SPEC_V1_10) || sha256(fs.readFileSync(SPEC_V1_10)) !== SHA_SPEC_V1_10) throw new Error("未給 --spec-v1-10 或其 SHA-256 不符");
  const t = fs.readFileSync(SPEC_V1_10, "utf8"); const i = t.indexOf("\n## 附錄 B"); const j = t.indexOf("\n## ", i + 1); const sec = t.slice(i, j < 0 ? undefined : j);
  const P = {}; for (const ln of sec.split("\n")) { const m = ln.match(/^- ([A-Z0-9]{7})（(.+?)）：「(.*)」$/); if (m) P[m[1]] = m[3].split("、"); } return P;
}
let C10_TOOL = null;
function c10Tool() { // tools 7f2e6e1 之工具頁（v1_11 之字型堆疊；SHA-256 核對）
  if (C10_TOOL === null) { const t = execFileSync("git", ["-C", REPO, "show", `${C10_COMMIT}:business-items/index.html`], { encoding: "utf8", maxBuffer: 1 << 26 }); if (sha256(Buffer.from(t, "utf8")) !== SHA_C10_TOOL) throw new Error("7f2e6e1 之工具頁 SHA-256 不符"); C10_TOOL = t; }
  return C10_TOOL;
}
function pairV1_12(no) { // 規格 v1_12 附錄 D 之第 no 對（knowledge 30902f4；SHA-256 核對）；回傳內嵌格式 [短說法, 長說法, 代碼]
  if (!SPEC_V1_12 || !fs.existsSync(SPEC_V1_12) || sha256(fs.readFileSync(SPEC_V1_12)) !== SHA_SPEC_V1_12) throw new Error("未給 --spec-v1-12 或其 SHA-256 不符");
  const t = fs.readFileSync(SPEC_V1_12, "utf8"); const i = t.indexOf("\n## 附錄 D"); const j = t.indexOf("\n## ", i + 1); const sec = t.slice(i, j < 0 ? undefined : j);
  for (const ln of sec.split("\n")) { const m = ln.match(/^- 第 (\d+) 對：「(.+?)」⊂「(.+?)」：(.+)$/); if (m && Number(m[1]) === no) return [m[2], m[3], m[4].split("、")]; }
  throw new Error("規格 v1_12 附錄 D 無第 " + no + " 對");
}
const fontStack = s => { const m = s.match(/:root\{(--serif:[^;]*;--sans:[^;]*);/); if (!m) throw new Error("找不到 :root 之 --serif、--sans"); return m[1]; };
const VARIANTS = [
  ["E01", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 10).items = L2.find(c => c.no === 10).items.filter(i => i.code !== "E801060"); }), ["Q06", "Q18"]],
  ["E02", T, s => sub(s, "if(/1$/.test(row.code)){", "if(false){"), ["Q05"]],
  ["E03", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 7).items = L2.find(c => c.no === 7).items.filter(i => i.code !== "HZ07011"); }), ["Q12", "Q83"]],
  ["E04", T, s => patchJson(patchJson(s, "data-list", L2 => { L2.find(c => c.no === 4).items.splice(1, 0, cat(4).items.find(i => i.code === "G606011")); }), "data-codes", C => { C.push(["G606011", "機場園區經營業", "（測試用加回）"]); }), ["Q13", "Q66", "Q83"]],
  ["E05", T, s => patchJson(s, "data-codes", C => { C.find(r => r[0] === "JA02071")[1] = "JA02071"; }), ["Q68", "Q82"]],
  ["E06", T, s => patchJson(s, "data-org", O => { O.table["7"] = [false, false, true, true, false]; }), ["Q84"]],
  ["E07", T, s => sub(s, 'if(org===ORG.undecided){if(orgLimited(code))card.appendChild(el("p","flag flag-sub org-undecided",S.org_undecided_note));return;}', 'if(org===ORG.undecided){(RESTR[code]||[]).forEach(function(r){if(ORG.table[String(r.no)].some(function(v){return v;}))card.appendChild(el("p","conflict",S.conflict_prefix+r.title));});return;}'), ["Q44", "Q84"]],
  ["E08", T, s => sub(s, "依政府資料開放授權條款第 1 版利用", ""), ["Q63"]],
  ["E09", T, s => sub(s, "var q=biz.value,r=search(q);", "var q=biz.value,r=search(q);localStorage.setItem(\"q\",q);"), ["Q78"]],
  ["E10", T, s => sub(s, "var q=biz.value,r=search(q);", "var q=biz.value,r=search(q);fetch(location.href);"), ["Q78"]],
  ["E11", T, s => sub(s, `content="${A.tool_version}"`, `content="${A.tool_version}${A.forbidden_version_suffix}"`), ["Q75"]],
  ["E12", T, s => sub(s, `<p class="as-of">${A.version_line}</p>`, `<p class="as-of">版本 v1.0.0｜法規依據擷取日 115/10/15</p>`), ["Q74"]],
  ["E13", T, s => { const sig = s.match(/<a class="sig"[^>]*>[^<]*<\/a>\n/)[0]; return sub(sub(s, sig, ""), `<p class="as-of">${A.version_line}</p>`, `<p class="as-of">${A.version_line}</p>\n${sig}`); }, ["Q70"]],
  ["E14", T, s => sub(s, 'f.appendChild(el("p","flag-sub restriction-note",S.restriction_note));', ""), ["Q06", "Q17"]],
  ["E15", T, s => sub(sub(patchJson(s, "data-codes", C => { C.forEach(r => r.push(M[r[0]][1])); }), "BY[r[0]]={code:r[0],name:r[1],def:r[2],", "BY[r[0]]={code:r[0],name:r[1],def:r[2],en:r[3],"), 'h.appendChild(el("span","cand-name",e.name));a.appendChild(h);', 'h.appendChild(el("span","cand-name",e.name));h.appendChild(el("span","cand-en",e.en));a.appendChild(h);'), ["Q19", "Q82"]],
  ["E16", T, s => sub(s, "rows.sort(function(a,b){", "if(!rows.length)rows=ORDER.slice(0,5).map(function(k){return {code:k,nh:0,tot:0,via:false,tag:null};});rows.sort(function(a,b){"), ["Q21"]],
  ["E17", T, s => patchJson(s, "data-codes", C => { C.forEach(r => { r[2] = r[2].replace(/\s/g, ""); }); }), ["Q82"]],
  ["E18", T, s => { const bk = s.match(/<a class="sy-book-btn"[^>]*>[^<]*<\/a>\n/)[0]; return sub(s, bk, bk + bk); }, ["Q72"]],
  ["E19", T, s => patchJson(s, "data-phrases", P => { P.F501030 = P.F501030.filter(x => x !== "咖啡廳"); }), ["Q86", "Q92"]],
  ["E20", T, s => sub(s, "SCANW.forEach(function(w){if(occ(x,w).some(function(o){return !overlaps(o,zs);}))words[w]=true;});", ""), ["Q86", "Q87", "Q89", "Q91"]],
  ["E21", T, s => sub(s, "{s=3;via.push(w);}", "{s=2;via.push(w);}"), ["Q128"]], // v1_8 改應抓列
  ["E22", T, s => sub(s, "else if(typed[w]&&bigramHit(w,e.n+e.d))s=1;", "else if(bigramHit(w,e.n+e.d))s=1;"), ["Q94"]],
  ["E23", T, s => sub(s, 'if(row.tag)a.appendChild(el("span","phrase-tag",row.tag));', 'a.appendChild(el("span","phrase-tag",row.tag||S.phrase_tag.replace("〔說法〕","")));'), ["Q89", "Q90", "Q116"]],
  ["E24", T, s => sub(s, 'return S.phrase_tag.replace("〔說法〕",forms.join("」「"));', 'return "依經濟部常見說法對到";'), ["Q86", "Q90", "Q102"]],
  ["E25", T, s => sub(s, `<h1>${A.page_title}</h1>`, `<h2>${A.page_title}</h2>`), ["Q95"]],
  ["E26", T, s => { const head = s.match(/<h1>[\s\S]*?<\/ol>\n/)[0]; return sub(sub(s, head, ""), "<script>\n(function(){", `<script>\ndocument.querySelector(".page-head .wrap").insertAdjacentHTML("afterbegin",${JSON.stringify(head)});\n(function(){`); }, ["Q95", "Q96"]],
  ["E27", T, s => sub(sub(sub(s, `<li>${A.purpose_item_1}</li>`, `<li>1.${A.purpose_item_1}</li>`), `<li>${A.purpose_item_2}</li>`, `<li>2.${A.purpose_item_2}</li>`), `<li>${A.purpose_item_3}</li>`, `<li>3.${A.purpose_item_3}</li>`), ["Q96"]],
  ["E28", T, s => sub(s, `placeholder="${A.input_placeholder}"`, 'placeholder="例：咖啡廳、室內設計、補習班"'), ["Q97"]],
  ["E29", T, s => sub(s, `class="sy-book-btn" href="${A.booking_url}"`, `class="sy-book-btn" href="${A.booking_url_old}"`), ["Q72"]],
  ["E30", T, s => sub(s, `aria-label="${A.booking_aria}"`, `aria-label="${A.booking_aria_old}"`), ["Q72"]],
  ["E31", T, s => sub(s, `<li>${A.basis_item_4}</li>\n`, ""), ["Q73", "Q98"]],
  ["E32", T, s => patchJson(s, "data-phrases", P => { P.F501060 = P.F501060.filter(x => x !== "早餐店"); P.F501030.push("早餐店"); }), ["Q88", "Q92"]],
  ["E33", T, s => sub(s, "return {code:k,tag:null};", 'return {code:k,tag:PHRASES[k]?S.phrase_tag.replace("〔說法〕",PHRASES[k][0]):null};'), ["Q69"]],
  ["E34", T, s => patchJson(s, "data-phrases", P => { P.F399040 = P.F399040.filter(x => x !== "蝦皮"); }), ["Q87", "Q91", "Q92"]],
  ["E35", T, s => sub(s, 'return cps(t).length>HINT_LEN&&(t.indexOf("業務")>=0||/[一二三四五六七八九十]+、/.test(t));', "return cps(t).length>HINT_LEN;"), ["Q20"]],
  ["E36", T, s => sub(s, "var SEP=/[\\s、,，。.．;；\\/／+＋]+/;", "var SEP=/[\\s、,，。.．;；\\/／+＋和與及]+/;"), ["Q100"]],
  ["E37", T, s => sub(s, 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);', ""), ["Q101"]],
  ["E38", T, s => sub(s, "if(r.tagged){var lg=", "if(true){var lg="), ["Q101"]],
  ["E39", T, s => sub(s, 'forms.join("」「")', 'forms.slice(0,1).join("」「")'), ["Q102"]],
  ["E40", T, s => sub(s, "var keep=via.filter(function(w){return !via.some(function(o){return o!==w&&o.indexOf(w)>=0;});});", "var keep=via.slice();"), ["Q102"]],
  ["E41", T, s => patchJson(s, "data-phrases", P => { P.H601011.push("保險經紀"); }), ["Q92", "Q103"]],
  ["E42", T, s => sub(s, ' maxlength="300"', ""), ["Q104"]],
  ["E43", T, s => sub(s, "state={q:q,rows:r.rows,all:all,org:org};", 'state={q:q,rows:r.rows,all:all,org:org};form.hidden=true;var ec=el("div","empty");ec.appendChild(el("p",null,q));ec.appendChild(el("p",null,org));results.appendChild(ec);'), ["Q105"]],
  ["E44", T, s => sub(s, 'var n=el("p","empty",S.no_result);', 'document.querySelector(".disclaimer").hidden=true;var n=el("p","empty",S.no_result);'), ["Q106"]],
  ["E45", T, s => sub(s, 'window.addEventListener("pageshow",resetAll);\nresetAll();', "").replace(/ autocomplete="off"/g, ""), ["Q107"]],
  ["E46", T, s => sub(s, "<title>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap">\n<title>'), ["Q78", "Q108"]],
  ["E47", T, s => { const at = s.match(/<p class="attribution" id="attribution">[\s\S]*?<\/p>\n/)[0]; return sub(sub(s, at, ""), `<p class="as-of">${A.version_line}</p>\n`, `<p class="as-of">${A.version_line}</p>\n${at}`); }, ["Q63"]],
  ["E52", T, s => sub(s, "return lit[0]||c[0]||w;", "return c[0]||w;"), ["Q102"]],
  ["E55", T, s => sub(s, "if(segs.length&&segs.every(function(t){return !!segCode(t);})){", "if(segs.length===1&&!!segCode(segs[0])){"), ["Q109"]],
  ["E56", T, s => sub(s, "if(cps(w).length>=2&&!TRIG", "if(w&&!TRIG"), ["Q110"]],
  ["E57", T, s => sub(s, "return (b.via-a.via)||(b.nh-a.nh)", "return (b.nh-a.nh)"), ["Q111", "Q128"]], // v1_8 改應抓列
  ["E58", T, s => sub(s, "if(ow.length&&ow.every(covered))supp[", "if(false)supp["), ["Q112"]],
  ["E59", T, s => sub(s, "if(PH[L][k]||EXC[", "if(PH[L][k]||false&&EXC["), ["Q113"]],
  ["E60", T, s => sub(s, "var nb=normBreaks(q),x=nb.x,zs=zonesOf(x,nb.br);", "var nb=normBreaks(q),x=nb.x,zs=[];"), ["Q114"]],
  ["E61", T, s => { const P = phrasesV1_10(); return patchJson(s, "data-phrases", () => P); }, ["Q92", "Q115"]],
  ["E62", T, s => sub(s, "var sib=ORDER.filter(function(k){return pre[", "var sib=[].filter(function(k){return pre["), ["Q116"]],
  ["E63", T, s => sub(s, "return {code:k,tag:null,sib:true};", 'return {code:k,tag:S.phrase_tag.replace("〔說法〕",""),sib:true};'), ["Q116"]],
  ["E64", T, s => sub(s, 'var h=el("h2","results-heading",S.results_heading.replace("N",String(r.rows.length)));h.id="resultsHeading";h.tabIndex=-1;results.appendChild(h);', 'var h=null;'), ["Q101", "Q117"]],
  ["E65", T, s => sub(s, "if(focusEl)focusEl.focus({preventScroll:true});", ""), ["Q117"]],
  ["E66", T, s => sub(s, "if(e.shiftKey&&!e.ctrlKey&&!e.metaKey)return;\n  e.preventDefault();\n  if(performance.now()-compEnd<100)return;\n  run();", 'if(e.ctrlKey||e.metaKey||(!e.shiftKey&&!e.altKey&&biz.value.indexOf("\\n")<0)){e.preventDefault();if(performance.now()-compEnd<100)return;run();}'), ["Q118"]],
  ["E67", T, s => (sub(sub(s, '<div id="orgMsg"></div>\n</fieldset>\n<div><button type="submit" class="btn-primary" id="searchBtn">' + A.search_btn + "</button></div>\n", '</fieldset>\n<div><button type="submit" class="btn-primary" id="searchBtn">' + A.search_btn + '</button></div>\n<div id="orgMsg"></div>\n'), "first.focus({preventScroll:true});", "")), ["Q119"]],
  ["E68", T, s => sub(s, 'orgMsg.textContent="";\n  if(!state)return;', "if(!state)return;"), ["Q119"]],
  ["E69", T, s => sub(s, 'syncMax();syncStale();});', 'syncMax();});'), ["Q120"]],
  ["E70", T, s => sub(s, "scrollAfter(scrollEl,all.length?h:null);", 'var t0=results.firstElementChild;if(t0){t0.scrollIntoView({block:"start"});var fc=results.querySelector(".cand-head");if(fc&&fc.getBoundingClientRect().bottom>window.innerHeight)fc.scrollIntoView({block:"center"});}'), ["Q121"]],
  ["E71", T, s => sub(s, ` aria-label="${A.signature}${A.new_window_suffix}"`, ""), ["Q122"]],
  ["E72", T, s => sub(s, `>${LICENSE}</a>）`, `>${LICENSE}</a> ）`), ["Q63", "Q123"]],
  ["E73", T, s => sub(s, "var SEP=/[\\s、,，。.．;；\\/／+＋]+/;", "var SEP=/[\\s、,，。．;；\\/／+＋]+/;"), ["Q124"]],
  ["E74", T, s => sub(sub(s, 'return cps(t).length>HINT_LEN&&(t.indexOf("業務")>=0||/[一二三四五六七八九十]+、/.test(t));', "return cps(t).length>HINT_LEN;"), "if(oldHint(q)){", "if(oldHint(q)&&!r.tagged){"), ["Q20"]],
  ["E75", T, s => sub(s, 'var d=document.querySelector("details.basis");if(d)d.open=false;', ""), ["Q107"]],
  ["E76", T, s => sub(s, "fieldset:not(:has(input:checked)),.btn-primary,.sy-book-btn{display:none}", "fieldset:not(:has(input:checked)),.sy-book-btn{display:none}"), ["Q125"]],
  // v1_8 新增
  ["E77", T, s => patchJson(s, "data-phrases", P => { if (!P.F501030.includes("茶飲")) throw new Error("F501030 無「茶飲」"); P.F501030 = P.F501030.filter(x => x !== "茶飲"); }), ["Q93", "Q92", "Q128"]],
  ["E78", T, s => sub(s, "return (b.via-a.via)||(b.nh-a.nh)||(b.tot-a.tot)||", "return (b.via-a.via)||(b.tot-a.tot)||(b.nh-a.nh)||"), ["Q111", "Q128"]],
  ["E79", T, s => sub(s, ":root{" + fontStack(s) + ";", ":root{" + fontStack(c10Tool()) + ";"), ["Q129"]],
  // E80「補列改依說法表代碼之順序（不依字母序）」：補列依說法表對到之得分列（頁面順序）逐一取其同類代碼，同一類內仍依字母序
  ["E80", T, s => sub(s, "var sib=ORDER.filter(function(k){return pre[k.slice(0,4)]&&!scored[k];}).map(", "var sib=[];rows.forEach(function(r){if(r.via)ORDER.forEach(function(k){if(k.slice(0,4)===r.code.slice(0,4)&&!scored[k]&&sib.indexOf(k)<0)sib.push(k);});});sib=sib.map("), ["Q116", "Q128"]],
  // v1_9 新增（E81～E104）
  ["E81", T, s => patchJson(s, "data-excepts", X => { X.push(pairV1_12(58)); }), ["Q112", "Q128", "Q132"]],
  ["E82", T, s => patchJson(s, "data-excepts", X => { X.push(pairV1_12(66)); }), ["Q112", "Q128"]],
  ["E83", T, s => patchJson(s, "data-phrases", P => { if (P.F399040.includes("網路平台")) throw new Error("F399040 已有「網路平台」"); P.F399040.push("網路平台"); }), ["Q112", "Q115", "Q92"]],
  ["E84", T, s => sub(s, "if(/\\s/.test(ch)){br[x.length]=true;return;}", "if(ch===\"\\n\"||ch===\"\\r\"){br[x.length]=true;return;}\n    if(/\\s/.test(ch))return;"), ["Q114", "Q128", "Q132"]],
  ["E85", T, s => sub(s, "&&!TRIG.some(function(g){return w.indexOf(g)===0;})", ""), ["Q114", "Q128", "Q132"]],
  ["E86", T, s => sub(s, '  if(!segs.length)return {mode:"empty",rows:[],siblings:[],missing:[],tagged:false};\n', ""), ["Q130"]],
  ["E87", T, s => sub(s, 'S.results_heading.replace("N",String(r.rows.length))', 'S.results_heading.replace("N",String(all.length))'), ["Q101", "Q116", "Q117", "Q128"]],
  ["E88", T, s => sub(s, '\n  if(row.sib)a.appendChild(el("span","sib-tag",S.sibling_tag));', ""), ["Q116"]],
  ["E89", T, s => sub(s, 'var sn=el("p","sib-note",S.sibling_note);sn.id="siblingNote";frag.appendChild(sn);', ""), ["Q116"]],
  ["E90", T, s => sub(s, 'var sh=el("h3","sib-heading",S.sibling_heading);', 'var sh=el("p","sib-heading",S.sibling_heading);'), ["Q116"]],
  ["E91", T, s => sub(s, 'var x=showRows(results.querySelectorAll(".cand").length,state.all.length);b.replaceWith(x.frag);if(x.first)x.first.focus({preventScroll:false});',
    'var n0=results.querySelectorAll(".cand").length;var x=showRows(n0,state.all.length);b.replaceWith(x.frag);var c0=results.querySelectorAll(".cand")[n0];if(c0)c0.focus({preventScroll:false});'), ["Q116"]],
  ["E92", T, s => sub(s, 'h.id="staleHint";h.setAttribute("role","status");', 'h.id="staleHint";'), ["Q120"]],
  ["E93", T, s => sub(s, "\n  else if(!stale&&cur)cur.remove();", ""), ["Q120"]],
  ["E94", T, s => sub(s, "  if(head){window.scrollTo(0,Math.max(0,Math.floor(pageTop(head))));if(fullyVisible(target))return;}\n", ""), ["Q121"]],
  ["E95", T, s => sub(sub(s, "window.scrollBy(0,Math.ceil(r.bottom-window.innerHeight));", "window.scrollBy(0,-Math.ceil(r.bottom-window.innerHeight));"), "else if(r.top<0)window.scrollBy(0,Math.floor(r.top));", "else if(r.top<0)window.scrollBy(0,-Math.floor(r.top));"), ["Q121"]],
  ["E96", T, s => sub(s, "\n  if(performance.now()-compEnd<100)return;", ""), ["Q118"]],
  ["E97", T, s => sub(s, ".org-options label:not(:has(input:checked)),fieldset:not(:has(input:checked)),", ""), ["Q125"]],
  ["E98", T, s => sub(s, 'focusEl=h;scrollEl=results.querySelector(".cand-head");', 'focusEl=focusEl||h;scrollEl=results.querySelector(".cand-head");'), ["Q117"]],
  ["E99", T, s => sub(s, "if(segs.length&&segs.every(function(t){return !!segCode(t);})){\n    var seen=[];segs.forEach(function(t){var k=segCode(t);",
    "if(segs.length&&segs.some(function(t){return !!segCode(t);})){\n    var seen=[];segs.forEach(function(t){var k=segCode(t)||norm(t).toUpperCase();"), ["Q109"]],
  ["E100", T, s => sub(s, "results.appendChild(showRows(0,Math.min(SHOW_FIRST,all.length)).frag);", 'results.appendChild(showRows(0,Math.min(SHOW_FIRST,all.length)).frag);if(!r.siblings.length&&r.mode==="text"){var e0=el("h3","sib-heading",S.sibling_heading);e0.tabIndex=-1;results.appendChild(e0);}'), ["Q116"]],
  ["E101", T, s => sub(s, "return pre[k.slice(0,4)]&&!scored[k];", "return pre[k.slice(0,4)];"), ["Q116", "Q128"]],
  ["E102", T, s => sub(s, "    var c=card(r,state.org);frag.appendChild(c);if(!first)first=c;", "    var c=card(r,state.org);if(r.sib&&i===state.rows.length&&sh)frag.insertBefore(c,sh);else frag.appendChild(c);if(!first)first=c;"), ["Q116"]],
  ["E103", T, s => sub(s, 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);', 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);results.querySelectorAll(".code-not-found").forEach(function(n){results.insertBefore(n,cn);});'), ["Q109"]],
  ["E104", T, s => sub(s, `    var mr=m.getBoundingClientRect(),lt=first.closest("fieldset").querySelector("legend").getBoundingClientRect().top,ih=window.innerHeight,y=0;
    if(mr.bottom>ih-8)y=mr.bottom-ih+8;else if(mr.top<8)y=mr.top-8;
    if(lt-y<8)y=Math.max(mr.bottom-ih+8,lt-8);
    if(y)window.scrollBy(0,y<0?Math.floor(y):Math.ceil(y));`, `    var fs=first.closest("fieldset").getBoundingClientRect();
    if(fs.top<0||m.getBoundingClientRect().bottom>window.innerHeight)window.scrollBy(0,fs.top<0?fs.top-16:m.getBoundingClientRect().bottom-window.innerHeight+16);`), ["Q119"]],
  // 補充刻意錯誤（驗證表 E 列未涵蓋之可程式判定列，各至少一個；沿用 v1_6 執行之 X01～X21，補丁依 c10 之頁面改寫）
  ["X01", B, s => sub(s, 'with open(OUT_REPORT, "w", encoding="utf-8", newline="\\n") as f:\n        f.write("\\n".join(rep))', "pass"), ["Q01"]],
  ["X02", B, s => sub(s, "    if missing or len(head) != len(HEAD):", "    head = HEAD\n    if False:"), ["Q02"]],
  ["X03", B, s => sub(s, "    if not no_hash:\n        bad =", "    if False:\n        bad ="), ["Q03"]],
  ["X04", B, s => sub(s, "    if dup:", "    if False:"), ["Q04"]],
  ["X05", T, s => patchJson(s, "data-list", L2 => { L2.find(c => c.no === 10).items.find(i => i.code === "J701010").note = ""; }), ["Q07"]],
  ["X06", T, s => patchJson(s, "data-org", O => { O.table["5"] = [true, true, true, true, true]; }), ["Q08"]],
  ["X07", T, s => patchJson(s, "data-org", O => { O.table["14"] = [true, true, true, true, true]; }), ["Q09", "Q15"]],
  ["X08", T, s => sub(s, "if(/1$/.test(row.code)){", "if(/1$/.test(row.code)&&!RESTR[row.code]){"), ["Q10"]],
  ["X09", T, s => sub(s, 'a.appendChild(el("p","cand-def",e.def));', 'a.appendChild(el("p","cand-def",e.def));if(!(RESTR[row.code]||[]).length)a.appendChild(el("p","flag",S.restriction_note));'), ["Q11"]],
  ["X10", T, s => patchJson(s, "data-org", O => { O.table["1"] = [false, false, true, true, true]; }), ["Q14"]],
  ["X11", T, s => sub(s, 'a.appendChild(el("p","flag flag-sub zz-not-alone",S.zz_not_alone));', ""), ["Q16"]],
  ["X12", T, s => sub(s, "<title>", "<!-- https://data.gcis.nat.gov.tw/od/data/api/xxxx -->\n<title>"), ["Q40"]],
  ["X13", T, s => sub(s, "var org=selectedOrg();", 'var org=selectedOrg()||"有限公司";'), ["Q42"]],
  ["X14", T, s => sub(s, 'value="有限公司" autocomplete="off">', 'value="有限公司" autocomplete="off" checked data-x>').replace("form.querySelectorAll('input[name=\"org\"]').forEach(function(r){r.checked=false;});", "form.querySelectorAll('input[name=\"org\"]').forEach(function(r){r.checked=r.hasAttribute(\"data-x\");});"), ["Q43"]],
  ["X15", T, s => sub(s, '<p class="attribution" id="attribution">', '<img src="https://www.moea.gov.tw/logo.png" alt="" width="1" height="1">\n<p class="attribution" id="attribution">'), ["Q65"]],
  ["X16", T, s => patchJson(s, "data-codes", C => C.filter(r => r[0] !== "D101101")), ["Q67"]],
  ["X17", T, s => sub(s, `<a class="sig" href="${A.signature_url}" target="_blank"`, `<a class="sig" href="${A.signature_url}"`), ["Q71"]],
  ["X18", T, s => sub(s, '<p class="attribution" id="attribution">', '<div style="width:1400px;height:1px"></div>\n<p class="attribution" id="attribution">'), ["Q76"]],
  ["X19", T, s => sub(s, "scrollAfter(scrollEl,all.length?h:null);", ""), ["Q77"]],
  ["X20", T, s => sub(s, "return (b.via-a.via)||(b.nh-a.nh)||(b.tot-a.tot)||", "return (b.via-a.via)||(b.tot-a.tot)||"), ["Q79"]],
  ["X21", T, s => sub(s, "var SHOW_FIRST=30,", "var SHOW_FIRST=100000,"), ["Q85"]],
];
const VARIANTS_OUT_OF_SCOPE = { E48: ["D01"], E49: ["D02"], E50: ["D03"], E51: ["D05"], E53: ["D04"], E54: ["D04", "D06"] };
// Q80、Q81、Q99、Q126、Q127 為人工列。E45 刪除 pageshow 之重設、載入時之重設（本頁兩者為同一函式）與 autocomplete="off"。

/* ───────── 執行 ───────── */
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", () => { PORT = server.address().port; r(); }));
  const browser = await chromium.launch();
  const ctx = new Ctx(browser);
  const toolSrc = fs.readFileSync(path.join(TOOL, "index.html"), "utf8");
  const report = fs.readFileSync(path.join(BUILD, "build_report.md"), "utf8");
  const baseEnv = { src: { tool: toolSrc }, report, buildPy: path.join(BUILD, "build.py"), patchBuild: null };
  const urls = { tool: publish("main", toolSrc) };
  async function runRow(id, u, env) {
    if (MANUAL[id]) return { result: "未執行", detail: MANUAL[id] };
    try { const r = await R[id](ctx, u, env); return { result: r.ok === null ? "未執行" : r.ok ? "通過" : "未通過", detail: r.detail }; }
    catch (e) { return { result: "未通過", detail: "例外：" + String(e && e.message || e).split("\n")[0] }; }
  }
  const results = {};
  const rows = ONLY ? ROW_ORDER.filter(r => ONLY.includes(r)) : ROW_ORDER;
  for (const id of rows) { results[id] = await runRow(id, urls, baseEnv); console.log(id, results[id].result, ONLY && results[id].result !== "通過" ? JSON.stringify(results[id].detail).slice(0, 1500) : ""); }

  // 全部輸入逐句一致：v1_8 起為 Q128（上開逐列內執行）

  // Q81 截圖（驗證表 v1_9 之清單；c11 之補列與標題改動，全部重產）
  const shots = path.join(VERIFY, "screenshots"); fs.mkdirSync(shots, { recursive: true });
  const shotFiles = [];
  if (!ONLY || ONLY.includes("Q81")) {
    const plan = [["01_載入", null], ["02_Q05", ["C802041", "有限公司"]], ["03_Q12", ["HZ07011", "股份有限公司"]], ["04_Q14", ["H101021", "有限公司"]], ["05_Q16", ["ZZ99999", "有限公司"]], ["06_Q21", ["qwerty火星挖礦", "有限公司"]], ["07_Q42", ["咖啡廳", null]], ["08_Q86", [AC[0].input, "有限公司"]], ["09_Q20第1句", [E.q20[0].input, "有限公司"]], ["10_Q102咖啡廳手搖飲", ["咖啡廳 手搖飲", "有限公司"]],
      ["11_Q116室內設計補列", ["室內設計", "有限公司"]], ["12_Q119組織型態必填", ["咖啡廳", null]], ["13_Q120輸入已改未再查", "stale"], ["14_頁尾依據說明展開", "basis"]];
    for (const w of [1366, 390]) for (const [name, act] of plan) {
      const p = await ctx.page(urls.tool, w, 768);
      try {
        if (act === "basis") await p.evaluate(() => { document.querySelector("details").open = true; });
        else if (act === "stale") { await query(p, "室內設計", "有限公司"); await p.fill("#biz", "室內設計 咖啡廳"); }
        else if (act) await query(p, act[0], act[1]);
        await p.evaluate(() => window.scrollTo(0, 0)); const f = `${name}_${w}.png`; await p.screenshot({ path: path.join(shots, f), fullPage: true }); shotFiles.push(f);
      } finally { await close(p); }
    }
  }

  // 刻意錯誤
  const errs = {};
  if (!ONLY) for (const [id, kind, patch, expect] of VARIANTS) {
    let env = { ...baseEnv }, u = { ...urls };
    try {
      if (kind === T) { const s = patch(toolSrc); env.src = { ...env.src, tool: s }; u.tool = publish("v_" + id, s); }
      else { env.patchBuild = patch; patch(fs.readFileSync(path.join(BUILD, "build.py"), "utf8")); }
    } catch (e) { errs[id] = { expect, error: "補丁未套用：" + e.message, allCaught: false, notRun: /--spec-v1-10/.test(e.message) }; console.log(id, "補丁未套用", e.message); continue; }
    const got = {};
    for (const r of expect) got[r] = (await runRow(r, u, env)).result;
    errs[id] = { expect, got, caught: expect.filter(r => got[r] === "未通過"), allCaught: expect.every(r => got[r] === "未通過") };
    console.log(id, JSON.stringify(got));
  }
  for (const [id, ex] of Object.entries(VARIANTS_OUT_OF_SCOPE)) errs[id] = { expect: ex, notRun: true, error: "不在射程（以開發中頁 v0.2.0 為底；驗證表 v1_9 第十節），不執行", allCaught: null };

  // 改版前之版本：tools ff0239e 之工具頁（c10b，本批施作底本；派工射程：驗證表 v1_9 改寫與新增之列 Q20、Q101、Q109、Q112～Q121、Q125、Q126、Q128、Q130、Q132）
  const pre = {};
  if (!ONLY) {
    let s = null;
    try { s = execFileSync("git", ["-C", REPO, "show", `${PRE_COMMIT}:business-items/index.html`], { encoding: "utf8", maxBuffer: 1 << 26 }); } catch (e) { pre.error = "git show 失敗：" + String(e.message).split("\n")[0]; }
    if (s !== null && sha256(Buffer.from(s, "utf8")) !== SHA_PRE_TOOL) { pre.error = `${PRE_COMMIT} 之工具頁 SHA-256 不符`; s = null; }
    if (s !== null) {
      const u = { ...urls, tool: publish("pre_" + PRE_COMMIT, s) }; const env = { ...baseEnv, src: { ...baseEnv.src, tool: s } };
      pre.page = { commit: PRE_COMMIT, sha256: SHA_PRE_TOOL };
      pre.rows = {};
      for (const r of ["Q20", "Q101", "Q109", "Q112", "Q113", "Q114", "Q115", "Q116", "Q117", "Q118", "Q119", "Q120", "Q121", "Q125", "Q126", "Q128", "Q130", "Q132"]) { const x = await runRow(r, u, env); pre.rows[r] = { result: x.result, detail: x.detail }; console.log("改版前", r, x.result); }
      // 驗證表 v1_9 第十節末段未列 v1_9 改寫與新增列於改版前之版本「須判未通過」之清單；本批照記判定，不自訂期望（列入疑義）
      pre.expectFail = []; pre.expectPass = []; pre.passAsRecorded = Object.keys(pre.rows);
    }
    pre.earlier = "b43ef1c（c9）與更早版本之回測已記於各該批之結果.json（7f2e6e1、fc3f2a7）；本批之派工射程只含 ff0239e 之上開列，未重跑";
  }

  await browser.close(); server.close();
  const outDir = path.join(VERIFY, "results"); fs.mkdirSync(outDir, { recursive: true });
  const count = { 通過: 0, 未通過: 0, 未執行: 0 }; Object.values(results).forEach(r => count[r.result]++);
  const covered = new Set(VARIANTS.flatMap(v => v[3]));
  const out = { generated_by: "verify.js", spec: "營業項目查詢工具_規格_v1_13.md（契約 c11）", table: "營業項目查詢工具_驗證表_v1_9.md", ext_sha256: sha256(fs.readFileSync(path.join(BUILD, EXT_FILE))), tool_sha256: sha256(toolSrc),
    flags: { build_test_mode: "--test-no-hash（Q02、Q04；只關閉 SHA-256 核對）", spec_given: !!SPEC, spec_v1_10_given: !!SPEC_V1_10, spec_v1_12_given: !!SPEC_V1_12, indep_given: !!INDEP_FILE, indep_sha256: SHA_INDEP },
    count, rows: results, out_of_scope: OUT_OF_SCOPE, screenshots: shotFiles, deliberate_errors: errs, pre_revision: pre,
    row_ids_missing_vs_table: ROW_ORDER.filter(r => !results[r]), extra_ids: Object.keys(results).filter(r => !ROW_ORDER.includes(r)),
    programmatic_rows_without_error_version: ROW_ORDER.filter(r => !MANUAL[r] && !covered.has(r)) };
  if (!ONLY) fs.writeFileSync(path.join(outDir, "結果.json"), JSON.stringify(out, null, 1));
  if (ONLY && argOf("--dump")) fs.writeFileSync(argOf("--dump"), JSON.stringify(out, null, 1)); // 試跑用：--only 時另存明細（不寫 results/）
  console.log(JSON.stringify({ count, errsNotAllCaught: Object.entries(errs).filter(([k, v]) => v.allCaught === false).map(([k, v]) => [k, v.got || v.error]), uncovered: out.programmatic_rows_without_error_version }, null, 1));
  fs.rmSync(TMP, { recursive: true, force: true });
})().catch(e => { console.error(e); process.exit(1); });
