/* ===================== فرص التدريب: جلب آلي لمنشورات ومنافسات تبحث عن مدربين =====================
 * يعمل يومياً (مشغّل زمني) أو بطلب «جلب الآن» من لوحة الإدارة (الإجراء opps). يضع النتائج في oppInbox/ (للإدارة فقط)،
 * ولا يصل شيء للمدربين إلا بعد اعتماد الإدارة (ينتقل إلى opportunities/).
 *
 * المصادر (مشروعة، دون الجلب من المنصات المغلقة):
 *  1) Google Custom Search API: يبحث في الإنترنت العام (وتظهر فيه منشورات عامة من لينكدإن وإكس وغيرها تفهرسها Google).
 *     خصائص السكربت (Project Settings ← Script properties): CSE_KEY (مفتاح API) و CSE_CX (معرّف محرك البحث، وفعّل فيه «البحث في الويب بأكمله»).
 *  2) منصة اعتماد (منافسات التدريب): يحاول قراءة قائمة المنافسات العامة للزوار. إن حظرت الواجهة الطلب سُجّل ذلك في السجل ولا يتعطل بقية الجلب.
 * إعدادات العبارات تُحفظ من لوحة الإدارة في settings/opps. */

const OPP_DEFAULT_QUERIES = [
  '"مطلوب مدرب" السعودية', '"نبحث عن مدرب" دورة تدريبية', '"نبحث عن مدربين" السعودية', '"مطلوب مدربين" دورات',
  '"طلب عروض" تدريب السعودية', 'site:linkedin.com/posts "نبحث عن مدرب"', 'site:x.com "مطلوب مدرب"'
];
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
        if (r.getResponseCode() !== 200) { log.push('بحث «' + q + '»: ' + r.getResponseCode()); return; }
        (JSON.parse(r.getContentText()).items || []).forEach(it => {
          if (!/^https:\/\//.test(it.link || '') || OWN_HOST.test(it.link)) return;
          const img = it.pagemap && it.pagemap.cse_image && it.pagemap.cse_image[0] && it.pagemap.cse_image[0].src;
          found.push({ title: String(it.title || '').slice(0, 200), url: String(it.link).slice(0, 500), desc: String(it.snippet || '').replace(/\s+/g, ' ').slice(0, 600), site: oppHost(it.link), img: /^https:\/\//.test(img || '') ? String(img).slice(0, 500) : '', kind: 'post', src: 'google', q: q.slice(0, 80) });
        });
      } catch (e) { log.push('بحث «' + q + '»: ' + e.message); }
    });
  } else log.push('لم تُضبط CSE_KEY وCSE_CX في خصائص السكربت: تخطّي بحث Google');
  if (set.etimad !== false) {
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
