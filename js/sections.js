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

  /* «من طلبات هذا الشهر»: لا يُحذف شيء؛ تُجمَّع البطاقات بالشهر (بتوقيت الرياض). يُعرض تلقائياً شهر الإحصائية الحالي (يتبدّل يوم 5 من الشهر التالي)
     إن كان فيه بطاقات، وإلا يستمر عرض أحدث شهر فيه بطاقات؛ ويمكن للزائر الرجوع لأي شهر سابق من الزر تحت العنوان. */
  const ordYm = ts => { const d = new Date((ts || 0) + 3 * 36e5); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
  const ordYmName = ym => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 15)).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const ordState = () => {
    const all = Store.list('showcase'), count = {}; all.forEach(x => { const m = ordYm(x.ts); count[m] = (count[m] || 0) + 1; });
    const months = Object.keys(count).sort().reverse();
    return { all, count, months, active: forced => (forced && count[forced] ? forced : count[MonthStats.cur().key] ? MonthStats.cur().key : months[0]) };
  };
  const ordList = (d, ym) => Store.list('showcase').filter(x => ordYm(x.ts) === ym).sort((a, b) => b.ts - a.ts).slice(0, Math.max(1, Number(d.count) || 60));
  const ordTile = x => `<article class="ord" style="--pat:${Pattern.css('#EEF3E5', 0.12)}">
        <span class="ord-ic"><i class="fa-solid ${specOf(x.spec)?.icon || 'fa-chalkboard-user'}"></i></span>
        <b class="${String(x.title).length > 48 ? 'long' : ''}">${esc(x.title)}</b>
        <small>${esc(x.org || 'جهة تدريبية')}</small>
        ${x.trainerName ? `<span class="ord-tr"><i class="fa-solid fa-user-tie"></i>${esc(x.trainerName)}</span>` : ''}
        <span class="ord-meta">${(x.city || x.region) ? `<span><i class="fa-solid ${x.city === 'عن بعد' ? 'fa-laptop' : 'fa-location-dot'}"></i>${esc(x.city || regionName(x.region))}</span>` : ''}<span><i class="fa-regular fa-calendar"></i>${esc(monthName(x.ts))}</span></span>
        ${Number(x.n) > 0 ? `<span class="ord-n"><i class="fa-solid fa-layer-group"></i>${Number(x.n).toLocaleString('en-US')} ${Number(x.n) === 1 ? 'فرصة' : 'فرص'} في هذا المجال</span>` : ''}
      </article>`;
  const ordBody = (sec, d, list) => {
    if (sec.tpl === 'grid') return `<div class="wrap"><div class="ord-grid">${list.map(ordTile).join('')}</div></div>`;
    let loop = [...list]; while (loop.length < 8) loop = loop.concat(list);
    return `<div class="ord-slider" aria-label="${esc(d.title)}"><div class="ord-track" style="--dur:${loop.length * 4}s">${[...loop, ...loop].map(ordTile).join('')}</div></div>`;
  };
  // شريط «من طلبات هذا الشهر»: يتحرك تلقائياً، ويُسحب بالإصبع/الفأرة يميناً ويساراً ويكمل حركته بعد رفع الإصبع بقوة السحب ثم يعود لسرعته
  function ordSlide(root) {
    const sl = root.querySelector('.ord-slider'), tr = sl && sl.querySelector('.ord-track');
    if (!sl || !tr || sl.__on || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    sl.__on = true; tr.style.animation = 'none'; sl.classList.add('drag');
    let x = 0, inert = 0, down = false, lx = 0, lt = 0, vel = 0, hover = false, prev = performance.now();
    const half = () => tr.scrollWidth / 2, speed = () => { const dur = parseFloat(getComputedStyle(tr).getPropertyValue('--dur')) || 40; return half() / dur; };
    const wrap = () => { const h = half(); if (h > 0) x = ((x % h) + h) % h; };
    const frame = now => {
      if (!sl.isConnected) return;
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      if (!down && !document.hidden) { x += ((hover ? 0 : speed()) + inert) * dt; inert *= Math.pow(0.04, dt); if (Math.abs(inert) < 1) inert = 0; }
      wrap(); tr.style.transform = `translateX(${x.toFixed(1)}px)`; requestAnimationFrame(frame);
    };
    sl.addEventListener('pointerdown', e => { down = true; lx = e.clientX; lt = performance.now(); vel = 0; inert = 0; try { sl.setPointerCapture(e.pointerId); } catch { /* ignore */ } });
    sl.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') hover = true;
      if (!down) return; const t = performance.now(), dx = e.clientX - lx, dt = Math.max(1, t - lt) / 1000;
      x += dx; vel = vel * 0.6 + (dx / dt) * 0.4; lx = e.clientX; lt = t;
    });
    const up = () => { if (!down) return; down = false; inert = Math.max(-3500, Math.min(3500, vel)); if (performance.now() - lt > 120) inert = 0; };
    sl.addEventListener('pointerup', up); sl.addEventListener('pointercancel', up);
    sl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = false; });
    requestAnimationFrame(frame);
  }
  T.orders = {
    name: 'من طلبات هذا الشهر', icon: 'fa-table-cells-large',
    tpls: [['slider', 'مربعات متحركة'], ['grid', 'مربعات ثابتة']],
    schema: [...HEAD, { k: 'count', label: 'أقصى عدد للبطاقات في الشهر', t: 'number' }],
    def: () => ({ eyebrow: 'نبض المنصة', title: 'من طلبات هذا الشهر', sub: 'برامج طلبتها جهات تدريبية من مدربي المنصة مؤخراً.', count: 60 }),
    render(sec) {
      const d = sec.d, st = ordState(); if (!st.months.length) return '';
      const act = st.active(T.orders.view.ym), list = ordList(d, act);
      const chips = st.months.length > 1 ? `<details class="ord-arch"><summary><i class="fa-solid fa-clock-rotate-left"></i> طلبات الأشهر السابقة</summary><div class="ord-chips">${st.months.map(m => `<button type="button" data-ym="${m}" class="${m === act ? 'on' : ''}">${esc(ordYmName(m))} <b class="num">${st.count[m]}</b></button>`).join('')}</div></details>` : '';
      return `<div class="wrap">${head(d)}<p class="ord-ym">طلبات شهر <b>${esc(ordYmName(act))}</b></p>${chips}</div><div class="ord-body">${ordBody(sec, d, list)}</div>`;
    },
    view: { ym: null },
    mount(el, sec) {
      const d = { ...T.orders.def(), ...(sec.d || {}) };
      ordSlide(el);
      el.querySelectorAll('.ord-chips [data-ym]').forEach(b => b.onclick = () => {
        const st = ordState(), ym = b.dataset.ym; T.orders.view.ym = ym === st.active(null) ? null : ym;
        const act = st.active(T.orders.view.ym);
        el.querySelector('.ord-body').innerHTML = ordBody(sec, d, ordList(d, act)); ordSlide(el);
        el.querySelector('.ord-ym').innerHTML = `طلبات شهر <b>${esc(ordYmName(act))}</b>`;
        el.querySelectorAll('.ord-chips [data-ym]').forEach(x => x.classList.toggle('on', x.dataset.ym === act));
        const dt = el.querySelector('.ord-arch'); dt && dt.removeAttribute('open');
      });
    }
  };

  T.join = {
    name: 'انضم كمدرب (الرسوم والمزايا)', icon: 'fa-user-plus',
    tpls: [['cards', 'مع نماذج البطاقات'], ['compact', 'شريط مختصر']],
    schema: [],   // العنوان والمزايا من «المحتوى العام ← المزايا والعوائد» (مصدر واحد لكل القنوات)
    def: () => ({}),
    render(sec) {
      const c = Data.content(), P = Pitch.get(), d = { eyebrow: P.eyebrow, title: P.title, text: P.text };
      const price = `<div class="price"><span class="ribbon">${esc(c.join.period)}</span><div class="amt num">${esc(c.join.fee)}<small>ريال</small></div><div class="price-note">${Pitch.renewTag()}</div><div class="price-per">${esc(Pitch.perDay(c.join.fee))}</div>
        <ul>${P.items.map(b => `<li><i class="fa-solid fa-circle-check"></i>${esc(b.s || b.t)}${Pitch.tag(b.x)}</li>`).join('')}</ul>
        <div class="row"><a class="btn gold lg" href="#/join">سجّل كمدرب الآن <i class="fa-solid fa-arrow-left"></i></a><a class="btn glass" href="#/status">متابعة طلب</a></div></div>`;
      if (sec.tpl === 'compact') return `<div class="wrap"><div class="cta-band reveal"><div><span class="eyebrow">${esc(d.eyebrow)}</span><h2>${esc(d.title)}</h2><p>${esc(d.text)}</p></div><div class="row"><span class="amt-inline"><b class="num">${esc(c.join.fee)}</b> ريال ${esc(c.join.period)} ${Pitch.renewTag()}</span><a class="btn gold lg" href="#/join">سجّل الآن</a></div></div></div>`;
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

  T.visits = {
    name: 'عدّاد الزيارات', icon: 'fa-hand-peace',
    tpls: [['band', 'شريط ترحيب']],
    schema: [{ k: 'text', label: 'نص الترحيب (قبل الرقم)' }, { k: 'textEnd', label: 'نص بعد الرقم' }, { k: 'textTotal', label: 'نص الإجمالي (للمشرفين والمدربين المسجّلين)' }, { k: 'base', label: 'رقم إضافي يُضاف للعدّاد (اختياري؛ الأساس هو إجمالي الزيارات التاريخية من المؤشرات)', t: 'number' }],
    def: () => ({ text: 'نرحب بك، هذه الزيارة رقم', textEnd: 'للمنصة', textTotal: 'إجمالي زيارات المنصة', base: 0 }),
    render(sec) {
      const d = sec.d;
      return `<div class="wrap"><div class="visit reveal"><span class="v-ic"><i class="fa-solid fa-hand-peace"></i></span><div class="v-t"><span class="v-l">${esc(d.text)}</span><b class="num v-n" dir="ltr">···</b><span class="v-e">${esc(d.textEnd)}</span></div></div></div>`;
    },
    mount(el, sec) {
      const d = { ...T.visits.def(), ...(sec?.d || {}) }, n = el.querySelector('.v-n'); if (!n) return;
      Analytics.visit().then(({ n: v, mine }) => {
        if (!el.isConnected) return;
        const P = Store.get('stats/platform') || {}, target = (Number(P.sessionsAll) || 0) + Math.max(0, v - (Number(P.visitsAtSync) || 0)) + (Number(d.base) || 0), l = el.querySelector('.v-l'), e = el.querySelector('.v-e');
        if (!mine) { l.textContent = d.textTotal; e.textContent = ''; }
        const t0 = performance.now(), dur = 1100;
        const step = t => { const k = Math.min(1, (t - t0) / dur); n.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US'); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }
  };

  T.monthstats = {
    name: 'إحصائيات الشهر', icon: 'fa-chart-column',
    tpls: [['band', 'بطاقتان']],
    schema: [{ k: 'title', label: 'عنوان الإحصائية' }, { k: 'lReq', label: 'نص طلبات التعاون' }, { k: 'lJobs', label: 'نص الوظائف' }, { k: 'tReq', label: 'تفاصيل (i) فرص التعاون' }, { k: 'tJobs', label: 'تفاصيل (i) الوظائف' }],
    def: () => ({ title: 'إحصائيات الشهر', lReq: 'فرص التعاون في التدريب المنشورة على الموقع', lJobs: 'وظائف التدريب المنشورة على الموقع', tReq: 'تشمل طلبات الجهات الواردة إلى الموقع مباشرة، والفرص التدريبية التي تنشرها الإدارة عبر مصادرها', tJobs: 'تشمل إعلانات توظيف المدربين التي يقوم الموقع بجلبها من عدة مصادر عبر الإنترنت بشكل أسبوعي' }),
    render(sec) {
      const d = { ...T.monthstats.def(), ...(sec.d || {}) }, c = MonthStats.cur(), v = Store.get(`stats/month/${c.key}`);
      if (!v) return '';
      const f = x => (Number(x) || 0).toLocaleString('en-US');
      return `<div class="wrap"><div class="mstat reveal"><div class="ms-h"><i class="fa-solid fa-chart-column"></i><b>${esc(d.title)} (${esc(c.name)})</b></div>
        <div class="ms-g"><div class="ms-c"><button type="button" class="ms-i" aria-label="تفاصيل" aria-expanded="false" title="تفاصيل">i</button><b class="num">${f((Number(v.requests) || 0) + (Number(v.ads) || 0))}</b><span>${esc(d.lReq)}</span><small class="ms-tip" hidden>${esc(d.tReq)}</small></div><div class="ms-c"><button type="button" class="ms-i" aria-label="تفاصيل" aria-expanded="false" title="تفاصيل">i</button><b class="num">${f(v.jobs)}</b><span>${esc(d.lJobs)}</span><small class="ms-tip" hidden>${esc(d.tJobs)}</small></div></div></div></div>`;
    },
    mount(el) {
      el.querySelectorAll('.ms-i').forEach(b => b.onclick = () => { const t = b.parentElement.querySelector('.ms-tip'); if (!t) return; t.hidden = !t.hidden; b.setAttribute('aria-expanded', String(!t.hidden)); });
    }
  };

  /* «المثبّتة»: بطاقة مدرب عرضية تبقى 24 ساعة (بتوقيت الرياض) ثم تُستبدل ببطاقة مدرب آخر، ولا يتكرر مدرب حتى تكتمل دورة كل المدربين.
     الترتيب في كل دورة عشوائي ثابت (بذرة = رقم الدورة) فيراه كل الزوار نفسه دون حاجة لتخزين. */
  const pinPick = ids => {
    const n = ids.length, day = Math.floor((Date.now() + 3 * 3600e3) / 864e5);
    if (!n) return null;
    const order = c => { const a = [...ids]; let s = (c * 2654435761 + 1013904223) >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const cycle = Math.floor(day / n), cur = order(cycle);
    if (n > 1 && cycle > 0) { const prevLast = order(cycle - 1)[n - 1]; if (cur[0] === prevLast) [cur[0], cur[1]] = [cur[1], cur[0]]; }   // لا يتكرر مدرب عند حدود الدورات
    return cur[day % n];
  };
  const pinList = d => { const ls = live().filter(t => t.id); const pool = d.only === 'featured' ? ls.filter(t => t.featured) : ls; return (pool.length ? pool : ls).sort((a, b) => String(a.id).localeCompare(String(b.id))); };
  T.pinned = {
    name: 'المثبّتة (مدرب كل 24 ساعة)', icon: 'fa-thumbtack',
    tpls: [['wide', 'بطاقة عرضية']],
    schema: [...HEAD, { k: 'only', label: 'من يظهر', t: 'select', opts: [['all', 'كل المدربين المنشورين'], ['featured', 'المميزون فقط (وإن لم يوجد فالجميع)']] }, { k: 'btn', label: 'نص زر الصفحة', t: 'text' }],
    def: () => ({ eyebrow: 'المثبّتة', title: '', sub: 'نُعرّف بمدرب جديد كل 24 ساعة.', only: 'all', btn: 'عرض الصفحة التعريفية' }),
    render(sec) {
      const d = sec.d, ls = pinList(d), id = pinPick(ls.map(t => t.id)), t = ls.find(x => x.id === id);
      if (!t) return '';
      const tp = Card.kit.template(), x = tp.text, sp = Data.cardSpecs(t).slice(0, tp.maxSpecs), stats = [[t.years, x.years], [t.hours, x.hours], [t.programs, x.programs]].filter(s => Number(s[0]));
      const th = Card.kit.themed(t, tp), url = `#/t/${esc(encodeURIComponent(t.slug || t.id))}`;
      return `<div class="wrap"><div class="sec-h reveal"><span class="eyebrow pin-title"><i class="fa-solid fa-thumbtack"></i>${esc(d.eyebrow || 'المثبّتة')}</span>${d.title ? `<h2>${esc(d.title)}</h2>` : ''}${d.sub ? `<p>${esc(d.sub)}</p>` : ''}</div>
        <div class="pin-wrap reveal"><div class="pin-tag"><span class="pin-left">تتجدد بعد <b class="num" data-pin-left>--:--:--</b></span></div>
        <a class="pin-card ${Card.themeCls(t, tp)}" href="${url}" style="${Card.themeVars(t, tp)}" aria-label="${esc(t.name)}">
          <i class="pn-frame"></i>
          ${tp.show.logo ? logoImg(th.light ? 'green' : 'cream', 'pn-logo') : ''}
          <div class="pn-main"><div class="pn-ring">${Card.avatar(t, 'pn-photo')}${tp.show.badge ? '<span class="tc-verified" title="مدرب موثّق"><i class="fa-solid fa-certificate"></i><i class="fa-solid fa-check"></i></span>' : ''}</div>
            <h3 class="pn-name">${esc(t.name || '')}</h3>${regionsOf(t).length ? `<div class="pn-loc"><i class="fa-solid fa-location-dot"></i>${esc(regionsLabel(t, true, tp.maxRegions))}</div>` : ''}</div>
          <div class="pn-info">${t.title ? `<p class="pn-title">${esc(t.title)}</p>` : ''}
            ${stats.length ? `<div class="pn-stats">${stats.map(([v, l]) => `<div><b class="num">${fmtNum(v)}+</b><span>${l}</span></div>`).join('')}</div>` : ''}
            ${sp.length ? `<div class="pn-chips">${sp.map(s => `<span>${esc(specName(s))}</span>`).join('')}</div>` : ''}</div>
          <footer class="pn-foot"><span class="pn-qr" data-pin-qr="${esc(profileUrl(t))}"></span><div class="pn-ft"><span>${esc(x.footLead)}</span><b>${esc(x.brand)} <i>|</i> <em dir="ltr">${esc(x.site)}</em></b></div><span class="pn-go">${esc(d.btn || 'عرض الصفحة التعريفية')} <i class="fa-solid fa-arrow-left"></i></span></footer>
        </a></div></div>`;
    },
    mount(el) {
      const q = el.querySelector('[data-pin-qr]');
      if (q) Card.kit.ensureQR().then(ok => { if (!ok || !el.isConnected) return; try { const qr = window.qrcode(0, 'M'); qr.addData(q.dataset.pinQr); qr.make(); q.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); } catch { /* بلا رمز */ } });
      const lb = el.querySelector('[data-pin-left]'); if (!lb) return;
      const tick = () => { if (!el.isConnected) return clearInterval(iv); const left = 864e5 - ((Date.now() + 3 * 3600e3) % 864e5), z = n => String(n).padStart(2, '0'); lb.textContent = `${z(Math.floor(left / 36e5))}:${z(Math.floor(left / 6e4) % 60)}:${z(Math.floor(left / 1e3) % 60)}`; if (left < 1500) setTimeout(() => App.render(), 1600); };
      const iv = setInterval(tick, 1000); tick();
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
const homeSections = () => {
  const l = arr(Store.get('content/home/list')), list = l.length ? l : defaultHome();
  // عدّاد الزيارات يُضاف تحت الواجهة الرئيسية تلقائياً إن لم يكن في القائمة (تخفيه الإدارة من تبويب الصفحة الرئيسية)
  if (!list.some(s => s.type === 'visits')) { const i = list.findIndex(s => s.type === 'hero'); list.splice(i + 1, 0, { id: 'visits', type: 'visits', tpl: 'band', bg: 'tint', vis: true, d: SECTION_TYPES.visits.def() }); }
  // إحصائيات الشهر تحت عدّاد الزيارات
  if (!list.some(s => s.type === 'monthstats')) { const i = list.findIndex(s => s.type === 'visits'); list.splice(i < 0 ? Math.min(2, list.length) : i + 1, 0, { id: 'monthstats', type: 'monthstats', tpl: 'band', bg: 'light', vis: true, d: SECTION_TYPES.monthstats.def() }); }
  // «المثبّتة» تحت عدّاد الزيارات
  if (!list.some(s => s.type === 'pinned')) { const i = list.findIndex(s => s.type === 'monthstats' || s.type === 'visits'); list.splice(i < 0 ? Math.min(2, list.length) : i + 1, 0, { id: 'pinned', type: 'pinned', tpl: 'wide', bg: 'light', vis: true, d: SECTION_TYPES.pinned.def() }); }
  return list;
};

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
