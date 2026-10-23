# Argon dev5 输入审核与接入记录

日期：2026-10-23

## 交付范围

`DoL-MP-v1.2.0-dev5-Argon.zip`，`argon-dev5-deliverables/` 下 6 个 twee、283 段：

| 文件 | 段数 | 性质 |
| --- | ---: | --- |
| `mp-job-extra-parity.twee` | 54 | 新文件：6 条新零工的季节/失败/随机插入段 |
| `mp-new-regions.twee` | 121 | 重写：8 区域入口 + 8 Scout + 8 Ask + 32 Rest + 32 子区域 Rest 入口 |
| `mp-mansion-avery-1.twee` | 19 | 重写：宅邸旧标签与失败分支 |
| `mp-soft-bad-ends.twee` | 25 | 重写：5 处软坏结局 |
| `mp-new-npcs.twee` | 48 | 重写：6 位 NPC 的 Hub/日常/任务 |
| `mp-seasonal-micro-festivals.twee` | 16 | 新文件：春分/夏至后夜/初雪 + 6 段区域瞬时事件 |

接入后全模组：**38 个 twee，1294 个唯一 passage**。

## 静态检查结果

- passage 重名 0，断链 0，`if/link/replace/switch/div` 闭合错误 0。
- 6 个文件 `$outside` / `$location` / `[nobr]` 覆盖率 100%。
- 新内容没有 `Lv` / `等级` / `经验`。
- 失败分支没有扣存款；`mp-mansion-avery-1` 原有的 £4/£5 失败扣款已移除。
- 6 个文件内链接标签全部唯一，最长 11 个汉字。
- 同文件内 ≥12 汉字重复句 0。
- 32 个 `Rest`、8 个 `Scout`、8 个 `Ask` 全部从 8 个区域入口可达。
- 54 段零工插入段全部可从 `MP Extra Jobs Hub` 到达。
- 奖励 key 全局 775 个，跨文件重复 0。

## 接入时补做的修正

1. **两个新文件没有进 `boot.json`**：已加入，当前 38 个 twee。
2. **54 段零工插入段没有被调用**：在 `mp-job-extra-routes.twee` 的 6 条路线上接线
   - `Shift` 顶部按雪/雨/秋季插入季节事件；
   - `Settle` 成功分支用 `MP Job Random <Job> 1~3` 替换原有 4 选 1 小事件；
   - `Settle` 失败分支用 `MP Job Failure <Job> 1~3` 替换原来的三句概述。
3. **小节令 Hub 没有入口**：从 `MP Town Festivals Hub` 底部接入 `MP Micro Festivals Hub`。
4. **小节令没有日期门控**：春分只在 3/14–3/24、夏至后夜只在 6/20–6/30、初雪只在 12/1–2/10 出现；其余时间水牌显示“没有临近的小节令”。
5. **5 处软坏结局共用同一个 `$mpBadEndProgress`**：一处攒到 100 后，另一处会直接出现逃跑选项。已改为进入不同坏结局时按 `$mpBadEndId` 重置进度与天数。
6. **6 个 NPC `Help` 段重复进入仍显示发 £12**：改为 `_helpPaid` 为真时才写“取出 £12 / £8”，重复进入只写帮忙本身，不再显示发钱。
7. **NPC 任务阶段奖励偏高**：`£25 / £12` 调整为 `£15 / £8`，与 20 分钟任务阶段和零工收入对齐。

## 仍然存在的问题（下一批）

1. **NPC 任务阶段没有检定**：10 个阶段都是每天点一次自动推进，只有额外奖励分支有属性检定。与原版“任务关键节点要过判定”的标准相比偏松，建议至少第 3/6/9 阶段加检定与失败分支。
2. **6 段区域瞬时事件是“便条直接传送”**：在 High Street 点便条 4 分钟就站到雾角岛/修道院。建议改成便条只登记线索，玩家自己走到区域入口后再出现事件链接。
3. **`mp-new-regions` 的 9 个 Search 低技能分支每次都能拿 £2~£3**：高技能分支有一次性的 `claimUniqueReward`，低分支没有每日限制。目前按 8~10 分钟换 £2~£3 尚可接受，但仍是可重复刷的小额来源。
4. **`$location` 用了 `high` / `danube` / `domus` / `connudatus`**：`Widgets MP Ambient` 没有这些 case，会落到默认街景。属于历史约定，不影响运行，但室内场景（酒馆后厨等）仍会显示街景环境句。
5. **软坏结局逃跑奖励 £120~£180**：一次性且受 `claimUniqueReward` 保护，不再重复发放；数值偏高，是否下调看经济整体。
