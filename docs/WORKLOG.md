## 2026-10-29 同步进 DoL-MP-Package-GitHub

- 已完成：
  - 工作区切到 `DoL-MP-Package-GitHub`（保留 `origin` / `main`）
  - Handoff `source/mod-src` **镜像** → `mod-src`（boot **dev46**；twees 167）
  - Handoff `docs` / `tools` / `prompts` / `.cursor` 合并拷入（不删 Package 独有 docs）
  - 交接文档路径改为 `mod-src`（不再写 `source/mod-src`）
- 改动文件：大量（约 179 porcelain 行）；未 commit、未 push
- 检查结果：`skeleton_check mod-src` → Deep Quest 0；Result 0；shift缺pass60 0；池 12
- 已 commit + push：`2e0773f` → `origin/main`
- 未完成 / 下一步：森林节日 After 内嵌（先 Spring）

## 2026-10-29 班次 pass 60 清零

- 已完成：
  - 12 个 `MP Job * Shift`：班内动作 `<<pass 14–18>>` 改为 `<<pass 60>>`，选项时标改为 `(1:00)`；Hub 进班文案同步；extra 六职进班去掉多余 `pass 3`
  - 误报短事件改名（不再被算作 Shift/Work）：
    - `MP Street Event Work` → `Dayhire`（twee + `mp.js`）
    - `MP Event Cafe Work` → `Helping`
    - `MP Mansion Kitchen SculleryShift` → `Scullery Duty`
  - 骨架：**shift without pass 60 = 0**（原 15）
- 改动文件：`mp-livelihoods.twee`、`mp-job-extra-routes.twee`、`mp-extra-instant-events.twee`、`mp-locations.twee`、`mp-mansion-avery-1.twee`、`scripts/mp.js`；docs
- 新增/删除 passage：3 个改名（无删页）
- 检查结果：Deep Quest 0；Result 0；shift缺pass60 **0**；池 12；render/pilots/style/audit 0
- 未完成 / 下一步：
  - After 内嵌去中转（森林节日等，宜小步）
  - 或发版升 version

## 2026-10-29 Result 清零 + 长线终局硬门槛 + 删 _v51_

- 已完成：
  - 全库 `* Result` 命名页 **157→0**：无冲突改 `* After`；6 个 NPC `Festival Result`（与已有 After 撞名）改 `* Festival Resolve`
  - 删 `tools/_v51_*.py`（7 个临时脚本）
  - 行会 `MP Guild Bloc Overview`：终局需四帮席位合计≥20或行会声望≥10，且 £2.00 底金或已立法案；未达标给议桌链保 ≥2 选项
  - 神殿裂缝 `MP Temple Factions`：终局需仪轨≥3、恩典≥5或£2.00，且无仪轨冷却
- 改动文件：30+ twee（Result 重命名）；`mp-guild-assembly.twee`；`mp-temple-schism.twee`；docs；删 `tools/_v51_*.py`
- 新增/删除 passage：无新增；157 个 Result 更名（6 为 Resolve，余为 After）
- 检查结果（五个脚本摘要）：
  - `skeleton_check`：Deep Quest 0；**Result 0**；池 12；HUB>6 = 0
  - `check_render`：OPTION/ICON/PROSE count 0
  - `verify_pilots`：0
  - `audit_standalone`：macro 0；broken MP links 0
  - `check_render_style`：0
- 未完成 / 下一步：
  - **V51 可选收尾已齐**；若再开刀：班次页补 `pass 60`、地点 Event 内嵌结果（真正取消 After 中转）、发版升 version

## 2026-10-29 码头门槛 + More/Festival Hub≤6

- 已完成：
  - **码头**：`MP Deep Docks Deep` / `Deep Upgrade` 定局改 `$mpDocksShifts gte 5` + 无整顿；去掉船体三阶/信赖/船工认可旁路；正文「工头只认港务满五班」；disabled 同步；Deep 也可直接落印（与 Hub「在干船坞定局」同形）
  - **Forest More Hub**：9→6（事件 11/12 下沉 More2 Trail/Deep；当季林活并入 More2 Hub）
  - **HighStreet More Hub**：9→6（事件 11/12 下沉 More2 Front/Rear；换季清点并入 More2 Hub）
  - **HighStreet Festival Hub**：10→6（四季各一条链进季节页，由页内分流回看；去掉 Result 双链）
- 改动文件：
  - `source/mod-src/twees/mp-docks-depth.twee`
  - `source/mod-src/twees/mp-loc-forest-more.twee` / `mp-loc-forest-more2.twee`
  - `source/mod-src/twees/mp-loc-highstreet-more.twee` / `mp-loc-highstreet-more2.twee`
  - `source/mod-src/twees/mp-loc-highstreet-festival.twee`
  - `docs/WORKLOG.md` / `PROJECT_STATE.md` / `HANDOFF_V51_CONTINUE.md` / `CONTINUE_PROMPT.md`
- 新增/删除 passage：无
- 检查结果（五个脚本摘要）：
  - `skeleton_check`：Deep Quest 0；Result 157；池 12；**HUB>6 = 0**
  - `check_render`：OPTION/ICON/PROSE count 0
  - `verify_pilots`：0
  - `audit_standalone`：macro 0；broken MP links 0
  - `check_render_style`：0
- 未完成 / 下一步：
  - 地点 Event/Festival `* Result` 再降（157）
  - 删 `tools/_v51_*.py`；行会/神殿裂缝终局硬门槛（可选）

## 2026-10-29 神殿结局门槛对齐

- 已完成：
  - `MP Loc Temple Deep` 定局门槛改为与森林/高街同形：`$mpTempleShifts gte 5` + 无失仪整顿；去掉 `mpLocEvents_Temple gte 3` 旁路
  - 正文补一句「管仪修士只认殿务满五班」；disabled 文案同步为「需殿务满五班且无失仪整顿」
  - Hub「在铜牌前定局」本就读 shifts≥5，与 Deep 一致
- 改动文件：`source/mod-src/twees/mp-loc-temple.twee`；`docs/WORKLOG.md`；交接/状态/CONTINUE_PROMPT
- 新增/删除 passage：无
- 检查结果（五个脚本摘要）：
  - `skeleton_check`：Deep Quest 0；Result 157；event pool 12；HUB>6 仍仅 More/Festival
  - `check_render`：OPTION/ICON/PROSE count 0
  - `verify_pilots`：0
  - `audit_standalone`：macro 0；broken MP links 0（既有 DUP/write-only/zeroin 未因本刀新增）
  - `check_render_style`：render style problems 0
- 未完成 / 下一步：
  - **码头**结局门槛对齐（Deep Upgrade 现船体阶+信赖，改绑 `$mpDocksShifts gte 5`）
  - More/Festival Hub 收 ≤6；Event/Festival Result 再降；删 `_v51_*.py`

## 2026-10-29 高街结局门槛对齐

- 已完成：
  - `MP Loc HighStreet Deep` 定局门槛改为与森林同形：`$mpHighStreetShifts gte 5` + 无整顿期；去掉声望/事件数旁路
  - 正文补一句「执事只认街务满五班」；disabled 文案同步
  - Hub「在长桌前定局」本就读 shifts≥5，与 Deep 一致
- 改动文件：`source/mod-src/twees/mp-loc-highstreet.twee`；`docs/WORKLOG.md`；交接/状态
- 新增/删除 passage：无
- 检查结果：Deep Quest 0；Result 157；池 12；HUB>6 仍仅 More/Festival；render/pilots/style 0
- 未完成 / 下一步：
  - **神殿**结局门槛对齐（现仍 `mpLocEvents_Temple gte 3`）
  - **码头**结局门槛对齐（现仍船体阶+信赖，未绑 `$mpDocksShifts`）
  - More/Festival Hub 收 ≤6；Event/Festival Result 再降；删 `_v51_*.py`

## 2026-10-29 第三刀 D 潮下暗渠

- 已完成：
  - 码头 `MP Deep Docks Hub`：退潮滩涂入口；定局后读 `$mpWorldUndertideOutcome` → `MP Loc Undertide Echo Docks`（与入口互斥，Hub 动作仍 ≤6）
  - 高街 `MP Loc HighStreet Hub`：正文双读世界标志；链 `MP Loc Undertide Echo High`（与定局互斥；中层入口收成常驻后巷，静态 link ≤6）
  - 暗渠补至 **12** 页：Flats Oil / Canal Rope / Tide Trap / Gate Lead
  - 失败：涨潮困住 → Tide Trap（弃灯 setback；拽绳丢油）
- 改动文件：
  - `source/mod-src/twees/mp-undertide-canal.twee`
  - `source/mod-src/twees/mp-docks-depth.twee`
  - `source/mod-src/twees/mp-loc-highstreet.twee`
  - `docs/HANDOFF_V51_CONTINUE.md` / `docs/PROJECT_STATE.md` / `docs/WORKLOG.md`
- 新增/删除 passage：
  - 新增：`MP Loc Undertide Flats Oil`、`Canal Rope`、`Tide Trap`、`Gate Lead`
  - 未删页；未改 `boot.json` version（undertide 已在 list）
- 检查结果（五个脚本摘要）：
  - `skeleton_check`：Deep Quest 0；Result 157；event pool 12；HUB>6 仍仅 More/Festival（HighStreet Hub 已不在）
  - `check_render`：OPTION/ICON/PROSE count 0
  - `verify_pilots`：0
  - `audit_standalone`：新变量 `$mpUndertide*` / `$mpWorldUndertideOutcome` / `$daily.mpUt*` 无 write-only；Undertide 页无 zero-inbound
  - `check_render_style`：render style problems 0
- 未完成 / 下一步：
  - 可选：地点 Event/Festival `* Result` 再降 157；高街/神殿/码头结局门槛对齐；删 `tools/_v51_*.py`
