# 原版文件使用说明（V33）

## 文件

- `vanilla/Degrees of Lewdity.html`：原版 0.5.12.13 编译文件，62 MB。能用浏览器打开，也能直接搜索。
- `vanilla/vanilla-passages.twee`：从 HTML 里抽出的 16,087 个 passage，格式是
  `:: Passage Name [tags]` + 正文，和项目里的 twee 一样，可以直接 grep。
- `vanilla/ModI18N-0.5.12.13-chs-1.0.1a.mod.zip`：原版汉化包，查术语用。

## 怎么查

不要整文件读入上下文，按需 grep / 截取：

```bash
# 找工作相关 passage
grep -n '^:: .*\(Work\|Job\|Cafe\|Farm\|Docks\|Factory\|Office\|Spa\|Massage\|Brothel\|Strip\)' vanilla/vanilla-passages.twee | head -200

# 找某段正文
awk '/^:: Cafe Work$/,/^:: /' vanilla/vanilla-passages.twee | head -80

# 找事件池与触发
grep -n 'runeventpool\|eventpool\|daily\.' vanilla/vanilla-passages.twee | head -100

# 找时间/时段条件
grep -n 'Time\.hour\|Time\.dayState\|Time\.season' vanilla/vanilla-passages.twee | head -100

# 找 NPC 作息
grep -n 'npc.*hour\|schedule\|appears' vanilla/vanilla-passages.twee | head -50
```

## 建议拆解顺序

1. 先读 `Cafe` 相关 passage，弄清原版一条零工的完整页面流。
2. 再读 `Farm`、`Docks`、`Factory`、`Office`、`Spa/Massage`，对比结构差异。
3. 读 `Event` / `Random` / `runeventpool`，弄清事件池如何抽、每天怎么重置。
4. 读 NPC 出现条件（`Time.dayState`、`Time.hour`、地点判断）。
5. 读工资/价格/claim 相关（`money`、`<<money>>`、`daily`、一次性变量）。

## 注意

- 原版是英文；术语可对照汉化包，但**新写内容必须是中文原创**，不要逐字翻译或复制原版句子。
- 原版 passage 名和本项目 passage 名可能重名，改 mod 时不要直接引用原版 passage。
- 原版文件只用于研究机制与结构，不参与游戏加载。
