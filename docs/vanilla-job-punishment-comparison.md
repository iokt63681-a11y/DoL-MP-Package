# 原版 DoL 0.5.12.13 打工、失败与贝利收债机制对照

- 原版：`C:\Users\24893\Downloads\DoL-0.5.12.13-chs\_extracted_game\Degrees of Lewdity.html`
- Mod：`mod-src/twees/mp-livelihoods.twee`、`mp-bailey-and-trials.twee`、`mp-job-random-events.twee`；惩罚线实际在 `mp-job-punishment.twee`
- 方法：用 Python 从 HTML 的 `<tw-passagedata>` 中提取 passage 正文，共 16088 个 passage；本文只做只读对照，未改任何 twee/js/boot。
- 名称澄清：原版没有名为 `Rent`、`Bailey Rent`、`Bailey Punish`、`Bailey Debt` 的 passage。租金逻辑集中在 `Widgets Rent`，入口与分支在 `Rent Intro`、`Rent Pay`、`Rent Refuse`、`Rent Fight`、`Rent First Robin Fight`、`Rent Hospital Fight` 等；`Bailey Beating` 是“反复骚扰贝利办公室”的惩罚，不是欠租惩罚；`Bailey Pound` 是磅房文件剧情，也不是债务。

## 0. 结论先行

1. 原版贝利收债不是“三振出局”，而是四条并行的梯子：租金档位（`$rentstage`）、转卖档位（`$rentsale`）、没收档位（`$renttime <= -21`）、反抗档位（`$baileydefeatedchain`）。
2. 原版还不上租金时，**不会从你已有的钱里再扣一笔罚款**。要么当场付清，要么拒绝后被打/被卖，要么打赢回避；真正扣钱的只有少数“合同违约/被敲诈”场景。
3. 原版打工失败的主流后果是“这一班白干/拿不到小费/材料或作物损失/未来工资被降”，而不是扣存款。码头是唯一把“未工作小时”直接算进工资的地方。
4. 原版没有打工等级或 `Lv` 显示。进度靠地点状态文本、进度条、日程/日志、钥匙/铜牌/专属杯等叙事道具，以及一次性里程碑场景提示。
5. 随机事件用加权 inline event pool（`<<addinlineevent>>` + `<<runeventpool>>`），并由 `dangerEvent()` 按吸引力决定是否进入危险/情色分支；不是简单的 `random(1,6)` 平铺。
6. 我们当前 mod 的三级惩罚方向是对的，但第二级目前基本没有机制效果：`$mpJobXPenalty` 没有任何读取点，部分“停优待”变量会在下一次班次开头被重新置 1，`$mpJobFishStall` 和 `$mpJobCafePerk` 也没有读取点；此外 strike 成功后不回落，三次失误会永久推进到停班。

---

## 1. 原版机制摘要

### 1.1 贝利租金与收债

核心 passage / widget：

| 名称 | 作用 |
| --- | --- |
| `Orphanage Intro` | 初始化 `$rentmoney = 10000`（£100）、`$rentstage = 1`、`$renttime = 7` |
| `Widgets Rent` | `rentdue`、`rentduerobin`、`rentnopay`、`rentpay`、`rentmod`、`babyRent`、`rentEdenTrade`、`rentGwylanTrade` |
| `Bedroom Bailey` / `Orphanage` / `Hospital Rent` | 租金到期时的入口；按 Robin 是否在场、是否在医院分流 |
| `Rent Pay` / `Rent Pay Robin` | `<<rentpay>>` 扣钱并推进档位 |
| `Rent Refuse` / `Rent Refuse Robin` | `<<rentnopay>>`，不扣钱，转入 `Rent Intro` 或被卖 |
| `Rent Seduce` | 情色交涉，但最终仍要 `Pay` 或 `Refuse`，不免租 |
| `Rent Fight` / `Rent Fight Finish` | 拒绝后战斗；赢则 `$baileydefeatedchain += 1`，输则进入 `Rent Intro` |
| `Rent First Robin Fight` | 替 Robin 背债、在家拒绝付款、首次 Robin 人质事件尚未发生，且 `$baileydefeatedchain >= 3` 或 `$renttime <= -14` 时触发 |
| `Rent Intro` | 转卖分支；按 `$rentsale` 决定卖去 Danube / Eden / 警察+地下农场 / 地下城 |
| `Bailey Rent Reclaim` | 用 `<<rentpay>>` 赎回被没收物品 |
| `Widgets Bailey Confiscation` | `baileyRentConfiscation`、`baileyRentReclaimOption`、`baileyConfiscationNotice` |
| `Bailey Confiscation Fight` | 用战斗抢回被没收物品 |

关键流程：

```text
每天 passRentTick(): $renttime--
$renttime <= 0 且玩家回到孤儿院/卧室/医院
  -> rentdue（或 Robin 在家的 rentduerobin）
     -> 钱够：Pay / Refuse / Seduce
     -> 钱不够：rentnopay -> Submit（Rent Intro）或 Fight
$renttime <= -21 且尚无 $bailey_confiscation
  -> baileyRentConfiscation：没收物品，给 7 天赎回期
```

补充点：

- `rentdue` 根据 `$baileydefeatedchain` 决定带几个打手：0 个 / 1 个 / 2 个；`rentduerobin` 在 3 级时是 3 个并直接控制 Robin。
- `<<rentpay>>` 的顺序是：先扣本周 `$rentmoney + $babyRent`，再设置下一周金额，最后 `$rentstage += 1`。所以实际支付序列是 £100 → £300 → £500 → £700 → £1000 → £1500 → £2000，之后封顶 £2000。
- `<<rentmod>>` 会乘 `$settings.rentCostModifier`；如果 `$robinpaid`（替 Robin 背债），整笔租金翻倍。
- `$babyRent` 是每个未被照顾的孩子每周 £100；不是罚款，是附加租金。
- `$baileyRefusedToPayTotal` / `$baileyRefusedToPayTotalStat` 只是统计“累计未付金额”，出现在 `Statistics` 页面；它不是需要偿还的债务余额，也没有追缴逻辑。
- `Bailey's Office Robin 2` 的“接管 Robin 的债务”会立即把当周 `$rentmoney` 翻倍（`$rentmoney *= 2`），并设置 `$robinpaid = 1`；此后每周的 `<<rentmod>>` 都会因为 `$robinpaid` 再翻倍。该决定不可逆。
- 医院场景由 `$bus is "hospital"` 分流到 `Hospital Rent` / `Rent Hospital Fight`；战斗失败同样进入 `Rent Intro`。

### 1.2 咖啡馆（Ocean Breeze）

核心 passage：`Ocean Breeze`、`Ocean Breeze Work`、`Ocean Breeze Plates`、`Ocean Breeze Register`、`Cafe *`、`Chef Work`、`Chef Work Regular`、`Widgets` 中的 `waiter_default` / `tipset` / `tipreceive`。

- 打工入口 `Ocean Breeze`：`$oceanbreezejob` 标记已受雇；有 `$chef_sus > 0` 时显示红色 suspicion 条。
- `Ocean Breeze Work` 每班构建一组带权重的 `<<addinlineevent>>`，最后 `<<runeventpool>>`；常见事件有 `cafe_plates`、`cafe_breeze`、`cafe_bun`、`cafe_oral`、`cafe_pair`、`cafe_tourists`、`cafe_freeloader`、`cafe_collision`、`cafe_crowd`、`cafe_dog`、`cafe_chef_start`。
- 侍者收入：`waiter_default` 有约 1/6（受 `$chef_state` 加成）概率给小费班，否则固定 £5；小费由 `tipset "serving"` 计算（基础 £10–£30，再乘 `$tipmod`、吸引力、数学 trait、serving 服装），`tipreceive` 在咖啡馆再补 £5 底薪。
- 失败：`Ocean Breeze Plates` 选“一次端完”会走 `dancetext`/平衡检定；失败只是打翻食物、Sam love -1、stress +6，然后仍然调用 `waiter_default`，**底薪 £5 照拿，只丢小费机会**。没有扣存款。
- Sam / Gwylan / Robin：`C.npc.Sam.love` 达到 10 才会触发 `cafe_chef_start`（厨子缺人）；Gwylan 在咖啡馆有独立排班、送果汁、给 Robin 小费、请客等事件；Robin 来店会按 trauma 分支并可能留小费。这些只影响关系、小费和剧情，不做金钱惩罚。
- 厨师线：`chef_state` 1–9；`bunstat` 在 50 / 200 / 400 等阈值解锁 Sam 的提价、拍照、扩店剧情；`chef_sus` 因在奶油里加入体液、撒谎、被发现等上升，Sam 的对话在 20 / 40 / 60 / 80 分档。`Chef Work Regular`（普通奶油）即使“今天不好卖”也照付 £10，不扣钱。
- 唯一会扣钱的咖啡馆相关场景是 `Chef Blackmail Ask`：在 `Cliff Street` 满足 `$chef_sus >= 10` 且 rng 命中时，勒索者可能索要 £500 或 £2000；这是“被敲诈”事件，不是班次失败罚款。

### 1.3 码头（Docks）

核心 passage：`Docks`、`Docks Start`、`Docks Options`、`Docks Work`、`Docks Leave`、`Docks Lunch`；核心 widget 在 `Widgets Docks`：`dockoptions`、`dockwork`、`dockleave`、`dockstatus`、`dockstatustext`、`dockworkevents`、`dockoverhear`。

- 雇佣状态：`$docks.askedForWork`、`$docks.hired`、`$docks.fakeID`、`$docks.wage`（便士/小时，起薪 1500 = £15/h，可涨到 2500 = £25/h）、`$docks.status`（0–100）、`$docks.suspicion`（0–4）。
- 班次开始 `Docks Start` 决定 `$docks.dayType`：
  - `busy`：约 15%，更累， overtime 倍率从 1.5 提到 2。
  - `slow`：约 15%，轻松，但没有 overtime。
  - `lewd`：按软世界腐化最多约 20%，更累、更撩拨，overtime 2 倍。
  - `normal`：其余。
- `dockoptions` 按小时给 `Work` / `Slack` / `Strip and work`；`dockwork` 处理结算和随机事件。`$docks.status` 用 `dockstatustext` 显示六档叙事：contempt → suspicion → tolerate → accept → respect → admire。`$docks.suspicion` 也用叙事提示（glances / keeps an eye / watches closely / follows you around）。
- 工资结算在 `dockleave`：`shift.total - shift.unpaid` 小时 × 时薪，加 overtime × 倍率，加圣诞奖金。**不会从已有钱里扣**，但会通过“少算小时”让你拿不到钱：
  - 迟到到 7:30 之后（仅 fake ID 可进）：第一小时不计薪（`shift.unpaid += 1`）。
  - 早退：明确“今天没有工资”。
  - 午休晚归超过 2 分钟（fake ID）：security 不再放行，当天没有工资。
  - 整班 slacking 且 suspicion 达到 4：主管不付这一小时；若整班/整个 overtime 都这样，最终可能只拿到 overtime 或完全没有信封。
  - `$docks.status <= 0` 且时薪 ≥ 1600：主管把时薪降 £1/h，从本次结算开始生效；这是未来工资，不是扣存款。
- 关系/进度：`$docks.status` 影响同事闲话、pub crawl 邀请、能否要到 raise；`dockoverhear` 提供大量叙事型午休/开工前闲聊。

### 1.4 农场、温泉、脱衣舞俱乐部、妓院、酒吧、办公室、洗衣

#### 农场（Alex）

- 核心：`Farm Work`、`Farm Tending`、`Farm Fields`、`Farm Clearing`、`Farm Widgets` 中的 `farm_work_update`、`farm_tending_events`、`farm_tending_alex_events`。
- `$farm_stage` 1–12；`$farm.clearing` 是 0–100 的开垦进度，`Farm Work` 用文本 + `.meter` 进度条显示（“jungle of weeds” → “ready for planting”）。
- 前 6 阶段按小时付钱：`$farm.wage` 依次 15 / 30 / 45 / 60（英镑/小时，`moneyGain` 内部 ×100）；`$farm_count` 累计分钟，每满 60 分钟结算一次。阶段 7 之后转向产出/分成，不再显示小时工资。
- `Farm Tending` 用 `tendingdifficulty`：成功时 `$farm_work.tending += 1`，失败只是“仍有些进展”，没有罚款；真正的损失是时间和体力。
- 随机事件：`Farm Tending` 在 `dangerEvent()` 命中后进入 `farm_tending_events`，用 `rng 3` 分 lurker / tentacle / 围栏入侵三类；与 Alex 一起干活时走 `farm_tending_alex_events`。
- 收割失败会清空 `$mpJobFarmPlantedDay` 之类的作物状态（原版是 `$farm_yield` / 田地状态），损失的是已经投入的时间，不扣现金。

#### 温泉（Spa）

- 核心：`Spa Work Ask`、`Spa Work`、`Spa Work Start`、`Spa Work Cute/Sophisticated/Alluring`、`Widgets Spa` 中的 `spa_work`、`spa_actions`、`spa_end`、`body_tip`。
- 入职有美貌门槛（`$beauty` 约 `beautymax/7*6`）；`spa_work` 用加权 pool 选客人性格：`spa_hesitant`、`spa_tired`、`spa_rude`、`spa_lewd`、`spa_polite`。
- 基础收入 £10/50 分钟，结算在 `spa_end` 的“Next customer”链接（`<<money 1000 "spa">>`），外加 `tipreceive` 小费；`body_tip` 按手技/美貌/行为放大 `$tipmod`。
- “失败”主要是客人不满意、丢小费、拒绝后被扯衣服/被投诉；`Spa Tired Steal` 偷首饰是玩家主动犯罪，不是失败罚款。没有从存款扣钱。

#### 脱衣舞俱乐部（Strip Club）

- 核心：`Strip Club`、`Strip Club Management`、`Strip Club Bartending`、`Strip Club Dancing`。
- 酒保 £5/h + 小费（`tipset "serving"`、`tipreceive`）；`drinksservedstat` 用叙事分档（新手 → 熟练 → 像大师）。
- 跳舞走 `dance` 系统：小费 + 私舞；私舞俱乐部抽 80%。暴露过度且 exhibitionism 不足会逃走，逃走就没有这一班收入；没有罚款。

#### 妓院（Brothel）

- 核心：`Brothel`、`Brothel Dance`、`Brothel Pay`、`Brothel Punishment`。
- 这是原版少数**明确从存款扣钱**的打工场景：
  - 错过已排定的表演（`$brothelshowdata.missed`）：Briar 当场索要 **£1000**，可付钱（`Brothel Pay`）或拒绝。
  - 错过 escort job（`$brothel_escortjob.missed` 或 `escape`）：索要 **£2000**。
  - 在酒吧街站街被抓（`$pubwhore >= 10`）：不是罚款，而是被带去 `Brothel Punishment`（强制 gloryhole），属于剧情惩罚。
- 正常跳舞/私舞按场结算；拒绝客人是丢收入/关系，不扣存款。

#### 酒吧（Pub）

- 原版的 `Pub` **不是固定时薪打工**。它是 Landry 的销赃/任务枢纽、pub fame 事件、音乐表演小费、Whitney/Gwylan 剧情入口。
- `Pub Music` 是“给街头艺人小费/一起唱/偷小费罐”的一次性社交场景；`Pub Sell` 是销赃；`Pub Task` 是 Landry 的跑腿链。
- 真正的“酒保打工”在脱衣舞俱乐部：`Strip Club Bartending`。

#### 办公室临时工（Office / Temp Agency）

- 核心：`Office Assignment Start`、`Widgets Office Assignment` 的 `acceptassignment` / `completeassignment`。
- 完成 assignment 按 £6.25/h 结算（`625 * 分钟 / 60`），manager love 高时还有奖金；没完成/中途失败就只是拿不到这份钱，不扣存款。
- `Chalets Work End` 明确写“清洁失败，所以不会付钱”，同样不是罚款。

#### 洗衣（Laundry）

- `Flats Laundry Ask` / `Flats Laundry` 是邻居家的一次性熨衣委托：£20，`housekeeping` 检定；没有“失败扣钱”的独立失败分支。
- `Prison Laundry Work` 是监狱劳役，不是工资工作。
- 因此原版没有“洗衣店长期打工”的失败模型可以对照；我们 mod 的浆洗房属于原创扩展。

### 1.5 原版有没有等级 / Lv 显示

没有。原版没有“打工 Lv 3”这类 UI，也没有把 `$docks.status`、`$farm_stage`、`$chef_state` 显示成数字等级。它用的是：

- **叙事状态文本**：`dockstatustext` 的六档；`$docks.suspicion` 的主管行为描述；Sam 对 `$chef_sus` 的 20/40/60/80 分档台词。
- **进度条**：`Farm Work` 的 `$farm.clearing` 百分比条；`Ocean Breeze` 的 `$chef_sus` 红色条。
- **日志 / Time-Sensitive**：`Widgets Journal` 显示租金到期日、被没收物品的赎回截止日、码头班次时间、妓院演出等；`Widgets Named Npcs` 对贝利显示 “is ready to collect”。
- **叙事道具**：码头的 raise、农场温室钥匙、钟表铺铜牌、咖啡馆缺口杯/后门钥匙、私汤木牌、浆洗房内部价。
- **一次性里程碑 / Feat**：`Farmhand`、`Farmer`、`Cultivator`、`Dawn to Dusk`（农场连续工作 660 分钟）、`Negotiator`（单笔小费 £500）。
- **统计页**：`Statistics` 会显示 “Buns sold at the cafe: $bunstat”“Total in missed payments to Bailey” 这类计数器，但那是统计，不是等级。

---

## 2. 贝利收债的 tier 结构

### 2.1 四条并行的梯子

| 梯子 | 变量 | 档位与效果 |
| --- | --- | --- |
| 租金金额 | `$rentstage` / `$rentmoney` | £100 → £300 → £500 → £700 → £1000 → £1500 → £2000 封顶；替 Robin 背债则整条翻倍 |
| 转卖去向 | `$rentsale` | 0→1 Danube 晚宴；1→2 Eden；2→3 警察/枷锁 + 地下农场；3→0 地下城 |
| 物品没收 | `$renttime` / `$bailey_confiscation` | `renttime <= -21` 且未没收过 → 没收物品；7 天内可赎回，否则被典当 |
| 反抗升级 | `$baileydefeatedchain` | 0 个打手；1–2 次击败 → 1 个；≥3 次 → 2 个（Robin 场景 3 个并押住 Robin）；付钱或战败清零 |

这些梯子彼此独立：付钱会推进租金金额、清空反抗链、恢复被没收物品；转卖梯子只在 `Rent Intro` 里推进；没收梯子只看你多久没回家面对贝利。

### 2.2 第一次 / 第二次 / 第三次还不上

先说明：原版还不上钱**不会自动被卖**。你仍然要在 `rentnopay` 里选 `Submit`（认命，进 `Rent Intro`）或 `Fight`（打架）。打赢就回避这次转卖，但 `$baileydefeatedchain` 上升；打输才进 `Rent Intro`。所以下面的“第几次”指你**选择 Submit 或战斗失败后进入 Rent Intro** 的次数。

| 次数 | 进入时的 `$rentsale` | 去向 | 关键 passage | 之后 |
| --- | --- | --- | --- | --- |
| 第 1 次 | 0 | Danube 街的晚宴，被当作“甜点”展示 | `Danube Meal` | `$rentsale = 1`；`$soldCount += 1` |
| 第 2 次 | 1 | Eden 把你带走（按 Eden 自由度高/低/被囚分不同分支） | `rentEdenTrade` → `Eden Recaptured` / `Eden Caged Intro` / `Eden Cabin` / `Forest Hunter Intro` | `$rentsale = 2` |
| 第 3 次 | 2 | 先交给警察/枷锁（Robin 会被 `robinPunishment "pillory"`），再被卖到地下农场 | `Rent Intro` 的 rentsale 2 分支 → `Street Van Bailey` / `Livestock Intro` | `$rentsale = 3` |
| 第 4 次 | 3 | 地下城 | `Underground Intro` | `$rentsale = 0`，循环重新开始 |

补充：

- `$rentsale` 是**累计被卖次数**，不会因为中间付过租金而清零；只有 rentsale 3 分支自己重置为 0，以及涉及 Robin 的 `robinRentUnsafeMessage` 会把它重置。因此“第 3 次”是存档内累计第 3 次被卖，不要求连续三次欠租。
- 如果戴着被诅咒的 `familiar collar`，Eden/农场分支会被 `rentGwylanTrade` 替换，Gwylan 会来把你领走。
- 第 3 次分支在 Robin 在场时会先触发 `rentRobinPunishment`，再继续被卖；`$robinPunishments` 记录 Robin 遭遇过哪种惩罚。
- `Rent First Robin Fight` 是另一条特殊线：如果你替 Robin 背债（`$robinpaid`）、在家拒绝付款、且此前没发生过首次 Robin 人质事件，同时贝利已被你击败至少 3 次（`$baileydefeatedchain >= 3`）或你已拖租两周（`$renttime <= -14`），贝利会抓 Robin 当人质，进入一套“说话—付钱/不动”的脚本战斗；在这里付钱可以救 Robin，选择不动/失败则会被带走并进入 `Rent Intro`。事件发生后，若 `$baileypaychain < 2` 或租期仍逾期（`$renttime <= -1`），后续收租会继续走 `rentduerobin`。
- `$soldCount` 是“被卖次数”，不是债务；它用于解锁站街选项（`V.soldCount >= 1`）和一些学校/宅邸事件。

### 2.3 时间线

```text
第 0 天：付租/拒绝/打架，renttime 重置为 7
第 7 天：renttime = 0，下次回家触发 rentdue
第 14 天：renttime = -7，仍可触发 rentdue；未付金额继续计入统计
第 21 天：renttime = -21，若从未被没收，进入 baileyRentConfiscation
         没收后 renttime 重置为 7；7 天内可在办公室赎回
```

所以“多久升级”在原版是**时间驱动 + 选择驱动**，不是“失败三次自动升级”。真正能称为“第三次”的，是 `$rentsale` 的第 3 次转卖（警察 + 地下农场），第 4 次进地下城。

### 2.4 没收机制

- `baileyRentConfiscation` 会按一周租金估算并拿走一批物品（`baileyConfiscationBundle`），不是扣现金。
- 赎回选项 `baileyRentReclaimOption` 要求 `$money >= $rentmoney + $babyRent`，点击 `Bailey Rent Reclaim` 会调用 `<<rentpay>>`：既付清本周租金，也推进 `$rentstage`，并恢复物品。
- 过期不赎：`$bailey_confiscation_lost = 1`，下次进入孤儿院时 `baileyConfiscationNotice` 提示物品已被典当。
- 也可以打 `Bailey Confiscation Fight`（3 个打手）直接抢回；赢了 `$baileydefeatedchain += 1`，输了进 `Rent Intro`。

---

## 3. 原版打工失败到底扣不扣钱

### 3.1 分工作对照

| 工作 | 失败判定 | 当班收入 | 是否从已有钱里扣 | 说明 |
| --- | --- | --- | --- | --- |
| 咖啡馆侍者 | 端盘平衡检定失败 / 得罪客人 / 拒绝喝酒 | 失败仍走 `waiter_default`，底薪 £5；丢小费 | 否 | 只扣 Sam love、加 stress |
| 咖啡馆厨师 | 普通奶油卖不动 / 被投诉 | `Chef Work Regular` 仍付 £10 | 否 | 高 `chef_sus` 会在 Cliff Street 触发敲诈，可能被要走 £500/£2000 |
| 码头 | 迟到、早退、午休晚归、slacking 到 suspicion 4 | 按“实际被认可的小时”结算；可能整班/整天没有信封 | 否 | 少算小时、降未来时薪；不会出现负余额 |
| 温泉 | 毛巾没拧干 / 引错路 / 拒绝客人 | 失败丢小费或投诉；`spa_end` 的基础 £10 仍按链接结算 | 否 | 可能被扯衣服、加 stress |
| 农场 | tending 检定失败 / 收割失败 | tending 失败只是进度慢；收割失败失去作物 | 否 | 损失时间与已投入的作物状态 |
| 脱衣舞俱乐部 | 暴露过度逃走 / 没 ID | 没有这一班收入 | 否 | 酒保 £5/h + 小费；舞者靠小费/私舞 |
| 妓院 | 错过已排定表演 / 错过 escort | 正常演出按场结算 | **是** | 表演 £1000；escort £2000；这是合同违约罚金 |
| 办公室临时工 | 没完成 assignment | 没有这份报酬 | 否 | `completeassignment` 才付 £6.25/h |
| 公寓熨衣 | 无独立失败分支 | £20 一次 | 否 | 不是长期打工 |
| 监狱洗衣 | 不是工资工作 | 无工资 | 否 | 劳役 |

### 3.2 会扣钱的少数情况

原版打工体系里，真正出现“从 `$money` 里减钱”的只有：

1. **妓院 no-show**：`$brothelshowdata.missed` → £1000；`$brothel_escortjob` 失败/逃跑 → £2000。金额明示，可选择付或不付；不付进入 `Brothel Pay Refuse` 的后续。
2. **厨师被敲诈**：`Cliff Street` 在 `$chef_sus >= 10` 且 rng 命中时进入 `Chef Blackmail Ask`，可能索要 £500 或 £2000；这是随机敲诈，不是每次失败都发生。
3. **租金/没收**：属于贝利系统，不是打工失败；而且没收的是物品，租金是“付了才保留/赎回”，不是自动扣款。

除此之外，打工失败基本遵循同一条原则：**你已经为失败付出了时间、体力、压力、关系和小费机会，不再额外扣存款。**

---

## 4. 原版随机事件的类型和触发方式

### 4.1 技术挂法

原版的标准写法不是 `random(1,6)`，而是加权事件池：

```text
<<cleareventpool>>
<<addinlineevent "cafe_plates" 1.2>> ... <</addinlineevent>>
<<addinlineevent "cafe_breeze" 1.2>> ... <</addinlineevent>>
<<addinlineevent "cafe_bun" 1>> ... <</addinlineevent>>
<<runeventpool>>
```

- `<<addinlineevent "id" 权重>>` 注册事件；权重可省略（默认 1）。
- `<<runeventpool>>` 按权重抽一个执行。
- `<<dangerEvent(mod, floor, allure)>>` 用吸引力决定是否进入危险/情色分支。咖啡馆常见 `dangerEvent(0.25,4000)`，码头/农场用无参 `dangerEvent()`；吸引力越高越容易触发。
- `<<rng>>` / `<<rng 3>>` 用于普通分支，不涉及吸引力。
- 事件通常在“一个工作动作”之后触发：咖啡馆每端一次盘/每调一杯；码头每小时 work/slack；农场每次 tending；温泉每个客人。

### 4.2 类型

| 类型 | 例子 | 作用 |
| --- | --- | --- |
| 纯氛围 | `cafe_breeze` 无裙版、`docks_overhear_*` 闲聊、`cafe_oral` 低 awareness 版 | 加/减 stress，塑造地点 |
| 小费 / 关系 | `waiter_default`、Gwylan 留小费、Robin 来店、Sam 好感 | 钱、love、trauma 小幅变化 |
| 危险 / 情色 | `cafe_oral` 高 awareness、`cafe_crowd` 跳舞、`cafe_dog`、`docks_work_vessel_guide` 海上袭击、`farm_tending_events` 的 lurker/tentacle | 进入战斗/骚扰/同意分支，失败有 stress/trauma |
| 迷你任务 / 检定 | `cafe_plates` 平衡、`docks_work_container_inspect` 开锁、`docks_work_data_inconsistency` 数学、`docks_work_lifting_crates` physique | 决定小费、额外收入或受伤 |
| 犯罪 / 偷窃 | `Ocean Breeze Register`、`Docks Steal`、`Spa Tired Steal`、`Pub Music Steal` | 玩家主动选择，给黑钱 + crime |
| 进度 / 升级 | `cafe_chef_start`（Sam love ≥10）、`Chef Work` 的 `bunstat` 阈值、`farmVisitor` / `farmStage4–12` | 推进职业线，不扣钱 |

### 4.3 频率与位置

- 咖啡馆：`addinlineevent` 权重 1–4；Robin/Gwylan 事件权重 2–4，普通事件 1–1.2。
- 码头：`dockworkevents` 用默认权重 1，事件数量多但一次只出一个；`dockoverhear` 在开工前/午休单独出。
- 农场：`farm_tending_events` 用 `rng 3`，约三分之一概率；`dangerEvent()` 决定是否进入事件。
- 温泉：`spa_work` 每次客人从 5 种性格中抽 1 个，本身就是一个“随机事件”。
- 脱衣舞俱乐部：`dance` 系统按回合出 `danceevent`（private / rape / leighton / robin / briarseduce 等）。

### 4.4 原版随机事件不做什么

- 不扣存款。
- 不在失败结算后再塞一个“好事”来抵消失败语气；失败事件和成功事件通常分开。
- 不把“随机事件”当成惩罚系统；惩罚是独立的租金/合同/战斗线。

---

## 5. 对我们 mod 的具体建议

### 5.1 三级惩罚怎么写

当前 `mp-job-punishment.twee` 的方向是对的：第一级警告、第二级停优待、第三级停班 + 做事清除。问题在“第二级没有真正落地”。建议把三级改成下面这种**可读、可持久、可恢复**的状态机。

| 等级 | 触发 | 应有机制 | 变量 |
| --- | --- | --- | --- |
| 1 | 当班失误 | 当班 0 工钱；叙事警告；安排最差岗位 | `$mpJobXStrike = 1` |
| 2 | 再次失误 | 当班 0 工钱 + 停一项真实特权 + 未来 3 天/3 班工资 ×0.75 | `$mpJobXStrike = 2`，`$mpJobXPenaltyUntilDay = Time.days + 3` |
| 3 | 第三次失误 | 停班；必须完成跑腿/人情/检定才能复工；成功后全部清零 | `$mpJobXStrike = 3`，`$mpJobXSuspended = 1` |

实现要点：

1. **不要用“工资为 0”推断失败**。现在 Shift 结果页用 `($mpJobResultPay or 0) is 0 and $mpJobResultText` 判断失败；如果以后加一个“无薪但成功”的选项，会误判。增加显式 `$mpJobResultFail` 标志。
2. **第二级必须有读取点**。现在 `$mpJobXPenalty` 只在惩罚段写入，没有任何地方读取。建议在工资公式里乘倍率，例如：

```text
<<set _penalty to (($mpJobCafePenaltyUntilDay or 0) gt Time.days)>>
<<set _mult to (_penalty ? 0.75 : 1)>>
<<set _pay to Math.floor((基础工资) * _mult)>>
```

3. **不要让班次开头把“停掉的优待”重新打开**。现在 `MP Job Cafe Shift` 开头无条件 `<<if $mpJobCafeLevel gte 3>><<set $mpJobCafePerk to 1>>`，会把第二级刚清掉的优待立刻恢复。应改成“等级达标且当前没有惩罚”才置 1；或者把特权改成派生显示，不落盘。
4. **strike 要能回落**。现在成功后没有任何 `Strike -= 1` 或清零，导致每条路线一辈子累计三次失误就停班。建议二选一：
   - 成功班次把 `Strike` 清零（最宽容，适合日常糊口）；
   - 或成功一次 `Strike = Math.max(0, Strike - 1)`，并加 7 天自然衰减（更适合“长期经营”）。
5. **第三级保留“必定清除”的跑腿选项**。当前每条路线都有一个不需要检定的跑腿，这是很好的防软锁设计；不要为了难度把它删掉。
6. **停班状态应在失败结算时就确立，而不是等玩家点进惩罚段**。现在只有进入 `MP Job Punishment X 3` 才 `Suspended = 1`；玩家如果失败后直接回告示板，可以绕过停班，继续接活。建议在 Shift 失败结算、`Strike` 达到 3 时就把 `Suspended` 置 1，惩罚段只负责叙事和清除。
7. **第二级的“补班”选项要有实际意义**。现在它只清 `Penalty`，但 `Penalty` 本来就没被读取；在修好倍率后，这个选项才会真正“用额外班次抵消降薪”。

### 5.2 哪些地方不该扣钱

以下场景不应出现 `<<money -X>>` 或对 `$money` 的负向写入：

- 咖啡馆打翻托盘、调错饮料、得罪客人。
- 码头网破、钓线被卷走、搬货受伤、slacking 被抓。
- 温泉毛巾没拧干、引错路、拒绝客人。
- 农场开垄失败、浇水冲苗、收割踩坏作物。
- 钟表铺捏坏游丝、崩齿、划伤夹板。
- 浆洗房烫焦床单、装订勒裂书脊。
- 所有 `mp-job-random-events.twee` 里的随机小事件。
- 玩家拒绝情色提议（可以丢小费、掉 love、被扯衣服，但不应扣存款）。

可接受的“金钱后果”只有：

1. **当班工钱为 0**（已经付出时间，这是最自然的代价）。
2. **未来若干班工资乘 0.75/0.8**（第二级惩罚）。
3. **材料/作物/零件损失**（用状态变量表示，不碰 `$money`）。
4. **明确的合同 no-show 罚金**（如果以后要加，像妓院那样在选项上写清金额，并提供拒绝/分期/用劳动抵偿的出口）。
5. **被敲诈**（像厨师 `Chef Blackmail Ask` 那样，是独立事件，明示金额，可拒绝）。

不要做：负余额、强制扣光、扣钱后无法继续游戏、失败后重复扣同一笔。

### 5.3 进度提示怎么写

原版没有 `Lv`，我们也不要把 `Lv 3` 直接印在 UI 上。建议：

1. **内部保留 `$mpJobXExp` / `$mpJobXLevel`，对外只给叙事档位**。当前 `MP Job X Upgrade` 的六段文案已经很好，继续沿用。
2. **把 `_next` 用起来**。现在六个 Upgrade passage 都计算了 `_next`，但从未打印。可以改成叙事化提示，例如：
   - “再稳过两个午市，Gwylan 会让你自己看吧台。”
   - “还差几次委托，Sera 才会把银壳三问表交给你。”
   - 如果不想暴露精确次数，用“快了 / 还早 / 再练练”三档。
3. **用道具和权限做进度标记**：缺口杯、后门钥匙、私汤木牌、温室钥匙、委托铜牌、装订台钥匙、内部价。玩家看到道具就知道自己到哪一级了。
4. **用日志/告示板显示“下一步”**：当前 Hub 只显示“可上工/已收工”，可以补一行“今天哪条线有特殊客人/哪条线在停班/哪条线差一次升级”。
5. **用一次性里程碑场景**：原版用 Sam 的提价、拍照、扩店，农场的 `farmVisitor`、`Farm Stage 4–12`，码头的 raise 等。我们已有 `claimUniqueReward` 里程碑，建议把文案写得更像“职业节点”，而不是“领奖”。
6. **多日进度用条/文本**：农场已经有“当前畦数 X，生长进度 Y”；这是全 mod 最接近原版进度提示的地方，可以推广到其他路线（例如咖啡馆“熟客 3/5”、码头“潮位表已认全”）。
7. **统计页/日志可以放数字**，但不要叫 Lv。原版 `Statistics` 就显示 “Buns sold at the cafe: N”；数字放统计页是安全的。

### 5.4 随机事件怎么挂

建议从“每条路线一个 `random(1,6)`”升级为“加权池 + 条件门控”：

```text
<<cleareventpool>>
<<addinlineevent "cafe_plates" 1.2>> ... <</addinlineevent>>
<<addinlineevent "cafe_breeze" 1.2>> ... <</addinlineevent>>
<<addinlineevent "cafe_regular" 1>> ... <</addinlineevent>>
<<if $mpJobCafeLevel gte 3>>
  <<addinlineevent "cafe_mentor" 0.6>> ... <</addinlineevent>>
<</if>>
<<runeventpool>>
```

具体建议：

1. **只在成功结算后触发**，或者把失败事件单独做成一个池。现在 `mp-livelihoods.twee` 的 `<<include "MP Job Random X">>` 在 `$mpJobResultText` 分支里，失败也会触发；打翻托盘后立刻来一个“温馨小面包”会削弱惩罚语气。
2. **用权重表达稀有度**：普通事件 1，关系/小费事件 0.6–1.2，升级/导师事件 0.3–0.6，纯氛围 1.5–2。
3. **用 `dangerEvent()` 门控情色/危险变体**：不要每条事件都平铺；让高吸引力/高暴露玩家更容易遇到麻烦，低吸引力玩家更多是氛围。
4. **按等级/天气/dayType 加条件**：雨天只出雨天事件；Lv3+ 才出导师事件；码头 busy 日只出重体力事件；温泉夜晚只出夜班事件。
5. **事件不碰钱**：随机事件只加/减 stress、tiredness、pain、love、fame、arousal；给钱也只能是“小费/捡到零钱”这种正向 `<<money +X>>`，不要负向。
6. **保持一次班次一个事件**：我们的班次是 15–20 分钟的单动作，不适合原版“每小时一个事件”的密度；一次结算一个即可。
7. **不要在事件里重设 `$location` / `$outside`**（虽然当前值相同，但会掩盖调用方的上下文）；事件 passage 只写内容与效果。

### 5.5 贝利双周收债怎么升级

当前 `MP Bailey Biweekly Tribunal` 是一个固定双周账单（£1500 起，每推进一段反抗减 £180，8 段后免除），每次还不上的出口是 `Pay` / `Shield` / `Fight` / `Bluff` / `BadEnd`。它的问题是：**没有“第一次警告、第二次加码、第三次不可逆”的层次**，每次失败都直接进同一个 `MP BadEnd Bailey Basement`。

建议加一个 `$mpBaileyMissedTier`（0–3），并把非付款出口按 tier 分流：

| tier | 触发 | 建议效果 |
| --- | --- | --- |
| 0 → 1 | 第一次没付/没打赢 | 警告 + 没收一件物品或加收 £100–£200“滞纳金”；仍可正常生活；给出分期/劳动抵偿出口 |
| 1 → 2 | 第二次 | 本期账单 +50%；带两个打手；同伴被牵连（stress/trauma）；公开惩戒 |
| 2 → 3 | 第三次 | 卖往地下农场/地下城，进入现有 `MP BadEnd Bailey Basement` 或 `Street Van` 类软坏结局 |
| 恢复 | 付清/完成反抗阶段/完成同伴救援 | tier 回落或清零；`mpBaileyBiweeklyNextDay` 照常 +14 |

同时保留当前优点：

- 反抗线每段永久削减 £180，8 段后免除，这是很好的“长期解决”路径。
- 日志面板已经显示“距离下一次核查还有 N 天 / 当前规费 £X”，这比原版更直观，继续保留。
- 所有分支都要推进 `$mpBaileyBiweeklyNextDay`，避免同一天反复触发；当前代码在 Pay/Shield/Bluff/BadEnd 都设置了 +14，保持这个约束。
- 如果要写“第一次/第二次/第三次”，建议在日志里明确显示当前 tier，而不是只显示金额。

### 5.6 当前 mod 的具体风险清单

| 风险 | 位置 | 说明 | 建议 |
| --- | --- | --- | --- |
| 第二级无机制效果 | `mp-job-punishment.twee` 写入 `$mpJobXPenalty` | 全仓库没有读取点 | 在工资公式里乘 0.75/0.8，或设置 `PenaltyUntilDay` |
| 停优待被立刻恢复 | 各 `MP Job X Shift` 开头 | Lv 达标就无条件把 `Perk/Private/Greenhouse/Commission/Discount` 置 1 | 加“无惩罚”条件，或改成派生显示 |
| `$mpJobFishStall` 死变量 | Fish 惩罚 2 | 只写 0，从未置 1、从未读取 | 删除或改成真实摊位变量 |
| `$mpJobCafePerk` 无读取 | Cafe | 只写不读，缺口杯/免费咖啡没有实际效果 | 在咖啡馆入口加免费咖啡/小费加成，或删掉变量避免误导 |
| strike 不回落 | 各 Shift 成功分支 | 成功后没有 `Strike -= 1`/清零 | 成功清零或每次成功 -1 + 7 天衰减 |
| 失败判定靠 `Pay is 0` | 各 Shift 结果页 | 未来加“无薪成功”会误判 | 增加 `$mpJobResultFail` |
| 随机事件失败也触发 | 各 Shift 结果页 | include 在失败分支也会执行 | 只在成功分支 include，或拆分失败池 |
| `_next` 只算不印 | 六个 Upgrade | 计算了下一级经验门槛但未使用 | 打印叙事化“还差几次” |
| 停班要手动点进惩罚 3 | Shift 结果页 | 不点惩罚链接可绕过 `Suspended` | 在 Strike 到 3 时立即置 `Suspended` |
| 第三级跑腿必定清除 | 惩罚 3 | 设计良好 | 保留，作为防软锁出口 |

---

## 6. 原版 vs 我们：对照表

| 维度 | 原版 0.5.12.13 | 我们当前实现 | 建议 |
| --- | --- | --- | --- |
| 收债周期 | 每 7 天（`$renttime = 7`，每日递减） | 每 14 天（`$mpBaileyBiweeklyNextDay`） | 保留双周，但日志明确倒计时 |
| 收债金额 | £100 → £2000 封顶；替 Robin 背债翻倍 | £1500 起，每段反抗 -£180，8 段免除 | 保留反抗削减；可加滞纳金/分期 |
| 还不上时升级 | 四条梯子：租金档位、转卖档位、没收、反抗链；不是三振 | 固定账单 + 单次 BadEnd，无 tier | 增加 `$mpBaileyMissedTier` 0–3 |
| 第一次还不上 | 可 Submit/Fight；Submit 首次去 Danube 晚宴 | 直接选 Pay/Shield/Fight/Bluff/BadEnd | 第一次给警告/没收/小额加收，不直接坏结局 |
| 第二次还不上 | 转卖 Eden；Robin 可能被扣 | 同上，无变化 | 第二次加码：账单 +50%、同伴牵连 |
| 第三次还不上 | 警察/枷锁 + 地下农场 | 同上，无变化 | 第三次才进软坏结局 |
| 打工失败扣存款 | 基本不扣；少数合同 no-show/敲诈例外 | 代码不扣；但 `livelihoods-design.md` 写“失败扣钱” | 以代码为准，保留“不扣存款”；更新文档措辞 |
| 打工失败后果 | 当班白干、丢小费、材料/作物损失、未来降薪 | 当班 0 工钱 + stress/tiredness/pain | 已接近原版；补第二级持久效果 |
| 惩罚层级 | 无“打工三级惩罚”；靠租金/合同/战斗 | 有三级惩罚 | 方向正确，修好第二级与 strike 回落 |
| 等级/Lv 显示 | 无；状态文本 + 进度条 + 日志 + 道具 + Feat | 内部 Lv0–5，Upgrade 叙事档位 | 不显示 `Lv N`；继续叙事化 |
| 进度提示 | `dockstatustext`、`$farm.clearing` 条、Journal、钥匙/铜牌 | Hub 只显示可上工/已收工；`_next` 未用 | 加“下一步”提示与道具标记 |
| 随机事件挂法 | 加权 `addinlineevent` + `runeventpool` + `dangerEvent` | `random(1,6)` 平铺，每班一次 | 改加权池，按等级/天气/危险度门控 |
| 随机事件内容 | 氛围/小费/危险/迷你任务/犯罪/升级 | 纯氛围小事件，加减 stress/tiredness | 增加关系、升级、危险变体；不要扣钱 |
| 随机事件时机 | 每个工作动作/每小时，成功与失败语境分开 | 结算后统一触发，失败也触发 | 成功/失败分池 |
| 每日班次 | 咖啡馆可反复；码头一天一班；农场按小时 | 每条路线每天一次 | 保留；用它控制通胀 |
| NPC 关系 | Sam/Gwylan/Robin/Alex/Jordan 有 love、台词、小费 | 多数只做氛围，少量 `npcincr` | 给关键节点加 `npcincr` 与台词分档 |
| 里程碑 | Feat + 一次性剧情（Farmhand/Farmer/Cultivator） | `claimUniqueReward` + 一次性红封/铜牌 | 保留；文案更像职业节点 |
| 恢复机制 | 付钱、打赢、赎回、反抗 | 第三级跑腿/人情/检定 | 保留必定清除的跑腿出口 |
| 软锁风险 | 低（可付/可打/可逃） | 第三级若不点惩罚可绕过停班；strike 永久累积 | 修 `Suspended` 时机与 strike 回落 |

---

## 7. 参考 passage 索引

**贝利 / 租金**

`Orphanage Intro`、`Widgets Rent`、`Bedroom Bailey`、`Orphanage`、`Hospital Rent`、`Rent Intro`、`Rent Pay`、`Rent Pay Robin`、`Rent Refuse`、`Rent Refuse Robin`、`Rent Seduce`、`Rent Fight`、`Rent Fight Finish`、`Rent Hospital Fight`、`Rent Hospital Fight Finish`、`Rent First Robin Fight`、`Rent First Robin Fight Finish`、`Bailey Rent Reclaim`、`Widgets Bailey Confiscation`、`Bailey Confiscation Fight`、`Bailey Confiscation Fight Finish`、`Bailey's Office`、`Bailey's Office Robin`、`Danube Meal`、`Street Van Bailey`、`Underground Intro`、`Widgets Journal`、`Widgets Named Npcs`、`Statistics`。

**咖啡馆 / 厨师**

`Ocean Breeze`、`Ocean Breeze Ask`、`Ocean Breeze Take Job`、`Ocean Breeze Work`、`Ocean Breeze Plates`、`Ocean Breeze Soup Ignore`、`Ocean Breeze Soup Confront`、`Ocean Breeze Remove`、`Ocean Breeze Angry`、`Ocean Breeze Ignore`、`Ocean Breeze Register`、`Ocean Breeze Gwylan Juice`、`Gwylan Ocean Breeze`、`Cafe Coffee*`、`Cafe Pancakes`、`Chef Work`、`Chef Work 2`、`Chef Work Regular`、`Chef Help`、`Chef Photographer`、`Chef Blackmail Ask`、`Chef Blackmail Pay`、`Widgets`（`waiter_default` / `tipset` / `tipreceive`）、`Widgets Journal`。

**码头**

`Docks`、`Docks Ask`、`Docks Take Job`、`Docks Start Early`、`Docks Start`、`Docks Options`、`Docks Work`、`Docks Leave`、`Docks Lunch`、`Docks Lunch Socialise`、`Docks Lunch Flirt`、`Docks Lunch Sleep`、`Docks Pub Crawl`、`Widgets Docks`（`dockoptions` / `dockwork` / `dockleave` / `dockstatus` / `dockstatustext` / `dockworkevents` / `dockoverhear`）。

**农场 / 温泉 / 俱乐部 / 妓院 / 酒吧 / 办公室 / 洗衣**

`Farm Work`、`Farm Tending`、`Farm Fields`、`Farm Widgets`（`farm_work_update` / `farm_tending_events` / `farm_tending_alex_events`）、`Spa Work Ask`、`Spa Work`、`Spa Work Start`、`Widgets Spa`（`spa_work` / `spa_actions` / `spa_end` / `body_tip`）、`Strip Club`、`Strip Club Management`、`Strip Club Bartending`、`Strip Club Dancing`、`Brothel`、`Brothel Dance`、`Brothel Pay`、`Brothel Punishment`、`Pub`、`Pub Landry`、`Pub Task`、`Pub Sell`、`Pub Music`、`Office Assignment Start`、`Widgets Office Assignment`、`Chalets Work End 2`、`Flats Laundry Ask`、`Flats Laundry`、`Prison Laundry Work`。
