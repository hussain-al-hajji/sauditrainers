/* إعادة توجيه طلبات «اطلب مدرباً» إلى كل المدربين.
 * - الإدارة: زر «إعادة توجيه للمدربين» على طلب «اطلب مدرباً» ← يُنشأ سجل في broadcasts/ (قراءة لكل مدرب لديه حساب، كتابة للإدارة).
 * - المدرب: إشعار (جرس) داخل لوحته، ونافذة منبثقة عند فتح لوحته إن وُجد طلب لم يطّلع عليه، وتبويب «طلبات عامة» يحفظ كل الطلبات الموجَّهة.
 * حالة «اطّلعت» تُحفظ على جهاز المدرب (localStorage) فلا تحتاج قواعد إضافية. */

const Broadcast = (() => {
  const all = () => Store.list('broadcasts').filter(b => b && b.topic).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const key = id => `st-bc-seen-${id}`;
  const seenTs = id => { try { return Number(localStorage.getItem(key(id)) || 0); } catch { return 0; } };
  const markSeen = id => { try { const m = Math.max(0, ...all().map(b => b.ts || 0)); localStorage.setItem(key(id), String(m)); } catch { /* ignore */ } };
  // إشعارات الموقع (notices/<id>): مثل «اختيرت بطاقتك للتثبيت 24 ساعة»
  const notices = id => Object.values(Store.get(`notices/${id}`) || {}).filter(n => n && n.title).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const noticesNew = id => notices(id).filter(n => !n.read).length;
  const unread = id => { const s = seenTs(id); return all().filter(b => (b.ts || 0) > s); };

  /* ---------- بطاقة طلب عام (للمدرب) ---------- */
  function card(b, t) {
    const hasContact = b.contact && (b.phone || b.email || b.person);
    return `<div class="lead bc">
      <span class="ic"><i class="fa-solid fa-bullhorn"></i></span>
      <div><b>${esc(b.org || 'جهة تدريبية')}</b> <span class="pill gold">طلب عبر الموقع، أُعيد توجيهه للمدربين</span> <small class="muted">${ago(b.ts)}</small>
        <p><b>الموضوع:</b> ${esc(b.topic)}${b.spec ? ` · <b>التخصص:</b> ${esc(specName(b.spec))}` : ''}${b.region ? ` · <b>المنطقة:</b> ${esc(regionName(b.region))}` : ''}${b.size ? ` · <b class="num">${esc(b.size)}</b> متدرب` : ''}${b.when ? ` · <b>الموعد:</b> ${esc(b.when)}` : ''}</p>
        ${b.msg ? `<p>${nl2br(b.msg)}</p>` : ''}
        ${b.note ? `<p class="small"><i class="fa-solid fa-circle-info"></i> <b>ملاحظة الإدارة:</b> ${nl2br(b.note)}</p>` : ''}
        ${hasContact ? `<p class="small"><b>للتواصل:</b> ${esc(b.person || '')} ${b.phone ? `· <span class="num" dir="ltr">${esc(b.phone)}</span>` : ''} ${b.email ? `· ${esc(b.email)}` : ''}</p>`
          : '<p class="small muted"><i class="fa-solid fa-lock"></i> بيانات الجهة تحتفظ بها الإدارة؛ إن رغبت بالترشح لهذا الطلب فتواصل مع إدارة المنصة.</p>'}
      </div>
      ${hasContact ? `<div class="acts" style="flex-direction:column">
        ${b.phone ? `<a class="btn sm primary" target="_blank" rel="noopener" href="${esc(waLink(b.phone, `السلام عليكم ${b.person || ''}، معك ${t.name} بخصوص طلبكم عبر منصة مدرّبون سعوديّون: ${b.topic}`))}"><i class="fa-brands fa-whatsapp"></i> واتساب</a>` : ''}
        ${b.email ? `<a class="btn sm" href="mailto:${esc(b.email)}"><i class="fa-solid fa-envelope"></i> بريد</a>` : ''}
      </div>` : ''}
    </div>`;
  }

  /* ---------- تبويب «طلبات عامة»: كل الإعلانات في مكان واحد ----------
   * (1) طلبات جهات وصلت المنصة وأعادت الإدارة توجيهها للمدربين، (2) فرص وإعلانات تنشرها الإدارة من محتوى الإنترنت. */
  const V = { f: 'all' };
  function tab(main, t) {
    const adIds = new Set(Opps.unreadAds(t.id).map(o => o.id)), bcSeen = seenTs(t.id), fresh = unread(t.id).length + adIds.size;
    const items = [...all().map(b => ({ k: 'req', ts: b.ts || 0, b })), ...Opps.approved().map(o => ({ k: 'net', ts: o.ts || 0, o }))].filter(x => V.f === 'all' || x.k === V.f).sort((a, b) => b.ts - a.ts);
    const nReq = all().length, nNet = Opps.approved().length;
    const chip = (k, l, n) => `<button type="button" class="chip ${V.f === k ? 'on' : ''}" data-f="${k}">${l} <small class="num">(${n})</small></button>`;
    main.innerHTML = `<div class="dash-h"><h2>طلبات عامة</h2><span class="muted small">طلبات جهات أعادت الإدارة توجيهها لكل المدربين، وإعلانات تنشرها الإدارة من محتوى الإنترنت${fresh ? ` · ${fresh} جديد` : ''}</span></div>
      <div class="chips" style="margin-bottom:12px">${chip('all', 'الكل', nReq + nNet)}${chip('req', '<i class="fa-solid fa-bullhorn"></i> طلبات عبر الموقع', nReq)}${chip('net', '<i class="fa-solid fa-globe"></i> من محتوى الإنترنت', nNet)}</div>
      ${items.length ? items.map(x => (x.k === 'req' ? card(x.b, t).replace('class="lead bc"', `class="lead bc ${(x.b.ts || 0) > bcSeen ? 'new' : ''}"`) : Opps.card(x.o, adIds.has(x.o.id), '<span class="pill info"><i class="fa-solid fa-globe"></i> من محتوى الإنترنت</span> '))).join('') : '<div class="empty"><i class="fa-solid fa-bullhorn"></i><h3>لا توجد إعلانات بعد</h3><p>تظهر هنا طلبات الجهات التي تعيد الإدارة توجيهها، والإعلانات التي تنشرها من الإنترنت، وتبقى محفوظة.</p></div>'}`;
    $$('[data-f]', main).forEach(b => b.onclick = () => { V.f = b.dataset.f; tab(main, t); });
    markSeen(t.id); Opps.markAdsSeen(t.id);
    // تحديث الشارات فوراً دون إعادة رسم الصفحة
    $$('[data-tab="bc"] .badge', document).forEach(x => x.remove());
    const bell = $('#bell'), n = Store.list('leads').filter(l => l.trainerId === t.id && l.status === 'new').length + noticesNew(t.id);
    if (bell) { bell.querySelector('.bdg')?.remove(); if (n) bell.insertAdjacentHTML('beforeend', `<span class="bdg num">${n}</span>`); }
  }

  /* ---------- الإشعارات (الجرس) ---------- */
  function notifications(t, go) {
    const un = unread(t.id), newLeads = Store.list('leads').filter(l => l.trainerId === t.id && l.status === 'new').length, recent = all().slice(0, 8), seen = seenTs(t.id);
    const ns = notices(t.id).slice(0, 10);
    const m = modal(`<h3><i class="fa-solid fa-bell"></i> الإشعارات</h3>
      ${ns.map(n => `<div class="bc-row ${n.read ? '' : 'new'}" data-nid="${esc(n.id)}"><i class="fa-solid ${n.kind === 'pin' ? 'fa-thumbtack' : 'fa-circle-info'}"></i><span><b>${esc(n.title)}</b><small>${esc(n.body || '')} · ${ago(n.ts)}</small></span></div>`).join('')}
      ${newLeads ? `<button class="bc-row" data-go="leads"><i class="fa-solid fa-inbox"></i><span><b>${newLeads} ${newLeads === 1 ? 'طلب تواصل جديد' : 'طلبات تواصل جديدة'}</b><small>موجّهة إليك من صفحتك</small></span></button>` : ''}
      ${recent.map(b => `<button class="bc-row ${(b.ts || 0) > seen ? 'new' : ''}" data-go="bc"><i class="fa-solid fa-bullhorn"></i><span><b>${esc(b.topic)}</b><small>${esc(b.org || 'جهة تدريبية')} · ${ago(b.ts)}</small></span></button>`).join('')}
      ${!newLeads && !recent.length && !ns.length ? '<p class="muted center">لا إشعارات حالياً.</p>' : ''}
      ${un.length ? `<p class="small muted">${un.length} طلب عام لم تطّلع عليه.</p>` : ''}`);
    $$('[data-go]', m.el).forEach(b => b.onclick = () => { m.close(); go(b.dataset.go); });
    // فتح نافذة الإشعارات يعدّ إشعارات الموقع مقروءة
    ns.filter(n => !n.read).forEach(n => Store.update(`notices/${t.id}/${n.id}`, { read: true }));
    const bell = $('#bell'); if (bell) { const left = Store.list('leads').filter(l => l.trainerId === t.id && l.status === 'new').length; bell.querySelector('.bdg')?.remove(); if (left) bell.insertAdjacentHTML('beforeend', `<span class="bdg num">${left}</span>`); }
  }

  /* ---------- نافذة منبثقة عند فتح اللوحة (مرة لكل مجموعة طلبات جديدة في الجلسة) ---------- */
  function popup(t, go) {
    const un = unread(t.id); if (!un.length || document.querySelector('.modal-back')) return;
    const k = `st-bc-pop-${t.id}`, top = String(un[0].ts || 0);
    try { if (sessionStorage.getItem(k) === top) return; sessionStorage.setItem(k, top); } catch { /* ignore */ }
    const m = modal(`<h3><i class="fa-solid fa-bullhorn"></i> ${un.length === 1 ? 'طلب جديد من جهة تدريبية' : `${un.length} طلبات جديدة من جهات تدريبية`}</h3>
      <p class="muted small">أعادت الإدارة توجيه هذا الطلب إلى كل المدربين، وهو محفوظ لك في تبويب «طلبات عامة».</p>
      ${un.slice(0, 3).map(b => `<div class="bc-pop"><b>${esc(b.topic)}</b><small>${esc(b.org || 'جهة تدريبية')}${b.region ? ' · ' + esc(regionName(b.region)) : ''}${b.spec ? ' · ' + esc(specName(b.spec)) : ''} · ${ago(b.ts)}</small></div>`).join('')}
      ${un.length > 3 ? `<p class="small muted">و${un.length - 3} طلبات أخرى…</p>` : ''}
      <div class="row end"><button class="btn ghost" data-close>لاحقاً</button><button class="btn primary" data-open><i class="fa-solid fa-eye"></i> عرض الطلبات</button></div>`);
    $('[data-open]', m.el).onclick = () => { m.close(); go('bc'); };
  }

  /* ---------- للإدارة ---------- */
  const forwarded = requestId => all().find(b => b.requestId === requestId);
  function forward(r) {
    const trainers = Store.list('trainers').filter(t => Data.isLive(t)).length;
    const m = modal(`<h3><i class="fa-solid fa-share"></i> إعادة توجيه الطلب لكل المدربين</h3>
      <p class="muted small">يظهر في لوحة كل مدرب (مع بيانات تواصل الجهة) كإشعار ونافذة منبثقة عند دخوله، ويُحفظ في تبويب «طلبات عامة» داخل حسابه. عدد المدربين الظاهرين حالياً: <b class="num">${trainers}</b>.</p>
      <div class="pbox" style="margin:0 0 10px"><b>${esc(r.org || 'جهة تدريبية')}</b><br><span class="small">${esc(r.topic)}${r.spec ? ` · ${esc(specName(r.spec))}` : ''}${r.region ? ` · ${esc(regionName(r.region))}` : ''}</span></div>
      <form id="bf" style="display:grid;gap:10px">
        <p class="small"><i class="fa-solid fa-address-card"></i> يُمرَّر الطلب كاملاً إلى المدربين بما فيه بيانات تواصل الجهة (الاسم والجوال والبريد) ليتواصلوا معها مباشرة.${r.person || r.phone || r.email ? '' : ' <b>لا توجد بيانات تواصل في هذا الطلب.</b>'}</p>
        ${field('ملاحظة من الإدارة (اختياري)', '<textarea name="note" maxlength="500" placeholder="مثال: الطلب عاجل، ويُفضّل التقديم خلال أسبوع"></textarea>')}
        <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit"><i class="fa-solid fa-share"></i> إعادة التوجيه الآن</button></div>
      </form>`);
    $('#bf', m.el).onsubmit = e => {
      e.preventDefault(); const f = e.target, inc = true;
      const rec = { ts: Date.now(), requestId: r.id, org: r.org || '', topic: r.topic || '', when: r.when || '', msg: r.msg || '', note: f.note.value.trim(), spec: r.spec || '', region: r.region || '', size: Number(r.size) || 0, contact: inc };
      if (inc) { rec.person = r.person || ''; rec.phone = r.phone || ''; rec.email = r.email || ''; }
      const bid = Store.push('broadcasts', rec); Security.log('إعادة توجيه طلب للمدربين', r.org || r.topic); Automation.notify('push', `b:${bid}`);
      toast('أُعيد توجيه الطلب لكل المدربين'); m.close();
    };
  }
  async function revoke(requestId) {
    const b = forwarded(requestId); if (!b) return;
    if (!await confirmBox('إلغاء توجيه هذا الطلب؟ يختفي من لوحات المدربين وتبويب «طلبات عامة» لديهم.', { ok: 'إلغاء التوجيه', danger: true })) return;
    Store.remove(`broadcasts/${b.id}`); Security.log('إلغاء توجيه طلب', b.org || b.topic);
  }

  return { all, unread, noticesNew, card, tab, notifications, popup, forward, revoke, forwarded, markSeen };
})();
