# 信物收集支线 V2 自检报告

- 日期：2026-10-23
- 修改文件：`mod-src/twees/mp-main-and-collection-quests.twee`
- 范围：`MP Collection Quests Hub` + 6 条收集线（每条 3 段）
- 未改动：`MP Main Story Eclipse Hub` / `MP Main Story Eclipse Resolve`（替换前后前缀 SHA-256 一致）

## 1. 结构与命名

| 项目 | 结果 |
| --- | --- |
| 文件 passage 总数 | 21 |
| 收集段 passage 数 | 19（hub 1 + 18 段） |
| 收集线数 | 6 |
| 每线段数 | 3（Resolve 入口 + Step2 + Step3） |
| passage 重名 | 0 |
| 6 个原入口名保留 | 6/6 |
| 12 个新增 Step2/Step3 | 12/12 |

## 2. 断链检查

- 收集段静态链接：61 条
- 目标不存在：0 条
- `_exitPas` 为动态返回目标，按设计跳过静态目标检查。

## 3. 室内外与地点

- 收集段 `$outside` / `$location` 覆盖：19 / 19
- 缺失：0
- 非法地点：0
- 实际地点：`avery_mansion`, `brothel`, `connudatus`, `docks`, `forest`, `garden`, `high`, `industrial`, `orphanage`, `school`, `searocks`, `temple`, `underground`

| passage | outside | location |
| --- | --- | --- |
| MP Collection Quests Hub | 1 | high |
| MP Collection Resolve CrownGear | 0 | underground |
| MP Collection Resolve CrownGear Step2 | 0 | high |
| MP Collection Resolve CrownGear Step3 | 0 | underground |
| MP Collection Resolve AbyssPage | 0 | temple |
| MP Collection Resolve AbyssPage Step2 | 0 | school |
| MP Collection Resolve AbyssPage Step3 | 0 | temple |
| MP Collection Resolve SmugglerRing | 1 | searocks |
| MP Collection Resolve SmugglerRing Step2 | 0 | docks |
| MP Collection Resolve SmugglerRing Step3 | 1 | searocks |
| MP Collection Resolve BrideFlower | 0 | avery_mansion |
| MP Collection Resolve BrideFlower Step2 | 1 | forest |
| MP Collection Resolve BrideFlower Step3 | 0 | garden |
| MP Collection Resolve VelvetCrest | 0 | brothel |
| MP Collection Resolve VelvetCrest Step2 | 1 | connudatus |
| MP Collection Resolve VelvetCrest Step3 | 0 | brothel |
| MP Collection Resolve LedgerKey | 1 | industrial |
| MP Collection Resolve LedgerKey Step2 | 0 | orphanage |
| MP Collection Resolve LedgerKey Step3 | 0 | orphanage |

## 4. 图标

- 使用图标：`brothelicon`, `getouticon`, `investigateicon`, `parkicon`, `shopicon`, `sneakicon`, `socialiseicon`, `templeicon`, `walkicon`
- 未注册图标：0
- `athleticicon` / `workicon`：0 / 0

## 5. 检查与选择

- 18 段中带技能/属性检查：18 / 18
- 检查类型：skulduggery / history / english / maths / science / willpower / seduction
- 每段链接数下限：3（含退路）；少于 2 的段落：0
- 失败代价：`pain` / `stress` / `trauma` / `tiredness`，且不阻断后续推进。
- 入口段直接给出『残片为何值得拼』，Step2 写拼合/校对，Step3 写最终处置。

## 6. 奖励

- `_reward` 档位：£8, £16, £25（便士值 [800, 1600, 2500]）
- 直接 `<<money 数字>>`：无
- `$money += 180000`：0 处
- 一次性奖励 key：12 个，重复 key：0
- 一次性大奖励（古董/属性）由 `collect_<name>_complete` 防重复；最终金钱由 `collect_<name>_payout` 防重复。

| 收集线 | complete key | payout key |
| --- | --- | --- |
| CrownGear | `collect_crown_gear_complete` | `collect_crown_gear_payout` |
| AbyssPage | `collect_abyss_page_complete` | `collect_abyss_page_payout` |
| SmugglerRing | `collect_smuggler_ring_complete` | `collect_smuggler_ring_payout` |
| BrideFlower | `collect_bride_flower_complete` | `collect_bride_flower_payout` |
| VelvetCrest | `collect_velvet_crest_complete` | `collect_velvet_crest_payout` |
| LedgerKey | `collect_ledger_key_complete` | `collect_ledger_key_payout` |

## 7. 进度标记

- hub 使用 `$mpCollectHubUnlocked`：是
- 6 条 Step3 均累加 `$mpCollectHubUnlocked`：是
- 6 个 `$mpDone<Name>` 完成标记：6 / 6
- 原 `$mpFrag<Name> gte 3` 需求判断保留在 hub：6 / 6
- 未新增碎片变量；18 段只读取 `$mpClues` 与既有技能变量。

## 8. NPC 保护

- `npcincr` 次数：16，涉及：Avery, Briar, Gwylan, Jordan, Leighton, Sera, Sydney
- 未经 `$NPCName && $NPCNameList.includes(...)` 保护的 `npcincr`：0

## 9. 文本重复

- 收集段中 ≥10 汉字的重复完整句：0
- 链接标签含『并/然后/接着/结果/被』：0

## 10. 结论

- 结构、命名、断链、室内外、地点、图标、奖励防重复与 NPC 保护检查通过。
- 6 条线均由『为什么值得拼』进入，经拼合/校对，最后落到处置与关系/状态差异。
- 最终金钱奖励控制在 £8 / £16 / £25 三档，原 £1800 一次性奖励已移除。
- 本报告为静态源码检查，不替代游戏内逐段点击测试。
