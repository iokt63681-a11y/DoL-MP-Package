# -*- coding: utf-8 -*-
"""Skeleton check for V51: Deep Quest pages, hub option count, Result pages, shift pages."""
import re, os, sys, glob

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
T = os.path.join(ROOT, 'twees')

def parse_dir(tdir):
    per = {}
    for p in sorted(glob.glob(os.path.join(tdir, '*.twee'))):
        txt = open(p, encoding='utf-8').read()
        for b in re.split(r'(?=^::\s+)', txt, flags=re.M):
            if not b.lstrip().startswith(':: '):
                continue
            m = re.match(r'^::\s*([^\[\n]+)', b.splitlines()[0])
            if m:
                per[m.group(1).strip()] = b
    return per

def links(b):
    out = []
    for m in re.finditer(r'\[\[([^\]]+?)\]\]', b):
        out.append(m.group(1))
    for m in re.finditer(r'<<link\s+"([^"]+)"', b):
        out.append(m.group(1))
    return out

per = parse_dir(T)
names = set(per)

deep = sorted(n for n in names if 'Deep Quest' in n)
print('Deep Quest pages:', len(deep))
for n in deep[:40]:
    print('  DQ', n)

result = sorted(n for n in names if re.search(r'\bResult\b', n))
print('Result-named pages:', len(result))
for n in result[:40]:
    print('  RESULT', n)

hubs = sorted(n for n in names if re.match(r'^MP Loc .+ Hub$', n))
print('location hubs:', len(hubs))
for n in hubs:
    body = per[n]
    ls = links(body)
    if len(ls) > 6:
        print('  HUB>6', n, len(ls))

shifts = [n for n in names if re.search(r'(Work|Shift|Patrol Shift|Night Shift)$', n)]
print('shift-like pages:', len(shifts))
bad_shift = []
for n in shifts:
    b = per[n]
    if '<<pass 60>>' not in b and '<<pass 1 hour>>' not in b:
        bad_shift.append(n)
print('shift pages without pass 60:', len(bad_shift))
for n in bad_shift[:20]:
    print('  SHIFT', n)

# new-style helper: pages whose body has both cleareventpool and runeventpool
pools = [n for n in names if '<<cleareventpool>>' in per[n] and '<<runeventpool>>' in per[n]]
print('pages using event pool:', len(pools))
