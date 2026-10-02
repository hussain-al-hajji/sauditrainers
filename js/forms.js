/* النماذج القابلة للتعديل: نموذج تسجيل المدربين ونموذج إضافة/تعديل مدرب
 * الإعداد محفوظ في content/form ويُعدَّل من لوحة الإدارة ← النماذج.
 * الحقول الأساسية (core) مرتبطة بالبطاقة ولا تُحذف (تُخفى أو يُعدَّل نصها)، والحقول المخصصة تُضاف وتُحذف بحرية
 * وتُحفظ إجاباتها في extra/{key}. */

const MAX_SPECS = 15;   // أقصى عدد تخصصات يختارها المدرب
const MAX_CARD_SPECS = 6; // أقصى ما يظهر منها في البطاقة التعريفية
const LANG_OPTS = ['العربية', 'الإنجليزية'];

// الحقول الأساسية: lock = لا تُخفى ولا يُلغى إلزامها، priv = بيانات إدارية لا تظهر لأحد، joinOnly = في طلب التسجيل فقط
const CORE_FIELDS = {
  name: { label: 'الاسم كما يظهر في البطاقة', type: 'text', max: 60, ph: 'مثال: أ. سارة العتيبي', req: true, lock: true },
  nameEn: { label: 'الاسم بالإنجليزية', type: 'text', max: 60, ltr: true, ph: 'Sarah Alotaibi', hint: 'يُكتب تلقائياً من اسمك العربي ويمكنك تعديله، ويُستخدم في رابط صفحتك المختصر' },
  gender: { label: 'الجنس', type: 'gender', req: true },
  region: { label: 'المنطقة (يمكن اختيار أكثر من منطقة)', type: 'region', req: true, lock: true, w: 'full' },
  city: { label: 'المدينة', type: 'text', max: 40 },
  travel: { label: 'مستعد للسفر حسب الاحتياجات التدريبية', type: 'consent', w: 'full' },
  phone: { label: 'الجوال', type: 'tel', req: true, lock: true, priv: true, hint: 'للتواصل الإداري فقط — لا يظهر لأحد في المنصة' },
  email: { label: 'البريد الإلكتروني', type: 'email', req: true, lock: true, priv: true, hint: 'تصلك عليه طلبات الجهات التدريبية' },
  title: { label: 'اللقب المهني (سطر تعريفي)', type: 'text', max: 80, req: true, ph: 'مثال: مدربة معتمدة في القيادة والتحول الرقمي', w: 'full' },
  specs: { label: 'مجالات التدريب', type: 'specs', req: true, lock: true, hint: `اختر حتى ${MAX_SPECS} مجالاً`, w: 'full' },
  topics: { label: 'عناوين دورات تم تقديمها سابقاً', type: 'textarea', max: 800, ph: 'اكتب عنوان كل دورة في سطر أو افصل بفاصلة: إدارة الوقت، القيادة الفعالة، ...', w: 'full' },
  modes: { label: 'طريقة التقديم', type: 'modes', req: true, w: 'full' },
  years: { label: 'سنوات الخبرة التدريبية', type: 'number', max: 60 },
  hours: { label: 'الساعات التدريبية المنفذة', type: 'number', max: 100000 },
  programs: { label: 'عدد البرامج والدورات', type: 'number', max: 10000 },
  certs: { label: 'الشهادات والاعتمادات', type: 'textarea', max: 800, ph: 'مثال: شهادة إعداد المدربين TOT', w: 'full' },
  bio: { label: 'نبذة تعريفية', type: 'textarea', max: 1200, req: true, ph: 'عرّف بنفسك وبخبرتك التدريبية وأبرز إنجازاتك', hint: 'لا تضع أرقام تواصل أو بريداً أو روابط؛ التواصل يتم عبر المنصة', w: 'full' },
  langs: { label: 'لغة التدريب', type: 'langs', req: true, w: 'full' },
  photoUrl: { label: 'الصورة الشخصية (رابط مشاركة الصورة)', type: 'photo', w: 'full' },
  theme: { label: 'تصميم البطاقة', type: 'theme', w: 'full' },
  tot: { label: 'شهادة تدريب المدربين (TOT)', type: 'tot', req: true, joinOnly: true, w: 'full' },
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
const typeName = t => FIELD_TYPES.find(x => x.k === t)?.name || ({ gender: 'اختيار الجنس', region: 'المنطقة', specs: 'التخصصات', modes: 'طريقة التقديم', photo: 'صورة من رابط', theme: 'تصميم البطاقة' }[t] || t);

function defaultForms() {
  const f = ks => ks.map(k => ({ k }));
  return {
    join: { steps: [
      { id: 's1', title: 'البيانات', icon: 'fa-id-card', desc: 'بيانات التواصل الإداري لا تظهر لأحد في المنصة.', fields: f(['name', 'nameEn', 'gender', 'region', 'city', 'travel', 'phone', 'email']) },
      { id: 's2', title: 'التخصص', icon: 'fa-layer-group', desc: 'اختر ما تمارس التدريب فيه فعلياً؛ تظهر بطاقتك في نتائج هذه التخصصات.', fields: f(['title', 'specs', 'topics', 'modes']) },
      { id: 's3', title: 'الخبرة', icon: 'fa-award', desc: 'الأرقام تظهر في بطاقتك كمؤشرات بارزة.', fields: [{ k: 'tot' }, { k: 'cvUrl', hidden: true }, ...f(['years', 'hours', 'programs', 'certs', 'bio', 'langs'])] },
      { id: 's4', title: 'الصورة والتصميم', icon: 'fa-camera', desc: 'هذه الخطوة اختيارية: عند الرغبة في نشر صورتك أضف رابط مشاركتها من Google Drive أو أي مساحة تخزين سحابية ونسّقها داخل الدائرة، أو أجّلها الآن وأضفها لاحقاً من لوحتك. واختر تصميم بطاقتك.', fields: f(['photoUrl', 'theme']) }
    ] },
    admin: { steps: [
      { id: 'a1', title: 'البيانات الأساسية', icon: 'fa-id-card', fields: f(['name', 'nameEn', 'gender', 'region', 'city', 'travel', 'phone', 'email']) },
      { id: 'a2', title: 'التخصص', icon: 'fa-layer-group', fields: f(['title', 'specs', 'bio', 'topics', 'modes']) },
      { id: 'a3', title: 'الخبرة', icon: 'fa-award', fields: f(['years', 'hours', 'programs', 'certs', 'langs']) },
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
      case 'region': { const on = regionsOf(d); return `<div class="checks">${REGIONS.map(r => `<label class="chk"><input type="checkbox" name="regions" data-multi value="${r.k}" ${on.includes(r.k) ? 'checked' : ''}><span><i class="fa-solid fa-location-dot"></i>${esc(r.name)}</span></label>`).join('')}</div>`; }
      case 'select': return `<select name="${name}" ${rq}><option value="">اختر</option>${arr(f.opts).map(o => opt(o, o, v)).join('')}</select>`;
      case 'multi': { const cur = String(v || '').split('|'); return `<div class="checks">${arr(f.opts).map(o => `<label class="chk"><input type="checkbox" name="${name}" data-multi value="${esc(o)}" ${cur.includes(o) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`; }
      case 'specs': {
        const sp = Data.specs(d).filter(k => k !== 'other'), cs = arr(d.cardSpecs);
        return `<div class="specs-box">
          <div class="checks" data-max="${MAX_SPECS}">${pickableSpecs().map(s => specLabel(s, sp.includes(s.k))).join('')}
            <label class="chk"><input type="checkbox" data-other-toggle><span><i class="fa-solid fa-plus"></i>أخرى</span></label></div>
          <div class="spec-add hidden">
            <p class="spec-hint"><i class="fa-solid fa-circle-info"></i> اكتب تخصصاً واحداً فقط ثم اضغط (إضافة - Enter)، ثم اضغط «أخرى» من جديد لتكتب تخصصاً آخر عند الحاجة. تجنّب كتابة عدة تخصصات في سطر واحد.</p>
            <div class="row"><input type="text" maxlength="60" placeholder="اسم التخصص الجديد"><button type="button" class="btn sm primary" data-spec-add>إضافة - Enter</button></div>
          </div>
          <div class="card-specs"><b><i class="fa-solid fa-id-card"></i> ما يظهر في بطاقتك التعريفية <small>(حتى ${MAX_CARD_SPECS}، والباقي يظهر في صفحتك)</small></b>
            <div class="checks" data-max="${MAX_CARD_SPECS}">${pickableSpecs().map(s => cardSpecLabel(s, sp.includes(s.k), cs.includes(s.k))).join('')}</div>
            <small class="muted cs-empty ${sp.length ? 'hidden' : ''}">اختر مجالاتك أولاً ثم حدّد ما يظهر منها في البطاقة. وإن لم تحدد فتظهر أول ${MAX_CARD_SPECS} مجالات.</small></div></div>`;
      }
      case 'langs': {
        const cur = splitList(d.langs ?? 'العربية'), others = cur.filter(x => !LANG_OPTS.includes(x)), other = others.join('، ');
        return `<div class="checks">${LANG_OPTS.map(l => `<label class="chk"><input type="checkbox" name="langsSel" data-multi value="${l}" ${cur.includes(l) ? 'checked' : ''}><span><i class="fa-solid fa-language"></i>${l}</span></label>`).join('')}
          <label class="chk"><input type="checkbox" data-lang-other ${other ? 'checked' : ''}><span><i class="fa-solid fa-plus"></i>أخرى</span></label></div>
          <input type="text" class="lang-other ${other ? '' : 'hidden'}" name="langsOther" maxlength="30" placeholder="اكتب اللغة الأخرى" value="${esc(other)}">`;
      }
      case 'tot': return `<div class="tot-box"><label class="chk consent"><input type="radio" name="tot" value="1" ${d.tot === true ? 'checked' : ''}><span><i class="fa-solid fa-circle-check"></i>أؤكد أنني حصلت على شهادة تدريب المدربين (TOT)</span></label>
          <label class="chk consent"><input type="radio" name="tot" value="0" ${d.tot === false ? 'checked' : ''}><span><i class="fa-solid fa-circle-minus"></i>لم أحصل على شهادة ToT حتى الآن</span></label></div>`;
      case 'modes': { const md = Data.modes(d); return `<div class="checks">${DELIVERY.map(x => `<label class="chk"><input type="checkbox" name="modes" data-multi value="${x.k}" ${md.includes(x.k) ? 'checked' : ''}><span><i class="fa-solid ${x.icon}"></i>${x.name}</span></label>`).join('')}</div>`; }
      case 'consent': return `<label class="chk consent"><input type="checkbox" name="${name}" ${v === true || v === 'نعم' ? 'checked' : ''}><span><i class="fa-solid fa-circle-check"></i>${esc(f.label)}${required(f) ? ' *' : ''}</span></label>`;
      case 'theme': return `<div class="themes">${CARD_THEMES.map(t => `<label title="${t.name}"><input type="radio" name="theme" value="${t.k}" ${(v || 'brand') === t.k ? 'checked' : ''}><span style="background:linear-gradient(135deg,${t.a},${t.c})${t.light ? ';box-shadow:inset 0 0 0 1px #c9d8c0' : ''}"></span><em>${t.name}</em></label>`).join('')}</div>`;
      case 'photo': return photoField(d);
      default: return `<input type="${['tel', 'email', 'url', 'date'].includes(f.type) ? f.type : 'text'}" name="${name}" ${rq} ${ph} ${mx} ${f.ltr || ['email', 'url', 'tel'].includes(f.type) ? 'dir="ltr"' : ''} value="${esc(v ?? '')}">`;
    }
  }
  const specLabel = (s, on) => `<label class="chk"><input type="checkbox" name="specs" data-multi value="${esc(s.k)}" ${on ? 'checked' : ''}><span><i class="fa-solid ${esc(s.icon)}"></i>${esc(s.name)}</span></label>`;
  const cardSpecLabel = (s, shown, on) => `<label class="chk cs ${shown ? '' : 'hidden'}" data-k="${esc(s.k)}"><input type="checkbox" name="cardSpecs" data-multi value="${esc(s.k)}" ${on ? 'checked' : ''}><span>${esc(s.name)}</span></label>`;
  function photoField(d) {
    const f = Card.fit({ ...d, photoZ: d.photoZ ?? 1.2 }), src = Data.photo(d);
    return `<div class="photo-field">
      <input type="url" name="photoUrl" dir="ltr" maxlength="300" value="${esc(d.photoUrl)}" placeholder="https://drive.google.com/file/d/.../view">
      <small class="muted"><i class="fa-solid fa-link"></i> ضع رابط مشاركة الصورة هنا (Google Drive أو أي مساحة تخزين سحابية).</small>
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
      <details class="drive-help"><summary><i class="fa-solid fa-cloud-arrow-up"></i> كيف أضيف رابط صورتي؟</summary>
        <ol><li>ارفع صورة شخصية واضحة إلى Google Drive أو Dropbox أو OneDrive (أو أي مساحة تخزين تعطي رابطاً مباشراً للصورة).</li><li>اجعل المشاركة «أي شخص لديه الرابط» (عارض).</li><li>انسخ رابط المشاركة والصقه هنا، ثم نسّق الصورة داخل الدائرة. إن لم تظهر المعاينة فالرابط غير مباشر أو المشاركة مغلقة.</li></ol></details>
    </div>`;
  }
  // reqKeys: عند تمريرها تحدد الحقول الإلزامية فعلياً (نموذج الإدارة)؛ وإلا فحسب إعداد الحقل
  function fieldHTML(f, d, reqKeys) {
    if (f.type === 'consent') return `<div class="field full req-box">${input(f, d)}${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</div>`;
    const group = ['region', 'specs', 'modes', 'multi', 'theme', 'photo', 'langs', 'tot'].includes(f.type);
    const lab = `${esc(f.label)}${(reqKeys ? reqKeys.includes(f.k) : required(f)) ? ' *' : ' <em class="opt">(اختياري)</em>'}${f.type === 'specs' ? ` <small>(${esc(f.hint || '')})</small>` : ''}`;
    const hint = f.type !== 'specs' && f.hint ? `<small>${esc(f.hint)}</small>` : '';
    return group ? `<div class="field ${f.w === 'full' ? 'full' : ''}" data-f="${esc(f.k)}"><span>${lab}</span>${input(f, d)}${hint}</div>`
      : `<label class="field ${f.w === 'full' ? 'full' : ''}" data-f="${esc(f.k)}"><span>${lab}</span>${input(f, d)}${hint}</label>`;
  }
  const stepHTML = (s, d, reqKeys) => `<div class="grid2">${s.fields.map(f => fieldHTML(f, d, reqKeys)).join('')}</div>`;

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
    if ('tot' in d) { d.tot = d.tot === '1' ? true : d.tot === '0' ? false : undefined; if (d.tot === undefined) delete d.tot; }
    if ('langsSel' in d || 'langsOther' in d) { d.langs = [...(d.langsSel || []), ...(d.langsOther ? [d.langsOther] : [])].join('، '); delete d.langsSel; delete d.langsOther; }
    if ('regions' in d) { d.regions = d.regions.filter(k => regionOf(k)); d.region = d.regions[0] || ''; } // الأولى رئيسية (البطاقة والبحث)
    if (d.specs) {
      d.specs = d.specs.slice(0, MAX_SPECS);
      d.cardSpecs = (d.cardSpecs || []).filter(k => d.specs.includes(k)).slice(0, MAX_CARD_SPECS);
    }
    Object.keys(d.extra).forEach(k => { if (d.extra[k] === '' || d.extra[k] == null) delete d.extra[k]; });
    return d;
  }

  /* ===== التحقق ===== */
  function validate(fields, d, form) {
    $$('.inv', form).forEach(x => x.classList.remove('inv'));
    const bad = (f, msg) => { const el = form.querySelector(`[data-f="${CSS.escape(f.k)}"]`) || form.querySelector(`[name="${f.custom ? 'x_' + f.k : f.k}"]`); el && el.classList.add('inv'); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return msg; };
    for (const f of fields) {
      const v = val(d, f);
      const empty = f.type === 'tot' ? v == null : (v == null || v === '' || v === false || (Array.isArray(v) && !v.length) || (f.type === 'number' && !Number(v) && required(f)));
      if (required(f) && empty) return bad(f, f.type === 'consent' ? `يلزم الإقرار: ${f.label}` : f.type === 'tot' ? 'اختر: حصلت على شهادة TOT، أو لم أحصل عليها حتى الآن' : `أكمل الحقل: ${f.label}`);
      if (empty) continue;
      if (f.type === 'tel' && !validPhone(v)) return bad(f, 'رقم الجوال غير صحيح (مثال: 0501234567)');
      if (f.type === 'email' && !validEmail(v)) return bad(f, 'البريد الإلكتروني غير صحيح');
      if (f.type === 'url' && !safeUrl(v)) return bad(f, `الرابط غير صحيح: ${f.label}`);
      if (f.type === 'photo' && !d.noPhoto && !isImageLink(v)) return bad(f, 'أضف رابط مشاركة الصورة من Google Drive أو أي مساحة تخزين سحابية (https)');
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
    // مجالات التدريب: تظهر في «ما يظهر في البطاقة» ما اختاره فقط، و«أخرى» تفتح حقل التخصص الجديد
    const sb = $('.specs-box', form);
    if (sb) {
      const sync = () => {
        const on = new Set($$('[name=specs]:checked', sb).map(i => i.value));
        $$('.cs', sb).forEach(l => { const keep = on.has(l.dataset.k); l.classList.toggle('hidden', !keep); if (!keep) $('input', l).checked = false; });
        $('.cs-empty', sb).classList.toggle('hidden', on.size > 0);
      };
      sb.addEventListener('change', e => { if (e.target.name === 'specs') sync(); });
      // «أخرى»: تظهر خانة كتابة تخصص واحد؛ Enter أو زر الإضافة يضيفه إلى قائمة المنصة ويختاره
      const box = $('.spec-add', sb), inp = $('input', box), tg = $('[data-other-toggle]', sb);
      tg.addEventListener('change', () => { box.classList.toggle('hidden', !tg.checked); if (tg.checked) inp.focus(); });
      const addSpec = () => {
        const name = inp.value.trim();
        if (!name) return;
        if (name.length < 2) { toast('اكتب اسم التخصص كاملاً', 'error'); return; }
        const lk = leaksContact(name); if (lk) { toast(`لا تكتب ${lk} في اسم التخصص`, 'error'); return; }
        if (/[،,;؛\n]/.test(name)) { toast('اكتب تخصصاً واحداً فقط في كل مرة', 'error'); return; }
        const k = Data.addSpecialty(name); if (!k) return;
        let lab = $(`[name=specs][value="${CSS.escape(k)}"]`, sb);
        if (!lab) {
          const s = specOf(k);
          $('[data-other-toggle]', sb).closest('label').insertAdjacentHTML('beforebegin', specLabel(s, false));
          $('.card-specs .checks', sb).insertAdjacentHTML('beforeend', cardSpecLabel(s, false, false));
          lab = $(`[name=specs][value="${CSS.escape(k)}"]`, sb);
        }
        if (!lab.checked) {
          if ($$('[name=specs]:checked', sb).length >= MAX_SPECS) { toast(`يمكن اختيار ${MAX_SPECS} تخصصاً كحد أقصى`, 'error'); return; }
          lab.checked = true; lab.dispatchEvent(new Event('change', { bubbles: true }));
        }
        inp.value = ''; tg.checked = false; box.classList.add('hidden'); preview();
        toast(`أُضيف «${name}» إلى قائمة التخصصات واخترته`);
      };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSpec(); } });
      $('[data-spec-add]', sb).addEventListener('click', addSpec);
    }
    // اسم المدرب بالإنجليزية: يُقترح تلقائياً من الاسم العربي حتى يعدّله المستخدم بنفسه
    const nAr = $('[name=name]', form), nEn = $('[name=nameEn]', form);
    if (nAr && nEn) {
      let auto = !nEn.value || nEn.value === arToEn(nAr.value);
      nAr.addEventListener('input', () => { if (!auto) return; nEn.value = arToEn(nAr.value); nEn.dispatchEvent(new Event('input', { bubbles: true })); });
      nEn.addEventListener('input', e => { if (e.isTrusted) auto = !nEn.value; });
    }
    const lo = $('[data-lang-other]', form);
    lo && lo.addEventListener('change', e => { const t = $('.lang-other', form); t.classList.toggle('hidden', !e.target.checked); if (!e.target.checked) t.value = ''; else t.focus(); preview(); });
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
      if (!isImageLink(d.photoUrl)) { msg.textContent = 'الصق رابط مشاركة الصورة (Google Drive أو Dropbox أو OneDrive أو رابط مباشر)'; return; }
      let img = $('img', c);
      if (!img || img.dataset.src !== src) {
        c.classList.remove('ph'); c.innerHTML = `<img alt="" referrerpolicy="no-referrer" data-src="${esc(src)}">`; img = $('img', c);
        msg.textContent = 'جارٍ تحميل الصورة...';
        img.onload = () => { msg.textContent = 'كبّر الصورة قليلاً ثم حرّك الموضعين لضبط الإطار داخل الدائرة'; };
        img.onerror = () => { c.classList.add('ph'); c.textContent = c.dataset.i; msg.textContent = 'تعذّر قراءة الصورة — تأكد أن الملف مشارَك «لأي شخص لديه الرابط» وأن الرابط لصورة وليس لمجلد'; };
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
