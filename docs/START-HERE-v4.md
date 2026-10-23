# Argon 工作包 v4 · 从这里开始

## 包内是什么

- `mod-src/`：DoL-MP 1.2.0-dev4 完整源码（32 个 twee，1104 个 passage）
  - 城镇/荒野 12 条暗线
  - 城镇小事 12 + 额外 8
  - 荒野小事 10 + 额外 8
  - 6 条长期零工 + 零工伙伴 5 条
  - 零工随机 6 + 季节 18 + 失败过渡 18 + 三级惩罚 18
  - NPC 日常 6 条（18 段）
  - 城镇节日 6 个（30 段）
  - 6 条新零工（面包房/裁缝/跑腿/后厨/马厩/渔船）
- 6 位 NPC 额外日常（Robin/Eden/Wren/Briar/Avery/Black Wolf）
- 40 段区域事件 + 4 类软坏结局
- 后半年 6 个节日
- 信物收集 6 条
  - 区域事件 165 段（153 段已去模板化）
  - 主线/grand/world-events/new-regions/软坏结局/精英遭遇
- `ARGON_PROMPT_V5.md`：主写作规则
- `ARGON_HANDOFF_V4.md`：这一轮做了什么、当前架构、硬规则
- `ARGON_NEXT_TASK.md`：下一批 100±10 场景的任务说明
- `docs/`：审核、修复、原版对照、节日日历、自检
- `sample_briar_split.twee`：7 段样张
- `reference/`：本体检查、地点、发现、打工收入、模板句
- `quota.md` / `used_scenes.md` / `used_openings.md`

## 阅读顺序

1. `ARGON_HANDOFF_V4.md`
2. `ARGON_NEXT_TASK.md`
3. `ARGON_PROMPT_V5.md`
4. `docs/vanilla-job-punishment-comparison.md`
5. `docs/节日日历.md`
6. `sample_briar_split.twee`
7. 需要时查 `reference/`

## 本批最重要的三条

1. **不显示 Lv/等级/经验**；进度用叙事、钥匙、铜牌、熟客行为表达。
2. **打工失败不扣存款**；失败 = 白干 + 压力/疲劳 + 三级惩罚（警告 → 停优待 → 短暂停班）。
3. 每个 passage 开头 `$outside` / `$location`，加 `[nobr]`，检查失败有代价但不扣钱。

## 下一批

按 `ARGON_NEXT_TASK.md` 做：

- 6 条新长期零工（24 段）
- 6 个新节日（30 段）
- 6 位 NPC 日常（18 段）
- 40 段区域/荒野事件 + 4 类软坏结局（44 段）
- 合计约 116 段

输出 4 个 twee + `manifest.md` + `selfcheck.md`。不要改 `mp.js` / `boot.json` / 已通过文件；hub 留好，由集成方接线。

## 验收

- passage 名唯一、断链 0、宏闭合 0 错误
- 每段 `$outside` / `$location` / `[nobr]`
- 未注册图标 0
- 失败不扣存款
- 没有 Lv/等级/经验数字
- 新内容可从入口 BFS 到达
