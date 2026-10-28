继续 DoL-MP 的 V51 任务。

先读这些文件，再动手：
1. `docs/PROJECT_STATE.md`
2. `docs/WORKLOG.md`（上一轮进度）
3. `docs/SKELETON_ALIGNMENT.md`
4. `docs/SKELETON_TEMPLATE.md`

基线是 dev46，只改 `mod-src/`。
这一轮只做：森林节日 After 内嵌去中转——先只改 Spring 一季（把 `MP Loc Forest Festival Spring After` 并进 Spring 页后删 After）。班次 pass 60 已齐；仓库已是 git。

做完必须：
- 跑五个检查脚本，0 违规再继续
- 把进度写进 `docs/WORKLOG.md`

铁律：
- 旧页零改写，只改点名的 Hub/Deep Hub 和删 Deep Quest
- 不改 `boot.json` 的 version
- 地点页 ≤6 个动作，班次 1:00，事件池 `cleareventpool`/`addinlineevent`/`runeventpool`
- 普通失败只锁当天，不发钱
- 不加任务链、不加 `* Result` 页、不加功能索引 Hub
- 不要为了过检查灌水，补场景和动作，不补形容词
