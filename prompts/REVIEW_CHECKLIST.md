# 交付复核清单（每轮改完后跑一遍）

## 1. 改了什么

- [ ] 列出改动文件与新增 passage，和上一版 `source/mod-src` 对比
- [ ] 旧页 diff：除点名的接入页外，旧页正文 0 改动
- [ ] 新增页都有至少 1 条静态入链（`audit_standalone.py` 的 ZEROIN 里不出现新页）

## 2. 五个脚本

```bash
python -I tools/check_render.py source/mod-src
python -I tools/verify_pilots.py source/mod-src
python -I tools/audit_standalone.py source/mod-src
python -I tools/check_render_style.py source/mod-src
python -I tools/skeleton_check.py source/mod-src
```

- [ ] `check_render`：选项 0 / 图标 0 / 正文 0
- [ ] `verify_pilots`：0
- [ ] `audit_standalone`：重名 0、宏配平 0、断链 0；新变量不在 write-only 里
- [ ] `check_render_style`：点名的文件 0（改五人 NPC 时点名传 `twees/mp-npc-*.twee`）
- [ ] `skeleton_check`：Deep Quest 0、新 Result 0、事件池 ≥12、新班次页含 pass 60、Hub ≤6

## 3. 骨架抽查（人工，每类看 1 页）

- [ ] **地点页**：≤6 个动作；没有「表层/中层/深层」按钮；场景描述 1–3 句
- [ ] **班次页**：进入即 1:00；有 `cleareventpool` + 3 条以上 `addinlineevent` + `runeventpool`；结果内嵌；结束回地点
- [ ] **NPC 场景**：没有「继续追查…」的任务下一步；2–4 个动作；结果内嵌
- [ ] **长线阶段**：是场景不是「推进阶数」按钮；`nextStageDay` 生效
- [ ] **结局**：一次性；触发要「累积条件 + 不可逆动作」；世界标志 ≥2 页读取

## 4. 文案抽查

- [ ] 没有「你可以…也可以…」菜单导语
- [ ] 选项是动作短语，4–8 字，不带系统名词
- [ ] 正文没有变量名、没有「探索进度/已完成事件/任务失败」
- [ ] 段落 1–3 句为主，没有 500 字长段

## 5. 打包

- [ ] `boot.json` version 正确、UTF-8 无 BOM、LF
- [ ] `tweeFileList` 与磁盘文件一致
- [ ] mod zip 条目用正斜杠 `/`
- [ ] 全量包 + 源码包成对，重叠文件逐字节一致

## 6. 合并前最后一问

**这轮改动是让页面更像 DoL，还是只是让检查通过了？**

如果只是后者，退回重做。
