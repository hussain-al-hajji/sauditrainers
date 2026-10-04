/* يولّد صفحات مشاركة ثابتة لكل مدرب: t/<الرابط>/index.html بوسوم Open Graph وصورة بطاقته og/<الرقم>.jpg
 * السبب: موقعنا صفحة واحدة بروابط #، وزواحف واتساب وإكس ولينكدإن لا تنفّذ JavaScript ولا ترى ما بعد #،
 * فلا تظهر معاينة المدرب. الرابط المنشور الجديد هو  https://الدومين/t/<الرابط>/  فيرى الزاحف الوسوم ويُحوَّل الزائر للصفحة الحقيقية.
 *
 *   node tools/og/build.js --check   ← يفحص بلا أي تثبيت: هل تغيّر شيء؟ (يطبع changed=true|false ويكتبه في GITHUB_OUTPUT)
 *   node tools/og/build.js           ← يولّد الصور والصفحات (يتطلب playwright) — يُشغَّل من GitHub Actions
 *   OG_LOCAL=1 node tools/og/build.js ← تجربة محلية ببيانات تجريبية بدل قاعدة البيانات */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), http = require('http');
const ROOT = path.resolve(__dirname, '../..');
const CHECK = process.argv.includes('--check'), LOCAL = !!process.env.OG_LOCAL;
const VERSION = 'og-1';

const cfgSrc = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
const CFG = (() => { const w = {}; new Function('window', cfgSrc)(w); return w.ST_CONFIG; })();
const SITE = (process.env.SITE_URL || CFG.siteUrl || 'https://sauditrainers.sa/').replace(/\/?$/, '/');
const DB = `${CFG.firebase.databaseURL}/${CFG.dbRoot || 'sauditrainers'}`;
const sha = s => crypto.createHash('sha1').update(s).digest('hex');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fetchJson = async p => { const r = await fetch(`${DB}/${p}.json`); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); };
const manifestPath = path.join(ROOT, 'og/manifest.json');
const readManifest = () => { try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return { sig: '', trainers: {} }; } };
const codeSig = () => sha(['js/card.js', 'js/data.js', 'tools/og/build.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('|') + VERSION);

(async () => {
  if (CHECK) {
    const [trainers, slugs, content] = await Promise.all([fetchJson('trainers'), fetchJson('slugs'), fetchJson('content/cardTemplate').catch(() => null)]);
    const sig = sha(JSON.stringify([trainers, slugs, content]) + codeSig());
    const changed = sig !== readManifest().sig;
    console.log(`changed=${changed}`);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
    return;
  }

  const { chromium } = require('playwright');
  // خادم ثابت للموقع (لتشغيل نفس كود رسم البطاقة المستخدم في المنصة)
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, s) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); s.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => console.warn('pageerror:', e.message));
  if (LOCAL) await page.route('**/js/config.js*', r => r.fulfill({ contentType: 'application/javascript', body: "window.ST_CONFIG={firebase:null,dbRoot:'x',ownerEmails:[],siteUrl:'http://localhost/',useCurrentOrigin:true};" }));
  await page.goto(`${base}/#/${LOCAL ? 'admin' : 'trainers'}`);
  if (LOCAL) { await page.waitForTimeout(900); await page.click('#gl'); await page.waitForTimeout(400); await page.evaluate(async () => { await seedDemo(); Auth.set(null); }); }
  await page.waitForFunction(() => typeof Data !== 'undefined' && Data.live().length > 0, null, { timeout: 90000 });
  await page.waitForTimeout(2500);
  // خطوط الهوية محلياً حتى لا يتوقف الرسم على الشبكة
  const fdir = `${base}/tools/promo/fonts`;
  await page.addStyleTag({ content: [600, 700, 800, 900].map(w => `@font-face{font-family:'Cairo';font-weight:${w};src:url(${fdir}/cairo-arabic-${w}-normal.woff2)}`).join('') + [400, 500, 600, 700].map(w => `@font-face{font-family:'IBM Plex Sans Arabic';font-weight:${w};src:url(${fdir}/ibm-plex-sans-arabic-${w}-normal.woff2)}`).join('') });

  const data = await page.evaluate(() => {
    const live = Data.live().map(t => ({ id: t.id, slug: t.slug || t.id, name: t.name, title: t.title || '', region: regionsLabel(t), hash: JSON.stringify([t, cardTemplate()]) }));
    return { live, slugs: Store.get('slugs') || {}, tpl: JSON.stringify(cardTemplate()) };
  });
  const sig = sha(JSON.stringify([data.live.map(t => t.hash), data.slugs, data.tpl]) + codeSig());
  const man = readManifest(), nextMan = { sig, trainers: {} };
  fs.mkdirSync(path.join(ROOT, 'og'), { recursive: true });

  for (const t of data.live) {
    const h = sha(t.hash + codeSig()), file = path.join(ROOT, `og/${t.id}.jpg`);
    nextMan.trainers[t.id] = h;
    if (man.trainers[t.id] === h && fs.existsSync(file)) continue;
    let url = null;
    for (const q of [0.84, 0.72, 0.6]) {
      url = await page.evaluate(async ({ id, q }) => {
        const cv = await Card.render(Data.trainer(id), 'wide'), o = document.createElement('canvas'); o.width = 1200; o.height = 675;
        const c = o.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(cv, 0, 0, 1200, 675); return o.toDataURL('image/jpeg', q);
      }, { id: t.id, q });
      if (url.length * 0.75 < 290 * 1024) break;      // واتساب يفضّل صورة المعاينة أقل من ~300KB
    }
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`og/${t.id}.jpg  ${(fs.statSync(file).size / 1024) | 0}KB`);
  }
  // حذف صور المدربين المحذوفين أو المخفيين
  for (const f of fs.readdirSync(path.join(ROOT, 'og'))) if (/\.jpg$/.test(f) && !nextMan.trainers[f.replace('.jpg', '')]) fs.unlinkSync(path.join(ROOT, 'og', f));

  // الصفحات: لكل رابط حالي ولكل رابط سابق (يحوّل للحالي)
  const byId = Object.fromEntries(data.live.map(t => [t.id, t]));
  const pages = new Map();
  data.live.forEach(t => pages.set(t.slug, t));
  Object.entries(data.slugs).forEach(([s, id]) => { if (byId[id] && !pages.has(s)) pages.set(s, byId[id]); });
  const tdir = path.join(ROOT, 't');
  fs.rmSync(tdir, { recursive: true, force: true });
  for (const [slug, t] of pages) {
    const cur = t.slug, url = `${SITE}t/${cur}/`, img = `${SITE}og/${t.id}.jpg`;
    const title = `${t.name} | مدرّبون سعوديّون`, desc = [t.title, t.region && `المنطقة: ${t.region}`, 'منصة مدرّبون سعوديّون لتسويق خبرات المدربين السعوديين'].filter(Boolean).join(' — ').slice(0, 220);
    const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="profile"><meta property="og:site_name" content="مدرّبون سعوديّون"><meta property="og:locale" content="ar_SA">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="675"><meta property="og:image:alt" content="${esc('بطاقة ' + t.name)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta name="theme-color" content="#005430">
<link rel="icon" type="image/png" href="../../assets/favicon.png">
<script>location.replace('../../#/t/${encodeURIComponent(cur)}' + location.search);</script>
<noscript><meta http-equiv="refresh" content="0;url=../../#/t/${esc(encodeURIComponent(cur))}"></noscript>
</head><body style="font-family:Tahoma,Arial,sans-serif;text-align:center;padding:40px;color:#0D2418">
<h1>${esc(t.name)}</h1><p>${esc(t.title)}</p><p><a href="../../#/t/${esc(encodeURIComponent(cur))}">فتح بطاقة المدرب في منصة مدرّبون سعوديّون</a></p>
</body></html>
`;
    fs.mkdirSync(path.join(tdir, slug), { recursive: true });
    fs.writeFileSync(path.join(tdir, slug, 'index.html'), html);
  }
  // خريطة الموقع (للفهرسة) وملف robots
  const urls = [SITE, ...data.live.map(t => `${SITE}t/${t.slug}/`)];
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
  fs.writeFileSync(manifestPath, JSON.stringify(nextMan, null, 1));
  console.log(`تم: ${data.live.length} مدرب، ${pages.size} صفحة`);
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
