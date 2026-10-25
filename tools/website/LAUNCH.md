# Website release

Shared editable content is event-data.json and faq-data.json.

Build and check source with Node:

    node tools/website/build.mjs
    node tools/website/verify.mjs
    node tools/website/verify-pass3.mjs
    node tools/website/verify-email.mjs

For publication, use a separate clean worktree at current origin/main, then run:

    node tools/website/prepare-release.mjs /absolute/path/to/release-worktree

Stage only files listed by the release manifest. Do not publish local QA outputs. Preserve current media, CNAME, analytics, and the existing calendar. No API credentials are used. A user reported the local MailerLite signup worked; the welcome automation is separate and was not activated by this release.

Rollback baseline: 7c0631d39caafab87b620e3e54904f7887505497. Reverting the release commit restores the earlier website.
