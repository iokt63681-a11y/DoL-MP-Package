# 长期打工路线数值设计

对应文件：`mod-src/twees/mp-livelihoods.twee`（19 个 passage）

目标：给玩家 6 条可以长期重复经营、按等级缓慢成长的打工路线。早期能靠低风险路线稳定糊口，中期靠技能与等级提高单价，后期用高技能路线拿到接近上限的报酬；不设计一次暴富。

## 一、通用规则

### 1. 经验与等级

- 每次完成一个班次：`exp +1`。
- 当次判定成功：额外 `exp +1`（失败也给 1 点，因为时间已经花掉）。
- 等级由累计经验推导，不单独递增：

| 等级 | 累计经验 | 说明 |
|---:|---:|---|
| Lv0 | 0–2 | 新手 |
| Lv1 | 3 | 入门 |
| Lv2 | 6 | 熟练 |
| Lv3 | 10 | 可接高价活，触发一次性里程碑 |
| Lv4 | 15 | 解锁该路线核心特权 |
| Lv5 | 21 | 满级 |

实现方式为行内三元表达式，例如：

```text
$mpJobCafeLevel = exp>=21 ? 5 : exp>=15 ? 4 : exp>=10 ? 3 : exp>=6 ? 2 : exp>=3 ? 1 : 0
```

按平均每班 1.5 经验计算，单条路线约 7 个班次到 Lv3、14 个班次到 Lv5。每条路线每天只能结算一次，所以满级大约需要两周的现实游戏日。

### 2. 每日限制

| 路线 | 每日键 | 经验变量 | 等级变量 |
|---|---|---|---|
| 海风咖啡馆 | `$daily.mpJobCafe` | `$mpJobCafeExp` | `$mpJobCafeLevel` |
| 码头钓鱼 | `$daily.mpJobFish` | `$mpJobFishExp` | `$mpJobFishLevel` |
| 温泉桑拿 | `$daily.mpJobSpa` | `$mpJobSpaExp` | `$mpJobSpaLevel` |
| 河湾农场 | `$daily.mpJobFarm` | `$mpJobFarmExp` | `$mpJobFarmLevel` |
| 钟表铺学徒 | `$daily.mpJobClock` | `$mpJobClockExp` | `$mpJobClockLevel` |
| 孤儿院浆洗房 | `$daily.mpJobLaundry` | `$mpJobLaundryExp` | `$mpJobLaundryLevel` |

每条路线独立计算，理论上一天可以跑完六处，但每个班次消耗 14–20 分钟游戏时间，实际会被时间和体力自然限制。

### 3. 金钱

- `<<money>>` 单位是便士：`<<money 500>>` = £5。
- 所有工资先写入 `_pay`，再结算；没有硬编码的 `<<money 数字>>`。
- 成功班次的范围为 **£2–£15**；高等级高技能接近 £15，低等级约 £2–£5。
- 失败一律有代价：扣钱、损失工钱、损坏材料，或损失当天的作物；不存在失败白拿。

### 4. 里程碑

每条路线在 Lv3 触发一次 `claimUniqueReward(...)`，奖励一次性金钱 + 一个长期特权。调用前做了存在性保护：

```text
<<if window.dolmp && window.dolmp.claimUniqueReward && window.dolmp.claimUniqueReward("job_cafe_lv3")>>
```

里程碑在达到 Lv3 后的第一次班次结算时尝试领取，重复班次不会重复发放。

## 二、六条路线总表

| 路线 | 地点（outside） | 主检查 | 单次范围 | 风险 | Lv3 里程碑 |
|---|---|---|---|---:|---|
| 海风咖啡馆 | `cafe`（0） | tending / seduction | £2.60–£9.80 | 低–中 | `job_cafe_lv3` +£8 |
| 码头钓鱼 | `docks` / `searocks`（1） | `$athletics` / `$swimmingskill` / 等级+时段 | £2.40–£10.20 | 中 | `job_fish_lv3` +£6 |
| 温泉桑拿 | `spa`（0） | tending / beauty 或 seduction | £4.20–£15.00 | 中–高 | `job_spa_lv3` +£10 |
| 河湾农场 | `farm`（1） | physique / athletics / tending | £2.00–£15.00 | 中，跨天 | `job_farm_lv3` +£9 |
| 钟表铺学徒 | `high`（0） | maths / science / skulduggery | £7.06–£15.00 | 中–高 | `job_clock_lv3` +£12 |
| 孤儿院浆洗房 | `orphanage`（0） | housekeeping / english | £2.00–£6.70 | 低 | `job_laundry_lv3` +£4 |

技能阈值参照现有 mod 的写法：普通技能约 250–320，`$physique` 约 8000，`$beauty` 约 3000。

## 三、逐条路线

### 1. 海风咖啡馆（cafe）

- 入口 / Shift / Upgrade 均在室内，`$location` 为 `cafe`。
- 东家：Gwylan（只做氛围，不调用 `npcincr`）。

| 选择 | 检查 | 工资公式 | 失败代价 |
|---|---|---|---|
| 端盘穿过卡座 | tending ≥ 260 或 Lv≥3 | `320 + 70×Lv + floor(tending/6) + (Lv≥2 ? 60 : 0)` | −100 便士，stress +6，tiredness +2 |
| 替熟客调特调 | seduction ≥ 260 或 Lv≥3 | `360 + 80×Lv + floor(seduction/5) + (Lv≥2 ? 60 : 0)` | 同上 |
| 后厨擦杯备料 | 无检查 | `260 + 50×Lv` | 无失败；stress +1，tiredness +2 |

代表值：跑堂 Lv0/技能 260 ≈ £3.63，Lv5/技能 800 ≈ £8.63；吧台 Lv5 ≈ £9.80。

等级效果：

- Lv2：熟客开始点名，跑堂与吧台各 +60 便士。
- Lv3：免费咖啡（`$mpJobCafePerk`），里程碑 +£8。
- Lv4：后门钥匙（`$mpJobCafeKey`）。
- Lv5：固定熟客预约。

### 2. 码头钓鱼（docks / searocks）

- 入口与 Upgrade 在 `docks`，Shift 在 `searocks`，均为室外。
- 没有 `fishing` 技能，改用 `$athletics` / `$swimmingskill` + 天气 + 时段。
- `$mpJobFishCatch` 记录当天最后一趟鱼获的便士价值，入口与 Upgrade 会显示。

| 选择 | 检查 | 工资公式 | 失败代价 |
|---|---|---|---|
| 近岸撒网 | athletics ≥ 280；阴天 +40 难度；Lv≥4 可免检 | `300 + 60×Lv + floor(athletics/6) − (降水 ? 50 : 0)` | 网破，−100 便士，stress +5，tiredness +3 |
| 攀外礁下竿 | `$swimmingskill` ≥ 260 或 Lv≥4 | `480 + 70×Lv + floor($swimmingskill/5)` | 钩线被卷走，−150 便士，pain +2，stress +6 |
| 夜钓 / 刮鳞分筐 | 夜钓需 Lv≥3 且 `Time.dayState is "night"`；否则为无检查分鱼 | 夜钓 `620 + 80×Lv`；分鱼 `240 + 45×Lv` | 两项均无失败 |

代表值：撒网 Lv0 ≈ £3.46，Lv5 ≈ £7.33；外礁 Lv0 ≈ £5.32，Lv5 ≈ £9.90；夜钓 Lv3–5 ≈ £8.60–£10.20；分鱼 £2.40–£4.65。

等级效果：

- Lv3：加固竿（`$mpJobFishRod`），解锁夜钓，里程碑 +£6。
- Lv4：鱼贩留最好的摊位。
- Lv5：可借小船去外海。

### 3. 温泉桑拿（spa）

- 入口、Shift、Upgrade 均在室内，`$location` 为 `spa`。
- 东家：Jordan（氛围）。工资高，但成功也会累积 stress / tiredness。

| 选择 | 检查 | 工资公式 | 副作用 / 失败 |
|---|---|---|---|
| 替客人擦背递巾 | tending ≥ 280 或 Lv≥3 | `700 + 100×Lv + floor(tending/4) + (Lv≥4 ? 100 : 0)` | 成功 stress +4、tiredness +3；失败 −200 便士，stress +8 |
| 池边引位看水 | beauty ≥ 3000 或 seduction ≥ 280 或 Lv≥3 | `620 + 90×Lv + floor(max(beauty/100, seduction)/4) + (Lv≥4 ? 100 : 0)` | 成功 stress +3；失败 −200 便士，stress +8 |
| 清理蒸汽房与排水口 | 无检查 | `420 + 60×Lv` | tiredness +4，stress +2 |

代表值：擦背 Lv0 ≈ £7.70，Lv5/技能 800 = £15.00；引位 Lv0 ≈ £6.90，Lv5 ≈ £13.70；清理 £4.20–£7.20。这里的暧昧只写成“指尖多停了一瞬”一类试探，不写露骨内容。

等级效果：

- Lv3：私汤值班（`$mpJobSpaPrivate`），里程碑 +£10。
- Lv4：固定客人（`$mpJobSpaRegular`），擦背与引位各 +100 便士。
- Lv5：值班钥匙。

### 4. 河湾农场（farm）

- 入口、Shift、Upgrade 均在室外，`$location` 为 `farm`。
- 东家：Alex（氛围）。
- 跨天状态：

| 变量 | 含义 |
|---|---|
| `$mpJobFarmPlantedDay` | 播种当天的 `Time.days`；0 表示空地 |
| `$mpJobFarmPlots` | 畦数：Lv0–1 为 1，Lv2–3 为 2，Lv4–5 为 3 |
| `$mpJobFarmGrowth` | 每次浇水 +1，用于叙事与进度显示；收割门槛只看日期 |

流程：

1. 空地时选择「翻土播种」，成功则设置 `plantedDay = 今天`、`plots`、`growth = 0`。
2. 当天或之后可以「浇水培土」，`growth +1`；雨天自动成功。
3. 只要 `今天 > plantedDay`，就会出现「开镰收割」。
4. 收割成功或失败都会清空 `plantedDay` 与 `growth`，回到空地，开始下一轮。

| 选择 | 检查 | 工资公式 | 失败代价 |
|---|---|---|---|
| 翻土播种 | physique ≥ 8000 或 tending ≥ 280 或 Lv≥4 | `220 + 40×Lv` | 无工资，stress +6，tiredness +5；地仍为空 |
| 浇水培土 | 雨天自动成功；否则 physique ≥ 8000 或 tending ≥ 280 或 Lv≥4 | `200 + 35×Lv`，growth +1 | 无工资，stress +4，tiredness +3 |
| 开镰收割 | athletics ≥ 300 或 Lv≥4 | `min(1500, plots×(300 + 70×Lv) + floor(athletics/5) − (雨天 ? 80 : 0))` | 作物被踩毁，无工资，stress +8，tiredness +4 |
| 搬草料修篱笆 | 无检查 | `280 + 50×Lv` | 无失败；tiredness +3，stress +1 |

代表值：播种 £2.20–£4.20；浇水 £2.00–£3.75；收割 Lv0/1 畦 ≈ £3.60，Lv3/2 畦 ≈ £11.00，Lv5/3 畦触顶 £15.00；杂活 £2.80–£5.30。收割有 £15 硬封顶，避免一次给几万。

天气：降水时浇水免检；收割减 80 便士。等级不会让作物腐烂，玩家可以隔几天再收，适合长期循环。

等级效果：

- Lv2：两畦。
- Lv3：温室（`$mpJobFarmGreenhouse`），里程碑 +£9。
- Lv4：三畦，排水更好。
- Lv5：轮作，收成稳定。

### 5. 钟表铺学徒（high）

- 入口、Shift、Upgrade 均在室内，`$location` 为 `high`。
- Sera 的钟表铺；表芯成功时 `npcincr Sera trust 1`（受 `$NPCNameList.includes("Sera")` 保护）。

| 选择 | 检查 | 工资公式 | 失败代价 |
|---|---|---|---|
| 拆洗表芯重装摆轮 | maths ≥ 280 或 Lv≥4 | `650 + 110×Lv + floor(maths/5)` | 零件报废，−200 便士，stress +5 |
| 校准齿轮与擒纵叉 | science ≥ 300 或 Lv≥4 | `700 + 110×Lv + floor(science/5)` | 崩齿，−200 便士，stress +5 |
| 拆旧壳取可用零件 | skulduggery ≥ 320 或 Lv≥4 | `min(1500, 820 + 110×Lv + floor(skulduggery/5))` | 划伤夹板，−250 便士，pain +3，stress +6 |

代表值：表芯 £7.06–£13.60；齿轮 £7.60–£14.10；拆件 £8.84–£15.00。三条都有检查，没有无风险选项，符合“高薪高风险”。

等级效果：

- Lv3：委托权（`$mpJobClockCommission`），里程碑 +£12。
- Lv4：名表与复杂机芯（`$mpJobClockHighEnd`）。
- Lv5：与 Sera 署名合伙（`$mpJobClockPartner`）。

### 6. 孤儿院浆洗房 / 旧书摊装订（orphanage）

- 入口、Shift、Upgrade 均在室内，`$location` 为 `orphanage`。
- Robin 在入口与熨烫成功时出现；成功时 `npcincr Robin love 1`（受 `$NPCNameList.includes("Robin")` 保护）。
- 低风险、低薪，适合作为早期路线。

| 选择 | 检查 | 工资公式 | 失败代价 |
|---|---|---|---|
| 熨烫床单与桌布 | housekeeping ≥ 250 或 Lv≥3 | `240 + 45×Lv + floor(housekeeping/6)` | 焦痕，−60 便士，stress +3 |
| 装订脱线的旧书 | english ≥ 260 或 Lv≥3 | `260 + 50×Lv + floor(english/5)` | 书脊勒裂，−60 便士，stress +3 |
| 送浆洗好的床单 | 无检查 | `200 + 35×Lv` | 无失败；tiredness +2 |

代表值：熨烫 £2.81–£5.98；装订 £3.12–£6.70；送单 £2.00–£3.75。成功熨烫额外 `stress −1`。

等级效果：

- Lv2：孤儿院浆洗折扣（`$mpJobLaundryDiscount`）。
- Lv3：装订台钥匙（`$mpJobLaundryBench`），里程碑 +£4。
- Lv4：能偷偷藏下一本待修的旧书（`$mpJobLaundryBook`）。
- Lv5：旧书摊装订委托归你经手。

## 四、节奏与平衡

| 阶段 | 推荐路线 | 单次收入 | 作用 |
|---|---|---:|---|
| 早期（1–4 周） | 浆洗房、咖啡馆、码头分鱼 | £2–£6 | 稳定付房租，低失败成本 |
| 中期（5–12 周） | 咖啡馆 Lv3+、农场、桑拿 | £5–£12 | 技能变现，开始跨天经营 |
| 后期（13 周+） | 钟表铺、桑拿 Lv5、农场三畦 | £7–£15 | 高技能高回报，仍受每日与体力限制 |

对照基础包锚点：码头正式工 £15/h、农场一个工作日 £30–£45。本组班次 14–20 分钟给 £2–£15，按小时折算与基础包同一量级；高等级钟表/桑拿偏高，但要求 maths/science/tending 达到 280–300 以上，属于后期技能回报。

防通胀手段：

- 每条路线每天一次。
- 每次班次消耗 14–20 分钟游戏时间。
- 里程碑只发一次。
- 收割与拆件设 £15 硬封顶。
- 失败扣钱、损坏作物或零件，长期收益取决于稳定成功。

## 五、地点与图标

- 地点：`cafe`、`docks`、`searocks`、`farm`、`orphanage` 已有 `mpAmbient` case；`spa` 由后续补 case；`town`、`high` 走 `mpAmbient` 的 default 兜底。
- 图标只使用白名单：`investigateicon`、`sneakicon`、`socialiseicon`、`runicon`、`walkicon`、`getouticon`、`templeicon`、`shopicon`、`brothelicon`、`swimicon`、`beachicon`、`parkicon`、`caveicon`、`tendingicon`、`bedicon`。本文件实际使用 12 个，未使用 `workicon` / `athleticicon`。
- 返回：各路线回 `MP Livelihood Hub`；告示板回基础包 `High Street`。

自检结果见 `docs/livelihoods-selfcheck.md`。
