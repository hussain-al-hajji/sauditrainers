/* بوستر ميزة «فرص التدريب» (1080×1350) ← promo/opps-poster.png
 * التشغيل من جذر المستودع:  python3 -m http.server 8765 &  ثم  node tools/promo/render-opps.js */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1200, height: 1400 } });
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/tools/promo/opps.html');
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.locator('#n1').screenshot({ path: path.resolve(__dirname, '../../promo/opps-poster.png') });
  await b.close(); console.log('تم');
})();
