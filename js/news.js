/* ميزتان تُفعَّلان من لوحة الإدارة ← «الأخبار والإعلانات» (معطّلتان افتراضياً):
 * 1) أخبار المدربين: يكتب كل مدرب أخباره من حسابه (عنوان + نص + روابط تُعرض كبطاقات معاينة) وتظهر في #/news وفي قسم بالرئيسية وتبويب بالقائمة العلوية.
 * 2) إعلانات الإدارة: تصل حسابات المدربين كنافذة منبثقة وتبقى محفوظة في تبويب «إعلانات».
 * مفاتيح التفعيل في content/features/{news,announcements}، والقواعد تمنع النشر ما دامت الميزة معطّلة. */

const News = (() => {
  const KINDS = [['news', 'خبر', 'fa-newspaper'], ['achievement', 'إنجاز', 'fa-trophy'], ['participation', 'مشاركة', 'fa-microphone-lines'], ['course', 'إعلان دورة', 'fa-chalkboard-user']];
  const kind = k => KINDS.find(x => x[0] === k) || KINDS[0];
  const all = () => Store.list('news').filter(n => n && n.title && n.trainerId).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  // الأخبار الظاهرة للعموم: مدرب ظاهر فقط
  const visible = () => all().filter(n => { const t = Store.get(`trainers/${n.trainerId}`); return t && Data.isLive(t); });
  const dateOf = ts => fmtDate(ts);

  /* ---------- معاينة رابط ---------- */
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
  async function fetchPreview(url) {
    const base = { url, title: host(url), desc: '', img: '', site: host(url) };
    try {
      const c = new AbortController(), to = setTimeout(() => c.abort(), 8000);
      const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, { signal: c.signal }); clearTimeout(to);
      const j = await r.json(), d = j?.data || {};
      if (j?.status === 'success') return { url, title: String(d.title || base.title).slice(0, 200), desc: String(d.description || '').slice(0, 400), img: /^https:\/\//.test(d.image?.url || '') ? String(d.image.url).slice(0, 500) : '', site: String(d.publisher || base.site).slice(0, 80) };
    } catch { /* نكتفي بالمعاينة الأساسية */ }
    return base;
  }
  const linkCard = l => { const u = safeUrl(l.url); if (!u) return ''; return `<a class="nlink" href="${esc(u)}" target="_blank" rel="noopener nofollow ugc">
      ${l.img ? `<span class="nl-img"><img src="${esc(l.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></span>` : '<span class="nl-img ph"><i class="fa-solid fa-link"></i></span>'}
      <span class="nl-t"><b>${esc(l.title || host(u))}</b>${l.desc ? `<small>${esc(l.desc)}</small>` : ''}<em dir="ltr">${esc(l.site || host(u))}</em></span></a>`; };

  /* ---------- بطاقة خبر ---------- */
  function card(n, { full = false } = {}) {
    const t = Store.get(`trainers/${n.trainerId}`) || {}, k = kind(n.kind), links = arr(n.links);
    const body = full ? nl2br(n.body || '') : esc(String(n.body || '').slice(0, 220)) + (String(n.body || '').length > 220 ? '…' : '');
    return `<article class="ncard reveal">
      <div class="n-who"><a href="#/t/${esc(encodeURIComponent(t.slug || t.id || ''))}">${Card.avatar(t, 'av')}</a>
        <div><a href="#/t/${esc(encodeURIComponent(t.slug || t.id || ''))}"><b>${esc(t.name || 'مدرب')}</b></a><small>${esc(t.title || '')}</small></div>
        <span class="pill gold"><i class="fa-solid ${k[2]}"></i> ${k[1]}</span></div>
      <h3>${full ? esc(n.title) : `<a href="#/news/${esc(n.id)}">${esc(n.title)}</a>`}</h3>
      <small class="muted">${dateOf(n.ts)}</small>
      ${body ? `<p>${body}</p>` : ''}
      ${full ? links.map(linkCard).join('') : (links.length ? `<small class="muted"><i class="fa-solid fa-link"></i> ${links.length} ${links.length === 1 ? 'رابط مرفق' : 'روابط مرفقة'}</small>` : '')}
      ${full ? '' : `<a class="more" href="#/news/${esc(n.id)}">قراءة الخبر <i class="fa-solid fa-arrow-left"></i></a>`}
    </article>`;
  }

  /* ---------- قسم «أخباري» في الصفحة العامة للمدرب ---------- */
  function profileBox(t) {
    if (!featureOn('news')) return '';
    const mine = all().filter(n => n.trainerId === t.id).slice(0, 6);
    if (!mine.length) return '';
    return `<div class="pbox reveal"><h3><i class="fa-solid fa-newspaper"></i>أخباري</h3>
      ${mine.map(n => `<a class="pn-item" href="#/news/${esc(n.id)}"><span class="pill gold"><i class="fa-solid ${kind(n.kind)[2]}"></i> ${kind(n.kind)[1]}</span><b>${esc(n.title)}</b><small class="muted">${dateOf(n.ts)}</small></a>`).join('')}
      <p style="margin:10px 0 0"><a class="more" href="#/news">كل أخبار المدربين <i class="fa-solid fa-arrow-left"></i></a></p></div>`;
  }

  /* ---------- الصفحة العامة ---------- */
  const Page = {
    render() {
      if (!featureOn('news')) return `<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / أخبار المدربين</div><h1>أخبار المدربين</h1></div></section><div class="wrap empty"><i class="fa-solid fa-newspaper"></i><h3>هذه الصفحة غير متاحة حالياً</h3><a class="btn" href="#/">الرئيسية</a></div>`;
      const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?'), id = path.split('/')[1];
      if (id) {
        const n = visible().find(x => x.id === id);
        if (!n) return `<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / <a href="#/news">أخبار المدربين</a></div><h1>الخبر غير موجود</h1></div></section><div class="wrap empty"><a class="btn" href="#/news">كل الأخبار</a></div>`;
        return `<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / <a href="#/news">أخبار المدربين</a></div><h1>${esc(n.title)}</h1></div></section>
          <div class="wrap news-one" style="margin-top:30px">${card(n, { full: true })}<p><a class="btn ghost" href="#/news"><i class="fa-solid fa-arrow-right"></i> كل الأخبار</a></p></div>`;
      }
      const list = visible(), q = new URLSearchParams(query).get('k') || '';
      const shown = q ? list.filter(n => n.kind === q) : list;
      return `<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / أخبار المدربين</div><h1>أخبار المدربين</h1><p>أخبار وإنجازات ومشاركات وإعلانات دورات يكتبها المدربون عن أنفسهم.</p></div></section>
        <div class="wrap" style="margin-top:30px">
          <div class="chips" style="margin-bottom:18px"><a class="chip ${q ? '' : 'on'}" href="#/news">الكل</a>${KINDS.map(k => `<a class="chip ${q === k[0] ? 'on' : ''}" href="#/news?k=${k[0]}"><i class="fa-solid ${k[2]}"></i> ${k[1]}</a>`).join('')}</div>
          ${shown.length ? `<div class="ngrid">${shown.map(n => card(n)).join('')}</div>` : '<div class="empty"><i class="fa-solid fa-newspaper"></i><h3>لا توجد أخبار بعد</h3><p>سيظهر هنا ما ينشره المدربون من حساباتهم.</p></div>'}
        </div>`;
    },
    mount() { /* لا شيء */ }
  };

  /* ---------- قسم الصفحة الرئيسية ---------- */
  const HEAD = [{ k: 'eyebrow', label: 'العنوان الصغير' }, { k: 'title', label: 'العنوان' }, { k: 'sub', label: 'الوصف', t: 'area' }];
  const section = {
    name: 'أخبار المدربين', icon: 'fa-newspaper',
    tpls: [['grid', 'شبكة']],
    schema: [...HEAD, { k: 'count', label: 'عدد الأخبار', t: 'number' }],
    def: () => ({ eyebrow: 'جديد المدربين', title: 'أخبار المدربين', sub: 'أخبار وإنجازات ومشاركات يشاركها المدربون.', count: 3 }),
    render(sec) {
      if (!featureOn('news')) return '';
      const d = sec.d, list = visible().slice(0, Math.max(1, Math.min(9, Number(d.count) || 3)));
      if (!list.length) return '';
      return `<div class="wrap"><div class="sec-h reveal">${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ''}${d.title ? `<h2>${esc(d.title)}</h2>` : ''}${d.sub ? `<p>${esc(d.sub)}</p>` : ''}</div>
        <div class="ngrid">${list.map(n => card(n)).join('')}</div>
        <p class="center" style="margin-top:18px"><a class="btn" href="#/news">كل الأخبار <i class="fa-solid fa-arrow-left"></i></a></p></div>`;
    }
  };

  /* ---------- تبويب «أخباري» في حساب المدرب ---------- */
  const editor = (t, n) => {
    const links = arr(n?.links).map(l => ({ ...l }));
    const m = modal(`<h3><i class="fa-solid fa-newspaper"></i> ${n ? 'تعديل الخبر' : 'خبر جديد'}</h3>
      <form id="nf" style="display:grid;gap:10px">
        ${field('النوع', `<select name="kind">${KINDS.map(k => `<option value="${k[0]}" ${n?.kind === k[0] ? 'selected' : ''}>${k[1]}</option>`).join('')}</select>`)}
        ${field('العنوان', `<input name="title" required minlength="3" maxlength="120" value="${esc(n?.title || '')}" placeholder="مثال: تكريمي في ملتقى التدريب">`)}
        ${field('نص الخبر', `<textarea name="body" rows="6" maxlength="5000" placeholder="اكتب التفاصيل…">${esc(n?.body || '')}</textarea>`)}
        <div><b class="small">روابط مرفقة (حتى 3)</b> <small class="muted">— تظهر كبطاقات معاينة داخل الخبر</small>
          <div class="row" style="gap:8px;margin-top:6px"><input id="nu" type="url" dir="ltr" placeholder="https://…" style="flex:1"><button type="button" class="btn sm" id="na"><i class="fa-solid fa-plus"></i> إضافة</button></div>
          <div id="nls" style="margin-top:8px"></div></div>
        <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit"><i class="fa-solid fa-paper-plane"></i> ${n ? 'حفظ' : 'نشر الخبر'}</button></div>
      </form>`, { wide: true });
    const draw = () => {
      $('#nls', m.el).innerHTML = links.map((l, i) => `<div class="nl-edit">${linkCard(l)}<button type="button" class="btn sm ghost" data-rm="${i}" aria-label="إزالة الرابط"><i class="fa-solid fa-xmark"></i></button></div>`).join('');
      $$('[data-rm]', m.el).forEach(b => b.onclick = () => { links.splice(+b.dataset.rm, 1); draw(); });
      $('#na', m.el).disabled = links.length >= 3;
    };
    draw();
    $('#na', m.el).onclick = async () => {
      const u = safeUrl($('#nu', m.el).value.trim());
      if (!u || !/^https:\/\//i.test(u)) return toast('أدخل رابطاً صحيحاً يبدأ بـ https://', 'err');
      if (links.some(l => l.url === u)) return toast('الرابط مضاف مسبقاً', 'err');
      const b = $('#na', m.el); b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      const p = await fetchPreview(u.slice(0, 500));
      links.push(p); $('#nu', m.el).value = ''; b.innerHTML = '<i class="fa-solid fa-plus"></i> إضافة'; draw();
    };
    $('#nf', m.el).onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      const rec = { id: n?.id || '', trainerId: t.id, title: f.title.value.trim(), body: f.body.value.trim(), kind: f.kind.value, ts: n?.ts || Date.now() };
      if (n) rec.editedAt = Date.now();
      if (links.length) rec.links = links.map(l => ({ url: l.url, title: l.title || '', desc: l.desc || '', img: l.img || '', site: l.site || '' }));
      try {
        if (n) await Store.set(`news/${n.id}`, rec); else Store.push('news', rec);
        toast(n ? 'تم حفظ الخبر' : 'نُشر الخبر في الصفحة الرئيسية وصفحة الأخبار'); m.close();
      } catch { /* Store يعرض سبب الرفض */ }
    };
  };
  function tab(main, t) {
    const mine = all().filter(n => n.trainerId === t.id);
    main.innerHTML = `<div class="dash-h"><h2>أخباري</h2><button class="btn primary" id="nn"><i class="fa-solid fa-plus"></i> خبر جديد</button></div>
      <p class="muted small">اكتب عن نفسك في أي وقت: خبر، إنجاز، مشاركة، أو إعلان دورة. يظهر خبرك باسمك وصورتك في قسم «أخبار المدربين» بالرئيسية وصفحة الأخبار.</p>
      ${mine.length ? mine.map(n => `<div class="lead"><span class="ic"><i class="fa-solid ${kind(n.kind)[2]}"></i></span><div><b>${esc(n.title)}</b> <small class="muted">${dateOf(n.ts)}${n.editedAt ? ' · معدّل' : ''}</small><p class="small">${esc(String(n.body || '').slice(0, 160))}</p>${arr(n.links).length ? `<small class="muted"><i class="fa-solid fa-link"></i> ${arr(n.links).length} روابط</small>` : ''}</div>
        <div class="acts" style="flex-direction:column"><a class="btn sm" href="#/news/${esc(n.id)}"><i class="fa-solid fa-eye"></i> عرض</a><button class="btn sm" data-ed="${esc(n.id)}"><i class="fa-solid fa-pen"></i> تعديل</button><button class="btn sm danger" data-del="${esc(n.id)}"><i class="fa-solid fa-trash"></i> حذف</button></div></div>`).join('')
        : '<div class="empty"><i class="fa-solid fa-newspaper"></i><h3>لم تنشر أي خبر بعد</h3><p>اضغط «خبر جديد» لتشارك إنجازاً أو مشاركة أو دورة قادمة.</p></div>'}`;
    $('#nn', main).onclick = () => editor(t);
    $$('[data-ed]', main).forEach(b => b.onclick = () => editor(t, mine.find(n => n.id === b.dataset.ed)));
    $$('[data-del]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف هذا الخبر نهائياً؟', { ok: 'حذف', danger: true })) Store.remove(`news/${b.dataset.del}`); });
  }

  /* ---------- الإعلانات (جهة المدرب) ---------- */
  const anns = () => Store.list('announcements').filter(a => a && a.title).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const key = id => `st-ann-seen-${id}`;
  const seenTs = id => { try { return Number(localStorage.getItem(key(id)) || 0); } catch { return 0; } };
  const markSeen = id => { try { localStorage.setItem(key(id), String(Math.max(0, ...anns().map(a => a.ts || 0)))); } catch { /* ignore */ } };
  const unread = id => featureOn('announcements') ? anns().filter(a => (a.ts || 0) > seenTs(id)) : [];
  const annCard = (a, fresh) => `<div class="lead bc ${fresh ? 'new' : ''}"><span class="ic"><i class="fa-solid fa-bullhorn"></i></span><div><b>${esc(a.title)}</b> <span class="pill gold">من الإدارة</span> <small class="muted">${ago(a.ts)}</small>
      ${a.body ? `<p>${nl2br(a.body)}</p>` : ''}${safeUrl(a.link) ? `<p><a class="btn sm" href="${esc(safeUrl(a.link))}" target="_blank" rel="noopener">${esc(a.linkLabel || 'فتح الرابط')} <i class="fa-solid fa-arrow-up-right-from-square"></i></a></p>` : ''}</div></div>`;
  function annTab(main, t) {
    const list = anns(), s = seenTs(t.id);
    main.innerHTML = `<div class="dash-h"><h2>إعلانات</h2><span class="muted small">رسائل من إدارة المنصة إلى المدربين</span></div>
      ${list.length ? list.map(a => annCard(a, (a.ts || 0) > s)).join('') : '<div class="empty"><i class="fa-solid fa-bullhorn"></i><h3>لا توجد إعلانات</h3><p>تظهر هنا إعلانات الإدارة وتبقى محفوظة.</p></div>'}`;
    markSeen(t.id);
    $$('[data-tab="ann"] .badge').forEach(x => x.remove());
  }
  function annPopup(t, go) {
    const un = unread(t.id); if (!un.length || document.querySelector('.modal-back')) return;
    const k = `st-ann-pop-${t.id}`, top = String(un[0].ts || 0);
    try { if (sessionStorage.getItem(k) === top) return; sessionStorage.setItem(k, top); } catch { /* ignore */ }
    const m = modal(`<h3><i class="fa-solid fa-bullhorn"></i> ${un.length === 1 ? 'إعلان جديد من الإدارة' : `${un.length} إعلانات جديدة من الإدارة`}</h3>
      ${un.slice(0, 3).map(a => `<div class="bc-pop"><b>${esc(a.title)}</b>${a.body ? `<p class="small">${nl2br(String(a.body).slice(0, 400))}</p>` : ''}<small>${ago(a.ts)}</small></div>`).join('')}
      ${un.length > 3 ? `<p class="small muted">و${un.length - 3} إعلانات أخرى…</p>` : ''}
      <p class="small muted">الإعلانات محفوظة لك في تبويب «إعلانات».</p>
      <div class="row end"><button class="btn ghost" data-close>إغلاق</button><button class="btn primary" data-open><i class="fa-solid fa-eye"></i> عرض الإعلانات</button></div>`);
    $('[data-open]', m.el).onclick = () => { m.close(); go('ann'); };
    m.el.addEventListener('click', e => { if (e.target.closest('[data-close]')) markSeen(t.id); });
  }

  /* ---------- لوحة الإدارة ---------- */
  const ymd = d => { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  const bf = { from: ymd(new Date(Date.now() - 6 * 86400000)), to: ymd(new Date()), off: new Set(), layout: 'compact', cover: true };
  const dayStart = v => new Date(`${v}T00:00:00`).getTime(), dayEnd = v => new Date(`${v}T23:59:59.999`).getTime();
  function setFeature(k, on) {
    Store.set(`content/features/${k}`, on);
    if (k === 'news' && on) {
      // عند أول تفعيل: نضيف تبويب «الأخبار» للقائمة وقسم الأخبار للرئيسية إن لم يكونا موجودين (ويمكن للإدارة ترتيبهما أو إخفاؤهما لاحقاً)
      const nav = arr(Store.get('content/nav/list')).length ? arr(Store.get('content/nav/list')) : defaultNav();
      if (!nav.some(x => x.href === '#/news')) { const i = nav.findIndex(x => x.href === '#/trainers'); nav.splice(i < 0 ? nav.length : i + 1, 0, { id: 'nav-news', href: '#/news', label: 'أخبار المدربين', vis: true }); Store.set('content/nav/list', nav); }
      const home = homeSections();
      if (!home.some(s => s.type === 'news')) { const i = home.findIndex(s => s.type === 'featured'); home.splice(i < 0 ? Math.min(3, home.length) : i + 1, 0, { id: 'news', type: 'news', tpl: 'grid', bg: 'tint', vis: true, d: section.def() }); Store.set('content/home/list', home); }
    }
    Security.log(on ? 'تفعيل ميزة' : 'إيقاف ميزة', k === 'news' ? 'أخبار المدربين' : 'إعلانات الإدارة');
  }
  function admin(main) {
    const fx = (k, icon, title, text) => { const on = featureOn(k); return `<div class="pbox" style="margin-bottom:12px"><div class="row" style="align-items:center;gap:12px;flex-wrap:wrap"><span class="ic"><i class="fa-solid ${icon}"></i></span><div class="grow"><b>${title}</b> <span class="pill ${on ? 'gold' : ''}">${on ? 'مفعّلة' : 'غير مفعّلة'}</span><p class="small muted" style="margin:4px 0 0">${text}</p></div>
        <button class="btn ${on ? 'danger' : 'primary'}" data-fx="${k}">${on ? 'إيقاف' : 'تفعيل'}</button></div></div>`; };
    const ls = all(), an = anns(), inRange = ls.filter(n => (!bf.from || (n.ts || 0) >= dayStart(bf.from)) && (!bf.to || (n.ts || 0) <= dayEnd(bf.to))), sel = inRange.filter(n => !bf.off.has(n.id)), trainers = Store.list('trainers').filter(t => t.uid).length;
    main.innerHTML = `<div class="dash-h"><h2>الأخبار والإعلانات</h2></div>
      ${fx('news', 'fa-newspaper', 'أخبار المدربين', 'يكتب المدرب أخباره من حسابه وتظهر في صفحة الأخبار وقسم بالرئيسية وتبويب بالقائمة العلوية. عند التفعيل لأول مرة يُضاف القسم والتبويب تلقائياً.')}
      ${fx('announcements', 'fa-bullhorn', 'إعلانات الإدارة للمدربين', 'تصل حسابات المدربين كنافذة منبثقة وتبقى محفوظة في تبويب «إعلانات».')}
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-pen"></i> إعلان جديد للمدربين</h3>
        <p class="small muted">يصل إلى ${trainers} مدرباً لديهم حسابات${featureOn('announcements') ? '' : ' — فعّل ميزة الإعلانات أولاً ليظهر لهم'}.</p>
        <form id="af" style="display:grid;gap:10px">
          ${field('العنوان', '<input name="title" required maxlength="160">')}
          ${field('النص', '<textarea name="body" rows="4" maxlength="3000"></textarea>')}
          <div class="row" style="gap:10px;flex-wrap:wrap"><div style="flex:2;min-width:200px">${field('رابط (اختياري)', '<input name="link" type="url" dir="ltr" placeholder="https://…">')}</div><div style="flex:1;min-width:140px">${field('نص الزر', '<input name="linkLabel" maxlength="60" placeholder="المزيد">')}</div></div>
          <div class="row end"><button class="btn primary" type="submit"><i class="fa-solid fa-paper-plane"></i> إرسال الإعلان</button></div></form></div>
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-clock-rotate-left"></i> الإعلانات المرسلة (${an.length})</h3>
        ${an.length ? an.map(a => `<div class="lead"><span class="ic"><i class="fa-solid fa-bullhorn"></i></span><div><b>${esc(a.title)}</b> <small class="muted">${ago(a.ts)}</small><p class="small">${esc(String(a.body || '').slice(0, 140))}</p></div><div class="acts"><button class="btn sm danger" data-da="${esc(a.id)}"><i class="fa-solid fa-trash"></i></button></div></div>`).join('') : '<p class="muted small">لا توجد إعلانات.</p>'}</div>
      <div class="pbox"><h3><i class="fa-solid fa-newspaper"></i> أخبار المدربين (${ls.length})</h3>
        <div class="bl-bar"><label>من تاريخ<input type="date" id="bf-from" value="${esc(bf.from)}"></label><label>إلى تاريخ<input type="date" id="bf-to" value="${esc(bf.to)}"></label>
          <button type="button" class="btn sm ghost" data-rng="7">آخر 7 أيام</button><button type="button" class="btn sm ghost" data-rng="30">آخر 30 يوماً</button><button type="button" class="btn sm ghost" data-rng="all">الكل</button></div>
        <div class="bl-bar"><b>${sel.length}</b> من <b>${inRange.length}</b> خبراً محدداً للنشرة
          <label class="chk" style="margin:0"><input type="checkbox" id="bf-all" ${inRange.length && !sel.length ? '' : (sel.length === inRange.length ? 'checked' : '')}><span>تحديد الكل</span></label></div>
        ${inRange.length ? inRange.map(n => { const t = Store.get(`trainers/${n.trainerId}`) || {}; return `<div class="lead"><label class="bl-ck"><input type="checkbox" data-sel="${esc(n.id)}" ${bf.off.has(n.id) ? '' : 'checked'}></label><div><b>${esc(n.title)}</b> <small class="muted">${esc(t.name || n.trainerId)} · ${dateOf(n.ts)} · ${kind(n.kind)[1]}</small><p class="small">${esc(String(n.body || '').slice(0, 140))}</p></div><div class="acts"><a class="btn sm" href="#/news/${esc(n.id)}" target="_blank"><i class="fa-solid fa-eye"></i></a><button class="btn sm danger" data-dn="${esc(n.id)}"><i class="fa-solid fa-trash"></i></button></div></div>`; }).join('') : '<p class="muted small">لا توجد أخبار في هذه الفترة.</p>'}</div>
      <div class="pbox" style="margin-top:12px"><h3><i class="fa-solid fa-wand-magic-sparkles"></i> نشرة المدربين للسوشيال ميديا</h3>
        <p class="small muted">تُصمَّم الأخبار المحددة أعلاه صفحاتٍ بمقاس منشور إنستقرام الطولي (1080×1350): غلاف بهوية المنصة، ثم الأخبار باسم المدرب وصورته وسطره التعريفي ورمز QR لصفحته. تُصدَّر صوراً (ZIP) أو PDF.</p>
        <div class="bl-bar"><label>توزيع الأخبار<select id="bf-layout"><option value="compact" ${bf.layout === 'compact' ? 'selected' : ''}>عدة مدربين في الصفحة (أقل عدد صفحات)</option><option value="trainer" ${bf.layout === 'trainer' ? 'selected' : ''}>صفحة لكل مدرب (أخباره مجتمعة)</option><option value="single" ${bf.layout === 'single' ? 'selected' : ''}>صفحة لكل خبر</option></select></label>
          <label class="chk" style="margin:0"><input type="checkbox" id="bf-cover" ${bf.cover ? 'checked' : ''}><span>إضافة غلاف</span></label></div>
        <button class="btn primary" id="bf-go" ${sel.length ? '' : 'disabled'}><i class="fa-solid fa-newspaper"></i> إنشاء النشرة (${sel.length} خبر)</button></div>`;
    $$('[data-fx]', main).forEach(b => b.onclick = async () => {
      const k = b.dataset.fx, on = !featureOn(k);
      if (await confirmBox(on ? 'تفعيل هذه الميزة لجميع المدربين والزوار؟' : 'إيقاف الميزة؟ تختفي من الموقع وحسابات المدربين، وتبقى البيانات محفوظة.', { ok: on ? 'تفعيل' : 'إيقاف', danger: !on })) { setFeature(k, on); toast(on ? 'تم التفعيل' : 'تم الإيقاف'); }
    });
    $('#af', main).onsubmit = e => {
      e.preventDefault(); const f = e.target, link = f.link.value.trim();
      if (link && !/^https:\/\//i.test(link)) return toast('الرابط يجب أن يبدأ بـ https://', 'err');
      const rec = { ts: Date.now(), title: f.title.value.trim(), body: f.body.value.trim() }; if (link) { rec.link = link; rec.linkLabel = f.linkLabel.value.trim(); }
      Store.push('announcements', rec); Security.log('إعلان للمدربين', rec.title); toast('أُرسل الإعلان'); f.reset();
    };
    const rerender = () => admin(main);
    $('#bf-from', main).onchange = e => { bf.from = e.target.value; rerender(); };
    $('#bf-to', main).onchange = e => { bf.to = e.target.value; rerender(); };
    $$('[data-rng]', main).forEach(b => b.onclick = () => { const v = b.dataset.rng; bf.to = ymd(new Date()); bf.from = v === 'all' ? '' : ymd(new Date(Date.now() - (Number(v) - 1) * 86400000)); if (v === 'all') bf.to = ''; rerender(); });
    $$('[data-sel]', main).forEach(c => c.onchange = () => { c.checked ? bf.off.delete(c.dataset.sel) : bf.off.add(c.dataset.sel); rerender(); });
    $('#bf-all', main).onchange = e => { inRange.forEach(n => (e.target.checked ? bf.off.delete(n.id) : bf.off.add(n.id))); rerender(); };
    $('#bf-layout', main).onchange = e => { bf.layout = e.target.value; };
    $('#bf-cover', main).onchange = e => { bf.cover = e.target.checked; };
    $('#bf-go', main).onclick = () => Bulletin.make({ items: sel, from: bf.from ? dayStart(bf.from) : Math.min(...sel.map(n => n.ts)), to: bf.to ? dayEnd(bf.to) : Math.max(...sel.map(n => n.ts)), layout: bf.layout, withCover: bf.cover });
    $$('[data-da]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف هذا الإعلان؟', { ok: 'حذف', danger: true })) Store.remove(`announcements/${b.dataset.da}`); });
    $$('[data-dn]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف هذا الخبر؟', { ok: 'حذف', danger: true })) { Store.remove(`news/${b.dataset.dn}`); Security.log('حذف خبر مدرب', b.dataset.dn); } });
  }

  return { all, visible, card, profileBox, kinds: KINDS, Page, section, tab, annTab, annPopup, unread, admin };
})();

Pages.news = News.Page;
SECTION_TYPES.news = News.section;
