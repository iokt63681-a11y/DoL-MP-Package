# Argon dev10 输入审核与接入记录

日期：2026-10-24

## 一、交付范围

输入：`DoL-MP-v1.2.0-dev10-full-mod-src.zip` 与 `argon-dev10-new-and-revised-only.zip`（两份内容一致，partial 包只含改动文件）。

- 全模组 **64 个 twee，1903 个唯一 passage**（dev9 为 60 / 1823）。
- 新增 4 个文件、80 段：
  - `mp-region-moments-5.twee` 40（8 区域 × Moment 11–13 + Encounter 5–6）
  - `mp-npc-intimate-days-4.twee` 24（6 常驻 NPC RelDay 9–10 + 6 原版 NPC Daily 8–9）
  - `mp-keepsake-uses-3.twee` 8（8 枚信物 Use 4）
  - `mp-region-storylines-3.twee` 8（8 区域深层后续 + Velvet Mirage 8 / Observatory Wing 8）
- 改写 42 个旧文件、909 个 passage；没有删除任何旧 passage。
- `boot.json` / `mp.js` / `mp.css` 未改；4 个新文件由集成方注册。

## 二、机械检查（接入后）

| 检查项 | 结果 |
| --- | --- |
| 文件 / 唯一 passage | 64 / 1903，重名 0 |
| 断链 / 空链接 | 0 |
| 宏开闭计数 | 0 不配平 |
| `if/elseif/else` 栈式结构 | 0 错误 |
| `「」` / `<span>` 配对 | 0 |
| `$outside` / `$location` / `[nobr]` | 内容段全覆盖 |
| `$location` 不在 case 表 | 0 |
| 未注册图标 | 0 |
| 非 Eden `npcincr trust` | 0 |
| 新内容 BFS | 418 节点，孤立 0 |
| 失败分支设 `$daily` | 0 |
| 成功/失败分支完全相同 | 0 |
| 模板句崩坏（`将的`/`耐下心神对准`/`里的收获`） | 0 |
| `<<money>>` 缺 `claimUniqueReward` 保护 | 0 |

## 三、Argon 本批修复验证

1. **A1 奖励档位 `if`（111 处）**：抽查 `mp-storylines-grand` 全部 16 条长线的 Step2/4/5/Resolve，档位链已在成功正文前用 `<<else>><<set _reward to 最低档>><</if>>` 收口，高/中/低三档都能进入成功正文并执行 `<<money _reward>>`；外层 `<<else>>` 正确对应技能检定失败。
2. **A2 `_first`（20 处）**：`mp-town-festivals` 14 处与 `mp-storylines-wilds` 6 个 Resolve 已在奖励处闭合 `_first`，第二次及以后成功显示成功文案与链接，不再落入失败叙事。
3. **A3 双动作差异**：80 个新段落全部使用不同 `claimUniqueReward` key、不同金额（Action 2 多 60 便士）并附加 `<<control 1>>`；机械核对 80/80 通过。
4. **A4 奖励文案**：新内容的给钱句子已放进 `claimUniqueReward` 为真的分支，重复触发走非金钱收尾。
5. **审计第 5–13 项**：模板句、截断句、弯引号、`$mpKnown` 进场解锁、按钮错位、节令阈值等均有对应改写；机械检查未见残留。

## 四、接入时补做的修正

1. **4 个新文件加入 `boot.json`**：64 个 twee 全部注册，路径无缺失。
2. **信物旧名回归**：`mp-keepsake-uses.twee` 的 3 个选项标签仍写“鹿角符牌”，已统一为“白鹿角坠饰”，并把同段“符牌”改为“坠饰”。
3. **跨场景线索硬接（35 处）**：新段落为了制造 `$mpClues` 闭环，读取了完全无关的线索（例如雾角栈桥读 `mpDaily_sydney_9_alt`、维斯关系日读塞拉线索、怀表芯秘境读铜哨线索）。已按“同区域/同 NPC 才保留”清理 35 处，保留 45 处同链读取。
4. `mp.js` / `mp.css` 与基线逐字节相同；`node --check` 通过。

## 五、接入时补做的修正（结构/逻辑）

1. **4 个新文件加入 `boot.json`**：64 个 twee 全部注册。
2. **信物旧名回归**：`mp-keepsake-uses.twee` 的 3 个“鹿角符牌”标签与 1 处正文统一为“白鹿角坠饰”。
3. **跨场景线索硬接（48 处）**：新段落读取完全无关的线索（雾角读悉尼日常、维斯读塞拉、怀表芯读铜哨）。按“同区域/同 NPC/同信物才保留”删除 48 处，保留同链读取。
4. **可刷的线索加成（312 处）**：所有 `<<if $mpClues…>><span class="teal">…</span><<stress -1>><</if>>` 的 `<<stress -1>>` 全部移除，只保留叙事，不能再靠反复进出刷压力。
5. **`mp-region-moments-3` 补齐 A3（32 段）**：第二动作改用独立 claim key、金额 +60、追加 `<<control 1>>` 与 `$mpClues` 标记。
6. **`mp-region-moments-5` 的 P0**：`MP Region Encounter Foghorn 5` 的 `None` / `$sneakicon` 非法条件改为正常属性检定。
7. **`MP Region Encounter Observatory 6` 线索键误写**：`mpDaily_sydney_9_alt` 改回 `mpReg5_observatory_enc6_alt`。
8. **Wilds 6 个 Resolve**：`_first` claim 从 passage 顶层移进成功分支；失败分支删掉 800 酬金，失败不再发钱；成功文案不再重复承诺。
9. **Festivals 22 段 `_first`**：claim 从入口移到成功分支，首次失败不再烧掉一次性奖励。
10. **World-events 39 处无守卫奖励**：全部补 `claimUniqueReward("world_ev_<scene>")`，修复 Loose Cobble 入口循环。
11. **人名统一**：`莱顿/雷顿` 33 处统一为原版汉化的 `礼顿`，`艾什` 1 处改 `阿什`。
12. **时间文案中性化**：15 段固定“午后/傍晚/黎明”等改为中性，或已在同段门控内。
13. **选项标签**：318 条 >12 汉字全部压到 ≤12（新内容 158 条 + 旧文件 160 条），当前全库 0 条超限。
14. **导航标签/图标**：18 条导航标签缩短；“改日再去…”等待链接去掉 `socialiseicon`；13 段线索行移到 `$outside` 之后。
15. **宅邸 Router P0**：`MP Mansion Pool Router` 的 4 个中文 passage 名（`MP Mansion 艾弗里 …` / `布莱尔 VelvetLedger`）改为实际英文名，随机抽到不会再空页软锁。
16. **`mp.js` 返回点**：`isSafePassage` 正则补 `Keepsake|RelDay|Mansion`，信物/关系日/宅邸页面不再把 `$mpReturnPassage` 留在上一个安全页。

## 六、仍然存在的问题（下一批）

1. **整段总字数 >250（181 段）**：这是把两个动作 × 成功/失败所有分支相加的口径；按“入口 + 单条结果”的单屏口径，全库只有 7 段真正 >250（`mp-locations` 5 段、`mp-storylines-town` 2 段，均为 dev9 遗留）。不建议盲压新内容，优先拆那 7 段。
2. **`$mpClues` 死写（约 450 键）**：全库写入 497 键，只有约 40 键被读取；Argon 的“497 键读写闭环”不成立。要么删掉死键，要么在语义相关处真正读取。
3. **通用线索提示句仍重复（约 150 处）**：`结合先前留心记下的蛛丝马迹…` / `凭借先前…巧手布置…` 等 5 条模板句，建议按场景改写或删除。
4. **同文件重复句 33 处**：集中在 `mp-region-moments-2`、`mp-npc-intimate-days-3`、`mp-night-and-wilds-events-2`。
5. **ASCII 直引号 34 段**：旧文件 `mp-locations`(30) 与 `mp-bailey-and-trials`(4) 仍用 `"`，本批新文件已用「」。
6. **`$control 1` 的叙事动机**：80 个新段落第二动作都附带，需确认是有意的关系/支配设计。
7. **P2**：图标同屏 >4（多为 Hub）、结果式标签 5 条、`$mpAmbient` 覆盖不全、地点映射不一致（Abbey `lake_ruin`、Glasshouse `garden`、Blackiron `industrial`）。

## 六、结论

dev10 是本轮质量最好的一批：A1/A2 结构修复真实有效，A3/A4 在新内容与 moments-3 均已落地，模板崩坏、解析错误、标签超限均为 0。剩余问题主要是死线索键、模板提示句和 7 段 dev9 遗留的超长单屏，不再有结构性阻塞。
