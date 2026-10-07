/* لوحة الإدارة: المؤشرات، طلبات التسجيل، المدربون، الطلبات، القاعات، المحتوى، المشرفون، النسخ الاحتياطي */

const googleIcon = '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

Pages.admin = {
  tab: 'dash',
  menuEdit: false,
  // عناصر القائمة الجانبية بالترتيب المحفوظ (settings/adminMenu)، والعناصر الجديدة تُلحق في آخرها
  tabs() {
    const apps = Store.list('applications');
    const newReq = Store.list('requests').filter(r => r.status === 'new').length + Store.list('leads').filter(r => r.status === 'new').length;
    const all = [
      ['dash', 'fa-chart-pie', 'المؤشرات'], ['apps', 'fa-user-plus', 'طلبات التسجيل', apps.filter(a => a.status === 'new').length], ['trainers', 'fa-id-card', 'المدربون'],
      ['requests', 'fa-inbox', 'طلبات الجهات', newReq], ['mail', 'fa-envelope', 'المراسلة'], ['news', 'fa-newspaper', 'الأخبار والإعلانات'], ['social', 'fa-share-nodes', 'النشر الاجتماعي', Store.list('social').filter(p => p.status === 'failed').length],
      ['home', 'fa-house', 'الصفحة الرئيسية'], ['forms', 'fa-rectangle-list', 'النماذج'], ['templates', 'fa-envelope-open-text', 'قوالب'], ['seo', 'fa-magnifying-glass-chart', 'SEO'], ['specs', 'fa-shapes', 'التخصصات'], ['halls', 'fa-building-columns', 'القاعات', Store.list('hallReqs').filter(r => r.status === 'new').length],
      ['content', 'fa-pen-ruler', 'المحتوى العام'], ['admins', 'fa-user-shield', 'المشرفون'], ['backup', 'fa-database', 'البيانات والسجل']
    ];
    const order = arr(Store.get('settings/adminMenu'));
    const pos = k => { const i = order.indexOf(k); return i < 0 ? 1000 + all.findIndex(t => t[0] === k) : i; };
    return all.sort((x, y) => pos(x[0]) - pos(y[0]));
  },
  menuHTML() {
    const tabs = this.tabs(), ed = this.menuEdit;
    return `${tabs.map(([k, i, l, b], n) => `<div class="side-item ${ed ? 'edit' : ''}" data-k="${k}" ${ed ? 'draggable="true"' : ''}>
        <button data-tab="${k}" class="${this.tab === k ? 'on' : ''}">${ed ? '<i class="fa-solid fa-grip-vertical side-grip"></i>' : ''}<i class="fa-solid ${i}"></i>${l}${b && !ed ? `<span class="badge num">${b}</span>` : ''}</button>
        ${ed ? `<span class="side-mv"><button data-mv="-1" title="تحريك للأعلى" ${n ? '' : 'disabled'}><i class="fa-solid fa-chevron-up"></i></button><button data-mv="1" title="تحريك للأسفل" ${n < tabs.length - 1 ? '' : 'disabled'}><i class="fa-solid fa-chevron-down"></i></button></span>` : ''}
      </div>`).join('')}
      ${ed ? '<div class="side-edit-bar"><button class="side-done" data-menu-done><i class="fa-solid fa-check"></i>تم</button><button data-menu-reset title="الترتيب الافتراضي"><i class="fa-solid fa-rotate-left"></i>الافتراضي</button></div>' : ''}`;
  },
  render() {
    const s = Auth.current();
    if (s?.kind !== 'admin') return adminLoginView();
    const u = Security.currentUser();
    return `<div class="wrap dash">
      <aside class="side ${this.menuEdit ? 'editing' : ''}">
        <div class="who"><span class="av"><i class="fa-solid fa-shield-halved" style="color:var(--gold2)"></i></span><div class="grow"><b>${esc(Security.adminName())}</b><small>${u ? esc(u.email) : 'الوضع المحلي'}</small></div>
          <button class="side-sort ${this.menuEdit ? 'on' : ''}" data-menu-edit title="ترتيب القائمة"><i class="fa-solid fa-arrow-down-up-across-line"></i></button></div>
        <div class="side-nav">${this.menuHTML()}</div>
        <button class="side-sort-m" data-menu-edit title="ترتيب القائمة"><i class="fa-solid fa-arrow-down-up-across-line"></i>ترتيب</button>
        <hr style="border:0;border-top:1px solid rgba(255,255,255,.08)">
        <button data-preview><i class="fa-solid fa-user-gear"></i>معاينة كمدرب</button>
        <button data-out><i class="fa-solid fa-right-from-bracket"></i>خروج</button>
      </aside>
      <main id="at"></main>
    </div>`;
  },
  // إعادة رسم القائمة وحدها حتى لا تضيع تعديلات التبويب المفتوح
  wireMenu(root) {
    const side = $('.side', root), nav = $('.side-nav', root);
    nav.innerHTML = this.menuHTML();
    side.classList.toggle('editing', this.menuEdit);
    $$('[data-menu-edit]', root).forEach(b => b.classList.toggle('on', this.menuEdit));
    const save = keys => { Store.set('settings/adminMenu', keys); };
    const keys = () => $$('.side-item', nav).map(x => x.dataset.k);
    $$('[data-tab]', nav).forEach(b => b.onclick = () => { if (this.menuEdit) return; this.tab = b.dataset.tab; App.render(); });
    $$('[data-mv]', nav).forEach(b => b.onclick = () => {
      const ks = keys(), i = ks.indexOf(b.closest('.side-item').dataset.k), j = i + Number(b.dataset.mv);
      [ks[i], ks[j]] = [ks[j], ks[i]]; save(ks); this.wireMenu(root);
      nav.querySelector(`.side-item[data-k="${ks[j]}"] [data-mv="${b.dataset.mv}"]:not([disabled])`)?.focus();
    });
    let drag = null;
    $$('.side-item[draggable]', nav).forEach(it => {
      it.ondragstart = e => { drag = it.dataset.k; it.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; };
      it.ondragend = () => it.classList.remove('dragging');
      it.ondragover = e => { e.preventDefault(); it.classList.add('drop'); };
      it.ondragleave = () => it.classList.remove('drop');
      it.ondrop = e => { e.preventDefault(); const ks = keys().filter(k => k !== drag); ks.splice(ks.indexOf(it.dataset.k), 0, drag); save(ks); this.wireMenu(root); };
    });
    $('[data-menu-done]', nav) && ($('[data-menu-done]', nav).onclick = () => { this.menuEdit = false; this.wireMenu(root); toast('تم حفظ ترتيب القائمة'); });
    $('[data-menu-reset]', nav) && ($('[data-menu-reset]', nav).onclick = () => { Store.set('settings/adminMenu', null); this.wireMenu(root); });
  },
  mount(root) {
    if (Auth.current()?.kind !== 'admin') return mountAdminLogin(root);
    this.wireMenu(root);
    $$('[data-menu-edit]', root).forEach(b => b.onclick = () => { this.menuEdit = !this.menuEdit; this.wireMenu(root); });
    $('[data-out]', root).onclick = () => Auth.logout();
    $('[data-preview]', root).onclick = () => TrainerPreview.open();
    const main = $('#at', root);
    ({ dash: aDash, apps: aApps, trainers: aTrainers, requests: aRequests, mail: aMail, social: aSocial, news: News.admin, home: aHome, forms: aForms, templates: aTemplates, seo: aSeo, specs: aSpecs, halls: aHalls, content: aContent, admins: aAdmins, backup: aBackup })[this.tab](main);
  },
  // تبويبات التحرير لا يُعاد رسمها تلقائياً حتى لا تضيع التعديلات غير المحفوظة، وكذلك أثناء ترتيب القائمة
  get static() { return this.menuEdit || ['content', 'home', 'forms', 'templates', 'specs'].includes(this.tab); }
};

function adminLoginView() {
  return `<div class="auth-wrap"><div class="auth-card">
    ${logoImg('green', 'auth-logo')}
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
  const live = Data.live();
  const apps = Store.list('applications');
  const views = Object.values(Store.get('stats/views') || {}).reduce((a, b) => a + Number(b || 0), 0);
  const clicks = Object.values(Store.get('stats/clicks') || {}).reduce((a, b) => a + Number(b || 0), 0);
  const rc = Data.regionCounts(), sc = Data.specCounts();
  const bars = (obj, name, max = 8) => {
    const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, max); const m = Math.max(1, ...rows.map(r => r[1]));
    return rows.length ? rows.map(([k, v]) => `<div class="bar"><span>${esc(name(k))}</span><div class="t"><span style="width:${v / m * 100}%"></span></div><b class="num">${v}</b></div>`).join('') : '<p class="muted small">لا بيانات بعد</p>';
  };
  const top = [...live].sort((a, b) => Data.views(b.id) - Data.views(a.id)).slice(0, 5);
  // نشاط المدربين: تجميع سجل الدخول والتعديل لكل مدرب
  const act = {}, evs = [];
  Object.entries(Store.get('activity') || {}).forEach(([id, m]) => Object.values(m || {}).forEach(e => {
    if (!e || !e.ts) return;
    const a = act[id] || (act[id] = { id, logins: 0, edits: 0, lastLogin: 0, lastEdit: 0 });
    if (e.type === 'login') { a.logins++; a.lastLogin = Math.max(a.lastLogin, e.ts); } else { a.edits++; a.lastEdit = Math.max(a.lastEdit, e.ts); }
    evs.push({ ...e, tid: id });
  }));
  const tname = id => Store.get(`trainers/${id}`)?.name || id;
  const week = Date.now() - 7 * 864e5;
  const rows = Object.values(act).sort((a, b) => Math.max(b.lastLogin, b.lastEdit) - Math.max(a.lastLogin, a.lastEdit));
  const actHTML = `<div class="pbox" style="grid-column:1/-1"><h3><i class="fa-solid fa-user-clock"></i>نشاط المدربين</h3>
    <div class="kpis" style="margin-bottom:12px">
      <div class="kpi"><i class="fa-solid fa-right-to-bracket"></i><b class="num">${rows.filter(a => a.lastLogin > week).length}</b><span>دخلوا خلال 7 أيام</span></div>
      <div class="kpi"><i class="fa-solid fa-pen-to-square"></i><b class="num">${rows.filter(a => a.lastEdit > week).length}</b><span>عدّلوا بياناتهم خلال 7 أيام</span></div>
      <div class="kpi"><i class="fa-solid fa-user-slash"></i><b class="num">${live.filter(t => !act[t.id]).length}</b><span>لم يدخلوا بعد</span></div>
    </div>
    ${rows.length ? `<div class="tbl-wrap" style="overflow:auto"><table class="tbl"><thead><tr><th>المدرب</th><th>آخر دخول</th><th>مرات الدخول</th><th>آخر تعديل</th><th>مرات التعديل</th></tr></thead><tbody>${rows.map(a => `<tr><td><a href="#/t/${esc(a.id)}">${esc(tname(a.id))}</a></td><td>${a.lastLogin ? ago(a.lastLogin) : '—'}</td><td class="num">${a.logins}</td><td>${a.lastEdit ? ago(a.lastEdit) : '—'}</td><td class="num">${a.edits}</td></tr>`).join('')}</tbody></table></div>
    <h4 style="margin:14px 0 6px">آخر الحركات</h4><div class="log">${evs.sort((a, b) => b.ts - a.ts).slice(0, 12).map(e => `<div><small>${ago(e.ts)}</small><span><b>${esc(tname(e.tid))}</b> — ${e.type === 'login' ? '<i class="fa-solid fa-right-to-bracket"></i> دخل إلى صفحته' : `<i class="fa-solid fa-pen"></i> عدّل ${esc(e.detail || 'بياناته')}`}</span></div>`).join('')}</div>` : '<p class="muted small">لا نشاط للمدربين بعد، يظهر هنا عند دخول أي مدرب أو تعديله لبياناته</p>'}</div>`;
  main.innerHTML = `
    <div class="dash-h"><h2>نظرة عامة</h2><span class="muted small">${fmtTs(Date.now())}</span></div>
    <div id="anx"></div>
    <div class="an-ext-h"><h2><i class="fa-solid fa-id-card"></i> المدربون والطلبات</h2></div>
    <div class="kpis">
      <div class="kpi dark"><i class="fa-solid fa-id-card"></i><b class="num" data-count="${live.length}">0</b><span>مدرب منشور</span></div>
      <div class="kpi"><i class="fa-solid fa-user-plus"></i><b class="num" data-count="${apps.filter(a => ['new', 'review', 'interview'].includes(a.status)).length}">0</b><span>طلب تسجيل قيد المعالجة</span></div>
      <div class="kpi"><i class="fa-solid fa-sack-dollar"></i><b class="num" data-count="${apps.filter(a => a.status === 'accepted').length}">0</b><span>بانتظار السداد</span></div>
      <div class="kpi"><i class="fa-solid fa-eye"></i><b class="num" data-count="${views}">0</b><span>مشاهدة للبطاقات</span></div>
      <div class="kpi"><i class="fa-solid fa-hand-pointer"></i><b class="num" data-count="${clicks}">0</b><span>نقرة تواصل</span></div>
      <div class="kpi"><i class="fa-solid fa-inbox"></i><b class="num" data-count="${Store.list('requests').length + Store.list('leads').length}">0</b><span>طلب من الجهات</span></div>
    </div>
    <div class="grid2">
      <div class="pbox"><h3><i class="fa-solid fa-map-location-dot"></i>المدربون حسب المنطقة</h3><div class="bars">${bars(rc, regionName, 13)}</div></div>
      <div class="pbox"><h3><i class="fa-solid fa-layer-group"></i>أكثر التخصصات</h3><div class="bars">${bars(sc, specName, 10)}</div></div>
      <div class="pbox"><h3><i class="fa-solid fa-fire"></i>الأكثر مشاهدة</h3>${top.length ? top.map(t => `<div class="bar"><span>${esc(t.name)}</span><div class="t"><span style="width:${Data.views(t.id) / Math.max(1, Data.views(top[0].id)) * 100}%"></span></div><b class="num">${Data.views(t.id)}</b></div>`).join('') : '<p class="muted small">لا بيانات بعد</p>'}</div>
      <div class="pbox"><h3><i class="fa-solid fa-clock-rotate-left"></i>آخر النشاطات</h3><div class="log">${Store.list('adminLog').sort((a, b) => b.ts - a.ts).slice(0, 8).map(l => `<div><small>${ago(l.ts)}</small><span><b>${esc(l.action)}</b> ${esc(l.target)} <small>— ${esc(l.by?.name || '')}</small></span></div>`).join('') || '<p class="muted small">لا نشاط بعد</p>'}</div></div>
      ${actHTML}
    </div>`;
  if (!aDash.synced) { aDash.synced = true; Data.syncSlugs(); }   // ترحيل: حجز روابط المدربين الحاليين
  statsMount(main);
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

/* إرسال إشعار للمتقدم/المدرب: بالبريد (آلياً من بريد المنصة عند تفعيل الأتمتة، وإلا يُفتح البريد برسالة جاهزة) أو بالواتساب */
// نافذة كتابة Gmail في المتصفح (تعمل على الحاسوب دون تطبيق بريد)، والرسالة جاهزة
const gmailCompose = (to, su, body, cc = '') => `https://mail.google.com/mail/?view=cm&fs=1&authuser=0&to=${encodeURIComponent(to)}${cc ? '&cc=' + encodeURIComponent(cc) : ''}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`;
async function sendMailNotice(to, msg, applog) {
  if (!to) { toast('لا يوجد بريد إلكتروني لهذا المسجّل', 'error'); return false; }
  if (Automation.on) {
    const id = Store.push('outbox', { to, subject: msg.subject, body: msg.body, ts: Date.now() });
    await Automation.notify('outbox', id);
    toast('أُرسل الإشعار من بريد المنصة');
  } else {
    window.open(gmailCompose(to, msg.subject, msg.body), '_blank');
    toast('فُتح Gmail في المتصفح برسالة جاهزة — سجّل الدخول ببريد المنصة واضغط إرسال');
  }
  applog && Store.update(`applications/${applog.id}`, { [applog.key]: Date.now() });
  return true;
}
function sendWaNotice(phone, text, applog) {
  if (!phone) { toast('لا يوجد رقم جوال', 'error'); return false; }
  window.open(waLink(phone, text), '_blank');
  toast(`افتح المحادثة من واتساب المنصة (${window.ST_CONFIG.platformWhatsapp}) ثم اضغط إرسال`);
  applog && Store.update(`applications/${applog.id}`, { [applog.key]: Date.now() });
  return true;
}
const sentBadge = ts => (ts ? `<span class="pill ok" title="${fmtTs(ts)}"><i class="fa-solid fa-check"></i> أُرسل ${ago(ts)}</span>` : '');

// أزرار إشعارات مرحلة (initial / final): بريد وواتساب مع علامة الإرسال
function noticeButtons(a, stage, ctx) {
  const k = stage === 'initial' ? 'Initial' : 'Final';
  return `<div class="notice-box"><b>${stage === 'initial' ? 'إشعار القبول المبدئي والسداد' : 'إشعار القبول النهائي وبيانات الدخول'}</b>
    <div class="notice-btns"><button class="btn sm primary" data-mail="${stage}"><i class="fa-solid fa-envelope"></i> بريد</button>${sentBadge(a['notice' + k + 'Mail'])}
    <button class="btn sm primary" data-wa="${stage}"><i class="fa-brands fa-whatsapp"></i> واتساب</button>${sentBadge(a['notice' + k + 'Wa'])}</div></div>`;
}

function appDetail(a) {
  if (!a) return;
  const st = Store.get(`appStatus/${a.id}`) || {};
  const trainer = a.trainerId ? Store.get(`trainers/${a.trainerId}`) : null;
  const secret = a.trainerId ? Store.get(`secrets/codes/${a.trainerId}`) : '';
  const early = ['new', 'review', 'interview'].includes(a.status);
  const stages = [['new', 'استلام'], ['accepted', 'قبول مبدئي'], ['published', 'قبول نهائي']];
  const at = a.status === 'published' ? 2 : a.status === 'accepted' ? 1 : 0;
  const m = modal(`<h3><i class="fa-solid fa-user-plus"></i> طلب ${esc(a.name)} <span class="pill ${APP_STATUS[a.status]?.tone}">${APP_STATUS[a.status]?.name}</span></h3>
    <div class="stagebar ${a.status === 'rejected' ? 'rej' : ''}">${stages.map(([k, l], i) => `<span class="${i < at ? 'done' : i === at ? 'cur' : ''}"><i class="fa-solid ${i < at ? 'fa-check' : ['fa-inbox', 'fa-circle-check', 'fa-certificate'][i]}"></i>${l}</span>`).join('')}</div>
    <div class="detail-grid">
      <div>
        <dl class="dl">
          <dt>رقم الطلب</dt><dd class="num">${esc(a.id)}</dd><dt>التاريخ</dt><dd>${fmtTs(a.ts)}</dd>
          <dt>الجوال</dt><dd><a class="num" href="${esc(waLink(a.phone))}" target="_blank">${esc(a.phone)}</a></dd><dt>البريد</dt><dd><a href="mailto:${esc(a.email)}">${esc(a.email)}</a>${a.receivedEmailAt ? ' ' + sentBadge(a.receivedEmailAt).replace('أُرسل', 'وصله تأكيد الاستلام') : ''}</dd>
          <dt>المنطقة</dt><dd>${esc(regionsLabel(a))} ${esc(a.city || '')}${a.travel ? ' · مستعد للسفر' : ''}</dd><dt>الجنس</dt><dd>${a.gender === 'f' ? 'مدربة' : 'مدرب'}</dd>
          <dt>اللقب</dt><dd>${esc(a.title)}</dd><dt>التخصصات</dt><dd>${Data.specs(a).map(specName).join('، ')}</dd><dt>على البطاقة</dt><dd>${Data.cardSpecs(a).map(specName).join('، ') || '—'}</dd>
          <dt>البرامج</dt><dd>${esc(a.topics || '—')}</dd><dt>الخبرة</dt><dd><span class="num">${a.years || 0}</span> سنة · <span class="num">${a.hours || 0}</span> ساعة · <span class="num">${a.programs || 0}</span> برنامج</dd>
          <dt>TOT</dt><dd>${a.tot ? '✅ حاصل على شهادة تدريب المدربين' : '—'}</dd><dt>الإقرار</dt><dd>${a.ack ? '✅ وافق على إقرار الفرص' : '—'}</dd><dt>الشهادات</dt><dd>${nl2br(a.certs || '—')}</dd>
          ${a.cvUrl ? `<dt>المرفقات</dt><dd>${a.cvUrl ? `<a href="${esc(safeUrl(a.cvUrl))}" target="_blank" rel="noopener">فتح الرابط <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '—'}</dd>` : ''}
          <dt>النبذة</dt><dd>${nl2br(a.bio)}</dd>
          ${FormKit.customDefs().filter((f, i, l) => a.extra?.[f.k] != null && l.findIndex(x => x.k === f.k) === i).map(f => `<dt>${esc(f.label)}</dt><dd>${esc(String(a.extra[f.k]).replace(/\|/g, '، '))}</dd>`).join('')}
        </dl>
        ${field('ملاحظة تظهر للمتقدم في صفحة متابعة الطلب', `<textarea id="pn" maxlength="500" style="min-height:70px">${esc(st.note || '')}</textarea>`)}
        <div class="row" style="margin-top:8px">
          <select id="ns" style="width:auto">${Object.entries(APP_STATUS).filter(([k]) => k !== 'published').map(([k, v]) => opt(k, v.name, a.status)).join('')}</select>
          <button class="btn sm" id="sv">حفظ الحالة والملاحظة</button>
        </div>
      </div>
      <div>
        <div style="transform:scale(.8);transform-origin:top center;margin-bottom:-110px">${Card.full({ ...a, id: '__app' }, { preview: true })}</div>
        <div class="stage-actions">
          ${early ? `<p class="small muted">راجع بيانات الطلب، فإن كان مستوفياً اضغط القبول المبدئي لتنتقل لمرحلة السداد.</p>
            <button class="btn primary" data-act="initial"><i class="fa-solid fa-circle-check"></i> قبول مبدئي</button>
            <button class="btn ghost" data-act="reject" style="color:var(--bad)"><i class="fa-solid fa-circle-xmark"></i> رفض الطلب</button>` : ''}
          ${a.status === 'accepted' ? `<div class="banner info"><i class="fa-solid fa-sack-dollar"></i>بانتظار تحويل <b class="num">${esc(Data.content().join.fee)}</b> ريال</div>
            ${noticeButtons(a, 'initial')}
            <p class="small muted">بعد التأكد من وصول التحويل اضغط القبول النهائي ليُنشأ حساب المدرب وبطاقته ورمز دخوله.</p>
            <button class="btn gold" data-act="final"><i class="fa-solid fa-certificate"></i> قبول نهائي (تم تأكيد التحويل)</button>` : ''}
          ${a.status === 'published' ? `<div class="banner ok"><i class="fa-solid fa-certificate"></i>تم القبول النهائي${trainer ? ` — رقم العضوية <b class="num">${esc(trainer.code)}</b>` : ''}</div>
            ${secret ? noticeButtons(a, 'final') : '<p class="small muted">لا يتوفر رمز محفوظ؛ جدّد الرمز من تبويب المدربين.</p>'}
            ${trainer ? `<a class="btn" href="#/t/${esc(trainer.slug || trainer.id)}" target="_blank"><i class="fa-solid fa-id-card"></i> فتح بطاقته</a>` : ''}` : ''}
          ${a.status === 'rejected' ? '<div class="banner warn"><i class="fa-solid fa-circle-xmark"></i>الطلب غير مقبول. يمكنك إعادته للمراجعة من القائمة.</div>' : ''}
          <button class="btn ghost" id="del" style="color:var(--bad)"><i class="fa-solid fa-trash"></i> حذف الطلب</button>
        </div>
      </div>
    </div>`, { wide: true });
  const reopen = () => { m.close(); setTimeout(() => appDetail(Store.get(`applications/${a.id}`)), 260); };
  m.$('#sv').onclick = () => {
    const ns = m.$('#ns').value, note = m.$('#pn').value.trim();
    if (ns !== a.status) setAppStatus(a, ns, note); else Store.update(`appStatus/${a.id}`, { note, ts: Date.now() });
    toast('تم الحفظ'); m.close();
  };
  m.el.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
    const act = b.dataset.act;
    if (act === 'initial') {
      if (!await confirmBox(`قبول طلب <b>${esc(a.name)}</b> مبدئياً؟ ينتقل لمرحلة السداد وتظهر أزرار إرسال إشعار القبول والسداد.`, { ok: 'قبول مبدئي' })) return;
      setAppStatus(a, 'accepted'); Store.update(`applications/${a.id}`, { initialAt: Date.now() }); reopen();
    }
    if (act === 'reject') {
      if (!await confirmBox('رفض هذا الطلب؟ يظهر للمتقدم في صفحة المتابعة أنه غير مقبول.', { ok: 'رفض', danger: true })) return;
      setAppStatus(a, 'rejected', m.$('#pn').value.trim()); reopen();
    }
    if (act === 'final') {
      if (!await confirmBox(`تأكدت من وصول تحويل <b>${esc(a.name)}</b>؟ يُنشأ الآن حسابه وبطاقته ورقم عضويته ورمز دخوله.`, { ok: 'قبول نهائي' })) return;
      try { const { trainer: t, secret: sc } = await Data.publishFromApplication(a); Store.update(`applications/${a.id}`, { finalAt: Date.now() }); m.close(); showSecret(t, sc, true); }
      catch (e) { toast(e.message, 'error'); }
    }
  });
  m.el.querySelectorAll('[data-mail]').forEach(b => b.onclick = () => {
    const stage = b.dataset.mail, cur = Store.get(`applications/${a.id}`);
    if (stage === 'initial') { sendMailNotice(a.email, Tpl.mail('initial', { a }), { id: a.id, key: 'noticeInitialMail' }); }
    else { const priv = Store.get(`private/${a.trainerId}`) || {}; sendMailNotice(priv.email || a.email, Tpl.mail('final', { a: cur, t: trainer, secret }), { id: a.id, key: 'noticeFinalMail' }); }
  });
  m.el.querySelectorAll('[data-wa]').forEach(b => b.onclick = () => {
    const stage = b.dataset.wa;
    if (stage === 'initial') sendWaNotice(a.phone, Tpl.wa('initial', { a }), { id: a.id, key: 'noticeInitialWa' });
    else sendWaNotice((Store.get(`private/${a.trainerId}`) || {}).phone || a.phone, Tpl.wa('final', { a, t: trainer, secret }), { id: a.id, key: 'noticeFinalWa' });
  });
  m.$('#del').onclick = async () => {
    if (!await confirmBox('حذف هذا الطلب نهائياً؟', { ok: 'حذف', danger: true })) return;
    Store.remove(`applications/${a.id}`); Store.remove(`appStatus/${a.id}`); Security.log('حذف طلب', a.name); m.close();
  };
}

function showSecret(t, secret, isNew) {
  const priv = Store.get(`private/${t.id}`) || {};
  const app = t.appId ? Store.get(`applications/${t.appId}`) || { id: t.appId } : {};
  const ctx = { a: app, t, secret };
  const log = key => (t.appId ? { id: t.appId, key } : null);
  const m = modal(`<h3><i class="fa-solid fa-certificate"></i> ${isNew ? 'تم القبول النهائي 🎉' : 'رمز الدخول'}</h3>
    <p class="muted">أُنشئت بطاقة <b>${esc(t.name)}</b> برقم العضوية <b class="num">${esc(t.code)}</b>. أرسل له الآن إشعار القبول مع رمز الدخول (يُحرَّر القالب من تبويب «قوالب»).</p>
    <div class="secret"><span>${esc(secret)}</span><button class="btn sm glass" id="cs" title="نسخ الرمز"><i class="fa-solid fa-copy"></i></button></div>
    <div class="banner warn" style="margin-top:12px"><i class="fa-solid fa-triangle-exclamation"></i>الرمز خاص بالمدرب، ولا يُنشر ولا يُرسل إلا له.</div>
    <div class="share-grid" style="margin-top:14px">
      <button class="sh li" id="sm"><i class="fa-solid fa-envelope"></i>إرسال بالبريد</button>
      <button class="sh wa" id="sw"><i class="fa-brands fa-whatsapp"></i>إرسال واتساب</button>
      <button class="sh cp" id="cm"><i class="fa-solid fa-copy"></i>نسخ الرسالة</button>
      <button class="sh im" id="ci"><i class="fa-solid fa-image"></i>صورة البطاقة</button>
    </div>
    ${priv.email || priv.phone ? '' : '<p class="small muted">لا توجد بيانات تواصل محفوظة لهذا المدرب؛ انسخ الرسالة وأرسلها له.</p>'}`);
  m.$('#cs').onclick = () => copyText(secret, 'تم نسخ الرمز');
  m.$('#sm').onclick = () => sendMailNotice(priv.email, Tpl.mail('final', ctx), log('noticeFinalMail'));
  m.$('#sw').onclick = () => sendWaNotice(priv.phone, Tpl.wa('final', ctx), log('noticeFinalWa'));
  m.$('#cm').onclick = () => copyText(Tpl.wa('final', ctx), 'تم نسخ الرسالة');
  m.$('#ci').onclick = () => Card.save(t, 'post');
}

/* ===================== المدربون ===================== */
function aTrainers(main) {
  const f = JSON.parse(main.dataset.f || '{}');
  let list = Data.all();
  if (f.q) list = Data.search(list, { q: f.q });
  if (f.region) list = list.filter(t => regionsOf(t).includes(f.region));
  if (f.st === 'live') list = list.filter(Data.isLive); else if (f.st === 'hidden') list = list.filter(t => t.status !== 'active'); else if (f.st === 'nocode') list = list.filter(t => !Store.get(`secrets/codes/${t.id}`));
  main.innerHTML = `
    <div class="dash-h"><h2>المدربون <span class="muted num" style="font-size:1rem">(${list.length})</span></h2><div class="row"><button class="btn sm" id="imp"><i class="fa-solid fa-file-import"></i> استيراد</button><button class="btn sm" id="tplx"><i class="fa-solid fa-file-arrow-down"></i> قالب الاستيراد</button><button class="btn sm" id="exp"><i class="fa-solid fa-file-csv"></i> تصدير CSV</button><button class="btn primary sm" id="add"><i class="fa-solid fa-plus"></i> إضافة مدرب</button></div></div>
    <div class="toolbar">
      <input type="search" id="tq" placeholder="بحث..." value="${esc(f.q || '')}">
      <select id="tr"><option value="">كل المناطق</option>${REGIONS.map(r => opt(r.k, r.name, f.region)).join('')}</select>
      <select id="ts"><option value="">كل الحالات</option>${opt('live', 'منشور', f.st)}${opt('hidden', 'مخفي', f.st)}${opt('nocode', 'بلا رمز دخول', f.st)}</select>
    </div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المدرب</th><th>المنطقة</th><th>الحالة</th><th>المشاهدات</th><th>تاريخ الانضمام</th><th></th></tr></thead><tbody>
      ${list.map(t => `<tr>
        <td><div class="who">${Card.avatar(t, 'av')}<div><b>${esc(t.name)} ${t.featured ? '<i class="fa-solid fa-star" style="color:var(--gold)"></i>' : ''}</b><small class="num">${esc(t.code)}</small> <small>· ${esc(t.title || '')}</small></div></div></td>
        <td>${esc(regionsLabel(t))}</td>
        <td>${Data.isLive(t) ? '<span class="pill ok">منشور</span>' : '<span class="pill gray">مخفي</span>'} ${Store.get(`secrets/codes/${t.id}`) ? '' : '<span class="pill bad" title="لم يُصدر رمز دخول">بلا رمز</span>'}</td>
        <td class="num">${Data.views(t.id)}</td>
        <td class="num">${fmtDate(t.publishedAt)}</td>
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
  $('#tplx', main).onclick = downloadImportTemplate;
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

// الحقول الإلزامية في نموذج الإضافة من الإدارة (نفس إلزامية تعديل المدرب لبطاقته)
const ADMIN_REQUIRED = ['name', 'gender', 'region', 'phone', 'email', 'title', 'specs', 'bio', 'modes', 'langs'];
function trainerEditor(t) {
  const isNew = !t;
  t = t || { status: 'active', theme: 'brand', langs: 'العربية' };
  const priv = t.id ? Store.get(`private/${t.id}`) || {} : {};
  const steps = FormKit.steps('admin');
  const values = { ...t, phone: priv.phone || '', email: priv.email || '', extra: { ...(priv.extra || {}), ...(t.extra || {}) } };
  const m = modal(`<h3><i class="fa-solid fa-id-card"></i> ${isNew ? 'إضافة مدرب' : 'تعديل ' + esc(t.name)}</h3>
    <p class="muted small">حقول هذا النموذج تُعدَّل من تبويب «النماذج». بيانات التواصل لا تظهر في المنصة.</p>
    <div class="editor"><form id="te" autocomplete="off" novalidate style="display:grid;gap:16px">
      ${steps.map(s => `<h4 class="form-sec"><i class="fa-solid ${esc(s.icon || 'fa-circle')}"></i> ${esc(s.title)}</h4>${FormKit.stepHTML(s, values, ADMIN_REQUIRED)}`).join('')}
      <h4 class="form-sec"><i class="fa-solid fa-sliders"></i> النشر</h4>
      ${field('الحالة', `<select name="status">${opt('active', 'منشور', t.status)}${opt('hidden', 'مخفي', t.status)}</select>`)}
      ${field('رسالة للمدرب تظهر في لوحته', `<textarea name="note" maxlength="600" style="min-height:70px">${esc(Store.get(`notes/${t.id}`)?.text || '')}</textarea>`)}
      <div class="row between"><div>${isNew ? '' : '<button type="button" class="btn ghost" id="dl" style="color:var(--bad)"><i class="fa-solid fa-trash"></i> حذف المدرب</button>'}</div><button class="btn primary lg">حفظ</button></div>
    </form><div class="preview" id="pvw"></div></div>`, { wide: true });
  const form = m.$('#te');
  const preview = () => previewCard(m.$('#pvw'), { ...FormKit.read(form), code: t.code });
  if (!isNew) form.dataset.tid = t.id;
  FormKit.wire(form, preview);
  preview();
  m.$('#dl') && (m.$('#dl').onclick = async () => {
    if (!await confirmBox(`حذف <b>${esc(t.name)}</b> نهائياً مع حساب دخوله؟`, { ok: 'حذف', danger: true })) return;
    await Security.deleteTrainerAccount(t);
    ['trainers', 'private', 'notes', 'secrets/codes', 'stats/views', 'stats/clicks', 'activity'].forEach(p => Store.remove(`${p}/${t.id}`)); Object.entries(Store.get('slugs') || {}).forEach(([sl, v]) => { if (v === t.id) Store.remove(`slugs/${sl}`); });
    Security.log('حذف مدرب', t.name); m.close();
  });
  form.onsubmit = async e => {
    e.preventDefault();
    const d = FormKit.read(form);
    // الإدارة: الحقول الإلزامية ADMIN_REQUIRED، مع التحقق من صيغ بقية الحقول
    const err = FormKit.validate(steps.flatMap(s => s.fields).map(f => ({ ...f, lock: false, req: ADMIN_REQUIRED.includes(f.k) })), d, form);
    if (err) { toast(err, 'error'); return; }
    const ex = Data.splitExtra(d.extra);
    const rec = { ...Data.pick(d, Data.PUBLIC_FIELDS), status: d.status, updatedAt: Date.now(), extra: Object.keys(ex.pub).length ? ex.pub : null };
    rec.expiresAt = null; // الاشتراك مدى الحياة (يُزيل أي تاريخ انتهاء قديم)
    let id = t.id;
    if (isNew) {
      const code = await Data.nextCode();
      id = code.toLowerCase();
      Object.assign(rec, { id, code, publishedAt: Date.now(), featured: false });
      rec.slug = Data.makeSlug(rec); Data.claimSlug(rec.slug, id);
      Store.set(`trainers/${id}`, rec);
    } else {
      // تغيير الاسم الإنجليزي يحدّث رابط الصفحة (والرابط القديم يبقى يعمل)
      const ns = await Data.refreshSlug(t, rec.nameEn); if (ns) { rec.slug = ns; toast(`تحدّث رابط الصفحة إلى: ${ns}`); }
      Store.update(`trainers/${id}`, rec);
    }
    Store.set(`private/${id}`, { phone: d.phone ? phoneDigits(d.phone) : '', email: d.email || '', ...(Object.keys(ex.priv).length ? { extra: ex.priv } : {}) });
    Store.set(`notes/${id}`, d.note ? { text: d.note, ts: Date.now() } : null);
    Security.log(isNew ? 'إضافة مدرب' : 'تعديل مدرب', d.name);
    m.close(); toast('تم الحفظ');
    if (isNew && await confirmBox('إصدار رمز دخول للمدرب الآن؟', { ok: 'إصدار' })) {
      const nt = Store.get(`trainers/${id}`);
      try { showSecret(nt, await Security.issueCode(nt), true); } catch (err2) { toast(err2.message, 'error'); }
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
/* أعمدة قالب استيراد المدربين: الإلزامية أولاً ثم الاختيارية (تطابق نموذج التسجيل). ex = مثال في القالب */
const IMPORT_COLS = [
  { k: 'name', label: 'الاسم', req: true, ex: 'أ. سارة العتيبي' },
  { k: 'gender', label: 'الجنس', req: true, ex: 'مدربة', alt: ['gender'] },
  { k: 'region', label: 'المنطقة', req: true, ex: 'الرياض | مكة المكرمة', alt: ['region'] },
  { k: 'phone', label: 'الجوال', req: true, ex: '0501234567', alt: ['phone', 'mobile', 'واتساب', 'whatsapp'] },
  { k: 'email', label: 'البريد الإلكتروني', req: true, ex: 'sarah@example.com', alt: ['email', 'البريد'] },
  { k: 'title', label: 'اللقب المهني (سطر تعريفي)', req: true, ex: 'مدربة معتمدة في القيادة والتحول الرقمي', alt: ['title', 'اللقب', 'المسمى'] },
  { k: 'specs', label: 'مجالات التدريب', req: true, ex: 'القيادة | التحول الرقمي', alt: ['specs', 'التخصصات', 'التخصص'] },
  { k: 'bio', label: 'نبذة تعريفية', req: true, ex: 'مدربة بخبرة 8 سنوات في تطوير القيادات...', alt: ['bio', 'النبذة'] },
  { k: 'modes', label: 'طريقة التقديم', req: true, ex: 'حضوري | عن بُعد', alt: ['modes'] },
  { k: 'langs', label: 'لغة التدريب', req: true, ex: 'العربية | الإنجليزية', alt: ['langs', 'اللغات'] },
  { k: 'nameEn', label: 'الاسم بالإنجليزية', ex: 'Sarah Alotaibi', alt: ['nameEn', 'english name'] },
  { k: 'city', label: 'المدينة', ex: 'الرياض', alt: ['city'] },
  { k: 'travel', label: 'مستعد للسفر', ex: 'نعم', alt: ['travel'] },
  { k: 'topics', label: 'عناوين دورات تم تقديمها سابقاً', ex: 'إدارة الوقت، القيادة الفعالة', alt: ['topics', 'البرامج'] },
  { k: 'years', label: 'سنوات الخبرة', ex: '8', alt: ['years'] },
  { k: 'hours', label: 'الساعات التدريبية', ex: '1200', alt: ['hours'] },
  { k: 'programs', label: 'عدد البرامج والدورات', ex: '60', alt: ['programs'] },
  { k: 'certs', label: 'الشهادات والاعتمادات والعضويات', ex: 'مدربة معتمدة من المؤسسة العامة للتدريب التقني والمهني', alt: ['certs', 'الشهادات'] },
  { k: 'partners', label: 'جهات تم التعاون معها', ex: 'جامعة الملك سعود | غرفة الرياض', alt: ['partners'] },
  { k: 'proCerts', label: 'شهادات احترافية يدرب عليها', ex: 'PMP | CISSP', alt: ['proCerts'] },
  { k: 'tot', label: 'حاصل على شهادة تدريب المدربين', ex: 'نعم', alt: ['tot'] },
  { k: 'photo', label: 'رابط الصورة', ex: 'https://drive.google.com/file/d/.../view', alt: ['photo', 'photoUrl', 'الصورة'] },
  { k: 'theme', label: 'لون البطاقة', ex: 'brand', alt: ['theme'] }
];
const splitMulti = v => String(v || '').split(/[|،,;؛\n]+/).map(x => x.trim()).filter(Boolean);
const yes = v => /^(نعم|yes|true|1|y|✓)$/i.test(String(v || '').trim());
function downloadImportTemplate() {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  download('قالب-استيراد-المدربين.csv', '\uFEFF' + [IMPORT_COLS.map(c => q(c.label)), IMPORT_COLS.map(c => q(c.ex))].map(r => r.join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}
// يحوّل صفاً مقروءاً من الملف إلى سجل مدرب صالح للقواعد، أو يعيد الحقول الإلزامية الناقصة
function importRecord(r) {
  const miss = [], rec = {}, priv = {};
  const regions = splitMulti(r.region).map(matchRegion).filter((k, i, a) => k && a.indexOf(k) === i);
  const specNames = splitMulti(r.specs);
  const keys = specNames.map(n => SPECIALTIES.find(s => s.k !== 'other' && normAr(s.name) === normAr(n))?.k || matchSpecs(n)[0] || '');
  const specs = keys.filter((k, i) => k && keys.indexOf(k) === i);
  const unknown = specNames.filter((n, i) => !keys[i] && n.length > 1 && !leaksContact(n));
  const modes = splitMulti(r.modes).map(n => DELIVERY.find(d => normAr(d.name) === normAr(n) || d.k === n.toLowerCase() || normAr(d.name).includes(normAr(n)))?.k).filter((k, i, a) => k && a.indexOf(k) === i);
  const phone = phoneDigits(r.phone), langs = splitMulti(r.langs).join('، ');
  const gender = /ة$|انثى|أنثى|female|^f/i.test(String(r.gender || '').trim()) ? 'f' : String(r.gender || '').trim() ? 'm' : '';
  if (!r.name) miss.push('الاسم'); if (!gender) miss.push('الجنس'); if (!regions.length) miss.push('المنطقة');
  if (!validPhone(phone)) miss.push('الجوال'); if (!validEmail(r.email)) miss.push('البريد');
  if (!r.title) miss.push('اللقب'); if (!specNames.length) miss.push('مجالات التدريب'); if (!r.bio) miss.push('النبذة');
  if (!modes.length) miss.push('طريقة التقديم'); if (!langs) miss.push('لغة التدريب');
  if (miss.length) return { miss, name: r.name };
  const num = v => Math.max(0, Number(toEnDigits(v)) || 0);
  const clip = (v, n) => String(v || '').trim().slice(0, n);
  Object.assign(rec, { name: clip(r.name, 60), gender, region: regions[0], regions, title: clip(r.title, 80), specs: specs.slice(0, MAX_SPECS), bio: clip(r.bio, 4000), modes, langs: clip(langs, 60),
    theme: CARD_THEMES.some(x => x.k === r.theme) ? r.theme : 'brand' });
  const opt = { nameEn: clip(r.nameEn, 60), city: clip(r.city, 40), topics: clip(r.topics, 800), certs: clip(r.certs, 800), proCerts: clip(splitMulti(r.proCerts).join('\n'), 300), partners: clip(splitMulti(r.partners).join('\n'), 600), photoUrl: isImageLink(r.photo) ? clip(r.photo, 300) : '' };
  Object.entries(opt).forEach(([k, v]) => { if (v) rec[k] = v; });
  ['years', 'hours', 'programs'].forEach(k => { if (num(r[k])) rec[k] = Math.min(num(r[k]), { years: 60, hours: 100000, programs: 10000 }[k]); });
  if (yes(r.travel)) rec.travel = true;
  if (yes(r.tot)) rec.tot = true;
  priv.phone = phone; priv.email = clip(r.email, 120);
  return { rec, priv, unknown: unknown.slice(0, 5) };
}
function matchRegion(v) { const n = normAr(v); return REGIONS.find(r => n && (normAr(r.name).includes(n) || n.includes(normAr(r.name)) || r.old.toLowerCase() === n || r.k === n))?.k || ''; }
function matchSpecs(v) {
  return splitList(v).map(x => { const n = normAr(x); return n.length > 2 && SPECIALTIES.find(s => s.k !== 'other' && (normAr(s.name).includes(n) || n.includes(normAr(s.name))))?.k; }).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, MAX_SPECS);
}
function importDialog() {
  const m = modal(`<h3><i class="fa-solid fa-file-import"></i> استيراد المدربين</h3>
    <p class="muted small">ارفع ملف CSV بنفس أعمدة القالب (الإلزامية أولاً ثم الاختيارية). لأكثر من منطقة أو تخصص أو لغة افصل بين القيم بالرمز | . الصفوف الناقصة تُعرض أسبابها ولا تُستورد.</p>
    <div class="row"><button class="btn sm" id="tpl"><i class="fa-solid fa-download"></i> تنزيل القالب الجاهز</button></div>
    <input type="file" id="f" accept=".csv,.json,text/csv,application/json" style="margin-top:12px">
    <div id="pv" style="margin-top:12px"></div>`, { wide: true });
  m.$('#tpl').onclick = downloadImportTemplate;
  m.$('#f').onchange = async () => {
    const file = m.$('#f').files[0]; if (!file) return;
    const text = await file.text();
    let rows = [];
    if (/\.json$/i.test(file.name)) { try { const j = JSON.parse(text); rows = (Array.isArray(j) ? j : Object.values(j.trainers || j)).map(o => ({ ...o, region: Array.isArray(o.regions) ? o.regions.join('|') : o.region, specs: Array.isArray(o.specs) ? o.specs.map(specName).filter(Boolean).join('|') : o.specs, modes: Array.isArray(o.modes) ? o.modes.map(k => DELIVERY.find(d => d.k === k)?.name).filter(Boolean).join('|') : o.modes, photo: o.photo || o.photoUrl })); } catch { toast('ملف JSON غير صالح', 'error'); return; } }
    else {
      const grid = parseCSV(text.replace(/^\uFEFF/, '')); const head = grid.shift() || [];
      const nh = head.map(h => normAr(h));
      const idx = {};
      IMPORT_COLS.forEach(c => { const names = [c.label, ...(c.alt || [])].map(normAr); idx[c.k] = nh.findIndex(h => names.includes(h)); if (idx[c.k] < 0) idx[c.k] = nh.findIndex(h => names.some(n => h.includes(n))); });
      rows = grid.map(r => { const o = {}; IMPORT_COLS.forEach(c => { if (idx[c.k] >= 0) o[c.k] = (r[idx[c.k]] || '').trim(); }); return o; });
    }
    const res = rows.filter(r => r.name || r.phone || r.email).map(importRecord);
    const ok = res.filter(x => x.rec), bad = res.filter(x => !x.rec);
    m.$('#pv').innerHTML = `<p><b class="num">${ok.length}</b> مدرب جاهز للاستيراد${bad.length ? ` <span class="pill warn">${bad.length} صف ينقصه بيانات إلزامية</span>` : ''}</p>
      ${bad.length ? `<div class="banner warn"><div>${bad.slice(0, 8).map(x => `<div><b>${esc(x.name || 'بلا اسم')}</b>: ينقصه ${esc(x.miss.join('، '))}</div>`).join('')}${bad.length > 8 ? `<div>و${bad.length - 8} غيرها...</div>` : ''}</div></div>` : ''}
      <div class="tbl-wrap" style="max-height:300px"><table class="tbl"><thead><tr><th>الاسم</th><th>المناطق</th><th>التخصصات</th></tr></thead><tbody>${ok.slice(0, 50).map(x => `<tr><td>${esc(x.rec.name)}</td><td>${esc(regionsLabel(x.rec))}</td><td>${esc(x.rec.specs.map(specName).join('، ') || '—')}${x.unknown.length ? ` <span class="pill gold">جديد: ${esc(x.unknown.join('، '))}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <div class="row end" style="margin-top:12px"><button class="btn primary" id="go" ${ok.length ? '' : 'disabled'}>استيراد ونشر ${ok.length} مدرب</button></div>`;
    m.$('#go') && (m.$('#go').onclick = async () => {
      m.$('#go').disabled = true; let done = 0, failed = 0;
      for (const { rec: r0, priv, unknown } of ok) {
        const rec = { ...r0 };
        unknown.forEach(n => { const k = Data.addSpecialty(n); if (k && !rec.specs.includes(k) && rec.specs.length < MAX_SPECS) rec.specs.push(k); });
        const code = await Data.nextCode(); const id = code.toLowerCase();
        Object.assign(rec, { id, code, status: 'active', featured: false, publishedAt: Date.now(), updatedAt: Date.now() });
        rec.slug = Data.makeSlug(rec); Data.claimSlug(rec.slug, id);
        const a = await Store.setConfirmed(`trainers/${id}`, rec);
        const b = a && await Store.setConfirmed(`private/${id}`, priv);
        if (a && b) done++; else failed++;
      }
      Security.log('استيراد مدربين', `${done} مدرب`, file.name);
      if (failed) toast(`استُورد ${done} وتعذّر ${failed}. تأكد من نشر آخر database.rules.json في Firebase`, 'error');
      else toast(`تم استيراد ${done} مدرب — أصدر رموز الدخول من فلتر «بلا رمز دخول»`);
      m.close();
    });
  };
}
function exportCSV() {
  const cols = ['code', 'name', 'title', 'region', 'city', 'phone', 'email', 'specs', 'topics', 'years', 'hours', 'status', 'joined', 'views', 'url'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = Data.all().map(t => { const p = Store.get(`private/${t.id}`) || {}; return [t.code, t.name, t.title, regionsLabel(t), t.city, p.phone, p.email, Data.specs(t).map(specName).join('، '), t.topics, t.years, t.hours, Data.isLive(t) ? 'منشور' : 'مخفي', fmtDate(t.publishedAt), Data.views(t.id), profileUrl(t)].map(q).join(','); });
  download(`sauditrainers-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + [cols.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8');
}

/* ===================== طلبات الجهات ===================== */
const leadDraft = (r, t) => `السلام عليكم ${t?.name || r.trainerName || ''} 🌟
وصلك طلب تواصل جديد عبر منصة «مدرّبون سعوديّون»:

• الجهة: ${r.org}
• المسؤول: ${r.person}
• موضوع البرنامج: ${r.topic}${r.when ? `\n• الموعد المتوقع: ${r.when}` : ''}${r.mode ? `\n• طريقة التقديم: ${DELIVERY.find(d => d.k === r.mode)?.name || ''}` : ''}${r.msg ? `\n• التفاصيل: ${r.msg}` : ''}

للتواصل معهم: ${r.phone}${r.email ? ' — ' + r.email : ''}
تفاصيل الطلب في لوحتك: ${siteBase()}#/login`;

function aRequests(main) {
  const reqs = Store.list('requests').map(r => ({ ...r, kind: 'req' }));
  const leads = Store.list('leads').map(r => ({ ...r, kind: 'lead' }));
  const all = [...reqs, ...leads].sort((a, b) => b.ts - a.ts);
  const show = Store.list('showcase').sort((a, b) => b.ts - a.ts);
  main.innerHTML = `<div class="dash-h"><h2>طلبات الجهات التدريبية</h2><span class="muted small">طلبات التواصل مع مدرب محدد + «اطلب مدرباً»</span></div>
    ${Automation.on ? '<div class="banner ok"><i class="fa-solid fa-envelope-circle-check"></i>الإرسال الآلي للبريد مفعّل: يصل كل طلب تواصل إلى بريد المدرب من بريد المنصة.</div>'
      : '<div class="banner info"><i class="fa-solid fa-circle-info"></i>الإرسال الآلي للبريد غير مفعّل بعد (يحتاج ربط Google Apps Script). يمكنك الآن إرسال الطلب للمدرب بزر واتساب أو البريد.</div>'}
    <details class="pbox" ${show.length ? '' : 'open'}><summary style="cursor:pointer"><b><i class="fa-solid fa-table-cells-large" style="color:var(--g600)"></i> المعروض في «من طلبات هذا الشهر» (${show.length})</b></summary>
      <p class="muted small">تظهر هذه البطاقات متحركة في الصفحة الرئيسية دون أي بيانات تواصل. اختر من الطلبات بالأسفل بزر <i class="fa-solid fa-table-cells-large"></i> أو أضف يدوياً.</p>
      <div class="sc-admin">${show.map(x => `<div class="sc-mini"><b>${esc(x.title)}</b><small>${esc(x.org || 'جهة تدريبية')} · ${esc(regionName(x.region) || '')} · ${fmtDate(x.ts)}</small><div class="acts"><button class="btn sm icon" data-se="${esc(x.id)}"><i class="fa-solid fa-pen"></i></button><button class="btn sm icon" data-sx="${esc(x.id)}"><i class="fa-solid fa-trash"></i></button></div></div>`).join('')}
      <button class="btn sm" id="sa"><i class="fa-solid fa-plus"></i> إضافة يدوياً</button></div>
    </details>
    ${all.length ? all.map(r => {
      const t = r.trainerId ? Store.get(`trainers/${r.trainerId}`) : null;
      const tp = r.trainerId ? Store.get(`private/${r.trainerId}`) : null;
      const shown = show.some(x => x.src === r.id);
      return `<div class="lead">
      <span class="ic"><i class="fa-solid ${r.kind === 'req' ? 'fa-wand-magic-sparkles' : 'fa-paper-plane'}"></i></span>
      <div><b>${esc(r.org)}</b> <span class="pill ${r.status === 'new' ? 'gold' : 'gray'}">${r.status === 'new' ? 'جديد' : 'تمت المتابعة'}</span> <span class="pill info">${r.kind === 'req' ? 'اطلب مدرباً' : 'للمدرب: ' + esc(r.trainerName || r.trainerId)}</span>
        ${r.kind === 'lead' ? (r.emailedAt ? `<span class="pill ok"><i class="fa-solid fa-envelope-circle-check"></i> أُرسل للمدرب ${ago(r.emailedAt)}</span>` : '') + (r.waSentAt ? `<span class="pill ok"><i class="fa-brands fa-whatsapp"></i> واتساب ${ago(r.waSentAt)}</span>` : '') : ''}
        ${shown ? '<span class="pill gold"><i class="fa-solid fa-table-cells-large"></i> معروض</span>' : ''}<br>
        <small class="muted">${esc(r.person)} · <span class="num">${esc(r.phone)}</span> ${r.email ? '· ' + esc(r.email) : ''} · ${ago(r.ts)}</small>
        <p><b>الموضوع:</b> ${esc(r.topic)}${r.spec ? ` · <b>التخصص:</b> ${esc(specName(r.spec))}` : ''}${r.region ? ` · <b>المنطقة:</b> ${esc(regionName(r.region))}` : ''}${r.size ? ` · <b class="num">${r.size}</b> متدرب` : ''}${r.when ? ` · <b>الموعد:</b> ${esc(r.when)}` : ''}</p>
        ${r.msg ? `<p>${nl2br(r.msg)}</p>` : ''}
        ${r.matches?.length ? `<p class="small"><b>الترشيحات الآلية:</b> ${arr(r.matches).map(id => Store.get(`trainers/${id}`)).filter(Boolean).map(x => `<a href="#/t/${esc(x.slug || x.id)}" target="_blank">${esc(x.name)}</a>`).join('، ')}</p>` : ''}
      </div>
      <div class="acts" style="flex-direction:column">
        ${r.kind === 'lead' ? `<a class="btn sm primary" target="_blank" rel="noopener" data-wa="${esc(r.id)}" href="${esc(tp?.phone ? waLink(tp.phone, leadDraft(r, t)) : '#')}" title="فتح محادثة المدرب مع مسودة الرسالة"><i class="fa-brands fa-whatsapp"></i> للمدرب</a>
        ${tp?.email ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(gmailCompose(tp.email, 'طلب تواصل جديد — ' + r.topic, leadDraft(r, t), ''))}" title="بريد للمدرب (Gmail)"><i class="fa-solid fa-envelope"></i> للمدرب</a>` : ''}
        ${Automation.on ? `<button class="btn sm" data-mail="${esc(r.id)}" title="إعادة إرسال البريد الآلي"><i class="fa-solid fa-rotate"></i> البريد</button>` : ''}` : ''}
        <a class="btn sm" target="_blank" rel="noopener" href="${esc(waLink(r.phone, `السلام عليكم ${r.person}، معك فريق منصة مدرّبون سعوديّون بخصوص طلبكم: ${r.topic}`))}" title="واتساب الجهة"><i class="fa-brands fa-whatsapp"></i> للجهة</a>
        ${r.kind === 'req' ? (Broadcast.forwarded(r.id) ? `<button class="btn sm gold" data-fwx="${esc(r.id)}" title="أُعيد توجيهه للمدربين ${ago(Broadcast.forwarded(r.id).ts)} — اضغط لإلغاء التوجيه"><i class="fa-solid fa-share"></i> أُعيد توجيهه</button>` : `<button class="btn sm" data-fw="${esc(r.id)}" title="إعادة توجيه الطلب إلى كل المدربين (إشعار ونافذة وتبويب «طلبات عامة»)"><i class="fa-solid fa-share"></i> للمدربين</button>`) : ''}
        <button class="btn sm" data-show="${r.kind}" data-id="${esc(r.id)}" title="عرض في «من طلبات هذا الشهر»"><i class="fa-solid fa-table-cells-large"></i></button>
        <button class="btn sm" data-t="${r.kind}" data-id="${esc(r.id)}" title="تبديل الحالة"><i class="fa-solid fa-check"></i></button>
        <button class="btn sm ghost" data-del="${r.kind}" data-id="${esc(r.id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
      </div></div>`;
    }).join('') : '<div class="empty"><i class="fa-solid fa-inbox"></i><h3>لا توجد طلبات بعد</h3></div>'}`;
  const path = k => (k === 'req' ? 'requests' : 'leads');
  $$('[data-wa]', main).forEach(a => a.addEventListener('click', e => {
    if (a.getAttribute('href') === '#') { e.preventDefault(); toast('لا يوجد رقم جوال لهذا المدرب في بياناته الإدارية', 'error'); return; }
    Store.update(`leads/${a.dataset.wa}`, { waSentAt: Date.now(), status: 'done' });
    toast(`افتح المحادثة من واتساب المنصة (${window.ST_CONFIG.platformWhatsapp}) ثم اضغط إرسال`);
  }));
  $$('[data-mail]', main).forEach(b => b.onclick = async () => { await Automation.notify('lead', b.dataset.mail); toast('طُلب إرسال البريد، ويظهر التأكيد عند وصوله'); });
  $$('[data-t]', main).forEach(b => b.onclick = () => { const p = `${path(b.dataset.t)}/${b.dataset.id}`; Store.update(p, { status: Store.get(p)?.status === 'new' ? 'done' : 'new' }); });
  $$('[data-del]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف الطلب؟', { ok: 'حذف', danger: true })) Store.remove(`${path(b.dataset.del)}/${b.dataset.id}`); });
  $$('[data-fw]', main).forEach(b => b.onclick = () => { const r = Store.get(`requests/${b.dataset.fw}`); r && Broadcast.forward(r); });
  $$('[data-fwx]', main).forEach(b => b.onclick = () => Broadcast.revoke(b.dataset.fwx));
  $$('[data-show]', main).forEach(b => b.onclick = () => {
    const r = Store.get(`${path(b.dataset.show)}/${b.dataset.id}`); const t = r.trainerId ? Store.get(`trainers/${r.trainerId}`) : null;
    showcaseEditor(Store.list('showcase').find(x => x.src === r.id) || { src: r.id, title: r.topic, org: r.org, region: r.region || t?.region || '', spec: r.spec || Data.specs(t || {})[0] || '', trainerName: r.trainerName || '', ts: r.ts });
  });
  $('#sa', main).onclick = () => showcaseEditor({ ts: Date.now() });
  $$('[data-se]', main).forEach(b => b.onclick = () => showcaseEditor(Store.get(`showcase/${b.dataset.se}`)));
  $$('[data-sx]', main).forEach(b => b.onclick = () => Store.remove(`showcase/${b.dataset.sx}`));
}

// بطاقة في قسم «من طلبات هذا الشهر» (تُعرض للعامة دون بيانات تواصل)
function showcaseEditor(x) {
  const m = modal(`<h3><i class="fa-solid fa-table-cells-large"></i> بطاقة «من طلبات هذا الشهر»</h3>
    <p class="muted small">تظهر للعامة في الصفحة الرئيسية. لا تُضف بيانات تواصل.</p>
    <form id="sf">
      ${field('موضوع البرنامج *', `<input type="text" name="title" required maxlength="90" value="${esc(x.title || '')}">`)}
      <div class="grid2">
        ${field('الجهة كما تظهر', `<input type="text" name="org" maxlength="60" value="${esc(x.org || '')}" placeholder="اتركه فارغاً لإظهار «جهة تدريبية»">`)}
        ${field('المدرب (اختياري)', `<input type="text" name="trainerName" maxlength="60" value="${esc(x.trainerName || '')}">`)}
        ${field('المنطقة', `<select name="region"><option value="">—</option>${REGIONS.map(r => opt(r.k, r.name, x.region)).join('')}</select>`)}
        ${field('التخصص', `<select name="spec"><option value="">—</option>${SPECIALTIES.map(s => opt(s.k, s.name, x.spec)).join('')}</select>`)}
      </div>
      <button class="btn primary">حفظ وعرض</button>
    </form>`);
  m.$('#sf').onsubmit = e => {
    e.preventDefault();
    const d = formData(e.target);
    const rec = { ...d, src: x.src || '', ts: x.ts || Date.now() };
    if (x.id) Store.update(`showcase/${x.id}`, rec); else Store.push('showcase', rec);
    Security.log('عرض طلب في الرئيسية', d.title); m.close(); toast('تم — يظهر في الصفحة الرئيسية');
  };
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
  main.innerHTML = `<div class="dash-h"><h2>المحتوى العام</h2><button class="btn primary" id="sv"><i class="fa-solid fa-floppy-disk"></i> حفظ كل التغييرات</button></div>
    <div class="banner info"><i class="fa-solid fa-house"></i>محتوى الصفحة الرئيسية وأقسامها يُعدَّل من تبويب «الصفحة الرئيسية»، وحقول نموذج التسجيل من «النماذج».</div>
    ${sec('join', 'التسجيل والرسوم', [['fee', 'الرسوم (ريال)', 'number'], ['feeNote', 'وصف الرسوم'], ['period', 'مدة الاشتراك'], ['requirements', 'المتطلبات', 'area', 'كل متطلب في سطر'], ['benefits', 'المزايا', 'area', 'كل ميزة في سطر بصيغة: العنوان | الوصف'], ['payment', 'تعليمات السداد', 'area'], ['disclaimer', 'إقرار الفرص التدريبية (آخر النموذج ولوحة المدرب)', 'area']])}
    <div id="jpromo"></div>
    ${sec('about', 'عن المنصة', [['intro', 'التعريف', 'area'], ['problem', 'المشكلة', 'area'], ['solution', 'الحل', 'area'], ['vision', 'الرؤية', 'area']])}
    ${sec('halls', 'القاعات', [['intro', 'النص التعريفي', 'area']])}
    ${sec('contact', 'تواصل المنصة (يظهر في التذييل)', [['email', 'البريد', 'email'], ['whatsapp', 'واتساب المنصة'], ['instagram', 'إنستقرام', 'url'], ['x', 'إكس', 'url'], ['linkedin', 'لينكدإن', 'url']])}`;
  joinPromoBox($('#jpromo', main));
  $('#sv', main).onclick = () => {
    const out = {};
    $$('[data-k]', main).forEach(el => { const [k, f] = el.dataset.k.split('.'); (out[k] = out[k] || {})[f] = el.type === 'number' ? Number(el.value) || 0 : el.value.trim(); });
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
  $$('[data-rm]', main).forEach(b => b.onclick = async () => { if (await confirmBox('إزالة صلاحية هذا المشرف؟', { danger: true, ok: 'إزالة' })) { const em = Store.get(`admins/${b.dataset.rm}`)?.email; Security.log('إزالة مشرف', em); Store.remove(`admins/${b.dataset.rm}`); if (em) Store.remove(`adminInvites/${Security.inviteKey(em)}`); } });
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
    for (const t of demo) { await Security.deleteTrainerAccount(t); ['trainers', 'private', 'notes', 'secrets/codes', 'stats/views', 'stats/clicks', 'activity'].forEach(p => Store.remove(`${p}/${t.id}`)); Object.entries(Store.get('slugs') || {}).forEach(([sl, v]) => { if (v === t.id) Store.remove(`slugs/${sl}`); }); }
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
    ['م. فيصل الغامدي', 'Faisal Alghamdi', 'm', 'riyadh', 'الرياض', 'مدرب معتمد في الذكاء الاصطناعي وتحليل البيانات', ['ai-data', 'programming', 'digital'], 'تعلم الآلة للمبتدئين، تحليل البيانات بـ Python، الذكاء الاصطناعي التوليدي في بيئة العمل', 9, 2100, 85, 'deep', ['onsite', 'online']],
    ['أ. نورة القحطاني', 'Noura Alqahtani', 'f', 'eastern', 'الدمام', 'مدربة قيادة وتطوير مؤسسي', ['leadership', 'hr', 'quality'], 'القيادة التحويلية، بناء فرق العمل، إدارة التغيير، التخطيط الاستراتيجي', 14, 3600, 140, 'sage', ['onsite']],
    ['د. عبدالله الحربي', 'Abdullah Alharbi', 'm', 'madinah', 'المدينة المنورة', 'مستشار ومدرب في ريادة الأعمال', ['entrepreneur', 'finance', 'projects'], 'من الفكرة إلى المشروع، دراسات الجدوى، نماذج العمل التجارية، التمويل للمشاريع الناشئة', 11, 2800, 96, 'cream', ['onsite', 'online']],
    ['أ. ريم الشهري', 'Reem Alshehri', 'f', 'asir', 'أبها', 'مدربة مهارات الاتصال وصناعة المحتوى', ['content', 'soft', 'marketing'], 'فن الإلقاء، صناعة المحتوى الرقمي، التسويق عبر وسائل التواصل، العلامة الشخصية', 7, 1500, 60, 'teal', ['online']],
    ['م. خالد العتيبي', 'Khalid Alotaibi', 'm', 'makkah', 'جدة', 'مدرب الأمن السيبراني والتحول الرقمي', ['cyber', 'programming', 'digital'], 'أساسيات الأمن السيبراني، التوعية الأمنية للموظفين، حوكمة التقنية', 10, 1900, 70, 'olive', ['onsite', 'online']],
    ['أ. سارة الدوسري', 'Sarah Aldosari', 'f', 'qassim', 'بريدة', 'مدربة إرشاد مهني ومهارات التوظيف', ['career', 'hr-dev', 'soft'], 'كتابة السيرة الذاتية، اجتياز المقابلات، التخطيط المهني، إدارة الوقت', 6, 1100, 48, 'brand', ['onsite', 'online']],
    ['أ. ماجد الشمري', 'Majed Alshammari', 'm', 'hail', 'حائل', 'مدرب تطوير الذات والتفكير الإبداعي', ['hr-dev', 'innovation', 'education'], 'التفكير الإبداعي، حل المشكلات، الذكاء العاطفي، تصميم الحقائب التدريبية', 12, 3000, 120, 'brand', ['onsite']],
    ['أ. هند المالكي', 'Hind Almalki', 'f', 'tabuk', 'تبوك', 'مدربة خدمة العملاء وتجربة المستفيد', ['customer', 'quality', 'soft'], 'تجربة العميل، التعامل مع العملاء الصعبين، معايير الجودة في الخدمة', 8, 1400, 55, 'sage', ['onsite']]
  ];
  for (const [name, nameEn, gender, region, city, title, specs, topics, years, hours, programs, theme, modes] of D) {
    const code = await Data.nextCode(); const id = code.toLowerCase();
    const rec = { id, code, name, nameEn, gender, region, city, title, specs, topics, years, hours, programs, theme, modes, langs: 'العربية، الإنجليزية',
      bio: `${gender === 'f' ? 'مدربة' : 'مدرب'} سعودي${gender === 'f' ? 'ة' : ''} بخبرة ${years} سنة في التدريب والتطوير، ${gender === 'f' ? 'قدّمت' : 'قدّم'} أكثر من ${programs} برنامجاً تدريبياً لجهات حكومية وخاصة وغير ربحية. (بيانات تجريبية)`,
      certs: 'شهادة إعداد المدربين TOT', status: 'active', featured: years >= 10, demo: true,
      publishedAt: Date.now(), updatedAt: Date.now() };
    rec.slug = Data.makeSlug(rec); Data.claimSlug(rec.slug, id);
    Store.set(`trainers/${id}`, rec);
    Store.set(`private/${id}`, { phone: '966500000000', email: 'demo@example.com' });
  }
  Security.log('إضافة بيانات تجريبية', `${D.length} مدرب`);
}
