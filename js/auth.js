/* الأمان والدخول: جلسة الدور، دخول الإدارة بحساب Google، دخول المدربين برمز سري
 *
 * وضعان للعمل:
 * - الوضع الآمن (Firebase + apiKey): Firebase Authentication + قواعد database.rules.json.
 * - الوضع المحلي (بدون Firebase): للتجربة والمعاينة فقط، والبيانات في متصفح الجهاز.
 */

const PUBLIC_PATHS = ['content', 'trainers', 'photos', 'stats', 'meta', 'halls'];
const trainerPaths = id => [...PUBLIC_PATHS, `private/${id}`, `notes/${id}`, { path: 'leads', child: 'trainerId', equalTo: id }];

const Auth = {
  KEY: 'st-auth',
  current() { try { return JSON.parse(sessionStorage.getItem(this.KEY) || 'null') || window.__auth || null; } catch { return window.__auth || null; } },
  set(v) { window.__auth = v; try { v ? sessionStorage.setItem(this.KEY, JSON.stringify(v)) : sessionStorage.removeItem(this.KEY); } catch { /* ignore */ } },
  async logout() {
    this.set(null);
    if (Store.auth) await Store.auth.signOut().catch(() => {});
    await Security.applyScope(null);
    location.hash = '#/';
  }
};

const Security = (() => {
  const CFG = window.ST_CONFIG;
  const secure = () => Store.hasAuth;
  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  function randomSuffix(n = 6) {
    const a = new Uint32Array(n);
    crypto.getRandomValues(a);
    return Array.from(a, x => ALPHABET[x % ALPHABET.length]).join('');
  }
  const newSecret = code => `${String(code).toUpperCase()}-${randomSuffix()}`;
  const emailFor = code => `st-${String(code).toLowerCase()}@example.com`;
  const normCode = c => toEnDigits(c).trim().toUpperCase().replace(/\s+/g, '').replace(/[–—_]/g, '-');

  const authMsg = e => ({
    'auth/wrong-password': 'الرمز غير صحيح',
    'auth/invalid-credential': 'الرمز غير صحيح',
    'auth/invalid-login-credentials': 'الرمز غير صحيح',
    'auth/user-not-found': 'الرمز غير صحيح',
    'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة',
    'auth/network-request-failed': 'تعذّر الاتصال، تحقق من الإنترنت',
    'auth/popup-blocked': 'المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة ثم أعد المحاولة',
    'auth/popup-closed-by-user': 'أُغلقت نافذة Google قبل إكمال الدخول',
    'auth/cancelled-popup-request': 'أُغلقت نافذة Google قبل إكمال الدخول',
    'auth/unauthorized-domain': 'نطاق الموقع غير مضاف في Firebase ← Authentication ← Settings ← Authorized domains',
    'auth/operation-not-allowed': 'طريقة الدخول غير مفعّلة في Firebase Authentication'
  }[e && e.code] || (e && e.message) || 'حدث خطأ غير متوقع');

  const OWNERS = (CFG.ownerEmails || []).map(e => String(e).toLowerCase());
  const isOwnerUser = u => !!u && u.emailVerified === true && OWNERS.includes(String(u.email || '').toLowerCase());
  const currentUser = () => (secure() ? Store.auth.currentUser : null);
  const isOwner = () => !secure() || isOwnerUser(currentUser());
  const adminName = () => { const u = currentUser(); return (u && Store.get(`admins/${u.uid}`)?.name) || u?.displayName || u?.email || 'مشرف'; };
  const inviteKey = email => String(email || '').trim().toLowerCase().replace(/\./g, ',');

  function log(action, target = '', details = '') {
    const u = currentUser();
    Store.push('adminLog', { ts: Date.now(), action, target: String(target).slice(0, 200), details: String(details).slice(0, 400), by: u ? { uid: u.uid, email: u.email || '', name: adminName() } : { name: 'تجربة محلية' } });
  }

  /* ===== بقاء المشرف مسجلاً مع حد لعدم النشاط ===== */
  const ACTIVE_KEY = 'st-admin-active';
  const idleMs = () => (Number(CFG.adminIdleHours) || 72) * 3600e3;
  const touch = () => { try { localStorage.setItem(ACTIVE_KEY, String(Date.now())); } catch { /* ignore */ } };
  const lastActive = () => { try { return Number(localStorage.getItem(ACTIVE_KEY) || 0); } catch { return 0; } };
  const idleExpired = () => { const t = lastActive(); return !t || Date.now() - t > idleMs(); };
  let lastTouch = 0;
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(ev => window.addEventListener(ev, () => {
    if (Auth.current()?.kind !== 'admin' || Date.now() - lastTouch < 60000) return;
    lastTouch = Date.now(); touch();
  }, { passive: true }));

  /* ===== نطاق القراءة حسب الدور ===== */
  async function applyScope(session) {
    if (Store.mode !== 'firebase') return;
    if (!secure()) return Store.setScope('all', ['']);
    if (!session) return Store.setScope('public', PUBLIC_PATHS);
    if (session.kind === 'admin') return Store.setScope('admin', ['']);
    return Store.setScope(`trainer:${session.id}`, trainerPaths(session.id));
  }

  async function roleFor(user) {
    if (!user) return null;
    if (isOwnerUser(user)) return { kind: 'admin', uid: user.uid, owner: true };
    if (await Store.readOnce(`admins/${user.uid}`)) return { kind: 'admin', uid: user.uid };
    const id = await Store.readOnce(`uids/${user.uid}`);
    if (id && await Store.readOnce(`trainers/${id}`)) return { kind: 'trainer', id, uid: user.uid };
    return null;
  }

  // عند فتح الصفحة: استعادة الجلسة
  async function restore() {
    if (!secure()) {
      // الوضع المحلي: تبقى الجلسة داخل تبويب المتصفح
      await applyScope(null);
      return;
    }
    const user = await new Promise(res => { const un = Store.auth.onAuthStateChanged(u => { un(); res(u); }); });
    let session = await roleFor(user);
    if (session?.kind === 'admin') {
      if (lastActive() && idleExpired()) { session = null; setTimeout(() => toast('انتهت جلسة الإدارة لعدم النشاط، سجّل الدخول من جديد'), 800); }
      else touch();
    }
    if (user && !session) {
      // حساب Google مدعو لم يُفعَّل بعد
      const viaGoogle = (user.providerData || []).some(p => p.providerId === 'google.com');
      if (viaGoogle) { try { session = (await finishGoogle()).session; } catch { /* ignore */ } }
      if (!session) await Store.auth.signOut().catch(() => {});
    }
    Auth.set(session);
    await applyScope(session);
  }

  /* ===== دخول المدرب ===== */
  async function trainerLogin(rawCode) {
    const code = normCode(rawCode);
    if (!code) throw new Error('فضلاً أدخل رمز الدخول');
    if (!code.includes('-')) throw new Error('الرمز غير مكتمل — اكتبه كما وصلك، مثل ST0012-7K4Q9P');
    if (secure()) {
      await Store.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
      try { await Store.auth.signInWithEmailAndPassword(emailFor(code.split('-')[0]), code); }
      catch (e) { throw new Error(authMsg(e)); }
      const s = await roleFor(Store.auth.currentUser);
      if (!s || s.kind !== 'trainer') { await Store.auth.signOut(); throw new Error('الرمز غير صحيح'); }
      Auth.set(s); await applyScope(s);
      return s;
    }
    const codes = Store.get('secrets/codes') || {};
    const id = Object.keys(codes).find(k => normCode(codes[k]) === code);
    if (!id || !Store.get(`trainers/${id}`)) throw new Error('الرمز غير صحيح');
    const s = { kind: 'trainer', id };
    Auth.set(s);
    return s;
  }

  /* ===== دخول الإدارة بحساب Google ===== */
  async function googleLogin() {
    if (!secure()) {
      // الوضع المحلي للتجربة فقط
      const s = { kind: 'admin', local: true };
      Auth.set(s); touch();
      return { session: s };
    }
    await Store.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
    const p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    try { await Store.auth.signInWithPopup(p); } catch (e) { throw new Error(authMsg(e)); }
    return finishGoogle();
  }

  async function finishGoogle() {
    const user = Store.auth.currentUser;
    let s = await roleFor(user);
    if (s?.kind === 'trainer') { await Store.auth.signOut(); throw new Error('هذا الحساب مرتبط بمدرب وليس بالإدارة'); }
    if (!s) {
      const root = firebase.app().database().ref(CFG.dbRoot || 'sauditrainers');
      const key = inviteKey(user.email);
      const inv = (await root.child(`adminInvites/${key}`).once('value').catch(() => null))?.val();
      if (!inv) { await Store.auth.signOut(); throw new Error(`الحساب ${user.email} غير مصرّح له بدخول الإدارة. اطلب من الحساب الرئيسي دعوته.`); }
      try { await root.child(`admins/${user.uid}`).set({ email: user.email, name: inv.name || user.displayName || '', addedAt: Date.now(), invitedBy: inv.invitedBy || null }); }
      catch { await Store.auth.signOut(); throw new Error('تعذّر تفعيل الدعوة، اطلب إعادة إرسالها'); }
      await root.child(`adminInvites/${key}`).remove().catch(() => {});
      s = { kind: 'admin', uid: user.uid };
    }
    touch();
    Auth.set(s);
    await applyScope(s);
    if (s.owner && !Store.get(`admins/${user.uid}`)) Store.set(`admins/${user.uid}`, { email: user.email, name: user.displayName || '', owner: true, addedAt: Date.now() });
    return { session: s };
  }

  function inviteAdmin(email, name) {
    email = String(email || '').trim().toLowerCase();
    const u = currentUser();
    Store.set(`adminInvites/${inviteKey(email)}`, { email, name: name || '', invitedAt: Date.now(), invitedBy: u ? { uid: u.uid, email: u.email || '', name: adminName() } : null });
    log('دعوة مشرف', email, name);
  }

  /* ===== حسابات المدربين ===== */
  async function withSecondary(fn) {
    const a2 = Store.secondaryAuth();
    try { return await fn(a2); } finally { await a2.signOut().catch(() => {}); }
  }

  // ينشئ حساب دخول للمدرب (أو يجدد رمزه) ويعيد الرمز الجديد
  async function issueCode(t) {
    const secret = newSecret(t.code);
    if (!secure()) { Store.set(`secrets/codes/${t.id}`, secret); return secret; }
    const old = Store.get(`secrets/codes/${t.id}`);
    const uid = await withSecondary(async a2 => {
      if (old) {
        try { const u = (await a2.signInWithEmailAndPassword(emailFor(t.code), old)).user; await u.updatePassword(secret); return u.uid; }
        catch (e) { if (e.code !== 'auth/user-not-found' && e.code !== 'auth/invalid-credential' && e.code !== 'auth/invalid-login-credentials') throw new Error(authMsg(e)); }
      }
      try { return (await a2.createUserWithEmailAndPassword(emailFor(t.code), secret)).user.uid; }
      catch (e) {
        if (e.code === 'auth/email-already-in-use') throw new Error('يوجد حساب دخول سابق لهذا الرقم ولا يُعرف رمزه؛ احذفه من Firebase Authentication ثم أعد المحاولة');
        throw new Error(authMsg(e));
      }
    });
    Store.set(`uids/${uid}`, t.id);
    Store.set(`trainers/${t.id}/uid`, uid);
    Store.set(`secrets/codes/${t.id}`, secret);
    return secret;
  }

  async function deleteTrainerAccount(t) {
    if (!secure() || !t.uid) return;
    const code = Store.get(`secrets/codes/${t.id}`);
    try { if (code) await withSecondary(async a2 => { const u = (await a2.signInWithEmailAndPassword(emailFor(t.code), code)).user; await u.delete(); }); }
    catch (e) { console.warn('delete auth user failed', e); }
    Store.remove(`uids/${t.uid}`);
  }

  return { secure, restore, applyScope, trainerLogin, googleLogin, inviteAdmin, inviteKey, issueCode, deleteTrainerAccount, log, isOwner, adminName, currentUser, normCode };
})();
