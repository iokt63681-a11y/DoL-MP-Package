# mp-storylines-wilds.twee V2 自检报告

- 日期：2026-10-23
- 修改文件：`mod-src/twees/mp-storylines-wilds.twee`
- 对照底本：`game/Degrees of Lewdity.html`（解析到 16,087 个本体 passage 名）
- 结论：结构、断链、地点、图标、宏闭合与文本重复检查均通过。

## 1. 结构与阶段

| 项目 | 结果 |
| --- | --- |
| passage 总数 | 42 |
| 短线数 | 6 |
| 每线段数 | 7（入口 + Step2–Step6 + Resolve） |
| passage 重名 | 0 |
| 入口名保留 | 6/6 |
| Resolve 名保留 | 6/6 |
| 非 Resolve 段使用 `Math.max` | 36/36 |
| Resolve 设为 7 | 6/6 |
| Resolve 写入 `$daily.<quest>` | 6/6 |

六条线：

1. `MP Quest Beach Shipwreck`
2. `MP Quest Forest Ruins`
3. `MP Quest Park Greenhouse`
4. `MP Quest Connudatus Velvet`
5. `MP Quest Farmland Mill`
6. `MP Quest Sewers Market`

## 2. 断链与返回目标

- 静态 `[[标签|目标]]` 链接：163 条
- 目标不存在：0 条
- 所有链接均使用字面目标，没有用 `_exitPas` 之类的动态目标绕过检查
- 外部返回目标均在本体 passage 表中存在：`Sea Rocks`、`Forest`、`Park`、`Connudatus Street`、`Farmland`、`Sewers Algae`

旧版的 `Sewers` 并非本体 passage 名；这次改为实际存在的 `Sewers Algae`。

## 3. 室内外与地点

- 每个 passage 都在正文第一行设置 `$outside` 与 `$location`：42/42
- 非法地点：0
- 实际使用地点：
  `beach`、`searocks`、`cabin`、`forest`、`underground`、`park`、`connudatus`、`brothel`、`bedroom`、`farm`、`industrial`、`sewers`
- 室内 passage 均为 `$outside to 0`；室外 passage 均为 `$outside to 1`
- 没有新造 `$location`。

## 4. 图标与宏

使用图标：

`investigateicon`、`sneakicon`、`socialiseicon`、`runicon`、`walkicon`、`getouticon`、`shopicon`、`brothelicon`、`swimicon`、`parkicon`

- `athleticicon`：0
- `workicon`：0
- 未注册图标：0
- `<<if>>` / `<</if>>` 与 `<<link>>` / `<</link>>` 闭合检查：0 处不平衡
- 畸形三连尖括号（`>>>` / `<<<`）：0

## 5. 检定与失败代价

- 有效技能/属性检定 passage：24/42
- 覆盖率：57.1%，落在 40%–70% 内
- 每条线 4 个检定 passage：Step2、Step4、Step5、Resolve
- 检定方式：`skulduggerycheck`、`$skulduggery gte`、`$physique gte`、`$history gte`、`$english gte`、`$science gte`、`$maths gte`、`$willpower gte`
- 失败均有代价：疼痛、压力、创伤、被扣、丢失线索、损失时间或最低档酬金
- `$money gte` 的付款/贿赂条件不计入技能检定覆盖率

失败分支示例：

- 沉船船长舱失败 → 被按进积水、日志落水、进入打捞棚软坏结局
- 庄园地窖失败 → 被收荒人抓住、账页烧毁、进入蓄水池软坏结局
- 花房蒸馏室失败 → 吸入白烟、被架进花盆棚
- 天鹅绒更衣室失败 → 被关进隔间
- 磨坊底层失败 → 被反手按在传动轴旁、拖进谷仓
- 下水道石室失败 → 被灰斗篷捆住、押进蓄水暗间

## 6. 软坏结局分支

6 条线各有 1 个被扣/被困分支，均给出 4 种脱身方式：

1. 说服（社交/意志/相关 NPC 名号）
2. 付钱（固定金额，钱不够时选项显示为不可用）
3. 撬锁/破坏（`$skulduggery gte`，失败仍有疼痛与压力）
4. 等待巡逻、换班或同伴（消耗时间，部分直接退回 hub）

没有硬 game over。每次脱身都会清除对应的 `$mp*Caught` 标记。

## 7. 奖励

- 阶段小额奖励：£2.50–£4.00（仅 Step2 / Step4，且不是每段都有）
- 最终奖励：£8–£26
  - £8 / £13–£14 / £19–£20 / £24–£26
  - 分档依据：线索数（0–3）与技能值
- 一次性大奖励：6 个 `window.dolmp.claimUniqueReward` ID
  - `mpQuestShipwreck_v2_badge`
  - `mpQuestManorRuins_v2_deed`
  - `mpQuestGreenhouse_v2_recipe`
  - `mpQuestVelvet_v2_mask`
  - `mpQuestMill_v2_seal`
  - `mpQuestUnderground_v2_token`
- 没有每段固定送钱、固定送古董的写法。

## 8. 文本重复与相似度

- 抽取正文、去掉宏和链接后，对 42 段做两两 `SequenceMatcher`：
  - 最高相似度：**0.2553**
  - 最高相似对：`MP Quest Forest Ruins Step3` ↔ `MP Quest Farmland Mill Step3`
  - 低于 V5 要求的 0.5
- 长度 ≥10 个汉字的重复完整句：0
- 正文没有出现“继续探索”“继续深入查探”等模板句
- 每段开头句不同；选择标签以动作为主，没有把结果写进标签

## 9. 备注

- `Step4` 与 `Step5` 因成功/失败、被抓/未抓两种互斥状态，静态源码里会同时出现两套链接；实际渲染时每个状态为 3–4 个选择，且至少 1 条退路。
- 本报告只检查结构、链接、地点、图标、宏闭合、检定覆盖与文本相似度，不替代游戏内实际点击测试。
