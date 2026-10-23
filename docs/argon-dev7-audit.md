# Argon dev7 输入审核与接入记录

日期：2026-10-23

## 交付范围

`DoL-MP-v1.2.0-dev7-full-mod-src.zip` 与 `argon-dev7-new-and-revised-only.zip`：

- 全模组 **50 个 twee，1618 个唯一 passage**（dev6 44 / 1468）。
- 新增 6 个文件、141 段：
  - `mp-region-storylines-2.twee` 14
  - `mp-npc-relationship-days.twee` 24
  - `mp-town-wilds-moments.twee` 24
  - `mp-job-and-keepsake-followups.twee` 18
  - `mp-town-festivals-4.twee` 21
  - `mp-region-moments-2.twee` 40
- 返修 17 个文件、290 段压缩；`mp-companion-npc`、`mp-main-and-collection-quests`、`mp-new-npcs` 各有拆分，净增 9 段。
- 没有删除任何 passage：dev6 的 1468 个 passage 全部保留。

## 静态检查结果

- 重名 0，断链 0，宏闭合 0。
- 每段 `$outside` / `$location` / `[nobr]` 覆盖（内部战斗/交互模板除外）。
- `$location` 41 个取值全部命中 `mp-locations` 的 case。
- 奖励 key 跨文件重复 0；新内容 141 个节点全部从入口 BFS 可达。
- 中文引号逐段配对 0 处不平衡。
- 新内容没有 Lv/等级/经验；失败分支不扣存款。
- 新文件 `<<effects>>` 覆盖 100%。

## 接入时补做的修正

1. **6 个新文件加入 `boot.json`**：当前 50 个 twee。
2. **4 个新半日节令终段重复发钱**：`MP Festival SpringDye/Tidesong/Michaelmas/Warmboot 5` 的 `claimUniqueReward` 已领取分支仍发 £2.50，改为只写“红封已经拆过”，不再发钱。
3. **12 条零工后续链接排在离开选项之后**：已移到离开/返回选项之前。
4. **22 处非 Eden `<<npcincr ... trust>>`**：0.5.12.13 会报“试图修改非伊甸的信任值”。全部改为 `love`；同一行已有 love 的直接删除 trust。
5. **2 处世界事件先拿物后扣钱**：`MP World Event Curio Peddler Bargain`、`Arcade Neon Counter` 的 `<<if $money...>>` 只包住扣款，余额不足仍拿线索。已把整段奖励包进条件，余额不足只显示失败句。
6. **22 处非 Eden `<<npcincr ... trust>>`**：0.5.12.13 会报错。已全部改为 `love`，同一行已有 love 的直接删掉 trust。
7. **22 条选项标签缺字/病句**：新增文件里有“黑椒迭香”“用竹巧妙”“减速减速”这类截断标签，已逐条补字并压到 ≤12 汉字。
8. **4 条坏结局链接缺图标/写结果**：已补图标，标签改成动作；圣尼古拉暖靴入口补“集：”和图标。
9. **14 个压缩后的入口丢掉了人物/物件**：`mp-town-extra-stories` 8 个、`mp-town-side-stories` 6 个，选项却继续点名“三组尺寸 / 床 6 卡片 / 莱顿 / 乔丹 / 雷恩 / 罗宾 / 格威岚 / 邮差 / 塞拉 / 贝利 / 梅森 / 悉尼”。已各补 1 句触发物件/人物。
10. **`MP Side Bookstall Resolve` 高历史分支丢了支线图**：已补“从夹层抽出支线图”，与“把支线图交给塞拉”选项对应。
11. **`MP Daily Whitney 1` 链条剧情丢失**：选项写“把链条掰回齿轮”，正文却没有自行车和孩子。已补掉链自行车与瘦小男孩。
12. **`MP Main Story Eclipse Late` 第 12 阶段被 `else` 当成第 11 阶段重播**：已拆成 `_stg is 11` 与 `else`（12+ 只收束，不再发 `control 25`）。
13. **`MP Collection Quests Hub` 兜底提示只判 3/6 个残片**：已补齐 BrideFlower/VelvetCrest/LedgerKey 三条。
14. **`MP Companion Hub` 的依偎/散步/亲吻/亲密入口被删**：已补回 4 个链接与每日限制。
15. **`MP NPC Sera Quest` 丢了“信任≥8 也能过”的分支**：已加回 `_npc.trust`。
16. **`MP Region Velvet Mirage Scout` 用铜镜窥探却判体能**：改为诡术/舞蹈，成功/失败文案同步。
17. **`MP Mansion Avery GownCheck` 丢了衣装完整度分支**：已加回 `$worn.upper/lower.integrity` 判断。

## 仍然存在的问题（下一批）

1. **31 个旧支线 passage 仍是“进页面自动投骰”**：`mp-town-side-stories`、`mp-wilds-side-stories`、`mp-town-extra-stories` 等，玩家还没选动作就掉血/加压力。属于 dev6 以前的结构，不是 dev7 新引入。
2. **`mp-job-seasonal-events` 3 段仍超过 250 字**：Cafe Winter 271、Clock Rain 266、Laundry Festival 251。
3. **`mp-soft-bad-ends` 5 个 Hub 仍 280–316 字**（未在本批压缩范围）。
4. **旧城镇节日 1–5 段仍有 430–456 字**（`mp-town-festivals` 丰收/雾月/冬幕/春汛/海灯/钟塔）。
5. **区域深层/瞬间链可重复走**：钱有 `claimUniqueReward` 保护，但文本会重复，且没有每日标记。
6. **`mp-region-storylines-2` 是线性 7 段链，没有阶段变量**：中途退出后要从第 1 段重走；不影响完成，但不如其他暗线稳。
