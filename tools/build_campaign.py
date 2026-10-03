#!/usr/bin/env python3
"""يولّد integrations/google-apps-script/Campaign.gs: محرّك الرسائل (js/mail-render.js) + منطق إرسال الحملات.
التشغيل من جذر المستودع بعد أي تعديل على js/mail-render.js أو tools/campaign_server.gs.part"""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
head = """/**
 * مراسلة المدربين من لوحة الإدارة — ملف إضافي في مشروع Apps Script نفسه (مع Code.gs أو Code-mail.gs).
 * مولَّد آلياً: لا تعدّله يدوياً (python3 tools/build_campaign.py).
 * يتطلب أن يستدعي doPost الدالة sendCampaign عند action === 'campaign' وأن تستدعي sweepPending الدالة continueCampaigns (موجودان في Code*.gs).
 */

"""
render = (root / 'js/mail-render.js').read_text(encoding='utf8')
part = (root / 'tools/campaign_server.gs.part').read_text(encoding='utf8')
(root / 'integrations/google-apps-script/Campaign.gs').write_text(head + render + '\n' + part, encoding='utf8')
print('تم: integrations/google-apps-script/Campaign.gs')
