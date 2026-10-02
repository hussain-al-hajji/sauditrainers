/* لوحة المدرب: بطاقتي، تعديل البيانات بمعاينة حيّة، الطلبات الواردة */

Pages.me = {
  tab: 'home',
  guard() { const s = Auth.current(); return s?.kind === 'trainer' ? null : '#/login'; },
  render() {
    const s = Auth.current();
    const t = Store.get(`trainers/${s.id}`);
    if (!t) return `<div class="wrap empty"><i class="fa-solid fa-circle-exclamation"></i><h3>تعذّر تحميل بياناتك</h3><button class="btn" onclick="Auth.logout()">خروج</button></div>`;
    const leads = Store.list('leads').filter(l => l.trainerId === t.id);
    const fresh = leads.filter(l => l.status === 'new').length;
    const tabs = [['home', 'fa-id-card', 'بطاقتي'], ['edit', 'fa-pen-to-square', 'تعديل البيانات'], ['leads', 'fa-inbox', 'الطلبات الواردة', fresh]];
    return `<div class="wrap dash">
      <aside class="side">
        <div class="who">${Card.avatar(t, 'av')}<div><b>${esc(t.name)}</b><small class="num">${esc(t.code)}</small></div></div>
        ${tabs.map(([k, i, l, b]) => `<button data-tab="${k}" class="${this.tab === k ? 'on' : ''}"><i class="fa-solid ${i}"></i>${l}${b ? `<span class="badge num">${b}</span>` : ''}</button>`).join('')}
        <hr style="border:0;border-top:1px solid rgba(255,255,255,.08)">
        <button data-go="#/t/${esc(encodeURIComponent(t.slug || t.id))}"><i class="fa-solid fa-arrow-up-right-from-square"></i>صفحتي العامة</button>
        <button data-out><i class="fa-solid fa-right-from-bracket"></i>خروج</button>
      </aside>
      <main id="pt"></main>
    </div>`;
  },
  mount(root) {
    const s = Auth.current();
    $$('[data-tab]', root).forEach(b => b.onclick = () => { this.tab = b.dataset.tab; App.render(); });
    $$('[data-go]', root).forEach(b => b.onclick = () => { location.hash = b.dataset.go; });
    $('[data-out]', root) && ($('[data-out]', root).onclick = () => Auth.logout());
    const t = Store.get(`trainers/${s.id}`);
    if (!t) return;
    const main = $('#pt', root);
    // تنبيه بالطلبات الجديدة مرة واحدة في الجلسة
    const fresh = Store.list('leads').filter(l => l.trainerId === t.id && l.status === 'new').length;
    try { if (fresh && sessionStorage.getItem('st-leads-seen') !== String(fresh)) { sessionStorage.setItem('st-leads-seen', String(fresh)); toast(`لديك ${fresh} ${fresh === 1 ? 'طلب تواصل جديد' : 'طلبات تواصل جديدة'} من جهات تدريبية`); } } catch { /* ignore */ }
    ({ home: portalHome, edit: portalEdit, leads: portalLeads })[this.tab](main, t);
  },
  // لا نعيد رسم نموذج التعديل أثناء الكتابة
  get static() { return this.tab === 'edit'; }
};

function portalHome(main, t) {
  const leads = Store.list('leads').filter(l => l.trainerId === t.id);
  const days = t.expiresAt ? Math.ceil((t.expiresAt - Date.now()) / 864e5) : null;
  const priv = Store.get(`private/${t.id}`) || {};
  const note = Store.get(`notes/${t.id}`);
  main.innerHTML = `
    <div class="dash-h"><h2>أهلاً ${esc(t.name.split(' ').slice(0, 2).join(' '))} 👋</h2><div class="row"><button class="btn gold" id="sh"><i class="fa-solid fa-share-nodes"></i> مشاركة بطاقتي</button></div></div>
    ${t.status !== 'active' ? `<div class="banner warn"><i class="fa-solid fa-eye-slash"></i>بطاقتك غير ظاهرة للزوار حالياً. تواصل مع إدارة المنصة للاستفسار.</div>` : ''}
    ${days != null && days <= 30 ? `<div class="banner ${days <= 0 ? 'warn' : 'info'}"><i class="fa-solid fa-hourglass-half"></i>${days <= 0 ? 'انتهت مدة نشر بطاقتك — تواصل مع الإدارة للتجديد.' : `تنتهي مدة نشر بطاقتك بعد <b class="num">${days}</b> يوماً.`}</div>` : ''}
    ${note?.text ? `<div class="banner ok"><i class="fa-solid fa-bullhorn"></i><div><b>رسالة من الإدارة</b><br>${nl2br(note.text)}</div></div>` : ''}
    <div class="kpis">
      <div class="kpi dark"><i class="fa-solid fa-eye"></i><b class="num" data-count="${Data.views(t.id)}">0</b><span>مشاهدة لبطاقتك</span></div>
      <div class="kpi"><i class="fa-solid fa-inbox"></i><b class="num" data-count="${leads.length}">0</b><span>طلب من جهات تدريبية</span></div>
      <div class="kpi"><i class="fa-solid fa-calendar-check"></i><b class="num">${days != null ? Math.max(0, days) : '∞'}</b><span>يوماً متبقية للنشر</span></div>
    </div>
    <div class="editor">
      <div>
        <div class="pbox"><h3><i class="fa-solid fa-images"></i>صور جاهزة للمشاركة</h3>
          <p class="muted small">صور عالية الدقة بتصميم بطاقتك، فيها رمز QR يفتح صفحتك مباشرة.</p>
          <div class="share-grid">
            <button class="sh im" data-img="post"><i class="fa-solid fa-image"></i>منشور 4:5</button>
            <button class="sh st" data-img="story"><i class="fa-solid fa-mobile-screen"></i>قصة 9:16</button>
            <button class="sh cp" id="cl"><i class="fa-solid fa-link"></i>نسخ رابط صفحتي</button>
          </div>
        </div>
        <div class="pbox"><h3><i class="fa-solid fa-lightbulb"></i>نصائح لبطاقة أقوى</h3>
          <ul style="margin:0;padding-inline-start:18px;color:var(--ink2)">
            ${!Data.photo(t) ? '<li>أضف صورة شخصية واضحة — البطاقات ذات الصور تحصل على مشاهدات أكثر.</li>' : ''}
            ${Data.topics(t).length < 3 ? '<li>أضف برامجك التدريبية في «البرامج ومجالات الخبرة» لتظهر في نتائج البحث.</li>' : ''}
            ${!Number(t.hours) ? '<li>أضف عدد ساعاتك التدريبية لتظهر كمؤشر بارز في بطاقتك.</li>' : ''}
            <li>شارك بطاقتك في لينكدإن وإكس — كل مشاهدة تُحتسب في لوحتك.</li>
          </ul>
        </div>
        <div class="pbox"><h3><i class="fa-solid fa-lock"></i>بيانات إدارية (لا تظهر للعامة)</h3><dl class="dl"><dt>الجوال</dt><dd class="num">${esc(priv.phone || '—')}</dd><dt>البريد</dt><dd>${esc(priv.email || '—')}</dd><dt>تاريخ النشر</dt><dd>${fmtDate(t.publishedAt)}</dd><dt>نهاية النشر</dt><dd>${fmtDate(t.expiresAt)}</dd></dl><p class="small muted">لتعديلها تواصل مع إدارة المنصة.</p></div>
      </div>
      <div class="preview">${Card.full(t)}</div>
    </div>`;
  countUp(main); tilt(main);
  $('#sh', main).onclick = () => Card.share(t);
  $('#cl', main).onclick = () => copyText(profileUrl(t), 'تم نسخ رابط صفحتك');
  $$('[data-img]', main).forEach(b => b.onclick = () => Card.save(t, b.dataset.img));
}

function portalEdit(main, t) {
  const steps = FormKit.steps('self');
  main.innerHTML = `
    <div class="dash-h"><h2>تعديل بطاقتي</h2><span class="muted small">التعديلات تظهر للزوار فور الحفظ</span></div>
    <div class="banner info"><i class="fa-solid fa-lock"></i>بيانات تواصلك (الجوال والبريد) لا تظهر في المنصة؛ تصلك طلبات الجهات عبر المنصة والبريد.</div>
    <div class="editor">
      <form id="ef" class="panel" style="display:grid;gap:18px" autocomplete="off" novalidate>
        ${steps.map(s => `<h3><i class="fa-solid ${esc(s.icon || 'fa-circle')}" style="color:var(--g600)"></i> ${esc(s.title)}</h3>${FormKit.stepHTML(s, t)}`).join('')}
        <div class="row end" style="position:sticky;bottom:12px"><button class="btn primary lg" style="box-shadow:var(--sh3)"><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</button></div>
      </form>
      <div class="preview"><div class="lbl center small muted" style="margin-bottom:8px"><i class="fa-solid fa-eye"></i> معاينة حيّة</div><div id="pvw"></div></div>
    </div>`;
  const form = $('#ef', main);
  const preview = () => previewCard($('#pvw', main), { ...FormKit.read(form), code: t.code });
  FormKit.wire(form, preview);
  preview();
  form.onsubmit = e => {
    e.preventDefault();
    const d = FormKit.read(form);
    const err = FormKit.validate(steps.flatMap(s => s.fields), d, form);
    if (err) { toast(err, 'error'); return; }
    const upd = Data.pick(d, Data.PUBLIC_FIELDS);
    upd.updatedAt = Date.now();
    const pub = Data.splitExtra(d.extra).pub;
    upd.extra = Object.keys(pub).length ? { ...(t.extra || {}), ...pub } : (t.extra || null);
    Store.update(`trainers/${t.id}`, upd);
    toast('تم حفظ بطاقتك');
  };
}

function portalLeads(main, t) {
  const leads = Store.list('leads').filter(l => l.trainerId === t.id).sort((a, b) => b.ts - a.ts);
  main.innerHTML = `<div class="dash-h"><h2>الطلبات الواردة</h2><span class="muted small">طلبات الجهات التدريبية من صفحتك</span></div>
    ${leads.length ? leads.map(l => `<div class="lead">
      <span class="ic"><i class="fa-solid fa-building"></i></span>
      <div><b>${esc(l.org)}</b> <span class="pill ${l.status === 'new' ? 'gold' : 'gray'}">${l.status === 'new' ? 'جديد' : 'تم التواصل'}</span><br>
        <small class="muted">${esc(l.person)} · ${ago(l.ts)}</small>
        <p><b>الموضوع:</b> ${esc(l.topic)}${l.when ? ` · <b>الموعد:</b> ${esc(l.when)}` : ''}${l.mode ? ` · ${esc(DELIVERY.find(d => d.k === l.mode)?.name || '')}` : ''}</p>
        ${l.msg ? `<p>${nl2br(l.msg)}</p>` : ''}
      </div>
      <div class="acts" style="flex-direction:column">
        <a class="btn sm primary" target="_blank" rel="noopener" href="${esc(waLink(l.phone, `السلام عليكم ${l.person}، معك ${t.name} بخصوص طلبكم عبر منصة مدرّبون سعوديّون: ${l.topic}`))}"><i class="fa-brands fa-whatsapp"></i> تواصل</a>
        ${l.email ? `<a class="btn sm" href="mailto:${esc(l.email)}"><i class="fa-solid fa-envelope"></i> بريد</a>` : ''}
        ${l.status === 'new' ? `<button class="btn sm ghost" data-done="${esc(l.id)}"><i class="fa-solid fa-check"></i> تم</button>` : ''}
      </div>
    </div>`).join('') : `<div class="empty"><i class="fa-solid fa-inbox"></i><h3>لا توجد طلبات بعد</h3><p>شارك بطاقتك لتصل إلى جهات تدريبية أكثر.</p><button class="btn gold" id="sh2"><i class="fa-solid fa-share-nodes"></i> مشاركة بطاقتي</button></div>`}`;
  $$('[data-done]', main).forEach(b => b.onclick = () => Store.update(`leads/${b.dataset.done}`, { status: 'done' }));
  $('#sh2', main) && ($('#sh2', main).onclick = () => Card.share(t));
}
