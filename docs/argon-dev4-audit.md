# Argon dev4 输入审核

日期：2026-10-23

## 范围

Argon 提交的 `DoL-MP-v1.2.0-dev4-完整整合包.zip`（mod-only 包，49 个文件）：

- `mp-job-extra-routes.twee`：25 段（6 条新零工 × 4 + hub）
- `mp-npc-daily-extra.twee`：19 段（6 位 NPC × 3 + hub）
- `mp-region-extra-events.twee`：45 段（40 段区域事件 + 4 类软坏结局 + hub）
- `mp-town-festivals-2.twee`：31 段（6 个节日 × 5 + hub）

合计新增 120 段。

## 已发现并修好的集成问题

1. **4 个文件没有进 `boot.json`**：原包 `boot.json` 只有 32 个 twee，4 个新文件不会加载。已加入，当前 36 个。
2. **hub 没有接线**：
   - `MP Extra Jobs Hub` 已从 `MP Livelihood Hub` 接入。
   - `MP Daily Extra Hub` 已从 `MP Daily Life Hub` 接入。
   - `MP Town Festivals 2 Hub` 已从 `MP Town Festivals Hub` 接入。
   - `MP Region Extra Events Hub` 已从 `MP Wild Extra Events Hub` 接入。
3. **日志没有新零工/新节日**：
   - `MOD_JOB_JOURNAL` 加入面包房、裁缝、跑腿、酒馆后厨、马厩、渔船 6 条叙事进度。
   - `MOD_FESTIVALS` 加入开犁、长日、潮汐、开学、点灯、钟声 6 个日期。
4. **hub 图标太密**：4 个新 hub 的动作链接去掉了图标前缀，保留自然文字。

## 静态检查

- 36 个 twee，1224 个 passage，名称唯一。
- 断链 0；`if/link/replace/div` 闭合错误 0。
- 64 个区域 hub/Search 已重写；剩余 57 个入口/Scout/Ask/Rest 待清理。
- 新 4 个文件：`$outside`/`$location` 100%，无 Lv/等级/经验，无失败扣存款，图标全部已注册。
- `node --check mod-src/scripts/mp.js` 通过。
- `boot.json` 36 个 twee，文件全部存在。

## 下一批

见 `ARGON_NEXT_TASK.md`：

- A：6 条新零工补齐季节/失败/随机事件（约 54 段）
- B：旧内容清理（new-regions 剩余 57 节点、mansion、soft bad ends、NPC 任务段落）
- C：可选 3 个小节日或 6 段区域事件

## 注意

- 不要改 `boot.json` / `mp.js` 的集成部分；只交 twee + manifest + selfcheck。
- 新 hub 已接好；新文件里的 hub 名称不要改。
- 失败不扣存款；不显示 Lv；地点选项放动作上面。
