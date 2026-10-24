# One ride, two voices

The homepage is a single document. Default Mode is the first-visit default; Rebel Mode changes its palette, hero layout and selected editorial copy. Photos, videos, navigation, accessibility controls, schedule, calendar and event metadata remain shared. There is no alternate page or extra media bundle.

Default Mode means the regular website, not a Department of Santa treatment. Do not add bureaucratic assignment, personnel, forms or official-notice language to the default view. Department of Santa remains a separate social-media voice.

## Source and tone

Edit the homepage copy and root-scoped mode styles in `index.html`. `.default-copy` and `.rebel-copy` contain only alternative editorial wording, never separate logistical facts. Keep date/time, location, fees, calendar links, safety guidance and video behavior outside those alternatives. Keep images and media URLs identical between modes.

Rebel core line: **Fudge that. Get together. Spread cheer.**

Invitation: **Join the resistance.**

This invitation is a heading, not a dead-end or in-page jump button. The shared primary actions sit directly in the hero: **RSVP on Facebook** opens the actual event, and **Add to calendar** downloads the existing ICS. Do not duplicate these links in a second mode-specific event block.

Rebel hero hierarchy: headline → “Fudge that. Get together. Spread cheer.” subheading → “Minnesota’s jolliest brewery ride and toy drive.” → brief brewery/people invitation → date, meetup and free/no-registration facts → direct RSVP/calendar actions. Put the longer manifesto below the hero. Do not put the tagline above the “Fudge that” subheading.

We ride bicycles from brewery to brewery across Minneapolis, dressed like Santas. But the destination is the people we meet along the way.

The resistance is to fear, isolation, passive consumption and the scripts that keep us apart. Cheer, generosity and collective mischief are how we fight back. Not merely Minnesota reserve, generic edginess or confrontation with bystanders. Use silly euphemisms, not actual swearing. No imitation band lyrics or military imagery.

The costumes are not “questionable.” They lower the shields we put around our hearts, help strangers feel happy and open, and allow the wearer to reveal their true self. Keep the open-hearted goodness of children meeting each other. Don’t make the riders or their outfits the butt of the joke.

## Behavior and performance

- The native header button works with touch and keyboard, exposes its pressed state and announces a change.
- `santa-site-mode` stores only `default` or `rebel` in browser-local storage. A tiny guarded head script restores Rebel Mode before styles are painted. Blocked storage does not prevent switching for the current visit. An older `department` value is treated as the default view.
- Without JavaScript the default page and all ride information remain usable; the inactive mode control stays hidden.
- No added fonts, images, video sources, libraries, requests, page reloads or animations are needed for the switch. Existing reduced-motion video controls are unchanged.
- The visible build stamp under the title is `v1.1.1 / REAL ACTIONS`, marking the direct RSVP/calendar action correction.

Run `node --test tests/site-mode.test.cjs` for focused behavior and shared-content checks. Browser checks cover both directions, preference restoration, mobile navigation and narrow layouts. Keep deployment separate from local verification; do not describe a preview as the published site.
