/* إعلانات عبر الإنترنت (فرص التدريب): منشورات ومنافسات (منها منافسات اعتماد) تبحث عن مدربين.
 * الجلب: سكربت Google يملأ oppInbox/ (للإدارة فقط) أو تضيف الإدارة رابطاً يدوياً؛ الإدارة تراجع وتعتمد، فتنتقل إلى opportunities/
 * ويراها المدرب في تبويب «إعلانات عبر الإنترنت» داخل حسابه فقط (لا تظهر للزوار ولا في صفحته التعريفية). */

const Opps = (() => {
  const approved = () => Store.list('opportunities').filter(o => o && o.title).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const inbox = () => Store.list('oppInbox').filter(o => o && o.title).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const isOpen = o => !o.deadline || o.deadline >= Date.now() - 86400000;
  const KIND = { tender: ['منافسة حكومية', 'fa-landmark'], post: ['منشور عام', 'fa-bullhorn'] };
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

  /* ---------- جهة المدرب ---------- */
  const key = id => `st-opp-seen-${id}`;
  const seenTs = id => { try { return Number(localStorage.getItem(key(id)) || 0); } catch { return 0; } };
  const markSeen = id => { try { localStorage.setItem(key(id), String(Math.max(0, ...approved().map(o => o.ts || 0), ...jobs().map(o => o.ts || 0)))); } catch { /* ignore */ } };
  const jobs = () => Store.list('jobs').filter(j => j && j.title && j.url).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const unread = id => { const s = seenTs(id); return [...approved().filter(o => (o.ts || 0) > s && isOpen(o)), ...jobs().filter(j => (j.ts || 0) > s)]; };

  function card(o, fresh) {
    const k = KIND[o.kind] || KIND.post, u = safeUrl(o.url), closed = !isOpen(o);
    return `<div class="lead opp ${fresh ? 'new' : ''} ${closed ? 'closed' : ''}"><span class="ic"><i class="fa-solid ${k[1]}"></i></span>
      <div><b>${esc(o.title)}</b> <span class="pill ${o.kind === 'tender' ? 'gold' : ''}">${k[0]}</span> ${fresh ? '<span class="pill ok">جديد</span>' : ''}${closed ? ' <span class="pill gray">انتهى الموعد</span>' : ''}
        <div class="small muted">${o.org ? `${esc(o.org)} · ` : ''}${esc(o.site || host(o.url) || '')}${o.site || o.url ? ' · ' : ''}<span title="تاريخ النشر في المنصة"><i class="fa-regular fa-calendar"></i> نُشرت في ${fmtDate(o.ts)} (${ago(o.ts)})</span>${o.deadline ? ` · آخر موعد: <b>${fmtDate(o.deadline)}</b>` : ''}</div>
        ${o.desc ? `<p>${nl2br(o.desc)}</p>` : ''}
        ${u ? `<a class="nlink" href="${esc(u)}" target="_blank" rel="noopener nofollow">${/^https:\/\//.test(o.img || '') ? `<span class="nl-img"><img src="${esc(o.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.nlink').classList.add('noimg');this.parentNode.remove()"></span>` : '<span class="nl-img ph"><i class="fa-solid fa-link"></i></span>'}<span class="nl-t"><b>${esc(o.lt || o.title)}</b>${o.ld ? `<small>${esc(o.ld)}</small>` : ''}<em dir="ltr">${esc(host(o.url))}</em></span></a>` : ''}
        <div class="small">${o.spec ? `<span class="pill">${esc(specName(o.spec))}</span> ` : ''}${o.region ? `<span class="pill">${esc(regionName(o.region))}</span>` : ''}</div>
        ${o.note ? `<p class="small"><i class="fa-solid fa-circle-info"></i> <b>ملاحظة الإدارة:</b> ${nl2br(o.note)}</p>` : ''}</div>
      <div class="acts" style="flex-direction:column">${u ? `<a class="btn sm primary" href="${esc(u)}" target="_blank" rel="noopener nofollow"><i class="fa-solid fa-arrow-up-right-from-square"></i> فتح الأصل</a>` : ''}</div></div>`;
  }
  function tab(main, t) {
    const s = seenTs(t.id), all = approved();
    const list = all.filter(isOpen);
    main.innerHTML = `<div class="dash-h"><h2>إعلانات عبر الإنترنت</h2><span class="muted small">إعلانات عامة تبحث عن مدربين، تصلك من عدة مصادر</span></div>
      <div class="banner info" style="margin-bottom:12px"><i class="fa-solid fa-circle-info"></i><span>هذه الفرص منقولة من مصادر عامة في الإنترنت ومنصات التواصل الاجتماعي، وبعضها يرسل لنا مباشرة. نحاول قدر الإمكان التحقق من صحة الإعلان وسلامة المصدر، ونهيب بجميع المدربين التحقق دائماً عند إجراء التعاملات عبر الإنترنت.</span></div>
      ${list.length ? list.map(o => card(o, (o.ts || 0) > s)).join('') : `<div class="empty"><i class="fa-solid fa-handshake-angle"></i><h3>لا توجد فرص حالياً</h3><p>حين تعتمد الإدارة فرصة جديدة تظهر هنا وتصلك بشارة.</p></div>`}`;
    const jl = jobs();
    main.insertAdjacentHTML('beforeend', `<div class="dash-h" style="margin-top:26px"><h2><i class="fa-brands fa-google"></i> وظائف مدربين من Google Jobs</h2><span class="muted small">تُجلب تلقائياً يومياً: وظائف تخص المدربين في السعودية (عربي وإنجليزي)</span></div>
      ${jl.length ? jl.map(j => jobCard(j, (j.ts || 0) > s)).join('') : '<div class="empty"><i class="fa-solid fa-briefcase"></i><h3>لا توجد وظائف حالياً</h3><p>تظهر هنا الوظائف الجديدة تلقائياً.</p></div>'}`);
    markSeen(t.id); $$('[data-tab="opps"] .badge').forEach(x => x.remove());
  }
  function jobCard(j, fresh) {
    const u = safeUrl(j.url);
    return `<div class="lead opp ${fresh ? 'new' : ''}"><span class="ic"><i class="fa-solid fa-briefcase"></i></span>
      <div><b>${esc(j.title)}</b> ${fresh ? '<span class="pill ok">جديد</span>' : ''}${j.sched ? ` <span class="pill">${esc(j.sched)}</span>` : ''}
        <div class="small muted">${j.org ? `${esc(j.org)} · ` : ''}${j.loc ? `${esc(j.loc)} · ` : ''}${j.site ? `${esc(j.site)} · ` : ''}<span title="تاريخ الإضافة في المنصة"><i class="fa-regular fa-calendar"></i> أُضيفت ${fmtDate(j.ts)} (${ago(j.ts)})</span>${j.posted ? ` · نُشرت: ${esc(j.posted)}` : ''}</div>
        ${j.desc ? `<p>${esc(String(j.desc).slice(0, 280))}${String(j.desc).length > 280 ? '…' : ''}</p>` : ''}</div>
      <div class="acts" style="flex-direction:column">${u ? `<a class="btn sm primary" href="${esc(u)}" target="_blank" rel="noopener nofollow"><i class="fa-solid fa-arrow-up-right-from-square"></i> فتح الوظيفة</a>` : ''}</div></div>`;
  }

  /* ---------- جهة الإدارة ---------- */
  const ymd = ts => { const d = new Date(ts), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  // نافذة المراجعة والاعتماد (رابط جديد أو عنصر من الوارد)
  function editor(rec, { fromInbox = false, onDone } = {}) {
    const m = modal(`<h3><i class="fa-solid fa-handshake-angle"></i> ${rec.pub ? 'تعديل الفرصة' : 'مراجعة واعتماد الفرصة'}</h3>
      ${rec.url ? `<p class="small"><a href="${esc(safeUrl(rec.url) || '#')}" target="_blank" rel="noopener nofollow" dir="ltr">${esc(rec.url)}</a></p>` : '<p class="small muted">إعلان نصي بلا رابط</p>'}
      <form id="of" style="display:grid;gap:10px">
        ${field('العنوان', `<input name="title" required maxlength="200" value="${esc(rec.title || '')}">`)}
        ${field('الجهة (اختياري)', `<input name="org" maxlength="160" value="${esc(rec.org || '')}">`)}
        ${field('نص الإعلان / الوصف (يظهر للمدربين كما هو)', `<textarea name="desc" rows="7" maxlength="2000">${esc(rec.desc || '')}</textarea>`)}
        ${field('المصدر (اختياري، مثل: واتساب، لينكدإن)', `<input name="site" maxlength="80" value="${esc(rec.site || host(rec.url))}">`)}
        <div class="row" style="gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:150px">${field('التخصص', `<select name="spec"><option value="">—</option>${SPECIALTIES.map(x => `<option value="${esc(x.k)}" ${rec.spec === x.k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`)}</div>
          <div style="flex:1;min-width:150px">${field('المنطقة', `<select name="region"><option value="">—</option>${REGIONS.map(x => `<option value="${esc(x.k)}" ${rec.region === x.k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`)}</div>
          <div style="flex:1;min-width:150px">${field('آخر موعد', `<input type="date" name="deadline" value="${rec.deadline ? ymd(rec.deadline) : ''}">`)}</div>
          <div style="flex:1;min-width:150px">${field('النوع', `<select name="kind"><option value="post" ${rec.kind !== 'tender' ? 'selected' : ''}>منشور عام</option><option value="tender" ${rec.kind === 'tender' ? 'selected' : ''}>منافسة حكومية</option></select>`)}</div>
        </div>
        ${field('ملاحظة للمدربين (اختياري)', `<textarea name="note" rows="2" maxlength="500">${esc(rec.note || '')}</textarea>`)}
        <div class="row end" style="gap:8px"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit"><i class="fa-solid fa-circle-check"></i> ${rec.pub ? 'حفظ' : 'اعتماد ونشر للمدربين'}</button></div>
      </form>`, { wide: true });
    $('#of', m.el).onsubmit = e => {
      e.preventDefault(); const f = e.target, id = rec.id || Store.newId();
      const out = { id, ts: rec.pub ? rec.ts : Date.now(), title: f.title.value.trim(), kind: f.kind.value };
      if (rec.url) out.url = String(rec.url).slice(0, 500);
      if (rec.url && rec.lt) out.lt = String(rec.lt).slice(0, 200);
      if (rec.url && rec.ld) out.ld = String(rec.ld).slice(0, 400);
      ['org', 'desc', 'note'].forEach(k => { const v = f[k].value.trim(); if (v) out[k] = v; });
      ['spec', 'region'].forEach(k => { if (f[k].value) out[k] = f[k].value; });
      const site = f.site.value.trim(); if (site) out.site = site.slice(0, 80);
      if (/^https:\/\//.test(rec.img || '')) out.img = String(rec.img).slice(0, 500);
      if (f.deadline.value) out.deadline = new Date(`${f.deadline.value}T23:59:59`).getTime();
      Store.set(`opportunities/${id}`, out);
      if (fromInbox) Store.update(`oppInbox/${id}`, { status: 'approved' });
      Security.log(rec.pub ? 'تعديل فرصة تدريب' : 'اعتماد فرصة تدريب', out.title); toast(rec.pub ? 'تم الحفظ' : 'اعتُمدت الفرصة وظهرت للمدربين'); m.close(); onDone && onDone();
    };
  }

  function admin(main) {
    const jl = jobs(), set = Store.get('settings/opps') || {}, last = set.lastRun || {}, ib = inbox(), news = ib.filter(o => o.status === 'new'), ap = approved();
    const ets = (arr(set.etimadTerms).length ? arr(set.etimadTerms) : ['تدريب', 'دورات تدريبية', 'برنامج تدريبي']).join('\n');
    const row = (o, btns) => `<div class="lead"><span class="ic"><i class="fa-solid ${(KIND[o.kind] || KIND.post)[1]}"></i></span><div><b><a href="${esc(safeUrl(o.url) || '#')}" target="_blank" rel="noopener nofollow">${esc(o.title)}</a></b> <small class="muted">${esc(o.site || host(o.url))} · ${ago(o.ts)}${o.src === 'jobs' ? ' · Google Jobs' : o.src === 'etimad' ? ' · اعتماد' : o.src === 'google' ? ' · بحث Google' : ''}${o.deadline ? ' · آخر موعد ' + fmtDate(o.deadline) : ''}</small>${o.desc ? `<p class="small">${esc(String(o.desc).slice(0, 220))}</p>` : ''}</div><div class="acts" style="flex-direction:column">${btns}</div></div>`;
    main.innerHTML = `<div class="dash-h"><h2>إعلانات عبر الإنترنت</h2><span class="muted small">طلبات بحث عن مدربين: تُجلب أو تُضاف، ثم تُعتمد لتظهر في حسابات المدربين فقط</span></div>
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-plus"></i> إضافة فرصة (إعلان نصي · إعلان نصي برابط · رابط)</h3>
        <p class="small muted">الصق نص الإعلان كما وصلك (من واتساب مثلاً) و/أو رابطه (لينكدإن، إنستقرام، تيك توك…). يظهر للمدربين كما هو، ومع الرابط تظهر لهم معاينته. اكتب نصاً أو رابطاً أو الاثنين.</p>
        <textarea id="op-text" rows="5" maxlength="2000" placeholder="نص الإعلان (اختياري إن وضعت رابطاً)" style="width:100%;margin-bottom:8px"></textarea>
        <div class="row" style="gap:8px"><input id="op-url" type="url" dir="ltr" placeholder="رابط (اختياري) https://…" style="flex:1"><button class="btn primary" id="op-add"><i class="fa-solid fa-plus"></i> إضافة ومراجعة</button></div></div>
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-robot"></i> الجلب الآلي</h3>
        <p class="small muted">${last.ts ? `آخر تشغيل: ${ago(last.ts)} — ${last.found ?? 0} نتيجة، ${last.added ?? 0} جديدة.` : 'لم يُشغَّل بعد.'} يعمل يومياً بعد تفعيل المشغّل في سكربت Google، أو اضغط «جلب الآن».</p>
        ${arr(last.log).length ? `<details class="small" style="margin:0 0 10px"><summary style="color:var(--warn);cursor:pointer">رسائل آخر تشغيل (${arr(last.log).length}) — قد تكون قديمة</summary><div style="color:var(--warn);margin-top:6px" dir="auto">${arr(last.log).map(x => `<div>${esc(x)}</div>`).join('')}</div><button class="btn sm ghost" id="op-clrlog" style="margin-top:8px"><i class="fa-solid fa-broom"></i> مسح الرسائل</button></details>` : ''}
        <div style="display:grid;gap:16px">
          <div style="flex:2;min-width:300px">${field('روابط خلاصات RSS من تنبيهات Google (رابط في كل سطر)', `<textarea id="op-f" rows="5" dir="ltr" placeholder="https://www.google.com/alerts/feeds/…">${esc(arr(set.feeds).join('\n'))}</textarea>`)}<small class="muted">أنشئ تنبيهاً في google.com/alerts بعبارة مثل «نبحث عن مدرب» أو «مطلوب مدرب» أو «طلب عروض» تدريب، واختر Deliver to: RSS feed، وانسخ رابط الخلاصة هنا.</small></div>
          <div style="flex:1;min-width:260px">${field('وظائف Google Jobs — عبارات البحث (حتى 4)', `<textarea id="op-jq" rows="3">${esc((arr(set.jobQueries).length ? arr(set.jobQueries) : ['وظائف مدربين', 'مدرب', 'trainer Saudi Arabia', 'training specialist']).join('\n'))}</textarea>`)}<label class="chk"><input type="checkbox" id="op-jobs" ${set.jobs === true ? 'checked' : ''}><span>تفعيل جلب وظائف Google Jobs يومياً ونشرها تلقائياً للمدربين <small class="muted">(بلا مراجعة؛ يحتاج مفتاح SerpApi في خصائص السكربت: SERPAPI_KEY)</small></span></label></div>
          <div style="flex:1;min-width:200px">${field('كلمات البحث في منصة اعتماد', `<textarea id="op-e" rows="3">${esc(ets)}</textarea>`)}<label class="chk"><input type="checkbox" id="op-eon" ${set.etimad === true ? 'checked' : ''}><span>تجربة جلب منافسات اعتماد <small class="muted">(تحجبه المنصة غالباً عن خوادم Google؛ أضف منافساتها بالرابط يدوياً)</small></span></label></div></div>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn" id="op-save"><i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات</button>${Automation.on ? '<button class="btn primary" id="op-run"><i class="fa-solid fa-rotate"></i> جلب الآن</button>' : '<small class="muted">الأتمتة غير مفعّلة</small>'}</div></div>
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-brands fa-google"></i> وظائف Google Jobs المنشورة تلقائياً (${jl.length}) ${jl.length ? '<button class="btn sm danger" id="op-jclr" style="margin-inline-start:10px"><i class="fa-solid fa-broom"></i> حذف الكل</button>' : ''}</h3>
        <p class="small muted">تُنشر مباشرة في قسم «وظائف مدربين من Google Jobs» داخل حسابات المدربين بلا مراجعة، وتُحذف تلقائياً بعد 21 يوماً. احذف ما لا يناسب.</p>
        ${jl.slice(0, 30).map(j => `<div class="lead"><span class="ic"><i class="fa-solid fa-briefcase"></i></span><div><b><a href="${esc(safeUrl(j.url) || '#')}" target="_blank" rel="noopener nofollow">${esc(j.title)}</a></b> <small class="muted">${esc(j.org || '')} ${esc(j.loc || '')} · ${ago(j.ts)}</small></div><div class="acts"><button class="btn sm danger" data-jdel="${esc(j.id)}"><i class="fa-solid fa-trash"></i></button></div></div>`).join('') || '<p class="muted small">لا توجد وظائف بعد.</p>'}</div>
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-inbox"></i> الوارد بانتظار المراجعة (${news.length})</h3>
        ${news.length ? news.map(o => row(o, `<button class="btn sm primary" data-ap="${esc(o.id)}"><i class="fa-solid fa-circle-check"></i> اعتماد</button><button class="btn sm danger" data-rj="${esc(o.id)}"><i class="fa-solid fa-xmark"></i> رفض</button>`)).join('') : '<p class="muted small">لا توجد نتائج جديدة.</p>'}</div>
      <div class="pbox"><h3><i class="fa-solid fa-handshake-angle"></i> المعتمدة للمدربين (${ap.length})</h3>
        ${ap.length ? ap.map(o => row(o, `<button class="btn sm" data-ed="${esc(o.id)}"><i class="fa-solid fa-pen"></i> تعديل</button><button class="btn sm danger" data-dl="${esc(o.id)}"><i class="fa-solid fa-trash"></i> سحب</button>`)).join('') : '<p class="muted small">لم تُعتمد فرص بعد.</p>'}</div>`;
    const again = () => admin(main);
    $('#op-add', main).onclick = async e => {
      const text = $('#op-text', main).value.trim(), raw = $('#op-url', main).value.trim(), u = raw ? safeUrl(raw) : '';
      if (!text && !raw) return toast('اكتب نص الإعلان أو ضع رابطاً', 'error');
      if (raw && (!u || !/^https:\/\//i.test(u))) return toast('الرابط يجب أن يبدأ بـ https://', 'error');
      if (u && (ap.some(o => o.url === u) || ib.some(o => o.url === u))) return toast('الرابط موجود مسبقاً', 'error');
      const first = text.split('\n').map(x => x.trim()).find(Boolean) || '';
      const b = e.currentTarget, h = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      const p = u ? await News.fetchPreview(u.slice(0, 500)) : null; b.disabled = false; b.innerHTML = h;
      editor({ url: u || '', title: (first || p?.title || '').slice(0, 200), desc: text || p?.desc || '', lt: p?.title || '', ld: p?.desc || '', img: p?.img || '', site: p?.site || '', kind: 'post' }, { onDone: () => { $('#op-text', main).value = ''; $('#op-url', main).value = ''; again(); } });
    };
    $('#op-save', main).onclick = () => {
      const lines = id => $(id, main).value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12);
      Store.update('settings/opps', { feeds: lines('#op-f').filter(u => /^https:\/\/www\.google\.[a-z.]+\/alerts\/feeds\//.test(u)).slice(0, 10), gnews: false, jobs: $('#op-jobs', main).checked, jobQueries: lines('#op-jq').slice(0, 4), etimadTerms: lines('#op-e').slice(0, 6), etimad: $('#op-eon', main).checked }); toast('تم حفظ الإعدادات');
    };
    $('#op-run', main) && ($('#op-run', main).onclick = async e => { e.currentTarget.disabled = true; await Automation.notify('opps', 'now'); toast('طُلب الجلب، تظهر النتائج خلال دقيقة تقريباً'); });
    $('#op-clrlog', main) && ($('#op-clrlog', main).onclick = () => { Store.remove('settings/opps/lastRun/log'); toast('تم مسح الرسائل'); });
    $('#op-jclr', main) && ($('#op-jclr', main).onclick = async () => { if (await confirmBox(`حذف ${jl.length} وظيفة من حسابات المدربين؟`, { ok: 'حذف', danger: true })) { jl.forEach(j => Store.remove(`jobs/${j.id}`)); toast('تم الحذف'); } });
    $$('[data-jdel]', main).forEach(b => b.onclick = () => Store.remove(`jobs/${b.dataset.jdel}`));
    $$('[data-ap]', main).forEach(b => b.onclick = () => editor(Store.get(`oppInbox/${b.dataset.ap}`), { fromInbox: true, onDone: again }));
    $$('[data-rj]', main).forEach(b => b.onclick = () => Store.update(`oppInbox/${b.dataset.rj}`, { status: 'rejected' }));
    $$('[data-ed]', main).forEach(b => b.onclick = () => editor({ ...Store.get(`opportunities/${b.dataset.ed}`), pub: true }, { onDone: again }));
    $$('[data-dl]', main).forEach(b => b.onclick = async () => { if (await confirmBox('سحب هذه الفرصة من حسابات المدربين؟', { ok: 'سحب', danger: true })) { Store.remove(`opportunities/${b.dataset.dl}`); Security.log('سحب فرصة تدريب', b.dataset.dl); } });
  }

  return { approved, inbox, unread, tab, admin };
})();
