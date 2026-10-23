# 打工路线自检报告

- 检查日期：2026-10-23
- 目标文件：`mod-src/twees/mp-livelihoods.twee`
- 检查方式：Python 解析 passage / 链接 / 宏 / 标签；链接目标同时对照 mod 内全部 twee 与基础包 16,087 个 passage。
- 结论：**通过（0 errors）**

## 1. passage 数量与唯一性

- 解析到 19 个 passage，唯一名称 19 个，符合 1 + 6×3 = 19。
- 与其他 mod twee 的重名：0 个。

| # | passage | outside | location | 链接数 |
|---:|---|---:|---|---:|
| 1 | `MP Livelihood Hub` | 1 | `town` | 7 |
| 2 | `MP Job Cafe` | 0 | `cafe` | 3 |
| 3 | `MP Job Cafe Shift` | 0 | `cafe` | 5 |
| 4 | `MP Job Cafe Upgrade` | 0 | `cafe` | 2 |
| 5 | `MP Job Fish` | 1 | `docks` | 3 |
| 6 | `MP Job Fish Shift` | 1 | `searocks` | 6 |
| 7 | `MP Job Fish Upgrade` | 1 | `docks` | 2 |
| 8 | `MP Job Spa` | 0 | `spa` | 3 |
| 9 | `MP Job Spa Shift` | 0 | `spa` | 5 |
| 10 | `MP Job Spa Upgrade` | 0 | `spa` | 2 |
| 11 | `MP Job Farm` | 1 | `farm` | 3 |
| 12 | `MP Job Farm Shift` | 1 | `farm` | 6 |
| 13 | `MP Job Farm Upgrade` | 1 | `farm` | 2 |
| 14 | `MP Job Clock` | 0 | `high` | 3 |
| 15 | `MP Job Clock Shift` | 0 | `high` | 5 |
| 16 | `MP Job Clock Upgrade` | 0 | `high` | 2 |
| 17 | `MP Job Laundry` | 0 | `orphanage` | 3 |
| 18 | `MP Job Laundry Shift` | 0 | `orphanage` | 5 |
| 19 | `MP Job Laundry Upgrade` | 0 | `orphanage` | 2 |

## 2. 链接目标

- 链接总数：69
- 未解析目标：0
- 可用目标集合：mod twee passage + 基础包 16,087 个 passage；`High Street` 等返回目标已在基础包中确认存在。

## 3. 室内外与地点

- 19/19 passage 均以 `<<set $outside to 0/1>><<set $location to "...">>` 开头。
- 使用地点：`cafe`×3、`docks`×2、`farm`×3、`high`×3、`orphanage`×3、`searocks`×1、`spa`×3、`town`×1
- 均在允许集合内（已有地点 + `spa`）。

## 4. 图标

- 使用：`beachicon`、`getouticon`、`investigateicon`、`parkicon`、`runicon`、`shopicon`、`sneakicon`、`socialiseicon`、`swimicon`、`templeicon`、`tendingicon`、`walkicon`
- 全部在白名单内；未出现 `workicon` / `athleticicon`。

## 5. 金钱与每日限制

- 代码中无硬编码 `<<money 数字>>`；工资通过 `_pay` 变量结算，公式已封顶 £15。
- 每条路线的成功班次 ≥ £2；失败均扣钱、损坏材料或损失作物，不存在白拿。

| 路线 | 每日键 | Shift 内选择链接（静态） |
|---|---|---:|
| Cafe | `$daily.mpJobCafe` | 3 |
| Fish | `$daily.mpJobFish` | 4 |
| Spa | `$daily.mpJobSpa` | 3 |
| Farm | `$daily.mpJobFarm` | 4 |
| Clock | `$daily.mpJobClock` | 3 |
| Laundry | `$daily.mpJobLaundry` | 3 |

## 6. 等级、经验与里程碑

- 等级变量 6 个、经验变量 6 个全部存在；阈值 3 / 6 / 10 / 15 / 21。
- 每次班次 +1 exp，成功额外 +1。
- 一次性里程碑：`job_cafe_lv3`、`job_clock_lv3`、`job_farm_lv3`、`job_fish_lv3`、`job_laundry_lv3`、`job_spa_lv3`。

## 7. 标签与行内语法

- `<<if>>` / `<</if>>`：114 / 114
- `<<link>>` / `<</link>>`：69 / 69
- 逐行检查 `<<`/`>>`、圆括号、英文引号：0 处不平衡。

## 8. 说明

- Fish / Farm 的 Shift 静态链接数为 4，是因为夜钓/分鱼、播种/浇水/收割处于互斥分支；运行时可见选择均为 2~3 个。
- location 使用 town / high；mpAmbient 有 default 兜底，spa case 由后续补入。
- 基础包游泳技能变量为 $swimmingskill；钓鱼外礁选项已按此校验。

```text
errors: []
unresolved: []
```
