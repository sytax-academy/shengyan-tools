/* 營業項目查詢（business-items）之外殼 v1_2 驗證（驗證表 v1_18 Q138；c20〔驗證表 v1_19〕起 R02 之基準由呼叫端以 r02Expect 給定〔判定方式三十一〕；外殼驗證表 v1_2 定稿〔knowledge d938e6b〕之適用列）。
 * 射程：外殼驗證表各列之「對象」欄適用於營業項目查詢者（無側欄、單頁型〔表單查詢〕、狀態①、免費、有結果狀態〔同頁〕；含標「待正式版合入」之 F10），
 *   其餘列記射程標記「不適用」並列理由（外殼表表頭「判定」：不適用不是判定值）。
 * 比對基準：一律為 tools a47269e（c18，套外殼前之正式版）之頁面（規格 v1_21 第十一節之 6）；開發中頁 v0.2.0 不作基準。
 * 字樣：外殼規格 v1_2 附錄之逐字字樣由呼叫端以程式自外殼規格抽出（kv），不手抄。
 * 固定段甲（網路攔截）：對外請求一律於 browser context 層級記錄（context.on("request")），含新開分頁、彈出視窗與 iframe；點擊外部連結之測項只驗連結屬性，不實際送出請求。
 * 固定段乙（連結樣式量測）：不以點擊、Enter 或空白鍵觸發導航；焦點以 Tab 移入取得，量測後不按 Enter；會改變網址、開新分頁或捲動位置之操作於該項量測結束後才執行，其後之判定重新載入頁面再量。
 * 狀態（單頁型）：初始（入口）、輸入後（只輸入不查詢）、結果（「室內設計」）、顯示全部（「製造」按「顯示全部」）、查無（「qwerty火星挖礦」）。
 * 尺寸：寬 320、360、390、768、980、981、1024、1280、1440 × 高 600、639、640、768、900（45 組），另以 1440×900 之瀏覽器縮放 110％、125％
 *   （以 CSS 視窗 1309×818、1152×720 加 deviceScaleFactor 1.1、1.25 模擬；Playwright 無頁面縮放之 API，CSS 版面與縮放等效）。
 */
"use strict";
const fs = require("fs"), path = require("path");

const WS = [320, 360, 390, 768, 980, 981, 1024, 1280, 1440], HS = [600, 639, 640, 768, 900];
const FULL = [...WS.flatMap(w => HS.map(h => ({ w, h, z: 1 }))), { w: 1440, h: 900, z: 1.1 }, { w: 1440, h: 900, z: 1.25 }];
const sizeLab = s => s.z === 1 ? `${s.w}×${s.h}` : `${s.w}×${s.h}＠${Math.round(s.z * 100)}％`;
const vp = s => ({ width: Math.round(s.w / s.z), height: Math.round(s.h / s.z) });
const STATES = [
  ["初始", async p => { }],
  ["輸入後", async p => { await p.fill("#biz", "室內設計"); }],
  ["結果", async p => { await q(p, "室內設計"); }],
  ["顯示全部", async p => { await q(p, "製造"); const b = await p.$("#showAll"); if (b) await b.click(); }],
  ["查無", async p => { await q(p, "qwerty火星挖礦"); }],
];
const RESULT_STATES = ["結果", "顯示全部", "查無"];
async function q(p, t) { await p.fill("#biz", t); await p.click("#searchBtn"); await p.waitForTimeout(30); }

const INIT = () => {
  window.__w = { ls: 0, ss: 0, idb: 0, ck: 0 };
  const sp = Storage.prototype.setItem;
  Storage.prototype.setItem = function () { try { if (this === window.localStorage) window.__w.ls++; else window.__w.ss++; } catch (e) { window.__w.ss++; } return sp.apply(this, arguments); };
  try { const op = IDBFactory.prototype.open; IDBFactory.prototype.open = function () { window.__w.idb++; return op.apply(this, arguments); }; } catch (e) { }
  const d = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  Object.defineProperty(document, "cookie", { configurable: true, get() { return d.get.call(document); }, set(v) { window.__w.ck++; return d.set.call(document, v); } });
};

/* 頁面內共用函式（以字串注入；比對一律用未四捨五入之 CSS px） */
const LIB = `
window.__S = (() => {
  const vis = e => { if (!e) return false; const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0; };
  const rect = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const norm = s => (s || "").replace(/\\s+/g, "");
  const leaf = t => [...document.querySelectorAll("body *")].filter(e => (e.innerText || "").trim() === t && ![...e.children].some(c => (c.innerText || "").trim() === t));
  const leafAll = t => [...document.querySelectorAll("body *")].filter(e => norm(e.textContent) === norm(t) && ![...e.children].some(c => norm(c.textContent) === norm(t)));
  const visText = e => [...e.childNodes].filter(n => !(n.nodeType === 1 && n.getAttribute("aria-hidden") === "true")).map(n => n.textContent).join("").trim();
  const rgb = c => { const m = (c || "").match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const v = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const bgOf = e => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c && c.a > 0) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const varColor = n => { const d = document.createElement("span"); d.style.color = "var(" + n + ")"; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return getComputedStyle(document.documentElement).getPropertyValue(n).trim() ? c : null; };
  const cs = (e, ks) => { const s = getComputedStyle(e); return Object.fromEntries(ks.map(k => [k, s.getPropertyValue(k)])); };
  const after = (a, b) => !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const textRectsCenter = e => { const rg = document.createRange(); rg.selectNodeContents(e); const rs = [...rg.getClientRects()].filter(r => r.width > 0 && r.height > 0); if (!rs.length) return null; const lines = []; for (const r of rs) { const L = lines.find(x => r.top < x.b && r.bottom > x.t); if (L) { L.l = Math.min(L.l, r.left); L.r = Math.max(L.r, r.right); L.t = Math.min(L.t, r.top); L.b = Math.max(L.b, r.bottom); } else lines.push({ l: r.left, r: r.right, t: r.top, b: r.bottom }); } return lines.map(x => (x.l + x.r) / 2); };
  return { vis, rect, norm, leaf, leafAll, visText, rgb, lum, contrast, bgOf, varColor, cs, after, textRectsCenter };
})();`;

/* 每一尺寸與狀態之探針（A02、P05、E01、E03、E05、F02、F03、G01、G03、G04、L01、L03、R01 由之判定） */
const PROBE = K => {
  const S = window.__S; const { vis, rect, leaf } = S;
  const foot = document.querySelector("footer#siteFoot > div.wrap");
  const res = document.querySelector("#results");
  const inFoot = e => !!foot && foot.contains(e), inRes = e => !!res && res.contains(e);
  const focusable = a => a.tabIndex >= 0 && !a.hasAttribute("disabled");
  const A_ = [...document.querySelectorAll("a")];
  const books = A_.filter(a => a.getAttribute("href") === K.bookUrl && vis(a) && focusable(a));
  const vas = A_.filter(a => a.getAttribute("href") === K.vaUrl && vis(a) && focusable(a));
  const sigs = A_.filter(a => a.textContent.trim() === K.sig && vis(a));
  const discs = leaf(K.disc).filter(vis), privs = leaf(K.priv).filter(vis);
  const privAll = S.leafAll(K.priv);
  const main = document.querySelector("main .wrap"); const ms = main && getComputedStyle(main), mr = main && main.getBoundingClientRect();
  const mainCx = main ? mr.left + parseFloat(ms.paddingLeft) + (mr.width - parseFloat(ms.paddingLeft) - parseFloat(ms.paddingRight)) / 2 : null;
  const kids = foot ? [...foot.children] : [];
  const role = e => { if (!e) return null; if (S.norm(e.textContent) === S.norm(K.disc)) return "免責句"; if (e.matches && e.matches("a") && e.getAttribute("href") === K.sigUrl) return "署名";
    if (e.querySelector && (e.querySelector('a[href="' + K.bookUrl + '"]') || e.getAttribute("href") === K.bookUrl)) return "預約列"; if (e.tagName === "DETAILS") return "頁尾收合列";
    if (S.norm(e.textContent) === S.norm(K.ver)) return "版本行"; return (e.tagName.toLowerCase() + (e.className ? "." + e.className : "")) + "：" + (e.textContent || "").trim().slice(0, 20); };
  const kidsVis = kids.filter(vis);
  const roles = kidsVis.map(role);
  const yOrder = kidsVis.every((e, i) => i === 0 || e.getBoundingClientRect().top >= kidsVis[i - 1].getBoundingClientRect().bottom - 0.01);
  const cen = e => { const r = e.getBoundingClientRect(); return (r.left + r.right) / 2; };
  const center = {}; for (const e of kidsVis) { const k = role(e); if (["免責句", "署名", "預約列", "版本行"].includes(k)) center[k] = mainCx === null ? null : cen(e) - mainCx; }
  const bk = books.find(inFoot) || books[0], v = vas.find(inFoot) || vas[0]; // 頁尾之預約與看全部工具（他處另有者另由 G01、G04 計）
  const row = bk && bk.parentElement;
  let L03 = null;
  if (bk && v) { const a = bk.getBoundingClientRect(), b = v.getBoundingClientRect(); const overlapV = a.top < b.bottom && b.top < a.bottom; const gap = b.left - a.right;
    const side = overlapV && gap >= 0 && gap <= 24; const vgap = b.top - a.bottom; const wrapOk = b.top >= a.bottom && vgap <= 16 && Math.abs(cen(bk) - cen(v)) <= 4;
    L03 = { side, wrap: wrapOk, gap, vgap, centerDiff: cen(bk) - cen(v), inFoot: inFoot(bk) && inFoot(v), sameRow: row === v.parentElement }; }
  const sigEl = sigs[0];
  const G03 = !!bk && !!sigEl && inFoot(bk) && S.after(sigEl, bk) && bk.getBoundingClientRect().top >= sigEl.getBoundingClientRect().bottom - 0.01;
  const dstyle = discs[0] ? S.cs(discs[0], ["font-size", "line-height", "font-weight", "color", "text-align"]) : null;
  const dcon = discs[0] ? S.contrast(S.rgb(getComputedStyle(discs[0]).color), S.bgOf(discs[0])) : null;
  /* R01：頁尾容器結構（DOM；含 display:none 者） */
  const det = foot ? [...foot.querySelectorAll("details")] : [];
  const sum = det[0] && det[0].querySelector("summary");
  const bodyT = document.body.innerText; const detClosedHidden = det[0] ? (!det[0].open && [...det[0].querySelectorAll("li")].every(li => !bodyT.includes(li.textContent.trim()))) : null; // 收合時頁面（innerText）不出現其內文字樣
  return {
    sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: window.innerWidth,
    disc: discs.length, discInFoot: discs.filter(inFoot).length, discFirst: !!kids[0] && S.norm(kids[0].textContent) === S.norm(K.disc), discText: kids[0] ? kids[0].innerText : null,
    priv: privs.length, privMisplaced: privAll.filter(e => inFoot(e) || inRes(e) || !!e.closest("footer")).length, privAll: privAll.length,
    sig: sigs.length, book: books.length, bookInRes: A_.filter(a => a.getAttribute("href") === K.bookUrl && inRes(a)).length, bookInFoot: books.filter(inFoot).length,
    va: vas.length, G03, L03, roles, yOrder, center,
    E05: dstyle && { ...dstyle, contrast: dcon },
    R01: { foot: document.querySelectorAll("footer#siteFoot > div.wrap").length, first: role(kids[0]), last: role(kids[kids.length - 1]), kids: kids.map(role),
      detailsInFoot: det.length, summary: sum ? sum.textContent.trim() : null, detailsBeforeVer: !!det[0] && S.after(det[0], kids[kids.length - 1]), closed: det[0] ? !det[0].open : null, closedContentHidden: detClosedHidden,
      rowKids: row && row !== foot ? [...row.children].map(c => c.tagName.toLowerCase() + (c.getAttribute("aria-hidden") === "true" ? "[aria-hidden]" : "") + (c.getAttribute("href") ? "[" + c.getAttribute("href") + "]" : "")) : null,
      rowDescendants: row && row !== foot ? [...row.querySelectorAll("*")].map(c => c.tagName.toLowerCase() + (c.getAttribute("aria-hidden") === "true" ? "[aria-hidden]" : "") + (c.getAttribute("href") ? "[" + c.getAttribute("href") + "]" : "")) : null },
  };
};

const BASE_MEMO = {}; // 比對基準（a47269e）之結果不隨受測頁而變，同一 url 只量一次
const memo = async (k, f) => (k in BASE_MEMO ? BASE_MEMO[k] : (BASE_MEMO[k] = await f()));
function verdict(okv) { return okv === null ? "未執行" : okv ? "通過" : "未通過"; }

async function newPage(browser, url, size, reqs) {
  const ctx = await browser.newContext({ viewport: vp(size), deviceScaleFactor: size.z || 1 });
  await ctx.addInitScript(INIT);
  ctx.on("request", r => reqs && reqs.push(r.url())); // 固定段甲：context 層級
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "load" });
  await p.addScriptTag({ content: LIB });
  return p;
}
async function closeP(p) { await p.context().close(); }

/* 主程式：對一頁（url、src）執行外殼表適用列；base 為比對基準（a47269e 之頁面）之 url 與 src；
 * base32（c20b；本工具驗證表 v1_20 判定方式三十二）為 F10、X06 之基準頁（a47269e 只把 p#attribution 搬入頁尾收合列，make_base32.py 產生）之 url 與 label，未給者 F10、X06 亦以 base 為基準 */
async function runShell(o) {
  const { browser, url, src, base, kv, K, inputs, shotsDir, shotTag, firefox, anchor, r02Expect } = o;
  const base32 = o.base32 ? (o.base32.url ? o.base32 : null) : base; // F10、X06 之基準（判定方式三十二）；給了 base32 而未產生者 F10、X06 記未執行（不退回 base）
  const noBase32 = o.base32 && !o.base32.url ? o.base32.label : "未給比對基準";
  const rows = {}; const scope = {};
  const set = (id, okv, detail, extra = {}) => { rows[id] = { result: verdict(okv), detail, ...extra }; };
  const reqsAll = [];
  /* 一、全尺寸 × 全狀態之探針 */
  const grid = {};
  for (const [st, act] of STATES) {
    const byZ = {};
    for (const s of FULL) { (byZ[s.z] = byZ[s.z] || []).push(s); }
    for (const [z, sizes] of Object.entries(byZ)) {
      const p = await newPage(browser, url, sizes[0], reqsAll);
      try {
        await act(p);
        for (const s of sizes) { await p.setViewportSize(vp(s)); await p.waitForTimeout(15); grid[st + "｜" + sizeLab(s)] = { st, size: sizeLab(s), ...(await p.evaluate(PROBE, K)) }; }
      } finally { await closeP(p); }
    }
  }
  const G = Object.values(grid);
  const fails = (pred, pick) => G.filter(g => !pred(g)).map(g => ({ st: g.st, size: g.size, ...(pick ? pick(g) : {}) }));
  const gridRow = (id, pred, pick, filter) => { const gs = filter ? G.filter(filter) : G; const f = gs.filter(g => !pred(g)).map(g => ({ st: g.st, size: g.size, ...(pick ? pick(g) : {}) })); set(id, f.length === 0, { 量測組數: gs.length, 不符: f.slice(0, 40), 不符數: f.length }); };
  gridRow("A02", g => g.sw <= g.iw && g.bw <= g.iw, g => ({ sw: g.sw, bw: g.bw, iw: g.iw }));
  gridRow("E01", g => g.discFirst && g.discInFoot === 1, g => ({ first: g.discFirst, text: g.discText }), g => !RESULT_STATES.includes(g.st));
  gridRow("E03", g => g.disc === 1 && g.discInFoot === 1, g => ({ disc: g.disc, inFoot: g.discInFoot }));
  gridRow("F03", g => g.sig === 1, g => ({ sig: g.sig }));
  gridRow("G01", g => g.book === 1, g => ({ book: g.book }));
  gridRow("G03", g => g.G03, g => ({ G03: g.G03 }));
  gridRow("G04", g => g.bookInRes === 0 && g.book === 1 && g.bookInFoot === 1, g => ({ inRes: g.bookInRes, book: g.book }), g => RESULT_STATES.includes(g.st));
  gridRow("L01", g => g.va === 1, g => ({ va: g.va }));
  gridRow("L03", g => !!g.L03 && g.L03.inFoot && (g.L03.side || g.L03.wrap), g => ({ L03: g.L03 }));
  /* P05：全尺寸全狀態不在頁尾與結果區（無側欄）＋原始碼次數 */
  {
    const f = fails(g => g.privMisplaced === 0, g => ({ misplaced: g.privMisplaced }));
    const cnt = { [kv["隱私句"]]: src.split(kv["隱私句"]).length - 1 }; const olds = Object.fromEntries(["舊隱私半句_v1_0", "舊隱私半句_v1_1", "舊不保存句"].map(k => [kv[k], src.split(kv[k]).length - 1]));
    set("P05", f.length === 0 && cnt[kv["隱私句"]] === 1 && Object.values(olds).every(n => n === 0), { 不在頁尾與結果區之不符: f.slice(0, 20), 隱私句於原始碼次數: cnt, 舊字樣次數: olds, 量測組數: G.length });
  }
  /* E05：依狀態分判（單頁型：初始、輸入後、已產生結果之狀態均驗頁尾之可見免責句） */
  {
    const gv = await (async () => { const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 }); try { return await p.evaluate(() => window.__S.varColor("--graphite-700")); } finally { await closeP(p); } })();
    const f = fails(g => !!g.E05 && g.E05["font-size"] === "13px" && Math.abs(parseFloat(g.E05["line-height"]) - 13 * 1.75) <= 0.5 && g.E05["font-weight"] === "400" && g.E05.color === gv && g.E05["text-align"] === "center" && g.E05.contrast >= 4.5, g => ({ E05: g.E05 }));
    set("E05", f.length === 0, { graphite700: gv, 量測組數: G.length, 不符: f.slice(0, 20), 樣本: G[0] && G[0].E05 });
  }
  /* F02：無側欄版面之頁尾順序與置中（中心差 ≤ 1px） */
  {
    const want = ["免責句", "署名", "預約列", "頁尾收合列", "版本行"];
    const f = fails(g => JSON.stringify(g.roles) === JSON.stringify(want) && g.yOrder && Object.keys(g.center).length === 4 && Object.values(g.center).every(c => c !== null && Math.abs(c) <= 1), g => ({ roles: g.roles, yOrder: g.yOrder, center: g.center }));
    set("F02", f.length === 0, { 期望順序: want, 量測組數: G.length, 不符: f.slice(0, 20), 樣本: G[0] && { roles: G[0].roles, center: G[0].center } });
  }
  /* R01：頁尾容器結構 */
  {
    const f = fails(g => { const r = g.R01; const rowOk = JSON.stringify(r.rowKids) === JSON.stringify(["a[" + K.bookUrl + "]", "a[" + K.vaUrl + "]"]) && JSON.stringify(r.rowDescendants) === JSON.stringify(["a[" + K.bookUrl + "]", "span[aria-hidden]", "a[" + K.vaUrl + "]", "span[aria-hidden]"]);
      return r.foot === 1 && r.first === "免責句" && r.last === "版本行" && JSON.stringify(r.kids) === JSON.stringify(["免責句", "署名", "預約列", "頁尾收合列", "版本行"]) && r.detailsInFoot === 1 && r.summary === kv["頁尾收合列"] && r.detailsBeforeVer && r.closed && r.closedContentHidden && rowOk; }, g => ({ R01: g.R01 }));
    set("R01", f.length === 0, { 量測組數: G.length, 不符: f.slice(0, 10), 樣本: G[0] && G[0].R01, 對照表頁尾元素: "footer#siteFoot > div.wrap：免責句 p.sy-disclaimer、署名 a.sig、預約列 div.sy-book-row（施作新增）、頁尾收合列 details.basis、版本行 p.as-of" });
  }
  /* 二、單點列 */
  // P01（第一題錨點：label[for=biz]〔規格 v1_21 第十一節之 2；本批補填對照表〕；第一個作答元件 textarea#biz）
  {
    if (!anchor) set("P01", null, "第一題錨點未經重抽確認（外殼表表頭：P01 記未執行）");
    else {
      const d = []; let all = true;
      for (const s of [{ w: 1440, h: 900, z: 1 }, { w: 390, h: 844, z: 1 }]) {
        const p = await newPage(browser, url, s);
        try {
          const r = await p.evaluate(([priv]) => { const S = window.__S; const lab = document.querySelector('label[for="biz"]'), ta = document.querySelector("#biz"); const ps = S.leaf(priv).filter(S.vis); const pe = ps[0];
            if (!lab || !ta || !pe) return { lab: !!lab, ta: !!ta, priv: ps.length };
            const a = lab.getBoundingClientRect(), b = pe.getBoundingClientRect(), c = ta.getBoundingClientRect();
            const blk = lab.parentElement; return { priv: ps.length, labBottom: a.bottom, privTop: b.top, privBottom: b.bottom, taTop: c.top, sameBlock: blk.contains(pe) && blk.contains(ta), between: (() => { let n = lab.nextElementSibling, out = []; while (n && n !== ta) { out.push(n === pe ? "隱私句" : n.tagName); n = n.nextElementSibling; } return out; })() }; }, [kv["隱私句"]]);
          const g = r.priv === 1 && r.labBottom <= r.privTop && r.privBottom <= r.taTop && r.sameBlock; d.push({ size: sizeLab(s), ...r, ok: g }); all = all && g;
        } finally { await closeP(p); }
      }
      set("P01", all, { 錨點: anchor, 量測: d });
    }
  }
  // P02：隱私句逐字
  {
    const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 });
    try { const n = await p.evaluate(t => window.__S.leaf(t).filter(window.__S.vis).length, kv["隱私句"]); set("P02", n === 1, { 逐字等於隱私句之可見元素: n, 期望: kv["隱私句"] }); } finally { await closeP(p); }
  }
  // P06：重新整理（Chromium 與 Firefox 各一次）
  {
    const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 });
    let ch;
    try {
      // 「初次載入時之值」＝各輸入欄於 HTML 所定之初始值（textarea 之 defaultValue）；載入後即被改動者不算初始值（外殼表 Z11）
      const init = await p.evaluate(() => ({ v: document.querySelector("#biz").defaultValue, loaded: document.querySelector("#biz").value, res: document.querySelector("#results").innerHTML }));
      await q(p, "室內設計"); const mid = await p.evaluate(() => document.querySelectorAll("#results .cand").length);
      await p.fill("#biz", "室內設計 咖啡廳"); // 輸入後未再查（本工具只有一個輸入欄；外殼表「單頁型三欄」以全部輸入欄代之）
      await p.reload({ waitUntil: "load" }); await p.waitForTimeout(200);
      const af = await p.evaluate(() => ({ v: document.querySelector("#biz").value, res: document.querySelector("#results").innerHTML }));
      ch = { 初次載入: init, 結果筆數: mid, 重新整理後: af, ok: af.v === init.v && init.loaded === init.v && af.res === init.res && mid > 0 };
    } finally { await closeP(p); }
    const ff = firefox && firefox.error ? { 未執行: "Firefox 無法啟動：" + firefox.error } : { 未執行: "未跑" };
    set("P06", ch.ok ? null : false, { Chromium: ch, Firefox: ff, 說明: "本工具只有一個輸入欄（業務描述），輸入該欄並查詢後重新整理；Chromium 通過、Firefox 無法啟動者本列記未執行（外殼規格第九節五：Chromium 與 Firefox 各一次）" });
  }
  // P07：form 與文字類輸入欄之 autocomplete
  {
    const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 });
    try { const r = await p.evaluate(() => ({ forms: [...document.querySelectorAll("form")].map(f => f.getAttribute("autocomplete")), fields: [...document.querySelectorAll("textarea, input")].filter(e => e.tagName === "TEXTAREA" || ["text", "search", "number", null, ""].includes(e.getAttribute("type"))).map(e => ({ id: e.id, tag: e.tagName.toLowerCase(), autocomplete: e.getAttribute("autocomplete") })) }));
      const srcOk = /<form[^>]*autocomplete="off"/.test(src) && /<textarea[^>]*autocomplete="off"/.test(src);
      set("P07", r.forms.length > 0 && r.forms.every(x => x === "off") && r.fields.every(x => x.autocomplete === "off") && srcOk, { DOM: r, 原始碼含_off: srcOk, 所據: "autocomplete=off（DOM 與原始碼）" }); } finally { await closeP(p); }
  }
  // P08：全程對外請求（context 層級）、原始碼與執行期之儲存
  {
    const reqs = []; const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 }, reqs);
    try {
      for (const t of ["室內設計", "C802041", "E801060", "HZ07011", "咖啡廳 手搖飲", "qwerty火星挖礦"]) await q(p, t);
      await q(p, "製造"); const b = await p.$("#showAll"); if (b) await b.click();
      await p.evaluate(() => { const d = document.querySelector("details"); if (d) { d.open = true; d.open = false; } });
      await p.waitForTimeout(200);
      const wr = await p.evaluate(() => window.__w);
      const own = r => r === url; const other = reqs.filter(r => !own(r)); const otherAll = reqsAll.filter(r => !own(r));
      const scan = Object.fromEntries(["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "localStorage", "sessionStorage", "indexedDB", "document.cookie"].map(k => [k, src.split(k).length - 1]));
      const g = other.length === 0 && otherAll.length === 0 && Object.values(scan).every(n => n === 0) && Object.values(wr).every(n => n === 0);
      set("P08", g, { 記錄方式: "browser context 層級（context.on('request')）；含探針全程", 本列請求全部網址: [...new Set(reqs)], 頁面以外之請求: other, 探針全程頁面以外之請求: [...new Set(otherAll)], 原始碼掃描: scan, 執行期寫入: wr });
    } finally { await closeP(p); }
  }
  // P10：隱私句之 computed style
  {
    const d = []; let all = true;
    for (const s of [{ w: 1440, h: 900, z: 1 }, { w: 390, h: 844, z: 1 }]) {
      const p = await newPage(browser, url, s);
      try {
        const r = await p.evaluate(t => { const S = window.__S; const e = S.leaf(t).filter(S.vis)[0]; if (!e) return { found: false };
          const st = S.cs(e, ["font-size", "line-height", "font-weight", "color", "border-left-width", "border-left-style", "border-left-color", "border-top-width", "border-right-width", "border-bottom-width", "padding-left", "margin-bottom", "background-color", "background-image"]);
          return { found: true, ...st, g700: S.varColor("--graphite-700"), s300: S.varColor("--stone-300"), contrast: S.contrast(S.rgb(getComputedStyle(e).color), S.bgOf(e)) }; }, kv["隱私句"]);
        const g = r.found && r["font-size"] === "14px" && Math.abs(parseFloat(r["line-height"]) - 14 * 1.7) <= 0.5 && r["font-weight"] === "400" && r.color === r.g700 && r["border-left-width"] === "3px" && r["border-left-style"] === "solid" && r["border-left-color"] === r.s300
          && r["padding-left"] === "12px" && r["margin-bottom"] === "16px" && /rgba\(0, 0, 0, 0\)|transparent/.test(r["background-color"]) && r["background-image"] === "none" && ["border-top-width", "border-right-width", "border-bottom-width"].every(k => r[k] === "0px") && r.contrast >= 4.5;
        d.push({ size: sizeLab(s), ...r, ok: g }); all = all && g;
      } finally { await closeP(p); }
    }
    set("P10", all, d);
  }
  // E04：原始碼
  { const c = { [kv["舊免責短版"]]: src.split(kv["舊免責短版"]).length - 1, [kv["舊免責長版前段"]]: src.split(kv["舊免責長版前段"]).length - 1 }; set("E04", Object.values(c).every(n => n === 0), c); }
  // F07：署名
  {
    const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 }); const d = []; let all = true;
    try { for (const s of FULL) { await p.setViewportSize(vp(s)); const r = await p.evaluate(sig => { const a = [...document.querySelectorAll("a")].filter(x => x.textContent.trim() === sig && window.__S.vis(x)); return a.map(x => ({ text: x.textContent.trim(), href: x.getAttribute("href"), target: x.getAttribute("target"), rel: x.getAttribute("rel") })); }, kv["署名"]);
      const g = r.length === 1 && r[0].href === kv["署名網址"] && r[0].target === "_blank" && /noopener/.test(r[0].rel || "") && /noreferrer/.test(r[0].rel || ""); if (!g) d.push({ size: sizeLab(s), r }); all = all && g; } } finally { await closeP(p); }
    set("F07", all, { 量測尺寸數: FULL.length, 不符: d });
  }
  // F08：頁尾之 HTML 於各狀態相同
  {
    const d = {}; let base0 = null, all = true;
    for (const s of [{ w: 1440, h: 900, z: 1 }, { w: 390, h: 844, z: 1 }]) for (const [st, act] of STATES) {
      const p = await newPage(browser, url, s); try { await act(p); const h = await p.evaluate(() => { const f = document.querySelector("footer#siteFoot"); return f ? f.outerHTML : null; }); if (base0 === null) base0 = h; d[sizeLab(s) + "｜" + st] = h === base0; all = all && h !== null && h === base0; } finally { await closeP(p); }
    }
    set("F08", all, { 與第一組相同: d });
  }
  // F09：固定定位元件之射程掃描（原始碼與各狀態執行後 DOM）
  {
    const srcHits = [...src.matchAll(/(?:-webkit-)?position\s*:\s*(fixed|sticky)|style\.position\s*=|setProperty\(\s*["']position|cssText[^;\n]*position/g)].map(m => m[0]);
    const domHits = [];
    for (const [st, act] of STATES) { const p = await newPage(browser, url, { w: 390, h: 844, z: 1 }); try { await act(p); domHits.push(...(await p.evaluate(() => [...document.querySelectorAll("*")].filter(e => ["fixed", "sticky"].includes(getComputedStyle(e).position)).map(e => e.tagName + (e.id ? "#" + e.id : ""))))); } finally { await closeP(p); } }
    scope.F09 = { 適用: srcHits.length > 0 || domHits.length > 0, 原始碼命中: srcHits, 執行後DOM命中: domHits };
    if (!scope.F09.適用) rows.F09 = { result: "不適用", reason: "本工具無固定定位元件（原始碼之 position 宣告、style.position、setProperty、cssText 均 0；五狀態執行後 DOM 之 computed position 為 fixed 或 sticky 者 0），不在 F09 之對象（固定定位元件所在之工具）", detail: scope.F09 };
    else set("F09", null, { 說明: "有固定定位元件，須完整掃描（本程式未實作）", ...scope.F09 });
  }
  // F10：與比對基準（a47269e；c20b 起為判定方式三十二之基準頁 base32）之既有頁尾元素比對
  if (base32) {
    const MEAS = K2 => {
      const S = window.__S; const foot = document.querySelector("footer#siteFoot > div.wrap"); if (!foot) return null;
      window.scrollTo(0, document.documentElement.scrollHeight);
      const kids = [...foot.children];
      const role = e => { if (S.norm(e.textContent) === S.norm(K2.disc) || S.norm(e.textContent) === S.norm(K2.discOld)) return "免責句"; if (e.matches("a") && e.getAttribute("href") === K2.sigUrl) return "署名";
        if (e.getAttribute("href") === K2.bookUrl || (e.querySelector && e.querySelector('a[href="' + K2.bookUrl + '"]'))) return "預約"; if (e.tagName === "DETAILS") return "頁尾收合列"; if (S.norm(e.textContent) === S.norm(K2.ver)) return "版本行"; return "其他：" + e.tagName; };
      const P = ["display", "visibility", "font-size", "line-height", "font-weight", "color", "text-align", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-top-style", "border-top-color"];
      const out = kids.map(e => { const sm = e.tagName === "DETAILS" ? e.querySelector("summary") : null; const t = sm ? S.norm(e.textContent).replace(S.norm(sm.textContent), "") : S.norm(e.textContent);
        return { role: role(e), sel: e.tagName.toLowerCase() + (e.className ? "." + e.className : ""), style: S.cs(e, P), kids: e.children.length, nonSummaryKids: sm ? [...e.children].filter(c => c !== sm).map(c => c.children.length) : null, text: t, rect: S.rect(e), vis: S.vis(e) }; });
      return { kids: out, parent: foot.parentElement.tagName.toLowerCase() + (foot.parentElement.id ? "#" + foot.parentElement.id : ""), prevSibling: foot.previousElementSibling ? foot.previousElementSibling.tagName : null, fixedInFoot: [...foot.querySelectorAll("*")].filter(e => ["fixed", "sticky"].includes(getComputedStyle(e).position)).length };
    };
    const K2 = { ...K, discOld: o.discOld };
    const d = []; let all = true;
    for (const s of [{ w: 320, h: 844, z: 1 }, { w: 390, h: 844, z: 1 }, { w: 981, h: 640, z: 1 }, { w: 1440, h: 900, z: 1 }]) for (const [st, act] of [STATES[0], STATES[2]]) {
      const pn = await newPage(browser, url, s), po = await newPage(browser, base32.url, s);
      try {
        await act(pn); await act(po); const n = await pn.evaluate(MEAS, K2), b = await po.evaluate(MEAS, K2);
        const issues = [];
        if (!n || !b) { issues.push("頁尾容器不存在"); }
        else {
          const by = (x, r) => x.kids.find(k => k.role === r);
          const RULED = { 免責句: ["font-size", "line-height", "font-weight", "color", "text-align"], 署名: [], 版本行: [], 頁尾收合列: [] };
          for (const r of ["免責句", "署名", "頁尾收合列", "版本行"]) {
            const x = by(n, r), y = by(b, r); if (!x || !y) { issues.push(r + "：對應不到"); continue; }
            for (const k of Object.keys(y.style)) if (!RULED[r].includes(k) && x.style[k] !== y.style[k]) issues.push(`${r} ${k}：${y.style[k]}→${x.style[k]}`);
            if (x.kids !== y.kids) issues.push(`${r} 子元素數 ${y.kids}→${x.kids}`);
            if (!["免責句", "版本行"].includes(r) && x.text !== y.text) issues.push(`${r} textContent 不同`);
            if (r === "頁尾收合列" && JSON.stringify(x.nonSummaryKids) !== JSON.stringify(y.nonSummaryKids)) issues.push("頁尾收合列 非 summary 後代之子元素數不同");
            if (!["免責句", "版本行", "頁尾收合列"].includes(r) && Math.abs(x.rect.h - y.rect.h) > 0.01) issues.push(`${r} 外框高度 ${y.rect.h}→${x.rect.h}`);
          }
          // 期望二：相鄰間距
          const gaps = x => { const v = x.kids.filter(k => k.vis); const o2 = []; for (let i = 1; i < v.length; i++) o2.push({ a: v[i - 1].role, b: v[i].role, gap: v[i].rect.t - v[i - 1].rect.b }); return o2; };
          const gn = gaps(n), gb = gaps(b); const oldSet = gb.map(x => x.gap); const lo = Math.min(...oldSet), hi = Math.max(...oldSet);
          for (const x of gn) {
            if (x.a === "預約" || x.b === "預約") { if (x.gap < lo - 1 || x.gap > hi + 1) issues.push(`預約列與${x.a === "預約" ? "後鄰 " + x.b : "前鄰 " + x.a}之間距 ${x.gap}（基準 [${lo}, ${hi}]）`); }
            else { const y = gb.find(z => z.a === x.a && z.b === x.b); if (!y) issues.push(`${x.a}→${x.b} 於基準無對應相鄰對`); else if (Math.abs(x.gap - y.gap) > 1) issues.push(`${x.a}→${x.b} 間距 ${y.gap}→${x.gap}`); }
          }
          if (n.fixedInFoot) issues.push("頁尾容器內有固定定位元件");
          if (st === "初始") { if (n.parent !== b.parent) issues.push("頁尾容器之父元素不同"); }
          d.push({ size: sizeLab(s), st, 新版相鄰間距: gn, 基準相鄰間距: gb, 基準上下限: [lo, hi], 父元素: n.parent, 前一同層元素: n.prevSibling, 不符: issues });
          if (issues.length) all = false;
          continue;
        }
        d.push({ size: sizeLab(s), st, 不符: issues }); all = false;
      } finally { await closeP(pn); await closeP(po); }
    }
    set("F10", all, { 比對基準: base32.label, 量測: d, 期望六乙: "頁尾容器 div.wrap 為 footer#siteFoot 之唯一子元素，無前一個同層可見元素，本項無可比之距離（記錄，不判）", 預約列: "div.sy-book-row（施作新增；前鄰署名、後鄰頁尾收合列）" });
  } else set("F10", null, noBase32);
  // G05、L02：連結屬性（全尺寸；不點擊）
  for (const [id, href, text, aria] of [["G05", kv["預約網址"], kv["預約文字"], kv["預約讀屏名"]], ["L02", kv["看全部網址"], kv["看全部文字"], kv["看全部讀屏名"]]]) {
    const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 }); const bad = []; let sample = null;
    try { for (const s of FULL) { await p.setViewportSize(vp(s)); const r = await p.evaluate(([href, text]) => { const S = window.__S;
        const a = [...document.querySelectorAll("a")].filter(x => S.vis(x) && (x.getAttribute("href") || "").split(/[?#]/)[0] === href.split(/[?#]/)[0] || S.vis(x) && S.visText(x) === text);
        return a.map(x => { const arrow = [...x.querySelectorAll('[aria-hidden="true"]')].map(y => y.textContent); const nx = x.nextElementSibling; return { href: x.getAttribute("href"), target: x.getAttribute("target"), rel: x.getAttribute("rel"), visText: S.visText(x), aria: x.getAttribute("aria-label"), arrowsAriaHidden: arrow, arrowAfterSibling: nx && nx.getAttribute("aria-hidden") === "true" ? nx.textContent : null, pseudoAfter: getComputedStyle(x, "::after").content, pseudoBefore: getComputedStyle(x, "::before").content, innerText: x.innerText }; }); }, [href, text]);
      sample = r; const g = r.length === 1 && r[0].href === href && r[0].target === "_blank" && /noopener/.test(r[0].rel || "") && /noreferrer/.test(r[0].rel || "") && r[0].visText === text && r[0].aria === aria && (r[0].arrowsAriaHidden.includes("↗") || r[0].arrowAfterSibling === "↗") && ["none", "normal"].includes(r[0].pseudoAfter);
      if (!g) bad.push({ size: sizeLab(s), r }); } } finally { await closeP(p); }
    set(id, bad.length === 0, { 量測尺寸數: FULL.length, 樣本: sample, 不符: bad.slice(0, 5), 可見文字之判法: "innerText 扣除 aria-hidden 子元素（↗）之文字", 不點擊: "只驗屬性（固定段甲）" });
  }
  // G06：原始碼
  { const ks = ["舊預約網址", "舊預約讀屏名", "舊預約區塊句_稅務罰則", "舊預約引導句"]; const hit = ks.filter(k => src.includes(kv[k])).concat(/lin\.ee/.test(src) ? ["lin.ee"] : []); set("G06", hit.length === 0, { 命中: hit }); }
  // G07：預約連結之 computed style（無側欄版面；三尺寸）
  {
    const d = []; let all = true;
    for (const s of [{ w: 1440, h: 900, z: 1 }, { w: 390, h: 844, z: 1 }, { w: 320, h: 844, z: 1 }]) {
      const p = await newPage(browser, url, s);
      try { const r = await p.evaluate(href => { const S = window.__S; const a = [...document.querySelectorAll("a")].find(x => x.getAttribute("href") === href && S.vis(x)); if (!a) return { found: false };
          const st = S.cs(a, ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-top-style", "border-right-style", "border-bottom-style", "border-left-style", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "color", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius", "padding-top", "padding-right", "padding-bottom", "padding-left", "font-size", "font-weight", "min-height", "line-height", "background-color", "background-image"]);
          return { found: true, ...st, height: a.getBoundingClientRect().height }; }, kv["預約網址"]);
        const sides = ["top", "right", "bottom", "left"];
        const g = r.found && sides.every(x => r[`border-${x}-width`] === "2px" && r[`border-${x}-style`] === "solid" && r[`border-${x}-color`] === r.color) && ["top-left", "top-right", "bottom-left", "bottom-right"].every(x => r[`border-${x}-radius`] === "6px")
          && r["padding-top"] === "6px" && r["padding-bottom"] === "6px" && r["padding-left"] === "18px" && r["padding-right"] === "18px" && r["font-size"] === "15px" && r["font-weight"] === "700" && r["min-height"] === "44px"
          && Math.abs(parseFloat(r["line-height"]) - 15 * 1.3) <= 0.5 && r.height >= 44 && /rgba\(0, 0, 0, 0\)/.test(r["background-color"]) && r["background-image"] === "none";
        d.push({ size: sizeLab(s), ...r, ok: g }); all = all && g; } finally { await closeP(p); }
    }
    set("G07", all, { 版面: "無側欄版面（本工具無側欄）", 量測: d });
  }
  // L04：看全部工具之外觀
  {
    const d = []; let all = true;
    for (const s of [{ w: 1440, h: 900, z: 1 }, { w: 390, h: 844, z: 1 }]) {
      const p = await newPage(browser, url, s);
      try { const r = await p.evaluate(([va, bk, sigUrl]) => { const S = window.__S; const a = [...document.querySelectorAll("a")].find(x => x.getAttribute("href") === va && S.vis(x)); if (!a) return { found: false };
          const b = [...document.querySelectorAll("a")].find(x => x.getAttribute("href") === bk && S.vis(x)); const sg = [...document.querySelectorAll("a")].find(x => x.getAttribute("href") === sigUrl && S.vis(x));
          const st = S.cs(a, ["background-color", "background-image", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "text-decoration-line", "font-weight", "color", "font-size"]);
          const arrow = [...a.querySelectorAll('[aria-hidden="true"]')].map(x => x.textContent).concat(a.nextElementSibling && a.nextElementSibling.getAttribute("aria-hidden") === "true" ? [a.nextElementSibling.textContent] : []);
          return { found: true, ...st, height: a.getBoundingClientRect().height, sigColor: sg ? getComputedStyle(sg).color : null, bookFont: b ? getComputedStyle(b).fontSize : null, contrast: S.contrast(S.rgb(st.color), S.bgOf(a)), arrow, aria: a.getAttribute("aria-label") }; }, [kv["看全部網址"], kv["預約網址"], kv["署名網址"]]);
        const g = r.found && /rgba\(0, 0, 0, 0\)/.test(r["background-color"]) && r["background-image"] === "none" && ["top", "right", "bottom", "left"].every(x => r[`border-${x}-width`] === "0px") && /underline/.test(r["text-decoration-line"]) && r["font-weight"] === "400"
          && r.color !== r.sigColor && r.height >= 44 && r.contrast >= 4.5 && parseFloat(r["font-size"]) <= parseFloat(r.bookFont) && r.arrow.includes("↗") && !!r.aria && !r.aria.includes("↗");
        d.push({ size: sizeLab(s), ...r, ok: g }); all = all && g; } finally { await closeP(p); }
    }
    set("L04", all, d);
  }
  // L05：Tab 聚焦（固定段乙：不按 Enter、不點擊）；聚焦後視窗截圖為人工證據
  //   c20b：另以 element.focus() 於新開之頁面逐一聚焦（派工：兩種方式實測），記於「element.focus()補測」；L05 之判定照外殼表字面（Tab），兩方式均記四邊座標與視窗大小
  {
    const L05M = () => { const S = window.__S; const a = document.activeElement; const st = getComputedStyle(a); const fv = a.matches(":focus-visible"); const r0 = a.getBoundingClientRect(); const ow = parseFloat(st.outlineWidth) || 0, oo = parseFloat(st.outlineOffset) || 0;
            const ob = { l: r0.left - oo - ow, t: r0.top - oo - ow, r: r0.right + oo + ow, b: r0.bottom + oo + ow };
            const inView = ob.l >= 0 && ob.t >= 0 && ob.r <= window.innerWidth && ob.b <= window.innerHeight;
            const clip = []; for (let x = a.parentElement; x && x !== document.documentElement; x = x.parentElement) { const s2 = getComputedStyle(x); if (s2.overflowX !== "visible" || s2.overflowY !== "visible") { const rr = x.getBoundingClientRect(); const pb = { l: rr.left + parseFloat(s2.borderLeftWidth), t: rr.top + parseFloat(s2.borderTopWidth), r: rr.right - parseFloat(s2.borderRightWidth), b: rr.bottom - parseFloat(s2.borderBottomWidth) }; if (ob.l < pb.l || ob.t < pb.t || ob.r > pb.r || ob.b > pb.b) clip.push(x.tagName + "." + x.className); } }
            const oc = S.rgb(st.outlineColor), bg = S.bgOf(a.parentElement);
            const mids = [[(ob.l + ob.r) / 2, ob.t + ow / 2], [(ob.l + ob.r) / 2, ob.b - ow / 2], [ob.l + ow / 2, (ob.t + ob.b) / 2], [ob.r - ow / 2, (ob.t + ob.b) / 2]];
            const cover = mids.map(([x, y]) => { const e = document.elementFromPoint(x, y); return !e ? "視窗外" : (e === a || e.contains(a) || a.contains(e)) ? "可見" : (e.tagName + "." + e.className); });
            return { focusVisible: fv, outlineStyle: st.outlineStyle, outlineWidth: st.outlineWidth, outlineOffset: st.outlineOffset, outlineColor: st.outlineColor, contrast: oc ? S.contrast(oc, bg) : null, outlineBox: ob, inView, clippedBy: clip, coverSample: cover }; };
    const L05OK = r => r.focusVisible && r.outlineStyle !== "none" && parseFloat(r.outlineWidth) >= 3 && r.contrast >= 3 && r.inView && r.clippedBy.length === 0 && r.coverSample.every(x => x === "可見");
    const VPI = () => ({ w: window.innerWidth, h: window.innerHeight, scrollY: window.scrollY });
    const d = [], d2 = []; let all = true, all2 = true; const shots = [];
    for (const s of [{ w: 320, h: 844, z: 1 }, { w: 390, h: 844, z: 1 }, { w: 981, h: 640, z: 1 }, { w: 1440, h: 900, z: 1 }]) {
      const p = await newPage(browser, url, s);
      try {
        for (const [lab, href] of [["預約", kv["預約網址"]], ["看全部工具", kv["看全部網址"]]]) {
          const exists = await p.evaluate(h => !![...document.querySelectorAll("a")].find(x => x.getAttribute("href") === h && window.__S.vis(x)), href);
          if (!exists) { d.push({ size: sizeLab(s), lab, found: false }); all = false; continue; }
          let n = 0; while (n < 120 && !(await p.evaluate(h => document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("href") === h, href))) { await p.keyboard.press("Tab"); n++; }
          const r = await p.evaluate(L05M);
          const f = `L05_${shotTag}_${s.w}x${s.h}_${lab}.png`; if (shotsDir) { await p.screenshot({ path: path.join(shotsDir, f) }); shots.push(f); }
          const g = L05OK(r);
          d.push({ size: sizeLab(s), lab, 方式: "Tab", tabs: n, ...r, viewport: await p.evaluate(VPI), screenshot: shotsDir ? f : null, ok: g }); all = all && g;
        }
      } finally { await closeP(p); }
      for (const [lab, href] of [["預約", kv["預約網址"]], ["看全部工具", kv["看全部網址"]]]) {
        const p2 = await newPage(browser, url, s);
        try {
          const okf = await p2.evaluate(h => { const a = [...document.querySelectorAll("a")].find(x => x.getAttribute("href") === h && window.__S.vis(x)); if (!a) return false; a.focus(); return document.activeElement === a; }, href);
          if (!okf) { d2.push({ size: sizeLab(s), lab, found: false }); all2 = false; continue; }
          const r = await p2.evaluate(L05M); const g = L05OK(r);
          d2.push({ size: sizeLab(s), lab, 方式: "element.focus()（新開頁面，未先 Tab）", ...r, viewport: await p2.evaluate(VPI), ok: g }); all2 = all2 && g;
        } finally { await closeP(p2); }
      }
    }
    set("L05", all, { 量測: d, "element.focus()補測": { 全部完整可見: all2, 量測: d2 }, 截圖: shots, 人工證據: shotsDir ? "聚焦後之視窗截圖已產出（verify/results/外殼v1_2_L05截圖/），焦點框四邊完整、未被覆蓋之人工檢視待使用者確認；程式另以 elementFromPoint 於焦點框四邊中點取樣" : "未產出截圖" });
  }
  // R02：展開後內文與基準相同。c20（本工具驗證表 v1_19 判定方式三十一；規格 v1_22 第三十七節二甲）：基準改為規格 v1_22 之收合列內文（attribution 加 basis_item_1～4），
  //   由呼叫端以 r02Expect（{ text, label }）給定，比較時同樣去除空白；未給 r02Expect 者照外殼表以 base 之頁面為基準
  if (r02Expect) {
    const p = await newPage(browser, url, { w: 1440, h: 900, z: 1 });
    let a = null; try { a = await p.evaluate(() => { const f = document.querySelector("footer#siteFoot details"); if (!f) return null; f.open = true; const sm = f.querySelector("summary"); return [...f.childNodes].filter(n => n !== sm).map(n => n.textContent).join("").replace(/\s+/g, ""); }); } finally { await closeP(p); }
    const b = r02Expect.text.replace(/\s+/g, ""); set("R02", a !== null && a === b, { 新版: a, 基準: b, 基準來源: r02Expect.label });
  } else if (base) {
    const get = async u => { const p = await newPage(browser, u, { w: 1440, h: 900, z: 1 }); try { return await p.evaluate(() => { const f = document.querySelector("footer#siteFoot details"); if (!f) return null; f.open = true; const sm = f.querySelector("summary"); return [...f.childNodes].filter(n => n !== sm).map(n => n.textContent).join("").replace(/\s+/g, ""); }); } finally { await closeP(p); } };
    const a = await get(url), b = await memo("R02|" + base.url, () => get(base.url)); set("R02", a !== null && a === b, { 新版: a, 基準: b, 基準來源: base.label });
  } else set("R02", null, "未給比對基準");
  // R03：原始碼之 summary
  { const sm = [...src.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()); const bad = sm.filter(x => x === kv["舊頁尾收合列_一"] || x === kv["舊頁尾收合列_二"]);
    const dup = sm.filter(x => x === kv["頁尾收合列"]).length; set("R03", bad.length === 0 && dup <= 1, { summaries: sm, 舊名命中: bad, 頁尾收合列名稱出現次數: dup }); }
  // H09：版本行（狀態①）與 320 寬不斷行
  {
    const exp = kv["版本行_狀態①"].replace("〔版號〕", o.version);
    const p = await newPage(browser, url, { w: 320, h: 844, z: 1 });
    try { const r = await p.evaluate(([ver, vno]) => { const e = document.querySelector("footer#siteFoot > div.wrap > :last-child"); if (!e) return { found: false }; const t = e.innerText.trim(); const tn = [...e.childNodes].find(n => n.nodeType === 3 && n.textContent.includes("v" + vno));
        let lines = null; if (tn) { const i = tn.textContent.indexOf("v" + vno); const rg = document.createRange(); rg.setStart(tn, i); rg.setEnd(tn, i + vno.length + 1); lines = new Set([...rg.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top))).size; }
        return { found: true, text: t, lines }; }, [exp, o.version]);
      set("H09", r.found && r.text === exp && r.lines === 1, { 期望: exp, ...r }); } finally { await closeP(p); }
  }
  // M01、M02：head
  {
    const robots = (src.match(/<meta name="robots" content="([^"]*)"/) || [])[1], tv = (src.match(/<meta name="tool-version" content="([^"]*)"/) || [])[1];
    set("M01", robots === kv["robots_免費"], { robots, 分類: "免費（DEPLOYMENT.md 之分類欄：business-items 免費）" });
    set("M02", tv === "business-items v" + o.version && !/-test/.test(tv || ""), { toolVersion: tv, 版本行版號: o.version });
  }
  // X03：代表輸入組之結果文字與基準逐字相同
  if (base) {
    const run = async u => { const p = await newPage(browser, u, { w: 1366, h: 768, z: 1 }); const out = {}; try { for (const t of inputs) { await q(p, t); const b = await p.$("#showAll"); if (b) await b.click(); out[t] = await p.evaluate(() => document.querySelector("#results").innerText); } } finally { await closeP(p); } return out; };
    const a = await run(url), b = await memo("X03|" + base.url + "|" + inputs.length, () => run(base.url)); const diff = inputs.filter(t => a[t] !== b[t]);
    set("X03", diff.length === 0, { 代表輸入: `驗證表 Q128 之〔抽：all_inputs〕${inputs.length} 句`, 不同之句: diff, 基準: base.label });
  } else set("X03", null, "未給比對基準");
  // X06：內容區塊之正規化文字與連結集合（c20b 起基準為 base32，判定方式三十二）
  if (base32) {
    const shellSel = ["p.sy-disclaimer", "p.disclaimer", "div.sy-book-row", "a.sy-book-btn", "footer#siteFoot summary", "p.sy-privacy"];
    const blocks = async u => { const p = await newPage(browser, u, { w: 1366, h: 768, z: 1 }); const out = {}; const links = new Set();
      try {
        const grab = async lab => { const r = await p.evaluate(sels => { const c = document.body.cloneNode(true); sels.forEach(s => c.querySelectorAll(s).forEach(e => e.remove())); c.querySelectorAll("script,style").forEach(e => e.remove());
          const T = s => { const e = c.querySelector(s); return e ? e.textContent.replace(/\s+/g, "") : null; };
          return { header: T("header"), form: T("form"), results: T("#results"), attribution: T("#attribution"), footer: T("footer"), links: [...document.querySelectorAll("a[href]")].map(a => a.href).filter(h => /^https?:/.test(h) && !h.startsWith(location.origin)) }; }, shellSel);
          r.links.forEach(x => links.add(x)); delete r.links; out[lab] = r; };
        await grab("初始"); for (const t of ["室內設計", "C802041", "製造", "qwerty火星挖礦", "E801060"]) { await q(p, t); const b = await p.$("#showAll"); if (b) await b.click(); await grab(t); }
      } finally { await closeP(p); }
      return { out, links: [...links].sort() }; };
    const a = await blocks(url), b = await memo("X06|" + base32.url, () => blocks(base32.url));
    const diff = []; for (const st of Object.keys(b.out)) for (const k of Object.keys(b.out[st])) if (a.out[st][k] !== b.out[st][k]) diff.push(st + "／" + k);
    const added = a.links.filter(x => !b.links.includes(x)), removed = b.links.filter(x => !a.links.includes(x));
    const g = diff.length === 0 && added.every(x => x === kv["看全部網址"]) && removed.every(x => x === kv["舊預約網址"]);
    set("X06", g, { 外殼元素_比對前移除: shellSel, 不同之區塊: diff, 新增對外連結: added, 刪除對外連結: removed, 基準: base32.label });
  } else set("X06", null, noBase32);
  return { rows, scope, gridCount: G.length };
}

/* 外殼表各列之射程（營業項目查詢：無側欄、單頁型、狀態①、免費、有結果狀態〔同頁〕） */
const APPLICABLE = ["A02", "P01", "P02", "P05", "P06", "P07", "P08", "P10", "E01", "E03", "E04", "E05", "F02", "F03", "F07", "F08", "F09", "F10", "G01", "G03", "G04", "G05", "G06", "G07", "L01", "L02", "L03", "L04", "L05", "R01", "R02", "R03", "H09", "M01", "M02", "X03", "X06"];
const NOT_APPLICABLE = {
  A01: "對象為有側欄六支", A03: "對象為有側欄六支", SB01: "對象為有側欄六支", SB02: "同上", SB03: "同上", SB04: "同上", SB05: "對象為 2-1、公司決議", SB06: "對象為有側欄六支", SB07: "同上", SB08: "同上",
  T01: "對象為有側欄六支", T02: "對象為依序作答型五支", T03: "同上", T04: "對象為 1-3", T05: "對象為有側欄六支", T06: "對象為依序作答型五支",
  C01: "對象為依序作答型五支", C02: "同上", C03: "同上", C04: "對象為 1-3", C05: "對象為有側欄六支", C06: "對象為依序作答型五支", C07: "對象為 2-1",
  D01: "第五節捲動提示：對象為有側欄六支", D02: "同上", D03: "同上", D04: "同上", D05: "同上", D06: "同上",
  P03: "對象為 4-3", P04: "對象為依序作答型五支與 1-3", P09: "對象為 4-3", P11: "對象為 4-1",
  E02: "對象為依序作答型五支", F01: "對象為有側欄六支", F04: "本版廢止", F05: "本版廢止", F06: "對象為有側欄六支", G02: "對象為有側欄六支",
  R04: "對象為狀態②③六支", H01: "對象為 1-1", H02: "對象為 1-3", H03: "對象為 2-1", H04: "對象為 4-4", H05: "對象為公司決議", H06: "對象為 2-2、3-2、4-1", H07: "對象為 4-3", H08: "對象為稅務罰則",
  J01: "對象為 2-1", J02: "同上", J03: "同上", X01: "對象為依序作答型五支", X02: "對象為 1-3", X04: "對象為 3-2", X05: "對象為 4-3",
};

/* 外殼表第十五節之錯誤案例：列明營業項目查詢或未列工具（施於任一適用工具）而其須報未通過之列於本工具適用者；每案以施作完成之頁面為底只改一處。
 * [案例, 植錯說明, 須報未通過之列, 補丁(src, kv, A) 或 null（前提不存在）, 前提不存在之理由] */
function sub1(s, a, b) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`補丁之原字串出現 ${n} 次：${a.slice(0, 60)}`); return s.replace(a, () => b); }
const BOOK_A = (A) => `<a class="sy-book-btn" href="${A.booking_url}" target="_blank" rel="noopener noreferrer" aria-label="${A.booking_aria}">${A.booking}<span aria-hidden="true">↗</span></a>`;
const VA_A = (A) => `<a class="sy-view-all" href="${A.view_all_url}" target="_blank" rel="noopener noreferrer" aria-label="${A.view_all_aria}">${A.view_all}<span aria-hidden="true">↗</span></a>`;
const PRIV_P = (A) => `<p class="sy-privacy" id="shellPrivacy">${A.shell_privacy}</p>\n`;
const VER_P = (A) => `<p class="as-of">${A.version_line}</p>`;
const ZCASES = [
  ["Z01", "預約 href 加「?src=tool」", ["G05"], (s, kv, A) => sub1(s, BOOK_A(A), BOOK_A(A).replace(`href="${A.booking_url}"`, `href="${A.booking_url}?src=tool"`))],
  ["Z02", "預約 aria-label 改回舊預約讀屏名", ["G05", "G06"], (s, kv, A) => sub1(s, BOOK_A(A), BOOK_A(A).replace(`aria-label="${A.booking_aria}"`, `aria-label="${kv["舊預約讀屏名"]}"`))],
  ["Z03", "結果區插回預約區塊（含舊預約引導句），其連結 href 與 G01 所指相同、可見、可聚焦", ["G01", "G04", "G06"], (s, kv, A) => sub1(s, "window.addEventListener(\"pageshow\",resetAll);", "form.addEventListener(\"submit\",function(){setTimeout(function(){var d=document.createElement(\"div\");d.className=\"sy-book\";d.innerHTML=" + JSON.stringify(`<p class="sy-book-lead">${kv["舊預約引導句"]}</p><a href="${A.booking_url}" target="_blank" rel="noopener noreferrer">${A.booking}</a>`) + ";document.getElementById(\"results\").appendChild(d);},0);});\nwindow.addEventListener(\"pageshow\",resetAll);")],
  ["Z04", "刪除頁尾預約（無側欄版面）", ["G01", "G03"], (s, kv, A) => sub1(s, BOOK_A(A), "")],
  ["Z06", "隱私句移到頁尾", ["P01", "P05"], (s, kv, A) => sub1(sub1(s, PRIV_P(A), ""), VER_P(A), PRIV_P(A) + VER_P(A))],
  ["Z07", "隱私句改為舊隱私半句_v1_1", ["P02", "P05"], (s, kv, A) => sub1(s, PRIV_P(A), PRIV_P(A).replace(A.shell_privacy, kv["舊隱私半句_v1_1"]))],
  ["Z09", "結果狀態時頁尾免責句不隱藏", ["E03"], null, "前提不存在：本工具為單頁型，頁尾免責句恆顯示（外殼第五節免責句三），無「結果狀態時隱藏」之行為可移除"],
  ["Z10", "頁尾免責句改回舊長版", ["E01", "E04"], (s, kv, A) => sub1(s, `<p class="sy-disclaimer">${A.shell_disclaimer}</p>`, `<p class="sy-disclaimer">${A.disclaimer_old}</p>`)],
  ["Z11", "移除 autocomplete=\"off\" 與 pageshow 重設，並於載入時把輸入欄設為非初始值", ["P06", "P07"], (s, kv, A) => sub1(sub1(sub1(s, '<form id="qform" autocomplete="off" novalidate>', '<form id="qform" novalidate>'), 'maxlength="300" autocomplete="off" enterkeyhint', 'maxlength="300" enterkeyhint'), "window.addEventListener(\"pageshow\",resetAll);\nresetAll();", "biz.value=\"模擬瀏覽器還原之舊值\";")],
  ["Z12", "加入 localStorage.setItem 一處", ["P08"], (s, kv, A) => sub1(s, "window.addEventListener(\"pageshow\",resetAll);", "localStorage.setItem(\"z12\",\"1\");\nwindow.addEventListener(\"pageshow\",resetAll);")],
  ["Z16", "頁尾收合列 summary 改回「依據說明」", ["R01", "R03"], (s, kv, A) => sub1(s, `<summary>${A.shell_basis_title}</summary>`, `<summary>${kv["舊頁尾收合列_一"]}</summary>`)],
  ["Z19", "狀態①版本行「；」改「，」", ["H09"], (s, kv, A) => sub1(s, VER_P(A), VER_P(A).replace("；", "，"))],
  ["Z20", "tool-version 加「-test」", ["M02"], (s, kv, A) => sub1(s, `content="${A.tool_version}"`, `content="${A.tool_version}-test"`)],
  ["Z21", "頁尾署名與預約對調", ["F02", "G03"], (s, kv, A) => { const sig = s.match(/<a class="sig"[^>]*>[^<]*<\/a>\n/)[0]; const row = s.match(/<div class="sy-book-row">.*?<\/div>\n/)[0]; return sub1(s, sig + row, row + sig); }],
  ["Z23", "「看全部工具」刪 target 改為同分頁開啟", ["L02"], (s, kv, A) => sub1(s, VA_A(A), VA_A(A).replace(' target="_blank"', ""))],
  ["Z24", "「看全部工具」加底色與外框做成按鈕", ["L04"], (s, kv, A) => sub1(s, VA_A(A), VA_A(A).replace('<a class="sy-view-all"', '<a class="sy-view-all" style="background:#E8E5DF;border:1px solid #565B5E;border-radius:6px;padding:0 12px"'))],
  ["Z25", "「看全部工具」移至手機頂列", ["L03"], null, "前提不存在：本工具無手機頂列（無側欄工具，頁首為 header.page-head，非頂列），無可移入之處"],
  ["Z26", "「看全部工具」之 href 加「?from=tool」", ["L02"], (s, kv, A) => sub1(s, VA_A(A), VA_A(A).replace(`href="${A.view_all_url}"`, `href="${A.view_all_url}?from=tool"`))],
  ["Z28", "頁尾加一個寬 1500px 之元素（祖先至 body 均為 overflow visible）", ["A02"], (s, kv, A) => sub1(s, VER_P(A), '<div style="width:1500px;height:1px"></div>\n' + VER_P(A))],
  ["Z50", "隱私句加底色與外框", ["P10"], (s, kv, A) => sub1(s, PRIV_P(A), PRIV_P(A).replace('<p class="sy-privacy"', '<p class="sy-privacy" style="background:#F1EEE8;border:1px solid #CCC6BD"'))],
  ["Z53", "免責句字級改 16px", ["E05"], (s, kv, A) => sub1(s, `<p class="sy-disclaimer">`, `<p class="sy-disclaimer" style="font-size:16px">`)],
  ["Z56", "署名 href 改 https://sytaxes.com/tools/", ["F07"], (s, kv, A) => sub1(s, `<a class="sig" href="${A.signature_url}"`, `<a class="sig" href="https://sytaxes.com/tools/"`)],
  ["Z59", "預約連結 border-radius 改 0", ["G07"], (s, kv, A) => sub1(s, BOOK_A(A), BOOK_A(A).replace('<a class="sy-book-btn"', '<a class="sy-book-btn" style="border-radius:0"'))],
  ["Z60", "「看全部工具」字重改 700、色改同署名", ["L04"], (s, kv, A) => sub1(s, VA_A(A), VA_A(A).replace('<a class="sy-view-all"', '<a class="sy-view-all" style="font-weight:700;color:var(--graphite-900)"'))],
  ["Z61", "「看全部工具」與預約之 :focus-visible 改 outline:none", ["L05"], (s, kv, A) => sub1(s, "</style>", ".sy-book-btn:focus-visible,.sy-view-all:focus-visible{outline:none!important}\n</style>")],
  ["Z62", "頁尾收合列內文刪一句", ["R02"], (s, kv, A) => sub1(s, `<li>${A.basis_item_4}</li>\n`, "")],
  ["Z66", "免費工具之 meta robots 改「noindex,nofollow」", ["M01"], (s, kv, A) => sub1(s, '<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex,nofollow">')],
  ["Z72", "頁尾加一個連 https://example.com/ 之連結", ["X06"], (s, kv, A) => sub1(s, VER_P(A), '<a href="https://example.com/">example</a>\n' + VER_P(A))],
  ["Z73", "狀態①版本行之全形直線「｜」改為半形直線", ["H09"], (s, kv, A) => sub1(s, VER_P(A), VER_P(A).replace("｜", "|"))],
  ["Z76", "於 1440×900，預約與看全部工具一列之 justify-content 改 flex-start（須先確認該列內容寬小於容器內容區寬，使中心差大於 1px）", ["F02"], (s, kv, A) => sub1(s, '<div class="sy-book-row">', '<div class="sy-book-row" style="justify-content:flex-start">'), null, { premise: "row" }],
  ["Z90", "隱私句 font-weight 改 700", ["P10"], (s, kv, A) => sub1(s, PRIV_P(A), PRIV_P(A).replace('<p class="sy-privacy"', '<p class="sy-privacy" style="font-weight:700"'))],
  ["Z91", "預約連結之 line-height 改 1.6", ["G07"], (s, kv, A) => sub1(s, BOOK_A(A), BOOK_A(A).replace('<a class="sy-book-btn"', '<a class="sy-book-btn" style="line-height:1.6"'))],
  ["Z92", "預約連結之 min-height 改 0，另設 height:44px（padding 不變）", ["G07"], (s, kv, A) => sub1(s, BOOK_A(A), BOOK_A(A).replace('<a class="sy-book-btn"', '<a class="sy-book-btn" style="min-height:0;height:44px"'))],
  ["Z98", "無側欄版面之預約列設 margin-top，使前元素至預約列之距離等於 10/23 版頁尾相鄰既有元素間距之最大值加 12px", ["F10"], (s, kv, A) => sub1(s, '<div class="sy-book-row">', '<div class="sy-book-row" style="margin-top:12px">'), null, { premise: "gap" }],
  ["Z101", "署名元素內加一個 span，文字「（官方）」", ["F10"], (s, kv, A) => sub1(s, `>${A.signature}</a>\n<div class="sy-book-row">`, `>${A.signature}<span>（官方）</span></a>\n<div class="sy-book-row">`)],
];

module.exports = { runShell, APPLICABLE, NOT_APPLICABLE, FULL, STATES, ZCASES };
