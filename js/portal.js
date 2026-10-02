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
  const priv = Store.get(`private/${t.id}`) || {};
  const note = Store.get(`notes/${t.id}`);
  main.innerHTML = `
    <div class="dash-h"><h2>أهلاً ${esc(firstName(t.name))} 👋</h2><div class="row"><button class="btn gold" id="sh"><i class="fa-solid fa-share-nodes"></i> مشاركة بطاقتي</button></div></div>
    ${t.status !== 'active' ? `<div class="banner warn"><i class="fa-solid fa-eye-slash"></i>بطاقتك غير ظاهرة للزوار حالياً. تواصل مع إدارة المنصة للاستفسار.</div>` : ''}
    ${note?.text ? `<div class="banner ok"><i class="fa-solid fa-bullhorn"></i><div><b>رسالة من الإدارة</b><br>${nl2br(note.text)}</div></div>` : ''}
    <div class="kpis">
      <div class="kpi dark"><i class="fa-solid fa-eye"></i><b class="num" data-count="${Data.views(t.id)}">0</b><span>مشاهدة لبطاقتك</span></div>
      <div class="kpi"><i class="fa-solid fa-inbox"></i><b class="num" data-count="${leads.length}">0</b><span>طلب من جهات تدريبية</span></div>
      <div class="kpi"><i class="fa-solid fa-infinity"></i><b>مدى الحياة</b><span>اشتراكك${t.publishedAt ? ' منذ ' + fmtDate(t.publishedAt) : ''}</span></div>
    </div>
    <div class="editor">
      <div>
        <div class="pbox"><h3><i class="fa-solid fa-images"></i>صور جاهزة للمشاركة</h3>
          <p class="muted small">صور عالية الدقة بتصميم بطاقتك، فيها رمز QR يفتح صفحتك مباشرة.</p>
          <div class="share-grid">
            <button class="sh im" data-img="post"><i class="fa-solid fa-image"></i>منشور 4:5</button>
            <button class="sh st" data-img="story"><i class="fa-solid fa-mobile-screen"></i>قصة 9:16</button>
            <button class="sh wd" data-img="wide"><i class="fa-solid fa-panorama"></i>عرضي 16:9</button>
            <button class="sh cp" id="cl"><i class="fa-solid fa-link"></i>نسخ رابط صفحتي</button>
          </div>
        </div>
        <div class="pbox"><h3><i class="fa-solid fa-palette"></i>لون بطاقتي</h3>
          ${cardTemplate().colors.on ? '<p class="muted small">تعتمد المنصة لوناً موحداً لكل البطاقات حالياً.</p>' : `<p class="muted small">اختر لون بطاقتك التعريفية من الألوان المتاحة، ويُحفظ اختيارك فوراً.</p>
          <div class="themes" id="thm">${CARD_THEMES.map(x => `<label title="${x.name}"><input type="radio" name="theme" value="${x.k}" ${(t.theme || 'brand') === x.k ? 'checked' : ''}><span style="background:linear-gradient(135deg,${x.a},${x.c})${x.light ? ';box-shadow:inset 0 0 0 1px #c9d8c0' : ''}"></span><em>${x.name}</em></label>`).join('')}</div>`}
        </div>
        <div class="pbox"><h3><i class="fa-solid fa-lightbulb"></i>نصائح لبطاقة أقوى</h3>
          <ul style="margin:0;padding-inline-start:18px;color:var(--ink2)">
            ${!Data.photo(t) && !t.noPhoto ? '<li>أضف صورة شخصية واضحة — البطاقات ذات الصور تحصل على مشاهدات أكثر.</li>' : ''}
            ${Data.topics(t).length < 3 ? '<li>أضف عناوين دوراتك السابقة في «عناوين دورات تم تقديمها سابقاً» لتظهر في نتائج البحث.</li>' : ''}
            ${!Number(t.hours) ? '<li>أضف عدد ساعاتك التدريبية لتظهر كمؤشر بارز في بطاقتك.</li>' : ''}
            <li>شارك بطاقتك في لينكدإن وإكس — كل مشاهدة تُحتسب في لوحتك.</li>
          </ul>
        </div>
        <div class="pbox"><h3><i class="fa-solid fa-lock"></i>بيانات التواصل (لا تظهر للعامة)</h3>
          <form id="pc" novalidate style="display:grid;gap:10px">
            ${field('الجوال', `<input type="tel" name="phone" dir="ltr" maxlength="15" placeholder="05xxxxxxxx" value="${esc(priv.phone || '')}">`)}
            ${field('البريد الإلكتروني', `<input type="email" name="email" dir="ltr" maxlength="120" value="${esc(priv.email || '')}">`)}
            <div class="row between"><small class="muted">تصلك عليهما طلبات الجهات التدريبية. تاريخ الانضمام: ${fmtDate(t.publishedAt)} · الاشتراك مدى الحياة.</small><button class="btn primary sm">حفظ بيانات التواصل</button></div>
          </form></div>
      </div>
      <div class="preview">${Card.full(t)}</div>
    </div>
    <p class="ack-note"><i class="fa-solid fa-circle-info"></i>${esc(Data.content().join.disclaimer || '')}</p>`;
  countUp(main); tilt(main);
  $('#pc', main).onsubmit = e => {
    e.preventDefault();
    const f = e.target, phone = f.phone.value.trim(), email = f.email.value.trim();
    if (phone && !validPhone(phone)) { toast('رقم الجوال غير صحيح (مثال: 0501234567)', 'error'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast('البريد الإلكتروني غير صحيح', 'error'); return; }
    Store.update(`private/${t.id}`, { phone: phone ? phoneDigits(phone) : '', email });
    toast('تم حفظ بيانات التواصل');
  };
  $$('#thm input', main).forEach(i => i.onchange = () => {
    Store.update(`trainers/${t.id}`, { theme: i.value, updatedAt: Date.now() });
    $('.preview', main).innerHTML = Card.full({ ...t, theme: i.value }); tilt(main); toast('تم تغيير لون بطاقتك');
  });
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
