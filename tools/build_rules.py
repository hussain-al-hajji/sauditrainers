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
admin = f"({owner} || (auth != null && root.child('{ROOT}/admins/' + auth.uid).exists()))"
me = f"root.child('{ROOT}/uids/' + auth.uid).val()"
self_trainer = f"(auth != null && {me} == $id)"

S = lambda n: f"newData.isString() && newData.val().length <= {n}"
N = lambda n: f"newData.isNumber() && newData.val() >= 0 && newData.val() <= {n}"
str_list = lambda n, each=80: {'.validate': 'newData.hasChildren()', '$i': {'.validate': S(each)}}

# الحقول العامة للمدرب (تطابق Data.PUBLIC_FIELDS)
PUBLIC = {
    'name': S(60), 'nameEn': S(60), 'title': S(80), 'gender': "newData.val() == 'm' || newData.val() == 'f'", 'region': S(20), 'city': S(40),
    'bio': S(1200), 'topics': S(800), 'certs': S(800), 'langs': S(60), 'theme': S(20), 'photoUrl': S(300),
    'years': N(60), 'hours': N(100000), 'programs': N(10000),
    # إطار الصورة الدائرية: الموضع والتكبير
    'noPhoto': 'newData.isBoolean()',
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
trainer_fields['specs'] = {**str_list(6, 20), '.write': self_trainer}
trainer_fields['modes'] = {**str_list(3, 10), '.write': self_trainer}
trainer_fields['extra'] = {**extra, '.write': self_trainer}
trainer_fields['updatedAt'] = {'.validate': 'newData.isNumber()', '.write': self_trainer}
for k in ['id', 'code', 'slug', 'status', 'appId', 'uid']:
    trainer_fields[k] = {'.validate': S(80)}
for k in ['featured', 'demo']:
    trainer_fields[k] = {'.validate': 'newData.isBoolean()'}
for k in ['publishedAt', 'expiresAt']:
    trainer_fields[k] = {'.validate': 'newData.isNumber()'}
trainer_fields['$other'] = {'.validate': False}

phone = "newData.isString() && newData.val().matches(/^9665[0-9]{8}$/)"
create = lambda required: f"(!data.exists() && newData.hasChildren({json.dumps(required)})) || {admin}"
status_new = "newData.val() == 'new' || " + admin

def public_form(required, spec):
    node = {'.write': create(required), **fields(spec)}
    node['status'] = {'.validate': status_new.replace(admin, f"({admin} || newData.val() == 'done')")}
    node['ts'] = {'.validate': 'newData.isNumber() && newData.val() <= now + 60000'}
    node['id'] = {'.validate': S(40)}
    node['$other'] = {'.validate': False}
    return node

lead_spec = {'org': S(120), 'person': S(80), 'phone': phone, 'email': S(120), 'topic': S(160), 'when': S(120), 'mode': S(10), 'msg': S(2000), 'trainerId': S(20), 'trainerName': S(80),
             'emailedAt': 'newData.isNumber()', 'waSentAt': 'newData.isNumber()', 'notifiedAt': 'newData.isNumber()'}
req_spec = {**{k: v for k, v in lead_spec.items() if k not in ('trainerId', 'trainerName')}, 'spec': S(20), 'region': S(20), 'size': N(100000), 'matches': str_list(6, 20)}
hall_spec = {'type': "newData.val() == 'book' || newData.val() == 'list'", 'name': S(120), 'phone': phone, 'region': S(20), 'city': S(80), 'capacity': N(5000), 'when': S(120), 'desc': S(2000)}
app_spec = {**PUBLIC, 'specs': 'newData.hasChildren()', 'modes': 'newData.hasChildren()', 'phone': phone, 'email': S(120), 'cvUrl': S(300), 'tot': 'newData.isBoolean()',
            'decidedAt': 'newData.isNumber()', 'notifiedAt': 'newData.isNumber()', 'trainerId': S(20),
            # مراحل الطلب: علامات الإرسال تكتبها الإدارة والأتمتة
            **{k: 'newData.isNumber()' for k in ['receivedEmailAt', 'initialAt', 'finalAt', 'noticeInitialMail', 'noticeInitialWa', 'noticeFinalMail', 'noticeFinalWa']}}

lead = public_form(['trainerId', 'org', 'person', 'phone', 'topic', 'ts', 'status'], lead_spec)
# المدرب يحدّث حالة الطلب الموجه له فقط
lead['status']['.write'] = f"auth != null && data.parent().child('trainerId').val() == {me} && (newData.val() == 'done' || newData.val() == 'new')"
app = public_form(['name', 'phone', 'email', 'region', 'specs', 'ts', 'status'], app_spec)
app['specs'] = {**str_list(6, 20)}
app['modes'] = {**str_list(3, 10)}
app['extra'] = extra

rules = {
    'rules': {
        ROOT: {
            '.read': admin,
            '.write': admin,
            'content': {'.read': True},
            'meta': {'.read': True},
            'halls': {'.read': True},
            'trainers': {'.read': True, '$id': {'.validate': "newData.hasChildren(['name', 'code'])", **trainer_fields}},
            # بطاقات «من طلبات هذا الشهر» في الرئيسية (دون بيانات تواصل)
            'showcase': {'.read': True},
            # منشورات التواصل الاجتماعي وصورها وإعدادات الأتمتة: للإدارة فقط (القاعدة العامة أعلاه)
            'stats': {'.read': True, '$kind': {'$id': {
                '.write': "$kind.matches(/^(views|clicks)$/) && newData.isNumber() && newData.val() == (data.exists() ? data.val() : 0) + 1",
            }}},
            'private': {'$id': {'.read': self_trainer}},
            'notes': {'$id': {'.read': self_trainer}},
            'leads': {
                '.read': f"auth != null && query.orderByChild == 'trainerId' && query.equalTo == {me}",
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
