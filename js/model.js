/* منطق المنصة: المدربون، البحث والمطابقة، الطلبات، والإحصاءات */

const Data = (() => {
  const content = () => {
    const d = defaultContent(), c = Store.get('content') || {};
    const out = {};
    Object.keys(d).forEach(k => { out[k] = Array.isArray(d[k]) ? (Array.isArray(c[k]) ? c[k] : d[k]) : { ...d[k], ...(c[k] || {}) }; });
    // نصوص قديمة محفوظة تتحدث عن اشتراك سنوي: يُستبدل بنص الاشتراك مدى الحياة
    if (/سنة|سنوي|عام كامل/.test(out.join.period || '')) out.join.period = d.join.period;
    if (/والنشر/.test(out.join.feeNote || '')) out.join.feeNote = d.join.feeNote;
    return out;
  };

  const photo = t => (t && !t.noPhoto && driveImg(t.photoUrl)) || '';
  const specs = t => (Array.isArray(t?.specs) ? t.specs : Object.values(t?.specs || {})).filter(k => k && specOf(k));
  // ما يظهر في البطاقة التعريفية: ما اختاره المدرب (حتى 6) من تخصصاته، وإلا أول 6
  const cardSpecs = t => { const all = specs(t), cs = (Array.isArray(t?.cardSpecs) ? t.cardSpecs : Object.values(t?.cardSpecs || {})).filter(k => all.includes(k)); return (cs.length ? cs : all).slice(0, 6); };
  const modes = t => (Array.isArray(t?.modes) ? t.modes : Object.values(t?.modes || {})).filter(Boolean);
  const topics = t => splitList(t?.topics);

  // الاشتراك مدى الحياة: لا تاريخ انتهاء، والظهور يتحكم به الحالة (منشور/مخفي) فقط
  const isLive = t => !!t && t.status === 'active';
  const all = () => Store.list('trainers').sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.publishedAt || 0) - (a.publishedAt || 0));
  const live = () => all().filter(isLive);
  const trainer = idOrSlug => Store.get(`trainers/${idOrSlug}`) || Store.list('trainers').find(t => t.slug === idOrSlug);
  const views = id => Number(Store.get(`stats/views/${id}`) || 0);
  const clicks = id => Number(Store.get(`stats/clicks/${id}`) || 0);

  // نص البحث المجمّع لكل مدرب
  const hay = t => normAr([t.name, t.title, t.bio, t.topics, t.certs, t.city, regionsLabel(t), ...specs(t).map(specName)].join(' '));

  function search(list, { q = '', region = '', spec = '', mode = '', gender = '' } = {}) {
    const terms = normAr(q).split(' ').filter(Boolean);
    return list.map(t => {
      if (region && !regionsOf(t).includes(region)) return null;
      if (spec && !specs(t).includes(spec)) return null;
      if (mode && !modes(t).includes(mode)) return null;
      if (gender && t.gender !== gender) return null;
      if (!terms.length) return { t, score: 0 };
      const h = hay(t), n = normAr(t.name), tt = normAr(t.title + ' ' + t.topics);
      let score = 0;
      for (const w of terms) {
        if (!h.includes(w)) return null;
        score += (n.includes(w) ? 5 : 0) + (tt.includes(w) ? 3 : 0) + 1;
      }
      return { t, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).map(x => x.t);
  }

  // مطابقة ذكية لطلب جهة تدريبية: التخصص، المنطقة، طريقة التقديم، والكلمات المفتاحية
  function match(req) {
    const terms = normAr(req.topic || '').split(' ').filter(w => w.length > 2);
    return live().map(t => {
      let s = 0; const why = [];
      if (req.spec && specs(t).includes(req.spec)) { s += 40; why.push('التخصص'); }
      if (req.region && regionsOf(t).includes(req.region)) { s += 25; why.push('المنطقة'); }
      else if (req.mode === 'online' && modes(t).includes('online')) { s += 15; why.push('عن بُعد'); }
      if (req.mode && modes(t).includes(req.mode)) s += 10;
      if (terms.length) { const h = hay(t); const hit = terms.filter(w => h.includes(w)).length; if (hit) { s += Math.round(25 * hit / terms.length); why.push('الموضوع'); } }
      s += Math.min(10, Number(t.years || 0));
      return { t, s, why };
    }).filter(x => x.s >= 35).sort((a, b) => b.s - a.s).slice(0, 6);
  }

  const regionCounts = () => { const o = {}; live().forEach(t => regionsOf(t).forEach(r => { o[r] = (o[r] || 0) + 1; })); return o; };
  const specCounts = () => { const o = {}; live().forEach(t => specs(t).forEach(s => { o[s] = (o[s] || 0) + 1; })); return o; };

  // رقم المدرب: ST0001، ST0002 ... (عدّاد ذرّي حتى لا يتكرر)
  async function nextCode() {
    const n = await Store.transaction('counters/trainer', c => (Number(c) || 0) + 1);
    return `ST${String(n).padStart(4, '0')}`;
  }
  // رابط مختصر للمدرب من اسمه اللاتيني إن وُجد وإلا الرقم
  function makeSlug(t) {
    const base = String(t.nameEn || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const s = base || 't-' + Math.random().toString(36).slice(2, 8);
    const taken = Store.list('trainers').some(x => x.slug === s && x.id !== t.id);
    return taken ? `${s}-${String(t.code || '').toLowerCase().replace(/\D/g, '')}` : s;
  }

  // الحقول العامة للمدرب (المسموح بتعديلها من صفحته — تطابق القواعد)
  const PUBLIC_FIELDS = ['name', 'nameEn', 'title', 'gender', 'region', 'city', 'bio', 'specs', 'topics', 'modes', 'years', 'hours', 'programs', 'certs', 'langs', 'theme', 'photoUrl', 'photoX', 'photoY', 'photoZ', 'noPhoto', 'cardSpecs', 'regions', 'travel'];
  // تقسيم إجابات الحقول المخصصة: العامة تظهر في صفحة المدرب، والباقي في بياناته الإدارية
  const splitExtra = extra => { const pub = {}, priv = {}; Object.entries(extra || {}).forEach(([k, v]) => { (FormKit.isPublicExtra(k) ? pub : priv)[k] = v; }); return { pub, priv }; };
  const pick = (o, keys) => { const r = {}; keys.forEach(k => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };

  // يضيف تخصصاً جديداً إلى الكتالوج (متاح لأي زائر؛ الإدارة تحذف ما لا يصلح) أو يعيد المطابق له، ويعيد مفتاحه
  function addSpecialty(name) {
    name = String(name || '').trim().slice(0, 60);
    if (name.length < 2) return '';
    const norm = normAr(name), hit = SPECIALTIES.find(s => normAr(s.name) === norm);
    if (hit) return hit.k;
    let h = 5381; for (const ch of norm) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
    const k = 'u' + h.toString(36);
    Store.set(`content/specialties/added/${k}`, { name, icon: 'fa-shapes' });
    loadSpecialties();
    return k;
  }
  async function publishFromApplication(app) {
    const code = await nextCode();
    const id = code.toLowerCase();
    const t = {
      ...pick(app, PUBLIC_FIELDS), id, code, status: 'active', featured: false,
      publishedAt: Date.now(), updatedAt: Date.now(), appId: app.id
    };
    t.slug = makeSlug(t);
    const ex = splitExtra(app.extra);
    if (Object.keys(ex.pub).length) t.extra = ex.pub;
    Store.set(`trainers/${id}`, t);
    Store.set(`private/${id}`, { phone: app.phone || '', email: app.email || '', ...(Object.keys(ex.priv).length ? { extra: ex.priv } : {}) });
    Store.update(`applications/${app.id}`, { status: 'published', trainerId: id, decidedAt: Date.now() });
    Store.update(`appStatus/${app.id}`, { status: 'published', ts: Date.now(), trainerSlug: t.slug });
    const secret = await Security.issueCode(t);
    Security.log('نشر مدرب', `${t.name} (${code})`, `من الطلب ${app.id}`);
    return { trainer: Store.get(`trainers/${id}`), secret };
  }

  function track(kind, id) {
    // عدّاد مشاهدات/نقرات مرة واحدة لكل زائر في الجلسة
    const k = `st-${kind}-${id}`;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch { /* ignore */ }
    Store.transaction(`stats/${kind}/${id}`, c => (Number(c) || 0) + 1).catch(() => {});
  }

  return { content, photo, specs, cardSpecs, modes, topics, all, live, trainer, isLive, search, match, regionCounts, specCounts, views, clicks, nextCode, makeSlug, addSpecialty, publishFromApplication, track, PUBLIC_FIELDS, pick, splitExtra };
})();

/* الأتمتة (اختيارية): رابط Google Apps Script يرسل البريد من حساب المنصة وينشر في وسائل التواصل.
 * يُرسل له رقم السجل فقط، ويقرأ هو التفاصيل من قاعدة البيانات بصلاحيته. */
const Automation = {
  get url() { return window.ST_CONFIG.automationUrl || ''; },
  get on() { return /^https:\/\/script\.google\.com\//.test(this.url); },
  notify(action, id) {
    if (!this.on) return Promise.resolve(false);
    return fetch(this.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, id, root: window.ST_CONFIG.dbRoot || 'sauditrainers' }) })
      .then(() => true, () => false);
  }
};

/* قوالب رسائل مراحل التسجيل */
const Tpl = {
  get(key) { return { ...defaultTemplates()[key], ...(Store.get(`settings/templates/${key}`) || {}) }; },
  render(text, vars) {
    return String(text || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k]))).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\n{3,}/g, '\n\n').trim();
  },
  // متغيرات الرسالة: من الطلب (a) والمدرب المنشور (t) والرمز السري
  vars({ a = {}, t = null, secret = '' } = {}) {
    const c = Data.content(), name = (t?.name || a.name || '').trim();
    return { name, first: name.replace(/^(د|م|أ)\.\s*/, '').split(/\s+/)[0] || name, appId: a.id || t?.appId || '', fee: c.join.fee, period: c.join.period,
      payment: c.join.payment, bank: Store.get('settings/payment/bank') || '(أضف بيانات الحساب البنكي في الإدارة ← قوالب)', memberCode: t?.code || '', secret,
      loginUrl: `${siteBase()}#/login`, profileUrl: t ? profileUrl(t) : '', statusUrl: `${siteBase()}#/status?id=${a.id || ''}` };
  },
  // الواتساب يستخدم *نص عريض* بدل ** في البريد
  mail(key, ctx) { const t = this.get(key); return { subject: this.render(t.subject, this.vars(ctx)), body: this.render(t.body, this.vars(ctx)) }; },
  wa(key, ctx) { const t = this.get(key); return String(t.wa || '').replace(/\{(\w+)\}/g, (_, k) => (this.vars(ctx)[k] ?? '')).trim(); }
};

const siteNav = () => { const l = arr(Store.get('content/nav/list')); return (l.length ? l : defaultNav()).filter(x => x.vis !== false && x.label && x.href); };
const siteTicker = () => { const t = { ...defaultTicker(), ...(Store.get('content/ticker') || {}) }; t.items = arr(t.items).filter(i => i.text); return t; };
