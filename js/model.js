/* منطق المنصة: المدربون، البحث والمطابقة، الطلبات، والإحصاءات */

const Data = (() => {
  const content = () => {
    const d = defaultContent(), c = Store.get('content') || {};
    const out = {};
    Object.keys(d).forEach(k => { out[k] = Array.isArray(d[k]) ? (Array.isArray(c[k]) ? c[k] : d[k]) : { ...d[k], ...(c[k] || {}) }; });
    return out;
  };

  const photo = t => (t && (Store.get(`photos/${t.id}`) || driveImg(t.photoUrl))) || '';
  const specs = t => (Array.isArray(t?.specs) ? t.specs : Object.values(t?.specs || {})).filter(Boolean);
  const modes = t => (Array.isArray(t?.modes) ? t.modes : Object.values(t?.modes || {})).filter(Boolean);
  const topics = t => splitList(t?.topics);

  const expired = t => !!t.expiresAt && t.expiresAt < Date.now();
  const isLive = t => t && t.status === 'active' && !expired(t);
  const all = () => Store.list('trainers').sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.publishedAt || 0) - (a.publishedAt || 0));
  const live = () => all().filter(isLive);
  const trainer = idOrSlug => Store.get(`trainers/${idOrSlug}`) || Store.list('trainers').find(t => t.slug === idOrSlug);
  const views = id => Number(Store.get(`stats/views/${id}`) || 0);
  const clicks = id => Number(Store.get(`stats/clicks/${id}`) || 0);

  // نص البحث المجمّع لكل مدرب
  const hay = t => normAr([t.name, t.title, t.bio, t.topics, t.certs, t.city, regionName(t.region), ...specs(t).map(specName)].join(' '));

  function search(list, { q = '', region = '', spec = '', mode = '', gender = '' } = {}) {
    const terms = normAr(q).split(' ').filter(Boolean);
    return list.map(t => {
      if (region && t.region !== region) return null;
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
      if (req.region && t.region === req.region) { s += 25; why.push('المنطقة'); }
      else if (req.mode === 'online' && modes(t).includes('online')) { s += 15; why.push('عن بُعد'); }
      if (req.mode && modes(t).includes(req.mode)) s += 10;
      if (terms.length) { const h = hay(t); const hit = terms.filter(w => h.includes(w)).length; if (hit) { s += Math.round(25 * hit / terms.length); why.push('الموضوع'); } }
      s += Math.min(10, Number(t.years || 0));
      return { t, s, why };
    }).filter(x => x.s >= 35).sort((a, b) => b.s - a.s).slice(0, 6);
  }

  const regionCounts = () => { const o = {}; live().forEach(t => { o[t.region] = (o[t.region] || 0) + 1; }); return o; };
  const specCounts = () => { const o = {}; live().forEach(t => specs(t).forEach(s => { o[s] = (o[s] || 0) + 1; })); return o; };

  // رقم المدرب: ST0001، ST0002 ... (عدّاد ذرّي حتى لا يتكرر)
  async function nextCode() {
    const n = await Store.transaction('counters/trainer', c => (Number(c) || 0) + 1);
    return `ST${String(n).padStart(4, '0')}`;
  }
  // رابط مختصر للمدرب من اسمه اللاتيني إن وُجد وإلا الرقم
  function makeSlug(t) {
    const base = String(t.nameEn || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const s = base || String(t.code || '').toLowerCase();
    const taken = Store.list('trainers').some(x => x.slug === s && x.id !== t.id);
    return taken ? `${s}-${String(t.code || '').toLowerCase().replace(/\D/g, '')}` : s;
  }

  // الحقول العامة للمدرب (المسموح بتعديلها من صفحته — تطابق القواعد)
  const PUBLIC_FIELDS = ['name', 'nameEn', 'title', 'gender', 'region', 'city', 'bio', 'specs', 'topics', 'modes', 'years', 'hours', 'programs', 'certs', 'langs', 'theme', 'links', 'photoUrl'];
  const pick = (o, keys) => { const r = {}; keys.forEach(k => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };

  async function publishFromApplication(app) {
    const code = await nextCode();
    const id = code.toLowerCase();
    const t = {
      ...pick(app, PUBLIC_FIELDS), id, code, status: 'active', featured: false,
      publishedAt: Date.now(), expiresAt: Date.now() + 365 * 864e5, updatedAt: Date.now(), appId: app.id
    };
    t.slug = makeSlug(t);
    Store.set(`trainers/${id}`, t);
    if (app.photo) Store.set(`photos/${id}`, app.photo);
    Store.set(`private/${id}`, { phone: app.phone || '', email: app.email || '' });
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

  return { content, photo, specs, modes, topics, all, live, trainer, isLive, expired, search, match, regionCounts, specCounts, views, clicks, nextCode, makeSlug, publishFromApplication, track, PUBLIC_FIELDS, pick };
})();
