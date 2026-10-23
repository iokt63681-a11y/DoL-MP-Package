# Argon 工作包 v6 · 从这里开始

## 包内是什么

- `mod-src/`：DoL-MP 1.2.0-dev7 完整源码（50 个 twee，1618 个 passage）
  - 城镇/荒野暗线、城镇小事、荒野小事
  - 12 条长期零工 + 零工伙伴 + 随机/季节/失败/三级惩罚 + 12 段熟客后续
  - 12 条零工的季节/失败/随机插入段 + 50 段春夏/随机补充
  - NPC 日常 + 6 位常驻 NPC 的 10 阶段任务（第 3/6/9 阶段双动作检定）+ 18 段熟稔日常 + 24 段关系日
  - 12 个主节日 + 3 个小节令 + 8 个半日节令
  - 8 个新区域（入口 / Scout / Ask / 32 子区域 / Rest）+ 6 条深层事件链 + 40 段区域瞬间
  - 10 处软坏结局（原 8 + 区域暗线 2 条）
  - 12 段瞬时事件、24 段城乡瞬间、12 段区域瞬时事件
  - 6 段信物鉴看、2 条区域暗线
- `docs/vanilla-ui-style.md`：**原作风格与 UI 规范，写之前先读**
- `ARGON_PROMPT_V5.md`：主写作规则
- `ARGON_HANDOFF_V4.md`：架构与硬规则
- `ARGON_NEXT_TASK.md`：**这一批要做的返修 + 新内容**
- `docs/`：审核、原版对照、节日日历、自检
- `docs/argon-dev7-audit.md`：上一批的接入记录和遗留问题
- `docs/argon-dev6-audit.md` / `docs/argon-dev5-audit.md`：更早的接入记录
- `sample_briar_split.twee`：7 段样张
- `reference/`：本体检查、地点、发现、打工收入、模板句
- `quota.md` / `used_scenes.md` / `used_openings.md`

## 阅读顺序

1. `ARGON_PROMPT_V6.md`（本批主提示）
2. `docs/vanilla-ui-style.md`（原作怎么排版、怎么写选项、怎么用图标）
3. `ARGON_NEXT_TASK.md`（先看你这一批要做什么）
4. `docs/argon-dev7-audit.md`（上一批哪里被改了、为什么）
5. `docs/argon-dev6-audit.md` / `docs/argon-dev5-audit.md`（更早一批的遗留）
6. `docs/vanilla-job-punishment-comparison.md`
7. `sample_briar_split.twee`
8. 需要时查 `reference/`

## 本批最重要的四条

1. **像原作，不像模组菜单**：正文 60–200 字，一段 2–4 个选项，图标最多 3–4 个，选项写动作不写结果。
2. **先返修再扩写**：NPC 任务阶段要加检定，区域瞬时事件不要传送，Search 低分支不要无限刷钱。
3. **不显示 Lv/等级/经验**；进度用叙事、钥匙、铜牌、熟客行为表达。
4. 每个 passage 开头 `$outside` / `$location`，加 `[nobr]`，检查失败有代价但不扣钱。

## 验收

- passage 名唯一、断链 0、宏闭合 0 错误
- 每段 `$outside` / `$location` / `[nobr]`
- 未注册图标 0
- 失败不扣存款
- 没有 Lv/等级/经验数字
- 新内容可从入口 BFS 到达
- 抽查 10 段：正文 ≤250 字、选项 ≤5 个、图标 ≤4 个、标签是动作、失败有具体代价
- 不修改 `boot.json` / `mp.js`；Hub 留好，由集成方接线
