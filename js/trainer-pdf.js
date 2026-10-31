/* «حفظ ملف المدرب PDF»: يولّد من الصفحة العامة للمدرب ملف PDF بمقاس صفحات نشرة المدربين (1080×1350) وبهويتها،
 * بنفس ترتيب محتوى الصفحة: ترويسة المدرب (صورة وشارة توثيق واسم وسطر تعريفي ورمز QR) ثم نبذة، فيديوهات (غلاف وعنوان)،
 * تخصصات، دورات، شهادات احترافية، جهات تعاون، توصيات، شهادات واعتمادات، معلومات إضافية وسريعة، وأخيراً عناوين الأخبار في صفحة واحدة.
 * النصوص الطويلة متساوية الأطراف (توزيع الفراغات بين الكلمات في كل سطر عدا الأخير). */

const TrainerPdf = (() => {
  const GOLD = '#D9B44A';
  const clean = s => (typeof plainText === 'function' ? plainText(s) : String(s == null ? '' : s)).replace(/\r/g, '').trim();
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
    const logo = await K.logo(); const photo = t.noPhoto ? null : await KT.loadImage(Data.photo(t));
    const thumbs = await Promise.all(data.videos.map(v => (v.thumb ? KT.loadImage(v.thumb) : null)));
    const attempt = total => {
      const pages = []; let cv, ctx, y;
      const newPage = () => {
        cv = document.createElement('canvas'); cv.width = W; cv.height = H; ctx = cv.getContext('2d'); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.__links = cv.__links = [];
        pages.push(cv); K.chrome.logo = logo; K.chrome(ctx, pages.length, total, 0, 0, 'ملف المدرب');
        K.txt(ctx, clean(t.name), PX, 118, { font: `600 24px ${FONT.body}`, color: C.sage, align: 'left' });
        y = TOP;
      };
      const need = h => { if (y + h > BOT) newPage(); };
      const link = (x, yy, w, h, u) => { if (/^https:\/\//.test(u)) ctx.__links.push({ x, y: yy, w, h, url: u }); };
      const heading = (title, count, keep = 80) => {
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
          s = clean(s); if (!s) return; const w = Math.min(CW, ctx.measureText(s).width + 44);
          if (rowY == null || rx - w < PX) { if (rowY != null) y += h + gap; need(h + gap); rowY = y; rx = W - PX; }
          K.rrect(ctx, rx - w, y, w, h, h / 2, C.g100, 'rgba(0,84,48,.18)', 1.5);
          ctx.save(); ctx.beginPath(); ctx.rect(rx - w + 14, y, w - 28, h); ctx.clip(); K.txt(ctx, s, rx - w / 2, y + h / 2 + 9, { font: `700 ${fs}px ${FONT.body}`, color: C.g800, align: 'center' }); ctx.restore();
          rx -= w + gap;
        });
        if (rowY != null) y += h + 34;
      };

      /* الصفحة الأولى: ترويسة المدرب */
      newPage();
      const ph = 400, px = PX, pw = CW;
      const g = ctx.createLinearGradient(px, y, px + pw, y + ph); g.addColorStop(0, C.g900); g.addColorStop(1, C.g800); K.rrect(ctx, px, y, pw, ph, 34, g);
      try { ctx.save(); KT.rr(ctx, px, y, pw, ph, 34); ctx.clip(); ctx.fillStyle = ctx.createPattern(KT.patternTile(C.sage, 0.1), 'repeat'); ctx.fillRect(px, y, pw, ph); ctx.restore(); } catch { /* بلا نقش */ }
      const R = 112, cx = px + pw - 34 - R - 6, cy = y + ph / 2;
      K.avatar(ctx, { ...t }, photo, cx, cy, R, C.sage);
      seal(ctx, cx + R * 0.72, cy + R * 0.72, 40, C.sage, C.g900);
      const tr = cx - R - 40, qs = 150, avail = tr - (px + 34 + qs + 16 + 30);
      const nfs = K.fitFont(ctx, clean(t.name), 900, 60, 34, avail, FONT.head);
      let ty = y + 96; K.txt(ctx, clean(t.name), tr, ty, { font: `900 ${nfs}px ${FONT.head}`, color: '#fff' });
      ctx.font = `600 29px ${FONT.body}`; const tl = KT.wrap(ctx, clean(t.title), avail, 3);
      tl.forEach((l, i) => K.txt(ctx, l, tr, ty + 54 + i * 42, { font: ctx.font, color: C.sage }));
      const loc = [regionsLabel(t), t.city].filter(Boolean).join(' · ');
      let py = ty + 54 + tl.length * 42 + 22;
      if (loc) { const w = K.pill(ctx, loc, tr, py + 14, { bg: 'rgba(238,243,229,.14)', fg: '#fff', fs: 24 }); void w; py += 62; }
      if (t.tot) K.pill(ctx, 'حاصل على شهادة تدريب المدربين', tr, py + 14, { bg: 'rgba(238,243,229,.14)', fg: C.sage, fs: 22 });
      K.qr(ctx, url, px + 34, y + ph - 34 - qs - 16, qs); link(px + 34, y + ph - 34 - qs - 16, qs + 16, qs + 16, url);
      K.txt(ctx, 'صفحتي على المنصة', px + 34 + (qs + 16) / 2, y + ph - 34 - qs - 30, { font: `700 22px ${FONT.body}`, color: C.sage, align: 'center' });
      y += ph + 22;
      const stats = [[t.years, 'سنة خبرة'], [t.hours, 'ساعة تدريبية'], [t.programs, 'برنامج ودورة']].filter(s => Number(s[0]) > 0);
      if (stats.length) {
        const sw = (CW - (stats.length - 1) * 18) / stats.length;
        stats.forEach((s, i) => {
          const sx = W - PX - sw - i * (sw + 18); K.rrect(ctx, sx, y, sw, 118, 24, '#fff', C.line, 1.5);
          K.txt(ctx, `+${Number(s[0]).toLocaleString('en-US')}`, sx + sw / 2, y + 66, { font: `900 54px ${FONT.head}`, color: C.g800, align: 'center', dir: 'ltr' });
          K.txt(ctx, s[1], sx + sw / 2, y + 102, { font: `600 24px ${FONT.body}`, color: C.muted, align: 'center' });
        });
        y += 118 + 34;
      }

      /* الأقسام بترتيب الصفحة العامة */
      if (clean(t.bio)) { heading('نبذة تعريفية'); paragraph(t.bio); }
      if (data.videos.length) {
        heading('نماذج من جلساتي التدريبية', data.videos.length);
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
        heading('مراجعات وتوصيات', data.reviews.length);
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
      if (clean(t.certs)) { heading('الشهادات والاعتمادات والعضويات'); paragraph(t.certs); }
      if (data.extras.length) {
        heading('معلومات إضافية');
        data.extras.forEach(f => {
          const val = clean(String(t.extra[f.k]).replace(/\|/g, '، ')); ctx.font = `600 27px ${FONT.body}`; const vl = KT.wrap(ctx, val, CW - 340, 3), h = Math.max(64, vl.length * 40 + 22);
          need(h + 10); K.rrect(ctx, PX, y, CW, h, 20, C.paper, C.line, 1.5);
          K.txt(ctx, clean(f.label), W - PX - 24, y + h / 2 + 9, { font: `700 26px ${FONT.body}`, color: C.muted });
          vl.forEach((l, i) => K.txt(ctx, l, W - PX - 330, y + 40 + i * 40 - (vl.length - 1) * 0 - 6 + (h - vl.length * 40 - 22) / 2 + 6, { font: `600 27px ${FONT.body}`, color: C.ink }));
          y += h + 10;
        });
        y += 14;
      }
      heading('معلومات سريعة');
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
    toast('جارٍ تجهيز ملف المدرب…');
    await Bulletin.kit().prepare();
    const K = Bulletin.kit();   // بعد prepare() تكون الخطوط جاهزة
    let cvs; try { cvs = await build(t, K); } catch (e) { console.error(e); return toast(`تعذّر إنشاء الملف: ${e && e.message || e}`, 'error'); }
    try { await K.deliver(Bulletin.pdf(cvs), `sauditrainers-${t.slug || 'trainer'}.pdf`); toast('تم تجهيز ملف المدرب'); }
    catch (e) { console.error(e); toast('تعذّر حفظ الملف', 'error'); }
  }
  return { make, build };
})();
