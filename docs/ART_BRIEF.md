# Zoo Smiles — Art & Animation Production Brief (v1 → full production quality)

This document is everything a designer (human or AI design tool) needs to
produce final art for Zoo Smiles at commercial animal-dentist quality, in a
format that drops straight into the codebase. **Part A is the paste-ready
master prompt.** Parts B–E are the appendices it references — paste them
along with Part A (the whole file is designed to be handed over as one piece).

Originality rule for everything below: invent original characters, an original
germ species, and an original palette. Match the GENRE's production level and
animation grammar — never any specific existing game's characters, logos, or
trade dress.

---

## PART A — MASTER PROMPT (paste this + the appendices to the design tool)

You are producing the complete visual design for "Zoo Smiles — Animal
Dentist," a kids' (ages 3–7) animal-dentist game in the classic mobile genre:
a cartoon animal sits in a dental chair with a giant open mouth filling the
screen, and the child fixes its teeth with chunky tools. The game logic,
screens, and interactions are ALREADY BUILT — you are skinning a working
game, so every asset must respect the coordinate contracts in Appendix C
exactly. Deliver files per Appendix B's inventory and file format.

### Quality bar
Commercial kids-app production quality: soft rounded everything (zero sharp
corners outside of deliberate "problem" elements), confident thick outlines,
two-tone + highlight shading, layered scene depth (background / midground /
character / play surface / UI), squash-and-stretch motion, and constant
micro-celebration. The mouth must read instantly as a "game board" and the
animal's eyes must read as the emotional meter from 2 feet away on a 360px
phone.

### Design language (hard rules)
- **Shape language:** blobby, rounded, toddler-safe. Heads are big (60–80% of
  screen during treatment), bodies small or implied. Teeth are chunky rounded
  blocks with personality. Tools are oversized, friendly, toy-like — a drill
  that looks like a toy, never a scary instrument.
- **Outline system:** one single ink color used for ALL outlines in the app
  (pick a dark blue/brown/charcoal that harmonizes with your palette — not
  pure black). Weights: 5px on hero shapes (heads, mouth rim), 3px on midsize
  elements (teeth, tools), 2px on details, at the 360-wide coordinate scale.
  Consistent weight = the "expensive" look; mixed weights read as cheap.
- **Shading model:** every filled shape gets at most: base fill + one darker
  side-shade (flat, not gradient, offset toward bottom/right) + one small
  white/light glint. Optional soft radial gradient on hero shapes only.
  NO blurs, NO drop-shadow filters, NO `<filter>` of any kind (old-phone GPU
  constraint) — fake any shadow with a solid darker shape.
- **Palette structure** (you choose the actual colors — invent a fresh
  scheme, do not reuse this project's current placeholder colors):
  - One app-wide "clinic" base family (calm: mints/skies/creams — the genre
    uses calm clinical pastels to soothe dental anxiety).
  - One identity hue + one accent per animal (6 animals, clearly separable
    by silhouette AND color at thumbnail size).
  - "Problem" elements (plaque, cavities, rot, germs, stink) own the ONLY
    dirty colors on screen — desaturated browns/ochres/sickly greens — so
    cleaning visibly restores beauty. Nothing else may use these colors.
  - Reward/feedback elements (sparkles, stars, confetti) own the brightest
    saturated pops.
- **Faces/emotion:** eyes are the core feedback channel and must stay visible
  above the open mouth at all times. Build a reusable eye system with these
  states: neutral-open (wide, curious), wince (squeezed shut, comedic),
  happy (closed upturned arcs), sad (open + tilted brows + one welling
  tear). Pupils should be large (toddler appeal) with a white glint.
- **Typography:** one rounded display face for the logo/headers and big
  buttons only (must be free-licensed and embeddable, or delivered as
  outlined paths); everything else is icon-driven — the audience can't read.

### What to design (full inventory in Appendix B)
1. **4 screens** — title, waiting-room lobby, treatment, celebration — as
   complete 360×760 mockups with the layered scene dressing that makes the
   game feel finished: clinic interior (dental chair the patient sits in,
   adjustable lamp, tiled/wallpapered wall, window with outdoor hint, shelf
   with tooth-care props, plant), NOT a flat color void.
2. **6 original animal patients** — you may invent any animal cast, but each
   must land in one of the 6 "mouth board classes" in Appendix C-3 (the game
   logic depends on tooth counts/shapes). Each animal: open-mouth treatment
   pose (head + shoulders + visible chair), closed-mouth lobby portrait, all
   4 eye-expression states, and a celebration smile with sparkling teeth.
   Give each animal one memorable silhouette feature and a one-line
   personality (drives its idle animation).
3. **Tooth skins** — teeth are placed programmatically; deliver each tooth
   SHAPE as art in a normalized box, plus every problem/repair STATE as a
   separate overlay layer (Appendix C-4 lists all states). This is the most
   important deliverable: the whole game happens on these.
4. **11 tools** — idle tray sprite + in-use state with its work effect
   (spray fan, foam, drill sparkle-less vibration lines, goo squeeze, etc.).
5. **Characters of decay** — an original "germ" species (2–3 variants):
   round, mischievous-but-cute, distinct silhouette, NOT scary; plus 5 food
   debris sprites; a stink cloud; all designed to be satisfying to remove.
6. **FX + UI kit** — sparkle, star pop, foam bubble, water droplet, poof,
   confetti set, flying-tooth, hint hand (pointing glove), progress dots,
   home/sound buttons, label pill, big CTA button (normal/pressed).

### Animation flow (full timing spec in Appendix D)
Deliver all motion as CSS keyframe animations inside each file, applied to
NAMED GROUPS (so the engineering side can re-trigger them). The genre's
animation grammar you must hit: everything idles (nothing is ever frozen);
every interaction has pickup/work/success micro-states; every success
overshoots (pop to ~112% then settle); the patient continuously reacts; and
the celebration is choreographed (mouth close → smile glint sweep → confetti
+ stars + bounce dance), never simultaneous.

### Deliverable format (hard requirements — Appendix B-2)
Self-contained HTML files with inline SVG only. No rasters, no external
URLs, no fonts loaded from the network, no `<filter>`. Every semantic part
in a `<g>` with a `data-part` attribute per the naming contract. CSS
animations in a `<style>` block in the same file, transform/opacity only,
every animated group wrapped in a positioning parent (CSS transform replaces
the SVG transform attribute — the build relies on this wrapper pattern).

---

## PART B — DELIVERABLES & FILE FORMAT

### B-1. File list (12 files)
| File | Contents |
|---|---|
| `zoo-style.html` | Style guide: palette swatches w/ hex + role names, outline weights demo, shading model demo, the eye system in all 4 states, typography sample |
| `screen-title.html` | Full 360×760 title screen: logo, mascot, PLAY, scene dressing |
| `screen-lobby.html` | Waiting room with all 6 animals present (awake-sad, sleeping, treated-happy variants shown), header, smile counter |
| `screen-treatment.html` | One full treatment scene (pick your "bunny-class" animal): clinic room, chair, lamp, patient with open mouth ON the Appendix C-1 contract, populated tooth board, tool tray with 4 tools (one active/glowing), HUD |
| `screen-celebrate.html` | Celebration: closed-mouth giant smile w/ glint sweep, confetti, 3 stars, CTA |
| `animal-01.html` … `animal-06.html` | One file per animal: treatment pose (open mouth per contract), lobby portrait (closed mouth), the 4 eye states as toggleable groups, celebration smile, + the JSON mouth-params block (C-2) in a comment |
| `teeth-states.html` | Grid: 5 tooth shapes × all states from C-4, each in its normalized 100×140 box, overlays as separate labeled groups |
| `tools-fx.html` | 11 tools (idle + in-use), germs, debris, stink cloud, all FX particles, UI kit |

### B-2. Technical format (every file)
- One `<svg>` per asset or screen, inline, self-contained.
- ViewBoxes: screens `0 0 360 760`; treatment scene area `0 0 360 560`;
  animals `0 0 360 430`; teeth `0 0 100 140`; tools/FX `0 0 56 56` each.
- Vector only. No `<image>`, no base64 rasters, no external `<use>` refs.
- No `<filter>`, `feGaussianBlur`, `feDropShadow` — fake shadows with solid
  shapes at lower opacity.
- Gradients allowed (linear/radial), max ~2 stops, hero shapes only.
- Named parts: `data-part="eye-l" / "eye-r" / "brow-l" / "ear-l" /
  "mouth-rim" / "cheek-l" / "tray" / "tool-brush" / "fx-sparkle"` etc. —
  kebab-case, stable, every group that animates or toggles gets one.
- Expression variants: include all four in the file as sibling groups
  `data-expr="open|wince|happy|sad"` (visibility toggled by the app).
- Animations: CSS keyframes in `<style>`, transform/opacity ONLY, and any
  animated group must be an inner `<g>` inside a positioning `<g>` (never
  put a CSS animation class on an element that carries an SVG `transform`
  attribute — CSS transform overrides it and the asset teleports to 0,0).
- Comment every section. Hex colors as 6-digit lowercase.

---

## PART C — COORDINATE CONTRACTS (the game engine's fixed geometry)

### C-1. Treatment scene (viewBox 0 0 360 560)
- y 0–430: face/scene area. y 456–552: tool tray shelf (rounded rect
  x8 y456 w344 h96 r20). Tool slots sit on y=500, spaced 66–72px around
  center x=180 (up to 5 slots).
- **Mouth opening (THE board, immovable default):** ellipse center
  (180, 262), rx 148, ry 112, with interior depth shading, tongue
  (ellipse ~cx180 cy340 rx92 ry42), upper gum band arc through
  (48,198)→(180,140)→(312,198), lower band (56,332)→(180,382)→(312,332).
  Face art must wrap AROUND this opening. Per-animal deviation allowed
  ±20px on center, ±15% on radii — declared in the C-2 JSON block.
- HUD overlays (drawn by the app, leave clear): top 64px of the screen,
  and a 44px home button at top-left.

### C-2. Per-animal JSON block (in an HTML comment in each animal file)
```json
{
  "id": "animal-01",
  "boardClass": "tiny-easy",
  "mouth": { "cx": 180, "cy": 262, "rx": 148, "ry": 112 },
  "eyeLine": 118,
  "skin": "#xxxxxx", "skinDark": "#xxxxxx", "accent": "#xxxxxx",
  "personality": "one line",
  "idleAnim": "ear-flop every 4s"
}
```

### C-3. The six mouth board classes (game difficulty = board layout)
| Class | Teeth top / bottom | Shapes | Reference archetype |
|---|---|---|---|
| tiny-easy | 2 / 4 | 2 oversized incisors + squares | small herbivore |
| standard-8 | 4 / 4 | uniform squares | primate/pet |
| giant-molars | 2 / 4 | huge molars + 2 lower tusks | big-jaw river animal |
| tusked | 3 / 3 | molars + 2 tusks (tusks = special teeth) | trunked/tusked animal |
| many-fangs | 5 / 5 | small pointy fangs (the "hard board") | long-jaw reptile |
| mixed-fangs | 4 / 4 | corner fangs + squares | big cat |

Pick any 6 original animals that map onto these classes 1:1.

### C-4. Tooth skin states (each = separate overlay group, normalized 100×140 box, crown toward y=0)
Shapes: `square`, `buck`, `molar`, `fang`, `tusk` (5 silhouettes).
States per shape: `clean` (base), `plaque-1/2/3` (light film → heavy crust,
erased in 3 brush stages), `debris-anchor` (marked point where food sprites
attach), `cavity-hole` (dark decay blotch + cracks), `cavity-drilled` (clean
exposed hole), `cavity-filled` (bright patch + glint), `chip-tri` /
`chip-square` / `chip-round` (notch cut from a biting corner, 3 puzzle
silhouettes) each in `broken` (jagged cracks) / `smoothed` / `repaired`
(white piece + seam) variants, `rotten` (whole tooth sickly, cracked),
`socket` (empty gum hole after extraction), `implant` (extra-white + glint).
Also: the 3 loose puzzle PIECES matching the 3 notch silhouettes.

### C-5. Lobby cards & celebration
Lobby: 2-column card grid, card ≈160×190; portrait must read at 140px tall.
Celebration: closed-mouth happy face at ~300px, smile shows a row of teeth
with individual glints (the "after" reveal).

---

## PART D — ANIMATION FLOW SPEC (timings the motion must hit)

### D-1. Ambient (always running)
| What | Motion | Timing |
|---|---|---|
| Patient breathing | scale 1→1.02 from chest anchor | 2.6s ease-in-out loop |
| Blink | eyes squash shut | every 3–5s, 120ms |
| Germ idle | bob ±3px + occasional cheeky 10° tilt | 1.3s loop |
| Stink cloud | drift up ±4px, waves wiggle | 2.2s loop |
| Active tool in tray | bounce −7px + glow pulse behind | 0.9s loop |
| Lamp/plant/props | tiny secondary sway | 4–6s loops, subtle |

### D-2. Interaction micro-states
| Event | Motion | Timing |
|---|---|---|
| Tool pickup | scale 1→1.25, tilt −8°, lifts above finger | 120ms ease-out |
| Brush work | head oscillation ±6px + foam bubbles spawning | 8Hz while moving |
| Drill work | micro-vibration ±1px + rotation lines; patient wince ON | continuous while held |
| Spray work | fan of 3–5 droplets/100ms, arcing down | continuous |
| Forceps work | target tooth rocks ±5° (4Hz), stretches +10% vertically near the end | builds over ~1.1s hold |
| Tooth pops out | flies up-off in an arc, spinning 220° | 900ms ease-in |
| Debris plucked | item pops off, star burst at point | 350ms |
| Germ zapped | squeeze + poof cloud + dizzy stars | 400ms |
| Wrong piece / inert tool | shake ±6px ×3 + patient brief puzzled look | 450ms |
| Any fix lands | the fixed element pops 0→112%→100% | 350ms spring |
| Tooth fully healthy | 4-point sparkle: scale 0→125%→0, fade | 800ms |

### D-3. Sequence choreography
| Moment | Sequence |
|---|---|
| Patient intro | hop/walk into chair 600ms → settle squash → mouth opens 400ms ease-out → first tool starts bouncing |
| Step complete | chime; label pill swaps (slide-up 200ms); patient 700ms relief face; next tool bounces ×3 emphasized |
| Patient complete | mouth closes 300ms → beat 200ms → giant smile w/ glint sweep L→R 600ms → confetti starts + 3 stars stagger in (300ms apart, spring) + bounce-dance loop 900ms → CTA slides up |
| Eyes during play | pupils track the dragged tool (offset toward pointer, max 4px) — "the patient watches you work" |
| Wince | in 150ms, hold while cause persists, out 200ms |

### D-4. Feel rules
Everything eases (no linear motion on hero elements); successes overshoot;
failures are soft (shake + bounce-back, never red flashes or harsh signals);
nothing on screen is ever 100% static; one focal animation at a time —
ambient motion stays under ~3px so it never competes with the child's task.

---

## PART E — ACCEPTANCE & INTEGRATION (what happens on receipt)

The build vendors your files in as typed React components (same pipeline as
this studio's prior games): screens are ported verbatim, animals become
`AnimalFace` variants driven by `data-expr`, tooth skins become the
programmatic `Tooth` renderer's paths/overlays, tools/FX drop into the tray
and particle systems, and your CSS keyframes are lifted into the app
stylesheet. Acceptance checks: renders at 360px width with no horizontal
crop of critical elements; no filters; every animated group wrapped per
B-2; all `data-part`/`data-expr` names present; problem colors appear
nowhere except problem elements; each animal passes the "thumbnail test"
(recognizable at 80px) and the "eye test" (expression readable at arm's
length on a phone).
