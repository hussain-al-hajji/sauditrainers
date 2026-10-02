/* النماذج القابلة للتعديل: نموذج تسجيل المدربين ونموذج إضافة/تعديل مدرب
 * الإعداد محفوظ في content/form ويُعدَّل من لوحة الإدارة ← النماذج.
 * الحقول الأساسية (core) مرتبطة بالبطاقة ولا تُحذف (تُخفى أو يُعدَّل نصها)، والحقول المخصصة تُضاف وتُحذف بحرية
 * وتُحفظ إجاباتها في extra/{key}. */

const MAX_SPECS = 5;

// الحقول الأساسية: lock = لا تُخفى ولا يُلغى إلزامها، priv = بيانات إدارية لا تظهر لأحد، joinOnly = في طلب التسجيل فقط
const CORE_FIELDS = {
  name: { label: 'الاسم كما يظهر في البطاقة', type: 'text', max: 60, ph: 'مثال: أ. سارة العتيبي', req: true, lock: true },
  nameEn: { label: 'الاسم بالإنجليزية', type: 'text', max: 60, ltr: true, ph: 'Sarah Alotaibi', hint: 'يُستخدم في رابط صفحتك المختصر' },
  gender: { label: 'الجنس', type: 'gender', req: true },
  region: { label: 'المنطقة', type: 'region', req: true, lock: true },
  city: { label: 'المدينة', type: 'text', max: 40 },
  phone: { label: 'الجوال', type: 'tel', req: true, lock: true, priv: true, hint: 'للتواصل الإداري فقط — لا يظهر لأحد في المنصة' },
  email: { label: 'البريد الإلكتروني', type: 'email', req: true, lock: true, priv: true, hint: 'تصلك عليه طلبات الجهات التدريبية' },
  title: { label: 'اللقب المهني (سطر تعريفي)', type: 'text', max: 80, req: true, ph: 'مثال: مدربة معتمدة في القيادة والتحول الرقمي', w: 'full' },
  specs: { label: 'التخصصات التدريبية', type: 'specs', req: true, lock: true, hint: `حتى ${MAX_SPECS} تخصصات`, w: 'full' },
  topics: { label: 'البرامج ومجالات الخبرة', type: 'textarea', max: 800, ph: 'اكتب كل برنامج في سطر أو افصل بفاصلة: إدارة الوقت، القيادة الفعالة، ...', w: 'full' },
  modes: { label: 'طريقة التقديم', type: 'modes', req: true, w: 'full' },
  years: { label: 'سنوات الخبرة التدريبية', type: 'number', max: 60 },
  hours: { label: 'الساعات التدريبية المنفذة', type: 'number', max: 100000 },
  programs: { label: 'عدد البرامج والدورات', type: 'number', max: 10000 },
  certs: { label: 'الشهادات والاعتمادات', type: 'textarea', max: 800, ph: 'مثال: شهادة إعداد المدربين TOT', w: 'full' },
  bio: { label: 'نبذة تعريفية', type: 'textarea', max: 1200, req: true, ph: 'عرّف بنفسك وبخبرتك التدريبية وأبرز إنجازاتك', hint: 'لا تضع أرقام تواصل أو بريداً أو روابط؛ التواصل يتم عبر المنصة', w: 'full' },
  langs: { label: 'لغات التدريب', type: 'text', max: 60, ph: 'العربية' },
  photoUrl: { label: 'الصورة الشخصية (رابط Google Drive) — اختيارية', type: 'photo', w: 'full' },
  theme: { label: 'تصميم البطاقة', type: 'theme', w: 'full' },
  tot: { label: 'حضرت دورة واحدة على الأقل في إعداد المدربين (TOT)', type: 'consent', req: true, joinOnly: true, w: 'full' },
  cvUrl: { label: 'رابط الشهادات أو السيرة الذاتية', type: 'url', joinOnly: true, priv: true, ltr: true, ph: 'https://drive.google.com/...', hint: 'يطّلع عليه فريق المراجعة فقط', w: 'full' }
};

const FIELD_TYPES = [
  { k: 'text', name: 'نص قصير', icon: 'fa-font' },
  { k: 'textarea', name: 'فقرة', icon: 'fa-align-right' },
  { k: 'number', name: 'رقم', icon: 'fa-hashtag' },
  { k: 'select', name: 'قائمة منسدلة', icon: 'fa-list' },
  { k: 'multi', name: 'اختيار متعدد', icon: 'fa-list-check' },
  { k: 'date', name: 'تاريخ', icon: 'fa-calendar' },
  { k: 'url', name: 'رابط', icon: 'fa-link' },
  { k: 'tel', name: 'جوال', icon: 'fa-phone' },
  { k: 'email', name: 'بريد إلكتروني', icon: 'fa-at' },
  { k: 'consent', name: 'إقرار / موافقة', icon: 'fa-square-check' }
];
const typeName = t => FIELD_TYPES.find(x => x.k === t)?.name || ({ gender: 'اختيار الجنس', region: 'المنطقة', specs: 'التخصصات', modes: 'طريقة التقديم', photo: 'صورة من Drive', theme: 'تصميم البطاقة' }[t] || t);

function defaultForms() {
  const f = ks => ks.map(k => ({ k }));
  return {
    join: { steps: [
      { id: 's1', title: 'البيانات', icon: 'fa-id-card', desc: 'بيانات التواصل الإداري لا تظهر لأحد في المنصة.', fields: f(['name', 'nameEn', 'gender', 'region', 'city', 'phone', 'email']) },
      { id: 's2', title: 'التخصص', icon: 'fa-layer-group', desc: 'اختر ما تمارس التدريب فيه فعلياً؛ تظهر بطاقتك في نتائج هذه التخصصات.', fields: f(['title', 'specs', 'topics', 'modes']) },
      { id: 's3', title: 'الخبرة', icon: 'fa-award', desc: 'الأرقام تظهر في بطاقتك كمؤشرات بارزة.', fields: f(['tot', 'cvUrl', 'years', 'hours', 'programs', 'certs', 'bio', 'langs']) },
      { id: 's4', title: 'الصورة والتصميم', icon: 'fa-camera', desc: 'هذه الخطوة اختيارية: عند الرغبة في نشر صورتك أضف رابطها من Google Drive ونسّقها داخل الدائرة، أو أجّلها الآن وأضفها لاحقاً من لوحتك. واختر تصميم بطاقتك.', fields: f(['photoUrl', 'theme']) }
    ] },
    admin: { steps: [
      { id: 'a1', title: 'البيانات الأساسية', icon: 'fa-id-card', fields: f(['name', 'nameEn', 'gender', 'region', 'city', 'phone', 'email']) },
      { id: 'a2', title: 'التخصص', icon: 'fa-layer-group', fields: f(['title', 'specs', 'topics', 'modes']) },
      { id: 'a3', title: 'الخبرة', icon: 'fa-award', fields: f(['years', 'hours', 'programs', 'certs', 'bio', 'langs']) },
      { id: 'a4', title: 'الصورة والتصميم', icon: 'fa-camera', fields: f(['photoUrl', 'theme']) }
    ] }
  };
}

const FormKit = (() => {
  // الإعداد النهائي لنموذج: المحفوظ + الحقول الأساسية الناقصة (لا يضيع حقل أساسي أبداً)
  function config(kind) {
    const def = defaultForms()[kind];
    const stored = Store.get(`content/form/${kind}`);
    let steps = stored && arr(stored.steps).length ? arr(stored.steps).map(s => ({ ...s, fields: arr(s.fields) })) : JSON.parse(JSON.stringify(def.steps));
    const have = new Set(steps.flatMap(s => s.fields.map(f => f.k)));
    def.steps.forEach(ds => ds.fields.forEach(df => {
      if (have.has(df.k)) return;
      (steps.find(s => s.id === ds.id) || steps[0]).fields.push({ k: df.k });
    }));
    return steps.map(s => ({ ...s, fields: s.fields.map(f => (f.custom ? { w: ['textarea', 'multi', 'consent'].includes(f.type) ? 'full' : '', ...f } : CORE_FIELDS[f.k] ? { ...CORE_FIELDS[f.k], ...f, core: true, lock: CORE_FIELDS[f.k].lock, priv: CORE_FIELDS[f.k].priv, joinOnly: CORE_FIELDS[f.k].joinOnly, type: CORE_FIELDS[f.k].type } : null)).filter(Boolean) }));
  }
  const required = f => !!(f.lock ? CORE_FIELDS[f.k].req : f.req);

  // الحقول الظاهرة حسب السياق: join (التسجيل)، admin (إضافة/تعديل من الإدارة)، self (المدرب يعدّل بطاقته)
  function visible(f, ctx) {
    if (f.hidden && !f.lock) return false;
    if (ctx === 'join') return true;
    if (f.joinOnly) return false;
    if (ctx === 'self') return !f.priv && (!f.custom || (f.pub && f.edit !== false));
    return true;
  }
  function steps(ctx) {
    return config(ctx === 'join' ? 'join' : 'admin').map(s => ({ ...s, fields: s.fields.filter(f => visible(f, ctx)) })).filter(s => s.fields.length);
  }
  // كل الحقول المخصصة المعروفة (لتحديد العام منها عند النشر)
  const customDefs = () => [...config('join'), ...config('admin')].flatMap(s => s.fields).filter(f => f.custom);
  const isPublicExtra = k => customDefs().some(f => f.k === k && f.pub);

  /* ===== عرض الحقول ===== */
  const val = (d, f) => (f.custom ? d.extra?.[f.k] : d[f.k]);
  function input(f, d) {
    const v = val(d, f), name = f.custom ? `x_${f.k}` : f.k, rq = required(f) ? 'required' : '';
    const ph = f.ph ? `placeholder="${esc(f.ph)}"` : '', mx = f.max ? `maxlength="${f.max}"` : '';
    switch (f.type) {
      case 'textarea': return `<textarea name="${name}" ${rq} ${ph} maxlength="${f.max || 1000}">${esc(v)}</textarea>`;
      case 'number': return `<input type="number" name="${name}" min="0" ${f.max ? `max="${f.max}"` : ''} value="${esc(v ?? '')}" ${ph}>`;
      case 'gender': return `<select name="gender" ${rq}><option value="">اختر</option>${opt('m', 'مدرب', v)}${opt('f', 'مدربة', v)}</select>`;
      case 'region': return `<select name="region" ${rq}><option value="">اختر المنطقة</option>${REGIONS.map(r => opt(r.k, r.name, v)).join('')}</select>`;
      case 'select': return `<select name="${name}" ${rq}><option value="">اختر</option>${arr(f.opts).map(o => opt(o, o, v)).join('')}</select>`;
      case 'multi': { const cur = String(v || '').split('|'); return `<div class="checks">${arr(f.opts).map(o => `<label class="chk"><input type="checkbox" name="${name}" data-multi value="${esc(o)}" ${cur.includes(o) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`; }
      case 'specs': { const sp = Data.specs(d); return `<div class="checks" data-max="${MAX_SPECS}">${SPECIALTIES.map(s => `<label class="chk"><input type="checkbox" name="specs" data-multi value="${s.k}" ${sp.includes(s.k) ? 'checked' : ''}><span><i class="fa-solid ${s.icon}"></i>${s.name}</span></label>`).join('')}</div>`; }
      case 'modes': { const md = Data.modes(d); return `<div class="checks">${DELIVERY.map(x => `<label class="chk"><input type="checkbox" name="modes" data-multi value="${x.k}" ${md.includes(x.k) ? 'checked' : ''}><span><i class="fa-solid ${x.icon}"></i>${x.name}</span></label>`).join('')}</div>`; }
      case 'consent': return `<label class="chk consent"><input type="checkbox" name="${name}" ${v === true || v === 'نعم' ? 'checked' : ''}><span><i class="fa-solid fa-circle-check"></i>${esc(f.label)}${required(f) ? ' *' : ''}</span></label>`;
      case 'theme': return `<div class="themes">${CARD_THEMES.map(t => `<label title="${t.name}"><input type="radio" name="theme" value="${t.k}" ${(v || 'brand') === t.k ? 'checked' : ''}><span style="background:linear-gradient(135deg,${t.a},${t.c})${t.light ? ';box-shadow:inset 0 0 0 1px #c9d8c0' : ''}"></span><em>${t.name}</em></label>`).join('')}</div>`;
      case 'photo': return photoField(d);
      default: return `<input type="${['tel', 'email', 'url', 'date'].includes(f.type) ? f.type : 'text'}" name="${name}" ${rq} ${ph} ${mx} ${f.ltr || ['email', 'url', 'tel'].includes(f.type) ? 'dir="ltr"' : ''} value="${esc(v ?? '')}">`;
    }
  }
  function photoField(d) {
    const f = Card.fit({ ...d, photoZ: d.photoZ ?? 1.2 }), src = Data.photo(d);
    return `<div class="photo-field">
      <input type="url" name="photoUrl" dir="ltr" maxlength="300" value="${esc(d.photoUrl)}" placeholder="https://drive.google.com/file/d/.../view">
      <div class="pf-row">
        <span class="pf-circle avw ${d.noPhoto ? 'sym' : src ? '' : 'ph'}" data-i="${initials(d.name || '؟')}">${d.noPhoto ? Card.symbol(d.gender) : src ? `<img src="${esc(src)}" alt="" referrerpolicy="no-referrer" style="${Card.imgStyle(f)}">` : '<i class="fa-solid fa-user"></i>'}</span>
        <div class="pf-ranges">
          <label><span><i class="fa-solid fa-arrows-left-right"></i> الموضع الأفقي</span><input type="range" dir="ltr" name="photoX" min="0" max="100" value="${f.x}"></label>
          <label><span><i class="fa-solid fa-arrows-up-down"></i> الموضع الرأسي</span><input type="range" dir="ltr" name="photoY" min="0" max="100" value="${f.y}"></label>
          <label><span><i class="fa-solid fa-magnifying-glass-plus"></i> التكبير</span><input type="range" dir="ltr" name="photoZ" min="1" max="2.5" step="0.05" value="${f.z}"></label>
        </div>
      </div>
      <div class="pf-np ${d.gender === 'f' ? '' : 'hidden'}"><input type="hidden" name="noPhoto" value="${d.noPhoto ? '1' : ''}">
        <button type="button" class="btn sm ${d.noPhoto ? 'primary' : 'ghost'}" data-nophoto><i class="fa-solid fa-user-slash"></i> <span>${d.noPhoto ? 'ستظهر بطاقتي بصورة رمزية — اضغط للتراجع وإضافة صورة' : 'لا أرغب بنشر الصورة الشخصية مطلقاً'}</span></button>
        <small class="muted">تظهر في بطاقتك صورة رمزية بلا ملامح تشير إلى أن صاحبة البطاقة مدربة.</small></div>
      <p class="pf-msg small muted">${src ? '' : 'اختيارية — يمكنك تأجيل هذه الخطوة الآن وإضافة صورتك لاحقاً من لوحتك عند الرغبة في نشرها.'}</p>
      <details class="drive-help"><summary><i class="fa-brands fa-google-drive"></i> كيف أضيف صورتي من Google Drive؟</summary>
        <ol><li>ارفع صورة شخصية واضحة إلى Google Drive.</li><li>اضغط على الصورة بالزر الأيمن ← مشاركة ← «أي شخص لديه الرابط» (عارض).</li><li>انسخ الرابط والصقه هنا، ثم نسّق الصورة داخل الدائرة.</li></ol></details>
    </div>`;
  }
  function fieldHTML(f, d) {
    if (f.type === 'consent') return `<div class="field full req-box">${input(f, d)}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</div>`;
    const group = ['specs', 'modes', 'multi', 'theme', 'photo'].includes(f.type);
    const lab = `${esc(f.label)}${required(f) ? ' *' : ''}${f.type === 'specs' ? ` <small>(${esc(f.hint || '')})</small>` : ''}`;
    const hint = f.type !== 'specs' && f.hint ? `<small>${esc(f.hint)}</small>` : '';
    return group ? `<div class="field ${f.w === 'full' ? 'full' : ''}" data-f="${esc(f.k)}"><span>${lab}</span>${input(f, d)}${hint}</div>`
      : `<label class="field ${f.w === 'full' ? 'full' : ''}" data-f="${esc(f.k)}"><span>${lab}</span>${input(f, d)}${hint}</label>`;
  }
  const stepHTML = (s, d) => `<div class="grid2">${s.fields.map(f => fieldHTML(f, d)).join('')}</div>`;

  /* ===== قراءة النموذج ===== */
  function read(form) {
    const raw = formData(form), d = { extra: {} };
    Object.entries(raw).forEach(([k, v]) => {
      if (k.startsWith('x_')) d.extra[k.slice(2)] = Array.isArray(v) ? v.join('|') : typeof v === 'boolean' ? (v ? 'نعم' : '') : v;
      else d[k] = v;
    });
    ['years', 'hours', 'programs'].forEach(k => { if (k in d) d[k] = Math.max(0, Number(toEnDigits(d[k])) || 0); });
    ['photoX', 'photoY', 'photoZ'].forEach(k => { if (k in d) d[k] = Number(d[k]); });
    d.noPhoto = d.noPhoto === '1' && d.gender === 'f'; // الصورة الرمزية للمدربات فقط
    if (d.specs) d.specs = d.specs.slice(0, MAX_SPECS);
    Object.keys(d.extra).forEach(k => { if (d.extra[k] === '' || d.extra[k] == null) delete d.extra[k]; });
    return d;
  }

  /* ===== التحقق ===== */
  function validate(fields, d, form) {
    $$('.inv', form).forEach(x => x.classList.remove('inv'));
    const bad = (f, msg) => { const el = form.querySelector(`[data-f="${CSS.escape(f.k)}"]`) || form.querySelector(`[name="${f.custom ? 'x_' + f.k : f.k}"]`); el && el.classList.add('inv'); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return msg; };
    for (const f of fields) {
      const v = val(d, f);
      const empty = v == null || v === '' || v === false || (Array.isArray(v) && !v.length) || (f.type === 'number' && !Number(v) && required(f));
      if (required(f) && empty) return bad(f, f.type === 'consent' ? `يلزم الإقرار: ${f.label}` : `أكمل الحقل: ${f.label}`);
      if (empty) continue;
      if (f.type === 'tel' && !validPhone(v)) return bad(f, 'رقم الجوال غير صحيح (مثال: 0501234567)');
      if (f.type === 'email' && !validEmail(v)) return bad(f, 'البريد الإلكتروني غير صحيح');
      if (f.type === 'url' && !safeUrl(v)) return bad(f, `الرابط غير صحيح: ${f.label}`);
      if (f.type === 'photo' && !d.noPhoto && !isDriveLink(v) && !String(v).startsWith('data:image/')) return bad(f, 'أضف رابط مشاركة الصورة من Google Drive');
      if (['text', 'textarea'].includes(f.type) && !f.priv && f.k !== 'nameEn') { const leak = leaksContact(v); if (leak) return bad(f, `«${f.label}» يحتوي ${leak}. التواصل مع المدربين يتم عبر نموذج المنصة فقط`); }
    }
    return null;
  }

  /* ===== ربط النموذج: حد التخصصات، معاينة الصورة، والمعاينة الحية ===== */
  function wire(form, preview) {
    form.addEventListener('change', e => {
      const box = e.target.closest('[data-max]');
      if (box && $$('input:checked', box).length > Number(box.dataset.max)) { e.target.checked = false; toast(`يمكن اختيار ${box.dataset.max} تخصصات كحد أقصى`, 'error'); }
    });
    const pf = $('.photo-field', form);
    const photo = () => {
      if (!pf) return;
      const d = read(form), c = $('.pf-circle', pf), msg = $('.pf-msg', pf), src = Data.photo(d), f = Card.fit(d);
      pf.classList.toggle('np', !!d.noPhoto);
      $('.pf-np', pf).classList.toggle('hidden', d.gender !== 'f');
      const npb = $('[data-nophoto]', pf); npb.classList.toggle('primary', !!d.noPhoto); npb.classList.toggle('ghost', !d.noPhoto);
      $('span', npb).textContent = d.noPhoto ? 'ستظهر بطاقتي بصورة رمزية — اضغط للتراجع وإضافة صورة' : 'لا أرغب بنشر الصورة الشخصية مطلقاً';
      if (d.noPhoto) { c.className = 'pf-circle avw sym'; c.innerHTML = Card.symbol('f'); msg.textContent = 'ستظهر في بطاقتك صورة رمزية بلا ملامح تشير إلى أن صاحبتها مدربة.'; return; }
      c.classList.remove('sym');
      if (!d.photoUrl) { c.classList.add('ph'); c.innerHTML = '<i class="fa-solid fa-user"></i>'; msg.textContent = ''; return; }
      if (!isDriveLink(d.photoUrl) && !d.photoUrl.startsWith('data:image/')) { msg.textContent = 'الصق رابط مشاركة من Google Drive'; return; }
      let img = $('img', c);
      if (!img || img.dataset.src !== src) {
        c.classList.remove('ph'); c.innerHTML = `<img alt="" referrerpolicy="no-referrer" data-src="${esc(src)}">`; img = $('img', c);
        msg.textContent = 'جارٍ تحميل الصورة...';
        img.onload = () => { msg.textContent = 'كبّر الصورة قليلاً ثم حرّك الموضعين لضبط الإطار داخل الدائرة'; };
        img.onerror = () => { c.classList.add('ph'); c.textContent = c.dataset.i; msg.textContent = 'تعذّر قراءة الصورة — تأكد أن الملف مشارَك «لأي شخص لديه الرابط»'; };
        img.src = src;
      }
      img.style.cssText = Card.imgStyle(f);
    };
    form.addEventListener('input', e => { if (pf && pf.contains(e.target)) photo(); });
    if (pf) {
      $('[data-nophoto]', pf).onclick = () => { const h = pf.querySelector('[name=noPhoto]'); h.value = h.value ? '' : '1'; photo(); preview(); };
      // تغيير الجنس: يظهر الزر للمدربات فقط، ويُلغى خيار الصورة الرمزية عند اختيار «مدرب»
      const g = form.querySelector('[name=gender]');
      g && g.addEventListener('change', () => { if (g.value !== 'f') pf.querySelector('[name=noPhoto]').value = ''; photo(); });
    }
    form.addEventListener('input', debounce(preview, 140));
    form.addEventListener('change', preview);
  }

  return { config, steps, stepHTML, fieldHTML, read, validate, wire, isPublicExtra, customDefs, required, visible };
})();

// معاينة البطاقة الحية
function previewCard(box, d) {
  box.innerHTML = Card.full({ ...d, id: '__preview' }, { preview: true });
  tilt(box);
}
