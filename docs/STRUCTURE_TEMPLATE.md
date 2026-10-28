# dev45 结构模板（照抄用）

## 1. 塞拉个人线（`mp-npc-sera.twee` / `mp-new-npcs.twee`）

### 变量（都在 `$mpNpcs.sera` 下）

| 字段 | 含义 | 写法 |
| --- | --- | --- |
| `stage` 0–10 | 第一阶段（旧线） | 保留不动 |
| `questStage` 0–5 | 第二阶段 | 只能由新线写 |
| `nextQuestDay` | 下一步最早日期 | `Time.days + 1` |
| `setback` | 失败锁定到哪天 | `Time.days + 2` |
| `fatherLog` 0–6 | 六页手记，每周 +1 | 修表结算时 `Math.min(6, x + 1)`，周键防重 |
| `rep` | 声望，失败 -5 | `Math.max(0, rep - 5)` |
| `$mpSeraEnded` | 结局一次性 | 1 |
| `$mpWorldSeraEnding` | 世界标志 | `"stay"` / `"depart"` |

### 入口（`MP NPC Sera Hub`）

```
<<if !$mpSeraEnded>>
<<if (_npc.stage or 0) lt 10>>父亲的旧案还压在柜台底下……
<<elseif (_npc.love or 0) lt 30 and (_npc.trust or 0) lt 30>>她已经肯谈父亲……
<<else>>手记已集齐 x/6 页……条件满足时给「接着查父亲的怀表」链接<</if>>
<</if>>
```

要点：**条件不满足也要显示提示**，写清楚差什么；不要整段隐藏。

### 每步页（`MP NPC Sera Quest Step N`）

```
<<if Time.days lt (_sera.setback or 0)>><<goto "MP NPC Sera Quest Closed">>
<<elseif Time.days lt (_sera.nextQuestDay or 0)>><<goto "MP NPC Sera Quest Waiting">>
<<elseif Time.hour lt 8 or Time.hour gte 20>><<goto "MP NPC Sera Quest Waiting">>
<<elseif (_sera.stage or 0) lt 10 or ((_sera.love or 0) lt 30 and (_sera.trust or 0) lt 30)>><<goto "MP NPC Sera Quest Waiting">>
<<elseif (_sera.questStage or 0) gte N>><<goto "MP NPC Sera Quest Waiting">>
<<elseif (_sera.fatherLog or 0) lt N>><<goto "MP NPC Sera Quest Waiting">>
```

成功：
```
<<set _sera.questStage to Math.max(_sera.questStage or 0, N)>>
<<set _sera.nextQuestDay to Time.days + 1>>
<<set _sera.cadence to Math.min(100, (_sera.cadence or 25) + 4)>>
<<stress -3>>
```

失败：
```
<<set _sera.setback to Time.days + 2>>
<<set _sera.rep to Math.max(0, (_sera.rep or 50) - 5)>>
<<set $mpClockParts to Math.max(0, ($mpClockParts or 0) - 1)>>
<<stress 2>>
```

### 结局

```
<<set $mpSeraEnded to 1>><<set $mpWorldSeraEnding to "stay">>
```
- 已结束时只显示对应结局页：`<<if $mpSeraEnded and $mpWorldSeraEnding is "stay">><<goto ...>><</if>>`
- 世界标志在 `MP NPC Sera Deep Hub`、`MP NPC Sera Schedule`、`mp-loc-highstreet.twee` 各读一次。
- 代价：`stay` 每周维护费 -25；`depart` 委托工钱 650→450、少一只常修表。

---

## 2. 学园地点（`mp-loc-school.twee`）

- 入口：`scripts/mp.js` → `DEEP_HUB_HOOKS` 的 `school` 条目，`locs: ["School"]`，`noDiscover: true`，`check: function () { return true; }`，`passage: "MP Loc School Hub"`。
- 课表：`MP Loc School Class`
  - `_schoolDay = (Time.weekDay gte 1 and Time.weekDay lte 5)`（周一到周五，别写成 2–6）
  - 时段 9–12 / 13–15，每节 1 小时
  - 用 `$schoolrep` / `$delinquency` / `$schoolstate`
  - 上课：`schoolrep +1`、`delinquency -1`（下限 0）、`stress -1`；逃课反向
- 留堂：`MP Loc School Detention`
  - `Time.weekDay 1–5`、`Time.hour 15–18`、`$delinquency >= 3`
  - 留堂 `delinquency -2`；拒绝 `+2`、`schoolrep -2`
- 结局：`$mpSchoolEnded` + `$mpWorldSchoolOutcome`；A 需 `schoolrep >= 5` 且 `delinquency <= 2`，B 需 `schoolrep <= 0` 或 `delinquency >= 5`。
- 节日 Finale 也写同一世界标志（当前只写 outcome 不写 ended，属已知遗留）。

---

## 3. 账本长线（`mp-ledger-debt.twee`）

- `mpLedgerTick` widget：
  - `$mpLedger.nextDueDay` 首次 `_today + 7`
  - `Time.days >= nextDueDay`：`week += 1`、`amount = min(3000, 1500 + prot*350)`、`nextDueDay += 7`、未付清 `overdue += 1`
  - 调用点：`MP Ledger Hub`、`MP Loc Orphanage Hub`、孤儿院睡眠页
- 逾期夜事件：`MP Ledger Punish Night` / `After`，`$daily.mpLedgerNight` 防重；`overdue >= 3` 触发孩子被带走（保护位 -1、`$mpWorldLedgerLoss`）。
- 结局门槛：
  - Clear：`overdue is 0` 且 `paidWindow` 覆盖本期
  - Seize：`_protCnt >= 1` 或安全屋路线
  - Escape：至少一处 `$mpSafehouses` tier >= 1
- 一次性：`$mpLedgerEnded` + `$mpWorldOrphanageOutcome`；已结束只显示已达成的结局。

---

## 4. 可直接复用的判断

| 需求 | 写法 |
| --- | --- |
| 每天一步 | `nextStepDay = Time.days + 1`，入口先 `Time.days lt nextStepDay` 拦截 |
| 失败锁两天 | `setback = Time.days + 2`，入口先 `Time.days lt setback` 拦截 |
| 每周资源 +1 | 周键 `Math.floor(Time.days / 7)`，存 `x.weekKey`；同一周只 +1 |
| 一次性结局 | `$mp<Name>Ended = 1`，所有入口先查这个 flag |
| 世界回声 | `$mpWorld<Name>Outcome`，在 2 个不同页面用 `<<if>>` 读 |
| 旧档兜底 | 一律 `(x.var or 0)`，不要假设字段存在 |
