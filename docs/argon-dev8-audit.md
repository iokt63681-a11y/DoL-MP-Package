# Argon dev8 输入审核与接入记录

日期：2026-10-24

## 交付范围

`DoL-MP-v1.2.0-dev8-full-mod-src.zip` 与 `argon-dev8-new-and-revised-only.zip`：

- 全模组 **55 个 twee，1723 个唯一 passage**（dev7 50 / 1618）。
- 新增 5 个文件、105 段：
  - `mp-npc-intimate-days-2.twee` 24
  - `mp-region-moments-3.twee` 32
  - `mp-job-seasonal-and-failures-2.twee` 20
  - `mp-keepsake-uses.twee` 16
  - `mp-night-and-wilds-events.twee` 12
- 返修 20 余个旧文件；`mp-bailey-and-trials` 拆分出 `MP Quest Bailey Rebellion Late`。
- **没有删除任何 passage**：dev7 的 1618 段全部保留。

## 静态检查结果

- 重名 0，断链 0，宏闭合 0，`「」`/`<span>` 配对 0。
- 每段 `$outside` / `$location` / `[nobr]` 覆盖（互动子屏除外）。
- `$location` 仅 `alley` 非法，已改 `commercial`。
- 奖励 key 跨文件重复 0；新内容 206 个节点全部从入口 BFS 可达。
- 失败分支不扣存款；非 Eden trust 已清零。

## 接入时补做的修正

1. **5 个新文件加入 `boot.json`**：当前 55 个 twee。
2. **`MP Daily Eden 4/5` 的 7 个 `Cottage` 断链**：改为本体存在的 `Forest Cabin`。
3. **夜间事件没有时间门控**：6 个入口改为只有 `Time.dayState is "night"` 时出现，白天显示“先回……”出口；夜间段落 `$location "alley"` 改为 `commercial`。
4. **A3 节令计分重复**：4 个节令第 1 段的 `$mpFestScore +1` 写了两遍，最高分变 5，部分成功也能拿 £6.50。已删掉重复行与重复清零。
5. **A4 每日旗标锁死失败重试**：关系日/零工后续的成功和失败分支都设 `$daily`，而“再试一次”指回本段，回去只显示“今天已处理过”。已改为只在成功分支设每日旗标，失败可当天重试。
6. **Bailey Rebellion 拆分丢奖励**：8 个阶段链接的 `claimUniqueReward("bailey_rebellion_stg_N")` + £60 + 古物计数全部丢失；第 2/3 阶段的院童、林恩、火漆印模也被压掉。已补回 8 段奖励与物件。
7. **区域暗线续接重复**：`MP Quest Velvet Mirage 1` / `Observatory Wing 1` 的“继续先前追查”链接和阶段赋值各写了两遍。已去重。
8. **Black Wolf 的 4 处 `npcincr trust`**：0.5.12.13 会报错，已改 `love`；Vesper 的一处直接写 `$mpNpcs.vesper.trust` 改为 `<<mpnpcincr>>`。
9. **零工 Extra/Partner 事件可不打工直接领**：20 个入口加 `$daily.mpJobX` 条件，只有当天上过该班才出现。
10. **`MP Daily Sydney 5` 地点错位**：正文是学校图书馆，`$location` 却是 `temple`，出口也回 Temple。已改 `school` + `School Library`。
11. **UI 清理**：TA 占位符改“对方”；`床 6` 改“6 号床”；5 处叠字病句修正；6 处闲聊/追问去图标；3 组同字数选项拉开长度；中文选项里的英文 NPC 名统一为中文；Wren 代词统一为“他”。
12. **信物名称统一**：黑曜石戒→银鸽指环、黑铁货运徽章→站长纪念铜章、精密发条母芯→蓝钢怀表芯、温室古琥珀→琥珀香膏瓶、银狐假面→纯银狐面胸针、白鹿角符牌→白鹿角坠饰。
13. **新增 `keepsakeicon` 藏品/脏物图标**：`img/mp/keepsake.gif` + `mp.js` 的 `CUSTOM_GIFS` / `iconMap`；用于 8 个信物使用入口、6 个信物鉴看入口、16 个收藏品拼合/处置入口。

## 仍然存在的问题（下一批）

1. **新内容失败仍会推进到下一段**：`MP Keepsake Use`、`MP Night Event`、`MP Region Moment/Encounter`、`MP RelDay 5/6`、`MP Daily 4/5` 的失败分支仍直接链到下一节点，能拿到下一段奖励。应改成失败只重试/退出，或下一段不再发钱。
2. **夜间/季节文案没有对应门控**：`mp-job-seasonal-and-failures-2` 全文没有 `Time.`/`Weather.`，梅雨、霜冻、周五、近海等文案在任何时候都会出现；`mp-npc-intimate-days-2` 的午夜/暴风雨夜/闭馆前也没有时间门。
3. **A6 压缩后仍有选项悬空**：`MP Festival Fog 2`、`Winter 1` 已补回纸袋/湿绳/热汤/登记簿；`Term 1`、`Chime 1`、`Lantern 2`、`Tide 1`、`Harvest 4`、`Plough 2`、`Solstice 2`、`Sealamp 2`、`Winter 3`、`storylines-wilds` 四个 Step5 仍需补物件或改选项。
4. **模板句重复**：A2 的 134 对“独立文案”里仍有大量同一句模板，例如 `你避开正面的视线……` ×10、`你找到了另一条隐秘的突破口` ×10、`周围的街坊纷纷向你投来赞许的目光` ×16。selfcheck 的“0 重复句”不成立。
5. **旧标签超长与模板化**：全库仍有 114 条选项超过 12 字；`先按现有线索过去看看` 152 次、`定神再试一次` 126 次等。
6. **中英文人名混用**：Sera/塞拉、Robin/罗宾、Vesper/维斯等在同一文件里混用；本批只修了选项标签里最显眼的几处。
7. **A1 只覆盖 5 个旧文件**：全库仍有 76 段进页面自动投骰（`mp-town-festivals`、`mp-storylines-town/wilds`、`mp-world-events` 等）。
8. **`mpAmbient` 未用于新区域瞬间页**：`mp-region-moments-3` 32 段都没有，和旧区域事件不一致。
