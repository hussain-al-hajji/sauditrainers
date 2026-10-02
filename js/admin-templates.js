/* لوحة الإدارة ← قوالب: رسائل مراحل طلب التسجيل (بريد وواتساب) وبيانات السداد
 * القوالب في settings/templates وبيانات الحساب البنكي في settings/payment (للإدارة فقط ولا تُقرأ من الموقع العام). */

function aTemplates(main) {
  const chip = ([k, l]) => `<button type="button" class="tvar" data-v="${k}" title="${l}">{${k}}<small>${l}</small></button>`;
  const sample = () => Tpl.vars({ a: { id: 'ABCD1234', name: 'أ. سارة العتيبي' }, t: { name: 'أ. سارة العتيبي', code: 'ST0012', slug: 'sarah' }, secret: 'ST0012-7K4Q9P' });
  main.innerHTML = `
    <div class="dash-h"><h2>قوالب الرسائل</h2></div>
    <div id="ctpl"></div>
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
  cardTemplateBox($('#ctpl', main));
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

/* قالب البطاقة التعريفية: المحتوى والخصائص والألوان والخطوط، مع معاينة حيّة. يُحفظ في content/cardTemplate ويسري على كل البطاقات وصور المشاركة */
function cardTemplateBox(host) {
  let draft = cardTemplate(), theme = 'brand', fmt = 'post';
  const sample = () => ({ name: 'أ. سارة العتيبي', title: 'مدربة معتمدة في القيادة والتحول الرقمي', gender: 'f', noPhoto: true, theme, regions: ['riyadh', 'makkah', 'eastern'], region: 'riyadh', years: 8, hours: 1200, programs: 60, specs: ['leadership', 'digital', 'soft', 'speaking'] });
  const get = path => path.split('.').reduce((o, k) => o[k], draft);
  const set = (path, v) => { const k = path.split('.'); const last = k.pop(); k.reduce((o, x) => o[x], draft)[last] = v; };
  const chk = (p, l) => `<label class="chk"><input type="checkbox" data-p="${p}" ${get(p) ? 'checked' : ''}><span>${l}</span></label>`;
  const txt = (p, l) => `<label class="field"><span>${l}</span><input type="text" data-p="${p}" maxlength="90" value="${esc(get(p))}"></label>`;
  const rng = (p, l, a, b) => `<label class="field"><span>${l}: <b class="num" data-v="${p}">${get(p)}</b></span><input type="range" data-p="${p}" min="${a}" max="${b}" value="${get(p)}"></label>`;
  const col = (p, l) => `<label class="field cpick"><span>${l}</span><input type="color" data-p="${p}" value="${get(p)}"></label>`;
  const fnt = (p, l) => `<label class="field"><span>${l}</span><select data-p="${p}">${CARD_FONTS.map(f => opt(f, f, get(p))).join('')}</select></label>`;
  const draw = () => {
    host.innerHTML = `<div class="pbox"><h3><i class="fa-solid fa-id-card"></i>قالب البطاقة التعريفية ${Store.get('content/cardTemplate') ? '<span class="pill gold">معدَّل</span>' : ''}</h3>
      <p class="muted small">يسري على بطاقات كل المدربين في الموقع وصور المشاركة (المنشور والقصة). تُعاين التعديلات فوراً قبل الحفظ.</p>
      <div class="editor"><div style="display:grid;gap:14px">
        <div class="field"><span>العناصر الظاهرة</span><div class="checks">${chk('show.logo', 'الشعار')}${chk('show.title', 'السطر التعريفي')}${chk('show.region', 'المنطقة')}${chk('show.stats', 'الإحصاءات')}${chk('show.specs', 'التخصصات')}${chk('show.flag', 'علم المملكة')}${chk('show.pattern', 'نقش القرطاسية')}${chk('show.footer', 'التذييل')}</div></div>
        <div class="grid2">${rng('maxSpecs', 'عدد التخصصات في البطاقة', 1, 6)}${rng('maxRegions', 'عدد المناطق المعروضة', 1, 3)}${rng('nameScale', 'حجم الاسم %', 70, 130)}${rng('patternOpacity', 'وضوح النقش %', 0, 100)}${rng('radius', 'استدارة الحواف', 0, 48)}</div>
        <div class="grid2">${txt('text.years', 'نص: سنوات الخبرة')}${txt('text.hours', 'نص: الساعات التدريبية')}${txt('text.programs', 'نص: البرامج والدورات')}${txt('text.preview', 'كلمة المعاينة')}${txt('text.footLead', 'عبارة التذييل')}${txt('text.brand', 'اسم المنصة في التذييل')}${txt('text.site', 'الرابط في التذييل')}</div>
        <div class="grid2">${fnt('fonts.name', 'خط الاسم')}${fnt('fonts.body', 'خط النصوص')}${fnt('fonts.brand', 'خط اسم المنصة والرابط')}</div>
        <div class="field"><span>الألوان</span><div class="checks">${chk('colors.on', 'استخدام ألوان القالب بدل ثيم كل مدرب')}</div>
          <div class="grid2" ${draft.colors.on ? '' : 'style="opacity:.45"'}>${col('colors.a', 'الخلفية (داكن)')}${col('colors.b', 'الخلفية (متوسط)')}${col('colors.c', 'التوهج')}${col('colors.accent', 'لون التمييز')}${col('colors.fg', 'لون النص')}</div></div>
        <div class="row"><button class="btn primary" id="ct-save"><i class="fa-solid fa-floppy-disk"></i> حفظ القالب</button><button class="btn sm" id="ct-img"><i class="fa-solid fa-image"></i> معاينة صورة المنشور</button><button class="btn sm ghost" id="ct-reset" ${Store.get('content/cardTemplate') ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i> القالب الافتراضي</button></div>
      </div><div class="preview"><div id="ct-pv"></div>
        <div class="checks" style="justify-content:center;margin-top:10px">${CARD_THEMES.map(t => `<label title="${t.name}"><input type="radio" name="ctheme" value="${t.k}" ${t.k === theme ? 'checked' : ''}><span class="cdot" style="background:linear-gradient(135deg,${t.a},${t.c})"></span></label>`).join('')}</div></div></div></div>`;
    preview();
  };
  const preview = () => { const pv = $('#ct-pv', host); pv.innerHTML = Card.full(sample(), { preview: true, tpl: cardTemplate(draft) }); tilt(pv); };
  host.addEventListener('input', e => {
    const p = e.target.dataset.p; if (!p) return;
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? Number(e.target.value) : e.target.value;
    set(p, v); const lab = $(`[data-v="${p}"]`, host); if (lab) lab.textContent = v;
    draft = cardTemplate(draft);
    if (p === 'colors.on') draw(); else preview();
  });
  host.addEventListener('change', e => { if (e.target.name === 'ctheme') { theme = e.target.value; preview(); } });
  host.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'ct-save') { await Store.set('content/cardTemplate', cardTemplate(draft)); Security.log('تعديل قالب البطاقة', ''); toast('حُفظ قالب البطاقة'); draw(); }
    if (b.id === 'ct-reset') { if (!await confirmBox('العودة إلى القالب الافتراضي؟', { ok: 'استعادة' })) return; await Store.set('content/cardTemplate', null); draft = cardTemplate(null); toast('استُعيد القالب الافتراضي'); draw(); }
    if (b.id === 'ct-img') { const cv = await Card.render(sample(), fmt, cardTemplate(draft)); cv.style.width = '100%'; cv.style.borderRadius = '14px'; const m = modal('<h3><i class="fa-solid fa-image"></i> صورة المنشور</h3><div id="ctv"></div>'); m.$('#ctv').appendChild(cv); }
  });
  draw();
}
