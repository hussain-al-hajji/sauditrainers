/* إعدادات منصة «مدرّبون سعوديّون»
 * ---------------------------------------------------------------
 * firebase: إعدادات تطبيق الويب من Firebase Console. اجعلها null للعمل محلياً
 *           (تُحفظ البيانات في متصفح الجهاز فقط — مناسب للتجربة والمعاينة).
 *           عند إضافتها يعمل «الوضع الآمن»: دخول الإدارة بحساب Google، ودخول المدربين برموز سرية،
 *           وقواعد database.rules.json تحدد ما يقرؤه ويكتبه كل دور.
 * dbRoot:   المسار الجذري للبيانات داخل قاعدة البيانات.
 */
window.ST_CONFIG = {
  firebase: null,
  /* مثال:
  firebase: {
    apiKey: '...',
    authDomain: 'sauditrainers-xxxx.firebaseapp.com',
    databaseURL: 'https://sauditrainers-xxxx-default-rtdb.firebaseio.com',
    projectId: 'sauditrainers-xxxx',
    appId: '1:...:web:...'
  },
  */
  dbRoot: 'sauditrainers',
  // الحسابات الرئيسية: صلاحية كاملة دائماً، وهي وحدها تدعو المشرفين (يجب أن تطابق database.rules.json)
  ownerEmails: ['g.hussainalhajji@gmail.com', 'trainers.sa3@gmail.com'],
  // يبقى المشرف مسجلاً على جهازه، ويُطلب منه الدخول من جديد بعد هذه المدة دون أي نشاط
  adminIdleHours: 72,
  // رابط Google Apps Script للأتمتة (بريد المدربين من حساب المنصة + النشر المجدول). اتركه فارغاً لتعطيلها.
  // طريقة الإعداد في integrations/google-apps-script/README.md
  automationUrl: '',
  // رقم واتساب المنصة الذي تُرسل منه الرسائل (يُفتح منه واتساب ويب/التطبيق عند الضغط على زر الإرسال)
  platformWhatsapp: '966562391007',
  // رابط المنصة (يُستخدم في روابط المشاركة ورسائل معلومات الدخول)
  siteUrl: 'https://www.sauditrainers.sa/'
};
