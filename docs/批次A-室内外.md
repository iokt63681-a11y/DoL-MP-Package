# 批次 A：室内外补全报告

> 对象：新包 3 修复版（688 个 passage）
> 结果：660 / 688 已设置 `$outside` / `$location`；剩余 28 个是刻意跳过的交互/战斗/romance 页。

## 一、做了什么

- 新增 **432 处** `<<set $outside to X>><<set $location to "Y">>`，覆盖 17 个文件：
  - region bank（regions-events-1/2/3/4）
  - world-events-2/3/4
  - grand / town / wilds
  - main / bailey / companion / new-npcs / bad-ends
  - mansion 其余 12 段
  - locations 的日期/事件/恋人/活动页
- 新增 **13 个** `mpAmbient` case：
  `bedroom`、`orphanage`、`cafe`、`arcade`、`park`、`farm`、`pirate_ship`、`lake_ruin`、`industrial`、`garden`、`barb`、`cliff`、`home`。
- `searocks` 并入 sea case；`avery_mansion`/`pool`/`hospital`/`brothel`/`cabin` 已在上一轮补过。

## 二、地点映射

| 区域 / 前缀 | outside | location |
| --- | ---: | --- |
| Foghorn | 1 | sea |
| Clockwork | 0 | underground |
| Abbey | 0 | temple |
| Glasshouse | 0 | avery_mansion |
| Blackiron | 1 | docks |
| Druid | 1 | forest |
| Velvet | 0 | brothel |
| Observatory | 0 | school |
| 街道（Domus/Barb/Danube/High/Wolf/Elk/Mer/Oxford/Starfish/Nightingale/Connudatus） | 1 | 对应街区 |
| 图书馆/食堂 | 0 | school |
| 神殿花园 | 1 | temple |
| 宅邸 | 0 | avery_mansion |
| 孤儿院/卧室/咖啡馆/街机厅/农场/船底/湖底遗迹/厂房/花园/警局/崖边 | 0/1 | 对应 |
| 坏结局 | 0 | 对应地点 |

## 三、刻意跳过的 28 个

| 类型 | 数量 | 为什么跳过 |
| --- | ---: | --- |
| `Widgets MP Ambient` | 1 | 是 widget，不是场景 |
| `MP Native Combat` / `Finish` | 2 | 战斗页继承当前地点，不能写死 |
| `MP Player Interact*` | 22 | 互动页可以在任何地点发生，继承当前状态 |
| `MP Romance Confess*` / `Vow` | 3 | 关系页可以在任何地点发生，继承当前状态 |

这些页不设置 `$outside`/`$location` 是**正确的**；它们应该沿用玩家当前所在地点。

## 四、验证

| 检查 | 结果 |
| --- | --- |
| `$outside`/`$location` 覆盖 | 660 / 688（96%） |
| 顶部重复 set | 0 |
| 室内-only 地点 `$outside=1` | 0 |
| 宏配对 | 0 错 |
| 完全相同正文 | 0 |
| 开头句唯一率 | 100% |
| 最大相似度 | 0.5948（旧 world-events-2/3/4） |
| 7 句模板 | 仍在 region bank（下一批处理） |

## 五、下一批

- **长任务 2：`mp-storylines-grand.twee`，100～112 个场景。**
- 之后：town/wilds → main 线索门控 → region bank 模板/奖励 → 软坏结局。
