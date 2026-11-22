# Website pages and checks

The homepage starts in the regular design and offers a Rebel Mode toggle. `rebel.html` opens in Rebel Mode directly. Both entry points include email signup, the same linked schedule, and links to the full history. `our-story.html` forwards older history bookmarks to `story.html`.

The two public homepage files are maintained directly. When editing shared ride information, update both and check it against `press.html` and the calendar download.

Run current-site checks:

    node tools/website/check.mjs

Preview the current site:

    node tools/website/preview.mjs

See `tools/website/LAUNCH.md` before using older generators or release tools.
