# 下一批任务（dev13）

## 一、必须修

1. **失败分支降级线索 13 处**
   - `mp-region-storylines-2.twee`：Velvet Mirage 1–5、Observatory Wing 1–5 的失败 `else` 仍写 `*_alt` 线索。
   - `mp-storylines-town.twee`：Bedroom Attic Step3、Docks Smuggler Step3、Temple Catacomb Step3 的失败仍写 `town_attic_sketch / town_docks_numbers / town_temple_rubbing`。
   - 要求：失败只给「错拓/残缺拓片」叙事，不写 `$mpClues`；或保留但明确标为替代进度并加 `$daily` 限次。

2. **新文件观察给钱 13 处**
   - `mp-region-moments-7.twee`、`mp-region-storylines-5.twee` 中「架镜比对/举灯细辨/翻看记录」等选项仍可能直接给钱或古董。
   - 要求：观察项只给 `$mpClues` + 减压，钱/古物只放检定成功分支。

3. **模板标签**
   - 「再试」家族 83 种写法、1029 次；「退回/离开」家族 994 种写法、2330 次。
   - 要求：每个区域固定 3 种再试、2 种离开，其余按场景改写。

4. **同文件 claim 共用键**
   - Followup / Extra / Partner 的 A/B 仍共用按天键，同日只能拿一份。若两支都应有收益，拆成 `_money` / `_keepsake` 两个键。

5. **正文 NPC 名字**
   - 旧文件仍有「未认识却点名」的叙述句（入口已门控，正常 UI 不可达）。逐段改为「是 X。/无名替代」二分支。

## 二、建议

- 把 `MP Region Pool Router` 的 165 段区域事件按区域拆成独立 pool，避免一个大 switch。
- 给所有 Shift 页补 `$daily` 已交班分支，防止历史记录重进。
- 统一 `$location` 与 `PASSAGE_CN` 的 Blackiron 命名（elk/industrial 二选一）。
- 继续收敛菜单 Hub 图标到 ≤4，出口置顶。

## 三、验收

- 72+ twee，重名 0，断链 0，宏 0，if 栈 0。
- 失败分支发钱/写线索/发物品 = 0（或明确列白名单）。
- 观察给钱 = 0。
- 带名选项未门控 = 0。
- boot 注册 = 磁盘文件数。
- `$location` 与正文场景一致，跨区 <8 分钟 = 0。
