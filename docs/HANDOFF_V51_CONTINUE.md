# DoL-MP V51 交接（2026-10-29 D 收束）

> **给新对话用。** 版本锁定 **`1.2.0-dev46`**，不要改 `boot.json` 的 `version`。  
> 工作目录：`DoL-MP-Package-GitHub`。代码只动 `mod-src/`。验收脚本在 `tools/`，路径参数用 `mod-src`。

---

## 0. 新对话开场（整段复制）

把下面整段贴进新 Cursor 对话框；并把本文件拖进输入框（`@docs/HANDOFF_V51_CONTINUE.md`）：

```text
继续 DoL-MP V51。工作区是 DoL-MP-Package-GitHub（已 git，路径用 mod-src）。
先读：
1. docs/CONTINUE_PROMPT.md
2. docs/HANDOFF_V51_CONTINUE.md
3. docs/PROJECT_STATE.md
4. docs/WORKLOG.md（上一轮：已同步进本仓库并 push）
5. docs/SKELETON_ALIGNMENT.md / docs/SKELETON_TEMPLATE.md

口径：A→B→C→D + Result=0 + Hub≤6 + 四地 shifts + 班次 pass60 已齐。
改代码只动 mod-src/。不改 boot.json 的 version。
检查脚本务必：python -I tools/xxx.py mod-src
这一轮只做：森林节日 After 内嵌去中转（先 Spring 一季，做完写 WORKLOG 再停）。
做完小步就 git commit（我要求时再 push）。
```

---

## 1. 总目标（V51 在干什么）

把 mod 页形从「Hub 菜单 + Quest 链 + Result 中转」改成原版 DoL 形：

| 维度 | 目标 |
| --- | --- |
| NPC | 日程 + 门槛场景（已去 Deep Quest） |
| 地点 | ≤6 动作；班次 1:00 + 事件池 |
| 长线 | 每阶段一场景，不要「推进阶数」 |
| 新深区 D | 潮下暗渠约 12 页，码头/高街读世界标志 |

任务书：`docs/ARGON_TASK_V51.md` / `prompts/CURSOR_PROMPT.md`。

---

## 2. 已完成（按刀）

### A — 五人去任务化（完成）

阿什 / 林恩 / 莫奈 / 诺艾尔 / 维斯：Deep Quest 链已删；每人约 13 门槛场景；Hub 指 Schedule。  
变量保留：`deepStage`、收集页、`nextStepDay`、`setback`、`rep`、`$mp<Name>Ended`。  
**Intimate R18**：五人已按阿什示范补直白选项（在 `mp-new-npcs.twee`）。  
Schedule：短标签已拉长；深链图标与日常时段错开。

### B — 四地点班次化（骨架完成）

| 项 | 状态 |
| --- | --- |
| 四班次页 | `mp-loc-shifts-v51.twee`（含 `pass 60` + 事件池）已进 `boot.json` |
| 事件池 | **12** 页（4 班次 + 8 短巡） |
| Forest Hub | **≤6**；定局改 Deep，门槛 `$mpForestShifts gte 5` |
| More/Festival Hub | 仍 >6（可暂不理） |
| 旧 Job Shift 15 | 仍无 pass 60（可暂不理） |

### C — 三长线阶段事件化（本轮收束完成）

| 线 | 文件 | 要点 |
| --- | --- | --- |
| 雾潮 | `mp-fog-tide.twee` | 去掉「推进 X 阶」；按 `$mpFogStage` 开场景；1–3 回分枢；冷却 3–5 日；`$daily.mpFogSc*Fail`；4–7 Result→**After** |
| 行会 | `mp-guild-assembly.twee` | Wage/Curfew/Toll Result→**After**；冷却 3–4 日；当天失败锁 |
| 神殿 | `mp-temple-schism.twee` | Rites 1 Result→**After**；Hub 按仪轨进度；冷却 3–4 日 |

长线 Result 名已去干净。全库 Result 命名页 **165→157→0**（均改 After；6 个 NPC Festival Result→Resolve）。

### D — 潮下暗渠（完成）

文件：`mp-undertide-canal.twee`（已在 `boot.json`）。  
**12 页**：Hub / Flats / Flats Oil / Canal / Measure / Canal Rope / Gate / Tide Trap / Gate Lead / Ending / Echo Docks / Echo High。  
码头 Hub：未定局 → `下退潮滩涂`；定局后 → `MP Loc Undertide Echo Docks`（互斥）。  
高街 Hub：正文读标志；定局后 → `MP Loc Undertide Echo High`（与 Hub 定局互斥）。  
世界标志：`$mpWorldUndertideOutcome` = `sealed` | `open`。

---

## 3. 最新验收快照（D 收束）

```text
python -I tools/skeleton_check.py mod-src
  Deep Quest pages: 0
  Result-named pages: 157
  pages using event pool: 12
  HUB>6: Forest More 9；HighStreet Festival 10；HighStreet More 9
  （Forest / HighStreet Hub 均不在 HUB>6）

python -I tools/check_render.py mod-src
  OPTION / ICON / PROSE 违规 count: 0

python -I tools/verify_pilots.py mod-src
  pilot structural problems: 0

python -I tools/check_render_style.py mod-src
  render style problems: 0

python -I tools/audit_standalone.py mod-src
  Undertide 新变量无 write-only；Undertide 页无 zero-inbound
```

说明：`check_render_style` 里事件池页会把多条 `addinlineevent` 选项静态加总（假阳性）；`dup-label [n,n]` 比的是字数不是文案（假阳性）。

---

## 4. 未完成项（新对话按序）

1. **地点结局门槛** ✓ 森林 / 高街 / 神殿 / 码头（均 `$mp*Shifts gte 5`）
2. **More/Festival Hub ≤6** ✓
3. **Result 命名页** ✓ **0**（改 After；6 个 NPC Festival→Resolve）
4. **行会/神殿裂缝终局硬门槛** ✓（资源+立场）
5. **删 `tools/_v51_*.py`** ✓
6. **班次 pass 60** ✓（Job Shift 动作 1:00；短事件已改名避开误报）
7. **后续可选**
   - 把 `* After` 内嵌进选项彻底去中转；升 `boot.json` version 发版。

---

## 5. 铁律（别踩）

1. 旧页零大改写；不继续加 Quest / `* Result` / 功能索引 Hub。
2. **不改** `boot.json` 的 **version**；新 twee 必须进 `tweeFileList`。
3. 失败：普通只 `$daily.failKey`；严重才 `setback = Time.days + 1`；失败不发钱。
4. 正文禁系统词与裸变量名；旧档一律 `or` 兜底。
5. 验收务必：`python -I tools/xxx.py mod-src`（传错成仓库根会全 0）。

---

## 6. 关键文件总清单（两刀合计）

```
# 第一刀
mod-src/twees/mp-loc-forest.twee
mod-src/twees/mp-loc-highstreet.twee
mod-src/twees/mp-loc-temple.twee
mod-src/twees/mp-docks-depth.twee
mod-src/twees/mp-loc-shifts-v51.twee
mod-src/twees/mp-new-npcs.twee
mod-src/twees/mp-npc-ash.twee
mod-src/twees/mp-npc-lin.twee
mod-src/twees/mp-npc-monet.twee
mod-src/twees/mp-npc-noel.twee
mod-src/twees/mp-npc-vesper.twee

# 第二刀
mod-src/twees/mp-fog-tide.twee
mod-src/twees/mp-guild-assembly.twee
mod-src/twees/mp-temple-schism.twee

# 第三刀 D
mod-src/twees/mp-undertide-canal.twee
mod-src/twees/mp-docks-depth.twee
mod-src/twees/mp-loc-highstreet.twee

# 文档
docs/HANDOFF_V51_CONTINUE.md
docs/PROJECT_STATE.md
docs/WORKLOG.md
```

---

## 7. 下一对话唯一建议目标

**V51 + 班次 pass 60 已收束。** 后续若开刀：After 内嵌去中转，或发版。  
做完写 WORKLOG。
