/* لوحة الإدارة ← الصفحة الرئيسية: ترتيب الأقسام وإظهارها وإخفاؤها وحذفها، وإضافة أقسام جديدة بقوالب متعددة */

/* ===== محرر بيانات القسم من مخطط (حقول نصية وقوائم متداخلة) ===== */
const SchemaForm = (() => {
  function render(schema, v = {}) {
    return `<div class="sf-level">${schema.map(f => {
      const val = v[f.k];
      if (f.t === 'list') return `<div class="sf-list-wrap" data-k="${f.k}"><div class="sf-lh"><b>${esc(f.label)}</b><button type="button" class="btn sm" data-add><i class="fa-solid fa-plus"></i> ${esc(f.add || 'عنصر')}</button></div><div class="sf-list">${arr(val).map(it => item(f, it)).join('')}</div><template>${item(f, {})}</template></div>`;
      if (f.t === 'check') return `<label class="chk sf-field"><input type="checkbox" data-f="${f.k}" ${val !== false && val != null ? 'checked' : ''}><span><i class="fa-solid fa-check"></i>${esc(f.label)}</span></label>`;
      const ctl = f.t === 'area' ? `<textarea data-f="${f.k}" style="min-height:80px">${esc(val ?? '')}</textarea>`
        : f.t === 'number' ? `<input type="number" data-f="${f.k}" min="0" value="${esc(val ?? '')}">`
          : f.t === 'select' ? `<select data-f="${f.k}">${f.opts.map(([k, l]) => opt(k, l, val)).join('')}</select>`
            : f.t === 'icon' ? `<div class="icon-sel"><select data-f="${f.k}">${[val, ...ICON_CHOICES].filter((x, i, a) => x && a.indexOf(x) === i).map(i => opt(i, i.replace('fa-', ''), val)).join('')}</select><i class="fa-solid ${esc(val || ICON_CHOICES[0])}"></i></div>`
              : `<input type="text" data-f="${f.k}" value="${esc(val ?? '')}">`;
      return `<label class="field sf-field ${f.t === 'area' ? 'full' : ''}"><span>${esc(f.label)}</span>${ctl}</label>`;
    }).join('')}</div>`;
  }
  const item = (f, it) => `<div class="sf-item"><div class="sf-ctl"><button type="button" class="btn sm icon" data-up title="أعلى"><i class="fa-solid fa-arrow-up"></i></button><button type="button" class="btn sm icon" data-down title="أسفل"><i class="fa-solid fa-arrow-down"></i></button><button type="button" class="btn sm icon" data-del title="حذف"><i class="fa-solid fa-xmark"></i></button></div>${render(f.sub, it)}</div>`;
  function read(level, schema) {
    const o = {};
    schema.forEach(f => {
      if (f.t === 'list') {
        const list = level.querySelector(`:scope > .sf-list-wrap[data-k="${f.k}"] > .sf-list`);
        o[f.k] = list ? [...list.children].filter(x => x.classList.contains('sf-item')).map(it => read(it.querySelector(':scope > .sf-level'), f.sub)) : [];
        return;
      }
      const el = level.querySelector(`:scope > .sf-field [data-f="${f.k}"], :scope > .sf-field[data-f="${f.k}"], :scope > label.chk > [data-f="${f.k}"]`);
      if (!el) return;
      o[f.k] = f.t === 'check' ? el.checked : f.t === 'number' ? Number(el.value) || 0 : el.value.trim();
    });
    return o;
  }
  function wire(root) {
    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-add')) { const w = b.closest('.sf-list-wrap'); w.querySelector(':scope > .sf-list').insertAdjacentHTML('beforeend', w.querySelector(':scope > template').innerHTML); }
      const it = b.closest('.sf-item'); if (!it) return;
      if (b.hasAttribute('data-del')) it.remove();
      if (b.hasAttribute('data-up') && it.previousElementSibling) it.parentNode.insertBefore(it, it.previousElementSibling);
      if (b.hasAttribute('data-down') && it.nextElementSibling) it.parentNode.insertBefore(it.nextElementSibling, it);
    });
    root.addEventListener('change', e => { const s = e.target.closest('.icon-sel'); if (s) s.querySelector('i').className = `fa-solid ${e.target.value}`; });
  }
  return { render, read, wire };
})();

/* ===== صور مصغّرة لقوالب الأقسام ===== */
function tplThumb(type, tpl) {
  const R = (x, y, w, h, o = 0.25, r = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="currentColor" opacity="${o}"/>`;
  const C = (x, y, r, o = 0.35) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" opacity="${o}"/>`;
  const k = `${type}:${tpl}`;
  const map = {
    'hero:map': R(0, 0, 120, 72, 0.9, 0) + R(64, 14, 46, 6, 1) + R(70, 24, 40, 6, 1) + R(66, 40, 44, 8, 0.6, 4) + C(30, 34, 20, 0.25),
    'hero:center': R(0, 0, 120, 72, 0.9, 0) + R(30, 18, 60, 7, 1) + R(38, 29, 44, 7, 1) + R(26, 44, 68, 9, 0.6, 5),
    'marquee:specs': [8, 34, 60, 86].map(x => R(x, 30, 22, 12, 0.35, 6)).join(''), 'marquee:regions': [6, 30, 54, 78, 102].map(x => R(x, 30, 18, 12, 0.35, 6)).join(''), 'marquee:words': [6, 46, 86].map(x => R(x, 32, 30, 8, 0.45)).join(''),
    'featured:grid': [8, 36, 64, 92].map(x => R(x, 14, 22, 46, 0.3, 4) + C(x + 11, 24, 6, 0.5)).join(''), 'featured:carousel': [0, 30, 60, 90].map(x => R(x + 6, 16, 26, 42, 0.3, 4)).join('') + C(8, 37, 5, 0.6), 'featured:list': [12, 28, 44].map(y => R(10, y, 100, 12, 0.25, 4) + C(102, y + 6, 4, 0.6)).join(''),
    'steps:tabs': R(40, 8, 40, 8, 0.4, 4) + [10, 44, 78].map(x => R(x, 24, 32, 38, 0.3, 4)).join(''), 'steps:stacked': [10, 44, 78].map(x => R(x, 8, 32, 26, 0.3, 4) + R(x, 40, 32, 26, 0.3, 4)).join(''),
    'specs:grid': [0, 1, 2].map(r => [0, 1, 2, 3].map(c => R(8 + c * 27, 10 + r * 19, 23, 15, 0.3, 3)).join('')).join(''), 'specs:chips': [0, 1, 2].map(r => [0, 1, 2].map(c => R(10 + c * 34 + (r % 2) * 8, 14 + r * 16, 28, 10, 0.35, 5)).join('')).join(''),
    'regions:tiles': R(0, 0, 120, 72, 0.9, 0) + [0, 1].map(r => [0, 1, 2, 3].map(c => R(8 + c * 27, 14 + r * 24, 23, 20, 0.35, 3)).join('')).join(''), 'regions:pills': [0, 1, 2].map(r => [0, 1, 2].map(c => R(12 + c * 34, 14 + r * 16, 28, 10, 0.35, 5)).join('')).join(''),
    'orders:slider': [-8, 22, 52, 82, 112].map(x => R(x, 18, 26, 26, 0.55, 3)).join('') + R(40, 6, 40, 5, 0.4), 'orders:grid': [0, 1].map(r => [0, 1, 2, 3].map(c => R(10 + c * 26, 8 + r * 28, 22, 22, 0.55, 3)).join('')).join(''),
    'join:cards': R(0, 0, 120, 72, 0.9, 0) + R(62, 14, 48, 44, 0.35, 4) + R(14, 10, 22, 50, 0.4, 4) + R(28, 14, 22, 50, 0.55, 4), 'join:compact': R(8, 20, 104, 32, 0.8, 6) + R(70, 30, 32, 10, 0.4, 5),
    'cards:c3': [8, 44, 80].map(x => R(x, 18, 32, 36, 0.3, 4)).join(''), 'cards:c2': [10, 62].map(x => R(x, 16, 48, 40, 0.3, 4)).join(''), 'cards:c4': [6, 34, 62, 90].map(x => R(x, 20, 24, 32, 0.3, 4)).join(''), 'cards:list': [12, 28, 44].map(y => R(10, y, 100, 12, 0.3, 4)).join(''),
    'text:center': R(30, 20, 60, 7, 0.6) + R(20, 32, 80, 4, 0.3) + R(26, 40, 68, 4, 0.3), 'text:split': R(64, 12, 48, 48, 0.4, 4) + R(10, 22, 46, 6, 0.6) + R(10, 33, 46, 4, 0.3) + R(10, 41, 40, 4, 0.3), 'text:split-r': R(8, 12, 48, 48, 0.4, 4) + R(64, 22, 46, 6, 0.6) + R(64, 33, 46, 4, 0.3) + R(64, 41, 40, 4, 0.3), 'text:quote': R(16, 14, 88, 44, 0.2, 6) + R(28, 28, 64, 5, 0.6) + R(36, 38, 48, 5, 0.4),
    'stats:row': [16, 50, 84].map(x => R(x, 24, 22, 12, 0.6) + R(x, 40, 22, 4, 0.3)).join(''), 'stats:tiles': [8, 44, 80].map(x => R(x, 16, 32, 40, 0.3, 4) + R(x + 6, 28, 20, 9, 0.6)).join(''),
    'banner:green': R(8, 18, 104, 36, 0.85, 8) + R(16, 28, 44, 6, 0.3) + R(78, 30, 26, 10, 0.4, 5), 'banner:cream': R(8, 18, 104, 36, 0.2, 8) + R(16, 28, 44, 6, 0.6) + R(78, 30, 26, 10, 0.7, 5),
    'faq:list': [12, 26, 40, 54].map(y => R(20, y, 80, 10, 0.3, 4)).join(''), 'faq:two': [12, 26, 40].map(y => R(8, y, 50, 10, 0.3, 4) + R(62, y, 50, 10, 0.3, 4)).join('')
  };
  return `<svg viewBox="0 0 120 72" class="tpl-thumb">${map[k] || R(10, 10, 100, 52, 0.3)}</svg>`;
}

function aHome(main) {
  if (!main._list) { main._list = JSON.parse(JSON.stringify(homeSections())); main._dirty = false; }
  const list = main._list;
  const dirty = () => { main._dirty = true; aHome(main); };
  const tplName = s => SECTION_TYPES[s.type]?.tpls.find(t => t[0] === s.tpl)?.[1] || s.tpl;
  const bgName = s => (SECTION_TYPES[s.type]?.fixedBg ? '' : BG_CHOICES.find(b => b[0] === (s.bg || 'light'))?.[1]);
  main.innerHTML = `
    <div class="dash-h"><h2>الصفحة الرئيسية</h2>
      <div class="row"><button class="btn sm ghost" id="rst"><i class="fa-solid fa-rotate-left"></i> الافتراضي</button><a class="btn sm" href="#/" target="_blank"><i class="fa-solid fa-eye"></i> معاينة</a><button class="btn primary" id="sv" ${main._dirty ? '' : 'disabled'}><i class="fa-solid fa-floppy-disk"></i> حفظ ونشر</button></div></div>
    <p class="muted small">رتّب الأقسام بالأسهم أو بالسحب، وأظهرها أو أخفها، وعدّل محتوى كل قسم وقالبه. لا يظهر شيء للزوار قبل الضغط على «حفظ ونشر».</p>
    <div class="hb" id="hb">${list.map((s, i) => { const T = SECTION_TYPES[s.type] || {}; return `
      <div class="hb-row ${s.vis === false ? 'off' : ''}" draggable="true" data-i="${i}">
        <span class="hb-grip"><i class="fa-solid fa-grip-vertical"></i></span>
        <span class="hb-thumb">${tplThumb(s.type, s.tpl)}</span>
        <div class="grow"><b><i class="fa-solid ${T.icon || 'fa-square'}"></i> ${esc(s.d?.title || T.name || s.type)}</b><small>${esc(T.name || s.type)} · ${esc(tplName(s))}${bgName(s) ? ' · ' + esc(bgName(s)) : ''}${s.vis === false ? ' · مخفي' : ''}</small></div>
        <div class="acts">
          <button class="btn sm icon" data-a="up" title="أعلى" ${i ? '' : 'disabled'}><i class="fa-solid fa-arrow-up"></i></button>
          <button class="btn sm icon" data-a="down" title="أسفل" ${i < list.length - 1 ? '' : 'disabled'}><i class="fa-solid fa-arrow-down"></i></button>
          <button class="btn sm icon" data-a="vis" title="${s.vis === false ? 'إظهار' : 'إخفاء'}"><i class="fa-solid fa-${s.vis === false ? 'eye-slash' : 'eye'}"></i></button>
          <button class="btn sm icon" data-a="edit" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="btn sm icon" data-a="dup" title="نسخ"><i class="fa-regular fa-clone"></i></button>
          <button class="btn sm icon" data-a="del" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`; }).join('')}</div>
    <button class="btn" id="add" style="margin-top:12px"><i class="fa-solid fa-plus"></i> إضافة قسم</button>`;

  $$('.hb-row', main).forEach(row => {
    const i = +row.dataset.i;
    row.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
      const a = b.dataset.a;
      if (a === 'up') [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (a === 'down') [list[i + 1], list[i]] = [list[i], list[i + 1]];
      if (a === 'vis') list[i].vis = list[i].vis === false;
      if (a === 'dup') list.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(list[i])), id: list[i].type + '-' + Store.newId() });
      if (a === 'del') { if (!await confirmBox(`حذف قسم «${esc(list[i].d?.title || SECTION_TYPES[list[i].type]?.name)}»؟ يمكنك إخفاؤه بدلاً من حذفه.`, { ok: 'حذف', danger: true })) return; list.splice(i, 1); }
      if (a === 'edit') return sectionEditor(list[i], s => { list[i] = s; dirty(); });
      dirty();
    });
    row.ondragstart = e => { e.dataTransfer.setData('text/plain', String(i)); row.classList.add('dragging'); };
    row.ondragend = () => row.classList.remove('dragging');
    row.ondragover = e => { e.preventDefault(); row.classList.add('drop'); };
    row.ondragleave = () => row.classList.remove('drop');
    row.ondrop = e => { e.preventDefault(); const from = +e.dataTransfer.getData('text/plain'); if (from === i) return; const [it] = list.splice(from, 1); list.splice(i, 0, it); dirty(); };
  });
  $('#add', main).onclick = () => templateGallery(sec => { list.push(sec); dirty(); sectionEditor(sec, s => { list[list.indexOf(sec)] = s; dirty(); }); });
  $('#rst', main).onclick = async () => { if (!await confirmBox('استعادة أقسام الصفحة الرئيسية الافتراضية؟ تُحذف التعديلات والأقسام المضافة.', { ok: 'استعادة', danger: true })) return; main._list = defaultHome(); main._dirty = true; aHome(main); };
  $('#sv', main).onclick = () => { Store.set('content/home/list', list); Security.log('تعديل الصفحة الرئيسية', `${list.length} قسم`); main._dirty = false; toast('تم حفظ الصفحة الرئيسية ونشرها'); aHome(main); };
}

function templateGallery(done) {
  const m = modal(`<h3><i class="fa-solid fa-plus"></i> إضافة قسم — اختر النوع والقالب</h3>
    <div class="tg">${Object.entries(SECTION_TYPES).map(([k, T]) => `<div class="tg-type"><b><i class="fa-solid ${T.icon}"></i> ${esc(T.name)}</b><div class="tg-tpls">${T.tpls.map(([tk, tn]) => `<button class="tg-tpl" data-t="${k}" data-tpl="${tk}">${tplThumb(k, tk)}<span>${esc(tn)}</span></button>`).join('')}</div></div>`).join('')}</div>`, { wide: true });
  $$('.tg-tpl', m.el).forEach(b => b.onclick = () => {
    const T = SECTION_TYPES[b.dataset.t];
    m.close();
    done({ id: b.dataset.t + '-' + Store.newId(), type: b.dataset.t, tpl: b.dataset.tpl, bg: 'light', vis: true, d: T.def() });
  });
}

function sectionEditor(sec, done) {
  const T = SECTION_TYPES[sec.type];
  const d = { ...T.def(), ...(sec.d || {}) };
  const m = modal(`<h3><i class="fa-solid ${T.icon}"></i> ${esc(T.name)}</h3>
    <form id="se">
      <div class="field"><span>القالب</span><div class="tg-tpls">${T.tpls.map(([tk, tn]) => `<label class="tg-tpl"><input type="radio" name="tpl" value="${tk}" ${sec.tpl === tk ? 'checked' : ''}>${tplThumb(sec.type, tk)}<span>${esc(tn)}</span></label>`).join('')}</div></div>
      ${T.fixedBg ? '' : `<div class="field"><span>الخلفية</span><div class="checks">${BG_CHOICES.map(([k, l]) => `<label class="chk"><input type="radio" name="bg" value="${k}" ${(sec.bg || 'light') === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>`}
      ${sec.type === 'orders' ? '<div class="banner info"><i class="fa-solid fa-circle-info"></i>بطاقات هذا القسم تُختار من «طلبات الجهات» بزر <i class="fa-solid fa-table-cells-large"></i>، ولا يظهر القسم إن لم توجد بطاقات.</div>' : ''}
      ${sec.type === 'join' ? '<div class="banner info"><i class="fa-solid fa-circle-info"></i>الرسوم والمزايا تُعدَّل من تبويب «المحتوى العام».</div>' : ''}
      <div id="sfw">${SchemaForm.render(T.schema, d)}</div>
      <div class="row end" style="position:sticky;bottom:0;background:#fff;padding-top:10px"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary">تم</button></div>
    </form>`, { wide: true });
  SchemaForm.wire(m.$('#sfw'));
  m.$('#se').onsubmit = e => {
    e.preventDefault();
    const f = formData(e.target);
    const nd = SchemaForm.read(m.$('#sfw > .sf-level'), T.schema);
    m.close();
    done({ ...sec, tpl: f.tpl || sec.tpl, bg: f.bg || sec.bg, d: nd });
  };
}
