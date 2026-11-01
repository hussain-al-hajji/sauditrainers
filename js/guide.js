/* «دليل المدرب الجديد»: أول تبويب في لوحة المدرب (وهو أول ما يراه بعد الدخول)، ويُحرَّر من لوحة الإدارة ← «دليل المدرب».
 * المحتوى الافتراضي في js/guide-data.js (GUIDE_DEFAULT)، وما تحفظه الإدارة يُكتب في content/guide ويحلّ محلّه. نصوص الدليل بصيغة خفيفة
 * (انظر رأس guide-data.js) تُحوَّل هنا إلى «كتل» يُبنى منها العرض في الصفحة، ومنها يبني guide-pdf.js ملف الـPDF. */
const Guide = (() => {
  const IMG = 'assets/guide/';
  const okImg = s => /^[\w.-]+\.(jpe?g|png|webp)$/i.test(s || '');
  const okUrl = u => /^(https:\/\/[^\s"'<>]+|#\/[\w\-/?=&%.]*|[\w\-/]+\.html(#[\w-]*)?)$/.test(u || '');
  const clip = (s, n) => String(s == null ? '' : s).slice(0, n);

  /* ---------- المحتوى ---------- */
  function normalize(o) {
    const secs = (Array.isArray(o.sections) ? o.sections : Object.values(o.sections || {})).filter(s => s && (s.title || s.md));
    return { title: clip(o.title, 120) || 'دليل المدرب الجديد', sub: clip(o.sub, 600), ts: o.ts || 0, sections: secs.map((s, i) => ({ id: /^[\w-]{1,30}$/.test(s.id || '') ? s.id : 's' + (i + 1), title: clip(s.title, 140), md: clip(s.md, 20000) })) };
  }
  const saved = () => { const s = Store.get('content/guide'); return s && typeof s === 'object' && (s.sections) ? normalize(s) : null; };
  const get = () => saved() || normalize(GUIDE_DEFAULT);
  const isCustom = () => !!saved();

  /* ---------- تحويل النص إلى كتل ---------- */
  // عناصر السطر الواحد: [{t: نص, b: عريض, tag: 'a'|'g', url}]
  function spans(s) {
    const out = [], re = /\*\*(.+?)\*\*|\[\[(t:)?(.+?)\]\]|\[([^\]]+)\]\(([^)\s]+)\)/g; let i = 0, m;
    s = String(s || '');
    while ((m = re.exec(s))) {
      if (m.index > i) out.push({ t: s.slice(i, m.index) });
      if (m[1] != null) out.push({ t: m[1], b: true });
      else if (m[3] != null) out.push({ t: m[3], tag: m[2] ? 'g' : 'a' });
      else out.push({ t: m[4], url: okUrl(m[5]) ? m[5] : '' });
      i = m.index + m[0].length;
    }
    if (i < s.length) out.push({ t: s.slice(i) });
    return out;
  }
  function parse(md) {
    const blocks = [];
    String(md || '').replace(/\r/g, '').split(/\n\s*\n/).map(b => b.replace(/^\n+|\n+$/g, '')).filter(b => b.trim()).forEach(b => {
      const ls = b.split('\n'), f = ls[0].trim();
      if (/^###\s+/.test(f)) { blocks.push({ t: 'h3', text: f.replace(/^###\s+/, '') }); const rest = ls.slice(1).join('\n').trim(); if (rest) blocks.push(...parse(rest)); return; }
      let m;
      if ((m = /^!\[(.*)\]\(([^)]+)\)\s*$/.exec(f)) && ls.length === 1) { if (okImg(m[2].trim())) blocks.push({ t: 'fig', cap: m[1], src: m[2].trim() }); return; }
      if (ls.every(l => /^\s*-\s+/.test(l))) { blocks.push({ t: 'ul', items: ls.map(l => l.replace(/^\s*-\s+/, '')) }); return; }
      if (ls.every(l => /^\s*\d+[.)]\s+/.test(l))) { blocks.push({ t: 'ol', items: ls.map(l => l.replace(/^\s*\d+[.)]\s+/, '')) }); return; }
      if (ls.every(l => /^\s*\|/.test(l))) { blocks.push({ t: 'table', rows: ls.map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())) }); return; }
      if (/^>!\s*/.test(f)) { blocks.push({ t: 'note', text: ls.map(l => l.replace(/^>!\s*/, '')).join(' ') }); return; }
      if (/^>"\s*/.test(f)) { blocks.push({ t: 'quote', text: ls.map(l => l.replace(/^>"\s*/, '')).join(' ') }); return; }
      if (/^>\s*/.test(f)) { blocks.push({ t: 'tip', text: ls.map(l => l.replace(/^>\s*/, '')).join(' ') }); return; }
      blocks.push({ t: 'p', text: ls.map(l => l.trim()).join(' ') });
    });
    return blocks;
  }

  /* ---------- عرض HTML ---------- */
  const inl = s => spans(s).map(p => {
    const t = esc(p.t);
    if (p.b) return `<b>${t}</b>`;
    if (p.tag) return `<span class="gd-tag ${p.tag}">${t}</span>`;
    if (p.url) return /^https:/.test(p.url) ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${t}</a>` : `<a href="${esc(p.url)}">${t}</a>`;
    return t;
  }).join('');
  function blockHtml(b) {
    switch (b.t) {
      case 'h3': return `<h3>${inl(b.text)}</h3>`;
      case 'p': return `<p>${inl(b.text)}</p>`;
      case 'ul': return `<ul>${b.items.map(i => `<li>${inl(i)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol class="gd-steps">${b.items.map(i => `<li>${inl(i)}</li>`).join('')}</ol>`;
      case 'tip': return `<div class="gd-tip">${inl(b.text)}</div>`;
      case 'note': return `<div class="gd-note">${inl(b.text)}</div>`;
      case 'quote': return `<div class="gd-quote">${inl(b.text)}</div>`;
      case 'fig': return `<figure><img loading="lazy" src="${IMG}${esc(b.src)}" alt="${esc(b.cap.replace(/\*\*/g, ''))}"><figcaption>${inl(b.cap)}</figcaption></figure>`;
      case 'table': { const [h, ...r] = b.rows; return `<div class="gd-tw"><table><thead><tr>${h.map(c => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${r.map(row => `<tr>${row.map(c => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
      default: return '';
    }
  }
  const sectionHtml = (s, i) => `<section class="gd-sec" id="gd-${esc(s.id)}" data-gid="${esc(s.id)}"><h2><span class="gd-n num">${i + 1}</span>${esc(s.title)}</h2>${parse(s.md).map(blockHtml).join('')}</section>`;
  const bodyHtml = d => d.sections.map(sectionHtml).join('');
  const tocHtml = d => `<nav class="gd-toc" aria-label="فهرس الدليل"><b>في هذا الدليل</b><ol>${d.sections.map(s => `<li><a href="javascript:void 0" data-gt="${esc(s.id)}">${esc(s.title)}</a></li>`).join('')}</ol></nav>`;
  function wireToc(root) { $$('[data-gt]', root).forEach(a => a.onclick = e => { e.preventDefault(); const el = root.querySelector(`#gd-${CSS.escape(a.dataset.gt)}`); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }

  /* ---------- لوحة المدرب ---------- */
  function portal(main) {
    const d = get();
    main.innerHTML = `<div class="dash-h"><h2>${esc(d.title)}</h2><div class="row"><button class="btn gold" id="gd-pdf"><i class="fa-solid fa-file-pdf"></i> تنزيل الدليل PDF</button></div></div>
      ${d.sub ? `<p class="muted gd-sub">${esc(d.sub)}</p>` : ''}
      <div class="gd-wrap">${tocHtml(d)}<div class="gd gd-main">${bodyHtml(d)}</div></div>`;
    wireToc(main);
    $('#gd-pdf', main).onclick = e => run(e.currentTarget);
  }
  async function run(btn, doc) {
    if (btn) btn.disabled = true;
    try { await GuidePdf.make(doc || get()); } catch (e) { console.error(e); toast('تعذّر إنشاء ملف الدليل', 'error'); } finally { if (btn) btn.disabled = false; }
  }

  /* ---------- لوحة الإدارة ---------- */
  function admin(main) {
    let d = JSON.parse(JSON.stringify(get())), sel = 0;
    const SYN = `<details class="gd-syn"><summary>صيغة الكتابة</summary><div class="small">
      <p>تُفصل الفقرات والكتل بسطر فارغ. داخل النص: <code>**نص عريض**</code> · <code>[[وسم كهرماني]]</code> · <code>[[t:وسم أخضر]]</code> · <code>[نص الرابط](https://…)</code></p>
      <pre dir="ltr">### عنوان فرعي

فقرة عادية.

- نقطة
- نقطة ثانية

1. خطوة أولى
2. خطوة ثانية

&gt; نصيحة (إطار أخضر)

&gt;! تنبيه (إطار أصفر)

&gt;" اقتباس أو مثال نص

![شرح تحت الصورة](اسم-الصورة.jpg)

| العمود الأول | العمود الثاني |
| خلية | [[t:متاحة]] |</pre></div></details>`;
    const draw = (keepScroll) => {
      const y = keepScroll ? window.scrollY : 0;
      main.innerHTML = `
        <div class="dash-h"><h2>دليل المدرب</h2><div class="row">
          <button class="btn" id="g-pdf"><i class="fa-solid fa-file-pdf"></i> تنزيل PDF</button>
          <button class="btn" id="g-reset"><i class="fa-solid fa-rotate-left"></i> استرجاع الأصل</button>
          <button class="btn primary" id="g-save"><i class="fa-solid fa-floppy-disk"></i> حفظ ونشر</button></div></div>
        <p class="muted small">هذا الدليل هو أول تبويب يراه المدرب في لوحته بعد الدخول، ويُصدَّر منه ملف PDF. ${isCustom() ? 'المعروض الآن نسخة معدّلة من الإدارة.' : 'المعروض الآن النص الأصلي.'} يظهر التعديل للمدربين بعد «حفظ ونشر».</p>
        ${SYN}
        <div class="pbox"><div class="grid2">
          <label class="field"><span>عنوان الدليل</span><input id="g-title" maxlength="120" value="${esc(d.title)}"></label>
          <label class="field"><span>سطر تعريفي تحت العنوان</span><input id="g-sub" maxlength="600" value="${esc(d.sub)}"></label></div></div>
        <div class="gd-ed">
          <div class="gd-list pbox"><b>الأقسام</b>
            ${d.sections.map((s, i) => `<div class="gd-li ${i === sel ? 'on' : ''}"><button type="button" data-pick="${i}"><span class="num">${i + 1}</span> ${esc(s.title || '(بلا عنوان)')}</button>
              <span><button type="button" class="btn sm ghost" data-mv="${i}:-1" ${i ? '' : 'disabled'} title="أعلى">↑</button><button type="button" class="btn sm ghost" data-mv="${i}:1" ${i < d.sections.length - 1 ? '' : 'disabled'} title="أسفل">↓</button><button type="button" class="btn sm ghost" data-del="${i}" title="حذف"><i class="fa-solid fa-trash"></i></button></span></div>`).join('')}
            <button type="button" class="btn sm" id="g-add"><i class="fa-solid fa-plus"></i> قسم جديد</button></div>
          <div class="gd-edit pbox">${d.sections[sel] ? `
            <label class="field"><span>عنوان القسم</span><input id="g-st" maxlength="140" value="${esc(d.sections[sel].title)}"></label>
            <div class="row" style="gap:8px;align-items:flex-end;flex-wrap:wrap;margin:6px 0">
              <label class="field" style="flex:1;min-width:200px"><span>إدراج صورة</span><select id="g-img"><option value="">اختر صورة…</option>${GUIDE_IMAGES.map(f => `<option>${esc(f)}</option>`).join('')}</select></label>
              <button type="button" class="btn sm" id="g-imgb"><i class="fa-solid fa-image"></i> إدراج</button></div>
            <label class="field"><span>نص القسم</span><textarea id="g-md" rows="18" spellcheck="false" style="font:13.5px/1.8 Tahoma,monospace">${esc(d.sections[sel].md)}</textarea></label>` : '<p class="muted">لا توجد أقسام. أضف قسماً.</p>'}</div>
        </div>
        <h3 style="margin:18px 0 6px"><i class="fa-solid fa-eye"></i> معاينة كما يراه المدرب</h3>
        <div class="pbox"><div class="gd" id="g-prev"></div></div>`;
      prev(); wire(); if (y) window.scrollTo(0, y);
    };
    const prev = () => { const el = $('#g-prev', main); if (el) el.innerHTML = bodyHtml(d); };
    const pull = () => {
      d.title = $('#g-title', main).value.trim(); d.sub = $('#g-sub', main).value.trim();
      const s = d.sections[sel]; if (s && $('#g-st', main)) { s.title = $('#g-st', main).value.trim(); s.md = $('#g-md', main).value; }
    };
    const wire = () => {
      let tm; const live = () => { clearTimeout(tm); tm = setTimeout(() => { pull(); prev(); }, 250); };
      ['#g-title', '#g-sub', '#g-st', '#g-md'].forEach(q => $(q, main) && $(q, main).addEventListener('input', live));
      $$('[data-pick]', main).forEach(b => b.onclick = () => { pull(); sel = +b.dataset.pick; draw(true); });
      $$('[data-mv]', main).forEach(b => b.onclick = () => { pull(); const [i, k] = b.dataset.mv.split(':').map(Number), j = i + k; if (j < 0 || j >= d.sections.length) return; [d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]]; if (sel === i) sel = j; else if (sel === j) sel = i; draw(true); });
      $$('[data-del]', main).forEach(b => b.onclick = async () => { if (!await confirmBox('حذف هذا القسم من الدليل؟', { ok: 'حذف' })) return; pull(); d.sections.splice(+b.dataset.del, 1); sel = Math.max(0, Math.min(sel, d.sections.length - 1)); draw(true); });
      $('#g-add', main).onclick = () => { pull(); d.sections.push({ id: 's' + Date.now().toString(36).slice(-6), title: 'قسم جديد', md: '' }); sel = d.sections.length - 1; draw(true); };
      $('#g-imgb', main) && ($('#g-imgb', main).onclick = () => { const f = $('#g-img', main).value, ta = $('#g-md', main); if (!f || !ta) return; const p = ta.selectionStart || ta.value.length, ins = `${p && !/\n\n$/.test(ta.value.slice(0, p)) ? '\n\n' : ''}![شرح الصورة](${f})\n\n`; ta.value = ta.value.slice(0, p) + ins + ta.value.slice(p); pull(); prev(); });
      $('#g-pdf', main).onclick = e => { pull(); run(e.currentTarget, normalize({ ...d, ts: Date.now() })); };
      $('#g-reset', main).onclick = async () => { if (!await confirmBox('العودة إلى النص الأصلي للدليل؟ تُحذف نسخة الإدارة المعدّلة.', { ok: 'استرجاع' })) return; await Store.remove('content/guide'); Security.log('استرجاع دليل المدرب'); d = JSON.parse(JSON.stringify(normalize(GUIDE_DEFAULT))); sel = 0; toast('استُرجع النص الأصلي'); draw(); };
      $('#g-save', main).onclick = async () => {
        pull(); if (!d.sections.length) { toast('أضف قسماً واحداً على الأقل', 'error'); return; }
        const rec = normalize({ ...d, ts: Date.now() });
        if (await Store.setConfirmed('content/guide', rec)) { Security.log('تعديل دليل المدرب'); toast('تم حفظ الدليل ونشره للمدربين'); }
      };
    };
    draw();
  }
  return { get, parse, spans, normalize, portal, admin, isCustom, IMG, okImg };
})();
