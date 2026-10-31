/* فترة التجربة المجانية: شهر يتفعل تلقائياً عند القبول المبدئي (trainers/<id>.plan = 'trial' مع trialStart/trialEnd)،
 * ثم يتحول الحساب إلى الاشتراك الكامل (plan = 'full' أو غياب الحقل) عند تأكيد السداد من الإدارة.
 * خلال التجربة تُقفل ست ميزات: النشر في السوشيال · ملف PDF · الظهور في المثبّتة · مكتبة المدرب · وظائف التدريب · كتابة الأخبار.
 * تظهر المقفلة باهتة في الحساب، وعند الضغط عليها يظهر وصف الميزة وأنها حصرية عند تأكيد الاشتراك الكامل. */
const Trial = (() => {
  const DAYS = 30, DAY = 864e5;
  // الميزات المقفلة: pitch = معرّف الميزة في المحتوى التسويقي المركزي · tab = تبويب لوحة المدرب إن وُجد
  const LOCKED = {
    share: { pitch: 'share', ic: 'fa-share-nodes', name: 'نشر البطاقة والأخبار في السوشيال ميديا' },
    pdf: { pitch: 'pdf', ic: 'fa-file-pdf', name: 'تحميل الملف التعريفي PDF' },
    pin: { pitch: 'pin', ic: 'fa-thumbtack', name: 'الظهور في المثبّتة' },
    lib: { pitch: 'library', ic: 'fa-book-open', name: 'مكتبة المدرب', tab: true },
    opps: { pitch: 'jobs', ic: 'fa-briefcase', name: 'وظائف التدريب', tab: true },
    news: { pitch: 'news', ic: 'fa-newspaper', name: 'كتابة ونشر الأخبار والإنجازات', tab: true }
  };
  // 'trial' جارية · 'expired' انتهت دون سداد · 'full' اشتراك كامل (وهو الافتراضي للحسابات القديمة)
  const plan = t => (t && t.plan === 'trial' ? (t.trialEnd && Date.now() > t.trialEnd ? 'expired' : 'trial') : 'full');
  const locked = t => plan(t) !== 'full';
  const daysLeft = t => Math.max(0, Math.ceil(((t && t.trialEnd) - Date.now()) / DAY));
  const unit = n => (n === 1 ? 'يوم' : n === 2 ? 'يومان' : n <= 10 ? 'أيام' : 'يوماً');
  const fee = () => (Data.content().join || {}).fee || 720;
  const rule = () => `سداد رسوم ${fee()} ريال للسنة الأولى [${Pitch.renew}]`;
  const pit = k => Pitch.byId(LOCKED[k].pitch) || {};
  const waMsg = t => `السلام عليكم، أنا ${t.name} (رقم العضوية ${t.code}) وأرغب بتأكيد اشتراكي الكامل في منصة مدرّبون سعوديّون.`;
  const contactBtn = t => { const wa = window.ST_CONFIG.platformWhatsapp; return wa ? `<a class="btn gold" target="_blank" rel="noopener" href="${esc(waLink(wa, waMsg(t)))}"><i class="fa-brands fa-whatsapp"></i> تأكيد الاشتراك الكامل</a>` : ''; };

  // محتوى الشرح: فكرة الميزة + أنها حصرية عند تأكيد الاشتراك الكامل
  const body = (t, k) => {
    const L = LOCKED[k], p = pit(k), pts = (p.pts || []).filter(Boolean);
    return `<div class="tl-card"><div class="tl-ic"><i class="fa-solid ${L.ic}"></i></div>
      <h2>${esc(p.t || L.name)}</h2><span class="ex-tag"><i class="fa-solid fa-lock"></i> حصرية للمسجلين</span>
      <p class="tl-d">${esc(p.d || p.sd || '')}</p>
      ${pts.length ? `<ul class="tl-pts">${pts.map(x => `<li><i class="fa-solid fa-circle-check"></i>${esc(x)}</li>`).join('')}</ul>` : ''}
      <div class="tl-note"><i class="fa-solid fa-circle-info"></i><div><b>متاحة عند تأكيد الاشتراك الكامل</b><br>${esc(rule())}. ${plan(t) === 'trial' ? `أنت الآن في فترة التجربة المجانية (متبقٍ ${daysLeft(t)} ${unit(daysLeft(t))}) وتتاح لك بقية مزايا المنصة.` : 'انتهت فترة تجربتك المجانية.'}</div></div>
      <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${contactBtn(t)}</div></div>`;
  };
  // صفحة التبويب المقفل (وظائف التدريب · مكتبة المدرب · الأخبار)
  function page(main, t, k) { main.innerHTML = `<div class="dash-h"><h2>${esc(LOCKED[k].name)}</h2></div>${body(t, k)}`; }
  // نافذة الميزة المقفلة غير التبويبية (النشر في السوشيال · PDF · المثبّتة)
  function open(t, k) { const m = modal(`<h3><i class="fa-solid ${LOCKED[k].ic}"></i> ${esc(LOCKED[k].name)}</h3>${body(t, k)}`); return m; }
  const isTab = k => !!(LOCKED[k] && LOCKED[k].tab);

  // شريط حالة التجربة أعلى لوحة المدرب
  function banner(t) {
    const p = plan(t); if (p === 'full') return '';
    if (p === 'expired') return `<div class="banner warn"><i class="fa-solid fa-hourglass-end"></i><div><b>انتهت فترة التجربة المجانية</b><br>بطاقتك غير ظاهرة للزوار حالياً. لإعادة التفعيل وفتح كل المزايا: ${esc(rule())}.</div></div>`;
    return `<div class="banner info trial-b"><i class="fa-solid fa-gift"></i><div><b>فترة تجربة مجانية: متبقٍ <span class="num">${daysLeft(t)}</span> ${unit(daysLeft(t))}</b> (حتى ${esc(fmtDate(t.trialEnd))})<br>تتاح لك كل مزايا الاشتراك عدا الميزات الباهتة أدناه؛ تُفتح عند تأكيد الاشتراك الكامل: ${esc(rule())}.</div></div>`;
  }
  // قائمة الميزات المقفلة غير التبويبية في الصفحة الرئيسية للوحة (باهتة وتُفتح بالضغط)
  function box(t) {
    if (!locked(t)) return '';
    return `<div class="pbox tl-box"><h3><i class="fa-solid fa-lock"></i> مزايا الاشتراك الكامل</h3><p class="muted small">تُفتح بعد تأكيد اشتراكك الكامل. اضغط أي ميزة لمعرفة فكرتها.</p>
      <div class="tl-grid">${Object.keys(LOCKED).map(k => `<button type="button" class="tl-f" data-tl="${k}"><i class="fa-solid ${LOCKED[k].ic}"></i><span>${esc(LOCKED[k].name)}</span><i class="fa-solid fa-lock tl-l"></i></button>`).join('')}</div></div>`;
  }
  function wire(root, t) { $$('[data-tl]', root).forEach(b => b.onclick = () => { const k = b.dataset.tl; if (isTab(k)) { Portal.tab = k; App.render(); } else open(t, k); }); }

  // انتهاء التجربة: الحساب مُعطّل (لا دخول ولا ظهور) والبيانات محفوظة؛ للاستمرار: تفاصيل الاشتراك في البريد أو التواصل مع الإدارة
  const contact = () => { const c = (Data.content().contact || {}), wa = window.ST_CONFIG.platformWhatsapp || c.whatsapp || ''; return { wa, email: c.email || '' }; };
  const expiredMsg = () => { const c = contact(); return `انتهت فترة التجربة المجانية وتعطّل الدخول إلى هذا الحساب وإخفاء ملفك من المنصة (بياناتك محفوظة ولم تُحذف). للاستمرار أكّد اشتراكك ب${rule()}؛ راجع تفاصيل الاشتراك في رسالة القبول بريدك الإلكتروني، أو تواصل مع الإدارة${c.wa ? ' عبر واتساب ' + c.wa : ''}${c.email ? (c.wa ? ' أو' : '') + ' عبر البريد ' + c.email : ''}.`; };
  // صفحة المدرب المنتهية تجربته (إن بقي مسجلاً على جهازه): إشعار وخيارات التواصل بدل اللوحة
  function expiredPage(t) {
    const c = contact();
    return `<div class="wrap"><div class="tl-card" style="margin-top:40px"><div class="tl-ic"><i class="fa-solid fa-hourglass-end"></i></div>
      <h2>انتهت فترة التجربة المجانية</h2>
      <p class="tl-d">أهلاً ${esc(firstName(t.name))}، تعطّل الدخول إلى حسابك وأُخفي ملفك من المنصة. بياناتك محفوظة ولم تُحذف، وتعود فور تأكيد اشتراكك.</p>
      <div class="tl-note"><i class="fa-solid fa-circle-info"></i><div><b>للاستمرار في الاستفادة من المنصة</b><br>${esc(rule())}. تجد تفاصيل الاشتراك وبيانات السداد في رسالة القبول المبدئي على بريدك الإلكتروني، أو تواصل مع الإدارة.</div></div>
      <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${contactBtn(t)}${c.email ? `<a class="btn" href="mailto:${esc(c.email)}"><i class="fa-solid fa-envelope"></i> ${esc(c.email)}</a>` : ''}<button class="btn ghost" onclick="Auth.logout()">خروج</button></div></div></div>`;
  }
  // بدء التجربة: أيام الشهر من الآن
  const fresh = () => { const now = Date.now(); return { plan: 'trial', trialStart: now, trialEnd: now + DAYS * DAY }; };
  return { expiredMsg, expiredPage, unit, DAYS, LOCKED, plan, locked, daysLeft, page, open, isTab, banner, box, wire, fresh, rule };
})();
