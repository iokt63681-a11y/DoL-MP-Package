# 零工失败后小事件自检

- 文件：`mod-src/twees/mp-job-failure-events.twee`
- 范围：6 条零工路线 × 3 个失败阶段 = 18 个 `<<include>>` 插入段
- 方式：Python 读取 twee 源文件做静态检查（不启动游戏）
- 结论：**18/18 通过**，无阻塞问题

## 1. 检查项与结果

| 检查项 | 方法 | 结果 |
| --- | --- | --- |
| passage 名唯一 | 按 `^:: ` 切分后比对名称 | 18 个，全部唯一 |
| 每段 `$outside` | 正则检查 `<<set $outside to 0或1>>` | 18/18 存在 |
| 每段 `$location` | 正则检查 `<<set $location to "...">>` | 18/18 存在，取值均在允许集合内 |
| 宏闭合 | 统计 `<<if` 与 `<</if>>`；检查 switch/for/link 配对 | 18/18 平衡，无未闭合 |
| 不扣钱 | 搜索 `<<money`、`$money +=`、`$money -=`、`$money =` | 0 处 |
| 不给钱 | 同上（正向写入一并排除） | 0 处 |
| 字数 | 统计每段汉字数（U+4E00–U+9FFF） | 全部落在 200~400 |
| 无链接 | 搜索 `[[` | 0 处（符合 include 插入段定位） |
| 图标白名单 | 提取 `<<*icon>>` 并与已注册列表比对 | 仅使用已注册图标 |
| NPC 白名单 | 提取人名并与允许列表比对 | Gwylan / Sera / Alex / Jordan / Robin |

## 2. 地点与 outside 对照

| 路线 | passage 前缀 | `$outside` | `$location` |
| --- | --- | --- | --- |
| 咖啡馆 | `MP Job Failure Cafe 1/2/3` | 0 | `cafe` |
| 码头鱼档 | `MP Job Failure Fish 1/2/3` | 1 | `docks` |
| 温泉 | `MP Job Failure Spa 1/2/3` | 0 | `spa` |
| 河湾农场 | `MP Job Failure Farm 1/2/3` | 1 | `farm` |
| 钟表铺 | `MP Job Failure Clock 1/2/3` | 0 | `high` |
| 浆洗房 | `MP Job Failure Laundry 1/2/3` | 0 | `orphanage` |

## 3. 每段汉字数

| passage | 汉字数 | passage | 汉字数 |
| --- | ---: | --- | ---: |
| MP Job Failure Cafe 1 | 215 | MP Job Failure Farm 1 | 208 |
| MP Job Failure Cafe 2 | 232 | MP Job Failure Farm 2 | 212 |
| MP Job Failure Cafe 3 | 209 | MP Job Failure Farm 3 | 207 |
| MP Job Failure Fish 1 | 207 | MP Job Failure Clock 1 | 201 |
| MP Job Failure Fish 2 | 209 | MP Job Failure Clock 2 | 211 |
| MP Job Failure Fish 3 | 210 | MP Job Failure Clock 3 | 215 |
| MP Job Failure Spa 1 | 204 | MP Job Failure Laundry 1 | 205 |
| MP Job Failure Spa 2 | 212 | MP Job Failure Laundry 2 | 203 |
| MP Job Failure Spa 3 | 206 | MP Job Failure Laundry 3 | 215 |

范围：201~232，均在 200~400 内。

## 4. 分级语气检查（人工核对）

| 阶段 | 写法 | 是否落实 |
| --- | --- | --- |
| 1 | 东家/同事的第一反应；尴尬；一起收拾残局；不展开惩罚流程 | 6/6 路线均有 |
| 2 | 气氛变冷；优待被收回的瞬间；旁人看在眼里 | 6/6 路线均有（缺口杯、风口摊位、私汤木牌、温室钥匙、铜牌、内部价） |
| 3 | 停班前后的沉默；门口/更衣室/工作台的空位 | 6/6 路线均有 |

每条 passage 恰好 1 个 `<<if>>` 差分，条件分别取自等级、技能、疲劳、天气、昼夜，只影响叙述，不产生金钱或关系写入。

## 5. 未做的事（按任务边界）

- 未修改 `boot.json`、`mod-src/scripts/mp.js`、`mod-src/twees/mp-livelihoods.twee`。
- 说明：自检时 `mp-livelihoods.twee` 已有外部改动，新增 6 处 `<<include "MP Job Failure ...">>` 调用（文件 mtime 早于本 twee 创建时间），不是本次操作；其引用的 18 个名称与本文件完全一致。
- 未接入任何调用点；本文件只提供可被 `<<include>>` 的插入段。
- 未使用 `<<npcincr>>`（因此无需 `NPCNameList.includes` 保护）。
- 未写 explicit sexual content；只写压力、羞耻、失望与疲惫。

## 6. 可用 include 名称

```text
MP Job Failure Cafe 1
MP Job Failure Cafe 2
MP Job Failure Cafe 3
MP Job Failure Fish 1
MP Job Failure Fish 2
MP Job Failure Fish 3
MP Job Failure Spa 1
MP Job Failure Spa 2
MP Job Failure Spa 3
MP Job Failure Farm 1
MP Job Failure Farm 2
MP Job Failure Farm 3
MP Job Failure Clock 1
MP Job Failure Clock 2
MP Job Failure Clock 3
MP Job Failure Laundry 1
MP Job Failure Laundry 2
MP Job Failure Laundry 3
```

建议调用方式：在失败结算页、按 `$mpJobXStrike` 选择同名阶段后 `<<include "MP Job Failure X N">>`；本文件不自行推进 strike，也不读写 `Suspended`。
