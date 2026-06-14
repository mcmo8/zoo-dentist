/* Universal open-mouth art, vendored as vector from the artist's layered source
   `images/layered_no_teeth_mouth_asset.svg` (groups: mouth-interior-backdrop,
   layer-01-mouth-lumps-lips, layer-02-gums [upper/lower ridge], layer-03-tongue-
   matter [throat + tongue]). It is inlined here — rather than imported as one URL —
   so the renderer can SANDWICH the tooth sprites between the back of the mouth and
   the gum ridges by z-order. That is the whole trick: gums paint AFTER the teeth, so
   a tooth root can never poke above the gum line (the old pink-over-teeth bug).

   Two passes, both drawn at the source viewBox scale (MOUTH_ART_VB) and positioned
   by the caller (Mouth.tsx) via a single transform:
     MouthBack  — interior + lips + throat + tongue   (everything BEHIND the teeth)
     MouthGums  — the two gum ridges                  (the only thing IN FRONT)
   This mirrors the arrangement validated in assets/mouth-tuner.html, where only the
   gums sat in front of the teeth. */

/** The source SVG is a 1254x1254 square; the caller maps this box onto the scene. */
export const MOUTH_ART_VB = 1254;

const OUTLINE = {
  stroke: '#4b0016',
  strokeWidth: 18,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};
const THIN_OUTLINE = { ...OUTLINE, strokeWidth: 12 };

/** Interior backdrop + lip ring + throat + tongue — renders behind the teeth. */
export function MouthBack() {
  return (
    <g>
      {/* mouth-interior-backdrop (dark maroon cavity) */}
      <path
        {...OUTLINE}
        fill="#8b0026"
        d="M126 346 C150 255 258 112 460 101 C540 97 586 120 627 118 C668 116 714 97 794 101 C996 112 1104 255 1128 346 C1164 484 1136 757 1090 843 C1035 948 884 1025 627 1025 C370 1025 219 948 164 843 C118 757 90 484 126 346 Z"
      />
      {/* layer-01-mouth-lumps-lips (pink lip ring, evenodd cut-out) */}
      <path
        {...OUTLINE}
        fill="#ff3f68"
        fillRule="evenodd"
        d="M126 346 C150 255 258 112 460 101 C540 97 586 120 627 118 C668 116 714 97 794 101 C996 112 1104 255 1128 346 C1164 484 1136 757 1090 843 C1035 948 884 1025 627 1025 C370 1025 219 948 164 843 C118 757 90 484 126 346 Z M168 344 C240 206 411 179 570 188 C602 190 626 197 654 188 C811 178 982 207 1086 344 C1112 466 1082 735 1032 826 C981 919 847 980 627 980 C407 980 273 919 222 826 C172 735 142 466 168 344 Z"
      />
      {/* layer-03-tongue-matter: throat opening (dark) then tongue (pink) */}
      <path
        {...THIN_OUTLINE}
        fill="#4b0016"
        d="M296 748 C288 585 357 457 498 436 C590 422 576 540 627 555 C678 540 664 422 756 436 C897 457 966 585 958 748 C855 692 721 673 627 703 C533 673 399 692 296 748 Z"
      />
      <path
        {...OUTLINE}
        fill="#ff3f68"
        d="M254 826 C283 710 408 666 531 676 C578 680 604 692 627 703 C650 692 676 680 723 676 C846 666 971 710 1000 826 C890 889 760 920 627 920 C494 920 364 889 254 826 Z"
      />
    </g>
  );
}

/** layer-02-gums: the upper + lower ridges — the only mouth part in front of teeth. */
export function MouthGums() {
  return (
    <g>
      <path
        {...OUTLINE}
        fill="#ffd0dc"
        d="M168 344 C235 234 398 203 566 213 C603 215 624 223 653 213 C821 203 986 234 1086 344 C1050 417 947 432 817 397 C728 374 688 350 626 350 C565 350 525 374 436 397 C306 432 203 417 168 344 Z"
      />
      <path
        {...OUTLINE}
        fill="#ffd0dc"
        d="M165 840 C225 780 301 807 407 862 C502 912 584 921 627 921 C670 921 752 912 847 862 C953 807 1029 780 1089 840 C1044 940 884 1025 627 1025 C370 1025 210 940 165 840 Z"
      />
    </g>
  );
}
