# Argon 工作包 v9 · 从这里开始

## 包内是什么

- `mod-src/`：DoL-MP 1.2.0-dev11 完整源码（**68 个 twee，1991 个 passage**）
  - 4 个 dev11 新文件：区域瞬间 14–16、关系日 11–12、信物使用 5、区域深层后续
  - 城镇/荒野暗线、城镇小事、荒野小事
  - 12 条长期零工 + 季节/失败/随机插入段 + 50 段春夏补充 + 20 段当班突发/搭档
  - NPC 日常 + 6 位常驻 NPC 的 10 阶段任务 + 36 段关系日
  - 12 个主节日 + 3 个小节令 + 8 个半日节令
  - 8 个新区域 + 6 条深层事件链 + 172 段区域瞬间/深层交互
  - 10 处软坏结局
- `docs/vanilla-ui-style.md`：**原作风格与 UI 规范，写之前先读**
- `ARGON_PROMPT_V7.md`：**本批主提示**
- `docs/ARGON_HANDOFF_V4.md`：架构与硬规则
- `docs/ARGON_NEXT_TASK.md`：**这一批要做的质量返修 + 内容补齐**
- `docs/argon-dev11-audit.md`：上一批的接入记录、已修项与遗留问题
- `docs/argon-dev10-audit.md` / `dev9` / `dev8`：更早的接入记录
- `docs/批次A-室内外.md`：`$location` 映射表
- `reference/`：本体检查、地点、发现、打工收入、模板句

## 阅读顺序

1. `ARGON_PROMPT_V7.md`（本批主提示）
2. `docs/vanilla-ui-style.md`（原作怎么排版、怎么写选项、怎么用图标）
3. `docs/ARGON_NEXT_TASK.md`（先看你这一批要做什么）
4. `docs/argon-dev11-audit.md`（上一批哪里被改了、为什么）
5. `docs/ARGON_HANDOFF_V4.md`（架构与硬规则）
6. `docs/批次A-室内外.md`（区域/地点映射）

## 本批最重要的四条

1. **让选择真的改变结果**：双动作不要只差金额/`control`/线索，至少让一条路去不同节点或给不同收益。
2. **`control 1` 要有叙事动机**：如果保留，正文写出对应的关系/支配动作；否则删掉或换成匹配的属性。
3. **菜单页瘦身**：`MP Job Followup *`(8)、`MP Job * Progress`(10–11) 等按“2–5 个选项”拆成二级页。
4. **Hub 图标收敛**：目录页只保留 1 个返回图标 + 最多 3 个主分类图标。

## 验收

- passage 名唯一、断链 0、宏闭合 0 错误、**if/else 栈式错误 0**
- 每段 `$outside` / `$location` / `[nobr]`
- 未注册图标 0
- 选项 >12 汉字 0；单屏 >250 汉字 0；同文件重复句 0
- 失败不扣存款、不推进发奖
- 没有 Lv/等级/经验/阶段
- 新内容可从入口 BFS 到达
- 不修改 `boot.json` / `mp.js`；Hub 留好，由集成方接线
