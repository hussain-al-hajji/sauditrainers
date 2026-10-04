/* تحسين محركات البحث (SEO): إعدادات content/seo تتحكم بعناوين الصفحات ووصفها وروبوتات الفهرسة والبيانات المنظّمة (JSON-LD)
 * وخريطة الموقع وrobots.txt. تُطبَّق فورياً على عنوان المتصفح ووسومه، وتُولَّد في الصفحات الثابتة (الرئيسية وصفحات المدربين
 * وsitemap.xml وrobots.txt) بواسطة tools/og/build.js عبر GitHub Actions باستخدام نفس هذه الدوال، فيتطابق ما يراه الزائر وما يراه الزاحف.
 *
 * content/seo = { site:{...}, pages:{home|trainers|...:{title,desc,noindex}}, trainers:{<id>:{title,desc,noindex}}, files:{...} } */

const SEO = (() => {
  const DEF = {
    siteName: 'مدرّبون سعوديّون',
    homeTitle: 'مدرّبون سعوديّون | منصة تسويق خبرات المدربين السعوديين',
    homeDesc: 'مدرّبون سعوديّون — منصة تهتم بتسويق خبرات المدربين السعوديين في مختلف المجالات، وتسهيل وصول الجهات التدريبية إليهم. ابحث عن مدرب بالتخصص أو المنطقة، أو سجّل كمدرب.',
    ogTitle: 'مدرّبون سعوديّون | Saudi Trainers',
    ogDesc: 'اعثر على المدرب السعودي المناسب لبرنامجك في دقائق — بالتخصص أو المنطقة.',
    keywords: '',
    ogImage: 'assets/og.png',
    twitter: '',
    robotsIndex: true,
    gsc: '', bing: '',
    trainerTitleTpl: '{name} | {siteName}',
    trainerDescTpl: '{title} — المنطقة: {region} — منصة {siteName} لتسويق خبرات المدربين السعوديين',
    trainerBody: true, ldOrg: true, ldPerson: true,
    orgName: '', orgLogo: 'assets/icon-512.png', orgSameAs: ''
  };
  const FILES_DEF = { robotsExtra: '', sitemapTrainers: true, changefreq: '', priority: '' };
  // الصفحات القابلة للضبط (لكل منها عنوان ووصف ومنع فهرسة). الصفحات الخاصة (الإدارة وحساب المدرب والدخول والمتابعة) لا تُفهرس دائماً.
  const PAGES = [
    ['home', 'الرئيسية'], ['trainers', 'دليل المدربين'], ['join', 'سجّل كمدرب'], ['request', 'اطلب مدرباً'], ['halls', 'قاعات التدريب'], ['about', 'عن المنصة']
  ];
  const PAGE_DEF = {
    trainers: { title: 'دليل المدربين السعوديين | {siteName}', desc: 'ابحث في دليل المدربين السعوديين بالتخصص أو المنطقة، واطّلع على بطاقاتهم وتواصل معهم عبر المنصة.' },
    join: { title: 'سجّل كمدرب | {siteName}', desc: 'انضم إلى منصة {siteName} واعرض بطاقتك التعريفية أمام الجهات التدريبية في أنحاء المملكة.' },
    request: { title: 'اطلب مدرباً | {siteName}', desc: 'أخبرنا باحتياج جهتك التدريبي ونرشّح لك المدرب السعودي المناسب لبرنامجك.' },
    halls: { title: 'قاعات التدريب | {siteName}', desc: 'قاعات تدريب مجهزة في مدن المملكة، اطلب قاعتك لبرنامجك التدريبي عبر المنصة.' },
    about: { title: 'عن المنصة | {siteName}', desc: 'تعرّف على منصة {siteName} ورؤيتها في تسويق خبرات المدربين السعوديين.' }
  };
  const PRIVATE_PAGES = ['admin', 'me', 'login', 'status'];
  const TRAINER_VARS = [['name', 'اسم المدرب'], ['title', 'السطر التعريفي'], ['region', 'المنطقة'], ['specs', 'التخصصات'], ['years', 'سنوات الخبرة'], ['siteName', 'اسم المنصة']];

  const raw = () => (typeof Store !== 'undefined' && Store.get('content/seo')) || {};
  const site = () => {
    const s = raw().site || {};
    return Object.fromEntries(Object.entries(DEF).map(([k, d]) => [k, typeof d === 'boolean' ? (s[k] ?? d) : (String(s[k] ?? '').trim() || d)]));
  };
  const files = () => ({ ...FILES_DEF, ...(raw().files || {}) });
  const pageCfg = k => (raw().pages || {})[k] || {};
  const trainerCfg = id => (raw().trainers || {})[id] || {};
  const abs = (u, base) => (/^(https?:)?\/\//.test(u || '') ? u : base + String(u || '').replace(/^\//, ''));
  const fill = (tpl, v) => Card.fillShare(String(tpl || ''), v).replace(/\s+/g, ' ').trim();

  function trainerVars(t, s = site()) {
    const n = v => (Number(v) ? String(Number(v)) : '');
    return { name: t.name || '', title: (t.title || '').trim(), region: regionsLabel(t, true, 2), specs: Data.cardSpecs(t).slice(0, 4).map(specName).filter(Boolean).join('، '), years: n(t.years), siteName: s.siteName };
  }
  // العنوان والوصف الفعليان لمدرب (التخصيص الفردي يغلب القالب العام)
  function trainerMeta(t) {
    const s = site(), c = trainerCfg(t.id), v = trainerVars(t, s);
    return {
      title: (c.title || '').trim() || fill(s.trainerTitleTpl, v),
      desc: ((c.desc || '').trim() || fill(s.trainerDescTpl, v)).slice(0, 300),
      noindex: !!c.noindex || !s.robotsIndex
    };
  }
  function pageMeta(page) {
    const s = site(), c = pageCfg(page);
    if (page === 'home') return { title: (c.title || '').trim() || s.homeTitle, desc: (c.desc || '').trim() || s.homeDesc, noindex: !!c.noindex || !s.robotsIndex };
    const d = PAGE_DEF[page] || { title: '{siteName}', desc: s.homeDesc };
    return { title: (c.title || '').trim() || fill(d.title, { siteName: s.siteName }), desc: (c.desc || '').trim() || fill(d.desc, { siteName: s.siteName }), noindex: !!c.noindex || !s.robotsIndex };
  }

  /* ----- البيانات المنظّمة ----- */
  const ldJson = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
  function orgLd(base) {
    const s = site(), same = s.orgSameAs.split(/\s*\n\s*/).map(x => x.trim()).filter(x => /^https?:\/\//.test(x));
    return [
      { '@context': 'https://schema.org', '@type': 'Organization', name: s.orgName || s.siteName, url: base, logo: abs(s.orgLogo, base), ...(same.length ? { sameAs: same } : {}) },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: s.siteName, url: base, inLanguage: 'ar' }
    ];
  }
  function personLd(t, m, base, img) {
    const s = site(), specs = Data.cardSpecs(t).map(specName).filter(Boolean), region = regionsLabel(t, true, 3);
    return { '@context': 'https://schema.org', '@type': 'Person', name: t.name, ...(t.title ? { jobTitle: t.title } : {}), description: m.desc, url: `${base}t/${t.slug || t.id}/`, ...(img ? { image: img } : {}),
      ...(specs.length ? { knowsAbout: specs } : {}), ...(region ? { address: { '@type': 'PostalAddress', addressRegion: region, addressCountry: 'SA' } } : {}), memberOf: { '@type': 'Organization', name: s.orgName || s.siteName, url: base } };
  }

  /* ----- وسوم الرأس (تُستخدم في الصفحات الثابتة) ----- */
  function headTags(m, o) {
    const s = site(), base = o.base, e = esc, img = abs(o.image || s.ogImage, base);
    return [
      `<title>${e(m.title)}</title>`,
      `<meta name="description" content="${e(m.desc)}">`,
      s.keywords && o.keywords !== false ? `<meta name="keywords" content="${e(s.keywords)}">` : '',
      `<meta name="robots" content="${m.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">`,
      `<link rel="canonical" href="${e(o.url)}">`,
      s.gsc ? `<meta name="google-site-verification" content="${e(s.gsc)}">` : '',
      s.bing ? `<meta name="msvalidate.01" content="${e(s.bing)}">` : '',
      `<meta property="og:type" content="${o.type || 'website'}"><meta property="og:site_name" content="${e(s.siteName)}"><meta property="og:locale" content="ar_SA">`,
      `<meta property="og:title" content="${e(o.ogTitle || m.title)}"><meta property="og:description" content="${e(o.ogDesc || m.desc)}"><meta property="og:url" content="${e(o.url)}">`,
      `<meta property="og:image" content="${e(img)}">${o.imgSize === false ? '' : `<meta property="og:image:type" content="${/\.jpe?g$/i.test(img) ? 'image/jpeg' : 'image/png'}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="${o.imgH || 675}">`}${o.imgAlt ? `<meta property="og:image:alt" content="${e(o.imgAlt)}">` : ''}`,
      `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(o.ogTitle || m.title)}"><meta name="twitter:description" content="${e(o.ogDesc || m.desc)}"><meta name="twitter:image" content="${e(img)}">`,
      s.twitter ? `<meta name="twitter:site" content="${e('@' + s.twitter.replace(/^@/, ''))}">` : '',
      '<meta name="theme-color" content="#005430">',
      ...(o.ld || []).map(ldJson)
    ].filter(Boolean).join('\n');
  }
  // كتلة وسوم الصفحة الرئيسية داخل index.html (بين <!--seo:start--> و<!--seo:end-->)
  function homeBlock(base) {
    const s = site(), m = pageMeta('home');
    return headTags(m, { base, url: base, ogTitle: s.ogTitle, ogDesc: s.ogDesc, imgH: 630, imgSize: false, ld: s.ldOrg ? orgLd(base) : [] });
  }
  function trainerHead(t, base) {
    const s = site(), m = trainerMeta(t), url = `${base}t/${t.slug || t.id}/`, img = `${base}og/${t.id}.jpg`;
    return headTags(m, { base, url, type: 'profile', image: img, imgAlt: `بطاقة ${t.name}`, keywords: false, ld: s.ldPerson ? [personLd(t, m, base, img)] : [] });
  }
  // محتوى نصي ظاهر في الصفحة الثابتة للمدرب (يقرؤه الزاحف دون جافاسكربت)
  function trainerBody(t, base) {
    const s = site(), e = esc, cur = encodeURIComponent(t.slug || t.id);
    const specs = Data.specs(t).map(specName).filter(Boolean), region = regionsLabel(t, true, 3);
    const bio = String(t.bio || '').replace(/\s+/g, ' ').trim().slice(0, 600);
    const body = s.trainerBody ? [
      `<h1>${e(t.name)}</h1>`, t.title ? `<p>${e(t.title)}</p>` : '', region ? `<p>المنطقة: ${e(region)}</p>` : '',
      Number(t.years) ? `<p>سنوات الخبرة: ${e(String(Number(t.years)))}</p>` : '', specs.length ? `<p>التخصصات: ${e(specs.join('، '))}</p>` : '', bio ? `<p>${e(bio)}</p>` : ''
    ] : [`<h1>${e(t.name)}</h1>`, t.title ? `<p>${e(t.title)}</p>` : ''];
    return `${body.filter(Boolean).join('\n')}\n<p><a href="../../#/t/${e(cur)}">فتح بطاقة المدرب في ${e(s.siteName)}</a></p>`;
  }

  /* ----- robots.txt وsitemap.xml ----- */
  function robotsTxt(base, fo) {
    const s = site(), f = fo || files();
    const extra = String(f.robotsExtra || '').split('\n').map(x => x.trim()).filter(x => /^(Disallow|Allow|Crawl-delay):\s*\S*/i.test(x));
    return `User-agent: *\n${s.robotsIndex ? 'Allow: /' : 'Disallow: /'}\n${s.robotsIndex ? extra.map(x => x + '\n').join('') : ''}Sitemap: ${base}sitemap.xml\n`;
  }
  function sitemapXml(base, trainers, fo) {
    const s = site(), f = fo || files(), e = esc;
    const urls = s.robotsIndex ? [base, ...(f.sitemapTrainers ? trainers.filter(t => !trainerCfg(t.id).noindex).map(t => `${base}t/${t.slug || t.id}/`) : [])] : [];
    const extra = u => `${f.changefreq ? `<changefreq>${e(f.changefreq)}</changefreq>` : ''}${f.priority ? `<priority>${e(f.priority)}</priority>` : ''}`;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${e(u)}</loc>${extra(u)}</url>`).join('\n')}\n</urlset>\n`;
  }

  /* ----- تطبيق فوري على الصفحة المفتوحة ----- */
  function setTag(sel, make, val) { let el = document.head.querySelector(sel); if (!el) { el = make(); document.head.appendChild(el); } return el; }
  const meta = (attr, key, val) => { const el = setTag(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; }); el.setAttribute('content', val); };
  function apply(page, t) {
    try {
      const s = site(), base = siteBase();
      let m, url = base, img = abs(s.ogImage, base);
      if (page === 'profile' && t) { m = trainerMeta(t); url = `${base}t/${t.slug || t.id}/`; }
      else if (PRIVATE_PAGES.includes(page)) m = { title: pageMeta('home').title, desc: s.homeDesc, noindex: true };
      else m = pageMeta(page);
      document.title = m.title;
      meta('name', 'description', m.desc);
      meta('name', 'robots', m.noindex || PRIVATE_PAGES.includes(page) ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
      setTag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }).href = url;
      meta('property', 'og:title', page === 'home' ? s.ogTitle : m.title); meta('property', 'og:description', page === 'home' ? s.ogDesc : m.desc); meta('property', 'og:url', url);
      meta('property', 'og:image', page === 'profile' && t ? `${base}og/${t.id}.jpg` : img);
      meta('name', 'twitter:title', m.title); meta('name', 'twitter:description', m.desc);
    } catch (e) { /* لا يعطّل الصفحة */ }
  }

  return { DEF, FILES_DEF, PAGES, PAGE_DEF, TRAINER_VARS, site, files, pageCfg, trainerCfg, trainerMeta, pageMeta, trainerVars, fill, headTags, homeBlock, trainerHead, trainerBody, robotsTxt, sitemapXml, apply };
})();
