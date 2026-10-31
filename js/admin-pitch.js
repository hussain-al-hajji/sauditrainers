/* لوحة الإدارة ← المحتوى العام ← «المزايا والعوائد»: تحرير المحتوى التسويقي المركزي (Pitch) في مكان واحد.
 * يُحفظ في content/pitch ويتحدّث به: صفحة التسجيل، قسم «انضم كمدرب» في الرئيسية، شرائح الدعاية، الرسالة الشهرية لغير المسجلين، وملف النشرة الشهرية. */
Pitch.admin = function (el) {
  if (!el) return;
  const copy = o => JSON.parse(JSON.stringify(o));
  let st = copy(Pitch.get());
  const ex = k => esc(st[k] == null ? '' : st[k]);
  const sel = (v, cur) => `<option value="${v[0]}" ${cur === v[0] ? 'selected' : ''}>${v[1]}</option>`;
  const itemHtml = (it, i) => `<div class="pt-it" data-i="${i}">
    <div class="pt-top"><b class="num">${i + 1}</b>
      <select data-f="g">${Object.entries(PITCH_GROUPS).map(([k, l]) => sel([k, l], it.g)).join('')}</select>
      <label class="chk"><input type="checkbox" data-f="x" ${it.x ? 'checked' : ''}><span>حصرية للمسجلين</span></label>
      <label class="chk"><input type="checkbox" data-f="tr" ${it.tr ? 'checked' : ''}><span>متاحة للتجربة المجانية</span></label>
      <label class="chk"><input type="checkbox" data-f="top" ${it.top ? 'checked' : ''}><span>تظهر في بطاقة السعر</span></label>
      <span class="grow"></span><button type="button" class="btn sm" data-mv="-1" title="أعلى">↑</button><button type="button" class="btn sm" data-mv="1" title="أسفل">↓</button><button type="button" class="btn sm danger" data-rm title="حذف">✕</button></div>
    <div class="pt-grid">
      <label class="field"><span>العنوان</span><input data-f="t" value="${esc(it.t || '')}" maxlength="90"></label>
      <label class="field"><span>اسم مختصر (للبطاقات)</span><input data-f="s" value="${esc(it.s || '')}" maxlength="40"></label>
      <label class="field"><span>وصف مختصر</span><input data-f="sd" value="${esc(it.sd || '')}" maxlength="70"></label>
      <label class="field"><span>أيقونة الموقع (Font Awesome)</span><input data-f="ic" dir="ltr" value="${esc(it.ic || '')}" placeholder="fa-briefcase"></label>
      <label class="field"><span>إيموجي الرسائل</span><input data-f="em" value="${esc(it.em || '')}" maxlength="4"></label>
      <label class="field" style="grid-column:1/-1"><span>سطر تعريفي موجز للرسائل (اختياري، وإلا يُؤخذ من أول جملة في الوصف)</span><input data-f="b" value="${esc(it.b || '')}" maxlength="120"></label></div>
    <label class="field"><span>الوصف الكامل</span><textarea data-f="d" rows="3" maxlength="420">${esc(it.d || '')}</textarea></label>
    <label class="field"><span>ثلاث نقاط للبطاقات الدعائية (سطر لكل نقطة)</span><textarea data-f="pts" rows="3">${esc((it.pts || []).join('\n'))}</textarea></label></div>`;
  const read = () => {
    ['eyebrow', 'title', 'text', 'feeNote'].forEach(k => { const e = el.querySelector(`[data-h="${k}"]`); if (e) st[k] = e.value.trim(); });
    st.items = [...el.querySelectorAll('.pt-it')].map((box, i) => {
      const g = f => box.querySelector(`[data-f="${f}"]`), o = { ...(st.items[i] || {}) };
      ['t', 's', 'sd', 'ic', 'em', 'd', 'b'].forEach(f => { o[f] = g(f).value.trim(); });
      o.g = g('g').value; o.x = g('x').checked; o.tr = g('tr').checked; o.top = g('top').checked;
      const pts = g('pts').value.split('\n').map(x => x.trim()).filter(Boolean); if (pts.length) o.pts = pts; else delete o.pts;
      o.id = o.id || `m${Date.now().toString(36)}${i}`; return o;
    });
  };
  const draw = () => {
    el.innerHTML = `<div class="pbox pt-box"><h3><i class="fa-solid fa-gem"></i>المزايا والعوائد (مصدر واحد لكل القنوات)</h3>
      <p class="small muted">كل ما تكتبه هنا يظهر تلقائياً في: صفحة التسجيل، وقسم «انضم كمدرب» بالرئيسية، وشرائح الدعاية، والرسالة الشهرية لغير المسجلين، وملف النشرة الشهرية. الميزة الموسومة «حصرية للمسجلين» تظهر في كل مكان بوسم بلون مختلف.</p>
      <div class="pt-grid">
        <label class="field"><span>العنوان الصغير</span><input data-h="eyebrow" value="${ex('eyebrow')}"></label>
        <label class="field"><span>العنوان</span><input data-h="title" value="${ex('title')}"></label>
        <label class="field"><span>وصف الرسوم</span><input data-h="feeNote" value="${ex('feeNote')}"></label></div>
      <label class="field"><span>النص التعريفي</span><textarea data-h="text" rows="3">${ex('text')}</textarea></label>
      <div class="pt-list">${st.items.map(itemHtml).join('')}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn" id="pt-add"><i class="fa-solid fa-plus"></i> ميزة جديدة</button>
        <button type="button" class="btn ghost" id="pt-reset">استعادة الصياغة الافتراضية</button><span class="grow"></span>
        <button type="button" class="btn primary" id="pt-save"><i class="fa-solid fa-floppy-disk"></i> حفظ ونشر لكل القنوات</button></div></div>`;
    el.querySelector('#pt-add').onclick = () => { read(); st.items.push({ id: `m${Date.now().toString(36)}`, g: 'account', x: false, top: false, ic: 'fa-star', em: '✨', t: '', s: '', sd: '', d: '' }); draw(); };
    el.querySelector('#pt-reset').onclick = async () => { if (await confirmBox('استعادة الصياغة الافتراضية؟ تُفقد تعديلاتك غير المحفوظة.', { ok: 'استعادة' })) { st = copy(PITCH_DEFAULT); draw(); } };
    el.querySelector('#pt-save').onclick = async () => {
      read();
      if (st.items.some(i => !i.t)) return toast('اكتب عنواناً لكل ميزة', 'error');
      const out = { eyebrow: st.eyebrow, title: st.title, text: st.text, feeNote: st.feeNote, items: st.items };
      if (await Store.setConfirmed('content/pitch', out)) { Security.log('تحديث المزايا والعوائد التسويقية', `${out.items.length} ميزة`); toast('حُفظت المزايا: تتحدث كل القنوات تلقائياً'); }
    };
    el.querySelectorAll('.pt-it').forEach(box => {
      const i = +box.dataset.i;
      box.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { read(); const j = i + +b.dataset.mv; if (j < 0 || j >= st.items.length) return; [st.items[i], st.items[j]] = [st.items[j], st.items[i]]; draw(); });
      box.querySelector('[data-rm]').onclick = async () => { if (await confirmBox('حذف هذه الميزة من كل القنوات؟', { danger: true, ok: 'حذف' })) { read(); st.items.splice(i, 1); draw(); } };
    });
  };
  draw();
};
