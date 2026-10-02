/* لوحة الإدارة ← النماذج: تعديل نموذج تسجيل المدربين ونموذج إضافة/تعديل مدرب
 * الحقول الأساسية تُعاد تسميتها وتُخفى وتُنقل، والمخصصة تُضاف وتُحذف. التغييرات تُحفظ مرة واحدة بزر «حفظ». */

const STEP_ICONS = ['fa-id-card', 'fa-layer-group', 'fa-award', 'fa-camera', 'fa-briefcase', 'fa-graduation-cap', 'fa-file-lines', 'fa-circle-info', 'fa-star', 'fa-list-check'];

function aForms(main) {
  const kind = main.dataset.kind || 'join';
  // نسخة عمل قابلة للتعديل من الإعداد الحالي
  if (!main._draft || main._draftKind !== kind) { main._draft = JSON.parse(JSON.stringify(FormKit.config(kind))); main._draftKind = kind; main._dirty = false; }
  const steps = main._draft;
  const dirty = () => { main._dirty = true; aForms(main); };
  const badge = (on, cls, txt) => (on ? `<span class="pill ${cls}">${txt}</span>` : '');

  main.innerHTML = `
    <div class="dash-h"><h2>النماذج</h2>
      <div class="row">
        <button class="btn sm ghost" id="rst"><i class="fa-solid fa-rotate-left"></i> الافتراضي</button>
        ${kind === 'join' ? '<a class="btn sm" href="#/join" target="_blank"><i class="fa-solid fa-eye"></i> معاينة</a>' : ''}
        <button class="btn primary" id="sv" ${main._dirty ? '' : 'disabled'}><i class="fa-solid fa-floppy-disk"></i> حفظ التغييرات</button>
      </div>
    </div>
    <div class="tracks" style="margin:0 0 18px"><button data-k="join" class="${kind === 'join' ? 'on' : ''}"><i class="fa-solid fa-user-plus"></i> نموذج تسجيل المدربين</button><button data-k="admin" class="${kind === 'admin' ? 'on' : ''}"><i class="fa-solid fa-id-card"></i> نموذج إضافة/تعديل مدرب</button></div>
    <p class="muted small">${kind === 'join' ? 'خطوات النموذج الذي يعبّئه المدرب عند التسجيل. الحقول الأساسية مرتبطة بالبطاقة؛ يمكن تعديل نصها أو إخفاؤها، والمقفلة منها (🔒) مطلوبة دائماً.' : 'النموذج الذي تستخدمه الإدارة لإضافة مدرب أو تعديله، ويرى المدرب منه في لوحته الحقول العامة فقط.'}</p>
    <div class="fb">${steps.map((s, si) => `
      <section class="fb-step">
        <header><span class="fb-ic"><i class="fa-solid ${esc(s.icon || 'fa-circle')}"></i></span><div class="grow"><b>${esc(s.title)}</b>${s.desc ? `<small>${esc(s.desc)}</small>` : ''}</div>
          <div class="acts"><button class="btn sm icon" data-su="${si}" title="أعلى" ${si ? '' : 'disabled'}><i class="fa-solid fa-arrow-up"></i></button><button class="btn sm icon" data-sd="${si}" title="أسفل" ${si < steps.length - 1 ? '' : 'disabled'}><i class="fa-solid fa-arrow-down"></i></button><button class="btn sm icon" data-se="${si}" title="تعديل الخطوة"><i class="fa-solid fa-pen"></i></button><button class="btn sm icon" data-sx="${si}" title="حذف الخطوة" ${steps.length > 1 ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button></div></header>
        <div class="fb-fields">${s.fields.map((f, fi) => `
          <div class="fb-field ${f.hidden && !f.lock ? 'off' : ''}">
            <span class="fb-t" title="${esc(typeName(f.type))}"><i class="fa-solid ${FIELD_TYPES.find(x => x.k === f.type)?.icon || 'fa-cube'}"></i></span>
            <div class="grow"><b>${esc(f.label)}</b><div class="fb-badges">${badge(true, 'gray', esc(typeName(f.type)))}${badge(f.core, 'info', f.lock ? '🔒 أساسي' : 'أساسي')}${badge(FormKit.required(f), 'warn', 'إلزامي')}${badge(f.hidden && !f.lock, 'gray', 'مخفي')}${badge(f.priv, 'bad', 'إداري خاص')}${badge(f.custom && f.pub, 'ok', 'يظهر في البطاقة')}${badge(f.joinOnly && kind === 'join', 'gold', 'في الطلب فقط')}</div></div>
            <div class="acts">
              <button class="btn sm icon" data-fu="${si}.${fi}" title="أعلى" ${fi ? '' : 'disabled'}><i class="fa-solid fa-arrow-up"></i></button>
              <button class="btn sm icon" data-fd="${si}.${fi}" title="أسفل" ${fi < s.fields.length - 1 ? '' : 'disabled'}><i class="fa-solid fa-arrow-down"></i></button>
              <button class="btn sm icon" data-fh="${si}.${fi}" title="${f.hidden ? 'إظهار' : 'إخفاء'}" ${f.lock ? 'disabled' : ''}><i class="fa-solid fa-${f.hidden && !f.lock ? 'eye-slash' : 'eye'}"></i></button>
              <button class="btn sm icon" data-fe="${si}.${fi}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
              <button class="btn sm icon" data-fx="${si}.${fi}" title="${f.custom ? 'حذف' : 'الحقول الأساسية لا تُحذف — يمكن إخفاؤها'}" ${f.custom ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`).join('') || '<p class="muted small center">لا حقول في هذه الخطوة</p>'}</div>
        <button class="btn sm" data-fa="${si}"><i class="fa-solid fa-plus"></i> إضافة حقل</button>
      </section>`).join('')}
      <button class="btn" id="as"><i class="fa-solid fa-plus"></i> إضافة ${kind === 'join' ? 'خطوة' : 'قسم'}</button>
    </div>`;

  $$('.tracks button', main).forEach(b => b.onclick = async () => {
    if (main._dirty && !await confirmBox('لديك تغييرات غير محفوظة. الانتقال دون حفظ؟', { ok: 'انتقال', danger: true })) return;
    main.dataset.kind = b.dataset.k; main._draft = null; aForms(main);
  });
  const at = v => v.split('.').map(Number);
  const swap = (list, i, j) => { [list[i], list[j]] = [list[j], list[i]]; };
  $$('[data-su]', main).forEach(b => b.onclick = () => { const i = +b.dataset.su; swap(steps, i, i - 1); dirty(); });
  $$('[data-sd]', main).forEach(b => b.onclick = () => { const i = +b.dataset.sd; swap(steps, i, i + 1); dirty(); });
  $$('[data-fu]', main).forEach(b => b.onclick = () => { const [s, f] = at(b.dataset.fu); swap(steps[s].fields, f, f - 1); dirty(); });
  $$('[data-fd]', main).forEach(b => b.onclick = () => { const [s, f] = at(b.dataset.fd); swap(steps[s].fields, f, f + 1); dirty(); });
  $$('[data-fh]', main).forEach(b => b.onclick = () => { const [s, f] = at(b.dataset.fh); steps[s].fields[f].hidden = !steps[s].fields[f].hidden; dirty(); });
  $$('[data-fx]', main).forEach(b => b.onclick = async () => {
    const [s, f] = at(b.dataset.fx);
    if (!await confirmBox(`حذف الحقل «${esc(steps[s].fields[f].label)}»؟ تبقى الإجابات السابقة محفوظة في الطلبات.`, { ok: 'حذف', danger: true })) return;
    steps[s].fields.splice(f, 1); dirty();
  });
  $$('[data-sx]', main).forEach(b => b.onclick = async () => {
    const i = +b.dataset.sx, st = steps[i];
    const core = st.fields.filter(f => f.core);
    if (!await confirmBox(`حذف «${esc(st.title)}»؟${core.length ? ` تنتقل حقولها الأساسية (${core.length}) إلى الخطوة المجاورة.` : ''}`, { ok: 'حذف', danger: true })) return;
    steps.splice(i, 1);
    steps[Math.max(0, i - 1)].fields.push(...core);
    dirty();
  });
  $$('[data-se]', main).forEach(b => b.onclick = () => stepEditor(steps[+b.dataset.se], () => dirty()));
  $('#as', main).onclick = () => { const st = { id: 's' + Store.newId(), title: 'خطوة جديدة', icon: 'fa-circle-info', fields: [] }; stepEditor(st, () => { steps.push(st); dirty(); }); };
  $$('[data-fe]', main).forEach(b => b.onclick = () => { const [s, f] = at(b.dataset.fe); fieldEditor(steps, s, steps[s].fields[f], (ns, nf) => { steps[s].fields.splice(f, 1); steps[ns].fields.push(nf); if (ns === s) { steps[s].fields.splice(f, 0, steps[s].fields.pop()); } dirty(); }); });
  $$('[data-fa]', main).forEach(b => b.onclick = () => {
    const s = +b.dataset.fa;
    fieldEditor(steps, s, null, (ns, nf, alsoOther) => {
      steps[ns].fields.push(nf);
      if (alsoOther) {
        // الحقل نفسه (بالمفتاح نفسه) في النموذج الآخر ليُحفظ ويُعدَّل من الإدارة
        const other = kind === 'join' ? 'admin' : 'join';
        const oc = JSON.parse(JSON.stringify(FormKit.config(other)));
        oc[Math.min(ns, oc.length - 1)].fields.push({ ...nf });
        Store.set(`content/form/${other}`, { steps: strip(oc) });
      }
      dirty();
    }, kind);
  });
  $('#rst', main).onclick = async () => {
    if (!await confirmBox('استعادة النموذج الافتراضي؟ تُحذف الحقول المخصصة والتعديلات من هذا النموذج.', { ok: 'استعادة', danger: true })) return;
    Store.set(`content/form/${kind}`, null); main._draft = null; Security.log('استعادة نموذج افتراضي', kind); aForms(main);
  };
  $('#sv', main).onclick = () => {
    Store.set(`content/form/${kind}`, { steps: strip(steps) });
    Security.log('تعديل النماذج', kind === 'join' ? 'نموذج التسجيل' : 'نموذج إضافة مدرب');
    main._dirty = false; toast('تم حفظ النموذج'); aForms(main);
  };
}

// يحفظ من الحقل الأساسي التعديلات فقط، ومن المخصص تعريفه كاملاً
function strip(steps) {
  return steps.map(s => ({ id: s.id, title: s.title, icon: s.icon || '', desc: s.desc || '', fields: s.fields.map(f => {
    if (f.custom) { const { core, lock, priv, joinOnly, ...rest } = f; return rest; }
    const o = { k: f.k }; ['label', 'hint', 'ph', 'w'].forEach(k => { if (f[k] != null && f[k] !== CORE_FIELDS[f.k][k]) o[k] = f[k]; });
    if (!f.lock && !!f.req !== !!CORE_FIELDS[f.k].req) o.req = !!f.req;
    if (f.hidden && !f.lock) o.hidden = true;
    return o;
  }) }));
}

function stepEditor(st, done) {
  const m = modal(`<h3><i class="fa-solid fa-pen"></i> ${esc(st.title)}</h3><form id="sf">
    ${field('العنوان', `<input type="text" name="title" required maxlength="40" value="${esc(st.title)}">`)}
    ${field('وصف قصير يظهر أعلى الخطوة', `<input type="text" name="desc" maxlength="160" value="${esc(st.desc || '')}">`)}
    <div class="field"><span>الأيقونة</span><div class="icon-pick">${STEP_ICONS.map(i => `<label><input type="radio" name="icon" value="${i}" ${st.icon === i ? 'checked' : ''}><span><i class="fa-solid ${i}"></i></span></label>`).join('')}</div></div>
    <button class="btn primary">تم</button></form>`);
  m.$('#sf').onsubmit = e => { e.preventDefault(); Object.assign(st, formData(e.target)); m.close(); done(); };
}

function fieldEditor(steps, si, f, done, kind) {
  const isNew = !f;
  f = f || { custom: true, k: 'c' + Store.newId().slice(-7).replace(/[^a-z0-9]/g, '0'), type: 'text', label: '', req: false, pub: false, edit: true };
  const custom = !!f.custom;
  const m = modal(`<h3><i class="fa-solid fa-${isNew ? 'plus' : 'pen'}"></i> ${isNew ? 'حقل جديد' : esc(f.label)}</h3>
    <form id="ff">
      ${custom ? `<div class="field"><span>نوع الحقل</span><div class="type-pick">${FIELD_TYPES.map(t => `<label><input type="radio" name="type" value="${t.k}" ${f.type === t.k ? 'checked' : ''}><span><i class="fa-solid ${t.icon}"></i>${t.name}</span></label>`).join('')}</div></div>` : `<div class="banner info"><i class="fa-solid fa-link"></i>حقل أساسي مرتبط بالبطاقة (${esc(typeName(f.type))}). يمكن تعديل نصه${f.lock ? '' : ' وإلزامه وإخفاؤه'}.</div>`}
      ${field('عنوان الحقل *', `<input type="text" name="label" required maxlength="120" value="${esc(f.label)}">`)}
      <div class="grid2">
        ${field('نص توضيحي', `<input type="text" name="hint" maxlength="200" value="${esc(f.hint || '')}">`)}
        ${field('مثال داخل الحقل', `<input type="text" name="ph" maxlength="120" value="${esc(f.ph || '')}">`)}
      </div>
      <div class="field ${custom ? '' : 'hidden'}" id="ow"><span>الخيارات (كل خيار في سطر)</span><textarea name="opts" style="min-height:90px">${esc(arr(f.opts).join('\n'))}</textarea></div>
      <div class="grid2">
        ${field('العرض', `<select name="w">${opt('', 'نصف السطر', f.w)}${opt('full', 'سطر كامل', f.w)}</select>`)}
        ${field('الخطوة', `<select name="step">${steps.map((s, i) => opt(i, s.title, si)).join('')}</select>`)}
      </div>
      <div class="checks">
        <label class="chk"><input type="checkbox" name="req" ${FormKit.required(f) ? 'checked' : ''} ${f.lock ? 'disabled' : ''}><span><i class="fa-solid fa-asterisk"></i>إلزامي</span></label>
        <label class="chk"><input type="checkbox" name="hidden" ${f.hidden ? 'checked' : ''} ${f.lock ? 'disabled' : ''}><span><i class="fa-solid fa-eye-slash"></i>مخفي</span></label>
        ${custom ? `<label class="chk"><input type="checkbox" name="pub" ${f.pub ? 'checked' : ''}><span><i class="fa-solid fa-id-card"></i>يظهر في صفحة المدرب العامة</span></label>
        <label class="chk"><input type="checkbox" name="edit" ${f.edit !== false ? 'checked' : ''}><span><i class="fa-solid fa-user-pen"></i>يعدّله المدرب من لوحته (إن كان عاماً)</span></label>` : ''}
        ${isNew ? `<label class="chk"><input type="checkbox" name="also" checked><span><i class="fa-solid fa-copy"></i>أضفه أيضاً إلى ${kind === 'join' ? 'نموذج إضافة المدرب' : 'نموذج التسجيل'}</span></label>` : ''}
      </div>
      <p class="small muted">${custom ? 'تُحفظ إجابات الحقول المخصصة مع الطلب. العامة منها تُنقل إلى صفحة المدرب عند النشر، والخاصة تبقى للإدارة فقط. لا تجعل حقلاً يحتوي بيانات تواصل عاماً.' : ''}</p>
      <button class="btn primary lg">${isNew ? 'إضافة الحقل' : 'تم'}</button>
    </form>`, { wide: true });
  const form = m.$('#ff');
  const syncOpts = () => { const t = form.querySelector('[name=type]:checked')?.value; m.$('#ow').classList.toggle('hidden', !custom || !['select', 'multi'].includes(t)); };
  form.addEventListener('change', syncOpts); syncOpts();
  form.onsubmit = e => {
    e.preventDefault();
    const d = formData(form);
    const nf = { ...f, label: d.label, hint: d.hint, ph: d.ph, w: d.w };
    if (!f.lock) { nf.req = !!d.req; nf.hidden = !!d.hidden; }
    if (custom) {
      Object.assign(nf, { type: d.type, pub: !!d.pub, edit: !!d.edit, opts: ['select', 'multi'].includes(d.type) ? lines(d.opts) : null });
      if (['select', 'multi'].includes(d.type) && !nf.opts.length) { toast('أضف خياراً واحداً على الأقل', 'error'); return; }
      if (nf.pub && ['tel', 'email'].includes(d.type)) { toast('حقول الجوال والبريد لا تكون عامة — بيانات التواصل خاصة', 'error'); return; }
    }
    m.close();
    done(Number(d.step), nf, !!d.also);
  };
}
