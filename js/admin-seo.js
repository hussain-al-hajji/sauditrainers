/* لوحة الإدارة ← SEO: التحكم بعناوين الصفحات ووصفها ومنع الفهرسة والبيانات المنظّمة وخريطة الموقع وrobots.txt وفحص جودة الوسوم.
 * الإعدادات في content/seo (قراءة عامة، كتابة للإدارة)، وتطبّقها js/seo.js فورياً على المتصفح وtools/og/build.js على الصفحات الثابتة. */

const SeoUI = { view: 'general', q: '' };

function aSeo(main) {
  const tabs = [['general', 'fa-gear', 'عام'], ['pages', 'fa-file-lines', 'الصفحات'], ['trainers', 'fa-id-card', 'المدربون'], ['files', 'fa-sitemap', 'الخريطة وrobots'], ['check', 'fa-stethoscope', 'فحص الجودة']];
  main.innerHTML = `
    <div class="dash-h"><h2>تحسين محركات البحث (SEO)</h2></div>
    <p class="muted small"><i class="fa-solid fa-circle-info"></i> عنوان المتصفح ووسومه يتغيران فور الحفظ. أما الصفحات الثابتة التي يقرؤها الزاحف (الرئيسية وصفحات المدربين وsitemap.xml وrobots.txt) فتُولَّد تلقائياً خلال ساعة، أو فوراً بتشغيل «صفحات مشاركة المدربين» من تبويب Actions في GitHub.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px;margin-bottom:12px">${tabs.map(([k, ic, l]) => `<button class="btn sm ${SeoUI.view === k ? 'primary' : ''}" data-v="${k}"><i class="fa-solid ${ic}"></i> ${l}</button>`).join('')}</div>
    <div id="seob"></div>`;
  $$('[data-v]', main).forEach(b => b.onclick = () => { SeoUI.view = b.dataset.v; aSeo(main); });
  const body = $('#seob', main);
  ({ general: seoGeneral, pages: seoPages, trainers: seoTrainers, files: seoFiles, check: seoCheck })[SeoUI.view](body, main);
}

/* عدّاد أحرف مع لون تحذير حسب الحد الموصى به */
const seoCnt = (len, max, min = 0) => `<small class="seo-cnt ${len > max || (min && len < min && len) ? 'warn' : ''}"><b class="num">${len}</b> / ${max}</small>`;
function seoBindCount(root) {
  $$('[data-cnt]', root).forEach(inp => {
    const [max, min] = inp.dataset.cnt.split(',').map(Number), out = inp.closest('label').querySelector('.seo-cnt-h');
    const upd = () => { const n = inp.value.length; out.innerHTML = seoCnt(n, max, min); };
    inp.addEventListener('input', upd); upd();
  });
}
const seoField = (label, name, val, { max, min, area, ph = '', hint = '', dir } = {}) => `<label class="field"><span>${label} <i class="seo-cnt-h"></i></span>
  ${area ? `<textarea name="${name}" ${max ? `data-cnt="${max},${min || 0}"` : ''} placeholder="${esc(ph)}" style="min-height:90px">${esc(val)}</textarea>` : `<input type="text" name="${name}" ${max ? `data-cnt="${max},${min || 0}"` : ''} ${dir ? `dir="${dir}"` : ''} placeholder="${esc(ph)}" value="${esc(val)}">`}${hint ? `<small>${hint}</small>` : ''}</label>`;
const seoChk = (label, name, on, hint = '') => `<label class="chk"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span>${label}${hint ? ` <small class="muted">${hint}</small>` : ''}</span></label>`;
const serp = (title, url, desc) => `<div class="serp"><div class="serp-u">${esc(url)}</div><div class="serp-t">${esc(title.length > 60 ? title.slice(0, 58) + '…' : title)}</div><div class="serp-d">${esc(desc.length > 160 ? desc.slice(0, 158) + '…' : desc)}</div></div>`;

/* ===== عام ===== */
function seoGeneral(body, main) {
  const st = Store.get('content/seo/site') || {}, s = SEO.site(), val = k => st[k] ?? SEO.DEF[k];
  body.innerHTML = `<form id="sf" class="pbox" style="display:grid;gap:12px">
    <h3><i class="fa-solid fa-house"></i> الصفحة الرئيسية والهوية</h3>
    <div class="grid2">${seoField('اسم المنصة', 'siteName', val('siteName'), { max: 40 })}${seoField('حساب إكس للمنصة (بدون @)', 'twitter', val('twitter'), { dir: 'ltr', ph: 'Sauditrainers' })}</div>
    ${seoField('عنوان الصفحة الرئيسية (Title)', 'homeTitle', val('homeTitle'), { max: 60, min: 20, hint: 'الموصى به 30–60 حرفاً ويحوي الكلمة الأهم' })}
    ${seoField('وصف الصفحة الرئيسية (Meta description)', 'homeDesc', val('homeDesc'), { max: 160, min: 70, area: true, hint: 'الموصى به 70–160 حرفاً' })}
    <div id="serp-home"></div>
    ${seoField('الكلمات المفتاحية (اختياري، تفصلها فاصلة)', 'keywords', val('keywords'), { ph: 'مدربين سعوديين، دورات تدريبية، تدريب...', hint: 'تتجاهلها محركات البحث الكبرى عملياً، لكنها تُحفظ في الصفحة الرئيسية' })}
    <h3><i class="fa-solid fa-share-nodes"></i> معاينة الروابط (Open Graph)</h3>
    <div class="grid2">${seoField('عنوان المعاينة', 'ogTitle', val('ogTitle'), { max: 70 })}${seoField('صورة المعاينة الافتراضية (رابط أو مسار)', 'ogImage', val('ogImage'), { dir: 'ltr', hint: 'مقاس 1200×630 مثالياً' })}</div>
    ${seoField('وصف المعاينة', 'ogDesc', val('ogDesc'), { max: 200, area: true })}
    <h3><i class="fa-solid fa-id-card"></i> صفحات المدربين (القوالب)</h3>
    <div class="tvars">${SEO.TRAINER_VARS.map(([k, l]) => `<span class="tvar" style="cursor:default">{${k}}<small>${l}</small></span>`).join('')}</div>
    ${seoField('قالب عنوان صفحة المدرب', 'trainerTitleTpl', val('trainerTitleTpl') || SEO.DEF.trainerTitleTpl, { max: 70 })}
    ${seoField('قالب وصف صفحة المدرب', 'trainerDescTpl', val('trainerDescTpl') || SEO.DEF.trainerDescTpl, { max: 200, area: true, hint: 'الجزء الذي متغيره فارغ يُحذف تلقائياً (الفواصل: — | ·). يمكن تخصيص عنوان ووصف أي مدرب منفرداً من تبويب «المدربون»' })}
    ${seoChk('إظهار نبذة نصية عن المدرب في صفحته الثابتة (يقرؤها الزاحف)', 'trainerBody', s.trainerBody)}
    <h3><i class="fa-solid fa-diagram-project"></i> البيانات المنظّمة (JSON-LD)</h3>
    <div class="grid2">${seoChk('بيانات المنصة (Organization وWebSite) في الصفحة الرئيسية', 'ldOrg', s.ldOrg)}${seoChk('بيانات المدرب (Person) في صفحته', 'ldPerson', s.ldPerson)}</div>
    <div class="grid2">${seoField('اسم الجهة في البيانات المنظّمة', 'orgName', val('orgName'), { ph: s.siteName })}${seoField('شعار الجهة (رابط أو مسار)', 'orgLogo', val('orgLogo'), { dir: 'ltr' })}</div>
    ${seoField('حسابات المنصة الرسمية (sameAs): رابط في كل سطر', 'orgSameAs', val('orgSameAs'), { area: true, dir: 'ltr', ph: 'https://sa.linkedin.com/company/saudi-trainers-sa\nhttps://x.com/Sauditrainers' })}
    <h3><i class="fa-solid fa-magnifying-glass-chart"></i> أدوات المشرفين والتحقق</h3>
    <div class="grid2">${seoField('كود التحقق من Google Search Console', 'gsc', val('gsc'), { dir: 'ltr', hint: 'القيمة داخل content="..." فقط' })}${seoField('كود التحقق من Bing Webmaster', 'bing', val('bing'), { dir: 'ltr' })}</div>
    <h3><i class="fa-solid fa-robot"></i> الفهرسة العامة</h3>
    ${seoChk('السماح لمحركات البحث بفهرسة الموقع', 'robotsIndex', s.robotsIndex, '(إيقافه يمنع الفهرسة كلياً: noindex وDisallow وsitemap فارغ)')}
    <div class="row"><button class="btn primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> حفظ</button><button class="btn ghost" type="button" id="rs">استعادة الافتراضي</button></div>
  </form>`;
  const form = $('#sf', body), g = n => form.elements[n];
  const serpHome = () => { const sv = { homeTitle: g('homeTitle').value, homeDesc: g('homeDesc').value }; $('#serp-home', body).innerHTML = serp(sv.homeTitle.trim() || SEO.DEF.homeTitle, siteBase(), sv.homeDesc.trim() || SEO.DEF.homeDesc); };
  seoBindCount(body); ['homeTitle', 'homeDesc'].forEach(n => g(n).addEventListener('input', serpHome)); serpHome();
  form.onsubmit = async e => {
    e.preventDefault();
    const o = {}; for (const k of Object.keys(SEO.DEF)) { const el = g(k); if (!el) continue; o[k] = el.type === 'checkbox' ? el.checked : el.value.trim(); }
    if (o.gsc && !/^[\w-]{10,}$/.test(o.gsc)) { toast('كود Search Console غير صالح (يتكوّن من حروف وأرقام فقط)', 'error'); return; }
    if (o.twitter) o.twitter = o.twitter.replace(/^@/, '').replace(/[^\w]/g, '');
    if (!o.robotsIndex && !await confirmBox('إيقاف الفهرسة يخفي الموقع من نتائج البحث بعد أن يعيد الزاحف زيارته. هل أنت متأكد؟', { ok: 'إيقاف الفهرسة', danger: true })) return;
    Store.set('content/seo/site', o); Security.log('تعديل SEO', 'الإعدادات العامة'); toast('تم حفظ إعدادات SEO'); aSeo(main);
  };
  $('#rs', body).onclick = async () => { if (!await confirmBox('استعادة الإعدادات العامة الافتراضية؟', { ok: 'استعادة', danger: true })) return; Store.remove('content/seo/site'); toast('تمت الاستعادة'); aSeo(main); };
}

/* ===== الصفحات ===== */
function seoPages(body, main) {
  const st = Store.get('content/seo/pages') || {};
  body.innerHTML = `<form id="pf" class="pbox" style="display:grid;gap:16px"><p class="muted small">عنوان ووصف كل صفحة رئيسية من الموقع. الحقل الفارغ يستخدم الافتراضي. صفحات الإدارة وحساب المدرب والدخول ومتابعة الطلب لا تُفهرس دائماً.</p>
    ${SEO.PAGES.map(([k, name]) => { const m = SEO.pageMeta(k), c = st[k] || {}; return `<div class="pbox" style="margin:0" data-k="${k}"><h4>${name}</h4>
      ${seoField('العنوان', `t_${k}`, c.title || '', { max: 60, min: 20, ph: m.title })}
      ${seoField('الوصف', `d_${k}`, c.desc || '', { max: 160, min: 70, area: true, ph: m.desc })}
      ${seoChk('منع فهرسة هذه الصفحة (noindex)', `n_${k}`, !!c.noindex)}</div>`; }).join('')}
    <div><button class="btn primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> حفظ الصفحات</button></div></form>`;
  seoBindCount(body);
  $('#pf', body).onsubmit = e => {
    e.preventDefault(); const f = e.target, o = {};
    SEO.PAGES.forEach(([k]) => { const t = f.elements[`t_${k}`].value.trim(), d = f.elements[`d_${k}`].value.trim(), n = f.elements[`n_${k}`].checked; if (t || d || n) o[k] = { title: t, desc: d, noindex: n }; });
    Store.set('content/seo/pages', Object.keys(o).length ? o : null); Security.log('تعديل SEO', 'الصفحات'); toast('تم الحفظ');
  };
}

/* ===== المدربون ===== */
function seoTrainerModal(t, done) {
  const c = SEO.trainerCfg(t.id), eff = SEO.trainerMeta({ ...t, id: '__none__' });
  const m = modal(`<h3><i class="fa-solid fa-id-card"></i> SEO: ${esc(t.name)}</h3>
    <form id="tf" style="display:grid;gap:10px">
      ${seoField('عنوان الصفحة', 'title', c.title || '', { max: 60, min: 20, ph: eff.title })}
      ${seoField('وصف الصفحة', 'desc', c.desc || '', { max: 160, min: 70, area: true, ph: eff.desc })}
      ${seoChk('منع فهرسة صفحة هذا المدرب (noindex) وإخراجها من خريطة الموقع', 'noindex', !!c.noindex)}
      <div id="serp-t"></div>
      <p class="small muted">رابط الصفحة: <span dir="ltr">${esc(profileUrl(t))}</span></p>
      <div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></form>`, { wide: true });
  const f = $('#tf', m.el), upd = () => { const tt = f.title.value.trim() || eff.title, dd = f.desc.value.trim() || eff.desc; $('#serp-t', m.el).innerHTML = serp(tt, profileUrl(t), dd); };
  seoBindCount(m.el); f.title.addEventListener('input', upd); f.desc.addEventListener('input', upd); upd();
  f.onsubmit = e => {
    e.preventDefault(); const o = { title: f.title.value.trim(), desc: f.desc.value.trim(), noindex: f.noindex.checked };
    Store.set(`content/seo/trainers/${t.id}`, o.title || o.desc || o.noindex ? o : null); Security.log('تعديل SEO', `مدرب: ${t.name}`); toast('تم الحفظ'); m.close(); done && done();
  };
}
function seoTrainers(body, main) {
  const q = normAr(SeoUI.q || ''), list = Data.live().filter(t => !q || normAr(`${t.name} ${t.title || ''} ${t.slug || ''}`).includes(q));
  body.innerHTML = `<div class="pbox"><input type="search" class="list-search" id="sq" placeholder="ابحث باسم المدرب أو رابطه..." value="${esc(SeoUI.q)}">
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المدرب</th><th>العنوان الفعلي</th><th>الوصف الفعلي</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${list.map(t => { const m = SEO.trainerMeta(t), c = SEO.trainerCfg(t.id), bad = m.title.length > 60 || m.desc.length > 160 || m.desc.length < 50; return `<tr>
      <td><b>${esc(t.name)}</b><br><small class="muted" dir="ltr">${esc(t.slug || t.id)}</small></td>
      <td>${esc(m.title)}<br><small class="${m.title.length > 60 ? 'seo-w' : 'muted'}"><b class="num">${m.title.length}</b>/60</small></td>
      <td style="max-width:340px">${esc(m.desc)}<br><small class="${m.desc.length > 160 || m.desc.length < 50 ? 'seo-w' : 'muted'}"><b class="num">${m.desc.length}</b>/160</small></td>
      <td>${m.noindex ? '<span class="pill gray">noindex</span>' : bad ? '<span class="pill warn">يحتاج مراجعة</span>' : '<span class="pill ok">سليم</span>'} ${c.title || c.desc ? '<span class="pill gold">مخصّص</span>' : ''}</td>
      <td><button class="btn sm" data-e="${esc(t.id)}"><i class="fa-solid fa-pen"></i></button></td></tr>`; }).join('') || '<tr><td colspan="5" class="muted center">لا نتائج</td></tr>'}
    </tbody></table></div></div>`;
  $('#sq', body).oninput = e => { SeoUI.q = e.target.value; clearTimeout(seoTrainers._t); seoTrainers._t = setTimeout(() => { seoTrainers(body, main); const el = $('#sq', body); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, 250); };
  $$('[data-e]', body).forEach(b => b.onclick = () => seoTrainerModal(Data.trainer(b.dataset.e), () => seoTrainers(body, main)));
}

/* ===== الخريطة وrobots ===== */
function seoFiles(body) {
  const f = SEO.files(), base = siteBase();
  body.innerHTML = `<form id="ff" class="pbox" style="display:grid;gap:12px">
    <h3><i class="fa-solid fa-sitemap"></i> خريطة الموقع (sitemap.xml)</h3>
    ${seoChk('إدراج صفحات المدربين في الخريطة (عدا من منعت فهرسته)', 'sitemapTrainers', f.sitemapTrainers)}
    <div class="grid2"><label class="field"><span>تكرار التحديث (changefreq)</span><select name="changefreq">${[['', 'بدون'], ['daily', 'يومي'], ['weekly', 'أسبوعي'], ['monthly', 'شهري']].map(([v, l]) => opt(v, l, f.changefreq)).join('')}</select></label>
      <label class="field"><span>الأولوية (priority)</span><select name="priority">${[['', 'بدون'], ['1.0', '1.0'], ['0.8', '0.8'], ['0.5', '0.5']].map(([v, l]) => opt(v, l, f.priority)).join('')}</select></label></div>
    <h3><i class="fa-solid fa-robot"></i> ملف robots.txt</h3>
    <label class="field"><span>قواعد إضافية (سطر لكل قاعدة: Disallow: /مسار أو Allow: /مسار)</span><textarea name="robotsExtra" dir="ltr" style="min-height:90px" placeholder="Disallow: /og/">${esc(f.robotsExtra || '')}</textarea><small>تُقبل الأسطر التي تبدأ بـ Disallow أو Allow أو Crawl-delay فقط.</small></label>
    <div class="row"><button class="btn primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> حفظ</button></div></form>
    <div class="grid2" style="margin-top:12px"><div class="pbox"><h4>معاينة robots.txt</h4><pre dir="ltr" id="rb" style="white-space:pre-wrap;font-size:.8rem"></pre></div>
    <div class="pbox"><h4>معاينة sitemap.xml</h4><pre dir="ltr" id="sm" style="white-space:pre-wrap;font-size:.75rem;max-height:240px;overflow:auto"></pre></div></div>
    <div class="pbox" style="margin-top:12px"><h4><i class="fa-solid fa-link"></i> روابط مفيدة</h4><ul class="small">
      <li><a target="_blank" rel="noopener" href="${esc(base)}sitemap.xml">sitemap.xml المنشورة</a> · <a target="_blank" rel="noopener" href="${esc(base)}robots.txt">robots.txt المنشور</a></li>
      <li><a target="_blank" rel="noopener" href="https://search.google.com/search-console">Google Search Console</a>: أضف الموقع، ثم من «Sitemaps» أرسل <b dir="ltr">sitemap.xml</b>.</li>
      <li><a target="_blank" rel="noopener" href="https://www.bing.com/webmasters">Bing Webmaster Tools</a> · <a target="_blank" rel="noopener" href="https://search.google.com/test/rich-results">اختبار النتائج المنسّقة</a></li></ul></div>`;
  const prev = () => {
    const fm = $('#ff', body), tmp = { ...SEO.FILES_DEF, robotsExtra: fm.robotsExtra.value, sitemapTrainers: fm.sitemapTrainers.checked, changefreq: fm.changefreq.value, priority: fm.priority.value };
    $('#rb', body).textContent = SEO.robotsTxt(base, tmp); $('#sm', body).textContent = SEO.sitemapXml(base, Data.live(), tmp);
  };
  $('#ff', body).addEventListener('input', prev); prev();
  $('#ff', body).onsubmit = e => {
    e.preventDefault(); const fm = e.target;
    Store.set('content/seo/files', { robotsExtra: fm.robotsExtra.value.trim(), sitemapTrainers: fm.sitemapTrainers.checked, changefreq: fm.changefreq.value, priority: fm.priority.value }); Security.log('تعديل SEO', 'الخريطة وrobots'); toast('تم الحفظ');
  };
}

/* ===== فحص الجودة ===== */
function seoCheck(body, main) {
  const s = SEO.site(), live = Data.live(), issues = [];
  const add = (lvl, text, act) => issues.push({ lvl, text, act });
  const hm = SEO.pageMeta('home');
  if (!s.robotsIndex) add('bad', 'الفهرسة متوقفة كلياً: الموقع لن يظهر في نتائج البحث', 'general');
  if (hm.title.length > 60 || hm.title.length < 20) add('warn', `عنوان الصفحة الرئيسية ${hm.title.length} حرفاً (الموصى به 20–60)`, 'general');
  if (hm.desc.length > 160 || hm.desc.length < 70) add('warn', `وصف الصفحة الرئيسية ${hm.desc.length} حرفاً (الموصى به 70–160)`, 'general');
  if (!s.gsc) add('info', 'لم تُضف كود التحقق من Google Search Console', 'general');
  if (!s.orgSameAs) add('info', 'أضف حسابات المنصة الرسمية (sameAs) لتحسين البيانات المنظّمة', 'general');
  SEO.PAGES.slice(1).forEach(([k, name]) => { const m = SEO.pageMeta(k); if (m.noindex) add('info', `صفحة «${name}» ممنوعة الفهرسة`, 'pages'); if (m.desc.length > 160) add('warn', `وصف «${name}» أطول من 160`, 'pages'); });
  const titles = {}, descs = {}; const per = [];
  live.forEach(t => { const m = SEO.trainerMeta(t); (titles[m.title] = titles[m.title] || []).push(t); (descs[m.desc] = descs[m.desc] || []).push(t);
    const p = []; if (!m.noindex) { if (m.title.length > 60) p.push('عنوان أطول من 60'); if (m.desc.length < 50) p.push('وصف قصير (أقل من 50)'); if (m.desc.length > 160) p.push('وصف أطول من 160'); if (!(t.title || '').trim()) p.push('لا سطر تعريفي'); if (!Data.photo(t) && !t.noPhoto) p.push('بلا صورة'); }
    if (p.length) per.push({ t, p }); });
  Object.entries(titles).filter(([, l]) => l.length > 1).forEach(([ti, l]) => add('warn', `عنوان مكرر في ${l.length} صفحات مدربين: «${ti}»`, 'trainers'));
  const noidx = live.filter(t => SEO.trainerCfg(t.id).noindex).length; if (noidx) add('info', `${noidx} مدرب ممنوع الفهرسة`, 'trainers');
  const ok = !issues.some(i => i.lvl !== 'info') && !per.length;
  body.innerHTML = `<div class="pbox"><h3><i class="fa-solid fa-stethoscope"></i> نتيجة الفحص ${ok ? '<span class="pill ok">سليم</span>' : '<span class="pill warn">يحتاج مراجعة</span>'}</h3>
    ${issues.length ? `<ul class="seo-issues">${issues.map((i, n) => `<li class="${i.lvl}"><i class="fa-solid ${i.lvl === 'bad' ? 'fa-circle-xmark' : i.lvl === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i> ${esc(i.text)} <a href="#" data-go="${i.act}">${'تعديل'}</a></li>`).join('')}</ul>` : '<p class="muted">لا ملاحظات على الإعدادات العامة.</p>'}
    <h4 style="margin-top:14px">صفحات المدربين (${live.length})</h4>
    ${per.length ? `<ul class="seo-issues">${per.map(({ t, p }) => `<li class="warn"><i class="fa-solid fa-triangle-exclamation"></i> <b>${esc(t.name)}</b>: ${esc(p.join('، '))} <a href="#" data-e="${esc(t.id)}">تعديل</a></li>`).join('')}</ul>` : '<p class="muted">كل صفحات المدربين ضمن الحدود الموصى بها.</p>'}</div>`;
  $$('[data-go]', body).forEach(a => a.onclick = e => { e.preventDefault(); SeoUI.view = a.dataset.go; aSeo(main); });
  $$('[data-e]', body).forEach(a => a.onclick = e => { e.preventDefault(); seoTrainerModal(Data.trainer(a.dataset.e), () => seoCheck(body, main)); });
}
