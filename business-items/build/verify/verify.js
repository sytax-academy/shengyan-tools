#!/usr/bin/env node
/* 營業項目查詢（business-items）驗證程式：驗證表 v1_6 期別一 76 列（工具頁 70、開發中頁 6）、刻意錯誤 E01～E54 與補充刻意錯誤 X01～X21、改版前之版本。
 * 期望值一律取自 ../ext_c9b_輸出.json（ext_c9b.py 之抽出結果）與母本 code_v8.xlsx（master_dump.py 獨立讀取），不手抄字樣。
 * 用法（自 repo 根目錄）：node business-items/build/verify/verify.js [--phrase-v0-1 〔常見說法表_第一批_草案_v0_1.py〕] [--only 列號,列號]
 *   --phrase-v0-1：改版前之版本（規格 v1_9 方法）所需之說法表 .py（knowledge inbox/工具十三/常見說法表/，SHA-256 d76638b3…540a）；未給者該段記未執行。
 * 需要：Node 之 playwright（Chromium）、python3（openpyxl、pdftotext）。不連外網；頁面以本機 http 伺服器提供（同源測試頁代替 sytaxes.com，判定方式十）。
 * 輸出：verify/results/結果.json、verify/results/執行紀錄.md、verify/screenshots/（Q81）。
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http"), crypto = require("crypto");
const { execFileSync, spawnSync } = require("child_process");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require("/opt/node22/lib/node_modules/playwright"); }
const { chromium } = pw;

const VERIFY = __dirname, BUILD = path.dirname(VERIFY), TOOL = path.dirname(BUILD);
const E = JSON.parse(fs.readFileSync(path.join(BUILD, "ext_c9b_輸出.json"), "utf8"));
const A = E.appendix_a, L = E.list;
const ARGV = process.argv.slice(2);
const argOf = k => { const i = ARGV.indexOf(k); return i >= 0 ? ARGV[i + 1] : null; };
const ONLY = argOf("--only") ? argOf("--only").split(",") : null;
const PHRASE_PY = argOf("--phrase-v0-1");
const SHA_PHRASE_PY = "d76638b3a4afb96af0c5f396a1ddee86741a574b51b21affca73347d17e9540a";
const M = JSON.parse(execFileSync("python3", ["-I", path.join(VERIFY, "master_dump.py"), path.join(BUILD, "code_v8.xlsx")], { encoding: "utf8", maxBuffer: 1 << 26 }));
const C8_PURPOSE = "輸入你要做的生意，列出可能適用的公司行號營業項目代碼，並標出須先取得許可、限專業經營、限公司組織等限制。"; // 規格 v1_10 附錄 A 前言所引之 c8 purpose
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "bi-verify-"));
const WIDTHS = [320, 390, 768, 1366];
const ORGS = A.org_options.split("、");
// 規格 v1_10 第八節組織型態衝突對照表（判準：類別名稱之字面；列＝類別序號，欄＝有限公司、股份有限公司、獨資、合夥、有限合夥；未定一律不判斷）
const SPEC_CONFLICT = {};
[[[1, 3, 4, 5, 13], "10111"], [[2, 6, 7, 8], "00111"], [[9, 10], "00000"], [[11, 12], "11111"], [[14], "11001"], [[15], "00001"]]
  .forEach(([ns, s]) => ns.forEach(n => { SPEC_CONFLICT[n] = s.split("").map(c => c === "1"); }));
const cat = n => L.categories.find(c => c.no === n);
const noteOf = (code, n) => (cat(n).items.find(i => i.code === code) || {}).note || "";
const sha256 = b => crypto.createHash("sha256").update(b).digest("hex");
const setEq = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

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
    p.on("request", r => p.__req.push(r.url()));
    p.on("websocket", ws => p.__req.push(ws.url()));
    p.on("pageerror", e => p.__errs.push(e.message));
    p.__resp = await p.goto(url, { waitUntil: "load" });
    p.__raw = await p.__resp.text();
    p.__afterLoad = p.__req.length;
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
const visibleTextCount = (p, text, sel = "body *") => p.$$eval(sel, (els, text) => els.filter(e => {
  if ((e.textContent || "").trim() !== text) return false;
  if ([...e.children].some(c => (c.textContent || "").trim() === text)) return false;
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
}).length, text);
const bodyText = p => p.evaluate(() => document.body.innerText);
const writes = p => p.evaluate(() => ({ ...window.__w, lsLen: localStorage.length, ssLen: sessionStorage.length, cookie: document.cookie }));
function ok(cond, detail) { return { ok: !!cond, detail }; }

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
    const nf = await visibleTextCount(p, A.code_not_found.replace("〔代碼〕", "G606011"));
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
R.Q43 = async (ctx, u) => { const p = await ctx.page(u.tool); try { const o = await p.$$eval('input[name="org"]', els => els.map(e => ({ label: e.closest("label").textContent.trim(), value: e.value, checked: e.checked }))); return ok(JSON.stringify(o.map(x => x.label)) === JSON.stringify(ORGS) && o.every(x => !x.checked), o); } finally { await close(p); } };
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
      let pos = true;
      if (n === 1) pos = await p.evaluate(t => { const h = [...document.querySelectorAll("#results *")].find(e => e.textContent === t); const c = document.querySelector("#candNotice") || [...document.querySelectorAll("#results *")].find(e => e.textContent === "__none__"); if (!c) { return true; } return !!(h.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) && h.getBoundingClientRect().top < c.getBoundingClientRect().top; }, A.old_text_hint);
      const good = (it.show_hint ? n === 1 && pos : n === 0);
      out.push({ input: it.input, expect: it.show_hint, shown: n, pos }); all = all && good;
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
async function many(list) { const d = []; let all = true; for (const r of list) { const x = await r; d.push(x.detail); all = all && x.ok; } return ok(all, d); }
const AC = E.appendix_c;
R.Q86 = (ctx, u) => topN(ctx, u.tool, AC[0].input, AC[0].codes, E.tag_text[AC[0].input]);
R.Q87 = (ctx, u) => topN(ctx, u.tool, AC[1].input, AC[1].codes, E.tag_text[AC[1].input]);
R.Q88 = async (ctx, u) => many([5, 6, 7].map(i => topN(ctx, u.tool, AC[i].input, AC[i].codes, E.tag_text[AC[i].input])));
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
const embedded = (src, id) => JSON.parse(src.match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`))[1]);
R.Q92 = async (ctx, u, env) => {
  const P = embedded(env.src.tool, "data-phrases"), C = embedded(env.src.tool, "data-codes");
  const codes = new Set(C.map(r => r[0])); const T = E.phrases.table;
  const nP = Object.values(P).reduce((s, v) => s + v.length, 0);
  const same = Object.keys(T).every(k => P[k] && setEq(P[k], T[k])) && Object.keys(P).every(k => T[k]);
  const pure = Object.values(P).every(v => Array.isArray(v) && v.every(s => typeof s === "string"));
  return ok(Object.keys(P).length === E.phrases.code_count && nP === E.phrases.phrase_count && same && Object.keys(P).every(k => codes.has(k)) && pure, { codes: Object.keys(P).length, phrases: nP, same, pure });
};
R.Q93 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { await query(p, E.q93.input, "有限公司"); const c = await cards(p); const idx = k => c.findIndex(x => x.code === k);
    const g = E.q93.phrase_codes.every(k => idx(k) >= 0 && c[idx(k)].tag) && E.q93.def_codes.every(k => idx(k) >= 0 && !c[idx(k)].tag) && Math.max(...E.q93.phrase_codes.map(idx)) < Math.min(...E.q93.def_codes.map(idx));
    return ok(g, c.map(x => [x.code, !!x.tag])); } finally { await close(p); }
};
R.Q94 = async (ctx, u) => {
  const p = await ctx.page(u.tool);
  try { await query(p, E.q94.word, "有限公司"); const a = (await cards(p)).map(x => x.code); await query(p, E.q94.sentence, "有限公司"); await showAll(p); const b = (await cards(p)).map(x => x.code);
    return ok(E.q94.bigram_only.every(k => a.includes(k)) && !E.q94.excluded_in_sentence.some(k => b.includes(k)), { alone: a, sentence: b }); } finally { await close(p); }
};
R.Q100 = async (ctx, u) => {
  const d = {}; let all = true;
  for (const [q, v] of Object.entries(E.q100)) { const p = await ctx.page(u.tool); try { await query(p, q, "有限公司"); await showAll(p); const c = (await cards(p)).map(x => x.code); d[q] = c; const extra = v.v1_9_sep.filter(k => !v.v1_10.includes(k)); all = all && JSON.stringify(c) === JSON.stringify(v.v1_10) && !extra.some(k => c.includes(k)); } finally { await close(p); } }
  return ok(all, d);
};
async function topState(p) {
  return p.evaluate(([cn, lg]) => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
    const find = t => [...document.querySelectorAll("body *")].filter(e => e.textContent === t && ![...e.children].some(c => c.textContent === t) && vis(e));
    const a = find(cn), b = find(lg), first = document.querySelector("#results .cand");
    const before = (x, y) => !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) && x.getBoundingClientRect().top < y.getBoundingClientRect().top;
    return { notice: a.length, legend: b.length, order: (a.length === 1 && first ? before(a[0], first) : null), legendOrder: (b.length === 1 && a.length === 1 && first ? before(a[0], b[0]) && before(b[0], first) : null), cards: document.querySelectorAll("#results .cand").length };
  }, [A.candidate_notice, A.phrase_legend]);
}
R.Q101 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, AC[0].input, "有限公司"); d.s1 = await topState(p);
    await query(p, "機場園區", "有限公司"); d.s2 = await topState(p); d.s2codes = (await cards(p)).map(x => x.code);
    await query(p, "qwerty火星挖礦", "有限公司"); d.s3 = await topState(p); d.s3nr = await visibleTextCount(p, A.no_result);
    await query(p, "e801060", "有限公司"); d.s4 = await topState(p);
    const g = d.s1.notice === 1 && d.s1.legend === 1 && d.s1.order && d.s1.legendOrder && JSON.stringify(d.s2codes) === JSON.stringify(E.candidates["機場園區"].rows) && d.s2.notice === 1 && d.s2.legend === 0 && d.s2.order && d.s3.notice === 0 && d.s3.legend === 0 && d.s3nr === 1 && d.s4.notice === 1 && d.s4.legend === 0 && d.s4.order;
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
  const d = {}; let all = true;
  for (const [q, v] of Object.entries(E.q103)) {
    const p = await ctx.page(u.tool);
    try { await query(p, q, "有限公司"); await showAll(p); const c = await cards(p); const tg = Object.fromEntries(c.filter(x => x.tag !== null).map(x => [x.code, x.tag]));
      const nr = await visibleTextCount(p, A.no_result);
      const names = c.filter(x => E.q7_master[x.code]).every(x => x.name === E.q7_master[x.code].name);
      const g = setEq(Object.keys(tg), v.phrase_hits) && Object.keys(v.tags).every(k => tg[k] === v.tags[k]) && c.length === v.count && (v.count === 0 ? nr === 1 : nr === 0) && names;
      d[q] = { tagged: tg, count: c.length, noResult: nr, names }; all = all && g; } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q40 = async (ctx, u, env) => {
  const bp = fs.readFileSync(env.buildPy, "utf8");
  const bad = /data\.gcis\.nat\.gov\.tw/.test(env.src.tool) || /data\.gcis\.nat\.gov\.tw/.test(bp) || /^\s*(import|from)\s+(urllib|requests|http|socket)/m.test(bp);
  return ok(!bad, { toolHasCsvHost: /data\.gcis\.nat\.gov\.tw/.test(env.src.tool), buildHasCsvHost: /data\.gcis\.nat\.gov\.tw/.test(bp), buildImportsNet: /^\s*(import|from)\s+(urllib|requests|http|socket)/m.test(bp) });
};
async function attribState(p) {
  return p.evaluate(([att, disc]) => {
    const els = [...document.querySelectorAll("body *")].filter(e => e.innerText === att && ![...e.children].some(c => c.innerText === att));
    const vis = els.filter(e => e.getBoundingClientRect().height > 0);
    const e = vis[0]; if (!e) return { n: 0 };
    const a = [...e.querySelectorAll("a")].find(x => x.getAttribute("href") === "https://data.gov.tw/license");
    const res = document.querySelector("#results"); const dd = [...document.querySelectorAll("body *")].find(x => x.textContent === disc);
    return { n: vis.length, link: !!a && a.getAttribute("target") === "_blank", fits: e.getBoundingClientRect().height <= window.innerHeight, afterResults: !!(res && (res.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)), beforeDisclaimer: !!(dd && (e.compareDocumentPosition(dd) & Node.DOCUMENT_POSITION_FOLLOWING)) };
  }, [A.attribution, A.disclaimer]);
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
    for (const k of three) { await query(p, k, "有限公司"); const n = await visibleTextCount(p, A.code_not_found.replace("〔代碼〕", k)); d[k] = n; all = all && n === 1; }
    for (const q of ["第一類電信", "第二類電信", "機場園區"]) { await query(p, q, "有限公司"); await showAll(p); const c = (await cards(p)).map(x => x.code); d[q] = c.filter(k => three.includes(k)); all = all && d[q].length === 0; }
    const emb = ["data-codes", "data-list", "data-phrases"].map(id => env.src.tool.match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`))[1]).join("");
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
  try { for (const q of ["e801060", " E801060 ", "E801060。"]) { await query(p, q, "有限公司"); const c = await cards(p); const t = await bodyText(p); const s = await topState(p);
      const g = c.length === 1 && JSON.stringify(c.map(x => x.code)) === JSON.stringify(E.candidates[q].rows) && restrOk(c[0], "E801060", [10]) && !t.includes("由常見說法") && s.notice === 1 && s.legend === 0;
      d[q] = { codes: c.map(x => x.code), tagFree: !t.includes("由常見說法"), notice: s.notice, legend: s.legend }; all = all && g; }
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
  return ok(LST.length === L.category_count && JSON.stringify(LST) === JSON.stringify(exp) && JSON.stringify(multi) === JSON.stringify(L.multi_category), { count: LST.length, equal: JSON.stringify(LST) === JSON.stringify(exp), multi });
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
    const d = leaf(disc), s = all.filter(e => e.tagName === "A" && e.textContent.trim() === sig && vis(e)), b = all.filter(e => e.tagName === "A" && e.textContent.trim() === book && vis(e)), sm = all.filter(e => e.tagName === "SUMMARY" && e.textContent.trim() === bt && vis(e)), v = leaf(ver);
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
R.Q72 = async (ctx, u, env) => {
  const r = await eachWidth(ctx, u.tool, async p => {
    const s = await p.evaluate(([book, url, oldU, oldA]) => {
      const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden"; };
      const links = [...document.querySelectorAll("a")].filter(a => (a.textContent.trim() === book || a.getAttribute("href") === url || (a.getAttribute("aria-label") || "").startsWith(book)) && vis(a) && a.tabIndex >= 0);
      const a = links[0];
      return { n: links.length, text: a && a.textContent, href: a && a.getAttribute("href"), target: a && a.getAttribute("target"), rel: a && a.getAttribute("rel"), aria: a && a.getAttribute("aria-label"), domOld: document.documentElement.outerHTML.includes(oldU) || document.documentElement.outerHTML.includes(oldA) };
    }, [A.booking, A.booking_url, A.booking_url_old, A.booking_aria_old]);
    return ok(s.n === 1 && s.text === A.booking && s.href === A.booking_url && s.target === "_blank" && /noopener/.test(s.rel || "") && s.aria === A.booking_aria && !s.domOld, s);
  });
  const srcOld = env.src.tool.includes(A.booking_url_old) || env.src.tool.includes(A.booking_aria_old);
  return ok(r.ok && !srcOld, { srcOld, rows: r.detail });
};
R.Q73 = (ctx, u) => eachWidth(ctx, u.tool, async p => {
  const s = await p.evaluate(([bt, book, ver]) => {
    const sm = [...document.querySelectorAll("details > summary")].filter(e => e.textContent.trim() === bt); if (sm.length !== 1) return { n: sm.length };
    const det = sm[0].parentElement; const closed = !det.open;
    const b = [...document.querySelectorAll("a")].find(a => a.textContent.trim() === book); const v = [...document.querySelectorAll("body *")].find(e => e.textContent.trim() === ver && !e.children.length);
    const pos = !!b && !!v && !!(b.compareDocumentPosition(det) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(det.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING);
    det.open = true; const items = [...det.querySelectorAll("li")].map(l => l.innerText.trim()); det.open = false;
    return { n: 1, closed, pos, items };
  }, [A.basis_title, A.booking, A.version_line]);
  return ok(s.n === 1 && s.closed && s.pos && JSON.stringify(s.items) === JSON.stringify([A.basis_item_1, A.basis_item_2, A.basis_item_3, A.basis_item_4]), s);
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
        ["q20[0]", async () => query(p, E.q20[0].input, "有限公司")], ["300字", async () => { await p.fill("#biz", "咖".repeat(300)); await p.dispatchEvent("#biz", "input"); }]];
      for (const [lab, f] of steps) { await f(); const s = await sw(p); const g = s.sw <= s.iw && s.bw <= s.iw; d.push({ w, lab, ...s }); all = all && g; }
    } finally { await close(p); }
  }
  return ok(all, d);
};
R.Q77 = async (ctx, u) => {
  const d = []; let all = true;
  for (const [w, h] of [[1366, 768], [1024, 640], [390, 844]]) {
    const p = await ctx.page(u.tool, w, h);
    try {
      await query(p, "室內設計", "有限公司"); await p.waitForTimeout(100);
      const s = await p.evaluate(() => { const c = document.querySelector("#results .cand"); if (!c) return { ok: false }; const r1 = c.querySelector(".cand-code").getBoundingClientRect(), r2 = c.querySelector(".cand-name").getBoundingClientRect(); const inV = r => r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth; const top = document.elementFromPoint(r1.left + 2, r1.top + r1.height / 2); return { ok: inV(r1) && inV(r2) && !!top && c.contains(top) }; });
      await p.evaluate(() => window.scrollTo(0, 0)); await query(p, "室內設計", null); await p.waitForTimeout(100);
      const m = await p.evaluate(t => { const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); if (!e) return false; const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }, A.org_required);
      d.push({ w, h, first: s.ok, orgRequired: m }); all = all && s.ok && m;
    } finally { await close(p); }
  }
  return ok(all, d);
};
const Q78_QUERIES = [["C802041", "有限公司"], ["E801060", "有限公司"], ["J701010", "有限公司"], ["F112010", "股份有限公司"], ["J905010", "獨資"], ["H203011", "有限公司"], ["I103060", "有限公司"], ["HZ07011", "股份有限公司"], ["G606011", "有限公司"], ["機場園區", "有限公司"], ["H101021", "有限公司"], ["J905010", "有限公司"], ["ZZ99999", "有限公司"], ["室內設計", "有限公司"], ...E.q20.map(x => [x.input, "有限公司"]), ["qwerty火星挖礦", "有限公司"], ["咖啡廳", null], ["F112010", "未定"], ["H101021", "未定"], ["J905010", "未定"], ["G901011", "有限公司"], ["G902011", "有限公司"], ["第一類電信", "有限公司"], ["第二類電信", "有限公司"], ["特定電力", "有限公司"], ["加氫", "有限公司"], ["網路廣告", "有限公司"], ["獵槍", "有限公司"], ["寵物生命", "有限公司"], ["I102010", "有限公司"], ["I503010", "有限公司"], ["JA02071", "有限公司"], ["e801060", "有限公司"], [" E801060 ", "有限公司"], ["E801060。", "有限公司"], ...AC.map(x => [x.input, "有限公司"]), [E.placeholder_example, "有限公司"], ...E.purpose_examples.map(x => [x, "有限公司"]), [E.q93.input, "有限公司"], [E.q94.word, "有限公司"], ...Object.keys(E.q100).map(x => [x, "有限公司"]), ["咖啡廳 手搖飲", "有限公司"], ["賣保養品", "有限公司"], ["接案設計LOGO", "有限公司"], ...Object.keys(E.q103).map(x => [x, "有限公司"]), ["製造", "有限公司"], ["當舖", "有限公司"], ["咖啡廳 飲料", "有限公司"], ["室內、設計", "有限公司"]];
R.Q78 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    for (const [q, o] of Q78_QUERIES) { await query(p, q, o); await showAll(p); }
    await p.fill("#biz", "咖".repeat(300)); await p.dispatchEvent("#biz", "input"); await query(p, "賣保養品", "有限公司");
    await p.waitForTimeout(300);
    const after = p.__req.slice(p.__afterLoad); const wr = await writes(p);
    const srcBad = ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket"].filter(s => env.src.tool.includes(s));
    await p.reload({ waitUntil: "load" });
    const rl = await p.evaluate(() => ({ v: document.querySelector("#biz").value, cards: document.querySelectorAll("#results .cand").length, res: document.querySelector("#results").textContent }));
    const wr2 = await writes(p);
    const ph = await p.evaluate(t => { const ta = document.querySelector("#biz"); const e = [...document.querySelectorAll("body *")].find(x => x.textContent === t && !x.children.length); return !!e && Math.abs(e.getBoundingClientRect().top - ta.getBoundingClientRect().bottom) < 60; }, A.privacy_hint);
    const disc = (await bodyText(p)).includes("不會送出，也不會保存；重新整理即清空。");
    const w0 = x => x.ls + x.ss + x.idb + x.ck + x.lsLen + x.ssLen === 0 && x.cookie === "";
    return ok(after.length === 0 && srcBad.length === 0 && w0(wr) && w0(wr2) && rl.v === "" && rl.cards === 0 && rl.res === "" && ph && disc, { queries: Q78_QUERIES.length + 1, requestsAfterLoad: after, srcBad, writes: wr, writesAfterReload: wr2, reload: rl, privacyHint: ph, disclaimer: disc, pageErrors: p.__errs });
  } finally { await close(p); }
};
R.Q79 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, "咖啡廳 飲料", "有限公司"); await showAll(p); const a = (await cards(p)).map(x => x.code);
    const det = E.candidates["咖啡廳 飲料"].detail; const two = det.filter(r => r[1] === 2).map(r => r[0]);
    const lastTwo = Math.max(...two.map(k => a.indexOf(k))), firstOne = Math.min(...det.filter(r => r[1] === 1).map(r => a.indexOf(r[0])));
    d.a = { two, order: a, ok: a.includes("F501030") && two.includes("F501030") && lastTwo < firstOne && JSON.stringify(a) === JSON.stringify(E.candidates["咖啡廳 飲料"].rows) };
    await query(p, "室內、設計", "有限公司"); await showAll(p); const b = (await cards(p)).map(x => x.code);
    const xb = E.candidates["室內、設計"]; // 逾 40 筆者 ext 只記 rows_head（前 30 筆）與 count
    d.b = { count: b.length, ok: b.includes("E801060") && (xb.rows ? JSON.stringify(b) === JSON.stringify(xb.rows) : JSON.stringify(b.slice(0, 30)) === JSON.stringify(xb.rows_head) && b.length === xb.count) };
    return ok(d.a.ok && d.b.ok, d);
  } finally { await close(p); }
};
R.Q85 = async (ctx, u) => {
  const p = await ctx.page(u.tool); const d = {};
  try {
    await query(p, "製造", "有限公司"); const n1 = (await cards(p)).length; const btn = await p.$("#showAll"); const bt = btn ? await btn.textContent() : null;
    if (btn) await btn.click(); const n2 = (await cards(p)).length; const gone = !(await p.$("#showAll"));
    await query(p, "當舖", "有限公司"); const n3 = (await cards(p)).length; const btn2 = await p.$("#showAll");
    const N = E.candidates["製造"].count;
    Object.assign(d, { first: n1, button: bt, all: n2, gone, pawn: n3, pawnButton: !!btn2 });
    return ok(n1 === 30 && bt === A.show_all_btn.replace("N", String(N)) && n2 === N && gone && n3 <= 30 && n3 > 0 && !btn2, d);
  } finally { await close(p); }
};
async function headState(p, raw) {
  const s = await p.evaluate(([t, lead, items, c8]) => {
    const h = [...document.querySelectorAll("h1")]; const r = h[0] && h[0].getBoundingClientRect();
    const ta = document.querySelector("#biz,textarea");
    const leadEl = [...document.querySelectorAll("p")].find(e => e.innerText.trim() === lead);
    const ol = leadEl && leadEl.nextElementSibling;
    const li = ol && ol.tagName === "OL" ? [...ol.children].map(x => x.innerText.trim()) : null;
    const after = (x, y) => !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { h1: h.length, text: h[0] && h[0].innerText, inView: !!r && r.top >= 0 && r.bottom <= window.innerHeight && window.scrollY === 0, leadAfterH1: after(h[0], leadEl), olBeforeInput: ta ? after(ol, ta) : true, li, c8: document.body.innerText.includes(c8) };
  }, [A.page_title, A.purpose_lead, [A.purpose_item_1, A.purpose_item_2, A.purpose_item_3], C8_PURPOSE]);
  return s;
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
    const items = JSON.stringify([A.purpose_item_1, A.purpose_item_2, A.purpose_item_3]);
    const g = [s0, s1].every(s => s.leadAfterH1 && s.olBeforeInput && JSON.stringify(s.li) === items && !s.c8) && rw.hasLead && rw.lis && !rw.c8 && !env.src.tool.includes(C8_PURPOSE); d.push({ w, load: s0, after: s1, raw: rw }); all = all && g; } finally { await close(p); } }
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
    await p.click("#biz"); await p.keyboard.type("咖啡廳".repeat(100) + "店"); d.typed = await st(p);
    await p.check('input[name="org"][value="有限公司"]'); await p.click("#searchBtn"); d.searchAfterTyped = await p.evaluate(() => ({ disabled: document.querySelector("#searchBtn").disabled, results: document.querySelector("#results").children.length }));
    await p.fill("#biz", ""); await p.click("#biz"); await p.keyboard.insertText("店".repeat(400)); d.pasted = await st(p);
    await p.fill("#biz", ""); await p.click("#biz"); await p.keyboard.insertText("店".repeat(299)); d.n299 = await st(p);
    const g = [d.typed, d.pasted].every(s => s.len === 300 && s.ml === "300" && s.hints === 1 && s.described) && d.n299.hints === 0 && !d.searchAfterTyped.disabled && d.searchAfterTyped.results > 0;
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
    d.s4 = { codes: (await cards(p)).map(x => x.code), btn: !!(await p.$("#showAll")), notice: await visibleTextCount(p, A.candidate_notice), hint: await visibleTextCount(p, A.old_text_hint) };
    const g = d.s1.h1 && d.s1.ol && d.s1.ta && d.s1.taVal && d.s1.org === "有限公司" && d.s1.btn && d.s1.echo === 0 && d.s2.cards === 0 && d.s2.nr === 1 && JSON.stringify(d.s4.codes) === JSON.stringify(E.candidates["早餐店"].rows) && !d.s4.btn && d.s4.notice === 1 && d.s4.hint === 0;
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
  const st = () => p.evaluate(() => ({ v: document.querySelector("#biz").value, org: !!document.querySelector('input[name="org"]:checked'), res: document.querySelector("#results").textContent, cards: document.querySelectorAll("#results .cand").length, ac: [document.querySelector("#biz").getAttribute("autocomplete"), ...[...document.querySelectorAll('input[name="org"]')].map(r => r.getAttribute("autocomplete"))] }));
  try {
    await query(p, AC[0].input, "有限公司"); await p.reload({ waitUntil: "load" }); const a = await st();
    await query(p, AC[0].input, "有限公司"); await p.goto(origin + "/other.html", { waitUntil: "load" }); await p.goBack({ waitUntil: "load" }); await p.waitForTimeout(300); const b = await st();
    const wr = await writes(p);
    const clean = s => s.v === "" && !s.org && s.res === "" && s.cards === 0 && s.ac.every(x => x === "off");
    return { ok: clean(a) && clean(b) && wr.ls + wr.ss + wr.idb + wr.ck + wr.lsLen + wr.ssLen === 0, reload: a, back: b, writes: wr };
  } finally { await close(p); }
}
R.Q107 = async (ctx, u) => {
  const c = await q107Engine(ctx.browser, u.tool, `http://127.0.0.1:${PORT}`);
  const others = {};
  for (const name of ["firefox", "webkit"]) { try { const b = await pw[name].launch(); try { others[name] = await q107Engine(b, u.tool, `http://127.0.0.1:${PORT}`); } finally { await b.close(); } } catch (e) { others[name] = { ok: null, error: String(e.message).split("\n")[0] }; } }
  const ran = Object.values(others).every(x => x.ok !== null);
  if (!ran) return { ok: c.ok ? null : false, detail: { chromium: c, ...others, note: "Firefox、WebKit 未安裝於本環境（不得執行 playwright install），三引擎未齊，Chromium 部分之結果另記" } };
  return ok(c.ok && Object.values(others).every(x => x.ok), { chromium: c, ...others });
};
R.Q108 = async (ctx, u, env) => {
  const p = await ctx.page(u.tool);
  try {
    await p.waitForTimeout(300);
    const res = await p.evaluate(() => [...document.querySelectorAll("link,script,img,source,iframe")].map(e => e.getAttribute("src") || e.getAttribute("href")).filter(s => s && !s.startsWith("data:")));
    const words = ["fonts.googleapis.com", "fonts.gstatic.com", "@font-face", "@import"].filter(w => env.src.tool.includes(w));
    return ok(res.length === 0 && words.length === 0 && p.__req.length === 1, { nonDataRefs: res, words, requests: p.__req });
  } finally { await close(p); }
};
/* 開發中頁 */
R.D01 = async (ctx, u) => { const p = await ctx.page(u.dev); try { const h = await p.evaluate(() => ({ title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content, robots: (document.querySelector('meta[name="robots"]') || {}).content, tv: (document.querySelector('meta[name="tool-version"]') || {}).content, lang: document.documentElement.lang }));
  return ok(h.title === A.dev_title && h.desc === A.dev_meta_description && h.robots === "noindex,nofollow" && h.tv === A.dev_tool_version && !h.tv.includes(A.forbidden_version_suffix) && h.lang === "zh-Hant", h); } finally { await close(p); } };
R.D02 = async (ctx, u, env) => {
  const d = []; let all = true; const items = JSON.stringify([A.purpose_item_1, A.purpose_item_2, A.purpose_item_3]);
  for (const w of WIDTHS) { const p = await ctx.page(u.dev, w, 768); try { const s = await headState(p); const rw = rawHas(p.__raw);
    const g = s.h1 === 1 && s.text === A.page_title && s.inView && s.leadAfterH1 && JSON.stringify(s.li) === items && !s.c8 && rw.h1 === 1 && rw.h1text === A.page_title && rw.hasLead && rw.lis && !rw.c8 && !env.src.dev.includes(C8_PURPOSE)
      && await p.evaluate(lead => { const h = document.querySelector("h1"); let e = h.nextElementSibling; while (e && e.tagName === "HR") e = e.nextElementSibling; return !!e && e.innerText.trim() === lead && e.nextElementSibling && e.nextElementSibling.tagName === "OL"; }, A.purpose_lead);
    d.push({ w, ...s, raw: rw }); all = all && g; } finally { await close(p); } }
  return ok(all, d);
};
R.D03 = async (ctx, u, env) => {
  const r = await eachWidth(ctx, u.dev, async p => {
    const s = await p.evaluate(([book, url]) => { const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; }; const links = [...document.querySelectorAll("a")].filter(a => (a.textContent.trim() === book || a.getAttribute("href") === url) && vis(a) && a.tabIndex >= 0); const a = links[0]; return { n: links.length, text: a && a.textContent, href: a && a.getAttribute("href"), target: a && a.getAttribute("target"), rel: a && a.getAttribute("rel"), aria: a && a.getAttribute("aria-label") }; }, [A.booking, A.booking_url]);
    return ok(s.n === 1 && s.text === A.booking && s.href === A.booking_url && s.target === "_blank" && /noopener/.test(s.rel || "") && s.aria === A.booking_aria, s);
  }, [null]);
  const srcOld = env.src.dev.includes(A.booking_url_old) || env.src.dev.includes(A.booking_aria_old);
  return ok(r.ok && !srcOld, { srcOld, rows: r.detail });
};
R.D04 = async (ctx, u) => eachWidth(ctx, u.dev, async p => {
  const s = await p.evaluate(K => {
    const all = [...document.querySelectorAll("body *")];
    const leaf = t => all.filter(e => (e.innerText || "").trim() === t && ![...e.children].some(c => (c.innerText || "").trim() === t));
    const one = t => leaf(t);
    const h1 = [...document.querySelectorAll("h1")]; const ol = document.querySelector("ol");
    const seq = [one(K.dev_eyebrow), h1, one(K.purpose_lead), one(K.dev_status), all.filter(e => e.tagName === "A" && e.textContent.trim() === K.booking), all.filter(e => e.tagName === "A" && e.textContent.trim() === K.dev_all_tools), all.filter(e => e.tagName === "A" && e.textContent.trim() === K.signature), one(K.dev_version_line)];
    const counts = seq.map(x => x.length);
    const els = seq.map(x => x[0]);
    let dom = els.every(Boolean), y = dom;
    for (let i = 0; dom && i < els.length - 1; i++) { dom = dom && !!(els[i].compareDocumentPosition(els[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING); y = y && els[i].getBoundingClientRect().top <= els[i + 1].getBoundingClientRect().top && (i === 4 || els[i].getBoundingClientRect().top < els[i + 1].getBoundingClientRect().top || els[i].getBoundingClientRect().left < els[i + 1].getBoundingClientRect().left); }
    const at = els[5], sg = els[6];
    const absent = [!!document.querySelector("textarea,input,select,button,form"), ...[K.candidate_notice, K.phrase_legend, K.attribution, K.disclaimer, K.basis_title].map(t => document.body.innerText.includes(t))];
    return { counts, dom, y, allTools: at && [at.getAttribute("href"), at.getAttribute("target")], sig: sg && [sg.getAttribute("href"), sg.getAttribute("target")], olAfterLead: !!ol, absent };
  }, A);
  return ok(s.counts.every(n => n === 1) && s.dom && s.y && s.allTools && s.allTools[0] === A.dev_all_tools_url && s.allTools[1] !== "_blank" && s.sig && s.sig[0] === A.signature_url && s.sig[1] === "_blank" && s.absent.every(x => !x), s);
}, [null]);
R.D05 = async (ctx, u, env) => {
  const p = await ctx.page(u.dev);
  try { await p.waitForTimeout(300); const res = await p.evaluate(() => [...document.querySelectorAll("link,img,source,iframe,script")].map(e => e.getAttribute("src") || e.getAttribute("href")).filter(s => s && !s.startsWith("data:"))); const wr = await writes(p);
    const words = ["@font-face", "@import", "fonts.googleapis.com", "fonts.gstatic.com", "<script"].filter(w => env.src.dev.includes(w));
    return ok(p.__req.length === 1 && res.length === 0 && words.length === 0 && wr.ls + wr.ss + wr.idb + wr.ck + wr.lsLen + wr.ssLen === 0, { requests: p.__req, nonData: res, words, writes: wr }); } finally { await close(p); }
};
R.D06 = (ctx, u) => eachWidth(ctx, u.dev, async p => {
  const s = await p.evaluate(([book, sig]) => {
    const sw = document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth;
    const H = document.documentElement.scrollHeight; const fixed = e => { for (let x = e; x; x = x.parentElement) if (getComputedStyle(x).position === "fixed") return true; return false; };
    const res = {}; for (const [k, t] of [["book", book], ["sig", sig]]) { const a = [...document.querySelectorAll("a")].filter(e => e.textContent.trim() === t); let seen = 0;
      if (a.length === 1) for (let y = 0; y <= H; y += 40) { window.scrollTo(0, y); const r = a[0].getBoundingClientRect(); if (r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0) { seen++; break; } }
      res[k] = { n: a.length, seen, fixed: a.length ? fixed(a[0]) : null }; }
    window.scrollTo(0, 0); return { sw, ...res };
  }, [A.booking, A.signature]);
  return ok(s.sw && s.book.n === 1 && s.book.seen === 1 && !s.book.fixed && s.sig.n === 1 && s.sig.seen === 1 && !s.sig.fixed, s);
}, [null]);
/* 建置列 Q01～Q04（於暫存目錄複製 build/ 執行，不動 repo 之輸出） */
function buildSandbox(name, patchPy, mutate) {
  const root = path.join(TMP, "build-" + name + "-" + crypto.randomBytes(4).toString("hex")), b = path.join(root, "business-items", "build");
  fs.mkdirSync(b, { recursive: true });
  for (const f of ["build.py", "code_v8.xlsx", "business.pdf", "ext_c9b_輸出.json", "page_template.html", "dev_template.html"]) fs.copyFileSync(path.join(BUILD, f), path.join(b, f));
  if (patchPy) fs.writeFileSync(path.join(b, "build.py"), patchPy(fs.readFileSync(path.join(b, "build.py"), "utf8")));
  if (mutate) mutate(b);
  return { root, b };
}
function runBuild(sb, args = []) {
  const r = spawnSync("python3", ["-I", path.join(sb.b, "build.py"), ...args], { encoding: "utf8" });
  const idx = path.join(sb.root, "business-items", "index.html");
  return { code: r.status, out: r.stdout, err: r.stderr, index: fs.existsSync(idx), report: fs.existsSync(path.join(sb.b, "build_report.md")) ? fs.readFileSync(path.join(sb.b, "build_report.md"), "utf8") : null };
}
const pyXlsx = (file, code) => execFileSync("python3", ["-I", "-c", `import openpyxl,sys\nwb=openpyxl.load_workbook(sys.argv[1])\nws=wb.active\n${code}\nwb.save(sys.argv[1])`, file]);
R.Q01 = async (ctx, u, env) => {
  const sb = buildSandbox("Q01", env.patchBuild);
  const r = runBuild(sb);
  const rep = r.report || "";
  const g = r.code === 0 && r.index && !!r.report && rep.includes("code_v8.xlsx｜92149 位元組｜SHA-256 931126c9f6640329fadb06fc18dab8f53fd636e817d01f6e2aa23606e443a52b") && rep.includes("business.pdf｜159336 位元組｜SHA-256 aa1c4e8bf1a9d1e5ce27888bd0c5b22fa7c4c359324c3ca5aa7a3c332408a710") && rep.includes(`筆數：${E.master.count}；不重複代碼：${E.master.count}；重複：無`) && rep.includes(`尾碼 1（許可業務）：${E.master.tail_1} 筆`);
  const same = r.index && sha256(fs.readFileSync(path.join(sb.root, "business-items", "index.html"))) === sha256(fs.readFileSync(path.join(TOOL, "index.html")));
  return ok(g, { exit: r.code, index: r.index, report: !!r.report, sameAsRepoIndex: same });
};
R.Q02 = async (ctx, u, env) => {
  const sb = buildSandbox("Q02", env.patchBuild, b => pyXlsx(path.join(b, "code_v8.xlsx"), "ws.cell(row=1,column=4).value='定義內客'"));
  const r = runBuild(sb, ["--test-no-hash"]);
  return ok(r.code !== 0 && !r.index && r.err.includes("實際欄名") && r.err.includes("定義內客"), { exit: r.code, index: r.index, err: r.err.trim(), mode: "測試模式（--test-no-hash）：雜湊核對先行於欄名核對，故欄名一例須關閉雜湊核對方能觸發" });
};
R.Q03 = async (ctx, u, env) => {
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
  const sb = buildSandbox("Q04", env.patchBuild, b => pyXlsx(path.join(b, "code_v8.xlsx"), "ws.append([c.value for c in ws[2]])"));
  const r = runBuild(sb, ["--test-no-hash"]);
  return ok(r.code !== 0 && !r.index && r.err.includes("代碼重複") && r.err.includes(M ? Object.keys(M).sort()[0] : ""), { exit: r.code, index: r.index, err: r.err.trim() });
};

const ROW_ORDER = ["Q01", "Q02", "Q03", "Q04", "Q05", "Q06", "Q07", "Q08", "Q09", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q42", "Q43", "Q44", "Q18", "Q19", "Q20", "Q21", "Q86", "Q87", "Q88", "Q89", "Q90", "Q91", "Q92", "Q93", "Q94", "Q100", "Q101", "Q102", "Q103", "Q40", "Q63", "Q65", "Q66", "Q67", "Q68", "Q69", "Q82", "Q83", "Q84", "Q70", "Q71", "Q72", "Q73", "Q74", "Q75", "Q76", "Q77", "Q78", "Q79", "Q85", "Q95", "Q96", "Q97", "Q98", "Q104", "Q105", "Q106", "Q107", "Q108", "Q80", "Q81", "Q99", "D01", "D02", "D03", "D04", "D05", "D06"];
const MANUAL = { Q80: "X4（🛠️ 對照組）未到，記未執行（規格第五節 P27、驗證表 Q80）", Q99: "X4 未到，記未執行", Q81: "人工列：截圖已產出（verify/screenshots/），交使用者並排核可；判定記未執行" };

/* ───────── 刻意錯誤版 ───────── */
function sub(s, a, b) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`補丁之原字串出現 ${n} 次：${a.slice(0, 60)}`); return s.replace(a, () => b); }
function patchJson(s, id, f) { const re = new RegExp(`(id="${id}">)([\\s\\S]*?)(</script>)`); const m = s.match(re); const o = JSON.parse(m[2]); const n = f(o) || o; return s.replace(re, (_, a, __, c) => a + JSON.stringify(n).replace(/</g, "\\u003c") + c); }
const T = "tool", D = "dev", B = "build";
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
  ["E11", T, s => sub(s, `content="${A.tool_version}"`, `content="${A.tool_version}${A.forbidden_version_suffix}"`), ["Q75", "Q74"]],
  ["E12", T, s => sub(s, `<p class="as-of">${A.version_line}</p>`, `<p class="as-of">版本 v1.0.0｜法規依據擷取日 115/10/15</p>`), ["Q74"]],
  ["E13", T, s => { const sig = s.match(/<a class="sig"[^>]*>[^<]*<\/a>\n/)[0]; return sub(sub(s, sig, ""), `<p class="as-of">${A.version_line}</p>`, `<p class="as-of">${A.version_line}</p>\n${sig}`); }, ["Q70"]],
  ["E14", T, s => sub(s, 'f.appendChild(el("p","flag-sub restriction-note",S.restriction_note));', ""), ["Q06", "Q17"]],
  ["E15", T, s => sub(sub(patchJson(s, "data-codes", C => { C.forEach(r => r.push(M[r[0]][1])); }), "BY[r[0]]={code:r[0],name:r[1],def:r[2],", "BY[r[0]]={code:r[0],name:r[1],def:r[2],en:r[3],"), 'h.appendChild(el("span","cand-name",e.name));a.appendChild(h);', 'h.appendChild(el("span","cand-name",e.name));h.appendChild(el("span","cand-en",e.en));a.appendChild(h);'), ["Q19", "Q82"]],
  ["E16", T, s => sub(s, "rows.sort(function(a,b){", "if(!rows.length)rows=ORDER.slice(0,5).map(function(k){return {code:k,nh:0,tot:0,tag:null};});rows.sort(function(a,b){"), ["Q21"]],
  ["E17", T, s => patchJson(s, "data-codes", C => { C.forEach(r => { r[2] = r[2].replace(/\s/g, ""); }); }), ["Q82"]],
  ["E18", T, s => { const bk = s.match(/<a class="sy-book-btn"[^>]*>[^<]*<\/a>\n/)[0]; return sub(s, bk, bk + bk); }, ["Q72"]],
  ["E19", T, s => patchJson(s, "data-phrases", P => { P.F501030 = P.F501030.filter(x => x !== "咖啡廳"); }), ["Q86", "Q92"]],
  ["E20", T, s => sub(s, "SCANW.forEach(function(w){if(x.indexOf(w)>=0)words[w]=true;});", ""), ["Q86", "Q87", "Q88", "Q89", "Q91"]],
  ["E21", T, s => sub(s, "if(PH[w]&&PH[w][k]){s=3;via.push(w);}", "if(PH[w]&&PH[w][k]){s=2;via.push(w);}"), ["Q93"]],
  ["E22", T, s => sub(s, "else if(typed[w]&&bigramHit(w,e.n+e.d))s=1;", "else if(bigramHit(w,e.n+e.d))s=1;"), ["Q94"]],
  ["E23", T, s => sub(s, "tag:via.length?tagText(k,via,q,x):null", 'tag:via.length?tagText(k,via,q,x):S.phrase_tag.replace("〔說法〕","")'), ["Q86", "Q90"]],
  ["E24", T, s => sub(s, 'return S.phrase_tag.replace("〔說法〕",forms.join("」「"));', 'return "依經濟部常見說法對到";'), ["Q86", "Q90", "Q102"]],
  ["E25", T, s => sub(s, `<h1>${A.page_title}</h1>`, `<h2>${A.page_title}</h2>`), ["Q95"]],
  ["E26", T, s => { const head = s.match(/<h1>[\s\S]*?<\/ol>\n/)[0]; return sub(sub(s, head, ""), "<script>\n(function(){", `<script>\ndocument.querySelector(".page-head .wrap").insertAdjacentHTML("afterbegin",${JSON.stringify(head)});\n(function(){`); }, ["Q95", "Q96"]],
  ["E27", T, s => sub(sub(sub(s, `<li>${A.purpose_item_1}</li>`, `<li>1.${A.purpose_item_1}</li>`), `<li>${A.purpose_item_2}</li>`, `<li>2.${A.purpose_item_2}</li>`), `<li>${A.purpose_item_3}</li>`, `<li>3.${A.purpose_item_3}</li>`), ["Q96"]],
  ["E28", T, s => sub(s, `placeholder="${A.input_placeholder}"`, 'placeholder="例：咖啡廳、室內設計、補習班"'), ["Q97"]],
  ["E29", T, s => sub(s, `class="sy-book-btn" href="${A.booking_url}"`, `class="sy-book-btn" href="${A.booking_url_old}"`), ["Q72"]],
  ["E30", T, s => sub(s, `aria-label="${A.booking_aria}"`, `aria-label="${A.booking_aria_old}"`), ["Q72"]],
  ["E31", T, s => sub(s, `<li>${A.basis_item_4}</li>\n`, ""), ["Q73", "Q98"]],
  ["E32", T, s => patchJson(s, "data-phrases", P => { P.F501060 = P.F501060.filter(x => x !== "早餐店"); P.F501030.push("早餐店"); }), ["Q88", "Q92"]],
  ["E33", T, s => sub(s, "rows:BY[code]?[{code:code,tag:null}]:[]", 'rows:BY[code]?[{code:code,tag:PHRASES[code]?S.phrase_tag.replace("〔說法〕",PHRASES[code][0]):null}]:[]'), ["Q69"]],
  ["E34", T, s => patchJson(s, "data-phrases", P => { P.F399040 = P.F399040.filter(x => x !== "蝦皮"); }), ["Q87", "Q91", "Q92"]],
  ["E35", T, s => sub(s, "if(cps(q.replace(/\\s/g,\"\")).length>HINT_LEN&&!tagged)", "if(cps(q.replace(/\\s/g,\"\")).length>HINT_LEN)"), ["Q20"]],
  ["E36", T, s => sub(s, "var SEP=/[\\s、,，。;；\\/／+＋]+/;", "var SEP=/[\\s、,，。;；\\/／+＋和與及]+/;"), ["Q100"]],
  ["E37", T, s => sub(s, 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);', ""), ["Q101"]],
  ["E38", T, s => sub(s, "if(tagged){var lg=", "if(true){var lg="), ["Q101"]],
  ["E39", T, s => sub(s, 'forms.join("」「")', 'forms.slice(0,1).join("」「")'), ["Q102"]],
  ["E40", T, s => sub(s, "var keep=via.filter(function(w){return !via.some(function(o){return o!==w&&o.indexOf(w)>=0;});});", "var keep=via.slice();"), ["Q102"]],
  ["E41", T, s => patchJson(s, "data-phrases", P => { P.H601011.push("保險經紀"); }), ["Q92", "Q103"]],
  ["E42", T, s => sub(s, ' maxlength="300"', ""), ["Q104"]],
  ["E43", T, s => sub(s, "state={rows:r.rows,org:org};", 'state={rows:r.rows,org:org};form.hidden=true;var ec=el("div","empty");ec.appendChild(el("p",null,q));ec.appendChild(el("p",null,org));results.appendChild(ec);'), ["Q105"]],
  ["E44", T, s => sub(s, 'var n=el("p","empty",t);', 'document.querySelector(".disclaimer").hidden=true;var n=el("p","empty",t);'), ["Q106"]],
  ["E45", T, s => sub(s, 'window.addEventListener("pageshow",resetAll);\nresetAll();', "").replace(/ autocomplete="off"/g, ""), ["Q107"]],
  ["E46", T, s => sub(s, "<title>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap">\n<title>'), ["Q78", "Q108"]],
  ["E47", T, s => { const at = s.match(/<p class="attribution" id="attribution">[\s\S]*?<\/p>\n/)[0]; return sub(sub(s, at, ""), `<p class="as-of">${A.version_line}</p>\n`, `<p class="as-of">${A.version_line}</p>\n${at}`); }, ["Q63"]],
  ["E52", T, s => sub(s, "return lit[0]||c[0]||w;", "return c[0]||w;"), ["Q102"]],
  ["E48", D, s => sub(s, 'content="noindex,nofollow"', 'content="index,follow"'), ["D01"]],
  ["E49", D, s => sub(s, `<hr class="rule">\n`, `<hr class="rule">\n<p class="lead">${C8_PURPOSE}</p>\n`), ["D02"]],
  ["E50", D, s => sub(s, `href="${A.booking_url}"`, `href="${A.booking_url_old}"`), ["D03"]],
  ["E51", D, s => sub(s, "<title>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap">\n<title>'), ["D05"]],
  ["E53", D, s => sub(s, A.dev_version_line, "版本 v0.1.0（開發中頁）"), ["D04"]],
  ["E54", D, s => { const bk = s.match(/<a class="btn btn-primary"[^>]*>[^<]*<\/a>\n/)[0]; return sub(sub(s, bk, ""), "</footer>", "</footer>\n" + bk.replace('class="btn btn-primary"', 'class="btn btn-primary" style="position:fixed;bottom:0;left:0"')); }, ["D04", "D06"]],
  // 補充刻意錯誤（驗證表 E 列未涵蓋之可程式判定列，各至少一個）
  ["X01", B, s => sub(s, 'with open(OUT_REPORT, "w", encoding="utf-8", newline="\\n") as f:\n        f.write("\\n".join(rep))', "pass"), ["Q01"]],
  ["X02", B, s => sub(s, "    if missing or len(head) != len(HEAD):", "    head = HEAD\n    if False:"), ["Q02"]],
  ["X03", B, s => sub(s, "    if not no_hash:", "    if False:"), ["Q03"]],
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
  ["X19", T, s => sub(s, 'target.scrollIntoView({block:"start"});', "").replace('if(fc&&fc.getBoundingClientRect().bottom>window.innerHeight)fc.scrollIntoView({block:"center"});', "").replace('m.scrollIntoView({block:"nearest"});', ""), ["Q77"]],
  ["X20", T, s => sub(s, "return (b.nh-a.nh)||(b.tot-a.tot)||", "return (b.tot-a.tot)||"), ["Q79"]],
  ["X21", T, s => sub(s, "var SHOW_FIRST=30,", "var SHOW_FIRST=100000,"), ["Q85"]],
];
// Q80、Q81、Q99 為人工列。E45 刪除 pageshow 之重設、載入時之重設（本頁兩者為同一函式）與 autocomplete="off"。

/* ───────── 改版前之版本 ───────── */
function preRevisionV18(s) { // 規格 v1_8 第七節（c8 方法）：只用自打之詞，分隔符號含「和」「與」「及」，無說法表、無整句掃描
  s = sub(s, "var SEP=/[\\s、,，。;；\\/／+＋]+/;", "var SEP=/[\\s、,，。;；\\/／+＋和與及]+/;");
  s = sub(s, "SCANW.forEach(function(w){if(x.indexOf(w)>=0)words[w]=true;});", "");
  return patchJson(s, "data-phrases", () => ({}));
}
function preRevisionV19(s, P) { // 規格 v1_9：說法表 .py、分隔符號含和與及、舊 phrase_tag 字樣、old_text_hint 只看字數、無 candidate_notice 與 phrase_legend
  s = sub(s, "var SEP=/[\\s、,，。;；\\/／+＋]+/;", "var SEP=/[\\s、,，。;；\\/／+＋和與及]+/;");
  s = patchJson(s, "data-phrases", () => P);
  s = sub(s, 'return S.phrase_tag.replace("〔說法〕",forms.join("」「"));', 'return "依本工具整理之常見說法對到";');
  s = sub(s, "if(cps(q.replace(/\\s/g,\"\")).length>HINT_LEN&&!tagged)", "if(cps(q.replace(/\\s/g,\"\")).length>HINT_LEN)");
  s = sub(s, 'var cn=el("p","notice",S.candidate_notice);cn.id="candNotice";results.appendChild(cn);', "");
  s = sub(s, "if(tagged){var lg=", "if(false){var lg=");
  return s;
}

/* ───────── 執行 ───────── */
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", () => { PORT = server.address().port; r(); }));
  const browser = await chromium.launch();
  const ctx = new Ctx(browser);
  const toolSrc = fs.readFileSync(path.join(TOOL, "index.html"), "utf8"), devSrc = fs.readFileSync(path.join(TOOL, "dev", "index.html"), "utf8");
  const report = fs.readFileSync(path.join(BUILD, "build_report.md"), "utf8");
  const baseEnv = { src: { tool: toolSrc, dev: devSrc }, report, buildPy: path.join(BUILD, "build.py"), patchBuild: null };
  const urls = { tool: publish("main", toolSrc), dev: publish("dev", devSrc) };
  async function runRow(id, u, env) {
    if (MANUAL[id]) return { result: "未執行", detail: MANUAL[id] };
    try { const r = await R[id](ctx, u, env); return { result: r.ok === null ? "未執行" : r.ok ? "通過" : "未通過", detail: r.detail }; }
    catch (e) { return { result: "未通過", detail: "例外：" + String(e && e.message || e).split("\n")[0] }; }
  }
  const results = {};
  const rows = ONLY ? ROW_ORDER.filter(r => ONLY.includes(r)) : ROW_ORDER;
  for (const id of rows) { results[id] = await runRow(id, urls, baseEnv); console.log(id, results[id].result); }

  // Q81 截圖
  const shots = path.join(VERIFY, "screenshots"); fs.mkdirSync(shots, { recursive: true });
  if (!ONLY || ONLY.includes("Q81")) {
    const plan = [["01_載入", null], ["02_Q05", ["C802041", "有限公司"]], ["03_Q12", ["HZ07011", "股份有限公司"]], ["04_Q14", ["H101021", "有限公司"]], ["05_Q16", ["ZZ99999", "有限公司"]], ["06_Q21", ["qwerty火星挖礦", "有限公司"]], ["07_Q42", ["咖啡廳", null]], ["08_Q86", [AC[0].input, "有限公司"]], ["09_Q20第1句", [E.q20[0].input, "有限公司"]], ["10_Q102咖啡廳手搖飲", ["咖啡廳 手搖飲", "有限公司"]], ["11_頁尾依據說明展開", "basis"]];
    for (const w of [1366, 390]) for (const [name, act] of plan) {
      const p = await ctx.page(urls.tool, w, 768);
      try { if (act === "basis") await p.evaluate(() => { document.querySelector("details").open = true; }); else if (act) await query(p, act[0], act[1]); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: path.join(shots, `${name}_${w}.png`), fullPage: true }); } finally { await close(p); }
    }
    for (const w of [1366, 390]) { const p = await ctx.page(urls.dev, w, 768); try { await p.screenshot({ path: path.join(shots, `12_開發中頁v0_2_0_${w}.png`), fullPage: true }); } finally { await close(p); } }
  }

  // 刻意錯誤
  const errs = {};
  if (!ONLY) for (const [id, kind, patch, expect] of VARIANTS) {
    let env = { ...baseEnv }, u = { ...urls };
    try {
      if (kind === T) { const s = patch(toolSrc); env.src = { ...env.src, tool: s }; u.tool = publish("v_" + id, s); }
      else if (kind === D) { const s = patch(devSrc); env.src = { ...env.src, dev: s }; u.dev = publish("v_" + id, s); }
      else { env.patchBuild = patch; patch(fs.readFileSync(path.join(BUILD, "build.py"), "utf8")); }
    } catch (e) { errs[id] = { expect, error: "補丁未套用：" + e.message }; console.log(id, "補丁未套用", e.message); continue; }
    const got = {};
    for (const r of expect) got[r] = (await runRow(r, u, env)).result;
    errs[id] = { expect, got, caught: expect.filter(r => got[r] === "未通過"), allCaught: expect.every(r => got[r] === "未通過") };
    console.log(id, JSON.stringify(got));
  }

  // 改版前之版本
  const pre = {};
  if (!ONLY) {
    { const s = preRevisionV18(toolSrc); const u = { ...urls, tool: publish("pre_v1_8", s) }; const env = { ...baseEnv, src: { ...baseEnv.src, tool: s } }; pre.v1_8 = {}; for (const r of ["Q86", "Q87", "Q88", "Q89", "Q90", "Q91", "Q92", "Q93", "Q94"]) pre.v1_8[r] = (await runRow(r, u, env)).result; pre.v1_8_expectFail = ["Q86", "Q87", "Q88"]; }
    if (PHRASE_PY && sha256(fs.readFileSync(PHRASE_PY)) === SHA_PHRASE_PY) {
      const P = JSON.parse(execFileSync("python3", ["-I", "-c", "import ast,json,sys\nt=ast.parse(open(sys.argv[1],encoding='utf-8').read())\nfor n in t.body:\n  if isinstance(n,ast.Assign) and getattr(n.targets[0],'id','')=='P': print(json.dumps(ast.literal_eval(n.value),ensure_ascii=False))", PHRASE_PY], { encoding: "utf8" }));
      const s = preRevisionV19(toolSrc, P); const u = { ...urls, tool: publish("pre_v1_9", s) }; const env = { ...baseEnv, src: { ...baseEnv.src, tool: s } };
      pre.v1_9 = {}; for (const r of ["Q20", "Q100", "Q101", "Q102", "Q103"]) pre.v1_9[r] = (await runRow(r, u, env)).result; pre.v1_9_expectFail = ["Q20", "Q100", "Q101", "Q102", "Q103"];
    } else pre.v1_9 = "未執行（未給 --phrase-v0-1 或其 SHA-256 不符）";
    const devOld = argOf("--dev-v0-1-0");
    if (devOld && fs.existsSync(devOld)) { const s = fs.readFileSync(devOld, "utf8"); const u = { ...urls, dev: publish("pre_dev", s) }; const env = { ...baseEnv, src: { ...baseEnv.src, dev: s } }; pre.dev_v0_1_0 = {}; for (const r of ["D01", "D02", "D03", "D04", "D05", "D06"]) pre.dev_v0_1_0[r] = (await runRow(r, u, env)).result; pre.dev_v0_1_0_expectFail = ["D02", "D03", "D04"]; }
    else pre.dev_v0_1_0 = "未執行（未給 --dev-v0-1-0）";
    pre.internal_v1_0 = "不適用：🛠️ 內部版 v1_0 之輸出不在本會話可讀之 repo（knowledge 68605af 之 inbox/工具十三/ 未收），無可比對之資料";
  }

  await browser.close(); server.close();
  const outDir = path.join(VERIFY, "results"); fs.mkdirSync(outDir, { recursive: true });
  const count = { 通過: 0, 未通過: 0, 未執行: 0 }; Object.values(results).forEach(r => count[r.result]++);
  const covered = new Set(VARIANTS.flatMap(v => v[3]));
  const out = { generated_by: "verify.js", tool_sha256: sha256(toolSrc), dev_sha256: sha256(devSrc), count, rows: results, deliberate_errors: errs, pre_revision: pre,
    row_ids_missing_vs_table: ROW_ORDER.filter(r => !results[r]), extra_ids: Object.keys(results).filter(r => !ROW_ORDER.includes(r)),
    programmatic_rows_without_error_version: ROW_ORDER.filter(r => !MANUAL[r] && !covered.has(r)) };
  if (!ONLY) fs.writeFileSync(path.join(outDir, "結果.json"), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ count, errsNotAllCaught: Object.entries(errs).filter(([k, v]) => !v.allCaught).map(([k, v]) => [k, v.got || v.error]), pre, uncovered: out.programmatic_rows_without_error_version }, null, 1));
  fs.rmSync(TMP, { recursive: true, force: true });
})().catch(e => { console.error(e); process.exit(1); });
