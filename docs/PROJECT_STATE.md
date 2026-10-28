# PROJECT STATE — 2026-10-29

> **续写请先读** [`docs/HANDOFF_V51_CONTINUE.md`](HANDOFF_V51_CONTINUE.md)（V51：**A/B/C/D 已收束**；余下可选收尾）。

## 1. 当前版本

- mod：`DoL-MP` **1.2.0-dev46**（勿改 version）
- 基线游戏：Degrees of Lewdity 0.5.12.13
- 源码：`mod-src/`
- 最新源码包：`releases/DoL-MP-v1.2.0-dev46-full-mod-src.zip`

## 2. V51 进度（骨架对齐）

| 任务 | 状态 |
| --- | --- |
| A 五人去任务化 + Intimate R18 | 完成（Deep Quest = 0） |
| B 四地点班次 + 事件池 | 完成（池 = 12；Forest Hub ≤6） |
| C 三长线阶段事件化 | 完成（长线 Result→After；**全库 Result 命名页 = 0**） |
| D 潮下暗渠 | **完成**（12 页；码头/高街双读 `$mpWorldUndertideOutcome`） |
| 收尾 | 四地结局 shifts≥5；Hub≤6；删 `_v51_*`；行会/神殿裂缝终局硬门槛 |

对照：`docs/SKELETON_ALIGNMENT.md`、`docs/SKELETON_TEMPLATE.md`、`docs/VANILLA_SKELETON_SAMPLES.md`。  
任务书：`prompts/CURSOR_PROMPT.md`、`docs/ARGON_TASK_V51.md`。

## 3. 下一刀

**V51 主线 + 收尾已齐；班次 pass 60 已清零。** 若继续：把 `* After` 真正内嵌去中转，或升 version 发版。见交接 §4。

## 4. 验收口径（脚本）

```bash
python -I tools/skeleton_check.py mod-src
python -I tools/check_render.py mod-src
python -I tools/verify_pilots.py mod-src
python -I tools/audit_standalone.py mod-src
```

## 5. 不要做的事

- 不要继续加「任务页/结果页/功能索引 Hub」。
- 不要为了通过检查把链接藏进分支或删正文。
- 不要改 `boot.json` 的 version，除非明确要发新版。
- 不要动 `$mpNpcs.<id>` 现有字段名；旧存档要兼容。
- 不要一次性重写大文件；按文件组小步改，每步跑检查。

## 6. 已知的假阳性

- `audit_v48.py` 的 style 报错（如果用到）：`MP Temple Post Hub`、`MP Guild Bloc Overview`、`MP NPC * Deep Hub` 等的 links/icons 超限，是**静态把互斥分支相加**；用 `check_render_style.py` 按渲染路径复核。
- `audit_standalone.py` 的 `zero-inbound` 会列出所有 widget 页，属正常。
- `write-only vars` 是粗统计，动态访问会误报；只关注你新加的变量。
