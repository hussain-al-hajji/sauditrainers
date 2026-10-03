/* لوحة الإدارة ← المؤشرات: إحصاءات الزيارات والجمهور والبحث
 * المصادر: (1) عدّادات المنصة الذاتية analytics/ (آنية، بلا بيانات شخصية)،
 *          (2) Google Analytics 4 وSearch Console عبر سكربت الأتمتة → analytics_ext/ga و analytics_ext/gsc. */

const Stats = { days: 30 };

const AN_PAGES = { home: 'الرئيسية', trainers: 'دليل المدربين', profile: 'بطاقة مدرب', join: 'التسجيل كمدرب', request: 'طلب مدرب', halls: 'قاعات التدريب', about: 'عن المنصة', login: 'دخول المدربين', status: 'متابعة الطلب' };
const AN_DEV = { mobile: 'جوال', desktop: 'كمبيوتر', tablet: 'لوحي' };
const AN_BROWSER = { chrome: 'Chrome', safari: 'Safari', edge: 'Edge', firefox: 'Firefox', samsung: 'Samsung', opera: 'Opera', other: 'أخرى' };
const AN_REF = { direct: 'مباشر', other: 'أخرى', 'google-com': 'Google', 't-co': 'X (تويتر)', 'twitter-com': 'X (تويتر)', 'x-com': 'X (تويتر)', 'linkedin-com': 'LinkedIn', 'lnkd-in': 'LinkedIn', 'instagram-com': 'Instagram', 'facebook-com': 'Facebook', 'whatsapp-com': 'WhatsApp', 'web-whatsapp-com': 'WhatsApp', 'snapchat-com': 'Snapchat', 'youtube-com': 'YouTube', 'tiktok-com': 'TikTok', 'bing-com': 'Bing', 'duckduckgo-com': 'DuckDuckGo' };
const AN_CHANNEL = { Direct: 'مباشر', 'Organic Search': 'بحث (مجاني)', 'Organic Social': 'تواصل اجتماعي', 'Paid Search': 'بحث مدفوع', 'Paid Social': 'تواصل مدفوع', Referral: 'إحالة من مواقع', Email: 'بريد', Display: 'إعلانات', Unassigned: 'غير محدد', 'Organic Video': 'فيديو', 'Cross-network': 'متعدد الشبكات' };
const AN_A3 = { sau: 'SA', are: 'AE', kwt: 'KW', qat: 'QA', bhr: 'BH', omn: 'OM', egy: 'EG', jor: 'JO', usa: 'US', gbr: 'GB', ind: 'IN', pak: 'PK', tur: 'TR', irq: 'IQ', yem: 'YE', sdn: 'SD', mar: 'MA', dza: 'DZ', tun: 'TN', lby: 'LY', lbn: 'LB', syr: 'SY', pse: 'PS', deu: 'DE', fra: 'FR', can: 'CA', aus: 'AU', mys: 'MY', idn: 'ID', bgd: 'BD' };
const AN_COLORS = ['#005430', '#138550', '#6E9142', '#86D3AC', '#C9DAB4', '#3B5420', '#B8A25A', '#8AA294'];

const anNum = n => Number(n || 0).toLocaleString('en-US');
const anPct = (a, b) => (b ? Math.round(a / b * 1000) / 10 : 0);
function anCountry(code, name) {
  const c = String(code || '').length === 3 ? AN_A3[String(code).toLowerCase()] : String(code || '').toUpperCase();
  try { if (c && /^[A-Z]{2}$/.test(c)) return new Intl.DisplayNames(['ar'], { type: 'region' }).of(c) || name || c; } catch { /* ignore */ }
  return name || c || '—';
}
const anDur = s => { s = Math.round(Number(s) || 0); return s >= 60 ? `${Math.floor(s / 60)}د ${s % 60}ث` : `${s}ث`; };

// صفوف الأيام الأخيرة من analytics/day (n يوماً حتى اليوم)
function anDays(n, offset = 0) {
  const all = Store.get('analytics/day') || {}, out = [];
  for (let i = n - 1 + offset; i >= offset; i--) {
    const dt = new Date(Date.now() + 3 * 3600e3 - i * 864e5), k = dt.toISOString().slice(0, 10).replace(/-/g, ''), r = all[k] || {};
    out.push({ k, label: `${dt.getUTCDate()}/${dt.getUTCMonth() + 1}`, views: +r.views || 0, visits: +r.visits || 0, visitors: +r.visitors || 0, newv: +r.newv || 0, searches: +r.searches || 0, contacts: +r.contacts || 0, joins: +r.joins || 0, requests: +r.requests || 0 });
  }
  return out;
}
const anSum = (rows, f) => rows.reduce((a, r) => a + (+r[f] || 0), 0);
// أعلى القيم من فرع عدّادات (page, ref, dev, ...)
const anTop = (kind, max = 10) => Object.entries(Store.get(`analytics/${kind}`) || {}).map(([k, v]) => [k, +v || 0]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, max);

function anDelta(cur, prev) {
  if (!prev && !cur) return '<div class="an-d flat">—</div>';
  if (!prev) return '<div class="an-d up">▲ جديد</div>';
  const p = Math.round((cur - prev) / prev * 100);
  return `<div class="an-d ${p > 0 ? 'up' : p < 0 ? 'down' : 'flat'}" title="مقارنة بالفترة السابقة (${anNum(prev)})">${p > 0 ? '▲' : p < 0 ? '▼' : '■'} ${Math.abs(p)}%</div>`;
}
const anKpi = (icon, val, label, delta, dark) => `<div class="kpi ${dark ? 'dark' : ''}"><i class="fa-solid ${icon}"></i><b class="num">${val}</b><span>${label}</span>${delta || ''}</div>`;

function anLine(rows, series, h = 200) {
  const W = 800, L = 44, R = 10, T = 12, B = 26, n = rows.length;
  const max = Math.max(1, ...series.flatMap(s => rows.map(r => r[s.k])));
  const nice = (() => { const p = Math.pow(10, Math.floor(Math.log10(max))); return Math.ceil(max / p * 2) / 2 * p || 1; })();
  const x = i => L + (n > 1 ? i / (n - 1) : .5) * (W - L - R), y = v => T + (1 - v / nice) * (h - T - B);
  const grid = [0, .25, .5, .75, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(nice * f)}" y2="${y(nice * f)}" stroke="#E4ECDB"/><text x="${L - 6}" y="${y(nice * f) + 4}" text-anchor="end" font-size="11" fill="#6A7F72">${anNum(Math.round(nice * f))}</text>`).join('');
  const step = Math.ceil(n / 8), xl = rows.map((r, i) => (i % step === 0 && (n - 1 - i >= step / 2 || i === n - 1) || i === n - 1) ? `<text x="${x(i)}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#6A7F72">${r.label}</text>` : '').join('');
  const paths = series.map((s, si) => {
    const pts = rows.map((r, i) => `${x(i).toFixed(1)},${y(r[s.k]).toFixed(1)}`);
    return `${si === 0 ? `<path d="M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)} Z" fill="${s.c}" opacity=".12"/>` : ''}<polyline points="${pts.join(' ')}" fill="none" stroke="${s.c}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="6 5"' : ''}/>`;
  }).join('');
  const hit = rows.map((r, i) => `<rect x="${x(i) - (W - L - R) / Math.max(1, n - 1) / 2}" y="${T}" width="${(W - L - R) / Math.max(1, n - 1)}" height="${h - T - B}" fill="transparent"><title>${r.label} — ${series.map(s => `${s.name}: ${anNum(r[s.k])}`).join(' · ')}</title></rect>`).join('');
  return `<svg viewBox="0 0 ${W} ${h}" class="an-svg" role="img" aria-label="رسم بياني">${grid}${paths}${xl}${hit}</svg>
    <div class="an-leg">${series.map(s => `<span><i style="background:${s.c}"></i>${s.name}</span>`).join('')}</div>`;
}
function anDonut(rows, nameFn) {
  const tot = rows.reduce((a, r) => a + r[1], 0);
  if (!tot) return '<p class="muted small">لا بيانات بعد</p>';
  let acc = 0; const R = 54, C = 2 * Math.PI * R;
  const segs = rows.map((r, i) => { const f = r[1] / tot, d = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${AN_COLORS[i % AN_COLORS.length]}" stroke-width="26" stroke-dasharray="${(f * C).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acc * C).toFixed(2)}" transform="rotate(-90 70 70)"><title>${esc(nameFn(r[0]))}: ${anNum(r[1])}</title></circle>`; acc += f; return d; }).join('');
  return `<div class="an-donut"><svg viewBox="0 0 140 140" width="140" height="140">${segs}<text x="70" y="75" text-anchor="middle" font-size="18" font-weight="800" fill="#0D2418">${anNum(tot)}</text></svg>
    <ul>${rows.map((r, i) => `<li><i style="background:${AN_COLORS[i % AN_COLORS.length]}"></i><span>${esc(nameFn(r[0]))}</span><b class="num">${anPct(r[1], tot)}%</b></li>`).join('')}</ul></div>`;
}
const anBars = (rows, nameFn, empty = 'لا بيانات بعد') => {
  const m = Math.max(1, ...rows.map(r => r[1]));
  return rows.length ? `<div class="bars">${rows.map(r => `<div class="bar"><span>${esc(nameFn(r[0]))}</span><div class="t"><span style="width:${r[1] / m * 100}%"></span></div><b class="num">${anNum(r[1])}</b></div>`).join('')}</div>` : `<p class="muted small">${empty}</p>`;
};
const anBox = (icon, title, body, cls = '') => `<div class="pbox ${cls}"><h3><i class="fa-solid ${icon}"></i>${title}</h3>${body}</div>`;

/* ===== أقسام اللوحة ===== */
function statsOwn() {
  const n = Stats.days, cur = anDays(n), prev = anDays(n, n);
  const S = f => anSum(cur, f), P = f => anSum(prev, f);
  const visits = S('visits'), views = S('views');
  const hasData = !!Store.get('analytics/day');
  const hours = Array.from({ length: 24 }, (_, h) => [String(h).padStart(2, '0'), +(Store.get(`analytics/hour/${String(h).padStart(2, '0')}`) || 0)]);
  const hm = Math.max(1, ...hours.map(h => h[1]));
  const page = k => +(Store.get(`analytics/page/${k}`) || 0);
  const apps = Store.list('applications');
  const sinceMs = Date.now() - n * 864e5;
  const appsN = apps.filter(a => a.ts >= sinceMs).length, appsPrev = apps.filter(a => a.ts < sinceMs && a.ts >= sinceMs - n * 864e5).length;
  const funnel = [['زيارات الموقع', anSum(anDays(90), 'visits')], ['فتحوا دليل المدربين', page('trainers')], ['فتحوا بطاقة مدرب', page('profile')], ['أرسلوا طلب تواصل', anSum(anDays(90), 'contacts')]];
  const fjoin = [['فتحوا صفحة التسجيل', page('join')], ['أرسلوا طلب تسجيل', anSum(anDays(90), 'joins')]];
  const fm = Math.max(1, ...funnel.map(f => f[1]));
  return `
    <div class="an-head"><div><h3><i class="fa-solid fa-chart-line"></i> زيارات المنصة</h3><small class="muted">عدّادات المنصة الذاتية، آنية وبلا بيانات شخصية. لا تُحسب زياراتك كمشرف.</small></div>
      <div class="an-per">${[7, 30, 90].map(d => `<button data-an-p="${d}" class="${n === d ? 'on' : ''}">${d} يوماً</button>`).join('')}</div></div>
    ${hasData ? '' : '<div class="banner info"><i class="fa-solid fa-circle-info"></i><span>لم تُسجَّل زيارات بعد. تبدأ الأرقام بالظهور بعد نشر آخر تحديث للموقع وتصفّح الزوار له.</span></div>'}
    <div class="kpis">
      ${anKpi('fa-door-open', anNum(visits), 'زيارة (جلسة)', anDelta(visits, P('visits')), true)}
      ${anKpi('fa-users', anNum(S('visitors')), 'زائر فريد (يومياً)', anDelta(S('visitors'), P('visitors')))}
      ${anKpi('fa-eye', anNum(views), 'مشاهدة صفحة', anDelta(views, P('views')))}
      ${anKpi('fa-layer-group', visits ? (views / visits).toFixed(1) : '0', 'صفحة لكل زيارة', '')}
      ${anKpi('fa-user-plus', anPct(S('newv'), S('visitors')) + '%', 'زوار جدد', anDelta(S('newv'), P('newv')))}
      ${anKpi('fa-magnifying-glass', anNum(S('searches')), 'عملية بحث في الدليل', anDelta(S('searches'), P('searches')))}
      ${anKpi('fa-inbox', anNum(S('contacts')), 'طلب تواصل مع مدرب', anDelta(S('contacts'), P('contacts')))}
      ${anKpi('fa-user-check', anNum(appsN), 'طلب تسجيل مدرب', anDelta(appsN, appsPrev))}
    </div>
    ${anBox('fa-chart-area', `الزيارات والمشاهدات يومياً — آخر ${n} يوماً`, anLine(cur, [{ k: 'views', name: 'مشاهدات الصفحات', c: '#005430' }, { k: 'visits', name: 'الزيارات', c: '#6E9142' }, { k: 'visitors', name: 'الزوار الفريدون', c: '#B8A25A', dash: true }]))}
    <div class="grid2">
      ${anBox('fa-mobile-screen', 'الأجهزة', anDonut(anTop('dev'), k => AN_DEV[k] || k))}
      ${anBox('fa-globe', 'المتصفحات', anDonut(anTop('browser'), k => AN_BROWSER[k] || k))}
      ${anBox('fa-share-from-square', 'مصادر الزيارات (من أين جاؤوا)', anBars(anTop('ref', 8), k => AN_REF[k] || k.replace(/-/g, '.')))}
      ${anBox('fa-bullhorn', 'حملاتك الإعلانية (utm_source)', anBars(anTop('utm', 8), k => k, 'أضف <span dir="ltr">?utm_source=twitter</span> لروابط منشوراتك لمعرفة أي قناة تجلب زواراً'))}
      ${anBox('fa-file-lines', 'أكثر الصفحات مشاهدة', anBars(anTop('page', 9), k => AN_PAGES[k] || k))}
      ${anBox('fa-language', 'لغة متصفح الزائر', anBars(anTop('lang', 6), k => ({ ar: 'العربية', en: 'الإنجليزية', ur: 'الأردية', fr: 'الفرنسية', tr: 'التركية', id: 'الإندونيسية', hi: 'الهندية' })[k] || k))}
      ${anBox('fa-magnifying-glass', 'ماذا يبحث عنه الزوار؟ (كلمات البحث)', anBars(anTop('term', 12), k => k.replace(/-/g, ' '), 'تظهر هنا كلمات البحث في دليل المدربين'))}
      ${anBox('fa-filter', 'التخصصات والمناطق الأكثر تصفية', `<h4 class="an-h4">التخصصات</h4>${anBars(anTop('spec', 6), k => specName(k))}<h4 class="an-h4">المناطق</h4>${anBars(anTop('region', 6), k => regionName(k))}`)}
    </div>
    ${anBox('fa-clock', 'ساعات الذروة (بتوقيت الرياض)', `<div class="an-hours">${hours.map(([h, v]) => `<div title="${h}:00 — ${anNum(v)} زيارة"><span style="height:${Math.max(3, v / hm * 100)}%"></span><small>${+h % 3 === 0 ? h : ''}</small></div>`).join('')}</div>`)}
    <div class="grid2">
      ${anBox('fa-filter-circle-dollar', 'قمع الزائر ← طلب تواصل (منذ بدء الرصد)', `<div class="an-funnel">${funnel.map((f, i) => `<div><span style="width:${Math.max(4, f[1] / fm * 100)}%"></span><b>${esc(f[0])}</b><em class="num">${anNum(f[1])}${i ? ` · ${anPct(f[1], funnel[i - 1][1])}%` : ''}</em></div>`).join('')}</div>`)}
      ${anBox('fa-user-plus', 'قمع التسجيل كمدرب', `<div class="an-funnel">${fjoin.map((f, i) => `<div><span style="width:${Math.max(4, f[1] / Math.max(1, fjoin[0][1]) * 100)}%"></span><b>${esc(f[0])}</b><em class="num">${anNum(f[1])}${i ? ` · ${anPct(f[1], fjoin[0][1])}%` : ''}</em></div>`).join('')}</div><p class="muted small" style="margin-top:10px">نسبة التحويل = من فتح صفحة التسجيل وأكمل الطلب.</p>`)}
    </div>`;
}

function anGaCard(ga) {
  const o = ga.overview || {}, pv = o.prev || {};
  const rows = arr(ga.daily).map(r => { const d = String(r[0]); return { label: `${+d.slice(6)}/${+d.slice(4, 6)}`, users: +r[1] || 0, sessions: +r[2] || 0, views: +r[3] || 0 }; });
  const list = (k, nameFn) => arr(ga[k]).map(r => [nameFn(r), +r[r.length - 1] || 0]);
  const rt = ga.realtime || {};
  return `
    <div class="an-head"><div><h3><i class="fa-brands fa-google"></i> Google Analytics — آخر 28 يوماً</h3><small class="muted">تحديث: ${ga.updatedAt ? ago(ga.updatedAt) : '—'}</small></div></div>
    <div class="kpis">
      ${anKpi('fa-bolt', anNum(rt.users), 'نشط الآن (آخر 30 دقيقة)', '', true)}
      ${anKpi('fa-users', anNum(o.activeUsers), 'مستخدم نشط', anDelta(o.activeUsers, pv.activeUsers))}
      ${anKpi('fa-user-plus', anNum(o.newUsers), 'مستخدم جديد', anDelta(o.newUsers, pv.newUsers))}
      ${anKpi('fa-door-open', anNum(o.sessions), 'جلسة', anDelta(o.sessions, pv.sessions))}
      ${anKpi('fa-eye', anNum(o.pageViews), 'مشاهدة صفحة', anDelta(o.pageViews, pv.pageViews))}
      ${anKpi('fa-stopwatch', anDur(o.avgDuration), 'متوسط مدة الجلسة', '')}
      ${anKpi('fa-hand-pointer', anPct(+o.engagementRate || 0, 1) + '%', 'نسبة التفاعل', '')}
      ${anKpi('fa-person-walking-arrow-right', anPct(+o.bounceRate || 0, 1) + '%', 'معدل الارتداد', '')}
    </div>
    ${rows.length ? anBox('fa-chart-area', 'المستخدمون والجلسات يومياً', anLine(rows, [{ k: 'views', name: 'المشاهدات', c: '#005430' }, { k: 'sessions', name: 'الجلسات', c: '#6E9142' }, { k: 'users', name: 'المستخدمون', c: '#B8A25A', dash: true }])) : ''}
    <div class="grid2">
      ${anBox('fa-earth-asia', 'الدول', anBars(list('countries', r => anCountry(r[0], r[1])), k => k))}
      ${anBox('fa-city', 'المدن', anBars(list('cities', r => r[0]), k => k))}
      ${anBox('fa-route', 'قنوات الوصول', anBars(list('channels', r => AN_CHANNEL[r[0]] || r[0]), k => k))}
      ${anBox('fa-link', 'المصادر', anBars(list('sources', r => r[0] === '(direct)' ? 'مباشر' : r[0]), k => k))}
      ${anBox('fa-mobile-screen', 'الأجهزة', anDonut(list('devices', r => r[0]), k => AN_DEV[k] || k))}
      ${anBox('fa-file-lines', 'أكثر الصفحات', anBars(list('pages', r => r[0] || '/'), k => k))}
    </div>`;
}

function anGscCard(g) {
  const t = g.totals || {}, pv = g.prev || {};
  const rows = arr(g.daily).map(r => { const d = String(r[0]); return { label: `${+d.slice(8)}/${+d.slice(5, 7)}`, clicks: +r[1] || 0, impr: +r[2] || 0 }; });
  const tbl = (head, body) => `<div class="tbl-wrap" style="box-shadow:none"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  const qrows = arr(g.queries).slice(0, 20).map(r => `<tr><td>${esc(r[0])}</td><td>${anNum(r[1])}</td><td>${anNum(r[2])}</td><td>${(+r[3] * 100).toFixed(1)}%</td><td>${(+r[4]).toFixed(1)}</td></tr>`).join('');
  const prows = arr(g.pages).slice(0, 10).map(r => `<tr><td dir="ltr" style="text-align:end">${esc(String(r[0]).replace(/^https?:\/\/[^/]+/, '') || '/')}</td><td>${anNum(r[1])}</td><td>${anNum(r[2])}</td></tr>`).join('');
  return `
    <div class="an-head"><div><h3><i class="fa-solid fa-magnifying-glass-chart"></i> ظهور المنصة في بحث Google (Search Console)</h3><small class="muted">${g.range ? `${esc(g.range.start)} → ${esc(g.range.end)}` : ''} · تأخر البيانات يومان إلى ثلاثة · تحديث: ${g.updatedAt ? ago(g.updatedAt) : '—'}</small></div></div>
    <div class="kpis">
      ${anKpi('fa-eye', anNum(t.impressions), 'مرة ظهرت في نتائج البحث', anDelta(t.impressions, pv.impressions), true)}
      ${anKpi('fa-arrow-pointer', anNum(t.clicks), 'نقرة من نتائج البحث', anDelta(t.clicks, pv.clicks))}
      ${anKpi('fa-percent', ((+t.ctr || 0) * 100).toFixed(1) + '%', 'نسبة النقر (CTR)', '')}
      ${anKpi('fa-ranking-star', (+t.position || 0).toFixed(1), 'متوسط الترتيب في البحث', '')}
    </div>
    ${rows.length ? anBox('fa-chart-area', 'الظهور والنقرات يومياً', anLine(rows, [{ k: 'impr', name: 'مرات الظهور', c: '#005430' }, { k: 'clicks', name: 'النقرات', c: '#B8A25A' }])) : ''}
    <div class="grid2">
      ${anBox('fa-keyboard', 'كلمات البحث التي ظهرتَ بها', qrows ? tbl(['الكلمة', 'نقرات', 'ظهور', 'CTR', 'الترتيب'], qrows) : '<p class="muted small">لا بيانات بعد</p>')}
      <div>${anBox('fa-file-lines', 'الصفحات الأكثر ظهوراً', prows ? tbl(['الصفحة', 'نقرات', 'ظهور'], prows) : '<p class="muted small">لا بيانات بعد</p>')}
        ${anBox('fa-earth-asia', 'الدول', anBars(arr(g.countries).slice(0, 8).map(r => [anCountry(r[0]), +r[2] || 0]), k => k))}
        ${anBox('fa-mobile-screen', 'الأجهزة', anDonut(arr(g.devices).map(r => [r[0].toLowerCase(), +r[2] || 0]), k => AN_DEV[k] || k))}</div>
    </div>`;
}

function anSetup(kind) {
  const isGa = kind === 'ga';
  return `<div class="pbox an-setup"><h3><i class="fa-solid fa-plug"></i>${isGa ? 'ربط Google Analytics' : 'ربط Search Console'} <span class="pill gray">غير مفعّل</span></h3>
    <p class="muted small">${isGa ? 'يعرض الدول والمدن والمستخدمين النشطين الآن ومدة الجلسة ومصادر الزيارات بدقة أعلى.' : 'يعرض كم مرة ظهرت منصتك في نتائج Google، وكلمات البحث التي جلبت الزوار، وترتيبك فيها.'}
    الخطوات في <code>integrations/google-apps-script/README.md</code> (قسم «إحصاءات Google»)، ويتم الربط مرة واحدة.</p></div>`;
}

function statsMount(main) {
  const box = $('#anx', main); if (!box) return;
  const ga = Store.get('analytics_ext/ga'), gsc = Store.get('analytics_ext/gsc');
  box.innerHTML = `${statsOwn()}
    <div class="an-ext-h"><h2><i class="fa-brands fa-google"></i> بيانات Google</h2>
      ${Automation.on ? '<button class="btn sm" id="anr"><i class="fa-solid fa-rotate"></i> تحديث الآن</button>' : ''}</div>
    ${ga ? anGaCard(ga) : anSetup('ga')}
    ${gsc ? anGscCard(gsc) : anSetup('gsc')}
    ${ga?.error || gsc?.error ? `<div class="banner warn"><i class="fa-solid fa-triangle-exclamation"></i><span>${esc([ga?.error && 'Analytics: ' + ga.error, gsc?.error && 'Search Console: ' + gsc.error].filter(Boolean).join(' | '))}</span></div>` : ''}`;
  $$('[data-an-p]', box).forEach(b => b.onclick = () => { Stats.days = +b.dataset.anP; statsMount(main); });
  const r = $('#anr', box);
  r && (r.onclick = async () => { r.disabled = true; await Automation.notify('analytics', 'now'); toast('طُلب تحديث البيانات، يظهر خلال دقيقة تقريباً'); setTimeout(() => { r.disabled = false; }, 8000); });
}
