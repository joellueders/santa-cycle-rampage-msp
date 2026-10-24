const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const rootPath = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(rootPath, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)];
const bootstrap = scripts.find(match => match[1].includes('localStorage.getItem'))[1];
const toggleScript = scripts.find(match => match[1].includes('const applyMode='))[1].split('const menuButton=')[0];

function fixture(saved, blocked = false) {
  const storage = new Map(saved ? [['santa-site-mode', saved]] : []);
  const listeners = {};
  const label = { textContent: '' };
  const toggle = {
    hidden: true,
    attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    querySelector(selector) { assert.equal(selector, '.mode-label'); return label; },
    addEventListener(event, callback) { listeners[event] = callback; }
  };
  const status = { textContent: '' };
  const meta = { content: '#f3efe4' };
  const root = { dataset: {} };
  const context = {
    localStorage: {
      getItem(key) { if (blocked) throw Error('Storage unavailable'); return storage.get(key); },
      setItem(key, value) { if (blocked) throw Error('Storage unavailable'); storage.set(key, value); }
    },
    document: {
      documentElement: root,
      querySelector(selector) {
        if (selector === '.mode-toggle') return toggle;
        if (selector === '.mode-status') return status;
        if (selector === 'meta[name="theme-color"]') return meta;
        throw Error('Unexpected DOM access: ' + selector);
      }
    }
  };
  vm.runInNewContext(bootstrap, context);
  const prepaintMode = root.dataset.siteMode;
  vm.runInNewContext(toggleScript, context);
  return { root, toggle, label, status, meta, storage, prepaintMode, click: () => listeners.click() };
}

test('first visit defaults to Default Mode and switching works both ways', () => {
  const page = fixture();
  assert.equal(page.prepaintMode, undefined);
  assert.equal(page.root.dataset.siteMode, undefined);
  assert.equal(page.toggle.hidden, false);
  assert.equal(page.toggle.attributes['aria-pressed'], 'false');
  page.click();
  assert.equal(page.root.dataset.siteMode, 'rebel');
  assert.equal(page.toggle.attributes['aria-pressed'], 'true');
  assert.equal(page.storage.get('santa-site-mode'), 'rebel');
  assert.equal(page.meta.content, '#171613');
  assert.match(page.status.textContent, /Rebel Mode active/);
  page.click();
  assert.equal(page.root.dataset.siteMode, undefined);
  assert.equal(page.storage.get('santa-site-mode'), 'default');
  assert.equal(page.meta.content, '#f3efe4');
});

test('saved Rebel preference is applied before styles and survives initialization', () => {
  const page = fixture('rebel');
  assert.equal(page.prepaintMode, 'rebel');
  assert.equal(page.root.dataset.siteMode, 'rebel');
  assert.equal(page.toggle.attributes['aria-pressed'], 'true');
});

test('blocked storage and an unknown saved value do not break the page', () => {
  for (const page of [fixture('rebel', true), fixture('unknown')]) {
    assert.equal(page.root.dataset.siteMode, undefined);
    page.click();
    assert.equal(page.root.dataset.siteMode, 'rebel');
    page.click();
    assert.equal(page.root.dataset.siteMode, undefined);
  }
});

test('event details, calendar and media remain single shared elements', () => {
  assert.equal((html.match(/id="when-where"/g) || []).length, 1);
  assert.equal((html.match(/id="hero-photo"/g) || []).length, 1);
  assert.equal((html.match(/href="santa-cycle-rampage-2026\.ics"/g) || []).length, 1);
  const event = JSON.parse(scripts.find(match => match[0].includes('application/ld+json'))[1]);
  assert.equal(event.startDate, '2026-12-05T10:00:00-06:00');
  assert.equal(event.location.name, 'New starting location to be announced');
  assert.equal(event.isAccessibleForFree, true);
  assert.match(html, /Fudge that\. Get together\. Spread cheer\./);
  assert.match(html, /Join the resistance/);
  assert.doesNotMatch(html, /<a[^>]*>Join the resistance/);
  assert.match(html, /id="join-resistance-title">Join the resistance\.<\/h2>/);
  const heroIntro = html.split('<div class="hero-layout"><div class="hero-intro">')[1].split('<div class="hero-photo"')[0];
  assert.match(heroIntro, /class="event-actions"/);
  assert.match(heroIntro, /https:\/\/www\.facebook\.com\/events\/1972798296683555\//);
  assert.match(heroIntro, /href="santa-cycle-rampage-2026\.ics" download/);
  assert.match(html, /brewery to brewery across Minneapolis/);
  assert.match(html, /the destination is the people we meet along the way/);
  assert.match(html, /lower the shields we put around our hearts/);
  assert.ok(heroIntro.indexOf('class="hero-rebel-kicker') < heroIntro.indexOf('<h1'));
  assert.ok(heroIntro.indexOf('class="hero-tagline') < heroIntro.indexOf('class="rebel-response'));
  assert.ok(heroIntro.indexOf('class="rebel-response') < heroIntro.indexOf('class="event-actions'));
  assert.ok(heroIntro.indexOf('class="event-actions') < heroIntro.indexOf('class="hero-free-note'));
  assert.match(html, /data-rebel-intro="cheer"/);
  assert.match(html, /Rebel Mode: ON/);
  assert.match(html, /Switch to default/);
  const joinCopy = html.split('<section class="join-resistance')[1].split('</section>')[0];
  assert.doesNotMatch(joinCopy, /—/);
  assert.match(joinCopy, /hearts, and helps strangers lower theirs/);
  assert.equal((html.match(/class="starting-spot rebel-copy"/g) || []).length, 1);
  assert.doesNotMatch(html, /The ride is still happening/);
  assert.doesNotMatch(html, /@import|fonts\.googleapis|fonts\.gstatic/);
});

test('every inline script has valid JavaScript or JSON syntax', () => {
  for (const script of scripts) {
    if (script[0].includes('application/ld+json')) JSON.parse(script[1]);
    else new vm.Script(script[1]);
  }
});

test('Rebel body and primary action colors exceed 4.5:1 contrast', () => {
  function luminance(hex) {
    const linear = hex.match(/[a-f0-9]{2}/gi).map(value => {
      const channel = parseInt(value, 16) / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  }
  function contrast(a, b) {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + .05) / (values[1] + .05);
  }
  assert.ok(contrast('ebe4d6', '171613') >= 4.5);
  assert.ok(contrast('fff3e3', 'b52b24') >= 4.5);
  assert.match(html, /--muted:#ebe4d6/);
  assert.match(html, /background:#b52b24/);
});
