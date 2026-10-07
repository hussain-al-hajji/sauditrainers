/* إحصاءات الزوار الذاتية + ربط اختياري بـ Google Analytics 4
 * - لا تُحفظ أي بيانات شخصية: عدّادات مجمّعة فقط في analytics/ (زيادة بمقدار 1، تقرؤها الإدارة).
 * - لا تُسجَّل زيارات المشرفين والمدربين المسجّلين ولا الروبوتات.
 * - gaId في js/config.js (معرّف القياس G-XXXX) يفعّل Google Analytics لبيانات الجغرافيا والمصادر التفصيلية. */

const Analytics = (() => {
  const CFG = window.ST_CONFIG || {};
  const tz = () => new Date(Date.now() + 3 * 3600e3);                       // توقيت الرياض
  const dayKey = () => tz().toISOString().slice(0, 10).replace(/-/g, '');
  const safe = s => String(s || '').toLowerCase().replace(/[.$#[\]/\s]+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '').replace(/^-+|-+$/g, '').slice(0, 40);
  const isBot = () => navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(navigator.userAgent || '');
  const skip = () => isBot() || Auth.current();                              // مشرف أو مدرب مسجّل
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };
  const sess = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch { return null; } };

  const device = () => { const w = Math.min(screen.width || 1024, window.innerWidth || 1024), ua = navigator.userAgent || ''; return /iPad|Tablet/i.test(ua) || (w >= 600 && w < 1024 && /Android|Mobile/i.test(ua)) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) || w < 600 ? 'mobile' : 'desktop'; };
  const browser = () => { const u = navigator.userAgent || ''; return /SamsungBrowser/i.test(u) ? 'samsung' : /Edg\//.test(u) ? 'edge' : /OPR\/|Opera/.test(u) ? 'opera' : /Firefox\//.test(u) ? 'firefox' : /CriOS|Chrome\//.test(u) ? 'chrome' : /Safari\//.test(u) ? 'safari' : 'other'; };

  // اسم الصفحة المجمّع (دون هوية المدرب أو رموز الطلبات)
  const pageName = h => { const seg = String(h || '').replace(/^#\/?/, '').split(/[/?]/)[0]; return ({ '': 'home', trainers: 'trainers', t: 'profile', join: 'join', status: 'status', request: 'request', halls: 'halls', news: 'news', about: 'about', login: 'login' })[seg] || (seg === 'me' || seg === 'admin' ? '' : 'home'); };

  function bumpAll(paths) { try { Store.bump(paths); } catch { /* ignore */ } }

  // مرة لكل جلسة: زيارة، وزائر فريد في اليوم، وجديد/عائد، والمصدر والجهاز والمتصفح واللغة والساعة
  function session() {
    if (sess('st-an-s')) return; sess('st-an-s', '1');
    const d = dayKey(), p = [`analytics/day/${d}/visits`, `analytics/dev/${device()}`, `analytics/browser/${browser()}`, `analytics/hour/${String(tz().getUTCHours()).padStart(2, '0')}`];
    const lang = safe((navigator.language || 'ar').slice(0, 2)); lang && p.push(`analytics/lang/${lang}`);
    if (store('st-an-d') !== d) { store('st-an-d', d); p.push(`analytics/day/${d}/visitors`); }
    if (!store('st-an-v')) { store('st-an-v', '1'); p.push(`analytics/day/${d}/newv`); }
    let ref = 'direct';
    try { const u = new URL(document.referrer); if (u.host && u.host !== location.host) ref = safe(u.host.replace(/^(www|m|l)\./, '')) || 'other'; } catch { /* مباشر */ }
    p.push(`analytics/ref/${ref}`);
    const utm = safe(new URLSearchParams(location.search).get('utm_source') || (location.hash.split('?')[1] ? new URLSearchParams(location.hash.split('?')[1]).get('utm_source') : ''));
    utm && p.push(`analytics/utm/${utm}`);
    bumpAll(p);
  }

  let last = '';
  function page() {
    const name = pageName(location.hash);
    if (!name || skip()) return;
    const key = location.hash.split('?')[0];
    if (key === last) return; last = key;
    session();
    bumpAll([`analytics/day/${dayKey()}/views`, `analytics/page/${name}`]);
    gaPage(name);
  }

  // حدث مخصص: day-metric (searches|contacts|joins|requests) أو حدث عام event/<name>
  function event(name, opts = {}) {
    if (skip()) return;
    const p = [];
    if (opts.day) p.push(`analytics/day/${dayKey()}/${opts.day}`);
    if (opts.kind && opts.key) { const k = safe(opts.key); k.length >= 2 && p.push(`analytics/${opts.kind}/${k}`); }
    if (name) p.push(`analytics/event/${safe(name)}`);
    bumpAll(p);
    gaEvent(name, opts.params);
  }

  /* ----- Google Analytics 4 (اختياري) ----- */
  const gaOn = () => /^G-[A-Z0-9]{6,}$/.test(CFG.gaId || '');
  function gaInit() {
    if (!gaOn() || isBot()) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.gaId, { send_page_view: false, anonymize_ip: true });
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${CFG.gaId}`; document.head.appendChild(s);
  }
  function gaPage(name) { if (gaOn() && window.gtag && !Auth.current()) window.gtag('event', 'page_view', { page_title: document.title, page_path: '/' + (location.hash.replace(/^#\/?/, '').split('?')[0] || ''), page_location: location.href.split('#')[0] + '#/' + name }); }
  function gaEvent(name, params) { if (gaOn() && window.gtag && name && !Auth.current()) window.gtag('event', name, params || {}); }

  function start() {
    gaInit();
    window.addEventListener('hashchange', () => setTimeout(page, 50));
    setTimeout(page, 400);   // بعد استعادة الجلسة، حتى لا تُحسب جلسة المشرف
  }
  return { start, page, event, gaOn, dayKey, safe };
})();
