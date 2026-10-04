/**
 * رسائل البريد فقط — منصة «مدرّبون سعوديّون» (Google Apps Script)
 * يعمل من حساب المنصة trainers.sa3@gmail.com ويرسل:
 *  - تأكيد استلام طلب التسجيل للمسجّل (تلقائياً)
 *  - القبول المبدئي والقبول النهائي (من أزرار «بريد» في لوحة الإدارة)
 *  - طلب التواصل: إشعار للمدرب على بريده + إشعار مستقل للإدارة بنص الطلب، وتنبيه الإدارة بالطلبات الجديدة
 * هذا الملف بدون النشر الاجتماعي. إن أردت النشر استخدم Code.gs الكامل بدلاً منه.
 */

const CFG = {
  DB_URL: 'https://sauditrainers-6c989-default-rtdb.firebaseio.com', // databaseURL من js/config.js
  ROOT: 'sauditrainers',                                       // dbRoot
  SITE: 'https://sauditrainers.sa/',                       // الرابط الرسمي الذي يراه المستلمون في الرسائل
  ASSETS: 'https://sauditrainers.sa/', // مصدر صورة الشعار في البريد (الدومين الرسمي)
  ADMIN_EMAIL: 'trainers.sa3@gmail.com',                       // بريد الإدارة (إشعار مستقل لكل طلب)
  FROM_NAME: 'منصة مدرّبون سعوديّون',
  PLATFORM_WHATSAPP: '966562391007'
};


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
    else if (body.action === 'campaign' && id) sendCampaign(id);
    else if (body.action === 'analytics') refreshAnalyticsThrottled();
    else if (body.action === 'snapshot') monthlySnapshot();
    else if (body.action === 'backfill') backfillMonthly();
    else if (body.action === 'ping') ping();
  } catch (err) {
    console.error(err);
  } finally {
    lock.releaseLock();
  }
  return out('ok');
}
// صورة عامة من Drive كـ data URL (CORS مفتوح) لتصدير البطاقة في Safari: ?img=<معرّف الملف>
function doGet(e) {
  const id = e && e.parameter && e.parameter.img;
  if (!id) return out('sauditrainers mail automation is running');
  if (!/^[\w-]{10,}$/.test(id)) return out('');
  try {
    const r = UrlFetchApp.fetch('https://lh3.googleusercontent.com/d/' + id + '=w900', { muteHttpExceptions: true, followRedirects: true });
    const ct = String(r.getHeaders()['Content-Type'] || r.getHeaders()['content-type'] || '');
    if (r.getResponseCode() !== 200 || !/^image\//.test(ct)) return out('');
    return out('data:' + ct.split(';')[0] + ';base64,' + Utilities.base64Encode(r.getContent()));
  } catch (err) { return out(''); }
}
const out = t => ContentService.createTextOutput(t);
function ping() { db('settings/automation', 'patch', { lastPing: Date.now(), quota: MailApp.getRemainingDailyQuota() }); }

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
      <div style="background:#005430;padding:22px;text-align:center"><img src="${CFG.ASSETS}assets/logo-cream.png" alt="مدرّبون سعوديّون" height="56"></div>
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
  // 1) إشعار المدرب على بريده بمحتوى الطلب وبيانات الجهة
  if (priv.email) {
    const html = emailHtml(`مرحباً ${trainer.name || ''}`, 'وصلك طلب تواصل جديد من جهة تدريبية عبر بطاقتك في المنصة. يمكنك التواصل معهم مباشرة على بياناتهم أدناه:', rows, ['فتح لوحتي في المنصة', `${CFG.SITE}#/login`]);
    MailApp.sendEmail({ to: priv.email, subject, htmlBody: html, name: CFG.FROM_NAME, replyTo: lead.email || CFG.ADMIN_EMAIL });
  }
  // 2) إشعار منفصل للإدارة على البريد الرسمي بنص الطلب نفسه وبيانات الجهة والمدرب
  const adminRows = [['المدرب المطلوب', `${trainer.name || lead.trainerName || lead.trainerId} (${trainer.code || ''})`], ['بريد المدرب', priv.email || 'غير مسجّل — لم يصله إشعار'], ...rows];
  MailApp.sendEmail({ to: CFG.ADMIN_EMAIL, subject: `[طلب تواصل مع مدرب] ${subject}`, name: CFG.FROM_NAME, replyTo: lead.email || CFG.ADMIN_EMAIL,
    htmlBody: emailHtml('طلب تواصل جديد مع مدرب', 'وصل طلب تواصل من جهة تدريبية، وأُرسل إشعار للمدرب بالمحتوى نفسه.', adminRows, ['فتح لوحة الإدارة', `${CFG.SITE}#/admin`]) });
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
  if (!a || a.receivedEmailAt || !a.email || Date.now() - (a.ts || 0) > 6 * 3600e3) return; // لا يُرسل تأكيد متأخر (أكثر من 6 ساعات)
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


/* ===================== شبكة أمان: تعالج أي طلب لم يصله إشعار (كل 5 دقائق) ===================== */
// تضمن وصول الإشعارات حتى لو لم يصل نداء المتصفح للسكربت (مثلاً حاجب إعلانات أو انقطاع)
function sweepPending() {
  const recent = r => r && Date.now() - (r.ts || 0) <= 3 * 864e5;
  const each = (kind, fn) => { const all = db(kind) || {}; Object.keys(all).forEach(k => { try { fn(k, all[k]); } catch (err) { console.error(kind, k, err); } }); };
  each('leads', (id, r) => { if (recent(r) && !r.emailedAt) sendLeadEmail(id); });
  each('requests', (id, r) => { if (recent(r) && !r.notifiedAt) notifyAdmin('requests', id); });
  each('applications', (id, r) => { if (recent(r)) { if (!r.notifiedAt) notifyAdmin('applications', id); if (!r.receivedEmailAt && r.email) sendReceivedEmail(id); } });
  try { continueCampaigns(); } catch (err) { console.error('campaigns', err); }
}

// اختبار يدوي: يعالج آخر طلب تواصل ويُظهر أي خطأ في السجل (دون ابتلاعه)
function testLastLead() {
  const all = db('leads') || {};
  const last = Object.keys(all).map(k => all[k]).sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
  if (!last) { console.log('لا توجد طلبات تواصل في القاعدة'); return; }
  console.log('آخر طلب: ' + last.id + ' | emailedAt=' + last.emailedAt);
  if (last.emailedAt) { console.log('أُرسل إشعاره سابقاً'); return; }
  sendLeadEmail(last.id);
  console.log('تم الإرسال');
}

// 1) يرسل رسالة تجريبية لبريد الإدارة: يتأكد أن إرسال البريد مصرّح
function testEmail() {
  plainMail(CFG.ADMIN_EMAIL, 'رسالة تجريبية — مدرّبون سعوديّون', 'السلام عليكم\n\nهذه رسالة تجريبية من أتمتة المنصة. إن وصلتك فإرسال البريد يعمل.\n\nمنصة مدرّبون سعوديّون');
  console.log('أُرسلت رسالة تجريبية إلى ' + CFG.ADMIN_EMAIL);
}
// 2) يقرأ قاعدة البيانات ويكتب وقت الاتصال: يتأكد أن حساب المنصة عضو في مشروع Firebase
function testDb() {
  ping();
  console.log('الاتصال بقاعدة البيانات سليم: ' + JSON.stringify(db('settings/automation')));
}

// شغّلها مرة واحدة: تنشئ مؤقّتاً كل 5 دقائق يعالج أي طلب لم يصله إشعار
function setupTriggers() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'sweepPending').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sweepPending').timeBased().everyMinutes(5).create();
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'refreshAnalytics').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('refreshAnalytics').timeBased().everyHours(2).create();
  // لقطة شهرية شاملة في اليوم 4 من كل شهر ميلادي (بعد اكتمال بيانات Search Console)
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'monthlySnapshot').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('monthlySnapshot').timeBased().onMonthDay(4).atHour(3).create();
  ping();
  console.log('تم: مؤقّت المعالجة يعمل');
}
