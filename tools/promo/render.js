/* يولّد صور المنشورات الترويجية (1080×1350) في المجلد promo/ من posts.html.
 * التشغيل من جذر المستودع:  python3 -m http.server 8765 &  ثم  node tools/promo/render.js  (يتطلب حزمة playwright) */
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = path.resolve(__dirname, '../../promo');
const FONT_CSS = ['Cairo:arabic:600,700,800,900', 'IBM Plex Sans Arabic:arabic:400,500,600,700'];
const SAMPLE = [
  { name: 'أ. سارة العتيبي', title: 'مدربة معتمدة في القيادة والتحول الرقمي', gender: 'f', theme: 'brand', regions: ['riyadh', 'makkah'], years: 8, hours: 1200, programs: 60, specs: ['leadership', 'digital', 'soft'] },
  { name: 'م. خالد الدخيل', title: 'مدرب معتمد في الأمن السيبراني واستمرارية الأعمال', gender: 'm', theme: 'deep', regions: ['eastern', 'riyadh'], years: 12, hours: 3000, programs: 200, specs: ['cyber', 'crisis', 'data'] },
  { name: 'أ. نورة القحطاني', title: 'مدربة مهارات الاتصال وصناعة المحتوى', gender: 'f', theme: 'olive', regions: ['asir'], years: 6, hours: 900, programs: 45, specs: ['speaking', 'content', 'soft'] },
  { name: 'د. فيصل المنصور', title: 'مدرب ريادة الأعمال وإدارة المشاريع', gender: 'm', theme: 'cream', regions: ['madinah', 'riyadh'], years: 10, hours: 2400, programs: 120, specs: ['entrepreneur', 'projects', 'strategy'] }
];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.route('**/js/config.js*', r => r.fulfill({ contentType: 'application/javascript', body: "window.ST_CONFIG={firebase:null,dbRoot:'x',ownerEmails:[],siteUrl:'https://sauditrainers.sa/'};" }));
  await p.goto(BASE + '/#/join'); await p.waitForTimeout(800);
  // خطوط الهوية للبطاقات المرسومة على اللوحة
  await p.addStyleTag({ content: [600, 700, 800, 900].map(w => `@font-face{font-family:'Cairo';font-weight:${w};src:url(${BASE}/tools/promo/fonts/cairo-arabic-${w}-normal.woff2)}`).join('') + [400, 500, 600, 700].map(w => `@font-face{font-family:'IBM Plex Sans Arabic';font-weight:${w};src:url(${BASE}/tools/promo/fonts/ibm-plex-sans-arabic-arabic-${w}-normal.woff2)}`).join('') });
  const cards = await p.evaluate(async sample => {
    const out = [];
    for (const t of sample) { const cv = await Card.render({ ...t, region: t.regions[0], noPhoto: true, slug: 'x' }, 'post'); out.push(cv.toDataURL('image/png')); }
    return out;
  }, SAMPLE);
  const q = await b.newPage({ viewport: { width: 1200, height: 1400 } });
  await q.goto(BASE + '/tools/promo/posts.html'); await q.evaluate(c => window.setCards(c), cards);
  await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(800);
  for (let i = 1; i <= 6; i++) await q.locator('#p' + i).screenshot({ path: path.join(OUT, `post-${i}.png`) });
  await b.close(); console.log('تم: ' + OUT);
})();
