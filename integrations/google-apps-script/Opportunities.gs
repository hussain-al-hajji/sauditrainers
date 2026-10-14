/* ===================== فرص التدريب: جلب آلي لمنشورات ومنافسات تبحث عن مدربين =====================
 * يعمل يومياً (مشغّل زمني) أو بطلب «جلب الآن» من لوحة الإدارة (الإجراء opps). يضع النتائج في oppInbox/ (للإدارة فقط)،
 * ولا يصل شيء للمدربين إلا بعد اعتماد الإدارة (ينتقل إلى opportunities/).
 *
 * المصادر (مشروعة، دون الجلب من المنصات المغلقة):
 *  0) (الموصى به الآن) تنبيهات Google عبر RSS + أخبار Google: بلا مفاتيح. واجهة Custom Search JSON أُغلقت عن المشاريع الجديدة (PERMISSION_DENIED).
 *  1) Google Custom Search API (اختياري، للحسابات التي تملك صلاحيتها): يبحث في الإنترنت العام (وتظهر فيه منشورات عامة من لينكدإن وإكس وغيرها تفهرسها Google).
 *     خصائص السكربت (Project Settings ← Script properties): CSE_KEY (مفتاح API) و CSE_CX (معرّف محرك البحث، وفعّل فيه «البحث في الويب بأكمله»).
 *  2) منصة اعتماد (منافسات التدريب): يحاول قراءة قائمة المنافسات العامة للزوار. إن حظرت الواجهة الطلب سُجّل ذلك في السجل ولا يتعطل بقية الجلب.
 * إعدادات العبارات تُحفظ من لوحة الإدارة في settings/opps. */

const OPP_DEFAULT_QUERIES = [
  '"مطلوب مدرب" السعودية', '"نبحث عن مدرب" دورة تدريبية', '"نبحث عن مدربين" السعودية', '"مطلوب مدربين" دورات',
  '"طلب عروض" تدريب السعودية', 'site:linkedin.com/posts "نبحث عن مدرب"', 'site:x.com "مطلوب مدرب"'
];
const OPP_DEFAULT_JOBS = ['مدرب', 'مدرب سعودي', 'trainer Saudi Arabia', 'corporate trainer'];
const OPP_DEFAULT_ETIMAD = ['تدريب', 'دورات تدريبية', 'برنامج تدريبي'];

const oppId = url => 'o' + Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, url).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('').slice(0, 18);
const oppHost = url => { const m = String(url).match(/^https?:\/\/(?:www\.)?([^\/?#]+)/i); return m ? m[1].slice(0, 80) : ''; };
const OWN_HOST = /sauditrainers\.sa|hussain-al-hajji\.github\.io/i;

function collectOpps() {
  const set = db('settings/opps') || {}, queries = (set.queries && set.queries.length ? set.queries : OPP_DEFAULT_QUERIES).filter(Boolean).slice(0, 12);
  const known = Object.assign({}, db('oppInbox') || {}, db('opportunities') || {});
  const found = []; let log = [];
  const key = PROPS.getProperty('CSE_KEY'), cx = PROPS.getProperty('CSE_CX');
  if (key && cx) {
    queries.forEach(q => {
      try {
        const r = UrlFetchApp.fetch('https://www.googleapis.com/customsearch/v1?key=' + encodeURIComponent(key) + '&cx=' + encodeURIComponent(cx) + '&q=' + encodeURIComponent(q) + '&num=10&dateRestrict=w2&gl=sa&lr=lang_ar', { muteHttpExceptions: true });
        if (r.getResponseCode() !== 200) { let why = ''; try { const e = JSON.parse(r.getContentText()).error || {}; why = (e.status || '') + ' ' + (e.message || '') + ' ' + ((e.errors || [])[0] || {}).reason; } catch (x) { why = r.getContentText().slice(0, 150); } log.push('بحث «' + q.slice(0, 25) + '»: ' + r.getResponseCode() + ' ' + String(why).slice(0, 220)); if (r.getResponseCode() === 403 || r.getResponseCode() === 429) throw new Error('STOP'); return; }
        (JSON.parse(r.getContentText()).items || []).forEach(it => {
          if (!/^https:\/\//.test(it.link || '') || OWN_HOST.test(it.link)) return;
          const img = it.pagemap && it.pagemap.cse_image && it.pagemap.cse_image[0] && it.pagemap.cse_image[0].src;
          found.push({ title: String(it.title || '').slice(0, 200), url: String(it.link).slice(0, 500), desc: String(it.snippet || '').replace(/\s+/g, ' ').slice(0, 600), site: oppHost(it.link), img: /^https:\/\//.test(img || '') ? String(img).slice(0, 500) : '', kind: 'post', src: 'google', q: q.slice(0, 80) });
        });
      } catch (e) { if (e.message !== 'STOP') log.push('بحث «' + q.slice(0, 25) + '»: ' + e.message); }
    });
  } else log.push('لم تُضبط CSE_KEY وCSE_CX في خصائص السكربت: تخطّي بحث Google');
  // تنبيهات Google (خلاصات RSS يضعها المشرف) وأخبار Google: بلا مفاتيح، وتعمل من خوادم Google
  (set.feeds || []).filter(u => /^https:\/\/www\.google\.[a-z.]+\/alerts\/feeds\//.test(u)).slice(0, 10).forEach(u => {
    try { fetchFeed(u, 'alert', '').forEach(x => found.push(x)); } catch (e) { log.push('تنبيه Google: ' + String(e.message).slice(0, 120)); }
  });
  if (set.gnews === true) {   // معطّل افتراضياً: أخبار Google تعيد أخبار مدربين لا إعلانات بحث عن مدربين
    queries.slice(0, 6).forEach(q => {
      try { fetchFeed('https://news.google.com/rss/search?q=' + encodeURIComponent(q.replace(/^site:\S+\s*/, '')) + '+when:14d&hl=ar&gl=SA&ceid=SA:ar', 'news', q).forEach(x => found.push(x)); } catch (e) { log.push('أخبار Google «' + q.slice(0, 20) + '»: ' + String(e.message).slice(0, 100)); }
    });
  }
  // وظائف Google Jobs عبر SerpApi (خدمة وسيطة مدفوعة/مجانية محدودة؛ Google Jobs لا يوفّر واجهة رسمية). خاصية السكربت: SERPAPI_KEY
  if (set.jobs === true) {
    const jk = PROPS.getProperty('SERPAPI_KEY');
    if (!jk) log.push('وظائف Google: لم تُضبط SERPAPI_KEY في خصائص السكربت');
    else (set.jobQueries && set.jobQueries.length ? set.jobQueries : OPP_DEFAULT_JOBS).slice(0, 4).forEach(q => {
      try { parseJobs(fetchJobsRaw(q, jk), q).forEach(x => found.push(x)); } catch (e) { log.push('وظائف Google «' + String(q).slice(0, 20) + '»: ' + String(e.message).slice(0, 140)); }
    });
  }
  if (set.etimad === true) {   // معطّل افتراضياً: اعتماد يحجب خوادم Google (Address unavailable)
    (set.etimadTerms && set.etimadTerms.length ? set.etimadTerms : OPP_DEFAULT_ETIMAD).slice(0, 6).forEach(term => {
      try { fetchEtimad(term).forEach(x => found.push(x)); } catch (e) { log.push('اعتماد «' + term + '»: ' + e.message); }
    });
  }
  let added = 0; const seen = {};
  found.forEach(f => {
    const id = oppId(f.url); if (known[id] || seen[id]) return; seen[id] = 1;
    db('oppInbox/' + id, 'put', Object.assign({ id: id, ts: Date.now(), status: 'new' }, f)); added++;
  });
  db('settings/opps/lastRun', 'put', { ts: Date.now(), added: added, found: found.length, log: log.slice(0, 8) });
  console.log('فرص التدريب: ' + found.length + ' نتيجة، ' + added + ' جديدة. ' + log.join(' | '));
}

// SerpApi: محرك google_jobs (بحث وظائف Google بحسب البلد والعبارة)
function fetchJobsRaw(q, key) {
  const url = 'https://serpapi.com/search.json?engine=google_jobs&q=' + encodeURIComponent(q) + '&location=' + encodeURIComponent('Saudi Arabia') + '&gl=sa&hl=ar&api_key=' + encodeURIComponent(key);
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const j = JSON.parse(r.getContentText() || '{}');
  if (r.getResponseCode() !== 200 && !j.jobs_results) throw new Error((j.error || ('HTTP ' + r.getResponseCode())));
  return j;
}
// تحويل نتائج Google Jobs إلى عناصر الوارد (دالة نقيّة قابلة للاختبار)
function parseJobs(j, q) {
  return (j.jobs_results || []).map(x => {
    const link = (x.apply_options && x.apply_options[0] && x.apply_options[0].link) || (x.related_links && x.related_links[0] && x.related_links[0].link) || '';
    if (!/^https:\/\/[^\s"'<>)]+$/.test(link) || link.length > 500 || !x.title) return null;
    const ext = x.detected_extensions || {}, meta = [x.location, ext.schedule_type, ext.posted_at].filter(Boolean).join(' · ');
    const o = { title: String(x.title).slice(0, 200), url: link, desc: ((meta ? meta + '\n' : '') + String(x.description || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')).trim().slice(0, 600), org: String(x.company_name || '').slice(0, 160), site: String(x.via || 'Google Jobs').replace(/^(via|عبر)\s+/i, '').slice(0, 80), kind: 'post', src: 'jobs', q: String(q || '').slice(0, 80) };
    if (/^https:\/\//.test(x.thumbnail || '')) o.img = String(x.thumbnail).slice(0, 500);
    return o;
  }).filter(Boolean);
}

// قراءة خلاصة Atom (تنبيهات Google) أو RSS (أخبار Google)
const stripHtml = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function fetchFeed(url, src, q) {
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (r.getResponseCode() !== 200) throw new Error('HTTP ' + r.getResponseCode());
  const root = XmlService.parse(r.getContentText()).getRootElement(), out = [];
  const kids = (el, name) => el.getChildren().filter(c => c.getName() === name);
  const txt = (el, name) => { const c = kids(el, name)[0]; return c ? c.getText() : ''; };
  const entries = root.getName() === 'feed' ? kids(root, 'entry') : ((kids(root, 'channel')[0] || root).getChildren('item'));
  entries.slice(0, 25).forEach(e => {
    let link = root.getName() === 'feed' ? ((kids(e, 'link')[0] || { getAttribute: () => null }).getAttribute('href') || { getValue: () => '' }).getValue() : txt(e, 'link');
    const m = String(link).match(/[?&]url=([^&]+)/); if (m) { try { link = decodeURIComponent(m[1]); } catch (x) { /* يبقى الرابط */ } }
    link = String(link).replace(/&amp;/g, '&');
    if (!/^https:\/\//.test(link) || OWN_HOST.test(link) || link.length > 500) return;
    const title = stripHtml(txt(e, 'title')).slice(0, 200); if (!title) return;
    out.push({ title: title, url: link, desc: stripHtml(txt(e, 'content') || txt(e, 'summary') || txt(e, 'description')).slice(0, 600), site: oppHost(link) || 'news.google.com', kind: 'post', src: src, q: String(q || '').slice(0, 80) });
  });
  return out;
}

// قائمة المنافسات العامة في اعتماد (واجهة الزوار). الحقول المتوقعة: tenderName, agencyName, tenderIdString, lastOfferPresentationDate
function fetchEtimad(term) {
  const url = 'https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync?PageSize=20&PageNumber=1&SearchText=' + encodeURIComponent(term) + '&IsSearch=true';
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json, text/plain, */*', Referer: 'https://tenders.etimad.sa/Tender/AllTendersForVisitor' } });
  if (r.getResponseCode() !== 200) throw new Error('HTTP ' + r.getResponseCode());
  const j = JSON.parse(r.getContentText()), rows = j.data || j.Data || [];
  return rows.map(t => {
    const idStr = t.tenderIdString || t.TenderIdString; if (!idStr || !(t.tenderName || t.TenderName)) return null;
    const dl = Date.parse(String(t.lastOfferPresentationDate || t.LastOfferPresentationDate || '').replace(' ', 'T'));
    const o = { title: String(t.tenderName || t.TenderName).slice(0, 200), url: ('https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=' + encodeURIComponent(idStr)).slice(0, 500), desc: String(t.tenderActivityName || t.TenderActivityName || t.tenderTypeName || '').slice(0, 300), org: String(t.agencyName || t.AgencyName || '').slice(0, 160), site: 'tenders.etimad.sa', kind: 'tender', src: 'etimad', q: term };
    if (dl) o.deadline = dl;
    return o;
  }).filter(Boolean);
}

// شغّلها مرة واحدة يدوياً لإنشاء المشغّل اليومي
function setupOppsTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'collectOpps').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('collectOpps').timeBased().everyDays(1).atHour(6).create();
  console.log('تم إنشاء مشغّل فرص التدريب (يومياً 6 صباحاً)');
}
function testOpps() { collectOpps(); }
