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
  const lsGet = k => { try { return Number(localStorage.getItem(k) || 0); } catch { return 0; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* ignore */ } };
  const kAds = id => `st-opp-seen-${id}`, kJobs = id => `st-job-seen-${id}`;
  const V = { sub: 'ads' };   // القسم المفتوح في صفحة المدرب: ads (فرص تدريب عامة) | jobs (وظائف تدريب)
  const JOB_DEFAULT = ['وظائف مدربين', 'مدرب', 'مدرب مهارات', 'مدرب قيادة', 'أخصائي تدريب', 'trainer', 'corporate trainer', 'training specialist', 'soft skills trainer', 'learning and development'];
  const JOB_SUGGEST = ['مدرب تطوير ذاتي', 'مدرب معتمد', 'مطلوب مدرب', 'مدرب مبيعات', 'مدرب تنمية بشرية', 'مدرب لغة إنجليزية', 'مدرب حاسب آلي', 'مدرب سلامة مهنية', 'مدرب موارد بشرية', 'مدرب خدمة عملاء', 'مدرب إدارة مشاريع', 'مدرب تقنية', 'أخصائي تطوير مواهب', 'منسق تدريب', 'sales trainer', 'technical trainer', 'leadership trainer', 'certified trainer', 'L&D specialist', 'training coordinator', 'HR trainer', 'customer service trainer'];
  const jobs = () => Store.list('jobs').filter(j => j && j.title && j.url).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const JOB_DAYS = 45;   // تختفي الوظيفة من حسابات المدربين بعد 45 يوماً من إضافتها وتبقى محفوظة عند الإدارة (jobsOld)
  const liveJobs = () => jobs().filter(j => (j.ts || 0) > Date.now() - JOB_DAYS * 864e5);
  const jobsAdmin = () => [...jobs().map(j => ({ ...j, _p: 'jobs' })), ...Store.list('jobsOld').filter(j => j && j.title && j.url).map(j => ({ ...j, _p: 'jobsOld' }))].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const unreadAds = id => { const sn = lsGet(kAds(id)); return approved().filter(o => (o.ts || 0) > sn && isOpen(o)); };
  const unreadJobs = id => { const sn = lsGet(kJobs(id)); return liveJobs().filter(j => (j.ts || 0) > sn); };
  const unread = id => [...unreadAds(id), ...unreadJobs(id)];

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
    const sub = V.sub === 'jobs' ? 'jobs' : 'ads', sa = lsGet(kAds(t.id)), sj = lsGet(kJobs(t.id)), ua = unreadAds(t.id).length, uj = unreadJobs(t.id).length;
    const list = approved().filter(isOpen), jl = liveJobs();
    const sw = (k, ic, l, n) => `<button type="button" class="${sub === k ? 'on' : ''}" data-sub="${k}"><i class="${ic}"></i><span>${l}</span>${n ? `<b class="badge num">${n}</b>` : ''}</button>`;
    main.innerHTML = `<div class="dash-h"><h2>إعلانات عبر الإنترنت</h2><span class="muted small">إعلانات عامة تبحث عن مدربين، تصلك من عدة مصادر</span></div>
      <div class="opp-sub">${sw('ads', 'fa-solid fa-bullhorn', 'فرص تدريب عامة', ua)}${sw('jobs', 'fa-solid fa-briefcase', 'وظائف تدريب', uj)}</div>
      <div class="banner info" style="margin-bottom:12px"><i class="fa-solid fa-circle-info"></i><span>هذه الفرص منقولة من مصادر عامة في الإنترنت ومنصات التواصل الاجتماعي، وبعضها يرسل لنا مباشرة. نحاول قدر الإمكان التحقق من صحة الإعلان وسلامة المصدر، ونهيب بجميع المدربين التحقق دائماً عند إجراء التعاملات عبر الإنترنت.</span></div>
      ${sub === 'ads'
        ? `<p class="muted small" style="margin:0 0 10px">إعلانات نعلنها نحن داخل المنصة بعد مراجعتها.</p>${list.length ? list.map(o => card(o, (o.ts || 0) > sa)).join('') : '<div class="empty"><i class="fa-solid fa-handshake-angle"></i><h3>لا توجد فرص حالياً</h3><p>حين تعتمد الإدارة فرصة جديدة تظهر هنا وتصلك بشارة.</p></div>'}`
        : `<p class="muted small" style="margin:0 0 10px"><i class="fa-brands fa-google"></i> وظائف مدربين في السعودية تُجلب تلقائياً من Google Jobs (عربي وإنجليزي).</p><div class="banner warn" style="margin-bottom:10px"><i class="fa-solid fa-hourglass-half"></i><span><b>تنبيه:</b> الوظائف المعلنة تُمسح من هذه الصفحة بعد مرور 45 يوماً على إضافتها، فبادر بالتقديم قبل ذلك.</span></div>${jl.length ? jl.map(j => jobCard(j, (j.ts || 0) > sj)).join('') : '<div class="empty"><i class="fa-solid fa-briefcase"></i><h3>لا توجد وظائف حالياً</h3><p>تظهر هنا الوظائف الجديدة تلقائياً.</p></div>'}`}`;
    $$('[data-sub]', main).forEach(b => b.onclick = () => { V.sub = b.dataset.sub; tab(main, t); });
    // نعدّ ما في القسم المفتوح مقروءاً، ونحدّث الشارات دون إعادة رسم الصفحة
    if (sub === 'ads') lsSet(kAds(t.id), Math.max(0, ...approved().map(o => o.ts || 0))); else lsSet(kJobs(t.id), Math.max(0, ...liveJobs().map(o => o.ts || 0)));
    $$('.opp-sub [data-sub="' + sub + '"] .badge', main).forEach(x => x.remove());
    const rest = unread(t.id).length, pb = $('[data-tab="opps"] .badge');
    if (!rest) pb && pb.remove(); else if (pb) pb.textContent = rest;
  }
  function jobCard(j, fresh) {
    const u = safeUrl(j.url);
    return `<div class="lead opp ${fresh ? 'new' : ''}"><span class="ic"><i class="fa-solid fa-briefcase"></i></span>
      <div><b>${esc(j.title)}</b> ${fresh ? '<span class="pill ok">جديد</span>' : ''}${j.sched ? ` <span class="pill">${esc(j.sched)}</span>` : ''}
        <div class="small muted">${j.org ? `${esc(j.org)} · ` : ''}${j.loc ? `${esc(j.loc)} · ` : ''}${j.site ? `${esc(j.site)} · ` : ''}<span title="تاريخ الإضافة في المنصة"><i class="fa-regular fa-calendar"></i> أُضيفت ${fmtDate(j.ts)} (${ago(j.ts)})</span> · <span title="تُمسح من الصفحة بعد 45 يوماً من إضافتها"><i class="fa-solid fa-hourglass-half"></i> تبقى ${Math.max(0, Math.ceil((j.ts + JOB_DAYS * 864e5 - Date.now()) / 864e5))} يوماً</span>${j.posted ? ` · نُشرت: ${esc(j.posted)}` : ''}</div>
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
      if (!rec.pub) setTimeout(() => Automation.notify('push', `o:${id}`), 1500);   // إشعار جوال للمدربين بالفرصة الجديدة (لا يشمل الوظائف)
      Security.log(rec.pub ? 'تعديل فرصة تدريب' : 'اعتماد فرصة تدريب', out.title); toast(rec.pub ? 'تم الحفظ' : 'اعتُمدت الفرصة وظهرت للمدربين'); m.close(); onDone && onDone();
    };
  }

  /* ---------- أدوات مشتركة لصفحتي «فرص التدريب» و«الوظائف» في لوحة الإدارة ---------- */
  const ymKey = ts => { const d = new Date((ts || 0) + 3 * 36e5); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
  const ymName = ym => `${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
  const csvCell = v => `"${String(v == null ? '' : v).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  const saveCsv = (name, rows) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); };
  const tally = (list, f, n = 8) => { const m = new Map(); list.forEach(x => { const k = f(x); if (k) m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n); };
  const dayOf = ts => (ts ? new Date(ts).toLocaleDateString('en-CA') : '');
  const OV = { m: '' };   // فلتر الشهر في جدول فرص الإدارة

  /* ---------- صفحة «فرص التدريب»: إحصاءات + جزء الإدارة (إضافة وجدول) ---------- */
  // orgs = طلبات الجهات (اطلب مدرباً + التواصل المباشر) تمرّرها صفحة الطلبات لتُحسب إحصاءاتها
  function statsHtml(orgs) {
    const ap = approved(), reqs = orgs.filter(r => r.kind === 'req'), leads = orgs.filter(r => r.kind === 'lead'), cm = MonthStats.cur().key;
    const thisM = [...ap, ...orgs].filter(x => ymKey(x.ts) === cm).length;
    const sp = k => (k ? specName(k) : ''), rg = k => (k ? regionName(k) : ''), norm = t => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const mon = list => anBars(tally(list, x => ymKey(x.ts), 6).sort((a, b) => (a[0] < b[0] ? -1 : 1)), ymName);
    const none = 'لا بيانات بعد';
    return `<div class="kpis">${anKpi('fa-layer-group', anNum(ap.length + orgs.length), 'إجمالي فرص التدريب')}${anKpi('fa-handshake-angle', anNum(ap.length), 'مضافة من الإدارة')}${anKpi('fa-wand-magic-sparkles', anNum(reqs.length), 'طلبات «اطلب مدرباً»')}${anKpi('fa-paper-plane', anNum(leads.length), 'طلبات تواصل مع مدرب')}${anKpi('fa-calendar-day', anNum(thisM), 'هذا الشهر (الإدارة + الجهات)')}</div>
      <div class="grid2">
        ${anBox('fa-handshake-angle', `إحصاءات إضافات الإدارة (${ap.length})`, `<h4 class="an-h4">حسب النوع</h4>${anBars(tally(ap, o => (KIND[o.kind] || KIND.post)[0]), x => x, none)}<h4 class="an-h4">أكثر التخصصات</h4>${anBars(tally(ap, o => sp(o.spec)), x => x, none)}<h4 class="an-h4">أكثر المناطق</h4>${anBars(tally(ap, o => rg(o.region)), x => x, none)}<h4 class="an-h4">حسب الشهر</h4>${mon(ap)}`)}
        ${anBox('fa-inbox', `إحصاءات طلبات الجهات (${orgs.length})`, `<h4 class="an-h4">أكثر البرامج طلباً</h4>${anBars(tally(orgs, r => norm(r.topic), 10), x => x, none)}<h4 class="an-h4">أكثر التخصصات</h4>${anBars(tally(orgs, r => sp(r.spec)), x => x, none)}<h4 class="an-h4">أكثر المناطق</h4>${anBars(tally(orgs, r => rg(r.region)), x => x, none)}<h4 class="an-h4">حسب الشهر</h4>${mon(orgs)}`)}
      </div>`;
  }

  function adminOpps(box, rerender) {
    const ib = inbox(), news = ib.filter(o => o.status === 'new'), all = approved(), months = [...new Set(all.map(o => ymKey(o.ts)))].sort().reverse();
    if (OV.m && !months.includes(OV.m)) OV.m = '';
    const ap = OV.m ? all.filter(o => ymKey(o.ts) === OV.m) : all;
    const row = (o, btns) => `<div class="lead"><span class="ic"><i class="fa-solid ${(KIND[o.kind] || KIND.post)[1]}"></i></span><div><b><a href="${esc(safeUrl(o.url) || '#')}" target="_blank" rel="noopener nofollow">${esc(o.title)}</a></b> <small class="muted">${esc(o.site || host(o.url))} · ${ago(o.ts)}${o.src === 'jobs' ? ' · Google Jobs' : o.src === 'etimad' ? ' · اعتماد' : o.src === 'google' ? ' · بحث Google' : ''}${o.deadline ? ' · آخر موعد ' + fmtDate(o.deadline) : ''}</small>${o.desc ? `<p class="small">${esc(String(o.desc).slice(0, 220))}</p>` : ''}</div><div class="acts" style="flex-direction:column">${btns}</div></div>`;
    box.innerHTML = `      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-plus"></i> إضافة فرصة (إعلان نصي · إعلان نصي برابط · رابط)</h3>
        <p class="small muted">الصق نص الإعلان كما وصلك (من واتساب مثلاً) و/أو رابطه (لينكدإن، إنستقرام، تيك توك…). يظهر للمدربين كما هو، ومع الرابط تظهر لهم معاينته. اكتب نصاً أو رابطاً أو الاثنين.</p>
        <textarea id="op-text" rows="5" maxlength="2000" placeholder="نص الإعلان (اختياري إن وضعت رابطاً)" style="width:100%;margin-bottom:8px"></textarea>
        <div class="row" style="gap:8px"><input id="op-url" type="url" dir="ltr" placeholder="رابط (اختياري) https://…" style="flex:1"><button class="btn primary" id="op-add"><i class="fa-solid fa-plus"></i> إضافة ومراجعة</button></div></div>
      ${news.length ? `<div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-inbox"></i> الوارد بانتظار المراجعة (${news.length})</h3>${news.map(o => row(o, `<button class="btn sm primary" data-ap="${esc(o.id)}"><i class="fa-solid fa-circle-check"></i> اعتماد</button><button class="btn sm danger" data-rj="${esc(o.id)}"><i class="fa-solid fa-xmark"></i> رفض</button>`)).join('')}</div>` : ''}
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-table-list"></i> جدول فرص التدريب المضافة من الإدارة (${ap.length})</h3>
        <p class="small muted">اضغط على عنوان الفرصة لعرض تفاصيلها. صدّر الجدول بكامل حقوله (العنوان والنص والرابط والتخصص والمنطقة...) لتحليله لاحقاً، مثل استخراج أكثر البرامج طلباً.</p>
        <div class="bl-bar"><label>الشهر<select id="op-m"><option value="">كل الأشهر</option>${months.map(m => `<option value="${m}" ${OV.m === m ? 'selected' : ''}>${esc(ymName(m))}</option>`).join('')}</select></label><button class="btn sm" id="op-csv" ${ap.length ? '' : 'disabled'}><i class="fa-solid fa-file-csv"></i> تصدير CSV</button></div>
        ${ap.length ? `<div class="tbl-wrap" style="max-height:480px;overflow:auto"><table class="tbl"><thead><tr><th>التاريخ</th><th>العنوان</th><th>الجهة</th><th>النوع</th><th>التخصص</th><th>المنطقة</th><th>آخر موعد</th></tr></thead><tbody>
          ${ap.map(o => `<tr><td class="num">${esc(dayOf(o.ts))}</td><td><button type="button" class="btn sm ghost" data-x="${esc(o.id)}" style="text-align:start;white-space:normal">${esc(String(o.title).slice(0, 70))}</button></td><td>${esc(o.org || '')}</td><td>${esc((KIND[o.kind] || KIND.post)[0])}</td><td>${esc(o.spec ? specName(o.spec) : '')}</td><td>${esc(o.region ? regionName(o.region) : '')}</td><td class="num">${o.deadline ? esc(dayOf(o.deadline)) : ''}</td></tr>
            <tr hidden data-dx="${esc(o.id)}"><td colspan="7" style="background:var(--g50)"><div style="display:grid;gap:6px">${o.desc ? `<div>${nl2br(o.desc)}</div>` : ''}${o.note ? `<div class="small"><b>ملاحظة للمدربين:</b> ${nl2br(o.note)}</div>` : ''}${o.url ? `<div class="small"><a href="${esc(safeUrl(o.url) || '#')}" target="_blank" rel="noopener nofollow" dir="ltr">${esc(o.url)}</a></div>` : ''}<div class="small muted">المصدر: ${esc(o.site || host(o.url) || '')}</div><div class="row" style="gap:8px"><button class="btn sm" data-ed="${esc(o.id)}"><i class="fa-solid fa-pen"></i> تعديل</button><button class="btn sm danger" data-dl="${esc(o.id)}"><i class="fa-solid fa-trash"></i> سحب</button></div></div></td></tr>`).join('')}
        </tbody></table></div>` : '<p class="muted small">لم تُضف فرص بعد.</p>'}</div>`;
    const again = rerender;
    $('#op-m', box).onchange = e => { OV.m = e.target.value; again(); };
    $('#op-csv', box).onclick = () => saveCsv(`فرص-التدريب-${OV.m || 'الكل'}.csv`, [['التاريخ', 'العنوان', 'الجهة', 'النوع', 'التخصص', 'المنطقة', 'آخر موعد', 'المصدر', 'الرابط', 'النص', 'ملاحظة'], ...ap.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0)).map(o => [dayOf(o.ts), o.title, o.org, (KIND[o.kind] || KIND.post)[0], o.spec ? specName(o.spec) : '', o.region ? regionName(o.region) : '', o.deadline ? dayOf(o.deadline) : '', o.site || host(o.url), o.url, o.desc, o.note])]);
    $$('[data-x]', box).forEach(b => b.onclick = () => { const r = box.querySelector(`[data-dx="${b.dataset.x}"]`); if (r) r.hidden = !r.hidden; });
    $('#op-add', box).onclick = async e => {
      const text = $('#op-text', box).value.trim(), raw = $('#op-url', box).value.trim(), u = raw ? safeUrl(raw) : '';
      if (!text && !raw) return toast('اكتب نص الإعلان أو ضع رابطاً', 'error');
      if (raw && (!u || !/^https:\/\//i.test(u))) return toast('الرابط يجب أن يبدأ بـ https://', 'error');
      if (u && (all.some(o => o.url === u) || ib.some(o => o.url === u))) return toast('الرابط موجود مسبقاً', 'error');
      const first = text.split('\n').map(x => x.trim()).find(Boolean) || '';
      const b = e.currentTarget, h = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      const p = u ? await News.fetchPreview(u.slice(0, 500)) : null; b.disabled = false; b.innerHTML = h;
      editor({ url: u || '', title: (first || p?.title || '').slice(0, 200), desc: text || p?.desc || '', lt: p?.title || '', ld: p?.desc || '', img: p?.img || '', site: p?.site || '', kind: 'post' }, { onDone: () => { $('#op-text', box).value = ''; $('#op-url', box).value = ''; again(); } });
    };
    $$('[data-ap]', box).forEach(b => b.onclick = () => editor(Store.get(`oppInbox/${b.dataset.ap}`), { fromInbox: true, onDone: again }));
    $$('[data-rj]', box).forEach(b => b.onclick = () => Store.update(`oppInbox/${b.dataset.rj}`, { status: 'rejected' }));
    $$('[data-ed]', box).forEach(b => b.onclick = () => editor({ ...Store.get(`opportunities/${b.dataset.ed}`), pub: true }, { onDone: again }));
    $$('[data-dl]', box).forEach(b => b.onclick = async () => { if (await confirmBox('سحب هذه الفرصة من حسابات المدربين؟', { ok: 'سحب', danger: true })) { Store.remove(`opportunities/${b.dataset.dl}`); Security.log('سحب فرصة تدريب', b.dataset.dl); } });
  }

  /* ---------- صفحة «الوظائف»: الجلب الآلي + قائمة الوظائف + تصدير شهري ---------- */
  const jobRows = list => [['التاريخ', 'العنوان', 'الجهة', 'الموقع', 'المصدر', 'نوع الدوام', 'الرابط', 'عبارة البحث', 'الوصف'], ...list.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0)).map(j => [dayOf(j.ts), j.title, j.org, j.loc, j.site, j.sched, j.url, j.q, j.desc])];
  function admin(main) {
    const jl = jobsAdmin(), set = Store.get('settings/opps') || {}, jq = arr(set.jobQueries).length ? arr(set.jobQueries) : JOB_DEFAULT, last = set.lastRun || {};
    const arch = Store.get('jobsArchive') || {}, stat = Store.get('stats/month') || {}, jm = [...new Set([...Object.keys(arch), ...jl.map(j => ymKey(j.ts))])].sort().reverse();
    main.innerHTML = `<div class="dash-h"><h2>وظائف</h2><span class="muted small">وظائف التدريب المجلوبة آلياً من Google Jobs وتظهر في حسابات المدربين</span></div>
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-solid fa-robot"></i> الجلب الآلي</h3>
        <p class="small muted">${last.ts ? `آخر تشغيل: ${ago(last.ts)} - ${last.jobsFound ?? 0} نتيجة في السعودية، ${last.jobs ?? 0} جديدة.` : 'لم يُشغَّل بعد.'} يعمل يومياً بعد تفعيل المشغّل في سكربت Google، أو اضغط «جلب الآن».</p>
        ${arr(last.log).length ? `<details class="small" style="margin:0 0 10px"><summary style="color:var(--warn);cursor:pointer">رسائل آخر تشغيل (${arr(last.log).length}) - قد تكون قديمة</summary><div style="color:var(--warn);margin-top:6px" dir="auto">${arr(last.log).map(x => `<div>${esc(x)}</div>`).join('')}</div><button class="btn sm ghost" id="op-clrlog" style="margin-top:8px"><i class="fa-solid fa-broom"></i> مسح الرسائل</button></details>` : ''}
        <div style="display:grid;gap:12px">
          <label class="chk"><input type="checkbox" id="op-jobs" ${set.jobs === true ? 'checked' : ''}><span>تفعيل جلب وظائف Google Jobs يومياً ونشرها تلقائياً للمدربين <small class="muted">(بلا مراجعة؛ محصور بالسعودية؛ يحتاج مفتاح SerpApi في خصائص السكربت: SERPAPI_KEY)</small></span></label>
          ${field('تكرار الجلب', `<select id="op-jd">${[[1, 'يومياً'], [2, 'كل يومين'], [3, 'كل 3 أيام'], [7, 'أسبوعياً']].map(([v, l]) => `<option value="${v}" ${(Number(set.jobDays) || 1) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
          ${field('كلمات البحث المفتاحية (عبارة في كل سطر، حتى 20)', `<textarea id="op-jq" rows="9">${esc(jq.join('\n'))}</textarea>`)}
          <div class="small" id="op-jqn"></div>
          <div class="small"><b>اقتراحات (انقر للإضافة):</b><div class="chips" id="op-sug" style="margin-top:6px">${JOB_SUGGEST.map(x => `<button type="button" class="chip" data-sg="${esc(x)}">+ ${esc(x)}</button>`).join('')}</div></div>
        </div>
        ${arr(last.stats).length ? `<details class="small" style="margin-top:10px"><summary style="cursor:pointer"><b>إنتاجية كل عبارة في آخر تشغيل</b> (لتبقي الأنفع وتحذف الأضعف)</summary><table class="tbl" style="margin-top:8px"><thead><tr><th>العبارة</th><th>نتائج Google</th><th>داخل السعودية</th><th>جديدة</th></tr></thead><tbody>${[...arr(last.stats)].sort((x, y) => (y.added || 0) - (x.added || 0) || (y.ksa || 0) - (x.ksa || 0)).map(r => `<tr><td dir="auto">${esc(r.q)}</td><td class="num">${r.raw ?? 0}</td><td class="num">${r.ksa ?? 0}</td><td class="num"><b>${r.added ?? 0}</b></td></tr>`).join('')}</tbody></table></details>` : ''}
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn" id="op-save"><i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات</button>${Automation.on ? '<button class="btn primary" id="op-run"><i class="fa-solid fa-rotate"></i> جلب الآن</button>' : '<small class="muted">الأتمتة غير مفعّلة</small>'}</div></div>
      <div class="pbox" style="margin-bottom:12px"><h3><i class="fa-brands fa-google"></i> وظائف Google Jobs المنشورة تلقائياً (${jl.length}) ${jl.length ? '<button class="btn sm danger" id="op-jclr" style="margin-inline-start:10px"><i class="fa-solid fa-broom"></i> حذف الكل</button>' : ''}</h3>
        <p class="small muted">تُنشر مباشرة في قسم «وظائف مدربين من Google Jobs» داخل حسابات المدربين بلا مراجعة، وتختفي من حسابات المدربين بعد 45 يوماً من إضافتها (يُكتب لهم ذلك)، وتبقى هنا محفوظة للأرشيف والتحليل. احذف ما لا يناسب.</p>
        ${jm.filter(m => jl.some(j => ymKey(j.ts) === m)).map((m, k) => { const L = jl.filter(j => ymKey(j.ts) === m); return `<details class="pbox" style="margin:8px 0" ${k === 0 ? 'open' : ''}><summary style="cursor:pointer"><b><i class="fa-regular fa-calendar"></i> ${esc(ymName(m))}</b> <span class="pill info">${anNum(L.length)} وظيفة</span></summary>
          <div class="row" style="margin:8px 0"><button class="btn sm" data-jx="${m}"><i class="fa-solid fa-file-csv"></i> تصدير هذا الشهر CSV</button></div>
          ${L.map(j => `<div class="lead"><span class="ic"><i class="fa-solid fa-briefcase"></i></span><div><b><a href="${esc(safeUrl(j.url) || '#')}" target="_blank" rel="noopener nofollow">${esc(j.title)}</a></b> <small class="muted">${esc(j.org || '')} ${esc(j.loc || '')} · ${ago(j.ts)}${j._p === 'jobsOld' || (j.ts || 0) < Date.now() - JOB_DAYS * 864e5 ? ' · <span class="pill gray">مخفية عن المدربين</span>' : ''}</small></div><div class="acts"><button class="btn sm danger" data-jdel="${esc(j.id)}" data-jp="${esc(j._p)}"><i class="fa-solid fa-trash"></i></button></div></div>`).join('')}</details>`; }).join('') || '<p class="muted small">لا توجد وظائف بعد.</p>'}</div>
      <div class="pbox"><h3><i class="fa-solid fa-file-export"></i> تصدير الوظائف الشهرية</h3>
        <p class="small muted">في بداية كل شهر يُجهّز السكربت تلقائياً ملف CSV بوظائف الشهر المنتهي (وتبقى كل الوظائف محفوظة عندك حتى بعد اختفائها من حسابات المدربين) ويظهر رابطه هنا للتحميل. ويمكنك تصدير أي شهر من الوظائف المتاحة الآن مباشرة.</p>
        ${jm.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الشهر</th><th>عدد الوظائف</th><th>ملف الشهر التلقائي</th><th>تصدير الآن</th></tr></thead><tbody>${jm.map(m => { const a = arch[m], n = (stat[m] || {}).jobs, live = jl.filter(j => ymKey(j.ts) === m).length; return `<tr><td><b>${esc(ymName(m))}</b></td><td class="num">${anNum(n != null ? n : live)}</td><td>${a && /^https:\/\//.test(a.url || '') ? `<a class="btn sm primary" href="${esc(a.url)}" target="_blank" rel="noopener"><i class="fa-solid fa-download"></i> تحميل (${anNum(a.count || 0)} وظيفة)</a>` : '<span class="muted small">لم يُجهَّز بعد</span>'}</td><td>${live ? `<button class="btn sm" data-jx="${m}"><i class="fa-solid fa-file-csv"></i> CSV (${anNum(live)})</button>` : '<span class="muted small">—</span>'}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted small">لا وظائف مجلوبة بعد.</p>'}
      </div>`;
    const cnt = () => { const n = Math.min(20, [...new Set($('#op-jq', main).value.split('\n').map(x => x.trim()).filter(Boolean))].length), d = Number($('#op-jd', main).value) || 1, m = Math.round(n * 30 / d); $('#op-jqn', main).innerHTML = `<b>${n}</b> عبارة كل ${d === 1 ? 'يوم' : d + ' أيام'} ≈ <b>${m}</b> بحثاً شهرياً في SerpApi (الخطة المجانية نحو 100 بحث شهرياً).${m > 100 ? ' <span style="color:var(--bad)">أعلى من الحصة المجانية: قلّل العبارات أو زد الفاصل.</span>' : ' <span style="color:var(--ok)">ضمن الحصة المجانية.</span>'}`; };
    $('#op-jq', main).oninput = cnt; $('#op-jd', main).onchange = cnt; cnt();
    $$('[data-sg]', main).forEach(b => b.onclick = () => { const t = $('#op-jq', main), cur = t.value.split('\n').map(x => x.trim()).filter(Boolean); if (!cur.includes(b.dataset.sg)) cur.push(b.dataset.sg); t.value = cur.join('\n'); cnt(); });
    $('#op-save', main).onclick = () => {
      const lines = id => [...new Set($(id, main).value.split('\n').map(x => x.trim()).filter(Boolean))];
      Store.update('settings/opps', { jobs: $('#op-jobs', main).checked, jobQueries: lines('#op-jq').slice(0, 20), jobDays: Number($('#op-jd', main).value) || 1, feeds: null, etimad: null, etimadTerms: null, gnews: null, queries: null }); Security.log('تعديل إعدادات وظائف Google Jobs'); toast('تم حفظ الإعدادات');
    };
    $('#op-run', main) && ($('#op-run', main).onclick = async e => { e.currentTarget.disabled = true; await Automation.notify('opps', 'now'); toast('طُلب الجلب، تظهر النتائج خلال دقيقة تقريباً'); });
    $('#op-clrlog', main) && ($('#op-clrlog', main).onclick = () => { Store.remove('settings/opps/lastRun/log'); toast('تم مسح الرسائل'); });
    $('#op-jclr', main) && ($('#op-jclr', main).onclick = async () => { if (await confirmBox(`حذف ${jl.length} وظيفة من حسابات المدربين؟`, { ok: 'حذف', danger: true })) { jl.forEach(j => Store.remove(`${j._p}/${j.id}`)); toast('تم الحذف'); } });
    $$('[data-jdel]', main).forEach(b => b.onclick = () => Store.remove(`${b.dataset.jp === 'jobsOld' ? 'jobsOld' : 'jobs'}/${b.dataset.jdel}`));
    $$('[data-jx]', main).forEach(b => b.onclick = () => saveCsv(`وظائف-التدريب-${b.dataset.jx}.csv`, jobRows(jl.filter(j => ymKey(j.ts) === b.dataset.jx))));
  }

  return { approved, inbox, unread, tab, admin, adminOpps, statsHtml };
})();
