/* «مكتبة المدرب»: مصادر عملية للمدربين (قوالب، أدلة، قوائم تحقق، أدوات، نماذج...) في تبويب بلوحة المدرب.
 * لا يظهر أي مورد للمدربين إلا بعد اعتماد الإدارة: library/<id> تكتبه الإدارة فقط (إما تُنشئه بنفسها أو تعتمد اقتراح مدرب librarySuggest/<id>).
 * المحتوى الأساسي في js/library-seed.js تنشره الإدارة بزر واحد من لوحتها. */
const Library = (() => {
  const CATS = [['kits', 'fa-briefcase', 'حقائب وتصميم البرامج'], ['forms', 'fa-file-signature', 'نماذج وعقود'], ['pricing', 'fa-coins', 'التسعير'], ['gov', 'fa-landmark', 'الجهات الحكومية'], ['activities', 'fa-people-group', 'أنشطة وتمارين'],
    ['tools', 'fa-toolbox', 'الأدوات الرقمية'], ['marketing', 'fa-bullhorn', 'التسويق الشخصي'], ['eval', 'fa-chart-line', 'التقييم وقياس الأثر'], ['certs', 'fa-certificate', 'الشهادات والاعتمادات'], ['seasons', 'fa-calendar-days', 'المواسم والمناسبات']];
  const KINDS = [['guide', 'دليل', 'fa-book-open'], ['template', 'قالب قابل للنسخ', 'fa-copy'], ['checklist', 'قائمة تحقق', 'fa-list-check'], ['link', 'أداة / رابط', 'fa-link']];
  const cat = k => CATS.find(c => c[0] === k) || CATS[0], kind = k => KINDS.find(c => c[0] === k) || KINDS[0];
  const all = () => Store.list('library').filter(x => x && x.title).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.ts || 0) - (a.ts || 0));
  const dateOf = ts => new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
  // عرض النص: هروب كامل ثم **عريض** وسطور القوائم
  const render = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const seenKey = id => `st-lib-seen-${id}`, favKey = id => `st-lib-fav-${id}`;
  const seenTs = id => { try { return Number(localStorage.getItem(seenKey(id)) || 0); } catch { return 0; } };
  const markSeen = id => { try { localStorage.setItem(seenKey(id), String(Math.max(0, ...all().map(x => x.ts || 0)))); } catch { /* ignore */ } };
  const favs = id => { try { return new Set(JSON.parse(localStorage.getItem(favKey(id)) || '[]')); } catch { return new Set(); } };
  const saveFavs = (id, set) => { try { localStorage.setItem(favKey(id), JSON.stringify([...set])); } catch { /* ignore */ } };
  const unread = id => all().filter(x => (x.ts || 0) > seenTs(id)).length;

  /* ---------- تبويب «مكتبة المدرب» ---------- */
  const V = { cat: '', q: '', fav: false, seen: 0 };
  function open(it, t) {
    const copy = it.kind === 'template' || it.kind === 'checklist', k = kind(it.kind), c = cat(it.cat);
    const m = modal(`<h3><i class="fa-solid ${c[1]}"></i> ${esc(it.title)}</h3>
      <p class="small muted"><span class="pill gold"><i class="fa-solid ${k[2]}"></i> ${k[1]}</span> ${esc(c[2])}</p>
      ${it.summary ? `<p class="muted">${esc(it.summary)}</p>` : ''}
      ${it.body ? `<div class="lib-body">${render(it.body)}</div>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:14px">${copy && it.body ? '<button class="btn primary" id="lc"><i class="fa-regular fa-copy"></i> نسخ النص</button>' : ''}
        ${it.url ? `<a class="btn ${copy ? '' : 'primary'}" target="_blank" rel="noopener" href="${esc(safeUrl(it.url))}"><i class="fa-solid fa-arrow-up-right-from-square"></i> فتح الرابط</a>` : ''}
        <button class="btn ghost" data-close>إغلاق</button></div>`, { wide: true });
    const b = $('#lc', m.el); if (b) b.onclick = async () => { try { await navigator.clipboard.writeText(it.body); toast('تم نسخ النص'); } catch { toast('حدّد النص وانسخه يدوياً', 'err'); } };
  }
  function suggest(t) {
    const m = modal(`<h3><i class="fa-solid fa-lightbulb"></i> اقترح مورداً للمكتبة</h3>
      <p class="small muted">يصل اقتراحك للإدارة، ولا يظهر للمدربين إلا بعد مراجعته واعتماده.</p>
      <form id="sf" style="display:grid;gap:10px">${field('العنوان', '<input name="title" required minlength="3" maxlength="120">')}
        <div class="row" style="gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:180px">${field('التصنيف', `<select name="cat">${CATS.map(c => `<option value="${c[0]}">${c[2]}</option>`).join('')}</select>`)}</div><div style="flex:1;min-width:180px">${field('النوع', `<select name="kind">${KINDS.map(c => `<option value="${c[0]}">${c[1]}</option>`).join('')}</select>`)}</div></div>
        ${field('وصف مختصر', '<input name="summary" maxlength="300">')}
        ${field('المحتوى', '<textarea name="body" rows="7" maxlength="6000" placeholder="اكتب المحتوى أو ألصقه"></textarea>')}
        ${field('رابط (اختياري)', '<input name="url" type="url" dir="ltr" placeholder="https://…">')}
        <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit"><i class="fa-solid fa-paper-plane"></i> إرسال للإدارة</button></div></form>`, { wide: true });
    $('#sf', m.el).onsubmit = async e => {
      e.preventDefault(); const f = e.target, url = f.url.value.trim();
      if (url && !/^https:\/\//i.test(url)) return toast('الرابط يجب أن يبدأ بـ https://', 'err');
      if (!f.body.value.trim() && !url) return toast('أضف محتوى أو رابطاً', 'err');
      const id = Store.newId(), rec = { id, trainerId: t.id, title: f.title.value.trim(), cat: f.cat.value, kind: f.kind.value, ts: Date.now(), status: 'pending' };
      ['summary', 'body'].forEach(k => { const v = f[k].value.trim(); if (v) rec[k] = v; }); if (url) rec.url = url;
      if (await Store.setConfirmed(`librarySuggest/${id}`, rec)) { toast('وصل اقتراحك للإدارة، شكراً لك'); m.close(); }
    };
  }
  function tab(main, t) {
    if (!V.seen) V.seen = seenTs(t.id);
    const list = all(), fav = favs(t.id), q = normAr(V.q);
    const shown = list.filter(x => (!V.cat || x.cat === V.cat) && (!V.fav || fav.has(x.id)) && (!q || normAr(`${x.title} ${x.summary || ''} ${x.tags || ''} ${x.body || ''}`).includes(q)));
    const mine = Store.list('librarySuggest').filter(s => s && s.trainerId === t.id).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    main.innerHTML = `<div class="dash-h"><h2>مكتبة المدرب</h2><button class="btn" id="ls"><i class="fa-solid fa-lightbulb"></i> اقترح مورداً</button></div>
      <p class="muted small">قوالب وأدلة وقوائم تحقق وأدوات عملية يعتمدها فريق المنصة لدعمك في عملك التدريبي. ${list.length ? `<b class="num">${list.length}</b> مورداً.` : ''}</p>
      <div class="toolbar"><input type="search" id="lq" placeholder="ابحث في المكتبة…" value="${esc(V.q)}"><label class="chk" style="margin:0"><input type="checkbox" id="lf" ${V.fav ? 'checked' : ''}><span>مفضلتي (${fav.size})</span></label></div>
      <div class="chips" style="margin:10px 0 16px"><button class="chip ${V.cat ? '' : 'on'}" data-c="">الكل</button>${CATS.map(c => { const n = list.filter(x => x.cat === c[0]).length; return n ? `<button class="chip ${V.cat === c[0] ? 'on' : ''}" data-c="${c[0]}"><i class="fa-solid ${c[1]}"></i> ${c[2]} <span class="num">${n}</span></button>` : ''; }).join('')}</div>
      ${shown.length ? `<div class="lib-grid">${shown.map(x => { const k = kind(x.kind), c = cat(x.cat); return `<article class="lib-card"><div class="lib-top"><span class="lib-ic"><i class="fa-solid ${c[1]}"></i></span><button class="lib-fav ${fav.has(x.id) ? 'on' : ''}" data-f="${esc(x.id)}" aria-label="مفضلة"><i class="fa-${fav.has(x.id) ? 'solid' : 'regular'} fa-star"></i></button></div>
        <h4>${esc(x.title)}${(x.ts || 0) > V.seen ? ' <span class="pill gold sm">جديد</span>' : ''}${x.pin ? ' <i class="fa-solid fa-thumbtack muted" title="مثبّت"></i>' : ''}</h4>
        <p class="small muted">${esc(x.summary || '')}</p><div class="lib-foot"><span class="small muted"><i class="fa-solid ${k[2]}"></i> ${k[1]}</span><button class="btn sm primary" data-o="${esc(x.id)}">فتح</button></div></article>`; }).join('')}</div>`
      : `<div class="empty"><i class="fa-solid fa-book-open"></i><h3>${list.length ? 'لا توجد نتائج' : 'المكتبة قيد الإعداد'}</h3><p>${list.length ? 'جرّب كلمة أخرى أو تصنيفاً آخر.' : 'ستضيف الإدارة المصادر هنا قريباً. يمكنك اقتراح مورد مفيد.'}</p></div>`}
      ${mine.length ? `<div class="pbox" style="margin-top:18px"><h3><i class="fa-solid fa-lightbulb"></i> اقتراحاتي</h3>${mine.map(s => `<div class="lead"><div><b>${esc(s.title)}</b> <small class="muted">${dateOf(s.ts)}</small></div><span class="pill ${s.status === 'ok' ? 'gold' : ''}">${s.status === 'ok' ? 'اعتُمد' : s.status === 'no' ? 'لم يُعتمد' : 'قيد المراجعة'}</span></div>`).join('')}</div>` : ''}`;
    markSeen(t.id);
    $('#ls', main).onclick = () => suggest(t);
    $('#lq', main).oninput = debounce(e => { V.q = e.target.value; tab(main, t); const i = $('#lq', main); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
    $('#lf', main).onchange = e => { V.fav = e.target.checked; tab(main, t); };
    $$('[data-c]', main).forEach(b => b.onclick = () => { V.cat = b.dataset.c; tab(main, t); });
    $$('[data-f]', main).forEach(b => b.onclick = () => { const f = favs(t.id); f.has(b.dataset.f) ? f.delete(b.dataset.f) : f.add(b.dataset.f); saveFavs(t.id, f); tab(main, t); });
    $$('[data-o]', main).forEach(b => b.onclick = () => open(list.find(x => x.id === b.dataset.o), t));
  }

  /* ---------- لوحة الإدارة ---------- */
  const AV = { cat: '' };
  function editor(rec, done) {
    const r = rec || {};
    const m = modal(`<h3><i class="fa-solid fa-book-open"></i> ${r.id && Store.get(`library/${r.id}`) ? 'تعديل مورد' : 'مورد جديد في المكتبة'}</h3>
      <form id="lf2" style="display:grid;gap:10px">${field('العنوان', `<input name="title" required minlength="3" maxlength="120" value="${esc(r.title || '')}">`)}
        <div class="row" style="gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:180px">${field('التصنيف', `<select name="cat">${CATS.map(c => `<option value="${c[0]}" ${r.cat === c[0] ? 'selected' : ''}>${c[2]}</option>`).join('')}</select>`)}</div><div style="flex:1;min-width:180px">${field('النوع', `<select name="kind">${KINDS.map(c => `<option value="${c[0]}" ${r.kind === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}</select>`)}</div></div>
        ${field('وصف مختصر', `<input name="summary" maxlength="300" value="${esc(r.summary || '')}">`)}
        ${field('المحتوى', `<textarea name="body" rows="10" maxlength="6000">${esc(r.body || '')}</textarea>`, 'استعمل **نص** للخط العريض. القوالب وقوائم التحقق يستطيع المدرب نسخها بزر.')}
        ${field('رابط (اختياري)', `<input name="url" type="url" dir="ltr" value="${esc(r.url || '')}" placeholder="https://…">`)}
        <label class="chk"><input type="checkbox" name="pin" ${r.pin ? 'checked' : ''}><span>تثبيت في أعلى المكتبة</span></label>
        <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit">اعتماد ونشر للمدربين</button></div></form>`, { wide: true });
    $('#lf2', m.el).onsubmit = async e => {
      e.preventDefault(); const f = e.target, url = f.url.value.trim();
      if (url && !/^https:\/\//i.test(url)) return toast('الرابط يجب أن يبدأ بـ https://', 'err');
      if (!f.body.value.trim() && !url) return toast('أضف محتوى أو رابطاً', 'err');
      const id = r.id || Store.newId(), old = Store.get(`library/${id}`), out = { id, title: f.title.value.trim(), cat: f.cat.value, kind: f.kind.value, ts: old?.ts || Date.now() };
      ['summary', 'body'].forEach(k => { const v = f[k].value.trim(); if (v) out[k] = v; }); if (url) out.url = url; if (f.pin.checked) out.pin = true;
      if (await Store.setConfirmed(`library/${id}`, out)) { Security.log('اعتماد مورد في مكتبة المدرب', out.title); toast('نُشر المورد للمدربين'); m.close(); done && done(); }
    };
  }
  function admin(main) {
    const list = all(), sug = Store.list('librarySuggest').filter(s => s && s.status === 'pending').sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const missing = (typeof LIBRARY_SEED !== 'undefined' ? LIBRARY_SEED : []).filter(s => !Store.get(`library/${s.id}`));
    const shown = list.filter(x => !AV.cat || x.cat === AV.cat);
    main.innerHTML = `<div class="dash-h"><h2>مكتبة المدرب</h2><div class="row" style="gap:8px;flex-wrap:wrap">${missing.length ? `<button class="btn" id="lseed"><i class="fa-solid fa-box-open"></i> نشر المحتوى الأساسي (${missing.length})</button>` : ''}<button class="btn primary" id="lnew"><i class="fa-solid fa-plus"></i> مورد جديد</button></div></div>
      <p class="muted small">لا يظهر أي مورد للمدربين إلا بعد اعتماده هنا. ${list.length} مورداً منشوراً${sug.length ? ` · ${sug.length} اقتراح بانتظار المراجعة` : ''}.</p>
      ${sug.length ? `<div class="pbox"><h3><i class="fa-solid fa-lightbulb"></i> اقتراحات المدربين <small class="num muted">(${sug.length})</small></h3>${sug.map(s => { const t = Store.get(`trainers/${s.trainerId}`) || {}; return `<div class="lead"><div><b>${esc(s.title)}</b> <small class="muted">${esc(cat(s.cat)[2])} · ${esc(kind(s.kind)[1])} · من ${esc(t.name || s.trainerId)} · ${dateOf(s.ts)}</small><p class="small" style="white-space:pre-wrap">${esc(String(s.summary || s.body || s.url || '').slice(0, 300))}</p></div>
        <div class="acts" style="flex-direction:column"><button class="btn sm primary" data-ap="${esc(s.id)}"><i class="fa-solid fa-check"></i> مراجعة واعتماد</button><button class="btn sm danger" data-rj="${esc(s.id)}"><i class="fa-solid fa-xmark"></i> رفض</button></div></div>`; }).join('')}</div>` : ''}
      <div class="chips" style="margin-bottom:12px"><button class="chip ${AV.cat ? '' : 'on'}" data-c="">الكل (${list.length})</button>${CATS.map(c => `<button class="chip ${AV.cat === c[0] ? 'on' : ''}" data-c="${c[0]}"><i class="fa-solid ${c[1]}"></i> ${c[2]} <span class="num">${list.filter(x => x.cat === c[0]).length}</span></button>`).join('')}</div>
      <div class="pbox">${shown.length ? shown.map(x => `<div class="lead"><span class="ic"><i class="fa-solid ${cat(x.cat)[1]}"></i></span><div><b>${esc(x.title)}</b>${x.pin ? ' <i class="fa-solid fa-thumbtack muted"></i>' : ''} <small class="muted">${esc(kind(x.kind)[1])} · ${dateOf(x.ts)}</small><p class="small">${esc(x.summary || '')}</p></div>
        <div class="acts"><button class="btn sm" data-ed="${esc(x.id)}"><i class="fa-solid fa-pen"></i></button><button class="btn sm danger" data-del="${esc(x.id)}"><i class="fa-solid fa-trash"></i></button></div></div>`).join('') : '<p class="muted small">لا توجد موارد منشورة في هذا التصنيف. استعمل «نشر المحتوى الأساسي» أو أضف مورداً.</p>'}</div>`;
    const again = () => admin(main);
    $('#lnew', main).onclick = () => editor(null, again);
    $('#lseed', main) && ($('#lseed', main).onclick = async () => {
      if (!await confirmBox(`نشر ${missing.length} مورداً أساسياً للمدربين؟ يمكنك تعديل أي مورد أو حذفه بعد النشر.`, { ok: 'نشر' })) return;
      const now = Date.now(); let n = 0; for (const [i, s] of missing.entries()) if (await Store.setConfirmed(`library/${s.id}`, { ...s, ts: now - i * 1000 })) n++;
      Security.log('نشر المحتوى الأساسي لمكتبة المدرب', `${n} مورد`); toast(`نُشر ${n} مورداً`); again();
    });
    $$('[data-c]', main).forEach(b => b.onclick = () => { AV.cat = b.dataset.c; again(); });
    $$('[data-ed]', main).forEach(b => b.onclick = () => editor(list.find(x => x.id === b.dataset.ed), again));
    $$('[data-del]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف هذا المورد من المكتبة؟', { ok: 'حذف', danger: true })) { Store.remove(`library/${b.dataset.del}`); Security.log('حذف مورد من مكتبة المدرب', b.dataset.del); } });
    $$('[data-ap]', main).forEach(b => b.onclick = () => { const s = sug.find(x => x.id === b.dataset.ap); editor({ ...s, id: Store.newId() }, async () => { await Store.setConfirmed(`librarySuggest/${s.id}/status`, 'ok'); }); });
    $$('[data-rj]', main).forEach(b => b.onclick = async () => { if (await confirmBox('رفض هذا الاقتراح؟', { ok: 'رفض', danger: true })) Store.setConfirmed(`librarySuggest/${b.dataset.rj}/status`, 'no'); });
  }

  return { tab, admin, unread, all, CATS };
})();
