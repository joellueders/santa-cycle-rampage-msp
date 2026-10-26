# Mobile media budget and rebuild

The October 26 performance pass keeps the approved art, layout, copy, credits,
original media and downloadable press files. Do not replace original archive
files with compressed delivery copies.

- `media-performance.json` maps original files to delivery derivatives.
- `media-performance.mjs` adds responsive images, intrinsic dimensions, small
  video posters, and two source sizes for each of the five ambient loops.
- `assets/mobile/` contains generated delivery media, not new artwork.
- `optimize-media.py` derives media from exact Git originals using Pillow/WebP
  and FFmpeg. Run it in a current, clean release checkout, not an older/diverged
  local checkout. Existing source-matched WebPs in `assets/optimized/` are reused.
- `site.js` loads offscreen posters within 300px and plays ambient video only
  when visible. Reduced motion and Data Saver keep the poster and skip automatic
  video downloads. The initial hero poster paints before playback begins.
- `monster-preview.js` moves the same video between the two theme slots.
  `monster-vhs.css` reserves the normal theme's media footprint to prevent the
  date card jumping during initialization. VHS timing is unchanged.
- The redundant cutout alpha-mask overlay was requesting nine nonexistent
  stylesheet-relative image URLs. It was removed. The working screenprint
  filter and flowing section-level halftone ink remain.

## Encoding and resizing

The mobile hero is H.264, 720px wide, 24fps, CRF 29, about 973KB instead of
3.39MB. Other mobile loops fit within 960px, CRF 27. Desktop loops fit within
1280px, CRF 26. Only muted ambient delivery copies have their unused audio
removed. Press coverage/download files retain their original audio and size.
All MP4 derivatives are fast-start and retain the original clip duration within
one frame. Responsive WebPs keep transparent edges and the source aspect ratio.

If encoding parameters change, change the derivative profile filename as well,
so existing cached media is not silently reused. `prepare-release.mjs` copies
only the derivatives named by the manifest, including every srcset candidate.

## Checks

```sh
node --test tests/site-mode.test.cjs tools/website/monster-takeover.test.mjs tools/website/media-performance.test.mjs
```

Use Lighthouse 12.8.2 cold mobile navigations for comparisons. Compare the same
host, viewport and throttling profile, and repeat variable results. Local HTTP
and production HTTPS/CDN scores are not interchangeable. Lighthouse's simulated
timings are lab results, not measured visitor load times.

The full before/after reports and phone/desktop previews are kept outside the
public release in `outputs/performance-audit-2026-10-26/` in the working project.
The main remaining mobile tradeoff is the autoplay hero, not a large framework
or third-party embed. Do not remove the approved video or glitch effect just
to improve a synthetic score without a separate design decision.
