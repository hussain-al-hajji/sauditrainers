/* لوحة الإدارة ← المؤشرات: إحصاءات الزيارات والجمهور والبحث
 * المصادر: (1) عدّادات المنصة الذاتية analytics/ (آنية، بلا بيانات شخصية)،
 *          (2) Google Analytics 4 وSearch Console عبر سكربت الأتمتة → analytics_ext/ga و analytics_ext/gsc. */

const Stats = { days: 30, gp: '28' };
const AN_GP = [['7', '7 أيام'], ['28', '28 يوماً'], ['90', '90 يوماً'], ['365', '12 شهراً'], ['all', 'منذ البداية']];
const AN_GP_LABEL = { 7: 'آخر 7 أيام', 28: 'آخر 28 يوماً', 90: 'آخر 90 يوماً', 365: 'آخر 12 شهراً', all: 'منذ البداية' };

const AN_PAGES = { home: 'الرئيسية', trainers: 'دليل المدربين', profile: 'بطاقة مدرب', join: 'التسجيل كمدرب', request: 'طلب مدرب', halls: 'قاعات التدريب', about: 'عن المنصة', login: 'دخول المدربين', status: 'متابعة الطلب' };
const AN_DEV = { mobile: 'جوال', desktop: 'كمبيوتر', tablet: 'لوحي' };
const AN_BROWSER = { chrome: 'Chrome', safari: 'Safari', edge: 'Edge', firefox: 'Firefox', samsung: 'Samsung', opera: 'Opera', other: 'أخرى' };
const AN_REF = { direct: 'مباشر', other: 'أخرى', 'google-com': 'Google', 't-co': 'X (تويتر)', 'twitter-com': 'X (تويتر)', 'x-com': 'X (تويتر)', 'linkedin-com': 'LinkedIn', 'lnkd-in': 'LinkedIn', 'instagram-com': 'Instagram', 'facebook-com': 'Facebook', 'whatsapp-com': 'WhatsApp', 'web-whatsapp-com': 'WhatsApp', 'snapchat-com': 'Snapchat', 'youtube-com': 'YouTube', 'tiktok-com': 'TikTok', 'bing-com': 'Bing', 'duckduckgo-com': 'DuckDuckGo' };
const AN_CHANNEL = { Direct: 'مباشر', 'Organic Search': 'بحث (مجاني)', 'Organic Social': 'تواصل اجتماعي', 'Paid Search': 'بحث مدفوع', 'Paid Social': 'تواصل مدفوع', Referral: 'إحالة من مواقع', Email: 'بريد', Display: 'إعلانات', Unassigned: 'غير محدد', 'Organic Video': 'فيديو', 'Cross-network': 'متعدد الشبكات' };
const AN_A3 = { sau: 'SA', are: 'AE', kwt: 'KW', qat: 'QA', bhr: 'BH', omn: 'OM', egy: 'EG', jor: 'JO', usa: 'US', gbr: 'GB', ind: 'IN', pak: 'PK', tur: 'TR', irq: 'IQ', yem: 'YE', sdn: 'SD', mar: 'MA', dza: 'DZ', tun: 'TN', lby: 'LY', lbn: 'LB', syr: 'SY', pse: 'PS', deu: 'DE', fra: 'FR', can: 'CA', aus: 'AU', mys: 'MY', idn: 'ID', bgd: 'BD' };
const AN_COLORS = ['#005430', '#138550', '#6E9142', '#86D3AC', '#C9DAB4', '#3B5420', '#B8A25A', '#8AA294'];

const anDate = d => { d = String(d || ''); return d.length === 8 ? `${d.slice(6)}/${d.slice(4, 6)}/${d.slice(0, 4)}` : d; };
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
  if (prev == null) return '';   // لا فترة سابقة للمقارنة (منذ البداية)
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
// تجميع شهري للفترات الطويلة حتى يبقى الرسم مقروءاً
function anMonthly(rows) {
  const m = {};
  rows.forEach(r => { const k = r.k.slice(0, 6); const o = m[k] || (m[k] = { label: `${+k.slice(4)}/${k.slice(2, 4)}`, views: 0, visits: 0, visitors: 0 }); o.views += r.views; o.visits += r.visits; o.visitors += r.visitors; });
  return Object.values(m);
}
function statsOwn() {
  let n = Stats.days;
  if (!n) {   // منذ بدء الرصد
    const first = Object.keys(Store.get('analytics/day') || {}).sort()[0];
    n = first ? Math.max(1, Math.ceil((Date.now() + 3 * 3600e3 - Date.UTC(+first.slice(0, 4), +first.slice(4, 6) - 1, +first.slice(6, 8))) / 864e5) + 1) : 7;
  }
  const cur = anDays(n), prev = Stats.days ? anDays(n, n) : [];
  const S = f => anSum(cur, f), P = f => (prev.length ? anSum(prev, f) : null);
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
      <div class="an-per">${[[7, '7 أيام'], [30, '30 يوماً'], [90, '90 يوماً'], [365, 'سنة'], [0, 'منذ البدء']].map(([d, l]) => `<button data-an-p="${d}" class="${Stats.days === d ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    ${hasData ? '' : '<div class="banner info"><i class="fa-solid fa-circle-info"></i><span>لم تُسجَّل زيارات بعد. تبدأ الأرقام بالظهور بعد نشر آخر تحديث للموقع وتصفّح الزوار له.</span></div>'}
    <div class="kpis">
      ${anKpi('fa-door-open', anNum(visits), 'زيارة (جلسة)', anDelta(visits, P('visits')), true)}
      ${anKpi('fa-users', anNum(S('visitors')), 'زائر فريد (يومياً)', anDelta(S('visitors'), P('visitors')))}
      ${anKpi('fa-eye', anNum(views), 'مشاهدة صفحة', anDelta(views, P('views')))}
      ${anKpi('fa-layer-group', visits ? (views / visits).toFixed(1) : '0', 'صفحة لكل زيارة', '')}
      ${anKpi('fa-user-plus', anPct(S('newv'), S('visitors')) + '%', 'زوار جدد', anDelta(S('newv'), P('newv')))}
      ${anKpi('fa-magnifying-glass', anNum(S('searches')), 'عملية بحث في الدليل', anDelta(S('searches'), P('searches')))}
      ${anKpi('fa-inbox', anNum(S('contacts')), 'طلب تواصل مع مدرب', anDelta(S('contacts'), P('contacts')))}
      ${anKpi('fa-user-check', anNum(appsN), 'طلب تسجيل مدرب', anDelta(appsN, Stats.days ? appsPrev : null))}
    </div>
    ${anBox('fa-chart-area', `الزيارات والمشاهدات ${n > 120 ? 'شهرياً' : 'يومياً'} — ${Stats.days ? `آخر ${n} يوماً` : 'منذ بدء الرصد'}`, anLine(n > 120 ? anMonthly(cur) : cur, [{ k: 'views', name: 'مشاهدات الصفحات', c: '#005430' }, { k: 'visits', name: 'الزيارات', c: '#6E9142' }, { k: 'visitors', name: 'الزوار الفريدون', c: '#B8A25A', dash: true }]))}
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

function anGaCard(ga0) {
  const ga = ga0.periods ? Object.assign({ updatedAt: ga0.updatedAt, realtime: ga0.realtime }, ga0.periods[Stats.gp] || {}) : ga0;
  const o = ga.overview || {}, pv = o.prev || {};
  const rows = arr(ga.daily).map(r => { const d = String(r[0]); return { label: d.length === 6 ? `${+d.slice(4)}/${d.slice(2, 4)}` : `${+d.slice(6)}/${+d.slice(4, 6)}`, users: +r[1] || 0, sessions: +r[2] || 0, views: +r[3] || 0 }; });
  const list = (k, nameFn) => arr(ga[k]).map(r => [nameFn(r), +r[r.length - 1] || 0]);
  const rt = ga.realtime || {};
  return `
    <div class="an-head"><div><h3><i class="fa-brands fa-google"></i> Google Analytics — ${Stats.gp === 'all' ? (ga0.firstDate ? `منذ ${anDate(ga0.firstDate)} (أقدم بيانات متاحة)` : 'كل البيانات المتاحة') : AN_GP_LABEL[Stats.gp]}</h3><small class="muted">تحديث: ${ga.updatedAt ? ago(ga.updatedAt) : '—'}</small></div></div>
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
    ${rows.length ? anBox('fa-chart-area', `المستخدمون والجلسات ${Stats.gp === '365' || Stats.gp === 'all' ? 'شهرياً' : 'يومياً'}`, anLine(rows, [{ k: 'views', name: 'المشاهدات', c: '#005430' }, { k: 'sessions', name: 'الجلسات', c: '#6E9142' }, { k: 'users', name: 'المستخدمون', c: '#B8A25A', dash: true }])) : ''}
    <div class="grid2">
      ${anBox('fa-earth-asia', 'الدول', anBars(list('countries', r => anCountry(r[0], r[1])), k => k))}
      ${anBox('fa-city', 'المدن', anBars(list('cities', r => r[0]), k => k))}
      ${anBox('fa-route', 'قنوات الوصول', anBars(list('channels', r => AN_CHANNEL[r[0]] || r[0]), k => k))}
      ${anBox('fa-link', 'المصادر', anBars(list('sources', r => r[0] === '(direct)' ? 'مباشر' : r[0]), k => k))}
      ${anBox('fa-mobile-screen', 'الأجهزة', anDonut(list('devices', r => r[0]), k => AN_DEV[k] || k))}
      ${anBox('fa-file-lines', 'أكثر الصفحات', anBars(list('pages', r => r[0] || '/'), k => k))}
    </div>`;
}

function anGscCard(g0) {
  const g = g0.periods ? Object.assign({ updatedAt: g0.updatedAt }, g0.periods[Stats.gp] || {}) : g0;
  const t = g.totals || {}, pv = g.prev || {};
  const rows = arr(g.daily).map(r => { const d = String(r[0]); return { label: d.length === 7 ? `${+d.slice(5)}/${d.slice(2, 4)}` : `${+d.slice(8)}/${+d.slice(5, 7)}`, clicks: +r[1] || 0, impr: +r[2] || 0 }; });
  const tbl = (head, body) => `<div class="tbl-wrap" style="box-shadow:none"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  const qrows = arr(g.queries).slice(0, 20).map(r => `<tr><td>${esc(r[0])}</td><td>${anNum(r[1])}</td><td>${anNum(r[2])}</td><td>${(+r[3] * 100).toFixed(1)}%</td><td>${(+r[4]).toFixed(1)}</td></tr>`).join('');
  const prows = arr(g.pages).slice(0, 10).map(r => `<tr><td dir="ltr" style="text-align:end">${esc(String(r[0]).replace(/^https?:\/\/[^/]+/, '') || '/')}</td><td>${anNum(r[1])}</td><td>${anNum(r[2])}</td></tr>`).join('');
  return `
    <div class="an-head"><div><h3><i class="fa-solid fa-magnifying-glass-chart"></i> ظهور المنصة في بحث Google (Search Console)</h3><small class="muted">${g.range ? `${esc(g.range.start)} → ${esc(g.range.end)}` : ''} · ${Stats.gp === 'all' ? 'آخر 16 شهراً: أقصى ما يحتفظ به Search Console · ' : ''}تأخر البيانات يومان إلى ثلاثة · تحديث: ${g.updatedAt ? ago(g.updatedAt) : '—'}</small></div></div>
    <div class="kpis">
      ${anKpi('fa-eye', anNum(t.impressions), 'مرة ظهرت في نتائج البحث', anDelta(t.impressions, pv.impressions), true)}
      ${anKpi('fa-arrow-pointer', anNum(t.clicks), 'نقرة من نتائج البحث', anDelta(t.clicks, pv.clicks))}
      ${anKpi('fa-percent', ((+t.ctr || 0) * 100).toFixed(1) + '%', 'نسبة النقر (CTR)', '')}
      ${anKpi('fa-ranking-star', (+t.position || 0).toFixed(1), 'متوسط الترتيب في البحث', '')}
    </div>
    ${rows.length ? anBox('fa-chart-area', `الظهور والنقرات ${Stats.gp === '365' || Stats.gp === 'all' ? 'شهرياً' : 'يومياً'}`, anLine(rows, [{ k: 'impr', name: 'مرات الظهور', c: '#005430' }, { k: 'clicks', name: 'النقرات', c: '#B8A25A' }])) : ''}
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

/* ===== السجل الشهري: لقطة شاملة في أول أيام كل شهر (منذ أقدم رقم متاح حتى نهاية الشهر) ===== */
const AN_MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const anMonthName = ym => `${AN_MONTHS_AR[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
function anMonthlyList() { return Object.values(Store.get('analytics_ext/monthly') || {}).filter(m => m && m.ym).sort((a, b) => (a.ym < b.ym ? 1 : -1)); }
function anMonthlyRow(m) {
  const g = m.ga || {}, c = m.gsc || {}, o = m.own || {};
  return { ym: m.ym, sessions: g.mon?.sessions, users: g.mon?.activeUsers, views: g.mon?.pageViews, cumSessions: g.cum?.sessions, cumUsers: g.cum?.activeUsers, cumViews: g.cum?.pageViews, impr: c.mon?.impressions, clicks: c.mon?.clicks, ownVisits: o.mon?.visits, ownCum: o.cum?.visits };
}
function statsMonthly() {
  const list = anMonthlyList();
  const cell = v => (v == null ? '—' : anNum(v));
  return `<div class="an-ext-h"><h2><i class="fa-solid fa-calendar-days"></i> السجل الشهري</h2>
      <div class="row">${Automation.on ? '<button class="btn sm" id="ansnap"><i class="fa-solid fa-camera"></i> لقطة الشهر الماضي الآن</button><button class="btn sm" id="anbf"><i class="fa-solid fa-clock-rotate-left"></i> استرجاع الأشهر السابقة</button>' : ''}${list.length ? '<button class="btn sm" id="ancsv"><i class="fa-solid fa-file-csv"></i> تصدير CSV</button>' : ''}</div></div>
    <p class="muted small">في اليوم الرابع من كل شهر ميلادي تُحفظ لقطة شاملة للشهر المنتهي: الأرقام التراكمية منذ أقدم رقم متاح في Google Analytics حتى نهاية الشهر، وأرقام الشهر نفسه ومقارنتها بالشهر السابق، وظهور المنصة في بحث Google (Search Console يحتفظ بنحو 16 شهراً فقط). اضغط أي شهر لتفاصيله.</p>
    ${list.length ? `<div class="tbl-wrap"><table class="tbl an-mt"><thead><tr><th>الشهر</th><th>جلسات الشهر</th><th>مستخدمو الشهر</th><th>مشاهدات الشهر</th><th>جلسات تراكمية</th><th>ظهور في Google</th><th>نقرات Google</th></tr></thead><tbody>
      ${list.map(m => { const r = anMonthlyRow(m); return `<tr data-ym="${esc(m.ym)}" style="cursor:pointer"><td><b>${esc(anMonthName(m.ym))}</b>${m.error ? ' <span class="pill warn" title="' + esc(m.error) + '">ناقصة</span>' : ''}</td><td>${cell(r.sessions ?? r.ownVisits)}</td><td>${cell(r.users)}</td><td>${cell(r.views)}</td><td>${cell(r.cumSessions ?? r.ownCum)}</td><td>${cell(r.impr)}</td><td>${cell(r.clicks)}</td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="pbox an-setup"><p class="muted small">لا لقطات شهرية بعد. ستُنشأ تلقائياً في اليوم الرابع من الشهر القادم، أو اضغط «استرجاع الأشهر السابقة» لإنشاء السجل منذ أقدم رقم متاح (يعالج 12 شهراً في كل مرة).</p></div>'}`;
}
function anMonthDetail(m) {
  const g = m.ga || {}, c = m.gsc || {}, o = m.own || {}, pv = g.prev || {};
  const k = (icon, v, l, d) => anKpi(icon, v, l, d || '');
  const list = (rows, f) => arr(rows).map(f);
  const body = `
    ${g.cum ? `<h4 class="an-h4">تراكمي منذ ${g.since ? anDate(g.since) : 'أقدم رقم'} حتى ${anDate(m.ym.replace('-', '') + String(new Date(Date.UTC(+m.ym.slice(0, 4), +m.ym.slice(5, 7), 0)).getUTCDate()))} (Google Analytics)</h4>
      <div class="kpis">${k('fa-door-open', anNum(g.cum.sessions), 'جلسة')}${k('fa-users', anNum(g.cum.activeUsers), 'مستخدم')}${k('fa-eye', anNum(g.cum.pageViews), 'مشاهدة صفحة')}</div>
      <h4 class="an-h4">${esc(anMonthName(m.ym))} وحده</h4>
      <div class="kpis">${k('fa-door-open', anNum(g.mon.sessions), 'جلسة', anDelta(g.mon.sessions, pv.sessions))}${k('fa-users', anNum(g.mon.activeUsers), 'مستخدم', anDelta(g.mon.activeUsers, pv.activeUsers))}${k('fa-eye', anNum(g.mon.pageViews), 'مشاهدة', anDelta(g.mon.pageViews, pv.pageViews))}${k('fa-stopwatch', anDur(g.mon.avgDuration), 'متوسط الجلسة')}</div>
      <div class="grid2">${anBox('fa-earth-asia', 'الدول', anBars(list(g.countries, r => [anCountry(r[0], r[1]), +r[2] || 0]), x => x))}${anBox('fa-route', 'القنوات', anBars(list(g.channels, r => [AN_CHANNEL[r[0]] || r[0], +r[1] || 0]), x => x))}
      ${anBox('fa-city', 'المدن', anBars(list(g.cities, r => [r[0], +r[1] || 0]), x => x))}${anBox('fa-file-lines', 'الصفحات', anBars(list(g.pages, r => [r[0] || '/', +r[1] || 0]), x => x))}</div>` : '<p class="muted small">لا بيانات Google Analytics لهذا الشهر.</p>'}
    ${c.cum ? `<h4 class="an-h4">Search Console (من ${esc(c.oldest || '')} حتى نهاية الشهر · أقصى ما يتوفر)</h4>
      <div class="kpis">${k('fa-eye', anNum(c.cum.impressions), 'ظهور تراكمي')}${k('fa-arrow-pointer', anNum(c.cum.clicks), 'نقرات تراكمية')}${k('fa-eye', anNum(c.mon.impressions), 'ظهور الشهر')}${k('fa-arrow-pointer', anNum(c.mon.clicks), 'نقرات الشهر')}</div>
      ${arr(c.queries).length ? anBox('fa-keyboard', 'كلمات البحث', anBars(arr(c.queries).map(r => [r[0], +r[2] || 0]), x => x)) : ''}` : ''}
    ${o.cum ? `<h4 class="an-h4">عدّادات المنصة الذاتية</h4><div class="kpis">${k('fa-door-open', anNum(o.cum.visits), 'زيارة تراكمية')}${k('fa-door-open', anNum(o.mon.visits), 'زيارات الشهر')}${k('fa-magnifying-glass', anNum(o.mon.searches), 'عمليات بحث')}${k('fa-inbox', anNum(o.mon.contacts), 'طلبات تواصل')}</div>` : ''}`;
  modal(`<h3><i class="fa-solid fa-calendar-days"></i> لقطة ${esc(anMonthName(m.ym))}</h3><p class="muted small">أُنشئت ${fmtTs(m.createdAt)}</p>${body}`, { wide: true });
}
function anMonthlyCsv() {
  const head = ['الشهر', 'جلسات الشهر', 'مستخدمو الشهر', 'مشاهدات الشهر', 'جلسات تراكمية', 'مستخدمون تراكميون', 'مشاهدات تراكمية', 'ظهور Google', 'نقرات Google', 'زيارات ذاتية للشهر'];
  const rows = anMonthlyList().sort((a, b) => (a.ym < b.ym ? -1 : 1)).map(m => { const r = anMonthlyRow(m); return [m.ym, r.sessions, r.users, r.views, r.cumSessions, r.cumUsers, r.cumViews, r.impr, r.clicks, r.ownVisits].map(v => v ?? ''); });
  const csv = '\ufeff' + [head, ...rows].map(r => r.join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'سجل-الإحصاءات-الشهري.csv'; a.click();
}

/* ===== استهلاك Firebase مقابل حدود الخطة المجانية (Spark) ===== */
const FB_LIMITS = { storage: 1024 ** 3, down: 10 * 1024 ** 3, conn: 100 };
const anBytes = b => (b >= 1024 ** 3 ? (b / 1024 ** 3).toFixed(2) + ' GB' : b >= 1024 ** 2 ? (b / 1024 ** 2).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB');
function statsFirebase() {
  const u = Store.get('analytics_ext/firebase') || {};
  let est = 0; try { est = new TextEncoder().encode(JSON.stringify(Store.dump())).length; } catch { /* ignore */ }
  const st = u.storageBytes != null ? u.storageBytes : est;
  const meter = (icon, label, val, limit, text, note) => {
    if (val == null) return `<div class="fb-m"><div class="fb-h"><span><i class="fa-solid ${icon}"></i> ${label}</span><b>—</b></div><small class="muted">${note}</small></div>`;
    const pct = Math.min(100, val / limit * 100), tone = pct >= 85 ? 'bad' : pct >= 60 ? 'warn' : 'ok';
    return `<div class="fb-m"><div class="fb-h"><span><i class="fa-solid ${icon}"></i> ${label}</span><b class="num">${text}</b></div><div class="fb-bar ${tone}"><span style="width:${Math.max(1.5, pct)}%"></span></div><small class="muted">${pct < 1 ? 'أقل من 1%' : pct.toFixed(1) + '%'} من الحد المجاني · ${note}</small></div>`;
  };
  const worst = Math.max(st / FB_LIMITS.storage, (u.sentBytes30 || 0) / FB_LIMITS.down, (u.maxConn30 || 0) / FB_LIMITS.conn);
  return `<div class="an-ext-h"><h2><i class="fa-solid fa-database"></i> استهلاك Firebase</h2></div>
    ${worst >= 0.8 ? `<div class="banner warn"><i class="fa-solid fa-triangle-exclamation"></i><span>اقتربتَ من حد الخطة المجانية (${Math.round(worst * 100)}%). عند تجاوز الحد قد يتوقف الوصول للبيانات أو تُطلب الترقية لخطة Blaze (الدفع حسب الاستخدام).</span></div>` : ''}
    <div class="pbox fb-box">
      ${meter('fa-hard-drive', 'حجم البيانات المخزّنة', st, FB_LIMITS.storage, anBytes(st) + ' / 1 GB', u.storageBytes != null ? 'من Firebase مباشرة' : 'تقدير من البيانات المحمّلة الآن')}
      ${meter('fa-cloud-arrow-down', 'التنزيل خلال آخر 30 يوماً', u.sentBytes30 == null ? null : u.sentBytes30, FB_LIMITS.down, u.sentBytes30 == null ? '' : anBytes(u.sentBytes30) + ' / 10 GB', u.sentBytes30 == null ? 'يحتاج ربط Cloud Monitoring (انظر README)' : 'من Firebase مباشرة')}
      ${meter('fa-plug', 'أعلى اتصالات متزامنة (30 يوماً)', u.maxConn30 == null ? null : u.maxConn30, FB_LIMITS.conn, u.maxConn30 == null ? '' : u.maxConn30 + ' / 100', u.maxConn30 == null ? 'يحتاج ربط Cloud Monitoring (انظر README)' : 'من Firebase مباشرة')}
      <p class="muted small" style="margin:10px 0 0">${u.updatedAt ? 'آخر تحديث: ' + ago(u.updatedAt) + '. ' : ''}الحدود للخطة المجانية Spark. ${u.error ? 'تنبيه: ' + esc(u.error) : ''}</p>
    </div>`;
}

function statsMount(main) {
  const box = $('#anx', main); if (!box) return;
  const ga = Store.get('analytics_ext/ga'), gsc = Store.get('analytics_ext/gsc');
  box.innerHTML = `${statsOwn()}
    <div class="an-ext-h"><h2><i class="fa-brands fa-google"></i> بيانات Google</h2>
      ${Automation.on ? '<button class="btn sm" id="anr"><i class="fa-solid fa-rotate"></i> تحديث الآن</button>' : ''}</div>
    ${ga || gsc ? `<div class="an-per" style="margin:6px 0 4px">${AN_GP.map(([k, l]) => `<button data-an-g="${k}" class="${Stats.gp === k ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}
    ${ga && (ga.periods || ga.overview) ? anGaCard(ga) : anSetup('ga')}
    ${gsc && (gsc.periods || gsc.totals) ? anGscCard(gsc) : anSetup('gsc')}
    ${statsMonthly()}
    ${statsFirebase()}
    ${ga?.error || gsc?.error ? `<div class="banner warn"><i class="fa-solid fa-triangle-exclamation"></i><span>${esc([ga?.error && 'Analytics: ' + ga.error, gsc?.error && 'Search Console: ' + gsc.error].filter(Boolean).join(' | '))}</span></div>` : ''}`;
  $$('[data-an-p]', box).forEach(b => b.onclick = () => { Stats.days = +b.dataset.anP; statsMount(main); });
  $$('[data-an-g]', box).forEach(b => b.onclick = () => { Stats.gp = b.dataset.anG; statsMount(main); });
  $$('[data-ym]', box).forEach(tr => tr.onclick = () => { const m = Store.get(`analytics_ext/monthly/${tr.dataset.ym.replace('-', '')}`); m && anMonthDetail(m); });
  $('#ancsv', box) && ($('#ancsv', box).onclick = anMonthlyCsv);
  $('#ansnap', box) && ($('#ansnap', box).onclick = async () => { await Automation.notify('snapshot', 'last'); toast('طُلبت لقطة الشهر الماضي، تظهر خلال دقيقة تقريباً'); });
  $('#anbf', box) && ($('#anbf', box).onclick = async () => { await Automation.notify('backfill', 'all'); toast('بدأ استرجاع الأشهر السابقة، قد يستغرق عدة دقائق (12 شهراً في كل مرة). حدّث الصفحة لاحقاً'); });
  const r = $('#anr', box);
  r && (r.onclick = async () => { r.disabled = true; await Automation.notify('analytics', 'now'); toast('طُلب تحديث البيانات، يظهر خلال دقيقة تقريباً'); setTimeout(() => { r.disabled = false; }, 8000); });
}
