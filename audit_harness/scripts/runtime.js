const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');

const TOOLS = [
  {id:'1-1', url:'http://127.0.0.1:8099/1-1/'},
  {id:'2-1', url:'http://127.0.0.1:8099/2-1/'},
  {id:'2-2', url:'http://127.0.0.1:8099/2-2/'},
  {id:'3-2', url:'http://127.0.0.1:8099/3-2/'},
  {id:'4-1', url:'http://127.0.0.1:8099/4-1/'},
  {id:'4-3', url:'http://127.0.0.1:8099/4-3/'},
  {id:'3-2v156', url:'http://127.0.0.1:8099/audit_harness/inputs/3-2_v1.5.6_manifest_named.html'},
];
const WIDTHS = [1200, 768, 390, 320];

const AUDIT = () => {
  const out = {};
  const vw = window.innerWidth;
  const de = document.documentElement;
  out.compatMode = document.compatMode;
  out.scrollWidth = de.scrollWidth;
  out.innerWidth = vw;
  out.horizontalOverflow = de.scrollWidth > vw + 1;
  // elements wider than viewport
  const overflowing = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      const parentScrolls = (() => { let p = el.parentElement; while (p) { const s = getComputedStyle(p); if (s.overflowX === 'auto' || s.overflowX === 'scroll') return true; p = p.parentElement; } return false; })();
      if (!parentScrolls && cs.position !== 'fixed')
        overflowing.push({tag: el.tagName, cls: (el.className||'').toString().slice(0,60), id: el.id, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width)});
    }
  });
  out.overflowingElements = overflowing.slice(0, 12);
  out.overflowingCount = overflowing.length;

  // interactive elements & touch targets
  const SEL = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"]';
  const nodes = [...document.querySelectorAll(SEL)].filter(el => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.disabled;
  });
  out.interactiveCount = nodes.length;
  const small = nodes.map(el => { const r = el.getBoundingClientRect(); return {tag: el.tagName, id: el.id, cls:(el.className||'').toString().slice(0,50), txt:(el.textContent||'').trim().slice(0,26), w: Math.round(r.width), h: Math.round(r.height)}; })
    .filter(x => x.h < 44 || x.w < 44);
  out.subOptimalTargets = small.filter(x=>x.h<24||x.w<24);
  out.under44 = small.length;
  out.under24 = out.subOptimalTargets.length;
  out.subOptimalTargets = out.subOptimalTargets.slice(0,10);

  // labels
  const fields = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')];
  out.fieldsTotal = fields.length;
  out.fieldsUnlabelled = fields.filter(f => {
    if (f.getAttribute('aria-label') || f.getAttribute('aria-labelledby') || f.getAttribute('title')) return false;
    if (f.id && document.querySelector(`label[for="${CSS.escape(f.id)}"]`)) return false;
    if (f.closest('label')) return false;
    return true;
  }).map(f => ({type: f.type, id: f.id, name: f.name})).slice(0, 10);

  // headings
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h=>h.offsetParent!==null||h.getClientRects().length);
  out.headings = hs.map(h => ({lvl: +h.tagName[1], txt: (h.textContent||'').trim().slice(0, 30)}));
  out.h1Count = hs.filter(h=>h.tagName==='H1').length;
  let skips = []; let prev = 0;
  hs.forEach(h => { const l = +h.tagName[1]; if (prev && l > prev + 1) skips.push(`h${prev}->h${l}`); prev = l; });
  out.headingSkips = skips;
  out.landmarks = {main: document.querySelectorAll('main,[role=main]').length, nav: document.querySelectorAll('nav,[role=navigation]').length, header: document.querySelectorAll('header,[role=banner]').length, footer: document.querySelectorAll('footer,[role=contentinfo]').length};
  out.title = document.title;
  out.lang = de.getAttribute('lang');
  // duplicate ids at runtime
  const ids = {}; document.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id]||0)+1);
  out.duplicateIdsRuntime = Object.entries(ids).filter(([,c]) => c > 1);
  return out;
};

const FOCUS_PROBE = () => {
  // tab order sweep + focus visibility
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const nodes = [...document.querySelectorAll(SEL)].filter(el => { const r = el.getBoundingClientRect(); return r.width>0 && r.height>0 && !el.disabled; });
  const res = [];
  for (const el of nodes.slice(0, 60)) {
    el.focus();
    const cs = getComputedStyle(el);
    const ow = cs.outlineWidth, os = cs.outlineStyle, bs = cs.boxShadow, oc = cs.outlineColor;
    const visible = (os !== 'none' && parseFloat(ow) > 0) || (bs && bs !== 'none');
    res.push({tag: el.tagName, id: el.id, cls: (el.className||'').toString().slice(0,40), txt:(el.textContent||'').trim().slice(0,20), outline: `${os} ${ow} ${oc}`, boxShadow: (bs||'none').slice(0,50), focusVisible: visible});
  }
  return {checked: res.length, noVisibleFocus: res.filter(r => !r.focusVisible), sample: res.slice(0,3)};
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const report = {};
  for (const t of TOOLS) {
    report[t.id] = { widths: {}, console: [], pageErrors: [], requestFailures: [] };
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: 'zh-TW' });
      const page = await ctx.newPage();
      const msgs = [], errs = [], reqf = [];
      page.on('console', m => { if (['error','warning'].includes(m.type())) msgs.push({w, type: m.type(), text: m.text().slice(0,300)}); });
      page.on('pageerror', e => errs.push({w, text: String(e).slice(0,400)}));
      page.on('requestfailed', r => reqf.push({w, url: r.url().slice(0,140), err: r.failure()?.errorText}));
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(600);
      const a = await page.evaluate(AUDIT);
      let focus = null;
      if (w === 1200) focus = await page.evaluate(FOCUS_PROBE);
      report[t.id].widths[w] = { ...a, focus };
      report[t.id].console.push(...msgs); report[t.id].pageErrors.push(...errs); report[t.id].requestFailures.push(...reqf);
      await page.screenshot({ path: `audit_harness/results/shots/${t.id}_${w}.png`, fullPage: false }).catch(()=>{});
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync('audit_harness/results/runtime_report.json', JSON.stringify(report, null, 2));
  console.log('runtime done');
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
