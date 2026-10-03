/* لوحة الإدارة ← المراسلة: كتابة رسائل منسّقة (كتل) وإرسالها من بريد المنصة للمدربين المسجلين وللمدعوّين (غير المسجلين).
 * الرسالة والمستلمون يُكتبون في campaigns/{id} ثم يعالجها سكربت Campaign.gs ويحدّث التقدّم في السجل نفسه. */

const MailUI = { tab: 'compose', who: 'trainers', q: '', sel: new Set(), doc: null, view: 'desk' };
const MAIL_DRAFT = 'st-mail-draft';
const MAIL_BLOCKS = { h: ['fa-heading', 'عنوان'], p: ['fa-align-right', 'نص'], img: ['fa-image', 'صورة'], imgtext: ['fa-table-columns', 'صورة مع نص'], btn: ['fa-hand-pointer', 'زر رابط'], box: ['fa-note-sticky', 'إطار مميز'], hr: ['fa-minus', 'فاصل'] };
const MAIL_OPTS = {
  align: [['start', 'يمين'], ['center', 'وسط'], ['end', 'يسار']],
  w: [['full', 'كامل العرض'], ['mid', 'متوسط'], ['small', 'صغير']],
  side: [['start', 'الصورة يميناً'], ['end', 'الصورة يساراً']]
};
const MAIL_FIELDS = {
  h: [['text', 'نص العنوان'], ['align']],
  p: [['text', 'النص', 'area'], ['align']],
  box: [['text', 'نص الإطار', 'area']],
  img: [['url', 'رابط الصورة (Drive أو أي تخزين سحابي)', 'url'], ['alt', 'وصف الصورة (اختياري)'], ['w', 'العرض'], ['align'], ['link', 'رابط عند النقر على الصورة (اختياري)', 'url']],
  imgtext: [['url', 'رابط الصورة', 'url'], ['text', 'النص المجاور للصورة', 'area'], ['side', 'موضع الصورة'], ['alt', 'وصف الصورة (اختياري)']],
  btn: [['text', 'نص الزر'], ['url', 'رابط الزر', 'url'], ['align']],
  hr: []
};
const MAIL_NEW = { h: { t: 'h', text: '', align: 'start' }, p: { t: 'p', text: '', align: 'start' }, img: { t: 'img', url: '', alt: '', w: 'full', align: 'center', link: '' }, imgtext: { t: 'imgtext', url: '', text: '', side: 'start', alt: '' }, btn: { t: 'btn', text: 'ادخل إلى لوحتك', url: '{loginUrl}', align: 'center' }, box: { t: 'box', text: '' }, hr: { t: 'hr' } };
const MAIL_VARS = [['name', 'الاسم الكامل'], ['first', 'الاسم الأول'], ['loginUrl', 'رابط دخول المدربين'], ['siteUrl', 'رابط المنصة'], ['profileUrl', 'رابط بطاقة المدرب']];
const mailEmailRe = /[^\s,;<>"'()]+@[^\s,;<>"'()]+\.[^\s,;<>"'()]{2,}/;

function mailDoc() {
  if (MailUI.doc) return MailUI.doc;
  let d = null;
  try { d = JSON.parse(localStorage.getItem(MAIL_DRAFT) || 'null'); } catch { /* ignore */ }
  MailUI.doc = d && Array.isArray(d.blocks) ? { subject: d.subject || '', blocks: d.blocks, atts: Array.isArray(d.atts) ? d.atts : [] }
    : { subject: '', blocks: [{ t: 'p', text: 'السلام عليكم ورحمة الله وبركاته\n\nأ. {first}،\n\n', align: 'start' }], atts: [] };
  return MailUI.doc;
}
const mailSaveDraft = () => { try { localStorage.setItem(MAIL_DRAFT, JSON.stringify(MailUI.doc)); } catch { /* ignore */ } };

function mailVarsFor(r) {
  const name = (r.name || '').trim(), base = siteBase();
  return { name, first: name.replace(/^(د|م|أ)\.\s*/, '').split(/\s+/)[0] || name, loginUrl: `${base}#/login`, siteUrl: base, profileUrl: r.slug ? `${base}#/t/${encodeURIComponent(r.slug)}` : base };
}
const mailOpts = () => ({ site: siteBase(), assets: siteBase() });

/* ===== المستلمون ===== */
function mailTrainers() {
  return Store.list('trainers').map(t => ({ k: 't:' + t.id, type: 't', id: t.id, name: t.name || '', email: String(Store.get(`private/${t.id}`)?.email || '').trim(), slug: t.slug || t.id, meta: regionsLabel(t) })).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}
function mailInvitees() {
  return Store.list('invitees').map(i => ({ k: 'i:' + i.id, type: 'i', id: i.id, name: i.name || '', email: i.email || '', optOut: !!i.optOut, last: i.lastMailAt, meta: i.optOut ? 'أوقف الاستلام' : (i.lastMailAt ? 'آخر رسالة ' + ago(i.lastMailAt) : 'لم تُرسل له رسالة') })).sort((a, b) => (b.id > a.id ? 1 : -1));
}
const mailKnownEmails = () => new Set([...mailTrainers().map(r => r.email), ...mailInvitees().map(r => r.email), ...Store.list('applications').map(a => String(a.email || '').trim())].filter(Boolean).map(e => e.toLowerCase()));

function mailParseInvitees(text) {
  const out = [], seen = new Set();
  String(text || '').split(/[\n;،]+/).forEach(line => {
    line = line.trim(); if (!line) return;
    const m = line.match(mailEmailRe); if (!m) { out.push({ bad: line }); return; }
    const email = m[0].toLowerCase(); if (seen.has(email)) return; seen.add(email);
    out.push({ email, name: line.replace(m[0], '').replace(/[,،\t<>"']+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) });
  });
  return out;
}

/* ===== الصفحة ===== */
function aMail(main) {
  const D = mailDoc(), tab = MailUI.tab;
  const counts = { t: mailTrainers().filter(r => r.email).length, i: mailInvitees().filter(r => !r.optOut).length };
  main.innerHTML = `
    <div class="dash-h"><h2>المراسلة</h2><span class="muted small">إرسال رسائل منسّقة من بريد المنصة</span></div>
    ${mailBanner()}
    <div class="mail-tabs">
      <button data-mt="compose" class="${tab === 'compose' ? 'on' : ''}"><i class="fa-solid fa-pen-nib"></i>كتابة الرسالة</button>
      <button data-mt="rcpt" class="${tab === 'rcpt' ? 'on' : ''}"><i class="fa-solid fa-users"></i>المستلمون <span class="badge num">${MailUI.sel.size}</span></button>
      <button data-mt="hist" class="${tab === 'hist' ? 'on' : ''}"><i class="fa-solid fa-clock-rotate-left"></i>السجل</button>
    </div>
    <div id="mbody"></div>`;
  $$('[data-mt]', main).forEach(b => b.onclick = () => { MailUI.tab = b.dataset.mt; aMail(main); });
  const body = $('#mbody', main);
  ({ compose: mailCompose, rcpt: mailRecipients, hist: mailHistory })[tab](body, main, counts);
}
function mailBanner() {
  if (!Automation.on) return `<div class="banner warn"><i class="fa-solid fa-plug-circle-xmark"></i><span>الإرسال يحتاج ربط بريد المنصة (رابط السكربت <code>automationUrl</code> في <code>js/config.js</code> وإضافة ملف <code>Campaign.gs</code> للسكربت). يمكنك الكتابة والمعاينة الآن.</span></div>`;
  const q = Number(Store.get('settings/automation/quota'));
  return `<div class="banner ok"><i class="fa-solid fa-paper-plane"></i><span>الإرسال من بريد المنصة مفعّل.${q >= 0 && Store.get('settings/automation/quota') != null ? ` المتبقي اليوم في حصة Gmail: <b class="num">${q}</b> رسالة (تُرسل الباقي تلقائياً في اليوم التالي).` : ' الحصة اليومية لـ Gmail العادي 100 مستلم، ولحساب Workspace حتى 1500.'}</span></div>`;
}

/* ----- كتابة الرسالة ----- */
function mailCompose(body, main) {
  const D = mailDoc();
  body.innerHTML = `
    <div class="mail-grid">
      <div class="mail-edit">
        <label class="field"><span>عنوان الرسالة</span><input type="text" id="msub" maxlength="150" value="${esc(D.subject)}" placeholder="مثال: منصتك بحُلّة جديدة — حدّث بياناتك الآن"></label>
        <div class="tvars"><small class="muted">متغيرات تُستبدل لكل مستلم (انقر لإدراجها):</small>${MAIL_VARS.map(([k, l]) => `<button type="button" class="tvar" data-v="${k}" title="${l}">{${k}}<small>${l}</small></button>`).join('')}</div>
        <div id="mblocks"></div>
        <div class="mail-add"><b class="small">إضافة عنصر:</b>${Object.entries(MAIL_BLOCKS).map(([k, [i, l]]) => `<button type="button" class="btn sm" data-add="${k}"><i class="fa-solid ${i}"></i>${l}</button>`).join('')}</div>
        <div class="pbox" style="margin:14px 0 0"><h3><i class="fa-solid fa-paperclip"></i>المرفقات</h3>
          <p class="muted small">روابط ملفات (Drive بمشاركة «أي شخص لديه الرابط»، أو Dropbox، أو رابط مباشر) تُرفق مع الرسالة ملفاتٍ حقيقية. الحد الأقصى 5 ملفات ومجموعها 20 ميغابايت.</p>
          <div id="matts"></div><button type="button" class="btn sm" id="addatt"><i class="fa-solid fa-plus"></i> إضافة مرفق</button></div>
      </div>
      <div class="mail-prev"><div class="mail-prev-h"><b class="small"><i class="fa-solid fa-eye"></i> المعاينة</b>
        <span><button class="btn sm ${MailUI.view === 'desk' ? 'primary' : ''}" data-view="desk"><i class="fa-solid fa-desktop"></i></button><button class="btn sm ${MailUI.view === 'mob' ? 'primary' : ''}" data-view="mob"><i class="fa-solid fa-mobile-screen"></i></button></span></div>
        <iframe id="mframe" class="mail-frame ${MailUI.view}" title="معاينة الرسالة"></iframe></div>
    </div>
    <div class="mail-send"><div class="grow"><b id="msum"></b><br><small class="muted">يُرسل من بريد المنصة، ويصل الرد على بريد الإدارة.</small></div>
      <button class="btn" id="mtest"><i class="fa-solid fa-vial"></i> تجربة إلى بريدي</button>
      <button class="btn" id="mcopy"><i class="fa-solid fa-code"></i> نسخ HTML</button>
      <button class="btn ghost" id="mclear"><i class="fa-solid fa-trash"></i> رسالة جديدة</button>
      <button class="btn primary lg" id="msend"><i class="fa-solid fa-paper-plane"></i> إرسال</button></div>`;

  const blocks = $('#mblocks', body);
  let focus = null;
  const renderSummary = () => { const n = MailUI.sel.size; $('#msum', body).textContent = n ? `سيُرسل إلى ${n} مستلم` : 'لم تُحدَّد مستلمين بعد'; };
  let pt;
  const preview = () => {
    clearTimeout(pt);
    pt = setTimeout(() => { const f = $('#mframe', body); if (f) f.srcdoc = `<meta charset="utf-8"><body style="margin:0">${mailHtml(D, mailVarsFor({ name: 'أ. سارة العتيبي', slug: 'sara' }), mailOpts())}</body>`; }, 120);
  };
  const fieldHTML = (b, i, [f, label, kind]) => {
    if (OPT_FIELDS.has(f)) return `<label class="field mail-f mf-${f}"><span>${f === 'align' ? 'المحاذاة' : label}</span><select data-i="${i}" data-f="${f}">${MAIL_OPTS[f].map(([v, l]) => `<option value="${v}" ${(b[f] || MAIL_NEW[b.t][f]) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
    if (kind === 'area') return `<label class="field full"><span>${label} ${b.t !== 'imgtext' ? '<small>(**عريض** و[نص](https://رابط) وأسطر جديدة)</small>' : ''}</span><textarea data-i="${i}" data-f="${f}" rows="5">${esc(b[f] || '')}</textarea></label>`;
    return `<label class="field full"><span>${label}</span><input type="${kind === 'url' ? 'url' : 'text'}" ${kind === 'url' ? 'dir="ltr"' : ''} data-i="${i}" data-f="${f}" value="${esc(b[f] || '')}" maxlength="600"></label>`;
  };
  const OPT_FIELDS = new Set(['align', 'w', 'side']);
  const renderBlocks = () => {
    blocks.innerHTML = D.blocks.map((b, i) => {
      const [ic, name] = MAIL_BLOCKS[b.t] || ['fa-square', b.t];
      const imgOk = (b.t === 'img' || b.t === 'imgtext') && b.url ? !!mailImgUrl(b.url) : null;
      return `<div class="mblock" data-b="${i}">
        <div class="mblock-h"><b><i class="fa-solid ${ic}"></i> ${name}</b><span>
          ${b.t === 'p' || b.t === 'box' || b.t === 'imgtext' ? `<button type="button" class="btn sm ghost" data-act="bold" data-i="${i}" title="خط عريض"><i class="fa-solid fa-bold"></i></button><button type="button" class="btn sm ghost" data-act="link" data-i="${i}" title="إدراج رابط"><i class="fa-solid fa-link"></i></button>` : ''}
          <button type="button" class="btn sm ghost" data-act="up" data-i="${i}" ${i ? '' : 'disabled'} title="للأعلى"><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" class="btn sm ghost" data-act="down" data-i="${i}" ${i < D.blocks.length - 1 ? '' : 'disabled'} title="للأسفل"><i class="fa-solid fa-arrow-down"></i></button>
          <button type="button" class="btn sm ghost" data-act="dup" data-i="${i}" title="تكرار"><i class="fa-regular fa-clone"></i></button>
          <button type="button" class="btn sm ghost" data-act="del" data-i="${i}" title="حذف"><i class="fa-solid fa-trash"></i></button></span></div>
        <div class="mblock-f">${(MAIL_FIELDS[b.t] || []).map(f => fieldHTML(b, i, f)).join('')}${imgOk === false ? '<p class="small" style="color:var(--bad);grid-column:1/-1">الرابط غير صالح: استخدم رابط https لصورة.</p>' : ''}${imgOk ? `<img class="mblock-thumb" src="${esc(mailImgUrl(b.url, 300))}" alt="" onerror="this.style.display='none'">` : ''}</div>
      </div>`;
    }).join('') || '<p class="muted center">أضف عناصر للرسالة من الأزرار أدناه</p>';
    renderAtts();
    preview();
  };
  const renderAtts = () => {
    $('#matts', body).innerHTML = D.atts.map((a, i) => `<div class="mail-att"><input type="text" data-ai="${i}" data-af="name" placeholder="اسم الملف (مثال: دليل المدرب.pdf)" value="${esc(a.name || '')}" maxlength="80"><input type="url" dir="ltr" data-ai="${i}" data-af="url" placeholder="https://drive.google.com/file/d/.../view" value="${esc(a.url || '')}" maxlength="600"><button type="button" class="btn sm ghost" data-adel="${i}"><i class="fa-solid fa-xmark"></i></button></div>`).join('');
  };
  const touch = () => { mailSaveDraft(); preview(); };

  blocks.addEventListener('input', e => {
    const el = e.target, i = el.dataset.i, f = el.dataset.f; if (i == null || !f) return;
    D.blocks[+i][f] = el.value; touch();
    if (f === 'url' && el.type === 'url') { clearTimeout(blocks._t); blocks._t = setTimeout(renderBlocks, 600); }
  });
  blocks.addEventListener('change', e => { if (e.target.tagName === 'SELECT') { const { i, f } = e.target.dataset; D.blocks[+i][f] = e.target.value; touch(); } });
  blocks.addEventListener('focusin', e => { if (e.target.matches('textarea, input')) focus = e.target; });
  blocks.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.dataset.i, act = b.dataset.act, arr_ = D.blocks;
    if (act === 'up' && i > 0) [arr_[i - 1], arr_[i]] = [arr_[i], arr_[i - 1]];
    else if (act === 'down' && i < arr_.length - 1) [arr_[i + 1], arr_[i]] = [arr_[i], arr_[i + 1]];
    else if (act === 'dup') arr_.splice(i + 1, 0, JSON.parse(JSON.stringify(arr_[i])));
    else if (act === 'del') arr_.splice(i, 1);
    else if (act === 'bold' || act === 'link') {
      const ta = $(`textarea[data-i="${i}"]`, blocks); if (!ta) return;
      const s = ta.selectionStart, en = ta.selectionEnd, sel = ta.value.slice(s, en);
      let ins;
      if (act === 'bold') ins = `**${sel || 'نص عريض'}**`;
      else { const u = prompt('الرابط (يبدأ بـ https://)', 'https://'); if (!u || !mSafeUrl(u)) { if (u) toast('الرابط غير صالح', 'error'); return; } ins = `[${sel || 'نص الرابط'}](${u.trim()})`; }
      ta.value = ta.value.slice(0, s) + ins + ta.value.slice(en); D.blocks[i].text = ta.value; ta.focus(); ta.setSelectionRange(s + ins.length, s + ins.length); touch(); return;
    }
    mailSaveDraft(); renderBlocks();
  });
  $$('[data-add]', body).forEach(b => b.onclick = () => { D.blocks.push({ ...MAIL_NEW[b.dataset.add] }); mailSaveDraft(); renderBlocks(); blocks.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
  $('#msub', body).oninput = e => { D.subject = e.target.value; mailSaveDraft(); };
  $$('.tvar', body).forEach(b => { b.addEventListener('mousedown', e => e.preventDefault()); b.onclick = () => {
    const el = focus && body.contains(focus) && focus.matches('textarea, input[type=text], input:not([type])') ? focus : $('#msub', body), v = `{${b.dataset.v}}`, s = el.selectionStart ?? el.value.length, en = el.selectionEnd ?? s;
    el.value = el.value.slice(0, s) + v + el.value.slice(en); el.focus(); el.setSelectionRange(s + v.length, s + v.length); el.dispatchEvent(new Event('input', { bubbles: true }));
  }; });
  $$('[data-view]', body).forEach(b => b.onclick = () => { MailUI.view = b.dataset.view; $('#mframe', body).className = 'mail-frame ' + MailUI.view; $$('[data-view]', body).forEach(x => x.classList.toggle('primary', x === b)); });
  $('#matts', body).addEventListener('input', e => { const { ai, af } = e.target.dataset; if (ai != null) { D.atts[+ai][af] = e.target.value; mailSaveDraft(); } });
  $('#matts', body).addEventListener('click', e => { const b = e.target.closest('[data-adel]'); if (b) { D.atts.splice(+b.dataset.adel, 1); mailSaveDraft(); renderAtts(); } });
  $('#addatt', body).onclick = () => { if (D.atts.length >= 5) { toast('الحد الأقصى 5 مرفقات', 'error'); return; } D.atts.push({ name: '', url: '' }); mailSaveDraft(); renderAtts(); };
  $('#mclear', body).onclick = async () => { if (await confirmBox('مسح الرسالة الحالية والبدء من جديد؟', { ok: 'مسح', danger: true })) { MailUI.doc = null; try { localStorage.removeItem(MAIL_DRAFT); } catch { /* ignore */ } aMail(main); } };
  $('#mcopy', body).onclick = () => copyText(mailHtml(D, mailVarsFor({ name: 'الاسم', slug: '' }), mailOpts()), 'نُسخ كود HTML للرسالة');
  $('#mtest', body).onclick = () => mailSend(true, main);
  $('#msend', body).onclick = () => mailSend(false, main);
  renderSummary(); renderBlocks();
}

/* ----- المستلمون ----- */
function mailRecipients(body, main) {
  const who = MailUI.who, all = who === 'trainers' ? mailTrainers() : mailInvitees();
  const q = normAr(MailUI.q), list = all.filter(r => !q || normAr(`${r.name} ${r.email}`).includes(q));
  const ok = r => r.email && !r.optOut;
  const selectable = list.filter(ok);
  body.innerHTML = `
    <div class="mail-who"><button data-w="trainers" class="${who === 'trainers' ? 'on' : ''}"><i class="fa-solid fa-id-card"></i>المدربون المسجلون <span class="num">${mailTrainers().filter(r => r.email).length}</span></button>
      <button data-w="invitees" class="${who === 'invitees' ? 'on' : ''}"><i class="fa-solid fa-envelope-circle-check"></i>غير المسجلين (مدعوّون) <span class="num">${mailInvitees().filter(r => !r.optOut).length}</span></button></div>
    ${who === 'invitees' ? `<div class="pbox"><h3><i class="fa-solid fa-user-plus"></i>إضافة بريدات مدعوّين</h3>
      <p class="muted small">الصق البريدات (واحد في كل سطر، أو بصيغة «الاسم، البريد»)، أو ارفع ملف CSV/نص. لا يُضاف بريد مسجَّل لدينا مسبقاً ولا المكرر.</p>
      <textarea id="inv" rows="5" dir="ltr" placeholder="name@example.com&#10;سارة العتيبي, sara@example.com"></textarea>
      <div class="row"><button class="btn primary sm" id="invadd"><i class="fa-solid fa-plus"></i> إضافة للقائمة</button><label class="btn sm"><i class="fa-solid fa-file-csv"></i> رفع ملف<input type="file" id="invfile" accept=".csv,.txt,text/csv,text/plain" hidden></label></div></div>` : `<p class="muted small">يظهر هنا المدربون الذين سجّلوا بريدهم في بياناتهم الخاصة. من لا بريد له لا يمكن مراسلته.</p>`}
    <div class="toolbar"><input type="search" id="rq" placeholder="بحث بالاسم أو البريد" value="${esc(MailUI.q)}">
      <button class="btn sm" id="rall"><i class="fa-solid fa-check-double"></i> تحديد الكل (${selectable.length})</button>
      <button class="btn sm ghost" id="rnone"><i class="fa-regular fa-square"></i> إلغاء التحديد</button>
      ${who === 'invitees' ? '<button class="btn sm ghost" id="rdel"><i class="fa-solid fa-trash"></i> حذف المحدد</button>' : ''}</div>
    <div class="mail-list">${list.map(r => `<label class="mail-row ${ok(r) ? '' : 'off'}"><input type="checkbox" data-k="${esc(r.k)}" ${MailUI.sel.has(r.k) ? 'checked' : ''} ${ok(r) ? '' : 'disabled'}>
      <span class="grow"><b>${esc(r.name || '—')}</b><small dir="ltr">${r.email ? esc(r.email) : 'لا بريد'}</small></span><small class="muted">${esc(r.meta || '')}</small>
      ${who === 'invitees' ? `<button type="button" class="btn sm ghost" data-opt="${esc(r.id)}" title="${r.optOut ? 'إعادة التفعيل' : 'إيقاف الاستلام (طلب إلغاء)'}"><i class="fa-solid ${r.optOut ? 'fa-rotate-left' : 'fa-ban'}"></i></button>` : ''}</label>`).join('') || '<p class="muted center" style="padding:24px">لا نتائج</p>'}</div>`;
  $$('[data-w]', body).forEach(b => b.onclick = () => { MailUI.who = b.dataset.w; MailUI.q = ''; aMail(main); });
  $('#rq', body).oninput = debounce(e => { MailUI.q = e.target.value; mailRecipients(body, main); $('#rq', body).focus(); }, 200);
  const upd = () => { const b = $$('.mail-tabs .badge', main)[0]; b && (b.textContent = MailUI.sel.size); };
  $$('[data-k]', body).forEach(c => c.onchange = () => { c.checked ? MailUI.sel.add(c.dataset.k) : MailUI.sel.delete(c.dataset.k); upd(); });
  $('#rall', body).onclick = () => { selectable.forEach(r => MailUI.sel.add(r.k)); mailRecipients(body, main); upd(); };
  $('#rnone', body).onclick = () => { MailUI.sel.clear(); mailRecipients(body, main); upd(); };
  $$('[data-opt]', body).forEach(b => b.onclick = e => { e.preventDefault(); const id = b.dataset.opt, cur = !!Store.get(`invitees/${id}/optOut`); Store.update(`invitees/${id}`, { optOut: cur ? null : true }); MailUI.sel.delete('i:' + id); aMail(main); });
  if (who === 'invitees') {
    $('#invfile', body).onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { $('#inv', body).value = String(rd.result || '').slice(0, 400000); toast('قُرئ الملف — اضغط «إضافة للقائمة»'); }; rd.readAsText(f); };
    $('#invadd', body).onclick = () => {
      const rows = mailParseInvitees($('#inv', body).value), known = mailKnownEmails();
      let added = 0, dup = 0, bad = 0;
      rows.forEach(r => {
        if (r.bad) { bad++; return; }
        if (known.has(r.email)) { dup++; return; }
        const id = Store.newId(); known.add(r.email);
        Store.set(`invitees/${id}`, { id, email: r.email.slice(0, 120), name: r.name || '', ts: Date.now() }); added++;
      });
      if (added) Security.log('إضافة مدعوّين للمراسلة', `${added} بريد`);
      toast(`أُضيف ${added}${dup ? ` · مكرر أو مسجّل مسبقاً ${dup}` : ''}${bad ? ` · غير صالح ${bad}` : ''}`, added ? 'ok' : 'error');
      aMail(main);
    };
    $('#rdel', body).onclick = async () => {
      const ids = [...MailUI.sel].filter(k => k.startsWith('i:')).map(k => k.slice(2));
      if (!ids.length) { toast('حدّد بريدات للحذف', 'error'); return; }
      if (!await confirmBox(`حذف ${ids.length} بريد من قائمة المدعوّين؟`, { ok: 'حذف', danger: true })) return;
      ids.forEach(id => { Store.remove(`invitees/${id}`); MailUI.sel.delete('i:' + id); }); Security.log('حذف مدعوّين', `${ids.length} بريد`); aMail(main);
    };
  }
}

/* ----- السجل ----- */
function mailHistory(body, main) {
  const list = Store.list('campaigns').sort((a, b) => b.ts - a.ts);
  const stat = c => ({ done: ['ok', 'اكتمل'], sending: ['info', 'قيد الإرسال'], queued: ['gray', 'في الانتظار'], partial: ['warn', 'متوقف (الحصة اليومية)'], failed: ['bad', 'فشل'] }[c.status] || ['gray', c.status || '—']);
  body.innerHTML = list.length ? list.map(c => { const [tone, sn] = stat(c); const sent = c.sent || 0, fail = c.failed || 0;
    return `<div class="pbox mail-hist"><div class="row"><div class="grow"><b>${esc(c.subject)}</b> ${c.test ? '<span class="pill gray">تجربة</span>' : ''}<br><small class="muted">${fmtTs(c.ts)} · ${esc(c.by || '')}</small>${c.note ? `<br><small style="color:var(--bad)">${esc(c.note)}</small>` : ''}</div>
      <span class="pill ${tone}">${sn}</span></div>
      <div class="mail-bar"><span style="width:${c.total ? Math.round(sent / c.total * 100) : 0}%"></span></div>
      <div class="row small"><span>أُرسل <b class="num">${sent}</b> من <b class="num">${c.total || 0}</b></span>${fail ? `<span style="color:var(--bad)">فشل <b class="num">${fail}</b></span>` : ''}
      <button class="btn sm ghost" data-reuse="${esc(c.id)}"><i class="fa-regular fa-copy"></i> إعادة استخدام</button>
      ${fail ? `<button class="btn sm ghost" data-fails="${esc(c.id)}"><i class="fa-solid fa-triangle-exclamation"></i> المتعثّرون</button>` : ''}</div></div>`; }).join('')
    : '<div class="empty"><i class="fa-solid fa-envelope-open"></i><h3>لا رسائل مُرسلة بعد</h3><p class="muted">ستظهر هنا الرسائل المرسلة وتقدّمها.</p></div>';
  $$('[data-reuse]', body).forEach(b => b.onclick = () => {
    const c = Store.get(`campaigns/${b.dataset.reuse}`); if (!c?.doc) return;
    MailUI.doc = { subject: c.subject || '', blocks: arr(c.doc.blocks).map(x => ({ ...x })), atts: arr(c.doc.atts).map(x => ({ ...x })) }; mailSaveDraft(); MailUI.tab = 'compose'; aMail(main); toast('حُمّلت الرسالة في المحرّر');
  });
  $$('[data-fails]', body).forEach(b => b.onclick = () => {
    const c = Store.get(`campaigns/${b.dataset.fails}`) || {};
    const rows = Object.values(c.recipients || {}).filter(r => r.err);
    modal(`<h3>المتعثّرون (${rows.length})</h3><div class="mail-list">${rows.map(r => `<div class="mail-row"><span class="grow"><b>${esc(r.name || '—')}</b><small dir="ltr">${esc(r.email)}</small></span><small style="color:var(--bad)">${esc(r.err)}</small></div>`).join('')}</div>`);
  });
}

/* ===== الإرسال ===== */
function mailValidate(D) {
  if (!String(D.subject || '').trim()) return 'اكتب عنوان الرسالة';
  const blocks = D.blocks.filter(b => b.t === 'hr' || String(b.text || b.url || '').trim());
  if (!blocks.length) return 'الرسالة فارغة';
  for (const b of D.blocks) {
    if ((b.t === 'img' || b.t === 'imgtext') && b.url && !mailImgUrl(b.url)) return 'رابط إحدى الصور غير صالح';
    if (b.t === 'btn' && (!String(b.text).trim() || !mSafeUrl(mailVars(b.url, { loginUrl: 'https://x.y/', siteUrl: 'https://x.y/', profileUrl: 'https://x.y/' })))) return 'رابط الزر غير صالح (يبدأ بـ https://)';
    if ((b.t === 'img') && b.link && !mSafeUrl(b.link)) return 'رابط الصورة غير صالح';
  }
  for (const a of D.atts) if ((a.url || a.name) && (!mSafeUrl(a.url) || !String(a.name || '').trim())) return 'أكمل اسم ورابط كل مرفق أو احذفه';
  return '';
}
async function mailSend(test, main) {
  const D = mailDoc(), err = mailValidate(D);
  if (err) { toast(err, 'error'); return; }
  if (!Automation.on) { toast('الإرسال يحتاج ربط بريد المنصة (Campaign.gs) — راجع التعليمات أعلى الصفحة', 'error'); return; }
  const u = Security.currentUser();
  let recips;
  if (test) {
    const to = window.ST_CONFIG.adminEmail || u?.email || '';
    if (!mailEmailRe.test(to)) { toast('تعذّر تحديد بريدك: سجّل الدخول ببريد المشرف', 'error'); return; }
    recips = [{ type: 'x', id: 'test', name: 'تجربة', email: to }];
  } else {
    const byKey = new Map([...mailTrainers(), ...mailInvitees()].map(r => [r.k, r]));
    const seen = new Set();
    recips = [...MailUI.sel].map(k => byKey.get(k)).filter(r => r && r.email && !r.optOut && !seen.has(r.email.toLowerCase()) && seen.add(r.email.toLowerCase()));
    if (!recips.length) { toast('حدّد المستلمين من تبويب «المستلمون»', 'error'); return; }
    if (recips.length > 400) { toast('الحد الأقصى 400 مستلم في الحملة الواحدة', 'error'); return; }
    if (!await confirmBox(`سيُرسل «${esc(D.subject)}» إلى <b>${recips.length}</b> مستلم من بريد المنصة. لا يمكن التراجع بعد الإرسال.`, { ok: 'إرسال الآن' })) return;
  }
  const id = Store.newId(), rec = {};
  recips.forEach((r, i) => { rec['r' + i] = { email: r.email.slice(0, 120), name: (r.name || '').slice(0, 80), type: r.type, rid: r.id, ...(r.slug ? { slug: String(r.slug).slice(0, 80) } : {}) }; });
  const doc = { blocks: D.blocks.map(b => ({ ...b })), atts: D.atts.filter(a => a.url).map(a => ({ name: a.name.trim().slice(0, 80), url: a.url.trim() })) };
  const camp = { id, ts: Date.now(), subject: D.subject.trim().slice(0, 150), doc, recipients: rec, total: recips.length, sent: 0, failed: 0, status: 'queued', test: !!test, by: Security.adminName?.() || u?.email || 'مشرف' };
  if (!await Store.setConfirmed(`campaigns/${id}`, camp)) { toast('تعذّر حفظ الحملة (الصلاحيات)', 'error'); return; }
  await Automation.notify('campaign', id);
  Security.log(test ? 'تجربة رسالة بريد' : 'إرسال حملة بريد', camp.subject, `${recips.length} مستلم`);
  toast(test ? 'أُرسلت التجربة، تصل خلال لحظات' : 'بدأ الإرسال — تابع التقدّم في «السجل»');
  if (!test) { MailUI.tab = 'hist'; aMail(main); }
}
