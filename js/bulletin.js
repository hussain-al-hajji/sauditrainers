/* «نشرة المدربين»: تحويل أخبار المدربين المختارة إلى صفحات بمقاس منشور إنستقرام الطولي (1080×1350)
 * غلاف بهوية المنصة ثم صفحات للأخبار باسم المدرب وصورته وسطره التعريفي ورمز QR لصفحته، وتصديرها صوراً (ZIP) أو ملف PDF.
 * أنماط التوزيع: «single» خبر في كل صفحة · «trainer» صفحة لكل مدرب (تتمتها في صفحة تالية) · «compact» عدة مدربين في الصفحة الواحدة. */

const Bulletin = (() => {
  const W = 1080, H = 1350, PX = 44, CW = W - 2 * PX, TOP = 205, BOT = H - 118, GAP = 26;
  const C = { g950: '#001A0E', g900: '#002E1A', g800: '#005430', g700: '#0B6A3E', g100: '#E2F0E4', sage: '#C9DAB4', cream: '#EEF3E5', paper: '#F7F9F3', ink: '#0D2418', ink2: '#3A5244', muted: '#6A7F72', line: '#E1E8DC' };
  const K = () => Card.kit;
  const kindName = k => (News.kinds.find(x => x[0] === k) || News.kinds[0])[1];
  const dateAr = (ts, y) => new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', ...(y ? { year: 'numeric' } : {}) });
  const rangeTxt = (from, to) => (from && to ? (dateAr(from) === dateAr(to) ? dateAr(from, true) : `${dateAr(from)} – ${dateAr(to, true)}`) : '');
  const collapse = s => String(s || '').replace(/\s*\n+\s*/g, ' ').trim();

  let FONT = {};
  let usePhotos = true;

  /* ---------- أدوات رسم ---------- */
  function rrect(ctx, x, y, w, h, r, fill, stroke, lw = 1.5) { K().rr(ctx, x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
  function txt(ctx, s, x, y, { font, color, align = 'right', dir = 'rtl' }) { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.direction = dir; ctx.fillText(s, x, y); ctx.direction = 'rtl'; }
  function fitFont(ctx, s, weight, maxPx, minPx, maxW, family) { let fs = maxPx; for (; fs > minPx; fs -= 2) { ctx.font = `${weight} ${fs}px ${family}`; if (ctx.measureText(s).width <= maxW) break; } return fs; }
  function pill(ctx, s, rightX, cy, { bg = C.g100, fg = C.g800, fs = 22 } = {}) {
    ctx.font = `700 ${fs}px ${FONT.body}`; const w = ctx.measureText(s).width + 34, h = fs + 20;
    rrect(ctx, rightX - w, cy - h / 2, w, h, h / 2, bg); txt(ctx, s, rightX - w / 2, cy + fs * 0.35, { font: ctx.font, color: fg, align: 'center' }); return w;
  }
  function qr(ctx, url, x, y, size) {
    rrect(ctx, x, y, size + 16, size + 16, 14, '#fff');
    try {
      const q = window.qrcode(0, 'M'); q.addData(url); q.make(); const n = q.getModuleCount(), cell = size / n;
      ctx.fillStyle = C.g900; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x + 8 + c * cell, y + 8 + r * cell, Math.ceil(cell), Math.ceil(cell));
    } catch { /* بلا رمز */ }
  }
  function avatar(ctx, t, img, cx, cy, R, ring = C.sage) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const D = R * 2, x0 = cx - R, y0 = cy - R;
    if (img && usePhotos && !t.noPhoto) {
      const f = K().fit(t), s = Math.max(D / img.width, D / img.height), iw = img.width * s, ih = img.height * s, ox = x0 + D * f.x / 100, oy = y0 + D * f.y / 100;
      ctx.translate(ox, oy); ctx.scale(f.z, f.z); ctx.translate(-ox, -oy); ctx.drawImage(img, x0 + (D - iw) * f.x / 100, y0 + (D - ih) * f.y / 100, iw, ih);
    } else {
      const g = ctx.createLinearGradient(x0, y0, x0 + D, y0 + D); g.addColorStop(0, C.g700); g.addColorStop(1, C.g900); ctx.fillStyle = g; ctx.fillRect(x0, y0, D, D);
      if (false && t.noPhoto) { ctx.translate(x0, y0); ctx.scale(D / 100, D / 100); ctx.fillStyle = C.sage; if (t.gender === 'f') ctx.fill(new Path2D(K().SYM_F)); else { ctx.beginPath(); ctx.arc(50, 36, 17, 0, Math.PI * 2); ctx.fill(); ctx.fill(new Path2D(K().SYM_M_BODY)); } }
      else { const tmp = document.createElement('div'); tmp.innerHTML = initials(t.name); ctx.fillStyle = C.cream; ctx.font = `900 ${R * 0.8}px ${FONT.head}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tmp.textContent, cx, cy + 3); ctx.textBaseline = 'alphabetic'; }
    }
    ctx.restore(); ctx.beginPath(); ctx.arc(cx, cy, R + 4, 0, Math.PI * 2); ctx.strokeStyle = ring; ctx.lineWidth = 4; ctx.stroke();
  }
  function frameBg(ctx, dark) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    if (dark) { g.addColorStop(0, C.g950); g.addColorStop(0.55, C.g900); g.addColorStop(1, C.g800); } else { g.addColorStop(0, C.paper); g.addColorStop(1, C.cream); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    try { ctx.save(); ctx.fillStyle = ctx.createPattern(K().patternTile(dark ? C.sage : C.g800, dark ? 0.1 : 0.06), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore(); } catch { /* بلا نقش */ }
  }

  // wrap يضيف «…» للسطر الأخير دون إعادة قياسه: نقصّه حتى يتسع
  const clip = (ctx, lines, maxW) => { const i = lines.length - 1; if (i >= 0 && lines[i].endsWith('…')) { let w = lines[i].slice(0, -1).trim().split(' '); while (w.length > 1 && ctx.measureText(w.join(' ') + '…').width > maxW) w.pop(); lines[i] = w.join(' ') + '…'; } return lines; };

  /* ---------- تخطيط الأخبار ---------- */
  const HDR = { s: 132, big: 214 }, MAX_LINES = 14;
  const singleMaxLines = (titleLines, hh, availH, linksH, pad, f) => { const used = hh + 20 + pad + 46 + 14 + titleLines * f.tl + (linksH ? 14 + linksH : 0) + 76 + pad; return Math.max(3, Math.min(MAX_LINES, Math.floor((availH - used - 10) / f.bl))); };
  function layoutItem(ctx, n, mode, availH, hh = HDR.big) {
    const big = mode === 'single', f = big ? { tf: 50, tl: 68, tm: 4, bf: 30, bl: 52 } : { tf: 32, tl: 46, tm: 2, bf: 25, bl: 40 };
    const pad = big ? 44 : 28, inner = CW - 2 * pad - 14, links = arr(n.links).slice(0, 3);
    ctx.font = `900 ${f.tf}px ${FONT.head}`; const title = clip(ctx, K().wrap(ctx, n.title, inner, f.tm), inner);
    const linksH = !links.length ? 0 : big ? links.length * 106 + 6 : 62, RM = big ? 76 : 64;
    const sum = collapse(n.summary || '');
    const cut = !sum && n.cutAt > 0 && n.cutAt < String(n.body || '').trim().length;
    const body = sum ? sum : cut ? collapse(String(n.body).slice(0, n.cutAt)) + '…' : collapse(n.body);
    let bodyMax = big ? 0 : (sum ? 9 : mode === 'trainer' ? 4 : 3);
    if (big) bodyMax = singleMaxLines(title.length, hh, availH, linksH, pad, f);
    else if (cut) bodyMax = MAX_LINES;   // قطع يدوي: يُعرض النص المختار كاملاً (حدّه الأعلى يضبطه المحرر)
    ctx.font = `400 ${f.bf}px ${FONT.body}`; const lines = body ? clip(ctx, K().wrap(ctx, body, inner, bodyMax), inner) : [];
    const h = pad + 46 + 14 + title.length * f.tl + (lines.length ? 10 + lines.length * f.bl : 0) + (linksH ? 14 + linksH : 0) + RM + pad;
    return { n, h, f, pad, big, title, lines, links, inner, RM, url: profileUrl(Store.get(`trainers/${n.trainerId}`) || {}) };
  }
  function drawItem(ctx, L, x, y) {
    const { n, f, pad, big } = L, w = CW, R = x + w - pad - 14;
    rrect(ctx, x, y, w, L.h, 28, '#fff', C.line, 1.5);
    rrect(ctx, x + w - 12, y + 24, 8, L.h - 48, 4, C.g800);
    const py = y + pad + 22;
    pill(ctx, kindName(n.kind), R, py);
    txt(ctx, dateAr(n.ts, true), x + pad, py + 8, { font: `600 ${big ? 24 : 21}px ${FONT.body}`, color: C.muted, align: 'left' });
    let cy = y + pad + 46 + 14;
    L.title.forEach((l, i) => txt(ctx, l, R, cy + f.tl * (i + 1) - 16, { font: `900 ${f.tf}px ${FONT.head}`, color: C.g900 })); cy += L.title.length * f.tl;
    if (L.lines.length) { cy += 10; L.lines.forEach((l, i) => txt(ctx, l, R, cy + f.bl * (i + 1) - 12, { font: `400 ${f.bf}px ${FONT.body}`, color: C.ink2 })); cy += L.lines.length * f.bl; }
    if (L.links.length) {
      cy += 14;
      if (big) L.links.forEach((l, i) => {
        const ly = cy + i * 106; rrect(ctx, x + pad, ly, w - 2 * pad - 14, 96, 20, C.paper, C.line);
        const host = (() => { try { return new URL(l.url).hostname.replace(/^www\./, ''); } catch { return ''; } })();
        ctx.font = `700 26px ${FONT.body}`; const t1 = K().wrap(ctx, l.title || host, w - 2 * pad - 14 - 60, 1)[0] || host;
        txt(ctx, t1, R - 22, ly + 42, { font: ctx.font, color: C.g800 }); txt(ctx, l.site || host, R - 22, ly + 76, { font: `500 21px ${FONT.body}`, color: C.muted, align: 'right', dir: 'ltr' });
      });
      else {
        let rx = R;
        L.links.forEach(l => {
          const host = (() => { try { return new URL(l.url).hostname.replace(/^www\./, ''); } catch { return ''; } })();
          ctx.font = `600 21px ${FONT.body}`; ctx.direction = 'ltr'; const tw = Math.min(ctx.measureText(host).width, 230); ctx.direction = 'rtl';
          const cw = tw + 40; if (rx - cw < x + pad) return;
          rrect(ctx, rx - cw, cy, cw, 44, 22, C.paper, C.line); ctx.save(); ctx.beginPath(); ctx.rect(rx - cw + 12, cy, cw - 24, 44); ctx.clip();
          txt(ctx, host, rx - cw / 2, cy + 30, { font: ctx.font, color: C.g800, align: 'center', dir: 'ltr' }); ctx.restore(); rx -= cw + 10;
        });
      }
    }
    // «اقرأ الخبر كاملاً عبر الموقع ←» في نهاية كل خبر (رابط قابل للنقر في ملف PDF يقود إلى صفحة المدرب)
    const ry = y + L.h - pad - L.RM + 22, rfs = big ? 28 : 24, rw = w - 2 * pad - 14;
    ctx.beginPath(); ctx.moveTo(x + pad, ry - 8); ctx.lineTo(R, ry - 8); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    const label = 'اقرأ الخبر كاملاً عبر الموقع'; ctx.font = `800 ${rfs}px ${FONT.body}`; const tw = ctx.measureText(label).width, base = ry + (L.RM - 22) / 2 + rfs * 0.3;
    txt(ctx, label, R, base, { font: ctx.font, color: C.g800 });
    const ax = R - tw - 14, ay = base - rfs * 0.32, al = rfs * 1.1;   // سهم يشير لليسار (اتجاه القراءة)
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - al, ay); ctx.moveTo(ax - al + 9, ay - 9); ctx.lineTo(ax - al, ay); ctx.lineTo(ax - al + 9, ay + 9);
    ctx.strokeStyle = C.g800; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
    if (ctx.__links) ctx.__links.push({ x: x + pad, y: ry, w: rw, h: L.RM - 22, url: L.url });
  }
  // السطر التعريفي يُعرض كاملاً: يلتف على عدة أسطر ويكبر ارتفاع الترويسة بحسب عدد الأسطر
  function hdrLayout(ctx, t, big) {
    const R = big ? 74 : 46, qs = big ? 120 : 76, avail = CW - 26 - 2 * R - 24 - (26 + qs + 16 + 20), tfs = big ? 28 : 22, lh = big ? 38 : 30;
    ctx.font = `600 ${tfs}px ${FONT.body}`; const lines = K().wrap(ctx, t.title || '', avail, 6);
    const nameH = big ? 62 : 46, h = Math.max(big ? HDR.big : HDR.s, 2 * 24 + nameH + lines.length * lh);
    return { h, lines, tfs, lh, nameH, avail };
  }
  function drawHeader(ctx, t, img, x, y, cont, big, H) {
    const h = H.h, w = CW, R = big ? 74 : 46, qs = big ? 120 : 76;
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, C.g900); g.addColorStop(1, C.g800); rrect(ctx, x, y, w, h, 30, g);
    try { ctx.save(); K().rr(ctx, x, y, w, h, 30); ctx.clip(); ctx.fillStyle = ctx.createPattern(K().patternTile(C.sage, 0.1), 'repeat'); ctx.fillRect(x, y, w, h); ctx.restore(); } catch { /* */ }
    avatar(ctx, t, img, x + w - 26 - R - 4, y + h / 2, R);
    const tr = x + w - 26 - 2 * R - 24, avail = H.avail;
    const fs = fitFont(ctx, t.name || '', 900, big ? 50 : 36, 24, avail, FONT.head);
    const top = y + (h - (H.nameH + H.lines.length * H.lh)) / 2;
    txt(ctx, t.name || '', tr, top + H.nameH - 14, { font: `900 ${fs}px ${FONT.head}`, color: '#fff' });
    H.lines.forEach((l, i) => txt(ctx, l, tr, top + H.nameH + H.lh * (i + 1) - 8, { font: `600 ${H.tfs}px ${FONT.body}`, color: C.sage }));
    if (cont) pill(ctx, 'تتمة', tr, y + 22, { bg: 'rgba(255,255,255,.14)', fg: C.cream, fs: 18 });
    qr(ctx, profileUrl(t), x + 26, y + (h - qs - 16) / 2, qs);
    return h;
  }

  /* ---------- هيكل الصفحات ---------- */
  function chrome(ctx, i, total, from, to, title = 'نشرة المدربين', pal = null) {   // pal: ألوان بطاقة المدرب {a,b,accent,fg,light} للشريط العلوي
    frameBg(ctx, false);
    const g = ctx.createLinearGradient(0, 0, W, 150); g.addColorStop(0, pal ? pal.a : C.g950); g.addColorStop(1, pal ? pal.b : C.g800); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 150);
    try { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 150); ctx.clip(); ctx.fillStyle = ctx.createPattern(K().patternTile(pal ? (pal.light ? '#005430' : pal.accent) : C.sage, pal && pal.light ? 0.08 : 0.1), 'repeat'); ctx.fillRect(0, 0, W, 150); ctx.restore(); } catch { /* */ }
    ctx.fillStyle = pal ? pal.accent : C.sage; ctx.fillRect(0, 150, W, 6);
    if (chrome.logo) { const lh = 74, lw = lh * chrome.logo.width / chrome.logo.height; ctx.drawImage(chrome.logo, W - PX - lw, 38, lw, lh); }
    txt(ctx, title, PX + 0, 76, { font: `900 44px ${FONT.head}`, color: pal ? pal.fg : '#fff', align: 'left' });
    txt(ctx, rangeTxt(from, to), PX, 118, { font: `600 24px ${FONT.body}`, color: pal ? pal.accent : C.sage, align: 'left' });
    // التذييل
    ctx.fillStyle = C.line; ctx.fillRect(PX, H - 92, CW, 2);
    txt(ctx, 'sauditrainers.sa', W - PX, H - 42, { font: `800 30px ${FONT.brand}`, color: C.g800, dir: 'ltr' });
    txt(ctx, 'مدرّبون سعوديّون · دليل المدربين السعوديين', W / 2, H - 42, { font: `500 21px ${FONT.body}`, color: C.muted, align: 'center' });
    txt(ctx, `${i} / ${total}`, PX, H - 42, { font: `700 26px ${FONT.body}`, color: C.muted, align: 'left', dir: 'ltr' });
  }
  function cover(ctx, st, from, to) {
    frameBg(ctx, true);
    const glow = ctx.createRadialGradient(W * 0.2, H * 0.78, 20, W * 0.2, H * 0.78, W * 0.9); glow.addColorStop(0, 'rgba(35,163,101,.35)'); glow.addColorStop(1, 'rgba(35,163,101,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    // حلقات زخرفية
    ctx.strokeStyle = 'rgba(201,218,180,.16)'; ctx.lineWidth = 2; [260, 360, 460, 560].forEach(r => { ctx.beginPath(); ctx.arc(-40, H + 40, r, 0, Math.PI * 2); ctx.stroke(); });
    const M = 38; ctx.strokeStyle = 'rgba(201,218,180,.8)'; ctx.lineWidth = 3; K().rr(ctx, M, M, W - 2 * M, H - 2 * M, 44); ctx.stroke(); ctx.strokeStyle = 'rgba(201,218,180,.28)'; ctx.lineWidth = 1.5; K().rr(ctx, M + 14, M + 14, W - 2 * M - 28, H - 2 * M - 28, 34); ctx.stroke();
    if (chrome.logo) { const lh = 130, lw = lh * chrome.logo.width / chrome.logo.height; ctx.drawImage(chrome.logo, W - 100 - lw, 100, lw, lh); }
    pill(ctx, 'نشرة إلكترونية', 100 + 230, 165, { bg: 'rgba(238,243,229,.14)', fg: C.cream, fs: 26 });
    txt(ctx, 'نشرة', W - 100, 470, { font: `900 120px ${FONT.head}`, color: C.sage });
    txt(ctx, 'المدربين', W - 100, 610, { font: `900 170px ${FONT.head}`, color: '#fff' });
    ctx.fillStyle = C.sage; ctx.fillRect(W - 100 - 150, 650, 150, 8);
    txt(ctx, 'أخبار وإنجازات ومشاركات وتحديثات', W - 100, 730, { font: `600 38px ${FONT.body}`, color: C.cream });
    txt(ctx, 'المدربين السعوديين', W - 100, 786, { font: `600 38px ${FONT.body}`, color: C.cream });
    // نطاق التاريخ
    const rt = rangeTxt(from, to); if (rt) { ctx.font = `800 34px ${FONT.body}`; const w = ctx.measureText(rt).width + 70; rrect(ctx, W - 100 - w, 830, w, 70, 35, 'rgba(238,243,229,.12)', 'rgba(201,218,180,.55)'); txt(ctx, rt, W - 100 - w / 2, 876, { font: ctx.font, color: '#fff', align: 'center' }); }
    // صور المدربين المتداخلة
    const ts = st.trainers.slice(0, 6), R = 62, step = 88, total = ts.length + (st.trainers.length > 6 ? 1 : 0), sx = W - 100 - R;
    ts.forEach((t, i) => avatar(ctx, t, st.photos.get(t.id), sx - i * step, 1040, R, C.g900));
    if (st.trainers.length > 6) { const cx = sx - ts.length * step; ctx.beginPath(); ctx.arc(cx, 1040, R, 0, Math.PI * 2); ctx.fillStyle = C.sage; ctx.fill(); txt(ctx, `+${st.trainers.length - 6}`, cx, 1052, { font: `900 38px ${FONT.body}`, color: C.g900, align: 'center' }); }
    void total;
    // أرقام
    [[st.items, 'خبراً'], [st.trainers.length, 'مدرباً']].forEach(([v, l], i) => { const x = W - 100 - i * 250; txt(ctx, String(v), x, 1200, { font: `900 74px ${FONT.head}`, color: '#fff', align: 'right', dir: 'ltr' }); txt(ctx, l, x, 1240, { font: `600 28px ${FONT.body}`, color: C.sage, align: 'right' }); });
    txt(ctx, 'sauditrainers.sa', 100, 1240, { font: `800 34px ${FONT.brand}`, color: C.cream, align: 'left', dir: 'ltr' });
  }

  function paginate(ctx, groups, mode) {
    const avail = BOT - TOP, pages = [];
    if (mode === 'single') { groups.forEach(g => { const H = hdrLayout(ctx, g.t, true); g.items.forEach(n => pages.push([{ t: g.t, big: true, H, L: [layoutItem(ctx, n, 'single', avail, H.h)], cont: false }])); }); return pages; }
    let cur = null, used = 0; const newPage = () => { cur = []; pages.push(cur); used = 0; };
    groups.forEach(g => {
      if (mode === 'trainer' || !cur) newPage();
      const rest = g.items.map(n => layoutItem(ctx, n, mode, avail)), H = hdrLayout(ctx, g.t, false); let first = true;
      while (rest.length) {
        if (used && used + GAP + H.h + 14 + rest[0].h > avail) newPage();
        const start = used ? used + GAP : 0, sec = { t: g.t, big: false, H, L: [], cont: !first, y: start }; let h = H.h;
        cur.push(sec);
        while (rest.length && start + h + 14 + rest[0].h <= avail) { h += 14 + rest[0].h; sec.L.push(rest.shift()); }
        if (!sec.L.length) { sec.L.push(rest.shift()); h += 14 + sec.L[0].h; }
        used = start + h; first = false;
        if (rest.length) newPage();
      }
    });
    return pages;
  }


  /* ---------- الصفحة الختامية الدعائية: مزايا المنصة + دعوة للتسجيل برمز QR لصفحة الانضمام ---------- */
  // رمز أيقونة Font Awesome من اسم صنفها (للرسم على اللوحة)
  const faGlyph = cls => { try { const i = document.createElement('i'); i.className = `fa-solid ${cls}`; i.style.cssText = 'position:absolute;left:-99px'; document.body.appendChild(i); const c = getComputedStyle(i, '::before').content; i.remove(); return String(c).replace(/^["']|["']$/g, '') || '\uf005'; } catch { return '\uf005'; } };
  // وسم «حصرية للمشتركين» بلون عنبري مميّز على الصور
  const exPill = (ctx, cxRight, cy, fs = 19, tr = false) => tr ? pill(ctx, 'متاحة للتجربة المجانية', cxRight, cy, { bg: '#DDF3E4', fg: '#12643A', fs }) : pill(ctx, 'حصرية للمشتركين', cxRight, cy, { bg: '#FFF1CC', fg: '#8A5A00', fs });
  // المزايا من المحتوى التسويقي المركزي (Pitch)
  const promoFeats = () => Pitch.top(8).map(i => ({ ic: faGlyph(i.ic || 'fa-star'), label: i.s || i.t, x: !!(i.x || i.tr), tr: !!i.tr }));
  function promo(ctx) {
    frameBg(ctx, true);
    const glow = ctx.createRadialGradient(W * 0.85, H * 0.15, 20, W * 0.85, H * 0.15, W * 0.8); glow.addColorStop(0, 'rgba(35,163,101,.35)'); glow.addColorStop(1, 'rgba(35,163,101,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    const M = 38; ctx.strokeStyle = 'rgba(201,218,180,.8)'; ctx.lineWidth = 3; K().rr(ctx, M, M, W - 2 * M, H - 2 * M, 44); ctx.stroke();
    if (chrome.logo) { const lh = 96, lw = lh * chrome.logo.width / chrome.logo.height; ctx.drawImage(chrome.logo, W - 90 - lw, 82, lw, lh); }
    pill(ctx, 'دعوة للمدرب السعودي', 90 + 260, 130, { bg: 'rgba(238,243,229,.14)', fg: C.cream, fs: 26 });
    txt(ctx, 'سجّل في منصة', W - 90, 300, { font: `900 76px ${FONT.head}`, color: '#fff' });
    txt(ctx, 'مدرّبون سعوديّون', W - 90, 396, { font: `900 96px ${FONT.head}`, color: C.sage });
    ctx.fillStyle = C.sage; ctx.fillRect(W - 90 - 150, 438, 150, 7);
    txt(ctx, 'استثمار يتجدد مجاناً: ملفك وفرصك وظهورك في مكان واحد', W - 90, 500, { font: `600 33px ${FONT.body}`, color: C.cream });
    // بطاقات المزايا (عمودان × أربعة صفوف)
    const colW = (W - 180 - 20) / 2, rowH = 104, gy = 16, y0 = 540;
    promoFeats().forEach(({ ic, label, x: ex, tr }, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = W - 90 - colW - col * (colW + 20), y = y0 + row * (rowH + gy);
      rrect(ctx, x, y, colW, rowH, 24, 'rgba(238,243,229,.10)', 'rgba(201,218,180,.32)');
      const cx = x + colW - 20 - 36, cy = y + rowH / 2;
      ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fillStyle = C.cream; ctx.fill();
      ctx.save(); ctx.font = '900 32px "Font Awesome 6 Free"'; ctx.fillStyle = C.g800; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(ic, cx, cy + 2); ctx.restore();
      ctx.font = `700 26px ${FONT.body}`; const lines = K().wrap(ctx, label, colW - 36 - 72 - 16, 2), lh = 34, top = cy - (lines.length * lh) / 2 + 26;
      lines.forEach((l, k) => txt(ctx, l, cx - 36 - 18, top + k * lh - (ex ? 10 : 0), { font: ctx.font, color: '#fff' }));
      if (ex) exPill(ctx, cx - 36 - 18, y + rowH - 20, 15, tr);
    });
    // الدعوة + الباركود
    const by = y0 + 4 * (rowH + gy) + 14, bh = H - 90 - by;
    rrect(ctx, 90, by, W - 180, bh, 30, C.cream);
    const url = `${siteBase()}#/join`, qs = bh - 60;
    qr(ctx, url, 90 + 30, by + (bh - qs - 16) / 2, qs - 16);
    const tx = W - 90 - 36;
    txt(ctx, 'انضم الآن وابدأ ظهورك أمام الجهات', tx, by + 72, { font: `900 38px ${FONT.head}`, color: C.g900 });
    txt(ctx, 'امسح الرمز أو افتح رابط التسجيل:', tx, by + 122, { font: `600 26px ${FONT.body}`, color: C.ink2 });
    const shown = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    ctx.font = `800 32px ${FONT.body}`; ctx.direction = 'ltr'; const tw = Math.min(ctx.measureText(shown).width + 44, W - 180 - qs - 120); ctx.direction = 'rtl';
    rrect(ctx, tx - tw, by + 144, tw, 58, 29, C.g800); ctx.save(); ctx.beginPath(); ctx.rect(tx - tw + 14, by + 144, tw - 28, 58); ctx.clip();
    txt(ctx, shown, tx - tw / 2, by + 184, { font: ctx.font, color: '#fff', align: 'center', dir: 'ltr' }); ctx.restore();
  }

  /* ---------- البناء ---------- */
  async function prepare() {
    const tp = K().template(); await Promise.race([K().ensureFonts(tp), new Promise(r => setTimeout(r, 6000))]);
    FONT = { head: K().fontCss(tp.fonts.name), body: K().fontCss(tp.fonts.body), brand: K().fontCss(tp.fonts.brand) };
  }
  // سعة الخبر: أقصى عدد كلمات يتسع في صفحة الخبر المنفرد (أوسع قالب)، وتوزيعات الصفحات الأصغر تتسع له أيضاً
  async function limit(n) {
    await prepare();
    const ctx = document.createElement('canvas').getContext('2d'); ctx.direction = 'rtl';
    const t = Store.get(`trainers/${n.trainerId}`) || {}, f = { tf: 50, tl: 68, bf: 30, bl: 52, tm: 4 }, pad = 44, inner = CW - 2 * pad - 14, links = arr(n.links).slice(0, 3);
    const H = hdrLayout(ctx, t, true); ctx.font = `900 ${f.tf}px ${FONT.head}`; const tl = clip(ctx, K().wrap(ctx, n.title, inner, f.tm), inner).length;
    const maxLines = singleMaxLines(tl, H.h, BOT - TOP, links.length ? links.length * 106 + 6 : 0, pad, f);
    const fits = text => { ctx.font = `400 ${f.bf}px ${FONT.body}`; return K().wrap(ctx, text, inner, 999).length <= maxLines; };
    const words = collapse(n.body).split(' ').filter(Boolean); let lo = 0, hi = words.length;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (fits(words.slice(0, m).join(' '))) lo = m; else hi = m - 1; }
    return { maxLines, maxWords: lo, fits };
  }
  async function build({ items, from, to, layout = 'compact', withCover = true, withPromo = true }) {
    await prepare(); await K().ensureQR();
    try { await document.fonts.load('900 32px "Font Awesome 6 Free"'); } catch { /* ignore */ }
    chrome.logo = await K().loadImage(LOGO.cream);
    // مجموعات المدربين بترتيب أحدث خبر
    const sorted = [...items].sort((a, b) => (b.ts || 0) - (a.ts || 0)), map = new Map();
    sorted.forEach(n => { const t = Store.get(`trainers/${n.trainerId}`); if (!t) return; if (!map.has(t.id)) map.set(t.id, { t, items: [] }); map.get(t.id).items.push(n); });
    const groups = [...map.values()];
    if (!groups.length) throw new Error('لا توجد أخبار في الاختيار');
    const photos = new Map(); await Promise.all(groups.map(async g => photos.set(g.t.id, g.t.noPhoto ? null : await K().loadImage(Data.photo(g.t)))));
    const st = { items: sorted.length, trainers: groups.map(g => g.t), photos };
    const attempt = () => {
      const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); c.direction = 'rtl'; c.textAlign = 'right'; c.__links = cv.__links = []; return [cv, c]; };
      const pages = paginate(mk()[1], groups, layout), total = pages.length + (withCover ? 1 : 0) + (withPromo ? 1 : 0), out = [];
      if (withCover) { const [cv, c] = mk(); cover(c, st, from, to); out.push(cv); }
      pages.forEach((secs, pi) => {
        const [cv, c] = mk(); chrome(c, pi + 1 + (withCover ? 1 : 0), total, from, to);
        let y = TOP; if (layout === 'single') y = TOP;
        secs.forEach(sec => {
          y = TOP + (sec.y || 0); const hh = drawHeader(c, sec.t, photos.get(sec.t.id), PX, y, sec.cont, sec.big, sec.H); y += hh + (sec.big ? 20 : 14);
          sec.L.forEach(L => { drawItem(c, L, PX, y); y += L.h + 14; });
        });
        out.push(cv);
      });
      if (withPromo) { const [cv, c] = mk(); promo(c); out.push(cv); }
      return out;
    };
    const ok = cvs => { try { cvs.forEach(cv => cv.getContext('2d').getImageData(0, 0, 1, 1)); return true; } catch { return false; } };
    usePhotos = true; let cvs = attempt();
    if (!ok(cvs)) { usePhotos = false; cvs = attempt(); usePhotos = true; if (ok(cvs)) toast('تعذّر قراءة بعض الصور فاستُبدلت برموز؛ تحقق من مشاركة روابط صور المدربين', 'error'); else throw new Error('تعذّر تصدير الصور'); }
    return cvs;
  }

  /* ---------- ZIP و PDF بلا مكتبات ---------- */
  const enc = s => new TextEncoder().encode(s);
  const concat = parts => { const n = parts.reduce((a, p) => a + p.length, 0), o = new Uint8Array(n); let i = 0; parts.forEach(p => { o.set(p, i); i += p.length; }); return o; };
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {   // files: [{name, data:Uint8Array}] - تخزين بلا ضغط (الصور مضغوطة أصلاً)
    const loc = [], cen = []; let off = 0;
    const u16 = v => new Uint8Array([v & 255, v >> 8 & 255]), u32 = v => new Uint8Array([v & 255, v >> 8 & 255, v >> 16 & 255, v >> 24 & 255]);
    files.forEach(f => {
      const nm = enc(f.name), crc = crc32(f.data), sz = f.data.length;
      const h = concat([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0), nm]);
      loc.push(h, f.data);
      cen.push(concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off), nm]));
      off += h.length + sz;
    });
    const cd = concat(cen);
    return new Blob([concat([...loc, cd, concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cd.length), u32(off), u16(0)])])], { type: 'application/zip' });
  }
  const b64 = d => { const bin = atob(d.split(',')[1]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  function pdf(cvs) {
    const chunks = [], offs = []; let len = 0; const push = b => { chunks.push(b); len += b.length; };
    const obj = (n, parts) => { offs[n] = len; push(enc(`${n} 0 obj\n`)); parts.forEach(p => push(typeof p === 'string' ? enc(p) : p)); push(enc('\nendobj\n')); };
    push(enc('%PDF-1.4\n'));
    const N = cvs.length, pw = W * 0.75, ph = H * 0.75;
    obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2, [`<< /Type /Pages /Count ${N} /Kids [${cvs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] >>`]);
    let next = 3 + 3 * N; const annots = [];
    cvs.forEach((cv, i) => {
      const jpg = b64(cv.toDataURL('image/jpeg', 0.92)), p = 3 + 3 * i, content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
      const refs = (cv.__links || []).filter(l => /^https:\/\//.test(l.url)).map(l => { const id = next++; annots.push([id, l]); return `${id} 0 R`; });
      obj(p, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R${refs.length ? ` /Annots [${refs.join(' ')}]` : ''} >>`]);
      obj(p + 1, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
      obj(p + 2, [`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`, jpg, '\nendstream']);
    });
    annots.forEach(([id, l]) => { const u = encodeURI(l.url).replace(/[()\\]/g, ''), f = v => (v * 0.75).toFixed(1); obj(id, [`<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect [${f(l.x)} ${((H - l.y - l.h) * 0.75).toFixed(1)} ${f(l.x + l.w)} ${((H - l.y) * 0.75).toFixed(1)}] /A << /S /URI /URI (${u}) >> >>`]); });
    const xr = len, cnt = next;
    push(enc(`xref\n0 ${cnt}\n0000000000 65535 f \n${Array.from({ length: cnt - 1 }, (_, i) => `${String(offs[i + 1]).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${cnt} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`));
    return new Blob(chunks, { type: 'application/pdf' });
  }
  const toPng = cv => new Promise(r => cv.toBlob(async b => r(b ? new Uint8Array(await b.arrayBuffer()) : b64(cv.toDataURL('image/png'))), 'image/png'));

  async function deliver(blob, name) {
    const file = new File([blob], name, { type: blob.type });
    if (K().isApple && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    if (K().isApple) { window.open(URL.createObjectURL(blob), '_blank'); return; }
    download(name, blob);
  }

  /* ---------- صورة معاينة رابط الخبر (واتساب/إكس/لينكدإن): 1200×630 ---------- */
  // يمين: صورة المدرب واسمه تحتها، وبجانبها (يساراً) عنوان الخبر ومقتطف من نصه بحسب المساحة
  async function og(n) {
    await prepare(); chrome.logo = chrome.logo || await K().loadImage(LOGO.cream);
    const t = Store.get(`trainers/${n.trainerId}`) || {}, img = t.noPhoto ? null : await K().loadImage(Data.photo(t));
    const OW = 1200, OH = 630, cv = document.createElement('canvas'); cv.width = OW; cv.height = OH;
    const ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'right';
    const g = ctx.createLinearGradient(0, 0, OW, OH); g.addColorStop(0, C.g950); g.addColorStop(0.55, C.g900); g.addColorStop(1, C.g800); ctx.fillStyle = g; ctx.fillRect(0, 0, OW, OH);
    try { ctx.fillStyle = ctx.createPattern(K().patternTile(C.sage, 0.1), 'repeat'); ctx.fillRect(0, 0, OW, OH); } catch { /* بلا نقش */ }
    // لوحة المدرب (يمين): صورته واسمه وسطره التعريفي كاملاً (يصغّر الخط وحجم الصورة إن لزم)
    const PX0 = OW - 60, PW = 340, cx = PX0 - PW / 2, PH = OH - 120, IW = PW - 40, name = String(t.name || ''), tag = String(t.title || '');
    let R = 118, nfs = 40, tfs = 22, nl = [], tl = [];
    const layout = () => {
      nfs = fitFont(ctx, name, 900, 40, 22, IW, FONT.head); ctx.font = `900 ${nfs}px ${FONT.head}`; nl = K().wrap(ctx, name, IW, 3);
      ctx.font = `600 ${tfs}px ${FONT.body}`; tl = K().wrap(ctx, tag, IW, 99);
      return 28 + 2 * R + 14 + nl.length * (nfs + 8) + 10 + tl.length * (tfs + 8) + 24;
    };
    for (const [r, f] of [[118, 22], [104, 21], [92, 20], [80, 19], [70, 18], [62, 17], [54, 16]]) { R = r; tfs = f; if (layout() <= PH) break; }
    rrect(ctx, PX0 - PW, 60, PW, PH, 34, 'rgba(238,243,229,.10)', 'rgba(201,218,180,.35)');
    avatar(ctx, t, img, cx, 60 + 28 + R, R);
    const ny = 60 + 28 + 2 * R + 14 + nfs;
    ctx.font = `900 ${nfs}px ${FONT.head}`; nl.forEach((l, i) => txt(ctx, l, cx, ny + i * (nfs + 8), { font: ctx.font, color: '#fff', align: 'center' }));
    const ty = ny + (nl.length - 1) * (nfs + 8) + 10 + tfs;
    ctx.font = `600 ${tfs}px ${FONT.body}`; tl.forEach((l, i) => txt(ctx, l, cx, ty + i * (tfs + 8), { font: ctx.font, color: C.sage, align: 'center' }));
    // عنوان الخبر كاملاً (يصغّر الخط حتى يتسع) ثم «اضغط للمزيد» تحته
    const TR = PX0 - PW - 44, TL = 64, TW = TR - TL, TOP0 = 140, TBOT = OH - 170;
    pill(ctx, kindName(n.kind), TR, 92, { bg: 'rgba(238,243,229,.16)', fg: C.cream });
    txt(ctx, dateAr(n.ts, true), TL, 100, { font: `600 22px ${FONT.body}`, color: C.sage, align: 'left' });
    let ts = 68, tlines = [], lh = 0;
    for (; ts >= 24; ts -= 2) { ctx.font = `900 ${ts}px ${FONT.head}`; tlines = K().wrap(ctx, n.title || '', TW, 99); lh = Math.round(ts * 1.3); if (tlines.length * lh <= TBOT - TOP0 && tlines.every(l => ctx.measureText(l).width <= TW)) break; }
    ctx.font = `900 ${ts}px ${FONT.head}`; tlines.forEach((l, i) => txt(ctx, l, TR, TOP0 + lh * (i + 1) - Math.round(ts * 0.25), { font: ctx.font, color: '#fff' }));
    const my = TOP0 + tlines.length * lh + 34;
    ctx.font = `800 32px ${FONT.body}`; const mw = ctx.measureText('اضغط للمزيد').width;
    txt(ctx, 'اضغط للمزيد', TR, my, { font: ctx.font, color: C.sage });
    const ax = TR - mw - 16, ay = my - 11;   // سهم يشير لليسار
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 38, ay); ctx.moveTo(ax - 38 + 11, ay - 11); ctx.lineTo(ax - 38, ay); ctx.lineTo(ax - 38 + 11, ay + 11);
    ctx.strokeStyle = C.sage; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
    // التذييل
    if (chrome.logo) { const lh = 50, lw = lh * chrome.logo.width / chrome.logo.height; ctx.drawImage(chrome.logo, TR - lw, OH - 50 - lh, lw, lh); }
    txt(ctx, 'sauditrainers.sa', TL, OH - 62, { font: `700 26px ${FONT.body}`, color: C.cream, align: 'left', dir: 'ltr' });
    return cv;
  }

  /* ---------- النافذة: معاينة وتصدير ---------- */
  async function make(opts) {
    toast('جارٍ تصميم النشرة…');
    let cvs; try { cvs = await build(opts); } catch (e) { console.error(e); return toast(`تعذّر إنشاء النشرة: ${e.message || e}`, 'error'); }
    const stamp = new Date().toISOString().slice(0, 10), base = `sauditrainers-bulletin-${stamp}`;
    const thumbs = cvs.map(cv => cv.toDataURL('image/jpeg', 0.55));
    const m = modal(`<h3><i class="fa-solid fa-newspaper"></i> نشرة المدربين جاهزة (${cvs.length} صفحة)</h3>
      <p class="muted small">مقاس كل صفحة 1080×1350 (منشور إنستقرام طولي). اضغط صفحة لتنزيلها منفردة، أو نزّل النشرة كاملة.</p>
      <div class="bl-grid">${thumbs.map((s, i) => `<button type="button" class="bl-th" data-i="${i}" title="تنزيل الصفحة ${i + 1}"><img src="${s}" alt="صفحة ${i + 1}"><span>${i + 1}</span></button>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" data-pdf><i class="fa-solid fa-file-pdf"></i> ملف PDF</button><button class="btn" data-zip><i class="fa-solid fa-file-zipper"></i> كل الصور (ZIP)</button><button class="btn ghost" data-close>إغلاق</button></div>`, { wide: true });
    const busy = async (b, fn) => { const h = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التجهيز'; try { await fn(); } catch (e) { console.error(e); toast('تعذّر التصدير', 'error'); } b.disabled = false; b.innerHTML = h; };
    $('[data-pdf]', m.el).onclick = e => busy(e.currentTarget, () => deliver(pdf(cvs), `${base}.pdf`));
    $('[data-zip]', m.el).onclick = e => busy(e.currentTarget, async () => deliver(zip(await Promise.all(cvs.map(async (cv, i) => ({ name: `bulletin-${String(i + 1).padStart(2, '0')}.png`, data: await toPng(cv) })))), `${base}.zip`));
    $$('.bl-th', m.el).forEach(b => b.onclick = () => busy(b, async () => { const i = +b.dataset.i; deliver(new Blob([await toPng(cvs[i])], { type: 'image/png' }), `${base}-${String(i + 1).padStart(2, '0')}.png`); }));
  }

  /* ---------- «التقرير الشهري»: غلاف ← أرقام الشهر ← موضوعات مطلوبة ← أخبار الشهر ← 3 بطاقات مزايا ← دعوة للتسجيل ---------- */
  // البطاقات الثلاث من المزايا المركزية: الملف الاحترافي، الفرص، المنصة الحصرية
  const rptCards = () => ['profile', 'opps', 'exclusive'].map(id => Pitch.byId(id)).filter(Boolean).map(i => ({ ic: faGlyph(i.ic || 'fa-star'), k: i.s || i.t, t: i.t, pts: (i.pts && i.pts.length ? i.pts : [i.sd || '']).slice(0, 3), x: !!(i.x || i.tr), tr: !!i.tr }));
  function rptCover(ctx, d) {
    frameBg(ctx, true);
    const glow = ctx.createRadialGradient(W * 0.2, H * 0.78, 20, W * 0.2, H * 0.78, W * 0.9); glow.addColorStop(0, 'rgba(35,163,101,.35)'); glow.addColorStop(1, 'rgba(35,163,101,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(201,218,180,.16)'; ctx.lineWidth = 2; [260, 360, 460, 560].forEach(r => { ctx.beginPath(); ctx.arc(-40, H + 40, r, 0, Math.PI * 2); ctx.stroke(); });
    const M = 38; ctx.strokeStyle = 'rgba(201,218,180,.8)'; ctx.lineWidth = 3; K().rr(ctx, M, M, W - 2 * M, H - 2 * M, 44); ctx.stroke();
    if (chrome.logo) { const lh = 130, lw = lh * chrome.logo.width / chrome.logo.height; ctx.drawImage(chrome.logo, W - 100 - lw, 100, lw, lh); }
    pill(ctx, 'حصاد المنصة', 100 + 200, 165, { bg: 'rgba(238,243,229,.14)', fg: C.cream, fs: 26 });
    txt(ctx, 'التقرير', W - 100, 470, { font: `900 120px ${FONT.head}`, color: C.sage });
    txt(ctx, 'الشهري', W - 100, 610, { font: `900 170px ${FONT.head}`, color: '#fff' });
    ctx.fillStyle = C.sage; ctx.fillRect(W - 100 - 150, 650, 150, 8);
    txt(ctx, 'أرقام وفرص وأخبار منصة', W - 100, 730, { font: `600 38px ${FONT.body}`, color: C.cream });
    txt(ctx, 'مدرّبون سعوديّون', W - 100, 786, { font: `600 38px ${FONT.body}`, color: C.cream });
    ctx.font = `800 40px ${FONT.body}`; const w = ctx.measureText(d.mname).width + 80; rrect(ctx, W - 100 - w, 830, w, 80, 40, 'rgba(238,243,229,.12)', 'rgba(201,218,180,.55)'); txt(ctx, d.mname, W - 100 - w / 2, 884, { font: ctx.font, color: C.cream, align: 'center' });
    [[d.stats[0].num, 'زيارة للمنصة'], [d.stats[2].num, 'فرصة تعاون'], [d.stats[3].num, 'وظيفة']].forEach(([v, l], i) => { const x = W - 100 - i * 300; txt(ctx, String(v), x, 1180, { font: `900 74px ${FONT.head}`, color: '#fff', align: 'right', dir: 'ltr' }); txt(ctx, l, x, 1230, { font: `600 30px ${FONT.body}`, color: C.sage }); });
    txt(ctx, 'sauditrainers.sa', 100, 1240, { font: `800 34px ${FONT.brand}`, color: C.cream, align: 'left', dir: 'ltr' });
  }
  function rptStats(ctx, d) {
    const n = d.stats.length, gap = 24, h = Math.min(250, (BOT - TOP - 70 - (n - 1) * gap) / n);
    txt(ctx, `أرقام المنصة في شهر ${d.mname}`, W - PX, TOP + 36, { font: `900 44px ${FONT.head}`, color: C.g900 });
    d.stats.forEach((s, i) => {
      const y = TOP + 70 + i * (h + gap), R = W - PX - 40;
      rrect(ctx, PX, y, CW, h, 30, '#fff', C.line, 1.5); rrect(ctx, W - PX - 14, y + 26, 8, h - 52, 4, C.g800);
      const nf = fitFont(ctx, s.num, 900, 120, 60, 330, FONT.head);
      txt(ctx, s.num, PX + 50, y + h / 2 + nf * 0.34, { font: `900 ${nf}px ${FONT.head}`, color: C.g800, align: 'left', dir: 'ltr' });
      const tw = CW - 400 - 60; ctx.font = `800 34px ${FONT.body}`; const tl = K().wrap(ctx, s.label, tw, 2);
      ctx.font = `400 25px ${FONT.body}`; const nl = s.note ? K().wrap(ctx, s.note, tw, 3) : [];
      let cy = y + (h - (tl.length * 46 + (nl.length ? 8 + nl.length * 36 : 0))) / 2;
      tl.forEach(l => { cy += 46; txt(ctx, l, R, cy - 10, { font: `800 34px ${FONT.body}`, color: C.g900 }); });
      if (nl.length) { cy += 8; nl.forEach(l => { cy += 36; txt(ctx, l, R, cy - 8, { font: `400 25px ${FONT.body}`, color: C.ink2 }); }); }
    });
  }
  const rptGlyph = cls => { try { const i = document.createElement('i'); i.className = `fa-solid ${cls}`; i.style.cssText = 'position:absolute;left:-99px'; document.body.appendChild(i); const c = getComputedStyle(i, '::before').content; i.remove(); return String(c).replace(/^["']|["']$/g, '') || ''; } catch { return ''; } };
  const RPT_COLS = 2, RPT_CW = (CW - 22) / RPT_COLS, RPT_CH = 282, RPT_ROWS = 3;
  const rptTopicPages = items => { const per = RPT_COLS * RPT_ROWS, pages = []; for (let i = 0; i < items.length; i += per) pages.push(items.slice(i, i + per)); return pages; };
  // بطاقة طلب بتصميم بطاقات الواجهة (أيقونة ثم العنوان فالجهة فالمدينة والشهر فعدد الفرص) بخلفية فاتحة
  function rptTile(ctx, it, x, y, d) {
    const w = RPT_CW, h = RPT_CH, pad = 22, R = x + w - pad;
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#fff'); g.addColorStop(1, C.paper);
    rrect(ctx, x, y, w, h, 26, g, C.line, 1.5);
    try { ctx.save(); K().rr(ctx, x, y, w, h, 26); ctx.clip(); ctx.fillStyle = ctx.createPattern(K().patternTile(C.g800, 0.045), 'repeat'); ctx.fillRect(x, y, w, h); ctx.restore(); } catch { /* بلا نقش */ }
    const ic = x + w - pad - 28 - 8, cy = y + pad + 28;
    ctx.beginPath(); ctx.arc(ic, cy, 28, 0, Math.PI * 2); ctx.fillStyle = C.g100; ctx.fill();
    ctx.save(); ctx.font = '900 26px "Font Awesome 6 Free"'; ctx.fillStyle = C.g800; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(rptGlyph((specOf(it.spec) || {}).icon || 'fa-chalkboard-user'), ic, cy + 2); ctx.restore();
    const tw = w - 2 * pad - 14; let cyy = y + pad + 56 + 12;
    const long = String(it.c).length > 48, fs = long ? 25 : 28, lh = long ? 36 : 40;
    ctx.font = `900 ${fs}px ${FONT.head}`; const tl = K().wrap(ctx, it.c, tw, 3);
    tl.forEach((l, i) => txt(ctx, l, R - 8, cyy + lh * (i + 1) - 10, { font: ctx.font, color: C.g900 })); cyy += tl.length * lh;
    txt(ctx, it.org || 'جهة تدريبية', R - 8, cyy + 34, { font: `700 22px ${FONT.body}`, color: C.g700 });
    // أسفل البطاقة: المدينة والشهر، ثم عدد الفرص
    const by = y + h - pad;
    const meta = [it.city || '', d.mname.split(' ')[0]].filter(Boolean).join(' · ');
    txt(ctx, meta, R - 8, by - 54, { font: `500 21px ${FONT.body}`, color: C.muted });
    if (it.n > 0) pill(ctx, `${it.n.toLocaleString('en-US')} ${it.n === 1 ? 'فرصة' : 'فرص'} في هذا المجال`, R - 8, by - 16, { bg: C.g100, fg: C.g800, fs: 20 });
  }
  function rptTopics(ctx, rows, first, total, d) {
    txt(ctx, first ? 'فرص وطلبات التدريب هذا الشهر' : 'فرص وطلبات التدريب (تابع)', W - PX, TOP + 36, { font: `900 44px ${FONT.head}`, color: C.g900 });
    if (first) txt(ctx, `الأكثر طلباً في ${d.mname} (${total} مجالاً)`, W - PX, TOP + 82, { font: `500 26px ${FONT.body}`, color: C.muted });
    const y0 = TOP + 100;
    rows.forEach((it, i) => { const col = i % RPT_COLS, row = Math.floor(i / RPT_COLS); rptTile(ctx, it, W - PX - RPT_CW - col * (RPT_CW + 22), y0 + row * (RPT_CH + 22), d); });
  }
  function rptCard(ctx, c, i) {
    frameBg(ctx, true);
    const glow = ctx.createRadialGradient(W * 0.15, H * 0.2, 20, W * 0.15, H * 0.2, W * 0.9); glow.addColorStop(0, 'rgba(35,163,101,.35)'); glow.addColorStop(1, 'rgba(35,163,101,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    const M = 38; ctx.strokeStyle = 'rgba(201,218,180,.8)'; ctx.lineWidth = 3; K().rr(ctx, M, M, W - 2 * M, H - 2 * M, 44); ctx.stroke();
    if (chrome.logo) { const lh = 84, lw = lh * chrome.logo.width / chrome.logo.height; ctx.drawImage(chrome.logo, W - 90 - lw, 82, lw, lh); }
    pill(ctx, `من مزايا المنصة · ${i + 1} / ${rptCards().length}`, 90 + 290, 124, { bg: 'rgba(238,243,229,.14)', fg: C.cream, fs: 26 });
    const cx = W / 2, cy = 400;
    ctx.beginPath(); ctx.arc(cx, cy, 170, 0, Math.PI * 2); ctx.fillStyle = 'rgba(238,243,229,.10)'; ctx.fill(); ctx.strokeStyle = 'rgba(201,218,180,.35)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2); ctx.fillStyle = C.cream; ctx.fill();
    ctx.save(); ctx.font = '900 110px "Font Awesome 6 Free"'; ctx.fillStyle = C.g800; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(c.ic, cx, cy + 4); ctx.restore();
    if (c.x) { ctx.font = `700 22px ${FONT.body}`; exPill(ctx, cx + (ctx.measureText(c.tr ? 'متاحة للتجربة المجانية' : 'حصرية للمشتركين').width + 34) / 2, 598, 22, c.tr); }
    txt(ctx, c.k, cx, 690, { font: `900 96px ${FONT.head}`, color: '#fff', align: 'center' });
    ctx.fillStyle = C.sage; ctx.fillRect(cx - 75, 724, 150, 7);
    ctx.font = `600 38px ${FONT.body}`; K().wrap(ctx, c.t, W - 240, 2).forEach((l, k) => txt(ctx, l, cx, 800 + k * 54, { font: ctx.font, color: C.cream, align: 'center' }));
    c.pts.forEach((p, k) => {
      const y = 880 + k * 118; rrect(ctx, 90, y, W - 180, 100, 26, 'rgba(238,243,229,.10)', 'rgba(201,218,180,.32)');
      ctx.beginPath(); ctx.arc(W - 90 - 50, y + 50, 22, 0, Math.PI * 2); ctx.fillStyle = C.sage; ctx.fill();
      ctx.save(); ctx.font = '900 24px "Font Awesome 6 Free"'; ctx.fillStyle = C.g900; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText('', W - 90 - 50, y + 52); ctx.restore();
      ctx.font = `700 30px ${FONT.body}`; txt(ctx, K().wrap(ctx, p, W - 180 - 160, 1)[0], W - 90 - 94, y + 62, { font: ctx.font, color: '#fff' });
    });
    txt(ctx, 'sauditrainers.sa', cx, H - 70, { font: `800 30px ${FONT.brand}`, color: C.cream, align: 'center', dir: 'ltr' });
  }
  async function reportBuild(d) {
    await prepare(); await K().ensureQR();
    try { await document.fonts.load('900 32px "Font Awesome 6 Free"'); } catch { /* ignore */ }
    chrome.logo = await K().loadImage(LOGO.cream);
    const map = new Map();
    [...d.news].sort((a, b) => (b.ts || 0) - (a.ts || 0)).forEach(n => { const t = Store.get(`trainers/${n.trainerId}`); if (!t) return; if (!map.has(t.id)) map.set(t.id, { t, items: [] }); map.get(t.id).items.push(n); });
    const groups = [...map.values()], photos = new Map();
    await Promise.all(groups.map(async g => photos.set(g.t.id, g.t.noPhoto ? null : await K().loadImage(Data.photo(g.t)))));
    const attempt = () => {
      const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); c.direction = 'rtl'; c.textAlign = 'right'; c.__links = cv.__links = []; return [cv, c]; };
      const mc = mk()[1], tp = rptTopicPages(d.titles), npages = groups.length ? paginate(mc, groups, 'compact') : [];
      const total = 2 + tp.length + npages.length + rptCards().length + 1, out = []; let n = 1; let [cv, c] = mk();
      rptCover(c, d); out.push(cv);
      [cv, c] = mk(); chrome(c, ++n, total, 0, 0, 'التقرير الشهري'); txtMonth(c, d); rptStats(c, d); out.push(cv);
      tp.forEach((rows, i) => { [cv, c] = mk(); chrome(c, ++n, total, 0, 0, 'التقرير الشهري'); txtMonth(c, d); rptTopics(c, rows, i === 0, d.titles.length, d); out.push(cv); });
      npages.forEach(secs => {
        [cv, c] = mk(); chrome(c, ++n, total, 0, 0, 'التقرير الشهري'); txtMonth(c, d);
        let y = TOP; txt(c, `أخبار المدربين في ${d.mname}`, W - PX, y + 36, { font: `900 40px ${FONT.head}`, color: C.g900 });
        secs.forEach(sec => { y = TOP + 56 + (sec.y || 0); const hh = drawHeader(c, sec.t, photos.get(sec.t.id), PX, y, sec.cont, false, sec.H); y += hh + 14; sec.L.forEach(L => { drawItem(c, L, PX, y); y += L.h + 14; }); });
        out.push(cv);
      });
      rptCards().forEach((cd, i) => { [cv, c] = mk(); rptCard(c, cd, i); out.push(cv); });
      [cv, c] = mk(); promo(c); out.push(cv);
      return out;
    };
    const ok = cvs => { try { cvs.forEach(cv => cv.getContext('2d').getImageData(0, 0, 1, 1)); return true; } catch { return false; } };
    usePhotos = true; let cvs = attempt();
    if (!ok(cvs)) { usePhotos = false; cvs = attempt(); usePhotos = true; if (!ok(cvs)) throw new Error('تعذّر تصدير الصور'); }
    return cvs;
  }
  const txtMonth = (ctx, d) => txt(ctx, d.mname, PX, 118, { font: `600 24px ${FONT.body}`, color: C.sage, align: 'left' });
  async function report(d) {
    toast('جارٍ تصميم التقرير الشهري…');
    let cvs; try { cvs = await reportBuild(d); } catch (e) { console.error(e); return toast(`تعذّر إنشاء التقرير: ${e.message || e}`, 'error'); }
    const base = `sauditrainers-monthly-${d.ym}`, thumbs = cvs.map(cv => cv.toDataURL('image/jpeg', 0.55));
    const m = modal(`<h3><i class="fa-solid fa-file-pdf"></i> التقرير الشهري جاهز (${cvs.length} صفحة)</h3>
      <div class="bl-grid">${thumbs.map((s, i) => `<button type="button" class="bl-th" data-i="${i}" title="تنزيل الصفحة ${i + 1}"><img src="${s}" alt="صفحة ${i + 1}"><span>${i + 1}</span></button>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" data-pdf><i class="fa-solid fa-file-pdf"></i> ملف PDF</button><button class="btn" data-close>إغلاق</button></div>`);
    $('[data-pdf]', m.el).onclick = async e => { const b = e.currentTarget, h = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التجهيز'; try { await deliver(pdf(cvs), `${base}.pdf`); } catch (x) { console.error(x); toast('تعذّر التصدير', 'error'); } b.disabled = false; b.innerHTML = h; };
    $$('.bl-th', m.el).forEach(b => b.onclick = async () => { const i = +b.dataset.i; deliver(new Blob([await toPng(cvs[i])], { type: 'image/png' }), `${base}-${String(i + 1).padStart(2, '0')}.png`); });
  }

  // تنزيل «النشرة الشهرية» PDF مباشرة (من الصفحة العامة) دون نافذة معاينة
  async function reportPdf(d) {
    toast('جارٍ تجهيز النشرة PDF…');
    try { const cvs = await reportBuild(d); await deliver(pdf(cvs), `sauditrainers-monthly-${d.ym}.pdf`); } catch (e) { console.error(e); toast(`تعذّر إنشاء النشرة: ${e.message || e}`, 'error'); }
  }

  // أدوات الرسم لملفات PDF أخرى (مثل «ملف المدرب»): تُسلَّم كدالة لأن الخطوط تُحمَّل عند prepare()
  const kit = () => ({ C, W, H, PX, CW, TOP, BOT, FONT, txt, pill, rrect, fitFont, qr, avatar, frameBg, chrome, prepare, pdf, deliver, toPng, setPhotos: v => { usePhotos = v; }, logo: () => K().loadImage(LOGO.cream) });
  return { make, build, zip, pdf, limit, og, deliver, report, reportPdf, reportBuild, kit };
})();
