# 给 Argon 的下一批任务（可直接粘贴）

你是 DoL-MP 的内容作者。请只输出 Twee 文件和 manifest，不要改 `mod-src/scripts/mp.js` / `boot.json` / 现有已通过文件。当前源码在 `mod-src/`，主规则看 `ARGON_PROMPT_V5.md`，交接说明看 `ARGON_HANDOFF_V4.md`。

## 本批目标

一次性完成约 100 个场景，按下面四组拆分。每组单独文件，全部加 `[nobr]`，每个 passage 开头写 `$outside` / `$location`。

### A. 6 条新长期零工（24 段）

文件：`mp-job-extra-routes.twee`

每条 4 段：入口、班次、进度页、结算页：

1. 面包房早班（High Street / Cafe）
2. 裁缝铺改衣（High Street）
3. 邮差/跑腿（High Street / 住宅区）
4. 酒馆后厨（Harvest Street）
5. 马厩/驮运（Farmland）
6. 旧港渔船（Docks / Sea Rocks）

要求：
- 不显示 Lv/等级/经验；用叙事提示进度（“能独立看炉”“开始接改衣委托”“能跑远线”）。
- 每班成功后 3~4 个随机小事件；失败走三级惩罚（警告 → 停优待 → 短暂停班）。
- 失败不扣现有钱；只当班没有工钱 + stress/tiredness。
- 奖励 £3~£15/班，按进度和技能分档；一次性里程碑用 `claimUniqueReward`。
- 入口 hub：`MP Extra Jobs Hub`，6 条链接。

### B. 再补 6 个城镇节日 × 5 段（30 段）

文件：`mp-town-festivals-2.twee`

现有 6 个节日（丰收、雾月、冬幕、春汛、海灯、钟塔纪念日）已经写好；请补另外半年：

1. 初春开犁节（Farmland / High Street）
2. 夏季长日节（Park / Beach）
3. 旧港潮汐节（Docks / Mer Street）
4. 学园开学祭（School / High Street）
5. 秋末点灯节（Temple / Orphanage）
6. 年末钟声夜（High Street / Temple）

每个节日 5 段：准备、冲突、选择、结算、余波。节日要跨零工/NPC/地点；不要只写庆典描写。日志已有节日倒计时系统，日期由集成方配置。

### C. 6 位 NPC 日常线（18 段）

文件：`mp-npc-daily-extra.twee`

Robin、Eden、Wren、Briar、Avery、Black Wolf，每人 3 段。日常、关系、小礼物/跑腿；不写大主线。入口按地点/时间/NPC 关系解锁。

### D. 40 段区域/荒野事件 + 4 类软坏结局（44 段）

文件：`mp-region-extra-events.twee`

- 40 段区域/荒野小事件：1 段 1 个瞬间，至少 1 个检查，失败有代价；不要模板句。
- 4 类软坏结局：每类至少 4 种脱身路线（说服、付钱/交易、撬锁/攀爬、等巡逻/同伴）。
- 奖励 £2~£12；一次性奖励用 `claimUniqueReward`。

## 硬规则

1. 一个 passage 只写一个瞬间；多步骤拆 passage。
2. 选项写动作，不写结果/奖励/整条流程；链接标签不超过 12 个汉字。
3. 每个 passage 开头 `<<set $outside to 0或1>><<set $location to "...">>`；室内 0，室外 1。
4. `[nobr]` 必须加。
5. 返回目标必须存在；用 python 对照本体 HTML + 所有 mod twee。
6. 有检查就有成功/失败和后果；失败不扣现有钱。
7. `<<money 1200>>` = £12；奖励分档；一次性奖励用 `claimUniqueReward`。
8. 禁止复制正文、模板句、物件名填空、批量脚本改写。
9. 图标只用已注册：investigateicon, sneakicon, socialiseicon, runicon, walkicon, getouticon, templeicon, shopicon, brothelicon, swimicon, beachicon, parkicon, caveicon, tendingicon。
10. 不显示 Lv/等级/经验数字。
11. 不写打工失败扣存款。
12. 不写 explicit sexual content；可以写暧昧、紧张、疲惫、温柔。

## 输出

1. 4 个 twee 文件。
2. `manifest.md`：每个文件的 passage 数、检查数、奖励范围、入口 passage。
3. `selfcheck.md`：passage 名唯一、断链、outside/location、宏闭合、未注册图标、重复句、扣钱检查。
4. 如果接近输出上限，停在完整 passage，写 `STOPPED AT <ID> NEXT <ID>`，不要截断正文。

## 验收

- 总场景 100±10。
- 断链 0、宏闭合 0 错误、未注册图标 0。
- 每段 `$outside` / `$location` / `[nobr]`。
- 没有失败扣存款、没有 Lv/等级/经验。
- 新内容可从入口 BFS 到达。
- `boot.json` 不在本批修改范围内；入口 hub 留好，由集成方接线。
