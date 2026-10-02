/* نقش أدوات القرطاسية والتدريب: رسومات خطية تُستخدم خلفيةً للأقسام والبطاقات وصور المشاركة */

const Pattern = (() => {
  // رسومات بمقاس 24×24 بخط واحد (قلم، دفتر، مسطرة، مصباح، سبورة، قبعة تخرج، شهادة، كتاب، حاسوب، حافظة، حوار، مؤقت، هدف، قلم حبر، مكبر صوت، رسم بياني)
  const ICONS = {
    pencil: '<path d="M4 20l1.2-4.2L16.5 4.5a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8.2 18.8z"/><path d="M14.5 6.5l3 3"/>',
    notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h4M12.5 12h4"/>',
    ruler: '<path d="M3.5 16.5L16.5 3.5l4 4-13 13z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.8.7 1.3 1.5 1.3 2.4h5c0-.9.5-1.7 1.3-2.4A6 6 0 0 0 12 3z"/>',
    board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v2M8 21l4-3 4 3M7 12l3-3 3 2 4-4"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5M22 9v6"/>',
    cert: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M7 8.5h10M7 11.5h5"/><circle cx="16" cy="13.5" r="2"/><path d="M15 15.3L14.2 20l1.8-1 1.8 1-.8-4.7"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5V5.5M19 18v3H6.5M8 7h7"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/>',
    clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 2.5h6v3H9zM9 11h6M9 15h4"/>',
    chat: '<path d="M4 5h16v11h-9l-4 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    pen: '<path d="M12 3l5 7-5 11-5-11z"/><circle cx="12" cy="10.5" r="1"/><path d="M12 11.5V15"/>',
    mega: '<path d="M3 10v4h3l8 4V6L6 10z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M2 20h20"/>'
  };
  // ترتيب ثابت يضمن ألا تتجاور رسمتان متشابهتان، مع ميلان مختلف لكل رسمة
  const LAYOUT = ['pencil', 'board', 'book', 'target', 'cap', 'chat', 'ruler', 'laptop', 'bulb', 'cert', 'timer', 'notebook', 'mega', 'clip', 'chart', 'pen'];
  const ROT = [-14, 8, -6, 12, 6, -10, 14, -4, 10, -12, 4, -8, -16, 9, -5, 12];
  const TILE = 420, STEP = 105, SCALE = 1.7;
  const cache = new Map();

  function svg(color = '#EEF3E5', opacity = 0.1) {
    const icons = LAYOUT.map((k, i) => {
      const cx = 52 + (i % 4) * STEP, cy = 52 + Math.floor(i / 4) * STEP;
      return `<g transform="translate(${cx} ${cy}) rotate(${ROT[i]}) scale(${SCALE}) translate(-12 -12)">${ICONS[k]}</g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}"><g fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${icons}</g></svg>`;
  }
  // رابط data: صالح داخل url('...') في CSS وفي سمة style
  function url(color, opacity) {
    const k = `${color}|${opacity}`;
    if (!cache.has(k)) cache.set(k, `data:image/svg+xml,${encodeURIComponent(svg(color, opacity)).replace(/'/g, '%27')}`);
    return cache.get(k);
  }
  const css = (color, opacity) => `url('${url(color, opacity)}')`;

  // متغيرات CSS العامة: نقش فاتح للخلفيات الداكنة، وداكن للخلفيات الفاتحة
  const root = document.documentElement.style;
  root.setProperty('--pat-dark', css('#EEF3E5', 0.1));
  root.setProperty('--pat-light', css('#005430', 0.075));

  return { svg, url, css, ICONS, TILE };
})();
