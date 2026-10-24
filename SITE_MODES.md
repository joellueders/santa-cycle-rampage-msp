# One ride, two voices

The homepage is a single document. Default Mode is the first-visit default; Rebel Mode changes its palette, hero layout and selected editorial copy. Photos, videos, navigation, accessibility controls, schedule, calendar and event metadata remain shared. There is no alternate page or extra media bundle.

Default Mode means the regular website, not a Department of Santa treatment. Do not add bureaucratic assignment, personnel, forms or official-notice language to the default view. Department of Santa remains a separate social-media voice.

## Source and tone

Edit the homepage copy and root-scoped mode styles in `index.html`. Both views must agree on event logistics. The full date, calendar link, structured event metadata, safety guidance and video behavior remain shared. Mode-specific meetup/location labels may differ in wording, not in facts; update both views together when a venue is confirmed. Keep images and media URLs identical between modes.

Rebel core line: **Fudge that. Get together. Spread cheer.**

Invitation: **Join the resistance.**

This invitation is a heading, not a dead-end or in-page jump button. The shared primary actions sit directly in the hero: **RSVP on Facebook** opens the actual event, and **Add to calendar** downloads the existing ICS. Do not duplicate these links in a second mode-specific event block.

Rebel hero hierarchy, per the October 24 attached brief: event kicker → headline → prominent “Minnesota's jolliest brewery ride and toy drive.” → “Fudge that. Get together. Spread cheer.” → direct RSVP/calendar actions → free-ride note. The single right-hand column contains the existing photo, then the date card with a 32px margin, and the editable dashed location notice. Do not repeat date/location in the Rebel intro. The default view retains its existing text, spacing, controls and build label.

The two-column “Join the resistance.” section follows the opening hero layout, before the existing video. It carries the brewery/people invitation, the manifesto and the costume paragraph. Use a comma in “hearts, and helps strangers lower theirs,” not an em dash. Set the hero's `data-rebel-intro` from `cheer` to `people` to feature the longer invitation first and move the Fudge line to the Join section. No other source edits or new assets are needed for that editorial option.

We ride bicycles from brewery to brewery across Minneapolis, dressed like Santas. But the destination is the people we meet along the way.

The resistance is to fear, isolation, passive consumption and the scripts that keep us apart. Cheer, generosity and collective mischief are how we fight back. Not merely Minnesota reserve, generic edginess or confrontation with bystanders. Use silly euphemisms, not actual swearing. No imitation band lyrics or military imagery.

The costumes are not “questionable.” They lower the shields we put around our hearts, help strangers feel happy and open, and allow the wearer to reveal their true self. Keep the open-hearted goodness of children meeting each other. Don’t make the riders or their outfits the butt of the joke.

## Behavior and performance

- The native header button works with touch and keyboard, exposes its pressed state and announces a change.
- `santa-site-mode` stores only `default` or `rebel` in browser-local storage. A tiny guarded head script restores Rebel Mode before styles are painted. Blocked storage does not prevent switching for the current visit. An older `department` value is treated as the default view.
- Without JavaScript the default page and all ride information remain usable; the inactive mode control stays hidden.
- No added fonts, images, video sources, libraries, requests, page reloads or animations are needed for the switch. Existing reduced-motion video controls are unchanged.
- Rebel Mode's build stamp is `v1.1.2 / REBEL CLARITY` in the footer, not the hero. The default view's existing `v1.1.1 / REAL ACTIONS` label remains unchanged.

Run `node --test tests/site-mode.test.cjs` for focused behavior and shared-content checks. Browser checks cover both directions, preference restoration, mobile navigation and narrow layouts. Keep deployment separate from local verification; do not describe a preview as the published site.

This is a buildless static site. No package manifest, build command or lint configuration exists; do not install a framework or linter for a copy/layout pass. Run the existing Node tests, inline syntax checks and `git diff --check`. In the browser, check 1440×900 fold visibility and phone reading order. The October 24 default-view regression comparison matched all 23 sampled element bounds, fonts, colors, margins and padding against the pre-edit baseline at 1440×900.
