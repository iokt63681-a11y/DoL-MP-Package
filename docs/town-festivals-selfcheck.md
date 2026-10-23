# 城镇节日自检报告

- 文件：`mod-src/twees/mp-town-festivals.twee`
- 入口：`MP Town Festivals Hub`（高街布告栏旁）
- 日期：2026-10-23
- 范围：6 个节日 × 5 段 + 1 个 hub，共 31 个 passage
- 未修改 `boot.json` / `mod-src/scripts/mp.js`（按本批要求，接线由集成方处理）

## 一、结论

全部检查通过：passage 名唯一、断链 0、宏闭合 0 错误、每段有 `$outside`/`$location`、图标全部已注册、无扣钱、无 Lv/等级/经验、30 段均有检查、30 段均 400～800 汉字、全部可从 hub 到达。

## 二、检查结果

| 检查项 | 结果 |
| --- | --- |
| passage 总数 | 31（30 段节日 + 1 个 hub） |
| passage 名唯一（文件内） | 0 重复 |
| passage 名与全部 mod twee 冲突 | 0 冲突 |
| 链接总数 | 97 |
| 断链 / 空链接 | 0 |
| 每个 passage 开头 `$outside` + `$location` | 31/31 |
| `$location` 在允许列表内 | 31/31 |
| `$location` 分布 | high 8、temple 4、orphanage 3、docks 3、beach 3、farm 2、danube 2、mer 2、searocks 2、harvest 1、elk 1 |
| `$outside` | 室外 21 段、室内 10 段 |
| `[nobr]` | 31/31 |
| 宏闭合（if/link/switch/for 栈检查） | 0 错误 |
| 未注册图标 | 0（仅用 investigateicon / sneakicon / socialiseicon / runicon / walkicon / getouticon / templeicon / shopicon / swimicon / beachicon / tendingicon） |
| 扣钱（`<<money -...>>`、`$money -=`） | 0 |
| 检查覆盖 | 30/30 段至少 1 个检查 |
| 每段选择数 | 30 段均为 3 个链接（hub 为 6 入口 + 1 离开） |
| 汉字数（去宏、去链接符号） | 30 段最小 401、最大 456、平均 424.3 |
| 超过 800 汉字的段落 | 0 |
| 重复长句（≥12 汉字，完全一致） | 0 |
| BFS 从 hub 可达 | 31/31，无孤立 passage |
| Lv / 等级 / 经验字样 | 0 |
| 失败分支扣钱 | 0（失败只用 stress / tiredness / pain / trauma） |
| 奖励范围 | £2～£12（200～1200 便士） |
| 一次性奖励 key | 22 个，全部为 `festival_<name>_<stage>` |

## 三、节日与入口

| 节日 | Passage 前缀 | 入口链接 | 检查类型（1→5） |
| --- | --- | --- | --- |
| 丰收节 | `MP Festival Harvest 1..5` | `丰收节：打谷场的第一捆麦` | tending / maths / skulduggery / english / willpower 或 tending |
| 雾月节 | `MP Festival Fog 1..5` | `雾月节：神殿侧廊的灯` | science / willpower / english / skulduggery / willpower |
| 冬幕节 | `MP Festival Winter 1..5` | `冬幕节：孤儿院的汤锅` | housekeeping / seduction 或 willpower / tending / maths / willpower |
| 春汛节 | `MP Festival Flood 1..5` | `春汛节：码头上涨的水` | athletics / maths / skulduggery / willpower / tending |
| 海灯节 | `MP Festival Sealamp 1..5` | `海灯节：海滩上的纸灯` | tending / athletics / science / seduction 或 willpower / english |
| 钟塔纪念日 | `MP Festival Bell 1..5` | `钟塔纪念日：铜牌上的名字` | science / english / skulduggery / willpower / athletics 或 willpower |

## 四、一次性奖励 key

`festival_harvest_2/3/4/5`、`festival_fog_4/5`、`festival_winter_2/3/4/5`、`festival_flood_2/3/4/5`、`festival_sealamp_2/3/4/5`、`festival_bell_2/3/4/5`。

## 五、其他说明

1. 每条节日线都跨至少两个地点，并带入 NPC（Alex / Sera / Jordan / Robin / Wren）或零工场景；每段都有一个具体的小冲突或小发现，不是纯庆典描写。
2. 奖励按技能值分档：例如丰收节第 4 段按 english 分 £4/£7/£10，第 5 段按 willpower 或 tending 分 £7/£12；失败分支不给钱，只加压力/疲劳/疼痛/创伤。
3. `npcincr` 均带 `$NPCName && $NPCNameList && $NPCNameList.includes(...)` 保护。
4. `$mpFestivalClues` 为共享线索对象，各段只添加 key，不覆盖已获得的其他节日线索。
5. 由于本批不修改 `boot.json`，新文件需要在集成时加入 twee 清单后才会加载；入口 hub 已留好，可由 High Street 布告栏或现有事件 hub 接线。
