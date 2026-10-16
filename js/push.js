/* إشعارات الجوال للمدرب (Web Push عبر Firebase Cloud Messaging).
 * يفعّلها المدرب من لوحته بزر «تفعيل إشعارات الجوال»؛ يُحفظ رمز جهازه في pushTokens/<id>، وترسل الأتمتة (Push.gs) الإشعار عند وصول طلب أو تعميم.
 * على الآيفون تعمل فقط بعد «إضافة إلى الشاشة الرئيسية» (iOS 16.4+). تتطلب vapidKey في js/config.js. */
const Push = (() => {
  const CFG = () => window.ST_CONFIG || {};
  const KEY = 'st-push-on', FB = '10.12.2';
  const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const available = () => !!CFG().firebase && !!CFG().vapidKey && Store.mode === 'firebase';
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36) + s.length.toString(36); };
  const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const myId = () => { const a = Auth.current(); return a?.kind === 'trainer' ? a.id : ''; };
  let reg = null;
  async function register() {
    if (reg) return reg;
    reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; return reg;
  }
  async function token() {
    if (!window.firebase?.messaging) await loadScript(`https://www.gstatic.com/firebasejs/${FB}/firebase-messaging-compat.js`);
    const r = await register();
    return firebase.messaging().getToken({ vapidKey: CFG().vapidKey, serviceWorkerRegistration: r });
  }
  async function save(tok) {
    const id = myId(); if (!id || !tok) return;
    const h = hash(tok);
    await Store.set(`pushTokens/${id}/${h}`, { t: tok, ts: Date.now(), ua: (ios() ? 'iOS' : /android/i.test(navigator.userAgent) ? 'Android' : 'Web') + (standalone() ? ' · تطبيق' : ' · متصفح') });
    try { localStorage.setItem(KEY, h); } catch { /* ignore */ }
  }
  const state = () => {
    if (!supported()) return ios() && !standalone() ? 'ios-install' : 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    let on = ''; try { on = localStorage.getItem(KEY) || ''; } catch { /* ignore */ }
    return Notification.permission === 'granted' && on ? 'on' : 'off';
  };
  async function enable() {
    if (!supported()) { if (ios()) toast('على الآيفون: افتح الموقع في سفاري ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»، ثم افتحه من الشاشة الرئيسية وفعّل الإشعارات', 'err'); else toast('متصفحك لا يدعم الإشعارات', 'err'); return false; }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('لم يُسمح بالإشعارات. يمكنك تفعيلها من إعدادات المتصفح للموقع', 'err'); return false; }
    try { await save(await token()); toast('تم تفعيل إشعارات الجوال لهذا الجهاز'); return true; }
    catch (e) { console.error(e); toast('تعذّر تفعيل الإشعارات، حاول لاحقاً', 'err'); return false; }
  }
  async function disable() {
    const id = myId(); let h = ''; try { h = localStorage.getItem(KEY) || ''; localStorage.removeItem(KEY); } catch { /* ignore */ }
    try { if (window.firebase?.messaging) await firebase.messaging().deleteToken(); } catch { /* ignore */ }
    if (id && h) { try { await Store.remove(`pushTokens/${id}/${h}`); } catch { /* ignore */ } }
  }
  // عند فتح اللوحة: إن كان مفعّلاً نجدّد الرمز (قد يتغيّر) ونجهّز استقبال الرسائل والصفحة مفتوحة
  async function sync() {
    if (!available() || !supported()) return;
    // الإذن ممنوح مسبقاً (جهاز جديد أو بعد مسح البيانات): نسجّل الجهاز بصمت دون سؤال
    if (state() !== 'on' && Notification.permission !== 'granted') return;
    try { await save(await token()); } catch { /* ignore */ }
  }
  // دعوة المدرب لتفعيل الإشعارات بضغطة واحدة: المتصفحات لا تسمح بطلب الإذن دون ضغطة منه، فنعرض بطاقة عند أول دخول ثم نعيدها كل 7 أيام ما لم يفعّل
  const ASK = 'st-push-ask', askDue = () => { try { return Date.now() - Number(localStorage.getItem(ASK) || 0) > 7 * 864e5; } catch { return true; } };
  function invite(onDone) {
    if (!available() || document.getElementById('push-ask') || !askDue()) return;
    const st = state(); if (st === 'on' || st === 'denied' || st === 'unsupported') return;
    const el = document.createElement('div'); el.id = 'push-ask'; el.className = 'push-ask';
    el.innerHTML = st === 'ios-install'
      ? `<i class="fa-solid fa-bell"></i><div><b>فعّل إشعارات الجوال</b><small>على الآيفون: افتح الموقع في سفاري ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»، ثم افتحه من الأيقونة لتصلك طلبات التواصل فوراً.</small></div><button class="btn sm ghost" data-x>حسناً</button>`
      : `<i class="fa-solid fa-bell"></i><div><b>فعّل إشعارات الجوال</b><small>يصلك إشعار فور وصول طلب تواصل أو طلب عام أو إعلان من الإدارة.</small></div><button class="btn sm primary" data-ok>تفعيل الآن</button><button class="btn sm ghost" data-x>لاحقاً</button>`;
    document.body.appendChild(el);
    const close = () => { try { localStorage.setItem(ASK, String(Date.now())); } catch { /* ignore */ } el.remove(); };
    el.querySelector('[data-x]').onclick = close;
    const ok = el.querySelector('[data-ok]'); if (ok) ok.onclick = async () => { ok.disabled = true; const r = await enable(); close(); if (r && onDone) onDone(); };
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data?.type === 'st-push') { toast(`🔔 ${e.data.title}: ${e.data.body}`); if (window.Broadcast) try { App.render(); } catch { /* ignore */ } } });
  return { available, supported, state, enable, disable, sync, invite, standalone, ios };
})();
