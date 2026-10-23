# 新包 4 审核：grand 长任务完成，已合并进批次 A 底包

> 对象：`DoL-MP-v1.0.0-终极完整整合包 (4).zip`
> 合并结果：`newpkg4_merged`（768 个 passage）

## 一、结论

- **grand 长任务跑成了**：32 → 112 段，16 条长线 × 7 阶段，阶段已经拆成一阶段一 passage。
- **47 个检查**、**32 个 `$mpClues`**、0 个"把握时机推进调查"、0 个死链、0 个截断。
- 已经合并进我们最新的底包（含 4 个 P0 修复 + 批次 A 室内外），总 **768 段**。

## 二、数据

| 指标 | 合并后 |
| --- | ---: |
| passage | **768** |
| grand | **112** |
| grand 检查 | **47 / 112（42%）** |
| grand 链接 | 566 |
| grand 技能检查链接 | 204 |
| grand `$mpClues` key | 32 |
| grand 死链 / 截断 | 0 / 0 |
| 完全相同正文 | 0 |
| 开头句唯一率 | 100% |
| 重复 ≥12 汉字句子 | 10 组（region bank 7 句模板） |
| 最大相似度 | 0.5948（旧 world-events-2/3/4） |
| 正文中位 | 132 汉字 |
| >300 汉字 | 40 |
| >8 句 | 33 |
| `$outside`/`$location` | **740 / 768（96%）** |
| 宏配对 | 0 错 |

## 三、grand 做得好的

- 每条长线 7 个 passage：入口 → Step2～Step6 → Resolve，阶段拆开，不再一个 passage 塞 7 段。
- 每个 passage 开头有 `$outside` / `$location`；室内外分布合理。
- 47 个检查，覆盖 42%，在 V5 的 40～70% 区间。
- 奖励按技能分档（£6～£15），失败只给压力/疼痛，不给奖励。
- 32 个 `$mpClues`，和 world-events 的线索体系接上了。
- 选项最长 11 字，动作明确。
- 0 个"把握时机推进调查"套话。
- 没有 STOPPED，112 段完整输出。

## 四、合并时补的

- grand 用到的 `elk`、`harvest`、`mer` 三个 `$location`，在 `mpAmbient` 里补了 case。
- 其余文件保留我们的批次 A 结果（660 + grand 80 = 740/768）。
- 28 个交互/战斗/romance 页仍继承当前位置，不写死。

## 五、剩余问题

1. **main 还没接 `$mpClues`**：grand/world 已经写了 32+ 个线索 key，但 `mp-main-and-collection-quests.twee` 里 `$mpClues` 出现 0 次。主线 hub 仍然会直接显示线索。
2. **region bank 7 句模板**仍在，10 组重复句、最大相似度 0.5948 都是它/旧 world-events-2/3/4。
3. **town / wilds / region bank** 仍是旧结构：0 技能检查 + 免费奖励。
4. **40 段 >300 字、33 段 >8 句**：主要是 hub/多阶段容器；grand 已拆，剩下的集中在 main/region bank。
5. **122 段 <2 链接**：部分是 hub/描述，可以接受，但要逐个数。

## 六、下一批建议

- **长任务 3**：`mp-storylines-town.twee` + `mp-storylines-wilds.twee`，合计 80～100 个场景。
- 或先做 **main 线索门控**（小任务）：把 `$mpClues` 接进主线 hub，改动不大。
- 然后 **region bank**：删 7 句模板、主奖励过检查、失败不给钱。

## 七、判定

**grand 内容层通过；合并层通过。** 下一步做 town/wilds 或 main 线索门控，region bank 放最后。
