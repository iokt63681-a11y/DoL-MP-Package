# -*- coding: utf-8 -*-
"""Self-contained audit for an Argon delivery (no baseline needed).

Usage: python -I tools/audit_standalone.py <mod-src>
Checks: macro balance, broken MP links, duplicate passage names,
12-char overlap between playable pages in the same file,
write-only variables (rough), orphan pages (BFS from MP Main / hubs).
"""
import re, os, sys, glob, collections

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
T = os.path.join(ROOT, 'twees')

def parse_dir(tdir):
    per = {}
    dup = []
    for p in sorted(glob.glob(os.path.join(tdir, '*.twee'))):
        txt = open(p, encoding='utf-8').read()
        for b in re.split(r'(?=^::\s+)', txt, flags=re.M):
            if not b.lstrip().startswith(':: '):
                continue
            m = re.match(r'^::\s*([^\[\n]+)', b.splitlines()[0])
            if not m:
                continue
            n = m.group(1).strip()
            if n in per:
                dup.append((os.path.basename(p), n))
            per[n] = b
    return per, dup

def links(b):
    out = []
    for m in re.finditer(r'\[\[([^\]]+?)\]\]', b):
        inner = m.group(1)
        if '|' in inner:
            lbl, tgt = inner.rsplit('|', 1)
        elif '->' in inner:
            lbl, tgt = inner.split('->', 1)
        else:
            lbl, tgt = inner, inner
        out.append((lbl.strip(), tgt.strip()))
    return out

def raw_targets(b):
    out = [t for _, t in links(b)]
    out += [m.group(1).strip() for m in re.finditer(r'<<goto\s+"([^"]+)"', b)]
    out += [m.group(1).strip() for m in re.finditer(r'<<(?:include|display)\s+"([^"]+)"', b)]
    return out

def strip_links(s):
    return re.sub(r'<<link\b.*?<</link>>', '', s, flags=re.S)

def strip_macros(s):
    s = strip_links(s)
    return re.sub(r'<<[^>]*>>|<[^>]+>', '', s)

per, dups = parse_dir(T)
names = set(per)

print('== passages ==', len(per))
print('duplicate names:', len(dups))
for d in dups[:20]:
    print('  DUP', d)

bal = []
for fn in sorted(glob.glob(os.path.join(T, '*.twee'))):
    s = open(fn, encoding='utf-8').read()
    for tag in ('if', 'link', 'widget'):
        o = len(re.findall(rf'<<{tag}\b', s)); c = len(re.findall(rf'<</{tag}>>', s))
        if o != c:
            bal.append((os.path.basename(fn), tag, o, c))
    if '<<span' in s:
        bal.append((os.path.basename(fn), 'span_typo', s.count('<<span'), 0))
print('macro imbalances:', len(bal))
for x in bal[:30]:
    print('  BAL', x)

broken = []
for n, b in per.items():
    for t in raw_targets(b):
        if t.startswith('MP ') and t not in names:
            broken.append((n, t))
print('broken MP links:', len(broken))
for x in broken[:30]:
    print('  BROKEN', x)

# 12-char overlap between pages in the same file
def norm(s):
    return re.sub(r'[^一-鿿]', '', strip_macros(s))
overlaps = []
for fn in sorted(glob.glob(os.path.join(T, '*.twee'))):
    txt = open(fn, encoding='utf-8').read()
    pages = []
    for b in re.split(r'(?=^::\s+)', txt, flags=re.M):
        if not b.lstrip().startswith(':: '):
            continue
        m = re.match(r'^::\s*([^\[\n]+)', b.splitlines()[0])
        if m:
            pages.append((m.group(1).strip(), norm(b)))
    seen = {}
    for name, t in pages:
        for i in range(len(t) - 11):
            g = t[i:i+12]
            if g in seen and seen[g] != name:
                overlaps.append((os.path.basename(fn), seen[g], name, g))
                break
            seen[g] = name
print('12-char overlaps within files:', len(overlaps))
for o in overlaps[:20]:
    print('  O', o)

# write-only variables (rough): count writes / reads of $var and $mp.x
wr = collections.Counter(); rd = collections.Counter()
for n, b in per.items():
    for m in re.finditer(r'<<set\s+\$([A-Za-z0-9_.]+)\s+(?:to|\+=|-=|is|\+=)', b):
        wr[m.group(1)] += 1
    txt = b
    for m in re.finditer(r'\$([A-Za-z0-9_.]+)', txt):
        rd[m.group(1)] += 1
dead = [(k, wr[k], rd.get(k, 0)) for k in wr if rd.get(k, 0) <= wr[k] and wr[k] > 0]
dead = [x for x in dead if x[2] == x[1]]
print('write-only vars (rough):', len(dead))
for x in dead[:20]:
    print('  VAR', x)

# static in-degree (reference only; dynamic <<goto 变量>> cannot be resolved statically)
indeg = collections.Counter()
for n, b in per.items():
    for t in set(raw_targets(b)):
        if t in names and t != n:
            indeg[t] += 1
zero_in = sorted(n for n in names if n.startswith('MP ') and indeg[n] == 0 and '[widget' not in per[n].splitlines()[0])
print('MP pages with zero static inbound (reference):', len(zero_in))
for o in zero_in[:30]:
    print('  ZEROIN', o)
