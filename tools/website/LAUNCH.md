# Website release

Shared editable content is event-data.json and faq-data.json.

Build and check source with Node:

    node tools/website/build.mjs
    node tools/website/verify.mjs
    node tools/website/verify-pass3.mjs
    node tools/website/verify-email.mjs
    node tools/website/verify-homepage.mjs
    node tools/website/verify-story.mjs

For publication, use a separate clean worktree at current origin/main, then run:

    node tools/website/prepare-release.mjs /absolute/path/to/release-worktree

Stage only files listed by the release manifest. Do not publish local QA outputs. Preserve current media, CNAME, analytics, and the existing calendar. No API credentials are used. A user reported the local MailerLite signup worked; the welcome automation is separate and was not activated by this release.

Rollback baseline: 09246be9ffc274edc1e74fd3f3962b9577ce17e5. Reverting the release commit restores the earlier website.

Rebel for Joy (v1.5.7): mode-specific body copy is stored in `copy.rebel.body` in event-data.json. Both homepage entries share the same layout, facts, five step titles, safety guidance, and media. The existing Default wording is retained. Mode-specific prose covers the five steps, toy drive, spectator invitation, vibe, history bridge, and three welcome FAQ answers. The mode switch preserves open disclosures and media.
