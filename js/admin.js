/* لوحة الإدارة: المؤشرات، طلبات التسجيل، المدربون، الطلبات، القاعات، المحتوى، المشرفون، النسخ الاحتياطي */

const googleIcon = '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

const loginMessage = (t, secret) => `مرحباً ${t.name} 🌟
تم نشر بطاقتك التعريفية في منصة «مدرّبون سعوديّون».

🔗 رابط بطاقتك للمشاركة:
${profileUrl(t)}

🔐 لتعديل بياناتك ومتابعة الطلبات الواردة:
${siteBase()}#/login
رمز الدخول: ${secret}

(احتفظ بالرمز ولا تشاركه مع أحد)`;

Pages.admin = {
  tab: 'dash',
  render() {
    const s = Auth.current();
    if (s?.kind !== 'admin') return adminLoginView();
    const apps = Store.list('applications');
    const newApps = apps.filter(a => a.status === 'new').length;
    const newReq = Store.list('requests').filter(r => r.status === 'new').length + Store.list('leads').filter(r => r.status === 'new').length;
    const newHall = Store.list('hallReqs').filter(r => r.status === 'new').length;
    const tabs = [
      ['dash', 'fa-chart-pie', 'المؤشرات'], ['apps', 'fa-user-plus', 'طلبات التسجيل', newApps], ['trainers', 'fa-id-card', 'المدربون'],
      ['requests', 'fa-inbox', 'طلبات الجهات', newReq], ['halls', 'fa-building-columns', 'القاعات', newHall], ['content', 'fa-pen-ruler', 'المحتوى'],
      ['admins', 'fa-user-shield', 'المشرفون'], ['backup', 'fa-database', 'البيانات والسجل']
    ];
    const u = Security.currentUser();
    return `<div class="wrap dash">
      <aside class="side">
        <div class="who"><span class="av"><i class="fa-solid fa-shield-halved" style="color:var(--gold2)"></i></span><div><b>${esc(Security.adminName())}</b><small>${u ? esc(u.email) : 'الوضع المحلي'}</small></div></div>
        ${tabs.map(([k, i, l, b]) => `<button data-tab="${k}" class="${this.tab === k ? 'on' : ''}"><i class="fa-solid ${i}"></i>${l}${b ? `<span class="badge num">${b}</span>` : ''}</button>`).join('')}
        <hr style="border:0;border-top:1px solid rgba(255,255,255,.08)">
        <button data-out><i class="fa-solid fa-right-from-bracket"></i>خروج</button>
      </aside>
      <main id="at"></main>
    </div>`;
  },
  mount(root) {
    if (Auth.current()?.kind !== 'admin') return mountAdminLogin(root);
    $$('[data-tab]', root).forEach(b => b.onclick = () => { this.tab = b.dataset.tab; App.render(); });
    $('[data-out]', root).onclick = () => Auth.logout();
    const main = $('#at', root);
    ({ dash: aDash, apps: aApps, trainers: aTrainers, requests: aRequests, halls: aHalls, content: aContent, admins: aAdmins, backup: aBackup })[this.tab](main);
  },
  get static() { return ['content'].includes(this.tab); }
};

function adminLoginView() {
  return `<div class="auth-wrap"><div class="auth-card">
    ${Card.brandMark(66)}
    <h2>لوحة الإدارة</h2>
    <p class="muted">الدخول بحساب Google المصرّح له بإدارة المنصة.</p>
    <div style="display:grid;gap:12px;margin-top:18px">
      <button class="gbtn" id="gl">${googleIcon}<span>${Security.secure() ? 'الدخول بحساب Google' : 'دخول تجريبي (الوضع المحلي)'}</span></button>
      <div class="error-msg" id="ge"></div>
      ${Security.secure() ? '' : '<div class="note"><i class="fa-solid fa-circle-info"></i> المنصة تعمل حالياً في الوضع المحلي (البيانات في هذا المتصفح فقط). لتفعيل دخول Google الحقيقي والحفظ المركزي أضف إعدادات Firebase في <b>js/config.js</b> — التفاصيل في README.</div>'}
    </div>
  </div></div>`;
}
function mountAdminLogin(root) {
  $('#gl', root).onclick = async () => {
    $('#ge', root).textContent = '';
    try { await Security.googleLogin(); App.render(); }
    catch (e) { $('#ge', root).textContent = e.message; }
  };
}

/* ===================== المؤشرات ===================== */
function aDash(main) {
  const all = Data.all(), live = Data.live();
  const apps = Store.list('applications');
  const views = Object.values(Store.get('stats/views') || {}).reduce((a, b) => a + Number(b || 0), 0);
  const clicks = Object.values(Store.get('stats/clicks') || {}).reduce((a, b) => a + Number(b || 0), 0);
  const soon = all.filter(t => t.expiresAt && t.expiresAt > Date.now() && t.expiresAt - Date.now() < 30 * 864e5);
  const rc = Data.regionCounts(), sc = Data.specCounts();
  const bars = (obj, name, max = 8) => {
    const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, max); const m = Math.max(1, ...rows.map(r => r[1]));
    return rows.length ? rows.map(([k, v]) => `<div class="bar"><span>${esc(name(k))}</span><div class="t"><span style="width:${v / m * 100}%"></span></div><b class="num">${v}</b></div>`).join('') : '<p class="muted small">لا بيانات بعد</p>';
  };
  const top = [...live].sort((a, b) => Data.views(b.id) - Data.views(a.id)).slice(0, 5);
  main.innerHTML = `
    <div class="dash-h"><h2>نظرة عامة</h2><span class="muted small">${fmtTs(Date.now())}</span></div>
    <div class="kpis">
      <div class="kpi dark"><i class="fa-solid fa-id-card"></i><b class="num" data-count="${live.length}">0</b><span>مدرب منشور</span></div>
      <div class="kpi"><i class="fa-solid fa-user-plus"></i><b class="num" data-count="${apps.filter(a => ['new', 'review', 'interview'].includes(a.status)).length}">0</b><span>طلب تسجيل قيد المعالجة</span></div>
      <div class="kpi"><i class="fa-solid fa-sack-dollar"></i><b class="num" data-count="${apps.filter(a => a.status === 'accepted').length}">0</b><span>بانتظار السداد</span></div>
      <div class="kpi"><i class="fa-solid fa-eye"></i><b class="num" data-count="${views}">0</b><span>مشاهدة للبطاقات</span></div>
      <div class="kpi"><i class="fa-solid fa-hand-pointer"></i><b class="num" data-count="${clicks}">0</b><span>نقرة تواصل</span></div>
      <div class="kpi"><i class="fa-solid fa-inbox"></i><b class="num" data-count="${Store.list('requests').length + Store.list('leads').length}">0</b><span>طلب من الجهات</span></div>
    </div>
    ${soon.length ? `<div class="banner warn"><i class="fa-solid fa-hourglass-half"></i><span><b class="num">${soon.length}</b> مدرب تنتهي مدة نشرهم خلال 30 يوماً: ${soon.slice(0, 5).map(t => esc(t.name)).join('، ')}</span></div>` : ''}
    <div class="grid2">
      <div class="pbox"><h3><i class="fa-solid fa-map-location-dot"></i>المدربون حسب المنطقة</h3><div class="bars">${bars(rc, regionName, 13)}</div></div>
      <div class="pbox"><h3><i class="fa-solid fa-layer-group"></i>أكثر التخصصات</h3><div class="bars">${bars(sc, specName, 10)}</div></div>
      <div class="pbox"><h3><i class="fa-solid fa-fire"></i>الأكثر مشاهدة</h3>${top.length ? top.map(t => `<div class="bar"><span>${esc(t.name)}</span><div class="t"><span style="width:${Data.views(t.id) / Math.max(1, Data.views(top[0].id)) * 100}%"></span></div><b class="num">${Data.views(t.id)}</b></div>`).join('') : '<p class="muted small">لا بيانات بعد</p>'}</div>
      <div class="pbox"><h3><i class="fa-solid fa-clock-rotate-left"></i>آخر النشاطات</h3><div class="log">${Store.list('adminLog').sort((a, b) => b.ts - a.ts).slice(0, 8).map(l => `<div><small>${ago(l.ts)}</small><span><b>${esc(l.action)}</b> ${esc(l.target)} <small>— ${esc(l.by?.name || '')}</small></span></div>`).join('') || '<p class="muted small">لا نشاط بعد</p>'}</div></div>
    </div>`;
  countUp(main);
}

/* ===================== طلبات التسجيل (لوحة كانبان) ===================== */
function aApps(main) {
  const apps = Store.list('applications').sort((a, b) => b.ts - a.ts);
  const cols = ['new', 'review', 'interview', 'accepted', 'rejected'];
  const q = main.dataset.q || '';
  const list = q ? apps.filter(a => normAr([a.name, a.phone, a.email, a.id, a.title].join(' ')).includes(normAr(q))) : apps;
  main.innerHTML = `
    <div class="dash-h"><h2>طلبات التسجيل</h2><div class="toolbar" style="margin:0"><input type="search" id="aq" placeholder="بحث بالاسم أو الجوال أو الرقم" value="${esc(q)}"><a class="btn sm" href="#/join" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i> نموذج التسجيل</a></div></div>
    <p class="muted small">اسحب البطاقة بين الأعمدة لتغيير الحالة، أو افتحها للتفاصيل والقبول والنشر. الطلبات المنشورة تنتقل إلى «المدربون».</p>
    <div class="board">${cols.map(c => {
      const items = list.filter(a => a.status === c);
      return `<div class="col" data-col="${c}"><h4><i class="fa-solid ${APP_STATUS[c].icon}"></i>${APP_STATUS[c].name}<span class="c num">${items.length}</span></h4>
        ${items.map(a => `<div class="appc" draggable="true" data-id="${esc(a.id)}">
          <div class="who">${a.photo ? `<img class="av" src="${esc(a.photo)}" alt="">` : `<span class="av">${initials(a.name)}</span>`}<div><b>${esc(a.name)}</b><small>${esc(regionName(a.region))} · ${ago(a.ts)}</small></div></div>
          <div class="tags">${Data.specs(a).slice(0, 3).map(s => `<span>${esc(specName(s))}</span>`).join('')}</div>
        </div>`).join('') || '<p class="muted small center">—</p>'}
      </div>`;
    }).join('')}</div>
    ${list.some(a => a.status === 'published') ? `<details style="margin-top:14px"><summary class="muted small">الطلبات المنشورة (${list.filter(a => a.status === 'published').length})</summary><div class="log">${list.filter(a => a.status === 'published').map(a => `<div><small>${fmtDate(a.decidedAt)}</small><span>${esc(a.name)} → <a href="#/t/${esc(a.trainerId)}">${esc(a.trainerId)}</a></span></div>`).join('')}</div></details>` : ''}`;
  $('#aq', main).oninput = debounce(e => { main.dataset.q = e.target.value; aApps(main); $('#aq', main).focus(); }, 250);
  let dragId = null;
  $$('.appc', main).forEach(c => {
    c.ondragstart = () => { dragId = c.dataset.id; c.classList.add('dragging'); };
    c.ondragend = () => c.classList.remove('dragging');
    c.onclick = () => appDetail(Store.get(`applications/${c.dataset.id}`));
  });
  $$('.col', main).forEach(col => {
    col.ondragover = e => { e.preventDefault(); col.classList.add('drop'); };
    col.ondragleave = () => col.classList.remove('drop');
    col.ondrop = e => { e.preventDefault(); col.classList.remove('drop'); if (dragId) setAppStatus(Store.get(`applications/${dragId}`), col.dataset.col); };
  });
}

function setAppStatus(a, status, note) {
  if (!a || a.status === status) return;
  Store.update(`applications/${a.id}`, { status, decidedAt: Date.now() });
  Store.update(`appStatus/${a.id}`, { status, ts: Date.now(), ...(note != null ? { note } : {}) });
  Security.log('تغيير حالة طلب', a.name, APP_STATUS[status].name);
}

function appDetail(a) {
  if (!a) return;
  const c = Data.content();
  const acceptMsg = `مرحباً ${a.name} 🌟\nيسعدنا إبلاغك بقبول طلب تسجيلك في منصة «مدرّبون سعوديّون» (رقم الطلب ${a.id}).\n\nرسوم التسجيل: ${c.join.fee} ريال — ${c.join.period}.\n${c.join.payment}${c.join.bank ? '\n\n' + c.join.bank : ''}\n\nبعد السداد تُنشر بطاقتك ويصلك رمز الدخول.`;
  const st = Store.get(`appStatus/${a.id}`) || {};
  const m = modal(`<h3><i class="fa-solid fa-user-plus"></i> طلب ${esc(a.name)} <span class="pill ${APP_STATUS[a.status]?.tone}">${APP_STATUS[a.status]?.name}</span></h3>
    <div class="detail-grid">
      <div>
        <dl class="dl">
          <dt>رقم الطلب</dt><dd class="num">${esc(a.id)}</dd><dt>التاريخ</dt><dd>${fmtTs(a.ts)}</dd>
          <dt>الجوال</dt><dd><a class="num" href="${esc(waLink(a.phone))}" target="_blank">${esc(a.phone)}</a></dd><dt>البريد</dt><dd><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></dd>
          <dt>المنطقة</dt><dd>${esc(regionName(a.region))} ${esc(a.city || '')}</dd><dt>الجنس</dt><dd>${a.gender === 'f' ? 'مدربة' : 'مدرب'}</dd>
          <dt>اللقب</dt><dd>${esc(a.title)}</dd><dt>التخصصات</dt><dd>${Data.specs(a).map(specName).join('، ')}</dd>
          <dt>البرامج</dt><dd>${esc(a.topics || '—')}</dd><dt>الخبرة</dt><dd><span class="num">${a.years || 0}</span> سنة · <span class="num">${a.hours || 0}</span> ساعة · <span class="num">${a.programs || 0}</span> برنامج</dd>
          <dt>TOT</dt><dd>${a.tot ? '✅ أقرّ بحضورها' : '❌'}</dd><dt>الشهادات</dt><dd>${nl2br(a.certs || '—')}</dd>
          <dt>المرفقات</dt><dd>${a.cvUrl ? `<a href="${esc(safeUrl(a.cvUrl))}" target="_blank" rel="noopener">فتح الرابط <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '—'}</dd>
          <dt>النبذة</dt><dd>${nl2br(a.bio)}</dd>
        </dl>
        ${field('ملاحظة تظهر للمتقدم في صفحة متابعة الطلب', `<textarea id="pn" maxlength="500" style="min-height:70px">${esc(st.note || '')}</textarea>`)}
        <div class="row" style="margin-top:8px">
          <select id="ns" style="width:auto">${Object.entries(APP_STATUS).filter(([k]) => k !== 'published').map(([k, v]) => opt(k, v.name, a.status)).join('')}</select>
          <button class="btn sm" id="sv">حفظ الحالة والملاحظة</button>
        </div>
      </div>
      <div>
        <div style="transform:scale(.8);transform-origin:top center;margin-bottom:-110px">${Card.full({ ...a, id: '__app', photoUrl: a.photo }, { preview: true })}</div>
        <div style="display:grid;gap:8px;margin-top:14px">
          ${a.status !== 'published' ? `<button class="btn gold" id="pub"><i class="fa-solid fa-certificate"></i> نشر البطاقة وإصدار رمز الدخول</button>` : ''}
          <a class="btn primary" target="_blank" rel="noopener" href="${esc(waLink(a.phone, acceptMsg))}" id="acc"><i class="fa-brands fa-whatsapp"></i> رسالة القبول وبيانات السداد</a>
          <a class="btn" href="mailto:${esc(a.email)}?subject=${encodeURIComponent('قبول طلب التسجيل — مدرّبون سعوديّون')}&body=${encodeURIComponent(acceptMsg)}"><i class="fa-solid fa-envelope"></i> إرسالها بالبريد</a>
          <button class="btn ghost" id="del" style="color:var(--bad)"><i class="fa-solid fa-trash"></i> حذف الطلب</button>
        </div>
      </div>
    </div>`, { wide: true });
  m.$('#sv').onclick = () => {
    const ns = m.$('#ns').value, note = m.$('#pn').value.trim();
    if (ns !== a.status) setAppStatus(a, ns, note); else Store.update(`appStatus/${a.id}`, { note, ts: Date.now() });
    toast('تم الحفظ'); m.close();
  };
  m.$('#acc').addEventListener('click', () => { if (['new', 'review', 'interview'].includes(a.status)) setAppStatus(a, 'accepted'); });
  m.$('#pub') && (m.$('#pub').onclick = async () => {
    if (!await confirmBox(`نشر بطاقة <b>${esc(a.name)}</b> الآن وإصدار رمز دخول له؟ (تأكد من استلام السداد)`, { ok: 'نشر' })) return;
    m.close();
    try { const { trainer, secret } = await Data.publishFromApplication(a); showSecret(trainer, secret, true); }
    catch (e) { toast(e.message, 'error'); }
  });
  m.$('#del').onclick = async () => {
    if (!await confirmBox('حذف هذا الطلب نهائياً؟', { ok: 'حذف', danger: true })) return;
    Store.remove(`applications/${a.id}`); Store.remove(`appStatus/${a.id}`); Security.log('حذف طلب', a.name); m.close();
  };
}

function showSecret(t, secret, isNew) {
  const msg = loginMessage(t, secret);
  const priv = Store.get(`private/${t.id}`) || {};
  const phone = priv.phone || t.links?.whatsapp;
  const m = modal(`<h3><i class="fa-solid fa-key"></i> ${isNew ? 'تم النشر 🎉' : 'رمز الدخول'}</h3>
    <p class="muted">رمز دخول <b>${esc(t.name)}</b>. أرسله له الآن — لن يظهر المدرب في النتائج دون نشر، ويستطيع تعديل بطاقته بهذا الرمز.</p>
    <div class="secret"><span>${esc(secret)}</span><button class="btn sm glass" id="cs"><i class="fa-solid fa-copy"></i></button></div>
    <div class="share-grid" style="margin-top:14px">
      ${phone ? `<a class="sh wa" target="_blank" rel="noopener" href="${esc(waLink(phone, msg))}"><i class="fa-brands fa-whatsapp"></i>إرسال واتساب</a>` : ''}
      ${priv.email ? `<a class="sh li" href="mailto:${esc(priv.email)}?subject=${encodeURIComponent('بيانات الدخول — مدرّبون سعوديّون')}&body=${encodeURIComponent(msg)}"><i class="fa-solid fa-envelope"></i>إرسال بريد</a>` : ''}
      <button class="sh cp" id="cm"><i class="fa-solid fa-copy"></i>نسخ الرسالة</button>
      <button class="sh im" id="ci"><i class="fa-solid fa-image"></i>صورة البطاقة</button>
    </div>`);
  m.$('#cs').onclick = () => copyText(secret, 'تم نسخ الرمز');
  m.$('#cm').onclick = () => copyText(msg, 'تم نسخ الرسالة');
  m.$('#ci').onclick = () => Card.save(t, 'post');
}

/* ===================== المدربون ===================== */
function aTrainers(main) {
  const f = JSON.parse(main.dataset.f || '{}');
  let list = Data.all();
  if (f.q) list = Data.search(list, { q: f.q });
  if (f.region) list = list.filter(t => t.region === f.region);
  if (f.st === 'live') list = list.filter(Data.isLive); else if (f.st === 'hidden') list = list.filter(t => t.status !== 'active'); else if (f.st === 'expired') list = list.filter(Data.expired); else if (f.st === 'nocode') list = list.filter(t => !Store.get(`secrets/codes/${t.id}`));
  main.innerHTML = `
    <div class="dash-h"><h2>المدربون <span class="muted num" style="font-size:1rem">(${list.length})</span></h2><div class="row"><button class="btn sm" id="imp"><i class="fa-solid fa-file-import"></i> استيراد</button><button class="btn sm" id="exp"><i class="fa-solid fa-file-csv"></i> تصدير CSV</button><button class="btn primary sm" id="add"><i class="fa-solid fa-plus"></i> إضافة مدرب</button></div></div>
    <div class="toolbar">
      <input type="search" id="tq" placeholder="بحث..." value="${esc(f.q || '')}">
      <select id="tr"><option value="">كل المناطق</option>${REGIONS.map(r => opt(r.k, r.name, f.region)).join('')}</select>
      <select id="ts"><option value="">كل الحالات</option>${opt('live', 'منشور', f.st)}${opt('hidden', 'مخفي', f.st)}${opt('expired', 'منتهي', f.st)}${opt('nocode', 'بلا رمز دخول', f.st)}</select>
    </div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المدرب</th><th>المنطقة</th><th>الحالة</th><th>المشاهدات</th><th>نهاية النشر</th><th></th></tr></thead><tbody>
      ${list.map(t => `<tr>
        <td><div class="who">${Card.avatar(t, 'av')}<div><b>${esc(t.name)} ${t.featured ? '<i class="fa-solid fa-star" style="color:var(--gold)"></i>' : ''}</b><small class="num">${esc(t.code)}</small> <small>· ${esc(t.title || '')}</small></div></div></td>
        <td>${esc(regionName(t.region))}</td>
        <td>${Data.isLive(t) ? '<span class="pill ok">منشور</span>' : Data.expired(t) ? '<span class="pill warn">منتهي</span>' : '<span class="pill gray">مخفي</span>'} ${Store.get(`secrets/codes/${t.id}`) ? '' : '<span class="pill bad" title="لم يُصدر رمز دخول">بلا رمز</span>'}</td>
        <td class="num">${Data.views(t.id)}</td>
        <td class="num">${fmtDate(t.expiresAt)}</td>
        <td><div class="acts">
          <button class="btn sm icon" data-a="edit" data-id="${esc(t.id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="btn sm icon" data-a="code" data-id="${esc(t.id)}" title="رمز الدخول"><i class="fa-solid fa-key"></i></button>
          <button class="btn sm icon" data-a="feat" data-id="${esc(t.id)}" title="تمييز"><i class="fa-${t.featured ? 'solid' : 'regular'} fa-star"></i></button>
          <button class="btn sm icon" data-a="vis" data-id="${esc(t.id)}" title="${t.status === 'active' ? 'إخفاء' : 'إظهار'}"><i class="fa-solid fa-${t.status === 'active' ? 'eye-slash' : 'eye'}"></i></button>
          <a class="btn sm icon" href="#/t/${esc(encodeURIComponent(t.slug || t.id))}" title="عرض"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div></td>
      </tr>`).join('') || '<tr><td colspan="6" class="empty">لا يوجد مدربون مطابقون</td></tr>'}
    </tbody></table></div>`;
  const setF = (k, v) => { main.dataset.f = JSON.stringify({ ...f, [k]: v }); aTrainers(main); };
  $('#tq', main).oninput = debounce(e => { setF('q', e.target.value); $('#tq', main).focus(); const i = $('#tq', main); i.setSelectionRange(i.value.length, i.value.length); }, 300);
  $('#tr', main).onchange = e => setF('region', e.target.value);
  $('#ts', main).onchange = e => setF('st', e.target.value);
  $('#add', main).onclick = () => trainerEditor(null);
  $('#imp', main).onclick = importDialog;
  $('#exp', main).onclick = exportCSV;
  $$('[data-a]', main).forEach(b => b.onclick = async () => {
    const t = Store.get(`trainers/${b.dataset.id}`);
    if (b.dataset.a === 'edit') trainerEditor(t);
    if (b.dataset.a === 'feat') { Store.update(`trainers/${t.id}`, { featured: !t.featured }); Security.log(t.featured ? 'إلغاء تمييز' : 'تمييز مدرب', t.name); }
    if (b.dataset.a === 'vis') { Store.update(`trainers/${t.id}`, { status: t.status === 'active' ? 'hidden' : 'active' }); Security.log(t.status === 'active' ? 'إخفاء مدرب' : 'إظهار مدرب', t.name); }
    if (b.dataset.a === 'code') {
      const cur = Store.get(`secrets/codes/${t.id}`);
      if (cur && !await confirmBox(`الرمز الحالي: <b class="num">${esc(cur)}</b><br>عرض رسالة الدخول بهذا الرمز، أو إصدار رمز جديد؟`, { ok: 'عرض الرسالة' })) {
        if (!await confirmBox('إصدار رمز جديد؟ سيتوقف الرمز القديم عن العمل.', { ok: 'إصدار رمز جديد', danger: true })) return;
        try { showSecret(t, await Security.issueCode(t)); Security.log('تجديد رمز دخول', t.name); } catch (e) { toast(e.message, 'error'); }
        return;
      }
      if (cur) { showSecret(t, cur); return; }
      try { showSecret(t, await Security.issueCode(t), false); Security.log('إصدار رمز دخول', t.name); } catch (e) { toast(e.message, 'error'); }
    }
  });
}

function trainerEditor(t) {
  const isNew = !t;
  t = t || { status: 'active', theme: 'emerald', langs: 'العربية' };
  const priv = t.id ? Store.get(`private/${t.id}`) || {} : {};
  let photo = '';
  const F = profileFields({ ...t, ...priv, _photo: t.id ? Data.photo(t) : '' }, { withPrivate: true });
  const m = modal(`<h3><i class="fa-solid fa-id-card"></i> ${isNew ? 'إضافة مدرب' : 'تعديل ' + esc(t.name)}</h3>
    <div class="editor"><form id="te" autocomplete="off">
      ${F.basic}${F.spec}${F.exp}${F.media}
      ${field('رابط صورة خارجي (اختياري بدل الرفع)', `<input type="url" name="photoUrl" dir="ltr" maxlength="300" value="${esc(t.photoUrl)}">`)}
      <div class="grid2">
        ${field('الحالة', `<select name="status">${opt('active', 'منشور', t.status)}${opt('hidden', 'مخفي', t.status)}</select>`)}
        ${field('نهاية النشر', `<input type="text" name="exp" dir="ltr" value="${t.expiresAt ? new Date(t.expiresAt).toISOString().slice(0, 10) : new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10)}" placeholder="YYYY-MM-DD">`, 'اتركه فارغاً لنشر دون انتهاء')}
      </div>
      ${field('رسالة للمدرب تظهر في لوحته', `<textarea name="note" maxlength="600" style="min-height:70px">${esc(Store.get(`notes/${t.id}`)?.text || '')}</textarea>`)}
      <div class="row between"><div>${isNew ? '' : '<button type="button" class="btn ghost" id="dl" style="color:var(--bad)"><i class="fa-solid fa-trash"></i> حذف المدرب</button> <button type="button" class="btn ghost" id="ext"><i class="fa-solid fa-calendar-plus"></i> تمديد سنة</button>'}</div><button class="btn primary lg">حفظ</button></div>
    </form><div class="preview" id="pvw"></div></div>`, { wide: true });
  const form = m.$('#te');
  $$('[name=phone],[name=email]', form).forEach(i => { i.required = false; });
  const preview = () => previewCard(m.$('#pvw'), { ...readProfile(form), code: t.code }, photo || (t.id ? Data.photo(t) : '') || driveImg(form.photoUrl.value));
  wireProfileForm(form, { onPhoto: u => { photo = u; }, preview });
  preview();
  m.$('#ext') && (m.$('#ext').onclick = () => { const base = Math.max(Date.now(), t.expiresAt || 0); form.exp.value = new Date(base + 365 * 864e5).toISOString().slice(0, 10); toast('اضغط «حفظ» لاعتماد التمديد'); });
  m.$('#dl') && (m.$('#dl').onclick = async () => {
    if (!await confirmBox(`حذف <b>${esc(t.name)}</b> نهائياً مع حساب دخوله؟`, { ok: 'حذف', danger: true })) return;
    await Security.deleteTrainerAccount(t);
    ['trainers', 'photos', 'private', 'notes', 'secrets/codes', 'stats/views', 'stats/clicks'].forEach(p => Store.remove(`${p}/${t.id}`));
    Security.log('حذف مدرب', t.name); m.close();
  });
  form.onsubmit = async e => {
    e.preventDefault();
    const d = readProfile(form);
    if (!d.name || !d.region) { toast('الاسم والمنطقة مطلوبان', 'error'); return; }
    const rec = { ...Data.pick(d, Data.PUBLIC_FIELDS), status: d.status, updatedAt: Date.now() };
    rec.expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(d.exp) ? new Date(d.exp + 'T23:59:59').getTime() : null;
    let id = t.id;
    if (isNew) {
      const code = await Data.nextCode();
      id = code.toLowerCase();
      Object.assign(rec, { id, code, publishedAt: Date.now(), featured: false });
      rec.slug = Data.makeSlug(rec);
      Store.set(`trainers/${id}`, rec);
    } else Store.update(`trainers/${id}`, rec);
    Store.set(`private/${id}`, { phone: d.phone ? phoneDigits(d.phone) : '', email: d.email || '' });
    if (photo) Store.set(`photos/${id}`, photo);
    Store.set(`notes/${id}`, d.note ? { text: d.note, ts: Date.now() } : null);
    Security.log(isNew ? 'إضافة مدرب' : 'تعديل مدرب', d.name);
    m.close(); toast('تم الحفظ');
    if (isNew && await confirmBox('إصدار رمز دخول للمدرب الآن؟', { ok: 'إصدار' })) {
      const nt = Store.get(`trainers/${id}`);
      try { showSecret(nt, await Security.issueCode(nt), true); } catch (err) { toast(err.message, 'error'); }
    }
  };
}

/* استيراد المدربين من CSV (مثل تصدير Google Sheets للموقع القديم) أو JSON */
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
const COLS = {
  name: ['الاسم', 'اسم المدرب', 'name'], title: ['اللقب', 'المسمى', 'التعريف', 'title'], region: ['المنطقة', 'region'], city: ['المدينة', 'city'],
  phone: ['الجوال', 'رقم الجوال', 'phone', 'mobile'], email: ['البريد', 'البريد الإلكتروني', 'email'], whatsapp: ['واتساب', 'whatsapp'],
  specs: ['التخصص', 'التخصصات', 'specs', 'specialty'], topics: ['البرامج', 'مجالات الخبرة', 'الخبرات', 'topics'], bio: ['النبذة', 'نبذة', 'bio'],
  years: ['سنوات الخبرة', 'years'], hours: ['الساعات', 'الساعات التدريبية', 'hours'], photo: ['الصورة', 'رابط الصورة', 'photo'], gender: ['الجنس', 'gender'],
  linkedin: ['لينكدإن', 'linkedin'], x: ['تويتر', 'إكس', 'x', 'twitter'], instagram: ['انستقرام', 'إنستقرام', 'instagram'], certs: ['الشهادات', 'certs']
};
function matchRegion(v) { const n = normAr(v); return REGIONS.find(r => n && (normAr(r.name).includes(n) || n.includes(normAr(r.name)) || r.old.toLowerCase() === n || r.k === n))?.k || ''; }
function matchSpecs(v) {
  return splitList(v).map(x => { const n = normAr(x); return SPECIALTIES.find(s => normAr(s.name).includes(n) || n.includes(normAr(s.name).split(' ')[0]))?.k; }).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, MAX_SPECS);
}
function importDialog() {
  const m = modal(`<h3><i class="fa-solid fa-file-import"></i> استيراد المدربين</h3>
    <p class="muted small">ارفع ملف CSV (مثلاً من Google Sheets: ملف ← تنزيل ← CSV) يحتوي أعمدة مثل: الاسم، اللقب، المنطقة، المدينة، الجوال، البريد، واتساب، التخصصات، البرامج، النبذة، سنوات الخبرة، رابط الصورة. تُطابق المناطق والتخصصات تلقائياً.</p>
    <input type="file" id="f" accept=".csv,.json,text/csv,application/json">
    <div id="pv" style="margin-top:12px"></div>`, { wide: true });
  m.$('#f').onchange = async () => {
    const file = m.$('#f').files[0]; if (!file) return;
    const text = await file.text();
    let recs = [];
    if (/\.json$/i.test(file.name)) { try { const j = JSON.parse(text); recs = Array.isArray(j) ? j : Object.values(j.trainers || j); } catch { toast('ملف JSON غير صالح', 'error'); return; } }
    else {
      const rows = parseCSV(text.replace(/^﻿/, '')); const head = rows.shift() || [];
      const idx = {}; Object.entries(COLS).forEach(([k, names]) => { idx[k] = head.findIndex(h => names.some(n => normAr(h).includes(normAr(n)))); });
      recs = rows.map(r => { const o = {}; Object.keys(COLS).forEach(k => { if (idx[k] >= 0) o[k] = (r[idx[k]] || '').trim(); }); return o; });
    }
    recs = recs.filter(r => r.name).map(r => ({
      name: r.name, title: r.title || '', region: matchRegion(r.region) || (REGIONS.some(x => x.k === r.region) ? r.region : ''), city: r.city || '',
      gender: /ة$|انثى|أنثى|f/i.test(r.gender || '') ? 'f' : r.gender ? 'm' : '', specs: Array.isArray(r.specs) ? r.specs : matchSpecs(r.specs || ''),
      topics: r.topics || '', bio: r.bio || '', certs: r.certs || '', years: Number(toEnDigits(r.years)) || 0, hours: Number(toEnDigits(r.hours)) || 0,
      photoUrl: r.photo || r.photoUrl || '', modes: r.modes || ['onsite'], theme: r.theme || 'emerald', langs: 'العربية',
      links: { ...(r.links || {}), ...(r.whatsapp ? { whatsapp: r.whatsapp } : {}), ...(r.linkedin ? { linkedin: r.linkedin } : {}), ...(r.x ? { x: r.x } : {}), ...(r.instagram ? { instagram: r.instagram } : {}) },
      _phone: r.phone || '', _email: r.email || ''
    }));
    m.$('#pv').innerHTML = `<p><b class="num">${recs.length}</b> مدرب جاهز للاستيراد ${recs.filter(r => !r.region).length ? `<span class="pill warn">${recs.filter(r => !r.region).length} بلا منطقة مطابقة</span>` : ''}</p>
      <div class="tbl-wrap" style="max-height:300px"><table class="tbl"><thead><tr><th>الاسم</th><th>المنطقة</th><th>التخصصات</th></tr></thead><tbody>${recs.slice(0, 50).map(r => `<tr><td>${esc(r.name)}</td><td>${esc(regionName(r.region) || '—')}</td><td>${r.specs.map(specName).join('، ') || '—'}</td></tr>`).join('')}</tbody></table></div>
      <div class="row end" style="margin-top:12px"><button class="btn primary" id="go">استيراد ونشر</button></div>`;
    m.$('#go').onclick = async () => {
      m.$('#go').disabled = true;
      for (const r of recs) {
        const code = await Data.nextCode(); const id = code.toLowerCase();
        const { _phone, _email, ...pub } = r;
        const rec = { ...pub, id, code, status: 'active', featured: false, publishedAt: Date.now(), expiresAt: Date.now() + 365 * 864e5, updatedAt: Date.now() };
        rec.slug = Data.makeSlug(rec);
        Store.set(`trainers/${id}`, rec);
        Store.set(`private/${id}`, { phone: _phone ? phoneDigits(_phone) : '', email: _email });
      }
      Security.log('استيراد مدربين', `${recs.length} مدرب`, file.name);
      toast(`تم استيراد ${recs.length} مدرب — أصدر رموز الدخول من فلتر «بلا رمز دخول»`); m.close();
    };
  };
}
function exportCSV() {
  const cols = ['code', 'name', 'title', 'region', 'city', 'phone', 'email', 'specs', 'topics', 'years', 'hours', 'status', 'expires', 'views', 'url'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = Data.all().map(t => { const p = Store.get(`private/${t.id}`) || {}; return [t.code, t.name, t.title, regionName(t.region), t.city, p.phone, p.email, Data.specs(t).map(specName).join('، '), t.topics, t.years, t.hours, Data.isLive(t) ? 'منشور' : 'مخفي', fmtDate(t.expiresAt), Data.views(t.id), profileUrl(t)].map(q).join(','); });
  download(`sauditrainers-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + [cols.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8');
}

/* ===================== طلبات الجهات ===================== */
function aRequests(main) {
  const reqs = Store.list('requests').map(r => ({ ...r, kind: 'req' }));
  const leads = Store.list('leads').map(r => ({ ...r, kind: 'lead' }));
  const all = [...reqs, ...leads].sort((a, b) => b.ts - a.ts);
  main.innerHTML = `<div class="dash-h"><h2>طلبات الجهات التدريبية</h2><span class="muted small">«اطلب مدرباً» + الطلبات المرسلة لمدرب محدد</span></div>
    ${all.length ? all.map(r => `<div class="lead">
      <span class="ic"><i class="fa-solid ${r.kind === 'req' ? 'fa-wand-magic-sparkles' : 'fa-paper-plane'}"></i></span>
      <div><b>${esc(r.org)}</b> <span class="pill ${r.status === 'new' ? 'gold' : 'gray'}">${r.status === 'new' ? 'جديد' : 'تمت المتابعة'}</span> <span class="pill info">${r.kind === 'req' ? 'اطلب مدرباً' : 'لمدرب: ' + esc(r.trainerName || r.trainerId)}</span><br>
        <small class="muted">${esc(r.person)} · <span class="num">${esc(r.phone)}</span> ${r.email ? '· ' + esc(r.email) : ''} · ${ago(r.ts)}</small>
        <p><b>الموضوع:</b> ${esc(r.topic)}${r.spec ? ` · <b>التخصص:</b> ${esc(specName(r.spec))}` : ''}${r.region ? ` · <b>المنطقة:</b> ${esc(regionName(r.region))}` : ''}${r.size ? ` · <b class="num">${r.size}</b> متدرب` : ''}${r.when ? ` · <b>الموعد:</b> ${esc(r.when)}` : ''}</p>
        ${r.msg ? `<p>${nl2br(r.msg)}</p>` : ''}
        ${r.matches?.length ? `<p class="small"><b>الترشيحات الآلية:</b> ${r.matches.map(id => Store.get(`trainers/${id}`)).filter(Boolean).map(t => `<a href="#/t/${esc(t.slug || t.id)}" target="_blank">${esc(t.name)}</a>`).join('، ')}</p>` : ''}
      </div>
      <div class="acts" style="flex-direction:column">
        <a class="btn sm primary" target="_blank" rel="noopener" href="${esc(waLink(r.phone))}"><i class="fa-brands fa-whatsapp"></i></a>
        <button class="btn sm" data-t="${r.kind}" data-id="${esc(r.id)}" title="تبديل الحالة"><i class="fa-solid fa-check"></i></button>
        <button class="btn sm ghost" data-del="${r.kind}" data-id="${esc(r.id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
      </div></div>`).join('') : '<div class="empty"><i class="fa-solid fa-inbox"></i><h3>لا توجد طلبات بعد</h3></div>'}`;
  const path = k => (k === 'req' ? 'requests' : 'leads');
  $$('[data-t]', main).forEach(b => b.onclick = () => { const p = `${path(b.dataset.t)}/${b.dataset.id}`; Store.update(p, { status: Store.get(p)?.status === 'new' ? 'done' : 'new' }); });
  $$('[data-del]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف الطلب؟', { ok: 'حذف', danger: true })) Store.remove(`${path(b.dataset.del)}/${b.dataset.id}`); });
}

/* ===================== القاعات ===================== */
function aHalls(main) {
  const reqs = Store.list('hallReqs').sort((a, b) => b.ts - a.ts);
  const halls = Store.list('halls');
  main.innerHTML = `<div class="dash-h"><h2>قاعات التدريب</h2><button class="btn primary sm" id="nh"><i class="fa-solid fa-plus"></i> إضافة قاعة معروضة</button></div>
    <h3>القاعات المعروضة في الموقع</h3>
    <div class="tbl-wrap" style="margin-bottom:24px"><table class="tbl"><thead><tr><th>القاعة</th><th>المنطقة</th><th>السعة</th><th></th></tr></thead><tbody>
      ${halls.map(h => `<tr><td><b>${esc(h.name)}</b><br><small class="muted">${esc(h.contact || '')}</small></td><td>${esc(regionName(h.region))} ${esc(h.city || '')}</td><td class="num">${esc(h.capacity || '')}</td><td><div class="acts"><button class="btn sm icon" data-eh="${esc(h.id)}"><i class="fa-solid fa-pen"></i></button><button class="btn sm icon" data-dh="${esc(h.id)}"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('') || '<tr><td colspan="4" class="muted center">لا توجد قاعات معروضة</td></tr>'}
    </tbody></table></div>
    <h3>الطلبات الواردة</h3>
    ${reqs.map(r => `<div class="lead"><span class="ic"><i class="fa-solid ${r.type === 'list' ? 'fa-building' : 'fa-calendar-check'}"></i></span>
      <div><b>${esc(r.name)}</b> <span class="pill ${r.type === 'list' ? 'info' : 'gold'}">${r.type === 'list' ? 'عرض قاعة' : 'طلب قاعة'}</span> <span class="pill ${r.status === 'new' ? 'warn' : 'gray'}">${r.status === 'new' ? 'جديد' : 'تمت المتابعة'}</span><br>
      <small class="muted"><span class="num">${esc(r.phone)}</span> · ${esc(regionName(r.region))} ${esc(r.city || '')} · ${ago(r.ts)}</small>
      <p>${r.capacity ? `<b class="num">${r.capacity}</b> مقعد/متدرب · ` : ''}${esc(r.when || '')}</p>${r.desc ? `<p>${nl2br(r.desc)}</p>` : ''}</div>
      <div class="acts" style="flex-direction:column"><a class="btn sm primary" target="_blank" rel="noopener" href="${esc(waLink(r.phone))}"><i class="fa-brands fa-whatsapp"></i></a>
      ${r.type === 'list' ? `<button class="btn sm" data-ph="${esc(r.id)}" title="نشر كقاعة معروضة"><i class="fa-solid fa-upload"></i></button>` : ''}
      <button class="btn sm" data-sh="${esc(r.id)}"><i class="fa-solid fa-check"></i></button><button class="btn sm ghost" data-xh="${esc(r.id)}"><i class="fa-solid fa-trash"></i></button></div></div>`).join('') || '<p class="muted">لا توجد طلبات</p>'}`;
  const edit = h => {
    h = h || {};
    const m = modal(`<h3><i class="fa-solid fa-building-columns"></i> قاعة تدريب</h3><form id="hf">
      ${field('الاسم *', `<input type="text" name="name" required value="${esc(h.name)}">`)}
      <div class="grid2">${field('المنطقة', `<select name="region">${REGIONS.map(r => opt(r.k, r.name, h.region)).join('')}</select>`)}${field('المدينة', `<input type="text" name="city" value="${esc(h.city)}">`)}${field('السعة', `<input type="number" name="capacity" value="${esc(h.capacity)}">`)}${field('التواصل', `<input type="text" name="contact" value="${esc(h.contact)}">`)}</div>
      ${field('الوصف', `<textarea name="desc">${esc(h.desc)}</textarea>`)}<button class="btn primary">حفظ</button></form>`);
    m.$('#hf').onsubmit = e => { e.preventDefault(); const d = formData(e.target); d.capacity = Number(d.capacity) || 0; if (h.id) Store.update(`halls/${h.id}`, d); else Store.push('halls', { ...d, active: true }); m.close(); };
  };
  $('#nh', main).onclick = () => edit();
  $$('[data-eh]', main).forEach(b => b.onclick = () => edit(Store.get(`halls/${b.dataset.eh}`)));
  $$('[data-dh]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف القاعة من الموقع؟', { danger: true, ok: 'حذف' })) Store.remove(`halls/${b.dataset.dh}`); });
  $$('[data-ph]', main).forEach(b => b.onclick = () => { const r = Store.get(`hallReqs/${b.dataset.ph}`); edit({ name: r.name, region: r.region, city: r.city, capacity: r.capacity, desc: r.desc, contact: r.phone }); });
  $$('[data-sh]', main).forEach(b => b.onclick = () => { const p = `hallReqs/${b.dataset.sh}`; Store.update(p, { status: Store.get(p).status === 'new' ? 'done' : 'new' }); });
  $$('[data-xh]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف الطلب؟', { danger: true, ok: 'حذف' })) Store.remove(`hallReqs/${b.dataset.xh}`); });
}

/* ===================== المحتوى ===================== */
function aContent(main) {
  const c = Data.content();
  const sec = (k, title, fields) => `<div class="pbox"><h3><i class="fa-solid fa-pen"></i>${title}</h3><div style="display:grid;gap:12px">${fields.map(([f, l, type, hint]) => field(l, type === 'area' ? `<textarea data-k="${k}.${f}">${esc(c[k][f])}</textarea>` : `<input type="${type || 'text'}" data-k="${k}.${f}" value="${esc(c[k][f])}">`, hint || '')).join('')}</div></div>`;
  main.innerHTML = `<div class="dash-h"><h2>محتوى الموقع</h2><button class="btn primary" id="sv"><i class="fa-solid fa-floppy-disk"></i> حفظ كل التغييرات</button></div>
    ${sec('hero', 'الواجهة الرئيسية', [['kicker', 'الشارة العلوية'], ['title', 'العنوان'], ['titleAccent', 'العنوان الذهبي'], ['words', 'الكلمات المتبدلة', 'text', 'افصل بينها بفاصلة'], ['sub', 'الوصف', 'area']])}
    ${sec('join', 'التسجيل والرسوم', [['fee', 'الرسوم (ريال)', 'number'], ['feeNote', 'وصف الرسوم'], ['period', 'مدة النشر'], ['requirements', 'المتطلبات', 'area', 'كل متطلب في سطر'], ['benefits', 'المزايا', 'area', 'كل ميزة في سطر'], ['payment', 'تعليمات السداد', 'area'], ['bank', 'بيانات الحساب البنكي (تُرسل في رسالة القبول فقط)', 'area']])}
    ${sec('about', 'عن المنصة', [['intro', 'التعريف', 'area'], ['problem', 'المشكلة', 'area'], ['solution', 'الحل', 'area'], ['vision', 'الرؤية', 'area'], ['registered', 'سطر التسجيل الرسمي']])}
    ${sec('halls', 'القاعات', [['intro', 'النص التعريفي', 'area']])}
    ${sec('contact', 'التواصل', [['email', 'البريد', 'email'], ['whatsapp', 'واتساب'], ['instagram', 'إنستقرام', 'url'], ['x', 'إكس', 'url'], ['linkedin', 'لينكدإن', 'url']])}
    <div class="pbox"><h3><i class="fa-solid fa-circle-question"></i>الأسئلة الشائعة</h3><div id="fq" style="display:grid;gap:10px">${c.faq.map(f => `<div class="grid2 fq"><input type="text" value="${esc(f.q)}" placeholder="السؤال"><textarea style="min-height:60px" placeholder="الجواب">${esc(f.a)}</textarea></div>`).join('')}</div><button class="btn sm" id="af" style="margin-top:10px"><i class="fa-solid fa-plus"></i> سؤال</button></div>`;
  $('#af', main).onclick = () => $('#fq', main).insertAdjacentHTML('beforeend', '<div class="grid2 fq"><input type="text" placeholder="السؤال"><textarea style="min-height:60px" placeholder="الجواب"></textarea></div>');
  $('#sv', main).onclick = () => {
    const out = {};
    $$('[data-k]', main).forEach(el => { const [k, f] = el.dataset.k.split('.'); (out[k] = out[k] || {})[f] = el.type === 'number' ? Number(el.value) || 0 : el.value.trim(); });
    out.faq = $$('.fq', main).map(r => ({ q: $('input', r).value.trim(), a: $('textarea', r).value.trim() })).filter(f => f.q);
    Object.entries(out).forEach(([k, v]) => Store.set(`content/${k}`, v));
    Security.log('تعديل المحتوى'); toast('تم حفظ المحتوى');
  };
}

/* ===================== المشرفون ===================== */
function aAdmins(main) {
  const owner = Security.isOwner();
  const admins = Object.entries(Store.get('admins') || {});
  const invites = Object.entries(Store.get('adminInvites') || {});
  main.innerHTML = `<div class="dash-h"><h2>المشرفون</h2></div>
    <div class="banner info"><i class="fa-brands fa-google"></i><span>الدخول للإدارة بحساب Google فقط. الحسابات الرئيسية: ${(window.ST_CONFIG.ownerEmails || []).map(e => `<b>${esc(e)}</b>`).join('، ')}</span></div>
    <div class="tbl-wrap" style="margin-bottom:20px"><table class="tbl"><thead><tr><th>المشرف</th><th>أُضيف</th><th></th></tr></thead><tbody>
      ${admins.map(([uid, a]) => `<tr><td><b>${esc(a.name || a.email)}</b><br><small class="muted">${esc(a.email)}</small> ${a.owner ? '<span class="pill gold">رئيسي</span>' : ''}</td><td>${fmtDate(a.addedAt)}</td><td><div class="acts">${owner && !a.owner ? `<button class="btn sm ghost" data-rm="${esc(uid)}"><i class="fa-solid fa-user-minus"></i></button>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="3" class="muted center">—</td></tr>'}
      ${invites.map(([k, i]) => `<tr><td><b>${esc(i.name || i.email)}</b><br><small class="muted">${esc(i.email)}</small> <span class="pill warn">دعوة معلّقة</span></td><td>${fmtDate(i.invitedAt)}</td><td><div class="acts">${owner ? `<button class="btn sm ghost" data-ci="${esc(k)}"><i class="fa-solid fa-xmark"></i></button>` : ''}</div></td></tr>`).join('')}
    </tbody></table></div>
    ${owner ? `<div class="pbox"><h3><i class="fa-solid fa-user-plus"></i>دعوة مشرف بحساب Google</h3><form id="inv" class="grid3"><input type="email" name="email" required placeholder="example@gmail.com" dir="ltr"><input type="text" name="name" placeholder="الاسم"><button class="btn primary">إرسال الدعوة</button></form><p class="small muted">يدخل المدعو من صفحة الإدارة بزر «الدخول بحساب Google» فتُفعَّل الدعوة تلقائياً.</p></div>` : '<p class="muted">إدارة المشرفين متاحة للحسابات الرئيسية فقط.</p>'}`;
  $('#inv', main) && ($('#inv', main).onsubmit = e => { e.preventDefault(); const d = formData(e.target); if (!validEmail(d.email)) { toast('بريد غير صحيح', 'error'); return; } Security.inviteAdmin(d.email, d.name); toast('تم إرسال الدعوة'); });
  $$('[data-rm]', main).forEach(b => b.onclick = async () => { if (await confirmBox('إزالة صلاحية هذا المشرف؟', { danger: true, ok: 'إزالة' })) { Security.log('إزالة مشرف', Store.get(`admins/${b.dataset.rm}`)?.email); Store.remove(`admins/${b.dataset.rm}`); } });
  $$('[data-ci]', main).forEach(b => b.onclick = () => Store.remove(`adminInvites/${b.dataset.ci}`));
}

/* ===================== البيانات والسجل ===================== */
function aBackup(main) {
  const logs = Store.list('adminLog').sort((a, b) => b.ts - a.ts).slice(0, 200);
  main.innerHTML = `<div class="dash-h"><h2>البيانات والسجل</h2></div>
    <div class="grid2">
      <div class="pbox"><h3><i class="fa-solid fa-download"></i>نسخة احتياطية</h3><p class="muted small">ملف JSON بكل بيانات المنصة (دون رموز الدخول). يُنصح بأخذ نسخة أسبوعياً.</p><button class="btn primary" id="bk">تنزيل نسخة</button></div>
      <div class="pbox"><h3><i class="fa-solid fa-upload"></i>استرجاع نسخة</h3><p class="muted small">يستبدل البيانات الحالية بمحتوى الملف (تُنزَّل نسخة من الحالية أولاً للاحتياط).</p><input type="file" id="rs" accept=".json"></div>
    </div>
    <div class="pbox"><h3><i class="fa-solid fa-flask"></i>بيانات تجريبية للمعاينة</h3><p class="muted small">مدربون بأسماء افتراضية (غير حقيقية) لمعاينة التصميم قبل نقل البيانات الفعلية. تُحذف بضغطة واحدة.</p>
      <div class="row"><button class="btn" id="dm"><i class="fa-solid fa-wand-magic-sparkles"></i> إضافة بيانات تجريبية</button><button class="btn ghost" id="dx" style="color:var(--bad)"><i class="fa-solid fa-trash"></i> حذف التجريبية (<span class="num">${Data.all().filter(t => t.demo).length}</span>)</button></div></div>
    <div class="pbox"><h3><i class="fa-solid fa-clock-rotate-left"></i>سجل النشاط</h3><div class="log">${logs.map(l => `<div><small>${fmtTs(l.ts)}</small><span><b>${esc(l.action)}</b> ${esc(l.target)} ${l.details ? `<small class="muted">(${esc(l.details)})</small>` : ''} <small>— ${esc(l.by?.name || l.by?.email || '')}</small></span></div>`).join('') || '<p class="muted small">لا نشاط بعد</p>'}</div></div>`;
  const backup = (name = 'backup') => { const d = Store.dump(); delete d.secrets; download(`sauditrainers-${name}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(d, null, 1), 'application/json'); };
  $('#bk', main).onclick = () => { backup(); Store.set('meta/lastBackup', Date.now()); };
  $('#dm', main).onclick = async () => { await seedDemo(); toast('تمت إضافة البيانات التجريبية'); };
  $('#dx', main).onclick = async () => {
    const demo = Data.all().filter(t => t.demo);
    if (!demo.length || !await confirmBox(`حذف ${demo.length} مدرب تجريبي؟`, { danger: true, ok: 'حذف' })) return;
    for (const t of demo) { await Security.deleteTrainerAccount(t); ['trainers', 'photos', 'private', 'notes', 'secrets/codes', 'stats/views', 'stats/clicks'].forEach(p => Store.remove(`${p}/${t.id}`)); }
    toast('تم الحذف');
  };
  $('#rs', main).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    let d; try { d = JSON.parse(await f.text()); } catch { toast('ملف غير صالح', 'error'); return; }
    if (!d.trainers && !d.content) { toast('الملف لا يبدو نسخة من المنصة', 'error'); return; }
    if (!await confirmBox('استبدال البيانات الحالية بمحتوى الملف؟', { danger: true, ok: 'استرجاع' })) return;
    backup('before-restore');
    Object.keys(d).filter(k => !['secrets', 'admins', 'adminInvites', 'uids'].includes(k)).forEach(k => Store.set(k, d[k]));
    Security.log('استرجاع نسخة', f.name); toast('تم الاسترجاع');
  };
}

/* بيانات تجريبية بأسماء افتراضية (demo: true) */
async function seedDemo() {
  const D = [
    ['م. فيصل الغامدي', 'Faisal Alghamdi', 'm', 'riyadh', 'الرياض', 'مدرب معتمد في الذكاء الاصطناعي وتحليل البيانات', ['ai-data', 'programming', 'digital'], 'تعلم الآلة للمبتدئين، تحليل البيانات بـ Python، الذكاء الاصطناعي التوليدي في بيئة العمل', 9, 2100, 85, 'night', ['onsite', 'online']],
    ['أ. نورة القحطاني', 'Noura Alqahtani', 'f', 'eastern', 'الدمام', 'مدربة قيادة وتطوير مؤسسي', ['leadership', 'hr', 'quality'], 'القيادة التحويلية، بناء فرق العمل، إدارة التغيير، التخطيط الاستراتيجي', 14, 3600, 140, 'rose', ['onsite', 'hybrid']],
    ['د. عبدالله الحربي', 'Abdullah Alharbi', 'm', 'madinah', 'المدينة المنورة', 'مستشار ومدرب في ريادة الأعمال', ['entrepreneur', 'finance', 'projects'], 'من الفكرة إلى المشروع، دراسات الجدوى، نماذج العمل التجارية، التمويل للمشاريع الناشئة', 11, 2800, 96, 'sand', ['onsite', 'online']],
    ['أ. ريم الشهري', 'Reem Alshehri', 'f', 'asir', 'أبها', 'مدربة مهارات الاتصال وصناعة المحتوى', ['content', 'soft', 'marketing'], 'فن الإلقاء، صناعة المحتوى الرقمي، التسويق عبر وسائل التواصل، العلامة الشخصية', 7, 1500, 60, 'teal', ['online', 'hybrid']],
    ['م. خالد العتيبي', 'Khalid Alotaibi', 'm', 'makkah', 'جدة', 'مدرب الأمن السيبراني والتحول الرقمي', ['cyber', 'it', 'digital'], 'أساسيات الأمن السيبراني، التوعية الأمنية للموظفين، حوكمة التقنية', 10, 1900, 70, 'graphite', ['onsite', 'online']],
    ['أ. سارة الدوسري', 'Sarah Aldosari', 'f', 'qassim', 'بريدة', 'مدربة إرشاد مهني ومهارات التوظيف', ['career', 'hr-dev', 'soft'], 'كتابة السيرة الذاتية، اجتياز المقابلات، التخطيط المهني، إدارة الوقت', 6, 1100, 48, 'emerald', ['onsite', 'online']],
    ['أ. ماجد الشمري', 'Majed Alshammari', 'm', 'hail', 'حائل', 'مدرب تطوير الذات والتفكير الإبداعي', ['hr-dev', 'innovation', 'education'], 'التفكير الإبداعي، حل المشكلات، الذكاء العاطفي، تصميم الحقائب التدريبية', 12, 3000, 120, 'emerald', ['onsite']],
    ['أ. هند المالكي', 'Hind Almalki', 'f', 'tabuk', 'تبوك', 'مدربة خدمة العملاء وتجربة المستفيد', ['customer', 'quality', 'soft'], 'تجربة العميل، التعامل مع العملاء الصعبين، معايير الجودة في الخدمة', 8, 1400, 55, 'rose', ['onsite', 'hybrid']]
  ];
  for (const [name, nameEn, gender, region, city, title, specs, topics, years, hours, programs, theme, modes] of D) {
    const code = await Data.nextCode(); const id = code.toLowerCase();
    const rec = { id, code, name, nameEn, gender, region, city, title, specs, topics, years, hours, programs, theme, modes, langs: 'العربية، الإنجليزية',
      bio: `${gender === 'f' ? 'مدربة' : 'مدرب'} سعودي${gender === 'f' ? 'ة' : ''} بخبرة ${years} سنة في التدريب والتطوير، ${gender === 'f' ? 'قدّمت' : 'قدّم'} أكثر من ${programs} برنامجاً تدريبياً لجهات حكومية وخاصة وغير ربحية. (بيانات تجريبية)`,
      certs: 'شهادة إعداد المدربين TOT', links: { whatsapp: '0500000000', linkedin: 'https://www.linkedin.com/' }, status: 'active', featured: years >= 10, demo: true,
      publishedAt: Date.now(), expiresAt: Date.now() + 365 * 864e5, updatedAt: Date.now() };
    rec.slug = Data.makeSlug(rec);
    Store.set(`trainers/${id}`, rec);
  }
  Security.log('إضافة بيانات تجريبية', `${D.length} مدرب`);
}
