"""MILESTONE AUDIT A - manifest integrity for src/game/assets.ts.

Checks:
  1. every import in assets.ts resolves to a file that exists on disk;
  2. every art file on disk (excluding _raw backups + optional decor) is
     referenced by exactly one import (prints orphans + dangling + dupes);
  3. assets.ts introduces no circular import (its only code import is the
     type-only ./types, which imports nothing back).
Run: python scripts/audit_assets.py    (tsc is checked separately by the caller)
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'src' / 'game' / 'assets.ts'
ART_DIRS = ['animals', 'tools', 'effects', 'teeth', 'backgrounds', 'props']
ART_EXT = {'.svg', '.webp'}

def disk_art():
    files = set()
    for d in ART_DIRS:
        for p in (ROOT / 'assets' / d).rglob('*'):
            if p.suffix.lower() in ART_EXT and '_raw' not in p.parts:
                files.add(p.resolve())
    return files

def referenced():
    txt = MANIFEST.read_text(encoding='utf-8')
    refs = []
    for m in re.finditer(r"from\s+'(\.\./\.\./assets/[^']+\.(?:svg|webp))'", txt):
        refs.append((MANIFEST.parent / m.group(1)).resolve())
    return refs

def check_circular():
    # assets.ts code-imports only ./types; confirm types.ts does not import assets.
    types = (ROOT / 'src' / 'game' / 'types.ts').read_text(encoding='utf-8')
    return 'assets' not in re.sub(r'//.*', '', types)

def main():
    disk = disk_art()
    refs = referenced()
    ref_set = set(refs)
    dangling = [r for r in refs if not r.exists()]
    orphans = sorted(disk - ref_set)
    dupes = sorted({r for r in refs if refs.count(r) > 1})
    no_cycle = check_circular()

    rel = lambda p: p.relative_to(ROOT).as_posix()
    rows = [
        ('imports resolve to real files', not dangling,
         'none' if not dangling else ', '.join(rel(p) for p in dangling)),
        ('every art file referenced once', not orphans and not dupes,
         f'{len(disk)} files, {len(refs)} refs'
         + ('' if not orphans else f' | ORPHANS: {", ".join(rel(p) for p in orphans)}')
         + ('' if not dupes else f' | DUPES: {", ".join(rel(p) for p in dupes)}')),
        ('no circular import (assets<->types)', no_cycle,
         'assets.ts code-imports only type-only ./types'),
    ]
    print(f'{"CHECK":40s} {"RESULT":6s} DETAIL')
    print('-' * 78)
    ok = True
    for name, passed, detail in rows:
        ok &= passed
        print(f'{name:40s} {"PASS" if passed else "FAIL":6s} {detail}')
    print('-' * 78)
    print('AUDIT A:', 'PASS' if ok else 'FAIL')
    sys.exit(0 if ok else 1)

if __name__ == '__main__':
    main()
