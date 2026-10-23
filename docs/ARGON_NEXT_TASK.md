# 给 Argon 的下一批任务（dev6 接入后）

当前源码：**44 个 twee，1468 个 passage**。dev6 的 6 个新文件与 6 个返修文件已经全部接入，3 个新 Hub 已接线。

> 写之前先读 `docs/vanilla-ui-style.md` 和 `ARGON_PROMPT_V6.md`。这一批重点是“把选择做成真的”，不是继续堆 Hub。

## A. 质量返修（约 60 段）

### A1. NPC 任务检定改成“点动作时再判定”（6 位 × 3 阶段）

现在 `MP NPC <Name> Quest` 在第 3/6/9 阶段是进页面前就掷好检定，两个动作都指向同一个 Pass/Fail。请改成：

- 两个动作各自在点击时检定，用不同技能/属性（例如一个诡术、一个体能/意志）。
- 成功进对应 `Pass`，失败进 `Fail`；失败不推进阶段、不扣存款。
- 两个动作的成功文本要不同，不能只是同一段换一句话。

### A2. 零工季节段降频

`mp-livelihoods.twee` 和 `mp-job-extra-routes.twee` 里，春夏季节段现在每次成功班次都会插入。改成：

- 季节段 1/3 概率出现，或只在节气附近几天出现；
- 随机小事件仍每次最多 1 个；
- 不要让一次收工同时出现“季节段 + 随机段 + 里程碑”三连。

### A3. 区域瞬时事件完成后清标记

`MP Region Micro *` 完成后把对应的 `$mpMicroNotice["..."]` 清掉，区域入口不再一直挂着同一条事件链接。

### A4. 旧长段落压缩（优先 10 段）

按正文 ≤250 字压缩这些旧段落，保留信息、删掉重复形容：

- `MP Companion Quest Step`（1178 字）
- `MP Main Story Eclipse Hub`（942 字）
- `MP Companion Hub`（797 字）
- `MP Side Bookstall` / `MP Side School Goggles Resolve` / `MP Side Street Lamp Resolve`
- `MP Side Hospital Slip Resolve` / `MP Wild Extra Red Thread Herbs Resolve`
- `MP Wild Extra Boundary Stone Resolve` / `MP Side Cafe Alley Resolve`
- `MP Mansion Avery CarInvite` / `GownCheck` / `ChampagneToast` / `Quinn WineCellar`（各 380–440 字）

## B. 新内容（约 140 段）

1. **2 条新区域暗线 × 7 段 = 14 段**：选两个现有新区域（例如 Velvet Mirage、Observatory Wing），写有阶段、失败、软坏结局的 7 段小链。
2. **12 段 NPC 关系事件**：6 位常驻 NPC × 2 段，写关系推进后的具体一天，不要再写初见。
3. **12 段城镇/荒野日常**：市场、码头、学校、公园、森林、农场各 2 段，1 段 1 个瞬间，必含检定。
4. **6 段零工后续**：12 条零工里挑 6 条，各写 1 段“熟客/东家记得你”的后续。
5. **5 段收集信物后续**：现有 `$mpKeepsake` 信物各写 1 段“拿给某个 NPC 看”的反应。
6. **4 个新半日节令 × 5 段 = 20 段**：日期自己定，写进 manifest；Hub 要按日期窗口显示。
7. **剩余补足到 140 段**：优先补区域事件和 NPC 日常，不要新增纯菜单 Hub。

## 硬规则（不变）

1. 一个 passage 只写一个瞬间；正文 60–200 字，最多 250。
2. 一段 2–4 个选项，最多 5 个；移动/离开选项在最上面。
3. 选项写动作，不写结果；≤12 个汉字；不加句号。
4. 一段图标最多 3–4 个；闲聊、追问、等待不加图标。
5. 有检定就有成功/失败和具体后果；失败不扣现有钱、不加进度。
6. 不写 Lv/等级/经验/任务/阶段/进度/奖励/你成功了。
7. 每个 passage 开头 `$outside` / `$location`，加 `[nobr]`。
8. 一次性奖励用 `claimUniqueReward`；`<<money 1200>>` = £12。
9. 中文引号必须成对；对话用「」。
10. 不要改 `boot.json` / `mp.js`；新文件与 Hub 留好接口，由集成方接线。

## 输出

1. 返修直接改对应文件，`manifest.md` 列出改了哪些段。
2. 新内容按主题分文件。
3. `selfcheck.md`：断链、outside/location、宏闭合、未注册图标、Lv、失败扣钱、重复句、BFS 可达、引号配对。

## 验收

- 断链 0、宏闭合 0、引号配对 0 处不平衡
- 每段 `$outside` / `$location` / `[nobr]`
- 没有 Lv/等级/经验
- 没有失败扣存款
- 新内容可从入口 BFS 到达
- 抽查 10 段：正文 ≤250 字、选项 ≤5 个、图标 ≤4 个、标签是动作、失败有具体代价
