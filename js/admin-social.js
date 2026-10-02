/* لوحة الإدارة ← النشر الاجتماعي: جدولة نشر البطاقات التعريفية في إكس ولينكدإن وإنستقرام
 * - النص يُولَّد تلقائياً لكل منصة من قالب قابل للتعديل (إكس بحدود التغريدة 280 حرفاً).
 * - الصورة: البطاقة التعريفية بدقة عالية (منشور 4:5 أو قصة 9:16) تُحفظ مع المنشور في socialImages/{id}.
 * - النشر: يدوي بضغطة (يفتح المنصة بالنص جاهزاً)، أو آلي بالجدولة عند ربط Google Apps Script (integrations/). */

const PLATFORMS = [
  { k: 'x', name: 'إكس', icon: 'fa-brands fa-x-twitter', max: 280 },
  { k: 'linkedin', name: 'لينكدإن', icon: 'fa-brands fa-linkedin-in', max: 3000 },
  { k: 'instagram', name: 'إنستقرام', icon: 'fa-brands fa-instagram', max: 2200 }
];
const SOCIAL_TPL = {
  x: '🌟 تعرّف على {name}\n{title}\n📍 {region} · ⏳ خبرة {years} سنة\n\nللتواصل وطلب التدريب عبر منصة «مدرّبون سعوديّون» 👇\n{link}\n{hashtags}',
  linkedin: '🌟 من مدربي منصة «مدرّبون سعوديّون»: {name}\n{title}\n\n{bio}\n\n🎯 التخصصات: {specs}\n📍 المنطقة: {region}\n⏳ الخبرة التدريبية: {years} سنة\n\nللاطلاع على البطاقة التعريفية وطلب التدريب عبر المنصة:\n{link}\n\n{hashtags}',
  instagram: '🌟 {name}\n{title}\n\n{bio}\n\n🎯 {specs}\n📍 {region} · ⏳ خبرة {years} سنة\n\nللتواصل وطلب التدريب: الرابط في البايو — رقم المدرب {code}\n\n{hashtags}'
};
const SOCIAL_STATUS = {
  draft: ['مسودة', 'gray'], scheduled: ['مجدول', 'info'], published: ['منشور', 'ok'], partial: ['منشور جزئياً', 'warn'], failed: ['فشل النشر', 'bad']
};

const Social = (() => {
  const settings = () => ({ hashtags: '#مدربون_سعوديون #تدريب #تطوير_الذات #السعودية', handles: {}, tpl: {}, ...(Store.get('settings/social') || {}) });
  // طول النص كما يحسبه إكس: الرابط = 23 حرفاً، والرموز التعبيرية = حرفان
  // (أوزان twitter-text: الحروف حتى U+10FF وبعض علامات الترقيم بوزن 1، وما عداها بوزن 2)
  const xWeight = c => (c <= 0x10FF || (c >= 0x2000 && c <= 0x200D) || (c >= 0x2010 && c <= 0x201F) || (c >= 0x2032 && c <= 0x2037) ? 1 : 2);
  const xLength = text => [...String(text).replace(/https?:\/\/\S+/g, 'x'.repeat(23))].reduce((n, ch) => n + (ch.codePointAt(0) === 0xFE0F ? 0 : xWeight(ch.codePointAt(0))), 0);

  function vars(t, s, platform) {
    const specs = Data.specs(t).map(specName);
    return { name: t.name || '', title: t.title || '', region: regionName(t.region), city: t.city || '', specs: specs.join('، '), spec1: specs[0] || '', years: Number(t.years) ? String(t.years) : '', hours: Number(t.hours) ? fmtNum(t.hours) : '',
      bio: String(t.bio || '').slice(0, platform === 'instagram' ? 700 : 900), link: profileUrl(t), code: t.code || '', hashtags: s.hashtags || '', handle: s.handles?.[platform] || '' };
  }
  // يملأ القالب، ويحذف الجزء الذي متغيره فارغ (مثل «خبرة {years} سنة» دون خبرة)
  function fill(tpl, v) {
    return tpl.split('\n').map(line => {
      const parts = line.split(' · ').filter(p => { const ks = [...p.matchAll(/\{(\w+)\}/g)].map(m => m[1]); return !ks.length || ks.some(k => v[k]); });
      if (!parts.length) return null;
      return parts.join(' · ').replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
    }).filter(l => l !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function caption(platform, t) {
    const s = settings(), v = vars(t, s, platform);
    let out = fill(s.tpl?.[platform] || SOCIAL_TPL[platform], v);
    if (platform === 'x') {
      // تقصير تدريجي حتى حدود التغريدة
      for (const k of ['bio', 'specs', 'title', 'hashtags']) { if (xLength(out) <= 280) break; if (k === 'title') v.title = v.title.slice(0, 40) + '…'; else v[k] = ''; out = fill(s.tpl?.x || SOCIAL_TPL.x, v); }
    }
    return out;
  }
  const len = (p, text) => (p === 'x' ? xLength(text) : [...String(text)].length);
  const localDT = ts => { const d = new Date(ts - new Date(ts).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

  async function makeImage(t, format) {
    const { data, photoFailed } = await Card.toJPEG(t, format);
    if (photoFailed) toast(`تعذّر تضمين صورة ${t.name} من Drive؛ ستظهر الأحرف الأولى`, 'error');
    return data;
  }
  async function save(post, { image = true } = {}) {
    const t = Store.get(`trainers/${post.trainerId}`);
    const id = post.id || Store.newId();
    const rec = { ...post, id, trainerName: t?.name || post.trainerName || '', updatedAt: Date.now(), ts: post.ts || Date.now() };
    if (image && t) Store.set(`socialImages/${id}`, await makeImage(t, post.format || 'post'));
    Store.set(`social/${id}`, rec);
    return rec;
  }
  async function imageBlob(post) {
    let data = Store.get(`socialImages/${post.id}`);
    if (!data) { const t = Store.get(`trainers/${post.trainerId}`); if (!t) return null; data = await makeImage(t, post.format || 'post'); }
    return fetch(data).then(r => r.blob());
  }
  function markManual(post, p) {
    const results = { ...(post.results || {}), [p]: { ok: true, manual: true, ts: Date.now() } };
    const all = PLATFORMS.filter(x => post.platforms?.[x.k]).every(x => results[x.k]?.ok);
    Store.update(`social/${post.id}`, { results, status: all ? 'published' : 'partial' });
    return { ...post, results };
  }
  return { settings, caption, len, localDT, save, imageBlob, markManual, xLength };
})();

function aSocial(main) {
  const posts = Store.list('social');
  const now = Date.now();
  const up = posts.filter(p => p.status === 'scheduled').sort((a, b) => a.scheduledAt - b.scheduledAt);
  const drafts = posts.filter(p => p.status === 'draft').sort((a, b) => b.updatedAt - a.updatedAt);
  const done = posts.filter(p => ['published', 'partial', 'failed'].includes(p.status)).sort((a, b) => (b.publishedAt || b.updatedAt) - (a.publishedAt || a.updatedAt)).slice(0, 40);
  const auto = Store.get('settings/automation') || {};
  // شريط الأيام الأربعة عشر القادمة
  const days = [...Array(14).keys()].map(i => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
  const dayCount = d => up.filter(p => { const x = new Date(p.scheduledAt); return x.toDateString() === d.toDateString(); }).length;
  const row = p => {
    const t = Store.get(`trainers/${p.trainerId}`) || { name: p.trainerName };
    const [sn, tone] = SOCIAL_STATUS[p.status] || ['', 'gray'];
    const overdue = p.status === 'scheduled' && p.scheduledAt < now - 10 * 60000;
    return `<div class="sp-row">
      ${Card.avatar(t, 'av')}
      <div class="grow"><b>${esc(t.name || '')}</b> <span class="pill ${tone}">${sn}</span>${overdue ? ` <span class="pill warn" title="${Automation.on ? 'لم يُنشر بعد — تحقق من الربط' : 'الربط الآلي غير مفعّل — انشره يدوياً'}"><i class="fa-solid fa-clock"></i> حان موعده</span>` : ''}<br>
        <small class="muted">${p.scheduledAt ? `<i class="fa-regular fa-calendar"></i> ${fmtTs(p.scheduledAt)}` : 'دون موعد'} · ${p.format === 'story' ? 'قصة 9:16' : 'منشور 4:5'}</small>
        <div class="sp-plats">${PLATFORMS.filter(x => p.platforms?.[x.k]).map(x => { const r = p.results?.[x.k]; return `<span class="sp-pl ${r?.ok ? 'ok' : r?.err ? 'bad' : ''}" title="${r?.err ? esc(r.err) : r?.ok ? (r.manual ? 'نُشر يدوياً' : 'نُشر آلياً') : 'لم يُنشر'}"><i class="${x.icon}"></i>${r?.url ? `<a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener">عرض</a>` : ''}</span>`; }).join('')}</div>
      </div>
      <div class="acts">
        <button class="btn sm primary" data-pub="${esc(p.id)}"><i class="fa-solid fa-paper-plane"></i> نشر الآن</button>
        <button class="btn sm icon" data-ed="${esc(p.id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
        <button class="btn sm icon" data-dup="${esc(p.id)}" title="نسخ"><i class="fa-regular fa-clone"></i></button>
        <button class="btn sm icon" data-del="${esc(p.id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
      </div></div>`;
  };
  main.innerHTML = `
    <div class="dash-h"><h2>النشر الاجتماعي</h2><div class="row">
      <button class="btn sm" id="cfg"><i class="fa-solid fa-plug"></i> الربط والقوالب</button>
      <button class="btn sm" id="bulk"><i class="fa-solid fa-calendar-plus"></i> جدولة مجموعة</button>
      <button class="btn primary sm" id="new"><i class="fa-solid fa-plus"></i> منشور جديد</button></div></div>
    <div class="banner ${Automation.on ? 'ok' : 'info'}"><i class="fa-solid ${Automation.on ? 'fa-robot' : 'fa-hand-pointer'}"></i><span>${Automation.on
      ? `النشر الآلي مفعّل${auto.lastRun ? ` · آخر تشغيل ${ago(auto.lastRun)}` : ''}${auto.platforms ? ` · الحسابات المربوطة: ${PLATFORMS.filter(x => auto.platforms[x.k]).map(x => x.name).join('، ') || 'لا شيء بعد'}` : ''}. تُنشر المنشورات المجدولة تلقائياً في موعدها.`
      : 'النشر الآن يدوي بضغطة: يجهّز النص والصورة ويفتح المنصة. لتفعيل النشر الآلي والجدولة اربط Google Apps Script وحسابات المنصات (التفاصيل في «الربط والقوالب»).'}</span></div>
    <div class="cal">${days.map(d => { const n = dayCount(d); return `<div class="cal-d ${n ? 'has' : ''}"><small>${d.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { weekday: 'short' })}</small><b class="num">${d.getDate()}</b>${n ? `<span class="num">${n}</span>` : ''}</div>`; }).join('')}</div>
    <h3 class="sp-h">المجدولة <span class="muted num">(${up.length})</span></h3>${up.map(row).join('') || '<p class="muted small">لا منشورات مجدولة.</p>'}
    ${drafts.length ? `<h3 class="sp-h">المسودات <span class="muted num">(${drafts.length})</span></h3>${drafts.map(row).join('')}` : ''}
    ${done.length ? `<h3 class="sp-h">السجل</h3>${done.map(row).join('')}` : ''}`;
  $('#new', main).onclick = () => postEditor({});
  $('#bulk', main).onclick = bulkScheduler;
  $('#cfg', main).onclick = socialSettings;
  const get = id => Store.get(`social/${id}`);
  $$('[data-ed]', main).forEach(b => b.onclick = () => postEditor(get(b.dataset.ed)));
  $$('[data-dup]', main).forEach(b => b.onclick = () => { const p = get(b.dataset.dup); postEditor({ ...p, id: null, status: 'draft', results: null, scheduledAt: null }); });
  $$('[data-del]', main).forEach(b => b.onclick = async () => { if (!await confirmBox('حذف المنشور؟', { ok: 'حذف', danger: true })) return; Store.remove(`social/${b.dataset.del}`); Store.remove(`socialImages/${b.dataset.del}`); });
  $$('[data-pub]', main).forEach(b => b.onclick = () => publishNow(get(b.dataset.pub)));
}

async function publishNow(post) {
  if (Automation.on) {
    if (!await confirmBox('نشر المنشور الآن في المنصات المختارة عبر الربط الآلي؟', { ok: 'نشر الآن' })) return;
    Store.update(`social/${post.id}`, { status: 'scheduled', scheduledAt: Date.now() });
    await Automation.notify('publish', post.id);
    toast('أُرسل للنشر — تظهر النتيجة هنا خلال لحظات');
    return;
  }
  manualPublish(post);
}

// النشر اليدوي: نسخ النص وتنزيل الصورة وفتح المنصة بضغطة
function manualPublish(post) {
  const t = Store.get(`trainers/${post.trainerId}`);
  const m = modal(`<h3><i class="fa-solid fa-paper-plane"></i> نشر بطاقة ${esc(post.trainerName || t?.name || '')}</h3>
    <p class="muted small">لكل منصة: انسخ النص ونزّل الصورة، ثم افتح المنصة وأرفق الصورة والصق النص. بعد النشر اضغط «تم».</p>
    ${PLATFORMS.filter(x => post.platforms?.[x.k]).map(x => `<div class="mp-row" data-p="${x.k}">
      <span class="mp-ic"><i class="${x.icon}"></i></span><div class="grow"><b>${x.name}</b><pre class="mp-text">${esc(post.text?.[x.k] || '')}</pre></div>
      <div class="acts" style="flex-direction:column">
        <button class="btn sm" data-copy><i class="fa-solid fa-copy"></i> نسخ النص</button>
        <button class="btn sm" data-img><i class="fa-solid fa-download"></i> الصورة</button>
        <a class="btn sm primary" target="_blank" rel="noopener" href="${esc(x.k === 'x' ? `https://x.com/intent/post?text=${encodeURIComponent(post.text?.x || '')}` : x.k === 'linkedin' ? `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(post.text?.linkedin || '')}` : 'https://www.instagram.com/')}"><i class="${x.icon}"></i> فتح ${x.name}</a>
        <button class="btn sm ${post.results?.[x.k]?.ok ? 'gold' : 'ghost'}" data-done><i class="fa-solid fa-check"></i> ${post.results?.[x.k]?.ok ? 'منشور' : 'تم'}</button>
      </div></div>`).join('')}`, { wide: true });
  $$('.mp-row', m.el).forEach(r => {
    const p = r.dataset.p;
    $('[data-copy]', r).onclick = () => copyText(post.text?.[p] || '', 'تم نسخ النص');
    $('[data-img]', r).onclick = async () => { const b = await Social.imageBlob(post); if (b) download(`${(t?.code || 'card').toLowerCase()}-${post.format || 'post'}.jpg`, b); };
    $('[data-done]', r).onclick = e => { post = Social.markManual(post, p); e.currentTarget.classList.add('gold'); e.currentTarget.innerHTML = '<i class="fa-solid fa-check"></i> منشور'; };
  });
}

function postEditor(post) {
  const live = Data.all().filter(t => t.status === 'active');
  let t = post.trainerId ? Store.get(`trainers/${post.trainerId}`) : null;
  const plats = post.platforms || { x: true, linkedin: true, instagram: true };
  const when = post.scheduledAt || (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); return d.getTime(); })();
  const m = modal(`<h3><i class="fa-solid fa-share-nodes"></i> ${post.id ? 'تعديل منشور' : 'منشور جديد'}</h3>
    <form id="pe" class="pe">
      <div class="pe-main">
        <div class="grid2">
          ${field('المدرب *', `<select name="trainerId" required><option value="">اختر المدرب</option>${live.map(x => opt(x.id, `${x.name} — ${x.code}`, t?.id)).join('')}</select>`)}
          ${field('شكل الصورة', `<select name="format">${opt('post', 'منشور 4:5 (إنستقرام ولينكدإن وإكس)', post.format)}${opt('story', 'قصة 9:16', post.format)}</select>`)}
        </div>
        <div class="field"><span>المنصات</span><div class="checks">${PLATFORMS.map(x => `<label class="chk"><input type="checkbox" name="pl_${x.k}" ${plats[x.k] ? 'checked' : ''}><span><i class="${x.icon}"></i>${x.name}</span></label>`).join('')}</div></div>
        ${PLATFORMS.map(x => `<label class="field pe-cap" data-p="${x.k}"><span><i class="${x.icon}"></i> نص ${x.name} <em class="cnt num"></em> <button type="button" class="btn sm ghost" data-regen="${x.k}"><i class="fa-solid fa-rotate"></i> توليد</button></span><textarea name="tx_${x.k}" style="min-height:${x.k === 'x' ? 120 : 170}px">${esc(post.text?.[x.k] || '')}</textarea></label>`).join('')}
        ${field('موعد النشر', `<input type="datetime-local" name="when" value="${Social.localDT(when)}">`, Automation.on ? 'يُنشر آلياً في هذا الموعد' : 'يظهر في قائمة المجدولة للتذكير، والنشر الآلي يحتاج الربط')}
      </div>
      <div class="pe-side"><div class="lbl small muted center">معاينة الصورة</div><div id="pimg" class="pe-img"><p class="muted small center">اختر المدرب</p></div></div>
      <div class="row end pe-foot"><button type="button" class="btn ghost" data-close>إلغاء</button><button type="button" class="btn" data-save="draft">حفظ مسودة</button><button type="button" class="btn primary" data-save="scheduled"><i class="fa-solid fa-calendar-check"></i> جدولة</button><button type="button" class="btn gold" data-save="now"><i class="fa-solid fa-paper-plane"></i> نشر الآن</button></div>
    </form>`, { wide: true });
  const form = m.$('#pe');
  const counts = () => PLATFORMS.forEach(x => {
    const box = form.querySelector(`.pe-cap[data-p="${x.k}"]`); const on = form[`pl_${x.k}`].checked;
    box.classList.toggle('hidden', !on);
    const n = Social.len(x.k, form[`tx_${x.k}`].value); const c = $('.cnt', box);
    c.textContent = `${n} / ${x.max}`; c.classList.toggle('over', n > x.max);
  });
  const regen = k => { if (t) form[`tx_${k}`].value = Social.caption(k, t); counts(); };
  let imgToken = 0;
  const preview = async () => {
    const box = m.$('#pimg'); if (!t) { box.innerHTML = '<p class="muted small center">اختر المدرب</p>'; return; }
    const my = ++imgToken; box.innerHTML = '<p class="muted small center">جارٍ تجهيز الصورة...</p>';
    const cv = await Card.render(t, form.format.value);
    if (my !== imgToken) return;
    box.innerHTML = ''; cv.style.width = '100%'; cv.style.height = 'auto'; cv.style.borderRadius = '12px'; box.appendChild(cv);
  };
  form.trainerId.onchange = () => { t = Store.get(`trainers/${form.trainerId.value}`); PLATFORMS.forEach(x => { if (!form[`tx_${x.k}`].value.trim() || !post.id) regen(x.k); }); preview(); };
  form.format.onchange = preview;
  form.addEventListener('input', counts); form.addEventListener('change', counts);
  $$('[data-regen]', form).forEach(b => b.onclick = () => regen(b.dataset.regen));
  if (t) { PLATFORMS.forEach(x => { if (!form[`tx_${x.k}`].value) regen(x.k); }); preview(); }
  counts();
  $$('[data-save]', form).forEach(b => b.onclick = async () => {
    const d = formData(form);
    if (!d.trainerId) { toast('اختر المدرب', 'error'); return; }
    const platforms = {}; PLATFORMS.forEach(x => { if (d[`pl_${x.k}`]) platforms[x.k] = true; });
    if (!Object.keys(platforms).length) { toast('اختر منصة واحدة على الأقل', 'error'); return; }
    const text = {}; for (const x of PLATFORMS) if (platforms[x.k]) { text[x.k] = d[`tx_${x.k}`]; if (Social.len(x.k, text[x.k]) > x.max) { toast(`نص ${x.name} أطول من الحد (${x.max})`, 'error'); return; } }
    const mode = b.dataset.save;
    const at = mode === 'now' ? Date.now() : new Date(d.when).getTime();
    if (mode === 'scheduled' && !(at > Date.now() - 60000)) { toast('اختر موعداً قادماً', 'error'); return; }
    b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الحفظ';
    const rec = await Social.save({ ...post, trainerId: d.trainerId, format: d.format, platforms, text, scheduledAt: mode === 'draft' ? (at || null) : at, status: mode === 'draft' ? 'draft' : 'scheduled', results: post.results || null, by: Security.adminName() });
    Security.log(mode === 'draft' ? 'مسودة منشور' : 'جدولة منشور', rec.trainerName, Object.keys(platforms).join('، '));
    m.close();
    if (mode === 'now') publishNow(rec); else toast(mode === 'draft' ? 'حُفظت المسودة' : `جُدول للنشر ${fmtTs(at)}`);
  });
}

function bulkScheduler() {
  const live = Data.live();
  const last = id => Store.list('social').filter(p => p.trainerId === id && ['published', 'partial', 'scheduled'].includes(p.status)).map(p => p.scheduledAt || 0).sort((a, b) => b - a)[0];
  const start = (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); return d.getTime(); })();
  const m = modal(`<h3><i class="fa-solid fa-calendar-plus"></i> جدولة مجموعة منشورات</h3>
    <p class="muted small">ينشئ منشوراً لكل مدرب مختار بالنص المولَّد تلقائياً، موزعة على مواعيد متتالية.</p>
    <form id="bk" style="display:grid;gap:14px">
      <div class="row"><input type="search" id="bq" placeholder="بحث..." style="flex:1"><button type="button" class="btn sm" id="ba">تحديد من لم يُنشر لهم</button><button type="button" class="btn sm ghost" id="bn">إلغاء التحديد</button></div>
      <div class="bk-list">${live.map(t => { const l = last(t.id); return `<label class="bk-item" data-n="${esc(normAr(t.name + ' ' + t.code))}"><input type="checkbox" name="t" data-multi value="${esc(t.id)}" data-last="${l || 0}">${Card.avatar(t, 'av')}<span class="grow"><b>${esc(t.name)}</b><small>${l ? 'آخر نشر ' + fmtDate(l) : 'لم يُنشر له بعد'}</small></span></label>`; }).join('') || '<p class="muted">لا مدربين منشورين.</p>'}</div>
      <div class="field"><span>المنصات</span><div class="checks">${PLATFORMS.map(x => `<label class="chk"><input type="checkbox" name="pl_${x.k}" checked><span><i class="${x.icon}"></i>${x.name}</span></label>`).join('')}</div></div>
      <div class="grid3">
        ${field('أول موعد', `<input type="datetime-local" name="start" value="${Social.localDT(start)}">`)}
        ${field('الفاصل بين المنشورات', `<select name="gap">${opt(24, 'يوم', 24)}${opt(12, '12 ساعة')}${opt(48, 'يومان')}${opt(72, '3 أيام')}${opt(168, 'أسبوع')}</select>`)}
        ${field('شكل الصورة', `<select name="format">${opt('post', 'منشور 4:5')}${opt('story', 'قصة 9:16')}</select>`)}
      </div>
      <button class="btn primary lg" id="bgo"><i class="fa-solid fa-calendar-check"></i> إنشاء الجدول</button>
    </form>`, { wide: true });
  const form = m.$('#bk');
  m.$('#bq').oninput = e => { const q = normAr(e.target.value); $$('.bk-item', form).forEach(i => { i.style.display = !q || i.dataset.n.includes(q) ? '' : 'none'; }); };
  m.$('#ba').onclick = () => $$('[name=t]', form).forEach(c => { c.checked = c.dataset.last === '0'; });
  m.$('#bn').onclick = () => $$('[name=t]', form).forEach(c => { c.checked = false; });
  form.onsubmit = async e => {
    e.preventDefault();
    const d = formData(form);
    const ids = d.t || [];
    const platforms = {}; PLATFORMS.forEach(x => { if (d[`pl_${x.k}`]) platforms[x.k] = true; });
    if (!ids.length || !Object.keys(platforms).length) { toast('اختر مدرباً ومنصة على الأقل', 'error'); return; }
    const b = m.$('#bgo'); b.disabled = true;
    let at = new Date(d.start).getTime();
    for (let i = 0; i < ids.length; i++) {
      b.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${i + 1} / ${ids.length}`;
      const t = Store.get(`trainers/${ids[i]}`);
      const text = {}; Object.keys(platforms).forEach(k => { text[k] = Social.caption(k, t); });
      await Social.save({ trainerId: t.id, format: d.format, platforms, text, scheduledAt: at, status: 'scheduled', by: Security.adminName() });
      at += Number(d.gap) * 3600e3;
    }
    Security.log('جدولة مجموعة منشورات', `${ids.length} منشور`);
    m.close(); toast(`جُدول ${ids.length} منشوراً`);
  };
}

function socialSettings() {
  const s = Social.settings(), auto = Store.get('settings/automation') || {};
  const m = modal(`<h3><i class="fa-solid fa-plug"></i> الربط والقوالب</h3>
    <div class="pbox" style="margin:0 0 14px"><h3><i class="fa-solid fa-robot"></i>النشر الآلي</h3>
      <dl class="dl">
        <dt>رابط الأتمتة</dt><dd>${Automation.on ? '<span class="pill ok">مضبوط</span>' : '<span class="pill gray">غير مضبوط</span> — يُضاف <code>automationUrl</code> في <code>js/config.js</code>'}</dd>
        <dt>آخر اتصال</dt><dd>${auto.lastPing ? fmtTs(auto.lastPing) : '—'}</dd>
        ${PLATFORMS.map(x => `<dt><i class="${x.icon}"></i> ${x.name}</dt><dd>${auto.platforms?.[x.k] ? '<span class="pill ok">مربوط</span>' : '<span class="pill gray">غير مربوط</span>'}</dd>`).join('')}
      </dl>
      <p class="small muted">الربط يتم بإضافة مفاتيح كل منصة في خصائص Google Apps Script (لا تُحفظ في الموقع). الخطوات في <b>integrations/google-apps-script/README.md</b>.</p>
      ${Automation.on ? '<button class="btn sm" id="ping"><i class="fa-solid fa-satellite-dish"></i> اختبار الاتصال</button>' : ''}
    </div>
    <form id="ss" style="display:grid;gap:12px">
      <div class="grid3">${PLATFORMS.map(x => field(`حساب ${x.name}`, `<input type="text" name="h_${x.k}" dir="ltr" value="${esc(s.handles?.[x.k] || '')}" placeholder="@account">`)).join('')}</div>
      ${field('الوسوم (هاشتاق)', `<input type="text" name="hashtags" value="${esc(s.hashtags)}">`)}
      <p class="small muted">المتغيرات: {name} {title} {region} {city} {specs} {spec1} {years} {hours} {bio} {link} {code} {hashtags} {handle}. يُحذف تلقائياً الجزء الذي متغيره فارغ.</p>
      ${PLATFORMS.map(x => field(`قالب ${x.name}`, `<textarea name="t_${x.k}" style="min-height:${x.k === 'x' ? 110 : 150}px">${esc(s.tpl?.[x.k] || SOCIAL_TPL[x.k])}</textarea>`)).join('')}
      <button class="btn primary">حفظ</button>
    </form>`, { wide: true });
  m.$('#ping') && (m.$('#ping').onclick = async () => { await Automation.notify('ping'); toast('أُرسل طلب الاختبار — حدّث النافذة بعد لحظات'); });
  m.$('#ss').onsubmit = e => {
    e.preventDefault();
    const d = formData(e.target);
    const handles = {}, tpl = {};
    PLATFORMS.forEach(x => { handles[x.k] = d[`h_${x.k}`]; if (d[`t_${x.k}`] && d[`t_${x.k}`] !== SOCIAL_TPL[x.k]) tpl[x.k] = d[`t_${x.k}`]; });
    Store.set('settings/social', { handles, hashtags: d.hashtags, tpl });
    m.close(); toast('تم الحفظ');
  };
}
