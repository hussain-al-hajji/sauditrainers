/* «نماذج من جلساتي»: فيديوهات يضيفها المدرب (حتى 6) من أي مصدر، تظهر في صفحته العامة بواجهة الفيديو نفسه ويُشغَّل داخل الصفحة.
 * التخزين: trainers/<id>/videos = [{ u: رابط https، t: عنوان، i: صورة معاينة اختيارية }].
 * يُعرف المصدر من الرابط: يوتيوب، فيميو، تيك توك، إنستقرام (ريلز)، فيسبوك، إكس، لوم، ديلي موشن، ملف فيديو مباشر، ومعاينة قوقل درايف.
 * أي مصدر آخر يظهر ببطاقة معاينة برابط يفتح في تبويب جديد. لا تُحمَّل أي مشغّلات إلا عند ضغط زر التشغيل (أداء الصفحة). */
const Videos = (() => {
  const MAX = 6;
  const PROV = { yt: ['يوتيوب', 'fa-youtube', 'brands'], vimeo: ['فيميو', 'fa-vimeo-v', 'brands'], tt: ['تيك توك', 'fa-tiktok', 'brands'], ig: ['إنستقرام', 'fa-instagram', 'brands'], fb: ['فيسبوك', 'fa-facebook', 'brands'], x: ['إكس', 'fa-x-twitter', 'brands'], loom: ['لوم', 'fa-video', 'solid'], dm: ['ديلي موشن', 'fa-video', 'solid'], drive: ['قوقل درايف', 'fa-google-drive', 'brands'], file: ['فيديو', 'fa-film', 'solid'], link: ['رابط', 'fa-link', 'solid'] };
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').replace(/^m\./, ''); } catch { return ''; } };
  function parse(u) {
    u = String(u || '').trim(); let url; try { url = new URL(u); } catch { return { kind: 'link', url: u }; }
    if (url.protocol !== 'https:') return { kind: 'link', url: u };
    const h = url.hostname.replace(/^www\./, '').replace(/^m\./, ''), p = url.pathname, q = url.searchParams, m = re => p.match(re);
    let id;
    if (h === 'youtu.be' && (id = m(/^\/([\w-]{11})/))) return yt(id[1], u);
    if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) { id = q.get('v') || (m(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/) || [])[1]; if (id && /^[\w-]{11}$/.test(id)) return yt(id, u); }
    if (/(^|\.)vimeo\.com$/.test(h) && (id = m(/\/(\d{5,})/))) return { kind: 'vimeo', url: u, embed: `https://player.vimeo.com/video/${id[1]}?autoplay=1` };
    if (h === 'drive.google.com' && (id = m(/\/file\/d\/([\w-]+)/))) return { kind: 'drive', url: u, embed: `https://drive.google.com/file/d/${id[1]}/preview` };
    if (h === 'loom.com' && (id = m(/\/(?:share|embed)\/([\w]+)/))) return { kind: 'loom', url: u, embed: `https://www.loom.com/embed/${id[1]}?autoplay=1` };
    if (/(^|\.)tiktok\.com$/.test(h) && (id = m(/\/video\/(\d+)/))) return { kind: 'tt', url: u, embed: `https://www.tiktok.com/embed/v2/${id[1]}`, tall: true };
    if (h === 'instagram.com' && (id = m(/\/(reel|reels|p|tv)\/([\w-]+)/))) return { kind: 'ig', url: u, embed: `https://www.instagram.com/${id[1] === 'reels' ? 'reel' : id[1]}/${id[2]}/embed`, tall: true };
    if ((/(^|\.)facebook\.com$/.test(h) && /\/(videos|reel|watch)/.test(p + url.search)) || h === 'fb.watch') return { kind: 'fb', url: u, embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&autoplay=1` };
    if ((h === 'x.com' || h === 'twitter.com') && (id = m(/\/status\/(\d+)/))) return { kind: 'x', url: u, embed: `https://platform.twitter.com/embed/Tweet.html?id=${id[1]}&dnt=true`, tall: true };
    if (/(^|\.)dailymotion\.com$/.test(h) && (id = m(/\/video\/([\w]+)/))) return { kind: 'dm', url: u, embed: `https://www.dailymotion.com/embed/video/${id[1]}?autoplay=1` };
    if (/\.(mp4|webm|ogv|ogg|m4v|mov)$/i.test(p)) return { kind: 'file', url: u, file: u };
    return { kind: 'link', url: u };
  }
  const yt = (id, u) => ({ kind: 'yt', url: u, embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
  const list = t => (Array.isArray(t?.videos) ? t.videos : Object.values(t?.videos || {})).filter(v => v && /^https:\/\//.test(v.u || ''));

  // بطاقة فيديو: صورة/غلاف + زر تشغيل؛ عند الضغط يُحمَّل المشغّل داخل البطاقة نفسها
  function card(v) {
    const i = parse(v.u), pv = PROV[i.kind], thumb = i.thumb || v.i || '', playable = !!(i.embed || i.file);
    const cover = `<div class="vd-cover ${thumb ? 'has' : ''}" ${thumb ? `style="background-image:url('${esc(thumb)}')"` : ''}><span class="vd-prov"><i class="fa-${pv[2]} ${pv[1]}"></i> ${pv[0]}</span>${playable ? '<button type="button" class="vd-play" aria-label="تشغيل الفيديو"><i class="fa-solid fa-play"></i></button>' : `<a class="vd-ext" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> مشاهدة على ${esc(host(i.url))}</a>`}</div>`;
    return `<figure class="vd ${i.tall ? 'tall' : ''}" data-vk="${esc(i.kind)}" data-e="${esc(i.embed || '')}" data-f="${esc(i.file || '')}">${cover}<figcaption>${esc(v.t || host(v.u))}</figcaption></figure>`;
  }
  // تشغيل داخل الصفحة (يُستدعى من زر التشغيل)
  function play(btn) {
    const f = btn.closest('.vd'); if (!f) return;
    const cov = f.querySelector('.vd-cover'), e = f.dataset.e, file = f.dataset.f;
    if (file) cov.innerHTML = `<video controls autoplay playsinline preload="metadata" src="${esc(file)}"></video>`;
    else if (e) cov.innerHTML = `<iframe src="${esc(e)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy" title="${esc(f.querySelector('figcaption')?.textContent || 'فيديو')}"></iframe>`;
    cov.classList.add('on'); cov.style.backgroundImage = '';
  }
  document.addEventListener('click', e => { const b = e.target.closest?.('.vd-play'); if (b) { e.preventDefault(); play(b); } });

  // قسم الصفحة العامة
  function box(t) {
    const vs = list(t); if (!vs.length) return '';
    return `<div class="pbox reveal"><h3><i class="fa-solid fa-circle-play"></i>نماذج من جلساتي التدريبية <small class="muted num">(${vs.length})</small></h3><div class="vd-grid">${vs.map(card).join('')}</div></div>`;
  }

  // عنوان تلقائي: يوتيوب عبر oEmbed، وغيره عبر معاينة الرابط (إن توفّرت)
  async function autoMeta(u) {
    const i = parse(u), out = { t: '', i: '' };
    try {
      if (i.kind === 'yt') { const c = new AbortController(), to = setTimeout(() => c.abort(), 6000); const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json`, { signal: c.signal }); clearTimeout(to); const j = await r.json(); out.t = String(j.title || '').slice(0, 100); }
      else if (window.News?.fetchPreview) { const p = await News.fetchPreview(u.slice(0, 500)); out.t = String(p.title || '').slice(0, 100); if (!i.embed && /^https:\/\//.test(p.img || '') && p.img.length <= 400) out.i = p.img; }
    } catch { /* نكتفي بدون عنوان */ }
    return out;
  }

  /* ---------- تبويب «نماذج الفيديو» في لوحة المدرب ---------- */
  function tab(main, t) {
    const vs = list(t);
    main.innerHTML = `<div class="dash-h"><h2>نماذج الفيديو</h2><span class="muted small">${vs.length} من ${MAX}</span></div>
      <p class="muted small">أضف روابط مقاطع من جلساتك التدريبية؛ تظهر في صفحتك العامة بواجهة الفيديو نفسه ويستطيع الزائر تشغيلها دون مغادرة الصفحة. يدعم: يوتيوب، فيميو، تيك توك، إنستقرام (ريلز)، فيسبوك، إكس، لوم، ديلي موشن، قوقل درايف (ملف مشارك للجميع)، وروابط ملفات mp4 المباشرة. أي مصدر آخر يظهر ببطاقة تفتحه في تبويب جديد.</p>
      <div class="pbox"><h3><i class="fa-solid fa-plus"></i> إضافة فيديو</h3>
        <form id="vf" style="display:grid;gap:10px">${field('رابط الفيديو', `<input name="u" type="url" dir="ltr" required placeholder="https://…" ${vs.length >= MAX ? 'disabled' : ''}>`)}${field('عنوان (اختياري، يُجلب تلقائياً إن تُرك فارغاً)', '<input name="t" maxlength="100" placeholder="مثال: ورشة القيادة الفعّالة — الرياض">')}
          <div class="row end"><button class="btn primary" type="submit" ${vs.length >= MAX ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> إضافة</button></div></form>
        ${vs.length >= MAX ? `<p class="small muted">وصلت للحد الأقصى (${MAX}). احذف مقطعاً لإضافة آخر.</p>` : ''}</div>
      ${vs.length ? `<div class="vd-grid">${vs.map((v, i) => `<div class="vd-wrap">${card(v)}<div class="row" style="gap:6px;margin-top:6px">${i > 0 ? `<button class="btn sm ghost" data-up="${i}" title="تقديم"><i class="fa-solid fa-arrow-up"></i></button>` : ''}<button class="btn sm ghost" data-ed="${i}"><i class="fa-solid fa-pen"></i> العنوان</button><button class="btn sm danger" data-rm="${i}"><i class="fa-solid fa-trash"></i></button></div></div>`).join('')}</div>` : '<div class="empty"><i class="fa-solid fa-circle-play"></i><h3>لا توجد فيديوهات بعد</h3><p>الصق رابط مقطع من جلسة قدّمتها وستراه في صفحتك فوراً.</p></div>'}`;
    const save = arr => Store.update(`trainers/${t.id}`, { videos: arr.length ? arr : null, updatedAt: Date.now() });
    $('#vf', main).onsubmit = async e => {
      e.preventDefault(); const f = e.target, u = f.u.value.trim(), btn = $('button[type=submit]', f);
      if (!/^https:\/\/[^\s"'<>]+$/i.test(u) || u.length > 400) return toast('أدخل رابطاً صحيحاً يبدأ بـ https://', 'err');
      if (vs.some(v => v.u === u)) return toast('هذا الرابط مضاف مسبقاً', 'err');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الإضافة';
      const rec = { u, t: f.t.value.trim().slice(0, 100) }; const meta = await autoMeta(u);
      if (!rec.t) rec.t = meta.t || ''; if (meta.i) rec.i = meta.i; if (!rec.t) delete rec.t;
      save([...vs.map(v => ({ ...v })), rec]); toast('أُضيف الفيديو إلى صفحتك');
    };
    $$('[data-rm]', main).forEach(b => b.onclick = async () => { if (await confirmBox('حذف هذا الفيديو من صفحتك؟', { ok: 'حذف', danger: true })) save(vs.filter((_, i) => i !== +b.dataset.rm)); });
    $$('[data-up]', main).forEach(b => b.onclick = () => { const i = +b.dataset.up, a = vs.map(v => ({ ...v })); [a[i - 1], a[i]] = [a[i], a[i - 1]]; save(a); });
    $$('[data-ed]', main).forEach(b => b.onclick = () => {
      const i = +b.dataset.ed, m = modal(`<h3><i class="fa-solid fa-pen"></i> عنوان الفيديو</h3><form id="vt" style="display:grid;gap:10px">${field('العنوان', `<input name="t" maxlength="100" value="${esc(vs[i].t || '')}">`)}<div class="row end"><button type="button" class="btn ghost" data-close>إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></form>`);
      $('#vt', m.el).onsubmit = e => { e.preventDefault(); const a = vs.map(v => ({ ...v })); const t2 = e.target.t.value.trim(); if (t2) a[i].t = t2; else delete a[i].t; save(a); m.close(); };
    });
  }
  return { parse, box, tab, list, play, MAX };
})();
