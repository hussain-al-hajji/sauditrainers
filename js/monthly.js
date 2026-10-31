/* صفحة «النشرة الشهرية» العامة: محتوى التقرير الشهري (PDF) نفسه بشكل صفحة ويب، مع زر تحميل النشرة PDF.
 * تقرأ لقطة نشرها المشرف من «المراسلة ← التقرير الشهري ← نشر في صفحة النشرة» المحفوظة في content/monthly/<شهر>. */
const Monthly = (() => {
  const snaps = () => Object.values(Store.get('content/monthly') || {}).filter(s => s && s.ym).sort((a, b) => (a.ym < b.ym ? 1 : -1));
  const toData = s => ({ ym: s.ym, mname: s.mname, stats: arr(s.stats), titles: arr(s.titles), news: arr(s.newsIds).map(id => Store.get(`news/${id}`)).filter(Boolean) });
  // لقطة للنشر: تُحفظ الأرقام والعناوين ومعرّفات الأخبار (نصوص الأخبار تُقرأ من مسار الأخبار العام)
  const snapshot = d => JSON.parse(JSON.stringify({ ym: d.ym, mname: d.mname, ts: Date.now(), stats: d.stats, titles: d.titles.slice(0, 300), newsIds: d.news.map(n => n.id).filter(Boolean).slice(0, 200) }));

  const Page = {
    render() {
      const q = new URLSearchParams(location.hash.split('?')[1] || '').get('m') || '', list = snaps(), s = list.find(x => x.ym === q) || list[0];
      const head = `<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">الرئيسية</a> / النشرة الشهرية</div><h1>النشرة الشهرية</h1><p>حصاد المنصة كل شهر: أرقام وفرص تدريب مطلوبة وأخبار المدربين.</p></div></section>`;
      if (!s) return `${head}<div class="wrap" style="margin-top:30px"><div class="empty"><i class="fa-solid fa-newspaper"></i><h3>لم تُنشر نشرة بعد</h3><p>تظهر هنا النشرة الشهرية فور نشرها.</p></div></div>`;
      const d = toData(s), cards = ['profile', 'opps', 'exclusive'].map(id => Pitch.byId(id)).filter(Boolean);
      const groups = new Map(); d.news.sort((a, b) => (b.ts || 0) - (a.ts || 0)).forEach(n => { if (!groups.has(n.trainerId)) groups.set(n.trainerId, []); groups.get(n.trainerId).push(n); });
      return `${head}<div class="wrap mo-wrap">
        <div class="mo-bar"><div class="chips">${list.map(x => `<a class="chip ${x.ym === s.ym ? 'on' : ''}" href="#/monthly?m=${x.ym}">${esc(x.mname)}</a>`).join('')}</div>
          <button class="btn primary" id="mo-pdf"><i class="fa-solid fa-file-pdf"></i> تحميل النشرة PDF</button></div>
        <h2 class="mo-h"><i class="fa-solid fa-chart-simple"></i> أرقام المنصة في شهر ${esc(s.mname)}</h2>
        <div class="mo-stats">${d.stats.map(x => `<div class="mo-stat"><b class="num">${esc(x.num)}</b><span>${esc(x.label)}</span>${x.note ? `<small>${esc(x.note)}</small>` : ''}</div>`).join('')}</div>
        ${d.titles.length ? `<h2 class="mo-h"><i class="fa-solid fa-table-cells-large"></i> موضوعات طلبتها الجهات (${d.titles.length})</h2>
          <div class="mo-topics">${d.titles.map(t => `<div class="mo-t"><b>${esc(t.c)}</b><small>${esc(t.org || 'جهة تدريبية')}${t.city ? ' · ' + esc(t.city) : ''}${t.spec && specOf(t.spec) ? ' · ' + esc(specName(t.spec)) : ''}</small>${t.n > 1 ? `<span class="pill gold">${t.n} فرصة</span>` : ''}</div>`).join('')}</div>` : ''}
        <h2 class="mo-h"><i class="fa-solid fa-newspaper"></i> أخبار المدربين في ${esc(s.mname)}</h2>
        ${groups.size ? [...groups.entries()].map(([id, items]) => { const t = Store.get(`trainers/${id}`); return t ? `<div class="mo-grp"><a class="mo-tr" href="#/t/${esc(encodeURIComponent(t.slug || t.id))}">${Card.avatar(t, 'av')}<b>${esc(withTitle ? withTitle(t.name) : t.name)}</b></a><div class="ngrid">${items.map(n => News.card(n)).join('')}</div></div>` : ''; }).join('') : '<p class="muted">لم تُنشر أخبار خلال هذا الشهر.</p>'}
        ${cards.length ? `<h2 class="mo-h"><i class="fa-solid fa-gem"></i> من مزايا المنصة</h2><div class="cards3">${cards.map(c => `<div class="icard"><div class="ic"><i class="fa-solid ${esc(c.ic || 'fa-star')}"></i></div><h3>${esc(c.t)}</h3>${Pitch.tag(c)}<p>${esc(c.d || c.sd || '')}</p></div>`).join('')}</div>` : ''}
        <div class="cta-band reveal" style="margin-top:36px"><div><h2>انضم إلى منصة مدرّبون سعوديّون</h2><p>${esc(Pitch.feeText ? Pitch.feeText((Data.content().join || {}).fee || 720) : '')}</p></div><div class="row"><a class="btn gold lg" href="#/join">سجّل كمدرب سعودي</a><a class="btn glass lg" href="#/trainers">تصفّح المدربين</a></div></div>
      </div>`;
    },
    mount(root) {
      const b = $('#mo-pdf', root); if (!b) return;
      const s = (() => { const q = new URLSearchParams(location.hash.split('?')[1] || '').get('m') || '', l = snaps(); return l.find(x => x.ym === q) || l[0]; })();
      b.onclick = async () => { const h = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التجهيز'; try { await Bulletin.reportPdf(toData(s)); } finally { b.disabled = false; b.innerHTML = h; } };
    }
  };
  return { snaps, snapshot, toData, Page };
})();
Pages.monthly = Monthly.Page;
