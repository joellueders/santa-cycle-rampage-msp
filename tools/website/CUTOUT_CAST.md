# Cutout crew

The nine artwork files in `assets/monster/cast-*.webp` are used only by the Rebel homepage. `cutout-cast.json` records the source and the role of each. The regular theme hides all nine without changing its copy or replacing its original photographs.

Built-in image editing was used for background extraction. The extraction PNGs and selected WebP exports are retained locally in `outputs/rebel-cutout-cast-2026-10-26/`. The production WebPs preserve alpha and are encoded at quality 88. Every image has explicit dimensions and lazy loading. No additional motion, image switching, video instances or JavaScript timers were added.

## Prompt set

Shared instructions: extract the specified subject from the supplied original onto a genuinely transparent background; preserve original faces, expressions, poses, handmade lines, colors and textures; do not polish, vectorize, beautify, invent details or add lettering; keep complete visible artwork and small safety margins.

- Dinosaur Santa: extract the entire green Santa dinosaur and red bicycle, removing the lime backdrop and title lettering while retaining the tail, beard, pink teeth and scribbled outlines.
- Vintage friends: extract the three front cyclists with their arms around each other, preserving the color photo heads, deliberately rough pasted edges, grayscale bodies, vintage bikes and original lower crop; remove the crowd and road.
- Crayon wave: extract the full purple-hatted waving cyclist and blue wheels, retaining the naive marks and pale paper texture within the figure; remove the surrounding photographed paper.
- Many-eyed Santa: extract only the central eyeball-covered red Santa on the tiny bicycle holding the yellow beer mug from the original 2024 poster. Retain the colored-pencil marks and remove the other characters, city and old event text.
- Dinner invasion: extract the five surprised Santas, seated family, all three chickens, and table together; preserve the original grainy scene and remove the wall, doorway and curtains around it.
- Vintage podium: extract both front cyclists, color Santa heads, huge bouquets and visible bicycles; preserve their expressions and original crop, removing the stadium crowd and track.
- Stick bike: extract the little black stick-figure Santa on the crooked blue bike and light pink wheel sketches; remove the paper/table and unrelated scribble above it; do not straighten the drawing.
- Watercolor rider: extract only the big-eyed rider with green pacifier, red suit, black boots and bicycle from the watercolor; remove lettering, buildings, street, binder and table, retaining the watercolor texture.
- Long-haired Santa: extract the complete pointing Santa and purple bicycle from the poster, retaining the flowing hair, yellow hand, beard, boots and pose; remove old route/date text and screen UI.

## Placement

Long-haired Santa points into the manifesto. The stick figure sits on Ride smart. The waving drawing accompanies the gift panel. The dinner interrupts the non-riding lunch invitation. Dinosaur Santa watches the FAQ. The three cycling friends accompany The Vibe. The many-eyed character raises a beer beside step 04. The watercolor rider rides out of the Our Story panel. The bouquet cyclists flank the closing invitation.

Old poster dates, venues and routes were not imported. The new hero headline is stored in shared content as `THEY WANT US` / `CHEERLESS`. Event schema, shared event facts and original video nodes are unchanged.

## Screen-print integration

The original WebPs are unchanged. The code-native print layer in `cutout-cast.css` reuses the chocolate collage’s `#screenprint` SVG filter for chipped ink and rough edges. A masked halftone pass follows each cutout’s own alpha. The red/lime backgrounds are separate, shared section-level washes: feathered halftones and broken diagonal ink spread beyond the illustrations and across panel boundaries. The toy-drive drawing and chicken dinner share a single wash across both boxes. There are no per-cutout starbursts or background clipping frames.

Photo collages use stronger contrast and denser dots. Pencil, crayon and watercolor art use lighter ink coverage to preserve their handmade marks. The layers are static, decorative and pointer-transparent; no regenerated images, runtime scripts, new video instances or motion are required. The regular theme does not show them.
