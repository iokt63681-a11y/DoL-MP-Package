# CHANGES — dev45（三个结构试点：塞拉父志线 / 学园地点 / 账本长线）

## 1. 概述

以 `v1.2.0-dev43` 为基线，落地三个「DoL 结构」试点：时间跨度、地点/资源前置、失败后果、一次性结局。只改试点相关文件，其余内容不动。

- 全库：3,410 个 passage（较 dev43 新增 13 页：学园课堂/留堂、学园场馆 C、账本逾期夜、孤儿院睡眠与杂务分区等）
- 修改文件：`mp-npc-sera*.twee`、`mp-loc-school*.twee`、`mp-ledger-debt*.twee`、`mp-loc-orphanage*.twee`、`mp-loc-highstreet.twee`、`mp-content-hubs.twee`、`scripts/mp.js`、`boot.json`
- 版本：`1.2.0-dev45`

## 2. 塞拉个人线

- 旧线 `_sera.stage` 0–10 保留为第一阶段；父志线 `_sera.questStage` 0–5 为第二阶段，入口要求 `stage >= 10` 且 `love/trust >= 30`。
- 删除 `fatherLog = 6` 保送；Step 1/2/2B/3/3B/4 分别要求 `fatherLog >= 1/2/3/4/5/6`，只能靠每周修表结算 +1。
- 每步写 `nextQuestDay = Time.days + 1`；未到日期只显示「等消息」页。2B/3B 限定 docks 8–18，其余 town 8–20。
- 失败：`setback = Time.days + 2`、`rep -5`、`$mpClockParts -1`，锁两天，不能当场重试。
- 结局一次性：`$mpSeraEnded` + `$mpWorldSeraEnding`（stay/depart）；highstreet、Schedule、Deep Hub 读取。stay 每周扣 25 维护费；depart 工钱 650→450、少一只常修表。
- RelDay 每幕隔一天；Daily/Street/Season 加每日锁。

## 3. 学园地点

- `mp.js` 的 `DEEP_HUB_HOOKS` 新增 `School` 入口，返回原生 School。
- 新增 `MP Loc School Class`：周一至周五 9–12 / 13–15，每节 1 小时；用 `$schoolrep/$delinquency/$schoolstate`，上课 `schoolrep +1`、`delinquency -1`、`stress -1`，逃课反向。
- 新增 `MP Loc School Detention`：15–18、`delinquency >= 3` 强制留堂；留堂 `delinquency -2`，拒绝 `+2`、`schoolrep -2`。
- 3–5 个加权随机事件；旧杂务只在 12–13 / 15–18 开放。
- 一次性结局：`$mpSchoolEnded` + `$mpWorldSchoolOutcome`；A 需 `schoolrep >= 5` 且 `delinquency <= 2`，B 需 `schoolrep <= 0` 或 `delinquency >= 5`。节日 Finale 也写同一世界标志。
- 场馆旧杂务拆成 B/C 两页，避免单页选项超 5。

## 4. 账本长线

- 新增 `mpLedgerTick` widget：按天翻周，`amount = min(3000, 1500 + prot*350)`，逾期 +1，`nextDueDay += 7`；Hub / 孤儿院 / 睡眠页调用。
- 新增逾期夜事件 `MP Ledger Punish Night` / `After`；`overdue >= 3` 触发孩子被带走（保护位 -1，写 `$mpWorldLedgerLoss`）。
- 三个结局加门槛并一次性：Clear 用 `paidWindow` 判断，Seize 需保护位/安全屋，Escape 需安全屋 tier >= 1；写 `$mpWorldOrphanageOutcome`。
- 孤儿院 More Hub 9→4；二级 Hub 补兜底；新增睡眠页。

## 5. 本轮修掉的 bug

- 账本 `paid` 累计后 Clear 永久满足 → 改用 `paidWindow`；付清后不再重复扣钱。
- 学园 `Time.weekDay gte 2 and lte 6`（周二到周六）→ 改为 `gte 1 and lte 5`（周一到周五）。
- 学园/孤儿院分页后的标签长度重复、正文超 200、单路径选项 1 或 6，全部收口。
- 节日 Hub 的四季入口改为常显（已了结的季进入后由 `$daily` 防重），移除与四季同屏的 Finale 按钮，避免 6 选项。
- 删掉 Finale 注释里泄漏的 `$mpWorldSchoolOutcome` 变量名。

## 6. 入口可见性（可玩性修复）

- **塞拉父志线**：`MP NPC Sera Hub` 现在始终显示一段进度提示——旧案阶段不足、信任/爱意不到 30、手记 0–6 页，各写明差什么；条件满足时直接给「接着查父亲的怀表」入口，不再要求先钻进深层 Hub 才看得到。
- **学园**：`DEEP_HUB_HOOKS` 的 School 入口去掉「已注册/已见学生」的硬条件，走到原生 School 页就能看到「去旧馆看看 (0:05)」。
- **账本**：孤儿院 Hub 正文始终显示暗门提示与「距下次翻账 N 天 / 逾期 N 笔」，中段的「翻旧欠条」入口照旧。

## 7. 验收

- 渲染：491 页选项 2–5、图标 ≤4、正文 60–200，0 违规
- `verify_pilots.py`：三试点结构门槛 0 问题
- 宏配平 0、MP 断链 0、`getouticon` 置顶 0 违规
- 学园/孤儿院/节日/神殿渲染标签 4–8 且同屏互异，0 违规
- 12 字重合仅剩 4 条旧内容（guild/temple），本轮试点页 0
- `MP Temple Post Hub` 在 `audit_v48.py` 仍报 4 条静态假阳性（互斥分支相加），渲染路径 0 违规

## 8. 已知遗留

- 学园节日 Finale 只写 `$mpWorldSchoolOutcome`，不写 `$mpSchoolEnded`；Hub 已用 `elseif` 分支读取 outcome，行为一致，待后续统一。
- 孤儿院基础页、学园基础页的旧事件仍是「单次点击推进」，未全部改成前置链；本轮只动了三个试点。
- V49 工作包暂停：它仍是「加页」而不是「改结构」，需按结构任务重写后再发。
