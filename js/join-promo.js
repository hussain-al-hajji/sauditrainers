/* شرائح دعائية عريضة في صفحة التسجيل: تجمع مزايا الاشتراك ومزايا المنصة الجديدة وإحصاءاتها دون تكرار.
 * تتحرك تلقائياً يميناً ويساراً مع أزرار تحكم ونقاط، وتتوقف عند اللمس أو تمرير المؤشر.
 * الإعدادات في content/joinPromo = { on, hidden:[ids], sec } وتُعدَّل من لوحة الإدارة ← المحتوى العام ← شرائح صفحة التسجيل. */

const PROMO_DEFAULT_STATS = { impressionsAll: 198581, sessionsAll: 19931, usersAll: 12786, viewsAll: 43615 };

const PromoSlides = (() => {
  const n = x => Number(x || 0).toLocaleString('en-US');
  const ben = (ic, t, d = '') => `<div class="pmx-ben"><span class="pmx-ic"><i class="fa-solid ${ic}"></i></span><div><h4>${t}</h4>${d ? `<p>${d}</p>` : ''}</div></div>`;
  const tile = (ic, t, d = '') => `<div class="pmx-tile"><span class="pmx-ic"><i class="fa-solid ${ic}"></i></span><h4>${t}</h4>${d ? `<p>${d}</p>` : ''}</div>`;
  // المزايا تُسحب من المحتوى التسويقي المركزي (Pitch) فتتحدث الشرائح بتحديثه
  const pit = id => Pitch.byId(id), tg = x => (x && x.x ? Pitch.tag(true) : '');
  const bi = id => { const x = pit(id); return x ? ben(x.ic, esc(x.s || x.t), esc(x.sd || '') + tg(x)) : ''; };
  const ti = id => { const x = pit(id); return x ? tile(x.ic, esc(x.s || x.t), esc(x.sd || '') + tg(x)) : ''; };
  const cta = (txt = 'سجّل كمدرب سعودي') => `<button type="button" class="pmx-cta" data-pm-go>${txt}</button>`;
  // بطاقات نموذجية حقيقية (نفس مكوّن بطاقة المدرب) بلا بيانات أشخاص
  const sampleCard = (i = 0) => {
    const sp = SPECIALTIES.filter(x => x.k !== 'other').slice(i * 3, i * 3 + 3).map(x => x.k), th = CARD_THEMES[i % CARD_THEMES.length].k;
    const t = [{ name: 'د. فيصل المنصور', title: 'مدرب ريادة الأعمال وإدارة المشاريع', gender: 'm', years: 10, hours: 2400, programs: 120, regions: ['madinah', 'riyadh'], region: 'madinah' },
      { name: 'أ. سارة العتيبي', title: 'مدربة القيادة والتحول الرقمي', gender: 'f', years: 8, hours: 1500, programs: 80, regions: ['riyadh'], region: 'riyadh' },
      { name: 'أ. خالد الحربي', title: 'مدرب التسويق والمبيعات', gender: 'm', years: 12, hours: 3000, programs: 150, regions: ['makkah'], region: 'makkah' }][i % 3];
    return Card.full({ ...t, id: `__pm${i}`, noPhoto: true, theme: th, specs: sp, cardSpecs: sp }).replace(' data-tilt="8"', '');
  };
  const win = (url, body) => `<div class="pmx-win"><div class="pmx-bar"><i></i><i></i><i></i><span dir="ltr">${url}</span></div>${body}</div>`;

  // كل شريحة: المعرّف، الاسم في لوحة الإدارة، الثيم، وعنوان الشارة ودالة بناء المحتوى (تصميم بطاقات الدعاية نفسه)
  const SLIDES = [
    { id: 'intro', name: 'التعريف والاشتراك', theme: 'dark', kick: 'المنصة الحصرية للمدربين السعوديين', html: c => `
      <div class="pmx-t"><h3>استثمار واحد<span class="acc">يعمل لأجلك دائماً</span></h3>
        <p class="sub">بطاقتك وصفحتك وملفك الاحترافي، وفرص تدريب ووظائف تتجدد من عشرات المصادر، في منصة التسجيل فيها حصري للمدربين السعوديين.</p>
        <div class="pmx-price"><span>${esc(c.join.period)}<br>${esc(Pitch.renew)}</span><strong class="num">${esc(c.join.fee)}</strong><span>ريال</span></div>${cta('ابدأ التسجيل الآن')}</div>
      <div class="pmx-v pmx-fan"><div class="fc c2">${sampleCard(1)}</div><div class="fc c3">${sampleCard(2)}</div><div class="fc c1">${sampleCard(0)}</div></div>` },
    { id: 'value', name: 'ماذا تحصل عليه؟', theme: 'light', kick: 'قيمة الاشتراك', html: c => `
      <div class="pmx-t"><h3>اشتراك يتجدد مجاناً<span class="acc">وعوائد تتجدد</span></h3><p class="sub"><b class="num">${esc(c.join.fee)}</b> ريال ${esc(c.join.period)}، ${esc(Pitch.perDay(c.join.fee))}. ولا عمولة على عقودك.</p>${cta()}</div>
      <div class="pmx-v pmx-tiles">${['opps', 'jobs', 'profile', 'pdf', 'library', 'exclusive'].map(ti).join('')}</div>` },
    { id: 'perks', name: 'مزايا الاشتراك', theme: 'dark', kick: 'للمدربين السعوديين', html: () => `
      <div class="pmx-t"><h3>اشتراك واحد<span class="acc">بأربع عوائد</span></h3><p class="sub">ما تحتاجه لتُرى وتُطلب، دون أن تتفرغ للتسويق.</p>${cta()}</div>
      <div class="pmx-v pmx-bens">${['opps', 'jobs', 'profile', 'exclusive'].map(bi).join('')}</div>` },
    { id: 'opps', name: 'فرص ووظائف متجددة', theme: 'dark', kick: 'فرص تتجدد كل يوم', html: () => `
      <div class="pmx-t"><h3>فرص ووظائف<span class="acc">تصلك دون أن تبحث</span></h3><p class="sub">ما يصل المنصة من الجهات، وما تنشره الإدارة، وما يُجلب آلياً من الإنترنت، كله في لوحتك.</p>${cta()}</div>
      <div class="pmx-v pmx-bens">${['opps', 'requests', 'jobs', 'alerts'].map(bi).join('')}</div>` },
    { id: 'exclusive', name: 'منصة حصرية للسعوديين', theme: 'light', kick: 'حصرية للمدربين السعوديين', html: () => `
      <div class="pmx-t"><h3>التسجيل حصري<span class="acc">للمدربين السعوديين</span></h3><p class="sub">حين تبحث الجهة عن مدرب سعودي، تجد مكاناً واحداً متخصصاً، وتجدك فيه بين أقرانك لا بين آلاف الحسابات العامة.</p>
        <div class="pmx-chips"><span>تسجيل بشروط</span><span>توثيق للبطاقات</span><span>13 منطقة</span></div>${cta()}</div>
      <div class="pmx-v pmx-tiles">${['exclusive', 'reach', 'reviews', 'directory'].map(ti).join('')}</div>` },
    { id: 'pdf', name: 'ملف احترافي يتجدد', theme: 'dark', kick: 'ملفك المهني', html: () => `
      <div class="pmx-t"><h3>ملف سيرة احترافي<span class="acc">PDF بضغطة زر</span></h3><p class="sub">${esc((pit('pdf') || {}).d || 'حدّث بياناتك مرة واحدة فتتحدث بطاقتك وصفحتك وملف PDF.')}</p>
        <div class="pmx-fm"><span><i class="fa-solid fa-file-pdf"></i> ملف PDF</span><span><i class="fa-solid fa-image"></i> 3 مقاسات</span><span><i class="fa-solid fa-qrcode"></i> رمز QR</span></div>${cta()}</div>
      <div class="pmx-v pmx-cardv"><div class="cw">${sampleCard(1)}</div><span class="fl f1"><i class="fa-solid fa-file-pdf"></i> ملف PDF بغلاف أنيق</span><span class="fl f2"><i class="fa-solid fa-pen"></i> عدّل متى شئت</span><span class="fl f3"><i class="fa-solid fa-share-nodes"></i> شارك بنقرة</span></div>` },
    { id: 'zero', name: 'بدون عمولة', theme: 'dark', kick: 'للمدربين السعوديين', html: () => `
      <div class="pmx-t"><h3>كل ما تحصل عليه<span class="acc">يبقى لك</span></h3><p class="sub">لا عمولة على عقودك، والاشتراك يتجدد مجاناً مدى الحياة بعد السنة الأولى.</p>${cta()}</div>
      <div class="pmx-v pmx-zero"><span class="rg r1"></span><span class="rg r2"></span><b class="num">0%</b></div>` },
    { id: 'library', name: 'مكتبة المدرب', theme: 'light', kick: 'مكتبة المدرب', html: () => `
      <div class="pmx-t"><h3>مكتبة عملية<span class="acc">لكل مراحل برنامجك</span></h3><p class="sub">${esc((pit('library') || {}).d || '')} ${tg(pit('library'))}</p>${cta()}</div>
      <div class="pmx-v pmx-tiles">${tile('fa-clipboard-list', 'قبل البرنامج', 'عروض أسعار وعقود وتحديد الاحتياج')}${tile('fa-chalkboard-user', 'أثناء البرنامج', 'أنشطة وأسئلة وإدارة القاعة')}${tile('fa-flag-checkered', 'بعد البرنامج', 'تقييم وتقرير ومتابعة')}${tile('fa-file-word', 'قوالب Word جاهزة', 'تنزّلها وتعدّلها بنفسك')}</div>` },
    { id: 'panel', name: 'لوحة التحكم الخاصة', theme: 'dark', kick: 'لوحتك الخاصة', html: () => `
      <div class="pmx-t"><h3>لكل مدرب<span class="acc">لوحة تحكم خاصة</span></h3><p class="sub">ادخل برمز الدخول الخاص بك وأدر حضورك بنفسك: تعديل فوري يظهر للزوار، وطلبات تصلك مباشرة بالبريد وفي لوحتك.</p></div>
      <div class="pmx-v">${win('SaudiTrainers.sa/#/me', `<div class="pmx-dash"><aside><b><i class="fa-solid fa-user"></i> لوحتي</b><span class="on"><i class="fa-solid fa-id-card"></i> بطاقتي</span><span><i class="fa-solid fa-pen-to-square"></i> تعديل البيانات</span><span><i class="fa-solid fa-inbox"></i> طلبات موجهة لك <em>3</em></span><span><i class="fa-solid fa-arrow-up-right-from-square"></i> صفحتي العامة</span></aside>
        <section><div class="kp"><div><b class="num">248</b><small>مشاهدة لبطاقتك</small></div><div><b class="num">3</b><small>طلب من جهات</small></div><div><b>∞</b><small>اشتراك مدى الحياة</small></div></div>
        <div class="rw"><span>محدّث</span>الاسم والمسمى</div><div class="rw"><span>محدّث</span>التخصصات والمناطق</div><div class="rw"><span>محدّث</span>الشهادات والاعتمادات</div></section></div>`)}</div>` },
    { id: 'card', name: 'البطاقة والصيغ والألوان', theme: 'dark', kick: 'بطاقتك التعريفية', html: () => `
      <div class="pmx-t"><h3>بطاقة موثّقة<span class="acc">تعرّف بك وتصل إليهم</span></h3><p class="sub">حمّلها صورةً جاهزة للنشر بضغطة واحدة: ستوري أو منشور أو عريضة 16:9، وبلونك من ألوان الهوية.</p>
        <div class="pmx-fm"><span><i class="fa-solid fa-mobile-screen"></i> ستوري</span><span><i class="fa-solid fa-image"></i> منشور</span><span><i class="fa-solid fa-panorama"></i> عريضة</span></div>
        <div class="pmx-colors"><i style="background:#005430"></i><i style="background:#0D2418"></i><i style="background:#7A8B2E"></i><i style="background:#EEF3E5"></i></div></div>
      <div class="pmx-v pmx-cardv"><div class="cw">${sampleCard(0)}</div><span class="fl f1"><i class="fa-solid fa-location-dot"></i> منطقتك</span><span class="fl f2"><i class="fa-solid fa-hourglass-half"></i> خبرتك بالأرقام</span><span class="fl f3"><i class="fa-solid fa-layer-group"></i> تخصصاتك</span><span class="fl f4"><i class="fa-solid fa-bolt"></i> تحديث لحظي</span></div>` },
    { id: 'page', name: 'الصفحة الشخصية والمشاركة', theme: 'light', kick: 'صفحتك الشخصية', html: () => `
      <div class="pmx-t"><h3>صفحة عامة<span class="acc">باسمك ورابطك</span></h3><p class="sub">سيرتك الكاملة في صفحة واحدة تشاركها مع أي جهة، وتتسع لأكثر من منطقة ولخيار الانتقال إلى مناطق أخرى.</p>
        <div class="pmx-chips"><span>شهادات وعضويات</span><span>مدربون مشابهون</span><span>معاينة باسمك وصورتك</span></div></div>
      <div class="pmx-v">${win('SaudiTrainers.sa/t/اسمك', `<div class="pmx-pg"><div class="who"><span class="av"><i class="fa-solid fa-user"></i></span><div><h4>اسمك ومسماك المهني</h4><small><i class="fa-solid fa-location-dot"></i> الرياض | المدينة المنورة · ينتقل إلى مناطق أخرى</small></div></div>
        <div class="act"><span class="btn1"><i class="fa-solid fa-paper-plane"></i> تواصل مع المدرب</span><span class="ci"><i class="fa-regular fa-copy"></i></span><span class="ci"><i class="fa-solid fa-download"></i></span></div>
        <small class="lbl"><i class="fa-solid fa-share-nodes"></i> شارك صفحة المدرب بنص جاهز بلسانك</small>
        <div class="shr"><span><i class="fa-brands fa-linkedin-in"></i></span><span><i class="fa-brands fa-instagram"></i></span><span><i class="fa-brands fa-x-twitter"></i></span><span><i class="fa-brands fa-whatsapp"></i></span></div></div>`)}</div>` },
    { id: 'bio', name: 'سيرة أغنى', theme: 'light', kick: 'حقول أكثر', html: () => `
      <div class="pmx-t"><h3>سيرة أغنى<span class="acc">لتعريف أدق بك</span></h3><p class="sub">أضف ما يميّزك لتختارك الجهات عن علم.</p>${cta()}</div>
      <div class="pmx-v pmx-tiles">${tile('fa-shapes', 'أكثر من 50 تخصصاً', 'وأضف تخصصك بخيار «أخرى»')}${tile('fa-list-check', '15 مجالاً لكل مدرب', 'يظهر منها 6 على بطاقتك')}${tile('fa-language', 'لغات التدريب', 'لتعرف الجهات لغات برامجك')}${tile('fa-chalkboard-user', 'دورات TOT', 'تبرز تأهيلك في تدريب المدربين')}${tile('fa-certificate', 'شهادات احترافية', 'واعتماداتك وعضوياتك')}${tile('fa-handshake-angle', 'جهات تعاون وعناوين دورات', 'تعزز ثقة من يقرأ سيرتك')}</div>` },
    { id: 'reach', name: 'ظهورك للجهات', theme: 'dark', kick: 'للجهات التدريبية', html: () => `
      <div class="pmx-t"><h3>تجدك الجهات<span class="acc">بالبحث والمنطقة</span></h3><p class="sub">تُعرض بطاقتك في صفحة منطقتك وتخصصك، ويمكن لأي جهة أن تطلب ترشيحك لبرنامجها.</p>${cta()}</div>
      <div class="pmx-v"><div class="pmx-search"><i class="fa-solid fa-magnifying-glass"></i><span>ابحث باسم مدرب، موضوع، أو شهادة...</span><b>بحث</b></div>
        <div class="pmx-chips">${REGIONS.map(r => `<span>${esc(r.name)}</span>`).join('')}</div></div>` },
    { id: 'stats', name: 'أرقام المنصة', theme: 'light', kick: 'أرقام حقيقية من إحصاءات Google', html: () => {
      const P = Store.get('stats/platform') || {}, v = k => (P[k] != null ? P[k] : PROMO_DEFAULT_STATS[k]);
      return `<div class="pmx-t"><h3>أرقام المنصة<span class="acc">منذ الإطلاق</span></h3><p class="sub">المصدر: Google Analytics وGoogle Search Console، إضافة إلى تغطية 13 منطقة وأكثر من 50 تخصصاً.</p>${cta()}</div>
      <div class="pmx-v pmx-st"><div><b class="num">${n(v('impressionsAll'))}</b><span>مرة ظهور في نتائج بحث Google</span></div><div><b class="num">${n(v('sessionsAll'))}</b><span>جلسة زيارة</span></div><div><b class="num">${n(v('usersAll'))}</b><span>مستخدم</span></div><div><b class="num">${n(v('viewsAll'))}</b><span>مشاهدة للصفحة الرئيسية</span></div></div>`; } },
    { id: 'start', name: 'ابدأ في ثلاث خطوات', theme: 'dark', kick: 'ابدأ الآن', html: c => `
      <div class="pmx-t"><h3>انضم إلى المنصة<span class="acc">في ثلاث خطوات</span></h3>${cta('سجّل كمدرب سعودي')}</div>
      <div class="pmx-v pmx-steps"><div><span class="n">1</span><div><h4>أكمل نموذج التسجيل</h4><p>بياناتك وخبرتك وتخصصاتك مع معاينة حيّة لبطاقتك</p></div></div><div><span class="n">2</span><div><h4>بعد القبول المبدئي، سدّد الاشتراك</h4><p>${esc(Pitch.get().feeNote)} - <span class="num">${esc(c.join.fee)}</span> ريال، ${esc(c.join.period)}</p></div></div><div><span class="n">3</span><div><h4>استلم رمز دخولك وانشر بطاقتك</h4><p>تظهر في المنصة ويصلك رمز الدخول إلى لوحتك</p></div></div></div>` }
  ];

  const cfg = () => { const o = Store.get('content/joinPromo') || {}; return { on: o.on !== false, hidden: Array.isArray(o.hidden) ? o.hidden : Object.values(o.hidden || {}), sec: Math.min(15, Math.max(3, Number(o.sec) || 7)) }; };
  const active = () => { const c = cfg(); return c.on ? SLIDES.filter(s => !c.hidden.includes(s.id)) : []; };

  function html() {
    const list = active(); if (!list.length) return '';
    const c = Data.content();
    return `<section class="pm reveal" aria-roledescription="carousel" aria-label="مزايا المنصة وأرقامها">
      <div class="pm-track">${list.map((s, i) => `<article class="pm-slide pmx pmx-${s.theme}" data-i="${i}" aria-label="${esc(s.name)}"><span class="pmx-frame"></span>
        <header class="pmx-top"><img src="assets/logo-${s.theme === 'light' ? 'green' : 'cream'}.png" alt="مدرّبون سعوديّون" width="94" height="50"><span class="pmx-kick">${esc(s.kick)}</span></header>
        <div class="pmx-in">${s.html(c)}</div>
        <footer class="pmx-foot"><b>مدرّبون سعوديّون</b><i>|</i><em dir="ltr">SaudiTrainers.sa</em></footer></article>`).join('')}</div>
      <button type="button" class="pm-btn prev" aria-label="السابق"><i class="fa-solid fa-chevron-right"></i></button>
      <button type="button" class="pm-btn next" aria-label="التالي"><i class="fa-solid fa-chevron-left"></i></button>
      <div class="pm-nav">${list.map((s, i) => `<button type="button" data-d="${i}" class="${i ? '' : 'on'}" aria-label="${esc(s.name)}"></button>`).join('')}</div>
    </section>`;
  }

  function mount(root) {
    const box = $('.pm', root); if (!box) return;
    const track = $('.pm-track', box), slides = $$('.pm-slide', box), dots = $$('.pm-nav button', box), N = slides.length;
    const rtl = () => (getComputedStyle(track).direction === 'rtl' ? -1 : 1);
    const width = () => track.clientWidth || 1;
    const cur = () => Math.max(0, Math.min(N - 1, Math.round(Math.abs(track.scrollLeft) / width())));
    const go = i => { track.scrollTo({ left: rtl() * i * width(), behavior: 'smooth' }); };
    const mark = () => { const c = cur(); dots.forEach((d, i) => d.classList.toggle('on', i === c)); };
    let t0; track.addEventListener('scroll', () => { clearTimeout(t0); t0 = setTimeout(mark, 60); }, { passive: true });
    const next = () => go(cur() + 1 >= N ? 0 : cur() + 1), prev = () => go(cur() - 1 < 0 ? N - 1 : cur() - 1);
    $('.pm-btn.next', box).onclick = () => { next(); hold(); };
    $('.pm-btn.prev', box).onclick = () => { prev(); hold(); };
    dots.forEach(d => d.onclick = () => { go(Number(d.dataset.d)); hold(); });
    $$('[data-pm-go]', box).forEach(b => b.onclick = () => $('.wizard', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    // تشغيل تلقائي: يتوقف عند التمرير بالمؤشر أو اللمس أو التركيز، ولا يعمل لمن فضّل تقليل الحركة
    let paused = false, resume = 0, visible = true;
    const hold = (ms = 6000) => { paused = true; clearTimeout(resume); resume = setTimeout(() => { paused = false; }, ms); };
    box.addEventListener('mouseenter', () => { paused = true; clearTimeout(resume); });
    box.addEventListener('mouseleave', () => { clearTimeout(resume); resume = setTimeout(() => { paused = false; }, 1500); });
    box.addEventListener('touchstart', () => hold(8000), { passive: true });
    box.addEventListener('focusin', () => { paused = true; clearTimeout(resume); });
    box.addEventListener('focusout', () => { clearTimeout(resume); resume = setTimeout(() => { paused = false; }, 1500); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.3 }).observe(box);
    if (N < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ms = cfg().sec * 1000;
    const timer = setInterval(() => { if (!document.body.contains(box)) { clearInterval(timer); return; } if (!paused && visible && !document.hidden) next(); }, ms);
  }

  return { SLIDES, cfg, html, mount };
})();

/* ===== لوحة الإدارة: إظهار/إخفاء الشرائح وسرعة التحريك (في تبويب المحتوى العام) ===== */
function joinPromoBox(host) {
  const c = PromoSlides.cfg();
  host.innerHTML = `<div class="pbox"><h3><i class="fa-solid fa-images"></i> شرائح الدعاية في صفحة التسجيل</h3>
    <p class="muted small">شرائح عريضة تتحرك تلقائياً أعلى صفحة «سجّل كمدرب» وتجمع مزايا الاشتراك ومزايا المنصة وأرقامها. أرقام شريحة «أرقام المنصة» تُقرأ من إحصاءات Google المحفوظة (stats/platform) إن وُجدت.</p>
    <form id="pmf" style="display:grid;gap:12px">
      <label class="chk"><input type="checkbox" name="on" ${c.on ? 'checked' : ''}><span><b>إظهار الشرائح في صفحة التسجيل</b></span></label>
      <div class="checks">${PromoSlides.SLIDES.map(s => `<label class="chk"><input type="checkbox" name="s_${s.id}" ${c.hidden.includes(s.id) ? '' : 'checked'}><span>${esc(s.name)}</span></label>`).join('')}</div>
      <label class="field"><span>مدة بقاء كل شريحة (ثوانٍ): <b class="num" id="pmv">${c.sec}</b></span><input type="range" name="sec" min="3" max="15" value="${c.sec}"></label>
      <div class="row"><button class="btn primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> حفظ</button><a class="btn ghost" href="#/join" target="_blank" rel="noopener"><i class="fa-solid fa-eye"></i> معاينة الصفحة</a></div>
    </form></div>`;
  const f = $('#pmf', host);
  f.elements.sec.oninput = () => { $('#pmv', host).textContent = f.elements.sec.value; };
  f.onsubmit = e => {
    e.preventDefault();
    const hidden = PromoSlides.SLIDES.filter(s => !f.elements[`s_${s.id}`].checked).map(s => s.id);
    Store.set('content/joinPromo', { on: f.elements.on.checked, hidden, sec: Number(f.elements.sec.value) || 7 }); Security.log('تعديل شرائح التسجيل'); toast('تم حفظ إعدادات الشرائح');
  };
}
