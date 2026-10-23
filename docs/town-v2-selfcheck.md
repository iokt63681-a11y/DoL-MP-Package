# 城镇暗线 V2 自检

日期：2026-10-23

## 范围

`mod-src/twees/mp-storylines-town.twee`

- 6 条线 × 7 段 = 42 个 passage
- 保留原入口名、`$mpQuest*` 阶段变量和 Resolve 名
- 新增 Step2~Step6，入口页支持旧存档按阶段续接

## 结构检查

| 项目 | 结果 |
|---|---|
| passage 数 | 42 |
| 重名 passage | 0 |
| 断链 / 不存在的目标 | 0 |
| `$outside` / `$location` 前 200 字符覆盖 | 42 / 42 |
| `athleticicon` / `workicon` | 0 |
| 重复句组（>=10 字） | 0 |
| 每个 passage 至少 2 个链接 | 通过（Resolve 页除外） |

## 检查与分支

- 10 处 `<<skulduggerycheck>>`
- 22 / 42 个 passage 至少含 1 个技能/属性门槛（`gte` 或技能检查），约 52%
- 失败分支都有代价：`pain` / `stress` / `trauma` / 丢线索 / 扣钱 / 被赶走
- 每条线至少 1 个软坏结局或被抓分支，至少 3 种脱身/处置方式
- 每条线有 1 个最终分档奖励，按 `skulduggery` / `willpower` / `english` / `history` / `maths` / `science` 与线索数计算

## 奖励防刷

- 6 条线的最终报酬都通过 `claimUniqueReward("town_*_payout")` 只发一次
- 二次进入 Resolve 只显示“没有新的进项”，不再重复给钱
- 古董 / 碎片奖励继续用独立的 `claimUniqueReward` key
- `<<money 1200>>` = £12；最终档位约 £8~£26

## 线索

新增 `$mpClues` key：

- `town_cellar_*`
- `town_attic_*`
- `town_clock_*`
- `town_docks_*`
- `town_school_*`
- `town_temple_*`

这些 key 只在本文件内消费；不依赖 `$mpKnown`，不会和 new-regions 的 key 冲突。

## 已知待办

- 需要双开/实机走一遍 6 条线的 7 段，确认旧存档阶段续接和 Resolve 二次进入不重复发钱。
- 需要把新 `spa` location 的 `mpAmbient` case 一起打进包（已在 `mp-locations.twee` 添加）。
- 文风仍需人工抽读，重点看长段落和 NPC 对话是否自然。
