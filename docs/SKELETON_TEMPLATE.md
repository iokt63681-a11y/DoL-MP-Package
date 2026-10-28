# 骨架模板（照着原版写）

> 唯一标准：`reference/dolwiki_en/` + `docs/VANILLA_SKELETON_SAMPLES.md`。
> 目标不是「再加门槛」，而是把页面形状改成 DoL 的形状。

---

## 1. 地点页（街道/店铺/林地入口）

**形状**：1–3 句场景 + 条件插入的 1 句 NPC/天气 + 3–6 个动作。

```twee
:: MP Loc Forest Edge [nobr]
<<set $outside to 1>><<set $location to "forest">><<effects>><<mpAmbient>>
界石上的铜牌被露水打得发亮，三根布条朝三个方向垂着。阿什蹲在火塘边削一根新桩，猎犬趴在他脚边。
<<if Weather.precipitation is "rain">>雨把林道浇得发软，脚印一踩一个坑。<<else>>松脂味很重，风从北面翻过来。<</if>>
<br><br>
<<getouticon>><<link [[回镇上 (0:05)|Forest]]>><<pass 5>><</link>><br>
<<walkicon>><<link [[沿猎径走 (0:10)|MP Loc Forest Trail]]>><<pass 10>><</link>><br>
<<link [[跟阿什巡一段 (1:00)|MP Loc Forest Patrol Shift]]>><<pass 60>><</link>><br>
<<if (Time.hour gte 18 or Time.hour lt 6)>><<sneakicon>><<link [[摸黑进雾谷 (0:15)|MP Loc Forest Fog Valley]]>><<pass 15>><</link>><br><</if>>
```

**禁止**：
- 「探索表层 / 深入中层 / 潜入深层」这类层级按钮。
- 「查看四季活动 / 查看季节钩子 / 更多日常」这类功能索引。
- 一屏 7 个以上动作。

---

## 2. 班次页（工作/巡林/守夜）

**形状**：进入即 1 小时；先条件插曲，再事件池；结果内嵌；结束 `<<pass 1 hour>>` 回地点。

```twee
:: MP Loc Forest Patrol Shift [nobr]
<<set $outside to 1>><<set $location to "forest">><<effects>><<mpAmbient>>
<<cleareventpool>>
<<if Time.season is "winter" and !$daily.forestSnowTrack>>
	<<set $daily.forestSnowTrack to 1>>
	<<addinlineevent "forest_snow" 2>>
		雪把旧脚印盖住了，只有界桩边有一串新的。阿什蹲下去比了比深浅。
		<br><br>
		<<link [[跟上去 (0:05)|MP Loc Forest Track Snow]]>><<pass 5>><</link>>　
		<<link [[先记下来 (0:05)|MP Loc Forest Log Track]]>><<pass 5>><</link>>
	<</addinlineevent>>
<</if>>
<<addinlineevent "forest_quiet" 3>>
	这一段林道很静，只有锯木声从远处传来。你跟着阿什把倒木挪开，顺手补了两处路标。
	<br><br>
	<<link [[继续巡 (1:00)|MP Loc Forest Patrol Shift]]>><<pass 60>><</link>>　
	<<link [[收工回去 (0:05)|MP Loc Forest Edge]]>><<pass 5>><</link>>
<</addinlineevent>>
<<addinlineevent "forest_boar" 2>>
	灌木里传来一阵急促的拱土声。阿什抬手让你停下。
	<br><br>
	<<link [[绕开它 (0:10)|MP Loc Forest Boar Detour]]>><<pass 10>><</link>>　
	<<link [[敲树干惊走 (0:05)|MP Loc Forest Boar Scare]]>><<pass 5>><</link>>
<</addinlineevent>>
<<runeventpool>>
```

**规则**：
- 一个班次 = 一次 `<<pass 60>>` 或 `<<pass 1 hour>>`。
- 事件池至少 3 条常态 + 1 条条件事件。
- 每条事件的选项是动作，结果写在选项里或下一页，但**不叫 Result**。
- 班次结束回地点页，不堆「结算页」。

---

## 3. 场景页（NPC 门槛场景 / 地点特殊事件）

**形状**：1–3 句 + 2–4 个动作；结果内嵌；做完回地点。

```twee
:: MP NPC Ash Ember Night [nobr]
<<set $outside to 1>><<set $location to "forest">><<effects>><<mpAmbient>><<mpInitNpcAsh>>
北坡的石塔下堆着去年没烧完的松柴。阿什把油布册摊在膝头，翻到夹着余烬页的那一页，指给你看。
<br><br>
<<getouticon>><<link [[回火塘 (0:05)|MP NPC Ash Deep Hub]]>><<pass 5>><</link>><br>
<<link [[替他把火续上 (0:15)|MP NPC Ash Ember Night Keep]]>><<pass 15>><<if (_npc.emberPages or 0) gte $need>><<set _npc.deepStage to Math.max(_npc.deepStage or 0, 1)>><<set _npc.nextStepDay to Time.days + 1>><<stress -3>><<else>><<set _npc.setback to Time.days + 1>><<stress 4>><</if>><</link>><br>
<<link [[先翻完这一页 (0:10)|MP NPC Ash Ember Night Read]]>><<pass 10>><</link>>
```

**NPC 的「任务」不是 Quest 1..5**：
- 关系值 + 收集物决定**哪些场景出现**。
- 场景之间没有「下一步」按钮；只有「今天他在这里，做这件事」。
- 推进靠 `nextStepDay` 与收集物，不靠点任务链。

---

## 4. 失败与时间

| 动作 | 时间 |
| --- | --- |
| 工作/巡林/守夜一班 | 1:00 |
| 街区移动 | 0:05 |
| 店内短动作 | 0:10–0:20 |
| 吃饭/洗澡 | 0:20–0:30 |

- 普通失败：扣资源/钱/关系 + `$daily.failKey = 1`，当天同一动作直接给失败提示；**不锁两天**。
- 严重失败：`setback = Time.days + 1`，只锁一天。
- 失败不发钱、不发线索。

---

## 5. 选项文案

- 4–8 个汉字，动作开头。
- 不写系统名词（进度/阶段/台账/结算/勘查阶数）。
- 不写「你可以……也可以……」的引导句；用场景把选项逼出来。
- 时间标签只给班次和移动；店内动作可以不带。

---

## 6. 事件池写法（照原版）

```twee
<<cleareventpool>>
<<addinlineevent "id" 3>> ... <</addinlineevent>>
<<if 条件>><<addinlineevent "conditional" 2>> ... <</addinlineevent>><</if>>
<<runeventpool>>
```

不要用 `<<if random(1,100)>>` 在 Hub 顶部硬弹；事件属于班次/场景。
