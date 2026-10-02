/**
 * أتمتة منصة «مدرّبون سعوديّون» — Google Apps Script
 * يعمل من حساب المنصة (trainers.sa3@gmail.com) مجاناً:
 *  1) يرسل بريداً للمدرب (ونسخة للإدارة) عند وصول طلب تواصل من جهة تدريبية، من بريد المنصة.
 *  2) ينبّه الإدارة بالبريد عند وصول طلب تسجيل أو «اطلب مدرباً».
 *  3) ينشر منشورات البطاقات المجدولة في إكس ولينكدإن وإنستقرام في موعدها (كل 5 دقائق).
 *
 * لا يستقبل من الموقع إلا رقم السجل؛ ويقرأ التفاصيل من قاعدة البيانات بصلاحية حساب المنصة،
 * فلا يمكن لأحد استخدامه لإرسال بريد بمحتوى من عنده. مفاتيح المنصات تُحفظ في Script Properties فقط.
 * طريقة الإعداد: README.md في المجلد نفسه.
 */

const CFG = {
  DB_URL: 'https://sauditrainers-6c989-default-rtdb.firebaseio.com', // databaseURL من js/config.js
  ROOT: 'sauditrainers',                                       // dbRoot
  SITE: 'https://www.sauditrainers.sa/',                       // رابط المنصة
  ADMIN_EMAIL: 'trainers.sa3@gmail.com',                       // بريد الإدارة (نسخة من كل طلب)
  FROM_NAME: 'منصة مدرّبون سعوديّون',
  PLATFORM_WHATSAPP: '966562391007'
};
const PROPS = PropertiesService.getScriptProperties();

/* ===================== نقطة الاستقبال ===================== */
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out('bad request'); }
  const id = String(body.id || '').replace(/[^\w-]/g, '').slice(0, 40);
  const lock = LockService.getScriptLock();
  lock.tryLock(25000);
  try {
    if (body.action === 'lead' && id) sendLeadEmail(id);
    else if (body.action === 'request' && id) notifyAdmin('requests', id);
    else if (body.action === 'application' && id) { notifyAdmin('applications', id); sendReceivedEmail(id); }
    else if (body.action === 'outbox' && id) sendOutbox(id);
    else if (body.action === 'publish' && id) publishPost(id);
    else if (body.action === 'ping') ping();
  } catch (err) {
    console.error(err);
  } finally {
    lock.releaseLock();
  }
  return out('ok');
}
function doGet() { return out('sauditrainers automation is running'); }
const out = t => ContentService.createTextOutput(t);

/* ===================== قاعدة البيانات (REST بصلاحية حساب المنصة) ===================== */
function db(path, method, payload) {
  const url = `${CFG.DB_URL}/${CFG.ROOT}/${path}.json?access_token=${encodeURIComponent(ScriptApp.getOAuthToken())}`;
  const opt = { method: method || 'get', muteHttpExceptions: true, contentType: 'application/json' };
  if (payload !== undefined) opt.payload = JSON.stringify(payload);
  const res = UrlFetchApp.fetch(url, opt);
  if (res.getResponseCode() >= 300) throw new Error(`DB ${res.getResponseCode()}: ${res.getContentText().slice(0, 300)}`);
  return JSON.parse(res.getContentText() || 'null');
}

/* ===================== البريد ===================== */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MODES = { onsite: 'حضوري', online: 'عن بُعد', hybrid: 'مدمج' };

function emailHtml(title, intro, rows, cta) {
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#F7F9F3;padding:24px">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #E1E8DC">
      <div style="background:#005430;padding:22px;text-align:center"><img src="${CFG.SITE}assets/logo-cream.png" alt="مدرّبون سعوديّون" height="56"></div>
      <div style="padding:24px;color:#0D2418;line-height:1.8">
        <h2 style="margin:0 0 8px;color:#005430;font-size:20px">${esc(title)}</h2>
        <p style="margin:0 0 16px">${intro}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.filter(r => r[1]).map(r => `<tr><td style="padding:8px;border-bottom:1px solid #EEF3E5;color:#6A7F72;width:34%">${esc(r[0])}</td><td style="padding:8px;border-bottom:1px solid #EEF3E5">${esc(r[1])}</td></tr>`).join('')}</table>
        ${cta ? `<p style="text-align:center;margin:22px 0 4px"><a href="${cta[1]}" style="background:#005430;color:#EEF3E5;padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:bold">${esc(cta[0])}</a></p>` : ''}
      </div>
      <div style="background:#EEF3E5;padding:12px;text-align:center;font-size:12px;color:#3A5244">${esc(CFG.FROM_NAME)} · ${CFG.SITE.replace(/^https?:\/\//, '').replace(/\/$/, '')}</div>
    </div></div>`;
}

function sendLeadEmail(id) {
  const lead = db(`leads/${id}`);
  if (!lead || lead.emailedAt || Date.now() - (lead.ts || 0) > 3 * 864e5) return;
  const trainer = db(`trainers/${lead.trainerId}`) || {};
  const priv = db(`private/${lead.trainerId}`) || {};
  const rows = [['الجهة', lead.org], ['المسؤول', lead.person], ['موضوع البرنامج', lead.topic], ['الموعد المتوقع', lead.when], ['طريقة التقديم', MODES[lead.mode] || ''], ['التفاصيل', lead.msg], ['جوال الجهة', lead.phone], ['بريد الجهة', lead.email]];
  const subject = `طلب تواصل جديد: ${lead.topic}`;
  const html = emailHtml(`مرحباً ${trainer.name || ''}`, 'وصلك طلب تواصل جديد من جهة تدريبية عبر بطاقتك في المنصة. يمكنك التواصل معهم مباشرة على بياناتهم أدناه:', rows, ['فتح لوحتي في المنصة', `${CFG.SITE}#/login`]);
  if (priv.email) {
    MailApp.sendEmail({ to: priv.email, cc: CFG.ADMIN_EMAIL, subject, htmlBody: html, name: CFG.FROM_NAME, replyTo: lead.email || CFG.ADMIN_EMAIL });
  } else {
    MailApp.sendEmail({ to: CFG.ADMIN_EMAIL, subject: `[لا يوجد بريد للمدرب ${trainer.name || lead.trainerId}] ${subject}`, htmlBody: html, name: CFG.FROM_NAME });
  }
  db(`leads/${id}`, 'patch', { emailedAt: Date.now() });
}

function notifyAdmin(kind, id) {
  const r = db(`${kind}/${id}`);
  if (!r || r.notifiedAt || Date.now() - (r.ts || 0) > 3 * 864e5) return;
  const isApp = kind === 'applications';
  const rows = isApp ? [['الاسم', r.name], ['اللقب', r.title], ['الجوال', r.phone], ['البريد', r.email], ['رقم الطلب', r.id]]
    : [['الجهة', r.org], ['المسؤول', r.person], ['الموضوع', r.topic], ['الجوال', r.phone], ['البريد', r.email], ['عدد المتدربين', r.size]];
  MailApp.sendEmail({ to: CFG.ADMIN_EMAIL, subject: isApp ? `طلب تسجيل مدرب جديد: ${r.name}` : `طلب مدرب جديد: ${r.topic}`, name: CFG.FROM_NAME,
    htmlBody: emailHtml(isApp ? 'طلب تسجيل جديد' : 'طلب جديد من جهة تدريبية', 'التفاصيل في لوحة الإدارة.', rows, ['فتح لوحة الإدارة', `${CFG.SITE}#/admin`]) });
  db(`${kind}/${id}`, 'patch', { notifiedAt: Date.now() });
}

/* ===================== رسائل مراحل طلب التسجيل ===================== */
// نص الاستلام الافتراضي (يطابق قالب «استلام الطلب» في js/data.js)، ويُستبدل بقالب الإدارة المحفوظ في settings/templates/received
const DEFAULT_RECEIVED = {
  subject: 'تأكيد استلام طلب تسجيلك — مدرّبون سعوديّون',
  body: 'السلام عليكم ورحمة الله وبركاته\n\n{name}،\n\nنشكر لك اهتمامك بالانضمام إلى منصة «مدرّبون سعوديّون».\nنؤكد استلام طلب تسجيلك برقم الطلب: {appId}، وهو الآن تحت الدراسة من فريق المنصة، وسنوافيك بالمستجدات على بريدك وجوالك.\n\nيمكنك متابعة حالة طلبك في أي وقت:\n{statusUrl}\n\nمع التحية،\nمنصة مدرّبون سعوديّون'
};
function fillTpl(text, vars) { return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? '' : String(vars[k]))).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\n{3,}/g, '\n\n').trim(); }
function plainMail(to, subject, body, cc) {
  MailApp.sendEmail({ to, cc: cc || '', subject, name: CFG.FROM_NAME, replyTo: CFG.ADMIN_EMAIL, body, htmlBody: emailHtml(subject, '', [], null).replace(/<p style="margin:0 0 16px"><\/p>/, `<div style="white-space:pre-wrap;margin:0 0 16px">${esc(body)}</div>`) });
}
// إشعار تلقائي للمسجّل فور تعبئة النموذج: تأكيد الاستلام وأن الطلب تحت الدراسة
function sendReceivedEmail(id) {
  const a = db(`applications/${id}`);
  if (!a || a.receivedEmailAt || !a.email || Date.now() - (a.ts || 0) > 3 * 864e5) return;
  const t = Object.assign({}, DEFAULT_RECEIVED, db('settings/templates/received') || {});
  const vars = { name: a.name, first: String(a.name || '').replace(/^(د|م|أ)\.\s*/, '').split(/\s+/)[0], appId: a.id, statusUrl: `${CFG.SITE}#/status?id=${a.id}` };
  plainMail(a.email, fillTpl(t.subject, vars), fillTpl(t.body, vars));
  db(`applications/${id}`, 'patch', { receivedEmailAt: Date.now() });
}
// بريد مُعدّ من لوحة الإدارة (القبول المبدئي والنهائي): يُكتب في outbox ثم يُرسل ويُمسح نصه (قد يحوي رمز الدخول)
function sendOutbox(id) {
  const o = db(`outbox/${id}`);
  if (!o || o.sentAt || !o.to || Date.now() - (o.ts || 0) > 864e5) return;
  plainMail(o.to, o.subject, o.body, CFG.ADMIN_EMAIL);
  db(`outbox/${id}`, 'patch', { sentAt: Date.now(), body: '(أُرسل — حُذف النص)', subject: o.subject });
}

/* ===================== النشر في وسائل التواصل ===================== */
function connected() {
  const has = k => !!PROPS.getProperty(k);
  return { x: has('X_API_KEY') && has('X_API_SECRET') && has('X_ACCESS_TOKEN') && has('X_ACCESS_SECRET'), linkedin: has('LI_ACCESS_TOKEN') && has('LI_AUTHOR_URN'), instagram: has('IG_USER_ID') && has('IG_ACCESS_TOKEN') };
}
function ping() { db('settings/automation', 'patch', { lastPing: Date.now(), platforms: connected() }); }

// يُشغَّل كل 5 دقائق (setupTriggers)
function publishDue() {
  const now = Date.now();
  const posts = db('social') || {};
  Object.keys(posts).map(k => posts[k]).filter(p => p && p.status === 'scheduled' && p.scheduledAt <= now).sort((a, b) => a.scheduledAt - b.scheduledAt).slice(0, 4)
    .forEach(p => { try { publishPost(p.id); } catch (err) { console.error(err); } });
  db('settings/automation', 'patch', { lastRun: now, platforms: connected() });
}

function publishPost(id) {
  const p = db(`social/${id}`);
  if (!p || p.status !== 'scheduled') return;
  const conn = connected();
  const data = db(`socialImages/${id}`);
  const blob = data ? Utilities.newBlob(Utilities.base64Decode(String(data).split(',')[1]), 'image/jpeg', `card-${id}.jpg`) : null;
  const results = Object.assign({}, p.results || {});
  const chosen = Object.keys(p.platforms || {}).filter(k => p.platforms[k]);
  chosen.forEach(k => {
    if (results[k] && results[k].ok) return;
    if (!conn[k]) { results[k] = { ok: false, ts: Date.now(), err: 'الحساب غير مربوط — انشره يدوياً من لوحة الإدارة' }; return; }
    try {
      const text = (p.text && p.text[k]) || '';
      const url = k === 'x' ? postX(text, blob) : k === 'linkedin' ? postLinkedIn(text, blob) : postInstagram(text, blob);
      results[k] = { ok: true, ts: Date.now(), url: url || '' };
    } catch (err) {
      results[k] = { ok: false, ts: Date.now(), err: String(err.message || err).slice(0, 300) };
    }
  });
  const ok = chosen.filter(k => results[k] && results[k].ok).length;
  db(`social/${id}`, 'patch', { results, status: ok === chosen.length ? 'published' : ok ? 'partial' : 'failed', publishedAt: Date.now() });
}

/* ---------- إكس (X API v2 بتوقيع OAuth 1.0a) ----------
 * Script Properties: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET (تطبيق بصلاحية Read and Write) */
function pctEncode(s) { return encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()); }
function oauth1(method, url, params) {
  const o = {
    oauth_consumer_key: PROPS.getProperty('X_API_KEY'), oauth_nonce: Utilities.getUuid().replace(/-/g, ''), oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)), oauth_token: PROPS.getProperty('X_ACCESS_TOKEN'), oauth_version: '1.0'
  };
  const all = Object.assign({}, params || {}, o);
  const base = [method.toUpperCase(), pctEncode(url), pctEncode(Object.keys(all).sort().map(k => `${pctEncode(k)}=${pctEncode(all[k])}`).join('&'))].join('&');
  const key = `${pctEncode(PROPS.getProperty('X_API_SECRET'))}&${pctEncode(PROPS.getProperty('X_ACCESS_SECRET'))}`;
  o.oauth_signature = Utilities.base64Encode(Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1, base, key));
  return 'OAuth ' + Object.keys(o).sort().map(k => `${pctEncode(k)}="${pctEncode(o[k])}"`).join(', ');
}
function postX(text, blob) {
  let mediaId = null;
  if (blob) {
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const params = { media_data: Utilities.base64Encode(blob.getBytes()) };
    const r = UrlFetchApp.fetch(url, { method: 'post', payload: params, headers: { Authorization: oauth1('POST', url, params) }, muteHttpExceptions: true });
    if (r.getResponseCode() < 300) mediaId = JSON.parse(r.getContentText()).media_id_string;
    else console.warn('X media upload', r.getResponseCode(), r.getContentText());
  }
  const url = 'https://api.x.com/2/tweets';
  const body = { text };
  if (mediaId) body.media = { media_ids: [mediaId] };
  const r = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), headers: { Authorization: oauth1('POST', url, {}) }, muteHttpExceptions: true });
  if (r.getResponseCode() >= 300) throw new Error(`X ${r.getResponseCode()}: ${r.getContentText().slice(0, 200)}`);
  return `https://x.com/i/web/status/${JSON.parse(r.getContentText()).data.id}`;
}

/* ---------- لينكدإن: النشر باسم صفحة الشركة (Page) عبر Posts API ----------
 * صفحة المنصة: https://sa.linkedin.com/company/saudi-trainers-sa
 * Script Properties: LI_ACCESS_TOKEN (صلاحية w_organization_social من مشرف الصفحة، ويتطلب منتج Community Management API)،
 * LI_AUTHOR_URN بصيغة urn:li:organization:رقم_الصفحة (رقم الصفحة يظهر في رابط لوحة إدارتها). اختياري: LI_VERSION بصيغة YYYYMM (الافتراضي 202501).
 * التوكن ينتهي بعد 60 يوماً ويُجدَّد. */
function liText(s) {
  // صيغة little text: تُهرَّب الرموز المحجوزة، والوسوم تُكتب بصيغة hashtag
  const escd = String(s).replace(/[\\|{}@\[\]()<>*_~]/g, m => '\\' + m);
  return escd.replace(/#([^\s#]+)/g, (m, tag) => `{hashtag|\\#|${tag}}`);
}
function postLinkedIn(text, blob) {
  const tok = PROPS.getProperty('LI_ACCESS_TOKEN'), author = PROPS.getProperty('LI_AUTHOR_URN');
  if (!/^urn:li:organization:\d+$/.test(author || '')) throw new Error('LI_AUTHOR_URN يجب أن يكون صفحة الشركة: urn:li:organization:رقم_الصفحة');
  const H = { Authorization: `Bearer ${tok}`, 'LinkedIn-Version': PROPS.getProperty('LI_VERSION') || '202501', 'X-Restli-Protocol-Version': '2.0.0' };
  let image = null;
  if (blob) {
    const init = UrlFetchApp.fetch('https://api.linkedin.com/rest/images?action=initializeUpload', { method: 'post', contentType: 'application/json', headers: H, payload: JSON.stringify({ initializeUploadRequest: { owner: author } }), muteHttpExceptions: true });
    if (init.getResponseCode() < 300) {
      const v = JSON.parse(init.getContentText()).value;
      const up = UrlFetchApp.fetch(v.uploadUrl, { method: 'put', headers: { Authorization: `Bearer ${tok}` }, contentType: 'image/jpeg', payload: blob.getBytes(), muteHttpExceptions: true });
      if (up.getResponseCode() < 300) image = v.image;
    } else console.warn('LinkedIn image init', init.getContentText());
  }
  const body = { author, commentary: liText(text), visibility: 'PUBLIC', distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: 'PUBLISHED', isReshareDisabledByAuthor: false };
  if (image) body.content = { media: { id: image, altText: 'البطاقة التعريفية للمدرب' } };
  const r = UrlFetchApp.fetch('https://api.linkedin.com/rest/posts', { method: 'post', contentType: 'application/json', headers: H, payload: JSON.stringify(body), muteHttpExceptions: true });
  if (r.getResponseCode() >= 300) throw new Error(`LinkedIn ${r.getResponseCode()}: ${r.getContentText().slice(0, 200)}`);
  const h = r.getHeaders(); const urn = h['x-restli-id'] || h['X-RestLi-Id'] || h['x-linkedin-id'];
  return urn ? `https://www.linkedin.com/feed/update/${urn}` : '';
}

/* ---------- إنستقرام (Instagram Graph API — حساب احترافي) ----------
 * Script Properties: IG_USER_ID، IG_ACCESS_TOKEN (صلاحية instagram_content_publish)، اختياري IG_GRAPH_VERSION (الافتراضي v21.0)
 * إنستقرام يجلب الصورة من رابط عام، فتُرفع مؤقتاً إلى Drive (مشاركة عامة) ثم تُحذف بعد النشر. */
function postInstagram(text, blob) {
  if (!blob) throw new Error('إنستقرام يتطلب صورة');
  const uid = PROPS.getProperty('IG_USER_ID'), tok = PROPS.getProperty('IG_ACCESS_TOKEN'), ver = PROPS.getProperty('IG_GRAPH_VERSION') || 'v21.0';
  const file = DriveApp.createFile(blob.setName(`sauditrainers-${Date.now()}.jpg`));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  try {
    const imageUrl = `https://lh3.googleusercontent.com/d/${file.getId()}=w1080`;
    const g = (path, params) => {
      const r = UrlFetchApp.fetch(`https://graph.facebook.com/${ver}/${path}`, { method: 'post', payload: Object.assign({ access_token: tok }, params), muteHttpExceptions: true });
      const j = JSON.parse(r.getContentText() || '{}');
      if (r.getResponseCode() >= 300 || j.error) throw new Error(`Instagram: ${(j.error && j.error.message) || r.getContentText().slice(0, 200)}`);
      return j;
    };
    const container = g(`${uid}/media`, { image_url: imageUrl, caption: text });
    // انتظار تجهيز الوسائط
    for (let i = 0; i < 10; i++) {
      const st = JSON.parse(UrlFetchApp.fetch(`https://graph.facebook.com/${ver}/${container.id}?fields=status_code&access_token=${encodeURIComponent(tok)}`, { muteHttpExceptions: true }).getContentText() || '{}');
      if (st.status_code === 'FINISHED') break;
      if (st.status_code === 'ERROR') throw new Error('Instagram: تعذّر تجهيز الصورة');
      Utilities.sleep(2000);
    }
    const pub = g(`${uid}/media_publish`, { creation_id: container.id });
    const link = JSON.parse(UrlFetchApp.fetch(`https://graph.facebook.com/${ver}/${pub.id}?fields=permalink&access_token=${encodeURIComponent(tok)}`, { muteHttpExceptions: true }).getContentText() || '{}');
    return link.permalink || '';
  } finally {
    file.setTrashed(true);
  }
}

/* ===================== التهيئة ===================== */
// شغّلها مرة واحدة من المحرر: تنشئ مؤقّت النشر كل 5 دقائق وتختبر الاتصال بالقاعدة
function setupTriggers() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'publishDue').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('publishDue').timeBased().everyMinutes(5).create();
  ping();
  console.log('تم: مؤقّت النشر يعمل، والاتصال بقاعدة البيانات سليم', JSON.stringify(connected()));
}
