# 零工季节性插入事件自检报告

- 检查日期：2026-10-23
- 目标文件：`mod-src/twees/mp-job-seasonal-events.twee`（新建）
- 检查方式：Python 3.9（`-I` 隔离模式）解析 passage 名、开头宏、`<<if>>` 嵌套、金钱宏、`claimUniqueReward` 键、图标白名单与 NPC 保护。
- 结论：**通过（0 errors / 0 warnings）**

## 1. passage 数量与唯一性

- 解析到 18 个 passage，唯一名称 18 个，符合 6 条路线 × 3 段。
- 与本目录其余 26 个 twee 文件重名：0 个。
- 与基础包 `game/Degrees of Lewdity.html` 重名：0 个（全文检索 `MP Job Seasonal` 命中 0 次）。

## 2. 逐段清单

CJK 字数为正文汉字数（不含宏），全部落在 200~400 区间；`<<if>>` 均为 2 个（1 个差分 + 1 个一次性小费保护）。

| # | passage | outside | location | 汉字 | if | 小费 |
|---:|---|---:|---|---:|---:|---:|
| 1 | `MP Job Seasonal Cafe Rain` | 0 | `cafe` | 310 | 2 | £1 |
| 2 | `MP Job Seasonal Cafe Winter` | 0 | `cafe` | 282 | 2 | £2 |
| 3 | `MP Job Seasonal Cafe Festival` | 0 | `cafe` | 272 | 2 | £2 |
| 4 | `MP Job Seasonal Fish Rain` | 1 | `docks` | 263 | 2 | £1 |
| 5 | `MP Job Seasonal Fish Winter` | 1 | `docks` | 264 | 2 | £1 |
| 6 | `MP Job Seasonal Fish Festival` | 1 | `docks` | 264 | 2 | £2 |
| 7 | `MP Job Seasonal Spa Rain` | 0 | `spa` | 262 | 2 | £1 |
| 8 | `MP Job Seasonal Spa Winter` | 0 | `spa` | 270 | 2 | £2 |
| 9 | `MP Job Seasonal Spa Festival` | 0 | `spa` | 260 | 2 | £2 |
| 10 | `MP Job Seasonal Farm Rain` | 1 | `farm` | 259 | 2 | £1 |
| 11 | `MP Job Seasonal Farm Winter` | 1 | `farm` | 264 | 2 | £2 |
| 12 | `MP Job Seasonal Farm Festival` | 1 | `farm` | 259 | 2 | £2 |
| 13 | `MP Job Seasonal Clock Rain` | 0 | `high` | 279 | 2 | £1 |
| 14 | `MP Job Seasonal Clock Winter` | 0 | `high` | 260 | 2 | £2 |
| 15 | `MP Job Seasonal Clock Festival` | 0 | `high` | 261 | 2 | £2 |
| 16 | `MP Job Seasonal Laundry Rain` | 0 | `orphanage` | 266 | 2 | £1 |
| 17 | `MP Job Seasonal Laundry Winter` | 0 | `orphanage` | 256 | 2 | £1 |
| 18 | `MP Job Seasonal Laundry Festival` | 0 | `orphanage` | 262 | 2 | £2 |

- 18/18 均在正文首行以 `<<set $outside to 0/1>><<set $location to "...">>` 开头。
- 地点与任务指定一致：`cafe` / `docks` / `spa` / `farm` / `high` / `orphanage` 各 3 段。

## 3. 宏与行内语法

- `<<if>>` / `<</if>>`：36 / 36；`<<else>>`：36；`<<elseif>>`：0。
- `<<` / `>>`：186 / 186。
- `<<set>>`：36（每段 2 个，均为 outside/location，无其他状态写入）。
- 每段宏嵌套检查：栈平衡，`<<else>>` 均位于 `<<if>>` 内。
- 链接（`[[ ]]`）：0；本文件为 `<<include>>` 插入段，不含跳转。

## 4. 金钱与防重复

- `<<money>>` 仅出现 18 次，取值只有 `100` 与 `200`（£1 / £2）。
- 无 `<<money -数字>>`、无 `$money -=`、无任何扣钱分支。
- 18 个小费块全部包在 `claimUniqueReward` 中，且键名唯一、与段落一一对应：

| 路线 | Rain | Winter | Festival |
|---|---|---|---|
| Cafe | `job_seasonal_cafe_rain` | `job_seasonal_cafe_winter` | `job_seasonal_cafe_festival` |
| Fish | `job_seasonal_fish_rain` | `job_seasonal_fish_winter` | `job_seasonal_fish_festival` |
| Spa | `job_seasonal_spa_rain` | `job_seasonal_spa_winter` | `job_seasonal_spa_festival` |
| Farm | `job_seasonal_farm_rain` | `job_seasonal_farm_winter` | `job_seasonal_farm_festival` |
| Clock | `job_seasonal_clock_rain` | `job_seasonal_clock_winter` | `job_seasonal_clock_festival` |
| Laundry | `job_seasonal_laundry_rain` | `job_seasonal_laundry_winter` | `job_seasonal_laundry_festival` |

- 每个键只触发一次；重复进入同一段时走 `<<else>>` 分支，不再给钱。

## 5. 差分与反馈

- 差分条件仅使用只读状态：`$upperwet`（2 段）、`Time.dayState`（8 段）、`($tiredness or 0) gte 800`（3 段）、`Weather.isSnow`（2 段）、`$NPCName and $NPCNameList.includes(...)`（2 段）。
- 全部为天气 / 时间 / 疲劳 / 关系差分，不改变任务进度、不写入新的全局状态。
- 小反馈：`<<stress -1>>` 18 处；`<<tiredness 1>>` 3 处；无 `<<stress 正数>>`，无 `<<pain>>`，不惩罚玩家。

## 6. 图标与 NPC

- 图标：0 个（插入段不需要链接与图标）；因此不存在未注册图标。
- 使用的 NPC：Gwylan（咖啡馆、码头）、Jordan（温泉）、Alex（农场）、Sera（钟表铺）、Robin（浆洗房）；Mason / Wren 未使用。
- `npcincr` 仅 2 处：`Sera trust 1`、`Robin love 1`，均位于对应 `NPCNameList.includes("Sera"/"Robin")` 分支内，检查通过。

## 7. 内容覆盖

- Rain：湿衣服与室内客人（咖啡馆）、湿网与鱼箱（码头）、湿鞋与防滑垫（温泉）、积水与排水沟（农场）、潮气与生锈机芯（钟表铺）、晾不干的床单（浆洗房）。
- Winter：热苹果酒与冻黄油（咖啡馆）、霜绳与冻手（码头）、热毛巾与姜茶（温泉）、温室与炉子（农场）、稠表油与红茶（钟表铺）、冻硬床单与裂口（浆洗房）。
- Festival：丰收节（咖啡馆、农场）、雾月节（码头、钟表铺）、冬幕节（温泉、浆洗房）；均只写店内忙碌、装饰、客流与临时补贴，未扩写为大型剧情。

## 8. 边界与未改动项

- 本次只新建 `mod-src/twees/mp-job-seasonal-events.twee` 与本报告。
- 本次操作未修改 `boot.json`、`mod-src/scripts/mp.js`、`mod-src/twees/mp-livelihoods.twee`。
- 检查期间发现 `mp-livelihoods.twee` 被外部编辑（非本次操作）：其中新增 18 条 `<<include "MP Job Seasonal ...">>`，6 条路线各 3 段，名称与本文件逐一对应；`Time.season` 在基础包中存在（277 处引用）。该接线按“雨/雪优先，其次冬季，其次秋季节日”的顺序放置。
- 插入段带 `[nobr]`，与 `MP Job Random *` 系列一致；供既有 Shift passage 自行 `<<include>>`。

## 9. 可用 include 名称

```text
MP Job Seasonal Cafe Rain
MP Job Seasonal Cafe Winter
MP Job Seasonal Cafe Festival
MP Job Seasonal Fish Rain
MP Job Seasonal Fish Winter
MP Job Seasonal Fish Festival
MP Job Seasonal Spa Rain
MP Job Seasonal Spa Winter
MP Job Seasonal Spa Festival
MP Job Seasonal Farm Rain
MP Job Seasonal Farm Winter
MP Job Seasonal Farm Festival
MP Job Seasonal Clock Rain
MP Job Seasonal Clock Winter
MP Job Seasonal Clock Festival
MP Job Seasonal Laundry Rain
MP Job Seasonal Laundry Winter
MP Job Seasonal Laundry Festival
```

```text
errors: []
warnings: []
```
