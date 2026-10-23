# 零工惩罚线自检报告

- 目标文件：`mod-src/twees/mp-job-punishment.twee`
- 新增内容：6 条零工路线 × 3 级失误 = 18 个 passage
- 本次操作未改动：`mod-src/twees/mp-livelihoods.twee`、`mod-src/boot.json`、`mod-src/scripts/mp.js`
- 注：仓库中的 `mp-livelihoods.twee` 与 `boot.json` 在本次写入后被另一流程接入（见第五节），不是本文件的编辑操作
- 参考：`docs/vanilla-job-punishment-comparison.md` 不存在，按贝利收债的分级思路（第一次警告 → 第二次停优待 → 第三次停班，必须做事清掉）编写

## 一、三级升级设计

| 等级 | 触发 | 处理 | 变量 |
| --- | --- | --- | --- |
| 第一次 | 打翻托盘 / 散鱼 / 烫到客人 / 冲毁苗 / 弄断游丝 / 烫焦桌布 | 口头警告；当班没有工钱（叙事，不扣现有钱）；安排最差的班或最脏的活；给“解释 / 认错 / 顶嘴”三个选择 | `$mpJobXStrike` 设为 1 |
| 第二次 | 同类失误再犯 | 停掉一项优待：免费咖啡 / 好摊位 / 私汤 / 温室钥匙 / 委托 / 内部折扣；下一次班次工钱略降；给“补班 / 找人说情 / 硬扛”三个选择 | `$mpJobXStrike` 设为 2、`$mpJobXPenalty` 设为 1、对应优待变量设为 0 |
| 第三次 | 第三次失误 | 短暂停班；必须完成跑腿、人情或技能检查才能复工；成功后 strike 回到 0，停班与降薪标记一并清除；不永久锁死、不扣钱 | `$mpJobXStrike` 设为 3、`$mpJobXSuspended` 设为 1 |

各路线被停掉的优待：

| 路线 | 第二次停掉的优待 | 被清零的变量 |
| --- | --- | --- |
| Cafe | 免费咖啡、缺口专属杯 | `$mpJobCafePerk` |
| Fish | 靠海风的好摊位 | `$mpJobFishStall` |
| Spa | 私汤值班 | `$mpJobSpaPrivate` |
| Farm | 温室钥匙 | `$mpJobFarmGreenhouse` |
| Clock | 委托栏与小铜牌 | `$mpJobClockCommission` |
| Laundry | 浆洗“内部价” | `$mpJobLaundryDiscount` |

第三次的清除方式（每条路线均为三选一，其中两项是技能检查）：

| 路线 | 跑腿（必定清除） | 人情 / 检查（成功清除） | 检查（成功清除） |
| --- | --- | --- | --- |
| Cafe | 送面包到孤儿院换回执 | 对平三个月账目（maths 260） | 洗净熨平围裙（housekeeping 260） |
| Fish | 送咸鱼到酒馆换回执 | 天亮前补完整张拖网（tending 260） | 把搁浅的船拖回潮线（athletics 280） |
| Spa | 送干毛巾到神殿换签收单 | 刷通私汤结垢铜管（tending 280） | 写道歉信（english 260） |
| Farm | 去商店对种子单换盖章收据 | 清水渠（athletics 280） | 照看难产母羊（tending 260） |
| Clock | 送修好的怀表换签收条 | 重装停摆机芯（maths 280） | 废料盒里找棘爪簧（skulduggery 280） |
| Laundry | 送法衣到神殿换签收单 | 重新装订账本（housekeeping 260） | 查清焦床单是谁放回的（skulduggery 260） |

检查失败只增加 `stress` / `tiredness` / 少量 `pain`，停班状态保留，并给出原地重试链接，不会软锁。

## 二、18 个 passage 明细

| Passage | 地点（outside） | 主选择 | 技能检查 | 该段效果 |
| --- | --- | --- | --- | --- |
| MP Job Punishment Cafe 1 | cafe (0) | 3 | english, willpower | strike=1，当班无工钱，靠门风口四桌 |
| MP Job Punishment Cafe 2 | cafe (0) | 3 | seduction, willpower | strike=2，停免费咖啡，`Penalty=1` |
| MP Job Punishment Cafe 3 | cafe (0) | 3 | maths, housekeeping | strike=3，停班，跑腿/对账/洗围裙清除 |
| MP Job Punishment Fish 1 | docks (1) | 3 | seduction, tending, willpower | strike=1，当班无工钱，最里侧摊位 |
| MP Job Punishment Fish 2 | docks (1) | 3 | seduction, willpower | strike=2，停好摊位，`Penalty=1` |
| MP Job Punishment Fish 3 | docks (1) | 3 | tending, athletics | strike=3，停班，送货/补网/拖船清除 |
| MP Job Punishment Spa 1 | spa (0) | 3 | tending, willpower | strike=1，当班无工钱，打烊刷冷水池 |
| MP Job Punishment Spa 2 | spa (0) | 3 | seduction, willpower | strike=2，停私汤，`Penalty=1` |
| MP Job Punishment Spa 3 | spa (0) | 3 | tending, english | strike=3，停班，送毛巾/刷铜管/道歉信清除 |
| MP Job Punishment Farm 1 | farm (1) | 3 | tending, willpower | strike=1，当班无工钱，最远石头最多的畦 |
| MP Job Punishment Farm 2 | farm (1) | 3 | english, willpower | strike=2，停温室钥匙，`Penalty=1` |
| MP Job Punishment Farm 3 | farm (1) | 3 | athletics, tending | strike=3，停班，送种子单/清水渠/照看母羊清除 |
| MP Job Punishment Clock 1 | high (0) | 3 | maths, willpower | strike=1，当班无工钱，分拣旧零件 |
| MP Job Punishment Clock 2 | high (0) | 3 | english, willpower | strike=2，停委托，`Penalty=1` |
| MP Job Punishment Clock 3 | high (0) | 3 | maths, skulduggery | strike=3，停班，送表/重装机芯/找零件清除 |
| MP Job Punishment Laundry 1 | orphanage (0) | 3 | housekeeping, willpower | strike=1，当班无工钱，刷铜锅、先熨旧衣 |
| MP Job Punishment Laundry 2 | orphanage (0) | 3 | english, willpower | strike=2，停内部折扣，`Penalty=1` |
| MP Job Punishment Laundry 3 | orphanage (0) | 3 | housekeeping, skulduggery | strike=3，停班，送法衣/装订账本/查床单清除 |

合计：54 个选择（每段 3 个），37 个技能检查，覆盖 8 种技能。

技能分布：willpower 12、tending 6、english 5、seduction（`$seductionskill`）4、maths 3、housekeeping 3、athletics 2、skulduggery 2。

## 三、Python 自检结果

检查脚本按 passage 解析 `:: 名称 [nobr]`，汇总 `mod-src/twees/*.twee` 的全部 passage 名作为链接目标集合。

| 检查项 | 结果 |
| --- | --- |
| passage 总数 | 18（符合预期） |
| passage 名重复 | 0 |
| 断链 | 0（链接目标仅指向本文件 18 段 + `MP Job Cafe/Fish/Spa/Farm/Clock/Laundry`，均存在） |
| 每段开头 `$outside` | 18/18 |
| 每段开头 `$location` | 18/18，依次为 cafe / docks / spa / farm / high / orphanage |
| `<<if>>` / `<</if>>` | 61 / 61 |
| `<<link>>` / `<</link>>` | 78 / 78 |
| 未闭合或游离的 `<<` / `>>` | 0 |
| 扣钱（`$money`、`<<money>>`、负数 money） | 0 处 |
| 未注册图标 | 0（仅用 investigateicon、sneakicon、socialiseicon、runicon、walkicon、getouticon、templeicon、shopicon、parkicon、tendingicon） |
| 每段至少 1 个技能检查 | 18/18 |
| 三级变量齐全（Strike / Penalty / Suspended） | 6 条路线全部齐全 |
| 第三次清除后 strike 归零 | 6/6 |

检查结论：全部通过，无错误、无警告。

## 四、实现说明

- 每段使用独立的 `$mpJobXP1Out / P2Out / P3Out` 结果变量：点击选择后回到同一 passage，顶部打印后果并提供返回链接；返回时清空结果变量，避免串场。
- tier 变量只在“未结算”分支写入。这样第三次成功清除 `Suspended` 后重新渲染，不会被段落开头的初始化再次置回 1。
- 所有失败分支只增加压力、疲劳或少量疼痛；没有扣钱，也没有永久锁死。
- 第二次的“补班”选项会清掉 `$mpJobXPenalty`（用额外班次抵消降薪），其余选项保留降薪标记。
- 第三级的跑腿选项不需要检定、必定清除，保证任何角色都能脱离停班；两个检查选项失败后可原地重试。
- 每条路线的老板/伙伴语气按设定区分：Gwylan 温和、Sera 冷静、Alex 直接、Jordan 平静、Robin 为难、鱼贩粗声。

## 五、外部接入状态（非本次操作）

写入完成后，仓库中的以下文件被另一流程改动，用于接入本文件：

- `mod-src/boot.json`：`tweeFileList` 已加入 `twees/mp-job-punishment.twee`。
- `mod-src/twees/mp-livelihoods.twee`：六条零工入口在 `$mpJobXSuspended` 为 1 时改为跳转 `MP Job Punishment X 3`；班次失败时把 `$mpJobXStrike` 加 1（上限 3），并跳转到对应等级的惩罚段。
- `mod-src/scripts/mp.js`：未改动。

接入后的变量链路核对：

1. 班次失败 → strike 从 0 加到 1 → 进入第一级。
2. 再次失败 → strike 加到 2 → 进入第二级；第二级设置 `$mpJobXPenalty`，并清空对应优待变量。
3. 第三次失败 → strike 加到 3 → 进入第三级；第三级设置 `$mpJobXSuspended`，入口段据此前置拦截。
4. 第三级任一条跑腿或检查成功 → strike 与 suspended 都回到 0，入口恢复。

已知遗留（未由本次操作修改）：

- `mp-livelihoods.twee` 的工钱公式目前没有读取 `$mpJobXPenalty`，所以“下一次班次工钱略降”只有变量标记，尚未实际反映在结算里；需要接入方在工钱计算中消费该变量。
- 第二级叙述被外部流程改成了“最差的筐 / 最远的畦 / 最厚的床单”等安排，`$mpJobXPenalty` 仍照常设置；本次已把 `MP Job Punishment Laundry 2` 失败文本里残留的“扣掉的工钱”改为“最厚的床单还压在盆里”，与改写后的上下文一致（不产生任何扣款）。
