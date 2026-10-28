# 入口速查（dev45）

## 五人个人线（任务 A）

| NPC | 主 Hub | 深 Hub | 现有第二阶段变量 | 接入要求 |
| --- | --- | --- | --- | --- |
| 阿什 | `MP NPC Ash Hub` | `MP NPC Ash Deep Hub` | 无 `deepStage`，需新建 | 旧 `stage` 走完 + love/trust ≥30 |
| 林恩 | `MP NPC Lin Hub` | `MP NPC Lin Deep Hub` | 无 | 同上 |
| 莫奈 | `MP NPC Monet Hub` | `MP NPC Monet Deep Hub` | 无 | 同上 |
| 诺艾尔 | `MP NPC Noel Hub` | `MP NPC Noel Deep Hub` | 无 | 同上 |
| 维斯 | `MP NPC Vesper Hub` | `MP NPC Vesper Deep Hub` | 无 | 同上 |
| 塞拉（已完成，照抄） | `MP NPC Sera Hub`（mp-new-npcs.twee） | `MP NPC Sera Deep Hub`（mp-npc-sera.twee） | `questStage`/`nextQuestDay`/`setback`/`fatherLog` | — |

接入页允许改动的地方：

- 各自 `Hub` 加一段进度提示（不满足条件也显示差什么）。
- 各自 `Deep Hub` 加下一步入口。
- 其余文件不动。

## 地点（任务 B）

| 地点 | 现有入口 | 备注 |
| --- | --- | --- |
| 学园（已完成） | `mp.js` → `DEEP_HUB_HOOKS.school` → `MP Loc School Hub` | 照此写其他地点 |
| 孤儿院（已完成） | `mp.js` → `DEEP_HUB_HOOKS` 无孤儿院条目；入口在 `MP Loc Orphanage Hub` 及 Town 侧告示 | 账本入口在中层「翻旧欠条」 |
| 码头 | `mp-docks-depth.twee`、`MP Region Foghorn*` 系列 | 入口页名自定，接原生 `Docks` |
| 高街 | `mp-loc-highstreet.twee` → `MP Loc HighStreet Hub` | 已有 `DEEP_HUB_HOOKS.highstreet` |
| 森林 | `mp-loc-forest.twee` → `MP Loc Forest Hub` | 接原生 `Forest` |
| 神殿 | `mp-loc-temple.twee` → `MP Loc Temple Hub` | 已有 `DEEP_HUB_HOOKS.temple` |

`DEEP_HUB_HOOKS` 当前只有 docks / temple / highstreet / school 四条；森林需要新增一条（照 school 的写法）。

## 长线（任务 C）

| 长线 | Hub | 现有状态 | 要补 |
| --- | --- | --- | --- |
| 雾潮 | `MP Fog Tide Hub` / `MP Fog Tide Survey Hub` | 0–7 阶段、三结局 | `nextStageDay`、阶段资源门槛、结局门槛 |
| 十二行会 | `MP Guild Assembly Hub` | 声望 + 议案 | 季度 `nextBillDay`、议案票门槛、失败后果 |
| 神殿裂缝 | `MP Temple Schism Hub` | 三分支 | 阶段间隔、恩典/立场门槛、结局一次性 |
| 账本（已完成） | `MP Ledger Hub` | `mpLedgerTick` 按天翻周 | — |

## 变量命名约定

- 个人线：`$mpNpcs.<id>.<field>`；**不要**顶层 `$mpAshXxx` 一串。
- 一次性结局：`$mp<Name>Ended`。
- 世界标志：个人线 `$mpWorld<Name>Ending`；地点 `$mpWorld<Location>Outcome`；长线 `$mpWorld<Line>Outcome`。
- 日锁：`$daily.<key>`；周锁：`<npc>.weekKey = Math.floor(Time.days / 7)`。
