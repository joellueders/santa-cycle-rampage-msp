# Website modes and source

Default is the fresh-visitor landing mode. Rebel uses the same page structure, facts, media and FAQ, with a dark theme and editorial copy overrides. Use ?mode=rebel, ?mode=default, or rebel.html for direct links. The toggle remembers the choice and switches in place. Both history paths share story.html; Our Story links to #minneapolis. Older our-story.html URLs forward to that combined page. History defaults to cream unless a mode is explicitly supplied. Press stays cream.

Editable shared source and release instructions: tools/website/LAUNCH.md. Published styles and scripts: site-assets/. The MailerLite signup uses a direct CORS POST and inline response messages, without API credentials. Welcome-email automation is separate and has not been activated by this release.

Run production checks with node --test tests/site-mode.test.cjs.
