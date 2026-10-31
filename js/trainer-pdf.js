/* «حفظ ملف سيرة احترافي PDF»: يولّد من الصفحة العامة للمدرب ملف PDF بمقاس صفحات نشرة المدربين (1080×1350) وبهويتها،
 * بنفس ترتيب محتوى الصفحة: ترويسة المدرب (صورة وشارة توثيق واسم وسطر تعريفي ورمز QR) ثم نبذة، فيديوهات (غلاف وعنوان)،
 * تخصصات، دورات، شهادات احترافية، جهات تعاون، توصيات، شهادات واعتمادات، معلومات إضافية وسريعة، وأخيراً عناوين الأخبار في صفحة واحدة.
 * النصوص الطويلة متساوية الأطراف (توزيع الفراغات بين الكلمات في كل سطر عدا الأخير). */

const TrainerPdf = (() => {
  const GOLD = '#D9B44A';
  const clean = s => { s = String(s == null ? '' : s); if (typeof plainText === 'function') s = String(plainText(s) ?? s); return s.replace(/\r/g, '').trim(); };
  const hasLatinOnly = w => /[A-Za-z0-9]/.test(w) && !/[؀-ۿ]/.test(w);

  /* ---------- تقسيم النص إلى أسطر متساوية الأطراف ---------- */
  // كل «وحدة» كلمة عربية، أو متتالية كلمات لاتينية/أرقام (تُرسم معاً بالاتجاه الصحيح)
  function tokens(p) {
    const ws = p.split(/\s+/).filter(Boolean), out = [];
    ws.forEach(w => { const last = out[out.length - 1]; if (last && last.latin && hasLatinOnly(w)) last.text += ' ' + w; else out.push({ text: w, latin: hasLatinOnly(w) }); });
    return out;
  }
  function wrapJ(ctx, text, maxW, font, maxLines = 99) {
    ctx.font = font; const out = [], sp = ctx.measureText(' ').width;
    const paras = clean(text).split(/\n+/).filter(Boolean);
    for (const p of paras) {
      let cur = [], cw = 0;
      const flush = last => { if (cur.length) out.push({ toks: cur, last, w: cw }); cur = []; cw = 0; };
      for (const tk of tokens(p)) {
        const w = ctx.measureText(tk.text).width;
        if (cur.length && cw + sp + w > maxW) flush(false);
        cw += (cur.length ? sp : 0) + w; cur.push({ ...tk, w });
      }
      flush(true);
    }
    if (out.length > maxLines) { out.length = maxLines; const l = out[maxLines - 1]; l.last = true; l.toks = l.toks.slice(0, Math.max(1, l.toks.length - 1)); l.toks.push({ text: '…', w: 20 }); }
    return out;
  }
  function drawJ(ctx, line, right, y, width, font, color, K) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'right';
    const n = line.toks.length, sp = ctx.measureText(' ').width, sum = line.toks.reduce((a, t) => a + t.w, 0);
    const gap = !line.last && n > 1 ? Math.max(sp, (width - sum) / (n - 1)) : sp;
    let x = right;
    line.toks.forEach(tk => { K.txt(ctx, tk.text, x, y, { font, color, align: 'right', dir: tk.latin ? 'ltr' : 'rtl' }); x -= tk.w + gap; });
  }

  /* ---------- أدوات ---------- */
  const archived = ts => new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  const starsTxt = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  function seal(ctx, cx, cy, R, fill, check) {
    const r = R * 0.8; ctx.beginPath();
    for (let i = 0; i < 24; i++) { const a = -Math.PI / 2 + i * Math.PI / 12, d = i % 2 ? r : R; ctx.lineTo(cx + d * Math.cos(a), cy + d * Math.sin(a)); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = check; ctx.lineWidth = R * 0.17; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx - R * 0.32, cy + R * 0.03); ctx.lineTo(cx - R * 0.08, cy + R * 0.27); ctx.lineTo(cx + R * 0.36, cy - R * 0.25); ctx.stroke(); ctx.lineCap = 'butt';
  }
  function play(ctx, cx, cy, R, bg, fg) {
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - R * 0.28, cy - R * 0.4); ctx.lineTo(cx - R * 0.28, cy + R * 0.4); ctx.lineTo(cx + R * 0.46, cy); ctx.closePath(); ctx.fillStyle = fg; ctx.fill();
  }

  /* ---------- جمع محتوى الصفحة ---------- */
  function collect(t) {
    const sp = Data.specs(t).map(specName).filter(Boolean), tp = Data.topics(t), md = Data.modes(t);
    const list = v => String(v || '').replace(/\n/g, '،');
    const extras = (typeof FormKit !== 'undefined' ? FormKit.customDefs() : []).filter((f, i, l) => f.pub && t.extra && t.extra[f.k] && l.findIndex(x => x.k === f.k) === i);
    const videos = (typeof Videos !== 'undefined' ? Videos.list(t) : []).map(v => { const i = Videos.parse(v.u); return { url: v.u, title: clean(v.t) || hostOf(v.u), thumb: i.thumb || v.i || '', kind: i.kind }; });
    const reviews = Object.values(Store.get(`reviewsPub/${t.id}`) || {}).filter(r => r && r.text).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 6);
    const news = (typeof News !== 'undefined' ? News.visible() : []).filter(n => n.trainerId === t.id).slice(0, 8);
    const kv = [
      [regionsOf(t).length > 1 ? 'المناطق' : 'المنطقة', `${regionsLabel(t) || '—'}${t.city ? ' · ' + t.city : ''}`],
      t.travel ? ['التنقل', 'مستعد للسفر حسب الاحتياجات التدريبية'] : null,
      ['طريقة التقديم', md.map(m => (DELIVERY.find(d => d.k === m) || {}).name).filter(Boolean).join('، ') || '—'],
      Number(t.years) ? ['سنوات الخبرة', String(t.years)] : null,
      Number(t.hours) ? ['الساعات التدريبية', Number(t.hours).toLocaleString('en-US')] : null,
      t.langs ? ['لغات التدريب', clean(t.langs)] : null
    ].filter(Boolean);
    return { sp, tp, videos, reviews, news, kv, extras, proCerts: splitList(list(t.proCerts)), partners: splitList(list(t.partners)) };
  }

  /* ---------- البناء ---------- */
  async function build(t, K) {
    await Card.kit.ensureQR();
    try { await document.fonts.load('900 32px "Font Awesome 6 Free"'); } catch { /* ignore */ }
    const { C, W, H, PX, CW, TOP, BOT } = K, FONT = K.FONT, KT = Card.kit, url = profileUrl(t), data = collect(t);
    const th = KT.themed(t), logo = await KT.loadImage(th.light ? LOGO.green : LOGO.cream); const photo = t.noPhoto ? null : await KT.loadImage(Data.photo(t));
    const thumbs = await Promise.all(data.videos.map(v => (v.thumb ? KT.loadImage(v.thumb) : null)));
    const attempt = total => {
      const pages = []; let cv, ctx, y;
      const newPage = () => {
        cv = document.createElement('canvas'); cv.width = W; cv.height = H; ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.__links = cv.__links = [];
        pages.push(cv); K.chrome.logo = logo; K.chrome(ctx, pages.length, total, 0, 0, 'ملف سيرة احترافي', th);
        K.txt(ctx, clean(t.name), PX, 118, { font: `600 24px ${FONT.body}`, color: th.accent, align: 'left' });
        y = TOP;
      };
      const center2 = (x, str, cx, yy, o) => K.txt(x, str, cx, yy, { ...o, align: 'center' });
      const need = h => { if (y + h > BOT) newPage(); };
      const link = (x, yy, w, h, u) => { if (/^https:\/\//.test(u)) ctx.__links.push({ x, y: yy, w, h, url: u }); };
      const heading = (title, count, keep = 80) => {
        // قسم جديد لا يبدأ في أسفل الصفحة: إن بقي أقل من ثلث الصفحة يُرحَّل للصفحة التالية
        if (y > TOP + 4 && BOT - y < (BOT - TOP) / 3) newPage();
        need(90 + keep); const R = W - PX;
        K.rrect(ctx, R - 10, y + 6, 10, 46, 5, C.g800);
        K.txt(ctx, title, R - 28, y + 46, { font: `900 38px ${FONT.head}`, color: C.g900 });
        if (count != null) K.txt(ctx, `(${count})`, PX + 6, y + 44, { font: `700 28px ${FONT.body}`, color: C.muted, align: 'left', dir: 'ltr' });
        ctx.fillStyle = C.line; ctx.fillRect(PX, y + 66, CW, 2); y += 90;
      };
      const paragraph = (text, { x = PX, w = CW, size = 28, lh = 50, color = C.ink2, maxLines = 99 } = {}) => {
        const font = `400 ${size}px ${FONT.body}`, lines = wrapJ(ctx, text, w, font, maxLines);
        lines.forEach(l => { need(lh); drawJ(ctx, l, x + w, y + lh - 14, w, font, color, K); y += lh; });
        y += 12;
      };
      const chips = items => {
        const fs = 26, h = 58, gap = 12; let rx = W - PX, rowY = null;
        ctx.font = `700 ${fs}px ${FONT.body}`;
        items.forEach(s => {
          s = clean(s); if (!s) return; ctx.font = `700 ${fs}px ${FONT.body}`; const w = Math.min(CW, ctx.measureText(s).width + 44);
          if (rowY == null || rx - w < PX) { if (rowY != null) y += h + gap; need(h + gap); rowY = y; rx = W - PX; }
          K.rrect(ctx, rx - w, y, w, h, h / 2, C.g100, 'rgba(0,84,48,.18)', 1.5);
          ctx.save(); ctx.beginPath(); ctx.rect(rx - w + 14, y, w - 28, h); ctx.clip(); K.txt(ctx, s, rx - w / 2, y + h / 2 + 9, { font: `700 ${fs}px ${FONT.body}`, color: C.g800, align: 'center' }); ctx.restore();
          rx -= w + gap;
        });
        if (rowY != null) y += h + 34;
      };

      /* غلاف أمامي بروح البطاقة التعريفية: صورة وشارة توثيق واسم وسطر تعريفي ومنطقة وإحصاءات وتخصصات وتذييل بالرمز */
      const mkPage = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.direction = 'rtl'; x.textAlign = 'right'; x.__links = c.__links = []; return [c, x]; };
      const A = (c, a) => KT.hex(c, a), soft = th.accent, main = th.fg;
      const darkBase = (x, glowX, glowY) => {
        const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, th.a); g.addColorStop(0.55, th.b); g.addColorStop(1, th.a); x.fillStyle = g; x.fillRect(0, 0, W, H);
        try { x.save(); x.fillStyle = x.createPattern(KT.patternTile(th.light ? '#005430' : th.accent, th.light ? 0.06 : 0.1), 'repeat'); x.fillRect(0, 0, W, H); x.restore(); } catch { /* بلا نقش */ }
        const gl = x.createRadialGradient(glowX, glowY, 20, glowX, glowY, W * 0.85); gl.addColorStop(0, A(th.c, th.light ? 0.4 : 0.5)); gl.addColorStop(1, A(th.c, 0)); x.fillStyle = gl; x.fillRect(0, 0, W, H);
        const M = 38; x.strokeStyle = A(th.accent, 0.8); x.lineWidth = 3; KT.rr(x, M, M, W - 2 * M, H - 2 * M, 44); x.stroke();
        x.strokeStyle = A(th.accent, 0.26); x.lineWidth = 1.5; KT.rr(x, M + 14, M + 14, W - 2 * M - 28, H - 2 * M - 28, 34); x.stroke();
      };
      const center = (x, str, cy, o) => K.txt(x, str, W / 2, cy, { ...o, align: 'center' });
      const pillC = (x, str, cy, o) => { x.font = `700 ${o.fs || 24}px ${FONT.body}`; const w = x.measureText(str).width + 34; return K.pill(x, str, W / 2 + w / 2, cy, o); };
      {
        const [c0, x0] = mkPage(); pages.push(c0); darkBase(x0, W * 0.5, H * 0.3);
        if (logo) { const lh = 92, lw = lh * logo.width / logo.height; x0.drawImage(logo, W - 96 - lw, 84, lw, lh); }
        K.pill(x0, 'ملف سيرة احترافي', 96 + 230, 130, { bg: A(th.accent, 0.14), fg: main, fs: 25 });
        // التخطيط يُحسب من المساحة المتاحة فوق التذييل: يصغّر حجم الصورة تدريجياً (ثم يقلّل التخصصات) حتى لا يتداخل شيء مع التذييل
        const cx = W / 2, fy = H - 38 - 14 - 150, limit = fy - 24, Y0 = 204;
        const nfs = K.fitFont(x0, clean(t.name), 900, 78, 40, 880, FONT.head);
        x0.font = `600 33px ${FONT.body}`; const tl = KT.wrap(x0, clean(t.title), 860, 2);
        const loc = [regionsLabel(t), t.city].filter(Boolean).join(' · ');
        const stats = [[t.years, 'سنة خبرة'], [t.hours, 'ساعة تدريبية'], [t.programs, 'برنامج ودورة']].filter(s => Number(s[0]) > 0);
        x0.font = `700 26px ${FONT.body}`;
        const rowsW = []; { let cur = [], cw = 0; data.sp.slice(0, 4).forEach(sn0 => { const sn = KT.wrap(x0, sn0, 516, 1)[0] || sn0, w = Math.min(560, x0.measureText(sn).width + 44); if (cur.length && cw + 12 + w > 900) { rowsW.push(cur); cur = []; cw = 0; } cw += (cur.length ? 12 : 0) + w; cur.push([sn, w]); }); if (cur.length) rowsW.push(cur); }
        const plan = (R, rows, tot) => {
          const nameY = Y0 + 2 * R + 92, tY = nameY + 58; let y = tY + (tl.length - 1) * 46 + 26;
          const pills = (loc ? 1 : 0) + (tot ? 1 : 0); y += pills * 62 + 18;
          const statsY = y; if (stats.length) y += 148;
          const chipsY = y; y += rows * 68;
          return { R, nameY, tY, pills, statsY, chipsY, end: y - 12, rows, tot };
        };
        let L = null;
        for (const [rows, tot] of [[Math.min(2, rowsW.length), !!t.tot], [Math.min(1, rowsW.length), !!t.tot], [Math.min(1, rowsW.length), false], [0, false]]) {
          for (let R = 170; R >= 92; R -= 6) { const c = plan(R, rows, tot); if (c.end <= limit) { L = c; break; } }
          if (L) break;
        }
        if (!L) L = plan(92, 0, false);
        const cy = Y0 + L.R;
        K.avatar(x0, { ...t }, photo, cx, cy, L.R, th.accent);
        seal(x0, cx + L.R * 0.7, cy + L.R * 0.7, Math.round(30 + L.R * 0.13), th.accent, th.light ? '#FFFFFF' : th.a);
        center(x0, clean(t.name), L.nameY, { font: `900 ${nfs}px ${FONT.head}`, color: main });
        tl.forEach((l, i) => center(x0, l, L.tY + i * 46, { font: `600 33px ${FONT.body}`, color: soft }));
        let ly = L.tY + (tl.length - 1) * 46 + 26 + 34;
        if (loc) { pillC(x0, loc, ly, { bg: A(th.accent, 0.13), fg: main, fs: 25 }); ly += 62; }
        if (L.tot) pillC(x0, 'حاصل على شهادة تدريب المدربين', ly, { bg: A(th.accent, 0.13), fg: soft, fs: 22 });
        if (stats.length) {
          const sw = 270, gap = 18, tw = stats.length * sw + (stats.length - 1) * gap, sy = L.statsY;
          stats.forEach((s, i) => {
            const sx = W / 2 + tw / 2 - sw - i * (sw + gap); K.rrect(x0, sx, sy, sw, 118, 26, A(th.accent, 0.10), A(th.accent, 0.32));
            center2(x0, `+${Number(s[0]).toLocaleString('en-US')}`, sx + sw / 2, sy + 66, { font: `900 52px ${FONT.head}`, color: main, dir: 'ltr' });
            center2(x0, s[1], sx + sw / 2, sy + 100, { font: `600 23px ${FONT.body}`, color: soft });
          });
        }
        // التخصصات (رقاقات تشبه رقاقات البطاقة)
        let cy2 = L.chipsY;
        rowsW.slice(0, L.rows).forEach(row => {
          const tw = row.reduce((a, r) => a + r[1], 0) + (row.length - 1) * 12; let rx = W / 2 + tw / 2;
          row.forEach(([sn, w]) => { K.rrect(x0, rx - w, cy2, w, 56, 28, A(th.accent, 0.10), A(th.accent, 0.35)); x0.save(); x0.beginPath(); x0.rect(rx - w + 12, cy2, w - 24, 56); x0.clip(); center2(x0, sn, rx - w / 2, cy2 + 37, { font: `700 26px ${FONT.body}`, color: main }); x0.restore(); rx -= w + 12; });
          cy2 += 68;
        });
        // تذييل بنفس روح البطاقة: رمز QR ونص الدعوة واسم المنصة
        const fh = 150; K.rrect(x0, 70, fy, W - 140, fh, 28, th.light ? A(th.accent, 0.08) : A(th.a, 0.55), A(th.accent, 0.25));
        const qs = 100; K.qr(x0, url, 100, fy + (fh - qs - 16) / 2, qs); c0.__links.push({ x: 100, y: fy + (fh - qs - 16) / 2, w: qs + 16, h: qs + 16, url });
        K.txt(x0, 'لقراءة السيرة الذاتية والتواصل تفضل بزيارة منصة', W - 100, fy + 62, { font: `500 25px ${FONT.body}`, color: soft });
        K.txt(x0, 'مدرّبون سعوديّون', W - 100, fy + 112, { font: `900 38px ${FONT.head}`, color: main });
        x0.font = `900 38px ${FONT.head}`; const bw = x0.measureText('مدرّبون سعوديّون').width;
        K.txt(x0, 'SaudiTrainers.sa', W - 100 - bw - 26, fy + 112, { font: `800 30px ${FONT.brand}`, color: soft, dir: 'ltr' });
        c0.__links.push({ x: 70, y: fy, w: W - 140, h: fh, url });
      }
      newPage();

      /* الأقسام بترتيب الصفحة العامة */
      if (clean(t.bio)) { heading('نبذة تعريفية', null, 140); paragraph(t.bio); }
      if (data.videos.length) {
        heading('نماذج من جلساتي التدريبية', data.videos.length, 330);
        const cw = (CW - 22) / 2, th = Math.round(cw * 9 / 16);
        for (let i = 0; i < data.videos.length; i += 2) {
          const pair = data.videos.slice(i, i + 2);
          ctx.font = `700 26px ${FONT.body}`; const tls = pair.map(v => KT.wrap(ctx, v.title, cw - 36, 2)), hh = th + 22 + Math.max(...tls.map(l => l.length)) * 38 + 30;
          need(hh);
          pair.forEach((v, k) => {
            const vx = W - PX - cw - k * (cw + 22), im = thumbs[i + k];
            K.rrect(ctx, vx, y, cw, hh, 24, '#fff', C.line, 1.5);
            ctx.save(); KT.rr(ctx, vx + 10, y + 10, cw - 20, th, 16); ctx.clip();
            if (im && usePhotosOn(K)) { const s = Math.max((cw - 20) / im.width, th / im.height), iw = im.width * s, ih = im.height * s; ctx.drawImage(im, vx + 10 + (cw - 20 - iw) / 2, y + 10 + (th - ih) / 2, iw, ih); }
            else { const gg = ctx.createLinearGradient(vx, y, vx + cw, y + th); gg.addColorStop(0, C.g900); gg.addColorStop(1, C.g800); ctx.fillStyle = gg; ctx.fillRect(vx + 10, y + 10, cw - 20, th); }
            ctx.restore();
            play(ctx, vx + cw / 2, y + 10 + th / 2, 40, 'rgba(0,26,14,.62)', '#fff');
            tls[k].forEach((l, j) => K.txt(ctx, l, vx + cw - 22, y + th + 22 + 38 * (j + 1) - 6, { font: `700 26px ${FONT.body}`, color: C.g900 }));
            link(vx, y, cw, hh, v.url);
          });
          y += hh + 22;
        }
        y += 10;
      }
      if (data.sp.length) { heading('التخصصات التدريبية', data.sp.length); chips(data.sp); }
      if (data.tp.length) { heading('دورات تم تقديمها سابقاً', data.tp.length); chips(data.tp); }
      if (data.proCerts.length) { heading('شهادات احترافية يدرّب عليها'); chips(data.proCerts); }
      if (data.partners.length) { heading('جهات تم التعاون معها'); chips(data.partners); }
      if (data.reviews.length) {
        heading('مراجعات وتوصيات', data.reviews.length, 200);
        data.reviews.forEach(r => {
          const font = `400 27px ${FONT.body}`, lines = wrapJ(ctx, r.text, CW - 90, font, 9), lh = 46, h = 40 + lines.length * lh + 82;
          need(h); K.rrect(ctx, PX, y, CW, h, 26, '#fff', C.line, 1.5); K.rrect(ctx, W - PX - 10, y + 24, 6, h - 48, 3, C.g800);
          lines.forEach((l, i) => drawJ(ctx, l, W - PX - 40, y + 36 + lh * (i + 1) - 12, CW - 90, font, C.ink, K));
          const by = y + 40 + lines.length * lh + 36, who = [clean(r.name), clean(r.role), clean(r.org)].filter(Boolean);
          K.txt(ctx, who[0] || '', W - PX - 40, by, { font: `900 27px ${FONT.head}`, color: C.g900 });
          if (who.length > 1) { ctx.font = `800 27px ${FONT.head}`; const nw = ctx.measureText(who[0]).width; K.txt(ctx, who.slice(1).join(' · '), W - PX - 40 - nw - 16, by, { font: `500 24px ${FONT.body}`, color: C.muted }); }
          if (Number(r.rating) > 0) K.txt(ctx, starsTxt(Number(r.rating)), PX + 28, by, { font: `700 28px ${FONT.body}`, color: GOLD, align: 'left', dir: 'ltr' });
          y += h + 16;
        });
        y += 10;
      }
      if (clean(t.certs)) { heading('الشهادات والاعتمادات والعضويات', null, 140); paragraph(t.certs); }
      if (data.extras.length) {
        heading('معلومات إضافية', null, 90);
        data.extras.forEach(f => {
          const val = clean(String(t.extra[f.k]).replace(/\|/g, '، ')); ctx.font = `600 27px ${FONT.body}`; const vl = KT.wrap(ctx, val, CW - 340, 3), h = Math.max(64, vl.length * 40 + 22);
          need(h + 10); K.rrect(ctx, PX, y, CW, h, 20, C.paper, C.line, 1.5);
          K.txt(ctx, clean(f.label), W - PX - 24, y + h / 2 + 9, { font: `700 26px ${FONT.body}`, color: C.muted });
          vl.forEach((l, i) => K.txt(ctx, l, W - PX - 330, y + 40 + i * 40 - (vl.length - 1) * 0 - 6 + (h - vl.length * 40 - 22) / 2 + 6, { font: `600 27px ${FONT.body}`, color: C.ink }));
          y += h + 10;
        });
        y += 14;
      }
      heading('معلومات سريعة', null, 130);
      const kw = (CW - 18) / 2;
      for (let i = 0; i < data.kv.length; i += 2) {
        const row = data.kv.slice(i, i + 2); ctx.font = `700 27px ${FONT.body}`;
        const ls = row.map(([, v]) => KT.wrap(ctx, v, kw - 40, 3)), h = 56 + Math.max(...ls.map(l => l.length)) * 38 + 18;
        need(h + 14);
        row.forEach(([k], j) => {
          const kx = W - PX - kw - j * (kw + 18); K.rrect(ctx, kx, y, kw, h, 22, '#fff', C.line, 1.5);
          K.txt(ctx, k, kx + kw - 22, y + 38, { font: `600 23px ${FONT.body}`, color: C.muted });
          ls[j].forEach((l, m) => K.txt(ctx, l, kx + kw - 22, y + 56 + 38 * (m + 1) - 10, { font: `800 27px ${FONT.body}`, color: C.g900 }));
        });
        y += h + 14;
      }

      /* أخبار المدرب: عناوين فقط في صفحة واحدة */
      if (data.news.length) {
        newPage(); heading('أخبار المدرب', data.news.length);
        data.news.forEach(n => {
          const kind = (News.kinds.find(k => k[0] === n.kind) || News.kinds[0])[1];
          ctx.font = `800 29px ${FONT.head}`; const tl = KT.wrap(ctx, clean(n.title), CW - 70, 2), h = 56 + tl.length * 42 + 24;
          if (y + h > BOT - 190) return;
          K.rrect(ctx, PX, y, CW, h, 24, '#fff', C.line, 1.5); K.rrect(ctx, W - PX - 10, y + 22, 6, h - 44, 3, C.g800);
          K.pill(ctx, kind, W - PX - 34, y + 40, { bg: C.g100, fg: C.g800, fs: 21 });
          K.txt(ctx, archived(n.ts), PX + 30, y + 46, { font: `600 22px ${FONT.body}`, color: C.muted, align: 'left' });
          tl.forEach((l, i) => K.txt(ctx, l, W - PX - 34, y + 56 + 42 * (i + 1) - 4, { font: `800 29px ${FONT.head}`, color: C.g900 }));
          y += h + 14;
        });
        const nh = 150, ny = y + 10; K.rrect(ctx, PX, ny, CW, nh, 28, C.cream, 'rgba(0,84,48,.25)', 2);
        ctx.font = `700 29px ${FONT.body}`; const nt = KT.wrap(ctx, 'للاطلاع على تفاصيل الأخبار كاملة، يُرجى زيارة صفحة المدرب على الموقع:', CW - 60, 2);
        nt.forEach((l, i) => K.txt(ctx, l, W - PX - 30, ny + 52 + i * 42, { font: ctx.font, color: C.g900 }));
        K.txt(ctx, url.replace(/^https?:\/\//, ''), W - PX - 30, ny + nh - 26, { font: `800 26px ${FONT.brand}`, color: C.g800, dir: 'ltr' });
        link(PX, ny, CW, nh, url);
      }
      /* غلاف خلفي: تعريف مختصر بالمنصة ودعوة لتصفح السير الذاتية والتسجيل */
      {
        const [c1, x1] = mkPage(); pages.push(c1); darkBase(x1, W * 0.5, H * 0.75);
        const base = siteBase();
        if (logo) { const lh = 130, lw = lh * logo.width / logo.height; x1.drawImage(logo, W / 2 - lw / 2, 190, lw, lh); }
        center(x1, 'دليل المدربين السعوديين', 470, { font: `900 62px ${FONT.head}`, color: main });
        x1.fillStyle = soft; x1.fillRect(W / 2 - 60, 504, 120, 6);
        x1.font = `500 31px ${FONT.body}`; KT.wrap(x1, 'مدربون ومدربات سعوديون بسيرهم الذاتية في مكان واحد، تتصفحها وتتواصل معهم مباشرة.', 800, 2).forEach((l, i) => center(x1, l, 575 + i * 46, { font: x1.font, color: main }));
        [['للجهات التدريبية', 'تصفّح السير الذاتية واختر المدرب المناسب لبرنامجك، أو أرسل طلبك.'], ['للمدربين السعوديين', 'سجّل بطاقتك وصفحتك المهنية لتظهر أمام الجهات وتصلك الفرص.']].forEach(([h, tx], i) => {
          const by = 700 + i * 170; K.rrect(x1, 90, by, W - 180, 146, 28, A(th.accent, 0.08), A(th.accent, 0.28));
          K.txt(x1, h, W - 90 - 34, by + 52, { font: `900 32px ${FONT.head}`, color: soft });
          x1.font = `500 26px ${FONT.body}`; KT.wrap(x1, tx, W - 180 - 70, 2).forEach((l, k) => K.txt(x1, l, W - 90 - 34, by + 96 + k * 36, { font: x1.font, color: main }));
        });
        const qs = 150, qy = 1030; K.qr(x1, base, W / 2 - (qs + 16) / 2, qy, qs); c1.__links.push({ x: W / 2 - (qs + 16) / 2, y: qy, w: qs + 16, h: qs + 16, url: base });
        const site = base.replace(/^https?:\/\//, '').replace(/\/$/, ''); x1.font = `800 34px ${FONT.brand}`; x1.direction = 'ltr'; const sw = x1.measureText(site).width + 60; x1.direction = 'rtl';
        K.rrect(x1, W / 2 - sw / 2, qy + qs + 38, sw, 62, 31, A(th.accent, 0.14), A(th.accent, 0.45)); center2(x1, site, W / 2, qy + qs + 38 + 42, { font: `800 34px ${FONT.brand}`, color: main, dir: 'ltr' });
        c1.__links.push({ x: W / 2 - sw / 2, y: qy + qs + 38, w: sw, h: 62, url: base });
      }
      return pages;
    };
    // مرتان: الأولى تحصي الصفحات لتُكتب «س / ن» في التذييل
    let cvs = attempt(0); const n = cvs.length; cvs = attempt(n);
    const ok = list => { try { list.forEach(c => c.getContext('2d').getImageData(0, 0, 1, 1)); return true; } catch { return false; } };
    if (!ok(cvs)) { K.setPhotos(false); window.__tpdfNoImg = true; cvs = attempt(n); K.setPhotos(true); window.__tpdfNoImg = false; if (!ok(cvs)) throw new Error('تعذّر تصدير الصفحات'); }
    return cvs;
  }
  const usePhotosOn = () => !window.__tpdfNoImg;

  async function make(t) {
    toast('جارٍ تجهيز ملف السيرة…');
    await Bulletin.kit().prepare();
    const K = Bulletin.kit();   // بعد prepare() تكون الخطوط جاهزة
    let cvs; try { cvs = await build(t, K); } catch (e) { console.error(e); return toast(`تعذّر إنشاء الملف: ${e && e.message || e}`, 'error'); }
    try { await K.deliver(Bulletin.pdf(cvs), `sauditrainers-${t.slug || 'trainer'}.pdf`); toast('تم تجهيز ملف السيرة'); }
    catch (e) { console.error(e); toast('تعذّر حفظ الملف', 'error'); }
  }
  return { make, build };
})();
