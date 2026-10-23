# 八大新区域 hub / Search 旧节点重写自检

日期：2026-10-23
范围：`mod-src/twees/mp-new-regions.twee` 中 8 个区域 × 4 个子区域的 hub 与 Search，共 64 个 passage。

## 一、改动范围

| 项目 | 数量 |
|---|---:|
| 区域 | 8（Foghorn / Clockwork / Abbey / Glasshouse / Blackiron / Druid / Velvet / Observatory） |
| 子区域 | 32（每区域 4 个） |
| 重写 hub | 32 |
| 重写 Search | 32 |
| 重写合计 | 64 |
| 文件 passage 总数 | 121 |
| 未触碰的范围外节点 | 57 |

逐 passage 对比原文件：仅 64 个目标 passage 有差异，非目标 passage 差异 0。区域入口、Scout、Ask、Rest、Pool Router 均未改动。

范围外 57 个节点构成：

- 8 个区域入口：Foghorn Island、Clockwork Undercity、Sunken Abbey、Glasshouse Manor、Blackiron Yard、Druid Circle、Velvet Mirage、Observatory Wing
- 8 个 Scout
- 8 个 Ask
- 32 个 Rest
- 1 个 `MP Region Pool Router`

## 二、结构自检

| 检查项 | 结果 |
|---|---:|
| passage 名唯一 | 121 / 121，重复 0 |
| 断链 | 0 |
| `<<if>>` / `<</if>>` 不平衡 | 0 |
| `<<link>>` / `<</link>>` 不平衡 | 0 |
| `<<replace>>` / `<</replace>>` 不平衡 | 0 |
| `<div>` / `</div>` 不平衡 | 0 |
| 64 个目标 passage 有 `$outside` | 64 / 64 |
| 64 个目标 passage 有 `$location` | 64 / 64 |
| 64 个目标 passage 带 `[nobr]` | 64 / 64 |
| `skulduggerysuccess is 1 and (...)` 结构 | 0 |
| 失败分支扣钱 | 0 |
| 目标段落内 `bedicon` | 0 |
| 未注册图标 | 0 |
| 未定义的 `$mpKnown` key | 0 |
| Lv / 等级 / 经验文本 | 0 |

链接目标已对照 `mod-src/twees/*.twee` 与本体 `game/Degrees of Lewdity.html` 的 passage 名汇总校验。

## 三、hub 设计

每个 hub 现在给出 3 类具体动作：

1. **直接调查**：`investigateicon`，进入该子区域的 Search。
2. **观察 / 社交 / 环境互动**：`socialiseicon`、`investigateicon` 或 `tendingicon`，用属性差分（如 `$history`、`$tending`、`$athletics`、`$skulduggery`）给出成功/失败反馈；成功会揭示该子区域自己的物件细节，并解锁下一个子区域。
3. **离开 / 换地点**：前往下一个已知子区域，或沿该子区域自己的路径退回区域入口。

按协调者补充要求：所有“前往 / 退回某地点”的地点选项放在动作选项上方，动作选项放在下方。

hub 检查与差分：

- 32 个 hub 均有调查链接、观察/社交内联动作、地点选项。
- 32 个 hub 保留原有开场差分句（`$outside` / `$location` 后第一段属性差分）。
- 观察动作使用 32 个独立 `<div id="obs-...">` + `<<replace>>` 目标，均一一对应。

## 四、Search 设计

每个 Search 现在是 2 个动作选择 + 1 个返回地点选项：

- 动作 A：`<<skulduggerycheck "silent">>` 显式检定，成功/失败分支分离。
- 动作 B：属性检定/差分（`$science`、`$history`、`$tending`、`$athletics`、`$swimming`、`$maths`、`$beauty`、`$dance` 等），成功/失败文本与条件一致。
- 返回：地点选项放在两个动作上方。

| 检查项 | 结果 |
|---|---:|
| Search 数量 | 32 |
| 每个 Search 的动作选择 | 2 |
| 每个 Search 的显式 `skulduggerycheck` | 1 |
| 显式检查总数 | 32 |
| Search 第二动作的属性检定/差分 | 32 |
| 有至少 1 个检查的 Search | 32 / 32 |

失败后果仅使用 `pain 2~3`、`stress 3~6`、`tiredness 1~3`，不扣现有钱、不扣存款。

## 五、奖励与线索

- 成功不再只给钱：每个 Search 的成功分支都有具体物件、古物、NPC 反应或后续地点解锁。
- 32 个 Search 的原 `$mpFrag...` 累加逻辑全部保留（SmugglerRing / CrownGear / AbyssPage / BrideFlower / LedgerKey / VelvetCrest），共 96 处 `$mpFrag...` 读写，均沿用原 key。
- 32 个 `claimUniqueReward("region_unique_MP_Region_...")` id 与重写前完全一致。
- 32 个 Search 的 `$mpKnown` 解锁集合与重写前完全一致；未新增任何 `$mpKnown` key。
- 钱只作为附带小奖励：18 个 `<<money>>` 宏分布在 16 个 Search passage（另外 16 个 Search 不给钱），金额 200~500 便士（£2~£5），没有每段固定金额。

## 六、文本与标签

| 检查项 | 结果 |
|---|---:|
| 目标段落链接标签总数 | 216 |
| 唯一标签数 | 216 |
| 重复标签 | 0 |
| 最长标签汉字数 | 11（限制 12） |
| 重复完整散文句（>2 次） | 0 |
| 结果词标签（“发现/成功/失败/被…”） | 0 |
| 目标段落使用图标 | investigateicon、socialiseicon、tendingicon、walkicon、getouticon |
| 未注册图标 | 0 |

每个子区域的观察、成功、失败文本都围绕自己的物件撰写，例如盐晶与牡蛎暗槽、守塔人壁炉、沉船肋木、回音廊气孔、擒纵轮与阀门法兰、黄道暗格与差分机、无面石像与告解木榫、泥金抄本与暗河渡口、银脉兰与琥珀标本、橡木桶与蒸馏器、道岔暗盒与装甲车枪架、电报纸带与配重铁箱、石柱符文与月泉、陶瓮与空心木柱、银狐假面与试衣台、栏杆柱头与拍卖展台、赤道仪配重与 1894 号画筒、紫水晶底座与钟楼石兽。

## 七、剩余旧节点

- 旧式 hub / Search 节点剩余：**0**。64 个目标节点已全部重写。
- 范围外仍保留原有写法的节点：**57**（见第一节），按任务要求未改。
- 这些范围外节点不被本次重写引用为奖励或线索来源，仍由原区域入口 / Scout / Ask / Rest 逻辑独立使用。

## 八、结论

64 个 hub/Search 全部重写完成；结构、断链、宏闭合、图标、`$mpKnown`、`$mpFrag`、唯一奖励 id 均通过自检。失败不扣钱，成功均有具体发现，地点选项在动作选项上方。剩余待实机项：内联观察链接在游戏内的点击与编号表现，以及 8 个区域解锁链的实机走通。
