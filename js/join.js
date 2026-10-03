/* التسجيل كمدرب: معالج بخطوات مبني من إعداد النموذج (لوحة الإدارة ← النماذج) مع معاينة حيّة للبطاقة، ومتابعة حالة الطلب */

const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const appId = () => { const a = new Uint32Array(7); crypto.getRandomValues(a); return 'A' + Array.from(a, x => ALPHA[x % ALPHA.length]).join(''); };
const DRAFT_KEY = 'st-join-draft';

/* ===================== صفحة الانضمام ===================== */
Pages.join = {
  static: true,
  render() {
    const c = Data.content();
    const steps = FormKit.steps('join');
    const nav = [...steps.map(s => [s.icon || 'fa-circle', s.title]), ['fa-paper-plane', 'المراجعة']];
    return `
    <section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / سجّل كمدرب سعودي</div><h1>سجّل كمدرّب سعودي</h1><p>${nav.length} خطوات، وترى بطاقتك التعريفية تتشكّل أمامك لحظة بلحظة. يُحفظ تقدّمك تلقائياً على جهازك.</p></div></section>
    <div class="wrap" style="margin-top:-30px;position:relative">
      <div class="cards3" style="margin-bottom:26px">
        <div class="icard reveal"><div class="ic"><i class="fa-solid fa-list-check"></i></div><h3>المتطلبات</h3><ul style="margin:0;padding-inline-start:18px;color:var(--ink2)">${lines(c.join.requirements).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
        <div class="icard reveal" style="--d:160ms"><div class="ic"><i class="fa-solid fa-receipt"></i></div><h3><span class="num">${esc(c.join.fee)}</span> ريال</h3><p><b>${esc(c.join.feeNote)}</b> — ${esc(c.join.period)}.<br><span class="small muted">لا يُطلب السداد إلا بعد قبول الطلب.</span></p></div>
      </div>
      <section class="perks reveal"><div class="perks-h"><span class="eyebrow">لماذا تنضم؟</span><h2>مزايا الانضمام إلى المنصة</h2><p>خبرتك تستحق منصة تعرّف بها، وتوصلها إلى من يبحث عنها.</p></div>
        <div class="perks-grid">${benefitList(c.join.benefits).map((b, i) => `<article class="perk"><span class="perk-n num">${i + 1}</span><div class="perk-ic"><i class="fa-solid ${BENEFIT_ICONS[i % BENEFIT_ICONS.length]}"></i></div><h3>${esc(b.t)}</h3>${b.d ? `<p>${esc(b.d)}</p>` : ''}</article>`).join('')}</div></section>
      <div class="wizard">
        <div class="wiz-main">
          <div class="wiz-steps" id="ws">${nav.map(([i, l], n) => `<button type="button" data-s="${n}" class="${n ? '' : 'on'}"><i class="fa-solid ${esc(i)}"></i>${esc(l)}</button>`).join('')}</div>
          <div class="wiz-prog"><span id="wp"></span></div>
          <form id="wf" novalidate autocomplete="off"><div class="wiz-body"></div></form>
          <div class="wiz-nav"><button class="btn ghost" id="wb" type="button"><i class="fa-solid fa-arrow-right"></i> السابق</button><button class="btn primary" id="wn" type="button">التالي <i class="fa-solid fa-arrow-left"></i></button></div>
        </div>
        <aside class="wiz-side"><div class="lbl"><i class="fa-solid fa-eye"></i> معاينة حيّة لبطاقتك</div><div id="pvw"></div></aside>
      </div>
    </div>`;
  },
  mount(root) {
    const c = Data.content();
    let draft = {};
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') || {}; } catch { draft = {}; }
    const steps = FormKit.steps('join');
    const last = steps.length;
    const body = $('.wiz-body', root);
    body.innerHTML = steps.map((s, i) => `<div class="wiz-pane ${i ? '' : 'on'}" data-p="${i}"><h2>${esc(s.title)}</h2>${s.desc ? `<p class="muted">${esc(s.desc)}</p>` : ''}${FormKit.stepHTML(s, draft)}</div>`).join('')
      + `<div class="wiz-pane" data-p="${last}"><h2>المراجعة والإرسال</h2><div id="sum"></div>
        <div class="req-box"><b>السداد</b><p class="small" style="margin:.3em 0 0">${nl2br(c.join.payment)}</p></div>
        <div class="ack-box"><i class="fa-solid fa-circle-info"></i><p>${nl2br(c.join.disclaimer)}</p></div>
        <label class="chk consent"><input type="checkbox" name="agree"><span><i class="fa-solid fa-file-signature"></i> أقرّ بصحة البيانات، وأوافق على نشرها في المنصة، وعلى رسوم الاشتراك (<span class="num">${esc(c.join.fee)}</span> ريال، ${esc(c.join.period)}) بعد القبول، وأطّلعت على الإقرار أعلاه</span></label>
      </div>`;
    const form = $('#wf', root);
    const panes = $$('.wiz-pane', root), stepsBtns = $$('#ws button', root);
    let cur = 0;
    const save = () => { try { const d = FormKit.read(form); delete d.agree; localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ } };
    const preview = () => { previewCard($('#pvw', root), FormKit.read(form)); save(); };
    FormKit.wire(form, preview);

    const check = n => {
      if (n >= last) return true;
      const err = FormKit.validate(steps[n].fields, FormKit.read(form), panes[n]);
      if (err) { toast(err, 'error'); return false; }
      return true;
    };
    function go(n) {
      cur = n;
      panes.forEach((p, i) => p.classList.toggle('on', i === n));
      stepsBtns.forEach((b, i) => { b.classList.toggle('on', i === n); b.classList.toggle('done', i < n); });
      $('#wp', root).style.width = `${(n + 1) / (last + 1) * 100}%`;
      $('#wb', root).style.visibility = n ? 'visible' : 'hidden';
      $('#wn', root).innerHTML = n === last ? '<i class="fa-solid fa-paper-plane"></i> إرسال الطلب' : 'التالي <i class="fa-solid fa-arrow-left"></i>';
      if (n === last) summary();
      $('.wiz-main', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function summary() {
      const d = FormKit.read(form);
      const show = f => {
        const v = f.custom ? d.extra[f.k] : d[f.k];
        if (v == null || v === '' || v === false || f.type === 'theme' || f.type === 'photo') return '';
        const txt = f.type === 'specs' ? Data.specs(d).map(specName).join('، ') : f.type === 'modes' ? Data.modes(d).map(m => DELIVERY.find(x => x.k === m)?.name).join('، ')
          : f.type === 'region' ? regionsLabel(d) : f.type === 'gender' ? (v === 'f' ? 'مدربة' : 'مدرب') : f.type === 'consent' ? '✓' : f.type === 'tot' ? 'حاصل على شهادة تدريب المدربين' : String(v).replace(/\|/g, '، ');
        return `<dt>${esc(f.label)}</dt><dd>${esc(txt)}</dd>`;
      };
      $('#sum', root).innerHTML = `<dl class="dl">${steps.flatMap(s => s.fields).map(show).join('')}</dl>`;
    }
    stepsBtns.forEach((b, i) => b.onclick = () => { if (i <= cur) return go(i); for (let k = cur; k < i; k++) if (!check(k)) return go(k); go(i); });
    $('#wb', root).onclick = () => cur && go(cur - 1);
    $('#wn', root).onclick = async () => {
      if (cur < last) { if (check(cur)) go(cur + 1); return; }
      for (let k = 0; k < last; k++) if (!check(k)) { go(k); return; }
      const d = FormKit.read(form);
      if (!d.agree) { toast('يلزم الإقرار والموافقة قبل الإرسال', 'error'); return; }
      const id = appId();
      const rec = { ...Data.pick(d, Data.PUBLIC_FIELDS), phone: phoneDigits(d.phone), email: String(d.email || '').toLowerCase(), id, ts: Date.now(), status: 'new' };
      if (d.cvUrl) rec.cvUrl = d.cvUrl;
      if (d.tot) rec.tot = true;
      rec.ack = true;
      if (Object.keys(d.extra).length) rec.extra = d.extra;
      if (!rec.noPhoto) delete rec.noPhoto;
      $('#wn', root).disabled = true; $('#wn', root).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإرسال';
      // لا يُعرض نجاح إلا بعد أن يؤكد الخادم الحفظ
      if (!await Store.setConfirmed(`applications/${id}`, rec)) {
        $('#wn', root).disabled = false; $('#wn', root).innerHTML = '<i class="fa-solid fa-paper-plane"></i> إعادة إرسال الطلب';
        toast('تعذّر إرسال الطلب ولم يُحفظ. بياناتك محفوظة في هذه الصفحة؛ أعد المحاولة أو تواصل مع الإدارة.', 'error');
        return;
      }
      await Store.setConfirmed(`appStatus/${id}`, { status: 'new', ts: Date.now() });
      Automation.notify('application', id); Analytics.event('join', { day: 'joins' });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      $('.wiz-main', root).innerHTML = `<div class="done-card">
        <div class="big"><i class="fa-solid fa-check"></i></div>
        <h2>استلمنا طلبك يا ${esc(String(d.name || '').replace(/^(د|م|أ)\.\s*/, '').split(' ')[0])}</h2>
        <p class="muted">احتفظ برقم الطلب لمتابعة حالته. سنراجع طلبك ونتواصل معك على الجوال والبريد.</p>
        <div class="ticket"><small class="muted">رقم الطلب</small><b class="num">${id}</b></div>
        <div class="row" style="justify-content:center"><button class="btn" id="cpy"><i class="fa-solid fa-copy"></i> نسخ الرقم</button><a class="btn primary" href="#/status?id=${id}">متابعة الطلب</a></div>
      </div>`;
      $('#cpy', root).onclick = () => copyText(id, 'تم نسخ رقم الطلب');
    };
    go(0);
    preview();
  }
};

/* ===================== متابعة حالة الطلب ===================== */
Pages.status = {
  static: true,
  render(params) {
    return `
    <section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / متابعة الطلب</div><h1>متابعة طلب التسجيل</h1><p>أدخل رقم الطلب الذي ظهر لك بعد الإرسال.</p></div></section>
    <div class="wrap" style="margin-top:-30px;position:relative;max-width:640px">
      <div class="panel">
        <form id="sf" class="row"><input class="code-in grow" name="id" placeholder="AXXXXXXX" value="${esc(params.get('id') || '')}" required style="flex:1"><button class="btn primary">عرض الحالة</button></form>
        <div id="so"></div>
      </div>
    </div>`;
  },
  mount(root, params) {
    const show = async id => {
      id = Security.normCode(id);
      if (!/^A[0-9A-Z]{7}$/.test(id)) { $('#so', root).innerHTML = '<p class="error-msg">رقم الطلب غير صحيح</p>'; return; }
      $('#so', root).innerHTML = '<p class="muted">جارٍ البحث...</p>';
      const st = await Store.readOnce(`appStatus/${id}`);
      if (!st) { $('#so', root).innerHTML = '<p class="error-msg">لم نجد طلباً بهذا الرقم</p>'; return; }
      const order = ['new', 'review', 'accepted', 'published'];
      const idx = st.status === 'interview' ? 1 : order.indexOf(st.status);
      const rej = st.status === 'rejected';
      const items = [
        ['fa-inbox', 'استلام الطلب', 'تم استلام طلبك بنجاح، وهو تحت الدراسة'],
        ['fa-magnifying-glass', 'المراجعة', st.status === 'interview' ? 'نحتاج استيضاحاً منك، سنتواصل معك' : 'يراجع الفريق بياناتك ومؤهلاتك'],
        ['fa-circle-check', 'القبول المبدئي والسداد', 'تم قبول طلبك مبدئياً — بانتظار تحويل رسوم الاشتراك وإرسال الإيصال'],
        ['fa-certificate', 'القبول النهائي', 'تم تأكيد التحويل وتفعيل حسابك وبطاقتك، وتصلك بيانات الدخول']
      ];
      $('#so', root).innerHTML = `<div class="timeline">${items.map((it, i) => {
        const cls = rej && i === 1 ? 'bad' : i < idx || (i === idx && st.status === 'published') ? 'done' : i === idx ? 'cur' : '';
        return `<div class="tl ${cls}"><i class="fa-solid ${rej && i === 1 ? 'fa-circle-xmark' : it[0]}"></i><div><b>${rej && i === 1 ? 'لم يُقبل الطلب' : it[1]}</b><small>${rej && i === 1 ? 'نشكر اهتمامك، ويمكنك التقديم مجدداً بعد استيفاء المتطلبات' : it[2]}</small></div></div>`;
      }).join('')}</div>
      ${st.note ? `<div class="banner info"><i class="fa-solid fa-message"></i>${nl2br(st.note)}</div>` : ''}
      ${st.trainerSlug ? `<a class="btn gold" href="#/t/${esc(st.trainerSlug)}"><i class="fa-solid fa-id-card"></i> عرض بطاقتي</a>` : ''}
      <p class="small muted">آخر تحديث: ${fmtTs(st.ts)}</p>`;
    };
    $('#sf', root).onsubmit = e => { e.preventDefault(); show(e.target.id.value); };
    if (params.get('id')) show(params.get('id'));
  }
};
