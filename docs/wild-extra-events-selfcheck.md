# 荒野/近郊额外遭遇自检

- 文件：`mod-src/twees/mp-wild-extra-events.twee`
- 日期：2026-10-23
- 范围：8 条新遭遇 × 3 段（Setup → Step2 → Resolve），加 1 个入口 hub，共 25 个 passage
- 脚本：Python 3（`-I` 隔离模式）解析 twee，并读取本体 `game/Degrees of Lewdity.html` 的 `tw-passagedata` 名单核对链接目标

## 结论

结构自检全部通过：25 个 passage 名称唯一；57 条链接全部有目标；25/25 有 `$outside` 与合法 `$location`；宏开闭配平；无任何扣钱；24 个正文 passage 各含 1 个检定，共 24 个检定；正文汉字数均在 500～1000 区间；未使用未注册图标；4 处 `npcincr` 均由 `NPCNameList.includes(...)` 保护。

## 明细

| 项目 | 结果 |
| --- | --- |
| passage 总数 | 25（24 正文 + 1 hub） |
| passage 名称唯一 | 25/25 |
| 链接总数 | 57（正文 48 + hub 9） |
| 断链 / 空链接 | 0 |
| 外部返回目标 | 7 个：`Beach`、`Sea Rocks`、`Forest`、`Farmland`、`Lake Ruin`、`Elk Street`、`Park`（均在本体 HTML 中存在） |
| `$outside` / `$location` 开关头 | 25/25，均紧跟 passage 标题行 |
| 非法 `$location` | 0 |
| 检定入口 | 24/24（每个正文 passage 1 个） |
| 检定失败后果 | 24/24 均有 pain / stress / tiredness / 线索清零中的至少一项 |
| 未注册图标 | 0 |
| 使用图标 | investigate、sneak、socialise、walk、getout、temple、shop、swim、beach、park、cave、tending（12 种，全部在允许清单内） |
| NPC 关系变化 | 4 处：Eden、Alex、Gwylan、Robin；均用 `NPCNameList.includes(...)` 保护 |
| 正文汉字数 | 合计 12,983；最短 503，最长 603，平均 541.0 |
| 单段汉字数越界 | 0 |
| 12 字以上重复句 | 0 |
| 每段选择数 | 24/24 均为 2 个（hub 为 8 + 1） |
| 扣钱 | 0（无 `<<money -...>>`、无 `$money -=`） |
| 奖励宏 | 8 处，全部为 `<<money _reward>>` |
| 一次性奖励 | 8/8 Resolve 均调用 `claimUniqueReward` |
| 宏开闭 | `<<` / `>>` 718/718；if/endif、link/endlink 全部配平 |

## 检定分布

| 检定 | 次数 |
| --- | ---: |
| 英语 `$english` | 5 |
| 诡术 `$skulduggery` | 5 |
| 意志 `$willpower` | 6 |
| 体能 `$athletics` | 3 |
| 照料 `$tending` | 2 |
| 游泳 `$swimmingskill` | 1 |
| 历史 `$history` | 1 |
| 数学 `$maths` | 1 |
| 合计 | 24 |

## 八个条目

| # | 条目 | 题材 | `$location` | 奖励档位 | 一次性键 |
| --- | --- | --- | --- | --- | --- |
| 1 | `MP Wild Extra Shell Arrows` | 退潮后第二层洞的贝壳箭头 | searocks | £3.00 / £4.80 / £7.20 | `wild_extra_shell_arrows_payout` |
| 2 | `MP Wild Extra Log Circle` | 深林倒木圈与中央铁锅 | forest | £3.20 / £5.00 / £7.00 | `wild_extra_log_circle_payout` |
| 3 | `MP Wild Extra Boundary Stone` | 灌溉渠底被泥糊住的界石 | farm | £3.20 / £5.00 / £7.20 | `wild_extra_boundary_payout` |
| 4 | `MP Wild Extra Fog Whistle` | 湖畔清晨只响一声的雾笛 | lake_ruin | £3.00 / £4.60 / £6.60 | `wild_extra_fog_whistle_payout` |
| 5 | `MP Wild Extra Red Thread Herbs` | 峭壁红绳草药与换方向的绳结 | cliff | £3.40 / £5.00 / £7.00 | `wild_extra_red_herbs_payout` |
| 6 | `MP Wild Extra Vent Flags` | 旧矿道通风井的多色布条 | underground | £3.00 / £4.50 / £6.40 | `wild_extra_vent_flags_payout` |
| 7 | `MP Wild Extra Galley Pot` | 海盗船残骸厨房的余温汤锅 | pirate_ship | £2.80 / £4.20 / £6.20 | `wild_extra_galley_pot_payout` |
| 8 | `MP Wild Extra Pebble Pattern` | 石环外圈每天重摆的石子图案 | forest | £2.80 / £4.20 / £6.00 | `wild_extra_pebble_pattern_payout` |

奖励档位按检定值三档划分，均在 £2～£10 内；重复进入 Resolve 时 `claimUniqueReward` 返回 false，不再发钱，只保留少量压力恢复，避免刷取。

## 逐段清单

| passage | 汉字 | 选择 | 检定 | outside | location |
| --- | ---: | ---: | --- | ---: | --- |
| MP Wild Extra Events Hub | 209 | 9 | 无（导航） | 1 | park |
| MP Wild Extra Shell Arrows | 535 | 2 | 英语 | 1 | searocks |
| MP Wild Extra Shell Arrows Step2 | 552 | 2 | 诡术 | 0 | searocks |
| MP Wild Extra Shell Arrows Resolve | 525 | 2 | 游泳 | 0 | searocks |
| MP Wild Extra Log Circle | 542 | 2 | 体能 | 1 | forest |
| MP Wild Extra Log Circle Step2 | 528 | 2 | 诡术 | 1 | forest |
| MP Wild Extra Log Circle Resolve | 563 | 2 | 意志 | 1 | forest |
| MP Wild Extra Boundary Stone | 531 | 2 | 英语 | 1 | farm |
| MP Wild Extra Boundary Stone Step2 | 523 | 2 | 历史 | 1 | farm |
| MP Wild Extra Boundary Stone Resolve | 600 | 2 | 意志 | 1 | farm |
| MP Wild Extra Fog Whistle | 524 | 2 | 意志 | 1 | lake_ruin |
| MP Wild Extra Fog Whistle Step2 | 521 | 2 | 诡术 | 1 | lake_ruin |
| MP Wild Extra Fog Whistle Resolve | 589 | 2 | 体能 | 1 | lake_ruin |
| MP Wild Extra Red Thread Herbs | 517 | 2 | 照料 | 1 | cliff |
| MP Wild Extra Red Thread Herbs Step2 | 525 | 2 | 意志 | 1 | cliff |
| MP Wild Extra Red Thread Herbs Resolve | 603 | 2 | 体能 | 1 | cliff |
| MP Wild Extra Vent Flags | 503 | 2 | 英语 | 0 | underground |
| MP Wild Extra Vent Flags Step2 | 520 | 2 | 诡术 | 0 | underground |
| MP Wild Extra Vent Flags Resolve | 570 | 2 | 意志 | 0 | underground |
| MP Wild Extra Galley Pot | 515 | 2 | 英语 | 0 | pirate_ship |
| MP Wild Extra Galley Pot Step2 | 527 | 2 | 诡术 | 0 | pirate_ship |
| MP Wild Extra Galley Pot Resolve | 538 | 2 | 照料 | 0 | pirate_ship |
| MP Wild Extra Pebble Pattern | 530 | 2 | 数学 | 1 | forest |
| MP Wild Extra Pebble Pattern Step2 | 516 | 2 | 英语 | 1 | forest |
| MP Wild Extra Pebble Pattern Resolve | 586 | 2 | 意志 | 1 | forest |

## 地点分布

| `$location` | passage 数 |
| --- | ---: |
| forest | 6 |
| searocks | 3 |
| farm | 3 |
| lake_ruin | 3 |
| cliff | 3 |
| underground | 3 |
| pirate_ship | 3 |
| park（hub） | 1 |

`$outside`：室外 17 段，室内 8 段（海蚀洞第二层、矿道通风井、海盗船厨房及其 Resolve）。

## 与现有 10 条的区分

现有 `mp-wilds-side-stories.twee` 的题材是灯塔补给箱、猎人绳套、风车布条、湖畔废屋水杯、栈道新板、七号盐仓矿车、海图仪、石环暖土、盐堆玻璃瓶、废织机。本批不复用其中任何核心物件或线索：

- 海蚀洞写第二层与贝壳箭头，不写铁皮箱与值班表；
- 森林石环只写外圈石子图案，明确不进入圈内，不重复暖土/骨头；
- 矿道写通风井布条与井底住客，不写矿车与白石；
- 海盗船写厨房汤锅与病人，不写海图仪；
- 峭壁写采药红绳，不写栈道木板。

线索键统一使用 `wild_extra_*` 前缀，与现有 `wild_*` 键不冲突。

## 潜在问题

1. **hub 尚未接入导航**：按要求只新建本文件，未修改 `mp-content-hubs.twee`、`boot.json` 或 `mp.js`。`MP Wild Extra Events Hub` 目前是独立入口，需要在 `MP Wild Side Stories Hub` 或世界事件里补一条链接才能真正被玩家看到。
2. **Setup / Step2 的两个选择合流**：每条线的两个选择都进入同一个后续 passage，差异体现在耗时、图标与叙事动作上；结构上满足“2 个选择”，但若需要更强分支感，可拆独立中转段。
3. **重复进入不发钱**：`claimUniqueReward` 保证一次性结算；若设计上希望可重复刷小额，需要另加每日旗标，而不是移除该调用。
4. **外部返回点依赖本体 passage**：7 个返回点已在本体 HTML 核实存在；若打包裁掉对应区域，需要改回 mod 内 hub。
5. **NPC 使用范围**：只对 Eden / Alex / Gwylan / Robin 做了 `npcincr`，均带 `NPCNameList` 保护；Black Wolf、Mason、Wren 未在本批出现。
