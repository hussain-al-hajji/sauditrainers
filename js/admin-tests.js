/* تبويب المراسلة «رسائل تجريبية»: يرسل أي قالب رسالة إلى بريد المنصة (ببيانات عيّنة وهمية) للتأكد من شكله ونصه قبل استخدامه.
 * نسخ الواتساب تُرسل بالبريد كنص للمعاينة. الإرسال من بريد المنصة (outbox) إن كانت الأتمتة مفعّلة، وإلا يُفتح Gmail برسالة جاهزة. */
const MailTests = { k: 'initial' };

function mailTests(body) {
  const c = Data.content(), to0 = window.ST_CONFIG.adminEmail || (c.contact && c.contact.email) || (Security.currentUser() || {}).email || '';
  const now = Date.now(), name = 'أ. سارة العتيبي', fee = (c.join || {}).fee || 720;
  const a = { id: 'TEST-0001', name, email: to0, phone: '966500000000', status: 'accepted' };
  const trial = { id: 'st0000', code: 'ST0000', name, slug: 'sample', plan: 'trial', trialEnd: now + 30 * 864e5 }, full = { ...trial, plan: 'full', trialEnd: null };
  const SEC = 'ST0000-ABC123';
  const ctxT = { a, t: trial, secret: SEC }, ctxF = { a, t: full, secret: SEC };
  const end = fmtDate(now + 3 * 864e5);
  const remind = left => ({
    subject: (left <= 2 ? 'بقي يومان على انتهاء فترتك التجريبية' : 'بقي 5 أيام على انتهاء فترتك التجريبية') + ' - مدرّبون سعوديّون',
    body: `السلام عليكم ورحمة الله وبركاته\n\n${name}،\n\nنذكّرك بقرب انتهاء فترة الشهر المجاني في منصة «مدرّبون سعوديّون» (تنتهي ${end}).\n\nعند انتهائها يتعطّل الدخول إلى حسابك ويُخفى ملفك الشخصي من المنصة، دون حذف أي من بياناتك.\n\nللاستمرار في الاستفادة من المنصة، أكّد رغبتك بسداد الرسوم: ${fee} ريال للسنة الأولى، ثم ${Pitch.renew}. وبعد السداد تُفتح لك كل المزايا.\n\nتفاصيل الاشتراك وبيانات السداد في رسالة القبول المبدئي على بريدك، أو تواصل معنا عبر واتساب المنصة.\n\nرابط الدخول: ${siteBase()}#/login\n\nمع التحية،\nمنصة مدرّبون سعوديّون`
  });
  const wa = (title, text) => ({ subject: `${title} (نص واتساب)`, body: `هذا نص رسالة الواتساب أُرسل بالبريد للمعاينة فقط:\n\n${text}` });
  const LIST = [
    ['initial', 'fa-gift', 'رسالة القبول المبدئي والتجربة المجانية (بريد)', () => Tpl.mailFull('initial', ctxT)],
    ['initialwa', 'fa-brands fa-whatsapp', 'رسالة القبول المبدئي والتجربة المجانية (واتساب)', () => wa('القبول المبدئي والتجربة المجانية', Tpl.wa('initial', ctxT))],
    ['final', 'fa-certificate', 'رسالة القبول النهائي والاشتراك الكامل (بريد)', () => Tpl.mailFull('final', ctxF)],
    ['finalwa', 'fa-brands fa-whatsapp', 'رسالة القبول النهائي والاشتراك الكامل (واتساب)', () => wa('القبول النهائي والاشتراك الكامل', Tpl.wa('final', ctxF))],
    ['received', 'fa-inbox', 'رسالة استلام طلب التسجيل (بريد)', () => Tpl.mail('received', { a })],
    ['rem5', 'fa-bell', 'تذكير قبل انتهاء التجربة بخمسة أيام (بريد)', () => remind(5)],
    ['rem2', 'fa-bell', 'تذكير قبل انتهاء التجربة بيومين (بريد)', () => remind(2)]
  ];
  if (!LIST.some(x => x[0] === MailTests.k)) MailTests.k = LIST[0][0];
  const cur = LIST.find(x => x[0] === MailTests.k), msg = cur[3]();
  body.innerHTML = `
    <div class="pbox" style="margin-bottom:12px">
      <h3><i class="fa-solid fa-vial"></i> رسائل تجريبية إلى بريد المنصة</h3>
      <p class="muted small">اختر الرسالة ثم «إرسال» لتصلك ببيانات عيّنة وهمية (اسم ورمز دخول تجريبيان)، فتتأكد من القالب ونصه قبل استخدامه مع المدربين. نصوص الواتساب تُرسل بالبريد كنص للمعاينة. تتغير الرسائل هنا تلقائياً مع تعديل القوالب.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
        <label class="field" style="flex:1;min-width:260px"><span>الرسالة</span><select id="mt-pick">${LIST.map(x => `<option value="${x[0]}" ${x[0] === cur[0] ? 'selected' : ''}>${esc(x[2])}</option>`).join('')}</select></label>
        <label class="field" style="flex:1;min-width:240px"><span>إرسال إلى</span><input type="email" id="mt-to" dir="ltr" value="${esc(to0)}" placeholder="بريد المنصة"></label>
      </div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn primary" id="mt-send"><i class="fa-solid fa-paper-plane"></i> إرسال هذه الرسالة</button>
        <button class="btn" id="mt-all"><i class="fa-solid fa-layer-group"></i> إرسال كل الرسائل (${LIST.length})</button>
      </div>
      ${Automation.on ? '' : '<p class="small muted" style="margin:8px 0 0">الأتمتة غير مفعّلة: سيُفتح Gmail برسالة جاهزة بدل الإرسال المباشر.</p>'}
    </div>
    <div class="pbox"><p class="small" style="margin:0 0 6px"><b>العنوان:</b> ${esc('[تجربة] ' + msg.subject)}</p>
      ${msg.html ? `<div style="padding:16px;background:#fff;border:1px solid var(--line,#e0e8d8);border-radius:12px;max-height:620px;overflow:auto">${msg.html}</div>` : `<pre dir="rtl" style="white-space:pre-wrap;margin:0;padding:16px;background:var(--g50,#f6f9f2);border-radius:12px;font:14px/1.9 Tahoma,Arial,sans-serif;text-align:right;max-height:520px;overflow:auto">${esc(msg.body)}</pre>`}</div>`;

  $('#mt-pick', body).onchange = e => { MailTests.k = e.target.value; mailTests(body); };
  const send = async x => { const to = $('#mt-to', body).value.trim(); if (!mailEmailRe.test(to)) { toast('اكتب بريداً صحيحاً', 'error'); return false; } const m = x[3](); return sendMailNotice(to, { subject: '[تجربة] ' + m.subject, body: m.body, html: m.html }); };
  $('#mt-send', body).onclick = e => { const b = e.currentTarget; b.disabled = true; send(cur).finally(() => { b.disabled = false; }); };
  $('#mt-all', body).onclick = async e => {
    if (!Automation.on) { toast('الإرسال الجماعي يحتاج تفعيل الأتمتة', 'error'); return; }
    if (!await confirmBox(`إرسال ${LIST.length} رسائل تجريبية إلى ${esc($('#mt-to', body).value.trim())}؟ (تُحتسب من حصة Gmail اليومية)`, { ok: 'إرسال الكل' })) return;
    const b = e.currentTarget; b.disabled = true; let n = 0;
    for (const x of LIST) { if (await send(x)) n++; await new Promise(r => setTimeout(r, 600)); }
    b.disabled = false; toast(`أُرسلت ${n} رسائل تجريبية`);
  };
}
