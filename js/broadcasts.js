/* إعادة توجيه طلبات «اطلب مدرباً» إلى كل المدربين.
 * - الإدارة: زر «إعادة توجيه للمدربين» على طلب «اطلب مدرباً» ← يُنشأ سجل في broadcasts/ (قراءة لكل مدرب لديه حساب، كتابة للإدارة).
 * - المدرب: إشعار (جرس) داخل لوحته، ونافذة منبثقة عند فتح لوحته إن وُجد طلب لم يطّلع عليه، وتبويب «طلبات عامة» يحفظ كل الطلبات الموجَّهة.
 * حالة «اطّلعت» تُحفظ على جهاز المدرب (localStorage) فلا تحتاج قواعد إضافية. */

const Broadcast = (() => {
  const all = () => Store.list('broadcasts').filter(b => b && b.topic).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const key = id => `st-bc-seen-${id}`;
  const seenTs = id => { try { return Number(localStorage.getItem(key(id)) || 0); } catch { return 0; } };
  const markSeen = id => { try { const m = Math.max(0, ...all().map(b => b.ts || 0)); localStorage.setItem(key(id), String(m)); } catch { /* ignore */ } };
  const unread = id => { const s = seenTs(id); return all().filter(b => (b.ts || 0) > s); };

  /* ---------- بطاقة طلب عام (للمدرب) ---------- */
  function card(b, t) {
    const hasContact = b.contact && (b.phone || b.email || b.person);
    return `<div class="lead bc">
      <span class="ic"><i class="fa-solid fa-bullhorn"></i></span>
      <div><b>${esc(b.org || 'جهة تدريبية')}</b> <span class="pill gold">من الإدارة</span> <small class="muted">${ago(b.ts)}</small>
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

  /* ---------- تبويب «طلبات عامة» ---------- */
  function tab(main, t) {
    const list = all(), fresh = unread(t.id).length;
    main.innerHTML = `<div class="dash-h"><h2>طلبات عامة</h2><span class="muted small">طلبات جهات تدريبية أعادت الإدارة توجيهها لكل المدربين${fresh ? ` · ${fresh} جديد` : ''}</span></div>
      ${list.length ? list.map(b => card(b, t)).join('') : '<div class="empty"><i class="fa-solid fa-bullhorn"></i><h3>لا توجد طلبات عامة بعد</h3><p>حين تعيد الإدارة توجيه طلب من جهة تدريبية إلى المدربين يظهر هنا ويُحفظ.</p></div>'}`;
    markSeen(t.id);
    // تحديث الشارات فوراً دون إعادة رسم الصفحة
    $$('[data-tab="bc"] .badge').forEach(x => x.remove());
    const bell = $('#bell'), n = Store.list('leads').filter(l => l.trainerId === t.id && l.status === 'new').length;
    if (bell) { bell.querySelector('.bdg')?.remove(); if (n) bell.insertAdjacentHTML('beforeend', `<span class="bdg num">${n}</span>`); }
  }

  /* ---------- الإشعارات (الجرس) ---------- */
  function notifications(t, go) {
    const un = unread(t.id), newLeads = Store.list('leads').filter(l => l.trainerId === t.id && l.status === 'new').length, recent = all().slice(0, 8), seen = seenTs(t.id);
    const m = modal(`<h3><i class="fa-solid fa-bell"></i> الإشعارات</h3>
      ${newLeads ? `<button class="bc-row" data-go="leads"><i class="fa-solid fa-inbox"></i><span><b>${newLeads} ${newLeads === 1 ? 'طلب تواصل جديد' : 'طلبات تواصل جديدة'}</b><small>موجّهة إليك من صفحتك</small></span></button>` : ''}
      ${recent.map(b => `<button class="bc-row ${(b.ts || 0) > seen ? 'new' : ''}" data-go="bc"><i class="fa-solid fa-bullhorn"></i><span><b>${esc(b.topic)}</b><small>${esc(b.org || 'جهة تدريبية')} · ${ago(b.ts)}</small></span></button>`).join('')}
      ${!newLeads && !recent.length ? '<p class="muted center">لا إشعارات حالياً.</p>' : ''}
      ${un.length ? `<p class="small muted">${un.length} طلب عام لم تطّلع عليه.</p>` : ''}`);
    $$('[data-go]', m.el).forEach(b => b.onclick = () => { m.close(); go(b.dataset.go); });
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
      <p class="muted small">يظهر في لوحة كل مدرب كإشعار ونافذة منبثقة عند دخوله، ويُحفظ في تبويب «طلبات عامة» داخل حسابه. عدد المدربين الظاهرين حالياً: <b class="num">${trainers}</b>.</p>
      <div class="pbox" style="margin:0 0 10px"><b>${esc(r.org || 'جهة تدريبية')}</b><br><span class="small">${esc(r.topic)}${r.spec ? ` · ${esc(specName(r.spec))}` : ''}${r.region ? ` · ${esc(regionName(r.region))}` : ''}</span></div>
      <form id="bf" style="display:grid;gap:10px">
        <label class="chk"><input type="checkbox" name="contact"><span>إظهار بيانات التواصل (الاسم والجوال والبريد) للمدربين <small class="muted">— الافتراضي إخفاؤها وإبقاؤها لدى الإدارة</small></span></label>
        ${field('ملاحظة من الإدارة (اختياري)', '<textarea name="note" maxlength="500" placeholder="مثال: الطلب عاجل، ويُفضّل التقديم خلال أسبوع"></textarea>')}
        <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit"><i class="fa-solid fa-share"></i> إعادة التوجيه الآن</button></div>
      </form>`);
    $('#bf', m.el).onsubmit = e => {
      e.preventDefault(); const f = e.target, inc = f.contact.checked;
      const rec = { ts: Date.now(), requestId: r.id, org: r.org || '', topic: r.topic || '', when: r.when || '', msg: r.msg || '', note: f.note.value.trim(), spec: r.spec || '', region: r.region || '', size: Number(r.size) || 0, contact: inc };
      if (inc) { rec.person = r.person || ''; rec.phone = r.phone || ''; rec.email = r.email || ''; }
      Store.push('broadcasts', rec); Security.log('إعادة توجيه طلب للمدربين', r.org || r.topic);
      toast('أُعيد توجيه الطلب لكل المدربين'); m.close();
    };
  }
  async function revoke(requestId) {
    const b = forwarded(requestId); if (!b) return;
    if (!await confirmBox('إلغاء توجيه هذا الطلب؟ يختفي من لوحات المدربين وتبويب «طلبات عامة» لديهم.', { ok: 'إلغاء التوجيه', danger: true })) return;
    Store.remove(`broadcasts/${b.id}`); Security.log('إلغاء توجيه طلب', b.org || b.topic);
  }

  return { all, unread, card, tab, notifications, popup, forward, revoke, forwarded, markSeen };
})();
