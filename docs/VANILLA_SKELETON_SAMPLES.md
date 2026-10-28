# 原版骨架样例（`vanilla-passages.twee` 原文节选）

> 这些是标准答案。写新页前先读一遍，尤其是 `Ocean Breeze Work` 和 `Ocean Breeze Plates`。

---

## 1. 地点页：`Ocean Breeze`

```twee
<<set $outside to 0>><<set $location to "cafe">><<effects>>
<<if $oceanbreezejob>><<timeTrackingEndCafe>><</if>>
You are in the Ocean Breeze Cafe.
<<if Time.openingHours()>>
	<<if Weather.precipitation is "rain">>
		No one is sitting outside due to the rain, but the cafe proper is crowded.
	<<elseif Weather.isFreezing>>
		...
	<<else>>
		The cafe is busy, and despite the strong winds some people are sitting outside.
	<</if>>
<</if>>
...
<<link [[Work as a waiter (1:00)|Ocean Breeze Work]]>><<set $phase to 0>><</link>>
```

要点：
- 场景描述只有 1–2 句，天气/时段决定变体。
- 动作是 `Work as a waiter (1:00)`，不是「接一个服务生班次（0:15）」。
- 没有「表层/中层/深层」。

---

## 2. 班次页：`Ocean Breeze Work`

```twee
<<set $outside to 0>><<set $location to "cafe">><<effects>>
<<set C.npc.Sam.love = Math.clamp(C.npc.Sam.love, -50, 50)>>

<<if ...gwylan 条件...>>
	...条件插曲：Gwylan 的海鸥盘...
	<<link [[Take it to him|Ocean Breeze Gwylan Juice]]><</link>>
<<else>>
	<<cleareventpool>>
	<<if !$weekly.robinCafeVisit and ...>>
		<<addinlineevent "robin_cafe_gwylan" 4>>
			...Robin 来店...
		<</addinlineevent>>
	<</if>>
	...更多 addinlineevent...
	<<runeventpool>>
<</if>>
```

要点：
- 进入班次后**先处理条件插曲**，再抽事件池。
- 事件池条目里直接写场景和选项，不跳独立页。
- 插曲的选项没有时间标签（`Take it to him`），因为时间由班次统一结算。

---

## 3. 事件结果：`Ocean Breeze Plates`

```twee
<<wearProp "tray">>
<<if $phase is 0>>
	It takes a few minutes, but you manage to get everything to the table.
	<<waiter_default>>
<<elseif $phase is 1>>
	<<if $danceSuccess>>
		<<set $tipmod to 0.2>><<tipset "serving">>
		...balance them on your shoulders...
		<span class="green">You manage to get everything to the table in one piece.</span>
		<<npc Sam>><<person1>>Sam gives you a thumbs-up...<<npcincr Sam love 1>>
	<<else>>
		...and accidentally dump several plates' worth of food onto the floor.
		Sam gives you a disapproving look.<<npcincr Sam love -1>><<llove Sam>><<stress 6>>
	<</if>>
<</if>>
<<pass 1 hour>>
<<link [[Next|Ocean Breeze]]>><<endevent>><</link>>
```

要点：
- 结果就在这一页，最后统一 `<<pass 1 hour>>` + `Next`。
- 没有「结算页」，没有「返回任务 Hub」。

---

## 4. 同一动作的多档结果：`Docks Work`

```twee
<<if $phase is 0>>
	You work hard. It's
	<<if $docks.dayType is "busy">>exhausting.<<physique 6>>
	<<elseif $docks.dayType is "slow">>a slow day...<<physique 2>>
	<<else>>tiring.<<physique 4>><</if>>
<<elseif $phase is 1>>
	You do as little work as you can get away with.
	<<set _daily_slacked to ...>>
	<<if $docks.status gte 80>>
		...colleagues cover for you...
	<<elseif $docks.status gte 60>>
		...let it slide...
	<</if>>
<</if>>
```

要点：
- 同一天的工况（`$docks.dayType`）决定同一动作的结果。
- 工友关系（`$docks.status`）直接变成容错率，不是「声望等级 +1」。

---

## 5. 动作选择：`Docks Options`

```twee
<<link [[Work hard (1:00)|Docks Work]]>><<set $phase to 0>><</link>>
<<link [[Slack off (1:00)|Docks Work]]>><<set $phase to 1>><</link>>
```

要点：
- 两个动作，各 1 小时，进同一个结果页，用 `$phase` 分档。
- 不需要为「努力/摸鱼」各写一个 Result 页。

---

## 6. 总结成一句话

**地点给动作 → 动作进班次/场景 → 场景里抽事件 → 结果写在动作里 → 一小时过去，回地点。**

没有任务 Hub，没有 Quest 链，没有 Result 中转页。
