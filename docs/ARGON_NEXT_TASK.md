# 给 Argon 的下一批任务（dev5 接入后）

当前源码：**38 个 twee，1294 个 passage**。你上一批的 6 个文件已经全部接入 `boot.json`，零工插入段、小节令 Hub 都已接线。

本批目标：先补质量缺口，再扩约 200 段新内容。

## A. 质量返修（先做，约 60 段）

### A1. NPC 任务阶段加检定（6 位 × 3 个关键阶段 × 2 分支 = 36 段）

`mp-new-npcs.twee` 里 Sera / Vesper / Noel / Lin / Monet / Ash 的 `Quest` 目前是每天点一次自动推进，只有额外奖励有检定。请改成：

- 第 3、6、9 阶段各插入一个具体动作检定（技能/属性/同伴三类都可以）。
- 成功才 `stage + 1`，并给对应阶段分镜。
- 失败不推进阶段，写清具体代价（烫伤、被支开、线索断掉、错过换班），不扣存款。
- 不要写“任务失败”“请重试”这类游戏化字样。

### A2. `mp-new-regions.twee` 的 9 个 `Search` 低技能分支（修改，不新增）

高技能分支已经有 `claimUniqueReward`，低分支每次都能拿 £2~£3。请给低分支加每日一次限制（`$daily.mpRegionLoot_<区域>`），重复进入时改写为“暗槽已被你翻检过，只剩潮湿的碎壳”这类具体文本。

### A3. 6 段区域瞬时事件改成“先登记、再前往”（12 段改造）

`MP Region Micro *` 现在在 High Street 点便条 4 分钟就传送过去。改成：

- 便条只写 `$mpMicroNotice["foghorn_bell"] = 1`，提示“记下地点，改日过去看看”。
- 对应区域入口（`MP Region Foghorn Island` 等）加一条条件链接，只有登记过才出现。
- 事件本身保留，返回链接仍回区域入口。

### A4. `$location` 规范化（约 38 处）

`high` / `danube` / `domus` / `connudatus` / `harvest` 不在 `Widgets MP Ambient` 的 case 里。请统一改成已有 case：`high`→`town`、`danube`→`avery_mansion`、`domus`→`town`、`connudatus`→`town`、`harvest`→`pub`。如果某些场景确实是室内，用 `cafe` / `cabin` / `bedroom` 等已有值。

## B. 新内容（约 140 段）

1. **3 处新软坏结局 × 5 段 = 15 段**（农场谷仓、学校旧档案室、钟塔顶层）。结构照现有 5 处：Hub + 3 个动作段 + EscapeWin，每个 Hub 至少 4 条破局路线，失败有代价、不扣钱。
2. **12 段城镇/荒野瞬时事件**：雨天、雪天、集市散场、深夜巷口各 3 段；1 段 1 个瞬间，必含检定。
3. **6 位 NPC 日常额外 3 段 × 6 = 18 段**：写“已经熟起来之后”的日常，不要再写初次见面。
4. **6 个区域深层事件 × 3 段 = 18 段**：每个区域一个 3 段小链，最后给一件信物或一条线索。
5. **4 个新节日 × 5 段 = 20 段**：只写半天到一天的小节日，日期自己定，写进 manifest。
6. **零工补充 50 段**：12 条零工各补 4 段（2 随机 + 2 季节/节日），保持现有命名和 `claimUniqueReward` 规则。

## 硬规则（不变）

1. 一个 passage 只写一个瞬间；多步骤拆 passage。
2. 选项写动作，不写结果；链接标签不超过 12 个汉字。
3. 每个 passage 开头 `$outside` / `$location`，加 `[nobr]`。
4. 返回目标必须存在；用 python 对照本体 HTML + 所有 mod twee。
5. 有检查就有成功/失败和后果；失败不扣现有钱。
6. `<<money 1200>>` = £12；一次性奖励用 `claimUniqueReward`。
7. 不显示 Lv/等级/经验；不写“共同推进『任务名』”。
8. 图标只用已注册；`$mpKnown` key 必须和 new-regions 对齐。
9. 地点选项放动作选项上面；NPC hub 不要每个选项都顶图标。
10. 不要写 explicit sexual content；可以写暧昧、紧张、疲惫、温柔。
11. 不要改 `boot.json` / `mp.js`；新文件与 Hub 留好接口，由集成方接线。

## 输出

1. 返修直接改对应文件，并在 `manifest.md` 列出改了哪些段。
2. 新内容按主题分文件，命名用 `MP Extra ...` / `MP BadEnd ...` / `MP Festival ...`。
3. `manifest.md`：文件、passage 数、检查数、入口、节日日期。
4. `selfcheck.md`：断链、outside/location、宏闭合、未注册图标、Lv、失败扣钱、重复句、BFS 可达。

## 验收

- 断链 0、宏闭合 0
- 每段 `$outside` / `$location` / `[nobr]`
- 没有 Lv/等级/经验
- 没有失败扣存款
- 新内容可从入口 BFS 到达
- 36 个关键阶段分镜彼此不重复
