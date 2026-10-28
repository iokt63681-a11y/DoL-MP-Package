# ARGON TASK V51 — 骨架对齐（不是加页）

> 基线：`mod-src/boot.json` = `1.2.0-dev46`，164 个 twee，3,426 个 passage，502 个可玩页。
> 交付：成对两个包。**不要**改 `boot.json` 的 version。

---

## 0. 这轮要解决什么

V50 把门槛、失败、结局补上了，但页面形状还是「Hub 菜单 + 线性任务 + 独立 Result」。原版 DoL 不是这样：

- **地点页**是场景，不是功能索引（原版 `Ocean Breeze`：1 段场景 + `Work (1:00)` / `Eat` / `Leave`）。
- **事件**是班次里抽出来的内容，不是 Hub 上的按钮（原版 `Ocean Breeze Work` → `cleareventpool` → `addinlineevent` → `runeventpool`）。
- **结果**写在选项里或同页，没有 `Event N Result` 这种中转页（原版 `Ocean Breeze Plates`）。
- **NPC** 是日程 + 遭遇 + 关系门槛场景，不是 `Quest 1..5`（原版 Robin / Sydney / Avery 的作息）。

本轮把这四件事改过来。**不许再加任务页、结果页、功能 Hub。**

必读：`docs/SKELETON_TEMPLATE.md`（照着写）、`docs/VANILLA_SKELETON_SAMPLES.md`（原版原文）、`docs/SKELETON_ALIGNMENT.md`（差异与规则）。

---

## 1. 铁律

1. 旧页零改写；只许改点名的地点页/NPC Hub/Deep Hub，以及删除 V50 的 Deep Quest 链。
2. 不改 `boot.json`。
3. 新页：正文 60–200 汉字、渲染 2–5 选项、标签 4–8 字同屏互异、图标 ≤4 不同、`getouticon` 置顶。
4. 工作/巡林/守夜 = 一个班次 `<<pass 60>>` 或 `<<pass 1 hour>>`；短动作 0:05–0:20。
5. 普通失败只锁当天（`$daily.failKey`），严重失败才 `setback = Time.days + 1`；失败不发钱。
6. 不新增只写不读变量；旧档一律 `or` 兜底。
7. 交付前跑 `tools/` 四个脚本 + `skeleton_check.py`，按任务书第 6 节口径。

---

## 2. Task A（P0）— 五人去任务化

对象：阿什 / 林恩 / 莫奈 / 诺艾尔 / 维斯。

**要删的**：`MP NPC <Name> Deep Quest 1/2/2B/3/3B/4/4B/4C` 的线性链、每个 Quest 页的「继续追查…」按钮、Deep Hub 里按 `deepStage` 指向下一步的 if 链。

**要留的变量**（存档兼容，不删）：
- `_npc.deepStage`（0–5）改为「已完成的场景数」。
- `_npc.emberPages` / `witnessPages` / `sketchPages` / `sporePages` / `clausePages`（6 页收集物）。
- `_npc.nextStepDay` / `setback` / `rep`。
- `$mp<Name>Ended` / `$mpWorld<Name>Ending`。

**要新写的**：每人 12–18 页**门槛场景**，按下面结构：

| 场景 | 触发条件 | 页数 |
| --- | --- | --- |
| 日常场景 ×4 | 无门槛，日程时段 | 4 |
| 关系场景 ×3 | love/trust 分档（≥10 / ≥25 / ≥40） | 3 |
| 收集物场景 ×3 | 对应页数 ≥2 / ≥4 / =6 | 3 |
| 冲突场景 ×2 | `$mpNpcs.<id>.rep` 低 / 高 | 2 |
| 终局场景 ×2 | `deepStage >= 5` 且对应收集物 =6；二选一不可逆 | 2 |

规则：
- 场景通过**地点/日程**出现（`Schedule` 页或对应地点页），不是通过 Hub 的任务按钮。
- 场景内的动作直接结算，结果内嵌；完成后写 `deepStage +1` 与 `nextStepDay`。
- 同一场景当天只出现一次（`$daily.<sceneKey>`）。
- 终局场景：两个不可逆动作，结果写在动作里，然后回地点；不跳 Result。

验收：
- 全库 `Deep Quest` 页 = 0（`skeleton_check.py` 会数）。
- 每人 12–18 个新场景页，全部有静态入链。
- 日程页列出每个时段 NPC 在哪，不再给任务链接。

---

## 3. Task B（P1）— 四地点班次化

对象：码头 / 高街 / 森林 / 神殿。

每个地点：

1. **地点页 ≤6 个动作**：场景描述 + 移动 + 班次 + 条件动作。删「表层/中层/深层」按钮和「四季活动/季节钩子/更多日常」索引（子页可以保留，但入口收进场景或班次）。
2. **一个班次页**（`MP Loc <Loc> Work / Patrol / Shift`）：
   - 进入即 `<<pass 60>>`；
   - `<<cleareventpool>>` + 至少 3 条常态事件 + 1 条条件事件 + `<<runeventpool>>`；
   - 每条事件的选项是动作，结果内嵌；
   - 班次结束回地点页。
3. **失败**：普通失败扣资源/钱/声望 + `$daily.failKey`，当天同动作不可重试；严重失败 `setback +1`。
4. **结局**：保留现有 `$mp<Loc>Ended` 与世界标志，但触发改为「完成 N 次班次 + 一个不可逆动作」，不要两个选项二选一。

---

## 4. Task C（P2）— 三条长线阶段事件化

对象：雾潮 / 十二行会 / 神殿裂缝。

- 每个阶段改成**一次事件**（进入 → 1 个场景 → 2–3 个动作 → 结果内嵌），不是「推进阶数」按钮。
- 阶段之间用 `nextStageDay` 隔 3–7 天。
- 失败扣资源并抬风险值；不能当场重试。
- 结局保留一次性锁，但触发要「资源 + 立场 + 不可逆动作」。

---

## 5. Task D（P3）— 旧港潮下暗渠（新深区，12 页）

- 三层：入口滩涂 → 潮下暗渠 → 旧闸门室。
- 每层一个班次或场景，不是菜单。
- 资源：鲸油灯、绳索、潮位；失败：涨潮困住（损失时间/体力）、丢灯。
- 一个一次性结局 + 世界标志，被码头与高街各读一次。

---

## 6. 验收

```bash
python -I tools/check_render.py .
python -I tools/verify_pilots.py .
python -I tools/audit_standalone.py .
python -I tools/check_render_style.py .
python -I tools/skeleton_check.py .
```

- 前四个：0 违规（`audit_standalone.py` 的 write-only / zero-inbound 里不许出现你新加的页）。
- `skeleton_check.py`（dev46 基线：Deep Quest 36、Result 命名页 165、事件池 0、班次页 15/15 无 pass 60）：
  - `Deep Quest` 页 = 0
  - 新增的 `* Result` 命名页 = 0（旧页不算）
  - `pages using event pool` ≥ 12（五人或四地点至少各有一处 `cleareventpool` + `runeventpool`）
  - 你新写的班次页必须含 `<<pass 60>>` 或 `<<pass 1 hour>>`
  - `MP Loc * Hub` 渲染选项 ≤6（基线里 Forest Hub 8、HighStreet Hub 7、各 More Hub 9–10 要一并收）
- 12 字重合：新页与旧页 0。

---

## 7. 优先级

A → B → C → D。A 做完先自检，再开 B。做不完可以只交 A+B，但每块必须完整。

**不要再加**：任务链、结果页、功能索引 Hub、一次性点击拿奖励的按钮。
