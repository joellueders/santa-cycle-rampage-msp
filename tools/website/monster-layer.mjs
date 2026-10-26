import { asset, escape } from './shared.mjs';
import { applyCutoutCast } from './cutout-cast.mjs';

// The monster layer changes only the Rebel presentation. The shared page stays
// the source of all event facts, media nodes, content and default-mode markup.
export function applyMonsterLayer(html, content) {
  html = html.replace('</head>', `<link rel="preload" href="assets/monster/anton-regular.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="${asset('monster.css')}"><link rel="stylesheet" href="${asset('monster-match.css')}"><link rel="stylesheet" href="${asset('monster-vhs.css')}"><script type="module" src="${asset('monster-preview.js')}"></script></head>`);
  html = html.replace('<body data-home-page>', `<body data-home-page data-monster-preview><svg class="print-filter-definitions" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs><filter id="screenprint" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="alphaNoise"/><feComponentTransfer in="alphaNoise" result="flecks"><feFuncA type="linear" slope="8" intercept="-5.4"/></feComponentTransfer><feComposite in="SourceGraphic" in2="flecks" operator="out"/></filter><filter id="vhs-tracking" x="-5%" y="0" width="110%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0 .065" numOctaves="1" seed="9" result="tracking-noise"/><feColorMatrix in="tracking-noise" type="matrix" values="1 0 0 0 0 0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 1" result="horizontal-bands"/><feDisplacementMap in="SourceGraphic" in2="horizontal-bands" scale="32" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>`);
  // Internal tracking only. The label remains visually hidden by the Rebel layer.
  html = html.replace('</h1><p class="hero-response', '</h1><span class="monster-internal-version rebel-only" aria-hidden="true"><span>v1.9.0</span><span>LIGHTER LOAD</span></span><p class="hero-response');
  html = html.replace(/<figure class="hero-film">[\s\S]*?<\/figure>/, film => `<div class="monster-art rebel-only" data-monster-media data-takeover="video">${film}<img class="mockup-monster" src="assets/monster/hero-monster-user.png" width="1122" height="1402" alt="Santa monster holding the bicycle handlebars, with red and neon-yellow splashes" aria-hidden="true" fetchpriority="high" decoding="async"></div>`);
  // Reserve the regular theme's video footprint before the shared media moves.
  // Otherwise a direct ?mode=default visit pushes the date card down on load.
  html = html.replace('<aside class="date-card"', '<div class="default-hero-slot default-only" data-default-hero-slot></div><aside class="date-card"');

  const location = content.announcementStatus.startLocation;
  html = html.replace(/<div class="location-status">([\s\S]*?)<\/div>/, (markup, explanation) => markup + `<details class="compact-location rebel-only"><summary>Starting location: ${location.status === 'confirmed' ? escape(location.name) : 'TBA'}</summary><div class="compact-location-copy">${explanation}</div></details>`);

  const factPaths = [
    'M5 18c0-4 14-1 14-6 0-3-7-1-7-5 M12 7c-2-2-3-4-3-5a3 3 0 0 1 6 0c0 1-1 3-3 5Z M3 18h4',
    'M5 5h11v15H5z M16 7h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3 M8 2v3 M12 1v4',
    'M3 9h18v4H3z M5 13v9h14v-9 M12 9v13 M12 9C3 9 5-1 10 4l2 5Zm0 0c9 0 7-10 2-5l-2 5Z'
  ];
  let factIndex = 0;
  html = html.replace(/(<ul class="quick-facts"[^>]*>)([\s\S]*?)(<\/ul>)/, (all, start, items, end) => start + items.replace(/<li>(.*?)<\/li>/g, (item, label) => {
    const index = factIndex++;
    return index > 0 && index < 4 ? `<li><svg class="monster-fact-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${factPaths[index - 1]}"/></svg><span>${label}</span></li>` : item;
  }) + end);

  const split = content.copy.rebel.manifestoClosing.indexOf(': ');
  if (split > 0) {
    const closing = `<p class="manifesto-closing"><strong>${escape(content.copy.rebel.manifestoClosing)}</strong></p>`;
    html = html.replace(closing, `<p class="manifesto-closing"><span class="manifesto-preface">${escape(content.copy.rebel.manifestoClosing.slice(0, split + 1))}</span> <strong class="manifesto-rebellion">${escape(content.copy.rebel.manifestoClosing.slice(split + 2))}</strong></p>`);
  }

  // The collage is decorative adapted artwork, so it carries alternative text
  // but no redundant public provenance caption.
  const collage = '<figure class="chocolate-collage rebel-only"><img class="archive-cutout" width="1356" height="1160" src="assets/monster/chocolate-clean.png" alt="Chocolate-headed racing cyclists from the 2017 Santa Cycle Rampage poster" loading="lazy" decoding="async"></figure>';
  html = html.replace('<p class="eyebrow">The whole crew rolls together</p>', collage + '<p class="eyebrow">The whole crew rolls together</p>');
  html = html.replace('<footer class="page-footer">', '<footer class="page-footer"><a class="monster-footer-emblem rebel-only" href="#about" aria-label="Back to the top"><img src="assets/monster/hero-monster-user.png" width="1122" height="1402" alt="" loading="lazy" decoding="async"></a>');
  html = html.replace(/(<section class="content-section uprising-section[^\"]*"[^>]*>)([\s\S]*?<\/h2>)/, '$1<div class="uprising-masthead">$2</div>');
  html = html.replace('</head>', `<link rel="stylesheet" href="${asset('cutout-cast.css')}"></head>`);
  return applyCutoutCast(html);
}
