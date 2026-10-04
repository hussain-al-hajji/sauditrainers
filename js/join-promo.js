/* شرائح دعائية عريضة في صفحة التسجيل: تجمع مزايا الاشتراك ومزايا المنصة الجديدة وإحصاءاتها دون تكرار.
 * تتحرك تلقائياً يميناً ويساراً مع أزرار تحكم ونقاط، وتتوقف عند اللمس أو تمرير المؤشر.
 * الإعدادات في content/joinPromo = { on, hidden:[ids], sec } وتُعدَّل من لوحة الإدارة ← المحتوى العام ← شرائح صفحة التسجيل. */

const PROMO_DEFAULT_STATS = { impressionsAll: 198581, sessionsAll: 19931, usersAll: 12786, viewsAll: 43615 };

const PromoSlides = (() => {
  const li = (ic, t, d = '') => `<li><i class="fa-solid ${ic}"></i><div><b>${t}</b>${d ? `<small>${d}</small>` : ''}</div></li>`;
  const n = x => Number(x || 0).toLocaleString('en-US');

  // كل شريحة: المعرّف، الاسم في لوحة الإدارة، الثيم، ودالة بناء المحتوى
  const SLIDES = [
    { id: 'intro', name: 'التعريف والاشتراك', theme: 'dark', html: c => `
      <div class="pm-t"><span class="pm-eb">المنصة الأولى لتسويق خبرات المدربين السعوديين</span>
        <h3>كفاءات سعودية<br><em>في بطاقة واحدة</em></h3>
        <p>سيرتك وتخصصك وخبرتك ومنطقتك، موثّقة في بطاقة تعريفية تصل إلى الجهات التدريبية في دقائق.</p>
        <button type="button" class="btn gold" data-pm-go><i class="fa-solid fa-user-plus"></i> ابدأ التسجيل الآن</button></div>
      <div class="pm-v"><div class="pm-price"><small>اشتراك واحد</small><b>${esc(c.join.period.replace(/^اشتراك\s*/, '') || 'مدى الحياة')}</b><div class="pm-amt"><span class="num">${esc(c.join.fee)}</span> ريال</div><small>دفعة واحدة فقط · بلا تجديد سنوي</small></div></div>` },
    { id: 'perks', name: 'مزايا الاشتراك', theme: 'cream', html: () => `
      <div class="pm-t"><span class="pm-eb">مزايا الاشتراك</span><h3>خبرتك تستحق<br><em>بطاقة تليق بها</em></h3><p>كل ما تحتاجه ليعرفك من يبحث عن مدرب مثلك.</p></div>
      <ul class="pm-l">${li('fa-location-dot', 'حضورك في صفحة منطقتك', 'سيرتك وتخصصك تقرؤها الجهات التدريبية وتطلب التواصل معك')}${li('fa-bullhorn', 'بطاقتك تتحدث عنك في كل مكان', 'تُنشر باستمرار في قنوات المنصة الاجتماعية')}${li('fa-handshake', 'جسر مباشر إلى الجهات التدريبية', 'نختصر عليهم البحث ونربطهم بالمدرب المناسب')}${li('fa-star', 'ترشيحك أينما وُجدت الفرصة', 'نرشّحك للجهات التي تبحث عن أسماء لبرامجها')}${li('fa-hand-holding-dollar', 'لا عمولة على عقودك', 'ما تحصل عليه عبر المنصة كله لك (0%)')}</ul>` },
    { id: 'panel', name: 'لوحة التحكم الخاصة', theme: 'olive', html: () => `
      <div class="pm-t"><span class="pm-eb">تحديث جديد</span><h3>لوحة تحكم<br><em>خاصة بك</em></h3><p>ادخل برمز الدخول الخاص بك وأدر حضورك بنفسك.</p></div>
      <ul class="pm-l">${li('fa-key', 'دخول برمز خاص', 'صفحة «دخول المدربين» برمزك السري')}${li('fa-bolt', 'تعديل فوري', 'حدّث بياناتك وتظهر للزوار فور الحفظ مع معاينة حيّة لبطاقتك')}${li('fa-inbox', 'طلبات مباشرة', 'تصلك من الجهات التدريبية بالبريد وفي لوحتك دون أن يظهر رقم جوالك للزوار')}${li('fa-chart-column', 'إحصاءات صفحتك', 'مشاهدات بطاقتك وأرقام المنصة منذ الإطلاق')}</ul>` },
    { id: 'card', name: 'البطاقة والصيغ والألوان', theme: 'dark', html: () => `
      <div class="pm-t"><span class="pm-eb">بطاقتك التعريفية</span><h3>بطاقة موثّقة<br><em>بثلاث صيغ جاهزة</em></h3><p>حمّلها صورةً جاهزة للنشر بضغطة واحدة، وبلونك من ألوان الهوية.</p></div>
      <div class="pm-v pm-fmts"><div class="pm-pills"><span><i class="fa-solid fa-mobile-screen"></i> ستوري 9:16</span><span><i class="fa-solid fa-image"></i> منشور 4:5</span><span><i class="fa-solid fa-panorama"></i> عريضة 16:9</span></div>
        <div class="pm-dots"><i style="background:#005430"></i><i style="background:#0D2418"></i><i style="background:#7A8B2E"></i><i style="background:#EEF3E5"></i></div>
        <small>أخضر · داكن · زيتوني · كريمي — وتحديث لحظي لكل تعديل</small></div>` },
    { id: 'page', name: 'الصفحة الشخصية والمشاركة', theme: 'cream', html: () => `
      <div class="pm-t"><span class="pm-eb">صفحتك الشخصية</span><h3>صفحة عامة<br><em>باسمك ورابطك</em></h3><p>سيرتك الكاملة في صفحة واحدة تشاركها مع أي جهة.</p><span class="pm-url" dir="ltr">SaudiTrainers.sa/t/<b>your-name</b></span></div>
      <ul class="pm-l">${li('fa-earth-asia', 'أكثر من منطقة', 'وخيار الانتقال إلى مناطق أخرى')}${li('fa-share-nodes', 'مشاركة بنص جاهز بلسانك', 'لينكدإن وإنستقرام وإكس وواتساب، مع معاينة خاصة باسمك وصورتك')}${li('fa-award', 'شهادات وعضويات', 'وجهات تعاون تعزّز ثقة من يقرأ سيرتك')}${li('fa-users', 'مدربون مشابهون', 'يُعرضون تحت سيرتك لزيادة فرص الاكتشاف')}</ul>` },
    { id: 'bio', name: 'سيرة أغنى', theme: 'green', html: () => `
      <div class="pm-t"><span class="pm-eb">حقول أكثر</span><h3>سيرة أغنى<br><em>لتعريف أدق بك</em></h3><p>أضف ما يميّزك لتختارك الجهات عن علم.</p></div>
      <ul class="pm-l pm-2c">${li('fa-shapes', 'أكثر من 50 تخصصاً', 'وأضف تخصصك بخيار «أخرى»')}${li('fa-list-check', '15 مجالاً لكل مدرب', 'يظهر منها 6 على بطاقتك')}${li('fa-language', 'لغات التدريب', 'لتعرف الجهات لغات برامجك')}${li('fa-chalkboard-user', 'دورات TOT', 'تبرز تأهيلك في تدريب المدربين')}${li('fa-certificate', 'شهادات احترافية', 'واعتماداتك وعضوياتك المهنية')}${li('fa-book-open', 'عناوين دوراتك', 'برامج قدّمتها سابقاً')}</ul>` },
    { id: 'reach', name: 'ظهورك للجهات', theme: 'dark', html: () => `
      <div class="pm-t"><span class="pm-eb">ظهورك للجهات</span><h3>تجدك الجهات<br><em>بالبحث والمنطقة</em></h3><p>تُعرض بطاقتك في صفحة منطقتك وتخصصك، ويمكن لأي جهة أن تطلب ترشيحك لبرنامجها.</p></div>
      <div class="pm-v"><div class="pm-search"><i class="fa-solid fa-magnifying-glass"></i> ابحث باسم مدرب، موضوع، أو شهادة...</div>
        <div class="pm-chips">${REGIONS.slice(0, 13).map(r => `<span>${esc(r.name)}</span>`).join('')}</div><small>13 منطقة · ظهور في نتائج البحث العامة</small></div>` },
    { id: 'stats', name: 'أرقام المنصة', theme: 'gold', html: () => {
      const P = Store.get('stats/platform') || {}, v = k => (P[k] != null ? P[k] : PROMO_DEFAULT_STATS[k]);
      return `<div class="pm-t"><span class="pm-eb">أرقام حقيقية من إحصاءات Google</span><h3>أرقام المنصة<br><em>منذ الإطلاق</em></h3><p>المصدر: Google Analytics وGoogle Search Console.</p></div>
      <div class="pm-st"><div><b class="num">${n(v('impressionsAll'))}</b><span>مرة ظهور في نتائج بحث Google</span></div><div><b class="num">${n(v('sessionsAll'))}</b><span>جلسة زيارة</span></div><div><b class="num">${n(v('usersAll'))}</b><span>مستخدم</span></div><div><b class="num">${n(v('viewsAll'))}</b><span>مشاهدة للصفحة الرئيسية</span></div></div>`; } },
    { id: 'start', name: 'ابدأ في ثلاث خطوات', theme: 'green', html: c => `
      <div class="pm-t"><span class="pm-eb">ابدأ الآن</span><h3>انضم إلى المنصة<br><em>في ثلاث خطوات</em></h3><button type="button" class="btn gold" data-pm-go><i class="fa-solid fa-paper-plane"></i> سجّل كمدرب سعودي</button></div>
      <ol class="pm-steps"><li><b>أكمل نموذج التسجيل</b><small>بياناتك وخبرتك وتخصصاتك مع معاينة حيّة لبطاقتك</small></li><li><b>بعد القبول المبدئي، سدّد الاشتراك</b><small>${esc(c.join.feeNote)} — <span class="num">${esc(c.join.fee)}</span> ريال، ${esc(c.join.period)}</small></li><li><b>استلم رمز دخولك وانشر بطاقتك</b><small>تظهر في المنصة ويصلك رمز الدخول إلى لوحتك</small></li></ol>` }
  ];

  const cfg = () => { const o = Store.get('content/joinPromo') || {}; return { on: o.on !== false, hidden: Array.isArray(o.hidden) ? o.hidden : Object.values(o.hidden || {}), sec: Math.min(15, Math.max(3, Number(o.sec) || 7)) }; };
  const active = () => { const c = cfg(); return c.on ? SLIDES.filter(s => !c.hidden.includes(s.id)) : []; };

  function html() {
    const list = active(); if (!list.length) return '';
    const c = Data.content();
    return `<section class="pm reveal" aria-roledescription="carousel" aria-label="مزايا المنصة وأرقامها">
      <div class="pm-track">${list.map((s, i) => `<article class="pm-slide pm-${s.theme}" data-i="${i}" aria-label="${esc(s.name)}"><div class="pm-in">${s.html(c)}</div><div class="pm-ft"><img src="assets/logo-${s.theme === 'cream' ? 'green' : 'cream'}.png" alt="" width="64" height="34"><span dir="ltr">SaudiTrainers.sa</span></div></article>`).join('')}</div>
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
