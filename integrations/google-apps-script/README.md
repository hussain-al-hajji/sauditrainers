# الأتمتة: بريد المدربين والنشر المجدول (Google Apps Script — مجاني)

سكربت واحد يعمل من حساب المنصة **trainers.sa3@gmail.com** ويتولى:

| المهمة | متى |
|---|---|
| إرسال بريد للمدرب (ونسخة للإدارة) من بريد المنصة | عند كل طلب تواصل من جهة تدريبية |
| تنبيه الإدارة بالبريد | عند طلب تسجيل مدرب جديد، أو «اطلب مدرباً» |
| نشر بطاقات المدربين في إكس ولينكدإن وإنستقرام | في الموعد المجدول (يفحص كل 5 دقائق) أو فوراً بزر «نشر الآن» |

حدود الاستخدام المجانية لحساب Gmail عادي: نحو 100 رسالة بريد يومياً، وتشغيل المؤقت كل 5 دقائق ضمن الحصة المجانية.

## الإعداد (مرة واحدة)

> يتطلب أن تكون المنصة مفعّلة على Firebase، أي أن `firebase` مضبوط في `js/config.js`.

1. **صلاحية حساب المنصة على Firebase:** في Firebase Console ← ⚙️ Project settings ← Users and permissions ← Add member، أضف `trainers.sa3@gmail.com` بدور **Editor**. السكربت يقرأ الطلبات ويكتب نتائج النشر بصلاحية هذا الحساب.
2. سجّل الدخول في المتصفح بحساب `trainers.sa3@gmail.com`، وافتح [script.google.com](https://script.google.com) ← **New project**، وسمّه «أتمتة مدربون سعوديون».
3. الصق محتوى `Code.gs` في الملف `Code.gs`، وعدّل أعلاه:
   - `DB_URL`: قيمة `databaseURL` من `js/config.js`.
   - `SITE`: رابط المنصة.
4. ⚙️ **Project Settings** ← فعّل «Show "appsscript.json" manifest file in editor»، ثم الصق محتوى `appsscript.json`.
5. من المحرر اختر الدالة `setupTriggers` واضغط **Run**، ثم وافق على الصلاحيات (البريد، الاتصال الخارجي، قاعدة البيانات، Drive). يجب أن يظهر في السجل: «تم: مؤقّت النشر يعمل».
6. **Deploy ← New deployment ← Web app**:
   - Execute as: **Me (trainers.sa3@gmail.com)**
   - Who has access: **Anyone**
   
   انسخ رابط الـ Web app (ينتهي بـ `/exec`).
7. ضع الرابط في `js/config.js`:
   ```js
   automationUrl: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   ```
8. من لوحة الإدارة ← النشر الاجتماعي ← «الربط والقوالب» ← «اختبار الاتصال»: يظهر وقت آخر اتصال، والحسابات المربوطة.

عند تعديل `Code.gs` لاحقاً: Deploy ← Manage deployments ← ✏️ ← Version: New version، ليبقى الرابط نفسه.

## ربط حسابات التواصل الاجتماعي

المفاتيح تُحفظ في **Project Settings ← Script Properties** في السكربت، ولا تُكتب في الموقع أبداً. المنصة التي لا تُربط تبقى متاحة بالنشر اليدوي بضغطة: يُفتح الموقع بالنص جاهزاً، وتُنزَّل الصورة.

### إكس (X)
1. [developer.x.com](https://developer.x.com) ← أنشئ Project و App، ومن User authentication settings اجعل الصلاحية **Read and write**.
2. من Keys and tokens أنشئ: API Key وSecret، وAccess Token وSecret، **بعد** ضبط صلاحية الكتابة.
3. أضف في Script Properties: `X_API_KEY`، `X_API_SECRET`، `X_ACCESS_TOKEN`، `X_ACCESS_SECRET`.

الباقة المجانية في X API محدودة بعدد قليل من المنشورات شهرياً، وتتغير شروطها من وقت لآخر، فراجعها في بوابة المطورين. رفع الصورة يتم عبر واجهة رفع الوسائط؛ إن رفضتها X يُنشر النص مع الرابط دون صورة.

### لينكدإن
1. [linkedin.com/developers](https://www.linkedin.com/developers/apps) ← Create app واربطه بصفحة المنصة.
2. أضف منتج **Share on LinkedIn** (للنشر من حساب شخصي: `w_member_social`)، أو **Community Management API** (للنشر باسم صفحة الشركة: `w_organization_social`).
3. أنشئ Access Token من OAuth 2.0 tools بالصلاحية المناسبة.
4. أضف: `LI_ACCESS_TOKEN`، و`LI_AUTHOR_URN`. قيمته `urn:li:person:XXXX` للحساب الشخصي، أو `urn:li:organization:12345` لصفحة الشركة.
5. التوكن صالح 60 يوماً، ويُجدَّد قبل انتهائه.

### إنستقرام
1. حوّل حساب المنصة إلى **حساب احترافي** واربطه بصفحة فيسبوك.
2. [developers.facebook.com](https://developers.facebook.com) ← أنشئ تطبيقاً، وأضف Instagram Graph API بصلاحيات `instagram_basic` و`instagram_content_publish` و`pages_show_list`.
3. أنشئ توكن طويل المدة (Long-lived)، واعرف `IG_USER_ID`، أي معرّف حساب إنستقرام الاحترافي.
4. أضف: `IG_USER_ID`، `IG_ACCESS_TOKEN`.

إنستقرام يجلب الصورة من رابط عام، فيرفعها السكربت مؤقتاً إلى Drive ثم يحذفها بعد النشر.

> كُتبت دوال النشر حسب التوثيق الرسمي للمنصات، لكنها لم تُختبر على حسابات حقيقية. بعد ربط كل منصة جرّب «نشر الآن» على منشور تجريبي، وتظهر رسالة الخطأ من المنصة في سجل المنشور إن وُجدت.

## واتساب

**لا توجد طريقة مجانية رسمية لإرسال رسائل واتساب آلياً لأرقام مختلفة.**

- واجهة **WhatsApp Business Platform (Cloud API)** من Meta تتطلب توثيق نشاط تجاري، وقوالب رسائل معتمدة مسبقاً، وتُحاسب على المحادثات التي يبدأها النشاط.
- الأدوات غير الرسمية التي تتحكم بواتساب ويب تخالف شروط واتساب وقد تؤدي لحظر رقم المنصة.

**المعتمد في المنصة الآن:** في لوحة الإدارة ← طلبات الجهات، زر «واتساب للمدرب» يفتح محادثة المدرب مع رسالة جاهزة فيها تفاصيل الطلب، فتضغط «إرسال» فقط.

- افتح واتساب رقم المنصة `966562391007` على جهازك قبل الضغط: WhatsApp Web أو تطبيق سطح المكتب أو الجوال.
- يمكن إضافة Cloud API لاحقاً للإرسال الآلي الكامل.
