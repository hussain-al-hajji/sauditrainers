/* التسجيل كمدرب: معالج بخطوات مع معاينة حيّة للبطاقة، ومتابعة حالة الطلب */

const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const appId = () => { const a = new Uint32Array(7); crypto.getRandomValues(a); return 'A' + Array.from(a, x => ALPHA[x % ALPHA.length]).join(''); };
const DRAFT_KEY = 'st-join-draft';
const MAX_SPECS = 5;

// حقول الملف المشتركة بين التسجيل ولوحة المدرب ولوحة الإدارة
function profileFields(d = {}, { withPrivate = true } = {}) {
  const sp = Data.specs(d), md = Data.modes(d), links = d.links || {};
  return {
    basic: `
      <div class="grid2">
        ${field('الاسم كما يظهر في البطاقة *', `<input type="text" name="name" required maxlength="60" value="${esc(d.name)}" placeholder="مثال: أ. سارة العتيبي">`)}
        ${field('الاسم بالإنجليزية', `<input type="text" name="nameEn" maxlength="60" dir="ltr" value="${esc(d.nameEn)}" placeholder="Sarah Alotaibi">`, 'يُستخدم في رابط صفحتك المختصر')}
        ${field('الجنس *', `<select name="gender" required><option value="">اختر</option>${opt('m', 'مدرب', d.gender)}${opt('f', 'مدربة', d.gender)}</select>`)}
        ${field('المنطقة *', `<select name="region" required><option value="">اختر المنطقة</option>${REGIONS.map(r => opt(r.k, r.name, d.region)).join('')}</select>`)}
        ${field('المدينة', `<input type="text" name="city" maxlength="40" value="${esc(d.city)}">`)}
        ${withPrivate ? field('الجوال (للتواصل الإداري) *', `<input type="tel" name="phone" required maxlength="20" value="${esc(d.phone)}" placeholder="05xxxxxxxx">`) : ''}
        ${withPrivate ? field('البريد الإلكتروني *', `<input type="email" name="email" required maxlength="120" value="${esc(d.email)}" dir="ltr">`) : ''}
      </div>`,
    spec: `
      ${field('اللقب المهني (سطر تعريفي) *', `<input type="text" name="title" required maxlength="80" value="${esc(d.title)}" placeholder="مثال: مدربة معتمدة في القيادة والتحول الرقمي">`)}
      <div class="field"><span>التخصصات التدريبية * <small>(حتى ${MAX_SPECS})</small></span><div class="checks" id="specs">${SPECIALTIES.map(s => `<label class="chk"><input type="checkbox" name="specs" data-multi value="${s.k}" ${sp.includes(s.k) ? 'checked' : ''}><span><i class="fa-solid ${s.icon}"></i>${s.name}</span></label>`).join('')}</div></div>
      ${field('البرامج ومجالات الخبرة', `<textarea name="topics" maxlength="800" placeholder="اكتب كل برنامج في سطر أو افصل بفاصلة: إدارة الوقت، القيادة الفعالة، ...">${esc(d.topics)}</textarea>`)}
      <div class="field"><span>طريقة التقديم *</span><div class="checks">${DELIVERY.map(x => `<label class="chk"><input type="checkbox" name="modes" data-multi value="${x.k}" ${md.includes(x.k) ? 'checked' : ''}><span><i class="fa-solid ${x.icon}"></i>${x.name}</span></label>`).join('')}</div></div>`,
    exp: `
      <div class="grid3">
        ${field('سنوات الخبرة التدريبية', `<input type="number" name="years" min="0" max="60" value="${esc(d.years)}">`)}
        ${field('الساعات التدريبية المنفذة', `<input type="number" name="hours" min="0" max="100000" value="${esc(d.hours)}">`)}
        ${field('عدد البرامج والدورات', `<input type="number" name="programs" min="0" max="10000" value="${esc(d.programs)}">`)}
      </div>
      ${field('الشهادات والاعتمادات', `<textarea name="certs" maxlength="800" placeholder="مثال: شهادة إعداد المدربين TOT — المؤسسة العامة للتدريب التقني والمهني">${esc(d.certs)}</textarea>`)}
      ${field('نبذة تعريفية *', `<textarea name="bio" required maxlength="1200" placeholder="عرّف بنفسك وبخبرتك التدريبية وأبرز إنجازاتك في فقرة مختصرة">${esc(d.bio)}</textarea>`)}
      ${field('لغات التدريب', `<input type="text" name="langs" maxlength="60" value="${esc(d.langs || 'العربية')}">`)}`,
    media: `
      <label class="photo-drop" id="pdrop">
        <span class="pv" id="pv">${d._photo ? `<img class="pv" src="${esc(d._photo)}" alt="">` : '<i class="fa-solid fa-camera"></i>'}</span>
        <span><b>الصورة الشخصية</b><br><small class="muted">صورة رسمية واضحة بخلفية هادئة — تُقصّ تلقائياً. اسحبها هنا أو اضغط للاختيار.</small></span>
        <input type="file" accept="image/*" id="pfile" hidden>
      </label>
      <div class="field"><span>تصميم البطاقة</span><div class="themes">${CARD_THEMES.map(t => `<label title="${t.name}"><input type="radio" name="theme" value="${t.k}" ${(d.theme || 'emerald') === t.k ? 'checked' : ''}><span style="background:linear-gradient(135deg,${t.a},${t.c})"></span></label>`).join('')}</div></div>
      <div class="grid2">
        ${field('<i class="fa-brands fa-whatsapp"></i> واتساب (يظهر في البطاقة)', `<input type="tel" name="l_whatsapp" maxlength="20" value="${esc(links.whatsapp)}" placeholder="05xxxxxxxx">`)}
        ${field('<i class="fa-solid fa-envelope"></i> بريد التواصل (يظهر في البطاقة)', `<input type="email" name="l_email" maxlength="120" dir="ltr" value="${esc(links.email)}">`)}
        ${field('<i class="fa-brands fa-linkedin-in"></i> لينكدإن', `<input type="url" name="l_linkedin" maxlength="200" dir="ltr" value="${esc(links.linkedin)}">`)}
        ${field('<i class="fa-brands fa-x-twitter"></i> إكس', `<input type="text" name="l_x" maxlength="200" dir="ltr" value="${esc(links.x)}" placeholder="@username">`)}
        ${field('<i class="fa-brands fa-instagram"></i> إنستقرام', `<input type="text" name="l_instagram" maxlength="200" dir="ltr" value="${esc(links.instagram)}">`)}
        ${field('<i class="fa-brands fa-youtube"></i> يوتيوب', `<input type="url" name="l_youtube" maxlength="200" dir="ltr" value="${esc(links.youtube)}">`)}
        ${field('<i class="fa-solid fa-globe"></i> موقع شخصي', `<input type="url" name="l_website" maxlength="200" dir="ltr" value="${esc(links.website)}">`)}
      </div>`
  };
}

// تحويل بيانات النموذج إلى سجل مدرب
function readProfile(form) {
  const d = formData(form);
  const links = {};
  LINKS.forEach(l => { const v = d[`l_${l.k}`]; delete d[`l_${l.k}`]; if (v) links[l.k] = v; });
  d.links = links;
  ['years', 'hours', 'programs'].forEach(k => { if (k in d) d[k] = Math.max(0, Number(toEnDigits(d[k])) || 0); });
  if (d.specs) d.specs = d.specs.slice(0, MAX_SPECS);
  return d;
}

// ربط رفع الصورة وحد التخصصات ومعاينة البطاقة
function wireProfileForm(form, { onPhoto, preview, getPhoto }) {
  const drop = $('#pdrop', form), file = $('#pfile', form);
  const take = async f => {
    try { const url = await resizeImage(f); onPhoto(url); $('#pv', form).innerHTML = `<img class="pv" src="${url}" alt="">`; preview(); }
    catch (e) { toast(e.message, 'error'); }
  };
  if (drop) {
    file.onchange = () => file.files[0] && take(file.files[0]);
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', e => e.dataTransfer.files[0] && take(e.dataTransfer.files[0]));
  }
  const specs = $('#specs', form);
  specs && specs.addEventListener('change', e => {
    if ($$('input:checked', specs).length > MAX_SPECS) { e.target.checked = false; toast(`يمكن اختيار ${MAX_SPECS} تخصصات كحد أقصى`, 'error'); }
  });
  form.addEventListener('input', debounce(preview, 120));
  form.addEventListener('change', preview);
}

function previewCard(box, d, photo) {
  // الصورة المرفوعة تمر عبر photoUrl (رابط data:) دون حفظها
  box.innerHTML = Card.full({ ...d, id: '__preview', photoUrl: photo || d.photoUrl }, { preview: true });
  tilt(box);
}

/* ===================== صفحة الانضمام ===================== */
Pages.join = {
  static: true,
  render() {
    const c = Data.content();
    const steps = [['fa-id-card', 'البيانات'], ['fa-layer-group', 'التخصص'], ['fa-award', 'الخبرة'], ['fa-camera', 'الصورة والتواصل'], ['fa-paper-plane', 'المراجعة']];
    return `
    <section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / سجّل كمدرب سعودي</div><h1>سجّل كمدرّب سعودي</h1><p>خمس خطوات، وترى بطاقتك التعريفية تتشكّل أمامك لحظة بلحظة. يُحفظ تقدّمك تلقائياً على جهازك.</p></div></section>
    <div class="wrap" style="margin-top:-30px;position:relative">
      <div class="cards3" style="margin-bottom:26px">
        <div class="icard reveal"><div class="ic"><i class="fa-solid fa-list-check"></i></div><h3>المتطلبات</h3><ul style="margin:0;padding-inline-start:18px;color:var(--ink2)">${lines(c.join.requirements).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
        <div class="icard reveal" style="--d:80ms"><div class="ic"><i class="fa-solid fa-gift"></i></div><h3>ماذا تحصل؟</h3><ul style="margin:0;padding-inline-start:18px;color:var(--ink2)">${lines(c.join.benefits).slice(0, 4).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
        <div class="icard reveal" style="--d:160ms"><div class="ic"><i class="fa-solid fa-receipt"></i></div><h3><span class="num">${esc(c.join.fee)}</span> ريال</h3><p><b>${esc(c.join.feeNote)}</b> — ${esc(c.join.period)}.<br><span class="small muted">لا يُطلب السداد إلا بعد قبول الطلب.</span></p></div>
      </div>
      <div class="wizard">
        <div class="wiz-main">
          <div class="wiz-steps" id="ws">${steps.map(([i, l], n) => `<button type="button" data-s="${n}" class="${n ? '' : 'on'}"><i class="fa-solid ${i}"></i>${l}</button>`).join('')}</div>
          <div class="wiz-prog"><span id="wp" style="width:20%"></span></div>
          <form id="wf" novalidate autocomplete="off">
            <div class="wiz-body"></div>
          </form>
          <div class="wiz-nav"><button class="btn ghost" id="wb" type="button"><i class="fa-solid fa-arrow-right"></i> السابق</button><button class="btn primary" id="wn" type="button">التالي <i class="fa-solid fa-arrow-left"></i></button></div>
        </div>
        <aside class="wiz-side"><div class="lbl"><i class="fa-solid fa-eye"></i> معاينة حيّة لبطاقتك</div><div id="pvw"></div></aside>
      </div>
    </div>`;
  },
  mount(root) {
    const c = Data.content();
    let draft = {};
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') || {}; } catch { draft = {}; }
    let photo = draft._photo || '';
    const F = profileFields(draft);
    const body = $('.wiz-body', root);
    body.innerHTML = `
      <div class="wiz-pane on" data-p="0"><h2>البيانات الأساسية</h2><p class="muted">بيانات التواصل الإداري لا تظهر للعامة.</p>${F.basic}</div>
      <div class="wiz-pane" data-p="1"><h2>التخصص والبرامج</h2><p class="muted">اختر ما تمارس التدريب فيه فعلياً؛ تظهر بطاقتك في نتائج هذه التخصصات.</p>${F.spec}</div>
      <div class="wiz-pane" data-p="2"><h2>الخبرة والمؤهلات</h2><p class="muted">الأرقام تظهر في بطاقتك كمؤشرات بارزة.</p>
        <div class="req-box"><label class="chk" style="display:block"><input type="checkbox" name="tot" ${draft.tot ? 'checked' : ''}><span><i class="fa-solid fa-certificate"></i> حضرت دورة واحدة على الأقل في إعداد المدربين (TOT) *</span></label></div>
        ${field('رابط الشهادات أو السيرة الذاتية (Google Drive أو غيره)', `<input type="url" name="cvUrl" maxlength="300" dir="ltr" value="${esc(draft.cvUrl)}" placeholder="https://drive.google.com/...">`, 'تأكد أن الرابط متاح لأي شخص لديه الرابط؛ يطّلع عليه فريق المراجعة فقط')}
        ${F.exp}</div>
      <div class="wiz-pane" data-p="3"><h2>الصورة وروابط التواصل</h2><p class="muted">اختر تصميم بطاقتك وروابط التواصل التي تريد إظهارها للجهات التدريبية.</p>${F.media}</div>
      <div class="wiz-pane" data-p="4"><h2>المراجعة والإرسال</h2><div id="sum"></div>
        <div class="req-box"><b>السداد</b><p class="small" style="margin:.3em 0 0">${nl2br(c.join.payment)}</p></div>
        <label class="chk" style="display:block"><input type="checkbox" name="agree"><span><i class="fa-solid fa-file-signature"></i> أقرّ بصحة البيانات، وأوافق على نشرها في المنصة وعلى رسوم التسجيل (<span class="num">${esc(c.join.fee)}</span> ريال) بعد القبول</span></label>
      </div>`;
    const form = $('#wf', root);
    const panes = $$('.wiz-pane', root), stepsBtns = $$('#ws button', root);
    let cur = 0;
    const save = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readProfile(form), _photo: photo })); } catch { /* ignore */ } };
    const preview = () => { previewCard($('#pvw', root), readProfile(form), photo); save(); };
    wireProfileForm(form, { onPhoto: u => { photo = u; }, preview });

    const need = {
      0: () => ['name', 'gender', 'region', 'phone', 'email'],
      1: () => ['title'],
      2: () => ['bio'],
      3: () => [],
      4: () => []
    };
    function validate(n) {
      const d = readProfile(form);
      let ok = true;
      $$('.inv', panes[n]).forEach(x => x.classList.remove('inv'));
      need[n]().forEach(k => { if (!d[k]) { form.elements[k].classList.add('inv'); ok = false; } });
      if (!ok) { toast('أكمل الحقول المطلوبة المعلّمة', 'error'); return false; }
      if (n === 0 && !validPhone(d.phone)) { form.elements.phone.classList.add('inv'); toast('رقم الجوال غير صحيح (مثال: 0501234567)', 'error'); return false; }
      if (n === 0 && !validEmail(d.email)) { form.elements.email.classList.add('inv'); toast('البريد الإلكتروني غير صحيح', 'error'); return false; }
      if (n === 1 && !d.specs.length) { toast('اختر تخصصاً واحداً على الأقل', 'error'); return false; }
      if (n === 1 && !d.modes.length) { toast('اختر طريقة تقديم واحدة على الأقل', 'error'); return false; }
      if (n === 2 && !d.tot) { toast('حضور دورة إعداد المدربين (TOT) من متطلبات التسجيل', 'error'); return false; }
      if (n === 3 && !photo) { toast('أضف صورتك الشخصية لتكتمل البطاقة', 'error'); return false; }
      return true;
    }
    function go(n) {
      cur = n;
      panes.forEach((p, i) => p.classList.toggle('on', i === n));
      stepsBtns.forEach((b, i) => { b.classList.toggle('on', i === n); b.classList.toggle('done', i < n); });
      $('#wp', root).style.width = `${(n + 1) * 20}%`;
      $('#wb', root).style.visibility = n ? 'visible' : 'hidden';
      $('#wn', root).innerHTML = n === 4 ? '<i class="fa-solid fa-paper-plane"></i> إرسال الطلب' : 'التالي <i class="fa-solid fa-arrow-left"></i>';
      if (n === 4) summary();
      $('.wiz-main', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function summary() {
      const d = readProfile(form);
      $('#sum', root).innerHTML = `<dl class="dl">
        <dt>الاسم</dt><dd>${esc(d.name)}</dd><dt>المنطقة</dt><dd>${esc(regionName(d.region))} ${esc(d.city)}</dd>
        <dt>الجوال</dt><dd class="num">${esc(d.phone)}</dd><dt>البريد</dt><dd>${esc(d.email)}</dd>
        <dt>التخصصات</dt><dd>${d.specs.map(specName).join('، ')}</dd><dt>طريقة التقديم</dt><dd>${d.modes.map(m => DELIVERY.find(x => x.k === m)?.name).join('، ')}</dd>
        <dt>الخبرة</dt><dd><span class="num">${d.years || 0}</span> سنة · <span class="num">${d.hours || 0}</span> ساعة · <span class="num">${d.programs || 0}</span> برنامج</dd>
      </dl>`;
    }
    stepsBtns.forEach((b, i) => b.onclick = () => { if (i <= cur || [...Array(i).keys()].every(k => k < cur || validate(k))) go(i); });
    $('#wb', root).onclick = () => cur && go(cur - 1);
    $('#wn', root).onclick = async () => {
      if (cur < 4) { if (validate(cur)) go(cur + 1); return; }
      for (let k = 0; k < 4; k++) if (!validate(k)) { go(k); return; }
      const d = readProfile(form);
      if (!d.agree) { toast('يلزم الإقرار والموافقة قبل الإرسال', 'error'); return; }
      const id = appId();
      const rec = { ...Data.pick(d, Data.PUBLIC_FIELDS), phone: phoneDigits(d.phone), email: d.email.toLowerCase(), cvUrl: d.cvUrl || '', tot: true, photo, id, ts: Date.now(), status: 'new' };
      $('#wn', root).disabled = true;
      Store.set(`applications/${id}`, rec);
      Store.set(`appStatus/${id}`, { status: 'new', ts: Date.now() });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      $('.wiz-main', root).innerHTML = `<div class="done-card">
        <div class="big"><i class="fa-solid fa-check"></i></div>
        <h2>استلمنا طلبك يا ${esc(d.name.split(' ')[0])} 🎉</h2>
        <p class="muted">احتفظ برقم الطلب لمتابعة حالته. سنراجع طلبك ونتواصل معك على الجوال والبريد.</p>
        <div class="ticket"><small class="muted">رقم الطلب</small><b class="num">${id}</b></div>
        <div class="row" style="justify-content:center"><button class="btn" id="cpy"><i class="fa-solid fa-copy"></i> نسخ الرقم</button><a class="btn primary" href="#/status?id=${id}">متابعة الطلب</a></div>
      </div>`;
      $('#cpy', root).onclick = () => copyText(id, 'تم نسخ رقم الطلب');
    };
    go(0);
    preview();
  }
};

/* ===================== متابعة حالة الطلب ===================== */
Pages.status = {
  static: true,
  render(params) {
    return `
    <section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / متابعة الطلب</div><h1>متابعة طلب التسجيل</h1><p>أدخل رقم الطلب الذي ظهر لك بعد الإرسال.</p></div></section>
    <div class="wrap" style="margin-top:-30px;position:relative;max-width:640px">
      <div class="panel">
        <form id="sf" class="row"><input class="code-in grow" name="id" placeholder="AXXXXXXX" value="${esc(params.get('id') || '')}" required style="flex:1"><button class="btn primary">عرض الحالة</button></form>
        <div id="so"></div>
      </div>
    </div>`;
  },
  mount(root, params) {
    const show = async id => {
      id = Security.normCode(id);
      if (!/^A[0-9A-Z]{7}$/.test(id)) { $('#so', root).innerHTML = '<p class="error-msg">رقم الطلب غير صحيح</p>'; return; }
      $('#so', root).innerHTML = '<p class="muted">جارٍ البحث...</p>';
      const st = await Store.readOnce(`appStatus/${id}`);
      if (!st) { $('#so', root).innerHTML = '<p class="error-msg">لم نجد طلباً بهذا الرقم</p>'; return; }
      const order = ['new', 'review', 'accepted', 'published'];
      const idx = st.status === 'interview' ? 1 : order.indexOf(st.status);
      const rej = st.status === 'rejected';
      const items = [
        ['fa-inbox', 'استلام الطلب', 'تم استلام طلبك بنجاح'],
        ['fa-magnifying-glass', 'المراجعة', st.status === 'interview' ? 'نحتاج استيضاحاً منك، سنتواصل معك' : 'يراجع الفريق بياناتك ومؤهلاتك'],
        ['fa-circle-check', 'القبول والسداد', 'تم قبول طلبك — بانتظار سداد الرسوم وإرسال الإيصال'],
        ['fa-certificate', 'النشر', 'بطاقتك منشورة وتصلك بيانات الدخول']
      ];
      $('#so', root).innerHTML = `<div class="timeline">${items.map((it, i) => {
        const cls = rej && i === 1 ? 'bad' : i < idx || (i === idx && st.status === 'published') ? 'done' : i === idx ? 'cur' : '';
        return `<div class="tl ${cls}"><i class="fa-solid ${rej && i === 1 ? 'fa-circle-xmark' : it[0]}"></i><div><b>${rej && i === 1 ? 'لم يُقبل الطلب' : it[1]}</b><small>${rej && i === 1 ? 'نشكر اهتمامك، ويمكنك التقديم مجدداً بعد استيفاء المتطلبات' : it[2]}</small></div></div>`;
      }).join('')}</div>
      ${st.note ? `<div class="banner info"><i class="fa-solid fa-message"></i>${nl2br(st.note)}</div>` : ''}
      ${st.trainerSlug ? `<a class="btn gold" href="#/t/${esc(st.trainerSlug)}"><i class="fa-solid fa-id-card"></i> عرض بطاقتي</a>` : ''}
      <p class="small muted">آخر تحديث: ${fmtTs(st.ts)}</p>`;
    };
    $('#sf', root).onsubmit = e => { e.preventDefault(); show(e.target.id.value); };
    if (params.get('id')) show(params.get('id'));
  }
};
