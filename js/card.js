/* البطاقة التعريفية للمدرب: مكوّن HTML تفاعلي + تصدير صورة عالية الدقة للمشاركة (منشور 4:5 وقصة 9:16)
 * لا تحتوي البطاقة أي بيانات تواصل؛ التواصل مع المدرب يتم عبر نموذج المنصة فقط. */

const LOGO = { green: 'assets/logo-green.png', cream: 'assets/logo-cream.png' };
const logoImg = (variant = 'green', cls = '') => `<img class="brand-logo ${cls}" src="${variant === 'cream' ? LOGO.cream : LOGO.green}" alt="مدرّبون سعوديّون" width="94" height="50">`;

const Card = (() => {
  // إطار الصورة: موضع أفقي/رأسي (0-100) وتكبير (1-2.5) يحددها المدرب عند إضافة رابط الصورة
  const fit = t => ({ x: clampN(t.photoX, 0, 100, 50), y: clampN(t.photoY, 0, 100, 30), z: clampN(t.photoZ, 1, 2.5, 1) });
  // أسلوب إطار الصورة: الموضع يحرّك الصورة حتى لو كانت مربعة (نقطة التكبير تتبع المؤشرين، فيظهر الجزء المطلوب منها)
  const imgStyle = f => `object-position:${f.x}% ${f.y}%;transform-origin:${f.x}% ${f.y}%;transform:scale(${f.z})`;
  function clampN(v, a, b, d) { const n = Number(v); return Number.isFinite(n) && v !== '' && v != null ? Math.min(b, Math.max(a, n)) : d; }

  // صورة رمزية بلا ملامح لمن لا ترغب بنشر صورتها: مدربة (حجاب وجه فارغ) أو مدرب (رأس وكتفان)
  const SYM_F = 'M50 10C34 10 24 21 24 36c0 9 3 16 8 21C20 62 12 72 10 100h80c-2-28-10-38-22-43 5-5 8-12 8-21C76 21 66 10 50 10z';
  const SYM_M_BODY = 'M14 100c2-24 16-36 36-36s34 12 36 36z';
  const symbol = g => (g === 'f'
    ? `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${SYM_F}" fill="var(--acc,#EEF3E5)"/></svg>`
    : `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="36" r="17" fill="var(--acc,#EEF3E5)"/><path d="${SYM_M_BODY}" fill="var(--acc,#EEF3E5)"/></svg>`);
  function avatar(t, cls = '') {
    if (t.noPhoto) return `<span class="${cls} avw sym" role="img" aria-label="${t.gender === 'f' ? 'صورة رمزية لمدربة' : 'صورة رمزية'}">${symbol(t.gender)}</span>`;
    const p = Data.photo(t), ini = initials(t.name);
    if (!p) return `<span class="${cls} avw ph">${ini}</span>`;
    const f = fit(t);
    return `<span class="${cls} avw" data-i="${ini}"><img src="${esc(p)}" alt="${esc(t.name)}" loading="lazy" referrerpolicy="no-referrer" style="${imgStyle(f)}" onerror="const s=this.parentNode;s.classList.add('ph');s.textContent=s.dataset.i"></span>`;
  }
  // ألوان البطاقة: ثيم المدرب، أو ألوان القالب إن فعّلتها الإدارة
  const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
  const themed = (t, tp = cardTemplate()) => { const th = themeOf(t.theme), c = tp.colors; return c.on ? { ...th, a: c.a, b: c.b, c: c.c, accent: c.accent, fg: c.fg, light: lum(c.a) > 0.62 } : th; };
  const fontCss = n => `'${n}', 'Noto Sans Arabic', sans-serif`;
  const themeVars = (t, tp = cardTemplate()) => {
    const th = themed(t, tp);
    return `--a:${th.a};--b:${th.b};--c:${th.c};--acc:${th.accent};--fg:${th.fg};--pat:${Pattern.css(th.light ? '#005430' : th.accent, th.light ? 0.06 : 0.07)};--cf-name:${fontCss(tp.fonts.name)};--cf-body:${fontCss(tp.fonts.body)};--cf-brand:${fontCss(tp.fonts.brand)};--cf-scale:${tp.nameScale / 100};--cf-pat:${tp.show.pattern ? tp.patternOpacity / 100 : 0};--cf-radius:${tp.radius}px`;
  };
  const themeCls = (t, tp = cardTemplate()) => (themed(t, tp).light ? 'light' : '');
  const stat = (v, l) => (Number(v) ? `<div class="tc-stat"><b class="num">${fmtNum(v)}+</b><span>${l}</span></div>` : '');

  // البطاقة الكاملة (صفحة المدرب والمعاينة ولوحة المدرب)
  function full(t, { preview = false, tpl } = {}) {
    const tp = tpl || cardTemplate(), sp = Data.cardSpecs(t).slice(0, tp.maxSpecs), th = themed(t, tp), x = tp.text;
    const stats = [stat(t.years, x.years), stat(t.hours, x.hours), stat(t.programs, x.programs)].filter(Boolean);
    return `<article class="tcard full ${themeCls(t, tp)}" data-tilt="8" style="${themeVars(t, tp)}">
      <div class="tc-glow"></div><div class="tc-holo"></div>
      <header class="tc-top">
        ${tp.show.logo ? logoImg(th.light ? 'green' : 'cream', 'tc-logo') : '<span></span>'}
        <span class="tc-code">${preview ? esc(x.preview) : ''}</span>
      </header>
      <div class="tc-ring">${avatar(t, 'tc-photo')}${tp.show.badge ? '<span class="tc-verified" title="مدرب موثّق"><i class="fa-solid fa-certificate"></i><i class="fa-solid fa-check"></i></span>' : ''}</div>
      <h2 class="tc-name">${esc(t.name || 'اسم المدرب')}</h2>
      ${tp.show.title && t.title ? `<p class="tc-title">${esc(t.title)}</p>` : ''}
      ${tp.show.region && regionsOf(t).length ? `<div class="tc-meta"><span><i class="fa-solid fa-location-dot"></i>${esc(regionsLabel(t, true, tp.maxRegions))}</span></div>` : ''}
      ${tp.show.stats && stats.length ? `<div class="tc-stats">${stats.join('')}</div>` : ''}
      ${tp.show.specs && sp.length ? `<div class="tc-chips">${sp.slice(0, 6).map(s => `<span><i class="fa-solid ${specOf(s)?.icon || 'fa-shapes'}"></i>${esc(specName(s))}</span>`).join('')}</div>` : ''}
      ${tp.show.footer ? `<footer class="tc-foot"><span>${esc(x.footLead)}</span><div class="tc-brandline"><b>${esc(x.brand)}</b><i>|</i><em dir="ltr">${esc(x.site)}</em></div></footer>` : ''}
    </article>`;
  }

  // البطاقة المصغرة (دليل المدربين)
  function mini(t, i = 0) {
    const sp = Data.cardSpecs(t), nAll = Data.specs(t).length;
    return `<a class="tmini reveal ${themeCls(t)}" href="#/t/${esc(encodeURIComponent(t.slug || t.id))}" style="${themeVars(t)};--d:${Math.min(i, 12) * 40}ms" data-tilt="6">
      <div class="tm-head"><div class="tm-glow"></div>${t.featured ? '<span class="tm-star" title="مدرب مميز"><i class="fa-solid fa-star"></i></span>' : ''}</div>
      <div class="tm-ring">${avatar(t, 'tm-photo')}</div>
      <div class="tm-body">
        <h3>${esc(t.name)}<i class="fa-solid fa-circle-check tm-ok" title="موثّق"></i></h3>
        <p class="tm-title">${esc(t.title || '')}</p>
        <div class="tm-meta">${regionsOf(t).length ? `<span><i class="fa-solid fa-location-dot"></i>${esc(regionsLabel(t, true, cardTemplate().maxRegions))}</span>` : ''}${Number(t.years) ? `<span><i class="fa-solid fa-hourglass-half"></i><b class="num">${esc(t.years)}</b> سنة</span>` : ''}</div>
        <div class="tm-chips">${sp.slice(0, 3).map(s => `<span>${esc(specName(s))}</span>`).join('')}${nAll > 3 ? `<span class="more num">+${nAll - 3}</span>` : ''}</div>
      </div>
      <span class="tm-go">عرض البطاقة <i class="fa-solid fa-arrow-left"></i></span>
    </a>`;
  }

  /* ===================== تصدير الصورة ===================== */
  const HEAD = "'Cairo', 'Noto Sans Arabic', sans-serif";
  const UI = "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif";
  const BODY = "'Noto Sans Arabic', 'IBM Plex Sans Arabic', sans-serif";

  let bust = false, plain = false;   // إعادة المحاولة بمعامل جديد يتجاوز نسخة الصورة المخزّنة في المتصفح دون ترويسات CORS (سبب شائع في Safari)
  // تجاوز الكاش: روابط Google تتحمل تغيير الحجم (=w800 → =w803) أما إضافة معاملات فتُفسدها
  const bustUrl = src => /googleusercontent\.com\/.*=w\d+/.test(src) ? src.replace(/=w(\d+)/, (m, n) => '=w' + (Number(n) + 1 + Math.floor(Math.random() * 40))) : src + (src.includes('?') ? '&' : '?') + '_cb=' + Date.now();
  const imgFrom = (src, cors) => new Promise(res => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => res(img); img.onerror = () => res(null);
    img.src = src;
  });
  let why = [];   // أسباب فشل تحميل الصورة (للتشخيص)
  async function loadImage(src) {
    if (!src) return null;
    if (!/^https?:/.test(src)) return imgFrom(src, false);
    if (bust) src = bustUrl(src);
    const img = await imgFrom(src, true);
    if (img) return img;
    why.push('img');
    // Safari: نجلب الملف عبر fetch (CORS) ونحوّله إلى blob محلي لا يلوّث اللوحة
    try {
      const r = await fetch(src, { mode: 'cors', referrerPolicy: 'no-referrer', cache: 'reload' });
      if (r.ok) { const u = URL.createObjectURL(await r.blob()); const im = await imgFrom(u, false); if (im) return im; why.push('blob'); } else why.push('fetch' + r.status);
    } catch (e) { why.push('fetch:' + (e && e.name)); }
    // أخيراً: وسيط صور عام يضيف ترويسات CORS (Safari يرفض صور Drive لأنها لا ترسلها)
    return imgFrom('https://wsrv.nl/?w=900&url=' + encodeURIComponent(src.replace(/^https?:\/\//, '')), true);
  }
  function loadScript(src) {
    return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  }
  async function ensureQR() {
    if (window.qrcode) return true;
    // نسخة محلية أولاً (لا تعتمد على CDN قد يُحجب على بعض الشبكات)، ثم CDN احتياطاً
    if (await loadScript('vendor/qrcode/qrcode.js') && window.qrcode) return true;
    return Promise.race([loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'), new Promise(r => setTimeout(() => r(false), 5000))]).then(() => !!window.qrcode);
  }
  async function ensureFonts(tp = cardTemplate()) {
    try {
      const names = [...new Set(Object.values(tp.fonts))];
      await Promise.all(names.flatMap(n => [`900 60px '${n}'`, `700 30px '${n}'`, `400 26px '${n}'`, `600 26px '${n}'`].map(f => document.fonts.load(f, 'مدرب Aa'))));
      await document.fonts.ready;
    } catch { /* ignore */ }
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function seal(ctx, cx, cy, R) {
    const r = R * 0.8;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) { const a = -Math.PI / 2 + i * Math.PI / 12; const d = i % 2 ? r : R; ctx.lineTo(cx + d * Math.cos(a), cy + d * Math.sin(a)); }
    ctx.closePath();
  }
  function wrap(ctx, text, maxW, maxLines = 3) {
    const out = []; let line = '';
    String(text || '').split(/\s+/).filter(Boolean).forEach(w => {
      const tt = line ? line + ' ' + w : w;
      if (ctx.measureText(tt).width > maxW && line) { out.push(line); line = w; } else line = tt;
    });
    if (line) out.push(line);
    if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] += '…'; }
    return out;
  }
  const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

  // أيقونة الموقع (دبوس) على لوحة الرسم
  function pin(ctx, x, y, k, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(0, 16); ctx.bezierCurveTo(-20, -4, -15, -24, 0, -24); ctx.bezierCurveTo(15, -24, 20, -4, 0, 16);
    ctx.moveTo(6.5, -9); ctx.arc(0, -9, 6.5, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore();
  }
  // أبعاد صور المشاركة: منشور 4:5، قصة 9:16، وعرضي 16:9
  const SIZES = { post: [1080, 1350], story: [1080, 1920], wide: [1600, 900], og: [1200, 675] };

  // نقش الخلفية يُرسم مباشرة على لوحة (دون تحميل SVG كصورة) لأن Safari يعدّ اللوحة «ملوّثة» وفيها صورة SVG فيرفض تصديرها
  function patternTile(color, opacity) {
    const S = Pattern.TILE, tc = document.createElement('canvas'); tc.width = tc.height = S;
    const c = tc.getContext('2d'), doc = new DOMParser().parseFromString(Pattern.svg(color, opacity), 'image/svg+xml');
    const rgb = hex(color, opacity);
    c.strokeStyle = rgb; c.lineWidth = 1.15; c.lineCap = 'round'; c.lineJoin = 'round';
    doc.querySelectorAll('g > g').forEach(g => {
      const m = /translate\(([\d.-]+) ([\d.-]+)\) rotate\(([\d.-]+)\) scale\(([\d.]+)\)/.exec(g.getAttribute('transform') || '');
      if (!m) return;
      c.save(); c.translate(+m[1], +m[2]); c.rotate(+m[3] * Math.PI / 180); c.scale(+m[4], +m[4]); c.translate(-12, -12); c.lineWidth = 1.15;
      g.querySelectorAll('path,rect,circle').forEach(el => {
        const n = k => parseFloat(el.getAttribute(k) || 0);
        if (el.tagName === 'path') c.stroke(new Path2D(el.getAttribute('d')));
        else if (el.tagName === 'rect') { rr(c, n('x'), n('y'), n('width'), n('height'), n('rx')); c.stroke(); }
        else { c.beginPath(); c.arc(n('cx'), n('cy'), n('r'), 0, Math.PI * 2); c.stroke(); }
      });
      c.restore();
    });
    return tc;
  }


  // صورة معاينة الروابط (واتساب وإكس ولينكدإن) 1200×675: صورة المدرب واسمه وسطره التعريفي وشعار المنصة ورابطها
  async function renderOg(t, tp) {
    const x0 = tp.text, HEAD = fontCss(tp.fonts.name), BODY = fontCss(tp.fonts.body), BRAND = fontCss(tp.fonts.brand);
    await Promise.race([ensureFonts(tp), new Promise(r => setTimeout(r, 6000))]);
    const th = themed(t, tp), light = !!th.light, fg = th.fg, [W, H] = SIZES.og, M = 28;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'center';
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, th.a); g.addColorStop(0.55, th.b); g.addColorStop(1, th.a);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.78, H * 0.45, 20, W * 0.78, H * 0.45, W * 0.7);
    glow.addColorStop(0, hex(th.c, light ? 0.35 : 0.55)); glow.addColorStop(1, hex(th.c, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    if (!plain && tp.show.pattern && tp.patternOpacity) { try { ctx.save(); ctx.fillStyle = ctx.createPattern(patternTile(light ? '#005430' : th.accent, light ? 0.1 : 0.11), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore(); } catch (e) { console.warn('pattern', e); } }
    ctx.strokeStyle = hex(th.accent, 0.8); ctx.lineWidth = 3; rr(ctx, M, M, W - 2 * M, H - 2 * M, 36); ctx.stroke();
    ctx.strokeStyle = hex(th.accent, 0.28); ctx.lineWidth = 1.5; rr(ctx, M + 12, M + 12, W - 2 * M - 24, H - 2 * M - 24, 28); ctx.stroke();

    // الشعار (أعلى اليسار) ورابط المنصة (أسفل اليسار)
    const logo = await loadImage(light ? LOGO.green : LOGO.cream);
    if (logo) { const lh = 92, lw = lh * logo.width / logo.height; ctx.drawImage(logo, 74, 56, lw, lh); }
    const site = String(x0.site || 'sauditrainers.sa').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    ctx.font = `800 36px ${BRAND}`; ctx.direction = 'ltr';
    const sw = ctx.measureText(site).width + 64;
    rr(ctx, 74, H - 64 - 66, sw, 66, 33); ctx.fillStyle = hex(th.accent, light ? 0.12 : 0.16); ctx.fill(); ctx.strokeStyle = hex(th.accent, 0.55); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(site, 74 + sw / 2, H - 64 - 20); ctx.direction = 'rtl';

    // الصورة الدائرية (يمين)
    const D = 340, cx = W - 74 - 16 - D / 2, cy = H / 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 14;
    ctx.beginPath(); ctx.arc(cx, cy, D / 2 + 16, 0, Math.PI * 2); ctx.fillStyle = th.accent; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, D / 2 + 6, 0, Math.PI * 2); ctx.fillStyle = th.b; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, D / 2, 0, Math.PI * 2); ctx.clip();
    const photo = t.noPhoto ? null : await loadImage(Data.photo(t));
    const pg = ctx.createLinearGradient(cx - D / 2, cy - D / 2, cx + D / 2, cy + D / 2); pg.addColorStop(0, th.c); pg.addColorStop(1, th.a);
    if (t.noPhoto) {
      ctx.fillStyle = pg; ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
      ctx.save(); ctx.translate(cx - D / 2, cy - D / 2); ctx.scale(D / 100, D / 100); ctx.fillStyle = th.accent;
      if (t.gender === 'f') ctx.fill(new Path2D(SYM_F)); else { ctx.beginPath(); ctx.arc(50, 36, 17, 0, Math.PI * 2); ctx.fill(); ctx.fill(new Path2D(SYM_M_BODY)); }
      ctx.restore();
    } else if (photo) {
      const f = fit(t), sc = Math.max(D / photo.width, D / photo.height), iw = photo.width * sc, ih = photo.height * sc;
      const ox = cx - D / 2 + D * f.x / 100, oy = cy - D / 2 + D * f.y / 100;
      ctx.translate(ox, oy); ctx.scale(f.z, f.z); ctx.translate(-ox, -oy);
      ctx.drawImage(photo, cx - D / 2 + (D - iw) * f.x / 100, cy - D / 2 + (D - ih) * f.y / 100, iw, ih);
    } else {
      ctx.fillStyle = pg; ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
      const tmp = document.createElement('div'); tmp.innerHTML = initials(t.name);
      ctx.fillStyle = fg; ctx.font = `900 130px ${HEAD}`; ctx.textBaseline = 'middle'; ctx.fillText(tmp.textContent, cx, cy + 6); ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
    if (tp.show.badge) {
      const bx = cx + D * 0.36, by = cy + D * 0.36;
      ctx.fillStyle = th.accent; seal(ctx, bx, by, 38); ctx.fill();
      ctx.strokeStyle = light ? '#FFFFFF' : th.b; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 11, by + 1); ctx.lineTo(bx - 3, by + 10); ctx.lineTo(bx + 13, by - 9); ctx.stroke();
    }

    // النص: الاسم ثم السطر التعريفي ثم المنطقة، محاذاة لليمين بجانب الصورة
    const ax = cx - D / 2 - 16 - 56, colW = ax - 74;
    const name = t.name || '', meas = (sz, str) => { ctx.font = `900 ${sz}px ${HEAD}`; return ctx.measureText(str).width; };
    let ns = Math.round(80 * tp.nameScale / 100), nl = [name];
    while (ns > 52 && meas(ns, name) > colW) ns -= 2;
    if (meas(ns, name) > colW) { ns = Math.min(ns, 62); for (; ns >= 40; ns -= 2) { ctx.font = `900 ${ns}px ${HEAD}`; nl = wrap(ctx, name, colW, 2); if (nl.every(l => ctx.measureText(l).width <= colW)) break; } }
    const title = tp.show.title && t.title ? t.title : '';
    ctx.font = `600 34px ${BODY}`; const tl = title ? wrap(ctx, title, colW, 3) : [];
    const meta = tp.show.region ? regionsLabel(t, true, tp.maxRegions) : '';
    const nameH = nl.length * ns * 1.15, tH = tl.length ? 22 + tl.length * 50 : 0, mH = meta ? 26 + 40 : 0;
    let y = Math.max(168, cy - (nameH + tH + mH) / 2) + ns * 0.9;
    ctx.textAlign = 'right'; ctx.fillStyle = fg; ctx.font = `900 ${ns}px ${HEAD}`;
    nl.forEach((l, i) => ctx.fillText(l, ax, y + i * ns * 1.15)); y += (nl.length - 1) * ns * 1.15;
    if (tl.length) { ctx.font = `600 34px ${BODY}`; ctx.fillStyle = th.accent; y += 22; tl.forEach((l, i) => { y += i ? 50 : 40; ctx.fillText(l, ax, y); }); }
    if (meta) {
      y += 26 + 36; ctx.font = `700 32px ${UI}`; ctx.fillStyle = hex(fg, 0.9); const mw = ctx.measureText(meta).width;
      ctx.fillText(meta, ax - 40, y); pin(ctx, ax - 14, y - 9, 1, th.accent); void mw;
    }
    cv.photoFailed = !t.noPhoto && !!t.photoUrl && !photo;
    return cv;
  }

  async function render(t, format = 'post', tpl) {
    if (format === 'og') return renderOg(t, tpl || cardTemplate());
    const tp = tpl || cardTemplate(), x0 = tp.text;
    const HEAD = fontCss(tp.fonts.name), BODY = fontCss(tp.fonts.body), UI = BODY, BRAND = fontCss(tp.fonts.brand);
    await Promise.race([ensureFonts(tp), new Promise(r => setTimeout(r, 6000))]);   // لا نعلّق إن تأخرت الخطوط
    const hasQR = await ensureQR();
    const th = themed(t, tp), light = !!th.light, fg = th.fg;
    const wide = format === 'wide', [W, H] = SIZES[format] || SIZES.post;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.direction = 'rtl'; ctx.textAlign = 'center';

    // الخلفية: تدرج + توهج + نقش أدوات القرطاسية
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, th.a); g.addColorStop(0.55, th.b); g.addColorStop(1, th.a);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const gx = wide ? W * 0.8 : W * 0.5, gy = wide ? H * 0.4 : H * 0.3;
    const glow = ctx.createRadialGradient(gx, gy, 20, gx, gy, W * 0.8);
    glow.addColorStop(0, hex(th.c, light ? 0.35 : 0.55)); glow.addColorStop(1, hex(th.c, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    let tile = null;
    if (!plain && tp.show.pattern && tp.patternOpacity) { try { tile = patternTile(light ? '#005430' : th.accent, light ? 0.1 : 0.11); } catch (e) { console.warn('pattern', e); } }
    if (tile) { ctx.save(); ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore(); }

    // إطار مزدوج بلون الهوية
    const M = 36;
    ctx.strokeStyle = hex(th.accent, 0.8); ctx.lineWidth = 3; rr(ctx, M, M, W - 2 * M, H - 2 * M, 44); ctx.stroke();
    ctx.strokeStyle = hex(th.accent, 0.28); ctx.lineWidth = 1.5; rr(ctx, M + 14, M + 14, W - 2 * M - 28, H - 2 * M - 28, 34); ctx.stroke();

    // الترويسة: الشعار الرسمي (رقم المدرب لا يُعرض للزوار)
    const top = format === 'story' ? 150 : 100;
    const logo = tp.show.logo ? await loadImage(light ? LOGO.green : LOGO.cream) : null;
    if (logo) { const lh = 104, lw = lh * logo.width / logo.height; ctx.drawImage(logo, wide ? 96 : W - 96 - lw, top - 52, lw, lh); }

    // ---------- تخطيط المحتوى: يتكيّف مع عدد التخصصات (حتى 6) وطول الاسم والعنوان ----------
    const T = 70, limitY = tp.show.footer ? H - M - 14 - (wide ? 130 : 150) - 14 : H - M - 40;
    const title = tp.show.title && t.title ? t.title : '';
    const meta = tp.show.region ? regionsLabel(t, true, tp.maxRegions) : '';
    const stats = !tp.show.stats ? [] : [[t.years, x0.years], [t.hours, x0.hours], [t.programs, x0.programs]].filter(s => Number(s[0]));
    const chips = !tp.show.specs ? [] : Data.cardSpecs(t).slice(0, tp.maxSpecs).map(specName).filter(Boolean);
    const packRows = (fs, maxW) => {
      ctx.font = `600 ${fs}px ${UI}`; const rows = []; let row = [], rw = 0;
      chips.forEach(sp => { const w = ctx.measureText(sp).width + 48; if (row.length && rw + 14 + w > maxW) { rows.push({ row, rw }); row = []; rw = 0; } rw += (row.length ? 14 : 0) + w; row.push({ sp, w }); });
      if (row.length) rows.push({ row, rw });
      return rows;
    };
    const nameTxt = t.name || '', nameW = (ns, str) => { ctx.font = `900 ${ns}px ${HEAD}`; return ctx.measureText(str).width; };
    // الاسم: سطر واحد ما أمكن، وإلا سطران بحجم خط أصغر
    const fitName = (maxW, big, oneMin, twoMin) => {
      for (let ns = big; ns >= oneMin; ns -= 2) if (nameW(ns, nameTxt) <= maxW) return { lines: [nameTxt], ns };
      for (let ns = Math.min(big, oneMin + 6); ns >= twoMin; ns -= 2) { ctx.font = `900 ${ns}px ${HEAD}`; const ls = wrap(ctx, nameTxt, maxW, 2); if (ls.length <= 2 && ls.every(l => ctx.measureText(l).width <= maxW)) return { lines: ls, ns }; }
      for (let ns = twoMin; ns >= twoMin - 6; ns -= 2) { ctx.font = `900 ${ns}px ${HEAD}`; const ls = wrap(ctx, nameTxt, maxW, 3); if (ls.every(l => ctx.measureText(l).width <= maxW)) return { lines: ls, ns }; }   // أسماء طويلة جداً: ثلاثة أسطر
      ctx.font = `900 ${twoMin - 6}px ${HEAD}`; return { lines: wrap(ctx, nameTxt, maxW, 3), ns: twoMin - 6 };
    };
    const bigName = Math.round((wide ? 64 : String(t.name || '').length > 22 ? 56 : 66) * tp.nameScale / 100);
    const pillH = f => f + 30, rowH = f => f + 44;
    const D0 = wide ? 380 : format === 'story' ? 470 : 360, gap0 = format === 'story' ? 150 : 96;
    let wideLoc = 38, D, cx, cy, fs, rows, nm, tl = [], colW, ax, y0 = 0;

    if (!wide) {
      colW = W - 260; ax = W / 2;
      nm = fitName(colW, bigName, 44, 36);
      ctx.font = `600 32px ${BODY}`; tl = title ? wrap(ctx, title, colW, 2) : [];
      const endY = (d, f, n) => {
        let y = top + gap0 * d / D0 + d + 104 + (nm.lines.length - 1) * nm.ns * 1.15;
        if (tl.length) y += 66 + 52 * (tl.length - 1);
        if (meta) y += 72;
        if (stats.length) y += 44 + 112;
        if (n) y += 40 + (n - 1) * rowH(f) + pillH(f);
        return y;
      };
      let ok = false;
      for (const [f, dmin] of [[26, 320], [24, 300], [22, 260], [22, 220]]) {
        const r = packRows(f, W - 220);
        for (let d = D0; d >= Math.min(dmin, D0); d -= 10) if (endY(d, f, r.length) <= limitY) { D = d; fs = f; rows = r; ok = true; break; }
        if (ok) break;
      }
      if (!ok) { D = 220; fs = 22; rows = packRows(22, W - 220); }
      cx = W / 2; cy = top + gap0 * D / D0 + D / 2;
    } else {
      // العرضي: الصورة والاسم والموقع في عمود على اليمين، والعنوان والإحصاءات والتخصصات على يسارها
      const pw = 580, colR = W - 110;
      cx = colR - pw / 2; nm = fitName(pw, bigName, 52, 38);
      ctx.font = `700 36px ${UI}`; const ml = meta ? ctx.measureText(meta).width : 0, locSz = ml > pw - 50 ? 30 : 36;
      const below = 24 + 0.95 * nm.ns + (nm.lines.length - 1) * nm.ns * 1.12 + (meta ? 58 : 0) + 12;
      D = Math.max(240, Math.min(D0, limitY - T - 32 - below));
      const used = 32 + D + below, off = Math.max(0, (limitY - T - used) / 2);
      cy = T + off + 16 + D / 2; wideLoc = locSz;
      ax = cx - pw / 2 - 50; colW = ax - 96;
      ctx.font = `600 34px ${BODY}`; tl = title ? wrap(ctx, title, colW, 2) : [];
      const lo = 170, avail = limitY - lo;
      const need = f => { const n = rows.length; return (tl.length ? 34 + 52 * (tl.length - 1) + 14 : 0) + (stats.length ? 22 + 112 : 0) + (n ? 30 + (n - 1) * rowH(f) + pillH(f) : 0); };
      let h = 0;
      for (const f of [25, 23, 21]) { fs = f; rows = packRows(f, colW); h = need(f); if (h <= avail) break; }
      y0 = lo + Math.max(0, (avail - h) / 2);
    }
    const locSz = wideLoc;

    // الصورة الدائرية
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    ctx.beginPath(); ctx.arc(cx, cy, D / 2 + 16, 0, Math.PI * 2); ctx.fillStyle = th.accent; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, D / 2 + 6, 0, Math.PI * 2); ctx.fillStyle = th.b; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, D / 2, 0, Math.PI * 2); ctx.clip();
    const photo = t.noPhoto ? null : await loadImage(Data.photo(t));
    if (t.noPhoto) {
      const pg = ctx.createLinearGradient(cx - D / 2, cy - D / 2, cx + D / 2, cy + D / 2); pg.addColorStop(0, th.c); pg.addColorStop(1, th.a);
      ctx.fillStyle = pg; ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
      ctx.save(); ctx.translate(cx - D / 2, cy - D / 2); ctx.scale(D / 100, D / 100); ctx.fillStyle = th.accent;
      if (t.gender === 'f') ctx.fill(new Path2D(SYM_F));
      else { ctx.beginPath(); ctx.arc(50, 36, 17, 0, Math.PI * 2); ctx.fill(); ctx.fill(new Path2D(SYM_M_BODY)); }
      ctx.restore();
    } else if (photo) {
      const f = fit(t), s = Math.max(D / photo.width, D / photo.height), iw = photo.width * s, ih = photo.height * s;
      const ox = cx - D / 2 + D * f.x / 100, oy = cy - D / 2 + D * f.y / 100; // نقطة التكبير = نفس transform-origin في الصفحة
      ctx.translate(ox, oy); ctx.scale(f.z, f.z); ctx.translate(-ox, -oy);
      ctx.drawImage(photo, cx - D / 2 + (D - iw) * f.x / 100, cy - D / 2 + (D - ih) * f.y / 100, iw, ih);
    } else {
      const pg = ctx.createLinearGradient(cx - D / 2, cy - D / 2, cx + D / 2, cy + D / 2); pg.addColorStop(0, th.c); pg.addColorStop(1, th.a);
      ctx.fillStyle = pg; ctx.fillRect(cx - D / 2, cy - D / 2, D, D);
      const tmp = document.createElement('div'); tmp.innerHTML = initials(t.name);
      ctx.fillStyle = fg; ctx.font = `900 140px ${HEAD}`; ctx.textBaseline = 'middle'; ctx.fillText(tmp.textContent, cx, cy + 6); ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
    // شارة التوثيق
    if (tp.show.badge) {
      const bx = cx + D * 0.36, by = cy + D * 0.36;
      ctx.fillStyle = th.accent; seal(ctx, bx, by, wide ? 38 : 44); ctx.fill();
      ctx.strokeStyle = light ? '#FFFFFF' : th.b; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 13, by + 1); ctx.lineTo(bx - 3, by + 11); ctx.lineTo(bx + 15, by - 10); ctx.stroke();
    }

    // الاسم (تحت الصورة دائماً) ثم الموقع
    const drawName = (x, y) => {
      ctx.textAlign = 'center'; ctx.fillStyle = fg; ctx.font = `900 ${nm.ns}px ${HEAD}`;
      nm.lines.forEach((l, i) => ctx.fillText(l, x, y + i * nm.ns * 1.15));
      return y + (nm.lines.length - 1) * nm.ns * 1.15;
    };
    const drawMeta = (x, y, sz) => {
      ctx.font = `700 ${sz}px ${UI}`; ctx.fillStyle = hex(fg, 0.92);
      const mw = ctx.measureText(meta).width, sh = wide ? -16 : 0;
      ctx.textAlign = 'right'; ctx.fillText(meta, x + mw / 2 + sh, y);
      pin(ctx, x + mw / 2 + sh + 32 - 8 + 8, y - 10, wide ? 1 : 1.15, th.accent);
      ctx.textAlign = 'center';
    };
    const stat = (x, y, bw, bh) => {
      let sx = x;
      stats.forEach(([v, l]) => {
        rr(ctx, sx - bw, y, bw, bh, 24); ctx.fillStyle = hex(fg, 0.08); ctx.fill(); ctx.strokeStyle = hex(th.accent, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = fg; ctx.font = `900 ${wide ? 44 : 50}px ${HEAD}`; ctx.direction = 'ltr'; ctx.fillText(`${fmtNum(v)}+`, sx - bw / 2, y + bh * 0.5); ctx.direction = 'rtl';
        ctx.fillStyle = hex(fg, 0.72); ctx.font = `500 ${wide ? 22 : 24}px ${UI}`; ctx.fillText(l, sx - bw / 2, y + bh - 20);
        sx -= bw + (wide ? 20 : 24);
      });
    };
    const drawChips = (startX, y) => {
      ctx.font = `600 ${fs}px ${UI}`; ctx.textAlign = 'center';
      rows.forEach((r, i) => {
        let cxr = startX === 'center' ? W / 2 + r.rw / 2 : startX; const ry = y + i * rowH(fs);
        r.row.forEach(it => { rr(ctx, cxr - it.w, ry, it.w, pillH(fs), pillH(fs) / 2); ctx.fillStyle = hex(th.accent, light ? 0.1 : 0.14); ctx.fill(); ctx.strokeStyle = hex(th.accent, 0.5); ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = fg; ctx.fillText(it.sp, cxr - it.w / 2, ry + pillH(fs) * 0.66); cxr -= it.w + 14; });
      });
    };

    if (!wide) {
      let y = drawName(ax, cy + D / 2 + 104);
      if (tl.length) { ctx.font = `600 32px ${BODY}`; ctx.fillStyle = th.accent; ctx.textAlign = 'center'; tl.forEach((l, i) => { y += i ? 52 : 66; ctx.fillText(l, ax, y); }); }
      if (meta) { y += 72; drawMeta(ax, y, 38); }
      if (stats.length) { y += 44; stat(W / 2 + (stats.length * 250 + (stats.length - 1) * 24) / 2, y, 250, 112); y += 112; }
      if (rows.length) { y += 40; drawChips('center', y); }
    } else {
      const ny = drawName(cx, cy + D / 2 + 24 + 0.95 * nm.ns);
      if (meta) drawMeta(cx, ny + 58, locSz);
      let c = y0;
      if (tl.length) { ctx.font = `600 34px ${BODY}`; ctx.fillStyle = th.accent; ctx.textAlign = 'right'; tl.forEach((l, i) => ctx.fillText(l, ax, c + 34 + i * 52)); c += 34 + 52 * (tl.length - 1) + 14; }
      if (stats.length) { c += 22; stat(ax, c, 210, 112); c += 112; }
      if (rows.length) { c += 30; drawChips(ax, c); }
    }

    // التذييل: رمز QR + الرابط (التواصل عبر المنصة)
    if (tp.show.footer) {
      const fh = wide ? 130 : 150, fy = H - M - 14 - fh;
      ctx.fillStyle = light ? 'rgba(0,84,48,.07)' : 'rgba(0,0,0,.22)'; rr(ctx, M + 14, fy, W - 2 * M - 28, fh, 30); ctx.fill();
      if (hasQR) {
        try {
          const qr = window.qrcode(0, 'M'); qr.addData(profileUrl(t)); qr.make();
          const n = qr.getModuleCount(), size = wide ? 94 : 116, cell = size / n, qx = 104, qy = fy + (fh - size) / 2;
          ctx.fillStyle = '#fff'; rr(ctx, qx - 8, qy - 8, size + 16, size + 16, 12); ctx.fill();
          ctx.fillStyle = '#00331D';
          for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(qx + c * cell, qy + r * cell, Math.ceil(cell), Math.ceil(cell));
        } catch { /* ignore */ }
      }
      const r0 = W - 110, y1 = fy + (wide ? 50 : 56), y2 = fy + (wide ? 104 : 108);
      ctx.textAlign = 'right'; ctx.fillStyle = hex(fg, 0.85); ctx.font = `600 ${wide ? 26 : 27}px ${UI}`;
      ctx.fillText(x0.footLead, r0, y1);
      // اسم المنصة | الرابط في سطر واحد
      let bxr = r0; ctx.fillStyle = th.accent; ctx.font = `900 ${wide ? 38 : 40}px ${BRAND}`;
      ctx.fillText(x0.brand, bxr, y2); bxr -= ctx.measureText(x0.brand).width + 20;
      ctx.fillStyle = hex(fg, 0.5); ctx.font = `400 38px ${UI}`; ctx.fillText('|', bxr, y2 - 2); bxr -= ctx.measureText('|').width + 20;
      ctx.fillStyle = hex(fg, 0.85); ctx.font = `700 ${wide ? 30 : 32}px ${BRAND}`; ctx.direction = 'ltr'; ctx.fillText(x0.site, bxr, y2 - 2);
    }
    cv.photoFailed = !t.noPhoto && !!t.photoUrl && !photo;
    return cv;
  }

  const photoWarn = cv => cv.photoFailed && toast('تعذّر قراءة الصورة من الرابط؛ تأكد أن الملف مشارَك «لأي شخص لديه الرابط» وأنه رابط مباشر لصورة' + (why.length ? ` [${[...new Set(why)].join(',')}]` : ''), 'error');
  // رسم قابل للتصدير: إن كانت الصورة تُلوّث اللوحة (سياسة CORS) نعيد المحاولة بتجاوز الكاش، ثم بدون الصورة مع تنبيه
  const exportable = cv => { try { cv.getContext('2d').getImageData(0, 0, 1, 1); return true; } catch { return false; } };
  async function renderSafe(t, format, tpl) {
    // 4 محاولات: عادي، تجاوز الكاش، بلا صورة، ثم نسخة مبسّطة (بلا صورة ولا نقش) للمتصفحات الأضعف (Safari)
    why = [];
    let fallback = null;   // أفضل نتيجة صالحة للتصدير حتى الآن (قد تكون بلا صورة)
    for (const attempt of ['normal', 'bust', 'nophoto', 'plain']) {
      bust = attempt === 'bust'; plain = attempt === 'plain';
      try {
        const cv = await render(attempt === 'nophoto' || attempt === 'plain' ? { ...t, noPhoto: true } : t, format, tpl);
        if (exportable(cv)) {
          if (attempt === 'nophoto' || attempt === 'plain') cv.photoFailed = !t.noPhoto && !!t.photoUrl;
          if (cv.photoFailed && attempt === 'normal') { fallback = cv; continue; }   // فشلت الصورة فقط: نجرّب تجاوز الكاش
          return cv;
        }
        why.push('taint-' + attempt + (cv.photoFailed ? '(nophoto)' : ''));
      } catch (e) { console.warn('card render', attempt, e); why.push(attempt + ':' + (e && e.name) + ':' + String(e && e.message || '').slice(0, 50)); if (attempt === 'plain') throw e; }
      finally { bust = false; plain = false; }
    }
    if (fallback) return fallback;
    throw new Error('card render failed');
  }
  async function toBlob(t, format) {
    const cv = await renderSafe(t, format); photoWarn(cv);
    const blob = await new Promise(r => { try { cv.toBlob(r, 'image/png'); } catch { r(null); } });
    if (blob) return blob;
    // بعض الجوالات تعيد null عند ضغط لوحة كبيرة: نبني الملف من data URL
    const d = cv.toDataURL('image/png'), bin = atob(d.split(',')[1]), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: 'image/png' });
  }
  async function toJPEG(t, format = 'post') {
    const cv = await renderSafe(t, format);
    return { data: cv.toDataURL('image/jpeg', 0.86), photoFailed: cv.photoFailed };
  }
  const isApple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) || (/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent));
  // نافذة معاينة: على Safari يضمن ذلك الحفظ (ضغطة مطولة على الصورة أو زر المشاركة) حين يتعذر التنزيل المباشر
  function previewModal(blob, name) {
    const url = URL.createObjectURL(blob), file = new File([blob], name, { type: 'image/png' });
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    const m = modal(`<h3><i class="fa-solid fa-image"></i> بطاقتك جاهزة</h3>
      <img src="${url}" alt="بطاقة المدرب" style="width:100%;max-height:60vh;object-fit:contain;border-radius:12px">
      <p class="muted small">${canShare ? 'اضغط «حفظ / مشاركة» ثم اختر «حفظ الصورة»' : 'اضغط مطولاً على الصورة ثم اختر «إضافة إلى الصور» أو «حفظ الصورة»'}.</p>
      <div class="row" style="gap:8px;margin-top:8px">${canShare ? '<button class="btn" data-sh><i class="fa-solid fa-share-nodes"></i> حفظ / مشاركة</button>' : ''}<a class="btn ghost" href="${url}" download="${name}">تنزيل</a></div>`);
    const b = m.$('[data-sh]'); if (b) b.onclick = () => navigator.share({ files: [file] }).catch(() => {});
  }
  async function save(t, format = 'post') {
    toast('جارٍ تجهيز البطاقة بدقة عالية...');
    let blob, name = `sauditrainers-${(t.slug || 'card')}-${format}.png`;
    try { blob = await toBlob(t, format); }
    catch (e) { console.error(e); toast(`تعذّر إنشاء صورة البطاقة (${e && e.name ? e.name : 'خطأ'}: ${String(e && e.message || '').slice(0, 80)}): حدّث الصفحة وأعد المحاولة، وإن تكرر فأرسل هذه الرسالة للإدارة`, 'error'); return; }
    try {
      if (isApple) previewModal(blob, name); else { download(name, blob); toast('تم حفظ البطاقة'); }
    } catch (e) { console.error(e); try { previewModal(blob, name); } catch { toast('تعذّر عرض الصورة', 'error'); } }
  }
  async function share(t) {
    Analytics.event('share');
    const url = profileUrl(t);
    const text = `تعرّف على المدرب ${t.name}${t.title ? ' — ' + t.title : ''} عبر منصة مدرّبون سعوديّون`;
    try {
      const blob = await toBlob(t, 'post');
      const file = new File([blob], `${(t.slug || 'trainer')}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: t.name, text: `${text}\n${url}` }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    shareSheet(t);
  }

  /* ===================== مشاركة صفحة المدرب بلسانه (أيقونات المنصات) ===================== */
  const SHARE_PL = [
    { k: 'linkedin', name: 'لينكدإن', icon: 'fa-brands fa-linkedin-in' },
    { k: 'instagram', name: 'إنستقرام', icon: 'fa-brands fa-instagram' },
    { k: 'x', name: 'إكس', icon: 'fa-brands fa-x-twitter' },
    { k: 'whatsapp', name: 'واتساب', icon: 'fa-brands fa-whatsapp' }
  ];
  // أيقونات تُوضع تحت البطاقة؛ علامة المشاركة الصغيرة على كل أيقونة توضّح أنها مشاركة لا رابط حساب المدرب
  const shareIcons = () => `<div class="share-pl" role="group" aria-label="شارك صفحة المدرب">
      <span class="sp-l"><i class="fa-solid fa-share-nodes"></i> شارك صفحة المدرب</span>
      ${SHARE_PL.map(x => `<button type="button" class="spb ${x.k}" data-sp="${x.k}" title="مشاركة عبر ${x.name}" aria-label="مشاركة عبر ${x.name}"><i class="${x.icon}"></i><b class="spb-b"><i class="fa-solid fa-share"></i></b></button>`).join('')}
    </div>`;
  // طول التغريدة بحسب قواعد إكس: الرابط 23، والإيموجي وما بعد U+10FF بوزن 2
  const xLen = str => { let n = 0; String(str).replace(/https?:\/\/\S+/g, () => { n += 23; return ''; }).split('').forEach(ch => { n += ch.codePointAt(0) > 0x10FF && !/[ -⁯]/.test(ch) ? 2 : 1; }); return n; };
  // نص المنشور بلسان المدرب نفسه، مخصّص لكل منصة
  function memberPost(t, pl) {
    const link = profileUrl(t), name = t.name || '', title = (t.title || '').trim(), region = regionsLabel(t, true, 2);
    const sp = Data.cardSpecs(t).slice(0, 4).map(specName).filter(Boolean);
    const yrs = Number(t.years) ? `${fmtNum(t.years)} سنة` : '', hrs = Number(t.hours) ? `${fmtNum(t.hours)}+ ساعة تدريبية` : '', prg = Number(t.programs) ? `${fmtNum(t.programs)}+ برنامج ودورة` : '';
    const tags = '#مدرّبون_سعوديّون #تدريب';
    if (pl === 'x') {
      const build = ti => ['تعرّفوا على مسيرتي في عالم التدريب عبر منصة «مدرّبون سعوديّون» 🌟', ti, [region && `📍 ${region}`, yrs && `⏳ خبرة ${yrs}`].filter(Boolean).join(' · '), `بطاقتي وطلب التدريب 👇\n${link}`].filter(Boolean).join('\n\n').replace(/\n\n(📍|⏳)/, '\n\n$1');
      let ti = title, txt = build(ti);
      if (xLen(txt + '\n' + tags) <= 280) return txt + '\n' + tags;
      while (ti.length > 12 && xLen(build(ti + '…')) > 280) ti = ti.slice(0, -4).trim();
      return build(ti === title ? ti : ti + '…');
    }
    if (pl === 'linkedin') {
      const nums = [yrs && `خبرة ${yrs} في التدريب`, hrs, prg].filter(Boolean).join(' · ');
      return ['يسعدني أن أشارككم بطاقتي التعريفية في منصة «مدرّبون سعوديّون» 🌟', `أنا ${name}${title ? ' — ' + title : ''}.`, nums && `📊 ${nums}`, sp.length && `🎯 تخصصاتي: ${sp.join('، ')}`, region && `📍 ${region}`, `تعرّفوا على مسيرتي وتواصلوا معي لطلب التدريب عبر المنصة:\n${link}`, `${tags} #تطوير_المهارات`].filter(Boolean).join('\n\n');
    }
    if (pl === 'instagram') {
      return ['تعرّفوا على مسيرتي في عالم التدريب عبر منصة «مدرّبون سعوديّون» 🌟', `${name}${title ? '\n' + title : ''}`, [region && `📍 ${region}`, yrs && `⏳ خبرة ${yrs}`].filter(Boolean).join(' · '), sp.length && `🎯 ${sp.join(' | ')}`, `بطاقتي وطلب التدريب 👇\n${link}`, `${tags} #تطوير_الذات`].filter(Boolean).join('\n\n');
    }
    return `السلام عليكم 👋\nتعرّف على مسيرتي في عالم التدريب عبر منصة «مدرّبون سعوديّون»${title ? '\n' + title : ''}\nبطاقتي وطلب التدريب 👇\n${link}`;
  }
  async function shareTo(t, pl) {
    Analytics.event('share');
    const text = memberPost(t, pl), enc = encodeURIComponent;
    if (pl === 'whatsapp') { window.open(`https://wa.me/?text=${enc(text)}`, '_blank', 'noopener'); return; }
    if (pl === 'x') { window.open(`https://x.com/intent/post?text=${enc(text)}`, '_blank', 'noopener'); return; }
    if (pl === 'linkedin') { copyText(text, 'نُسخ النص أيضاً — إن لم يظهر في نافذة لينكدإن فالصقه'); window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${enc(text)}`, '_blank', 'noopener'); return; }
    // إنستقرام لا يوفّر رابط مشاركة ويب: على الجوال نرسل الصورة والنص عبر قائمة المشاركة، وإلا ننسخ النص ونعرض الصور للتنزيل
    try {
      if (navigator.canShare) {
        const file = new File([await toBlob(t, 'post')], `${t.slug || 'trainer'}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    copyText(text, 'نُسخ نص المنشور');
    const m = modal(`<h3><i class="fa-brands fa-instagram"></i> المشاركة على إنستقرام</h3>
      <p class="muted small">نُسخ نص المنشور إلى الحافظة. نزّل الصورة ثم أنشئ منشوراً أو قصة في إنستقرام وألصق النص.</p>
      <div class="share-grid"><button class="sh im" data-img="post"><i class="fa-solid fa-image"></i>صورة منشور</button><button class="sh st" data-img="story"><i class="fa-solid fa-mobile-screen"></i>صورة قصة</button><button class="sh cp" data-copy><i class="fa-solid fa-copy"></i>نسخ النص</button></div>
      <a class="btn wide" target="_blank" rel="noopener" href="https://www.instagram.com/"><i class="fa-brands fa-instagram"></i> فتح إنستقرام</a>`);
    m.el.querySelectorAll('[data-img]').forEach(b => { b.onclick = () => save(t, b.dataset.img); });
    m.$('[data-copy]').onclick = () => copyText(text, 'نُسخ نص المنشور');
  }

  function shareSheet(t) {
    const url = profileUrl(t);
    const text = `تعرّف على المدرب ${t.name}${t.title ? ' — ' + t.title : ''}`;
    const u = encodeURIComponent(url), tx = encodeURIComponent(text);
    const m = modal(`<h3><i class="fa-solid fa-share-nodes"></i> مشاركة البطاقة</h3>
      <div class="share-grid">
        <a class="sh wa" target="_blank" rel="noopener" href="https://wa.me/?text=${tx}%0A${u}"><i class="fa-brands fa-whatsapp"></i>واتساب</a>
        <a class="sh x" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${tx}&url=${u}"><i class="fa-brands fa-x-twitter"></i>إكس</a>
        <a class="sh li" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}"><i class="fa-brands fa-linkedin-in"></i>لينكدإن</a>
        <a class="sh tg" target="_blank" rel="noopener" href="https://t.me/share/url?url=${u}&text=${tx}"><i class="fa-brands fa-telegram"></i>تيليجرام</a>
        <button class="sh cp" data-copy><i class="fa-solid fa-link"></i>نسخ الرابط</button>
        <button class="sh im" data-img="post"><i class="fa-solid fa-image"></i>صورة منشور</button>
        <button class="sh st" data-img="story"><i class="fa-solid fa-mobile-screen"></i>صورة قصة</button>
        <button class="sh wd" data-img="wide"><i class="fa-solid fa-panorama"></i>صورة عرضية</button>
      </div>
      <p class="muted small">صور المنشور (4:5) والقصة (9:16) مناسبة لإنستقرام وسناب ولينكدإن، وفيها رمز QR يفتح صفحة المدرب مباشرة.</p>`);
    m.$('[data-copy]').onclick = () => copyText(url, 'تم نسخ رابط البطاقة');
    m.el.querySelectorAll('[data-img]').forEach(b => { b.onclick = () => save(t, b.dataset.img); });
  }

  return { full, mini, avatar, symbol, fit, imgStyle, save, share, shareSheet, shareIcons, shareTo, memberPost, render, toJPEG, themeVars };
})();
