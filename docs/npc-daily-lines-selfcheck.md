# 原版 NPC 日常关系线自检报告

- 目标文件：`mod-src/twees/mp-npc-daily-lines.twee`
- 范围：6 位原版 NPC × 3 段 = 18 段正文，加 1 个入口 hub，共 19 个 passage
- 本次只新建 twee 与本文档；未改动 `mod-src/boot.json`、`mod-src/scripts/mp.js`（仓库中这两个文件的改动由协调流程完成）
- 题材：惠特尼、凯拉尔、西德尼、梅森、莱顿、贝利；避开零工伙伴 Gwylan / Sera / Alex / Jordan / Robin
- 检查日期：2026-10-23

## 一、结论

19 个 passage、18 段正文全部通过下列检查。没有重名、没有断链、没有缺失室外/地点标记、没有宏未闭合、没有扣钱、没有未保护的 `npcincr`。

| 检查项 | 结果 |
| --- | --- |
| passage 总数 | 19（18 段正文 + 1 hub） |
| passage 名唯一 | 19/19 |
| 链接总数 | 61（正文 54 + hub 7） |
| 断链 / 空链 | 0 |
| 每段开头 `$outside` | 19/19 |
| 每段开头 `$location` | 19/19，全部在允许列表 |
| `<<if>>` / `<</if>>` | 140 / 140 |
| `<<link>>` / `<</link>>` | 61 / 61 |
| 图标类型 | 9 种，全部在允许列表；未注册 0 |
| 正文汉字数 400–800 | 18/18 |
| 汉字数范围 | 401–453，平均 409.6，总计 7,372 |
| 每段选择数 2–3 | 18/18（实际每段 3 个） |
| 每段至少 1 个检查 | 18/18 |
| 检查总数 | 43 |
| 失败代价 | 43/43（stress / pain / trauma / 关系下降） |
| 奖励范围 | 100–300 便士（£1–£3） |
| 一次性奖励 | 16 个独立 `claimUniqueReward` key |
| 扣钱 | 0 |
| `npcincr` 保护 | 全部带 `$NPCNameList.includes(...)` |
| 成人内容 | 无露骨描写 |

## 二、入口与推进设计

hub `MP Daily Life Hub` 放在高街（`outside 1`、`location high`），用“口袋里几张写着地址的纸条”串起 6 条入口：

| 入口 | 目标 | 图标 |
| --- | --- | --- |
| 去炸鱼店后巷找惠特尼 | MP Daily Whitney 1 | socialiseicon |
| 沿铁路去凯拉尔庄园 | MP Daily Kylar 1 | socialiseicon |
| 回学校图书馆看看西德尼 | MP Daily Sydney 1 | investigateicon |
| 去泳池边找梅森 | MP Daily Mason 1 | swimicon |
| 去学校办公室找莱顿 | MP Daily Leighton 1 | socialiseicon |
| 穿过走廊去孤儿院找贝利 | MP Daily Bailey 1 | walkicon |

- 每条线按 `1 → 2 → 3` 推进，三段分别是三个日常片段，不要求连续同一天。
- 第 3 段结束后统一回 `MP Daily Life Hub`，hub 另有 `High Street` 出口（基础游戏 passage，已确认存在）。
- 每段 3 个选择：2 个技能检查 + 1 个无检查的社交/观察选项；第 1、2 段的选择推进到下一段，第 3 段的选择回到 hub。
- 一次性奖励由 `window.dolmp.claimUniqueReward("daily_<npc>_<段>")` 保护；关系增量用 `npcincr`，失败分支可出现关系下降。

## 三、逐段检查表

| passage | outside | location | 汉字 | 选择 | 检查数 | 检查类型 | 奖励（便士） |
| --- | ---: | --- | ---: | ---: | ---: | --- | --- |
| MP Daily Life Hub | 1 | high | 121 | 7 | 0 | — | — |
| MP Daily Whitney 1 | 1 | high | 453 | 3 | 2 | tending / willpower | 200 一次性 |
| MP Daily Whitney 2 | 1 | high | 422 | 3 | 2 | skulduggery / english | 300 一次性 |
| MP Daily Whitney 3 | 1 | high | 403 | 3 | 2 | tending / willpower | 100 一次性 |
| MP Daily Kylar 1 | 0 | home | 404 | 3 | 2 | english / tending | 100 一次性 |
| MP Daily Kylar 2 | 0 | home | 405 | 3 | 3 | skulduggery / willpower / tending | 200 一次性 |
| MP Daily Kylar 3 | 0 | home | 405 | 3 | 2 | athletics / willpower | 200 一次性 |
| MP Daily Sydney 1 | 0 | school | 414 | 3 | 3 | english / skulduggery / willpower | 100 一次性 |
| MP Daily Sydney 2 | 0 | temple | 401 | 3 | 2 | maths / tending | 200 一次性 |
| MP Daily Sydney 3 | 0 | school | 406 | 3 | 3 | skulduggery / athletics / willpower | 100 一次性 |
| MP Daily Mason 1 | 0 | pool | 406 | 3 | 2 | athletics / tending | 200 一次性 |
| MP Daily Mason 2 | 0 | pool | 410 | 3 | 3 | english / seduction / tending | 100 一次性 |
| MP Daily Mason 3 | 0 | pool | 401 | 3 | 2 | athletics / willpower | 200 一次性 |
| MP Daily Leighton 1 | 0 | school | 407 | 3 | 3 | english / skulduggery / willpower | 200 一次性 |
| MP Daily Leighton 2 | 0 | school | 414 | 3 | 2 | willpower / skulduggery | 关系增量 |
| MP Daily Leighton 3 | 0 | school | 407 | 3 | 2 | maths / willpower | 300 一次性 |
| MP Daily Bailey 1 | 0 | orphanage | 402 | 3 | 3 | tending / willpower / skulduggery | 100 一次性 |
| MP Daily Bailey 2 | 0 | orphanage | 409 | 3 | 3 | maths / skulduggery / willpower | 关系增量 |
| MP Daily Bailey 3 | 0 | orphanage | 403 | 3 | 2 | tending / willpower | 200 一次性 |

## 四、技能分布

| 技能 | 检查数 |
| --- | ---: |
| willpower | 13 |
| tending | 9 |
| skulduggery | 8 |
| english | 5 |
| athletics | 4 |
| maths | 3 |
| seduction（`$seductionskill`） | 1 |
| science | 0 |

合计 43 个检查，覆盖 7 种技能；science 未使用，留给后续需要实验/推理的场景。

## 五、图标使用

| 图标 | 次数 |
| --- | ---: |
| socialiseicon | 22 |
| tendingicon | 10 |
| investigateicon | 7 |
| walkicon | 7 |
| sneakicon | 7 |
| swimicon | 3 |
| getouticon | 2 |
| runicon | 2 |
| brothelicon | 1 |

全部在允许列表内；未使用 `workicon`、`athleticicon`、`loveicon` 等未注册图标。

## 六、Python 自检方式

脚本按 `^:: ` 解析 passage，汇总 `mod-src/twees/*.twee` 的全部 passage 名，并对照 `game/Degrees of Lewdity.html` 的 16,087 个 `tw-passagedata` 名称验证链接目标。

逐项验证：

1. passage 名唯一：19/19。
2. 链接目标存在：61/61；仅指向本文件 19 段与基础游戏 `High Street`。
3. 每段首行匹配 `<<set $outside to 0/1>><<set $location to "...">>`：19/19。
4. `$location` 均在允许列表：high / home / school / temple / pool / orphanage。
5. `<<if>>` 与 `<</if>>`、`<<link>>` 与 `<</link>>` 配对：140/140、61/61。
6. `<<money>>` 无负数，金额仅 100 / 200 / 300。
7. `claimUniqueReward` 16 个 key，无重复。
8. 所有 `<<npcincr>>` 所在行均包含 `$NPCNameList.includes(...)`。
9. 正文汉字数（剥离宏与 HTML 标签）18 段均在 400–800。
10. 每段 3 个选择，检查数 2–3，失败分支均含 stress / pain / trauma 或关系下降。

## 七、说明

- 惠特尼线只写“不带恶意的搭话”，第二、三段保留她嘴硬和不肯示弱的部分。
- 凯拉尔线写庄园/旧公寓的笨拙照顾与占有欲，不写露骨内容，也不把她的行为洗成单纯可爱。
- 西德尼线围绕图书馆与神殿的“规矩 / 越界”，保留她先引用规则、再自己犹豫的状态。
- 梅森线围绕训练、疲惫与资格赛压力，没有把师生关系写成暧昧越界。
- 莱顿线写校规与人情之间的操作空间，没有洗白改日期、压处分的行为。
- 贝利线只写权力关系里的小裂缝：多给一条毯子、把药钥匙交出来、在病房门外坐着；不写成突然变好。
