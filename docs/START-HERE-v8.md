# Argon 工作包 v8 · 从这里开始

## 包内是什么

- `mod-src/`：DoL-MP 1.2.0-dev10 完整源码（**64 个 twee，1903 个 passage**）
  - 4 个 dev10 新文件：区域瞬间 11–13、关系日 9–10、信物使用 4、区域深层后续
  - 城镇/荒野暗线、城镇小事、荒野小事
  - 12 条长期零工 + 季节/失败/随机插入段 + 50 段春夏补充 + 20 段当班突发/搭档
  - NPC 日常 + 6 位常驻 NPC 的 10 阶段任务 + 36 段关系日
  - 12 个主节日 + 3 个小节令 + 8 个半日节令
  - 8 个新区域 + 6 条深层事件链 + 132 段区域瞬间/深层交互
  - 10 处软坏结局
- `docs/vanilla-ui-style.md`：**原作风格与 UI 规范，写之前先读**
- `ARGON_PROMPT_V7.md`：**本批主提示**
- `docs/ARGON_HANDOFF_V4.md`：架构与硬规则
- `docs/ARGON_NEXT_TASK.md`：**这一批要做的文字返修 + 内容补齐**
- `docs/argon-dev10-audit.md`：上一批的接入记录、已修项与遗留问题
- `docs/argon-dev9-audit.md` / `dev8` / `dev7`：更早的接入记录
- `docs/批次A-室内外.md`：`$location` 映射表
- `reference/`：本体检查、地点、发现、打工收入、模板句
- `quota.md` / `used_scenes.md` / `used_openings.md`

## 阅读顺序

1. `ARGON_PROMPT_V7.md`（本批主提示）
2. `docs/vanilla-ui-style.md`（原作怎么排版、怎么写选项、怎么用图标）
3. `docs/ARGON_NEXT_TASK.md`（先看你这一批要做什么）
4. `docs/argon-dev10-audit.md`（上一批哪里被改了、为什么）
5. `docs/ARGON_HANDOFF_V4.md`（架构与硬规则）
6. `docs/批次A-室内外.md`（区域/地点映射）
7. 需要时查 `reference/` 与更早的 audit

## 本批最重要的四条

1. **先修文字规则**：318 条选项标签 >12 字、199 段整段 >250 字、457 个死线索键，是本批最高优先级。
2. **失败不是发奖段**：失败只给重试/退出与具体代价，不推进、不发钱、不写成功文案。
3. **两个动作要真的不同**：不同技能、不同成功文本、不同失败代价、不同去向。
4. **文案从场景长出来**：选项点名的物件必须在正文出现；时间/季节词必须有 `Time.*` / `Weather.*` 门控或中性化。

## 验收

- passage 名唯一、断链 0、宏闭合 0 错误、**if/else 栈式错误 0**
- 每段 `$outside` / `$location` / `[nobr]`
- 未注册图标 0
- 选项 >12 汉字 0、整段 >250 汉字 0
- 失败不扣存款、不推进发奖
- 没有 Lv/等级/经验/阶段
- 新内容可从入口 BFS 到达
- 不修改 `boot.json` / `mp.js`；Hub 留好，由集成方接线
