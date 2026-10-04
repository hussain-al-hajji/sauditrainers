/* أدوات مشتركة: عرض، تواريخ، نوافذ، صور، مشاركة، وحركات الواجهة */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = s => esc(s).replace(/\n/g, '<br>');
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
// المزايا: كل سطر «العنوان | الوصف» (الوصف اختياري)
const benefitList = s => lines(s).map(l => { const i = l.indexOf('|'); return i < 0 ? { t: l, d: '' } : { t: l.slice(0, i).trim(), d: l.slice(i + 1).trim() }; });
const BENEFIT_ICONS = ['fa-location-dot', 'fa-bullhorn', 'fa-handshake', 'fa-hand-holding-dollar', 'fa-medal', 'fa-star', 'fa-gem'];
const splitList = s => (Array.isArray(s) ? s : String(s || '').split(/[،,\n]/)).map(x => String(x).trim()).filter(Boolean);
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const pad = n => String(n).padStart(2, '0');

/* الأرقام إنجليزية دائماً */
function toEnDigits(s) {
  return String(s ?? '')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}
const fmtNum = n => Number(n || 0).toLocaleString('en-US');
function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function fmtTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${fmtDate(ts)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function ago(ts) {
  if (!ts) return '';
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'الآن';
  const m = Math.round(s / 60); if (m < 60) return `قبل ${m} د`;
  const h = Math.round(m / 60); if (h < 24) return `قبل ${h} س`;
  const d = Math.round(h / 24); if (d < 30) return `قبل ${d} يوم`;
  return fmtDate(ts);
}

/* تطبيع النص العربي للبحث: توحيد الهمزات والتاء المربوطة والياء وإزالة التشكيل */
const normAr = s => toEnDigits(String(s || '').toLowerCase())
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/\s+/g, ' ').trim();

/* كتابة الاسم العربي بالحروف الإنجليزية (نقحرة): قاموس للأسماء الشائعة، وقواعد حروف احتياطية لغيرها. اقتراح أولي يعدّله المستخدم */
const NAME_EN = (() => {
  const d = {};
  const add = (en, ar) => ar.split(' ').forEach(a => { d[a] = en; });
  add('Mohammed', 'محمد'); add('Ahmed', 'أحمد احمد'); add('Abdullah', 'عبدالله'); add('Abdulrahman', 'عبدالرحمن'); add('Abdulaziz', 'عبدالعزيز'); add('Abdulilah', 'عبدالإله عبدالاله');
  add('Abdulmajeed', 'عبدالمجيد'); add('Abdulkareem', 'عبدالكريم'); add('Abdulmohsen', 'عبدالمحسن'); add('Abdulelah', 'عبدالإله'); add('Khalid', 'خالد'); add('Fahad', 'فهد'); add('Saad', 'سعد'); add('Salman', 'سلمان');
  add('Saud', 'سعود'); add('Faisal', 'فيصل'); add('Nasser', 'ناصر'); add('Turki', 'تركي'); add('Bandar', 'بندر'); add('Naif', 'نايف'); add('Mishaal', 'مشعل'); add('Majed', 'ماجد');
  add('Yousef', 'يوسف'); add('Ibrahim', 'إبراهيم ابراهيم'); add('Ismail', 'إسماعيل اسماعيل'); add('Ali', 'علي'); add('Hassan', 'حسن'); add('Hussain', 'حسين'); add('Omar', 'عمر'); add('Othman', 'عثمان');
  add('Talal', 'طلال'); add('Waleed', 'وليد'); add('Hisham', 'هشام'); add('Saleh', 'صالح'); add('Sulaiman', 'سليمان'); add('Sultan', 'سلطان'); add('Mansour', 'منصور'); add('Mubarak', 'مبارك');
  add('Nawaf', 'نواف'); add('Badr', 'بدر'); add('Rashed', 'راشد'); add('Ziyad', 'زياد'); add('Anas', 'أنس'); add('Osama', 'أسامة'); add('Hani', 'هاني'); add('Yasser', 'ياسر'); add('Raed', 'رائد');
  add('Nabil', 'نبيل'); add('Adel', 'عادل'); add('Kareem', 'كريم'); add('Fawaz', 'فواز'); add('Rayan', 'ريان'); add('Muhannad', 'مهند'); add('Hamad', 'حمد'); add('Hamzah', 'حمزة'); add('Jaber', 'جابر');
  add('Thamer', 'ثامر'); add('Ayman', 'أيمن'); add('Basil', 'باسل'); add('Tariq', 'طارق'); add('Hatem', 'حاتم'); add('Hamdan', 'حمدان'); add('Mazen', 'مازن'); add('Moayad', 'مؤيد'); add('Mohannad', 'مهند');
  add('Sarah', 'سارة'); add('Noura', 'نورة'); add('Hanan', 'حنان'); add('Mona', 'منى'); add('Huda', 'هدى'); add('Reem', 'ريم'); add('Lama', 'لمى'); add('Lina', 'لينا'); add('Amal', 'أمل'); add('Amira', 'أميرة');
  add('Hind', 'هند'); add('Dana', 'دانة'); add('Ghada', 'غادة'); add('Abeer', 'عبير'); add('Maha', 'مها'); add('Nouf', 'نوف'); add('Shahad', 'شهد'); add('Joud', 'جود'); add('Rima', 'ريما'); add('Layla', 'ليلى');
  add('Fatimah', 'فاطمة'); add('Aisha', 'عائشة'); add('Khadijah', 'خديجة'); add('Maryam', 'مريم'); add('Zainab', 'زينب'); add('Salma', 'سلمى'); add('Rana', 'رنا'); add('Rahaf', 'رهف'); add('Bushra', 'بشرى');
  add('Tahani', 'تهاني'); add('Arwa', 'أروى'); add('Wafa', 'وفاء'); add('Samar', 'سمر'); add('Sahar', 'سحر'); add('Najla', 'نجلاء'); add('Ibtisam', 'ابتسام'); add('Asmaa', 'أسماء'); add('Afnan', 'أفنان');
  add('Latifa', 'لطيفة'); add('Moudhi', 'موضي'); add('Jawaher', 'جواهر'); add('Shaimaa', 'شيماء'); add('Alanoud', 'العنود'); add('Aljawharah', 'الجوهرة'); add('Haifa', 'هيفاء'); add('Ruba', 'ربى'); add('Lujain', 'لجين');
  add('Alorayfi', 'العريفي'); add('Alotaibi', 'العتيبي'); add('Alqahtani', 'القحطاني'); add('Aldosari', 'الدوسري'); add('Alghamdi', 'الغامدي'); add('Alzahrani', 'الزهراني'); add('Alshehri', 'الشهري');
  add('Alasiri', 'العسيري'); add('Almalki', 'المالكي'); add('Alharbi', 'الحربي'); add('Almutairi', 'المطيري'); add('Alshammari', 'الشمري'); add('Alanazi', 'العنزي'); add('Alsubaie', 'السبيعي');
  add('Alkhaldi', 'الخالدي'); add('Alyami', 'اليامي'); add('Albalawi', 'البلوي'); add('Aljuhani', 'الجهني'); add('Alharbi', 'الحربي'); add('Alsharif', 'الشريف'); add('Alsulami', 'السلمي'); add('Albaqami', 'البقمي');
  add('Alrashidi', 'الرشيدي'); add('Alomari', 'العمري'); add('Alahmadi', 'الأحمدي'); add('Aldakhil', 'الدخيل'); add('Alhajji', 'الحاجي'); add('Altamimi', 'التميمي'); add('Alsudairi', 'السديري'); add('Alrajhi', 'الراجحي');
  add('Alsaleh', 'الصالح'); add('Alabdullah', 'العبدالله'); add('Alshathri', 'الشثري'); add('Alothaimeen', 'العثيمين'); add('Alsaadi', 'السعدي'); add('Almansour', 'المنصور'); add('Alfahad', 'الفهد'); add('Alhazmi', 'الحازمي');
  add('Alsaif', 'السيف'); add('Alsuhaimi', 'السهيمي'); add('Alshamrani', 'الشمراني'); add('Almarri', 'المري'); add('Alanazi', 'العنزي'); add('Alzahrani', 'الزهراني'); add('Alharthi', 'الحارثي'); add('Alqarni', 'القرني'); add('Alshahrani', 'الشهراني');
  add('Alqahtani', 'القحطاني'); add('Aldossary', 'الدوسري'); add('Alfaifi', 'الفيفي'); add('Alnemer', 'النمر'); add('Albishi', 'البيشي'); add('Alaqeel', 'العقيل'); add('Almousa', 'الموسى'); add('Alhumaidi', 'الحميدي');
  add('Aziz', 'العزيز'); add('Rahman', 'الرحمن'); add('Kareem', 'الكريم'); add('Majeed', 'المجيد'); add('Malik', 'الملك'); add('Mohsen', 'المحسن'); add('Ilah', 'الإله'); add('Hadi', 'الهادي'); add('Latif', 'اللطيف'); add('Samad', 'الصمد');
  return d;
})();
const AR_LETTERS = { ا: 'a', أ: 'a', إ: 'i', آ: 'aa', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh', د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', ة: 'a', ء: '', ئ: 'e', ؤ: 'o', ى: 'a', و: 'o', ي: 'i' };
const AR_VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
function arWord(w) {
  w = w.replace(/[ً-ْـ]/g, ''); // التشكيل والتطويل
  if (NAME_EN[w]) return NAME_EN[w];
  const bare = w.replace(/^ال/, ''), pre = bare !== w && bare.length > 1;
  if (pre && NAME_EN[bare]) return 'Al' + NAME_EN[bare].toLowerCase();
  if (/^عبد.{2,}/.test(w)) { const r = w.slice(3).replace(/^ال/, ''); return r === 'له' ? 'Abdullah' : 'Abdul' + (NAME_EN['ال' + r] || arWord(r)).toLowerCase(); }
  // قواعد الحروف الاحتياطية: حرف بحرف مع إدخال حرف علّة بين الحروف الساكنة المتتالية
  let out = '';
  [...(pre ? bare : w)].forEach((ch, i, a) => {
    let l = AR_LETTERS[ch]; if (l == null) return;
    if (ch === 'و' || ch === 'ي') l = i === 0 ? (ch === 'و' ? 'w' : 'y') : (ch === 'و' ? 'o' : 'i');
    if (ch === 'ة' && i === a.length - 1) l = 'ah';
    const prev = out.slice(-1);
    if (out && !AR_VOWELS.has(prev) && !AR_VOWELS.has(l[0]) && l[0] !== 'h') out += 'a'; // حرفان ساكنان متتاليان: نفصل بينهما بحرف علّة
    out += l;
  });
  out = out.replace(/aa+/g, 'aa').replace(/([aeiou])\1{2,}/g, '$1$1');
  out = out.charAt(0).toUpperCase() + out.slice(1);
  return pre ? 'Al' + out.toLowerCase() : out;
}
function arToEn(name) {
  const words = String(name || '').trim().replace(/^(?:د|م|أ|ا)\.\s*/, '').split(/\s+/).filter(Boolean);
  const out = []; let skip = false;
  words.forEach((w, i) => {
    if (skip) { skip = false; return; }
    if (w === 'بن' || w === 'ابن') { out.push('bin'); return; }
    if (w === 'بنت') { out.push('bint'); return; }
    if (w === 'آل' && words[i + 1]) { out.push('Al ' + arWord(words[i + 1]).replace(/^Al/, '')); skip = true; return; }
    if (w === 'عبد' && words[i + 1]) { out.push(arWord('عبد' + words[i + 1])); skip = true; return; }
    if (/[ء-ي]/.test(w)) out.push(arWord(w)); else out.push(w);
  });
  return out.join(' ');
}
// الكلمة الأولى من الاسم دون اللقب المختصر (أ. / م. / د.) أو الصفة
const firstName = name => String(name || '').trim().replace(/^(?:(?:د|م|أ|ا)\.|دكتور|الدكتور|مهندس|المهندس|أستاذ|الأستاذ)\s*/, '').split(/\s+/)[0] || '';
function initials(name) {
  const w = String(name || '').replace(/^(د|م|أ|ا)\.\s*/, '').split(/\s+/).filter(Boolean).map(x => x.replace(/^ال(?=..)/, ''));
  return esc((w[0]?.[0] || '') + (w.length > 1 ? ' ' + w[w.length - 1][0] : ''));
}

/* روابط */
// رابط مشاركة الصورة (Drive وDropbox وOneDrive أو رابط مباشر) بصيغة تُعرض مباشرة وتُرسم على اللوحة (يتطلب مشاركة الملف «لأي شخص لديه الرابط»)
const driveId = url => { const m = String(url || '').match(/\/d\/([\w-]{10,})/) || String(url || '').match(/[?&]id=([\w-]{10,})/); return m ? m[1] : ''; };
function driveImg(url, w = 800) {
  url = String(url || '').trim();
  if (!url) return '';
  if (url.startsWith('data:image/')) return url; // للمعاينة والبيانات التجريبية فقط
  const id = driveId(url);
  if (id && /drive\.google|docs\.google|googleusercontent/.test(url)) return `https://lh3.googleusercontent.com/d/${id}=w${w}`;
  if (!/^https:\/\/[^\s"'<>]+$/.test(url)) return '';
  // Dropbox: رابط المشاركة ← رابط مباشر
  if (/^https:\/\/(www\.)?dropbox\.com\//.test(url)) return url.replace(/^https:\/\/(www\.)?dropbox\.com/, 'https://dl.dropboxusercontent.com').replace(/([?&])dl=\d/, '$1raw=1');
  // OneDrive: رابط المشاركة ← محتوى الملف عبر واجهة المشاركة
  if (/^https:\/\/(1drv\.ms|onedrive\.live\.com|[\w-]+\.sharepoint\.com)\//.test(url)) return 'https://api.onedrive.com/v1.0/shares/u!' + btoa(encodeURI(url)).replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-') + '/root/content';
  return url; // رابط مباشر لصورة على أي مساحة تخزين
}
// أي رابط https لصورة (Google Drive أو Dropbox أو OneDrive أو رابط مباشر)، أو معاينة data:
const isImageLink = url => !!driveImg(url, 100);
// كشف بيانات التواصل داخل النصوص العامة (جوال، بريد، روابط) لأن التواصل يتم عبر المنصة فقط
function leaksContact(text) {
  const t = toEnDigits(text);
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(t)) return 'بريد إلكتروني';
  if (/(?:\+?966|00966|\b0)?5\d[\s-]?\d{3}[\s-]?\d{4}/.test(t) || /\d[\d\s-]{8,}\d/.test(t)) return 'رقم جوال';
  if (/https?:\/\/|www\.|wa\.me|t\.me\//i.test(t)) return 'رابط';
  return '';
}
const safeUrl = u => { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };
const phoneDigits = p => { let d = toEnDigits(p).replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('05')) d = '966' + d.slice(1); else if (d.startsWith('5') && d.length === 9) d = '966' + d; return d; };
const waLink = (p, text = '') => { const d = phoneDigits(p); return d ? `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}` : ''; };
const validPhone = p => /^9665\d{8}$/.test(phoneDigits(p));
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
// رابط المنصة الذي يراه المستخدمون: الدومين الرسمي دائماً (siteUrl)، إلا عند تفعيل useCurrentOrigin للاختبار على الرابط المؤقت
// مفتاح اليوم بتوقيت الرياض (YYYYMMDD) لعدّادات المشاهدات اليومية
const dayKeyRiyadh = (offsetDays = 0) => new Date(Date.now() + 3 * 3600e3 - offsetDays * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
const siteBase = () => { const c = window.ST_CONFIG; return c.useCurrentOrigin && /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(location.hostname) ? location.href.split('#')[0] : (c.siteUrl || location.href.split('#')[0]); };
// رابط المشاركة: صفحة ثابتة بوسوم المعاينة (t/<الرابط>/) تحوّل الزائر لصفحة المدرب؛ وتُولَّد بـ tools/og/build.js
const profileUrl = t => `${siteBase()}t/${encodeURIComponent(t.slug || t.id)}/`;

/* ===== التنبيهات ===== */
function toast(msg, kind = 'ok') {
  let wrap = $('#toasts');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toasts'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<i class="fa-solid ${kind === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, kind === 'error' ? 6000 : 3200);
}

/* ===== النوافذ ===== */
function modal(html, { wide = false, onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'modal-back';
  el.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="modal-x" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>${html}</div>`;
  const close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); document.removeEventListener('keydown', key); onClose && onClose(); };
  const key = e => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', e => { if (e.target === el || e.target.closest('.modal-x') || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', key);
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  return { el, close, $: s => el.querySelector(s) };
}
function confirmBox(msg, { ok = 'تأكيد', danger = false } = {}) {
  return new Promise(res => {
    let done = false;
    const m = modal(`<h3>تأكيد</h3><p class="muted">${msg}</p><div class="row end"><button class="btn ghost" data-close>إلغاء</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button></div>`, { onClose: () => { if (!done) res(false); } });
    m.$('[data-ok]').onclick = () => { done = true; res(true); m.close(); };
  });
}

/* ===== ملفات ===== */
function download(name, data, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function copyText(t, msg = 'تم النسخ') {
  try { await navigator.clipboard.writeText(t); toast(msg); }
  catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(msg); }
}

/* ===== النماذج ===== */
function formData(form) {
  const o = {};
  $$('[name]', form).forEach(el => {
    if (el.type === 'checkbox') {
      if (el.dataset.multi != null) { (o[el.name] = o[el.name] || []); if (el.checked) o[el.name].push(el.value); }
      else o[el.name] = el.checked;
    } else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
    else o[el.name] = typeof el.value === 'string' ? el.value.trim() : el.value;
  });
  return o;
}
const opt = (v, label, sel) => `<option value="${esc(v)}" ${String(sel) === String(v) ? 'selected' : ''}>${esc(label)}</option>`;
const field = (label, input, hint = '', cls = '') => `<label class="field ${cls}"><span>${label}</span>${input}${hint ? `<small>${hint}</small>` : ''}</label>`;

/* ===== حركات الواجهة ===== */
let revealObs = null;
function reveal(root = document) {
  if (!('IntersectionObserver' in window)) { $$('.reveal', root).forEach(e => e.classList.add('in')); return; }
  revealObs = revealObs || new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal:not(.in)', root).forEach(e => revealObs.observe(e));
}
function countUp(root = document) {
  $$('[data-count]', root).forEach(el => {
    const to = Number(el.dataset.count) || 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !to) { el.textContent = fmtNum(to); return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmtNum(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
// إمالة ثلاثية الأبعاد مع لمعة هولوغرافية تتبع المؤشر
function tilt(root = document) {
  if (matchMedia('(hover: none)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('[data-tilt]', root).forEach(el => {
    if (el._tilt) return; el._tilt = true;
    const max = Number(el.dataset.tilt) || 10;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
      el.classList.add('tilting');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('tilting'); });
  });
}

/* بحث داخل كل قائمة طويلة (أكثر من 12 عنصراً): القوائم المنسدلة تفتح لوحة فيها مربع بحث في أولها، وشبكات الاختيار فيها مربع بحث في أولها */
const LONG_LIST = 12;
let lsPanel = null, lsOpenedAt = 0;
function closeListPanel() { if (lsPanel) { lsPanel.remove(); lsPanel = null; } }
function openListPanel(sel) {
  closeListPanel();
  const r = sel.getBoundingClientRect(), p = document.createElement('div');
  p.className = 'ls-panel'; p.setAttribute('role', 'listbox'); p.dataset.for = sel.dataset.id;
  p.innerHTML = '<input type="search" class="list-search" placeholder="ابحث في القائمة..." aria-label="بحث في القائمة" autocomplete="off"><div class="ls-opts"></div>';
  const box = p.querySelector('input'), opts = p.querySelector('.ls-opts');
  const draw = () => {
    const q = normAr(box.value);
    opts.replaceChildren(...[...sel.options].filter(o => !q || normAr(o.textContent).includes(q)).map(o => {
      const d = document.createElement('div'); d.className = 'ls-opt' + (o.value === sel.value ? ' on' : ''); d.textContent = o.textContent; d.setAttribute('role', 'option');
      d.onclick = () => { sel.value = o.value; closeListPanel(); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); sel.focus({ preventScroll: true }); };
      return d;
    }));
    if (!opts.children.length) opts.innerHTML = '<div class="ls-none">لا نتائج</div>';
  };
  box.addEventListener('input', draw);
  box.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeListPanel(); sel.focus(); }
    if (e.key === 'Enter') { e.preventDefault(); opts.querySelector('.ls-opt')?.click(); }
  });
  draw();
  document.body.appendChild(p); lsPanel = p;
  const h = Math.min(320, window.innerHeight - 24), below = window.innerHeight - r.bottom;
  p.style.minWidth = Math.max(r.width, 220) + 'px';
  p.style.insetInlineStart = 'auto';
  p.style.left = Math.min(Math.max(8, r.left), window.innerWidth - Math.max(r.width, 220) - 8) + 'px';
  p.style.maxHeight = h + 'px';
  p.style.top = (below > 260 || below > r.top ? r.bottom + 4 : Math.max(8, r.top - Math.min(h, 320) - 4)) + 'px';
  lsOpenedAt = Date.now();
  box.focus({ preventScroll: true }); const on = opts.querySelector('.on'); if (on) opts.scrollTop = Math.max(0, on.offsetTop - 60);
}
document.addEventListener('mousedown', e => { if (lsPanel && !lsPanel.contains(e.target) && !(e.target.dataset && e.target.dataset.ls)) closeListPanel(); }, true);
// يُغلق عند تمرير الصفحة (لا عند فتح اللوحة نفسها ولا عند ظهور لوحة مفاتيح الجوال)
window.addEventListener('scroll', e => { if (lsPanel && Date.now() - lsOpenedAt > 500 && !lsPanel.contains(e.target)) closeListPanel(); }, true);
window.addEventListener('resize', () => { if (lsPanel && !lsPanel.contains(document.activeElement)) closeListPanel(); });
function addListSearch(root = document) {
  root.querySelectorAll('select:not([data-ls]):not([multiple])').forEach(sel => {
    if (sel.options.length <= LONG_LIST) return;
    sel.dataset.ls = '1';
    sel.dataset.id = 'ls' + Math.random().toString(36).slice(2, 8);
    const toggle = () => { if (sel.disabled) return; if (lsPanel && lsPanel.dataset.for === sel.dataset.id) closeListPanel(); else openListPanel(sel); };
    let touched = 0;
    sel.addEventListener('mousedown', e => { e.preventDefault(); if (Date.now() - touched < 700) return; toggle(); });
    // اللمس (iOS/أندرويد): نمنع منتقي النظام ونفتح لوحتنا مرة واحدة فقط
    let moved = false;
    sel.addEventListener('touchstart', () => { moved = false; }, { passive: true });
    sel.addEventListener('touchmove', () => { moved = true; }, { passive: true });
    sel.addEventListener('touchend', e => { if (moved || !e.cancelable) return; e.preventDefault(); touched = Date.now(); toggle(); });
    sel.addEventListener('click', e => e.preventDefault());
    sel.addEventListener('keydown', e => { if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openListPanel(sel); } });
  });
  root.querySelectorAll('.checks:not([data-ls])').forEach(c => {
    if (c.querySelectorAll(':scope > label.chk').length <= LONG_LIST) return;
    c.dataset.ls = '1';
    const box = document.createElement('input'); box.type = 'search'; box.className = 'list-search ls-in'; box.placeholder = 'ابحث في القائمة...'; box.setAttribute('aria-label', 'بحث في القائمة'); box.autocomplete = 'off';
    box.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
    box.addEventListener('input', () => {
      const q = normAr(box.value);
      c.querySelectorAll(':scope > label.chk').forEach(l => l.classList.toggle('ls-off', !!q && !normAr(l.textContent).includes(q) && !l.querySelector('input:checked')));
    });
    c.prepend(box);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  let t = 0;
  new MutationObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(() => addListSearch()); }).observe(document.body, { childList: true, subtree: true });
  addListSearch();
});
