# Cursor 主提示词（直接粘进 Cursor 对话框）

你在接手一个已开发数月的 DoL（Degrees of Lewdity）原创内容 mod：**DoL-MP**。
工作目录就是当前打开的 `DoL-MP-Cursor-Handoff` 文件夹。

## 先读这些（按顺序）

1. `docs/PROJECT_STATE.md` — 现在做到哪、下一步做什么
2. `docs/ARCHITECTURE.md` — 代码结构、关键 JS、变量约定、验收规则
3. `docs/SKELETON_ALIGNMENT.md` — 为什么这轮要改骨架
4. `docs/VANILLA_SKELETON_SAMPLES.md` — 原版原文样例（标准答案）
5. `docs/SKELETON_TEMPLATE.md` — 照着写的模板
6. `vanilla/README.md` — 怎么检索原版 16,087 段

改代码只改 `source/mod-src/`。验收脚本在 `tools/`。

## 当前版本

`source/mod-src/boot.json` = `1.2.0-dev46`，164 个 twee / 3,426 passage / 502 可玩页。

## 这一轮的任务（V51：骨架对齐，不是加页）

按 A → B → C → D 顺序做。每完成一块，先跑检查再开下一块。

### A（P0）五人去任务化

对象：阿什 / 林恩 / 莫奈 / 诺艾尔 / 维斯（塞拉已完成，可参考但不照抄 Quest 链）。

1. **删掉** `MP NPC <Name> Deep Quest 1/2/2B/3/3B/4/4B/4C` 的线性链，以及 Deep Hub 里按 `deepStage` 指下一步的 if 链。林恩的 `MP NPC Lin Case Step *` 同理。
2. **保留变量**（旧存档兼容，不删字段）：`_npc.deepStage`、`emberPages/witnessPages/sketchPages/sporePages/clausePages`、`nextStepDay`、`setback`、`rep`、`$mp<Name>Ended`、`$mpWorld<Name>Ending`。
3. **新写 12–18 页门槛场景**（每人），按这个结构：
   - 日常场景 ×4：无门槛，按日程时段出现在 Hub/地点
   - 关系场景 ×3：love/trust ≥10 / ≥25 / ≥40
   - 收集物场景 ×3：对应页数 ≥2 / ≥4 / =6
   - 冲突场景 ×2：`rep` 低 / 高
   - 终局场景 ×2：`deepStage >= 5` 且收集物 =6，二选一不可逆
4. 场景规则：
   - 通过**日程/地点**出现，不是 Hub 上的任务按钮
   - 每个场景 2–4 个动作，结果内嵌，不跳 Result
   - 完成后 `deepStage +1`、`nextStepDay = Time.days + 1`
   - 同一场景当天只出现一次（`$daily.<sceneKey>`）
   - 失败：扣资源/钱/关系 + `$daily.failKey`；严重失败才 `setback = Time.days + 1`；失败不发钱
5. 日程页只写「这个时段他在哪、在做什么」，不给任务链接。

### B（P1）四地点班次化

对象：码头 / 高街 / 森林 / 神殿。

1. **地点页 ≤6 个动作**：场景 + 移动 + 班次 + 条件动作。删「表层/中层/深层」按钮和「四季活动/季节钩子/更多日常」索引（子页可保留，入口收进场景或班次）。
2. **一个班次页**（`MP Loc <Loc> Work / Patrol / Shift`）：
   - 进入即 `<<pass 60>>`
   - `<<cleareventpool>>` + 至少 3 条常态事件 + 1 条条件事件 + `<<runeventpool>>`
   - 每条事件的选项是动作，结果内嵌
   - 班次结束回地点页
3. 失败：普通失败扣资源/钱/声望 + `$daily.failKey`，当天同动作不可重试；严重失败 `setback +1`。
4. 结局：保留 `$mp<Loc>Ended` 与世界标志，但触发改为「完成 N 次班次 + 一个不可逆动作」。

### C（P2）三长线阶段事件化

雾潮 / 行会 / 神殿裂缝：每阶段一个场景（进入 → 2–3 个动作 → 结果内嵌），`nextStageDay` 隔 3–7 天；失败扣资源并抬风险；结局一次性但触发要「资源 + 立场 + 不可逆动作」。

### D（P3）旧港潮下暗渠（12 页）

入口滩涂 → 潮下暗渠 → 旧闸门室；资源：鲸油灯/绳索/潮位；失败：涨潮困住、丢灯；一个一次性结局 + 世界标志，被码头与高街各读一次。

## 铁律

1. 旧页零改写；只改点名的地点页/NPC Hub/Deep Hub，以及删除 V50 的 Deep Quest 链。
2. 不改 `boot.json` 的 version。
3. 新页：正文 60–200 汉字、渲染 2–5 选项、标签 4–8 字同屏互异、图标 ≤4 不同、`getouticon` 置顶。
4. 工作/巡林/守夜 = `<<pass 60>>` 或 `<<pass 1 hour>>`；短动作 0:05–0:20。
5. 普通失败只锁当天；失败不发钱、不发线索。
6. 不新增只写不读变量；旧档一律 `or` 兜底。
7. 每完成一块跑检查，0 违规再继续。

## 验收命令

```bash
python -I tools/check_render.py source/mod-src
python -I tools/verify_pilots.py source/mod-src
python -I tools/audit_standalone.py source/mod-src
python -I tools/check_render_style.py source/mod-src
python -I tools/skeleton_check.py source/mod-src
```

口径：

- 前四个：0 违规（`check_render_style` 无参数时只查学园/孤儿院/节日；改五人 NPC 时点名传文件）。
- `skeleton_check.py`（dev46 基线：Deep Quest 36、Result 命名页 165、事件池 0、班次页 15/15 无 pass 60）：
  - `Deep Quest` 页 = 0
  - 新增的 `* Result` 命名页 = 0
  - `pages using event pool` ≥ 12
  - 你新写的班次页必须含 `<<pass 60>>` 或 `<<pass 1 hour>>`
  - `MP Loc * Hub` 渲染选项 ≤6
- 12 字重合：新页与旧页 0。

## 不要做的事

- 不要继续加任务链、结果页、功能索引 Hub。
- 不要为了过检查把选项藏进分支或删正文。
- 不要一次性重写大文件；按文件组小步改。
- 不要动 `$mpNpcs.<id>` 现有字段名。
- 不要在正文里写变量名或系统面板词（探索进度/已完成事件/任务失败）。

## 交付

每轮改动给出：

1. 改了哪些文件、新增哪些页
2. 每个 NPC/地点/长线的门槛表（条件 → 动作 → 结果 → 失败）
3. 新变量表（写/读次数）
4. 五个脚本的输出摘要
5. 未完成项与原因
