/**
 * إحصاءات Google للوحة الإدارة — ملف إضافي في مشروع Apps Script نفسه.
 * يجلب بيانات Google Analytics 4 وSearch Console ويكتبها في analytics_ext/ga و analytics_ext/gsc في قاعدة البيانات.
 *
 * الإعداد (مرة واحدة) — Project Settings ← Script Properties:
 *   GA_PROPERTY_ID : رقم خاصية GA4 (أرقام فقط، مثل 412345678) من Admin ← Property settings
 *   GSC_SITE       : خاصية Search Console، مثل  sc-domain:sauditrainers.sa   أو   https://sauditrainers.sa/
 * ويجب أن يكون حساب المنصة (الذي يشغّل السكربت) مضافاً مستخدماً بصلاحية «Viewer/مشاهد» في الخاصيتين،
 * وأن تتضمن الصلاحيات في appsscript.json: analytics.readonly و webmasters.readonly.
 * ثم شغّل refreshAnalytics مرة وافقت فيها على الصلاحيات، وشغّل setupTriggers ليحدّث البيانات كل ساعتين.
 */

const AN_PROPS = PropertiesService.getScriptProperties();

function anFetch(url, body) {
  const res = UrlFetchApp.fetch(url, { method: body ? 'post' : 'get', contentType: 'application/json', payload: body ? JSON.stringify(body) : undefined, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  const code = res.getResponseCode(), txt = res.getContentText();
  if (code >= 300) { let m = txt; try { m = JSON.parse(txt).error.message; } catch (e) { /* نص خام */ } throw new Error(code + ': ' + String(m).slice(0, 220)); }
  return JSON.parse(txt || '{}');
}

/* ===================== الفترات: 7 أيام، 28، 90، 12 شهراً، ومنذ البداية ===================== */
// لكل فترة: [المفتاح، عدد الأيام (0 = منذ البداية)]
const AN_PERIODS = [['7', 7], ['28', 28], ['90', 90], ['365', 365], ['all', 0]];

/* ===================== Google Analytics 4 (Data API) ===================== */
function gaBatch(pid, reqs) { return anFetch('https://analyticsdata.googleapis.com/v1beta/properties/' + pid + ':batchRunReports', { requests: reqs }).reports || []; }
const gaRows = (r, dims, mets) => ((r || {}).rows || []).map(x => []
  .concat((x.dimensionValues || []).slice(0, dims).map(d => d.value))
  .concat((x.metricValues || []).slice(0, mets).map(m => Number(m.value) || 0)));

function fetchGa() {
  const pid = String(AN_PROPS.getProperty('GA_PROPERTY_ID') || '').replace(/\D/g, '');
  if (!pid) return null;
  const mets = ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'engagementRate', 'bounceRate'].map(name => ({ name }));
  const sum = r => { const v = (((r || {}).rows || [])[0] || {}).metricValues || []; const g = i => +(v[i] || {}).value || 0; return { activeUsers: g(0), newUsers: g(1), sessions: g(2), pageViews: g(3), avgDuration: g(4), engagementRate: g(5), bounceRate: g(6) }; };
  const top = (range, dim, met, n, extra) => ({ dateRanges: range, dimensions: [{ name: dim }].concat(extra ? [{ name: extra }] : []), metrics: [{ name: met }], orderBys: [{ metric: { metricName: met }, desc: true }], limit: n });
  const out = { updatedAt: Date.now(), periods: {} };
  AN_PERIODS.forEach(function (p) {
    const key = p[0], n = p[1];
    const range = [{ startDate: n ? (n - 1) + 'daysAgo' : '2015-08-14', endDate: 'today' }];
    const prev = n ? [{ startDate: (2 * n - 1) + 'daysAgo', endDate: n + 'daysAgo' }] : null;
    const monthly = n === 0 || n > 90;
    const seriesReq = { dateRanges: range, dimensions: [{ name: monthly ? 'yearMonth' : 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: monthly ? 'yearMonth' : 'date' } }], limit: 400 };
    const r1 = gaBatch(pid, [{ dateRanges: range, metrics: mets }, seriesReq, top(range, 'countryId', 'activeUsers', 12, 'country'), top(range, 'city', 'activeUsers', 12), top(range, 'deviceCategory', 'activeUsers', 5)]);
    const r2 = gaBatch(pid, [top(range, 'sessionDefaultChannelGroup', 'sessions', 8), top(range, 'sessionSource', 'sessions', 10), top(range, 'pagePath', 'screenPageViews', 10)].concat(prev ? [{ dateRanges: prev, metrics: mets }] : []));
    const o = sum(r1[0]); if (prev) o.prev = sum(r2[3]);
    out.periods[key] = { overview: o, daily: gaRows(r1[1], 1, 3), countries: gaRows(r1[2], 2, 1), cities: gaRows(r1[3], 1, 1).filter(r => r[0] !== '(not set)'), devices: gaRows(r1[4], 1, 1), channels: gaRows(r2[0], 1, 1), sources: gaRows(r2[1], 1, 1), pages: gaRows(r2[2], 1, 1) };
  });
  // ملخص يظهر للمدربين في لوحاتهم: زيارات منذ أول رقم مسجّل، وزوار آخر 30 يوماً
  const rs = gaBatch(pid, [{ dateRanges: [{ startDate: '29daysAgo', endDate: 'today' }], metrics: mets }, { dateRanges: [{ startDate: '2015-08-14', endDate: 'today' }], dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 1 }]);
  out.last30 = sum(rs[0]); out.firstDate = ((((rs[1] || {}).rows || [])[0] || {}).dimensionValues || [{}])[0].value || '';
  try { out.realtime = { users: Number((((anFetch('https://analyticsdata.googleapis.com/v1beta/properties/' + pid + ':runRealtimeReport', { metrics: [{ name: 'activeUsers' }] }).rows || [])[0] || {}).metricValues || [{}])[0].value) || 0 }; } catch (e) { out.realtime = { users: 0 }; }
  return out;
}

/* ===================== Search Console ===================== */
function gscQuery(site, body) { return anFetch('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(site) + '/searchAnalytics/query', body); }
function fetchGsc() {
  const site = String(AN_PROPS.getProperty('GSC_SITE') || '').trim();
  if (!site) return null;
  const day = n => Utilities.formatDate(new Date(Date.now() - n * 864e5), 'Asia/Riyadh', 'yyyy-MM-dd');
  const tot = r => { const x = ((r || {}).rows || [])[0] || {}; return { clicks: x.clicks || 0, impressions: x.impressions || 0, ctr: x.ctr || 0, position: x.position || 0 }; };
  const out = { updatedAt: Date.now(), periods: {} };
  // Search Console يحتفظ بنحو 16 شهراً فقط، فـ «منذ البداية» = أقصى ما يوفّره (480 يوماً)
  AN_PERIODS.forEach(function (p) {
    const key = p[0], n = p[1] || 480, end = day(2), start = day(1 + n);   // البيانات تتأخر يومين
    const q = (dims, rows) => gscQuery(site, { startDate: start, endDate: end, dimensions: dims, rowLimit: rows });
    const per = { range: { start: start, end: end }, totals: tot(gscQuery(site, { startDate: start, endDate: end })) };
    if (p[1]) per.prev = tot(gscQuery(site, { startDate: day(1 + 2 * n), endDate: day(2 + n) }));
    let daily = (q(['date'], 1000).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (n > 90) {   // فترات طويلة: تجميع شهري
      const m = {}; daily.forEach(r => { const k = r[0].slice(0, 7); m[k] = m[k] || [k, 0, 0]; m[k][1] += r[1]; m[k][2] += r[2]; });
      daily = Object.keys(m).sort().map(k => m[k]);
    }
    per.daily = daily;
    per.queries = (q(['query'], 25).rows || []).map(r => [r.keys[0], r.clicks, r.impressions, r.ctr, r.position]);
    per.pages = (q(['page'], 10).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]);
    per.countries = (q(['country'], 10).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]);
    per.devices = (q(['device'], 5).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]);
    out.periods[key] = per;
  });
  return out;
}

/* ===================== التحديث ===================== */
// يُستدعى من المؤقّت (كل ساعتين) ومن زر «تحديث الآن» في لوحة الإدارة (action: analytics)
function refreshAnalytics() {
  gaOk = false;
  [['ga', fetchGa], ['gsc', fetchGsc]].forEach(function (p) {
    let data;
    try { data = p[1](); }
    catch (err) { console.error(p[0], err); data = { updatedAt: Date.now(), error: String(err.message || err).slice(0, 240) }; }
    if (data) db('analytics_ext/' + p[0], 'put', data);
    if (p[0] === 'ga' && data && data.periods) platformFromGa(data);
  });
  if (!gaOk) platformFromOwn();
}
let gaOk = false;
// ملخص المنصة العام (قراءة عامة): أرقام Google Analytics كاملة منذ أول رقم مسجّل
function platformFromGa(d) {
  const all = d.periods.all.overview, l30 = d.last30 || d.periods['28'].overview;
  gaOk = true;
  db('stats/platform', 'put', { updatedAt: Date.now(), source: 'ga', since: d.firstDate || '', sessionsAll: all.sessions, usersAll: all.activeUsers, viewsAll: all.pageViews, users30: l30.activeUsers, sessions30: l30.sessions, views30: l30.pageViews });
}
// بديل عند عدم ربط Google Analytics: من عدّادات المنصة الذاتية
function platformFromOwn() {
  const days = db('analytics/day') || {}, keys = Object.keys(days).sort();
  if (!keys.length) return;
  const cut = Utilities.formatDate(new Date(Date.now() - 29 * 864e5), 'Asia/Riyadh', 'yyyyMMdd');
  let s = 0, v = 0, u30 = 0, s30 = 0, v30 = 0;
  keys.forEach(k => { const x = days[k] || {}; s += x.visits || 0; v += x.views || 0; if (k >= cut) { u30 += x.visitors || 0; s30 += x.visits || 0; v30 += x.views || 0; } });
  db('stats/platform', 'put', { updatedAt: Date.now(), source: 'own', since: keys[0], sessionsAll: s, usersAll: 0, viewsAll: v, users30: u30, sessions30: s30, views30: v30 });
}

/* ===================== اللقطة الشهرية ===================== */
// تُحفظ في analytics_ext/monthly/YYYYMM في أول أيام الشهر التالي (اليوم 4 لتكتمل بيانات Search Console المتأخرة)،
// وتحوي: الأرقام التراكمية منذ أقدم رقم متاح حتى نهاية الشهر + أرقام الشهر نفسه ومقارنته بما قبله.
const AN_START = '2015-08-14';
const anPad = n => String(n).padStart(2, '0');
function monthBounds(ym) {
  const y = +ym.slice(0, 4), m = +ym.slice(5, 7), last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1, plast = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  return { start: y + '-' + anPad(m) + '-01', end: y + '-' + anPad(m) + '-' + anPad(last), pstart: py + '-' + anPad(pm) + '-01', pend: py + '-' + anPad(pm) + '-' + anPad(plast) };
}
const anPrevMonth = () => { const d = new Date(Date.now() + 3 * 3600e3); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.getUTCFullYear() + '-' + anPad(d.getUTCMonth() + 1); };

function gaFirstDate(pid) {
  const r = gaBatch(pid, [{ dateRanges: [{ startDate: AN_START, endDate: 'today' }], dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 1 }]);
  return ((((r[0] || {}).rows || [])[0] || {}).dimensionValues || [{}])[0].value || '';
}
function snapshotGa(pid, ym, first) {
  const b = monthBounds(ym), mets = ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'engagementRate', 'bounceRate'].map(name => ({ name }));
  const sum = r => { const v = (((r || {}).rows || [])[0] || {}).metricValues || []; const g = i => +(v[i] || {}).value || 0; return { activeUsers: g(0), newUsers: g(1), sessions: g(2), pageViews: g(3), avgDuration: g(4), engagementRate: g(5), bounceRate: g(6) }; };
  const mon = [{ startDate: b.start, endDate: b.end }];
  const top = (dim, met, n, extra) => ({ dateRanges: mon, dimensions: [{ name: dim }].concat(extra ? [{ name: extra }] : []), metrics: [{ name: met }], orderBys: [{ metric: { metricName: met }, desc: true }], limit: n });
  const r1 = gaBatch(pid, [{ dateRanges: [{ startDate: AN_START, endDate: b.end }], metrics: mets }, { dateRanges: mon, metrics: mets }, { dateRanges: [{ startDate: b.pstart, endDate: b.pend }], metrics: mets }, top('countryId', 'activeUsers', 10, 'country'), top('city', 'activeUsers', 10)]);
  const r2 = gaBatch(pid, [top('deviceCategory', 'activeUsers', 5), top('sessionDefaultChannelGroup', 'sessions', 8), top('sessionSource', 'sessions', 10), top('pagePath', 'screenPageViews', 10)]);
  return { since: first || '', cum: sum(r1[0]), mon: sum(r1[1]), prev: sum(r1[2]), countries: gaRows(r1[3], 2, 1), cities: gaRows(r1[4], 1, 1).filter(r => r[0] !== '(not set)'), devices: gaRows(r2[0], 1, 1), channels: gaRows(r2[1], 1, 1), sources: gaRows(r2[2], 1, 1), pages: gaRows(r2[3], 1, 1) };
}
function snapshotGsc(site, ym) {
  const b = monthBounds(ym), day = n => Utilities.formatDate(new Date(Date.now() - n * 864e5), 'Asia/Riyadh', 'yyyy-MM-dd');
  const oldest = day(480);                                   // أقدم ما يحتفظ به Search Console (نحو 16 شهراً)
  if (b.end < oldest) return null;
  const tot = r => { const x = ((r || {}).rows || [])[0] || {}; return { clicks: x.clicks || 0, impressions: x.impressions || 0, ctr: x.ctr || 0, position: x.position || 0 }; };
  const from = b.start > oldest ? b.start : oldest;
  const q = (dims, n) => gscQuery(site, { startDate: from, endDate: b.end, dimensions: dims, rowLimit: n });
  return { oldest: oldest, cum: tot(gscQuery(site, { startDate: oldest, endDate: b.end })), mon: tot(gscQuery(site, { startDate: from, endDate: b.end })), queries: (q(['query'], 10).rows || []).map(r => [r.keys[0], r.clicks, r.impressions, r.ctr, r.position]), pages: (q(['page'], 5).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]) };
}
function snapshotOwn(ym) {
  const days = db('analytics/day') || {}, b = monthBounds(ym), a = { visits: 0, views: 0, visitors: 0, searches: 0, contacts: 0, joins: 0 }, cum = Object.assign({}, a), mon = Object.assign({}, a);
  Object.keys(days).forEach(k => { const d = k.slice(0, 4) + '-' + k.slice(4, 6) + '-' + k.slice(6, 8); if (d > b.end) return; Object.keys(a).forEach(f => { const v = +(days[k] || {})[f] || 0; cum[f] += v; if (d >= b.start) mon[f] += v; }); });
  return { cum: cum, mon: mon };
}
function snapshotMonth(ym, first) {
  const pid = String(AN_PROPS.getProperty('GA_PROPERTY_ID') || '').replace(/\D/g, ''), site = String(AN_PROPS.getProperty('GSC_SITE') || '').trim();
  const snap = { ym: ym, createdAt: Date.now() }, errs = [];
  if (pid) { try { snap.ga = snapshotGa(pid, ym, first || gaFirstDate(pid)); } catch (e) { errs.push('GA: ' + (e.message || e)); } }
  if (site) { try { const g = snapshotGsc(site, ym); if (g) snap.gsc = g; } catch (e) { errs.push('GSC: ' + String(e.message || e).slice(0, 150)); } }
  try { snap.own = snapshotOwn(ym); } catch (e) { /* ignore */ }
  if (errs.length) snap.error = errs.join(' | ').slice(0, 300);
  db('analytics_ext/monthly/' + ym.replace('-', ''), 'put', snap);
  return snap;
}
// يُشغَّل شهرياً (اليوم 4): لقطة الشهر الميلادي الماضي كاملاً
function monthlySnapshot() { const ym = anPrevMonth(); snapshotMonth(ym); console.log('لقطة الشهر ' + ym + ' جاهزة'); }
// استرجاع الأشهر السابقة من أقدم رقم في Analytics (يعالج 12 شهراً في كل تشغيل؛ أعد تشغيلها حتى تنتهي)
function backfillMonthly() {
  const pid = String(AN_PROPS.getProperty('GA_PROPERTY_ID') || '').replace(/\D/g, '');
  const first = pid ? gaFirstDate(pid) : '';
  const have = db('analytics_ext/monthly') || {}, last = anPrevMonth(), todo = [];
  let y = first ? +first.slice(0, 4) : new Date().getFullYear(), m = first ? +first.slice(4, 6) : 1;
  while (y + '-' + anPad(m) <= last) { const ym = y + '-' + anPad(m); if (!have[ym.replace('-', '')]) todo.push(ym); m++; if (m > 12) { m = 1; y++; } }
  todo.slice(0, 12).forEach(ym => { try { snapshotMonth(ym, first); } catch (e) { console.error(ym, e); } });
  console.log('أُنشئت ' + Math.min(12, todo.length) + ' لقطة، والمتبقي ' + Math.max(0, todo.length - 12) + (todo.length > 12 ? ' — أعد التشغيل' : ''));
}

// تحديث عند الطلب مع تحديد المعدل (مرة كل 5 دقائق على الأكثر)
function refreshAnalyticsThrottled() {
  const last = Number(AN_PROPS.getProperty('AN_LAST') || 0);
  if (Date.now() - last < 5 * 60000) return;
  AN_PROPS.setProperty('AN_LAST', String(Date.now()));
  refreshAnalytics();
}

// اختبار يدوي: يعرض في السجل ما جُلب أو الخطأ الحقيقي (صلاحيات، رقم خاصية خاطئ...)
function testAnalytics() {
  ['ga', 'gsc'].forEach(function (k) {
    try {
      const d = k === 'ga' ? fetchGa() : fetchGsc();
      console.log(k + ': ' + (d ? 'تم — ' + JSON.stringify(k === 'ga' ? d.periods['28'].overview : d.periods['28'].totals) : 'غير مُعدّ (أضف الخاصية في Script Properties)'));
    } catch (err) { console.log(k + ' خطأ: ' + (err.message || err)); }
  });
}
