/* لوحة الإدارة ← قوالب: رسائل مراحل طلب التسجيل (بريد وواتساب) وبيانات السداد
 * القوالب في settings/templates وبيانات الحساب البنكي في settings/payment (للإدارة فقط ولا تُقرأ من الموقع العام). */

function aTemplates(main) {
  const chip = ([k, l]) => `<button type="button" class="tvar" data-v="${k}" title="${l}">{${k}}<small>${l}</small></button>`;
  const sample = () => Tpl.vars({ a: { id: 'ABCD1234', name: 'أ. سارة العتيبي' }, t: { name: 'أ. سارة العتيبي', code: 'ST0012', slug: 'sarah' }, secret: 'ST0012-7K4Q9P' });
  main.innerHTML = `
    <div class="dash-h"><h2>قوالب الرسائل</h2></div>
    <p class="muted small">الرسائل المرسلة في مراحل طلب التسجيل. انقر على أي متغير ليُدرج في الحقل المحدد، وتُستبدل المتغيرات ببيانات المتقدم عند الإرسال.</p>
    <div class="pbox"><h3><i class="fa-solid fa-building-columns"></i>بيانات السداد</h3>
      <p class="muted small">تظهر في رسالة القبول المبدئي بدل المتغير {bank}. تُحفظ للإدارة فقط ولا تظهر في الموقع.</p>
      <label class="field"><span>الحساب البنكي (اسم البنك، اسم الحساب، الآيبان)</span><textarea id="bank" dir="rtl" style="min-height:100px" placeholder="البنك: ...&#10;اسم الحساب: ...&#10;الآيبان: SA...">${esc(Store.get('settings/payment/bank') || '')}</textarea></label>
      <p class="small muted">المبلغ ومدة الاشتراك وتعليمات السداد من «المحتوى العام ← التسجيل والرسوم» (الحالي: <b class="num">${esc(Data.content().join.fee)}</b> ريال، ${esc(Data.content().join.period)}).</p>
      <button class="btn primary sm" id="sb">حفظ بيانات السداد</button></div>
    ${Object.entries(TPL_META).map(([k, mt]) => { const t = Tpl.get(k); const custom = !!Store.get(`settings/templates/${k}`); return `
      <div class="pbox tpl-box" data-k="${k}"><h3><i class="fa-solid ${mt.icon}"></i>${mt.name} ${custom ? '<span class="pill gold">معدَّل</span>' : ''}</h3>
        <p class="muted small"><i class="fa-solid fa-circle-info"></i> ${mt.when}</p>
        <div class="tvars">${TPL_VARS.filter(v => mt.vars.includes(v[0])).map(chip).join('')}</div>
        <label class="field"><span><i class="fa-solid fa-envelope"></i> عنوان البريد</span><input type="text" data-f="subject" value="${esc(t.subject)}"></label>
        <label class="field"><span><i class="fa-solid fa-envelope"></i> نص البريد</span><textarea data-f="body" style="min-height:230px">${esc(t.body)}</textarea></label>
        ${mt.wa ? `<label class="field"><span><i class="fa-brands fa-whatsapp"></i> نص الواتساب <small>(*نص* للخط العريض)</small></span><textarea data-f="wa" style="min-height:200px">${esc(t.wa)}</textarea></label>` : ''}
        <div class="row"><button class="btn primary sm" data-save><i class="fa-solid fa-floppy-disk"></i> حفظ</button><button class="btn sm" data-prev><i class="fa-solid fa-eye"></i> معاينة بيانات تجريبية</button><button class="btn sm ghost" data-reset ${custom ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i> القالب الافتراضي</button></div>
      </div>`; }).join('')}`;
  let focus = null;
  main.addEventListener('focusin', e => { if (e.target.matches('textarea, input[data-f]')) focus = e.target; });
  $$('.tvar', main).forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
  $$('.tvar', main).forEach(b => b.onclick = () => {
    const box = b.closest('.tpl-box'), el = (focus && box.contains(focus)) ? focus : $('[data-f=body]', box);
    const v = `{${b.dataset.v}}`, s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
    el.value = el.value.slice(0, s) + v + el.value.slice(e); el.focus(); el.setSelectionRange(s + v.length, s + v.length);
  });
  $('#sb', main).onclick = () => { Store.set('settings/payment/bank', $('#bank', main).value.trim() || null); Security.log('تعديل بيانات السداد'); toast('تم حفظ بيانات السداد'); };
  $$('.tpl-box', main).forEach(box => {
    const k = box.dataset.k;
    $('[data-save]', box).onclick = () => {
      const o = {}; $$('[data-f]', box).forEach(el => { o[el.dataset.f] = el.value.trim(); });
      if (!o.subject || !o.body) { toast('العنوان والنص مطلوبان', 'error'); return; }
      Store.set(`settings/templates/${k}`, o); Security.log('تعديل قالب', TPL_META[k].name); toast('تم حفظ القالب'); aTemplates(main);
    };
    $('[data-reset]', box).onclick = async () => { if (!await confirmBox('استعادة القالب الافتراضي؟', { ok: 'استعادة' })) return; Store.remove(`settings/templates/${k}`); aTemplates(main); };
    $('[data-prev]', box).onclick = () => {
      const v = sample(), r = t => Tpl.render(t, v);
      const val = f => $(`[data-f=${f}]`, box)?.value || '';
      modal(`<h3><i class="fa-solid fa-eye"></i> معاينة: ${TPL_META[k].name}</h3>
        <div class="pv-mail"><small class="muted">عنوان البريد</small><b>${esc(r(val('subject')))}</b><pre>${esc(r(val('body')))}</pre></div>
        ${TPL_META[k].wa ? `<div class="pv-wa"><small class="muted"><i class="fa-brands fa-whatsapp"></i> واتساب</small><pre>${esc(r(val('wa')))}</pre></div>` : ''}`, { wide: true });
    };
  });
}
