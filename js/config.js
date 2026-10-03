/* إعدادات منصة «مدرّبون سعوديّون»
 * ---------------------------------------------------------------
 * firebase: إعدادات تطبيق الويب من Firebase Console. اجعلها null للعمل محلياً
 *           (تُحفظ البيانات في متصفح الجهاز فقط — مناسب للتجربة والمعاينة).
 *           عند إضافتها يعمل «الوضع الآمن»: دخول الإدارة بحساب Google، ودخول المدربين برموز سرية،
 *           وقواعد database.rules.json تحدد ما يقرؤه ويكتبه كل دور.
 * dbRoot:   المسار الجذري للبيانات داخل قاعدة البيانات.
 */
window.ST_CONFIG = {
  // إعدادات تطبيق الويب (ليست سرية؛ الحماية عبر قواعد القاعدة وتسجيل الدخول)
  firebase: {
    apiKey: 'AIzaSyB36bYSiQpPnT6P50mP93wGMCwv_UIIodo',
    authDomain: 'sauditrainers-6c989.firebaseapp.com',
    databaseURL: 'https://sauditrainers-6c989-default-rtdb.firebaseio.com',
    projectId: 'sauditrainers-6c989',
    storageBucket: 'sauditrainers-6c989.firebasestorage.app',
    messagingSenderId: '529223660797',
    appId: '1:529223660797:web:96365f6ce2a7c62c35fa94'
  },
  dbRoot: 'sauditrainers',
  // الحسابات الرئيسية: صلاحية كاملة دائماً، وهي وحدها تدعو المشرفين (يجب أن تطابق database.rules.json)
  ownerEmails: ['g.hussainalhajji@gmail.com', 'trainers.sa3@gmail.com'],
  // يبقى المشرف مسجلاً على جهازه، ويُطلب منه الدخول من جديد بعد هذه المدة دون أي نشاط
  adminIdleHours: 72,
  // رابط Google Apps Script للأتمتة (بريد المدربين من حساب المنصة + النشر المجدول). اتركه فارغاً لتعطيلها.
  // طريقة الإعداد في integrations/google-apps-script/README.md
  automationUrl: 'https://script.google.com/macros/s/AKfycby3JIzlHHTEUk2dRdDw-V9GWvqNNFPTS1a_K5t0evOTgGN5qD2lKmWZeI5Nrn25YQtN/exec',
  // معرّف قياس Google Analytics 4 (يبدأ بـ G-): اتركه فارغاً إن لم تفعّله. يفعّل بيانات الجغرافيا والمصادر التفصيلية في لوحة الإدارة
  gaId: '',
  // رقم واتساب المنصة الذي تُرسل منه الرسائل (يُفتح منه واتساب ويب/التطبيق عند الضغط على زر الإرسال)
  platformWhatsapp: '966562391007',
  // الرابط الرسمي: يظهر للمستخدمين في الروابط والبطاقات وQR ورسائل البريد والواتساب ومنشورات التواصل
  siteUrl: 'https://sauditrainers.sa/',
  // للاختبار المحلي فقط: اجعلها true لتُبنى الروابط من عنوان الصفحة المفتوحة
  useCurrentOrigin: false
};
