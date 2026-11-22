# Current website workflow

The public `index.html`, `rebel.html`, and `press.html` contain edits outside the older shared generator. Edit those pages directly. Keep the schedule consistent across both homepage entry points, the press page, and the calendar download.

Run all current checks, without generating or overwriting pages:

    node tools/website/check.mjs

This checks the current public pages, local dependencies, navigation anchors, calendar formatting, retained Rebel design, media behavior and mocked email signup. It does not submit email addresses or verify external services.

Preview from the project root:

    node tools/website/preview.mjs

Open http://127.0.0.1:8786/.

## Before brewery stops are announced

For the current release layout, prepare a pending version in a new directory:

    node tools/website/prepare-pending-schedule.mjs work/pending-schedule

Use those four files together in the pending release checkout. The two
homepages keep the confirmed meetup and signup. The press page and calendar
also omit the unannounced stops and times. The command reads the current
published files and leaves them in place. The pending version assumes the
meetup itself is already confirmed. Release the published versions together
when the stops are ready to announce.

# Older redesign tooling

`event-data.json`, `faq-data.json`, `build.mjs`, `prepare-release.mjs` and the other `verify*.mjs` scripts belong to the earlier shared redesign. Those verification scripts include superseded copy/layout expectations and expect generated preview files beside the source. They are not the current-site validation command. `verify-email.mjs` remains part of the current checks.

Do not use `prepare-release.mjs` to publish the recovered site: it generates replacement pages and would discard newer direct edits. `build.mjs` generates preview HTML under `tools/website/`, not the root public pages. Any future return to generated releases must first reconcile the recovered content with the shared source and update the older source checks.

No deployment is performed by the check or preview commands. Review the intended Git changes before publication.
