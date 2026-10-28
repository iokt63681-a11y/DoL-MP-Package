#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render-path style check (options/icons/labels/prose), same engine as check_render.py."""
import re, os, sys
NEW = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else r'C:\Users\24893\Downloads\_dev45_work\mod-src'
FILES = sys.argv[2:] or ["twees/mp-loc-school.twee", "twees/mp-loc-school-more.twee",
         "twees/mp-loc-school-more2.twee", "twees/mp-loc-school-festival.twee",
         "twees/mp-loc-orphanage.twee", "twees/mp-loc-orphanage-more.twee",
         "twees/mp-loc-orphanage-more2.twee"]
CJK = re.compile(r'[\u4e00-\u9fff]')
def cjk(s): return len(CJK.findall(s))
def passages(path):
    txt = open(path, 'rb').read().decode('utf-8-sig'); out = []
    for b in re.split(r'(?m)^::[ \t]+', txt)[1:]:
        nl = b.find('\n'); h = b[:nl] if nl >= 0 else b; body = b[nl+1:] if nl >= 0 else ''
        m = re.match(r'^(.*?)\s*\[([^\]]*)\]\s*$', h.rstrip('\r'))
        out.append(((m.group(1).strip() if m else h.strip()), (m.group(2) if m else ''), body))
    return out
def parse_seq(s, i, stops):
    nodes = []; n = len(s)
    while i < n:
        st = None
        for x in stops:
            if s.startswith(x, i): st = x; break
        if st: return nodes, i, st
        if s.startswith('<<link ', i) or s.startswith('<<link\t', i) or s.startswith('<<link\n', i):
            j = s.find('>>', i)
            if j < 0: nodes.append(('text', s[i:])); return nodes, n, None
            k = s.find('<</link>>', j)
            if k < 0: nodes.append(('text', s[i:])); return nodes, n, None
            nodes.append(('opt', s[i:k+9])); i = k + 9; continue
        if s.startswith('<<if ', i):
            j = s.find('>>', i) + 2
            branches = []; has_else = False
            cur, i2, st = parse_seq(s, j, ('<<elseif ', '<<else>>', '<</if>>')); branches.append(cur)
            while st == '<<elseif ':
                j2 = s.find('>>', i2) + 2
                cur, i2, st = parse_seq(s, j2, ('<<elseif ', '<<else>>', '<</if>>')); branches.append(cur)
            if st == '<<else>>':
                cur, i2, st = parse_seq(s, i2 + 8, ('<</if>>',)); branches.append(cur); has_else = True
            i = (i2 + 7) if st == '<</if>>' else i2
            nodes.append(('if', branches, has_else)); continue
        if s.startswith('<<', i):
            j = s.find('>>', i)
            if j < 0: nodes.append(('text', s[i:])); return nodes, n, None
            nodes.append(('macro', s[i:j+2])); i = j + 2; continue
        j = s.find('<<', i)
        if j < 0: j = n
        nodes.append(('text', s[i:j])); i = j
    return nodes, i, None
ICON = re.compile(r'<<([A-Za-z0-9_]*icon)\b')
LABEL = re.compile(r'\[\[(.+?)\|')
def render(nodes):
    states = [dict(o=[], ic=[], pr=0)]
    for node in nodes:
        typ = node[0]; val = node[1]
        if typ == 'opt':
            for st in states: st['o'].append(val)
        elif typ == 'if':
            bs = [render(b) for b in val]
            if not node[2]: bs.append([dict(o=[], ic=[], pr=0)])
            ns = []
            for st in states:
                for bl in bs:
                    for sub in bl:
                        ns.append(dict(o=st['o'] + sub['o'], ic=st['ic'] + sub['ic'], pr=st['pr'] + sub['pr']))
            states = ns
            if len(states) > 500000: raise RuntimeError('boom')
        elif typ == 'text':
            c = cjk(re.sub(r'<[^>]*>', '', val))
            for st in states: st['pr'] += c
        elif typ == 'macro':
            mm = ICON.match(val)
            if mm:
                for st in states: st['ic'].append(mm.group(1))
            pm = re.search(r'<<print\s+"([^"]*)"', val)
            if pm:
                c = cjk(pm.group(1))
                for st in states: st['pr'] += c
    return states
bad = 0
for rel in FILES:
    for t, tg, body in passages(os.path.join(NEW, rel)):
        if 'widget' in tg: continue
        nodes, _, _ = parse_seq(body, 0, ())
        st = render(nodes)
        issues = set()
        for x in st:
            labels = []
            for o in x['o']:
                m = LABEL.search(o)
                if not m: issues.add('label-missing'); continue
                lbl = m.group(1)
                lm = re.match(r'^(.+?)\s*\((\d+):(\d+)\)$', lbl)
                if not lm: issues.add('label-no-time'); continue
                y = cjk(lm.group(1)); labels.append(y)
                if not (4 <= y <= 8): issues.add(f'label-len {y}')
            if not (2 <= len(x['o']) <= 5): issues.add(f'opt {len(x["o"])}')
            if len(set(labels)) != len(labels): issues.add(f'dup-label {labels}')
            if len(x['ic']) > 4: issues.add(f'icons {len(x["ic"])}')
            if len(set(x['ic'])) != len(x['ic']): issues.add(f'dup-icon {x["ic"]}')
            if not (60 <= x['pr'] <= 200): issues.add(f'prose {x["pr"]}')
        if issues:
            bad += 1
            print(f'! {rel} :: {t} :: {"; ".join(sorted(issues))}')
print('render style problems:', bad)
