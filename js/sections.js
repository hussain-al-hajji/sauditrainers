/* أقسام الصفحة الرئيسية: كل قسم له نوع وقالب وبيانات، وتُدار من لوحة الإدارة ← الصفحة الرئيسية
 * الإعداد محفوظ في content/home/list. */

const ICON_CHOICES = ['fa-wand-magic-sparkles', 'fa-magnifying-glass', 'fa-handshake', 'fa-file-signature', 'fa-user-check', 'fa-rocket', 'fa-building-columns', 'fa-list-check', 'fa-chalkboard-user', 'fa-graduation-cap', 'fa-lightbulb', 'fa-award', 'fa-certificate', 'fa-people-group', 'fa-bullhorn', 'fa-chart-line', 'fa-clock', 'fa-star', 'fa-heart', 'fa-shield-halved', 'fa-location-dot', 'fa-laptop', 'fa-book-open', 'fa-pen-ruler', 'fa-comments', 'fa-circle-question', 'fa-id-card', 'fa-calendar-check', 'fa-briefcase', 'fa-gift'];
const safeHref = h => { h = String(h || '').trim(); return /^#\/[\w\-/?=&%.]*$/.test(h) ? h : safeUrl(h); };
const BG_CHOICES = [['light', 'فاتح'], ['tint', 'كريمي'], ['pattern', 'فاتح بنقش القرطاسية'], ['dark', 'أخضر داكن بنقش']];
const monthName = ts => new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { month: 'long' });

const SECTION_TYPES = (() => {
  const head = d => (d.eyebrow || d.title || d.sub ? `<div class="sec-h reveal">${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}${d.title ? `<h2>${esc(d.title)}</h2>` : ''}${d.sub ? `<p>${esc(d.sub)}</p>` : ''}</div>` : '');
  const HEAD = [{ k: 'eyebrow', label: 'العنوان الصغير' }, { k: 'title', label: 'العنوان' }, { k: 'sub', label: 'الوصف', t: 'area' }];
  const live = () => Data.live();
  const tokens = s => String(s ?? '').replace(/\{trainers\}/g, live().length).replace(/\{regions\}/g, Object.keys(Data.regionCounts()).length).replace(/\{specs\}/g, Object.keys(Data.specCounts()).length).replace(/\{requests\}/g, Store.list('showcase').length);

  const T = {};

  T.hero = {
    name: 'الواجهة الرئيسية', icon: 'fa-flag', fixedBg: true,
    tpls: [['map', 'مع خريطة المناطق'], ['center', 'عنوان مركزي وبحث']],
    schema: [{ k: 'kicker', label: 'الشارة العلوية' }, { k: 'title', label: 'العنوان' }, { k: 'titleAccent', label: 'سطر العنوان المميز' }, { k: 'words', label: 'الكلمات المتبدلة (افصل بفاصلة)' }, { k: 'sub', label: 'الوصف', t: 'area' }, { k: 'quick', label: 'إظهار «الأكثر طلباً»', t: 'check' }, { k: 'stats', label: 'إظهار الأرقام', t: 'check' }],
    def: () => { const h = defaultContent().hero; return { ...h, quick: true, stats: true }; },
    render(sec) {
      const d = sec.d, ls = live(), counts = Data.regionCounts(), sc = Data.specCounts();
      const words = splitList(d.words);
      const intro = `
          <span class="kicker reveal">${esc(d.kicker)}</span>
          <h1 class="reveal" style="--d:80ms">${esc(d.title)}<span class="acc">${esc(d.titleAccent)}</span></h1>
          <p class="sub reveal" style="--d:160ms">${words.length ? `مدربون سعوديون ممارسون في <span class="rotator">${words.map((w, i) => `<span class="${i ? '' : 'on'}">${esc(w)}</span>`).join('')}</span><br>` : ''}${esc(d.sub)}</p>
          <div class="hsearch reveal" style="--d:240ms">
            <form class="hs-form" autocomplete="off">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="search" class="hq" placeholder="ابحث باسم مدرب، موضوع، أو تخصص..." aria-label="بحث">
              <select class="hr" aria-label="المنطقة"><option value="">كل المناطق</option>${REGIONS.map(r => opt(r.k, r.name)).join('')}</select>
              <button class="btn gold">بحث</button>
            </form>
            <div class="suggest"></div>
          </div>
          ${d.quick !== false ? `<div class="quick reveal" style="--d:300ms">الأكثر طلباً: ${['leadership', 'ai-data', 'entrepreneur', 'marketing', 'hr-dev'].map(k => `<a href="#/trainers?spec=${k}">${specName(k)}</a>`).join('')}</div>` : ''}
          ${d.stats !== false ? `<div class="hstats reveal" style="--d:380ms"><div><b data-count="${ls.length}">0</b><span>مدرب ومدربة</span></div><div><b data-count="${Object.keys(counts).length}">0</b><span>منطقة إدارية</span></div><div><b data-count="${Object.keys(sc).length}">0</b><span>تخصصاً تدريبياً</span></div></div>` : ''}`;
      if (sec.tpl === 'center') return `<section class="hero hero-center"><div class="wrap">${intro}</div></section>`;
      return `<section class="hero"><div class="wrap hero-grid"><div>${intro}</div>
        <div class="mapbox reveal" style="--d:200ms">${KSAMap.svg(counts)}<div class="map-tip"></div>
          <div class="floaty f1"><i class="fa-solid fa-bolt"></i><span><b>ترشيح فوري</b>مطابقة ذكية لاحتياجك</span></div>
          <div class="floaty f2"><i class="fa-solid fa-id-card"></i><span><b>بطاقات موثّقة</b>قابلة للمشاركة</span></div>
          <div class="map-legend"><i></i>اضغط على منطقة لعرض مدربيها</div></div></div></section>`;
    },
    mount(el) {
      const map = $('.mapbox', el); map && KSAMap.mount(map);
      mountSuggest($('.hq', el), $('.suggest', el));
      $('.hs-form', el).onsubmit = e => {
        e.preventDefault();
        const q = $('.hq', el).value.trim(), r = $('.hr', el).value;
        const p = new URLSearchParams(); if (q) p.set('q', q); if (r) p.set('region', r);
        location.hash = `#/trainers${p.toString() ? '?' + p : ''}`;
      };
      const spans = $$('.rotator span', el); let i = 0;
      if (spans.length > 1) App.interval(() => {
        spans[i].classList.remove('on'); spans[i].classList.add('off');
        const prev = spans[i]; setTimeout(() => prev.classList.remove('off'), 500);
        i = (i + 1) % spans.length; spans[i].classList.add('on');
      }, 2400);
      countUp(el);
    }
  };

  T.marquee = {
    name: 'شريط متحرك', icon: 'fa-arrows-left-right', fixedBg: true,
    tpls: [['specs', 'التخصصات'], ['regions', 'المناطق'], ['words', 'كلمات مخصصة']],
    schema: [{ k: 'words', label: 'الكلمات (لقالب «كلمات مخصصة»، افصل بفاصلة)', t: 'area' }],
    def: () => ({ words: 'تدريب نوعي، مدربون ممارسون، بطاقات موثّقة، ترشيح ذكي، في كل المناطق' }),
    render(sec) {
      const items = sec.tpl === 'regions' ? REGIONS.map(r => `<a href="#/trainers?region=${r.k}"><i class="fa-solid fa-location-dot"></i>${r.name}</a>`)
        : sec.tpl === 'words' ? splitList(sec.d.words).map(w => `<span class="mq-word"><i class="fa-solid fa-star-of-life"></i>${esc(w)}</span>`)
          : SPECIALTIES.map(s => `<a href="#/trainers?spec=${s.k}"><i class="fa-solid ${s.icon}"></i>${esc(s.name)}</a>`);
      return `<div class="marquee" aria-hidden="${sec.tpl === 'words'}"><div class="marquee-track">${[...items, ...items].join('')}</div></div>`;
    }
  };

  T.featured = {
    name: 'نخبة المدربين', icon: 'fa-id-card',
    tpls: [['grid', 'شبكة بطاقات'], ['carousel', 'شريط قابل للتمرير'], ['list', 'قائمة مختصرة']],
    schema: [...HEAD, { k: 'count', label: 'عدد المدربين', t: 'number' }, { k: 'only', label: 'من يظهر', t: 'select', opts: [['random', 'عشوائي يتغير مع كل زيارة'], ['mix', 'المميزون أولاً ثم الأحدث'], ['featured', 'المميزون فقط'], ['latest', 'الأحدث نشراً']] }, { k: 'btn', label: 'زر «تصفّح جميع المدربين»', t: 'check' }],
    def: () => ({ eyebrow: 'نخبة المدربين', title: 'كفاءات سعودية جاهزة لبرنامجك القادم', sub: 'بطاقات تعريفية موثّقة تختصر عليك السيرة الذاتية: التخصص، والخبرة، والمنطقة.', count: 6, only: 'random', btn: true }),
    // قائمة المدربين المعروضة: عشوائية (تتجدد مع كل عرض) أو حسب الإعداد. القيمتان الافتراضيتان السابقتان («mix» بعدد 8 و«random» بعدد 5) تُعامَلان كالإعداد الجديد: عشوائي بست بطاقات
    pick(d) {
      const ls = live(), legacy = (d.only === 'mix' && Number(d.count) === 8) || (d.only === 'random' && Number(d.count) === 5), only = legacy || !d.only ? 'random' : d.only, n = Math.max(1, legacy ? 6 : Number(d.count) || 6);
      if (only === 'random') { const a = [...ls]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
      return (only === 'featured' ? ls.filter(t => t.featured) : only === 'latest' ? [...ls].sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)) : [...ls.filter(t => t.featured), ...ls.filter(t => !t.featured)]).slice(0, n);
    },
    render(sec) {
      const d = sec.d, list = T.featured.pick(d);
      if (!list.length) return '';
      const body = sec.tpl === 'carousel' ? `<div class="hs-carousel"><button class="cr-btn prev" aria-label="السابق"><i class="fa-solid fa-chevron-right"></i></button><div class="cr-track">${list.map((t, i) => Card.mini(t, i)).join('')}</div><button class="cr-btn next" aria-label="التالي"><i class="fa-solid fa-chevron-left"></i></button></div>`
        : sec.tpl === 'list' ? `<div class="hs-list">${list.map(t => `<a class="hl-row reveal" href="#/t/${esc(encodeURIComponent(t.slug || t.id))}">${Card.avatar(t, 'hl-av')}<span class="grow"><b>${esc(t.name)}</b><small>${esc(t.title || '')}</small></span><span class="hl-meta"><i class="fa-solid fa-location-dot"></i>${esc(regionName(t.region))}</span><span class="hl-chips">${Data.specs(t).slice(0, 2).map(s => `<span>${esc(specName(s))}</span>`).join('')}</span><i class="fa-solid fa-arrow-left hl-go"></i></a>`).join('')}</div>`
          : `<div class="tgrid">${list.map((t, i) => Card.mini(t, i)).join('')}</div>`;
      return `<div class="wrap">${head(d)}<div class="fx-tabs"><button type="button" class="btn primary" data-shuffle><i class="fa-solid fa-id-card"></i> تصفح سير المدربين</button><a class="btn ghost" href="#/request"><i class="fa-solid fa-wand-magic-sparkles"></i> اطلب ترشيح مدرب</a></div>${body}${d.btn !== false ? '<div class="center" style="margin-top:30px"><a class="btn primary lg" href="#/trainers">تصفّح جميع المدربين <i class="fa-solid fa-arrow-left"></i></a></div>' : ''}</div>`;
    },
    mount(el, sec) {
      // «تصفح سير المدربين»: يعرض خمسة مدربين جدداً عشوائياً
      const sh = $('[data-shuffle]', el);
      sh && (sh.onclick = () => { const box = $('.tgrid, .cr-track', el); if (box && sec) { box.innerHTML = T.featured.pick(sec.d).map((t, i) => Card.mini(t, i)).join(''); tilt(box); $$('.reveal', box).forEach(x => x.classList.add('in')); } });
      const tr = $('.cr-track', el); if (!tr) return;
      const step = () => tr.clientWidth * 0.8;
      $('.prev', el).onclick = () => tr.scrollBy({ left: step(), behavior: 'smooth' });
      $('.next', el).onclick = () => tr.scrollBy({ left: -step(), behavior: 'smooth' });
    }
  };

  T.steps = {
    name: 'كيف تعمل المنصة', icon: 'fa-shoe-prints',
    tpls: [['tabs', 'مساران بتبويب'], ['stacked', 'المساران معاً']],
    schema: [...HEAD, { k: 'tracks', label: 'المسارات', t: 'list', add: 'مسار', sub: [{ k: 'name', label: 'اسم المسار' }, { k: 'icon', label: 'الأيقونة', t: 'icon' }, { k: 'items', label: 'الخطوات', t: 'list', add: 'خطوة', sub: [{ k: 'icon', label: 'الأيقونة', t: 'icon' }, { k: 'title', label: 'العنوان' }, { k: 'text', label: 'النص', t: 'area' }] }] }],
    def: () => ({ eyebrow: 'كيف تعمل المنصة', title: 'طريقان يلتقيان عند التدريب المتميز', tracks: [
      { name: 'للجهات التدريبية', icon: 'fa-building-columns', items: [{ icon: 'fa-magnifying-glass', title: 'ابحث أو اطلب', text: 'ابحث بالتخصص والمنطقة، أو صِف احتياجك في «اطلب مدرباً».' }, { icon: 'fa-wand-magic-sparkles', title: 'ترشيح ذكي', text: 'يقترح النظام أنسب المدربين فوراً، ويتابع فريقنا طلبك للترشيح الأدق.' }, { icon: 'fa-handshake', title: 'تواصل عبر المنصة', text: 'أرسل طلب التواصل من بطاقة المدرب فيصله فوراً، ويتواصل معك مباشرة.' }] },
      { name: 'للمدربين', icon: 'fa-chalkboard-user', items: [{ icon: 'fa-file-signature', title: 'سجّل بياناتك', text: 'نموذج تسجيل ذكي بخطوات، وترى بطاقتك تتشكّل أمامك لحظة بلحظة.' }, { icon: 'fa-user-check', title: 'المراجعة والقبول', text: 'نراجع طلبك ونتحقق من المتطلبات، وتتابع حالته برقم الطلب.' }, { icon: 'fa-rocket', title: 'انطلق وتألّق', text: 'تُنشر بطاقتك وتصلك بيانات الدخول لتعديلها ومشاركتها ومتابعة الطلبات.' }] }] }),
    render(sec) {
      const tr = arr(sec.d.tracks);
      const steps = (t, hide) => `<div class="steps ${hide ? 'hidden' : ''}">${arr(t.items).map((s, i) => `<div class="step reveal" style="--d:${i * 100}ms"><div class="ic"><i class="fa-solid ${esc(s.icon || 'fa-circle')}"></i></div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>`;
      if (sec.tpl === 'stacked') return `<div class="wrap">${head(sec.d)}${tr.map(t => `<h3 class="track-h"><i class="fa-solid ${esc(t.icon || 'fa-circle')}"></i> ${esc(t.name)}</h3>${steps(t)}`).join('')}</div>`;
      return `<div class="wrap">${head(sec.d)}${tr.length > 1 ? `<div class="tracks reveal">${tr.map((t, i) => `<button class="${i ? '' : 'on'}" data-i="${i}"><i class="fa-solid ${esc(t.icon || 'fa-circle')}"></i> ${esc(t.name)}</button>`).join('')}</div>` : ''}${tr.map((t, i) => steps(t, i > 0)).join('')}</div>`;
    },
    mount(el) {
      $$('.tracks button', el).forEach(b => b.onclick = () => {
        $$('.tracks button', el).forEach(x => x.classList.toggle('on', x === b));
        $$('.steps', el).forEach((s, i) => s.classList.toggle('hidden', i !== Number(b.dataset.i)));
      });
    }
  };

  T.specs = {
    name: 'التخصصات', icon: 'fa-layer-group',
    tpls: [['grid', 'بطاقات'], ['chips', 'كبسولات مختصرة']],
    schema: HEAD,
    def: () => ({ eyebrow: 'ابحث بالتخصص', title: 'كل مجال تدريبي… له أهله' }),
    render(sec) {
      const sc = Data.specCounts();
      const body = sec.tpl === 'chips' ? `<div class="spec-chips">${SPECIALTIES.map(s => `<a href="#/trainers?spec=${s.k}"><i class="fa-solid ${s.icon}"></i>${esc(s.name)}<b class="num">${sc[s.k] || 0}</b></a>`).join('')}</div>`
        : `<div class="specs">${SPECIALTIES.map((s, i) => `<a class="spec reveal" style="--d:${(i % 8) * 40}ms" href="#/trainers?spec=${s.k}"><span class="ic"><i class="fa-solid ${s.icon}"></i></span><span><b>${esc(s.name)}</b><small><span class="num">${sc[s.k] || 0}</span> مدرب</small></span></a>`).join('')}</div>`;
      return `<div class="wrap">${head(sec.d)}${body}</div>`;
    }
  };

  T.regions = {
    name: 'المناطق', icon: 'fa-map-location-dot',
    tpls: [['tiles', 'مربعات'], ['pills', 'كبسولات']],
    schema: HEAD,
    def: () => ({ eyebrow: 'ابحث بالمنطقة', title: 'من تبوك إلى جازان… ومن جدة إلى الأحساء', sub: 'مدربون في مناطق المملكة الثلاث عشرة، حضورياً أو عن بُعد.' }),
    render(sec) {
      const c = Data.regionCounts();
      const body = sec.tpl === 'pills' ? `<div class="spec-chips">${REGIONS.map(r => `<a href="#/trainers?region=${r.k}"><i class="fa-solid fa-location-dot"></i>${r.name}<b class="num">${c[r.k] || 0}</b></a>`).join('')}</div>`
        : `<div class="regions">${REGIONS.map((r, i) => `<a class="region reveal" style="--d:${i * 40}ms" href="#/trainers?region=${r.k}"><b>${r.name}</b><small>${r.city}</small><span class="cnt num">${c[r.k] || 0}</span></a>`).join('')}</div>`;
      return `<div class="wrap">${head(sec.d)}${body}</div>`;
    }
  };

  T.orders = {
    name: 'من طلبات هذا الشهر', icon: 'fa-table-cells-large',
    tpls: [['slider', 'مربعات متحركة'], ['grid', 'مربعات ثابتة']],
    schema: [...HEAD, { k: 'count', label: 'أقصى عدد للبطاقات', t: 'number' }, { k: 'scope', label: 'الفترة', t: 'select', opts: [['month', 'هذا الشهر (وإن لم توجد فالأحدث)'], ['latest', 'الأحدث دائماً']] }],
    def: () => ({ eyebrow: 'نبض المنصة', title: 'من طلبات هذا الشهر', sub: 'برامج طلبتها جهات تدريبية من مدربي المنصة مؤخراً.', count: 12, scope: 'month' }),
    render(sec) {
      const d = sec.d, all = Store.list('showcase').sort((a, b) => b.ts - a.ts);
      const now = new Date(), inMonth = all.filter(x => { const t = new Date(x.ts); return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear(); });
      const list = (d.scope === 'latest' || !inMonth.length ? all : inMonth).slice(0, Math.max(1, Number(d.count) || 12));
      if (!list.length) return '';
      const tile = x => `<article class="ord" style="--pat:${Pattern.css('#EEF3E5', 0.12)}">
        <span class="ord-ic"><i class="fa-solid ${specOf(x.spec)?.icon || 'fa-chalkboard-user'}"></i></span>
        <b>${esc(x.title)}</b>
        <small>${esc(x.org || 'جهة تدريبية')}</small>
        ${x.trainerName ? `<span class="ord-tr"><i class="fa-solid fa-user-tie"></i>${esc(x.trainerName)}</span>` : ''}
        <span class="ord-meta">${x.region ? `<span><i class="fa-solid fa-location-dot"></i>${esc(regionName(x.region))}</span>` : ''}<span><i class="fa-regular fa-calendar"></i>${esc(monthName(x.ts))}</span></span>
      </article>`;
      if (sec.tpl === 'grid') return `<div class="wrap">${head(d)}<div class="ord-grid">${list.map(tile).join('')}</div></div>`;
      let loop = [...list]; while (loop.length < 8) loop = loop.concat(list);
      return `<div class="wrap">${head(d)}</div><div class="ord-slider" aria-label="${esc(d.title)}"><div class="ord-track" style="--dur:${loop.length * 4}s">${[...loop, ...loop].map(tile).join('')}</div></div>`;
    }
  };

  T.join = {
    name: 'انضم كمدرب (الرسوم والمزايا)', icon: 'fa-user-plus',
    tpls: [['cards', 'مع نماذج البطاقات'], ['compact', 'شريط مختصر']],
    schema: [{ k: 'eyebrow', label: 'العنوان الصغير' }, { k: 'title', label: 'العنوان' }, { k: 'text', label: 'النص', t: 'area' }],
    def: () => ({ eyebrow: 'للمدربين السعوديين', title: 'خبرتك تستحق بطاقة تليق بها', text: 'انضم إلى المنصة واحصل على بطاقة تعريفية احترافية، وصفحة خاصة قابلة للمشاركة، وفريق تسويق يرشّحك للجهات التدريبية.' }),
    render(sec) {
      const c = Data.content(), d = sec.d;
      const price = `<div class="price"><span class="ribbon">${esc(c.join.period)}</span><div class="amt num">${esc(c.join.fee)}<small>ريال</small></div><div class="price-note">${esc(c.join.feeNote)}</div>
        <ul>${benefitList(c.join.benefits).slice(0, 5).map(b => `<li><i class="fa-solid fa-circle-check"></i>${esc(b.t)}</li>`).join('')}</ul>
        <div class="row"><a class="btn gold lg" href="#/join">سجّل كمدرب الآن <i class="fa-solid fa-arrow-left"></i></a><a class="btn glass" href="#/status">متابعة طلب</a></div></div>`;
      if (sec.tpl === 'compact') return `<div class="wrap"><div class="cta-band reveal"><div><span class="eyebrow">${esc(d.eyebrow)}</span><h2>${esc(d.title)}</h2><p>${esc(d.text)}</p></div><div class="row"><span class="amt-inline"><b class="num">${esc(c.join.fee)}</b> ريال · ${esc(c.join.period)}</span><a class="btn gold lg" href="#/join">سجّل الآن</a></div></div></div>`;
      const samples = [
        { name: 'بطاقتك الاحترافية', title: 'مدربة في التحول الرقمي', region: 'eastern', theme: 'cream', specs: ['digital'], years: 6, hours: 900, code: 'ST0000' },
        { name: 'اسمك هنا', title: 'مدرب معتمد في القيادة والتطوير', region: 'riyadh', theme: 'deep', specs: ['leadership'], years: 8, hours: 1200, code: 'ST0000' },
        { name: 'مدرّب سعودي', title: 'خبرة تدريبية تستحق الظهور', region: 'makkah', theme: 'brand', specs: ['hr-dev', 'soft'], years: 10, hours: 2400, programs: 60, code: 'ST0000', modes: ['onsite', 'online'] }
      ];
      return `<div class="wrap join-grid"><div class="reveal"><span class="eyebrow">${esc(d.eyebrow)}</span><h2 class="join-h">${esc(d.title)}</h2><p class="join-p">${esc(d.text)}</p>${price}</div>
        <div class="join-cards reveal" style="--d:150ms">${samples.map(t => Card.full(t, { preview: true })).join('')}</div></div>`;
    }
  };

  T.cards = {
    name: 'بطاقات معلومات', icon: 'fa-grip', custom: true,
    tpls: [['c3', 'ثلاثة أعمدة'], ['c2', 'عمودان'], ['c4', 'أربعة أعمدة'], ['list', 'قائمة أفقية']],
    schema: [...HEAD, { k: 'items', label: 'البطاقات', t: 'list', add: 'بطاقة', sub: [{ k: 'icon', label: 'الأيقونة', t: 'icon' }, { k: 'title', label: 'العنوان' }, { k: 'text', label: 'النص', t: 'area' }, { k: 'href', label: 'الرابط (مثل #/request أو https://...)' }, { k: 'btn', label: 'نص الزر (اختياري)' }] }],
    def: () => ({ items: [{ icon: 'fa-wand-magic-sparkles', title: 'اطلب مدرباً', text: 'صِف برنامجك واحتياجك، وسنقترح عليك أنسب المدربين فوراً ونتابع طلبك.', href: '#/request' }, { icon: 'fa-building-columns', title: 'قاعات التدريب', text: 'لديك قاعة وترغب في عرضها، أو تحتاج قاعة لدورتك؟ أرسل احتياجك.', href: '#/halls' }, { icon: 'fa-list-check', title: 'متابعة طلب التسجيل', text: 'اعرف حالة طلبك خطوة بخطوة برقم الطلب.', href: '#/status' }] }),
    render(sec) {
      const items = arr(sec.d.items);
      const card = (it, i) => { const h = safeHref(it.href); const tag = h ? 'a' : 'div'; return `<${tag} class="icard reveal" style="--d:${i * 80}ms;color:inherit" ${h ? `href="${esc(h)}" ${/^https?:/.test(h) ? 'target="_blank" rel="noopener"' : ''}` : ''}><div class="ic"><i class="fa-solid ${esc(it.icon || 'fa-circle')}"></i></div><div><h3>${esc(it.title)}</h3><p>${nl2br(it.text)}</p>${it.btn && h ? `<span class="icard-btn">${esc(it.btn)} <i class="fa-solid fa-arrow-left"></i></span>` : ''}</div></${tag}>`; };
      return `<div class="wrap">${head(sec.d)}<div class="cardsx ${esc(sec.tpl || 'c3')}">${items.map(card).join('')}</div></div>`;
    }
  };

  T.text = {
    name: 'نص وصورة', icon: 'fa-align-right', custom: true,
    tpls: [['center', 'نص في المنتصف'], ['split', 'صورة بجانب النص'], ['split-r', 'نص ثم صورة'], ['quote', 'اقتباس بارز']],
    schema: [{ k: 'eyebrow', label: 'العنوان الصغير' }, { k: 'title', label: 'العنوان' }, { k: 'text', label: 'النص', t: 'area' }, { k: 'img', label: 'رابط الصورة (Google Drive أو https)' }, { k: 'btn', label: 'نص الزر' }, { k: 'href', label: 'رابط الزر' }],
    def: () => ({ eyebrow: '', title: 'عنوان القسم', text: 'اكتب هنا نصاً تعريفياً.' }),
    render(sec) {
      const d = sec.d, img = driveImg(d.img), h = safeHref(d.href);
      const btn = d.btn && h ? `<a class="btn primary" href="${esc(h)}">${esc(d.btn)}</a>` : '';
      if (sec.tpl === 'quote') return `<div class="wrap"><blockquote class="hs-quote reveal"><i class="fa-solid fa-quote-right"></i><p>${nl2br(d.text)}</p>${d.title ? `<cite>${esc(d.title)}</cite>` : ''}${btn}</blockquote></div>`;
      const txt = `<div class="hs-text">${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}${d.title ? `<h2>${esc(d.title)}</h2>` : ''}<p>${nl2br(d.text)}</p>${btn}</div>`;
      if (sec.tpl === 'center' || !img) return `<div class="wrap center-text reveal">${txt}</div>`;
      return `<div class="wrap hs-split ${sec.tpl === 'split-r' ? 'rev' : ''} reveal"><div class="hs-img"><img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>${txt}</div>`;
    }
  };

  T.stats = {
    name: 'أرقام وإحصاءات', icon: 'fa-chart-simple', custom: true,
    tpls: [['row', 'صف أرقام'], ['tiles', 'مربعات']],
    schema: [...HEAD, { k: 'items', label: 'الأرقام', t: 'list', add: 'رقم', sub: [{ k: 'value', label: 'الرقم (أو {trainers} {regions} {specs} {requests})' }, { k: 'label', label: 'الوصف' }, { k: 'icon', label: 'الأيقونة', t: 'icon' }] }],
    def: () => ({ title: 'المنصة بالأرقام', items: [{ value: '{trainers}', label: 'مدرب ومدربة', icon: 'fa-id-card' }, { value: '{regions}', label: 'منطقة', icon: 'fa-location-dot' }, { value: '{specs}', label: 'تخصصاً', icon: 'fa-layer-group' }] }),
    render(sec) {
      const items = arr(sec.d.items);
      return `<div class="wrap">${head(sec.d)}<div class="hs-stats ${esc(sec.tpl || 'row')}">${items.map(it => { const v = tokens(it.value); return `<div class="reveal"><i class="fa-solid ${esc(it.icon || 'fa-circle')}"></i><b class="num" ${/^\d+$/.test(v) ? `data-count="${v}"` : ''}>${esc(v)}</b><span>${esc(it.label)}</span></div>`; }).join('')}</div></div>`;
    },
    mount(el) { countUp(el); }
  };

  T.banner = {
    name: 'شريط دعوة (CTA)', icon: 'fa-bullhorn', custom: true, fixedBg: true,
    tpls: [['green', 'أخضر'], ['cream', 'كريمي']],
    schema: [{ k: 'title', label: 'العنوان' }, { k: 'text', label: 'النص', t: 'area' }, { k: 'b1', label: 'الزر الأول' }, { k: 'h1', label: 'رابط الزر الأول' }, { k: 'b2', label: 'الزر الثاني' }, { k: 'h2', label: 'رابط الزر الثاني' }],
    def: () => ({ title: 'جاهز لبرنامجك القادم؟', text: 'صِف احتياجك ونرشّح لك المدرب المناسب.', b1: 'اطلب مدرباً', h1: '#/request', b2: 'سجّل كمدرب', h2: '#/join' }),
    render(sec) {
      const d = sec.d, h1 = safeHref(d.h1), h2 = safeHref(d.h2);
      return `<div class="wrap" style="padding-block:20px"><div class="cta-band ${sec.tpl === 'cream' ? 'cream' : ''} reveal"><div><h2>${esc(d.title)}</h2><p>${nl2br(d.text)}</p></div><div class="row">${d.b1 && h1 ? `<a class="btn ${sec.tpl === 'cream' ? 'primary' : 'gold'} lg" href="${esc(h1)}">${esc(d.b1)}</a>` : ''}${d.b2 && h2 ? `<a class="btn ${sec.tpl === 'cream' ? '' : 'glass'} lg" href="${esc(h2)}">${esc(d.b2)}</a>` : ''}</div></div></div>`;
    }
  };

  T.faq = {
    name: 'الأسئلة الشائعة', icon: 'fa-circle-question',
    tpls: [['list', 'قائمة'], ['two', 'عمودان']],
    schema: [...HEAD, { k: 'items', label: 'الأسئلة', t: 'list', add: 'سؤال', sub: [{ k: 'q', label: 'السؤال' }, { k: 'a', label: 'الجواب', t: 'area' }] }],
    def: () => ({ eyebrow: 'أسئلة شائعة', title: 'كل ما تحتاج معرفته', items: defaultContent().faq }),
    render(sec) {
      return `<div class="wrap">${head(sec.d)}<div class="faq ${sec.tpl === 'two' ? 'two' : ''}">${arr(sec.d.items).map(f => `<details class="reveal"><summary>${esc(f.q)}</summary><p>${nl2br(f.a)}</p></details>`).join('')}</div></div>`;
    }
  };

  return T;
})();

function defaultHome() {
  const mk = (type, tpl, bg, extra = {}) => ({ id: type, type, tpl, bg, vis: true, d: { ...SECTION_TYPES[type].def(), ...extra } });
  return [
    mk('hero', 'map', 'dark'), mk('marquee', 'specs', 'light'), mk('featured', 'grid', 'light'), mk('orders', 'slider', 'tint'),
    mk('steps', 'tabs', 'pattern'), mk('specs', 'grid', 'light'), mk('regions', 'tiles', 'dark'), mk('join', 'cards', 'dark'),
    mk('cards', 'c3', 'light'), mk('faq', 'list', 'light')
  ];
}
const homeSections = () => { const l = arr(Store.get('content/home/list')); return l.length ? l : defaultHome(); };

function renderSection(sec) {
  const T = SECTION_TYPES[sec.type];
  if (!T) return '';
  const sec2 = { ...sec, d: { ...T.def(), ...(sec.d || {}) } };
  const inner = T.render(sec2);
  if (!inner) return '';
  if (T.fixedBg) return `<div class="hsec" data-sec="${esc(sec.id)}">${inner}</div>`;
  return `<section class="sec hsec ${esc(sec.bg || 'light')} t-${esc(sec.type)}" data-sec="${esc(sec.id)}">${inner}</section>`;
}
function mountSections(root) {
  homeSections().filter(s => s.vis !== false).forEach(sec => {
    const el = root.querySelector(`[data-sec="${CSS.escape(sec.id)}"]`), T = SECTION_TYPES[sec.type];
    if (el && T?.mount) T.mount(el, sec);
  });
}
