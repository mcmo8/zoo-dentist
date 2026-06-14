# Zoo Smiles — Animal Dentist (original-art clone of the Zoo Dental Care genre)

Date: 2026-06-10. Built from three sub-agent research reports (gameplay mechanics,
visual inventory, level design) on "Zoo Dental Care: Doctor Dentist" (Remy Games)
and its template family (BabyBus Dental Care, Yovo, Bubadu, PSV).

## Thesis

Recreate the mechanics and feel of the animal-dentist genre with 100% original
art, names, and code. Remove everything the commercial versions monetize with:
no ads, no subscription locks, no tracking, fully offline PWA. Target: Mike's
kids' old Android phones (360px width, weak GPU).

## What the research locked in

- **On-rails treatment**: one active tool per step, fixed dental order,
  auto-advance, no fail state, no timers. The child can never hurt the patient.
- **Problems are discrete sprites on specific teeth** (debris, plaque layer,
  germ characters, cavity hole, chipped corner, rotten tooth, stink cloud).
- **Five gesture primitives**: tap, drag-from-tray, scrub (distance
  accumulation), dwell (pause-don't-reset), pluck/pull, drag-to-socket snap
  with generous radius.
- **The animal IS the level**: mouth geometry = board layout (bunny tiny mouth,
  croc many small fangs), signature ailments per animal, eyes visible above the
  mouth reacting the whole time.
- **Teach linear, retain free-choice**: scripted first visits introduce one
  mechanic each; afterwards the roster opens and problems re-roll per visit,
  weighted toward each animal's signature.
- **Celebrate everything**: per-tooth sparkle, star/confetti finish, smile
  reveal. Every chain ends on a beauty beat, never on the scary step.

## Scope (v1)

**Roster (6 original animals)** and scripted teaching curve:

| # | Animal | Mouth board | Scripted visit | New mechanic |
|---|---|---|---|---|
| 1 | Pip the Bunny | 6 big teeth, 2 buck incisors | 3 stuck food bits | Core loop: magnifier → rinse → tweezers |
| 2 | Momo the Monkey | 8 midsize teeth | 4 plaque teeth + stinky breath | Brush scrub meter; mouthwash closer |
| 3 | Hugo the Hippo | 6 giant molars/tusks | 2 sugar bugs + 2 debris | Germ-zap; first 2-problem visit |
| 4 | Ella the Elephant | 6 teeth incl. 2 tusks | 1 cavity + 2 plaque | Repair chain: drill → fill |
| 5 | Snappy the Croc | 10 small fangs | 1 chipped fang + 2 debris | Shape-matching repair puzzle |
| 6 | Leo the Lion | 8 teeth incl. 4 fangs | 1 rotten tooth + plaque + germ | Extraction: wiggle → pull → implant |

After visit 6: lobby opens to free choice forever; each visit re-rolls problem
families and teeth, weighted to the animal's signature, scaling problem count
with total visits. (Matches genre replay model.)

**Tools (v1)**: magnifier, water sprayer, tweezers, toothbrush, drill,
germ spray, filler goo, shape-puzzle pieces, forceps, implant tooth, mouthwash.
**Deferred to v2**: braces chain, whitening, tartar scraper, X-ray, comfort-tap
for nervous patients, sticker album, clinic decoration meta.

## Architecture

- `src/game/types.ts` — model (done). `src/game/engine.ts` — pure step
  rail + completion logic (done). `src/game/animals.ts` — specs.
  `src/game/levels.ts` — scripted plans + random roll.
- `src/components/` — `AnimalFace` (original SVG heads, expression prop),
  `Mouth` (gums/tongue/teeth arcs + problem overlays), `Tooth` (shape + state
  visuals), `ToolTray`, `Treatment` (pointer controller), `Title`, `Lobby`,
  `Celebrate`, `Confetti`.
- `src/lib/sfx.ts` — Web Audio synth (done, zero files). `src/lib/storage.ts` —
  localStorage save `{treated, totalVisits, muted}`.
- One pointer-event controller on the treatment screen; dragged tool rendered
  in-SVG, moved via ref (no per-move React re-render). Particles capped, CSS
  animations only. No canvas, no WebGL — old-Android safe.

## Art direction (original)

Chunky ink outlines (`#1d3557`) + soft gradient fills — the BashCam Shape
Builder look, which nothing in this genre uses (they're all outline-light flat
vector). Mint/sky clinic palette; the only ugly colors on screen belong to the
problems (browns/greens) so cleaning visibly restores the scene. Original germ
design ("sugar bugs": round green/purple blobs, two teeth, tiny spoon — no
resemblance to BabyBus tooth moths). Original animal cast, no panda.

## Out of scope / removed by design

Ads, IAP, subscriptions, tracking, rate-us nags, "more games" links, padlock
badges, timers, fail states, scores.

## Shipped state (June 13, 2026) — deviations from the v1 plan above

Shipped to production (`mcmo8/zoo-dentist`, Vercel auto-deploy on `main`). The
research-locked design above is intact at the mechanics layer; the following
evolved during the connector-art build and are the current truth:

- **Free play is the default, not scripted-first-6.** A fresh game opens with
  every seated patient tappable in any order — no scripted lock. The teaching
  value is retained per-animal: the FIRST treatment of each animal still uses its
  scripted one-mechanic intro (`levels.ts`, `treatedBefore === 0`); repeats roll.
  The scripted-order mechanism (`nextScripted`/`SCRIPT_ORDER`) is kept in
  `levels.ts` but unused — re-enable by restoring its gating in `Lobby.tsx`.
- **Universal mouth, not per-animal boards.** All 6 patients share ONE uniform
  open-mouth (5 upper + 5 lower teeth); identity is the head behind it. The mouth
  is the artist's layered SVG, inlined in `src/components/mouthArt.tsx` and drawn
  in two passes (interior+lips < teeth < gum ridges) so the gums hide the roots.
  Geometry locked in `assets/mouth-layout.json`; per-animal head fit in
  `AnimalFace.tsx` `HEAD_CALIB`. (The "bunny tiny mouth / croc many fangs" idea
  was dropped — uniform mouth, per-animal head behind it.)
- **Progressive work-meter tools (Step 4).** Every problem tool fills a per-tooth
  meter while held on a live target (refs only, no per-frame re-render); the
  problem fades as it fills, with pooled+capped particles, a drill/pull judder,
  and feature-guarded haptics (`src/lib/haptics.ts`). Per-tool feel constants in
  `Treatment.tsx` `TOOL_FEEL` mirror `assets/scrub-demo.html` + `drill-demo.html`.
- **Lobby = seated waiting room (Step 5b).** Patients sit in the chairs (poses in
  `assets/animals-sit/`); tap a seat to treat. 4 chairs rotate which patients sit
  by visit parity. Layout locked in `assets/lobby-seats.json`. tiger + giraffe
  have seat poses but no mechanics yet (future content; never seated).
- **Art is the connector/ChatGPT flat vivid set**, not the originally-planned
  gradient "Shape Builder" look. Animals/tools = SVG, teeth/effects/backgrounds =
  WebP; originals of the recolored set in `assets/_orig/`, raw sources in `images/`.
- **Tuner-first workflow** (Mike's standing instruction): for any visual-fit task,
  build a self-contained slider tuner early — `assets/{mouth,head,lobby}-tuner.html`.
