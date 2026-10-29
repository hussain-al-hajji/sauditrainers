/* لوحة الإدارة ← المراسلة ← «الرسالة الأسبوعية»: تولّد رسالة بريد واحدة منسّقة فيها
 * (1) أخبار المدربين المنشورة في فترة تختارها (الطويل منها يُختصر برابط «قراءة الخبر كاملاً» إلى صفحته) مع تحفيز لكتابة الأخبار،
 * (2) إعلانات تبويب «إعلانات عبر الإنترنت» المنشورة في الفترة نفسها، بين مقدمة وخاتمة ثابتتين (قابلتين للتعديل والحفظ).
 * تُحمَّل الرسالة المولَّدة في تبويب «كتابة الرسالة» كمسودة لتراجعها وتعدّلها ثم تختار المستلمين وترسلها بآلية المراسلة المعتادة. */

const WEEKLY_DEFAULT = {
  subject: 'الرسالة الأسبوعية - مدرّبون سعوديّون',
  intro: 'السلام عليكم ورحمة الله وبركاته\n\nأ. {first}،\n\nيسعدنا أن نضع بين يديك **ملخص هذا الأسبوع** في منصة «مدرّبون سعوديّون»: أبرز ما شاركه زملاؤك المدربون من أخبار وإنجازات، وما نُشر في تبويب «إعلانات عبر الإنترنت» من إعلانات عامة لجهات تبحث عن مدربين.',
  outro: 'نشكر لك ثقتك بمنصتك، ونتطلع إلى أن نقرأ أخبارك وإنجازاتك في الأسبوع القادم.\n\nمع خالص التحية،\n**فريق منصة مدرّبون سعوديّون**'
};
const MONTHLY_DEFAULT = {
  subject: 'حصاد منصة مدرّبون سعوديّون لشهر {month}',
  intro: 'السلام عليكم ورحمة الله وبركاته\n\nزميلنا المدرب / زميلتنا المدربة،\n\nنضع بين يديك **حصاد منصة «مدرّبون سعوديّون» لشهر {month}**: أرقام الزيارات وفرص التدريب والوظائف، وأبرز أخبار المدربين، وتعريف بما تقدمه المنصة للمدرب السعودي.',
  features: '🔎 | دليل مصنّف للمدربين | بحث بالتخصص والمنطقة وطريقة التقديم، وبطاقة تعريفية لكل مدرب.\n🤝 | جسر مباشر بين المدرب والجهة | طلبات تواصل واضحة تصل المدرب مباشرة دون وسيط.\n📢 | تسويق مستمر | نشر سير المدربين وأخبارهم في قنوات المنصة ونشرتها وصفحات المشاركة.\n💼 | فرص ووظائف تدريب | نجلب الوظائف وننشر فرص التدريب ليراها المدربون المسجلون.',
  account: '🪪 | صفحة مهنية خاصة | رابط مختصر وبطاقة تعريفية وصور جاهزة للمشاركة.\n📰 | أخبارك وإنجازاتك | تنشر أخبارك فتظهر في الصفحة الرئيسية وصفحتك وفي نشرة المنصة.\n⭐ | توصيات وفيديو | تعرض توصيات الجهات ونماذج من جلساتك المصورة.\n🔔 | إشعارات فورية | طلبات التواصل والفرص تصلك على جوالك وفي لوحتك.\n📚 | مكتبة المدرب | قوالب وأدوات مهنية جاهزة للاستخدام.',
  benefits: '💰 | بلا عمولة | كل ما تحصل عليه عبر المنصة يعود لك.\n♾️ | اشتراك مدى الحياة | رسوم {fee} ريالاً تُدفع مرة واحدة فقط.\n📈 | ظهور أوسع | حضور في صفحة منطقتك وتخصصك وفي نتائج البحث.\n🏅 | ترشيح للجهات | نرشّحك للجهات التي تبحث عن تخصصك.',
  outro: 'يسعدنا انضمامك إلى مجتمع المدربين السعوديين، وإن كان لديك أي استفسار فنحن بخدمتك.\n\nمع خالص التحية،\n**فريق منصة مدرّبون سعوديّون**'
};
const MonthlyUI = { ym: '', subject: null, intro: null, features: null, account: null, benefits: null, outro: null, doc: null };
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
  function newsBlocks(blocks, from, to, base, login, unreg, heading) {
    const list = newsOf(from, to);
    blocks.push({ t: 'h', text: heading || '📰 أخبار المدربين هذا الأسبوع', align: 'start' });
    if (!list.length) blocks.push({ t: 'p', text: unreg ? 'لم يُنشر أي خبر خلال هذه الفترة، وسنوافيك بالجديد في الرسالة القادمة بإذن الله.' : 'لم يُنشر أي خبر خلال هذه الفترة. كن أنت أول من يشارك جديده!', align: 'start' });
    list.forEach(n => {
      const t = Store.get(`trainers/${n.trainerId}`) || {}, kind = (News.kinds.find(k => k[0] === n.kind) || News.kinds[0])[1];
      const [ex, long] = n.summary ? [clean(n.summary), true] : cut(n.body, 240), url = `${base}#/news/${encodeURIComponent(n.id)}`;
      const text = `**${clean(n.title)}**\n${clean(t.name)}${t.title ? ' - ' + cut(t.title, 70)[0] : ''}\n${kind} · ${fmt(n.ts)}${ex ? '\n\n' + ex : ''}${long ? `\n[قراءة الخبر كاملاً ←](${url})` : `\n[عرض الخبر ←](${url})`}`;
      const photo = !t.noPhoto && Data.photo(t);
      blocks.push(photo ? { t: 'imgtext', url: photo, text, side: 'start', alt: clean(t.name) } : { t: 'box', text });
    });
    if (unreg) {
      blocks.push({ t: 'box', text: '✍️ **تريد أن يظهر خبرك هنا؟**\nبعد اكتمال تسجيلك النهائي تستطيع نشر أخبارك وإنجازاتك ودوراتك القادمة باسمك وصورتك في الصفحة الرئيسية وصفحتك الخاصة.' });
      blocks.push({ t: 'p', text: '**مسجل مسبقاً؟**', align: 'center' });
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

  /* ===== الرسالة الشهرية لغير المسجلين =====
   * تُولَّد في بداية كل شهر ميلادي عن الشهر المنتهي (أو أي شهر تختاره): زيارات الشهر والإجمالي، فرص التعاون والوظائف (بتوضيح الواجهة الرئيسية)،
   * مجالات التدريب المطلوبة، وأخبار المدربين، ثم مزايا المنصة وحساب المدرب وفوائده ونموذج بطاقة، مع زر «سجّل كمدرب سعودي» يتكرر في الرسالة.
   * تُنسخ بتصميمها الكامل للصقها في Gmail، أو تُفتح للإرسال من المنصة. */
  const parseLines = txt => String(txt || '').split('\n').map(l => l.split('|').map(x => clean(x))).filter(a => a.length >= 2 && (a[1] || a[2])).map(a => a.length === 2 ? { ic: '✨', ti: a[0], de: a[1] } : { ic: a[0] || '✨', ti: a[1], de: a.slice(2).join(' - ') });
  const lineBox = (heading, items) => items.length ? [{ t: 'h', text: heading, align: 'start' }, ...items.map(x => ({ t: 'box', text: `${x.ic}  **${x.ti}**${x.de ? '\n' + x.de : ''}` }))] : [];
  const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const ymLabel = ym => `${MONTHS_AR[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
  const num = n => (Number(n) || 0).toLocaleString('en-US');
  // النص المحفوظ سابقاً يتحدّث تلقائياً إلى الصياغة الجديدة («وتعريف» بدل «وتذكير»)
  const getM = () => { const m = { ...MONTHLY_DEFAULT, ...(Store.get('settings/monthly') || {}) }; m.intro = String(m.intro || '').replace('وتذكير بما تقدمه', 'وتعريف بما تقدمه'); return m; };
  const monthOptions = () => Array.from({ length: 14 }, (_, k) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const prevMonth = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const homeStatTexts = () => { const sec = arr(Store.get('content/home/list')).find(x => x && x.type === 'monthstats'); return { ...SECTION_TYPES.monthstats.def(), ...((sec && sec.d) || {}) }; };
  const platformVisitsTotal = () => {   // نفس معادلة عدّاد الصفحة الرئيسية
    const P = Store.get('stats/platform') || {}, v = Number(Store.get('stats/visits')) || 0, sec = arr(Store.get('content/home/list')).find(x => x && x.type === 'visits');
    return (Number(P.sessionsAll) || 0) + Math.max(0, v - (Number(P.visitsAtSync) || 0)) + (Number((sec && sec.d && sec.d.base) || 0) || 0);
  };
  const monthVisits = ym => {
    const g = Store.get(`analytics_ext/monthly/${ym.replace('-', '')}`), ga = g && g.ga && g.ga.mon && g.ga.mon.sessions;
    if (ga != null) return Number(ga) || 0;
    const days = Store.get('analytics/day') || {}, pre = ym.replace('-', '');
    return Object.keys(days).filter(k => k.startsWith(pre)).reduce((t, k) => t + (Number((days[k] || {}).visits) || 0), 0);
  };
  const ymOfTs = ts => { const d = new Date((ts || 0) + 3 * 36e5); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
  function buildMonthly({ ym, subject, intro, features, account, benefits, outro }) {
    const base = siteBase(), blocks = [], mname = ymLabel(ym), last = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(), fee = (Data.content().join || {}).fee || 720;
    const T = homeStatTexts(), st = Store.get(`stats/month/${ym}`) || {}, comp = MonthStats.compute()[ym] || {};
    const opp = Math.max(Number(st.requests) || 0, comp.requests || 0) + Math.max(Number(st.ads) || 0, comp.ads || 0), jobs = Math.max(Number(st.jobs) || 0, comp.jobs || 0);
    const reg = { t: 'btn', text: 'سجّل كمدرب سعودي', url: `${base}#/join`, align: 'center' };
    const sub = x => String(x || '').replace(/\{month\}/g, mname).replace(/\{fee\}/g, String(fee));
    blocks.push({ t: 'p', text: sub(intro), align: 'start' });
    blocks.push({ ...reg });
    blocks.push({ t: 'h', text: `📊 أرقام المنصة في شهر ${mname}`, align: 'start' });
    blocks.push({ t: 'stat', num: num(monthVisits(ym)), text: `زيارات المنصة خلال شهر ${mname}` });
    blocks.push({ t: 'stat', num: num(platformVisitsTotal()), text: `إجمالي زيارات المنصة حتى ${fmt(Date.now())}` });
    blocks.push({ t: 'stat', num: num(opp), text: clean(T.lReq), note: clean(T.tReq) });
    blocks.push({ t: 'stat', num: num(jobs), text: clean(T.lJobs), note: clean(T.tJobs) });
    // عناوين البرامج المطلوبة: تُسحب تلقائياً من بطاقات قسم «من طلبات هذا الشهر» للشهر المختار (المرفوعة من ملف العناوين)، بلا تكرار
    const seen = new Map(), titles = [];
    Store.list('showcase').filter(x => ymOfTs(x.ts) === ym).sort((a, b) => (b.ts || 0) - (a.ts || 0)).forEach(x => { const c = clean(x.title).replace(/\s+/g, ' '), k = c.toLowerCase(); if (!c) return; if (seen.has(k)) { seen.get(k).n += Number(x.n) || 0; return; } const o = { c, n: Number(x.n) || 0 }; seen.set(k, o); titles.push(o); });
    titles.sort((a, b) => b.n - a.n);   // الأكثر طلباً أولاً
    if (titles.length) {
      blocks.push({ t: 'h', text: '🎯 مجالات وموضوعات التدريب المطلوبة هذا الشهر', align: 'start' });
      blocks.push({ t: 'box', text: titles.map(x => `• ${x.c}${x.n > 0 ? ` (${num(x.n)} ${x.n === 1 ? 'فرصة' : 'فرص'})` : ''}`).join('\n') });
    }
    blocks.push({ ...reg });
    newsBlocks(blocks, `${ym}-01`, `${ym}-${String(last).padStart(2, '0')}`, base, `${base}#/login`, true, `📰 أخبار المدربين خلال شهر ${mname}`);
    blocks.push({ t: 'hr' });
    blocks.push({ t: 'h', text: '🪧 هكذا تظهر بطاقتك التعريفية', align: 'start' });
    blocks.push({ t: 'img', url: `${base}assets/card-sample.jpg`, alt: 'نموذج افتراضي لبطاقة مدرب على المنصة', w: 'full', align: 'center', link: `${base}#/join` });
    blocks.push({ t: 'p', text: 'نموذج افتراضي للبطاقة التعريفية', align: 'center' });
    lineBox('🌟 مزايا المنصة', parseLines(sub(features))).forEach(b => blocks.push(b));
    lineBox('🪪 مزايا حساب المدرب', parseLines(sub(account))).forEach(b => blocks.push(b));
    lineBox('💎 ما الذي ستحصل عليه', parseLines(sub(benefits))).forEach(b => blocks.push(b));
    blocks.push({ ...reg });
    blocks.push({ t: 'hr' });
    blocks.push({ t: 'p', text: sub(outro), align: 'start' });
    return { subject: sub(subject), blocks, atts: [] };
  }
  // نسخ الرسالة بتصميمها (HTML منسّق) للصقها في Gmail مباشرة
  async function copyRich(html, plain) {
    try { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]); return true; } catch { /* نحاول الطريقة البديلة */ }
    const box = document.createElement('div'); box.contentEditable = 'true'; box.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px'; box.innerHTML = html; document.body.appendChild(box);
    const r = document.createRange(); r.selectNodeContents(box); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* ignore */ } sel.removeAllRanges(); box.remove(); return ok;
  }
  window.mailWeeklyUnreg = function (body, main) {
    const U = MonthlyUI; if (!U.ym) U.ym = prevMonth();
    const S = { ...getM(), ...Object.fromEntries(['subject', 'intro', 'features', 'account', 'benefits', 'outro'].filter(k => U[k] != null).map(k => [k, U[k]])) };
    const months = [...new Set([U.ym, ...monthOptions()])].sort().reverse();
    body.innerHTML = `<div class="pbox">
      <h3><i class="fa-solid fa-calendar-check"></i> الرسالة الشهرية لغير المسجلين</h3>
      <p class="small muted">تُولَّد في بداية كل شهر ميلادي عن الشهر المنتهي: زيارات الشهر والإجمالي، فرص التعاون والوظائف، مجالات التدريب المطلوبة، أخبار المدربين، ثم مزايا المنصة وحساب المدرب ونموذج البطاقة، وزر «سجّل كمدرب سعودي» يتكرر خلالها. المستلمون المتاحون الآن: <b class="num">${mailApplicants().length + mailInvitees().filter(r => !r.optOut).length}</b>.</p>
      <div class="bl-bar"><label>الشهر<select id="mm-ym">${months.map(m => `<option value="${m}" ${m === U.ym ? 'selected' : ''}>${esc(ymLabel(m))}</option>`).join('')}</select></label>
        <button class="btn primary" id="mm-gen"><i class="fa-solid fa-wand-magic-sparkles"></i> توليد محتوى الرسالة (آخر تحديث للبيانات)</button></div>
      <div class="pbox" style="margin-top:10px;background:var(--g50)"><b><i class="fa-solid fa-list-check"></i> عناوين ومواضيع التدريب المطلوبة هذا الشهر</b>
        <p class="small muted" style="margin:4px 0 0">تُسحب تلقائياً من بطاقات قسم «من طلبات هذا الشهر» (الفرص → رفع ملف عناوين) للشهر المختار: <b class="num" id="mm-nt">${Store.list('showcase').filter(x => ymOfTs(x.ts) === U.ym).length}</b> عنواناً. إن لم توجد بطاقات للشهر حُذف هذا القسم من الرسالة.</p></div>
      <div id="mm-out" style="margin-top:12px"></div>
      <details style="margin-top:12px"><summary style="cursor:pointer"><b><i class="fa-solid fa-pen"></i> النصوص الثابتة (العنوان والمقدمة والمزايا والخاتمة)</b></summary>
        ${field('عنوان الرسالة (Subject)', `<input id="mm-sub" value="${esc(S.subject)}">`, 'استعمل {month} لاسم الشهر')}
        ${field('المقدمة', `<textarea id="mm-intro" rows="5">${esc(S.intro)}</textarea>`, 'استعمل {month} لاسم الشهر و**نص** للخط العريض')}
        ${field('مزايا المنصة (سطر لكل ميزة)', `<textarea id="mm-feat" rows="5" style="font-size:.9rem">${esc(S.features)}</textarea>`, 'الصيغة: أيقونة | العنوان | الوصف')}
        ${field('مزايا حساب المدرب', `<textarea id="mm-acc" rows="6" style="font-size:.9rem">${esc(S.account)}</textarea>`, 'الصيغة: أيقونة | العنوان | الوصف')}
        ${field('الفوائد التي سيحصل عليها المدرب', `<textarea id="mm-ben" rows="5" style="font-size:.9rem">${esc(S.benefits)}</textarea>`, 'الصيغة: أيقونة | العنوان | الوصف، و{fee} لرسوم الاشتراك')}
        ${field('الخاتمة', `<textarea id="mm-outro" rows="4">${esc(S.outro)}</textarea>`)}
        <button class="btn" id="mm-save"><i class="fa-solid fa-floppy-disk"></i> حفظ النصوص</button></details></div>`;
    const read = () => ({ ym: $('#mm-ym', body).value, subject: $('#mm-sub', body).value.trim(), intro: $('#mm-intro', body).value.trim(), features: $('#mm-feat', body).value.trim(), account: $('#mm-acc', body).value.trim(), benefits: $('#mm-ben', body).value.trim(), outro: $('#mm-outro', body).value.trim() });
    const sync = () => Object.assign(U, read());
    const save = r => Store.set('settings/monthly', { subject: r.subject, intro: r.intro, features: r.features, account: r.account, benefits: r.benefits, outro: r.outro });
    $('#mm-ym', body).onchange = () => { sync(); U.doc = null; mailWeeklyUnreg(body, main); };
    $('#mm-save', body).onclick = () => { save(read()); toast('تم الحفظ'); };
    const show = doc => {
      const vars = { name: '', first: 'الزميل', loginUrl: `${siteBase()}#/login`, siteUrl: siteBase(), profileUrl: siteBase() }, html = mailHtml(doc, vars, mailOpts());
      $('#mm-out', body).innerHTML = `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><b>الموضوع:</b> <span>${esc(doc.subject)}</span></div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><button class="btn primary" id="mm-copy"><i class="fa-regular fa-copy"></i> نسخ الرسالة بتصميمها (للصقها في Gmail)</button>
          <button class="btn" id="mm-html"><i class="fa-solid fa-code"></i> نسخ كود HTML</button><button class="btn" id="mm-subj"><i class="fa-solid fa-heading"></i> نسخ الموضوع</button>
          <button class="btn" id="mm-send"><i class="fa-solid fa-paper-plane"></i> فتحها للإرسال من المنصة</button></div>
        <iframe id="mm-frame" style="width:100%;height:70vh;border:1px solid var(--line);border-radius:12px;background:#fff"></iframe>`;
      $('#mm-frame', body).srcdoc = html;
      $('#mm-copy', body).onclick = async () => toast((await copyRich(html, mailPlain(doc, vars))) ? 'نُسخت الرسالة بتصميمها: افتح Gmail والصقها (Ctrl+V) في نص الرسالة' : 'تعذّر النسخ تلقائياً: حدّد المعاينة وانسخها يدوياً', 'ok');
      $('#mm-html', body).onclick = () => copyText(html, 'نُسخ كود HTML');
      $('#mm-subj', body).onclick = () => copyText(doc.subject, 'نُسخ الموضوع');
      $('#mm-send', body).onclick = async () => {
        const cur = mailDoc(); if ((cur.blocks.length > 1 || cur.subject) && !await confirmBox('سيستبدل ذلك المسودة الحالية في «كتابة الرسالة». متابعة؟', { ok: 'متابعة' })) return;
        MailUI.doc = doc; mailSaveDraft();
        MailUI.mode = 'unreg'; MailUI.q = ''; MailUI.sel = new Set(mailRcptPools().unreg.filter(x => x.email && !x.optOut).map(x => x.k));
        MailUI.tab = 'compose'; aMail(main); toast('جُهّزت الرسالة وحُدّد المستلمون (غير المسجلون والمدعوّون): راجعها ثم أرسل');
      };
    };
    $('#mm-gen', body).onclick = () => { const r = read(); Object.assign(U, r); save(r); U.doc = buildMonthly(r); show(U.doc); };
    if (U.doc) show(U.doc);
  };

  // بيانات التقرير الشهري (PDF): هي نفسها أرقام الرسالة الشهرية لغير المسجلين حتى لا يختلف الرقم بين الموضعين
  function reportData(ym) {
    const mname = ymLabel(ym), last = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
    const T = homeStatTexts(), st = Store.get(`stats/month/${ym}`) || {}, comp = MonthStats.compute()[ym] || {};
    const opp = Math.max(Number(st.requests) || 0, comp.requests || 0) + Math.max(Number(st.ads) || 0, comp.ads || 0), jobs = Math.max(Number(st.jobs) || 0, comp.jobs || 0);
    const seen = new Map(), titles = [];
    Store.list('showcase').filter(x => ymOfTs(x.ts) === ym).sort((a, b) => (b.ts || 0) - (a.ts || 0)).forEach(x => { const c = clean(x.title).replace(/\s+/g, ' '), k = c.toLowerCase(); if (!c) return; if (seen.has(k)) { seen.get(k).n += Number(x.n) || 0; return; } const o = { c, n: Number(x.n) || 0 }; seen.set(k, o); titles.push(o); });
    titles.sort((a, b) => b.n - a.n);
    return { ym, mname, titles, news: newsOf(`${ym}-01`, `${ym}-${String(last).padStart(2, '0')}`), stats: [
      { num: num(monthVisits(ym)), label: `زيارات المنصة خلال شهر ${mname}` },
      { num: num(platformVisitsTotal()), label: `إجمالي زيارات المنصة حتى ${fmt(Date.now())}` },
      { num: num(opp), label: clean(T.lReq), note: clean(T.tReq) },
      { num: num(jobs), label: clean(T.lJobs), note: clean(T.tJobs) }] };
  }
  window.mailMonthlyReport = function (body) {
    const U = MonthlyUI; if (!U.ym) U.ym = prevMonth();
    const months = [...new Set([U.ym, ...monthOptions()])].sort().reverse();
    body.innerHTML = `<div class="pbox"><h3><i class="fa-solid fa-file-pdf"></i> التقرير الشهري (PDF)</h3>
      <p class="small muted">ملف PDF بتصميم نشرة المدربين عن الشهر المختار، ومحتواه نفس الرسالة الشهرية لغير المسجلين: زيارات الشهر والإجمالي، فرص التعاون والوظائف، الموضوعات المطلوبة بعدد فرصها، أخبار المدربين، ثم ثلاث بطاقات لأهم المزايا وصفحة ختامية بدعوة للتسجيل.</p>
      <div class="bl-bar"><label>الشهر<select id="mr-ym">${months.map(m => `<option value="${m}" ${m === U.ym ? 'selected' : ''}>${esc(ymLabel(m))}</option>`).join('')}</select></label>
        <button class="btn primary" id="mr-gen"><i class="fa-solid fa-wand-magic-sparkles"></i> توليد التقرير</button></div></div>`;
    $('#mr-ym', body).onchange = e => { U.ym = e.target.value; };
    $('#mr-gen', body).onclick = () => { U.ym = $('#mr-ym', body).value; Bulletin.report(reportData(U.ym)); };
  };
})();
