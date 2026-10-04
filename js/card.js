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
  function loadImage(src) {
    return new Promise(res => {
      if (!src) return res(null);
      const img = new Image();
      if (/^https?:/.test(src)) { img.crossOrigin = 'anonymous'; if (bust) src += (src.includes('?') ? '&' : '?') + '_cb=' + Date.now(); }
      img.referrerPolicy = 'no-referrer';
      img.onload = () => res(img); img.onerror = () => res(null);
      img.src = src;
    });
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
  const SIZES = { post: [1080, 1350], story: [1080, 1920], wide: [1600, 900] };

  async function render(t, format = 'post', tpl) {
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
    const tile = plain || !tp.show.pattern || !tp.patternOpacity ? null : await loadImage(Pattern.url(light ? '#005430' : th.accent, light ? 0.1 : 0.11));
    if (tile) { ctx.save(); ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore(); }

    // إطار مزدوج بلون الهوية
    const M = 36;
    ctx.strokeStyle = hex(th.accent, 0.8); ctx.lineWidth = 3; rr(ctx, M, M, W - 2 * M, H - 2 * M, 44); ctx.stroke();
    ctx.strokeStyle = hex(th.accent, 0.28); ctx.lineWidth = 1.5; rr(ctx, M + 14, M + 14, W - 2 * M - 28, H - 2 * M - 28, 34); ctx.stroke();

    // الترويسة: الشعار الرسمي (رقم المدرب لا يُعرض للزوار)
    const top = format === 'story' ? 150 : 100;
    const logo = tp.show.logo ? await loadImage(light ? LOGO.green : LOGO.cream) : null;
    if (logo) { const lh = 104, lw = lh * logo.width / logo.height; ctx.drawImage(logo, wide ? 96 : W - 96 - lw, top - 52, lw, lh); }

    // الصورة الدائرية
    const D = wide ? 380 : format === 'story' ? 470 : 360;
    const cx = wide ? W - 100 - 16 - D / 2 : W / 2, cy = wide ? 66 + (H - M - 14 - 130 - 66) / 2 + 6 : top + (format === 'story' ? 150 : 96) + D / 2;
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
      ctx.fillStyle = th.accent; seal(ctx, bx, by, 44); ctx.fill();
      ctx.strokeStyle = light ? '#FFFFFF' : th.b; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 13, by + 1); ctx.lineTo(bx - 3, by + 11); ctx.lineTo(bx + 15, by - 10); ctx.stroke();
    }

    // الاسم والسطر التعريفي والمنطقة والإحصاءات والتخصصات (تتوسط في العمودي، وتحاذي يمين العمود في العرضي)
    const ax = wide ? cx - D / 2 - 70 : W / 2, colW = wide ? ax - 96 : W - 260;
    ctx.textAlign = wide ? 'right' : 'center';
    let y = wide ? 238 : cy + D / 2 + 104;
    let ns = Math.round((wide ? 76 : String(t.name || '').length > 22 ? 56 : 66) * tp.nameScale / 100);
    ctx.fillStyle = fg; ctx.font = `900 ${ns}px ${HEAD}`;
    while (ns > 36 && ctx.measureText(t.name || '').width > colW) { ns -= 4; ctx.font = `900 ${ns}px ${HEAD}`; }
    ctx.fillText(t.name || '', ax, y);
    if (tp.show.title && t.title) {
      ctx.font = `600 ${wide ? 34 : 32}px ${BODY}`; ctx.fillStyle = th.accent;
      wrap(ctx, t.title, colW, 2).forEach((l, i) => { y += i ? 52 : 66; ctx.fillText(l, ax, y); });
    }
    const meta = tp.show.region ? regionsLabel(t, true, tp.maxRegions) : '';
    if (meta) {
      y += wide ? 76 : 72; ctx.font = `700 ${wide ? 36 : 38}px ${UI}`; ctx.fillStyle = hex(fg, 0.92);
      const mw = ctx.measureText(meta).width, pr = ax + (wide ? 0 : mw / 2 + 40);
      ctx.textAlign = 'right'; ctx.fillText(meta, wide ? ax - 48 : W / 2 + mw / 2, y);
      pin(ctx, wide ? ax - 17 : pr - 8, y - 10, 1.15, th.accent);
      ctx.textAlign = wide ? 'right' : 'center';
    }

    const stats = !tp.show.stats ? [] : [[t.years, x0.years], [t.hours, x0.hours], [t.programs, x0.programs]].filter(s => Number(s[0]));
    if (stats.length) {
      y += wide ? 40 : 44;
      const bw = wide ? 210 : 250, bh = wide ? 112 : 112, gap = wide ? 20 : 24, total = stats.length * bw + (stats.length - 1) * gap;
      let x = wide ? ax : W / 2 + total / 2;
      ctx.textAlign = 'center';
      stats.forEach(([v, l]) => {
        rr(ctx, x - bw, y, bw, bh, 24); ctx.fillStyle = hex(fg, 0.08); ctx.fill(); ctx.strokeStyle = hex(th.accent, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = fg; ctx.font = `900 ${wide ? 44 : 50}px ${HEAD}`; ctx.direction = 'ltr'; ctx.fillText(`${fmtNum(v)}+`, x - bw / 2, y + bh * 0.5); ctx.direction = 'rtl';
        ctx.fillStyle = hex(fg, 0.72); ctx.font = `500 ${wide ? 22 : 24}px ${UI}`; ctx.fillText(l, x - bw / 2, y + bh - 20);
        x -= bw + gap;
      });
      y += bh;
    }

    const sp = !tp.show.specs ? [] : Data.cardSpecs(t).slice(0, Math.min(tp.maxSpecs, format === 'story' ? 6 : 4)).map(specName);
    if (sp.length) {
      y += wide ? 34 : 40; ctx.font = `600 ${wide ? 25 : 26}px ${UI}`; ctx.textAlign = 'center';
      const rows = []; let row = [], rw = 0; const maxW = wide ? colW : W - 220;
      sp.forEach(s => { const w = ctx.measureText(s).width + 48; if (row.length && rw + 14 + w > maxW) { rows.push({ row, rw }); row = []; rw = 0; } rw += (row.length ? 14 : 0) + w; row.push({ s, w }); });
      if (row.length) rows.push({ row, rw });
      const limitY = tp.show.footer ? H - M - 14 - (wide ? 130 : 150) - 24 : H - M - 40, rowH = wide ? 64 : 70;
      rows.slice(0, wide ? 2 : 3).filter((_, i) => y + (i + 1) * rowH - 14 <= limitY).forEach(r => {
        let x = wide ? ax : W / 2 + r.rw / 2;
        r.row.forEach(it => { rr(ctx, x - it.w, y, it.w, wide ? 52 : 56, 28); ctx.fillStyle = hex(th.accent, light ? 0.1 : 0.14); ctx.fill(); ctx.strokeStyle = hex(th.accent, 0.5); ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = fg; ctx.fillText(it.s, x - it.w / 2, y + (wide ? 35 : 37)); x -= it.w + 14; });
        y += wide ? 64 : 70;
      });
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

  const photoWarn = cv => cv.photoFailed && toast('تعذّر قراءة الصورة من الرابط؛ تأكد أن الملف مشارَك «لأي شخص لديه الرابط» وأنه رابط مباشر لصورة', 'error');
  // رسم قابل للتصدير: إن كانت الصورة تُلوّث اللوحة (سياسة CORS) نعيد المحاولة بتجاوز الكاش، ثم بدون الصورة مع تنبيه
  const exportable = cv => { try { cv.getContext('2d').getImageData(0, 0, 1, 1); return true; } catch { return false; } };
  async function renderSafe(t, format, tpl) {
    // 4 محاولات: عادي، تجاوز الكاش، بلا صورة، ثم نسخة مبسّطة (بلا صورة ولا نقش) للمتصفحات الأضعف (Safari)
    for (const attempt of ['normal', 'bust', 'nophoto', 'plain']) {
      bust = attempt === 'bust'; plain = attempt === 'plain';
      try {
        const cv = await render(attempt === 'nophoto' || attempt === 'plain' ? { ...t, noPhoto: true } : t, format, tpl);
        if (exportable(cv)) { if (attempt === 'nophoto' || attempt === 'plain') cv.photoFailed = !t.noPhoto && !!t.photoUrl; return cv; }
      } catch (e) { console.warn('card render', attempt, e); if (attempt === 'plain') throw e; }
      finally { bust = false; plain = false; }
    }
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

  return { full, mini, avatar, symbol, fit, imgStyle, save, share, shareSheet, render, toJPEG, themeVars };
})();
