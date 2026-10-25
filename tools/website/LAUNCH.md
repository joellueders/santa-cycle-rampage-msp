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

Rollback baseline: 4e2cc288f67f1f3da797bfae61dce8cd58d01e2b. Reverting the release commit restores the earlier website.
