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
import * as sfx from '../lib/sfx';

const VB_W = 360;
const VB_H = 560;
const TRAY_Y = 500;

interface Particle {
  id: number;
  kind: 'foam' | 'water' | 'poof' | 'star' | 'toothfly';
  x: number;
  y: number;
  dx: number;
  dy: number;
}

type DragKind =
  | { kind: 'tool' }
  | { kind: 'piece'; shape: PuzzleShape; slot: number }
  | null;

let particleId = 0;

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
  const [wigglingTooth, setWigglingTooth] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [drag, setDrag] = useState<DragKind>(null);
  const [shakingPiece, setShakingPiece] = useState<number | null>(null);
  const [stinkGone, setStinkGone] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [doneSteps, setDoneSteps] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragGRef = useRef<SVGGElement>(null);
  const teethRef = useRef(teeth);
  const draggingRef = useRef<DragKind>(null);
  const lastPtRef = useRef({ x: 0, y: 0 });
  const accRef = useRef(new Map<number, number>());
  const scrubRef = useRef({ x: 0, y: 0, dist: 0 });
  const tickRef = useRef<number | null>(null);
  const throttleRef = useRef(new Map<string, number>());
  const transitioningRef = useRef(false);
  const lastActRef = useRef(Date.now());
  const revealedRef = useRef(revealed);

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

  function throttled(key: string, ms: number): boolean {
    const now = Date.now();
    const last = throttleRef.current.get(key) ?? 0;
    if (now - last < ms) return false;
    throttleRef.current.set(key, now);
    return true;
  }

  function spawn(kind: Particle['kind'], x: number, y: number) {
    const p: Particle = {
      id: particleId++,
      kind,
      x,
      y,
      dx: (Math.random() - 0.5) * 50,
      dy: kind === 'toothfly' ? -120 : kind === 'water' ? 40 : -45,
    };
    setParticles((prev) => [...prev.slice(-14), p]);
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((q) => q.id !== p.id));
    }, 900);
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

  /* ---------- interactions ---------- */

  function handleToolMove(x: number, y: number, dragKind: DragKind) {
    if (!step || !dragKind) return;
    if (dragKind.kind === 'piece') {
      // proximity snap for the matching shape
      const target = step.targets.find(
        (i) => teethRef.current[i].chip === 'smoothed'
      );
      if (target === undefined) return;
      const p = layout[target];
      if (Math.hypot(x - p.cx, y - p.cy) < 58) {
        if (dragKind.shape === teethRef.current[target].chipShape) {
          updateTooth(target, (t) => {
            t.chip = 'repaired';
          });
          sfx.ding();
          endDrag();
        }
      }
      return;
    }

    switch (step.tool) {
      case 'magnifier': {
        let newly: number[] = [];
        problemTeeth.forEach((i) => {
          if (revealedRef.current.has(i)) return;
          const p = layout[i];
          if (Math.hypot(x - p.cx, y - p.cy) < 62) newly.push(i);
        });
        if (newly.length) {
          const next = new Set(revealedRef.current);
          newly.forEach((i) => next.add(i));
          revealedRef.current = next;
          setRevealed(next);
          sfx.pop();
        }
        break;
      }
      case 'tweezers': {
        const i = toothAt(x, y);
        if (i !== null && teethRef.current[i].debris && throttled('tw', 180)) {
          updateTooth(i, (t) => {
            t.debris = null;
          });
          sfx.pop();
          spawn('star', x, y - 20);
        }
        break;
      }
      case 'germspray': {
        const i = toothAt(x, y);
        if (i !== null && teethRef.current[i].germ && throttled('gs', 240)) {
          updateTooth(i, (t) => {
            t.germ = false;
          });
          sfx.spray();
          spawn('poof', x, y - 16);
        }
        break;
      }
      case 'brush': {
        const i = toothAt(x, y);
        const s = scrubRef.current;
        const d = Math.hypot(x - s.x, y - s.y);
        s.x = x;
        s.y = y;
        if (i !== null && teethRef.current[i].plaque > 0.02 && d < 60) {
          s.dist += d;
          if (s.dist > 45) {
            s.dist = 0;
            updateTooth(i, (t) => {
              t.plaque = Math.max(0, t.plaque - 0.34);
            });
            if (throttled('br', 140)) sfx.brush();
            spawn('foam', x + (Math.random() - 0.5) * 24, y - 6);
          }
        }
        break;
      }
      case 'implant': {
        const target = step.targets.find(
          (i) => teethRef.current[i].rot === 'gone'
        );
        if (target === undefined) return;
        const p = layout[target];
        if (Math.hypot(x - p.cx, y - p.cy) < 60) {
          updateTooth(target, (t) => {
            t.rot = 'implanted';
          });
          sfx.ding();
          endDrag();
        }
        break;
      }
      default:
        break; // dwell tools handled by the tick
    }
  }

  function dwellTick() {
    const dragKind = draggingRef.current;
    if (!dragKind || dragKind.kind !== 'tool' || !step) return;
    const { x, y } = lastPtRef.current;
    const dt = 80;

    if (step.tool === 'sprayer' || step.tool === 'mouthwash') {
      if (inMouth(x, y)) {
        setMouthProgress((p) => Math.min(1, p + 0.04));
        if (throttled('sp', 350)) sfx.spray();
        if (throttled('wp', 200)) {
          spawn(
            'water',
            MOUTH_CX + (Math.random() - 0.5) * 180,
            MOUTH_CY - 40 + Math.random() * 60
          );
        }
      }
      return;
    }

    const dwellOn = (
      tool: ToolId,
      ready: (t: ToothState) => boolean,
      needMs: number,
      apply: (t: ToothState) => void,
      sound: () => void,
      wince: boolean
    ) => {
      const i = toothAt(x, y);
      if (
        i !== null &&
        step.targets.includes(i) &&
        ready(teethRef.current[i])
      ) {
        const acc = (accRef.current.get(i) ?? 0) + dt;
        accRef.current.set(i, acc);
        if (wince) {
          setExpr('wince');
          if (tool === 'forceps') setWigglingTooth(i);
        }
        if (throttled('dw' + tool, 300)) sound();
        if (acc >= needMs) {
          accRef.current.set(i, 0);
          updateTooth(i, apply);
          setExpr('open');
          setWigglingTooth(null);
          if (tool === 'forceps') {
            sfx.pull();
            const p = layout[i];
            spawn('toothfly', p.cx, p.cy);
          }
        }
      } else {
        if (wince) {
          setExpr('open');
          setWigglingTooth(null);
        }
      }
    };

    if (step.tool === 'drill') {
      dwellOn(
        'drill',
        (t) => t.cavity === 'hole' || t.chip === 'broken',
        1200,
        (t) => {
          if (t.cavity === 'hole') t.cavity = 'drilled';
          else if (t.chip === 'broken') t.chip = 'smoothed';
        },
        sfx.drill,
        true
      );
    } else if (step.tool === 'filler') {
      dwellOn(
        'filler',
        (t) => t.cavity === 'drilled',
        900,
        (t) => {
          t.cavity = 'filled';
        },
        sfx.squish,
        false
      );
    } else if (step.tool === 'forceps') {
      dwellOn(
        'forceps',
        (t) => t.rot === 'rotten',
        1100,
        (t) => {
          t.rot = 'gone';
        },
        sfx.creak,
        true
      );
    }
  }

  /* ---------- drag lifecycle ---------- */

  function startDrag(kind: NonNullable<DragKind>, x: number, y: number) {
    draggingRef.current = kind;
    setDrag(kind);
    lastPtRef.current = { x, y };
    moveDragSprite(x, y);
    if (tickRef.current === null) {
      tickRef.current = window.setInterval(dwellTick, 80);
    }
  }

  function endDrag() {
    draggingRef.current = null;
    setDrag(null);
    setWigglingTooth(null);
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
    // tray hit?
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
      const target = step.targets.find(
        (i) => teethRef.current[i].chip === 'smoothed'
      );
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
        accRef.current.clear();
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
    return new Set(
      step.targets.filter((i) => !toothDoneForTool(teeth[i], step.tool))
    );
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
        {/* treatment-room.webp is the fixed back layer (CSS bg on .zd-treat);
            the scene SVG is transparent and composites the patient + mouth on
            top. The lamp/tray/reception props are NOT overlaid: the room art
            already bakes in the overhead lamp, the tool cart and the desk.
            The art is a fixed expression, so a small CSS nudge stands in for the
            wince while a tooth is being drilled/pulled. */}
        <g className={expr === 'wince' ? 'zd-wince' : undefined}>
          <AnimalFace spec={spec} expr={expr} mouthOpen />
        </g>
        <Mouth
          spec={spec}
          teeth={teeth}
          layout={layout}
          revealed={revealed}
          wigglingTooth={wigglingTooth}
          targetTeeth={targetSet}
          stinkOpacity={stinkOpacity}
        />

        {/* particles — outer g holds position, inner g runs the CSS animation
            (CSS transform would otherwise override the SVG transform attr) */}
        {particles.map((p) => (
          <g key={p.id} transform={`translate(${p.x},${p.y})`}>
          <g
            className={`zd-particle zd-${p.kind}`}
            style={
              {
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
              } as React.CSSProperties
            }
          >
            {p.kind === 'foam' && <circle r="7" fill="#fff" opacity="0.9" />}
            {p.kind === 'water' && <ellipse rx="4" ry="6" fill="#6fc9ec" />}
            {p.kind === 'poof' && <circle r="10" fill="#cfd8dc" opacity="0.85" />}
            {p.kind === 'star' && (
              <path d="M0,-9 L2,-2 L9,0 L2,2 L0,9 L-2,2 L-9,0 L-2,-2 Z" fill="#ffe066" />
            )}
            {p.kind === 'toothfly' && (
              <image href={TOOTH_ART.clean} x={-16} y={-20} width={32} height={40} preserveAspectRatio="xMidYMid meet" />
            )}
          </g>
          </g>
        ))}

        {/* tool tray */}
        <rect x="8" y={TRAY_Y - 44} width={VB_W - 16} height="96" rx="20" fill="#fff" stroke="#1d3557" strokeWidth="3" />
        {trayItems.map((item) => {
          const x = slotX(item.slot, trayCount);
          const isDraggedPiece =
            drag?.kind === 'piece' && item.piece === drag.shape;
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
                {item.active && !drag && (
                  <circle r="30" fill="#ffe066" opacity="0.55" />
                )}
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
