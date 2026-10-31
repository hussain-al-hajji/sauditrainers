/* تبويب المراسلة «القبول المبدئي والتجربة»: رسالة جاهزة تُنسخ وتُلصق في Gmail.
 * تُبنى من قالب «القبول المبدئي» نفسه (القوالب ← القبول المبدئي) فتتطابق مع بريد وواتساب الإشعار، ويُدرج فيها اسم المدرب وبياناته
 * تلقائياً عند اختياره من قائمة طلبات «القبول المبدئي». */
const MailInitial = { id: '' };

function mailInitial(body) {
  const apps = Store.list('applications').filter(a => a.status === 'accepted').sort((x, y) => (y.initialAt || y.ts || 0) - (x.initialAt || x.ts || 0));
  if (!apps.some(a => a.id === MailInitial.id)) MailInitial.id = apps[0] ? apps[0].id : '';
  const a = apps.find(x => x.id === MailInitial.id) || null;
  if (!a) {
    body.innerHTML = `<div class="empty"><i class="fa-solid fa-circle-check"></i><h3>لا توجد طلبات في «القبول المبدئي»</h3><p class="muted">اقبل طلباً مبدئياً من «طلبات التسجيل» وسيظهر هنا برسالته الجاهزة.</p></div>`;
    return;
  }
  const trainer = a.trainerId ? Store.get(`trainers/${a.trainerId}`) : null, secret = a.trainerId ? Store.get(`secrets/codes/${a.trainerId}`) : '';
  const priv = a.trainerId ? Store.get(`private/${a.trainerId}`) || {} : {}, to = priv.email || a.email || '';
  const ctx = { a, t: trainer, secret }, tpl = Tpl.get('initial'), v = Tpl.vars(ctx);

  const html = Tpl.mailHtml('initial', ctx);
  const subject = Tpl.render(tpl.subject, v), plain = Tpl.mail('initial', ctx).body;

  body.innerHTML = `
    <div class="pbox" style="margin-bottom:12px">
      <h3><i class="fa-solid fa-circle-check"></i> رسالة القبول المبدئي والتجربة المجانية</h3>
      <p class="muted small">اختر المدرب من «القبول المبدئي» فتظهر الرسالة باسمه وبياناته، ثم انسخها والصقها في Gmail. نصها من القالب نفسه (الإدارة ← قوالب ← القبول المبدئي).</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
        <label class="field" style="flex:1;min-width:240px"><span>المدرب (القبول المبدئي)</span><select id="mi-pick">${apps.map(x => `<option value="${esc(x.id)}" ${x.id === a.id ? 'selected' : ''}>${esc(x.name)} · ${esc(x.id)}</option>`).join('')}</select></label>
        <label class="field" style="flex:1;min-width:240px"><span>البريد</span><input type="text" id="mi-to" dir="ltr" readonly value="${esc(to)}"></label>
      </div>
      ${trainer ? '' : '<div class="banner warn" style="margin-top:10px"><i class="fa-solid fa-triangle-exclamation"></i><span>لم تبدأ التجربة لهذا الطلب بعد، فلا رقم عضوية ولا رمز دخول في الرسالة. افتح الطلب من «طلبات التسجيل» واضغط «بدء فترة التجربة المجانية».</span></div>'}
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn primary" id="mi-copy"><i class="fa-solid fa-copy"></i> نسخ الرسالة (منسّقة للصقها في Gmail)</button>
        <button class="btn" id="mi-plain"><i class="fa-solid fa-align-right"></i> نسخ كنص عادي</button>
        <button class="btn" id="mi-sub"><i class="fa-solid fa-heading"></i> نسخ العنوان</button>
        <button class="btn" id="mi-to-c"><i class="fa-solid fa-at"></i> نسخ البريد</button>
        <a class="btn" target="_blank" rel="noopener" href="${esc(gmailCompose(to, subject, plain, ''))}"><i class="fa-solid fa-envelope"></i> فتح Gmail برسالة جاهزة</a>
      </div>
      <p class="small muted" style="margin:8px 0 0"><b>العنوان:</b> ${esc(subject)}</p>
    </div>
    <div class="pbox"><div id="mi-msg" dir="rtl" style="max-width:680px;margin:0 auto;padding:22px;background:#fff;border:1px solid var(--line,#e0e8d8);border-radius:14px;font:15px/1.95 Tahoma,Arial,sans-serif;color:#1c2a21;text-align:right">${html}</div></div>`;

  $('#mi-pick', body).onchange = e => { MailInitial.id = e.target.value; mailInitial(body); };
  $('#mi-sub', body).onclick = () => copyText(subject, 'تم نسخ العنوان');
  $('#mi-to-c', body).onclick = () => copyText(to, 'تم نسخ البريد');
  $('#mi-plain', body).onclick = () => copyText(plain, 'تم نسخ النص العادي');
  $('#mi-copy', body).onclick = async () => {
    const el = $('#mi-msg', body);
    try { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([`<div dir="rtl" style="font:15px/1.95 Tahoma,Arial,sans-serif;text-align:right">${el.innerHTML}</div>`], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]); toast('تم نسخ الرسالة منسّقة، الصقها في Gmail'); return; } catch { /* نحدّد المحتوى وننسخه */ }
    const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    try { document.execCommand('copy'); toast('تم نسخ الرسالة منسّقة، الصقها في Gmail'); } catch { toast('حدّد الرسالة وانسخها يدوياً', 'error'); }
    s.removeAllRanges();
  };
}
