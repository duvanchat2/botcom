// QA for the canvas journey site. usage: node qa2.mjs <html> <outdir> [configs]
// Screens each chapter and section at desktop / phone (light + dark), checks the frame
// engine, chapter copy timing, overflow, console errors, navigation and the demo checkout.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(process.argv[2]);
const out = path.resolve(process.argv[3]);
const only = (process.argv[4] || '').split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CONFIGS = [
  { name: 'desk', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' },
  { name: 'mob', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: iphone, colorScheme: 'light' },
  { name: 'desk-dark', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'dark' },
  { name: 'mob-dark', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: iphone, colorScheme: 'dark' },
  { name: 'tab', viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'light' },
  { name: 'desk-s', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, colorScheme: 'light' },
  { name: 'rm', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' },
];

const browser = await chromium.launch();
const report = {};
for (const cfg of CONFIGS.filter(c => !only.length || only.includes(c.name))) {
  const { name, ...opts } = cfg;
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  const t0 = Date.now();
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 60000 });
  const loadMs = Date.now() - t0;
  await page.waitForFunction(() => window.VERA && window.VERA.ready, null, { timeout: 30000 });
  const firstPaintMs = await page.evaluate(async () => {
    const s = performance.now();
    while (!document.getElementById('film').classList.contains('is-on') && performance.now() - s < 8000) await new Promise(r => setTimeout(r, 30));
    return Math.round(performance.now() - s);
  });
  await page.waitForTimeout(1200);
  const geo = await page.evaluate(() => {
    const J = window.VERA.J, o = { jtop: J.top, starts: J.starts, lens: window.VERA.CFG.chapters.map(c => c.len), vh: document.querySelector('div[style*="100vh"]') ? document.querySelector('div[style*="100vh"]').offsetHeight : innerHeight, doc: document.documentElement.scrollHeight, mode: window.VERA.mode };
    for (const id of ['producto', 'ingredientes', 'ritual', 'preguntas', 'comprar', 'marca']) { const el = document.getElementById(id); o[id] = { top: Math.round(el.getBoundingClientRect().top + scrollY), h: el.offsetHeight }; }
    return o;
  });
  const vh = geo.vh;
  const js = (c, u) => Math.round(geo.jtop + (geo.starts[c] + geo.lens[c] * u) * vh);
  const beats = [
    ['00-llegada-hold', js(0, 0)],
    ['01-llegada-move', js(0, 0.75)],
    ['02-gesto', js(1, 0.55)],
    ['03-disolucion', js(2, 0.5)],
    ['04-ingredientes', js(3, 0.55)],
    ['05-ritual', js(4, 0.55)],
    ['06-revelacion', js(5, 0.85)],
    ['07-producto', geo.producto.top - 60],
    ['08-ingredientes', geo.ingredientes.top + Math.round(vh * 0.2)],
    ['09-ingredientes-b', geo.ingredientes.top + Math.round(geo.ingredientes.h * 0.5)],
    ['10-ritual', geo.ritual.top + Math.round(geo.ritual.h * 0.45) - Math.round(vh / 2)],
    ['11-preguntas', geo.preguntas.top - 40],
    ['12-comprar', geo.comprar.top - 40],
    ['13-marca', geo.marca.top - 40],
    ['14-marca-b', geo.marca.top + Math.round(geo.marca.h * 0.55)],
    ['15-footer', geo.doc - vh],
  ];
  const shots = [];
  for (const [label, y] of beats) {
    await page.evaluate(yy => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(label.includes('marca') || label === '12-comprar' ? 1600 : 1000);
    const st = await page.evaluate(() => {
      const V = window.VERA;
      return {
        y: Math.round(scrollY), want: V.F.want, cached: V.F.cache.size, inflight: V.F.inflight.size, mode: V.mode,
        ch: [...document.querySelectorAll('.ch')].map(e => +(+getComputedStyle(e).opacity).toFixed(2)),
        loaderDone: document.getElementById('loader').classList.contains('is-done'),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        navSolid: document.getElementById('nav').classList.contains('is-solid'),
      };
    });
    await page.screenshot({ path: path.join(out, `${name}-${label}.png`) });
    shots.push({ label, ...st });
  }

  // navigation: skip link, nav link, chapter rail
  const nav = {};
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.click('.jskip');
  await page.waitForTimeout(1800);
  nav.skip = await page.evaluate(() => Math.round(document.getElementById('producto').getBoundingClientRect().top));
  if (await page.isVisible('.nav__links a[href="#preguntas"]') && await page.isVisible('#jrail')) {
    await page.click('.nav__links a[href="#preguntas"]');
    await page.waitForTimeout(1800);
    nav.faq = await page.evaluate(() => Math.round(document.getElementById('preguntas').getBoundingClientRect().top));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    await page.click('#jrail button[data-go="2"]');
    await page.waitForTimeout(2200);
    nav.rail = await page.evaluate(() => ({ active: window.VERA.J.active, want: window.VERA.F.want }));
  }
  // FAQ + checkout
  await page.evaluate(() => document.getElementById('preguntas').scrollIntoView({ behavior: 'instant' }));
  await page.click('#preguntas details:nth-of-type(3) summary');
  const faqOpen = await page.evaluate(() => document.querySelector('#preguntas details:nth-of-type(3)').open);
  await page.evaluate(() => document.getElementById('comprar').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.click('label[for="plan-sub"]');
  await page.click('#qty-plus');
  await page.click('#qty-plus');
  const buyText = await page.evaluate(() => ({ price: document.getElementById('price').textContent, total: document.getElementById('total').textContent }));
  await page.click('#add');
  await page.waitForTimeout(700);
  const toast = await page.evaluate(() => { const t = document.getElementById('toast'); return { hidden: t.hidden, text: t.textContent }; });
  await page.screenshot({ path: path.join(out, `${name}-16-checkout.png`) });

  // frame pacing: wheel through the journey from the top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__fr = []; let l = performance.now(); (function f(t) { window.__fr.push(t - l); l = t; if (window.__fr.length < 200000) requestAnimationFrame(f); })(l); });
  const endY = geo.producto.top;
  for (let y = 0; y < endY; y += 100) { await page.mouse.wheel(0, 100); await page.waitForTimeout(16); }
  await page.waitForTimeout(800);
  const pacing = await page.evaluate(() => {
    const f = window.__fr.slice(2), s = [...f].sort((a, b) => a - b), q = x => +s[Math.floor(x * (s.length - 1))].toFixed(1);
    return { frames: f.length, p50: q(0.5), p95: q(0.95), max: +s[s.length - 1].toFixed(1), over50: f.filter(x => x > 50).length, cached: window.VERA.F.cache.size };
  });
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.style));
  report[name] = { loadMs, firstPaintMs, geo, shots, nav, faqOpen, buyText, toast, pacing, fonts, logs };
  await ctx.close();
  console.log(`${name}: load ${loadMs} ms, first frame +${firstPaintMs} ms, mode ${geo.mode}, p95 ${pacing.p95} ms, logs ${logs.length}`);
}
await browser.close();
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
