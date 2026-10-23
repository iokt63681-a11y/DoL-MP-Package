# 零工伙伴关系线

日期：2026-10-23

文件：`mod-src/twees/mp-job-npc-lines.twee`

## 内容

5 位零工伙伴 × 3–4 段，共 17 个 passage：

- 格威岚（鱼档）：被割破的网 → 夜潮外的防水袋 → 分账
- 塞拉（钟表铺）：无主怀表 → 玛拉的名字 → 旧维修簿
- Alex（农场）：旧佃租收据 → 旧水渠 → 第一捆麦
- 约旦（温泉）：祷词卡 → 池边登记 → 关池之后
- 罗宾（浆洗房）：陌生白衬衫 → 缝在衣里的收据 → 玛拉留下的衣服

## 解锁

在 `mp.js` 的 `JOB_NPC_HOOKS` 里按零工等级解锁：

- 鱼档 Lv2 → 格威岚
- 钟表 Lv2 → 塞拉
- 农场 Lv2 → Alex
- 桑拿 Lv2 → 约旦
- 浆洗 Lv2 → 罗宾

入口只会在对应地点出现（Docks / Sea Rocks、High Street、Farmland、Spa、Orphanage）。

## 设计

- 每段 2–3 个选择，至少 1 个技能/属性门槛
- 失败有 pain / stress / 失去线索等代价
- 奖励 £1.50–£7，属于小额关系线，不替代零工收入
- 关系增量用 `npcincr`，全部有 `$NPCName && $NPCNameList.includes(...)` 保护
- 不写 explicit sexual content；保持 DoL 的暧昧、疲惫、熟人之间的试探

## 自检

- passage 17，重名 0
- 断链 0
- `$outside` / `$location` 17/17
- 宏闭合 0 错误
- 图标全部已注册（`tendingicon` 已映射到 `heart`）
- 入口 hook 60 个 passage 引用全部存在
- `node --check mod-src/scripts/mp.js` 通过

## 待实机

- 零工 Lv2 后入口是否在对应地点正常出现
- 各线第 3/4 段结束后 hook 是否正确消失
- 关系增量是否落在可用的 NPC 上
