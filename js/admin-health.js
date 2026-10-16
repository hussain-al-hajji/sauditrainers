/* لوحة الإدارة ← «صحة الموقع»: بطاقة واحدة تجمع حالة النشر، جلب الوظائف، رصيد البريد، أجهزة الإشعارات، النسخ الاحتياطي، والأخطاء الحديثة.
 * تُغذّيها Maintenance.gs (health/status كل ساعة، health/errors، health/backup، health/cleanup)؛ زر «تحديث الآن» يطلب لقطة فورية. */
const HealthUI = { live: null };

function healthData() {
  const st = Store.get('health/status') || {}, bk = Store.get('health/backup') || null, cl = Store.get('health/cleanup') || null;
  const errs = Object.values(Store.get('health/errors') || {}).filter(e => e && e.msg).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const opps = Store.get('settings/opps') || {}, last = opps.lastRun || null;
  return { st, bk, cl, errs, opps, last };
}
// التنبيهات: [مستوى 'bad'|'warn', نص]
function healthAlerts() {
  const { st, bk, errs, opps, last } = healthData(), now = Date.now(), A = [];
  const runs = r => (r && r.runs) || [], failed = r => runs(r).find(x => x.status === 'completed' && x.conclusion === 'failure');
  const top = r => runs(r)[0];
  if (top(st.src) && top(st.src).status === 'completed' && top(st.src).conclusion === 'failure') A.push(['bad', 'آخر تشغيل لـ«نشر الموقع» في المستودع الخاص فشل']);
  if (top(st.pub) && top(st.pub).status === 'completed' && top(st.pub).conclusion === 'failure') A.push(['bad', 'آخر نشر في GitHub Pages فشل (أعد تشغيله من Actions في المستودع العام)']);
  if (st.mailLeft != null && st.mailLeft >= 0 && st.mailLimit && st.mailLeft / st.mailLimit < 0.2) A.push([st.mailLeft === 0 ? 'bad' : 'warn', `رصيد البريد اليومي قارب النفاد (متبقٍ ${st.mailLeft})`]);
  if (!st.ts) A.push(['warn', 'لا توجد لقطة صحة بعد: شغّل setupMaintenanceTriggers() في Apps Script']);
  else if (now - st.ts > 3 * 36e5) A.push(['warn', 'لقطة الصحة قديمة (أكثر من 3 ساعات): تحقق من مشغّل refreshHealth']);
  if (st.ts && (!bk || now - (bk.ts || 0) > 9 * 864e5)) A.push(['warn', 'لا توجد نسخة احتياطية حديثة (أكثر من 9 أيام)']);
  if (opps.jobs === true && last && now - (last.ts || 0) > ((Number(opps.jobDays) || 1) + 2) * 864e5) A.push(['warn', 'جلب الوظائف متأخر عن موعده']);
  const recent = errs.filter(e => now - (e.ts || 0) < 864e5).length; if (recent) A.push(['warn', `${recent} خطأ في آخر 24 ساعة`]);
  const need = ['refreshHealth', 'weeklyBackup', 'dailyCleanup'], have = st.triggers || [];
  if (st.ts && need.some(n => !have.includes(n))) A.push(['warn', 'مشغّلات الصيانة غير مكتملة: شغّل setupMaintenanceTriggers()']);
  return A;
}

function aHealth(main) {
  const { st, bk, cl, errs, opps, last } = healthData(), A = healthAlerts(), now = Date.now();
  const when = ts => (ts ? `${ago(ts)} <small class="muted">(${new Date(ts).toLocaleString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})</small>` : '<span class="muted">—</span>');
  const runLine = (title, r) => {
    const x = r && r.runs && r.runs[0];
    if (!r) return `<div class="hl-row"><b>${title}</b><span class="muted">لا بيانات</span></div>`;
    if (r.error) return `<div class="hl-row"><b>${title}</b><span class="muted">${esc(r.error)}</span></div>`;
    if (!x) return `<div class="hl-row"><b>${title}</b><span class="muted">لا تشغيلات</span></div>`;
    const ok = x.status === 'completed' ? x.conclusion === 'success' : null, tone = ok === null ? 'wait' : ok ? 'ok' : 'bad', lbl = ok === null ? 'قيد التنفيذ' : ok ? 'نجح' : (x.conclusion === 'failure' ? 'فشل' : x.conclusion || 'انتهى');
    return `<div class="hl-row"><b>${title}</b><span><span class="hl-pill ${tone}">${lbl}</span> ${when(x.at)}</span></div>`;
  };
  const mailUsed = st.mailLeft >= 0 && st.mailLimit ? st.mailLimit - st.mailLeft : null;
  const tile = (ic, label, val, sub = '') => `<div class="hl-tile"><i class="fa-solid ${ic}"></i><b class="num">${val}</b><span>${label}</span>${sub ? `<small class="muted">${sub}</small>` : ''}</div>`;
  const live = HealthUI.live;
  main.innerHTML = `<div class="dash-h"><h2>صحة الموقع</h2><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" id="hl-ref"><i class="fa-solid fa-rotate"></i> تحديث الآن</button></div></div>
    <div class="pbox hl-top ${A.some(a => a[0] === 'bad') ? 'bad' : A.length ? 'warn' : 'ok'}"><h3><i class="fa-solid fa-heart-pulse"></i> ${A.length ? `${A.length} تنبيه يحتاج انتباهك` : 'كل شيء يعمل بشكل سليم'}</h3>
      ${A.length ? `<ul class="hl-al">${A.map(a => `<li class="${a[0]}"><i class="fa-solid ${a[0] === 'bad' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}"></i> ${esc(a[1])}</li>`).join('')}</ul>` : '<p class="muted small">النشر والبريد والنسخ الاحتياطي والمشغّلات ضمن الحدود الطبيعية.</p>'}
      <p class="small muted" style="margin-top:8px">آخر لقطة: ${st.ts ? when(st.ts) : '—'}${live ? ` · ${live}` : ''}</p></div>
    <div class="hl-grid">
      ${tile('fa-envelope', 'رصيد البريد المتبقي اليوم', st.mailLeft >= 0 ? st.mailLeft : '—', mailUsed != null ? `استُهلك ${mailUsed} من ${st.mailLimit}` : '')}
      ${tile('fa-bell', 'أجهزة الإشعارات', st.pushDevices ?? '—', st.pushTrainers != null ? `${st.pushTrainers} مدرب` : '')}
      ${tile('fa-briefcase', 'آخر جلب للوظائف', last && last.ts ? ago(last.ts) : '—', opps.jobs === true ? (last ? `${last.jobs || 0} جديدة` : '') : 'الجلب غير مفعّل')}
      ${tile('fa-database', 'آخر نسخة احتياطية', bk && bk.ts ? ago(bk.ts) : '—', bk ? `${Math.round((bk.bytes || 0) / 1024)} KB · ${bk.kept || 0} نسخ محفوظة` : 'لم تُنشأ بعد')}
    </div>
    <div class="pbox"><h3><i class="fa-solid fa-cloud-arrow-up"></i> النشر</h3>
      ${runLine('نشر الموقع (المستودع الخاص)', st.src)}${runLine('GitHub Pages (المستودع العام)', st.pub)}
      ${bk && bk.url ? `<div class="hl-row"><b>ملف آخر نسخة احتياطية</b><a href="${esc(bk.url)}" target="_blank" rel="noopener">${esc(bk.name || 'فتح في Drive')}</a></div>` : ''}
      ${cl ? `<div class="hl-row"><b>آخر تنظيف دوري</b><span>${when(cl.ts)} <small class="muted">حُذف: ${(cl.links || 0) + (cl.reviews || 0)} رابط/توصية · ${cl.jobs || 0} وظيفة · ${cl.push || 0} جهاز · ${cl.activity || 0} نشاط</small></span></div>` : ''}</div>
    <div class="pbox"><div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0"><i class="fa-solid fa-bug"></i> أخطاء حديثة <small class="num muted">(${errs.length})</small></h3>${errs.length ? '<button class="btn sm ghost" id="hl-clr"><i class="fa-solid fa-trash"></i> مسح السجل</button>' : ''}</div>
      ${errs.length ? errs.slice(0, 15).map(e => `<div class="lead"><span class="ic"><i class="fa-solid fa-triangle-exclamation"></i></span><div><b dir="ltr">${esc(e.where || '')}</b> <small class="muted">${when(e.ts)}</small><p class="small" dir="auto">${esc(e.msg)}</p></div></div>`).join('') : '<p class="muted small" style="margin-top:10px">لا أخطاء مسجّلة.</p>'}</div>`;
  $('#hl-ref', main).onclick = async e => { const b = e.currentTarget; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التحديث'; await Automation.notify('health', 'now'); setTimeout(() => { if ($('#hl-ref', main)) aHealth(main); }, 6000); };
  $('#hl-clr', main) && ($('#hl-clr', main).onclick = async () => { if (await confirmBox('مسح سجل الأخطاء؟', { ok: 'مسح', danger: true })) Store.remove('health/errors'); });
  // هل النسخة المفتوحة هي آخر نسخة منشورة؟
  if (HealthUI.live == null) { HealthUI.live = ''; fetch(`index.html?cb=${Date.now()}`, { cache: 'no-store' }).then(r => r.text()).then(t => { const v = (t.match(/css\/style\.css\?v=([0-9-]+)/) || [])[1], mine = (document.querySelector('link[href*="style.css?v="]')?.href.match(/v=([0-9-]+)/) || [])[1]; HealthUI.live = v ? (v === mine ? 'نسخة الموقع المنشورة: ' + v : `يوجد إصدار أحدث (${v}) — حدّث الصفحة`) : ''; if ($('#hl-ref', main)) aHealth(main); }).catch(() => {}); }
}
