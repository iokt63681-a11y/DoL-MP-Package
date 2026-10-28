#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Corrected render engine: if without else gets an implicit empty branch."""
import re, os, glob, sys
from collections import Counter
NEW=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else 'r"C:\\Users\\24893\\Downloads\\_dev41_work\\mod-src"'
FILES=["twees/mp-npc-%s%s.twee"%(n,s) for n in ("ash","lin","monet","noel","sera","vesper") for s in ("-more2","")]
FILES+=["twees/mp-ledger-debt.twee","twees/mp-ledger-debt-more.twee",
        "twees/mp-guild-assembly.twee","twees/mp-guild-assembly-more.twee",
        "twees/mp-temple-schism.twee","twees/mp-temple-schism-more.twee"]
CJK=re.compile(r'[\u4e00-\u9fff]')
def cjk(s): return len(CJK.findall(s))
def passages(path):
    txt=open(path,'rb').read().decode('utf-8-sig');out=[]
    for b in re.split(r'(?m)^::[ \t]+',txt)[1:]:
        nl=b.find('\n');h=b[:nl] if nl>=0 else b;body=b[nl+1:] if nl>=0 else ''
        m=re.match(r'^(.*?)\s*\[([^\]]*)\]\s*$',h.rstrip('\r'))
        out.append(((m.group(1).strip() if m else h.strip()),(m.group(2) if m else ''),body))
    return out

def parse_seq(s,i,stops):
    nodes=[];n=len(s)
    while i<n:
        st=None
        for x in stops:
            if s.startswith(x,i): st=x;break
        if st: return nodes,i,st
        if s.startswith('<<link ',i) or s.startswith('<<link\t',i) or s.startswith('<<link\n',i):
            j=s.find('>>',i)
            if j<0: nodes.append(('text',s[i:]));return nodes,n,None
            k=s.find('<</link>>',j)
            if k<0: nodes.append(('text',s[i:]));return nodes,n,None
            nodes.append(('opt',s[i:k+9]));i=k+9;continue
        if s.startswith('<<if ',i):
            j=s.find('>>',i)+2
            branches=[];has_else=False
            cur,i2,st=parse_seq(s,j,('<<elseif ','<<else>>','<</if>>'));branches.append(cur)
            while st=='<<elseif ':
                j2=s.find('>>',i2)+2
                cur,i2,st=parse_seq(s,j2,('<<elseif ','<<else>>','<</if>>'));branches.append(cur)
            if st=='<<else>>':
                cur,i2,st=parse_seq(s,i2+8,('<</if>>',));branches.append(cur);has_else=True
            i=(i2+7) if st=='<</if>>' else i2
            nodes.append(('if',branches,has_else));continue
        if s.startswith('<<',i):
            j=s.find('>>',i)
            if j<0: nodes.append(('text',s[i:]));return nodes,n,None
            nodes.append(('macro',s[i:j+2]));i=j+2;continue
        j=s.find('<<',i)
        if j<0: j=n
        nodes.append(('text',s[i:j]));i=j
    return nodes,i,None

ICON=re.compile(r'<<([A-Za-z0-9_]*icon)\b')
def render(nodes):
    states=[dict(o=[],ic=[],pr=0)]
    for node in nodes:
        typ=node[0];val=node[1]
        if typ=='opt':
            for st in states: st['o'].append(val)
        elif typ=='if':
            has_else=node[2]
            bs=[render(b) for b in val]
            if not has_else: bs.append([dict(o=[],ic=[],pr=0)])
            ns=[]
            for st in states:
                for bl in bs:
                    for sub in bl:
                        ns.append(dict(o=st['o']+sub['o'],ic=st['ic']+sub['ic'],pr=st['pr']+sub['pr']))
            states=ns
            if len(states)>500000: raise RuntimeError('boom')
        elif typ=='text':
            c=cjk(re.sub(r'<[^>]*>','',val))
            for st in states: st['pr']+=c
        elif typ=='macro':
            mm=ICON.match(val)
            if mm:
                for st in states: st['ic'].append(mm.group(1))
            pm=re.search(r'<<print\s+"([^"]*)"',val)
            if pm:
                c=cjk(pm.group(1))
                for st in states: st['pr']+=c
    return states

FILES+= ["twees/mp-loc-school.twee","twees/mp-loc-school-more.twee","twees/mp-loc-school-more2.twee","twees/mp-loc-orphanage.twee","twees/mp-loc-orphanage-more.twee","twees/mp-loc-orphanage-more2.twee"]
rows=[]
for rel in FILES:
    for t,tg,body in passages(os.path.join(NEW,rel)):
        if 'widget' in tg: continue
        nodes,_,_=parse_seq(body,0,())
        st=render(nodes)
        oc=[len(x['o']) for x in st];ic=[len(x['ic']) for x in st];pr=[x['pr'] for x in st]
        rows.append(dict(rel=rel,title=t,omin=min(oc),omax=max(oc),imin=min(ic),imax=max(ic),
                         pmin=min(pr),pmax=max(pr),paths=len(st)))
print("pages",len(rows))
print("opt (min,max) distribution:",sorted(Counter((r['omin'],r['omax']) for r in rows).items()))
print("icon (min,max) distribution:",sorted(Counter((r['imin'],r['imax']) for r in rows).items()))
print("prose global min/max:",min(r['pmin'] for r in rows),max(r['pmax'] for r in rows))
print("\nOPTION VIOLATIONS (rendered min<2 or max>5):")
v=[r for r in rows if r['omin']<2 or r['omax']>5]
for r in v: print(f"  P0 {r['rel']} :: {r['title']} opt {r['omin']}..{r['omax']} paths {r['paths']}")
print("  count",len(v))
print("\nICON VIOLATIONS (max>4):")
v=[r for r in rows if r['imax']>4]
for r in v: print(f"  P1 {r['rel']} :: {r['title']} icon {r['imin']}..{r['imax']}")
print("  count",len(v))
print("\nPROSE VIOLATIONS (min<60 or max>200):")
v=[r for r in rows if r['pmin']<60 or r['pmax']>200]
for r in v: print(f"  P0 {r['rel']} :: {r['title']} prose {r['pmin']}..{r['pmax']}")
print("  count",len(v))
print("\nPAGES WITH RENDER MIN OPTIONS == 1:")
for r in rows:
    if r['omin']==1: print(f"  {r['rel']} :: {r['title']} opt {r['omin']}..{r['omax']} paths {r['paths']}")
print("\nPAGES WITH RENDER MIN ICONS == 1:")
for r in rows:
    if r['imin']==1: print(f"  {r['rel']} :: {r['title']} icon {r['imin']}..{r['imax']} paths {r['paths']}")
print("\nLOWEST 15 PROSE MIN:")
for r in sorted(rows,key=lambda x:x['pmin'])[:15]: print(f"  {r['pmin']}..{r['pmax']} {r['rel']} :: {r['title']}")
print("\nHIGHEST 10 PROSE MAX:")
for r in sorted(rows,key=lambda x:-x['pmax'])[:10]: print(f"  {r['pmin']}..{r['pmax']} {r['rel']} :: {r['title']}")
# save
with open(r"C:\Users\24893\Downloads\_v48work\render_stats2.tsv","w",encoding="utf-8") as f:
    f.write("rel\ttitle\topt_min\topt_max\ticon_min\ticon_max\tprose_min\tprose_max\tpaths\n")
    for r in rows:
        f.write(f"{r['rel']}\t{r['title']}\t{r['omin']}\t{r['omax']}\t{r['imin']}\t{r['imax']}\t{r['pmin']}\t{r['pmax']}\t{r['paths']}\n")
print("\nwrote render_stats2.tsv")