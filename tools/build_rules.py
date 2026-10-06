#!/usr/bin/env python3
"""يبني database.rules.json لمنصة «مدرّبون سعوديّون».

الأدوار:
- الزائر: يقرأ المحتوى العام (المدربون المنشورون، الصور، الإحصاءات، القاعات)، وينشئ الطلبات دون قراءتها.
- المدرب: يعدّل الحقول العامة لبطاقته وصورته فقط، ويقرأ بياناته الإدارية والطلبات الموجهة له.
- الإدارة: الحسابات الرئيسية (بريد Google متحقَّق) + من في admins/.
شغّله بعد أي تعديل: python3 tools/build_rules.py
"""
import json, pathlib

ROOT = 'sauditrainers'
OWNERS = ['g.hussainalhajji@gmail.com', 'trainers.sa3@gmail.com']  # يجب أن تطابق ownerEmails في js/config.js

owner = '(auth != null && auth.token.email_verified == true && (' + ' || '.join(f"auth.token.email.toLowerCase() == '{e}'" for e in OWNERS) + '))'
INC = "newData.isNumber() && newData.val() == (data.exists() ? data.val() : 0) + 1"
admin = f"({owner} || (auth != null && root.child('{ROOT}/admins/' + auth.uid).exists()))"
me = f"root.child('{ROOT}/uids/' + auth.uid).val()"
self_trainer = f"(auth != null && {me} == $id)"

S = lambda n: f"newData.isString() && newData.val().length <= {n}"
N = lambda n: f"newData.isNumber() && newData.val() >= 0 && newData.val() <= {n}"
# عدد عناصر القائمة محدود بمفاتيحها المسموحة (0..n-1) فلا يستطيع أحد تضخيمها
idx_re = lambda n: '^(' + '|'.join(str(i) for i in range(n)) + ')$'
str_list = lambda n, each=80: {'.validate': 'newData.hasChildren()', '$i': {'.validate': f"$i.matches(/{idx_re(n)}/) && " + S(each)}}
# رابط https فقط (أو فارغ لحذفه)؛ photoUrl يقبل data:image للمعاينة والبيانات التجريبية
URL = lambda n, data=False: S(n) + r" && (newData.val() == '' || newData.val().matches(/^(https:\/\/" + (r"|data:image\/" if data else "") + r")/))"

# الحقول العامة للمدرب (تطابق Data.PUBLIC_FIELDS)
PUBLIC = {
    'name': S(60), 'nameEn': S(60), 'title': S(80), 'gender': "newData.val() == 'm' || newData.val() == 'f'", 'region': S(20), 'city': S(40),
    'bio': S(4000), 'topics': S(800), 'certs': S(800), 'langs': S(60), 'theme': S(20), 'photoUrl': URL(300, True),
    'years': N(60), 'hours': N(100000), 'programs': N(10000),
    # إطار الصورة الدائرية: الموضع والتكبير
    'noPhoto': 'newData.isBoolean()',
    # مناطق التواجد (الأولى هي region) والاستعداد للسفر
    'regions': str_list(13, 20), 'travel': 'newData.isBoolean()', 'tot': 'newData.isBoolean()', 'proCerts': S(300), 'partners': S(600),
    'cardSpecs': str_list(6, 20),
    'photoX': N(100), 'photoY': N(100), 'photoZ': 'newData.isNumber() && newData.val() >= 1 && newData.val() <= 3',
}
# إجابات الحقول المخصصة في النماذج (تُدار من لوحة الإدارة ← النماذج)
extra = {'$k': {'.validate': "$k.matches(/^[a-z0-9_]{1,30}$/) && newData.isString() && newData.val().length <= 1000"}}

def fields(spec, write=None):
    out = {}
    for k, v in spec.items():
        out[k] = dict(v) if isinstance(v, dict) else {'.validate': v}
        if write:
            out[k]['.write'] = write
    return out

trainer_fields = fields(PUBLIC, self_trainer)
trainer_fields['specs'] = {**str_list(15, 20), '.write': self_trainer}
trainer_fields['modes'] = {**str_list(3, 10), '.write': self_trainer}
trainer_fields['extra'] = {**extra, '.write': self_trainer}
trainer_fields['updatedAt'] = {'.validate': 'newData.isNumber()', '.write': self_trainer}
for k in ['id', 'code', 'status', 'appId', 'uid']:
    trainer_fields[k] = {'.validate': S(80)}
# رابط الصفحة: يُعدّله المدرب لنفسه فقط إذا حجزه في slugs/ باسمه (فلا يستولي على رابط غيره)
trainer_fields['slug'] = {'.validate': "newData.isString() && newData.val().matches(/^[a-z0-9-]{1,60}$/)", '.write': f"{self_trainer} && root.child('{ROOT}/slugs/' + newData.val()).val() == $id"}
for k in ['featured', 'demo']:
    trainer_fields[k] = {'.validate': 'newData.isBoolean()'}
for k in ['publishedAt', 'expiresAt']:
    trainer_fields[k] = {'.validate': 'newData.isNumber()'}
trainer_fields['$other'] = {'.validate': False}

phone = "newData.isString() && newData.val().matches(/^9665[0-9]{8}$/)"
create = lambda required: f"(!data.exists() && newData.hasChildren({json.dumps(required)}) && newData.child('status').val() == 'new') || {admin}"
status_new = "newData.val() == 'new' || " + admin

def public_form(required, spec):
    node = {'.write': create(required), **fields(spec)}
    node['status'] = {'.validate': status_new.replace(admin, f"({admin} || newData.val() == 'done')")}
    # التاريخ: عند الإنشاء بين يومين مضيا ودقيقة قادمة (يتسع لاختلاف ساعة الجهاز)، وعند التعديل لا يتغير
    node['ts'] = {'.validate': 'newData.isNumber() && (data.exists() ? newData.val() == data.val() : (newData.val() >= now - 172800000 && newData.val() <= now + 60000))'}
    node['id'] = {'.validate': S(40)}
    node['.validate'] = '$id.matches(/^[A-Za-z0-9_-]{1,40}$/)'
    node['$other'] = {'.validate': False}
    return node

lead_spec = {'org': S(120), 'person': S(80), 'phone': phone, 'email': S(120), 'topic': S(160), 'when': S(120), 'mode': S(10), 'msg': S(2000), 'trainerId': S(20), 'trainerName': S(80),
             'emailedAt': 'newData.isNumber()', 'waSentAt': 'newData.isNumber()', 'notifiedAt': 'newData.isNumber()'}
req_spec = {**{k: v for k, v in lead_spec.items() if k not in ('trainerId', 'trainerName')}, 'spec': S(20), 'region': S(20), 'size': N(100000), 'matches': str_list(6, 20)}
hall_spec = {'type': "newData.val() == 'book' || newData.val() == 'list'", 'name': S(120), 'phone': phone, 'region': S(20), 'city': S(80), 'capacity': N(5000), 'when': S(120), 'desc': S(2000)}
app_spec = {**PUBLIC, 'specs': 'newData.hasChildren()', 'modes': 'newData.hasChildren()', 'phone': phone, 'email': S(120), 'cvUrl': URL(300), 'ack': 'newData.isBoolean()',
            # حقول القرار والإشعارات: لا يكتبها المتقدّم (الإدارة فقط؛ وسكربت الأتمتة يكتب بصلاحية الخدمة)
            'decidedAt': f'newData.isNumber() && {admin}', 'notifiedAt': f'newData.isNumber() && {admin}', 'trainerId': f'{S(20)} && {admin}',
            **{k: f'newData.isNumber() && {admin}' for k in ['receivedEmailAt', 'initialAt', 'finalAt', 'noticeInitialMail', 'noticeInitialWa', 'noticeFinalMail', 'noticeFinalWa']}}

lead = public_form(['trainerId', 'org', 'person', 'phone', 'topic', 'ts', 'status'], lead_spec)
lead['trainerId'] = {'.validate': S(20) + f" && root.child('{ROOT}/trainers/' + newData.val()).exists()"}
# المدرب يحدّث حالة الطلب الموجه له فقط
lead['status']['.write'] = f"auth != null && data.exists() && root.child('{ROOT}/uids/' + auth.uid).exists() && data.parent().child('trainerId').val() == {me} && (newData.val() == 'done' || newData.val() == 'new')"
app = public_form(['name', 'phone', 'email', 'region', 'specs', 'ts', 'status'], app_spec)
app['specs'] = {**str_list(15, 20)}
app['modes'] = {**str_list(3, 10)}
app['extra'] = extra

rules = {
    'rules': {
        ROOT: {
            '.read': admin,
            '.write': admin,
            'content': {
                '.read': True,
                # تخصصات يضيفها الزوار عبر «أخرى»: إنشاء فقط (لا تعديل ولا حذف إلا للإدارة)
                'specialties': {'added': {'$k': {
                    '.write': '!data.exists() && newData.exists()',
                    '.validate': "$k.matches(/^u[a-z0-9]{1,18}$/) && newData.hasChildren(['name'])",
                    'name': {'.validate': "newData.isString() && newData.val().matches(/^[^<>&\"'`=]{2,60}$/)"},
                    'icon': {'.validate': "newData.isString() && newData.val() == 'fa-shapes'"},
                    '$other': {'.validate': False},
                }}},
            },
            'meta': {'.read': True},
            # حجز روابط صفحات المدربين (الرابط ← رقم المدرب): قراءة عامة؛ يحجز المدرب رابطاً حراً أو رابطه نفسه فقط، ولا يحذف أحد غير الإدارة
            'slugs': {'.read': True, '$s': {
                '.write': f"auth != null && newData.val() == {me} && (!data.exists() || data.val() == newData.val())",
                '.validate': "$s.matches(/^[a-z0-9-]{1,60}$/) && !$s.matches(/^(admin|me|login|join|status|request|halls|about|trainers|t|og|assets|js|css|vendor|tools|integrations|privacy|index|404|robots|sitemap|api|www)$/) && newData.isString()",
            }},
            'halls': {'.read': True},
            'trainers': {'.read': True, '$id': {'.validate': "newData.hasChildren(['name', 'code'])", **trainer_fields}},
            # بطاقات «من طلبات هذا الشهر» في الرئيسية (دون بيانات تواصل)
            'showcase': {'.read': True},
            # منشورات التواصل الاجتماعي وصورها وإعدادات الأتمتة: للإدارة فقط (القاعدة العامة أعلاه)
            # عدّادات المشاهدات (زيادة بمقدار 1 فقط) + مشاهدات كل مدرب يومياً + ملخص المنصة العام الذي يكتبه سكربت الأتمتة (للإدارة فقط كتابةً)
            'stats': {'.read': True, **{k: {'$id': {'.write': INC, '.validate': f"root.child('{ROOT}/trainers/' + $id).exists()"}} for k in ('views', 'clicks')},
                'vday': {'$id': {'.validate': f"root.child('{ROOT}/trainers/' + $id).exists()", '$d': {'.write': INC, '.validate': "$d.matches(/^[0-9]{8}$/)"}}}},
            # إحصاءات الزوار (زيادة بمقدار 1 فقط، دون أي بيانات شخصية): يقرؤها المشرفون
            'analytics': {
                'day': {'$d': {'.validate': "$d.matches(/^[0-9]{8}$/)", '$m': {
                    '.write': INC,
                    '.validate': "$m.matches(/^(views|visits|visitors|newv|searches|contacts|joins|requests)$/)",
                }}},
                **{k: {'$k': {'.write': INC, '.validate': "$k.length <= 40 && !$k.matches(/[<>&\"'`]/)"}} for k in ('page', 'ref', 'dev', 'browser', 'lang', 'hour', 'term', 'spec', 'region', 'event', 'utm')},
            },
            # بيانات Google Analytics وSearch Console يكتبها سكربت الأتمتة (للإدارة فقط)
            # بيانات التواصل الخاصة: يقرؤها المدرب ويعدّل جواله وبريده فقط (والباقي للإدارة)
            'private': {'$id': {
                '.read': self_trainer,
                'phone': {'.write': self_trainer, '.validate': "newData.isString() && (newData.val() == '' || " + phone.split('&& ', 1)[1] + ")"},
                'email': {'.write': self_trainer, '.validate': S(120)},
                'extra': extra,
                '$other': {'.validate': False},
            }},
            'notes': {'$id': {'.read': self_trainer}},
            # نشاط المدربين (دخول/تعديل): يُسجَّل بواسطة المدرب نفسه إنشاءً فقط، وتقرؤه الإدارة
            'activity': {'$id': {'$k': {
                '.write': f"auth != null && {me} == $id && !data.exists() && newData.exists()",
                '.validate': "newData.hasChildren(['ts', 'type'])",
                'ts': {'.validate': 'newData.isNumber() && newData.val() >= now - 172800000 && newData.val() <= now + 60000'},
                'type': {'.validate': "newData.isString() && newData.val().matches(/^(login|edit)$/)"},
                'detail': {'.validate': S(80)},
                'id': {'.validate': S(40)},
                '$other': {'.validate': False},
            }}},
            'leads': {
                '.read': f"auth != null && root.child('{ROOT}/uids/' + auth.uid).exists() && query.orderByChild == 'trainerId' && query.equalTo == {me}",
                '.indexOn': ['trainerId'],
                '$id': lead,
            },
            'requests': {'$id': public_form(['org', 'person', 'phone', 'topic', 'ts', 'status'], req_spec)},
            'hallReqs': {'$id': public_form(['type', 'name', 'phone', 'region', 'ts', 'status'], hall_spec)},
            'applications': {'$id': {**app, '.validate': '$id.matches(/^A[0-9A-Z]{7}$/)'}},
            'appStatus': {'$id': {
                '.read': True,
                '.write': f"(!data.exists() && newData.child('status').val() == 'new' && $id.matches(/^A[0-9A-Z]{{7}}$/)) || {admin}",
                'status': {'.validate': S(20)}, 'ts': {'.validate': 'newData.isNumber()'}, 'note': {'.validate': S(500)}, 'trainerSlug': {'.validate': S(80)},
                '$other': {'.validate': False},
            }},
            'uids': {'$uid': {'.read': 'auth != null && auth.uid == $uid'}},
            'admins': {'$uid': {
                '.read': 'auth != null && auth.uid == $uid',
                '.write': f"{owner} || (auth != null && auth.uid == $uid && !data.exists() && auth.token.email_verified == true && root.child('{ROOT}/adminInvites/' + auth.token.email.toLowerCase().replace('.', ',')).exists())",
            }},
            'adminInvites': {
                '.write': owner,
                '$key': {
                    '.read': "auth != null && auth.token.email_verified == true && auth.token.email.toLowerCase().replace('.', ',') == $key",
                    '.write': "auth != null && auth.token.email_verified == true && auth.token.email.toLowerCase().replace('.', ',') == $key && !newData.exists()",
                },
            },
        }
    }
}

out = pathlib.Path(__file__).resolve().parent.parent / 'database.rules.json'
out.write_text(json.dumps(rules, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('wrote', out)
