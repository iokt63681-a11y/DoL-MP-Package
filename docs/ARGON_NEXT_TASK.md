# 给 Argon 的下一批任务（dev8 接入后）

当前源码：**55 个 twee，1723 个 passage**。dev8 的 5 个新文件与 20 余个返修文件已经接入。

> 写之前先读 `docs/vanilla-ui-style.md` 和 `ARGON_PROMPT_V6.md`。这一批重点：失败不要白拿下一段奖励，压缩不要删掉选项依赖的物件。

## A. 质量返修（约 90 段）

### A1. 失败分支不要推进到下一段

`mp-keepsake-uses`、`mp-night-and-wilds-events`、`mp-region-moments-3`、`mp-npc-intimate-days-2` 里，第 1 段失败仍直接链到第 2 段，能拿第 2 段奖励。改成：

- 失败只给“再试一次 / 退回入口”；
- 或第 2 段改成纯叙事、不发钱；
- 两个动作的失败分支保持对称。

### A2. 夜间/季节/时辰文案要有门

- `mp-job-seasonal-and-failures-2` 全文没有 `Time.`/`Weather.`：梅雨、霜冻、周五、近海等文案要加 `Time.season` / `Weather.precipitation` / `Time.dayState` 门，或改成中性文案。
- `mp-npc-intimate-days-2` 的午夜、暴风雨夜、闭馆前也要加时间门。

### A3. 补回 A6 压缩删掉的物件（约 15 段）

选项点名了、正文却没有的，逐段补 1 句：

- `MP Festival Term 1`：裁纸边角、文具摊、西德尼。
- `MP Festival Chime 1`：工具箱、钟塔。
- `MP Festival Lantern 2`：神殿备用灯罩。
- `MP Festival Tide 1`：浮标链、石槽刻字。
- `MP Festival Harvest 4`：果农、赔款。
- `MP Festival Plough 2`：犁头铜印。
- `MP Festival Solstice 2`：遮阳篷、备用碎冰、公园。
- `MP Festival Sealamp 2`：纸灰。
- `MP Festival Winter 3`：厨工、最小的孩子。
- `mp-storylines-wilds` 的 Beach Shipwreck / Sewers Market / Connudatus Velvet / Park Greenhouse Step5：各补回铜环/货单、拖货声/粉笔记号、侍者/拍卖册、副驾/送货簿。

### A4. 模板句去重

A2 的 134 对里仍有大量同一句模板（如 `你避开正面的视线……` ×10、`周围的街坊纷纷向你投来赞许的目光` ×16）。同一文件同一句最多出现 2 次，按实际物件改写。

### A5. 标签与图标

- 全库仍有 114 条选项超过 12 字，优先改 `mp-regions-events-1`、`mp-job-punishment`、`mp-npc-daily-lines`、`mp-bailey-and-trials`。
- 失败分支里“被押往……”这类结果标签改成动作或“接受惩罚”。
- 同一段选项不要全一样长；两个动作也要差 2–3 字。
- 藏品/信物/脏物统一用 `<<keepsakeicon>>`；普通线索用 `<<investigateicon>>`。

### A6. 中英文人名统一

同一文件内 `Sera/塞拉`、`Robin/罗宾`、`Vesper/维斯`、`Noel/诺艾尔`、`Lin/林恩` 不要混用；选项与正文统一中文名。

### A7. A1 推广到剩余文件

`mp-town-festivals`、`mp-storylines-town`、`mp-storylines-wilds`、`mp-world-events` 仍有约 76 段进页面自动投骰，按 dev8 的做法移进动作。

## B. 新内容（约 100 段）

1. **12 段关系日后续**：6 位常驻 NPC × 2 段，写关系稳定后的具体一天。
2. **12 段区域瞬间**：8 个区域里挑 6 个，各 2 段；1 段 1 个瞬间，必含检定。
3. **10 段零工当班/失败补充**：12 条零工里挑 10 条。
4. **8 段信物后续**：现有 8 枚 `$mpKeepsake` 各 1 段“拿去用/拿去看”的场景。
5. **8 段夜事件**：巷口、码头、森林、公园各 2 段，入口必须夜间出现。
6. **剩余补足到 100 段**：优先补区域事件和 NPC 日常，不新增纯菜单 Hub。

## 硬规则（不变）

1. 一个 passage 只写一个瞬间；正文 60–200 字，最多 250。
2. 一段 2–4 个选项，最多 5 个；移动/离开选项在最上面。
3. 选项写动作，不写结果；≤12 个汉字；不加句号。
4. **同一段的选项长短不要一样**，长短交错。
5. 一段图标最多 3–4 个；闲聊、追问、等待不加图标。
6. 有检定就有成功/失败和具体后果；失败不扣现有钱、不加进度、不推进到发奖段。
7. **选择要真的改变结果**：不能进页面前掷好，也不能两个选项同一段结果。
8. 不写 Lv/等级/经验/任务/阶段/进度/奖励/你成功了。
9. 每个 passage 开头 `$outside` / `$location`，加 `[nobr]`。
10. 一次性奖励用 `claimUniqueReward`；`<<money 1200>>` = £12。
11. 中文引号必须成对；对话用「」。
12. 藏品/信物/脏物用 `<<keepsakeicon>>`。
13. 不要改 `boot.json` / `mp.js`；新文件与 Hub 留好接口，由集成方接线。

## 输出

1. 返修直接改对应文件，`manifest.md` 列出改了哪些段。
2. 新内容按主题分文件。
3. `selfcheck.md`：断链、outside/location、宏闭合、未注册图标、Lv、失败扣钱、重复句、BFS 可达、引号配对。
4. `manifest.md` 里列出每个新文件对照过的本体 passage（3–5 个）与采用的框架。

## 验收

- 断链 0、宏闭合 0、引号配对 0 处不平衡
- 每段 `$outside` / `$location` / `[nobr]`
- 没有 Lv/等级/经验
- 没有失败扣存款
- 失败分支没有“进下一段领奖”的链接
- 新内容可从入口 BFS 到达
- 抽查 10 段：正文 ≤250 字、选项 ≤5 个、图标 ≤4 个、标签是动作、失败有具体代价
- 抽查 10 对双动作：成功/失败文本与去向不能完全相同
