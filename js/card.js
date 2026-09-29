/* البطاقة التعريفية للمدرب: مكوّن HTML تفاعلي + تصدير صورة عالية الدقة للمشاركة (منشور 4:5 وقصة 9:16) */

const LINKS = [
  { k: 'whatsapp', name: 'واتساب', icon: 'fa-brands fa-whatsapp', href: v => waLink(v) },
  { k: 'email', name: 'البريد', icon: 'fa-solid fa-envelope', href: v => (validEmail(v) ? `mailto:${String(v).trim()}` : '') },
  { k: 'linkedin', name: 'لينكدإن', icon: 'fa-brands fa-linkedin-in', href: safeUrl },
  { k: 'x', name: 'إكس', icon: 'fa-brands fa-x-twitter', href: v => safeUrl(/^@/.test(v) ? `x.com/${v.slice(1)}` : v) },
  { k: 'instagram', name: 'إنستقرام', icon: 'fa-brands fa-instagram', href: v => safeUrl(/^@/.test(v) ? `instagram.com/${v.slice(1)}` : v) },
  { k: 'youtube', name: 'يوتيوب', icon: 'fa-brands fa-youtube', href: safeUrl },
  { k: 'website', name: 'الموقع', icon: 'fa-solid fa-globe', href: safeUrl }
];
const linkItems = t => LINKS.map(l => ({ ...l, url: t.links?.[l.k] ? l.href(t.links[l.k]) : '' })).filter(l => l.url);

// نقش هندسي (نجمة ثمانية) بلون الثيم — يُستخدم خلفية للبطاقة
const starPattern = (color = '#fff', op = 0.09) => `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'><g fill='none' stroke='${color}' stroke-opacity='${op}' stroke-width='1.1'><path d='M28 6l6.4 15.6L50 28l-15.6 6.4L28 50l-6.4-15.6L6 28l15.6-6.4z'/><rect x='16' y='16' width='24' height='24' transform='rotate(45 28 28)'/><circle cx='28' cy='28' r='4'/><path d='M0 0l8 8M56 0l-8 8M0 56l8-8M56 56l-8-8'/></g></svg>`).replace(/'/g, '%27')}')`;

const Card = (() => {
  const brandMark = (size = 28) => `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mk${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9CF8C"/><stop offset="1" stop-color="#B98B33"/></linearGradient></defs><path d="M32 4l7.5 18.2L58 29.5l-18.5 7.4L32 60l-7.5-23.1L6 29.5l18.5-7.3z" fill="url(#mk${size})"/><circle cx="32" cy="24" r="6" fill="#0A3D2A"/><path d="M21 44c1.6-7 6-11 11-11s9.4 4 11 11" fill="#0A3D2A"/></svg>`;

  function avatar(t, cls = '') {
    const p = Data.photo(t);
    return p ? `<img class="${cls}" src="${esc(p)}" alt="${esc(t.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'${cls} ph',innerHTML:'${initials(t.name).replace(/'/g, '')}'}))">`
      : `<span class="${cls} ph">${initials(t.name)}</span>`;
  }
  const themeVars = t => { const th = themeOf(t.theme); return `--a:${th.a};--b:${th.b};--c:${th.c};--acc:${th.accent};--pat:${starPattern(th.accent, 0.13)}`; };

  const stat = (v, l) => (Number(v) ? `<div class="tc-stat"><b class="num">${fmtNum(v)}${Number(v) >= 1000 ? '' : '+'}</b><span>${l}</span></div>` : '');

  // البطاقة الكاملة (صفحة المدرب والمعاينة ولوحة المدرب)
  function full(t, { preview = false } = {}) {
    const sp = Data.specs(t), md = Data.modes(t);
    const stats = [stat(t.years, 'سنة خبرة'), stat(t.hours, 'ساعة تدريبية'), stat(t.programs, 'برنامج ودورة')].filter(Boolean);
    return `<article class="tcard full" data-tilt="8" style="${themeVars(t)}">
      <div class="tc-glow"></div><div class="tc-holo"></div>
      <header class="tc-top">
        <span class="tc-brand">${brandMark(26)}<span>مدرّبون سعوديّون</span></span>
        ${t.code ? `<span class="tc-code num">${esc(t.code)}</span>` : `<span class="tc-code">معاينة</span>`}
      </header>
      <div class="tc-arch">${avatar(t, 'tc-photo')}<span class="tc-verified" title="مدرب موثّق"><i class="fa-solid fa-certificate"></i><i class="fa-solid fa-check"></i></span></div>
      <h2 class="tc-name">${esc(t.name || 'اسم المدرب')}</h2>
      ${t.title ? `<p class="tc-title">${esc(t.title)}</p>` : ''}
      <div class="tc-meta">
        ${t.region ? `<span><i class="fa-solid fa-location-dot"></i>${esc(regionName(t.region))}${t.city ? ' · ' + esc(t.city) : ''}</span>` : ''}
        ${md.map(m => DELIVERY.find(d => d.k === m)).filter(Boolean).map(d => `<span><i class="fa-solid ${d.icon}"></i>${d.name}</span>`).join('')}
      </div>
      ${stats.length ? `<div class="tc-stats">${stats.join('')}</div>` : ''}
      ${sp.length ? `<div class="tc-chips">${sp.slice(0, 5).map(s => `<span><i class="fa-solid ${specOf(s)?.icon || 'fa-shapes'}"></i>${esc(specName(s))}</span>`).join('')}</div>` : ''}
      ${preview ? '' : linkItems(t).length ? `<div class="tc-links">${linkItems(t).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" data-click="${esc(t.id)}" title="${l.name}"><i class="${l.icon}"></i></a>`).join('')}</div>` : ''}
      <footer class="tc-foot"><span>sauditrainers.sa</span><span class="tc-bar"></span></footer>
    </article>`;
  }

  // البطاقة المصغرة (دليل المدربين)
  function mini(t, i = 0) {
    const sp = Data.specs(t);
    return `<a class="tmini reveal" href="#/t/${esc(encodeURIComponent(t.slug || t.id))}" style="${themeVars(t)};--d:${Math.min(i, 12) * 40}ms" data-tilt="6">
      <div class="tm-head"><div class="tm-glow"></div>${t.featured ? '<span class="tm-star" title="مدرب مميز"><i class="fa-solid fa-star"></i></span>' : ''}<span class="tm-code num">${esc(t.code || '')}</span></div>
      <div class="tm-arch">${avatar(t, 'tm-photo')}</div>
      <div class="tm-body">
        <h3>${esc(t.name)}<i class="fa-solid fa-circle-check tm-ok" title="موثّق"></i></h3>
        <p class="tm-title">${esc(t.title || '')}</p>
        <div class="tm-meta">${t.region ? `<span><i class="fa-solid fa-location-dot"></i>${esc(regionName(t.region))}</span>` : ''}${Number(t.years) ? `<span><i class="fa-solid fa-hourglass-half"></i><b class="num">${esc(t.years)}</b> سنة</span>` : ''}</div>
        <div class="tm-chips">${sp.slice(0, 3).map(s => `<span>${esc(specName(s))}</span>`).join('')}${sp.length > 3 ? `<span class="more num">+${sp.length - 3}</span>` : ''}</div>
      </div>
      <span class="tm-go">عرض البطاقة <i class="fa-solid fa-arrow-left"></i></span>
    </a>`;
  }

  /* ===================== تصدير الصورة ===================== */
  const HEAD = "'Cairo', 'Noto Sans Arabic', sans-serif";
  const UI = "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif";
  const BODY = "'Noto Sans Arabic', 'IBM Plex Sans Arabic', sans-serif";

  function loadImage(src) {
    return new Promise(res => {
      if (!src) return res(null);
      const img = new Image();
      if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
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
    return Promise.race([loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'), new Promise(r => setTimeout(() => r(false), 5000))]).then(() => !!window.qrcode);
  }
  async function ensureFonts() {
    try {
      await Promise.all([`900 60px ${HEAD}`, `800 40px ${HEAD}`, `600 26px ${UI}`, `700 26px ${UI}`, `400 26px ${BODY}`, `600 30px ${BODY}`].map(f => document.fonts.load(f, 'مدرب')));
      await document.fonts.ready;
    } catch { /* ignore */ }
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // شكل القوس (نافذة نجدية): نصف دائرة أعلى ومستطيل أسفل
  function arch(ctx, x, y, w, h, r = 22) {
    const rad = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + rad);
    ctx.arc(x + rad, y + rad, rad, Math.PI, 0);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.closePath();
  }
  function star(ctx, cx, cy, R) {
    const r = R * 0.42;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8; const d = i % 2 ? r : R; ctx.lineTo(cx + d * Math.cos(a), cy + d * Math.sin(a)); }
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

  async function render(t, format = 'post') {
    await ensureFonts();
    const hasQR = await ensureQR();
    const th = themeOf(t.theme);
    const W = 1080, H = format === 'story' ? 1920 : 1350;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.direction = 'rtl'; ctx.textAlign = 'center';

    // الخلفية: تدرج + توهج + نقش هندسي
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, th.a); g.addColorStop(0.55, th.b); g.addColorStop(1, th.a);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.3, 20, W * 0.5, H * 0.3, W * 0.8);
    glow.addColorStop(0, hex(th.c, 0.55)); glow.addColorStop(1, hex(th.c, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = hex(th.accent, 0.08); ctx.lineWidth = 2;
    for (let y = -40; y < H + 80; y += 112) for (let x = -40; x < W + 80; x += 112) { star(ctx, x + ((y / 112) % 2 ? 56 : 0), y, 38); ctx.stroke(); }
    ctx.restore();

    // إطار ذهبي مزدوج
    const M = 36;
    ctx.strokeStyle = hex(th.accent, 0.85); ctx.lineWidth = 3; rr(ctx, M, M, W - 2 * M, H - 2 * M, 44); ctx.stroke();
    ctx.strokeStyle = hex(th.accent, 0.3); ctx.lineWidth = 1.5; rr(ctx, M + 14, M + 14, W - 2 * M - 28, H - 2 * M - 28, 34); ctx.stroke();

    // الترويسة
    const top = format === 'story' ? 150 : 96;
    const mark = await loadImage('assets/mark.svg');
    if (mark) ctx.drawImage(mark, W - 152, top - 22, 56, 56); else { ctx.fillStyle = th.accent; star(ctx, W - 124, top + 6, 26); ctx.fill(); }
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = `800 34px ${HEAD}`;
    ctx.fillText('مدرّبون سعوديّون', W - 164, top + 18);
    ctx.textAlign = 'left'; ctx.font = `700 28px ${UI}`;
    const code = t.code || '';
    if (code) {
      const cw = ctx.measureText(code).width + 44;
      rr(ctx, 96, top - 22, cw, 50, 25); ctx.strokeStyle = hex(th.accent, 0.9); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = th.accent; ctx.direction = 'ltr'; ctx.fillText(code, 118, top + 12); ctx.direction = 'rtl';
    }
    ctx.textAlign = 'center';

    // الصورة داخل قوس
    const aw = format === 'story' ? 470 : 400, ah = aw * 1.18;
    const ax = (W - aw) / 2, ay = top + (format === 'story' ? 110 : 70);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    arch(ctx, ax - 12, ay - 12, aw + 24, ah + 24, 34); ctx.fillStyle = th.accent; ctx.fill(); ctx.restore();
    ctx.save(); arch(ctx, ax, ay, aw, ah, 26); ctx.clip();
    const photo = await loadImage(Data.photo(t));
    if (photo) {
      const s = Math.max(aw / photo.width, ah / photo.height);
      ctx.drawImage(photo, ax + (aw - photo.width * s) / 2, ay + (ah - photo.height * s) * 0.3, photo.width * s, photo.height * s);
    } else {
      const pg = ctx.createLinearGradient(ax, ay, ax + aw, ay + ah); pg.addColorStop(0, th.c); pg.addColorStop(1, th.a);
      ctx.fillStyle = pg; ctx.fillRect(ax, ay, aw, ah);
      const tmp = document.createElement('div'); tmp.innerHTML = initials(t.name);
      ctx.fillStyle = '#fff'; ctx.font = `900 150px ${HEAD}`; ctx.textBaseline = 'middle'; ctx.fillText(tmp.textContent, W / 2, ay + ah / 2); ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
    // شارة التوثيق
    const bx = ax + aw - 18, by = ay + ah - 30;
    ctx.fillStyle = th.accent; star(ctx, bx, by, 46); ctx.fill();
    ctx.strokeStyle = th.a; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(bx - 13, by + 1); ctx.lineTo(bx - 3, by + 11); ctx.lineTo(bx + 15, by - 10); ctx.stroke();

    // الاسم واللقب
    let y = ay + ah + 100;
    ctx.fillStyle = '#fff'; ctx.font = `900 ${String(t.name || '').length > 22 ? 56 : 66}px ${HEAD}`;
    ctx.fillText(t.name || '', W / 2, y);
    ctx.font = `600 32px ${BODY}`; ctx.fillStyle = th.accent;
    wrap(ctx, t.title, W - 260, 2).forEach(l => { y += 54; ctx.fillText(l, W / 2, y); });
    const meta = [regionName(t.region), ...Data.modes(t).map(m => DELIVERY.find(d => d.k === m)?.name).filter(Boolean)].filter(Boolean).join('  ·  ');
    if (meta) { y += 52; ctx.font = `500 27px ${UI}`; ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.fillText(meta, W / 2, y); }

    // الإحصاءات
    const stats = [[t.years, 'سنة خبرة'], [t.hours, 'ساعة تدريبية'], [t.programs, 'برنامج ودورة']].filter(s => Number(s[0]));
    if (stats.length) {
      y += 50; const bw = 250, gap = 24, total = stats.length * bw + (stats.length - 1) * gap;
      let x = W / 2 + total / 2;
      stats.forEach(([v, l]) => {
        rr(ctx, x - bw, y, bw, 124, 24); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill(); ctx.strokeStyle = hex(th.accent, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `900 50px ${HEAD}`; ctx.direction = 'ltr'; ctx.fillText(`${fmtNum(v)}+`, x - bw / 2, y + 62); ctx.direction = 'rtl';
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `500 24px ${UI}`; ctx.fillText(l, x - bw / 2, y + 102);
        x -= bw + gap;
      });
      y += 124;
    }

    // التخصصات
    const sp = Data.specs(t).slice(0, format === 'story' ? 6 : 4).map(specName);
    if (sp.length) {
      y += 40; ctx.font = `600 26px ${UI}`;
      const rows = []; let row = [], rw = 0; const maxW = W - 220;
      sp.forEach(s => { const w = ctx.measureText(s).width + 48; if (row.length && rw + 14 + w > maxW) { rows.push({ row, rw }); row = []; rw = 0; } rw += (row.length ? 14 : 0) + w; row.push({ s, w }); });
      if (row.length) rows.push({ row, rw });
      rows.slice(0, 3).forEach(r => {
        let x = W / 2 + r.rw / 2;
        r.row.forEach(it => { rr(ctx, x - it.w, y, it.w, 56, 28); ctx.fillStyle = hex(th.accent, 0.16); ctx.fill(); ctx.strokeStyle = hex(th.accent, 0.55); ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(it.s, x - it.w / 2, y + 37); x -= it.w + 14; });
        y += 70;
      });
    }

    // التذييل: رمز QR + الرابط
    const fy = H - M - 14 - 150;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(ctx, M + 14, fy, W - 2 * M - 28, 150, 30); ctx.fill();
    const url = profileUrl(t);
    if (hasQR) {
      try {
        const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
        const n = qr.getModuleCount(), size = 116, cell = size / n, qx = 104, qy = fy + 17;
        ctx.fillStyle = '#fff'; rr(ctx, qx - 8, qy - 8, size + 16, size + 16, 12); ctx.fill();
        ctx.fillStyle = th.a;
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(qx + c * cell, qy + r * cell, Math.ceil(cell), Math.ceil(cell));
      } catch { /* ignore */ }
    }
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = `800 34px ${HEAD}`;
    ctx.fillText('للتواصل وطلب التدريب', W - 110, fy + 64);
    ctx.fillStyle = th.accent; ctx.font = `600 28px ${UI}`; ctx.direction = 'ltr'; ctx.textAlign = 'right';
    ctx.fillText('sauditrainers.sa', W - 110, fy + 110);
    return cv;
  }

  async function toBlob(t, format) {
    const cv = await render(t, format);
    return new Promise(r => cv.toBlob(r, 'image/png'));
  }
  async function save(t, format = 'post') {
    toast('جارٍ تجهيز البطاقة بدقة عالية...');
    try { download(`sauditrainers-${(t.code || 'card').toLowerCase()}-${format}.png`, await toBlob(t, format)); toast('تم حفظ البطاقة'); }
    catch (e) { console.error(e); toast('تعذّر إنشاء صورة البطاقة (تأكد أن رابط الصورة متاح للعامة)', 'error'); }
  }
  async function share(t) {
    const url = profileUrl(t);
    const text = `تعرّف على المدرب ${t.name}${t.title ? ' — ' + t.title : ''} عبر منصة مدرّبون سعوديّون`;
    try {
      const blob = await toBlob(t, 'post');
      const file = new File([blob], `${(t.code || 'trainer').toLowerCase()}.png`, { type: 'image/png' });
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
      </div>
      <p class="muted small">صور المنشور (4:5) والقصة (9:16) مناسبة لإنستقرام وسناب ولينكدإن، وفيها رمز QR يفتح صفحتك مباشرة.</p>`);
    m.$('[data-copy]').onclick = () => copyText(url, 'تم نسخ رابط البطاقة');
    m.el.querySelectorAll('[data-img]').forEach(b => { b.onclick = () => save(t, b.dataset.img); });
  }

  return { full, mini, avatar, brandMark, save, share, shareSheet, render };
})();
