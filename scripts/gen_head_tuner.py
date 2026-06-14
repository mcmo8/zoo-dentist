"""Generate assets/head-tuner.html — an interactive per-animal head-alignment tuner.

Self-contained (animal SVGs base64-embedded, mouth vector inlined) so it opens from
file://. Mirrors the app's EXACT scene compositing and geometry (Mouth.tsx +
AnimalFace.tsx), so the scale/dx/dy values you dial in transfer 1:1 into
src/components/AnimalFace.tsx's HEAD_CALIB map. Drag each head behind the FIXED
universal mouth, then Copy JSON.

Re-run after geometry changes:  python scripts/gen_head_tuner.py
"""
import base64
import os

# ---- app geometry (must match Mouth.tsx / AnimalFace.tsx) ----
VB_W, VB_H = 360, 560
MOUTH_CX, MOUTH_CY, MOUTH_W = 180, 256, 314
FACE = dict(x=18, y=4, w=324, h=372)
ART_VB = 1254
BOX_LEFT = MOUTH_CX - MOUTH_W / 2
BOX_TOP = MOUTH_CY - MOUTH_W / 2
SVG_SCALE = MOUTH_W / ART_VB

TUNER_MW, TUNER_CX, TUNER_CY_MID = 331, 180, 195 + 331 / 2
SPAN, TOOTH = 0.62, 60
K = MOUTH_W / TUNER_MW

# ---- inlined mouth vector (verbatim from src/components/mouthArt.tsx) ----
MOUTH_BACK = '''
<path fill="#8b0026" stroke="#4b0016" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"
  d="M126 346 C150 255 258 112 460 101 C540 97 586 120 627 118 C668 116 714 97 794 101 C996 112 1104 255 1128 346 C1164 484 1136 757 1090 843 C1035 948 884 1025 627 1025 C370 1025 219 948 164 843 C118 757 90 484 126 346 Z"/>
<path fill="#ff3f68" fill-rule="evenodd" stroke="#4b0016" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"
  d="M126 346 C150 255 258 112 460 101 C540 97 586 120 627 118 C668 116 714 97 794 101 C996 112 1104 255 1128 346 C1164 484 1136 757 1090 843 C1035 948 884 1025 627 1025 C370 1025 219 948 164 843 C118 757 90 484 126 346 Z M168 344 C240 206 411 179 570 188 C602 190 626 197 654 188 C811 178 982 207 1086 344 C1112 466 1082 735 1032 826 C981 919 847 980 627 980 C407 980 273 919 222 826 C172 735 142 466 168 344 Z"/>
<path fill="#4b0016" stroke="#4b0016" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"
  d="M296 748 C288 585 357 457 498 436 C590 422 576 540 627 555 C678 540 664 422 756 436 C897 457 966 585 958 748 C855 692 721 673 627 703 C533 673 399 692 296 748 Z"/>
<path fill="#ff3f68" stroke="#4b0016" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"
  d="M254 826 C283 710 408 666 531 676 C578 680 604 692 627 703 C650 692 676 680 723 676 C846 666 971 710 1000 826 C890 889 760 920 627 920 C494 920 364 889 254 826 Z"/>
'''
MOUTH_GUMS = '''
<path fill="#ffd0dc" stroke="#4b0016" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"
  d="M168 344 C235 234 398 203 566 213 C603 215 624 223 653 213 C821 203 986 234 1086 344 C1050 417 947 432 817 397 C728 374 688 350 626 350 C565 350 525 374 436 397 C306 432 203 417 168 344 Z"/>
<path fill="#ffd0dc" stroke="#4b0016" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"
  d="M165 840 C225 780 301 807 407 862 C502 912 584 921 627 921 C670 921 752 912 847 862 C953 807 1029 780 1089 840 C1044 940 884 1025 627 1025 C370 1025 210 940 165 840 Z"/>
'''

# ---- locked teeth positions in scene coords (matches computeToothLayout) ----
def row(n, base_y, curve):
    half = (SPAN * TUNER_MW) / 2
    w = K * TOOTH
    out = []
    for i in range(n):
        tx = TUNER_CX if n == 1 else TUNER_CX - half + (2 * half / (n - 1)) * i
        norm = (tx - TUNER_CX) / half if half else 0
        f = 1 - norm * norm
        ty = base_y + curve * f
        cx = MOUTH_CX + K * (tx - TUNER_CX)
        cy = MOUTH_CY + K * (ty - TUNER_CY_MID)
        out.append((cx, cy, w))
    return out

teeth = row(5, 311, -12) + row(5, 402, 26)
teeth_svg = '\n'.join(
    f'<rect x="{cx - w/2:.1f}" y="{cy - w/2:.1f}" width="{w:.1f}" height="{w:.1f}" '
    f'rx="{w*0.18:.1f}" fill="#fff" stroke="#1d3557" stroke-width="2"/>'
    for (cx, cy, w) in teeth
)

# ---- animals: id, display name, current calib, base64 svg ----
ROSTER = [
    ('bunny', 'Pip', 0, 11, 1.36),
    ('monkey', 'Momo', 0, 26, 1.35),
    ('hippo', 'Hugo', 0, 34, 1.17),
    ('elephant', 'Ella', 0, 30, 1.21),
    ('croc', 'Snappy', 12, 58, 1.16),
    ('lion', 'Leo', 0, 6, 1.21),
]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
animals = []
for aid, name, dx, dy, scale in ROSTER:
    with open(os.path.join(ROOT, 'assets', 'animals', f'{aid}.svg'), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('ascii')
    animals.append(dict(id=aid, name=name, dx=dx, dy=dy, scale=scale,
                        uri=f'data:image/svg+xml;base64,{b64}'))

import json
ANIM_JS = json.dumps(animals)

HTML = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zoo Smiles — per-animal head tuner</title>
<style>
  :root {{ font-family: system-ui, sans-serif; }}
  body {{ margin: 0; background: #eef1f4; color: #1d3557; display: flex; gap: 18px; padding: 16px; flex-wrap: wrap; }}
  .stage {{ width: 360px; height: 560px; background: #dbe7d6; border: 2px solid #1d3557; border-radius: 10px; box-shadow: 0 6px 0 #b9c4cd; }}
  .panel {{ min-width: 300px; max-width: 420px; }}
  h1 {{ font-size: 18px; margin: 0 0 4px; }}
  p.hint {{ font-size: 12px; color: #5c6b7a; margin: 0 0 12px; }}
  .tabs {{ display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }}
  .tabs button {{ border: 2px solid #1d3557; background: #fff; border-radius: 8px; padding: 7px 12px; font-weight: 700; cursor: pointer; }}
  .tabs button.on {{ background: #ffd166; }}
  .row {{ display: flex; align-items: center; gap: 10px; margin: 9px 0; }}
  .row label {{ width: 56px; font-weight: 700; font-size: 13px; }}
  .row input[type=range] {{ flex: 1; }}
  .row output {{ width: 52px; text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; }}
  textarea {{ width: 100%; height: 168px; font-family: ui-monospace, monospace; font-size: 12px; border: 2px solid #1d3557; border-radius: 8px; padding: 8px; box-sizing: border-box; }}
  .actions {{ display: flex; gap: 8px; margin: 8px 0; }}
  .actions button {{ border: 2px solid #1d3557; background: #8ecae6; border-radius: 8px; padding: 8px 14px; font-weight: 700; cursor: pointer; }}
  .swatch {{ font-size: 12px; color: #5c6b7a; }}
</style></head>
<body>
  <svg class="stage" viewBox="0 0 {VB_W} {VB_H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="{VB_W}" height="{VB_H}" fill="#dbe7d6"/>
    <!-- crosshair on the mouth anchor for reference -->
    <g id="head"></g>
    <g transform="translate({BOX_LEFT},{BOX_TOP}) scale({SVG_SCALE:.5f})">{MOUTH_BACK}</g>
    {teeth_svg}
    <g transform="translate({BOX_LEFT},{BOX_TOP}) scale({SVG_SCALE:.5f})">{MOUTH_GUMS}</g>
    <line x1="{MOUTH_CX}" y1="0" x2="{MOUTH_CX}" y2="{VB_H}" stroke="#00aaff" stroke-width="0.6" stroke-dasharray="4 4" opacity="0.5"/>
  </svg>

  <div class="panel">
    <h1>Per-animal head tuner</h1>
    <p class="hint">Pick a patient, drag the head behind the fixed mouth until the universal mouth fully covers its printed mouth (no second mouth, no peek above the gum line) and the eyes/ears show. <b>scale</b> zooms about the mouth anchor; <b>dx/dy</b> nudge. Then Copy JSON into AnimalFace.tsx's HEAD_CALIB.</p>
    <div class="tabs" id="tabs"></div>
    <div class="row"><label>scale</label><input id="sc" type="range" min="0.6" max="2.5" step="0.01"><output id="scv"></output></div>
    <div class="row"><label>dx</label><input id="dx" type="range" min="-90" max="90" step="1"><output id="dxv"></output></div>
    <div class="row"><label>dy</label><input id="dy" type="range" min="-140" max="140" step="1"><output id="dyv"></output></div>
    <div class="actions">
      <button id="reset">Reset this one</button>
      <button id="copy">Copy JSON</button>
    </div>
    <textarea id="out" readonly></textarea>
    <p class="swatch">Anchor (MOUTH_CX,MOUTH_CY) = ({MOUTH_CX},{MOUTH_CY}); mouth width {MOUTH_W}. Face box x{FACE['x']} y{FACE['y']} w{FACE['w']} h{FACE['h']}.</p>
  </div>

<script>
const ANCHOR_X = {MOUTH_CX}, ANCHOR_Y = {MOUTH_CY};
const FACE = {{x:{FACE['x']}, y:{FACE['y']}, w:{FACE['w']}, h:{FACE['h']}}};
const animals = {ANIM_JS};
const DEFAULT = {{}};
animals.forEach(a => DEFAULT[a.id] = {{dx:a.dx, dy:a.dy, scale:a.scale}});
let cur = animals[0].id;

const $ = id => document.getElementById(id);
const headG = $('head');

function tabs() {{
  $('tabs').innerHTML = '';
  animals.forEach(a => {{
    const b = document.createElement('button');
    b.textContent = a.name;
    b.className = a.id === cur ? 'on' : '';
    b.onclick = () => {{ cur = a.id; sync(); }};
    $('tabs').appendChild(b);
  }});
}}

function curAnim() {{ return animals.find(a => a.id === cur); }}

function render() {{
  const a = curAnim();
  const t = `translate(${{a.dx}},${{a.dy}}) translate(${{ANCHOR_X}},${{ANCHOR_Y}}) scale(${{a.scale}}) translate(${{-ANCHOR_X}},${{-ANCHOR_Y}})`;
  headG.innerHTML = `<image href="${{a.uri}}" x="${{FACE.x}}" y="${{FACE.y}}" width="${{FACE.w}}" height="${{FACE.h}}" preserveAspectRatio="xMidYMid meet"/>`;
  headG.setAttribute('transform', t);
}}

function dumpJSON() {{
  const lines = animals.map(a =>
    `  ${{a.id}}: {{ dx: ${{a.dx}}, dy: ${{a.dy}}, scale: ${{(+a.scale).toFixed(2)}} }},`);
  $('out').value = 'const HEAD_CALIB: Record<AnimalId, HeadCalib> = {{\\n' + lines.join('\\n') + '\\n}};';
}}

function sync() {{
  const a = curAnim();
  $('sc').value = a.scale; $('scv').textContent = (+a.scale).toFixed(2);
  $('dx').value = a.dx; $('dxv').textContent = a.dx;
  $('dy').value = a.dy; $('dyv').textContent = a.dy;
  tabs(); render(); dumpJSON();
}}

$('sc').oninput = e => {{ curAnim().scale = +e.target.value; $('scv').textContent = (+e.target.value).toFixed(2); render(); dumpJSON(); }};
$('dx').oninput = e => {{ curAnim().dx = +e.target.value; $('dxv').textContent = e.target.value; render(); dumpJSON(); }};
$('dy').oninput = e => {{ curAnim().dy = +e.target.value; $('dyv').textContent = e.target.value; render(); dumpJSON(); }};
$('reset').onclick = () => {{ const a = curAnim(); Object.assign(a, DEFAULT[a.id]); sync(); }};
$('copy').onclick = () => {{ $('out').select(); document.execCommand('copy'); $('copy').textContent = 'Copied!'; setTimeout(()=>$('copy').textContent='Copy JSON',1200); }};

sync();
</script>
</body></html>
'''

out = os.path.join(ROOT, 'assets', 'head-tuner.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(HTML)
print(f'wrote {out} ({len(HTML)//1024} KB), {len(animals)} animals, {len(teeth)} teeth')
