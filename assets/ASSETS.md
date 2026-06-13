# Zoo Smiles — connector-generated art assets

Source: 4 ChatGPT art sheets in `images/`, sliced locally, then run through the
Adobe pipeline (remove background -> vectorize -> SVGO) or exported as WebP.
**Zero Higgsfield credits used** — all art came from the uploaded sheets.

## Pipeline by sheet
| Sheet | Items | Format | Why |
|---|---|---|---|
| Animals | 8 | SVG (cut + vectorize + SVGO) | flat-ish, vectorizes clean, scalable |
| Tools | 12 | SVG (cut + vectorize + SVGO) | simple shapes, very light as vector |
| Effects/germs | 12 (+4 junk) | WebP 256px | busy textures, vector would be heavy |
| Tooth states | 10 (+3 junk) | WebP 256px | busy textures, vector would be heavy |

## Size payload (transfer)
- animals: ~58 KB gzip (8 SVG)
- tools: ~26 KB gzip (12 SVG)
- effects: ~52 KB (12 WebP)
- teeth: ~39 KB (10 WebP)
- **Total added art ≈ 175 KB**

Context: current app is ~58.6 KB gzip. Precached once on install, so this only
costs the first load, not every open. Fine for the old-Android offline target.

## Junk to delete (slicer over-fragmented the multi-part art)
- `effects/item_13.webp` … `item_16.webp` (broken-up sparkle)
- `teeth/item_5.webp`, `item_6.webp`, `item_8.webp` (stray decay blobs)

## The size rule (for any future generation)
Flat vector style, 3-4 solid flat colors, bold outlines, NO gradients/shading/
texture. Fewer colors = fewer paths = fewer bytes. Busy textured art -> WebP, not SVG.

## Next step
Replace the hand-coded SVG primitives in `src/components/` (Tooth, tools, AnimalFace)
with these named assets. Lock one art sheet as the style reference so future
additions match.
