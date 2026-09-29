/* التطبيق: الترويسة والتذييل، التنقل عبر #/، وإعادة الرسم عند تغيّر البيانات */

const App = (() => {
  let timers = [], dataHooks = [], dirty = false;
  const ROUTES = {
    '': 'home', trainers: 'trainers', t: 'profile', join: 'join', status: 'status', request: 'request',
    halls: 'halls', about: 'about', login: 'login', me: 'me', admin: 'admin'
  };

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, query = ''] = h.split('?');
    const [seg, arg] = path.split('/');
    return { page: ROUTES[seg] ? ROUTES[seg] : 'home', arg, params: new URLSearchParams(query), seg };
  }

  function header(page) {
    const s = Auth.current();
    const dark = Pages[page]?.dark || ['trainers', 'profile', 'join', 'status', 'request', 'halls', 'about', 'login'].includes(page) || (page === 'admin' && s?.kind !== 'admin');
    const link = (href, label, on) => `<a href="${href}" class="${on ? 'on' : ''}">${label}</a>`;
    return `<header class="topbar ${dark ? 'dark' : ''}" id="top"><div class="wrap">
      <a class="logo" href="#/">${Card.brandMark(38)}<span>مدرّبون سعوديّون<small>Saudi Trainers</small></span></a>
      <nav class="nav" id="nav">
        ${link('#/', 'الرئيسية', page === 'home')}${link('#/trainers', 'المدربون', page === 'trainers' || page === 'profile')}${link('#/request', 'اطلب مدرباً', page === 'request')}${link('#/halls', 'القاعات', page === 'halls')}${link('#/about', 'عن المنصة', page === 'about')}
        <a href="${s?.kind === 'trainer' ? '#/me' : s?.kind === 'admin' ? '#/admin' : '#/login'}" class="mob-only">${s ? 'لوحتي' : 'دخول المدربين'}</a>
      </nav>
      <div class="nav-cta">
        ${s?.kind === 'trainer' ? '<a class="btn ghost sm" href="#/me"><i class="fa-solid fa-id-card"></i><span>لوحتي</span></a>' : s?.kind === 'admin' ? '<a class="btn ghost sm" href="#/admin"><i class="fa-solid fa-shield-halved"></i><span>الإدارة</span></a>' : '<a class="btn ghost sm" href="#/login"><i class="fa-solid fa-right-to-bracket"></i><span>دخول المدربين</span></a>'}
        <a class="btn gold sm" href="#/join"><i class="fa-solid fa-user-plus"></i><span>سجّل كمدرب</span></a>
      </div>
      <button class="btn icon ghost burger" id="bg" aria-label="القائمة"><i class="fa-solid fa-bars"></i></button>
    </div></header>`;
  }

  function footer() {
    const c = Data.content();
    const so = [['instagram', 'fa-instagram'], ['x', 'fa-x-twitter'], ['linkedin', 'fa-linkedin-in']].filter(([k]) => safeUrl(c.contact[k]));
    return `<footer class="footer"><div class="wrap">
      <div class="foot-grid">
        <div><a class="logo" href="#/">${Card.brandMark(38)}<span>مدرّبون سعوديّون<small>Saudi Trainers</small></span></a>
          <p style="margin-top:12px">${esc(c.brand.tagline)} — ${esc(c.about.registered)}</p>
          <div class="socials">${so.map(([k, i]) => `<a href="${esc(safeUrl(c.contact[k]))}" target="_blank" rel="noopener" aria-label="${k}"><i class="fa-brands ${i}"></i></a>`).join('')}${c.contact.email ? `<a href="mailto:${esc(c.contact.email)}" aria-label="email"><i class="fa-solid fa-envelope"></i></a>` : ''}${c.contact.whatsapp ? `<a href="${esc(waLink(c.contact.whatsapp))}" target="_blank" rel="noopener" aria-label="whatsapp"><i class="fa-brands fa-whatsapp"></i></a>` : ''}</div>
        </div>
        <div><h4>للجهات التدريبية</h4><a href="#/trainers">دليل المدربين</a><a href="#/request">اطلب مدرباً</a><a href="#/halls">قاعات التدريب</a></div>
        <div><h4>للمدربين</h4><a href="#/join">سجّل كمدرب</a><a href="#/status">متابعة الطلب</a><a href="#/login">دخول المدربين</a></div>
        <div><h4>المناطق</h4>${REGIONS.slice(0, 6).map(r => `<a href="#/trainers?region=${r.k}">${r.name}</a>`).join('')}</div>
      </div>
      <div class="copy"><span>© ${new Date().getFullYear()} مدرّبون سعوديّون · جميع الحقوق محفوظة</span><a href="#/admin" style="display:inline"><i class="fa-solid fa-shield-halved"></i> الإدارة</a></div>
    </div></footer>`;
  }

  function render() {
    timers.forEach(clearInterval); timers = []; dataHooks = []; dirty = false;
    const { page, arg, params } = parse();
    const P = Pages[page];
    if (P.guard) { const to = P.guard(); if (to) { location.hash = to; return; } }
    const app = $('#app');
    const y = app.dataset.page === page + (arg || '') ? scrollY : 0;
    app.dataset.page = page + (arg || '');
    app.innerHTML = `${header(page)}<main id="view">${P.render(params, arg)}</main>${['me', 'admin'].includes(page) ? '' : footer()}${Store.mode === 'local' ? '<div class="local-flag"><i class="fa-solid fa-flask"></i> وضع التجربة المحلي</div>' : ''}`;
    if (page !== 'profile') document.title = 'مدرّبون سعوديّون | منصة تسويق خبرات المدربين السعوديين';
    const view = $('#view');
    P.mount && P.mount(view, params, arg);
    reveal(app); tilt(app);
    $('#bg').onclick = () => $('#nav').classList.toggle('open');
    window.scrollTo({ top: y, behavior: 'instant' });
    onScroll();
  }

  function onScroll() { const t = $('#top'); t && t.classList.toggle('scrolled', scrollY > 30); }

  // إعادة الرسم عند وصول بيانات جديدة (دون مقاطعة الكتابة أو النوافذ المفتوحة)
  const refresh = debounce(() => {
    const { page } = parse();
    if (dataHooks.length) { dataHooks.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); return; }
    if (Pages[page]?.static) return;
    const a = document.activeElement;
    if ((a && $('#view')?.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) || $('.modal-back')) { dirty = true; return; }
    render();
  }, 150);
  document.addEventListener('focusout', () => setTimeout(() => { if (dirty && !$('.modal-back')) refresh(); }, 50));
  new MutationObserver(() => { if (dirty && !$('.modal-back')) refresh(); }).observe(document.body, { childList: true });

  async function start() {
    const mode = await Store.init();
    await Security.restore();
    if (mode === 'local' || Auth.current()?.kind === 'admin') await Store.seedOnce(() => ({ content: defaultContent(), counters: { trainer: 0 }, meta: { createdAt: Date.now() } }));
    render();
    Store.subscribe(refresh);
    window.addEventListener('hashchange', () => { render(); });
    document.addEventListener('click', e => { if (e.target.closest('#nav a')) $('#nav')?.classList.remove('open'); });
    window.addEventListener('scroll', onScroll, { passive: true });
    const boot = $('#boot'); boot.classList.add('out'); setTimeout(() => boot.remove(), 600);
  }

  return { start, render, interval: (fn, ms) => timers.push(setInterval(fn, ms)), onData: fn => dataHooks.push(fn) };
})();

App.start();
