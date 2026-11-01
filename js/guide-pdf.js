/* تصدير «دليل المدرب» إلى PDF بمقاس A4 (794×1123 وحدة منطقية، تُرسم بدقة 1.6×): غلاف، فهرس بأرقام الصفحات وروابط داخلية، ثم الأقسام.
 * قواعد التنسيق التي تمنع عيوب الملفات السابقة: لا نص يتجاوز عرضه ولا يُقصّ (كل فقرة تُلفّ بالقياس الفعلي)، العنوان لا يبقى وحيداً في أسفل صفحة،
 * الفقرة لا تُقطع بأقل من سطرين على أي جانب، الجداول والصناديق وخطوات الترقيم لا تُشطر، والجدول يكرّر رأسه إن انتقل، واللقطة لا تُقص ولا تُشوَّه
 * (تُصغَّر حتى 80% لتتسع، وإلا تُرحَّل بعد الفقرات التالية إلى أن تتسع في موضعها من القسم نفسه، فلا تتبقى فراغات كبيرة)، والنص العربي موزَّع الأطراف دون
 * تمطيط مبالغ، والأرقام والأسماء اللاتينية تُرسم بالاتجاه الصحيح. صفحات الملف صور (كبقية ملفات المنصة)، وروابطه تعمل. */
const GuidePdf = (() => {
  const S = 1.6, W = 794, H = 1123, M = 54, CW = W - 2 * M, TOP = 100, BOT = H - 72;
  const hasLatinOnly = w => /[A-Za-z0-9]/.test(w) && !/[؀-ۿ]/.test(w);
  const plain = s => Guide.spans(s).map(p => p.t).join('');
  const absUrl = u => (/^https:/.test(u) ? u : /^#\//.test(u) ? siteBase() + u : siteBase() + u.replace(/^\//, ''));

  /* ---------- نص غني: كلمات بخط عادي/عريض/رابط، مع لفّ وتوزيع أطراف ---------- */
  function words(text) {
    const out = [];
    Guide.spans(text).forEach(p => {
      String(p.t).split(/\s+/).filter(Boolean).forEach(w => {
        const st = { b: !!p.b || !!p.tag, url: p.url || '' }, last = out[out.length - 1];
        const lat = hasLatinOnly(w), m = lat ? /^(.*?)([.,:;!؟،؛]+)$/.exec(w) : null, core = m && m[1] ? m[1] : w, tail = m && m[1] ? m[2] : '';
        if (last && last.latin && !last.tail && lat && last.b === st.b && last.url === st.url) { last.text += ' ' + core; last.tail = tail; } else out.push({ text: core, tail, latin: lat, ...st });
      });
    });
    return out;
  }
  const fontOf = (tk, size, FONT) => `${tk.b ? 800 : 400} ${size}px ${FONT.body}`;
  function wrap(ctx, text, maxW, size, FONT) {
    ctx.font = `400 ${size}px ${FONT.body}`; const sp = ctx.measureText(' ').width, lines = []; let cur = [], cw = 0;
    const flush = last => { if (cur.length) lines.push({ toks: cur, last, w: cw }); cur = []; cw = 0; };
    for (const tk of words(text)) {
      ctx.font = fontOf(tk, size, FONT); let w = ctx.measureText(tk.text).width + (tk.tail ? ctx.measureText(tk.tail).width : 0);
      if (w > maxW) { // كلمة أطول من السطر (رابط مثلاً): تُصغَّر لتتسع بدل أن تتجاوز
        const f = maxW / w; ctx.font = `${tk.b ? 800 : 400} ${Math.max(9, size * f * 0.98)}px ${FONT.body}`; tk.small = Math.max(9, size * f * 0.98); w = maxW;
      }
      if (cur.length && cw + sp + w > maxW) flush(false);
      cw += (cur.length ? sp : 0) + w; cur.push({ ...tk, w });
    }
    flush(true); return lines;
  }
  function drawLine(ctx, K, line, right, y, width, size, color, FONT, links, hl) {
    ctx.font = `400 ${size}px ${FONT.body}`; const sp = ctx.measureText(' ').width, n = line.toks.length, sum = line.toks.reduce((a, t) => a + t.w, 0);
    let gap = sp; if (!line.last && n > 1) { const g = (width - sum) / (n - 1); if (g >= sp && g <= sp * 3.2) gap = g; }
    let x = right;
    line.toks.forEach(tk => {
      const fs = tk.small || size, col = tk.url ? '#0B6A3E' : tk.b ? hl || color : color;
      const fnt = `${tk.b ? 800 : 400} ${fs}px ${FONT.body}`;
      K.txt(ctx, tk.text, x, y, { font: fnt, color: col, align: 'right', dir: tk.latin ? 'ltr' : 'rtl' });
      if (tk.tail) { ctx.font = fnt; K.txt(ctx, tk.tail, x - ctx.measureText(tk.text).width, y, { font: fnt, color: col, align: 'right', dir: 'rtl' }); }
      if (tk.url) { ctx.fillStyle = col; ctx.fillRect(x - tk.w, y + 4, tk.w, 1.2); links.push({ x: (x - tk.w) * S, y: (y - fs) * S, w: tk.w * S, h: (fs + 8) * S, url: absUrl(tk.url) }); }
      x -= tk.w + gap;
    });
  }

  async function build(doc, K) {
    const FONT = K.FONT, C = K.C, KT = Card.kit;
    const blocksOf = doc.sections.map(s => Guide.parse(s.md));
    const logoG = await KT.loadImage(LOGO.green), logoC = await KT.loadImage(LOGO.cream);
    const imgs = {};
    await Promise.all([...new Set(blocksOf.flat().filter(b => b.t === 'fig').map(b => b.src))].map(async f => { try { imgs[f] = await KT.loadImage(Guide.IMG + f); } catch { imgs[f] = null; } }));
    const date = new Date(doc.ts || Date.now()).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { month: 'long', year: 'numeric' });

    const attempt = (total, secPage) => {
      const pages = [], secAt = []; let cv, ctx, y, links; let deferred = [];
      const mkPage = () => {
        const c = document.createElement('canvas'); c.width = Math.round(W * S); c.height = Math.round(H * S); const x = c.getContext('2d');
        x.scale(S, S); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); c.__links = []; return [c, x];
      };
      const T = (s, x, yy, o) => K.txt(ctx, s, x, yy, o);
      const R = W - M;
      const chrome = () => {
        const lh = 40, lw = lh * (logoG.width / logoG.height);
        ctx.drawImage(logoG, R - lw, 28, lw, lh);
        T(doc.title, M, 52, { font: `700 12.5px ${FONT.body}`, color: C.muted, align: 'left' });
        ctx.fillStyle = C.line; ctx.fillRect(M, 82, CW, 1.5);
        ctx.fillRect(M, H - 56, CW, 1);
        T('SaudiTrainers.sa', M, H - 30, { font: `700 12px ${FONT.brand}`, color: C.muted, align: 'left', dir: 'ltr' });
        T(`${pages.length}${total ? ' / ' + total : ''}`, W / 2, H - 30, { font: `700 12.5px ${FONT.body}`, color: C.ink2, align: 'center', dir: 'ltr' });
      };
      const newPage = () => {
        [cv, ctx] = mkPage(); links = cv.__links; pages.push(cv); chrome(); y = TOP;
        drawDeferred();
      };
      const room = () => BOT - y;
      const need = h => { if (h > room()) newPage(); };

      /* لقطة: تُصغَّر عند الحاجة، وتُؤجَّل إن لم تتسع */
      const figDims = (b, scale = 1) => {
        const im = imgs[b.src]; if (!im) return null;
        const maxH = (BOT - TOP) * 0.62; let w = CW * scale, h = w * im.height / im.width; if (h > maxH) { h = maxH; w = h * im.width / im.height; }
        ctx.font = `400 12.5px ${FONT.body}`; const cap = wrap(ctx, b.cap, CW - 8, 12.5, FONT);
        return { im, w, h, cap, total: h + 12 + cap.length * 20 + 20 };
      };
      const drawFig = (b, d) => {
        const x0 = W / 2 - d.w / 2; ctx.save(); KT.rr(ctx, x0, y, d.w, d.h, 10); ctx.clip(); ctx.drawImage(d.im, x0, y, d.w, d.h); ctx.restore();
        KT.rr(ctx, x0, y, d.w, d.h, 10); ctx.strokeStyle = '#CFDCC6'; ctx.lineWidth = 1.2; ctx.stroke();
        let cy = y + d.h + 24; d.cap.forEach(l => { drawLine(ctx, K, l, R, cy, CW - 8, 12.5, C.ink2, FONT, links, C.g800); cy += 20; });
        y += d.total + 6;
      };
      const fig = b => {
        const full = figDims(b); if (!full) return; age = 0;
        if (full.total <= room()) return drawFig(b, full);
        for (let sc = 0.92; sc >= 0.8; sc -= 0.04) { const d = figDims(b, sc); if (d.total <= room()) return drawFig(b, d); }
        deferred.push(b);
      };
      function drawDeferred() {
        while (deferred.length) {
          const b = deferred[0]; let d = figDims(b);
          if (d && d.total > room()) d = [0.92, 0.88, 0.84, 0.8].map(sc => figDims(b, sc)).find(z => z.total <= room());
          if (!d) { if (!figDims(b)) { deferred.shift(); continue; } break; }
          drawFig(b, d); deferred.shift();
        }
      }
      let age = 0; const flushDeferred = () => { while (deferred.length) newPage(); age = 0; };

      /* فقرة بلفّ وتوزيع أطراف، مع منع الأسطر اليتيمة */
      const lines = (ls, { x = M, w = CW, size = 15, lh = 27, color = C.ink2, hl = C.g800, gapAfter = 10 } = {}) => {
        let i = 0; const put = n => { for (let k = 0; k < n; k++) { drawLine(ctx, K, ls[i + k], x + w, y + lh - 8, w, size, color, FONT, links, hl); y += lh; } i += n; };
        while (i < ls.length) {
          const left = ls.length - i, fit = Math.floor(room() / lh);
          if (fit <= 0) { newPage(); continue; }
          if (left <= fit) { put(left); break; }
          let take = fit; if (left - take < 2) take = left - 2;
          if (take < 2) { newPage(); continue; }
          put(take); newPage();
        }
        y += gapAfter;
      };
      const para = (text, o = {}) => { ctx.font = `400 ${o.size || 15}px ${FONT.body}`; lines(wrap(ctx, text, o.w || CW, o.size || 15, FONT), o); };

      const h2 = (title, idx) => {
        if (y > TOP + 4 && room() < (BOT - TOP) * 0.22) newPage();
        need(128); if (y > TOP + 4) y += 18; secAt[idx] = pages.length - 1;
        ctx.fillStyle = C.g800; KT.rr(ctx, R - 40, y, 40, 40, 12); ctx.fill();
        T(String(idx + 1), R - 20, y + 28, { font: `800 20px ${FONT.head}`, color: '#FFFFFF', align: 'center', dir: 'ltr' });
        ctx.font = `800 25px ${FONT.head}`; const f = K.fitLine(ctx, title, 800, 25, 17, CW - 60, FONT.head);
        T(f.text, R - 54, y + 29, { font: `800 ${f.fs}px ${FONT.head}`, color: C.g900 });
        ctx.fillStyle = C.line; ctx.fillRect(M, y + 50, CW, 2); ctx.fillStyle = C.g800; ctx.fillRect(R - 80, y + 49, 80, 4); y += 72;
      };
      // أقل ارتفاع لما بعد العنوان الفرعي حتى لا يبقى وحيداً في أسفل صفحة
      const minNext = b => {
        if (!b) return 0; const L = (t, w, fs) => { ctx.font = `400 ${fs}px ${FONT.body}`; return wrap(ctx, t, w, fs, FONT).length; };
        switch (b.t) {
          case 'p': return Math.min(L(b.text, CW, 15), 2) * 27;
          case 'ul': return Math.min(L(b.items[0], CW - 26, 15), 2) * 27 + 4;
          case 'ol': return Math.max(54, L(b.items[0], CW - 74, 15) * 27 + 22) + 10;
          case 'tip': case 'note': case 'quote': return L(b.text, CW - 40, 14.5) * 26 + 38;
          case 'table': return 90;
          default: return 0;
        }
      };
      const h3 = (text, next) => {
        ctx.font = `800 18px ${FONT.head}`; const ls = wrap(ctx, text, CW, 18, FONT);
        need(ls.length * 30 + 14 + minNext(next));
        y += 10; ls.forEach(l => { drawLine(ctx, K, l, R, y + 20, CW, 18, C.g800, FONT, links, C.g800); y += 30; }); y += 2;
      };
      const ul = items => items.forEach(it => {
        ctx.font = `400 15px ${FONT.body}`; const ls = wrap(ctx, it, CW - 26, 15, FONT);
        need(Math.min(ls.length, 2) * 27 + 4);
        ctx.fillStyle = C.g800; ctx.beginPath(); ctx.arc(R - 7, y + 15, 3.6, 0, 7); ctx.fill();
        lines(ls, { x: M, w: CW - 26, gapAfter: 5 });
      });
      const ol = items => items.forEach((it, i) => {
        ctx.font = `400 15px ${FONT.body}`; const ls = wrap(ctx, it, CW - 74, 15, FONT), h = Math.max(54, ls.length * 27 + 22);
        need(h + 10); ctx.fillStyle = '#F6FAF2'; KT.rr(ctx, M, y, CW, h, 14); ctx.fill(); ctx.strokeStyle = '#DCE6D2'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = C.g800; ctx.beginPath(); ctx.arc(R - 28, y + 27, 15, 0, 7); ctx.fill();
        T(String(i + 1), R - 28, y + 33, { font: `800 16px ${FONT.head}`, color: '#FFFFFF', align: 'center', dir: 'ltr' });
        ls.forEach((l, k) => drawLine(ctx, K, l, R - 56, y + 19 + k * 27, CW - 74, 15, C.ink2, FONT, links, C.g800)); y += h + 10;
      });
      const box = (text, kind) => {
        const st = { tip: ['#EEF3E5', '#005430', '#CFDCC6'], note: ['#FFF8E1', '#C9A24B', '#F0D38A'], quote: ['#F8FBF4', '#9DB892', '#B9CDAE'] }[kind];
        ctx.font = `400 14.5px ${FONT.body}`; const ls = wrap(ctx, text, CW - 40, 14.5, FONT), h = ls.length * 26 + 24;
        need(h + 14); ctx.fillStyle = st[0]; KT.rr(ctx, M, y, CW, h, 12); ctx.fill();
        ctx.strokeStyle = st[2]; ctx.lineWidth = 1.2; if (kind === 'quote') ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = st[1]; ctx.fillRect(R - 5, y + 8, 5, h - 16);
        ls.forEach((l, k) => drawLine(ctx, K, l, R - 20, y + 25 + k * 26, CW - 40, 14.5, kind === 'note' ? '#6b4a00' : C.ink2, FONT, links, kind === 'note' ? '#6b4a00' : C.g800)); y += h + 14;
      };
      const table = rows => {
        const n = Math.max(...rows.map(r => r.length)), wts = n === 2 ? [0.27, 0.73] : n === 3 ? [0.5, 0.25, 0.25] : Array(n).fill(1 / n);
        const cw = wts.map(f => CW * f), P = 10, fs = 13.5, lh = 22, pill = c => /^\[\[(t:)?.+\]\]$/.test(c.trim());
        const meas = (r, head) => r.map((c, j) => (pill(c) ? { pill: true } : { ls: wrap(ctx, c, cw[j] - 2 * P, fs, FONT) }));
        const rowH = (m) => Math.max(...m.map(c => (c.pill ? 34 : c.ls.length * lh + 14)));
        const drawRow = (r, m, head) => {
          const h = rowH(m); let x = R;
          if (head) { ctx.fillStyle = '#EEF3E5'; ctx.fillRect(M, y, CW, h); }
          r.forEach((c, j) => {
            const cx = x - cw[j];
            ctx.strokeStyle = '#DCE6D2'; ctx.lineWidth = 1; ctx.strokeRect(cx, y, cw[j], h);
            if (m[j].pill) {
              const g = !!/^\[\[t:/.test(c.trim()), t = c.trim().replace(/^\[\[(t:)?|\]\]$/g, ''); ctx.font = `800 12px ${FONT.body}`;
              const pw = Math.min(cw[j] - 12, ctx.measureText(t).width + 22); ctx.fillStyle = g ? '#DDF3E4' : '#FFF1CC'; KT.rr(ctx, cx + (cw[j] - pw) / 2, y + (h - 24) / 2, pw, 24, 12); ctx.fill();
              ctx.strokeStyle = g ? '#A9DDBC' : '#F0D38A'; ctx.stroke(); T(t, cx + cw[j] / 2, y + h / 2 + 4.5, { font: `800 12px ${FONT.body}`, color: g ? '#12643A' : '#8A5A00', align: 'center' });
            } else m[j].ls.forEach((l, k) => drawLine(ctx, K, { ...l, last: true }, x - P, y + 7 + lh - 6 + k * lh, cw[j] - 2 * P, fs, head ? C.g800 : C.ink2, FONT, links, head ? C.g800 : C.g800));
            x -= cw[j];
          });
          y += h;
        };
        const ms = rows.map((r, i) => meas(r, i === 0)), hdr = rows[0], hm = ms[0];
        need(rowH(hm) + (ms[1] ? rowH(ms[1]) : 0) + 8); y += 4;
        rows.forEach((r, i) => {
          if (i === 0) return drawRow(r, ms[i], true);
          if (rowH(ms[i]) > room()) { newPage(); drawRow(hdr, hm, true); }
          drawRow(r, ms[i], false);
        });
        y += 14;
      };

      /* ---------- الغلاف ---------- */
      [cv, ctx] = mkPage(); links = cv.__links; pages.push(cv);
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0B6B3F'); g.addColorStop(1, '#00291A'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.07; ctx.fillStyle = '#EEF3E5'; for (let r = 0; r < 7; r++) { ctx.beginPath(); ctx.arc(W * 0.12, H * 0.9, 110 + r * 80, 0, 7); ctx.lineWidth = 1.5; ctx.strokeStyle = '#EEF3E5'; ctx.stroke(); } ctx.globalAlpha = 1;
      const lh0 = 110, lw = lh0 * (logoC.width / logoC.height); ctx.drawImage(logoC, W / 2 - lw / 2, 150, lw, lh0);
      ctx.fillStyle = '#C9A24B'; ctx.fillRect(W / 2 - 40, 330, 80, 4);
      ctx.font = `900 56px ${FONT.head}`; const tf = K.fitLine(ctx, doc.title, 900, 56, 34, CW - 20, FONT.head);
      T(tf.text, W / 2, 440, { font: `900 ${tf.fs}px ${FONT.head}`, color: '#FFFFFF', align: 'center' });
      if (doc.sub) { ctx.font = `400 19px ${FONT.body}`; wrap(ctx, doc.sub, CW - 70, 19, FONT).slice(0, 6).forEach((l, k) => drawLine(ctx, K, { ...l, last: true, toks: l.toks }, W / 2 + l.w / 2, 500 + k * 34, l.w, 19, '#DCE9D3', FONT, [], '#fff')); }
      T(date, W / 2, H - 150, { font: `700 17px ${FONT.body}`, color: '#C9DAB4', align: 'center' });
      T('SaudiTrainers.sa', W / 2, H - 108, { font: `800 22px ${FONT.brand}`, color: '#FFFFFF', align: 'center', dir: 'ltr' });
      links.push({ x: (W / 2 - 110) * S, y: (H - 132) * S, w: 220 * S, h: 36 * S, url: siteBase() });

      /* ---------- الفهرس ---------- */
      newPage();
      T('محتويات الدليل', R, y + 30, { font: `900 30px ${FONT.head}`, color: C.g900 }); ctx.fillStyle = C.line; ctx.fillRect(M, y + 48, CW, 2); y += 84;
      doc.sections.forEach((s, i) => {
        const pg = secPage ? secPage[i] + 1 : 0, ty = y;
        ctx.fillStyle = C.g800; KT.rr(ctx, R - 30, ty, 30, 30, 9); ctx.fill(); T(String(i + 1), R - 15, ty + 21, { font: `800 15px ${FONT.head}`, color: '#fff', align: 'center', dir: 'ltr' });
        ctx.font = `700 17px ${FONT.body}`; const f = K.fitLine(ctx, s.title, 700, 17, 12, CW - 130, FONT.body);
        T(f.text, R - 44, ty + 22, { font: `700 ${f.fs}px ${FONT.body}`, color: C.ink }); const tw = ctx.measureText(f.text).width;
        ctx.setLineDash([2, 5]); ctx.strokeStyle = '#B9CDAE'; ctx.beginPath(); ctx.moveTo(M + 40, ty + 24); ctx.lineTo(Math.max(M + 44, R - 52 - tw), ty + 24); ctx.stroke(); ctx.setLineDash([]);
        T(String(pg), M + 14, ty + 22, { font: `800 16px ${FONT.body}`, color: C.g800, align: 'center', dir: 'ltr' });
        if (secPage) links.push({ x: M * S, y: (ty - 4) * S, w: CW * S, h: 38 * S, page: secPage[i] });
        y += 50;
      });

      /* ---------- الأقسام ---------- */
      newPage();
      doc.sections.forEach((s, i) => {
        h2(s.title, i);
        blocksOf[i].forEach((b, bi) => {
          if (deferred.length && ++age > 5) flushDeferred();
          if (b.t === 'h3') h3(b.text, blocksOf[i][bi + 1]); else if (b.t === 'p') para(b.text); else if (b.t === 'ul') ul(b.items); else if (b.t === 'ol') ol(b.items);
          else if (b.t === 'tip' || b.t === 'note' || b.t === 'quote') box(b.text, b.t); else if (b.t === 'table') table(b.rows); else if (b.t === 'fig') fig(b);
        });
        flushDeferred();
      });
      return { pages, secAt };
    };

    // مرتان: الأولى تحصي الصفحات وأماكن الأقسام لتُكتب في الفهرس والتذييل
    const a1 = attempt(0, null); let res = attempt(a1.pages.length, a1.secAt);
    if (res.pages.length !== a1.pages.length) res = attempt(res.pages.length, res.secAt);
    return res.pages;
  }

  async function make(doc) {
    toast('جارٍ تجهيز ملف الدليل…');
    await Bulletin.kit().prepare(); const K = Bulletin.kit();
    let cvs; try { cvs = await build(doc, K); } catch (e) { console.error(e); return toast(`تعذّر إنشاء الملف: ${e && e.message || e}`, 'error'); }
    try { await K.deliver(Bulletin.pdf(cvs, { sc: S, q: 0.88, title: doc.title }), 'sauditrainers-trainer-guide.pdf'); toast('تم تجهيز ملف الدليل'); }
    catch (e) { console.error(e); toast('تعذّر حفظ الملف', 'error'); }
  }
  return { make, build, S, W, H };
})();
