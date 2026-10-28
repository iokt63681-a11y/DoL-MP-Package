# -*- coding: utf-8 -*-
"""Structural checks for the three dev45 pilots."""
import re, os, sys, glob

ROOT = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\24893\Downloads\_dev45_work\mod-src'
T = os.path.join(ROOT, 'twees')
JS = open(os.path.join(ROOT, 'scripts', 'mp.js'), encoding='utf-8').read()

def parse_dir(pattern):
    s = {}
    for p in glob.glob(os.path.join(T, pattern)):
        txt = open(p, encoding='utf-8').read()
        for b in re.split(r'(?=^::\s+)', txt, flags=re.M):
            if not b.lstrip().startswith(':: '):
                continue
            m = re.match(r'^::\s*([^\[\n]+)', b.splitlines()[0])
            if m:
                s[m.group(1).strip()] = b
    return s

sera = parse_dir('mp-npc-sera*.twee')
school = parse_dir('mp-loc-school*.twee')
ledger = parse_dir('mp-ledger-debt*.twee')
orph = parse_dir('mp-loc-orphanage*.twee')
high = parse_dir('mp-loc-highstreet*.twee')
allsera = '\n'.join(sera.values())
allschool = '\n'.join(school.values())
allledger = '\n'.join(ledger.values())
allorph = '\n'.join(orph.values())

problems = []
def chk(ok, msg):
    if not ok:
        problems.append(msg)

# Sera
chk('fatherLog to 6' not in allsera, 'Sera: fatherLog=6 shortcut still present')
chk(re.search(r'nextQuestDay', allsera) is not None, 'Sera: no nextQuestDay gate')
chk(re.search(r'setback', allsera) is not None, 'Sera: no setback failure state')
chk('mpSeraEnded' in allsera, 'Sera: no one-time ending flag')
chk('mpWorldSeraEnding' in '\n'.join(high.values()), 'Sera: world end not read in HighStreet')
chk(re.search(r'Time\.days', allsera) is not None, 'Sera: no Time.days anywhere')
# Daily/street locks: count daily keys in more2/daily
chk(re.search(r'mpNpcDailySera', allsera) is not None, 'Sera: no daily keys')

# School
chk('School' in JS and 'MP Loc School Hub' in JS, 'School: no native hook in mp.js')
chk('MP Loc School Class' in school, 'School: no Class page')
classb = school.get('MP Loc School Class', '')
chk('Time.hour' in classb, 'School: Class has no Time.hour gate')
chk('delinquency' in classb, 'School: Class does not use delinquency')
chk('MP Loc School Detention' in school, 'School: no Detention page')
chk('mpSchoolEnded' in allschool, 'School: no one-time ending flag')
chk('random(' in allschool, 'School: no random events')
chk('schoolrep' in allschool or 'schoolstate' in allschool, 'School: no original school state hooks')

# Ledger
chk('mpLedgerTick' in allledger, 'Ledger: no mpLedgerTick widget')
chk('nextDueDay' in allledger, 'Ledger: no nextDueDay')
chk('mpLedgerTick' in allorph or 'nextDueDay' in allorph, 'Ledger: orphanage does not call tick')
chk('mpLedgerEnded' in allledger, 'Ledger: no one-time ending flag')
chk('mpWorldLedgerLoss' in allledger or 'mpWorldLedgerLoss' in allorph, 'Ledger: no irreversible loss flag')
chk('overdue' in allorph, 'Ledger: orphanage no overdue night event')
chk('Time.days' in allledger, 'Ledger: no Time.days')

print('pilot structural problems:', len(problems))
for p in problems:
    print('  !', p)
