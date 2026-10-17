/* لوحة الإدارة ← المراسلة ← «الرسالة الأسبوعية»: تولّد رسالة بريد واحدة منسّقة فيها
 * (1) أخبار المدربين المنشورة في فترة تختارها (الطويل منها يُختصر برابط «قراءة الخبر كاملاً» إلى صفحته) مع تحفيز لكتابة الأخبار،
 * (2) إعلانات تبويب «إعلانات عبر الإنترنت» المنشورة في الفترة نفسها، بين مقدمة وخاتمة ثابتتين (قابلتين للتعديل والحفظ).
 * تُحمَّل الرسالة المولَّدة في تبويب «كتابة الرسالة» كمسودة لتراجعها وتعدّلها ثم تختار المستلمين وترسلها بآلية المراسلة المعتادة. */

const WEEKLY_DEFAULT = {
  subject: 'الرسالة الأسبوعية — مدرّبون سعوديّون',
  intro: 'السلام عليكم ورحمة الله وبركاته\n\nأ. {first}،\n\nيسعدنا أن نضع بين يديك **ملخص هذا الأسبوع** في منصة «مدرّبون سعوديّون»: أبرز ما شاركه زملاؤك المدربون من أخبار وإنجازات، وما نُشر في تبويب «إعلانات عبر الإنترنت» من إعلانات عامة لجهات تبحث عن مدربين.',
  outro: 'نشكر لك ثقتك بمنصتك، ونتطلع إلى أن نقرأ أخبارك وإنجازاتك في الأسبوع القادم.\n\nمع خالص التحية،\n**فريق منصة مدرّبون سعوديّون**'
};
const WEEKLY_UNREG_DEFAULT = {
  subject: 'جديد مدرّبون سعوديّون — أخبار الأسبوع ومزايا المنصة',
  intro: 'السلام عليكم ورحمة الله وبركاته\n\nأ. {first}،\n\nيسعدنا أن نضع بين يديك **ملخص أخبار المدربين هذا الأسبوع** في منصة «مدرّبون سعوديّون»، مع تذكير سريع بمزايا المنصة وأحدث ما أضفناه إليها.',
  features: '🪪 | صفحة مهنية خاصة بك | رابط وبطاقة تعريفية تجمع نبذتك وخبراتك ودوراتك وطرق التواصل معك.\n📰 | أخبار المدربين | شارك إنجازاتك ودوراتك القادمة لتظهر باسمك وصورتك في الصفحة الرئيسية.\n📨 | طلبات التدريب | تصلك طلبات الجهات الباحثة عن مدربين مباشرةً أو عبر الطلبات العامة.\n🔗 | مشاركة سهلة | رمز QR وبطاقات جاهزة للمشاركة في واتساب ومنصات التواصل.',
  updates: '📌 | قسم «المثبّتة» | بطاقة مدرب مميّزة في الصفحة الرئيسية تتبدّل كل 24 ساعة.\n🗞️ | نشرة الأخبار المصوّرة | أخبار المدربين تُصدَّر بصور وPDF جاهزة للنشر.\n📢 | إعلانات عبر الإنترنت وفرص التدريب | يطّلع عليها المدربون المسجلون نهائياً داخل حساباتهم.\n👋 | عدّاد الزيارات | ترحيب بكل زائر برقم زيارته من إجمالي زيارات المنصة.',
  outro: 'يسعدنا انضمامك إلينا، وإن كان لديك أي استفسار فنحن بخدمتك.\n\nمع خالص التحية،\n**فريق منصة مدرّبون سعوديّون**'
};
const WeeklyUnregUI = { from: '', to: '', subject: null, intro: null, features: null, updates: null, outro: null };
const WeeklyUI = { from: '', to: '', news: true, ads: true, subject: null, intro: null, outro: null };

(() => {
  const ymd = d => { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
  const dayStart = v => new Date(`${v}T00:00:00`).getTime(), dayEnd = v => new Date(`${v}T23:59:59.999`).getTime();
  const fmt = ts => new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
  // تنظيف نص المستخدم من رموز التنسيق والمتغيرات حتى لا تُفسّر داخل الرسالة
  const clean = s => String(s == null ? '' : s).replace(/\*\*/g, '').replace(/[{}]/g, '').replace(/\[([^\]]*)\]\(/g, '$1 (').replace(/\r/g, '').trim();
  const cut = (s, n) => { s = clean(s).replace(/\n{2,}/g, '\n'); return s.length > n ? [s.slice(0, n).replace(/\s+\S*$/, '') + '…', true] : [s, false]; };
  const get = () => ({ ...WEEKLY_DEFAULT, ...(Store.get('settings/weekly') || {}) });
  const inRange = (o, f, t) => (o.ts || 0) >= dayStart(f) && (o.ts || 0) <= dayEnd(t);
  const newsOf = (f, t) => News.visible().filter(n => inRange(n, f, t));
  const adsOf = (f, t) => Opps.approved().filter(o => inRange(o, f, t));

  // أقسام الأخبار (مشتركة بين الرسالة الأسبوعية ورسالة غير المسجلين)
  function newsBlocks(blocks, from, to, base, login, unreg) {
    const list = newsOf(from, to);
    blocks.push({ t: 'h', text: '📰 أخبار المدربين هذا الأسبوع', align: 'start' });
    if (!list.length) blocks.push({ t: 'p', text: unreg ? 'لم يُنشر أي خبر خلال هذه الفترة، وسنوافيك بالجديد في الرسالة القادمة بإذن الله.' : 'لم يُنشر أي خبر خلال هذه الفترة. كن أنت أول من يشارك جديده!', align: 'start' });
    list.forEach(n => {
      const t = Store.get(`trainers/${n.trainerId}`) || {}, kind = (News.kinds.find(k => k[0] === n.kind) || News.kinds[0])[1];
      const [ex, long] = n.summary ? [clean(n.summary), true] : cut(n.body, 240), url = `${base}#/news/${encodeURIComponent(n.id)}`;
      const text = `**${clean(n.title)}**\n${clean(t.name)}${t.title ? ' — ' + cut(t.title, 70)[0] : ''}\n${kind} · ${fmt(n.ts)}${ex ? '\n\n' + ex : ''}${long ? `\n[قراءة الخبر كاملاً ←](${url})` : `\n[عرض الخبر ←](${url})`}`;
      const photo = !t.noPhoto && Data.photo(t);
      blocks.push(photo ? { t: 'imgtext', url: photo, text, side: 'start', alt: clean(t.name) } : { t: 'box', text });
    });
    if (unreg) {
      blocks.push({ t: 'box', text: '✍️ **تريد أن يظهر خبرك هنا؟**\nبعد اكتمال تسجيلك النهائي تستطيع نشر أخبارك وإنجازاتك ودوراتك القادمة باسمك وصورتك في الصفحة الرئيسية وصفحتك الخاصة.' });
      blocks.push({ t: 'btn', text: 'تابع حالة طلبك', url: `${base}#/status`, align: 'center' });
    } else {
      blocks.push({ t: 'box', text: '✍️ **هل لديك خبر أو إنجاز أو مشاركة أو دورة قادمة؟**\nادخل حسابك في المنصة ← تبويب «أخباري» واكتب خبرك في دقيقة، وسيظهر باسمك وصورتك في الصفحة الرئيسية وصفحتك، وقد يُضمَّن في الرسالة الأسبوعية القادمة.' });
      blocks.push({ t: 'btn', text: 'اكتب خبرك الآن', url: login, align: 'center' });
    }
  }

  function build({ from, to, news, ads, intro, outro, subject }) {
    const base = siteBase(), blocks = [], login = `${base}#/login`;
    blocks.push({ t: 'p', text: intro, align: 'start' });
    blocks.push({ t: 'box', text: `📅 ملخص الفترة من **${fmt(dayStart(from))}** إلى **${fmt(dayStart(to))}**` });
    if (news) newsBlocks(blocks, from, to, base, login, false);
    if (news && ads) blocks.push({ t: 'hr' });
    if (ads) {
      const list = adsOf(from, to);
      blocks.push({ t: 'h', text: '📢 إعلانات عبر الإنترنت هذا الأسبوع', align: 'start' });
      blocks.push({ t: 'p', text: `ملخص أسبوعي لما نُشر في تبويب «إعلانات عبر الإنترنت» داخل حسابك طوال أيام الفترة: إعلانات عامة لجهات تبحث عن مدربين، نتلقاها من مواقع الإنترنت ومنصات التواصل أو تصلنا مباشرة. نحاول قدر الإمكان التحقق من صحتها وسلامة مصدرها، ونهيب بك التحقق دائماً عند إجراء أي تعاملات عبر الإنترنت.`, align: 'start' });
      if (!list.length) blocks.push({ t: 'p', text: 'لم تُنشر إعلانات جديدة خلال هذه الفترة.', align: 'start' });
      list.forEach((o, i) => {
        const [ex, long] = cut(o.desc, 360), meta = [o.org && clean(o.org), o.site && clean(o.site), `نُشر ${fmt(o.ts)}`, o.deadline && `آخر موعد ${fmt(o.deadline)}`].filter(Boolean).join(' · ');
        const u = /^https:\/\/[^\s"'<>)]+$/.test(o.url || '') ? o.url : '';
        blocks.push({ t: 'box', text: `**${i + 1}. ${clean(o.title)}**\n${meta}${ex ? '\n\n' + ex : ''}${long ? `\n[التفاصيل الكاملة في حسابك ←](${login})` : ''}${u ? `\n[فتح الإعلان الأصلي ←](${u})` : ''}` });
      });
      blocks.push({ t: 'btn', text: 'تصفّح الإعلانات في حسابك', url: login, align: 'center' });
    }
    blocks.push({ t: 'hr' });
    blocks.push({ t: 'p', text: outro, align: 'start' });
    return { subject: subject || WEEKLY_DEFAULT.subject, blocks, atts: [] };
  }

  window.mailWeekly = function (body, main) {
    if (!WeeklyUI.from) { WeeklyUI.to = ymd(new Date()); WeeklyUI.from = ymd(new Date(Date.now() - 6 * 86400000)); }
    const S = { ...get(), ...Object.fromEntries(['subject', 'intro', 'outro'].filter(k => WeeklyUI[k] != null).map(k => [k, WeeklyUI[k]])) }, nN = newsOf(WeeklyUI.from, WeeklyUI.to).length, nA = adsOf(WeeklyUI.from, WeeklyUI.to).length;
    body.innerHTML = `<div class="pbox">
      <h3><i class="fa-solid fa-calendar-week"></i> الرسالة الأسبوعية</h3>
      <p class="small muted">تجمع أخبار المدربين وإعلانات «إعلانات عبر الإنترنت» المنشورة في الفترة المختارة في رسالة بريد واحدة منسّقة بهوية المنصة. بعد التوليد تُفتح في «كتابة الرسالة» لتراجعها وتعدّلها وتختار المستلمين وترسل.</p>
      <div class="bl-bar"><label>من تاريخ<input type="date" id="wk-from" value="${esc(WeeklyUI.from)}"></label><label>إلى تاريخ<input type="date" id="wk-to" value="${esc(WeeklyUI.to)}"></label>
        <button type="button" class="btn sm ghost" data-wr="7">آخر 7 أيام</button><button type="button" class="btn sm ghost" data-wr="14">آخر 14 يوماً</button></div>
      <div class="bl-bar"><label class="chk" style="margin:0"><input type="checkbox" id="wk-news" ${WeeklyUI.news ? 'checked' : ''}><span>أخبار المدربين <b class="num">(${nN})</b></span></label>
        <label class="chk" style="margin:0"><input type="checkbox" id="wk-ads" ${WeeklyUI.ads ? 'checked' : ''}><span>إعلانات عبر الإنترنت <b class="num">(${nA})</b></span></label></div>
      ${field('عنوان الرسالة (Subject)', `<input id="wk-sub" value="${esc(S.subject)}">`)}
      ${field('المقدمة الثابتة', `<textarea id="wk-intro" rows="6">${esc(S.intro)}</textarea>`, 'يمكنك استعمال {first} للاسم الأول و**نص** للخط العريض')}
      ${field('الخاتمة الثابتة', `<textarea id="wk-outro" rows="4">${esc(S.outro)}</textarea>`)}
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" id="wk-save"><i class="fa-solid fa-floppy-disk"></i> حفظ العنوان والمقدمة والخاتمة</button>
        <button class="btn" id="wk-prev"><i class="fa-solid fa-eye"></i> معاينة</button>
        <button class="btn primary" id="wk-gen"><i class="fa-solid fa-wand-magic-sparkles"></i> توليد الرسالة وفتحها للإرسال</button></div></div>`;
    const read = () => ({ from: $('#wk-from', body).value, to: $('#wk-to', body).value, news: $('#wk-news', body).checked, ads: $('#wk-ads', body).checked, subject: $('#wk-sub', body).value.trim(), intro: $('#wk-intro', body).value.trim(), outro: $('#wk-outro', body).value.trim() });
    const sync = () => { const r = read(); Object.assign(WeeklyUI, { from: r.from, to: r.to, news: r.news, ads: r.ads, subject: r.subject, intro: r.intro, outro: r.outro }); };
    ['#wk-from', '#wk-to', '#wk-news', '#wk-ads'].forEach(sel => { $(sel, body).onchange = () => { sync(); mailWeekly(body, main); }; });
    $$('[data-wr]', body).forEach(b => b.onclick = () => { sync(); WeeklyUI.to = ymd(new Date()); WeeklyUI.from = ymd(new Date(Date.now() - (Number(b.dataset.wr) - 1) * 86400000)); mailWeekly(body, main); });
    $('#wk-save', body).onclick = () => { const r = read(); Store.set('settings/weekly', { subject: r.subject, intro: r.intro, outro: r.outro }); toast('تم الحفظ'); };
    const valid = r => { if (!r.from || !r.to || r.from > r.to) { toast('اختر فترة صحيحة', 'error'); return false; } if (!r.news && !r.ads) { toast('اختر قسماً واحداً على الأقل', 'error'); return false; } return true; };
    $('#wk-prev', body).onclick = () => { const r = read(); if (!valid(r)) return; const doc = build(r); const m = modal(`<h3><i class="fa-solid fa-eye"></i> معاينة الرسالة الأسبوعية</h3><iframe id="wk-frame" style="width:100%;height:70vh;border:1px solid var(--line);border-radius:12px;background:#fff"></iframe>`, { wide: true }); $('#wk-frame', m.el).srcdoc = `<meta charset="utf-8"><body style="margin:0">${mailHtml(doc, mailVarsFor({ name: 'أ. سارة العتيبي', slug: 'sarah' }), mailOpts())}</body>`; };
    $('#wk-gen', body).onclick = async () => {
      const r = read(); if (!valid(r)) return;
      const cur = mailDoc(); if ((cur.blocks.length > 1 || cur.subject) && !await confirmBox('سيستبدل التوليد المسودة الحالية في «كتابة الرسالة». متابعة؟', { ok: 'متابعة' })) return;
      Store.set('settings/weekly', { subject: r.subject, intro: r.intro, outro: r.outro });
      MailUI.doc = build(r); mailSaveDraft(); MailUI.tab = 'compose'; aMail(main); toast('جُهّزت الرسالة الأسبوعية: راجعها ثم اختر المستلمين وأرسل');
    };
  };

  /* ===== الرسالة الأسبوعية لغير المسجلين: أخبار المدربين فقط + مزايا المنصة وآخر تحديثاتها (بلا إعلانات عبر الإنترنت) ===== */
  const getU = () => ({ ...WEEKLY_UNREG_DEFAULT, ...(Store.get('settings/weeklyUnreg') || {}) });
  const parseLines = txt => String(txt || '').split('\n').map(l => l.split('|').map(x => clean(x))).filter(a => a.length >= 2 && (a[1] || a[2])).map(a => a.length === 2 ? { ic: '✨', ti: a[0], de: a[1] } : { ic: a[0] || '✨', ti: a[1], de: a.slice(2).join(' — ') });
  const lineBox = (heading, items) => items.length ? [{ t: 'h', text: heading, align: 'start' }, ...items.map(x => ({ t: 'box', text: `${x.ic}  **${x.ti}**${x.de ? '\n' + x.de : ''}` }))] : [];
  function buildUnreg({ from, to, intro, features, updates, outro, subject }) {
    const base = siteBase(), blocks = [];
    blocks.push({ t: 'p', text: intro, align: 'start' });
    blocks.push({ t: 'box', text: `📅 ملخص الفترة من **${fmt(dayStart(from))}** إلى **${fmt(dayStart(to))}**` });
    newsBlocks(blocks, from, to, base, `${base}#/login`, true);
    blocks.push({ t: 'hr' });
    lineBox('🌟 تذكير بمزايا المنصة', parseLines(features)).forEach(b => blocks.push(b));
    blocks.push({ t: 'hr' });
    lineBox('🆕 آخر التحديثات والإضافات', parseLines(updates)).forEach(b => blocks.push(b));
    blocks.push({ t: 'btn', text: 'تصفّح المدربين', url: `${base}#/trainers`, align: 'center' });
    blocks.push({ t: 'hr' });
    blocks.push({ t: 'p', text: outro, align: 'start' });
    return { subject: subject || WEEKLY_UNREG_DEFAULT.subject, blocks, atts: [] };
  }
  window.mailWeeklyUnreg = function (body, main) {
    const U = WeeklyUnregUI;
    if (!U.from) { U.to = ymd(new Date()); U.from = ymd(new Date(Date.now() - 6 * 86400000)); }
    const S = { ...getU(), ...Object.fromEntries(['subject', 'intro', 'features', 'updates', 'outro'].filter(k => U[k] != null).map(k => [k, U[k]])) };
    const nN = newsOf(U.from, U.to).length, nR = mailApplicants().length + mailInvitees().filter(r => !r.optOut).length;
    body.innerHTML = `<div class="pbox">
      <h3><i class="fa-solid fa-user-clock"></i> الرسالة الأسبوعية لغير المسجلين</h3>
      <p class="small muted">رسالة موجّهة لمن لم يكتمل تسجيلهم النهائي (المقبولون مبدئياً وطلبات قيد المراجعة) ولمن أُضيفوا يدوياً كمدعوّين: تضم <b>أخبار المدربين فقط</b> مع تذكير بمزايا المنصة وآخر تحديثاتها، <b>دون</b> إعلانات «إعلانات عبر الإنترنت». المستلمون المتاحون الآن: <b class="num">${nR}</b>.</p>
      <div class="bl-bar"><label>من تاريخ<input type="date" id="wu-from" value="${esc(U.from)}"></label><label>إلى تاريخ<input type="date" id="wu-to" value="${esc(U.to)}"></label>
        <button type="button" class="btn sm ghost" data-wr="7">آخر 7 أيام</button><button type="button" class="btn sm ghost" data-wr="14">آخر 14 يوماً</button>
        <span class="small">أخبار في الفترة: <b class="num">${nN}</b></span></div>
      ${field('عنوان الرسالة (Subject)', `<input id="wu-sub" value="${esc(S.subject)}">`)}
      ${field('المقدمة', `<textarea id="wu-intro" rows="5">${esc(S.intro)}</textarea>`, 'يمكنك استعمال {first} للاسم الأول و**نص** للخط العريض')}
      ${field('مزايا المنصة (سطر لكل ميزة)', `<textarea id="wu-feat" rows="6" style="font-size:.9rem">${esc(S.features)}</textarea>`, 'الصيغة: أيقونة | العنوان | الوصف')}
      ${field('آخر التحديثات والإضافات (سطر لكل بند)', `<textarea id="wu-upd" rows="6" style="font-size:.9rem">${esc(S.updates)}</textarea>`, 'الصيغة: أيقونة | العنوان | الوصف')}
      ${field('الخاتمة', `<textarea id="wu-outro" rows="4">${esc(S.outro)}</textarea>`)}
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" id="wu-save"><i class="fa-solid fa-floppy-disk"></i> حفظ النصوص</button>
        <button class="btn" id="wu-prev"><i class="fa-solid fa-eye"></i> معاينة</button>
        <button class="btn primary" id="wu-gen"><i class="fa-solid fa-wand-magic-sparkles"></i> توليد الرسالة وفتحها للإرسال</button></div></div>`;
    const read = () => ({ from: $('#wu-from', body).value, to: $('#wu-to', body).value, subject: $('#wu-sub', body).value.trim(), intro: $('#wu-intro', body).value.trim(), features: $('#wu-feat', body).value.trim(), updates: $('#wu-upd', body).value.trim(), outro: $('#wu-outro', body).value.trim() });
    const sync = () => Object.assign(U, read());
    ['#wu-from', '#wu-to'].forEach(sel => { $(sel, body).onchange = () => { sync(); mailWeeklyUnreg(body, main); }; });
    $$('[data-wr]', body).forEach(b => b.onclick = () => { sync(); U.to = ymd(new Date()); U.from = ymd(new Date(Date.now() - (Number(b.dataset.wr) - 1) * 86400000)); mailWeeklyUnreg(body, main); });
    const save = r => Store.set('settings/weeklyUnreg', { subject: r.subject, intro: r.intro, features: r.features, updates: r.updates, outro: r.outro });
    $('#wu-save', body).onclick = () => { save(read()); toast('تم الحفظ'); };
    const valid = r => { if (!r.from || !r.to || r.from > r.to) { toast('اختر فترة صحيحة', 'error'); return false; } return true; };
    $('#wu-prev', body).onclick = () => { const r = read(); if (!valid(r)) return; const doc = buildUnreg(r); const m = modal(`<h3><i class="fa-solid fa-eye"></i> معاينة الرسالة</h3><iframe id="wu-frame" style="width:100%;height:70vh;border:1px solid var(--line);border-radius:12px;background:#fff"></iframe>`, { wide: true }); $('#wu-frame', m.el).srcdoc = `<meta charset="utf-8"><body style="margin:0">${mailHtml(doc, mailVarsFor({ name: 'أ. سارة العتيبي', slug: 'sarah' }), mailOpts())}</body>`; };
    $('#wu-gen', body).onclick = async () => {
      const r = read(); if (!valid(r)) return;
      const cur = mailDoc(); if ((cur.blocks.length > 1 || cur.subject) && !await confirmBox('سيستبدل التوليد المسودة الحالية في «كتابة الرسالة». متابعة؟', { ok: 'متابعة' })) return;
      save(r);
      MailUI.doc = buildUnreg(r); mailSaveDraft();
      MailUI.mode = 'unreg'; MailUI.q = ''; MailUI.sel = new Set(mailRcptPools().unreg.filter(x => x.email && !x.optOut).map(x => x.k));
      MailUI.tab = 'compose'; aMail(main); toast('جُهّزت الرسالة وحُدّد المستلمون (غير المسجلون والمدعوّون): راجعها ثم أرسل');
    };
  };
})();
