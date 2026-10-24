# VANILLA_DESIGN_NOTES.md — DoL 0.5.12.13 原版系统深度拆解笔记

> **研究基准**：`vanilla/vanilla-passages.twee`（从原版 `Degrees of Lewdity 0.5.12.13` 提取的 **16,087** 个段落）与 `vanilla/ModI18N-0.5.12.13-chs-1.0.1a.mod.zip`。
> **目标**：把原版的核心循环、地点拓扑、零工生计、NPC 作息与事件池、选项门控、经济物价、属性检定、关系递进、状态存档与文案 UI 彻底吃透，作为 Argon 模组重做零工线与日常线的唯一标尺。

---

## 1. 核心循环（时间推进、单次行为时长与事件触发时机）

### 1.1 一天的时间轴与时段划分（`Time.dayState` / `Time.hour`）
原版的时间由 `Time.hour`（0–23）、`Time.minute`（0–59）、`Time.weekDay`（1=周日，2=周一……7=周六）与 `Time.dayState`（`dawn` / `day` / `dusk` / `night`）共同驱动：
- **破晓与清晨（`dawn` / `06:00–08:59`）**：每日 `06:00` 触发 `dawnCheck`（清空 `$daily` 对象、结算植物生长与宿醉/转化进度）。孤儿院早餐、罗宾敲门、上学通勤、码头早班（`07:00` 准点打卡，`07:30` 后扣首小时工资）集中在此窗口。
- **白昼（`day` / `09:00–17:59`）**：学校课程（`09:00–15:00`，仅限 `Time.schoolDay`）、海风咖啡馆（`Ocean Breeze`，`!Time.isWeekEnd() ? 09:00–17:00 : 07:00–21:00`）、高街商铺、水疗馆（`Spa`，`08:00–20:00`）、临时工中介（`Office Agency`，`06:00–21:00`）的主力活跃期。
- **黄昏（`dusk` / `18:00–20:59`）**：白昼商铺陆续打烊（`Closing time` 驱离逻辑）、夕阳约会（如艾弗里晚餐邀约、罗宾摆摊收摊）、夜间场所（`Strip Club`、`Brothel`、酒吧夜市）开门迎客的交接窗口。
- **夜晚（`night` / `21:00–05:59`）**：街道危险度与暴露风险陡增，触发夜间事件池（如 `Night Monster`、血月 `Time.isBloodMoon()`、巡警/帮派盘查、潜入盗窃 `Lock` 分支）。

### 1.2 单次动作耗时分布（基于 16,087 个段落的 `<<pass>>` 统计）
对 `vanilla-passages.twee` 全量检索 `<<pass ...>>` 得到以下真实分布：
- **短促交互/过街步移**：
  - `<<pass 1>>`（**833 处**）：房间内转身、查看镜子/衣柜、短对话切换。
  - `<<pass 2>>`（**312 处**）、`<<pass 3>>`（**108 处**）：喝咖啡（`Cafe Coffee`）、快速穿脱毛巾、近距离跨门。
  - `<<pass 5>>`（**1,000 处**，全游戏最高频）：城市相邻街区移动（如 `High Street` ↔ `cliff` / `Danube Street`）、简短闲聊。
  - `<<pass 10>>`（**967 处**）：跨区移动、茶座进食（`Cafe Eat` 饮品）、办公室休息室小憩（`Office Agency Break`）。
- **中等日常行为**：
  - `<<pass 15>>`（**304 处**）、`<<pass 20>>`（**584 处**）、`<<pass 30>>`（**638 处**）：吃全餐（`Cafe Pancakes` / `Cafe Cream Bun` `0:20`）、淋浴洗漱、图书馆自习半小时、街头小事件。
- **标准工作班次（Shift Unit）**：
  - `<<pass 60>>`（**406 处**）与 `<<pass 1 hour>>`（**211 处**），合计 **617 处**：原版绝大多零工（`Ocean Breeze Work`、`Docks Work`、`Spa Work`、`Farm Work`、`Strip Club Dancing`）均采用 **1 小时（`1:00`）为一个标准工作切片**。玩家每做完 1 小时结算一次体力/压力/小费/随机事件，再由玩家自主决定是继续下一小时还是收工离开，绝不会把玩家一次性锁死 6 小时。

### 1.3 事件是在什么时机弹出来的？
1. **街区移动拦截（Transit Interception）**：在街区段落（如 `Danube Street`、`High Street`、`Cliff Street`）末尾，若 `$eventskip is 0`，调用 `<<eventsstreet>>` / `<<eventsdanube>>` 等街头事件宏；若刚从室内走出或刚结束上一个事件，必设 `<<set $eventskip to 1>>` 防止连环弹窗。
2. **动作执行中抽签（In-Action Event Pool）**：工作段落（如 `Ocean Breeze Work`、`Widgets Spa` 中的 `<<spa_work>>`、`Docks Work`）在玩家点击“工作 1 小时”后，先运行 `<<cleareventpool>>` + `<<addinlineevent>>` 按权重抽取本小时遭遇的顾客/插曲，而不是在门店外摆一个静态的“点击触发随机事件”按钮。
3. **生理与精神阈值强插（Threshold Override）**：在段落顶部 `<<effects>>` 后立即检查 `<<if $stress gte $stressmax>><<passoutshop>>` 或 `<<if $arousal gte $arousalmax>><<orgasmLocation>>`，优先于一切常规选项。

---

## 2. 地点与解锁（拓扑结构与多维门控）

### 2.1 原版地点拓扑（40 个高频 `$location` 域与核心街区）
原版通过 `$location`（室内外场景语义，共检索到 `town` 541 处、`school` 445 处、`home` 196 处、`temple` 149 处、`cabin` 120 处、`asylum` 107 处、`cafe` 106 处、`sewers` 93 处、`hospital` 59 处、`adult_shop` 59 处、`park` 58 处、`lake` 55 处、`strip_club` 48 处、`pub` 47 处、`brothel` 45 处等）与 `$bus`（所在街道名，如 `cliff`、`danube`、`high`、`connudatus`、`mer`、`harvest`、`domus`、`barb`、`oxford`、`nightingale`、`starfish`、`elk`、`wolf`）双层变量定位玩家。
- **街道是骨架，店铺是挂载节点**：玩家从 `Cliff Street` 进入 `Ocean Breeze`，从 `Mer Street` 进入 `Docks`，从 `Danube Street` 进入 `Spa`，从 `Harvest Street` 进入 `Pub` 或前往 `Farmland`。没有任何店铺悬浮在“中央菜单页”上。

### 2.2 四类地点解锁门控（具体段落实例）
1. **初次问路/求职引导（Intro State Gate）**：
   - `:: Ocean Breeze`：当 `$oceanbreezejob isnot 1` 时显示 `<<askicon>><<link [[Ask for work (0:02)|Ocean Breeze Ask]]>>`；录用后（`$oceanbreezejob is 1`）原链接永久替换为 `<<OceanBreezeWaiterLink>>` 与 `<<GetBunsLink>>`。
   - `:: Docks`：`$docks.intro is undefined` 时显示 `Ask for work`（进入 `Docks Ask` → `Docks Take Job`）；录用后在 `06:00–06:59` 显示 `Wait for work`，`07:00–17:59` 显示 `Work (1:00)`。
   - `:: Spa`：`$spa_job isnot 1` 时显示 `<<link [[Ask for work|Spa Work Ask]]>>`；录用后显示 `<<spaicon>><<link [[Work as a masseuse (0:30)|Spa Work Start]]>>`。
2. **营业时段与关门锁（Time & Lock Gate）**：
   - 打烊时段不直接删除地点，而是把入口分流到带锁段落：如 `:: Ocean Breeze Lock`、`:: Spa Lock`。在 Lock 段落提供 `Leave` 与 `Pick the lock`（调用 `<<skulduggerycheck>>` 对比 `$lock` 难度，成功进入潜入分支，失败显示 `<<skulduggeryrequired>>`）。
3. **衣着、暴露度与身体状态门控（State Gate）**：
   - `:: Ocean Breeze`：若 `$exposed gte 1`，正常工作与就餐链接全部隐藏，只显示 `Hide beneath a table (0:10)`（若具备展览癖等级则额外解锁 `Walk inside anyway`）。
   - `:: Office Agency`：检查 `pcAreArmsBound("both")`（双臂被缚）、`inappropriatePlayerState("clothes")`（衣着暴露/不整）、`inappropriatePlayerState("drugs")`（醉酒/药物状态），不满足时用 `<span class="red/blue">...</span>` 说明原因并隐藏接单按钮。
4. **声望/剧情进度门控（Fame & Quest Gate）**：
   - `:: Ocean Breeze`：当 `$chef_state is 0 and $fame.business gte 400` 时自动触发山姆招揽主厨剧情（`Chef Intro`）；`$chef_state gte 7` 时解锁后厨 `Work as chef`。
   - `:: Office Agency`：当 `$averySeen?.includes("office")` 且艾弗里未被解雇时，额外浮现 `Work as Avery's Personal Assistant`。

---

## 3. 零工与生计（原版 6 大代表性工作全流程拆解）

### 3.1 海风咖啡馆（`Ocean Breeze` / `Ocean Breeze Work` / `Ocean Breeze Plates`）
- **入口**：`:: Ocean Breeze`（位于 `Cliff Street`，营业时间工作日 `09:00–17:00`，周末 `07:00–21:00`）。
- **班次结构**：每次点击 `Work as waiter/waitress (1:00)` 进入 `:: Ocean Breeze Work`，基础耗时 `<<pass 1 hour>>`（若突发事件已结算时间则分段扣除），基础时薪 £5（`<<money 500 "cafeWaiter">>`）。
- **检定与分支设计**：进入班次后先掷 `$rng`（1–100）：
  - **高曝光/名声分支**（`$rng >= 90` 且声望高）：被顾客认出，给玩家选择应对姿态。
  - **突发端盘事件**（`Ocean Breeze Plates`）：一桌客人点了大量菜品，给玩家两个清晰对立的选项：
    - 稳妥选项：`Take multiple trips`（`$phase = 0`，无检定，稳拿基础工资与常规小费）。
    - 风险高回报选项：`Balance the plates on your shoulders`（`$phase = 1`，带 `<<dancedifficulty 1 500>>` 检定）：成功则 `$tipmod = 0.2` 触发丰厚小费 + `<<npcincr Sam love 1>><<glove Sam>>`；失败则摔盘子，无小费且 `<<npcincr Sam love -1>><<llove Sam>><<stress 6>><<gstress>>`。
  - **汤里有异物事件**（`Ocean Breeze Soup`）：可选 `Ignore` 或 `Confront`，考验玩家胆识与良知。
  - **晴天旅游大巴高峰**（`Weather.precipitation is "none"`）：大巴游客涌入，山姆忙不过来，触发多人桌点单与骚扰应对。
  - **平淡班次兜底**（`<<waiter_default>>`）：约 1/6 概率（随 `$chef_state` 提升至 3/6）遇到大方客人留下小费（`<<tipset "serving">>`），否则拿保底 `£5.00`。
- **与模组旧版对比**：原版的随机事件**就是班次本身的内容**（点“打工”→直接进入今日遭遇的顾客情境→做选择→拿钱离开），而模组旧版把“打工结算”做成了静态算术，把“突发事件”和“熟客回访”拆成了升级页底下的独立按钮，导致主班次干瘪、支线按钮像刷题。

### 3.2 码头苦力（`Docks` / `Docks Start` / `Docks Work` / `Docks Options`）
- **入口与考勤纪律**：`:: Docks`（位于 `Mer Street`）。必须在 `07:00–17:59` 进场；`07:00` 整点到场获经理表扬，`07:30` 后迟到直接扣除首小时薪水（`$docks.dailyHours.shift.unpaid`）。
- **每日工况（`$docks.dayType`）**：每天开班随机生成 `busy`（繁忙，体力消耗 `<<physique 6>>`）、`slow`（清闲，体力消耗 `<<physique 2>>`，摸鱼不被工友嫌弃）、`lewd`（特殊货物）或常规日。
- **班次选择（`<<dockoptions>>`）**：每小时可选：
  - `Work hard (1:00)`（`$phase = 0`）：踏实搬运，涨体魄，累积工时与工友认可度（`$docks.status`）。
  - `Slack off (1:00)`（`$phase = 1`）：偷懒省体力，但每次累加 `_daily_slacked`；当 `$docks.status gte 80` 时工友前 3 次会替你打掩护（`<span class="lblue">cover for you</span>`），超过阈值则引发工头训斥或惩罚。
- **核心启示**：工友关系（`$docks.status`）不是死板的“等级 3”，而是直接转化为**容错率**（工友替你打掩护、午休时邀请你同桌、允许你借用器械）。

### 3.3 水疗馆按摩师（`Spa` / `Spa Work Start` / `Widgets Spa`）
- **入口**：`:: Spa`（位于 `Danube Street`，`08:00–20:00`）。
- **连续接单循环**：从 `Spa Work Start` 进入按摩房后，调用 `<<spa_work>>`，每单耗时 `0:30` 或 `0:50`，结算后无需退回大街，直接在房间内点击 `Spa Work`（按铃呼叫下一位客人）即可连续接单，直到玩家主动点击 `Leave` 触发 `<<timeTrackingEnd "spa">>`。
- **顾客画像池（`<<cleareventpool>>`）**：每次呼叫客人时，从事件池抽取不同性格的客人：`spa_hesitant`（害羞生客）、`spa_tired`（疲惫裸客）、`spa_rude`（粗鲁客人）、`spa_rich`（阔绰客人），以及周一满足条件时低概率刷新的具名 NPC **Avery**（`$spa.personality = "Avery"`）。
- **姿态交互（`<<spa_actions>>`）**：面对客人时，玩家选择服务风格：`Cute`（乖巧）、`Sophisticated`（老练得体）、`Alluring`（撩人，`<<promiscuous1>>`），结合 `$handskill`（手法技能）决定小费高低与是否触发越界事件。

### 3.4 亚历克斯农场（`Farmland` / `Farm Work`）
- **入口**：乡村 `Farmland` → 完成开荒/解围剧情后进入 `:: Farm Work`。
- **多工种农活矩阵**：不是单一的“种地按钮”，而是围绕农场真实设施展开：照料菜畦、清理牛棚/猪圈、喂鸡捡蛋、修补围栏（`$farm.build` 含 `wall 1-4`、`tower 1-2`、`woodland 1-3`、`kennel 1`），且与亚历克斯（`Alex`）的时段动作实时同步（两人同处一处时可协作或搭话，分开时各自劳作）。
- **长线可见反馈**：玩家的劳动直接改变场景描述（如围墙修好、了望塔装上探照灯、林地扩建），安全感与产出随设施升级同步提高。

### 3.5 临时工中介与写字楼（`Office Agency` / `Office Assignment Start`）
- **派单制（Assignment Model）**：玩家在前台领单（打字、送文件、碎纸、会议室服务、高管助理），每个差事有独立的楼层、委托人与突发状况（如电梯故障、文件洒满走廊、保安盘查），累计表现提升 `$managerLove`，进而解锁高薪私活与艾弗里专属支线。

### 3.6 舞厅与欢场（`Strip Club` / `Brothel`）
- **时段与违约惩罚**：严格绑定夜间/黄昏；在 `Brothel` 中若答应了布莱尔（`Briar`）的压轴演出（`$brothelshowdata`）却爽约（`$brothelshowdata.missed`），下次进门立刻被布莱尔与两名打手堵门索赔 `£1000`（`Brothel Punishment`），付不起则进入强制抵债或战斗分支——惩罚与“失信行为”强因果绑定，绝非无聊的文字检讨。

---

## 4. NPC 作息与事件池（`eventpool` 与日期键机制）

### 4.1 具名 NPC 的多维度作息（Schedule & Location）
原版共定义 **32 名核心具名 NPC**（`setup.NPCNameList`：Avery, Bailey, Briar, Charlie, Darryl, Doren, Eden, Gwylan, Harper, Jordan, Kylar, Landry, Leighton, Mason, Morgan, River, Robin, Sam, Sirris, Whitney, Winter, Black Wolf, Niki, Quinn, Remy, Alex, Great Hawk, Wren, Sydney, Ivory Wraith, Zephyr, Night Monster）与 **8 名持久化职能 NPC**（`setup.perName`：如 `manager`、`hacker`/Mickey、4 名监狱守卫与 2 名狱友）。
- **作息驱动位置**：例如罗宾（`Robin`）上学日在学校与孤儿院之间切换，周末白天在海滩/公园摆热可可或柠檬水摊（随季节变化），傍晚回房；悉尼（`Sydney`）在学校图书馆、神殿祈祷室与成人用品店帮工之间流转；艾弗里（`Avery`）按星期与时段触发写字楼偶遇、周日水疗馆（`Time.weekDay is 1`）或街角轿车邀约。

### 4.2 原版 `eventpool` 权重抽取标准范式（全库 157 个段落、469 次调用）
原版从不使用长串僵硬的 `if/elseif` 穷举随机事件，而是使用标准的三步事件池宏：
```twee
<<cleareventpool>>
<<addinlineevent "event_id_1" 3>>
    /* 权重为 3 的常态事件内容 */
<</addinlineevent>>
<<if Time.season is "winter" and !$daily.someWinterFlag>>
    <<addinlineevent "event_id_winter" 2>>
        /* 仅在冬季且今日未触发时加入池子，权重为 2 */
    <</addinlineevent>>
<</if>>
<<runeventpool>>
```
- **优势**：满足条件的特殊事件（天气、季节、熟客、跨店供货、高阶段专属）动态入池，不满足条件时自动退化为常态事件，永远不会出现空分支或死循环。

### 4.3 每日键（`$daily`）与一次性键（One-Time Keys）
- **`$daily` 对象（全库 2,554 次引用，189 个独立顶层键）**：最高频键依次为 `$daily.fishing`（496）、`$daily.gwylan`（218）、`$daily.sydney`（145）、`$daily.eden`（132）、`$daily.school`（125）、`$daily.robin`（120）、`$daily.ex`（119）、`$daily.whitney`（114）、`$daily.avery`（85）、`$daily.kylar`（75）、`$daily.cafeEaten`（35）。每天 `06:00` 由引擎自动重置为空对象 `{}`。
- **一次性历史记录**：使用具名数组（如 `$gwylanSeen.includes("chef_chat")`、`$averySeen.includes("office")`）或布尔状态位（如 `$oceanbreezejob is 1`、`$docks.firstDay`），确保首次对话与长线解锁永不重复刷奖。

---

## 5. 选项设计（门槛提示、代价透明与失败分支）

### 5.1 原版三种门槛处理方式
在 `:: Widgets Difficulty [widget]` 中，原版定义了统一的检定与难度渲染规范：
1. **点击后动态检定 + 尾缀难度标签（最主流）**：
   - 选项本身可点击，链接右侧紧跟 `<<dancedifficulty 1 500>>`、`<<tendingdifficulty 1 300>>`、`<<skulduggerydifficulty>>` 或 `<<seductiondifficulty>>`。
   - 宏内部根据 `(当前技能 - 最低门槛) / (满分门槛 - 最低门槛)` 计算成功率，渲染为彩色尾缀：`<span class="green">(Very Easy)</span>`、`Easy (teal)`、`Medium (lblue)`、`Challenging (blue)`、`Hard (purple)`、`Very Hard (pink)`、`Impossible (red)`。
2. **硬状态阻断（先置灰/文字说明，不给无效链接）**：
   - 如 `:: Office Agency` 中双臂被捆或衣不蔽体时，直接用文字提示 `<span class="blue">You're dressed too inappropriately...</span>` 并隐藏接单链接；或者在打烊锁门时只给 `Pick the lock` 而不给正常进门。
3. **点击后拦截反馈（如开锁失败 `<<skulduggeryrequired>>`）**：
   - 当玩家尝试撬锁失败时，跳转至锁门反馈页，调用 `Skulduggery required: <<skilllettergrade $lock>>` 明确告知所需字母等级（`F / F+ / D / D+ / C / C+ / B / B+ / A / A+ / S`），并推进少量尝试时间。

### 5.2 失败分支的铁律
- 原版任何检定失败分支（如 `Ocean Breeze Plates` 摔盘子、`Lock` 撬锁失败）**绝对不会发放金钱或正面进度**，而是施加合理的轻度代价（`<<stress 6>><<gstress>>`、好感 `-1`、或是进入需要化解的尴尬场面），同时给玩家留出体面的退路或补救选项。

---

## 6. 经济系统（原版物价锚点与小费公式）

### 6.1 货币内部单位与显示换算
- **核心铁律**：DoL 内部所有 `<<money X>>` 与 `$money` 变量均以 **便士（pence，即 `1/100` 英镑）** 为单位！
  - `<<money 100>>` = **£1.00**
  - `<<money 500>>` = **£5.00**
  - `<<money 2000>>` = **£20.00**
  - `<<money 100000>>` = **£1,000.00**
- **原版真实物价锚点（全库检索证据）**：
  - 公交车票：`<<money -100 "bus">>`（**£1.00**）
  - 咖啡馆咖啡：`<<money -200 "cafe">>`（**£2.00**，减疲劳 `-4`，耗时 `0:02`）
  - 咖啡馆水果沙拉 / 街机厅 / 酒吧一杯酒：`<<money -500>>`（**£5.00**）
  - 咖啡馆麦酒 / 资助罗宾：`<<money -700>>`（**£7.00**）
  - 咖啡馆松饼（Pancakes）：`<<money -1000 "cafe">>`（**£10.00**，减疲劳 `-6`，耗时 `0:20`）
  - 豪华奶油包（Deluxe Cream Bun）：`<<money -5000 "cafe">>`（**£50.00**）
  - 咖啡馆侍应生基础时薪：`<<money 500 "cafeWaiter">>`（**£5.00 / 小时**）+ 小费
  - 咖啡馆主厨 / 公寓清洁工时薪：`<<money 1000>>`（**£10.00 / 小时**）
  - 贝利（Bailey）每周孤儿院催缴额度：随周数从 **£100 → £300 → £500 → £1,000 → £2,000** 阶梯递增。

### 6.2 原版小费计算公式（`<<widget "tipset">>`）
在 `:: Widgets [widget]` 中，原版小费并非固定常数，而是多因子乘积：
1. 基础随机池：`$tip = random(1000, 3000)`（即 £10–£30 基准池）。
2. 服装加成（若为 `"serving"` 服务业）：统计可见服装中带 `"serving"` 标签的件数 `$_servingClothesCount`，乘以 `1 + 0.75 * (1 - (2/3)^N)`。
3. 班次倍率与魅力/数学特质加成：
   - `$tip = $tipmod * $tip`（例如端盘子普通 `$tipmod = 0.1`，杂技端盘成功 `$tipmod = 0.2`）
   - `$tip *= (1 + ($attractiveness / 10000))`
   - 若数学成绩优异（`$mathstrait >= 1`）：`$tip *= (1 + ($mathstrait / 4))`（算账精明多拿小费）。
4. 阶梯取整：按 50 便士（£0.50）或 500 便士（£5.00）四舍五入，保底 `50`（£0.50）。`<<tipreceive>>` 在咖啡馆还会额外叠加基础时薪 `500`（£5.00）。

---

## 7. 属性与检定（0–1000 标尺、字母等级与成长节奏）

### 7.1 技能标尺与字母等级（`<<widget "skilllettergrade">>`）
原版所有常规技能（`$tending` 照料、`$housekeeping` 家政、`$athletics` 运动、`$danceskill` 舞蹈、`$swimmingskill` 游泳、`$skulduggery` 诡术、`$seductionskill` 魅惑，以及四门学科 `$science` / `$maths` / `$english` / `$history`）均为 **0–1000** 标尺，对应字母等级严格如下：
| 数值区间 | 字母等级 | 颜色类名 | 阶段定位 |
| :--- | :---: | :---: | :--- |
| `<= 0` | `None` / `F` | `red` / `pink` | 初入小镇的新手 |
| `1 – 100` | `F+` | `pink` | 略通皮毛 |
| `101 – 200` | `D` | `purple` | 基础学徒门槛 |
| `201 – 300` | `D+` | `purple` | 熟练零工门槛（Mod 常用 240–300） |
| `301 – 400` | `C` | `blue` | 正式工匠 / 进阶差事 |
| `401 – 500` | `C+` | `blue` | 独当一面（如诡术 ≥500 免除小偷小摸犯罪值） |
| `501 – 600` | `B` | `lblue` | 行业好手 |
| `601 – 700` | `B+` | `lblue` | 资深骨干 |
| `701 – 800` | `A` | `teal` | 大师级门槛 |
| `801 – 900` | `A+` | `teal` | 顶尖专家 |
| `901 – 1000` | `S` | `green` | 传奇满级 |

- **特殊量纲属性**：
  - `$physique`（体魄）：上限 `$physiquesize`（通常 `10,000–20,000`），每次 `<<physique N>>` 实际增加 `10 * N`。
  - `$willpower`（意志）：上限 `$willpowermax`（`1,000`）。
  - `$beauty` / `$attractiveness`（美貌/吸引力）：`0–10,000`（`S` 级为 `>= 5000`）。

### 7.2 单次技能成长量（`:: Widgets [widget]` 实证）
- `<<tending N>>` / `<<housekeeping N>>`：实际增加 `N * 2`（通常单次工作给 `1–3`，即 `+2 ~ +6` 点）。
- `<<athletics N>>`：实际增加 `Math.trunc(N * 1.3)`（穿运动服每件 `* 1.1`）。
- `<<skulduggeryskilluse>>`：每次 `+3` 点；`<<swimmingskilluse>>`：每次 `+9` 点；`<<danceskill N>>`：每次 `+N` 点。
- **结论**：原版技能成长是细水长流的，工作班次成功时应当顺带给予对应的原版技能微幅成长（如鱼档给 `<<athletics 2>>` 或 `<<swimmingskill 2>>`，桑拿给 `<<tending 2>>` 或 `<<housekeeping 2>>`），让打工与角色养成真正咬合！

---

## 8. 关系系统（好感别名、多维数值与非数字外显）

### 8.1 具名 NPC 的好感轴与专属别名（`setup.loveAlias`）
在 `:: Widgets variablesStatic [widget]` 中，每个具名 NPC 拥有 `love`、`trust`、`dom`、`lust`、`rage` 等维度，且 UI 上的 `love` 显示名随人物身份定制：
- **恋爱候选人（`Love`）**：Robin, Whitney, Kylar, Sydney, Eden, Avery, Black Wolf, Great Hawk, Alex, Gwylan（达成伴侣后由 `Interest` 转为 `Love`）。
- **雇主/前辈/权威（`Respect`）**：Sam（海风咖啡馆老板）、Briar（欢场老板）、Jordan（神殿主持）、Bailey、Charlie、River、Niki。
- **导师/长辈/熟人（`Affection` / `Interest`）**：Sirris、Winter、Mason、Doren、Darryl、Wren（`Affection`）；Harper、Landry、Leighton、Quinn、Remy、Zephyr（`Interest`）。

### 8.2 关系变动量级与叙事反馈
- 全库最高频调用为 `<<npcincr Robin love 1>>`（221 次）、`<<npcincr Avery love 1>>`（179 次）、`<<npcincr Alex love 1>>`（93 次）。每次日常互动增减幅度严格控制在 **`±1 ~ ±2`**，重大剧情节点才给 `±5`。
- **绝不向玩家裸露数字**：正文中只通过 `<<glove>>` / `<<llove>>` 语义标签与人物动作细节体现关系递进（例如山姆走过时竖起大拇指、格威岚往吧台角推来温热纸包、亚历克斯把温室钥匙挂到你手边）。

---

## 9. 状态与存档（变量命名、跨天清理与防膨胀规范）

### 9.1 原版三层状态存储架构
1. **`setup.*`（静态只读层）**：存放在 `SugarCube.setup`（如 `setup.NPCNameList`、`setup.crimeNames`、`setup.majorAreas`），**不写入存档**，彻底避免存档体积膨胀。
2. **`$daily.*`（跨日自动清空层）**：记录当日是否已打卡、是否已吃过某餐、当日特殊事件是否已发生。每天 `06:00` 整自动归零。
3. **`$*` / `V.*`（持久化存档层）**：
   - 复杂子系统使用命名空间对象（如 `$docks.status`、`$docks.dailyHours`、`$farm.build`、`$spa.behaviour`、`$brothelshowdata`）。
   - 临时演算变量一律使用 `_temp`（SugarCube 局部变量，离开段落自动销毁），**严禁把中间计算变量写成 `$` 全局变量污染存档**。

### 9.2 对 Argon 模组存档兼容的启示
- 模组已有的持久化变量（如 `$mpJobCafeExp` / `$mpJobCafeLevel`、`$mpJobFishExp` / `$mpJobFishLevel`、`$mpJobBakeryCount` 等）必须**100% 保持原变量名与阶梯公式不变**，确保老存档无缝继承；新增的班次内临时状态一律使用 `_` 局部变量或挂载在 `$daily` 下。

---

## 10. 文案与 UI（按钮字数、图标节奏、单页密度与留白）

### 10.1 选项标签与耗时标注
- 原版所有推进时间的动作链接，一律采用 `[[动词短语 (H:MM)|目标段落]]` 格式（如 `[[Chat with Gwylan (0:15)|Chef Opening Gwylan]]`、`[[Relax in breakroom (0:10)|Office Agency Break]]`）。
- 汉化版（`ModI18N-0.5.12.13-chs`）中，选项主体严格控制在 **4–8 个汉字**（不含 `(0:XX)`），一眼扫过去全是干净利落的动作动词，绝不把背景解释或属性要求塞进按钮文字里。

### 10.2 单页选项密度与图标克制
- 原版常规场景页选项数普遍在 **2–5 个**之间；超过 5 个选项的枢纽页必按功能分组换行。
- 图标（如 `<<getouticon>>`、`<<shopicon>>`、`<<askicon>>`、`<<socialiseicon>>`）作为视觉锚点服务于动作语义，同一页面绝不连续堆砌相同图标。

### 10.3 叙事颗粒度：用具体物象代替抽象数值
- 原版写海风咖啡馆端盘子，写的是托盘架在肩头的平衡感与碎瓷片；写码头，写的是湿透衣衫贴在身上的寒意与工友递来的眼神；写水疗馆，写的是走廊薄窗透出的蒸汽与推拿铃声。
- **核心设计准则**：把“等级 3 / 经验 +2”彻底藏进幕后，在前台给玩家看“鱼贩把顺风的头等摊位留给了你”、“乔丹把私汤的铜钥匙放进你掌心”、“老乐手不用开口你就把不加糖的热红茶推了过去”。
