# dev45 三个结构试点规格

> 目标：证明「DoL 结构」能落地——时间跨度、地点/资源前置、失败后果、一次性结局。
> 只改各自文件；保持 60–200 字/分支、渲染 2–5 选项、标签 4–8 字且同页互异、图标 ≤4、getouticon 置顶、`(0:NN)` 与 `<<pass>>` 一致。

## 通用要求

1. 每个 Quest/事件步骤必须有：
   - 关系/资源前置（love/trust/axis/持有物/钱/技能）；
   - 时间前置（`Time.days >= nextStepDay`，每天最多推进 1 步）；
   - 地点/时段（`$location` 与正文一致；关键步加 `Time.hour`/`Time.weekDay`）；
   - 失败后果（`setbackUntil = Time.days + N`、扣资源/信任/声望，锁 N 天，不能当场重试）。
2. 步骤推进后写 `nextStepDay`；未到日期只显示「等明天/去别处」的提示页，不显示下一步链接。
3. 结局：一次性 `$mp<Name>Ended`；写世界标志；世界标志至少被 2 个页面读取；结局有代价（收入/地点/关系/资源）。
4. 删除/关闭「保送」链接：没有前置的点击推进一律改成有门槛的版本。
5. 所有可重复收益加 `$daily` 或每日上限；RelDay 每天最多 1 幕。
6. 不新增只写不读变量；旧存档字段用 `or` 兜底，避免锁死。
7. 修完跑：
   `python -I C:\Users\24893\Downloads\_v48work\audit_v48.py C:\Users\24893\Downloads\_dev45_work\mod-src`
   `python -I C:\Users\24893\Downloads\_v48work\check_render.py C:\Users\24893\Downloads\_dev45_work\mod-src`
   自己文件 style 0、渲染 0；全库断链/宏配平 0。

---

## 试点 1：塞拉个人线

文件：`mp-npc-sera*.twee`（含 relday/daily/date/social）、`mp-loc-highstreet.twee`（结局回声）。不要改 `mp-world-state.twee`。

### 1.1 新旧线统一
- 旧线 `_sera.stage` 0–10（每天一段）保留为第一阶段。
- 新父志线 `_sera.questStage` 0–5 作为第二阶段，入口必须 `_sera.stage >= 10` 且 `(love >= 30 or trust >= 30)`。
- 在 `MP NPC Sera Deep Hub` 或 Quest 入口明确显示「父亲的旧案还没走完 / 可以继续」；未满足时不显示新线入口。
- 不允许两套变量互相跳过。

### 1.2 父志六页变成真前置
- 删除 `Quest Step 2B` 里的 `<<set _sera.fatherLog to 6>>`。
- 新线每步要求 `fatherLog`：
  - Step 1：`fatherLog >= 1`
  - Step 2：`>= 2`
  - Step 2B：`>= 3`
  - Step 3：`>= 4`
  - Step 3B：`>= 5`
  - Step 4：`>= 6`
- 父志页只能靠 `Repair Settle` 每周修好一只表 +1（每周最多 3 页）；玩家必须跨约两周修表才能推进。

### 1.3 每天一步 + 地点/时段
- 每个新线步骤完成后写 `_sera.nextQuestDay = Time.days + 1`；未到日期只显示「回家等消息」页。
- Step 2B/3B 必须在 `docks` 且 `Time.hour` 8–18；Step 3 在旧港；其余在 `town` 8–20。
- 关键步加一次「往返」时间（8–15 分钟）。

### 1.4 失败后果
- 失败写 `_sera.setback = Time.days + 2`、`_sera.rep -= 5`、`$mpClockParts -= 1`；入口在 setback 前只显示「铺子这周不开门」。
- 修表失败已经锁该表一周；保留，但去掉正文里的「回溯/下周重置」系统词，改成塞拉的口吻。

### 1.5 结局一次性 + 代价
- `Ending SecondFloor` / `Ending Departed` 写 `$mpSeraEnded = 1` 与 `$mpWorldSeraEnding = "stay"/"depart"`；已结束时只显示已达成结局，不再给另一条。
- `$mpWorldSeraEnding` 至少在 `mp-loc-highstreet.twee` 与 `mp-npc-sera.twee` 的 Schedule/Deep Hub 各读一次。
- depart：修表委托收入下降 / 每周少一只表；stay：失去远航线，铺面维护费增加。数值不要太大，但要有。

### 1.6 去刷
- `Street 1–3`、`Daily Hub/A/B` 的杂务、`Season`、`Date Season` 全部加 `$daily` 或每日上限。
- `RelDay Sera 1–14`：每幕 `Time.days` 递增 1，未到日期只能回「明天再来」。

---

## 试点 2：学园地点

文件：`mp-loc-school*.twee`、`scripts/mp.js`（只加 hook）、`mp-content-hubs.twee`（入口/返回可改）。不要改其他地点。

### 2.1 入口接回原生 School
- 在 `mp.js` 的 `DEEP_HUB_HOOKS` 加 `School`：
  - `locs: ["School"]`
  - check：`$schoolstate` 存在 / 上过学 / 见过任意学生 NPC；不要开局直接可见。
  - hint：校门/走廊里的启事或同学提到旧馆。
  - linkText：`去旧馆看看 (0:05)`，passage `MP Loc School Hub`。
- `MP Loc School Hub` 的返回改成原生 `School`（或 `<<back>>`），不再是高街布告栏。

### 2.2 课表与成绩
- 新增/改写 `MP Loc School Class`：
  - 周一至周五 `Time.hour` 9–15 才可上课；每节课 1 小时；5 节/天。
  - 每节课用 `$schoolstate` / `$schoolrep` / `$delinquency` 中至少两个原版变量。
  - 上课：`$schoolrep +1`、`$delinquency -1`（下限 0）、`stress -1`；缺课/逃课：`$delinquency +1`、`$schoolrep -1`。
  - 每节课有 1 个技能检定（maths/english/science），失败只加 stress/扣 rep，不发钱。
- 现有杂务（擦黑板/理书卡/标本/器材/档案/锅炉）只在午休 12–13 或放学 15–18 开放；凌晨不可做。
- 新增 `MP Loc School Detention`：`$delinquency >= 3` 时放学后强制留堂 1 小时，`$detention +1`，留堂后 `$delinquency -2`；拒绝留堂 `$delinquency +2`、`$schoolrep -2`。

### 2.3 随机与失败
- 进入学园/课间时按权重 roll 一个小事件池（3–5 个，可用 `random(`）：迟到、同学告状、操场争执、图书室偶遇、雨天积水。
- 事件失败给 `$delinquency +1` 或 `$schoolrep -1`，不只 stress。
- 至少一个事件与诺艾尔/林恩/莫奈之一联动（`mpNpcMet` 门控）。

### 2.4 一次性结局
- `MP Loc School Ending A/B` 写 `$mpSchoolEnded = 1` 与 `$mpWorldSchoolOutcome`；已结束时只显示已达成结局。
- 结局条件：A 需 `$schoolrep >= 5` 且 `$delinquency <= 2`；B 需 `$schoolrep <= 0` 或 `$delinquency >= 5`。
- 世界标志在 `mp-loc-school.twee` 与 `mp-loc-school-more2.twee` 各读一次（或 `mp-world-state.twee` 只读不改）。

---

## 试点 3：账本长线

文件：`mp-ledger-debt*.twee`、`mp-loc-orphanage.twee`（逾期夜事件）。不要改 `mp-world-state.twee`。

### 3.1 按天推进
- 新增 `$mpLedger.nextDueDay`（首次进入时设为 `Time.days + 7`）。
- 在 `MP Ledger Hub`、`MP Loc Orphanage Hub`、孤儿院睡眠页各调用一次 `mpLedgerTick`：
  - 若 `Time.days >= nextDueDay`：`week += 1`，`amount = min(3000, 1500 + protCnt*350)`，`nextDueDay += 7`；若未付清，`overdue += 1`。
  - 逾期不清零，除非成功 Pay。
- `MP Ledger Pay` 成功才清 overdue；失败保留（已有）。
- Hub 显示「距下次翻账还有 N 天」。

### 3.2 逾期夜事件
- 在孤儿院夜间/睡眠页：若 `overdue > 0` 且当日未触发，按 `overdue` 概率触发一次 `MP Ledger Punish` 事件（可复用 Overdue/Seize 页），后果：钱/物品损失、保护位 -1 或 stress/trauma；写 `$daily.mpLedgerNight` 防重复。
- 逾期 3 次以上，触发一次不可逆的「孩子被带走」事件（保护位 -1，世界标志 `$mpWorldLedgerLoss`）。

### 3.3 结局门槛与一次性
- `MP Ledger Ending Clear`：需 `$mpLedger.overdue is 0` 且 `$mpLedger.paid >= $mpLedger.amount`（或 amount 已 0）。
- `MP Ledger Ending Seize`：需 `_protCnt >= 1` 或安全屋路线；否则只显示「还没到那一步」。
- `MP Ledger Ending Escape`：需 `$mpSafehouses` 至少一处 tier >= 1。
- 结局写 `$mpLedgerEnded = 1` 与 `$mpWorldOrphanageOutcome`；已结束时只显示已达成结局。
- 世界标志在 `mp-loc-orphanage.twee` 与 `mp-ledger-debt.twee` 各读一次。

### 3.4 失败后果
- Pay 失败：不清 overdue、week 不推进（已有）；额外 `stress 3`。
- 救援失败：`overdue +1`（已有）；额外当夜触发一次巡查事件。
- 惩罚失败：保护位 -1；写一次 `$mpWorldLedgerLoss`，被孤儿院页读取。

---

## 验收

- 三个试点各自：关键步骤有 `Time.days`/`Time.hour` 门槛；失败有 setback/扣资源；结局一次性且世界标志被 ≥2 页读取。
- 全库 385 页渲染 0 违规、断链 0、宏配平 0。
- 回报：每个试点改了哪些页面、加了哪些门槛/变量、失败与结局怎么处理、审计结果、未解决项。
