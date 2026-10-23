# Argon dev6 输入审核与接入记录

日期：2026-10-23

## 交付范围

`DoL-MP-v1.2.0-dev6-full-mod-src.zip` 与 `argon-dev6-new-and-revised-only.zip`：

- 全模组 **44 个 twee，1468 个唯一 passage**（dev5 38 / 1294）。
- 新增 6 个文件、136 段：
  - `mp-soft-bad-ends-2.twee` 15
  - `mp-extra-instant-events.twee` 14
  - `mp-npc-daily-familiar.twee` 18
  - `mp-region-deep-events.twee` 18
  - `mp-town-festivals-3.twee` 21
  - `mp-job-supplement-50.twee` 50
- 返修 6 个文件：`mp-new-npcs`（84）、`mp-new-regions`（121）、`mp-seasonal-micro-festivals`（18）、`mp-job-extra-parity`（54）、`mp-soft-bad-ends`（25）、`mp-mansion-avery-1`（19）。
- 全库 `$location` 规范化；`mp-locations` 补充 ambient case。

## 静态检查结果

- passage 重名 0，断链 0，宏闭合 0。
- 44 个文件全部 `$outside` / `$location` / `[nobr]` 覆盖（widget/战斗页除外）。
- 新内容无 Lv/等级/经验；系统词只剩旧文件里的自然用法和注释。
- 失败分支扣存款 0。
- 奖励 key 860 个，跨文件重复 0。
- 新增 112 个节点全部可从入口 BFS 到达（接线后）。
- 中文引号逐段配平 0 处不配对。

## 接入时补做的修正

1. **6 个新文件没有进 `boot.json`**：已加入，当前 44 个 twee。
2. **3 个新 Hub 没有入口**：
   - `MP Town Festivals 3 Hub` 从 `MP Micro Festivals Hub` 接入；
   - `MP Extra Instant Events Hub` 从 `MP Town Extra Stories Hub` 接入；
   - `MP Extra Job Supplement Hub` 从 `MP Extra Jobs Hub` 接入。
3. **半日节令没有日期门控**：四个节日只在各自窗口出现（1/30–2/5、4/27–5/4、7/28–8/4、11/19–11/25），窗口外显示“铜牌背面还没有新的集合记号”。
4. **瞬时事件是全年菜单**：雨天事件只在降雨时出现，雪天只在降雪时出现，集市只在白天/黄昏，夜巷只在夜里；没有合适事件时显示空急报。
5. **熟稔日常没有关系门槛**：6 个 NPC 的 `Chat` 页里，`MP Extra Daily` 入口改为 `love ≥ 8 或 trust ≥ 8` 才出现。
6. **`$location "town"` 被映射成室内 ambient**：`mp-locations` 里 `town` 从 `home` 组拆出，补了街景 case；否则 15 段区域事件会出现“屋里很安静”的室内句。
7. **诺艾尔/林恩性别漂移**：dev6 把诺艾尔改成男性代词、林恩改成女性。已恢复 dev5 设定（诺艾尔女、林恩男），并同步修正 `mp-npc-daily-familiar`。
8. **引号不配对 16 处**：零工失败段、宅邸段里缺 `」` 或多了孤立的 `」`，已逐段补齐。
9. **`MP Job Farm Upgrade` 仍显示“当前畦数，生长进度”数字**：改成“共有 N 垄作物 + 长势描述”，不再显示进度数值。
10. **拖网失败段对话缺后引号**：已补。

## 仍然存在的问题（下一批）

1. **NPC 任务的检定是“进页面前就掷好”**：玩家看到两个动作时，成败已经决定，两个动作都指向同一个 Pass/Fail。检定存在、失败有代价，但选择没有意义。下一批应改成点动作时再检定，或两个动作各用不同技能。
2. **零工季节段每次成功班次都会插入**：春夏季节的 `MP Job Seasonal * Spring/Summer` 会和随机小事件一起出现，连上几天会重复。建议改成 1/3 概率或按日期窗口。
3. **区域瞬时事件完成后 `$mpMicroNotice` 不清零**：事件链接会一直留在区域入口。建议完成后清除对应 key。
4. **旧文件仍有长段落**：`MP Companion Quest Step` 1178 字、`MP Main Story Eclipse Hub` 942 字、`MP Side Bookstall` 617 字等，不在本批范围，但和“像原作”的目标不一致。
5. **宅邸单段仍有 390 字左右**：dev6 只做了 location 和图标，没有压正文。
6. **`mp-new-regions` 的 Scout/Ask 仍是“进入即显示两项动作”**，比旧版好，但两个动作的结果都由同一个前置检定决定，和 A1 同类问题。
