# 给 Argon 的下一批任务（v4 接手后）

当前源码：36 个 twee，1224 个 passage。你上一批的 4 个文件已经接入 `boot.json`，hub 也接好了。

## 本批目标

优先把已有内容补齐、清理旧结构，约 100 段。

### A. 6 条新零工补齐季节/失败/随机事件（约 54 段）

文件：`mp-job-extra-parity.twee`

已有 6 条新路线：面包房、裁缝铺、跑腿邮差、酒馆后厨、马厩驮运、近海渔船（`mp-job-extra-routes.twee`）。

请补：

1. 每条 3 个季节/节日插入事件（雨/冬/节日），共 18 段；用 `<<include>>` 命名 `MP Job Seasonal Bakery Rain` 等。
2. 每条 3 级失败过渡，共 18 段；命名 `MP Job Failure Bakery 1/2/3` 等。
3. 每条 3 个成功随机小事件，共 18 段；命名 `MP Job Random Bakery 1/2/3` 等。

要求：
- 不显示 Lv/等级/经验；进度用叙事。
- 失败不扣现有钱；只当班没有工钱 + stress/tiredness。
- 每段 200~400 汉字，DoL 第二人称；不要模板句。
- 保留现有 `$mpJobBakeryCount` 等进度变量，不要改旧路线正文。

### B. 旧内容清理（约 46~60 段）

1. `mp-new-regions.twee` 剩余 57 个入口/Scout/Ask/Rest 节点：去掉“一个动作 + 自动判定”的旧结构，改成 2~3 个自然动作；地点选项在上，动作在下。
2. `mp-mansion-avery-1.twee`：旧式“选项写结果”的标签改成动作标签；失败不要只写“被划伤/被撞见”。
3. `mp-soft-bad-ends.twee`：5 处软坏结局保留，但把过于游戏化的“逃脱进度”文案改成具体动作和代价。
4. `mp-new-npcs.twee` 里诺艾尔/阿什/Sera/Monet 的“第 N 阶段”总结式任务段落，改成每阶段一小段具体场景；不要写“共同推进『任务名』”。

### C. 3 个小节日或 6 段区域事件（可选，约 15~20 段）

如果 A/B 提前完成，再补：
- 3 个小型节令（不一定要 5 段，3 段即可）：春分、夏至后夜、初雪。
- 或 6 段区域事件，保持 1 段 1 瞬间、必含检查、失败不扣钱。

## 硬规则

1. 一个 passage 只写一个瞬间；多步骤拆 passage。
2. 选项写动作，不写结果；链接标签不超过 12 个汉字。
3. 每个 passage 开头 `$outside` / `$location`，加 `[nobr]`。
4. 返回目标必须存在；用 python 对照本体 HTML + 所有 mod twee。
5. 有检查就有成功/失败和后果；失败不扣现有钱。
6. `<<money 1200>>` = £12；一次性奖励用 `claimUniqueReward`。
7. 不显示 Lv/等级/经验；不写“共同推进『任务名』”。
8. 图标只用已注册；`$mpKnown` key 必须和 new-regions 对齐。
9. 地点选项放动作选项上面；NPC hub 不要每个选项都顶图标。
10. 不要写 explicit sexual content；可以写暧昧、紧张、疲惫、温柔。

## 输出

1. `mp-job-extra-parity.twee`
2. 旧内容清理直接改对应文件（如果范围太大，先交 `mp-new-regions` 剩余 57 节点）
3. `manifest.md`：文件、passage 数、检查数、入口
4. `selfcheck.md`：断链、outside/location、宏闭合、未注册图标、Lv、失败扣钱、重复句

## 验收

- 断链 0、宏闭合 0
- 每段 `$outside` / `$location` / `[nobr]`
- 没有 Lv/等级/经验
- 没有失败扣存款
- 新内容可从入口 BFS 到达
- `boot.json` 不在本批修改范围；hub 留好，由集成方接线
