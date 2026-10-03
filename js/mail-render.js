/* محرّك بناء رسائل البريد من «كتل» (عنوان، نص، صورة، صورة مع نص، زر، إطار، فاصل).
 * يُستخدم في معاينة لوحة الإدارة، وتُولَّد منه نسخة السكربت integrations/google-apps-script/Campaign.gs
 * (python3 tools/build_campaign.py) لتتطابق الرسالة المعاينة مع المرسلة. لا تعتمد هذه الدوال على المتصفح. */

const MAIL_BRAND = { green: '#005430', cream: '#EEF3E5', ink: '#0D2418' };
const mEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mSafeUrl = u => { u = String(u || '').trim(); return /^(https:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+)$/.test(u) ? u : ''; };

// رابط صورة قابل للعرض داخل البريد (Drive وDropbox وOneDrive أو رابط مباشر)
function mailImgUrl(url, w) {
  url = String(url || '').trim();
  if (!/^https:\/\/[^\s"'<>]+$/.test(url)) return '';
  const m = url.match(/\/d\/([\w-]{10,})/) || url.match(/[?&]id=([\w-]{10,})/);
  if (m && /drive\.google|docs\.google|googleusercontent/.test(url)) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w' + (w || 1000);
  if (/^https:\/\/(www\.)?dropbox\.com\//.test(url)) return url.replace(/^https:\/\/(www\.)?dropbox\.com/, 'https://dl.dropboxusercontent.com').replace(/([?&])dl=\d/, '$1raw=1');
  return url;
}
// رابط تنزيل مباشر لمرفق (Drive أو رابط عام)
function mailFileUrl(url) {
  url = String(url || '').trim();
  const m = url.match(/\/d\/([\w-]{10,})/) || url.match(/[?&]id=([\w-]{10,})/);
  if (m && /drive\.google|docs\.google/.test(url)) return 'https://drive.google.com/uc?export=download&id=' + m[1];
  if (/^https:\/\/(www\.)?dropbox\.com\//.test(url)) return /[?&]dl=\d/.test(url) ? url.replace(/([?&])dl=\d/, '$1dl=1') : url + (url.includes('?') ? '&' : '?') + 'dl=1';
  return url;
}

// استبدال المتغيرات {name} {first} ... في النص الخام
function mailVars(text, vars) { return String(text == null ? '' : text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : '')); }

// نص منسّق: **عريض** و[نص الرابط](https://...) وأسطر جديدة
function mailText(text, vars) {
  let s = mEsc(mailVars(text, vars));
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)"']+|mailto:[^\s)"']+)\)/g, (m, t, u) => '<a href="' + u + '" style="color:' + MAIL_BRAND.green + ';font-weight:bold">' + t + '</a>');
  return s.replace(/\n/g, '<br>');
}

const MAIL_ALIGN = { start: 'right', center: 'center', end: 'left' };   // الاتجاه عربي: البداية = اليمين
const MAIL_IMG_W = { full: '100%', mid: '62%', small: '34%' };

function mailBlockHtml(b, vars, o) {
  const al = MAIL_ALIGN[b.align] || 'right';
  const img = (url, w) => { const u = mailImgUrl(url, w || 1000); return u ? '<img src="' + mEsc(u) + '" alt="' + mEsc(b.alt || '') + '" style="display:inline-block;max-width:100%;height:auto;border-radius:14px;border:0">' : ''; };
  switch (b.t) {
    case 'h': return '<h2 style="margin:22px 0 8px;color:' + MAIL_BRAND.green + ';font-size:22px;line-height:1.5;text-align:' + al + '">' + mailText(b.text, vars) + '</h2>';
    case 'p': return '<div style="margin:0 0 14px;font-size:15.5px;line-height:1.95;color:' + MAIL_BRAND.ink + ';text-align:' + al + '">' + mailText(b.text, vars) + '</div>';
    case 'img': {
      const html = img(b.url, b.w === 'small' ? 500 : 1000); if (!html) return '';
      const link = mSafeUrl(b.link), inner = link ? '<a href="' + mEsc(link) + '">' + html + '</a>' : html;
      return '<div style="margin:6px 0 16px;text-align:' + al + '"><div style="display:inline-block;width:' + (MAIL_IMG_W[b.w] || '100%') + ';max-width:100%;text-align:center">' + inner.replace('style="', 'style="width:100%;') + '</div></div>';
    }
    case 'imgtext': {
      const html = img(b.url, 600); if (!html) return '';
      const cellImg = '<td width="38%" valign="top" style="padding:0 0 0 14px">' + html.replace('style="', 'style="width:100%;') + '</td>';
      const cellTxt = '<td valign="top" style="padding:0 14px;font-size:15.5px;line-height:1.95;color:' + MAIL_BRAND.ink + ';text-align:right">' + mailText(b.text, vars) + '</td>';
      // dir=rtl: الخلية الأولى على اليمين
      return '<table role="presentation" width="100%" dir="rtl" style="margin:6px 0 16px;border-collapse:collapse"><tr>' + (b.side === 'end' ? cellTxt + cellImg : cellImg + cellTxt) + '</tr></table>';
    }
    case 'btn': {
      const u = mSafeUrl(mailVars(b.url, vars)); if (!u) return '';
      return '<div style="margin:18px 0;text-align:' + al + '"><a href="' + mEsc(u) + '" style="display:inline-block;background:' + MAIL_BRAND.green + ';color:' + MAIL_BRAND.cream + ';padding:13px 30px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:15.5px">' + mEsc(mailVars(b.text || 'افتح الرابط', vars)) + '</a></div>';
    }
    case 'box': return '<div style="margin:14px 0;padding:16px 20px;background:' + MAIL_BRAND.cream + ';border-right:5px solid ' + MAIL_BRAND.green + ';border-radius:12px;font-size:15px;line-height:1.9;color:' + MAIL_BRAND.ink + ';text-align:right">' + mailText(b.text, vars) + '</div>';
    case 'hr': return '<hr style="border:0;border-top:1px solid #DCE6D2;margin:20px 0">';
    default: return '';
  }
}

// الرسالة الكاملة: شريط الشعار + المحتوى + تذييل المنصة وسطر إلغاء الاستلام
function mailHtml(doc, vars, o) {
  o = o || {};
  const site = o.site || 'https://sauditrainers.sa/', assets = o.assets || site, from = o.fromName || 'منصة مدرّبون سعوديّون';
  const body = (doc.blocks || []).map(b => mailBlockHtml(b, vars, o)).join('');
  return '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#F4F7EF;padding:22px 10px">' +
    '<div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #DCE6D2">' +
    '<div style="background:' + MAIL_BRAND.green + ';padding:22px;text-align:center"><img src="' + mEsc(assets) + 'assets/logo-cream.png" alt="مدرّبون سعوديّون" height="58" style="height:58px"></div>' +
    '<div style="padding:26px 28px 10px;color:' + MAIL_BRAND.ink + '">' + body + '</div>' +
    '<div style="background:' + MAIL_BRAND.cream + ';padding:16px 20px;text-align:center;font-size:12.5px;line-height:1.9;color:#3A5244">' +
    '<b>' + mEsc(from) + '</b> · <a href="' + mEsc(site) + '" style="color:' + MAIL_BRAND.green + ';text-decoration:none">' + mEsc(site.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a><br>' +
    'وصلتك هذه الرسالة لأن بريدك مسجّل لدينا. إن لم ترغب باستلام رسائل المنصة فردّ عليها بكلمة «إلغاء».</div>' +
    '</div></div>';
}

// نسخة نصية بديلة (لعملاء البريد الذين لا يعرضون HTML)
function mailPlain(doc, vars) {
  return (doc.blocks || []).map(b => {
    if (b.t === 'hr') return '----';
    if (b.t === 'btn') return mailVars(b.text, vars) + ': ' + mailVars(b.url, vars);
    if (b.t === 'img') return b.link ? b.link : '';
    return mailVars(b.text, vars).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  }).filter(Boolean).join('\n\n');
}
