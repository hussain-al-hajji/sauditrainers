/* لوحة الإدارة ← التخصصات: إدارة كتالوج مجالات التدريب (إضافة وتعديل وحذف)
 * يُحفظ في content/specialties/list ويقرؤه الموقع كله (نماذج التسجيل والبحث والبطاقات). */

function aSpecs(main) {
  const list = SPECIALTIES.filter(s => s.k !== 'other').map(s => ({ ...s }));
  const counts = Data.specCounts ? Data.specCounts() : {};
  const trainers = Data.all();
  const save = async next => {
    const out = next.filter(x => x.k !== 'other');
    out.push({ k: 'other', name: 'تخصصات أخرى', icon: 'fa-shapes' });
    await Store.set('content/specialties/list', out);
    await Store.set('content/specialties/added', null); // ما أضافه الزوار صار جزءاً من القائمة
    loadSpecialties(); Security.log('تعديل التخصصات', out.length - 1 + ' تخصصاً');
    aSpecs(main);
  };
  main.innerHTML = `
    <div class="dash-h"><h2>التخصصات ومجالات التدريب</h2><div class="row"><button class="btn primary" id="add"><i class="fa-solid fa-plus"></i> إضافة تخصص</button></div></div>
    <p class="muted small">يختار المدرب حتى 15 مجالاً من هذه القائمة، ويظهر منها 6 في بطاقته، ويستطيع إضافة تخصص جديد بزر «أخرى» فيدخل القائمة فوراً ويظهر هنا لتحذفه إن لم يصلح. التعديل يسري على النماذج والبحث فوراً، وحذف تخصص يُزيله من اختيارات المدربين.</p>
    <input type="search" class="list-search" id="sq" placeholder="ابحث في التخصصات...">
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>الاسم</th><th>الأيقونة</th><th>المدربون</th><th></th></tr></thead><tbody>
      ${list.map((s, i) => `<tr><td><i class="fa-solid ${esc(s.icon)}"></i></td><td>${esc(s.name)}</td><td class="muted num" dir="ltr">${esc(s.icon)}</td><td class="num">${counts[s.k] || 0}</td>
        <td><button class="btn sm" data-ed="${i}"><i class="fa-solid fa-pen"></i></button> <button class="btn sm ghost" data-del="${i}" style="color:var(--bad)"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
    </tbody></table></div>`;
  const editor = (s, i) => {
    const m = modal(`<h3>${s ? 'تعديل تخصص' : 'إضافة تخصص'}</h3>
      <form id="sf" style="display:grid;gap:12px">
        ${field('الاسم', `<input name="name" maxlength="60" required value="${esc(s?.name || '')}">`)}
        ${field('أيقونة Font Awesome (اختياري)', `<input name="icon" dir="ltr" placeholder="fa-shapes" value="${esc(s?.icon || '')}">`)}
        <button class="btn primary">حفظ</button></form>`);
    m.$('#sf').onsubmit = e => {
      e.preventDefault();
      const name = m.$('[name=name]').value.trim(); let icon = m.$('[name=icon]').value.trim();
      if (!name) return;
      if (!/^fa-[a-z0-9-]{1,40}$/.test(icon)) icon = 'fa-shapes';
      if (list.some((x, j) => j !== i && normAr(x.name) === normAr(name))) { toast('هذا التخصص موجود', 'error'); return; }
      const next = list.map(x => ({ ...x }));
      if (s) next[i] = { ...s, name, icon }; else next.push({ k: 'c' + Store.newId().slice(-8).replace(/[^a-z0-9]/g, '0'), name, icon });
      m.close(); save(next);
    };
  };
  $('#sq', main).oninput = e => { const q = normAr(e.target.value); $$('.tbl tbody tr', $('.tbl-wrap:last-of-type', main)).forEach(r => r.classList.toggle('ls-off', !!q && !normAr(r.children[1].textContent).includes(q))); };
  $('#add', main).onclick = () => editor(null);
  $$('[data-ed]', main).forEach(b => b.onclick = () => editor(list[+b.dataset.ed], +b.dataset.ed));
  $$('[data-del]', main).forEach(b => b.onclick = async () => {
    const s = list[+b.dataset.del];
    if (!await confirmBox(`حذف التخصص <b>${esc(s.name)}</b>؟ يُزال من ${counts[s.k] || 0} مدرب.`, { ok: 'حذف', danger: true })) return;
    trainers.filter(t => Data.specs(t).includes(s.k)).forEach(t => {
      Store.update(`trainers/${t.id}`, { specs: arrFix(Data.specs(t).filter(k => k !== s.k)), cardSpecs: Data.cardSpecs(t).filter(k => k !== s.k) });
    });
    save(list.filter(x => x.k !== s.k));
  });
}
// القاعدة تشترط أن تكون القائمة غير فارغة؛ نبقي «other» دائماً
const arrFix = a => a.length ? a : ['other'];
