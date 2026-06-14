# Zoo Smiles — tool-feel update (paste into Claude Code)

Five changes to `zoo-dental/`. All behavior was prototyped and approved in a Cowork mock; the notes below translate that mock to the real code. Files of interest: `src/components/Treatment.tsx` (the whole pointer/work-meter controller), `src/components/tools.tsx` (`ToolSprite`, `TOOL_W=60`, `TOOL_H=78`), `src/styles/app.css` (FX keyframes), `index.html` + `vite.config.ts` (PWA icons). No new dependencies. Keep the old-Android budget in mind (particle caps, no heavy filters). No em dashes anywhere.

Device-test on the kids' old Android before merge.

---

## 1. Enlarge the selected tool to ~2x and keep the finger near its base

Today the dragged tool is drawn at `scale(1.25)` and the hit-test contact point is a fixed `-56px` above the cursor:

- `moveDragSprite()` sets `transform: translate(${x},${y - 34}) scale(1.25)`
- `const TOOL_TIP_DY = -56;`

Goal: the picked-up tool roughly **doubles** (clearly bigger than its resting tray size), the **fingertip sits ~6px below the visible bottom edge** of the enlarged tool (so it never hides under the thumb), and cleaning/grabbing still triggers off the tool's **top working tip**.

Do this parametrically so it stays tunable:

```ts
const TOOL_SCALE = 2.0;          // was 1.25
const TOOL_CENTER_DY = -54;      // sprite center offset above cursor (was -34)
const TOOL_TIP_DY = -92;         // contact point above cursor (was -56)
```

- In `moveDragSprite()`: `translate(${x},${y + TOOL_CENTER_DY}) scale(${TOOL_SCALE})`.
- Leave every `lastPtRef.current.y + TOOL_TIP_DY` hit-test as-is; only the constant changes.

The sprite art has transparent padding, so these are empirical starting values, not pure box math. After wiring, eyeball it on device: the cursor should be a few px under the tool's painted bottom, and the flare ring should light on the tooth exactly when the painted tip overlaps it. Nudge `TOOL_CENTER_DY` (finger gap) and `TOOL_TIP_DY` (trigger point) by a few px each until it feels right. The two move together: if you raise the tool higher off the finger, lower the tip number by the same amount.

Apply the same `TOOL_SCALE` to the carried puzzle piece path so it matches.

---

## 2. Continuous (held) tools take 3.5s per tooth; plucks stay instant

In the `TOOL_FEEL` table, the per-tool `ms` is the time to clear one problem. Bump the **held/scrub** tools to `3500`:

| tool | old ms | new ms |
|---|---|---|
| brush | 820 | 3500 |
| germspray | 640 | 3500 |
| drill | 1000 | 3500 |
| filler | 720 | 3500 |
| forceps | 1100 | 3500 |

- `forceps` (pull a rotten tooth) is a deliberate held action, so it goes to 3500 too. If that feels too long for a pull on device, that's the one to dial back; ask before changing.
- `tweezers` leaves the work-meter system entirely (see #3). It no longer auto-clears on contact, so its `TOOL_FEEL` entry can be removed or left unused.
- The whole-mouth tools (`sprayer`, `mouthwash`) use `mouthProgress`, not the per-tooth meter; **leave them as-is**.

Because the meter now runs ~41 ticks (3500 / `TICK_MS` 85) instead of ~10, particle spawning at `fxEvery: 1` will roughly quadruple. To hold the old-Android budget and keep density looking the same, set `fxEvery: 2` on the five 3500ms tools. `FX_CAP` (15) stays. Verify frame rate on device while scrubbing.

`meterRef` already persists across pauses (pause-never-reset), which is the behavior we want at the longer duration.

---

## 3. Tweezers become grab → carry → release into a slide-in tray

This replaces the tweezers' instant/meter clear with a deliberate three-beat interaction (approved in the mock):

1. **Grab** — on `pointerDown` while the tweezers tool is active and the tool **tip** is over a debris tooth (`t.debris` truthy and a live target): lift the debris off the tooth (hide its `[data-fx-problem]` overlay imperatively) and attach a **carried debris sprite** that follows the tool tip. Do **not** clear the tooth yet. Play a soft grab sfx + light `buzz`.
2. **Carry** — while dragging, the carried debris tracks the tip each move/tick. Give it a **tiny continuous wiggle** (small rotate/translate loop, ~0.2s) so it reads as "gripped." Add a `zd-carrywiggle` keyframe in `app.css` (a couple degrees of rotation, a px or two of bob).
3. **Release** — on `pointerUp`:
   - If the tip is **over the discard tray**: deposit. Animate the debris into the tray, then clear the tooth (`applyWork('tweezers', i)` → `t.debris = null`), fire the **star burst** (#4), success sfx + `vibDone`-style buzz.
   - If released **anywhere else**: return the debris to its tooth (restore the overlay, no clear), gentle `sfx.uhoh()`. Nothing is lost. (Mike confirmed: tweezers must reach the tray or the food goes back in the mouth.)

**The tray:** use the existing `assets/props/tray.webp` (kidney dish). Wire it through `assets.ts` if it isn't already exported. Render it as an on-screen element that **slides in from the side when `step.tool === 'tweezers'`** and slides back out otherwise (CSS transform transition, mirror the reference's tray animation). If `tray.webp` doesn't read well at game scale, generate a simple dish; don't block on it.

State: add a `carrying: { toothIndex: number } | null` ref/state. The carried debris is an imperative element (like the FX layer) so move doesn't re-render. Make sure step completion still works: the tweezers step's `stepDone`/targets should only resolve once every debris tooth has been **deposited**, not merely touched.

Keep this contained to the tweezers/debris path; the brush/drill/filler/forceps meter flow is unchanged except for the timing in #2.

---

## 4. Star burst on every completed cleaning action (per tooth)

Today a finished tooth gets `sparkle` + `sfx.sparkle()` only when it becomes fully healthy. Add a distinct, bigger **star burst** that fires the moment **any** problem clears on a tooth (brush done, drill done, filler done, debris deposited, etc.), matching the reference's star pop.

- Add `spawnStarBurst(cx, cy)`: ~18–20 small star shapes (procedural star `<polygon>`s or cloned `EFFECT_ART.sparkle`) radiating outward from the tooth center, in the confetti color set (`#ff7bac, #ffe066, #6fc9ec, #9be37c, #cba8f5, #ff9f5a`), ~800ms life, scale-up + fade-out + slight rotation. Model it on the approved mock: 20 stars, distance 55–115px, random angle.
- Give it its own short-lived nodes with a small cap (these are brief; keep them off the `FX_CAP` work-particle pool or give them their own cap of ~24). Add a `zd-starburst` keyframe in `app.css`.
- Call it once per problem-clear: simplest is inside `applyWork(tool, i)` at `layout[i].cx/cy` (fires for every tool), plus the tweezers deposit in #3. Keep the existing `sparkle` flag + `sfx.sparkle()` for the separate "tooth fully healthy" moment.
- Honor `prefers-reduced-motion` (skip or shorten), consistent with the existing FX.

---

## 5. Replace the PWA icon with the new favicon

A new source image is at `zoo-dental/images/favicon.png` (large; it's the source, not the final asset). Use it to replace the app/PWA icons:

- Generate `public/icon-192.png` (192x192) and `public/icon-512.png` (512x512) from `images/favicon.png`, overwriting the current files. Also produce a 512 **maskable** version with safe padding if the art crowds the edges (the manifest already declares a maskable 512 entry).
- Add a small `public/favicon.png` (e.g. 48x48) and point `index.html`'s `<link rel="icon">` at it (the current `favicon.svg` is the old mark). Update `<link rel="apple-touch-icon" href="/icon-192.png">` if the name changes (it shouldn't if you overwrite in place).
- `vite.config.ts` manifest already references `icon-192.png` / `icon-512.png`, so overwriting in place needs no manifest change. Confirm `includeAssets` and the workbox `globPatterns` still cover the icons (they do: `**/*.{...png...}`).
- Use PIL or sharp for the resize; keep the final PNGs small. Don't commit `images/favicon.png` if `images/` is gitignored (it is for the raw ChatGPT art); the built `public/` icons are what ship.

---

## Verify before merge
- `tsc` clean (aside from any pre-existing documented errors), `npm run build` green, bundle still ~58KB gzip JS range.
- `scripts/smoke_each.py` and `scripts/smoke_full.py` pass 6/6 with zero console errors. The smoke harness is meter-aware; it will need updating for the new tweezers carry-to-tray flow (tap debris, drag to tray rect, release) so the tweezers/debris patients still pass.
- Device test on the kids' old Android: tool-enlarge offset feels right and never hides under the thumb, 3.5s scrub holds frame rate, tweezers grab/carry/wiggle/release into the tray, star burst on every clear, new icon on install.
- Update `kid_games/CLAUDE.md` (and mirror to `MASTER_CONTEXT.md` per the project rule) with what shipped.
