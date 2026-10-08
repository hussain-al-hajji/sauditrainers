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
      if (t.noPhoto) { ctx.translate(x0, y0); ctx.scale(D / 100, D / 100); ctx.fillStyle = C.sage; if (t.gender === 'f') ctx.fill(new Path2D(K().SYM_F)); else { ctx.beginPath(); ctx.arc(50, 36, 17, 0, Math.PI * 2); ctx.fill(); ctx.fill(new Path2D(K().SYM_M_BODY)); } }
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
  const HDR = { s: 132, big: 214 };
  function layoutItem(ctx, n, mode, availH) {
    const big = mode === 'single', f = big ? { tf: 50, tl: 68, tm: 4, bf: 30, bl: 52 } : { tf: 32, tl: 46, tm: 2, bf: 25, bl: 40 };
    const pad = big ? 44 : 28, inner = CW - 2 * pad - 14, links = arr(n.links).slice(0, 3);
    ctx.font = `900 ${f.tf}px ${FONT.head}`; const title = clip(ctx, K().wrap(ctx, n.title, inner, f.tm), inner);
    const linksH = !links.length ? 0 : big ? links.length * 106 + 6 : 62;
    const body = collapse(n.body);
    let bodyMax = big ? 0 : (mode === 'trainer' ? 6 : 3);
    if (big) { const used = HDR.big + 20 + pad + 46 + 14 + title.length * f.tl + (linksH ? 14 + linksH : 0) + pad; bodyMax = Math.max(3, Math.min(14, Math.floor((availH - used - 10) / f.bl))); }
    ctx.font = `400 ${f.bf}px ${FONT.body}`; const lines = body ? clip(ctx, K().wrap(ctx, body, inner, bodyMax), inner) : [];
    const h = pad + 46 + 14 + title.length * f.tl + (lines.length ? 10 + lines.length * f.bl : 0) + (linksH ? 14 + linksH : 0) + pad;
    return { n, h, f, pad, big, title, lines, links, inner };
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
  }
  function drawHeader(ctx, t, img, x, y, cont, big) {
    const h = big ? HDR.big : HDR.s, w = CW, R = big ? 74 : 46, qs = big ? 120 : 76;
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, C.g900); g.addColorStop(1, C.g800); rrect(ctx, x, y, w, h, 30, g);
    try { ctx.save(); K().rr(ctx, x, y, w, h, 30); ctx.clip(); ctx.fillStyle = ctx.createPattern(K().patternTile(C.sage, 0.1), 'repeat'); ctx.fillRect(x, y, w, h); ctx.restore(); } catch { /* */ }
    avatar(ctx, t, img, x + w - 26 - R - 4, y + h / 2, R);
    const tr = x + w - 26 - 2 * R - 24, avail = tr - (x + 26 + qs + 16 + 20);
    const fs = fitFont(ctx, t.name || '', 900, big ? 50 : 36, 24, avail, FONT.head);
    txt(ctx, t.name || '', tr, y + h / 2 - (big ? 8 : 4), { font: `900 ${fs}px ${FONT.head}`, color: '#fff' });
    ctx.font = `600 ${big ? 28 : 22}px ${FONT.body}`; const ttl = K().wrap(ctx, t.title || '', avail, 1)[0] || '';
    txt(ctx, ttl, tr, y + h / 2 + (big ? 40 : 30), { font: ctx.font, color: C.sage });
    if (cont) pill(ctx, 'تتمة', tr, y + 22, { bg: 'rgba(255,255,255,.14)', fg: C.cream, fs: 18 });
    qr(ctx, profileUrl(t), x + 26, y + (h - qs - 16) / 2, qs);
    return h;
  }

  /* ---------- هيكل الصفحات ---------- */
  function chrome(ctx, i, total, from, to) {
    frameBg(ctx, false);
    const g = ctx.createLinearGradient(0, 0, W, 150); g.addColorStop(0, C.g950); g.addColorStop(1, C.g800); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 150);
    try { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 150); ctx.clip(); ctx.fillStyle = ctx.createPattern(K().patternTile(C.sage, 0.1), 'repeat'); ctx.fillRect(0, 0, W, 150); ctx.restore(); } catch { /* */ }
    ctx.fillStyle = C.sage; ctx.fillRect(0, 150, W, 6);
    if (chrome.logo) { const lh = 74, lw = lh * chrome.logo.width / chrome.logo.height; ctx.drawImage(chrome.logo, W - PX - lw, 38, lw, lh); }
    txt(ctx, 'نشرة المدربين', PX + 0, 76, { font: `900 44px ${FONT.head}`, color: '#fff', align: 'left' });
    txt(ctx, rangeTxt(from, to), PX, 118, { font: `600 24px ${FONT.body}`, color: C.sage, align: 'left' });
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
    if (mode === 'single') { groups.forEach(g => g.items.forEach(n => pages.push([{ t: g.t, big: true, L: [layoutItem(ctx, n, 'single', avail)], cont: false }]))); return pages; }
    let cur = null, used = 0; const newPage = () => { cur = []; pages.push(cur); used = 0; };
    groups.forEach(g => {
      if (mode === 'trainer' || !cur) newPage();
      const rest = g.items.map(n => layoutItem(ctx, n, mode, avail)); let first = true;
      while (rest.length) {
        if (used && used + GAP + HDR.s + 14 + rest[0].h > avail) newPage();
        const start = used ? used + GAP : 0, sec = { t: g.t, big: false, L: [], cont: !first, y: start }; let h = HDR.s;
        cur.push(sec);
        while (rest.length && start + h + 14 + rest[0].h <= avail) { h += 14 + rest[0].h; sec.L.push(rest.shift()); }
        if (!sec.L.length) { sec.L.push(rest.shift()); h += 14 + sec.L[0].h; }
        used = start + h; first = false;
        if (rest.length) newPage();
      }
    });
    return pages;
  }

  /* ---------- البناء ---------- */
  async function build({ items, from, to, layout = 'compact', withCover = true }) {
    const tp = K().template(); await Promise.race([K().ensureFonts(tp), new Promise(r => setTimeout(r, 6000))]); await K().ensureQR();
    FONT = { head: K().fontCss(tp.fonts.name), body: K().fontCss(tp.fonts.body), brand: K().fontCss(tp.fonts.brand) };
    chrome.logo = await K().loadImage(LOGO.cream);
    // مجموعات المدربين بترتيب أحدث خبر
    const sorted = [...items].sort((a, b) => (b.ts || 0) - (a.ts || 0)), map = new Map();
    sorted.forEach(n => { const t = Store.get(`trainers/${n.trainerId}`); if (!t) return; if (!map.has(t.id)) map.set(t.id, { t, items: [] }); map.get(t.id).items.push(n); });
    const groups = [...map.values()];
    if (!groups.length) throw new Error('لا توجد أخبار في الاختيار');
    const photos = new Map(); await Promise.all(groups.map(async g => photos.set(g.t.id, g.t.noPhoto ? null : await K().loadImage(Data.photo(g.t)))));
    const st = { items: sorted.length, trainers: groups.map(g => g.t), photos };
    const attempt = () => {
      const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); c.direction = 'rtl'; c.textAlign = 'right'; return [cv, c]; };
      const pages = paginate(mk()[1], groups, layout), total = pages.length + (withCover ? 1 : 0), out = [];
      if (withCover) { const [cv, c] = mk(); cover(c, st, from, to); out.push(cv); }
      pages.forEach((secs, pi) => {
        const [cv, c] = mk(); chrome(c, pi + 1 + (withCover ? 1 : 0), total, from, to);
        let y = TOP; if (layout === 'single') y = TOP;
        secs.forEach(sec => {
          y = TOP + (sec.y || 0); const hh = drawHeader(c, sec.t, photos.get(sec.t.id), PX, y, sec.cont, sec.big); y += hh + (sec.big ? 20 : 14);
          sec.L.forEach(L => { drawItem(c, L, PX, y); y += L.h + 14; });
        });
        out.push(cv);
      });
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
  function zip(files) {   // files: [{name, data:Uint8Array}] — تخزين بلا ضغط (الصور مضغوطة أصلاً)
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
    cvs.forEach((cv, i) => {
      const jpg = b64(cv.toDataURL('image/jpeg', 0.92)), p = 3 + 3 * i, content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
      obj(p, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`]);
      obj(p + 1, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
      obj(p + 2, [`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`, jpg, '\nendstream']);
    });
    const xr = len, cnt = 3 + 3 * N;
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

  return { make, build, zip, pdf };
})();
