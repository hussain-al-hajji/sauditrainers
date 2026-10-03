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

/* ===================== Google Analytics 4 (Data API) ===================== */
function gaReport(pid, body) { return anFetch('https://analyticsdata.googleapis.com/v1beta/properties/' + pid + ':runReport', body); }
const gaRows = (r, dims, mets) => (r.rows || []).map(x => []
  .concat((x.dimensionValues || []).slice(0, dims).map(d => d.value))
  .concat((x.metricValues || []).slice(0, mets).map(m => Number(m.value) || 0)));

function fetchGa() {
  const pid = String(AN_PROPS.getProperty('GA_PROPERTY_ID') || '').replace(/\D/g, '');
  if (!pid) return null;
  const range = [{ startDate: '27daysAgo', endDate: 'today' }], prev = [{ startDate: '55daysAgo', endDate: '28daysAgo' }];
  const mets = ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'engagementRate', 'bounceRate'];
  const sum = r => { const v = ((r.rows || [])[0] || {}).metricValues || []; return { activeUsers: +(v[0] || {}).value || 0, newUsers: +(v[1] || {}).value || 0, sessions: +(v[2] || {}).value || 0, pageViews: +(v[3] || {}).value || 0, avgDuration: +(v[4] || {}).value || 0, engagementRate: +(v[5] || {}).value || 0, bounceRate: +(v[6] || {}).value || 0 }; };
  const m = names => names.map(name => ({ name }));
  const top = (dim, met, n, extra) => gaReport(pid, Object.assign({ dateRanges: range, dimensions: [{ name: dim }].concat(extra ? [{ name: extra }] : []), metrics: m([met]), orderBys: [{ metric: { metricName: met }, desc: true }], limit: n }));
  const out = { updatedAt: Date.now(), overview: sum(gaReport(pid, { dateRanges: range, metrics: m(mets) })) };
  out.overview.prev = sum(gaReport(pid, { dateRanges: prev, metrics: m(mets) }));
  out.daily = gaRows(gaReport(pid, { dateRanges: range, dimensions: [{ name: 'date' }], metrics: m(['activeUsers', 'sessions', 'screenPageViews']), orderBys: [{ dimension: { dimensionName: 'date' } }] }), 1, 3);
  out.countries = gaRows(top('countryId', 'activeUsers', 10, 'country'), 2, 1);
  out.cities = gaRows(top('city', 'activeUsers', 10), 1, 1).filter(r => r[0] !== '(not set)');
  out.devices = gaRows(top('deviceCategory', 'activeUsers', 5), 1, 1);
  out.channels = gaRows(top('sessionDefaultChannelGroup', 'sessions', 8), 1, 1);
  out.sources = gaRows(top('sessionSource', 'sessions', 10), 1, 1);
  out.pages = gaRows(top('pagePath', 'screenPageViews', 10), 1, 1);
  try { out.realtime = { users: Number((((anFetch('https://analyticsdata.googleapis.com/v1beta/properties/' + pid + ':runRealtimeReport', { metrics: [{ name: 'activeUsers' }] }).rows || [])[0] || {}).metricValues || [{}])[0].value) || 0 }; } catch (e) { out.realtime = { users: 0 }; }
  return out;
}

/* ===================== Search Console ===================== */
function gscQuery(site, body) { return anFetch('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(site) + '/searchAnalytics/query', body); }
function fetchGsc() {
  const site = String(AN_PROPS.getProperty('GSC_SITE') || '').trim();
  if (!site) return null;
  const day = n => Utilities.formatDate(new Date(Date.now() - n * 864e5), 'Asia/Riyadh', 'yyyy-MM-dd');
  const end = day(2), start = day(29), pEnd = day(30), pStart = day(57);   // البيانات تتأخر يومين
  const tot = r => { const x = (r.rows || [])[0] || {}; return { clicks: x.clicks || 0, impressions: x.impressions || 0, ctr: x.ctr || 0, position: x.position || 0 }; };
  const q = (dims, n) => gscQuery(site, { startDate: start, endDate: end, dimensions: dims, rowLimit: n });
  const out = { updatedAt: Date.now(), range: { start: start, end: end } };
  out.totals = tot(gscQuery(site, { startDate: start, endDate: end }));
  out.prev = tot(gscQuery(site, { startDate: pStart, endDate: pEnd }));
  out.daily = (q(['date'], 60).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  out.queries = (q(['query'], 25).rows || []).map(r => [r.keys[0], r.clicks, r.impressions, r.ctr, r.position]);
  out.pages = (q(['page'], 10).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]);
  out.countries = (q(['country'], 10).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]);
  out.devices = (q(['device'], 5).rows || []).map(r => [r.keys[0], r.clicks, r.impressions]);
  return out;
}

/* ===================== التحديث ===================== */
// يُستدعى من المؤقّت (كل ساعتين) ومن زر «تحديث الآن» في لوحة الإدارة (action: analytics)
function refreshAnalytics() {
  [['ga', fetchGa], ['gsc', fetchGsc]].forEach(function (p) {
    let data;
    try { data = p[1](); }
    catch (err) { console.error(p[0], err); data = { updatedAt: Date.now(), error: String(err.message || err).slice(0, 240) }; }
    if (data) db('analytics_ext/' + p[0], 'put', data);
  });
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
      console.log(k + ': ' + (d ? 'تم — ' + JSON.stringify(k === 'ga' ? d.overview : d.totals) : 'غير مُعدّ (أضف الخاصية في Script Properties)'));
    } catch (err) { console.log(k + ' خطأ: ' + (err.message || err)); }
  });
}
