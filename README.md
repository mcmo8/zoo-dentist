# Zoo Smiles — Animal Dentist

Original-art kids' PWA in the animal-dentist genre (mechanics clone of
"Zoo Dental Care: Doctor Dentist" / BabyBus dental-care template; zero
copied assets, zero ads, zero IAP, fully offline). Ages 3-7, built for
old Android phones (360px width).

## Run

```
npm install
npm run dev       # local dev server (LAN exposed)
npm run build     # production build + PWA service worker -> dist/
npm run preview   # serve the production build
```

## Game

- 6 original animal patients: Pip (bunny), Momo (monkey), Hugo (hippo),
  Ella (elephant), Snappy (croc), Leo (lion).
- First 6 visits are scripted, one new mechanic each (see `docs/DESIGN.md`).
  Afterwards the lobby opens forever with re-rolled problems weighted to each
  animal's signature ailment.
- Tools: magnifier, water spray, tweezers, toothbrush, drill, germ spray,
  filling goo, shape-matched repair piece, forceps, implant, mouthwash.
- On-rails steps, no fail state, no timers. Progress saved in localStorage.
- All sound is synthesized via Web Audio (`src/lib/sfx.ts`) — no audio files.

## Testing

`scripts/smoke.py` (2 visits) and `scripts/smoke_full.py` (all 6 scripted
visits, every mechanic) drive the SVG scene with Playwright:

```
python ../path/to/with_server.py --server "npm run preview -- --port 4173 --strictPort" --port 4173 -- python scripts/smoke_full.py
```

## Deploy

Vercel: push to a GitHub repo, connect, done — `vercel.json` carries the SPA
rewrite + cache headers (sw/manifest no-cache, hashed assets immutable).
