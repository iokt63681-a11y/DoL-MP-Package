# 荒野/近郊小支线自检

- 文件：`mod-src/twees/mp-wilds-side-stories.twee`
- 日期：2026-10-23
- 范围：10 条小支线 × 3 段（Setup → Complication → Resolve），共 30 个 passage
- 脚本：Python 3（`-I` 隔离模式）解析 twee + 本体 `game/Degrees of Lewdity.html` 的 passage 名单

## 结论

结构自检通过：30 个 passage 名称唯一，60 条链接全部有目标，30/30 有 `$outside` 与合法 `$location`，30/30 至少 1 个检定，未使用未注册图标。正文汉字数均在 500～1000 区间内。

## 明细

| 项目 | 结果 |
| --- | --- |
| passage 数 | 30 |
| passage 名称唯一 | 30/30 |
| 链接总数 | 60（每段 2 个选择） |
| 断链 | 0 |
| 外部返回目标 | 7 个：`Beach`、`Sea Rocks`、`Forest`、`Farmland`、`Lake Ruin`、`Elk Street`、`Park`（均在本体 HTML 中存在） |
| `$outside` / `$location` 开关头 | 30/30，均在 passage 首个非空行 |
| 非法 `$location` | 0 |
| 检定入口 | 30/30（每段 1 个） |
| 检定类型分布 | 英语 8、诡术 7、意志 6、体能 5、游泳 4 |
| 未注册图标 | 0 |
| 使用图标 | investigate、sneak、socialise、run、walk、getout、temple、beach、park、swim、cave（共 11 种，全部在允许清单内） |
| NPC 关系变化 | 3 处：Eden、Mason、Wren；均用 `NPCNameList.includes(...)` 保护 `npcincr` |
| 正文汉字数 | 合计 15,589；最短 500，最长 552，平均 519.6 |
| 单段汉字数越界 | 0 |
| 12 字以上重复句 | 0 |
| 奖励档位 | £2.60 / £2.80 / £3.20 / £3.40 / £3.60 / £4.00 / £4.20 / £4.50 / £5.20 / £5.60 / £5.80 / £6.00 / £6.50 / £7.00 / £7.50 / £8.00 / £9.00 |
| `_reward` 便士写法 | 全部通过 `<<money _reward>>`，无直接写死金额 |
| 非法变量 | 未发现 `$sk` 等拼写错误 |

## 地点分布

| `$location` | passage 数 |
| --- | ---: |
| forest | 6 |
| searocks | 3 |
| farm | 3 |
| lake_ruin | 3 |
| cliff | 3 |
| underground | 3 |
| pirate_ship | 3 |
| beach | 3 |
| elk | 3 |

`$outside`：室外 18 段，室内 12 段（海蚀洞内部、废屋内部、船舱、矿道、工坊）。

## 十个条目

1. `MP Wild Sea Cave` — 海蚀洞铁皮箱与灯塔值班表
2. `MP Wild Hunter Trail` — 无主掌印与被啃断的绳套
3. `MP Wild Windmill Flags` — 风车布条信号与西坡车辙
4. `MP Wild Lake House` — 七只水杯与朝湖心的窗
5. `MP Wild Cliff Boardwalk` — 新板旧钉的栈道
6. `MP Wild Mine Cart` — 带牙印的白石与七号盐仓
7. `MP Wild Chart Room` — 不指北的海图仪
8. `MP Wild Stone Ring` — 冬天不结霜的石环
9. `MP Wild Salt Letter` — 盐堆里的玻璃瓶与旧信
10. `MP Wild Loom Workshop` — 缠着外来丝线的梭子

## 潜在问题

1. **缺少 `[nobr]` passage 标签**：同目录 `mp-storylines-wilds.twee`、`mp-livelihoods.twee` 等都使用 `:: Name [nobr]`，本文件当前 30 个 passage 均无该标签。若打包器依赖 `[nobr]` 抑制源码换行，正文会多出自动 `<br>`，段落间距会变松。建议集成前统一补回或确认全局配置已关闭自动换行。
2. **Setup / Step2 的两个选项合流**：每条线的两个选择都会进入同一个后续 passage，差异主要是耗时（4～8 分钟）与图标。结构上满足“2 个选择”，但如果希望选择感更强，可以把其中一个分支拆成独立的中转段或额外线索。
3. **奖励未做每日/一次性限制**：本批按任务要求只写奖励档位，没有接 `$daily` 或 `claimUniqueReward`。重复进入同一 Resolve 会重复结算 £2.60～£9.00；若要接入经济系统，建议增加每日旗标或一次性奖励键。
4. **外部返回目标依赖本体 passage**：7 个返回点已在本体 HTML 中核实存在，但若打包时裁掉对应区域，需要替换为对应的 mod hub。
