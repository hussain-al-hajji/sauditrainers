# فصل المستودع: خاص للعمل، وعام للنشر فقط

الفكرة: كل الكود والأدوات والسجل في **مستودع خاص**، وGitHub Pages يخدم من **المستودع العام الحالي** الذي لا يحوي إلا ما يحتاجه الموقع. الدومين والرابط والـ Pages لا يتغيران.

## الملفات المنشورة (public-paths.txt)
`index.html` `404.html` `privacy.html` `robots.txt` `sitemap.xml` `CNAME` `.nojekyll` و`css/` `js/` `assets/` `vendor/` `t/` `og/`.
أما `integrations/` و`tools/` و`promo/` و`database.rules.json` و`README.md` و`SECURITY.md` و`LICENSE` فتبقى في الخاص.

## خطوات الإعداد (مرة واحدة)
1. **أنشئ مستودعاً خاصاً** (مثلاً `sauditrainers-src`) ثم ادفع إليه كل محتوى المستودع الحالي بتاريخه:
   ```
   git clone --mirror https://github.com/hussain-al-hajji/sauditrainers.git
   cd sauditrainers.git
   git push --mirror https://github.com/hussain-al-hajji/sauditrainers-src.git
   ```
2. **أنشئ مفتاح نشر** (على جهازك):
   ```
   ssh-keygen -t ed25519 -f deploy_key -N "" -C "sauditrainers-publish"
   ```
   - في **المستودع العام** ← Settings ← Deploy keys ← Add deploy key: الصق محتوى `deploy_key.pub` وفعّل **Allow write access**.
   - في **المستودع الخاص** ← Settings ← Secrets and variables ← Actions ← New repository secret باسم `PUBLIC_DEPLOY_KEY` وقيمته محتوى الملف `deploy_key` (الخاص) كاملاً.
   - احذف الملفين من جهازك بعد النسخ.
3. في المستودع الخاص: انسخ `tools/publish/publish.yml` إلى `.github/workflows/publish.yml`، **واحذف** `.github/workflows/share-pages.yml` (يحل محله). تأكد من `PUBLIC_REPO` و`PUBLIC_BRANCH` داخل الملف (الفرع الذي يخدمه Pages: Settings ← Pages ← Branch).
4. من تبويب Actions في الخاص شغّل «نشر الموقع» يدوياً (Run workflow). تأكد أن المستودع العام استقبل commit، وأن الموقع يعمل.
5. **حذف الملفات الداخلية من المستودع العام** (بعد نجاح الخطوة 4): أول تشغيل للـ workflow يحذفها تلقائياً لأن `sync.sh` يزيل كل مسار ليس في القائمة، ويبقى `.git` فقط. وأضف في العام تعطيل الـ Actions (Settings ← Actions ← Disable) حتى لا يتكرر مع share-pages القديم، أو احذف `.github/` منه (يحذفه sync كذلك).

## العمل بعد الفصل
- كل التعديلات في **المستودع الخاص** (فرع `main`). الدفع إليه ينشر الموقع خلال دقيقتين تقريباً، وكل ساعة يُحدَّث المولَّد (صفحات المدربين).
- لا تعدّل المستودع العام يدوياً: أي تعديل فيه يُمحى عند أول نشر.

## ما لا يغيّره الفصل
- ملفات الواجهة (`js/` و`css/` و`index.html`) تبقى ظاهرة لكل من يفتح الموقع (هذا طبيعي في أي موقع). والمستودع العام يبقى محتفظاً بسجل التعديلات القديم.
- الحماية الحقيقية للبيانات: قواعد Firebase والتحقق من رمز المشرف في Apps Script.

## اختبار محلي للمزامنة
```
mkdir /tmp/pub && bash tools/publish/sync.sh . /tmp/pub && ls -A /tmp/pub
```
