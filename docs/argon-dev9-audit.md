# Argon dev9 输入审核与接入记录

日期：2026-10-24

## 一、交付范围

输入：`DoL-MP-v1.2.0-dev9-full-mod-src.zip` 与 `argon-dev9-new-and-revised-only.zip`（两份内容一致，partial 包只含改动文件）。

- 全模组 **60 个 twee，1823 个唯一 passage**（dev8 为 55 / 1723）。
- 新增 5 个文件、100 段：
  - `mp-npc-intimate-days-3.twee` 24（RelDay 7–8 + 原版 NPC Daily 6–7）
  - `mp-region-moments-4.twee` 36（Region Moment 8–10 + Region Encounter 3–4）
  - `mp-job-seasonal-and-failures-3.twee` 20（Job Extra 2 + Job Partner 3）
  - `mp-keepsake-uses-2.twee` 8（Keepsake Use 3）
  - `mp-night-and-wilds-events-2.twee` 12（Night Event 3–4）
- 改写 46 个旧文件、1019 个 passage；**没有删除任何旧 passage**。
- 两份交付里的 `manifest.md` / `selfcheck.md` 实际是 dev8 的旧副本（日期停在 2026-10-23 18:41），本批结论全部以代码为准。

## 二、机械检查结果（接入后）

| 检查项 | 结果 |
| --- | --- |
| 文件数 / 唯一 passage | 60 / 1823，重名 0 |
| 断链 / 空链接 | 0 |
| 宏开闭计数 | 0 不配平 |
| `if/elseif/else` 结构（栈式） | 0 结构错误 |
| `「」` / `<span>` 配对 | 0 |
| `$outside` / `$location` / `[nobr]` 覆盖 | 内容段全覆盖（27 个 UI/战斗子屏除外） |
| `$location` 不在 case 表 | 0 |
| 未注册图标 | 0 |
| 非 Eden `<<npcincr trust>>` | 0 |
| 新内容 BFS 可达 | 306 个节点，孤立 0 |
| 选项标签 >12 汉字 | 0 |
| 同文件重复句（≥10 汉字，>2 次） | 0 |
| 失败分支设 `$daily` 锁死重试 | 0（已修 6 处） |
| 成功/失败两分支完全相同 | 0（已修 8 处） |

## 三、接入时补做的修正

1. **5 个新文件加入 `boot.json`**：60 个 twee 全部注册，路径无缺失。
2. **A6 压缩造成的模板句崩坏（37 段）**：`你耐下心神对准{碎片}…`、`你凑近{碎片}…` 这类把句子碎片填进模板的病句，涉及 `mp-town-side-stories`、`mp-town-extra-stories`、`mp-wilds-side-stories`、`mp-wild-extra-events`、`mp-town-wilds-moments`、`mp-region-moments-2`、`mp-region-storylines-2`、`mp-town-festivals-4`、`mp-job-and-keepsake-followups`。已按 dev8 对应段落恢复成功/失败文案，保留 dev9 的链接与旗标结构。
3. **世界事件名词截断（30 段）**：`将的木钱匣`、`的的旧木盒`、`塞漂流瓶`、`制书签盒` 等，按正文完整物件名重写成功句，并同步修正选项标签与 `mpAmbient` 后的指代。
4. **信物鉴看失败锁死（6 处）**：`MP Keepsake Show Whistle/Core/Ring/Amber/Medal/Antler` 失败分支误设 `$daily`，导致“再试一次”当天失效。已删除失败分支的每日旗标。
5. **假检定（8 处）**：4 个区域事件（`Foghorn CompassBox / OneEyedGull / SailorTrunk / CrossedMasts`）与 4 个城镇暗线（`Clockshop Step2 / School Archives Step2 / Temple Catacomb Step2/Step5`）的成功/失败分支效果完全相同。区域页已给失败分支独立代价；城镇页删除了与真正 `<<skulduggerycheck>>` 重复的装饰性 if。
6. **人名统一**：`Gwylan/Jordan/Alex/Sera/Robin/Vesper/Noel/Monet/Ash/Eden/Wren/Briar/Avery/Sydney` 在正文、选项与结算字符串中统一为中文名；`约旦`→`乔丹`，`艾利克斯`→`亚历克斯`，`伦恩`→`雷恩`，`悉尼`→`西德尼`，`礼顿`→`雷顿`。共 150 行。
7. **信物旧名统一**：精密发条母芯→蓝钢怀表芯、黑曜石戒→银鸽指环、温室古琥珀→琥珀香膏瓶、黑铁货运徽章→站长纪念铜章、白鹿角符牌/鹿角符牌→白鹿角坠饰、信物用法的银狐假面→纯银狐面胸针；场景里作为道具的“银狐假面”保留原名。
8. **`$location` 修正 12 段**：Glasshouse 5 段 `park`→`avery_mansion`、Clockwork 5 段 `sewers`→`underground`，以及 `mp-keepsake-uses-2` 的 Amber 3 / Core 3。
9. **时间/季节门控**：
   - 新文件 10 段把“清晨/晚间/黄昏/秋雨”等词移进对应 `Time.dayState` / `Time.season` / `Weather.precipitation` 分支。
   - 8 个日常/跟进页补 `Time.` 或 `Weather.` 门控（Bakery、Lin 1、Mason 1、Sera 1/2、Vesper 1、Noel 1、Lin 2）。
10. **跨场景链接门控**：`MP Extra Instant Rain HerbBasket`→雪天石阶、`Snow Pine`→黄昏鱼市，补 `Weather.isSnow` / `Time.dayState is "dusk"`，不匹配时回原区域。
11. **选项物件补写 11 段**：Sera 7、Vesper 8、Noel 8、Monet 8、Ash 8、Wren 6、Briar 7、Night Alley 3、Park 3、SeaRocks 3、Orphanage 3 的正文补出选项点名的水壶、肉桂茶、恒温阀、画框、拓片、进港清单、私账、木箱、捞叶网、海带、止水阀杆。
12. **区域末端导航标签**：16 个“顺通道继续查探/沿着暗径往里走”实际回到区域入口，改为“退出回廊返回入口/沿原路退出暗径”。
13. **变量与技能**：`$sneak`→`$skulduggery`；Glasshouse 3 的 `$danceskill`→`$tending`；Amber 3 的 `$seductionskill`→`$tending`。
14. **病句**：`起了旧港藏货`→`起获了旧港藏货`、`配方的酬金`→`配方酬金`、`借理流苏`→`借飞散的流苏折起餐巾筹码`、松子/安抚林鸮的动作矛盾。
15. **`mp-region-moments-2` 40 段补 `<<mpAmbient>>`**，与 moments-3/4 一致。
16. **6 个 Wilds Step5 的双 `<<else>>`**：`$money` 判断缺 `</if>>`，会触发 SugarCube malformed `else`。已补闭合并删除末尾多余闭合，结构检查归零。
17. **衣物“修复”伪宏**：`mp-new-npcs` 的 `<<upperintegrity 40>><<lowerintegrity 40>>` 只是显示完整度，不会修衣服。改为 `window.clothingData(... "integrity_max")` 真正写回。
18. **`$mpNpcs` 兜底**：156 处 `<<set _npc to $mpNpcs.X>>` 前补 `$mpNpcs` 与对应 NPC 的对象初始化，避免 mp.js 未先注入时报 undefined。
19. **`$mpBriarExit` 兜底**：8 个出口改为 `($mpBriarExit or "Danube Street")`，直接进入异常存档时不再出现无目标按钮。
20. **`window.dolmp` 保护**：`mp-companion-npc` 两处 `openNativeInteract` 补 `window.dolmp &&` 判断。
21. **Bailey 两段 `$daily` 初始化**：与其余 357 段保持一致。

## 四、仍然存在的问题（下一批）

> 以下问题均已定位到具体文件/行，但涉及成段重排，未在本批强行修改，留给 dev10。

1. **奖励档位 `if` 绑定错误（98 段）**
   - `mp-storylines-grand.twee` 64 段（16 条长线 × Step2/4/5/Resolve）
   - `mp-world-events.twee` 32 段
   - `mp-town-festivals.twee` 2 段（Harvest 4 / Winter 4）
   - 形状：`<<if _sk gte A>><<set _reward to X>><<elseif _sk gte B>><<set _reward to Y>>` 后面直接接成功正文，`<<else>>`（失败正文）与 `<</if>>` 在更下方。高技能档只设 `_reward`，看不到正文、拿不到钱；失败正文也被绑进档位链。需要把档位链用 `<<else>><<set _reward to 最低档>><</if>>` 收口，再把失败正文移到技能检定的 `<<else>>` 内。
2. **`_first` 绑定错误（20 段）**
   - `mp-town-festivals.twee` 14 段、`mp-storylines-wilds.twee` 6 个 Resolve。
   - `<<if _first>><<if claim…>><<money…>><</if>>` 少一个 `</if>>`，导致第二次及以后即使成功也走失败文案。修法：补外层 `</if>>` 后，把失败正文与重试链接整体移到技能检定的 `<<else>>`。
3. **双动作同奖同去向**：`mp-region-moments-4` 44 段、`mp-night-and-wilds-events-2` 12 段、`mp-job-seasonal-and-failures-3` 12 个 Extra 页；第二动作的唯一差异是只写不读的 `$mpClues[..._alt]`。
4. **一次性奖励文案每天复读**：新内容 76 处 `claimUniqueReward` 只发一次，但成功文案每次都说“塞给你钱/工钱/谢礼”。需要把奖励句收进 claim 分支，或改成每日 `$daily` 封顶发放。
5. **选项物件仍缺**：`mp-region-moments-4` 约 23 段（铜箍/螺母、柏木舟等）、`mp-keepsake-uses-2` 7/8 段（蜂蜡锁、三拉杆、副环等）。
6. **时间/季节文案未门控**：约 21 段（`mp-town-side-stories`、`mp-town-extra-stories`、`mp-wild-extra-events`、`mp-storylines-town/wilds`、`mp-main-and-collection-quests` 等）。
7. **模板化标签**：8 个出口变体各出现 77–80 次、12 个重试变体各 24–28 次；`mp-job-seasonal-and-failures-3` 7 个标签各重复 20 次。
8. **节令计分**：`mp-town-festivals-3` 计分上限 3，但终段阈值写 `gte 4`，£6.50 档不可达；`Maypole 2` 第一个选项漏 `+1`。
9. **标签与效果对调（约 60 段）**：`mp-region-extra-events` 40 段的顶部“动作”链接只回 hub 无收获，真正的检定在 div 里写着“走路”的链接上；`mp-world-events` 约 20 段同类。需要把动作标签放到真正执行检定的链接上。
10. **世界事件结算写在正文层（31 段）**：`$mpKnown` / 物品解锁在 `<<if $money gte …>>` 付款判断之前，没钱也会白拿；刷新页面还可能重复结算。应移进付款成功的 `<<if>>` 或对应链接体。
11. **`mp-new-regions` 残句（14 段）**：`石像底座的奉里的收获`、无来源的“第 N 处暗格”。需要按对象重写结算句。
12. **`mp-world-events` Hospital Night 等 5 段无时间门控**：整段写夜班/今晚，但文件 0 个 `Time.`，白天也会被抽到。
13. **P2**：图标同屏 >4、非 Hub 三段等长选项、结果式标签 5 条、`mpAmbient` 未覆盖 extra-events/moments-2/new-regions/world-events、`$mpClues` 全库只写不读、`“”/「」/『』` 引号体系不统一。

## 五、结论

dev9 的内容量、静态结构与时间门控比 dev8 完整，但 A6 压缩和 A2 批量改写引入了两类新事故：模板句崩坏与 `if` 绑定错位。本批已清除模板句崩坏、失败锁死、假检定与 6 个解析错误；剩余绑定错位集中在长线和世界事件，建议 dev10 优先做结构性重排，而不是继续压缩。
