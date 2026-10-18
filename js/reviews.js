/* «مراجعات وتوصيات» للمدرب:
 * - تظهر في صفحته العامة (المعتمدة فقط): reviewsPub/<trainerId>/<id>
 * - يضيف المدرب توصية بنفسه (src=self)، أو يولّد «رابط توصية» خاصاً بكل طلب يرسله لجهة خارجية (reviewLinks/<token>)
 *   فتكتب توصيتها دون حساب في #/recommend/<token> → تصل «بانتظار الموافقة» في reviews/<token> (رمز الرابط هو معرّف التوصية فلا تتكرر)،
 *   ولا تُنشر إلا بعد موافقة المدرب (src=link). بيانات تواصل الكاتب الاختيارية يراها المدرب والإدارة فقط. */
const Reviews = (() => {
  const DAYS = 30, MAXSHOW = 6;
  const pubOf = tid => Object.values(Store.get(`reviewsPub/${tid}`) || {}).filter(r => r && r.text).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const pendingOf = tid => Store.list('reviews').filter(r => r && r.trainerId === tid && r.status === 'pending').sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const linksOf = tid => Store.list('reviewLinks').filter(l => l && l.trainerId === tid).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const dateOf = ts => new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
  const stars = n => (n > 0 ? `<span class="rv-st" aria-label="${n} من 5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '');
  const token = () => { const a = new Uint8Array(24); crypto.getRandomValues(a); const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; return [...a].map(x => c[x % c.length]).join(''); };
  const linkUrl = tk => `${siteBase()}#/recommend/${tk}`;
  // حتى 3 روابط (https) مع التوصية
  const linkInputs = (cur = []) => `<div class="field"><span>روابط مرفقة (اختياري، حتى 3)</span>${[0, 1, 2].map(i => `<input type="url" name="lk${i}" dir="ltr" maxlength="500" placeholder="https://…" value="${esc(cur[i]?.url || '')}" style="margin-top:6px">`).join('')}</div>`;
  const readLinks = f => { const out = []; for (let i = 0; i < 3; i++) { const v = (f[`lk${i}`]?.value || '').trim(); if (!v) continue; if (!/^https:\/\/[^\s]+\.[^\s]+$/i.test(v)) return null; if (!out.some(x => x.url === v)) out.push({ url: v }); } return out; };
  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const linkList = r => { const a = Array.isArray(r.links) ? r.links : Object.values(r.links || {}); return a.length ? `<div class="rv-links">${a.filter(l => l && /^https:\/\//.test(l.url || '')).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener nofollow ugc"><i class="fa-solid fa-link"></i> ${esc(hostOf(l.url))}</a>`).join('')}</div>` : ''; };
  const who = r => [r.role, r.org].filter(Boolean).map(esc).join(' · ');

  function card(r) {
    return `<figure class="rv"><blockquote>${esc(r.text)}</blockquote>${linkList(r)}
      <figcaption><b>${esc(r.name)}</b>${who(r) ? `<small>${who(r)}</small>` : ''}<span class="rv-meta">${stars(Number(r.rating) || 0)}</span></figcaption></figure>`;
  }

  /* ---------- الصفحة العامة للمدرب ---------- */
  function profileBox(t) {
    const list = pubOf(t.id); if (!list.length) return '';
    return `<div class="pbox reveal rvbox"><h3><i class="fa-solid fa-star"></i>مراجعات وتوصيات <small class="muted num">(${list.length})</small></h3>
      <div class="rv-list">${list.map((r, i) => card(r).replace('<figure class="rv"', `<figure class="rv${i >= MAXSHOW ? ' extra' : ''}"`)).join('')}</div>
      ${list.length > MAXSHOW ? `<p style="margin-top:10px"><button type="button" class="btn sm ghost" onclick="this.closest('.rvbox').classList.add('all');this.remove()">عرض المزيد (${list.length - MAXSHOW})</button></p>` : ''}</div>`;
  }

  /* ---------- صفحة الكتابة للجهات (بلا حساب): #/recommend/<token> ---------- */
  const Page = {
    dark: true, static: true,   // لا تُعاد رسم الصفحة عند تغيّر البيانات (حتى لا تضيع حالة النموذج)
    state: null,
    render(_p, tk) {
      const wrap = inner => `<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / توصية</div><h1>اكتب توصية</h1></div></section><div class="wrap" style="margin:28px auto 60px;max-width:680px" id="rvp">${inner}</div>`;
      this.state = { tk, link: null, t: null, done: false };
      return wrap('<div class="empty"><i class="fa-solid fa-spinner fa-spin"></i><h3>جارٍ التحميل…</h3></div>');
    },
    async mount(root, _p, tk) {
      const host = $('#rvp', root), S = this.state, bad = msg => { host.innerHTML = `<div class="empty"><i class="fa-solid fa-link-slash"></i><h3>${msg}</h3><p>اطلب من المدرب رابطاً جديداً.</p></div>`; };
      if (!/^[A-Za-z0-9]{20,40}$/.test(tk || '')) return bad('الرابط غير صالح');
      const link = await Store.readOnce(`reviewLinks/${tk}`);
      if (!link || !link.trainerId) return bad('الرابط غير صالح أو انتهت صلاحيته');
      if ((link.exp || 0) < Date.now()) return bad('انتهت صلاحية هذا الرابط');
      const t = Store.get(`trainers/${link.trainerId}`) || await Store.readOnce(`trainers/${link.trainerId}`);
      if (!t) return bad('تعذّر العثور على المدرب');
      S.link = link; S.t = t;
      host.innerHTML = `<div class="pbox"><div class="row" style="gap:14px;align-items:center;margin-bottom:12px">${Card.avatar(t, 'av')}<div><b style="font-size:1.15rem">${esc(t.name)}</b><div class="muted small">${esc(t.title || '')}</div></div></div>
        <p class="muted small">شاركنا رأيك بإيجاز عن تجربتك مع المدرب. تُنشر توصيتك في صفحته بعد موافقته، ولا تحتاج إلى حساب.</p>
        <form id="rvf" style="display:grid;gap:12px;margin-top:10px" autocomplete="off">
          ${field('الاسم', '<input name="name" required minlength="3" maxlength="60" placeholder="اسمك الكامل">')}
          <div class="row" style="gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:200px">${field('الجهة (اختياري)', '<input name="org" maxlength="100" placeholder="اسم الشركة أو الجهة">')}</div><div style="flex:1;min-width:200px">${field('صفتك (اختياري)', '<input name="role" maxlength="80" placeholder="مثال: مدير التدريب / متدرب">')}</div></div>
          ${field('توصيتك', '<textarea name="text" required rows="5" minlength="20" maxlength="800" placeholder="اكتب ما تراه عن أسلوبه وخبرته وتجربتك معه…"></textarea>', '<span id="rvc">0</span> / 800 (20 حرفاً على الأقل)')}
          <div><b class="small">التقييم (اختياري)</b><div class="rv-pick" id="rvr">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-r="${n}" aria-label="${n}">☆</button>`).join('')}</div></div>
          ${linkInputs()}
          ${field('وسيلة تواصل (اختياري، لا تُنشر)', '<input name="contact" maxlength="120" dir="ltr" placeholder="بريد أو جوال - يراه المدرب فقط للتأكد منك">')}
          <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none" aria-hidden="true">
          <div class="row end"><button class="btn primary" type="submit"><i class="fa-solid fa-paper-plane"></i> إرسال التوصية</button></div>
        </form></div>`;
      let rating = 0;
      const paint = () => $$('#rvr button', host).forEach(b => { b.textContent = +b.dataset.r <= rating ? '★' : '☆'; b.classList.toggle('on', +b.dataset.r <= rating); });
      $$('#rvr button', host).forEach(b => b.onclick = () => { rating = rating === +b.dataset.r ? 0 : +b.dataset.r; paint(); });
      const ta = $('textarea[name=text]', host); ta.oninput = () => { $('#rvc', host).textContent = ta.value.length; };
      $('#rvf', host).onsubmit = async e => {
        e.preventDefault(); const f = e.target, btn = $('button[type=submit]', f);
        if (f.website.value) { host.innerHTML = '<div class="empty"><i class="fa-solid fa-circle-check"></i><h3>شكراً لك</h3></div>'; return; }   // فخ للروبوتات
        const rec = { id: tk, trainerId: link.trainerId, name: f.name.value.trim(), text: plainText(f.text.value.trim()), status: 'pending', ts: Date.now() };
        ['org', 'role', 'contact'].forEach(k => { const v = f[k].value.trim(); if (v) rec[k] = v; }); if (rating) rec.rating = rating;
        const lks = readLinks(f); if (!lks) return toast('الروابط يجب أن تبدأ بـ https://', 'err'); if (lks.length) rec.links = lks;
        if (rec.text.length < 20 || rec.name.length < 3) return toast('أكمل الاسم والتوصية (20 حرفاً على الأقل)', 'err');
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإرسال';
        const ok = await Store.setConfirmed(`reviews/${tk}`, rec);
        if (!ok) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال التوصية'; return toast('تعذّر الإرسال: ربما استُخدم الرابط من قبل أو انتهت صلاحيته', 'err'); }
        Automation.notify('review', tk);
        host.innerHTML = `<div class="empty"><i class="fa-solid fa-circle-check"></i><h3>شكراً لك، وصلت توصيتك</h3><p>ستظهر في صفحة ${esc(t.name)} بعد موافقته.</p><p><a class="btn" href="#/t/${esc(encodeURIComponent(t.slug || t.id))}">زيارة صفحته</a></p></div>`;
      };
    }
  };

  /* ---------- تبويب «مراجعات وتوصيات» في لوحة المدرب ---------- */
  function shareLink(t, tk, label) {
    const url = linkUrl(tk), msg = `السلام عليكم ورحمة الله وبركاته${label ? ' ' + label : ''}،\nيسعدني أن تشاركوني توصية قصيرة عن تجربتكم معي، تظهر في صفحتي على منصة «مدرّبون سعوديّون» (لا يلزم إنشاء حساب):\n${url}\nشاكر لكم وقتكم وتعاونكم.\n${t.name}`;
    const m = modal(`<h3><i class="fa-solid fa-link"></i> رابط التوصية جاهز</h3>
      <p class="muted small">أرسله لجهة واحدة فقط: يقبل توصية واحدة وينتهي بعد ${DAYS} يوماً. لن تُنشر التوصية إلا بعد موافقتك.</p>
      <input id="rvu" readonly dir="ltr" value="${esc(url)}" style="width:100%;margin:8px 0" onclick="this.select()">
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" id="rvcp"><i class="fa-regular fa-copy"></i> نسخ الرابط</button>
        <a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}"><i class="fa-brands fa-whatsapp"></i> مشاركة عبر واتساب</a>
        <button class="btn ghost" data-close>إغلاق</button></div>`);
    $('#rvcp', m.el).onclick = async () => { try { await navigator.clipboard.writeText(url); toast('تم نسخ الرابط'); } catch { $('#rvu', m.el).select(); toast('حدّد الرابط وانسخه'); } };
  }
  function newLink(t) {
    const m = modal(`<h3><i class="fa-solid fa-link"></i> طلب توصية جديد</h3>
      <form id="lf" style="display:grid;gap:10px">${field('لمن ستُرسل؟ (ملاحظة لك فقط)', '<input name="label" maxlength="80" placeholder="مثال: أ. خالد - شركة النور">')}
        <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit">إنشاء الرابط</button></div></form>`);
    $('#lf', m.el).onsubmit = async e => {
      e.preventDefault(); const tk = token(), label = e.target.label.value.trim();
      const rec = { id: tk, trainerId: t.id, ts: Date.now(), exp: Date.now() + DAYS * 864e5 }; if (label) rec.label = label;
      if (!await Store.setConfirmed(`reviewLinks/${tk}`, rec)) return toast('تعذّر إنشاء الرابط', 'err');
      m.close(); shareLink(t, tk, '');
    };
  }
  function editor(t, r) {
    let rating = Number(r?.rating) || 0;
    const m = modal(`<h3><i class="fa-solid fa-star"></i> ${r ? 'تعديل التوصية' : 'إضافة توصية'}</h3>
      <p class="muted small">أضف توصية قيلت فيك من متدرب أو جهة تعاون. ستظهر في صفحتك مباشرة.</p>
      <form id="ef" style="display:grid;gap:10px">${field('اسم القائل', `<input name="name" required minlength="3" maxlength="60" value="${esc(r?.name || '')}">`)}
        <div class="row" style="gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:180px">${field('الجهة (اختياري)', `<input name="org" maxlength="100" value="${esc(r?.org || '')}">`)}</div><div style="flex:1;min-width:180px">${field('صفته (اختياري)', `<input name="role" maxlength="80" value="${esc(r?.role || '')}">`)}</div></div>
        ${field('نص التوصية', `<textarea name="text" required rows="5" minlength="20" maxlength="800">${esc(r?.text || '')}</textarea>`)}
        ${linkInputs(Array.isArray(r?.links) ? r.links : Object.values(r?.links || {}))}
        <div><b class="small">التقييم (اختياري)</b><div class="rv-pick" id="rvr">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-r="${n}">☆</button>`).join('')}</div></div>
        <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></form>`, { wide: true });
    const paint = () => $$('#rvr button', m.el).forEach(b => { b.textContent = +b.dataset.r <= rating ? '★' : '☆'; b.classList.toggle('on', +b.dataset.r <= rating); });
    paint(); $$('#rvr button', m.el).forEach(b => b.onclick = () => { rating = rating === +b.dataset.r ? 0 : +b.dataset.r; paint(); });
    $('#ef', m.el).onsubmit = async e => {
      e.preventDefault(); const f = e.target, id = r?.id || Store.newId();
      const rec = { id, name: f.name.value.trim(), text: plainText(f.text.value.trim()), src: r?.src || 'self', ts: r?.ts || Date.now() };
      ['org', 'role'].forEach(k => { const v = f[k].value.trim(); if (v) rec[k] = v; }); if (rating) rec.rating = rating;
      const lks = readLinks(f); if (!lks) return toast('الروابط يجب أن تبدأ بـ https://', 'err'); if (lks.length) rec.links = lks;
      if (await Store.setConfirmed(`reviewsPub/${t.id}/${id}`, rec)) { toast('تم الحفظ'); m.close(); }
    };
  }
  function tab(main, t) {
    const pend = pendingOf(t.id), pub = pubOf(t.id), links = linksOf(t.id), used = new Set([...Store.list('reviews').map(x => x.id), ...pub.map(x => x.id)]);
    const lstate = l => (used.has(l.id) ? ['استُخدم', 'ok'] : (l.exp || 0) < Date.now() ? ['منتهٍ', 'off'] : ['بانتظار الكاتب', 'wait']);
    main.innerHTML = `<div class="dash-h"><h2>مراجعات وتوصيات</h2><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" id="rl"><i class="fa-solid fa-link"></i> اطلب توصية برابط</button><button class="btn" id="ra"><i class="fa-solid fa-plus"></i> أضف توصية</button></div></div>
      <p class="muted small">أرسل رابطاً خاصاً لأي جهة أو متدرب ليكتب توصيته دون حساب، أو أضف بنفسك توصية قيلت فيك. تظهر الموافق عليها في صفحتك العامة.</p>
      ${pend.length ? `<div class="pbox"><h3><i class="fa-solid fa-hourglass-half"></i> بانتظار موافقتك <small class="num muted">(${pend.length})</small></h3>${pend.map(r => `<div class="lead"><div><b>${esc(r.name)}</b> <small class="muted">${who(r)} · ${dateOf(r.ts)}</small> ${stars(Number(r.rating) || 0)}${linkList(r)}<p class="small" style="white-space:pre-wrap">${esc(r.text)}</p>${r.contact ? `<small class="muted" dir="ltr"><i class="fa-solid fa-address-book"></i> ${esc(r.contact)} (لا يظهر للعامة)</small>` : ''}</div>
        <div class="acts" style="flex-direction:column"><button class="btn sm primary" data-ok="${esc(r.id)}"><i class="fa-solid fa-check"></i> موافقة ونشر</button><button class="btn sm danger" data-no="${esc(r.id)}"><i class="fa-solid fa-xmark"></i> رفض</button></div></div>`).join('')}</div>` : ''}
      <div class="pbox"><h3><i class="fa-solid fa-star"></i> المنشورة في صفحتي <small class="num muted">(${pub.length})</small></h3>
        ${pub.length ? pub.map(r => `<div class="lead"><div><b>${esc(r.name)}</b> <small class="muted">${who(r)} · ${r.src === 'link' ? 'عبر رابط التوصية' : 'أضفتها بنفسك'}</small> ${stars(Number(r.rating) || 0)}<p class="small">${esc(String(r.text).slice(0, 200))}</p>${linkList(r)}</div>
          <div class="acts" style="flex-direction:column">${r.src === 'link' ? '' : `<button class="btn sm" data-ed="${esc(r.id)}"><i class="fa-solid fa-pen"></i> تعديل</button>`}<button class="btn sm danger" data-del="${esc(r.id)}"><i class="fa-solid fa-trash"></i> حذف</button></div></div>`).join('') : '<p class="muted small">لا توجد توصيات منشورة بعد.</p>'}</div>
      <div class="pbox"><h3><i class="fa-solid fa-link"></i> روابط التوصية التي أنشأتها <small class="num muted">(${links.length})</small></h3>
        ${links.length ? links.map(l => { const [s, c] = lstate(l); return `<div class="lead"><div><b>${esc(l.label || 'بلا ملاحظة')}</b> <small class="muted">${dateOf(l.ts)}</small> <span class="rv-src ${c === 'ok' ? 'ok' : ''}">${s}</span></div><div class="acts">${c === 'wait' ? `<button class="btn sm" data-sh="${esc(l.id)}"><i class="fa-solid fa-share-nodes"></i> مشاركة</button>` : ''}<button class="btn sm danger" data-dl="${esc(l.id)}"><i class="fa-solid fa-trash"></i></button></div></div>`; }).join('') : '<p class="muted small">لم تنشئ روابط بعد.</p>'}</div>`;
    $('#rl', main).onclick = () => newLink(t); $('#ra', main).onclick = () => editor(t);
    $$('[data-ok]', main).forEach(b => b.onclick = async () => {
      const r = pend.find(x => x.id === b.dataset.ok); if (!r) return;
      const pubRec = { id: r.id, name: r.name, text: r.text, src: 'link', ts: r.ts }; ['org', 'role', 'rating', 'links'].forEach(k => { if (r[k]) pubRec[k] = r[k]; });
      if (await Store.setConfirmed(`reviewsPub/${t.id}/${r.id}`, pubRec)) { await Store.setConfirmed(`reviews/${r.id}/status`, 'ok'); toast('نُشرت التوصية في صفحتك'); }
    });
    $$('[data-no]', main).forEach(b => b.onclick = async () => { if (await confirmBox('رفض هذه التوصية؟ لن تُنشر ويبقى الرابط مستهلكاً.', { ok: 'رفض', danger: true })) await Store.setConfirmed(`reviews/${b.dataset.no}/status`, 'no'); });
    $$('[data-ed]', main).forEach(b => b.onclick = () => editor(t, pub.find(x => x.id === b.dataset.ed)));
    $$('[data-del]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف هذه التوصية من صفحتك؟', { ok: 'حذف', danger: true })) Store.remove(`reviewsPub/${t.id}/${b.dataset.del}`); });
    $$('[data-sh]', main).forEach(b => b.onclick = () => shareLink(t, b.dataset.sh, ''));
    $$('[data-dl]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف هذا الرابط؟ لن يعمل بعد الآن.', { ok: 'حذف', danger: true })) Store.remove(`reviewLinks/${b.dataset.dl}`); });
  }
  const unread = tid => pendingOf(tid).length;

  /* ---------- لوحة الإدارة ---------- */
  function admin(main) {
    const rows = Object.entries(Store.get('reviewsPub') || {}).flatMap(([tid, o]) => Object.values(o || {}).filter(r => r && r.text).map(r => ({ ...r, tid }))).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const pend = Store.list('reviews').filter(r => r && r.status === 'pending');
    main.innerHTML = `<div class="dash-h"><h2>مراجعات وتوصيات</h2><span class="muted small">${rows.length} منشورة · ${pend.length} بانتظار موافقة أصحابها</span></div>
      <div class="pbox">${rows.length ? rows.map(r => { const t = Store.get(`trainers/${r.tid}`) || {}; return `<div class="lead"><div><b>${esc(r.name)}</b> <small class="muted">${who(r)} ← عن <a href="#/t/${esc(encodeURIComponent(t.slug || r.tid))}" target="_blank">${esc(t.name || r.tid)}</a> · ${r.src === 'link' ? 'عبر رابط' : 'أضافها المدرب'} · ${dateOf(r.ts)}</small> ${stars(Number(r.rating) || 0)}<p class="small">${esc(String(r.text).slice(0, 220))}</p></div>
        <div class="acts"><button class="btn sm danger" data-adel="${esc(r.tid)}|${esc(r.id)}"><i class="fa-solid fa-trash"></i> حذف</button></div></div>`; }).join('') : '<p class="muted small">لا توجد توصيات منشورة بعد.</p>'}</div>`;
    $$('[data-adel]', main).forEach(b => b.onclick = async () => { const [tid, id] = b.dataset.adel.split('|'); if (await confirmBox('حذف هذه التوصية من صفحة المدرب؟', { ok: 'حذف', danger: true })) { Store.remove(`reviewsPub/${tid}/${id}`); Security.log('حذف توصية', `${tid}/${id}`); } });
  }

  return { profileBox, Page, tab, admin, unread };
})();
Pages.recommend = Reviews.Page;
