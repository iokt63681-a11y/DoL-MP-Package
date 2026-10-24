# Argon dev11 输入审核与接入记录

日期：2026-10-24

## 一、交付范围

输入：`DoL-MP-v1.2.0-dev11-full-mod-src.zip` 与 `argon-dev11-new-and-revised-only.zip`（两份内容一致，partial 包只含改动文件）。

- 全模组 **68 个 twee，1991 个唯一 passage**（dev10 为 64 / 1903）。
- 新增 4 个文件、80 段：
  - `mp-region-moments-6.twee` 40（8 区域 × Moment 14–16 + Encounter 7–8）
  - `mp-npc-intimate-days-5.twee` 24（6 原版 NPC Daily 10–11 + 6 常驻 NPC RelDay 11–12）
  - `mp-keepsake-uses-4.twee` 8（8 枚信物 Use 5）
  - `mp-region-storylines-4.twee` 8（8 区域深层后续 + Velvet Mirage 9 / Observatory Wing 9）
- 7 段单屏超长拆成 15 段，净增 8 段（`mp-locations` 5 段 + `mp-storylines-town` 2 段）。
- 改写 57 个旧文件、1388 个 passage；没有删除任何旧 passage。
- `boot.json` / `mp.js` / `mp.css` 与 dev10 基线逐字节相同；4 个新文件由集成方注册。

## 二、机械检查（接入后）

| 检查项 | 结果 |
| --- | --- |
| 文件 / 唯一 passage | 68 / 1991，重名 0 |
| 断链 / 空链接 | 0 |
| 宏开闭计数 | 0 不配平 |
| `if/elseif/else` 栈式结构 | 0 错误 |
| `「」` / `<span>` 配对 | 0 |
| `$outside` / `$location` / `[nobr]` | 内容段全覆盖（UI 子屏豁免） |
| `$location` 不在 case 表 | 0 |
| 未注册图标 | 0 |
| 非 Eden `npcincr trust` | 0 |
| 新内容 BFS | 498 节点，孤立 0 |
| 选项标签 >12 汉字 | 0 |
| 结果式标签 | 0 |
| 单屏正文 >250 汉字 | 0（7 段拆屏生效） |
| 同文件重复句（≥10 汉字 >2 次） | 0 |
| 5 条通用模板句 | 0 残留 |
| 正文 ASCII 直引号 | 0 |
| 失败分支设 `$daily` / 失败发奖 | 0 |
| 成功/失败分支完全相同 | 0 |
| `$mpClues` 写入 / 读取 | 274 / 274，死键 0、孤立读 0、同行 set+if 0 |
| 跨文件 claim key / daily key 撞用 | 0 |

> 说明：`content_audit` 的“总分支字数 >250”仍有 274 段，这是把两个动作 × 成功/失败所有分支相加的口径；按“入口 + 单条结果”的单屏口径为 **0 段**，拆屏目标已达成。

## 三、Argon 本批修复验证

1. **A1 选项标签**：0 条 >12 汉字，结果式标签 0；新内容与旧文件均通过。
2. **A2 拆屏**：7 段单屏超长已拆为 15 段，单屏全部 ≤220 汉字；原奖励/线索/后续链接保留。
3. **A3 线索闭环**：274 个写入键全部有同链读取，0 死写、0 孤立读；跨文件读取均为同主体链（信物 3→4、区域 deep→storylines），语义相关。
4. **A4 模板句**：5 条旧模板 0 残留，替换句按具体器物/环境改写。
5. **A5 重复句**：同文件 >2 次重复句 0。
6. **A6 ASCII 引号**：正文 0 处 ASCII 直引号。
7. **P2**：`$location` 映射、`mpAmbient` 覆盖、图标 ≤4、`control` 动机均有对应改写。

## 四、接入时补做的修正

1. **4 个新文件加入 `boot.json`**：68 个 twee 全部注册，路径无缺失。
2. **Sydney 译名回归**：dev10 曾统一为“西德尼”，但本机汉化包 `ModI18N` 实际使用 **悉尼**（2574 处）；dev11 新增内容也写“悉尼”。为与本体一致，全库 84 处“西德尼”改为“悉尼”。
3. **信物名回归**：dev11 新内容把同一信物写成“夜光琥珀花匣 / 司炉长铜章 / 银狐半面胸针 / 黄铜星象目镜”，与 dev9/dev10 的“琥珀香膏瓶 / 站长纪念铜章 / 纯银狐面胸针 / 消色差古透镜”冲突；已全库统一为后者。
4. **时间文案**：`海雾散开` + 雨天、`阳光偏厅`/`惬意午后`、`春雨` 等与门控不符的句子改为中性或对应天气。
5. **`$mpQuest` 错变量**：`Observatory Wing 9` 的 `$mpQuestArchives/$mpQuestSchoolBell` 改为 `$mpQuestObservatoryWing gte 7`；`Druid 5` 的 `$mpQuestRuins` 改为 `$mpQuestManorRuins`；`Velvet Mirage 9` 的 `$mpQuestVelvet` 改为 `$mpQuestVelvetMirage`。
6. **宏空格 P1**：`MP RelDay Sera 12` 的 `<< trauma -1>>` 改为 `<<trauma -1>>`。
7. **Encounter 8 线索读取**：8 段读取句改成与上一段实际动作一致，不再凭空赠送道具。
8. **世界事件截断地名（30 处）**：`宅邸街七边缘`/`倒钩街治` 等残名改为中性描写。
9. **残留模板句（4 段）**：`整套手法行云流水` 的 4 段按场景改写。
10. **系统词**：`火候经验`→`炉温与手感`、`查访花房与古井的经验`→`见识`、`硬币奖励你`→`硬币塞进你手里`。
11. **地点映射**：Sunken Abbey / Deep Abbey 1–3 `outside` 改 0；Druid 洞窟 `cabin/forest` 改 `underground`；Use 4 的 Ring/Amber/Medal `$location` 改 `temple/avery_mansion/docks`。
12. **拆屏 P0（3 个每日互动）**：`Chat` / `WhisperLewd` / `Romance Confess` 的 `notifyInteractEffect` / `notifyRomanceMilestone` 从 Reply 移回第一屏，避免点「离开」绕过每日门控无限刷。
13. **拆屏 P0（任务领奖）**：孤儿院地窖与神殿墓穴的 Resolve「回前厅」链接改为先进入 Payout 领奖再离开，避免跳过 Payout 永久丢钱/古董/线索。
14. **`mp.js` Aftermath**：`MP Native Combat Aftermath` 加入 `isSafePassage` / 同步拦截 / 战斗态清理的 6 处特判。
15. **Encounter 8 线索读取（8 段）**、**5 条信物 Use 5 线索读取**、**4 条区域线索读取**：按上一段实际动作改写，不再凭空赠送道具。
16. **残留模板句（4 段）**、**系统词 `经验/奖励`**、**结果式 `成功`（8 处）**：全部改写。

## 五、仍然存在的问题（下一批）

1. **双动作同去向**：多数区域瞬间/关系日/信物页的两个动作成功后仍回同一节点，差异只在金额/`control`/线索；建议让第二动作有独立后续或明显不同的收益。
2. **`<<control 1>>` 的叙事动机**：新内容第二动作普遍附带，需确认是关系/支配设计还是批量模板。
3. **菜单型 passage 选项 >5**：`MP Job Followup *`(8)、`MP Job * Progress`(10–11)、`MP Job Extra * 1`(9) 等仍是多入口菜单；这些是历史结构，不是本批新增。
4. **旧内容语义复核**：`mp-locations` 的 UI 子屏、`mp-bailey` 的审判页等仍有长选项列表，属于历史设计，暂不拆。
5. **P2**：少量 Hub 同屏图标 8–16 个（目录页）、`$mpClues` 读取以装饰句为主、`$control`/`trauma` 效果分布不均。

## 六、结论

dev11 是目前质量最好的一批：A1–A6 全部落地，单屏长度、标签、重复句、模板句、引号、线索闭环都达到验收标准；新增 80 段与拆屏 8 段结构完整、奖励独立、失败不推进。剩余问题集中在“双动作去向相同”和菜单页选项过多，属于设计层取舍，不再有结构性阻塞。
