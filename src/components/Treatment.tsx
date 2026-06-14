import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
} from 'react';
import type {
  AnimalSpec,
  PuzzleShape,
  ToolId,
  ToothState,
  Visit,
} from '../game/types';
import { initTeeth, stepDone, toothDoneForTool, toothHealthy } from '../game/engine';
import { computeToothLayout, Mouth, MOUTH_CX, MOUTH_CY, MOUTH_RX, MOUTH_RY } from './Mouth';
import { AnimalFace, type Expression } from './AnimalFace';
import { ToolSprite, PuzzlePiece } from './tools';
import { TOOTH_ART, BACKGROUNDS } from '../game/assets';
import { buzz } from '../lib/haptics';
import * as sfx from '../lib/sfx';

const VB_W = 360;
const VB_H = 560;
const TRAY_Y = 500;

/* The dragged tool sprite is drawn at translate(x, y-34) scale(1.25) with the tool
   art's WORKING END at the top of the sprite, so the part that visually touches a
   tooth sits ~56px ABOVE the cursor. Hit-test at that contact point so the tool
   acts (and the tooth flares) exactly where the tip looks like it's touching. */
const TOOL_TIP_DY = -56;

/* ---- Step 4: progressive tool work ----
   A tool never clears a problem instantly. While its tip is held/scrubbed over a
   live target, a per-tooth WORK METER (0..1, in meterRef) fills by TICK_MS/ms each
   tick; the problem overlay fades (opacity = 1 - meter, set imperatively on the
   tooth's [data-fx-problem] group), particles spawn, and a haptic ticks. At 1 the
   problem clears and the tooth advances its state (the only React re-render). The
   meter persists across pauses (pause-never-reset). Feel mirrors the reference
   demos assets/scrub-demo.html (brush) and assets/drill-demo.html (drill). */
const TICK_MS = 85;
const FX_CAP = 15; // max live particles (old-Android budget)

type FxKind = 'bubble' | 'spark' | 'debris' | 'poof' | 'gloop' | 'pop' | 'water' | 'toothfly';

interface ToolFeel {
  ms: number; // time to fully clear one problem
  particle: FxKind | FxKind[];
  fxEvery: number; // spawn particles every Nth tick (particle-rate knob)
  vibTick: number | number[]; // per-tick haptic
  vibDone: number; // completion haptic
  judder?: boolean; // shake the tooth while working (drill / pull)
  wince?: boolean; // patient winces while working
}

/** Per-tool tunable feel. Durations, particle kind/rate, and vibrate patterns. */
const TOOL_FEEL: Partial<Record<ToolId, ToolFeel>> = {
  tweezers: { ms: 520, particle: 'pop', fxEvery: 1, vibTick: 12, vibDone: 30 },
  brush: { ms: 820, particle: 'bubble', fxEvery: 1, vibTick: 15, vibDone: 25 },
  germspray: { ms: 640, particle: 'poof', fxEvery: 1, vibTick: 14, vibDone: 25 },
  drill: { ms: 1000, particle: ['spark', 'debris'], fxEvery: 1, vibTick: [12, 8], vibDone: 40, judder: true, wince: true },
  filler: { ms: 720, particle: 'gloop', fxEvery: 1, vibTick: 12, vibDone: 35 },
  forceps: { ms: 1100, particle: ['spark', 'debris'], fxEvery: 1, vibTick: [10, 10], vibDone: 40, judder: true, wince: true },
};

type DragKind =
  | { kind: 'tool' }
  | { kind: 'piece'; shape: PuzzleShape; slot: number }
  | null;

const SVGNS = 'http://www.w3.org/2000/svg';

export function Treatment({
  visit,
  spec,
  onHome,
  onComplete,
}: {
  visit: Visit;
  spec: AnimalSpec;
  onHome: () => void;
  onComplete: () => void;
}) {
  const layout = useMemo(() => computeToothLayout(spec), [spec]);
  const steps = visit.steps;

  const [teeth, setTeeth] = useState<ToothState[]>(() =>
    initTeeth(spec.mouth, visit.problems)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [mouthProgress, setMouthProgress] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [expr, setExpr] = useState<Expression>('open');
  const [drag, setDrag] = useState<DragKind>(null);
  const [shakingPiece, setShakingPiece] = useState<number | null>(null);
  const [stinkGone, setStinkGone] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [doneSteps, setDoneSteps] = useState(0);
  // tooth under the tool tip + a valid target — flares immediately on hover.
  const [contactTooth, setContactTooth] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragGRef = useRef<SVGGElement>(null);
  const fxLayerRef = useRef<SVGGElement>(null);
  const fxNodesRef = useRef<SVGGElement[]>([]);
  const teethRef = useRef(teeth);
  const draggingRef = useRef<DragKind>(null);
  const lastPtRef = useRef({ x: 0, y: 0 });
  const meterRef = useRef(new Map<number, number>()); // per-tooth work meter 0..1
  const tickCountRef = useRef(0);
  const judderRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const throttleRef = useRef(new Map<string, number>());
  const transitioningRef = useRef(false);
  const lastActRef = useRef(Date.now());
  const revealedRef = useRef(revealed);
  const contactToothRef = useRef<number | null>(null);

  useEffect(() => {
    teethRef.current = teeth;
  }, [teeth]);
  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  const step = steps[stepIndex];

  const problemTeeth = useMemo(() => {
    const s = new Set<number>();
    visit.problems.forEach((p) => {
      if (p.kind !== 'stink') s.add(p.toothIndex);
    });
    return s;
  }, [visit]);

  const hasStink = useMemo(
    () => visit.problems.some((p) => p.kind === 'stink'),
    [visit]
  );

  const puzzleShapes = useMemo<PuzzleShape[]>(() => {
    const all: PuzzleShape[] = ['tri', 'square', 'round'];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
    // re-shuffle each time we enter a new step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  /* ---------- helpers ---------- */

  function svgPoint(e: { clientX: number; clientY: number }) {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const scale = Math.min(r.width / VB_W, r.height / VB_H);
    const ox = (r.width - VB_W * scale) / 2;
    const oy = (r.height - VB_H * scale) / 2;
    return {
      x: (e.clientX - r.left - ox) / scale,
      y: (e.clientY - r.top - oy) / scale,
    };
  }

  function toothAt(x: number, y: number): number | null {
    let best: number | null = null;
    let bestD = Infinity;
    for (const p of layout) {
      const d = Math.hypot(x - p.cx, y - p.cy);
      if (d < Math.max(p.w, p.h) * 0.72 + 12 && d < bestD) {
        bestD = d;
        best = p.index;
      }
    }
    return best;
  }

  function inMouth(x: number, y: number) {
    const nx = (x - MOUTH_CX) / (MOUTH_RX + 16);
    const ny = (y - MOUTH_CY) / (MOUTH_RY + 16);
    return nx * nx + ny * ny <= 1;
  }

  /** Can this tool still work this tooth? */
  function readyFor(tool: ToolId, t: ToothState): boolean {
    switch (tool) {
      case 'tweezers':
        return !!t.debris;
      case 'brush':
        return t.plaque > 0.02;
      case 'germspray':
        return t.germ;
      case 'drill':
        return t.cavity === 'hole' || t.chip === 'broken';
      case 'filler':
        return t.cavity === 'drilled';
      case 'forceps':
        return t.rot === 'rotten';
      default:
        return false;
    }
  }

  /** Is this tooth a still-needs-this-tool target for the active step? */
  function isLiveTarget(i: number): boolean {
    if (!step) return false;
    if (step.tool === 'magnifier') {
      return problemTeeth.has(i) && !revealedRef.current.has(i);
    }
    return step.targets.includes(i) && !toothDoneForTool(teethRef.current[i], step.tool);
  }

  function setContact(i: number | null) {
    if (contactToothRef.current === i) return;
    contactToothRef.current = i;
    setContactTooth(i);
  }

  function throttled(key: string, ms: number): boolean {
    const now = Date.now();
    const last = throttleRef.current.get(key) ?? 0;
    if (now - last < ms) return false;
    throttleRef.current.set(key, now);
    return true;
  }

  /* ---------- imperative particle layer (no React re-render per spawn) ---------- */

  function spawnFx(kind: FxKind, sx: number, sy: number) {
    const layer = fxLayerRef.current;
    if (!layer) return;
    while (fxNodesRef.current.length >= FX_CAP) fxNodesRef.current.shift()?.remove();

    const wrap = document.createElementNS(SVGNS, 'g');
    wrap.setAttribute('transform', `translate(${sx.toFixed(1)},${sy.toFixed(1)})`);
    wrap.setAttribute('pointer-events', 'none');

    const ang = Math.random() * Math.PI * 2;
    const spd = 16 + Math.random() * 26;
    const dx = Math.cos(ang) * spd;
    const dy = Math.sin(ang) * spd - 6;

    const circle = (r: number, fill: string, op = '1') => {
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('r', String(r));
      c.setAttribute('fill', fill);
      c.setAttribute('opacity', op);
      return c as SVGElement;
    };

    let inner: SVGElement;
    let cls = '';
    let life = 700;
    switch (kind) {
      case 'bubble':
        inner = circle(4 + Math.random() * 7, '#ffffff', '0.85');
        cls = 'zd-fx-bubble';
        life = 1000;
        break;
      case 'spark':
        inner = circle(3.4, '#ffd23f');
        cls = 'zd-fx-drift';
        life = 640;
        break;
      case 'debris': {
        const r = document.createElementNS(SVGNS, 'rect');
        r.setAttribute('x', '-3');
        r.setAttribute('y', '-3');
        r.setAttribute('width', '6');
        r.setAttribute('height', '6');
        r.setAttribute('rx', '1.5');
        r.setAttribute('fill', '#b5712f');
        inner = r;
        cls = 'zd-fx-drift';
        life = 640;
        break;
      }
      case 'poof':
        inner = circle(9, '#e3ecef', '0.85');
        cls = 'zd-fx-poof';
        life = 560;
        break;
      case 'gloop':
        inner = circle(5, '#bfe3ff', '0.95');
        cls = 'zd-fx-drift';
        life = 600;
        break;
      case 'pop':
        inner = circle(5, '#ffe066');
        cls = 'zd-fx-poof';
        life = 560;
        break;
      case 'water': {
        const e = document.createElementNS(SVGNS, 'ellipse');
        e.setAttribute('rx', '4');
        e.setAttribute('ry', '6');
        e.setAttribute('fill', '#6fc9ec');
        inner = e;
        cls = 'zd-fx-water';
        life = 720;
        break;
      }
      case 'toothfly': {
        const im = document.createElementNS(SVGNS, 'image');
        im.setAttribute('href', TOOTH_ART.clean);
        im.setAttribute('x', '-14');
        im.setAttribute('y', '-17');
        im.setAttribute('width', '28');
        im.setAttribute('height', '34');
        im.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        inner = im;
        cls = 'zd-fx-toothfly';
        life = 900;
        break;
      }
      default:
        return;
    }

    inner.style.setProperty('--dx', `${dx.toFixed(0)}px`);
    inner.style.setProperty('--dy', `${(kind === 'gloop' ? 14 : dy).toFixed(0)}px`);
    inner.setAttribute('class', `zd-fx ${cls}`);
    wrap.appendChild(inner);
    layer.appendChild(wrap);
    fxNodesRef.current.push(wrap);
    window.setTimeout(() => {
      wrap.remove();
      const idx = fxNodesRef.current.indexOf(wrap);
      if (idx >= 0) fxNodesRef.current.splice(idx, 1);
    }, life);
  }

  function emitFx(particle: FxKind | FxKind[], x: number, y: number) {
    if (Array.isArray(particle)) particle.forEach((k) => spawnFx(k, x, y));
    else spawnFx(particle, x, y);
  }

  /* ---------- imperative tooth feedback (fade overlay / judder) ---------- */

  function problemEl(i: number): SVGGElement | null {
    return (svgRef.current?.querySelector(
      `[data-tooth="${i}"] [data-fx-problem]`
    ) as SVGGElement | null) ?? null;
  }
  function fadeProblem(i: number, op: number) {
    const el = problemEl(i);
    if (el) el.style.opacity = String(Math.max(0, op));
  }
  function clearFade(i: number) {
    const el = problemEl(i);
    if (el) el.style.opacity = '';
  }
  function setJudder(i: number | null) {
    if (judderRef.current === i) return;
    if (judderRef.current !== null) {
      svgRef.current
        ?.querySelector(`[data-tooth="${judderRef.current}"] [data-fx-body]`)
        ?.classList.remove('zd-judder');
    }
    if (i !== null) {
      svgRef.current
        ?.querySelector(`[data-tooth="${i}"] [data-fx-body]`)
        ?.classList.add('zd-judder');
    }
    judderRef.current = i;
  }

  function updateTooth(idx: number, fn: (t: ToothState) => void) {
    const prev = teethRef.current;
    const t = { ...prev[idx] };
    const wasHealthy = toothHealthy(prev[idx]);
    fn(t);
    const next = [...prev];
    next[idx] = t;
    if (!wasHealthy && toothHealthy(t)) {
      t.sparkle = true;
      sfx.sparkle();
      window.setTimeout(() => {
        const cur = teethRef.current;
        if (cur[idx]?.sparkle) {
          const n2 = [...cur];
          n2[idx] = { ...cur[idx], sparkle: false };
          teethRef.current = n2;
          setTeeth(n2);
        }
      }, 800);
    }
    teethRef.current = next;
    setTeeth(next);
  }

  /** Reveal any problem teeth within the lens, with a pop + light buzz. */
  function revealNear(x: number, y: number) {
    const next = new Set(revealedRef.current);
    let any = false;
    problemTeeth.forEach((i) => {
      if (next.has(i)) return;
      const p = layout[i];
      if (Math.hypot(x - p.cx, y - p.cy) < 62) {
        next.add(i);
        any = true;
        spawnFx('pop', p.cx, p.cy);
      }
    });
    if (any) {
      revealedRef.current = next;
      setRevealed(next);
      sfx.pop();
      buzz(10);
    }
  }

  /* ---------- interactions ---------- */

  function handleToolMove(rawX: number, rawY: number, dragKind: DragKind) {
    if (!step || !dragKind) return;
    if (dragKind.kind === 'piece') {
      setContact(null);
      // proximity snap for the matching shape (the piece's center = raw cursor)
      const target = step.targets.find((i) => teethRef.current[i].chip === 'smoothed');
      if (target === undefined) return;
      const p = layout[target];
      if (Math.hypot(rawX - p.cx, rawY - p.cy) < 58) {
        if (dragKind.shape === teethRef.current[target].chipShape) {
          updateTooth(target, (t) => {
            t.chip = 'repaired';
          });
          sfx.ding();
          buzz(25);
          spawnFx('pop', p.cx, p.cy);
          endDrag();
        }
      }
      return;
    }

    // hit-test at the tool's visible business end
    const x = rawX;
    const y = rawY + TOOL_TIP_DY;
    const over = toothAt(x, y);
    setContact(over !== null && isLiveTarget(over) ? over : null);

    if (step.tool === 'magnifier') {
      revealNear(x, y);
      return;
    }
    if (step.tool === 'implant') {
      const target = step.targets.find((i) => teethRef.current[i].rot === 'gone');
      if (target === undefined) return;
      const p = layout[target];
      if (Math.hypot(x - p.cx, y - p.cy) < 60) {
        updateTooth(target, (t) => {
          t.rot = 'implanted';
        });
        sfx.ding();
        buzz(25);
        spawnFx('pop', p.cx, p.cy);
        endDrag();
      }
      return;
    }
    // brush / tweezers / germspray / drill / filler / forceps fill their meter in the tick
  }

  /** ~85ms loop while a tool is held: fills the work meter (refs only), fades the
   *  problem, spawns particles + haptics; advances the tooth state on completion. */
  function workTick() {
    const dragKind = draggingRef.current;
    if (!dragKind || dragKind.kind !== 'tool' || !step) return;
    const x = lastPtRef.current.x;
    const y = lastPtRef.current.y + TOOL_TIP_DY;
    tickCountRef.current++;

    const over = toothAt(x, y);
    setContact(over !== null && isLiveTarget(over) ? over : null);

    if (step.tool === 'magnifier') {
      revealNear(x, y);
      return;
    }

    if (step.tool === 'sprayer' || step.tool === 'mouthwash') {
      if (inMouth(x, y)) {
        setMouthProgress((p) => Math.min(1, p + 0.04));
        if (throttled('sp', 350)) sfx.spray();
        if (throttled('wp', 150)) {
          spawnFx('water', MOUTH_CX + (Math.random() - 0.5) * 180, MOUTH_CY - 30 + Math.random() * 60);
        }
        if (throttled('vb', 200)) buzz(8);
      }
      return;
    }

    if (step.tool === 'implant') return; // placed on move (snap)

    const feel = TOOL_FEEL[step.tool];
    if (!feel) return;
    const i = over;
    const onTarget = i !== null && step.targets.includes(i) && readyFor(step.tool, teethRef.current[i]);
    if (!onTarget) {
      if (feel.wince) setExpr('open');
      setJudder(null);
      return;
    }

    // fill the meter — refs only, no React state per tick
    const m = Math.min(1, (meterRef.current.get(i) ?? 0) + TICK_MS / feel.ms);
    meterRef.current.set(i, m);
    fadeProblem(i, 1 - m);
    if (tickCountRef.current % feel.fxEvery === 0) emitFx(feel.particle, layout[i].cx, layout[i].cy);
    buzz(feel.vibTick);
    if (feel.judder) setJudder(i);
    if (feel.wince) setExpr('wince');
    if (throttled('w' + step.tool, 300)) toolSound(step.tool);

    if (m >= 1) {
      meterRef.current.set(i, 0);
      clearFade(i);
      setJudder(null);
      if (feel.wince) setExpr('open');
      buzz(feel.vibDone);
      applyWork(step.tool, i);
    }
  }

  function toolSound(tool: ToolId) {
    ({
      tweezers: sfx.pop,
      brush: sfx.brush,
      germspray: sfx.spray,
      drill: sfx.drill,
      filler: sfx.squish,
      forceps: sfx.creak,
    } as Partial<Record<ToolId, () => void>>)[tool]?.();
  }

  function applyWork(tool: ToolId, i: number) {
    switch (tool) {
      case 'tweezers':
        updateTooth(i, (t) => {
          t.debris = null;
        });
        break;
      case 'brush':
        updateTooth(i, (t) => {
          t.plaque = 0;
        });
        break;
      case 'germspray':
        updateTooth(i, (t) => {
          t.germ = false;
        });
        break;
      case 'drill':
        updateTooth(i, (t) => {
          if (t.cavity === 'hole') t.cavity = 'drilled';
          else if (t.chip === 'broken') t.chip = 'smoothed';
        });
        break;
      case 'filler':
        updateTooth(i, (t) => {
          t.cavity = 'filled';
        });
        break;
      case 'forceps':
        updateTooth(i, (t) => {
          t.rot = 'gone';
        });
        sfx.pull();
        spawnFx('toothfly', layout[i].cx, layout[i].cy);
        break;
    }
  }

  /* ---------- drag lifecycle ---------- */

  function startDrag(kind: NonNullable<DragKind>, x: number, y: number) {
    draggingRef.current = kind;
    setDrag(kind);
    lastPtRef.current = { x, y };
    moveDragSprite(x, y);
    if (tickRef.current === null) {
      tickRef.current = window.setInterval(workTick, TICK_MS);
    }
  }

  function endDrag() {
    draggingRef.current = null;
    setDrag(null);
    setContact(null);
    setJudder(null);
    setExpr('open');
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (dragGRef.current) dragGRef.current.style.display = 'none';
  }

  useEffect(() => () => endDrag(), []); // cleanup on unmount

  function moveDragSprite(x: number, y: number) {
    const g = dragGRef.current;
    if (g) {
      g.style.display = 'block';
      g.setAttribute('transform', `translate(${x},${y - 34}) scale(1.25)`);
    }
  }

  /* ---------- tray geometry ---------- */

  const trayItems = useMemo(() => {
    if (!step) return [];
    if (step.tool === 'puzzle') {
      return puzzleShapes.map((shape, i) => ({
        key: `piece-${shape}`,
        piece: shape as PuzzleShape | undefined,
        tool: undefined as ToolId | undefined,
        active: true,
        slot: i,
      }));
    }
    const toolList = steps.map((s) => s.tool);
    const lo = Math.max(0, stepIndex - 1);
    const hi = Math.min(toolList.length - 1, stepIndex + 3);
    const window_ = [];
    for (let i = lo; i <= hi; i++) {
      window_.push({
        key: `tool-${i}`,
        piece: undefined as PuzzleShape | undefined,
        tool: toolList[i] === 'puzzle' ? undefined : toolList[i],
        active: i === stepIndex,
        slot: window_.length,
      });
    }
    return window_.filter((w) => w.tool !== undefined || w.piece !== undefined);
  }, [step, stepIndex, steps, puzzleShapes]);

  const slotX = (slot: number, count: number) =>
    VB_W / 2 + (slot - (count - 1) / 2) * Math.min(72, 330 / Math.max(1, count));

  /* ---------- pointer events ---------- */

  function onPointerDown(e: RPointerEvent<SVGSVGElement>) {
    lastActRef.current = Date.now();
    setHintOn(false);
    const pt = svgPoint(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    const count = trayItems.length;
    for (const item of trayItems) {
      const x = slotX(item.slot, count);
      if (Math.hypot(pt.x - x, pt.y - TRAY_Y) < 34) {
        if (item.piece) {
          startDrag({ kind: 'piece', shape: item.piece, slot: item.slot }, pt.x, pt.y);
          sfx.pop();
        } else if (item.active) {
          startDrag({ kind: 'tool' }, pt.x, pt.y);
          sfx.pop();
        } else {
          sfx.uhoh(); // inert tool — gentle nudge, nothing happens
        }
        return;
      }
    }
  }

  function onPointerMove(e: RPointerEvent<SVGSVGElement>) {
    const dragKind = draggingRef.current;
    if (!dragKind) return;
    const pt = svgPoint(e);
    lastPtRef.current = pt;
    moveDragSprite(pt.x, pt.y);
    handleToolMove(pt.x, pt.y, dragKind);
  }

  function onPointerUp() {
    lastActRef.current = Date.now();
    const dragKind = draggingRef.current;
    if (dragKind?.kind === 'piece' && step) {
      const target = step.targets.find((i) => teethRef.current[i].chip === 'smoothed');
      if (target !== undefined) {
        const p = layout[target];
        const { x, y } = lastPtRef.current;
        if (
          Math.hypot(x - p.cx, y - p.cy) < 90 &&
          dragKind.shape !== teethRef.current[target].chipShape
        ) {
          sfx.uhoh();
          setShakingPiece(dragKind.slot);
          window.setTimeout(() => setShakingPiece(null), 500);
        }
      }
    }
    endDrag();
  }

  /* ---------- step advancement ---------- */

  useEffect(() => {
    if (!step || transitioningRef.current) return;
    const prog =
      step.tool === 'magnifier'
        ? problemTeeth.size === 0
          ? 1
          : revealed.size / problemTeeth.size
        : mouthProgress;
    if (!stepDone(step, teeth, prog)) return;

    transitioningRef.current = true;
    endDrag();
    sfx.ding();
    setExpr('happy');
    setDoneSteps(stepIndex + 1);
    if (step.tool === 'mouthwash') setStinkGone(true);
    const last = stepIndex + 1 >= steps.length;
    window.setTimeout(() => {
      if (last) {
        sfx.fanfare();
        window.setTimeout(onComplete, 700);
      } else {
        setStepIndex((i) => i + 1);
        setMouthProgress(0);
        setExpr('open');
        meterRef.current.clear();
        transitioningRef.current = false;
      }
    }, 750);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teeth, revealed, mouthProgress, stepIndex]);

  /* ---------- idle hint ---------- */

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() - lastActRef.current > 7000) setHintOn(true);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  /* ---------- render ---------- */

  const targetSet = useMemo(() => {
    if (!step) return new Set<number>();
    if (step.tool === 'magnifier') {
      return new Set([...problemTeeth].filter((i) => !revealed.has(i)));
    }
    return new Set(step.targets.filter((i) => !toothDoneForTool(teeth[i], step.tool)));
  }, [step, teeth, revealed, problemTeeth]);

  const wholeMouthStep =
    step && (step.tool === 'sprayer' || step.tool === 'mouthwash' || step.tool === 'magnifier');
  const wholeProg =
    step?.tool === 'magnifier'
      ? problemTeeth.size === 0
        ? 1
        : revealed.size / problemTeeth.size
      : mouthProgress;

  const stinkOpacity = !hasStink || stinkGone
    ? 0
    : step?.tool === 'mouthwash'
      ? Math.max(0, 1 - mouthProgress)
      : 1;

  const trayCount = trayItems.length;

  return (
    <div
      className="zd-screen zd-treat"
      style={{ backgroundImage: `url(${BACKGROUNDS.treatment})` }}
    >
      <header className="zd-hud">
        <button className="zd-home" onClick={onHome} aria-label="Home">
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path
              d="M3 11 L12 3 L21 11 V21 H14 V15 H10 V21 H3 Z"
              fill="#fff"
              stroke="#1d3557"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="zd-steplabel">{step?.label ?? ''}</div>
        <div className="zd-stars">
          {steps.map((_, i) => (
            <span key={i} className={i < doneSteps ? 'zd-dot on' : 'zd-dot'} />
          ))}
        </div>
      </header>

      {wholeMouthStep && (
        <div className="zd-progress">
          <div className="zd-progress-fill" style={{ width: `${Math.round(wholeProg * 100)}%` }} />
        </div>
      )}

      <svg
        ref={svgRef}
        className="zd-scene"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* treatment-room.webp is the fixed CSS back layer; the SVG composites the
            patient + mouth on top. A small CSS nudge stands in for the wince. */}
        <g className={expr === 'wince' ? 'zd-wince' : undefined}>
          <AnimalFace spec={spec} expr={expr} mouthOpen />
        </g>
        <Mouth
          spec={spec}
          teeth={teeth}
          layout={layout}
          revealed={revealed}
          targetTeeth={targetSet}
          stinkOpacity={stinkOpacity}
        />

        {/* on-contact flare: a pulsing ring on the tooth the tool tip is over. */}
        {contactTooth !== null && layout[contactTooth] && (
          <g transform={`translate(${layout[contactTooth].cx},${layout[contactTooth].cy})`}>
            <g className="zd-flare">
              <circle r={layout[contactTooth].w * 0.6} fill="#fff2a8" opacity="0.55" />
              <circle r={layout[contactTooth].w * 0.6} fill="none" stroke="#ffd23f" strokeWidth="4" opacity="0.95" />
            </g>
          </g>
        )}

        {/* imperative particle layer (work bubbles/sparks/debris/etc.) */}
        <g ref={fxLayerRef} pointerEvents="none" />

        {/* tool tray */}
        <rect x="8" y={TRAY_Y - 44} width={VB_W - 16} height="96" rx="20" fill="#fff" stroke="#1d3557" strokeWidth="3" />
        {trayItems.map((item) => {
          const x = slotX(item.slot, trayCount);
          const isDraggedPiece = drag?.kind === 'piece' && item.piece === drag.shape;
          return (
            <g
              key={item.key}
              transform={`translate(${x},${TRAY_Y})`}
              opacity={item.active ? (isDraggedPiece || (drag?.kind === 'tool' && !item.piece && item.active) ? 0.25 : 1) : 0.3}
            >
              <g
                className={[
                  item.active && !drag ? 'zd-bounce' : '',
                  shakingPiece === item.slot ? 'zd-shake' : '',
                ].join(' ')}
              >
                {item.active && !drag && <circle r="30" fill="#ffe066" opacity="0.55" />}
                {item.piece ? (
                  <PuzzlePiece shape={item.piece} />
                ) : (
                  item.tool && <ToolSprite tool={item.tool} />
                )}
              </g>
            </g>
          );
        })}

        {/* hint arrow: bounces from active tool up toward the mouth */}
        {hintOn && step && (
          <g transform={`translate(${slotX(Math.max(0, trayItems.findIndex((t) => t.active)), trayCount)},${TRAY_Y - 64})`}>
            <g className="zd-hintarrow">
              <path d="M0,-26 L14,0 L5,0 L5,18 L-5,18 L-5,0 L-14,0 Z" fill="#ff7bac" stroke="#1d3557" strokeWidth="2.5" strokeLinejoin="round" />
            </g>
          </g>
        )}

        {/* dragged tool sprite (moved imperatively) */}
        <g ref={dragGRef} style={{ display: 'none', pointerEvents: 'none' }}>
          {drag?.kind === 'piece' ? (
            <PuzzlePiece shape={drag.shape} />
          ) : (
            step && step.tool !== 'puzzle' && <ToolSprite tool={step.tool} />
          )}
        </g>
      </svg>
    </div>
  );
}
