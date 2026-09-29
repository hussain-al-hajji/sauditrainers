/* الصفحات العامة: الرئيسية، دليل المدربين، صفحة المدرب، اطلب مدرباً، القاعات، عن المنصة، الدخول */

const Pages = {};

/* ===================== خريطة المملكة النقطية ===================== */
const KSAMap = (() => {
  const LON0 = 34.3, LAT0 = 32.6, K = 36;
  const W = Math.round((56.2 - LON0) * K), H = Math.round((LAT0 - 15.8) * K);
  const proj = (lon, lat) => [(lon - LON0) * K, (LAT0 - lat) * K];
  function inside(x, y, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function svg(counts) {
    const outline = KSA_OUTLINE.map(([lo, la]) => proj(lo, la));
    const dots = [];
    const nodes = REGIONS.map(r => ({ ...r, xy: proj(r.lon, r.lat), n: counts[r.k] || 0 }));
    for (let la = 32.3; la > 16; la -= 0.46) for (let lo = 34.6; lo < 56; lo += 0.46) {
      const [x, y] = proj(lo, la);
      if (!inside(x, y, outline)) continue;
      const near = nodes.some(n => n.n && Math.hypot(n.xy[0] - x, n.xy[1] - y) < 55);
      dots.push(`<circle class="map-dot ${near ? 'hot' : ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${near ? 2.6 : 2}"/>`);
    }
    const hub = nodes.find(n => n.k === 'riyadh').xy;
    const arcs = nodes.filter(n => n.k !== 'riyadh').map((n, i) => {
      const [x, y] = n.xy, mx = (x + hub[0]) / 2, my = (y + hub[1]) / 2;
      const dx = x - hub[0], dy = y - hub[1], len = Math.hypot(dx, dy) || 1;
      const cx = mx - dy / len * len * 0.22, cy = my + dx / len * len * 0.22;
      return `<path class="map-arc" style="animation-delay:${-i * 0.37}s" d="M${hub[0].toFixed(1)} ${hub[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>`;
    }).join('');
    const max = Math.max(1, ...nodes.map(n => n.n));
    const nodeEls = nodes.map((n, i) => {
      const r = 6 + (n.n / max) * 8;
      const [x, y] = n.xy;
      return `<g class="map-node" data-region="${n.k}" tabindex="0" role="link" aria-label="${n.name}: ${n.n} مدرب">
        <circle class="pulse" cx="${x}" cy="${y}" r="${r}" style="animation-delay:${-i * 0.2}s"/>
        <circle class="core" cx="${x}" cy="${y}" r="${r}"/>
        ${n.n ? `<text class="n" x="${x}" y="${y + 4}" text-anchor="middle">${n.n}</text>` : ''}
        <text x="${x}" y="${y - r - 8}" text-anchor="middle">${n.name}</text>
      </g>`;
    }).join('');
    return `<svg viewBox="-20 -30 ${W + 40} ${H + 50}" role="img" aria-label="خريطة المدربين في مناطق المملكة">
      <defs><linearGradient id="arcG" x1="0" x2="1"><stop offset="0" stop-color="#E9CF8C" stop-opacity=".1"/><stop offset=".5" stop-color="#E9CF8C"/><stop offset="1" stop-color="#7FD1A8" stop-opacity=".6"/></linearGradient></defs>
      <path class="map-outline" d="M${outline.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L')}Z"/>
      ${dots.join('')}${arcs}${nodeEls}
    </svg>`;
  }
  function mount(box) {
    const tip = box.querySelector('.map-tip');
    box.querySelectorAll('.map-node').forEach(g => {
      const r = regionOf(g.dataset.region);
      const show = () => {
        const c = g.querySelector('.core').getBoundingClientRect(), b = box.getBoundingClientRect();
        const n = Data.regionCounts()[r.k] || 0;
        tip.innerHTML = `<b>${r.name}</b>${n ? `<span class="num">${n}</span> مدرب ومدربة` : 'كن أول مدرب في المنطقة'}`;
        tip.style.left = `${c.left - b.left + c.width / 2}px`;
        tip.style.top = `${c.top - b.top}px`;
        tip.style.transform = 'translate(-50%, -115%)';
        tip.classList.add('on');
      };
      g.addEventListener('mouseenter', show); g.addEventListener('focus', show);
      g.addEventListener('mouseleave', () => tip.classList.remove('on')); g.addEventListener('blur', () => tip.classList.remove('on'));
      const go = () => { location.hash = `#/trainers?region=${r.k}`; };
      g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    });
  }
  return { svg, mount };
})();

/* ===================== البحث الفوري ===================== */
function mountSuggest(input, box, { onPick } = {}) {
  let idx = -1;
  const render = () => {
    const q = input.value.trim();
    if (q.length < 2) { box.classList.remove('open'); return; }
    const ts = Data.search(Data.live(), { q }).slice(0, 5);
    const nq = normAr(q);
    const sp = SPECIALTIES.filter(s => normAr(s.name).includes(nq)).slice(0, 3);
    const rg = REGIONS.filter(r => normAr(r.name).includes(nq)).slice(0, 2);
    if (!ts.length && !sp.length && !rg.length) { box.innerHTML = `<div class="s-h">لا نتائج مطابقة — جرّب «اطلب مدرباً» ونبحث لك</div>`; box.classList.add('open'); return; }
    box.innerHTML = `${ts.length ? '<div class="s-h">مدربون</div>' : ''}${ts.map(t => `<a href="#/t/${esc(encodeURIComponent(t.slug || t.id))}">${Card.avatar(t, 's-av')}<span><b>${esc(t.name)}</b><small>${esc(t.title || '')} · ${esc(regionName(t.region))}</small></span></a>`).join('')}
      ${sp.length ? '<div class="s-h">تخصصات</div>' : ''}${sp.map(s => `<a href="#/trainers?spec=${s.k}"><span class="s-av"><i class="fa-solid ${s.icon}"></i></span><span><b>${s.name}</b><small>${Data.specCounts()[s.k] || 0} مدرب</small></span></a>`).join('')}
      ${rg.length ? '<div class="s-h">مناطق</div>' : ''}${rg.map(r => `<a href="#/trainers?region=${r.k}"><span class="s-av"><i class="fa-solid fa-location-dot"></i></span><span><b>منطقة ${r.name}</b><small>${Data.regionCounts()[r.k] || 0} مدرب</small></span></a>`).join('')}`;
    box.classList.add('open'); idx = -1;
  };
  input.addEventListener('input', debounce(render, 120));
  input.addEventListener('focus', render);
  input.addEventListener('keydown', e => {
    const items = $$('a', box);
    if (!items.length || !box.classList.contains('open')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle('act', i === idx));
    } else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); location.hash = items[idx].getAttribute('href'); }
    else if (e.key === 'Escape') box.classList.remove('open');
  });
  document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== input) box.classList.remove('open'); });
}

/* ===================== الرئيسية ===================== */
Pages.home = {
  dark: true,
  render() {
    const c = Data.content();
    const live = Data.live();
    const counts = Data.regionCounts(), sc = Data.specCounts();
    const featured = [...live.filter(t => t.featured), ...live.filter(t => !t.featured)].slice(0, 8);
    const words = splitList(c.hero.words);
    const regionsWith = Object.keys(counts).length;
    const specsWith = Object.keys(sc).length;
    const samples = featured.length >= 3 ? featured.slice(0, 3) : [
      { name: 'اسمك هنا', title: 'مدرب معتمد في القيادة والتطوير', region: 'riyadh', theme: 'night', specs: ['leadership'], years: 8, hours: 1200, code: 'ST0000' },
      { name: 'بطاقتك الاحترافية', title: 'مدربة في التحول الرقمي', region: 'eastern', theme: 'rose', specs: ['digital'], years: 6, hours: 900, code: 'ST0000' },
      { name: 'مدرّب سعودي', title: 'خبرة تدريبية تستحق الظهور', region: 'makkah', theme: 'emerald', specs: ['hr-dev', 'soft'], years: 10, hours: 2400, programs: 60, code: 'ST0000', modes: ['onsite', 'online'] }
    ];
    return `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <span class="kicker reveal"><b>جديد</b>${esc(c.hero.kicker)}</span>
          <h1 class="reveal" style="--d:80ms">${esc(c.hero.title)}<span class="acc">${esc(c.hero.titleAccent)}</span></h1>
          <p class="sub reveal" style="--d:160ms">مدربون سعوديون ممارسون في <span class="rotator" id="rot">${words.map((w, i) => `<span class="${i ? '' : 'on'}">${esc(w)}</span>`).join('')}</span><br>${esc(c.hero.sub)}</p>
          <div class="hsearch reveal" style="--d:240ms">
            <form id="hs" autocomplete="off">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="search" id="hq" placeholder="ابحث باسم مدرب، موضوع، أو تخصص..." aria-label="بحث">
              <select id="hr" aria-label="المنطقة"><option value="">كل المناطق</option>${REGIONS.map(r => opt(r.k, r.name)).join('')}</select>
              <button class="btn gold">بحث</button>
            </form>
            <div class="suggest" id="hsug"></div>
          </div>
          <div class="quick reveal" style="--d:300ms">الأكثر طلباً: ${['leadership', 'ai-data', 'entrepreneur', 'marketing', 'hr-dev'].map(k => `<a href="#/trainers?spec=${k}">${specName(k)}</a>`).join('')}</div>
          <div class="hstats reveal" style="--d:380ms">
            <div><b data-count="${live.length}">0</b><span>مدرب ومدربة</span></div>
            <div><b data-count="${Math.max(regionsWith, 0)}">0</b><span>منطقة إدارية</span></div>
            <div><b data-count="${specsWith}">0</b><span>تخصصاً تدريبياً</span></div>
          </div>
        </div>
        <div class="mapbox reveal" style="--d:200ms" id="map">
          ${KSAMap.svg(counts)}
          <div class="map-tip"></div>
          <div class="floaty f1"><i class="fa-solid fa-bolt"></i><span><b>ترشيح فوري</b>مطابقة ذكية لاحتياجك</span></div>
          <div class="floaty f2"><i class="fa-solid fa-id-card"></i><span><b>بطاقات موثّقة</b>قابلة للمشاركة</span></div>
          <div class="map-legend"><i></i>اضغط على منطقة لعرض مدربيها</div>
        </div>
      </div>
    </section>

    <div class="marquee" aria-label="التخصصات"><div class="marquee-track">${[...SPECIALTIES, ...SPECIALTIES].map(s => `<a href="#/trainers?spec=${s.k}"><i class="fa-solid ${s.icon}"></i>${s.name}</a>`).join('')}</div></div>

    ${featured.length ? `<section class="sec">
      <div class="wrap">
        <div class="sec-h reveal"><span class="eyebrow">نخبة المدربين</span><h2>كفاءات سعودية جاهزة لبرنامجك القادم</h2><p>بطاقات تعريفية موثّقة تختصر عليك السيرة الذاتية: التخصص، والخبرة، والمنطقة، وطريقة التواصل.</p></div>
        <div class="tgrid">${featured.map((t, i) => Card.mini(t, i)).join('')}</div>
        <div class="center" style="margin-top:30px"><a class="btn primary lg" href="#/trainers">تصفّح جميع المدربين <i class="fa-solid fa-arrow-left"></i></a></div>
      </div>
    </section>` : ''}

    <section class="sec pattern">
      <div class="wrap">
        <div class="sec-h reveal"><span class="eyebrow">كيف تعمل المنصة</span><h2>طريقان يلتقيان عند التدريب المتميز</h2></div>
        <div class="tracks reveal" id="tracks"><button class="on" data-t="org"><i class="fa-solid fa-building"></i> للجهات التدريبية</button><button data-t="tr"><i class="fa-solid fa-person-chalkboard"></i> للمدربين</button></div>
        <div class="steps" data-track="org">
          <div class="step reveal"><div class="ic"><i class="fa-solid fa-magnifying-glass-location"></i></div><h3>ابحث أو اطلب</h3><p>ابحث بالتخصص والمنطقة، أو صِف احتياجك في «اطلب مدرباً».</p></div>
          <div class="step reveal" style="--d:100ms"><div class="ic"><i class="fa-solid fa-wand-magic-sparkles"></i></div><h3>ترشيح ذكي</h3><p>يقترح النظام أنسب المدربين فوراً، ويتابع فريقنا طلبك للترشيح الأدق.</p></div>
          <div class="step reveal" style="--d:200ms"><div class="ic"><i class="fa-solid fa-handshake"></i></div><h3>تواصل مباشر</h3><p>تواصل مع المدرب مباشرة من بطاقته دون وسيط ودون رسوم.</p></div>
        </div>
        <div class="steps hidden" data-track="tr">
          <div class="step"><div class="ic"><i class="fa-solid fa-file-signature"></i></div><h3>سجّل بياناتك</h3><p>نموذج تسجيل ذكي بخطوات، وترى بطاقتك تتشكّل أمامك لحظة بلحظة.</p></div>
          <div class="step"><div class="ic"><i class="fa-solid fa-user-check"></i></div><h3>المراجعة والقبول</h3><p>نراجع طلبك ونتحقق من المتطلبات، وتتابع حالته برقم الطلب.</p></div>
          <div class="step"><div class="ic"><i class="fa-solid fa-rocket"></i></div><h3>انطلق وتألّق</h3><p>تُنشر بطاقتك، وتصلك بيانات الدخول لتعديلها ومشاركتها ومتابعة المهتمين.</p></div>
        </div>
      </div>
    </section>

    <section class="sec" style="padding-top:20px">
      <div class="wrap">
        <div class="sec-h reveal"><span class="eyebrow">ابحث بالتخصص</span><h2>كل مجال تدريبي… له أهله</h2></div>
        <div class="specs">${SPECIALTIES.map((s, i) => `<a class="spec reveal" style="--d:${(i % 8) * 40}ms" href="#/trainers?spec=${s.k}"><span class="ic"><i class="fa-solid ${s.icon}"></i></span><span><b>${s.name}</b><small><span class="num">${sc[s.k] || 0}</span> مدرب</small></span></a>`).join('')}</div>
      </div>
    </section>

    <section class="sec dark">
      <div class="wrap">
        <div class="sec-h reveal"><span class="eyebrow">ابحث بالمنطقة</span><h2>من تبوك إلى جازان… ومن جدة إلى الأحساء</h2><p>مدربون في مناطق المملكة الثلاث عشرة، حضورياً أو عن بُعد.</p></div>
        <div class="regions">${REGIONS.map((r, i) => `<a class="region reveal" style="--d:${i * 40}ms" href="#/trainers?region=${r.k}"><b>${r.name}</b><small>${r.city}</small><span class="cnt num">${counts[r.k] || 0}</span></a>`).join('')}</div>
      </div>
    </section>

    <section class="sec dark" style="padding-top:30px">
      <div class="wrap join-grid">
        <div class="reveal">
          <span class="eyebrow">للمدربين السعوديين</span>
          <h2 style="font-size:clamp(1.8rem,3.6vw,2.7rem);font-weight:900">خبرتك تستحق بطاقة<br>تليق بها</h2>
          <p style="color:rgba(255,255,255,.7)">انضم إلى المنصة واحصل على بطاقة تعريفية احترافية، وصفحة خاصة قابلة للمشاركة، وفريق تسويق يرشّحك للجهات التدريبية.</p>
          <div class="price">
            <span class="ribbon">${esc(c.join.period)}</span>
            <div class="amt num">${esc(c.join.fee)}<small>ريال</small></div>
            <div style="color:rgba(255,255,255,.6);font-family:var(--f-ui)">${esc(c.join.feeNote)}</div>
            <ul>${lines(c.join.benefits).slice(0, 5).map(b => `<li><i class="fa-solid fa-circle-check"></i>${esc(b)}</li>`).join('')}</ul>
            <div class="row"><a class="btn gold lg" href="#/join">سجّل كمدرب الآن <i class="fa-solid fa-arrow-left"></i></a><a class="btn glass" href="#/status">متابعة طلب</a></div>
          </div>
        </div>
        <div class="join-cards reveal" style="--d:150ms">${samples.map(t => Card.full(t, { preview: true })).join('')}</div>
      </div>
    </section>

    <section class="sec">
      <div class="wrap cards3">
        <a class="icard reveal" href="#/request" style="color:inherit"><div class="ic"><i class="fa-solid fa-wand-magic-sparkles"></i></div><h3>اطلب مدرباً</h3><p>صِف برنامجك واحتياجك، وسنقترح عليك أنسب المدربين فوراً ونتابع طلبك.</p></a>
        <a class="icard reveal" style="--d:100ms;color:inherit" href="#/halls"><div class="ic"><i class="fa-solid fa-building-columns"></i></div><h3>قاعات التدريب</h3><p>${esc(c.halls.intro)}</p></a>
        <a class="icard reveal" style="--d:200ms;color:inherit" href="#/status"><div class="ic"><i class="fa-solid fa-list-check"></i></div><h3>متابعة طلب التسجيل</h3><p>اعرف حالة طلبك خطوة بخطوة برقم الطلب.</p></a>
      </div>
    </section>

    <section class="sec" style="padding-top:10px">
      <div class="wrap">
        <div class="sec-h reveal"><span class="eyebrow">أسئلة شائعة</span><h2>كل ما تحتاج معرفته</h2></div>
        <div class="faq">${c.faq.map(f => `<details class="reveal"><summary>${esc(f.q)}</summary><p>${nl2br(f.a)}</p></details>`).join('')}</div>
      </div>
    </section>`;
  },
  mount(root) {
    KSAMap.mount($('#map', root));
    mountSuggest($('#hq', root), $('#hsug', root));
    $('#hs', root).onsubmit = e => {
      e.preventDefault();
      const q = $('#hq', root).value.trim(), r = $('#hr', root).value;
      const p = new URLSearchParams(); if (q) p.set('q', q); if (r) p.set('region', r);
      location.hash = `#/trainers${p.toString() ? '?' + p : ''}`;
    };
    $$('#tracks button', root).forEach(b => b.onclick = () => {
      $$('#tracks button', root).forEach(x => x.classList.toggle('on', x === b));
      $$('[data-track]', root).forEach(s => s.classList.toggle('hidden', s.dataset.track !== b.dataset.t));
    });
    // تبديل الكلمات
    const rot = $('#rot', root); const spans = $$('span', rot); let i = 0;
    if (spans.length > 1) App.interval(() => {
      spans[i].classList.remove('on'); spans[i].classList.add('off');
      const prev = spans[i]; setTimeout(() => prev.classList.remove('off'), 500);
      i = (i + 1) % spans.length; spans[i].classList.add('on');
    }, 2400);
    countUp(root);
  }
};

/* ===================== دليل المدربين ===================== */
Pages.trainers = {
  render(params) {
    const f = { q: params.get('q') || '', region: params.get('region') || '', spec: params.get('spec') || '', mode: params.get('mode') || '', gender: params.get('gender') || '' };
    const title = f.region ? `مدربو منطقة ${regionName(f.region)}` : f.spec ? specName(f.spec) : 'دليل المدربين السعوديين';
    return `
    <section class="page-head"><div class="wrap">
      <div class="crumbs"><a href="#/">الرئيسية</a> / المدربون</div>
      <h1>${esc(title)}</h1>
      <p>ابحث بالكلمة المفتاحية أو صفِّ حسب المنطقة والتخصص وطريقة التقديم، ثم افتح البطاقة للتواصل المباشر.</p>
    </div></section>
    <div class="wrap">
      <form class="filters" id="flt" autocomplete="off">
        <label class="srch"><i class="fa-solid fa-magnifying-glass"></i><input type="search" name="q" value="${esc(f.q)}" placeholder="اسم، موضوع، شهادة..."></label>
        <select name="region"><option value="">كل المناطق</option>${REGIONS.map(r => opt(r.k, r.name, f.region)).join('')}</select>
        <select name="spec"><option value="">كل التخصصات</option>${SPECIALTIES.map(s => opt(s.k, s.name, f.spec)).join('')}</select>
        <select name="mode"><option value="">كل طرق التقديم</option>${DELIVERY.map(d => opt(d.k, d.name, f.mode)).join('')}</select>
        <select name="gender"><option value="">مدربون ومدربات</option>${opt('m', 'مدربون', f.gender)}${opt('f', 'مدربات', f.gender)}</select>
        <button type="button" class="btn ghost" id="clr" title="مسح الفلاتر"><i class="fa-solid fa-rotate-left"></i></button>
      </form>
      <div id="res"></div>
    </div>`;
  },
  mount(root, params) {
    const form = $('#flt', root);
    const draw = () => {
      const f = formData(form);
      const list = Data.search(Data.live(), f);
      const chips = Object.entries(f).filter(([, v]) => v).map(([k, v]) => `<button type="button" data-k="${k}">${esc(k === 'region' ? regionName(v) : k === 'spec' ? specName(v) : k === 'mode' ? DELIVERY.find(d => d.k === v)?.name : k === 'gender' ? (v === 'f' ? 'مدربات' : 'مدربون') : v)} ✕</button>`).join('');
      $('#res', root).innerHTML = `
        <div class="dir-bar"><div><b class="num">${list.length}</b> ${list.length === 1 ? 'مدرب' : 'مدرباً ومدربة'}</div><div class="active-f">${chips}</div></div>
        ${list.length ? `<div class="tgrid">${list.map((t, i) => Card.mini(t, i)).join('')}</div>`
          : `<div class="empty"><i class="fa-solid fa-magnifying-glass"></i><h3>لا يوجد مدربون مطابقون حالياً</h3><p>جرّب تخفيف الفلاتر، أو دعنا نبحث لك عن مدرب مناسب.</p><a class="btn primary" href="#/request">اطلب مدرباً</a></div>`}`;
      $$('.active-f button', root).forEach(b => b.onclick = () => { form.elements[b.dataset.k].value = ''; sync(); });
      reveal(root); tilt(root);
    };
    const sync = () => {
      const p = new URLSearchParams(); Object.entries(formData(form)).forEach(([k, v]) => v && p.set(k, v));
      history.replaceState(null, '', `#/trainers${p.toString() ? '?' + p : ''}`);
      draw();
    };
    form.addEventListener('input', debounce(sync, 180));
    form.addEventListener('submit', e => e.preventDefault());
    $('#clr', root).onclick = () => { form.reset(); $$('select, input', form).forEach(x => { x.value = ''; }); sync(); };
    draw();
    App.onData(draw);
  }
};

/* ===================== صفحة المدرب ===================== */
Pages.profile = {
  render(params, slug) {
    const t = Data.trainer(decodeURIComponent(slug || ''));
    const s = Auth.current();
    const own = s && ((s.kind === 'trainer' && s.id === t?.id) || s.kind === 'admin');
    if (!t || (!Data.isLive(t) && !own)) return `<section class="page-head"><div class="wrap"><h1>البطاقة غير متاحة</h1><p>قد تكون البطاقة غير منشورة حالياً أو الرابط غير صحيح.</p></div></section><div class="wrap empty"><a class="btn primary" href="#/trainers">تصفّح المدربين</a></div>`;
    const sp = Data.specs(t), tp = Data.topics(t), md = Data.modes(t);
    const similar = Data.live().filter(x => x.id !== t.id && Data.specs(x).some(k => sp.includes(k))).slice(0, 4);
    const wa = t.links?.whatsapp ? waLink(t.links.whatsapp, `السلام عليكم أ. ${t.name}، تواصلت معك عبر منصة مدرّبون سعوديّون بخصوص برنامج تدريبي.`) : '';
    return `
    <div style="position:relative"><div class="profile-hero-bg"></div>
    <div class="wrap profile">
      <aside class="profile-side">
        ${Card.full(t)}
        <div class="profile-actions">
          ${wa ? `<a class="btn primary wide" href="${esc(wa)}" target="_blank" rel="noopener" data-click="${esc(t.id)}"><i class="fa-brands fa-whatsapp"></i> تواصل عبر واتساب</a>` : ''}
          <button class="btn gold wide" id="ask"><i class="fa-solid fa-paper-plane"></i> اطلب هذا المدرب لبرنامجك</button>
          <button class="btn" id="shr"><i class="fa-solid fa-share-nodes"></i> مشاركة</button>
          <button class="btn" id="sv"><i class="fa-solid fa-download"></i> حفظ البطاقة</button>
        </div>
        ${!Data.isLive(t) ? `<div class="banner warn" style="margin-top:14px"><i class="fa-solid fa-eye-slash"></i>هذه البطاقة غير ظاهرة للزوار حالياً${Data.expired(t) ? ' (انتهت مدة النشر)' : ''}.</div>` : ''}
      </aside>
      <div>
        <div class="p-intro">
          <div class="crumbs"><a href="#/">الرئيسية</a> / <a href="#/trainers">المدربون</a> / <a href="#/trainers?region=${esc(t.region)}">${esc(regionName(t.region))}</a></div>
          <h1>${esc(t.name)}</h1>
          <div class="t">${esc(t.title || '')}</div>
        </div>
        ${t.bio ? `<div class="pbox reveal"><h3><i class="fa-solid fa-user"></i>نبذة تعريفية</h3><p>${nl2br(t.bio)}</p></div>` : ''}
        ${sp.length ? `<div class="pbox reveal"><h3><i class="fa-solid fa-layer-group"></i>التخصصات التدريبية</h3><div class="checks">${sp.map(k => `<a class="chk" href="#/trainers?spec=${k}"><span><i class="fa-solid ${specOf(k)?.icon || 'fa-shapes'}"></i>${esc(specName(k))}</span></a>`).join('')}</div></div>` : ''}
        ${tp.length ? `<div class="pbox reveal"><h3><i class="fa-solid fa-chalkboard"></i>البرامج ومجالات الخبرة</h3><div class="topics">${tp.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>` : ''}
        ${t.certs ? `<div class="pbox reveal"><h3><i class="fa-solid fa-award"></i>الشهادات والاعتمادات</h3><p>${nl2br(t.certs)}</p></div>` : ''}
        <div class="pbox reveal"><h3><i class="fa-solid fa-circle-info"></i>معلومات سريعة</h3>
          <div class="kv">
            <div><small>المنطقة</small><b>${esc(regionName(t.region) || '—')}${t.city ? ' · ' + esc(t.city) : ''}</b></div>
            <div><small>طريقة التقديم</small><b>${md.map(m => DELIVERY.find(d => d.k === m)?.name).filter(Boolean).join('، ') || '—'}</b></div>
            ${Number(t.years) ? `<div><small>سنوات الخبرة</small><b class="num">${esc(t.years)}</b></div>` : ''}
            ${Number(t.hours) ? `<div><small>الساعات التدريبية</small><b class="num">${fmtNum(t.hours)}</b></div>` : ''}
            ${t.langs ? `<div><small>لغات التدريب</small><b>${esc(t.langs)}</b></div>` : ''}
            <div><small>رقم المدرب</small><b class="num">${esc(t.code)}</b></div>
          </div>
        </div>
        ${similar.length ? `<h3 style="margin-top:30px">مدربون في تخصصات مشابهة</h3><div class="tgrid">${similar.map((x, i) => Card.mini(x, i)).join('')}</div>` : ''}
      </div>
    </div></div>`;
  },
  mount(root, params, slug) {
    const t = Data.trainer(decodeURIComponent(slug || ''));
    if (!t) return;
    document.title = `${t.name} | مدرّبون سعوديّون`;
    if (!Auth.current()) Data.track('views', t.id);
    $$('[data-click]', root).forEach(a => a.addEventListener('click', () => Data.track('clicks', t.id)));
    $('#shr', root) && ($('#shr', root).onclick = () => Card.share(t));
    $('#sv', root) && ($('#sv', root).onclick = () => Card.shareSheet(t));
    $('#ask', root) && ($('#ask', root).onclick = () => leadForm(t));
  }
};

function leadForm(t) {
  const m = modal(`<h3><i class="fa-solid fa-paper-plane"></i> طلب المدرب ${esc(t.name)}</h3>
    <p class="muted small">يصل طلبك إلى المدرب في لوحته الخاصة وإلى فريق المنصة.</p>
    <form id="lf">
      <div class="grid2">
        ${field('اسم الجهة *', '<input type="text" name="org" required maxlength="120">')}
        ${field('اسم المسؤول *', '<input type="text" name="person" required maxlength="80">')}
        ${field('الجوال *', '<input type="tel" name="phone" required placeholder="05xxxxxxxx" maxlength="20">')}
        ${field('البريد الإلكتروني', '<input type="email" name="email" maxlength="120">')}
      </div>
      ${field('موضوع البرنامج *', '<input type="text" name="topic" required maxlength="160">')}
      <div class="grid2">
        ${field('الموعد المتوقع', '<input type="text" name="when" placeholder="مثلاً: الأسبوع الأول من الشهر القادم" maxlength="80">')}
        ${field('طريقة التقديم', `<select name="mode">${DELIVERY.map(d => opt(d.k, d.name)).join('')}</select>`)}
      </div>
      ${field('تفاصيل إضافية', '<textarea name="msg" maxlength="1500"></textarea>')}
      <button class="btn primary lg">إرسال الطلب</button>
    </form>`);
  m.$('#lf').onsubmit = e => {
    e.preventDefault();
    const d = formData(e.target);
    if (!validPhone(d.phone)) { toast('رقم الجوال غير صحيح', 'error'); return; }
    Store.push('leads', { ...d, phone: phoneDigits(d.phone), trainerId: t.id, trainerName: t.name, ts: Date.now(), status: 'new' });
    m.close();
    modal(`<div class="done-card"><div class="big"><i class="fa-solid fa-check"></i></div><h3 style="justify-content:center">تم إرسال طلبك</h3><p class="muted">سيتواصل معك المدرب أو فريق المنصة قريباً بإذن الله.</p><button class="btn primary" data-close>حسناً</button></div>`);
  };
}

/* ===================== اطلب مدرباً ===================== */
Pages.request = {
  static: true,
  render() {
    return `
    <section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / اطلب مدرباً</div><h1>اطلب مدرباً لبرنامجك</h1><p>صِف احتياجك، وسنقترح عليك فوراً أنسب المدربين من المنصة، ويتابع فريقنا طلبك لترشيح أدق.</p></div></section>
    <div class="wrap" style="margin-top:-30px;position:relative">
      <div class="wizard">
        <form class="panel" id="rq" autocomplete="off" style="display:grid;gap:16px">
          <h3><i class="fa-solid fa-clipboard-list" style="color:var(--gold-d)"></i> تفاصيل الاحتياج</h3>
          <div class="grid2">
            ${field('التخصص المطلوب *', `<select name="spec" required><option value="">اختر التخصص</option>${SPECIALTIES.map(s => opt(s.k, s.name)).join('')}</select>`)}
            ${field('منطقة التنفيذ', `<select name="region"><option value="">أي منطقة</option>${REGIONS.map(r => opt(r.k, r.name)).join('')}</select>`)}
          </div>
          ${field('موضوع البرنامج أو الدورة *', '<input type="text" name="topic" required maxlength="160" placeholder="مثال: مهارات القيادة للمشرفين الجدد">')}
          <div class="grid3">
            ${field('طريقة التقديم', `<select name="mode"><option value="">أي طريقة</option>${DELIVERY.map(d => opt(d.k, d.name)).join('')}</select>`)}
            ${field('عدد المتدربين', '<input type="number" name="size" min="1" max="100000">')}
            ${field('الموعد المتوقع', '<input type="text" name="when" maxlength="80">')}
          </div>
          <div class="grid2">
            ${field('اسم الجهة *', '<input type="text" name="org" required maxlength="120">')}
            ${field('اسم المسؤول *', '<input type="text" name="person" required maxlength="80">')}
            ${field('الجوال *', '<input type="tel" name="phone" required placeholder="05xxxxxxxx" maxlength="20">')}
            ${field('البريد الإلكتروني', '<input type="email" name="email" maxlength="120">')}
          </div>
          ${field('تفاصيل إضافية', '<textarea name="msg" maxlength="2000"></textarea>')}
          <button class="btn primary lg"><i class="fa-solid fa-paper-plane"></i> إرسال الطلب لفريق المنصة</button>
        </form>
        <aside class="wiz-side"><div class="panel"><h3><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--gold-d)"></i> ترشيحات فورية</h3><div id="mt"><p class="muted small">اختر التخصص واكتب موضوع البرنامج لتظهر الترشيحات.</p></div></div></aside>
      </div>
    </div>`;
  },
  mount(root) {
    const form = $('#rq', root);
    const draw = () => {
      const d = formData(form);
      if (!d.spec && !d.topic) return;
      const res = Data.match(d);
      $('#mt', root).innerHTML = res.length ? `<div class="match-list">${res.map(({ t, s, why }) => `<a class="match" href="#/t/${esc(encodeURIComponent(t.slug || t.id))}" target="_blank">${Card.avatar(t, 'av')}<span><b>${esc(t.name)}</b><br><small class="muted">${esc(t.title || '')}</small><br><small class="pill ok">${why.join(' · ')}</small></span><span class="score num">${Math.min(99, s)}%<small>توافق</small></span></a>`).join('')}</div>`
        : '<p class="muted small">لا توجد مطابقة مباشرة حالياً — أرسل الطلب وسيبحث فريقنا لك.</p>';
    };
    form.addEventListener('input', debounce(draw, 200));
    form.onsubmit = e => {
      e.preventDefault();
      const d = formData(form);
      if (!validPhone(d.phone)) { toast('رقم الجوال غير صحيح', 'error'); return; }
      const matches = Data.match(d).map(x => x.t.id);
      Store.push('requests', { ...d, phone: phoneDigits(d.phone), size: Number(d.size) || 0, matches, ts: Date.now(), status: 'new' });
      form.innerHTML = `<div class="done-card"><div class="big"><i class="fa-solid fa-check"></i></div><h2>تم استلام طلبك</h2><p class="muted">سيتواصل معك فريق المنصة بالترشيحات المناسبة قريباً. يمكنك أيضاً التواصل مباشرة مع المدربين المقترحين.</p><a class="btn primary" href="#/trainers">تصفّح المدربين</a></div>`;
    };
  }
};

/* ===================== القاعات ===================== */
Pages.halls = {
  static: true,
  render() {
    const c = Data.content();
    const halls = Store.list('halls').filter(h => h.active !== false);
    return `
    <section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / قاعات التدريب</div><h1>قاعات التدريب — عرض وحجز</h1><p>${esc(c.halls.intro)}</p></div></section>
    <div class="wrap" style="margin-top:-30px;position:relative">
      ${halls.length ? `<div class="cards3" style="margin-bottom:30px">${halls.map(h => `<div class="icard"><div class="ic"><i class="fa-solid fa-building-columns"></i></div><h3>${esc(h.name)}</h3><p class="muted small"><i class="fa-solid fa-location-dot"></i> ${esc(regionName(h.region))}${h.city ? ' · ' + esc(h.city) : ''} · <span class="num">${esc(h.capacity || '—')}</span> متدرب</p><p>${nl2br(h.desc || '')}</p></div>`).join('')}</div>` : ''}
      <div class="panel">
        <div class="tracks" id="ht" style="margin-bottom:20px"><button class="on" data-t="book"><i class="fa-solid fa-calendar-check"></i> أحتاج قاعة</button><button data-t="list"><i class="fa-solid fa-building"></i> أعرض قاعتي</button></div>
        <form id="hf" style="display:grid;gap:16px" autocomplete="off">
          <input type="hidden" name="type" value="book">
          <div class="grid2">
            ${field('الاسم / الجهة *', '<input type="text" name="name" required maxlength="120">')}
            ${field('الجوال *', '<input type="tel" name="phone" required placeholder="05xxxxxxxx" maxlength="20">')}
            ${field('المنطقة *', `<select name="region" required><option value="">اختر</option>${REGIONS.map(r => opt(r.k, r.name)).join('')}</select>`)}
            ${field('المدينة / الحي', '<input type="text" name="city" maxlength="80">')}
            ${field('<span data-l="cap">عدد المتدربين</span>', '<input type="number" name="capacity" min="1" max="5000">')}
            ${field('<span data-l="when">الموعد والمدة</span>', '<input type="text" name="when" maxlength="120">')}
          </div>
          ${field('<span data-l="desc">تفاصيل الاحتياج (تجهيزات، ميزانية...)</span>', '<textarea name="desc" maxlength="2000"></textarea>')}
          <button class="btn primary lg">إرسال</button>
        </form>
      </div>
    </div>`;
  },
  mount(root) {
    const form = $('#hf', root);
    const L = { book: { cap: 'عدد المتدربين', when: 'الموعد والمدة', desc: 'تفاصيل الاحتياج (تجهيزات، ميزانية...)' }, list: { cap: 'السعة (عدد المقاعد)', when: 'الأوقات المتاحة والسعر', desc: 'وصف القاعة وتجهيزاتها ورابط الصور أو الموقع' } };
    $$('#ht button', root).forEach(b => b.onclick = () => {
      $$('#ht button', root).forEach(x => x.classList.toggle('on', x === b));
      form.elements.type.value = b.dataset.t;
      $$('[data-l]', form).forEach(s => { s.textContent = L[b.dataset.t][s.dataset.l]; });
    });
    form.onsubmit = e => {
      e.preventDefault();
      const d = formData(form);
      if (!validPhone(d.phone)) { toast('رقم الجوال غير صحيح', 'error'); return; }
      Store.push('hallReqs', { ...d, phone: phoneDigits(d.phone), capacity: Number(d.capacity) || 0, ts: Date.now(), status: 'new' });
      form.innerHTML = `<div class="done-card"><div class="big"><i class="fa-solid fa-check"></i></div><h2>تم الإرسال</h2><p class="muted">سيتواصل معك فريق المنصة قريباً.</p></div>`;
    };
  }
};

/* ===================== عن المنصة ===================== */
Pages.about = {
  render() {
    const c = Data.content();
    return `
    <section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / عن المنصة</div><h1>حول «${esc(c.brand.name)}»</h1><p>${esc(c.about.intro)}</p></div></section>
    <div class="wrap" style="margin-top:40px">
      <div class="cards3">
        <div class="icard reveal"><div class="ic"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>المشكلة</h3><p>${nl2br(c.about.problem)}</p></div>
        <div class="icard reveal" style="--d:100ms"><div class="ic"><i class="fa-solid fa-lightbulb"></i></div><h3>الحل</h3><p>${nl2br(c.about.solution)}</p></div>
        <div class="icard reveal" style="--d:200ms"><div class="ic"><i class="fa-solid fa-eye"></i></div><h3>الرؤية</h3><p>${nl2br(c.about.vision)}</p></div>
      </div>
      <div class="cta-band reveal" style="margin-top:40px">
        <div><h2>${esc(c.about.registered)}</h2><p>للتواصل: <a style="color:var(--gold2)" href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></p></div>
        <div class="row"><a class="btn gold lg" href="#/join">سجّل كمدرب</a><a class="btn glass lg" href="#/request">اطلب مدرباً</a></div>
      </div>
    </div>`;
  }
};

/* ===================== دخول المدربين ===================== */
Pages.login = {
  static: true,
  render() {
    return `<div class="auth-wrap"><div class="auth-card">
      ${Card.brandMark(66)}
      <h2>دخول المدربين</h2>
      <p class="muted">أدخل رمز الدخول الذي وصلك بعد قبول طلبك لتعديل بطاقتك ومتابعة المهتمين.</p>
      <form id="lg">
        <input class="code-in" name="code" placeholder="ST0000-XXXXXX" autocomplete="off" spellcheck="false" required>
        <div class="error-msg" id="le"></div>
        <button class="btn primary lg">دخول</button>
      </form>
      <p class="small muted" style="margin-top:18px">لم تسجّل بعد؟ <a href="#/join">سجّل كمدرب</a> · فقدت الرمز؟ <a href="#/about">تواصل معنا</a></p>
      <p class="small" style="margin-top:4px"><a href="#/admin"><i class="fa-solid fa-shield-halved"></i> دخول الإدارة</a></p>
    </div></div>`;
  },
  mount(root) {
    $('#lg', root).onsubmit = async e => {
      e.preventDefault();
      const b = $('button', e.target); b.disabled = true; $('#le', root).textContent = '';
      try { await Security.trainerLogin(e.target.code.value); location.hash = '#/me'; }
      catch (err) { $('#le', root).textContent = err.message; }
      finally { b.disabled = false; }
    };
  }
};
