/* اختبار قواعد قاعدة البيانات على محاكي Firebase: يجرّب هجمات وعمليات مشروعة ويتأكد من القبول والرفض.
 * التشغيل (من مجلد مؤقت فيه firebase-tools و@firebase/rules-unit-testing):
 *   npx firebase emulators:start --only database --project demo-st     (ومعه firebase.json يشير إلى database.rules.json)
 *   node tools/rules-test/rules.test.js
 * ملاحظة: إن كانت بيئتك خلف وكيل (proxy) فشغّل الأمرين بدون متغيرات HTTP(S)_PROXY. */
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-st', database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync(require('path').resolve(__dirname, '../../database.rules.json'), 'utf8') } });
  const R = 'sauditrainers';
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.database();
    await db.ref(R).set({
      trainers: { st0001: { name: 'مدرب', code: 'ST0001', status: 'active' }, st0002: { name: 'مدرب 2', code: 'ST0002', status: 'active' } },
      uids: { UT1: 'st0001', UT2: 'st0002' },
      admins: { ADM: { email: 'a@b.com' } },
      leads: { L1: { trainerId: 'st0001', org: 'جهة', person: 'ش', phone: '966501234567', topic: 't', ts: Date.now(), status: 'new', id: 'L1' }, L2: { trainerId: 'st0002', org: 'سرية', person: 'ش', phone: '966501234568', topic: 't', ts: Date.now(), status: 'new', id: 'L2' } },
      content: { specialties: { list: [] } }
    });
  });
  const visitor = env.unauthenticatedContext().database();
  const stranger = env.authenticatedContext('X1', { email: 'x@y.com', email_verified: true }).database();
  const t1 = env.authenticatedContext('UT1', { email: 't1@st.local' }).database();
  const owner = env.authenticatedContext('OWN', { email: 'g.hussainalhajji@gmail.com', email_verified: true }).database();
  const adm = env.authenticatedContext('ADM', { email: 'a@b.com', email_verified: true }).database();
  const res = []; const A = (n, p) => p.then(() => res.push(['OK  ', n]), e => res.push(['FAIL', n + ' ← مرفوض بشكل غير متوقع: ' + (e.code || e.message)]));
  const D = (n, p) => p.then(() => res.push(['FAIL', n + ' ← قُبل وكان يجب رفضه']), e => res.push(['OK  ', n + ' (رُفض كما يجب)']));
  const now = () => Date.now();
  const lead = (o = {}) => ({ trainerId: 'st0001', org: 'جهة', person: 'ش', phone: '966501234567', topic: 'برنامج', ts: now(), status: 'new', ...o });
  // 1) leads read
  await D('1 غريب مسجّل يقرأ كل الطلبات (orderByChild بلا equalTo)', stranger.ref(`${R}/leads`).orderByChild('trainerId').once('value'));
  await D('1b غريب مسجّل يقرأ leads كاملة', stranger.ref(`${R}/leads`).once('value'));
  await D('1c زائر يقرأ leads', visitor.ref(`${R}/leads`).orderByChild('trainerId').once('value'));
  await A('1d مدرب يقرأ طلباته (equalTo)', t1.ref(`${R}/leads`).orderByChild('trainerId').equalTo('st0001').once('value'));
  await D('1e مدرب يقرأ طلبات غيره', t1.ref(`${R}/leads`).orderByChild('trainerId').equalTo('st0002').once('value'));
  // leads create / status
  await A('2 زائر ينشئ طلب تواصل صحيح', visitor.ref(`${R}/leads/N1`).set(lead()));
  await D('2b طلب بحالة done عند الإنشاء', visitor.ref(`${R}/leads/N2`).set(lead({ status: 'done' })));
  await D('2c طلب لمدرب غير موجود', visitor.ref(`${R}/leads/N3`).set(lead({ trainerId: 'zzz' })));
  await D('2d طلب بتاريخ قديم جداً', visitor.ref(`${R}/leads/N4`).set(lead({ ts: now() - 10 * 86400000 })));
  await A('2e طلب بتاريخ منذ ساعة (اختلاف ساعة الجهاز)', visitor.ref(`${R}/leads/N5`).set(lead({ ts: now() - 3600000 })));
  await D('2f غريب مسجّل ينشئ طلباً يتيماً بحقل status فقط', stranger.ref(`${R}/leads/ORPH/status`).set('done'));
  await A('2g المدرب يغلق طلبه (done)', t1.ref(`${R}/leads/L1/status`).set('done'));
  await D('2h المدرب يغلق طلب غيره', t1.ref(`${R}/leads/L2/status`).set('done'));
  // 3) specialties
  await A('3 زائر يضيف تخصصاً عادياً بالعربية', visitor.ref(`${R}/content/specialties/added/uabc1`).set({ name: 'تصميم الجرافيك', icon: 'fa-shapes' }));
  await D('3b تخصص يحوي HTML', visitor.ref(`${R}/content/specialties/added/uabc2`).set({ name: '<img src=x onerror=alert(1)>', icon: 'fa-shapes' }));
  // 4) analytics / stats
  await A('4 عدّاد زيارة صحيح', visitor.ref(`${R}/analytics/page/home`).set(1));
  await D('4c مفتاح analytics بوسم', visitor.ref(`${R}/analytics/ref/a<b`).set(1));
  await A('4d مشاهدة مدرب موجود', visitor.ref(`${R}/stats/views/st0001`).set(1));
  await D('4e مشاهدة مدرب وهمي', visitor.ref(`${R}/stats/views/fake999`).set(1));
  await D('4f تزييف: زيادة بأكثر من 1', visitor.ref(`${R}/stats/views/st0002`).set(500));
  // 5) applications
  const app = (o = {}) => ({ name: 'متقدم', phone: '966501234567', email: 'a@b.com', region: 'riyadh', specs: ['leadership'], ts: now(), status: 'new', ...o });
  await A('5 زائر يقدّم طلب تسجيل صحيح', visitor.ref(`${R}/applications/AAAAAAA1`).set(app({ id: 'AAAAAAA1' })));
  await D('5b طلب تسجيل بحالة done', visitor.ref(`${R}/applications/AAAAAAA2`).set(app({ status: 'done' })));
  await D('5c متقدم يحدد trainerId', visitor.ref(`${R}/applications/AAAAAAA3`).set(app({ trainerId: 'st0001' })));
  await D('5d متقدم يملأ decidedAt', visitor.ref(`${R}/applications/AAAAAAA4`).set(app({ decidedAt: now() })));
  await D('5e رابط السيرة javascript:', visitor.ref(`${R}/applications/AAAAAAA5`).set(app({ cvUrl: 'javascript:alert(1)' })));
  await A('5f رابط السيرة https صحيح', visitor.ref(`${R}/applications/AAAAAAA6`).set(app({ cvUrl: 'https://drive.google.com/file/d/abc/view' })));
  await A('5g المشرف يكتب trainerId/decidedAt', adm.ref(`${R}/applications/AAAAAAA1`).update({ status: 'published', trainerId: 'st0001', decidedAt: now() }));
  // 6) trainer fields
  const arr = n => Array.from({ length: n }, (_, i) => 'k' + i);
  await A('6 مدرب يحفظ 15 تخصصاً', t1.ref(`${R}/trainers/st0001/specs`).set(arr(15)));
  await D('6b مدرب يحفظ 16 تخصصاً', t1.ref(`${R}/trainers/st0001/specs`).set(arr(16)));
  await D('6c مدرب يحفظ 5000 عنصر في regions', t1.ref(`${R}/trainers/st0001/regions`).set(arr(5000)));
  await D('6d photoUrl بـ javascript:', t1.ref(`${R}/trainers/st0001/photoUrl`).set('javascript:alert(1)'));
  await A('6e photoUrl https', t1.ref(`${R}/trainers/st0001/photoUrl`).set('https://lh3.googleusercontent.com/d/abc=w800'));
  await A('6f مسح photoUrl (فارغ)', t1.ref(`${R}/trainers/st0001/photoUrl`).set(''));
  await D('6g مدرب يرفع featured', t1.ref(`${R}/trainers/st0001/featured`).set(true));
  // 7) slugs
  await A('7 مدرب يحجز رابطاً عادياً', t1.ref(`${R}/slugs/ahmed-ali`).set('st0001'));
  await D('7b حجز الرابط admin', t1.ref(`${R}/slugs/admin`).set('st0001'));
  await D('7c حجز الرابط og', t1.ref(`${R}/slugs/og`).set('st0001'));
  // 8) admin + owner
  await A('8 مشرف يكتب content/footer', adm.ref(`${R}/content/footer`).set({ tagline: 'x' }));
  await A('8b المالك يكتب content/join', owner.ref(`${R}/content/join`).set({ fee: 720 }));
  await D('8c غريب يكتب content/footer', stranger.ref(`${R}/content/footer`).set({ tagline: 'x' }));
  await D('8d زائر يكتب content/footer', visitor.ref(`${R}/content/footer`).set({ tagline: 'x' }));
  await A('8e المشرف يقرأ كل leads', adm.ref(`${R}/leads`).once('value'));
  await A('8f المشرف يحدّث حالة طلب', adm.ref(`${R}/leads/L1`).update({ status: 'new' }));
  await A('8g المشرف يعدّل ts لطلب قديم دون تغييره', adm.ref(`${R}/leads/L2`).update({ topic: 'محدّث' }));
  // 9) activity
  await A('9 المدرب يسجّل نشاطاً', t1.ref(`${R}/activity/st0001/a1`).set({ ts: now(), type: 'login' }));
  await D('9b نشاط بتاريخ مزيّف', t1.ref(`${R}/activity/st0001/a2`).set({ ts: now() - 30 * 86400000, type: 'login' }));
  // 10) requests / halls
  await A('10 زائر يرسل طلب مدرب', visitor.ref(`${R}/requests/R1`).set({ org: 'ش', person: 'ع', phone: '966501234567', topic: 'م', ts: now(), status: 'new' }));
  await D('10b طلب مدرب بحالة done', visitor.ref(`${R}/requests/R2`).set({ org: 'ش', person: 'ع', phone: '966501234567', topic: 'م', ts: now(), status: 'done' }));
  await A('10c زائر يرسل طلب قاعة', visitor.ref(`${R}/hallReqs/H1`).set({ type: 'book', name: 'ع', phone: '966501234567', region: 'riyadh', ts: now(), status: 'new' }));
  // 11) الطلبات الموجَّهة لكل المدربين
  await A('11 المشرف ينشئ طلباً موجَّهاً', adm.ref(`${R}/broadcasts/B1`).set({ id: 'B1', ts: now(), topic: 'برنامج قيادة', org: 'جهة', contact: false }));
  await A('11b مدرب لديه حساب يقرأ الطلبات الموجَّهة', t1.ref(`${R}/broadcasts`).once('value'));
  await D('11c غريب مسجّل يقرأ الطلبات الموجَّهة', stranger.ref(`${R}/broadcasts`).once('value'));
  await D('11d زائر يقرأ الطلبات الموجَّهة', visitor.ref(`${R}/broadcasts`).once('value'));
  await D('11e مدرب يكتب طلباً موجَّهاً', t1.ref(`${R}/broadcasts/B2`).set({ id: 'B2', ts: now(), topic: 'x' }));
  await D('11f طلب موجَّه بحقل غير معروف', adm.ref(`${R}/broadcasts/B3`).set({ id: 'B3', ts: now(), topic: 'x', evil: 1 }));
  res.forEach(r => console.log(r[0], r[1]));
  console.log(res.filter(r => r[0] === 'FAIL').length + ' فشل من ' + res.length);
  await env.cleanup();
})().catch(e => { console.error(e); process.exit(1); });
