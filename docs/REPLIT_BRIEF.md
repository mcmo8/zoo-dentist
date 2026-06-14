# Zoo Smiles, Replit Production Brief (Raster Layer Edition, v1)

NOTE FOR THIS REPO: This document supersedes ART_BRIEF.md for the Replit
handoff. ART_BRIEF.md remains the SVG fallback spec. The coordinate
contracts (Part C) and animation timings (Part D) are carried over from it
and are engine truth. They must not drift between the two documents.

Everything below is designed to be pasted into Replit as one piece.

---

## PART A. MASTER PROMPT (paste this plus all appendices)

You are producing the complete visual layer for "Zoo Smiles: Animal
Dentist," a kids' (ages 3 to 7) animal-dentist game in the classic mobile
genre: a cartoon animal sits in a dental chair with a giant open mouth
filling the screen, and the child fixes its teeth with chunky friendly
tools. The game logic, screens, gestures, and state machine are ALREADY
WORKING in a separate codebase. You are skinning a finished game. Every
asset must respect the coordinate contracts in Appendix C exactly, and
deliver per Appendix B.

### Scope guard (hard boundary)
You produce ART and PREVIEW SCENES only:
- Layered raster art assets (painted, transparent PNG layers).
- Plain HTML compositor files that stack those layers and run the CSS
  animations, as living proof everything assembles and moves correctly.
- A metadata JSON file describing geometry and pivots.

You do NOT produce: game logic, state, scoring, gesture handling, a React
app, or any JS beyond what a compositor preview minimally needs to toggle
expression states for demonstration. No npm packages, no Tailwind, no
Lottie, no Framer Motion, no animation libraries of any kind. Motion is
CSS keyframes only.

### Medium and method
- All character, scene, and sprite art is PAINTED RASTER. Soft shading,
  smooth gradients, rounded volume, gentle ambient occlusion are all
  encouraged. This is what separates this pass from a vector look.
- Generate every layer as ITS OWN image on a transparent background.
  Never paint a finished composite and slice it afterward. The layer list
  in Appendix B-3 is the unit of work.
- Style consistency is the whole job. Follow the production order in
  Part A-final: style guide first, one approved vertical slice, then batch.

### Originality rule
Invent original characters, an original germ species, and an original
palette. Match the GENRE's production level and animation grammar. Never
copy any specific existing game's characters, logos, or trade dress.

### Quality bar
Commercial kids-app production quality: soft rounded everything (zero
sharp corners outside deliberate "problem" elements), confident thick
outlines, soft painted volume shading, layered scene depth (background /
midground / character / play surface / UI), squash-and-stretch motion,
constant micro-celebration. The mouth must read instantly as a "game
board" and the animal's eyes must read as the emotional meter from 2 feet
away on a 360px-wide phone.

### Design language (hard rules)
- Shape language: blobby, rounded, toddler-safe. Heads are big (60 to 80%
  of screen during treatment), bodies small or implied. Teeth are chunky
  rounded blocks with personality. Tools are oversized, friendly,
  toy-like. A drill that looks like a toy, never a scary instrument.
- Outline system: one single ink color for ALL outlines in the app (a
  dark blue, brown, or charcoal that harmonizes with your palette, not
  pure black). Weights at the 360-wide coordinate scale: 5px on hero
  shapes (heads, mouth rim), 3px on midsize (teeth, tools), 2px on
  details. Consistent weight is the "expensive" look.
- Shading model: painted volume shading is allowed and wanted. Light
  source top-left, consistent across every asset. Each shape: base color,
  soft core shadow toward bottom-right, one light glint. Keep shading
  SOFT and SIMPLE; this is toddler art, not rendered realism.
- Palette structure (invent fresh colors, do not reuse the current
  placeholder palette in the codebase):
  - One app-wide "clinic" base family (calm mints, skies, creams; the
    genre uses calm clinical pastels to soothe dental anxiety).
  - One identity hue plus one accent per animal. All 6 animals clearly
    separable by silhouette AND color at thumbnail size.
  - "Problem" elements (plaque, cavities, rot, germs, stink) own the ONLY
    dirty colors on screen: desaturated browns, ochres, sickly greens.
    Nothing else may use these colors. Cleaning must visibly restore
    beauty.
  - Reward elements (sparkles, stars, confetti) own the brightest
    saturated pops.
- Faces and emotion: eyes are the core feedback channel and must stay
  visible above the open mouth at all times. The eye system has 4 states:
  neutral-open (wide, curious), wince (squeezed shut, comedic), happy
  (closed upturned arcs), sad (open, tilted brows, one welling tear).
  Large pupils with a white glint. Eyes ship as SEPARATE layers per
  Appendix B-3 so the app can swap states.
- Typography: one rounded display face for logo, headers, and big buttons
  only (free-licensed and embeddable, or delivered as rendered raster).
  Everything else is icon-driven; the audience cannot read.

### Production order (do not skip)
1. `style/` first: palette, ink color, outline demo, shading demo, the
   eye system in all 4 states, one sample tooth in 3 states, typography
   sample. STOP for approval.
2. Vertical slice: one complete animal (bunny class) with all layers,
   plus `scenes/scene-treatment.html` compositing it with 4 tools, one of
   each problem type, and the full ambient animation set from Appendix D.
   STOP for approval.
3. Only then batch the remaining 5 animals, all screens, all tooth
   states, all tools, problems, and FX in the locked style.

---

## PART B. DELIVERABLES AND FORMAT

### B-1. Folder structure (the delivery IS this file tree)
```
art/
  style/                style-guide.png (or .html), palette.json
  screens/              bg-title.png, bg-lobby.png, bg-clinic.png,
                        bg-celebrate.png, props as separate layers
                        (lamp.png, plant.png, shelf.png, chair.png ...)
  animals/animal-01/ .. animal-06/
                        (layer list in B-3)
  teeth/square/ buck/ molar/ fang/ tusk/
                        clean.png, plaque-1.png, plaque-2.png,
                        plaque-3.png, cavity-hole.png, cavity-drilled.png,
                        cavity-filled.png, chip-tri-broken.png, ... ,
                        rotten.png, socket.png, implant.png,
                        piece-tri.png, piece-square.png, piece-round.png
  tools/                brush-idle.png, brush-use.png, drill-idle.png,
                        drill-use.png, ... (11 tools, 2 states each)
  problems/             germ-a.png, germ-b.png, germ-c.png,
                        debris-1.png .. debris-5.png, stink.png
  ui/                   logo.png, btn-cta.png, btn-cta-pressed.png,
                        btn-home.png, btn-sound-on.png, btn-sound-off.png,
                        label-pill.png, progress-dot-on.png,
                        progress-dot-off.png, hint-hand.png, star.png
scenes/
  scene-title.html      scene-lobby.html
  scene-treatment.html  scene-celebrate.html
meta/
  animals.json          (schema in C-2, one entry per animal)
```

### B-2. Raster format rules (every image)
- PNG-24 with real alpha transparency. Verify: no white or checkered
  boxes around anything. (Downstream conversion to WebP happens at
  integration; deliver PNG.)
- sRGB color space. 6-digit lowercase hex in any metadata.
- Scale: the game stage is 360x560 CSS px (screens 360x760). Deliver
  big layers at 2x (full-stage canvas = 720x1120; full screen =
  720x1520). Deliver small reusable sprites at 3x of their normalized
  box (teeth box 100x140 so files are 300x420; tools and FX box 56x56 so
  files are 168x168). Small sprites get scaled up during pickup
  animations and must stay crisp.
- Consistent ink outline rendered INTO the art at the weights in Part A
  (double the px values at 2x, triple at 3x).

### B-3. Layer separation rules (the most important section)
Per-animal layers are each painted on the FULL 720x1120 stage canvas, in
their final position, transparent everywhere else. Stack the files and
the scene is assembled; zero offset math. (Integration crops them later;
the full canvas is the alignment source of truth.)

Per animal (`art/animals/animal-0N/`):
| File | Contents |
|---|---|
| `body-chair.png` | dental chair + the animal's body sitting in it |
| `head-open.png` | head in treatment pose, mouth opening is a TRANSPARENT HOLE per the C-1 ellipse, gum bands painted around the rim, NO eyes painted |
| `mouth-cavity.png` | mouth interior depth shading, sized to show through the hole |
| `tongue.png` | tongue alone (it animates separately) |
| `eyes-open.png`, `eyes-wince.png`, `eyes-happy.png`, `eyes-sad.png` | the 4 expression states, brows included, positioned on the eyeLine |
| `head-closed.png` | lobby portrait, closed mouth, eyes painted in (static use) |
| `head-smile.png` | celebration giant smile showing a row of teeth with glints, eyes painted in (static use) |

Z-order bottom to top in the treatment scene: background, chair+body,
mouth-cavity, tongue, TEETH (placed programmatically), head-open,
eyes-(state), problems and tools and FX above all.

Teeth are NOT per-animal. They are reusable skins: 5 shapes, every state
from C-4, each in the normalized 100x140 box (file 300x420), crown toward
the top, identical registration across states so overlays stack
perfectly on the clean base.

Problems, tools, UI: one sprite per file in their normalized boxes,
centered, consistent registration between idle and use states.

### B-4. Compositor scene files (the proof of assembly)
- Plain HTML + CSS, one per screen. Absolutely positioned `<img>` layers
  (relative paths into `art/`) on a fixed 360-wide stage, scaled to fit.
- All Appendix D animations implemented as CSS keyframes on transform
  and opacity ONLY. No JS animation. A few buttons may toggle expression
  layers or replay a sequence for demo purposes; that is the only JS
  allowed.
- THE WRAPPER RULE: any animated element gets an outer positioning
  wrapper div (carries position) and an inner element (carries the CSS
  animation class). Never put an animation class on the element that
  carries positioning, and document each rotating sprite's pivot via
  `transform-origin` matching the pivot in `meta/animals.json` (a tooth
  wiggles from its root, a tool tilts from its grip).
- Every layer element gets `data-part="..."` (kebab-case, stable):
  `eye-l`, `mouth-rim`, `tooth-3`, `tool-brush`, `fx-sparkle`, etc.
  Expression layers get `data-expr="open|wince|happy|sad"`.
- Tiny FX (sparkles, stars, droplets, foam bubbles, hint hand pointer,
  progress dots) MAY be inline SVG inside the compositors instead of
  raster files: they are simple shapes, stay crisp at any scale, and
  weigh nothing. If done as SVG, no `<filter>` of any kind.

---

## PART C. COORDINATE CONTRACTS (engine truth, do not deviate)

### C-1. Treatment scene (stage 0 0 360 560, CSS px; art at 2x)
- y 0 to 430: face and scene area. y 456 to 552: tool tray shelf (rounded
  rect x8 y456 w344 h96 r20). Tool slots sit on y=500, spaced 66 to 72px
  around center x=180, up to 5 slots.
- Mouth opening (THE board, immovable default): ellipse center
  (180, 262), rx 148, ry 112. Interior depth shading in `mouth-cavity`.
  Tongue ellipse approx cx180 cy340 rx92 ry42. Upper gum band arc through
  (48,198) to (180,140) to (312,198); lower band (56,332) to (180,382) to
  (312,332). Face art wraps AROUND this opening. Per-animal deviation
  allowed: plus or minus 20px on center, plus or minus 15% on radii,
  declared in the C-2 JSON.
- HUD overlays (drawn by the app, leave clear): top 64px of the screen
  and a 44px home button at top-left.

### C-2. meta/animals.json (one entry per animal)
```json
{
  "id": "animal-01",
  "boardClass": "tiny-easy",
  "mouth": { "cx": 180, "cy": 262, "rx": 148, "ry": 112 },
  "eyeLine": 118,
  "skin": "#xxxxxx", "skinDark": "#xxxxxx", "accent": "#xxxxxx",
  "personality": "one line",
  "idleAnim": "ear-flop every 4s",
  "pivots": {
    "head": [180, 300],
    "ear-l": [96, 70],
    "tongue": [180, 318]
  }
}
```
Pivots are stage coordinates (360x560 space) for every part that rotates
or rocks in this animal's animations.

### C-3. The six mouth board classes (game difficulty = board layout)
| Class | Teeth top / bottom | Shapes | Reference archetype |
|---|---|---|---|
| tiny-easy | 2 / 4 | 2 oversized incisors + squares | small herbivore |
| standard-8 | 4 / 4 | uniform squares | primate or pet |
| giant-molars | 2 / 4 | huge molars + 2 lower tusks | big-jaw river animal |
| tusked | 3 / 3 | molars + 2 tusks (tusks are special teeth) | trunked or tusked animal |
| many-fangs | 5 / 5 | small pointy fangs (the hard board) | long-jaw reptile |
| mixed-fangs | 4 / 4 | corner fangs + squares | big cat |

Pick any 6 original animals that map onto these classes 1:1.

### C-4. Tooth skin states (normalized 100x140 box, crown toward y=0)
Shapes: `square`, `buck`, `molar`, `fang`, `tusk`.
States per shape: `clean` (base), `plaque-1/2/3` (light film to heavy
crust, erased in 3 brush stages), `debris-anchor` (marked attach point
for food sprites), `cavity-hole` (dark decay blotch + cracks),
`cavity-drilled` (clean exposed hole), `cavity-filled` (bright patch +
glint), `chip-tri` / `chip-square` / `chip-round` (notch cut from a
biting corner, 3 puzzle silhouettes) each in `broken` (jagged cracks) /
`smoothed` / `repaired` (white piece + visible seam), `rotten` (whole
tooth sickly and cracked), `socket` (empty gum hole after extraction),
`implant` (extra-white + glint). Plus the 3 loose puzzle PIECES matching
the 3 notch silhouettes. All overlays registered to the clean base.

### C-5. Lobby cards and celebration
Lobby: 2-column card grid, card approx 160x190; the closed-mouth portrait
must read at 140px tall. Celebration: closed-mouth happy face at approx
300px; the smile shows a row of teeth with individual glints (the "after"
reveal).

---

## PART D. ANIMATION FLOW SPEC (timings the motion must hit)

### D-1. Ambient (always running)
| What | Motion | Timing |
|---|---|---|
| Patient breathing | scale 1 to 1.02 from chest anchor | 2.6s ease-in-out loop |
| Blink | eyes squash shut | every 3 to 5s, 120ms |
| Germ idle | bob 3px + occasional cheeky 10 degree tilt | 1.3s loop |
| Stink cloud | drift up 4px, waves wiggle | 2.2s loop |
| Active tool in tray | bounce -7px + glow pulse behind | 0.9s loop |
| Lamp, plant, props | tiny secondary sway | 4 to 6s loops, subtle |

### D-2. Interaction micro-states
| Event | Motion | Timing |
|---|---|---|
| Tool pickup | scale 1 to 1.25, tilt -8 degrees, lifts above finger | 120ms ease-out |
| Brush work | head oscillation 6px + foam bubbles spawning | 8Hz while moving |
| Drill work | micro-vibration 1px + rotation lines; patient wince ON | continuous while held |
| Spray work | fan of 3 to 5 droplets per 100ms, arcing down | continuous |
| Forceps work | target tooth rocks 5 degrees (4Hz), stretches +10% vertically near the end | builds over 1.1s hold |
| Tooth pops out | flies up and off in an arc, spinning 220 degrees | 900ms ease-in |
| Debris plucked | item pops off, star burst at point | 350ms |
| Germ zapped | squeeze + poof cloud + dizzy stars | 400ms |
| Wrong piece or inert tool | shake 6px x3 + brief puzzled look | 450ms |
| Any fix lands | the fixed element pops 0 to 112% to 100% | 350ms spring |
| Tooth fully healthy | 4-point sparkle: scale 0 to 125% to 0, fade | 800ms |

### D-3. Sequence choreography
| Moment | Sequence |
|---|---|
| Patient intro | hop or walk into chair 600ms, settle squash, mouth opens 400ms ease-out, first tool starts bouncing |
| Step complete | chime; label pill swaps (slide-up 200ms); patient 700ms relief face; next tool bounces x3 emphasized |
| Patient complete | mouth closes 300ms, beat 200ms, giant smile with glint sweep left to right 600ms, confetti starts + 3 stars stagger in (300ms apart, spring) + bounce-dance loop 900ms, CTA slides up |
| Eyes during play | pupils track the dragged tool (offset toward pointer, max 4px); the patient watches you work |
| Wince | in 150ms, hold while cause persists, out 200ms |

### D-4. Feel rules
Everything eases (no linear motion on hero elements); successes
overshoot; failures are soft (shake and bounce-back, never red flashes or
harsh signals); nothing on screen is ever 100% static; one focal
animation at a time, with ambient motion staying under about 3px so it
never competes with the child's task.

---

## PART E. ACCEPTANCE AND INTEGRATION

On receipt, the layers are converted to WebP, cropped, and wired into the
existing React engine (the studio's standard vendoring pipeline): screens
become components, eyes become state-toggled layers, tooth skins feed the
programmatic Tooth renderer, tools and problems drop into the tray and
particle systems, and the compositor CSS keyframes are lifted into the
app stylesheet.

Acceptance checks:
1. Stage renders at 360px width with no horizontal crop of critical
   elements; total per-scene image weight reasonable for a 4 to 6 year
   old budget Android (target under 6 MB of PNG per animal scene before
   WebP conversion).
2. Real transparency everywhere; layer stacking in the compositors
   matches B-3 z-order with zero visible seams or misregistration.
3. Tooth state overlays register perfectly over the clean base across
   all 5 shapes.
4. Every animated element follows the wrapper rule; every part carries
   its `data-part`; expressions carry `data-expr`; pivots in
   `meta/animals.json` match the `transform-origin` values used.
5. Problem colors appear nowhere except problem elements.
6. Each animal passes the thumbnail test (recognizable at 80px) and the
   eye test (expression readable at arm's length on a phone).
7. No game logic, no libraries, no animation JS, no `<filter>` in any
   inline SVG FX.
