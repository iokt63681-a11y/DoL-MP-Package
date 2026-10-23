# 城镇新增支线自检报告

- 文件：`mod-src/twees/mp-town-extra-stories.twee`
- 范围：8 条城镇新支线 × 3 段（Setup → Step2 → Resolve），加 1 个入口 hub，共 25 个 passage
- 检查日期：2026-10-23
- 检查方式：本地 Python 解析 twee 的 passage、链接、图标、`$outside`/`$location`、汉字数、检查分支与奖励值；基础返回目标逐一到 `game/Degrees of Lewdity.html` 的 `tw-passagedata name` 中确认

## 结论

25 个 passage、24 段正文全部通过下列检查。没有断链、没有未注册图标、没有缺失室外/地点标记、没有扣钱、没有未保护的 `npcincr`。

| 检查项 | 结果 |
| --- | --- |
| passage 总数 | 25（24 段正文 + 1 个 hub） |
| passage 名唯一 | 25/25 |
| 链接总数 | 81（正文 72 + hub 9） |
| 断链/空链 | 0 |
| `$outside` 标记 | 25/25 |
| `$location` 标记 | 25/25 |
| `$location` 在允许列表内 | 25/25 |
| `<<if>>` / `<</if>>` 配对 | 25/25 |
| `<<link>>` / `<</link>>` 配对 | 25/25 |
| `<<` / `>>` 宏括号配对 | 25/25 |
| 图标宏 | 9 种，全部在允许列表；未注册 0 |
| 正文汉字数 500–1000 | 24/24 |
| 汉字数范围 | 501–540，平均 516.2，总计 12,390 |
| 每段至少 1 个检查 | 24/24 |
| 检查总数 | 24 个（每段 1 个） |
| 检查类型 | `skulduggerycheck` 8 个；属性阈值 16 个 |
| 失败代价 | 24/24（pain / stress / tiredness / trauma，或线索未取得） |
| 奖励范围 | 300–900 便士（£3–£9） |
| 一次性奖励 | 8/8 Resolve 使用 `claimUniqueReward` |
| 重复奖励保护 | 8/8 Resolve 首次给钱，重复给 `stress -1` |
| 扣钱 | 0 |
| `npcincr` 保护 | 8/8 均带 `$NPCNameList.includes(...)` |
| ≥12 汉字重复句（出现 >2 次） | 0 |
| 链接标签含“并/然后/接着/结果/被” | 0 |
| 正文中的拉丁词 | 0（仅保留 `<br>` 标记） |
| 成人内容 | 无 |

## 地点分布

| `$location` | passage 数 |
| --- | ---: |
| high | 7（hub + Tailor×3 + Clock×3） |
| hospital | 3 |
| school | 3 |
| temple | 3 |
| docks | 3 |
| home | 3 |
| cafe | 3 |

## 图标清单

实际使用：`getouticon` 25、`socialiseicon` 20、`investigateicon` 14、`walkicon` 8、`shopicon` 4、`sneakicon` 4、`runicon` 2、`templeicon` 2、`tendingicon` 2。

以上均在允许列表内；未使用 `workicon`、`athleticicon` 等未注册图标。

## 链接目标

- 正文 72 个链接全部指向本文件的 `MP Extra <Name>`、`MP Extra <Name> Step2`、`MP Extra <Name> Resolve` 或 `MP Town Extra Stories Hub`。
- 返回链接使用基础游戏已存在的 passage：`High Street`、`Hospital front`、`Hallways`、`Temple`、`Docks`、`Residential Alleyways`、`Cliff Street`。
- 已逐一在 `game/Degrees of Lewdity.html` 的 `tw-passagedata` 中确认存在。
- hub 的 8 条入口链接分别指向 8 条支线的第一段，另有一条 `High Street` 出口。

## 逐段检查表

| passage | location | 汉字 | 检查数 | 检查方式 | 链接数 | 奖励（便士） |
| --- | --- | ---: | ---: | --- | ---: | --- |
| MP Town Extra Stories Hub | high | 76 | 0 | — | 9 | — |
| MP Extra Tailor Dress | high | 540 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra Tailor Dress Step2 | high | 507 | 1 | history / maths ≥300 | 3 | — |
| MP Extra Tailor Dress Resolve | high | 533 | 1 | skulduggery ≥420 | 3 | 800 / 400 |
| MP Extra Hospital Cart | hospital | 513 | 1 | science / skulduggery ≥280 | 3 | — |
| MP Extra Hospital Cart Step2 | hospital | 519 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra Hospital Cart Resolve | hospital | 521 | 1 | willpower ≥400 | 3 | 600 / 300 |
| MP Extra School Planes | school | 515 | 1 | athletics ≥280 / skulduggery ≥260 | 3 | — |
| MP Extra School Planes Step2 | school | 516 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra School Planes Resolve | school | 533 | 1 | english ≥420 | 3 | 700 / 400 |
| MP Extra Temple Bell | temple | 506 | 1 | history ≥300 / skulduggery ≥280 | 3 | — |
| MP Extra Temple Bell Step2 | temple | 516 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra Temple Bell Resolve | temple | 520 | 1 | willpower ≥420 | 3 | 800 / 500 |
| MP Extra Docks Crate | docks | 510 | 1 | maths / skulduggery ≥280 | 3 | — |
| MP Extra Docks Crate Step2 | docks | 513 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra Docks Crate Resolve | docks | 516 | 1 | skulduggery ≥430 | 3 | 900 / 500 |
| MP Extra Home Line | home | 513 | 1 | willpower ≥300 | 3 | — |
| MP Extra Home Line Step2 | home | 512 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra Home Line Resolve | home | 507 | 1 | english ≥400 | 3 | 600 / 300 |
| MP Extra Cafe Beans | cafe | 507 | 1 | english / history ≥280 | 3 | — |
| MP Extra Cafe Beans Step2 | cafe | 516 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra Cafe Beans Resolve | cafe | 535 | 1 | skulduggery ≥420 | 3 | 800 / 500 |
| MP Extra Clock Marks | high | 511 | 1 | maths / history ≥280 | 3 | — |
| MP Extra Clock Marks Step2 | high | 510 | 1 | `skulduggerycheck` | 3 | — |
| MP Extra Clock Marks Resolve | high | 501 | 1 | english ≥420 | 3 | 700 / 400 |

## 题材去重说明

与 `mp-town-side-stories.twee` 现有 12 条逐条比对，新 8 条均避开原题材：

1. 裁缝铺礼服（三次改尺寸）——不复用“橱窗模特/裁缝母亲”的落点，核心是同一件礼服的改衣卡与三张订单。
2. 医院夜班推车——不复用“候诊椅挂号单/七个名字”，核心是推车每天停在同一块地砖的物理原因与夜班交接仪式。
3. 学校天台纸飞机——不复用“泳池泳镜/深水区”，核心是纸飞机上的日期与未寄出的信。
4. 神殿钟楼绳结——不复用“捐赠箱同年硬币/1963 火灾”，核心是绳结作为守钟人遗孀的日历。
5. 码头仓库货箱——不复用“系船柱绳结/四号柱”，核心是货箱标签朝向与退运工具。
6. 住宅区晾衣绳——不复用“巷口路灯/仓库信号”，核心是失智老人每天把同一件毛衣挂到不同人家的绳上。
7. 咖啡馆储物间豆袋——不复用“后巷半杯咖啡/格威岚等的人”，核心是袋底船票与前店主未走的航线。
8. 旧钟塔外墙刻痕——不复用“每天少一的粉笔数字/守钟人值班室”，核心是刻痕作为留交信件的计数，数字是信箱号。

## 潜在问题与后续

1. **未注册进 `boot.json` / `mp.js`**：按任务范围只新建了 twee 和本报告，没有改动 `mod-src/boot.json`、`mod-src/scripts/mp.js`。当前文件不会被 mod 自动加载；需要在 `tweeFileList` 中加入 `"twees/mp-town-extra-stories.twee"` 才会生效。
2. **hub 尚未接到世界入口**：`MP Town Extra Stories Hub` 本身有 8 条支线链接和 1 条 `High Street` 出口，但还没有被其他 hub、世界事件或 NPC 对话引用。正文 Resolve 的“把线索钉回布告栏”可以回到该 hub，但首次进入仍需后续在 `mp-content-hubs.twee` 或 `mp.js` 中挂接。
3. **`$mpExtraClues` 暂无消费方**：各段写入 `tailor_card`、`cart_names`、`planes_letter`、`bell_note`、`crate_slip`、`line_photo`、`beans_tickets`、`marks_letter` 等 key，目前只作记录；若后续要做跨支线联动，需要另写读取方。
4. **`high` 的 `mpAmbient` case**：与既有城镇支线相同，`high` 在 `mpAmbient` 中可能落到 default 街景；本文件没有调用 `<<mpAmbient>>`，当前不影响。
5. **NPC 关系可能静默跳过**：`Sera`、`Robin`、`Leighton`、`Jordan`、`Wren`、`Gwylan`、`Alex` 不保证都在 `$NPCNameList` 中；所有 `npcincr` 都有 `includes` 保护，不会报错，但对应关系增量可能不生效。
6. **奖励档位**：每个 Resolve 为“成功给高档 / 部分成功给低档 / 失败不给钱但给状态代价”，金额 300–900 便士，均在 £2–£10 范围内；重复完成只给 `stress -1`。
