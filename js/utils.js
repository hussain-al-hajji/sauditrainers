/* أدوات مشتركة: عرض، تواريخ، نوافذ، صور، مشاركة، وحركات الواجهة */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = s => esc(s).replace(/\n/g, '<br>');
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const splitList = s => (Array.isArray(s) ? s : String(s || '').split(/[،,\n]/)).map(x => String(x).trim()).filter(Boolean);
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const pad = n => String(n).padStart(2, '0');

/* الأرقام إنجليزية دائماً */
function toEnDigits(s) {
  return String(s ?? '')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}
const num = n => `<span class="num">${esc(n)}</span>`;
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

function initials(name) {
  const w = String(name || '').replace(/^(د|م|أ|ا)\.\s*/, '').split(/\s+/).filter(Boolean).map(x => x.replace(/^ال(?=..)/, ''));
  return esc((w[0]?.[0] || '') + (w.length > 1 ? ' ' + w[w.length - 1][0] : ''));
}

/* روابط */
function driveImg(url) {
  url = String(url || '').trim();
  if (!url || url.startsWith('data:image/')) return url;
  const m = url.match(/\/d\/([\w-]{10,})/) || url.match(/[?&]id=([\w-]{10,})/);
  if (m && /drive\.google|docs\.google|googleusercontent/.test(url)) return `https://lh3.googleusercontent.com/d/${m[1]}=w600`;
  return /^https:\/\//.test(url) ? url : '';
}
const safeUrl = u => { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };
const phoneDigits = p => { let d = toEnDigits(p).replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('05')) d = '966' + d.slice(1); else if (d.startsWith('5') && d.length === 9) d = '966' + d; return d; };
const waLink = (p, text = '') => { const d = phoneDigits(p); return d ? `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}` : ''; };
const validPhone = p => /^9665\d{8}$/.test(phoneDigits(p));
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
const siteBase = () => location.href.split('#')[0];
const profileUrl = t => `${siteBase()}#/t/${encodeURIComponent(t.slug || t.id)}`;

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

// تصغير الصورة المرفوعة وقصّها مربعاً (تُحفظ في القاعدة مباشرة دون خدمة تخزين)
function resizeImage(file, size = 420, quality = 0.84) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('الملف ليس صورة'));
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const cv = document.createElement('canvas'); cv.width = cv.height = size;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
      // القص من المنتصف مع ميل للأعلى (الوجه عادة في الجزء العلوي)
      ctx.drawImage(img, (img.width - s) / 2, Math.max(0, (img.height - s) * 0.3), s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      res(cv.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => rej(new Error('تعذّر قراءة الصورة'));
    img.src = URL.createObjectURL(file);
  });
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
