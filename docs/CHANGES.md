# CHANGES.md — Workpack v33（Argon 任务 V33：吃透原版，重做零工线）

## 一、核心交付概览

本次迭代严格按照《`ARGON_TASK_V33.md`》、《`MOD_DESIGN_STANDARDS.md`》与《`VANILLA_STUDY_GUIDE.md`》分三阶段完成：

1. **阶段一：原版深度拆解（`VANILLA_DESIGN_NOTES.md`）**
   - 对 `vanilla/vanilla-passages.twee`（**16,087** 个原版段落）与 `ModI18N-0.5.12.13-chs` 进行全量实证拆解，系统整理了 **10 大维度**：
     1. 核心循环（`Time.dayState` 时段划分、`<<pass>>` 分布统计、1 小时标准工作切片、事件触发三时机）
     2. 地点与解锁（40 个 `$location` 域、求职 Intro 门控、打烊 `Lock` 撬锁门控、衣着/暴露状态门控、声望进度门控）
     3. 原版 6 大生计全流程（`Ocean Breeze Work`、`Docks Work`、`Spa Work Start`、`Farm Work`、`Office Agency`、`Strip Club / Brothel`）
     4. NPC 作息与 `<<cleareventpool>>` / `<<addinlineevent>>` 权重池机制、`$daily`（189 个独立日键）与一次性键
     5. 选项设计（尾缀难度标签、硬状态阻断、`<<skulduggeryrequired>>` 字母等级反馈、失败零发奖铁律）
     6. 经济物价锚点（便士内部单位、`<<tipset "serving">>` 多因子小费公式、贝利周租阶梯）
     7. 属性与检定（0–1000 技能标尺、`F` 至 `S` 字母等级映射、原版工作技能微幅成长公式）
     8. 关系系统（32 名具名 NPC 的 `setup.loveAlias` 专属好感别名、`±1~2` 微幅递进、非数字外显）
     9. 状态与存档（`setup.*` 静态层、`$daily.*` 跨日层、`$*` 持久层與 `_temp` 局部层）
     10. 文案与 UI（4–8 字动作标签、单页 `<= 5` 选项密度、具象物象叙事）

2. **阶段二：十二条零工重做蓝图（`JOB_REDESIGN_PLAN.md`）**
   - 为 **6 条主零工**（咖啡馆 `Cafe`、海礁鱼档 `Fish`、温泉桑拿 `Spa`、河湾农场 `Farm`、高街钟表铺 `Clock`、孤儿院浆洗房 `Laundry`）与 **6 条扩展零工**（石炉面包房 `Bakery`、高街裁缝铺 `Tailor`、街巷跑腿行 `Courier`、酒馆后厨 `PubKitchen`、农场马厩 `Stable`、近海渔船 `Trawler`）制定了完整重做规范：
     - **真实街区入口直挂与营业时段门控**：12 家店铺全部挂载到对应原版街区，非营业时段统一走 `MP NotNow` 温和拦截。
     - **跨店供应链闭环**：农场红麦/香草 → 咖啡馆/面包房/桑拿/马厩；海礁鱼档/拖网渔船 → 咖啡馆/酒馆后厨；孤儿院浆洗房 → 桑拿房/裁缝铺；跑腿行 → 钟表铺急件。
     - **样板级细案**：重点给出 **海礁鱼档（`MP Job Fish`）** 与 **温泉桑拿房（`MP Job Spa`）** 的完整场景、常驻人物、班次动作、本店专属当班插曲、三次记过与消过闭环。

3. **阶段三：代码实现与全库精修（`mod-src/`）**
   - **修复 `mp-livelihoods.twee` 结算页断链隐患**：原 `v33` 草稿中 6 条主零工的 `MP Job * Settle` 在班次成功（`$mpJobResultPay > 0`）时漏掉了底部离开/返回链接，现已补齐完整的 `查看账册/排班`、`返回岗位` 与 `离开返回原版地点` 导航闭环。
   - **落地鱼档与桑拿房样板级当班插曲（`MP Job Fish Encounter` / `MP Job Spa Encounter`）**：
     - 鱼档收秤后触发【港务巡检员铜秤验冰腮】互动情境（可选 **掀开底冰验腮**、**递上烤鱼干搭话**、**低头安分添碎冰**）；
     - 桑拿房收班后触发【二号私汤贵客挑剔粗海盐】互动情境（可选 **兑温牛乳化盐**、**点甜橙香安抚**、**换上烘暖浴巾**）。
   - **激活“硬门槛 + 学徒概率检定 + 失败记过”完整闭环**：
     - 12 条零工的进阶岗位对纯新手（技能 `< 180` 且未达资深阶段）通过 `MP Insufficient` 提示所需字母等级；对初学阶段（`180 <= 技能 < 精通线`）开放排班并执行真实检定，使失败分支、三次记过（`Strike`）与消过补救（`MP Job Punishment *` / `Remedy`）真正可触发、可游玩。
     - 将 `mp-livelihoods.twee` 中所有里程碑首通奖励 `claimUniqueReward("job_*_lv3*")` 严格移入 `<<if _ok>>` 成功分支内部，杜绝失败班次误发里程碑奖励。
     - 为 `MP Job Clock Shift` 新增零门槛学徒保底项 `[[擦拭展柜摆钟 (0:15)|MP Job Clock Settle]]`，防止低属性玩家进入钟表铺无活可干。
   - **彻底清零裸露等级数字**：移除 `mp-livelihoods.twee` 中全部 14 处 `"或 咖啡馆等级 3"` / `"或 钓鱼等级 4"` 等生硬字样，替换为叙事化资历描述（如 `"（或已在吧台独当一面）"`、`"（或已掌管外海舢板）"`、`"（或已掌管私汤铜钥）"`）。
   - **打工技能成长与跨店供货分红实装**：所有 12 条零工班次成功时同步给予原版对应技能成长（`<<tending>>`、`<<housekeeping>>`、`<<athletics>>`、`<<swimmingskill>>`、`<<mathsskill>>`、`<<scienceskill>>`、`<<englishskill>>`、`<<skulduggery>>`）及跨店供货加薪。
   - **12 条零工真实地点挂载（`scripts/mp.js`）**：扩展 `LIVELIHOOD_HOOKS`，将 6 条扩展零工直接挂载至 `Harvest Street`、`High Street`、`Connudatus Street`、`Pub`、`Farmland`、`Docks`，支持同地点多工种并列展示与非营业时段 `MP NotNow` 分流；同时将 `MP Extra Jobs Hub` 拆分为街铺与郊外两页（每页 `<= 5` 选项）。
   - **同步合入 V32 全部质量修复**：
     - 修复 `mp-job-punishment.twee` 中 37 处 `MP Insufficient` 分支耗时与 `(0:XX)` 标签；
     - 修复 `MP World Event Hospital Night Inspect` 检定条件；
     - 全库 72 个 `.twee` 文件（**2,197** 个段落）完成图标外提去重与零图标补齐，实现 **0 重复图标、0 超 4 图标段落、0 断链、0 语法栈失衡**。
