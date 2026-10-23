# 城镇小支线自检报告

- 文件：`mod-src/twees/mp-town-side-stories.twee`
- 范围：12 条城镇小支线 × 3 段（Setup -> Complication -> Resolve），共 36 个 passage
- 检查日期：2026-10-23
- 检查脚本：本地 Python 解析 twee 的 passage、链接、图标、`$outside`/`$location`、汉字数与奖励值

## 结论

36 个 passage 全部通过下列检查；没有断链、没有未注册图标、没有缺失室外/地点标记。

| 检查项 | 结果 |
| --- | --- |
| passage 总数 | 36 |
| passage 名唯一 | 36/36 |
| 链接总数 | 108（每段 3 个选择） |
| 断链/空链 | 0 |
| `$outside` 标记 | 36/36 |
| `$location` 标记 | 36/36 |
| `$location` 在允许列表内 | 36/36 |
| 图标宏 | 9 种，全部在允许列表；未注册 0 |
| 每段汉字数 600–1200 | 36/36 |
| 汉字数范围 | 600–638，平均 604.8，总计 21,772 |
| 每段至少 1 个检查 | 36/36 |
| 检查类型 | `<<skulduggerycheck>>` 14 段；`$skill gte` 22 段 |
| 每个检查有失败代价 | 36/36（pain / stress / tiredness / trauma 或失去线索） |
| Resolve 三段式分档（成功/部分/失败） | 12/12 |
| 奖励金额 | 200–1200 便士（£2–£12），共 10 档 |
| `npcincr` 保护 | 12/12 均有 `$NPCName && $NPCNameList.includes(...)` 保护 |
| ≥12 汉字重复句（出现 >2 次） | 0 |
| 链接标签含“并/然后/接着/结果/被” | 0 |
| 链接标签最长汉字数 | 10 |

### 地点分布

| `$location` | passage 数 |
| --- | ---: |
| high | 9 |
| cafe | 3 |
| orphanage | 3 |
| school | 3 |
| temple | 3 |
| docks | 3 |
| park | 3 |
| elk | 3 |
| hospital | 3 |
| home | 3 |

### 图标清单

实际使用：`investigateicon`、`sneakicon`、`socialiseicon`、`walkicon`、`getouticon`、`templeicon`、`shopicon`、`swimicon`、`parkicon`。

以上均在允许列表内；未使用 `athleticicon`、`workicon`。

### 链接目标

- 36 个 passage 之间的链接全部指向本文件的 `MP Side <Name>`、`MP Side <Name> Step2`、`MP Side <Name> Resolve`。
- 返回链接使用基础游戏已存在的 passage：`High Street`、`Cliff Street`、`Orphanage`、`Hallways`、`Temple`、`Docks`、`Park`、`Elk Street`、`Hospital front`、`Residential Alleyways`。
- 已逐一在 `game/Degrees of Lewdity.html` 的 `tw-passagedata` 中确认存在。

## 逐段检查表

| passage | location | 汉字 | 检查方式 |
| --- | --- | ---: | --- |
| MP Side Bookstall | high | 638 | skulduggerycheck |
| MP Side Bookstall Step2 | high | 601 | skulduggerycheck |
| MP Side Bookstall Resolve | high | 611 | skill gte |
| MP Side Cafe Alley | cafe | 606 | skill gte |
| MP Side Cafe Alley Step2 | cafe | 603 | skulduggerycheck |
| MP Side Cafe Alley Resolve | cafe | 608 | skill gte |
| MP Side Orphan Laundry | orphanage | 600 | skulduggerycheck |
| MP Side Orphan Laundry Step2 | orphanage | 601 | skulduggerycheck |
| MP Side Orphan Laundry Resolve | orphanage | 602 | skill gte |
| MP Side School Goggles | school | 605 | skill gte |
| MP Side School Goggles Step2 | school | 602 | skulduggerycheck |
| MP Side School Goggles Resolve | school | 616 | skill gte |
| MP Side Temple Coin | temple | 601 | skill gte |
| MP Side Temple Coin Step2 | temple | 604 | skulduggerycheck |
| MP Side Temple Coin Resolve | temple | 602 | skill gte |
| MP Side Docks Knot | docks | 601 | skill gte |
| MP Side Docks Knot Step2 | docks | 601 | skill gte |
| MP Side Docks Knot Resolve | docks | 600 | skill gte |
| MP Side Park Pigeon | park | 603 | skill gte |
| MP Side Park Pigeon Step2 | park | 604 | skulduggerycheck |
| MP Side Park Pigeon Resolve | park | 602 | skill gte |
| MP Side Elk Watch | elk | 601 | skulduggerycheck |
| MP Side Elk Watch Step2 | elk | 604 | skulduggerycheck |
| MP Side Elk Watch Resolve | elk | 601 | skill gte |
| MP Side Hospital Slip | hospital | 601 | skill gte |
| MP Side Hospital Slip Step2 | hospital | 602 | skulduggerycheck |
| MP Side Hospital Slip Resolve | hospital | 611 | skill gte |
| MP Side Street Lamp | home | 601 | skulduggerycheck |
| MP Side Street Lamp Step2 | home | 600 | skill gte |
| MP Side Street Lamp Resolve | home | 626 | skill gte |
| MP Side Window Mannequin | high | 602 | skill gte |
| MP Side Window Mannequin Step2 | high | 603 | skulduggerycheck |
| MP Side Window Mannequin Resolve | high | 602 | skill gte |
| MP Side Clock Chalk | high | 604 | skill gte |
| MP Side Clock Chalk Step2 | high | 602 | skulduggerycheck |
| MP Side Clock Chalk Resolve | high | 603 | skill gte |

## 潜在问题

1. **未注册进 `boot.json`**：按任务范围只新建了 twee 和本报告，没有改动 `mod-src/boot.json`。当前文件不会被 mod 自动加载；需要在 `tweeFileList` 中加入 `"twees/mp-town-side-stories.twee"` 才会生效。
2. **没有城镇入口/触发器**：12 条线的第一段就是入口 passage，但尚未挂到任何城镇 hub、世界事件或 NPC 对话上；需要后续在 hub 中补链接或事件入口。
3. **`high` 没有 `mpAmbient` case**：`mp-locations.twee` 的 `mpAmbient` switch 中没有 `case "high"`，会落到 default 的街景句。本文件没有调用 `<<mpAmbient>>`，所以目前不影响；如果以后在这些 passage 里加 `<<mpAmbient>>`，高街场景会拿到通用街景文本。
4. **部分 NPC 关系可能静默跳过**：`Sera`、`Wren`、`Briar` 等不保证在 `$NPCNameList` 中；所有 `npcincr` 都有 `includes` 保护，不会报错，但对应关系增量可能不生效。
5. **`$mpSideClues` 暂无消费方**：各段会写入 `bookstall_map`、`cafe_note`、`laundry_letters` 等线索 key，但目前没有 hub 或后续任务读取它们；若后续不做衔接，这些标记只是记录。
6. **Resolve 的去重奖励保护**：12 个 Resolve 均带有 `window.dolmp.claimUniqueReward("side_*_payout")` 与 `_first` 判断（写入时由项目格式化逻辑补入）。首次完成给钱，重复完成改为 `<<stress -1>>`；已确认 `window.dolmp` 与 `claimUniqueReward` 均有存在性保护，不会断链或报错。
7. **`$location "high"` 与本体差异**：本体 `High Street` 使用 `$location to "town"`，本文件按任务允许列表使用 `"high"`；若其他系统依赖 `"town"` 判断高街，需要注意这一差异。
