# ARCHITECTURE — DoL-MP 代码结构

## 1. 这是什么

`DoL-MP` 是 Degrees of Lewdity 的原创内容 mod（不是汉化、不是工具），通过 DoL ModLoader 以 `.mod.zip` 加载。当前版本 `1.2.0-dev46`，游戏本体 0.5.12.13。

## 2. mod 目录结构

```
source/mod-src/
├── boot.json              # mod 清单：version + style/script/twee 文件列表
├── twees/                 # 164 个 .twee 文件，3,426 个 passage
├── scripts/mp.js          # 全部 JS：hook 注入、NPC 日程、机制逻辑
├── styles/mp.css          # 样式
└── img/mp/                # 图标（GIF/PNG）
```

`boot.json` 的 `tweeFileList` 必须列全所有 twee 文件；新增文件要加进去。新 passage 写在已有文件里时不用改 boot。

## 3. 命名约定

| 前缀 | 含义 | 例子 |
| --- | --- | --- |
| `MP Loc <Place> Hub` | 地点总枢 | `MP Loc Forest Hub` |
| `MP Loc <Place> Surface/Mid/Deep` | 地点分层 | `MP Loc Forest Deep` |
| `MP Loc <Place> Event N` | 地点事件 | `MP Loc Forest Event 1` |
| `MP NPC <Name> Hub` | NPC 主 Hub | `MP NPC Ash Hub` |
| `MP NPC <Name> Deep Hub` | NPC 深枢 | `MP NPC Ash Deep Hub` |
| `MP NPC <Name> Daily/Date/Street/RelDay` | 日常/约会/街头/关系日 | `MP NPC Ash Daily 3` |
| `MP Ledger*` | 账本长线 | `MP Ledger Hub` |
| `MP Fog Tide*` | 雾潮长线 | `MP Fog Tide Stage 1` |
| `MP Guild*` | 十二行会 | `MP Guild Assembly Hub` |
| `MP Temple Schism*` | 神殿裂缝 | `MP Temple Schism Hub` |
| `Widgets MP <X>` | widget 定义 | `Widgets MP NPC Ash` |

新页面命名尽量沿用前缀，检查脚本和入口图都按这个找。

## 4. 关键 JS（`scripts/mp.js`）

| 区域 | 作用 |
| --- | --- |
| `SAFE_PASSAGES` | 允许注入 mod 入口的原生页面白名单 |
| `DEEP_HUB_HOOKS` | 深区入口钩子：`locs` 原生地点、`check` 条件、`hint` 提示、`linkText`、`passage` |
| `WORLD_STORYLINE_HOOKS` / `SIDE_HUB_HOOKS` | 世界线与街角告示入口 |
| `injectWorldAndCompanionNodes` | 在每个 SAFE_PASSAGE 底部注入入口块 |
| `mpInitNpc<Name>` | 每个 NPC 的变量初始化与兜底（旧档兼容） |
| `mpLedgerTick` / `mpLedgerInit` | 账本按天翻周 |
| `mp<Npc>Schedule` | NPC 日程/位置 |

入口钩子的写法（照 `school` 条目）：

```js
{
  key: "forest",
  noDiscover: true,
  locs: ["Forest"],
  check: function (v) { return true; },
  hint: "界石旁新钉了一块巡林木牌。",
  icon: "img/misc/icon/forest.png",
  linkText: "去林道看看 (0:05)",
  passage: "MP Loc Forest Hub"
}
```

## 5. 变量约定

| 变量 | 用途 |
| --- | --- |
| `$mpNpcs.<id>` | NPC 数据：`love/trust/lust/dom/corruption/stage/axis/hasMet` 等 |
| `$mpNpcs.<id>.deepStage` | 个人线第二阶段进度（0–5） |
| `$mpNpcs.<id>.nextStepDay` | 下一步最早日期 |
| `$mpNpcs.<id>.setback` | 失败锁定到哪天 |
| `$mp<Name>Ended` / `$mpWorld<Name>Ending` | NPC 一次性结局与世界回声 |
| `$mpWorld<Location>Outcome` / `$mp<Loc>Ended` | 地点结局 |
| `$mpWorld<Line>Outcome` / `$mp<Line>Ended` | 长线结局 |
| `$daily.<key>` | 当日防重 |
| `$mpLocProgress_<Place>` / `$mpLocEvents_<Place>` | 地点进度/事件计数 |
| `$mpLedger` | 账本状态（week/amount/overdue/nextDueDay/paidWindow） |
| `$mpFogStage` / `$mpFogNextStageDay` | 雾潮 |
| `$mpGuildStanding` / `$mpGuildEnded` | 行会 |
| `$mpTempleRites` / `$mpTempleSchismEnded` | 神殿裂缝 |

规则：
- 新变量必须至少 2 处读取；旧档一律 `(x.var or 0)` 兜底。
- 个人线变量放 `$mpNpcs.<id>` 下，不要新建一串顶层 `$mpAshXxx`。
- 世界标志至少被 2 个不同页面读取。

## 6. 渲染与写作约束（检查脚本按这个判）

- 每条渲染路径：2–5 个选项；图标 ≤4 且不重复；正文 60–200 汉字。
- 选项标签 4–8 汉字，同屏长度互异，必须带 `(0:NN)` 或 `(0:NN)` 格式。
- `<<getouticon>>` 必须在该页第一个链接前。
- `<<pass>>` 的分钟数与标签 `(0:NN)` 一致。
- 禁止在正文里泄漏变量名（`$mp...`、`mpNpcMet` 等）。
- 禁止「探索进度」「已完成事件」「任务失败」这类系统面板词。

## 7. 游戏内验证

`game/` 里有游戏本体和 mod。用浏览器直接打开 `game/Degrees of Lewdity.html`，或起一个本地静态服务器：

```bash
python -m http.server 8080 --directory game
```

然后浏览器打开 `http://localhost:8080/Degrees%20of%20Lewdity.html`。mods 目录会被 ModLoader 读取。
