import { readFileSync } from 'node:fs';

const artwork = JSON.parse(readFileSync(new URL('./cutout-cast.json', import.meta.url), 'utf8'));
const inkFlow = '<span class="cast-flow rebel-only" aria-hidden="true"></span>';

function cutout(name, role) {
  const item = artwork.find(item => item.name === name);
  if (!item) throw new Error('Missing cutout artwork: ' + name);
  return `<figure class="site-cutout cast-${role} rebel-only" aria-hidden="true"><span class="cutout-print"><img src="assets/monster/${item.file}" width="${item.width}" height="${item.height}" alt="" loading="lazy" decoding="async" draggable="false"></span></figure>`;
}

// Decorative cast only. Shared text, links, controls and original footage stay
// in their original nodes; the regular theme hides every added piece of art.
export function applyCutoutCast(html) {
  if (html.includes('class="site-cutout ')) return html;
  html = html.replace('</defs></svg>', '<filter id="cutout-alpha" x="-3%" y="-3%" width="106%" height="106%"><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 0 1 1"/></feComponentTransfer></filter></defs></svg>');
  html = html.replace('</div><div class="manifesto-copy">', cutout('longhair-santa', 'pointer') + '</div><div class="manifesto-copy">');
  html = html.replace('<aside class="ride-smart" aria-labelledby="ride-smart-title">', '<aside class="ride-smart" aria-labelledby="ride-smart-title">' + cutout('stick-bike', 'doodle'));
  html = html.replace('<div class="gift-panel">', '<div class="gift-panel">' + cutout('crayon-wave', 'wave'));
  html = html.replace('<aside class="spectator-card">', '<aside class="spectator-card">' + cutout('dinner-invasion', 'dinner'));
  html = html.replace(/(<section class="content-section faq-section[^\"]*"[^>]*>)([\s\S]*?<\/h2>)/, '$1<div class="cast-faq-masthead">$2' + cutout('dinosaur-santa', 'questioner') + '</div>');
  html = html.replace(/(<section class="content-section vibe-section"[^>]*>)([\s\S]*?)(<div class="vibe-grid">)/, '$1<div class="cast-vibe-masthead"><div class="cast-vibe-copy">$2</div>' + cutout('vintage-friends', 'crew') + '</div>$3');
  let step = 0;
  html = html.replace(/(<li><span class="participation-number"[\s\S]*?)(<\/li>)/g, (all, content, end) => ++step === 4 ? content + inkFlow + cutout('many-eyed-santa', 'beer') + end : all);
  let path = 0;
  html = html.replace(/(<article class="history-path-panel">[\s\S]*?)(<\/a><\/article>)/g, (all, content, end) => ++path === 2 ? content + cutout('watercolor-rider', 'watercolor') + end : all);
  html = html.replace(/(<section class="content-section join-section"[^>]*>)([\s\S]*?)(<figure class="wide-film farewell-film">)/, '$1<div class="cast-join-masthead"><div class="cast-join-copy">$2</div>' + cutout('vintage-podium', 'bouquets') + '</div>$3');
  // One wash per surrounding layout, including one shared by both gift panels.
  // Never clip the wash to an individual illustration.
  for (const host of ['manifesto-section', 'ride-smart', 'gifts-section', 'cast-faq-masthead', 'cast-vibe-masthead', 'two-stories-band', 'cast-join-masthead']) {
    const opening = new RegExp('(<(?:section|div|aside) class="[^"]*\\b' + host + '\\b[^"]*"[^>]*>)');
    if (!opening.test(html)) throw new Error('Missing shared ink host: ' + host);
    html = html.replace(opening, '$1' + inkFlow);
  }
  return html;
}
