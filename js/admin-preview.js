/* لوحة الإدارة ← «معاينة كمدرب»: نافذة عائمة تعرض لوحة المدرب (أو صفحته العامة) كما يراها، بمدرب افتراضي مكتمل البيانات.
 * تُحمَّل المنصة نفسها داخل إطار بوضع معاينة (?preview=me|profile) على قاعدة محلية معزولة تُبنى من بذرة (st-preview-seed)،
 * فلا تُكتب أي بيانات في القاعدة الحقيقية، ولا تمس جلسة المشرف. */

const TrainerPreview = {
  mode: 'me', view: 'desk',
  // بذرة القاعدة: إعدادات الموقع الحقيقية + مدرب افتراضي كامل الحقول + مدربون حقيقيون لقسم «مدربون مشابهون»
  seed() {
    const id = 'st9999', now = Date.now();
    const specs = (SPECIALTIES || []).filter(s => s.k !== 'other').slice(0, 8).map(s => s.k);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9e7d0"/><stop offset="1" stop-color="#8fb89a"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="100" cy="78" r="34" fill="#f1c9a5"/><path d="M62 70c4-30 22-42 40-42s36 12 38 42c-10-14-24-20-40-20s-28 6-38 20z" fill="#2b2b2b"/><path d="M30 200c4-44 34-68 70-68s66 24 70 68z" fill="#005430"/><path d="M82 132l18 26 18-26z" fill="#fff"/></svg>`;
    const t = {
      id, code: 'ST9999', slug: 'preview-trainer', status: 'active', featured: true, demo: true, publishedAt: now - 120 * 864e5, updatedAt: now,
      name: 'م. عبدالله العتيبي', nameEn: 'Abdullah Alotaibi', gender: 'm', region: 'riyadh', regions: ['riyadh', 'makkah', 'eastern'], city: 'الرياض', travel: true,
      title: 'مدرب معتمد في القيادة والتحول الرقمي وتطوير الأعمال',
      bio: 'مدرب سعودي بخبرة تتجاوز اثنتي عشرة سنة في التدريب والتطوير المؤسسي، قدّمت مئات البرامج لجهات حكومية وخاصة في مختلف مناطق المملكة.\n\nأركّز في برامجي على الجانب التطبيقي: ورش عمل تفاعلية، ودراسات حالة من بيئة العمل السعودية، وأدوات جاهزة يطبّقها المتدرب في يومه التالي.\n\nأؤمن أن التدريب الناجح يُقاس بأثره على الأداء، ولذلك أرفق كل برنامج بخطة متابعة وقياس بعد انتهاء التدريب.',
      specs, cardSpecs: specs.slice(0, 6), modes: ['onsite', 'online'], langs: 'العربية، الإنجليزية', tot: true,
      years: 12, hours: 2400, programs: 150, theme: 'brand', photoUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
      topics: 'القيادة التحويلية\nإدارة التغيير\nمهارات التفاوض\nبناء فرق العمل عالية الأداء\nالتحول الرقمي للمؤسسات\nإدارة الوقت والأولويات',
      certs: 'مدرب معتمد من المؤسسة العامة للتدريب التقني والمهني\nعضو جمعية إدارة المشاريع (PMI)\nشهادة تدريب المدربين TOT',
      proCerts: 'PMP، ITIL، Six Sigma Green Belt', partners: 'جامعة الملك سعود، أرامكو السعودية، معهد الإدارة العامة، وزارة الموارد البشرية'
    };
    const ex = {};
    FormKit.customDefs().forEach(f => { if (f.pub) ex[f.k] = 'قيمة تجريبية للحقل المخصص «' + f.label + '»'; });
    if (Object.keys(ex).length) t.extra = ex;
    const real = Data.live().slice(0, 8).map(x => JSON.parse(JSON.stringify(x)));
    const trainers = { [id]: t }; real.forEach(x => { if (x.id !== id) trainers[x.id] = x; });
    const vday = {}; for (let i = 0; i < 30; i++) vday[dayKeyRiyadh(i)] = 3 + Math.round(Math.abs(Math.sin(i / 3)) * 9);
    const platform = Store.get('stats/platform') || { updatedAt: now, since: '20230315', sessionsAll: 19931, usersAll: 12786, viewsAll: 43615, users30: 2310, sessions30: 3100, views30: 8000, impressionsAll: 198581, impressionsSince: '2025-06-10' };
    const leads = {
      l1: { id: 'l1', trainerId: id, org: 'شركة الأفق للتدريب', person: 'سلطان المطيري', topic: 'برنامج القيادة للمشرفين الجدد', when: 'خلال الشهر القادم', mode: 'onsite', phone: '966500000001', email: 'info@example.com', msg: 'نرغب ببرنامج لمدة يومين لعدد 25 متدرباً في الرياض.', ts: now - 3 * 36e5, status: 'new' },
      l2: { id: 'l2', trainerId: id, org: 'جامعة المستقبل', person: 'د. منى القحطاني', topic: 'ورشة التحول الرقمي لأعضاء هيئة التدريس', when: 'الربع القادم', mode: 'online', phone: '966500000002', email: 'training@example.com', msg: 'ورشة عن بُعد لمدة ثلاث ساعات.', ts: now - 2 * 864e5, status: 'new' },
      l3: { id: 'l3', trainerId: id, org: 'مؤسسة النخبة', person: 'فهد الدوسري', topic: 'مهارات التفاوض', when: 'الشهر الماضي', mode: 'onsite', phone: '966500000003', email: 'hr@example.com', msg: 'تم الاتفاق وتنفيذ البرنامج.', ts: now - 25 * 864e5, status: 'done' }
    };
    return {
      meta: { createdAt: now, seeded: now }, counters: { trainer: 9999 },
      content: Store.get('content') || undefined, settings: { forms: Store.get('settings/forms') || undefined },
      trainers, private: { [id]: { phone: '966500000000', email: 'abdullah@example.com' } },
      notes: { [id]: { text: 'مرحباً بك في المنصة الجديدة. هذه رسالة تجريبية من الإدارة تظهر في لوحة المدرب.', ts: now } },
      leads, slugs: { 'preview-trainer': id },
      stats: { views: { [id]: 1240 }, clicks: { [id]: 86 }, vday: { [id]: vday }, platform }
    };
  },
  src() { return `index.html?preview=${this.mode}`; },
  open() {
    document.querySelector('.tpv-back')?.remove();
    try { localStorage.setItem('st-preview-seed', JSON.stringify(JSON.parse(JSON.stringify(this.seed())))); } catch (e) { toast('تعذّر تجهيز المعاينة', 'error'); console.error(e); return; }
    const el = document.createElement('div'); el.className = 'tpv-back';
    el.innerHTML = `<div class="tpv" role="dialog" aria-label="معاينة كمدرب">
      <div class="tpv-h"><b><i class="fa-solid fa-user-gear"></i> معاينة كمدرب <small style="opacity:.75;font-weight:500">— مدرب افتراضي مكتمل البيانات</small></b>
        <span class="seg" id="tpm"><button data-m="me" class="${this.mode === 'me' ? 'on' : ''}"><i class="fa-solid fa-gauge-high"></i> لوحة المدرب</button><button data-m="profile" class="${this.mode === 'profile' ? 'on' : ''}"><i class="fa-solid fa-id-card"></i> صفحته العامة</button></span>
        <span class="seg" id="tpd"><button data-v="desk" class="${this.view === 'desk' ? 'on' : ''}" title="سطح المكتب"><i class="fa-solid fa-desktop"></i></button><button data-v="mob" class="${this.view === 'mob' ? 'on' : ''}" title="جوال"><i class="fa-solid fa-mobile-screen"></i></button></span>
        <button class="tb" id="tpr" title="إعادة التحميل"><i class="fa-solid fa-rotate"></i></button>
        <button class="tb" id="tpx" title="إغلاق"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="tpv-body"><iframe class="tpv-frame ${this.view}" id="tpf" src="${this.src()}" title="معاينة"></iframe></div>
      <div class="tpv-note"><i class="fa-solid fa-flask"></i> معاينة معزولة: بياناتها افتراضية، ولا يُحفظ فيها أي شيء في قاعدة المنصة. تعكس الإعدادات الحالية (النماذج وقالب البطاقة والنصوص).</div></div>`;
    document.body.appendChild(el);
    const f = el.querySelector('#tpf'), close = () => { el.remove(); document.removeEventListener('keydown', key); };
    const key = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    el.querySelector('#tpx').onclick = close;
    el.querySelector('#tpr').onclick = () => { try { localStorage.setItem('st-preview-seed', JSON.stringify(this.seed())); } catch { /* ignore */ } f.src = this.src(); };
    el.querySelectorAll('#tpm button').forEach(b => b.onclick = () => { this.mode = b.dataset.m; el.querySelectorAll('#tpm button').forEach(x => x.classList.toggle('on', x === b)); f.src = this.src(); });
    el.querySelectorAll('#tpd button').forEach(b => b.onclick = () => { this.view = b.dataset.v; el.querySelectorAll('#tpd button').forEach(x => x.classList.toggle('on', x === b)); f.className = 'tpv-frame ' + this.view; });
  }
};
