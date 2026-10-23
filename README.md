# DoL-MP 整合包

**Degrees of Lewdity 0.5.12.13 汉化版 + DoL-MP 联机模组 v1.0.0**

> **18+ 成人内容警告**：本仓库包含成人向文字游戏及其模组，仅面向成年人。请勿向未成年人传播。
>
> 本仓库是玩家自制的非官方整合包，**未获得 Vrelnir 或汉化作者的官方背书**。请勿用于任何商业用途，禁止售卖。

---

## 这是什么

把「DoL 0.5.12.13 汉化版」和「DoL-MP 联机模组」打包在一起，解压即用：

- 游戏本体（含 ModLoader）
- 汉化包、官方图片包
- DoL-MP v1.0.0 联机模组（含完整源码）
- 联机服务器（Node.js，依赖已内置）
- 中文说明书 `说明书.md`

---

## 包含内容

| 路径 | 内容 |
| --- | --- |
| `game/Degrees of Lewdity.html` | 游戏本体（ModLoader 版，64MB） |
| `mods/ModI18N-0.5.12.13-chs-1.0.1a.mod.zip` | 中文汉化包 |
| `mods/GameOriginalImagePack-0.5.12.13.mod.zip` | 官方图片包 |
| `mods/DoL-MP-v1.0.0.mod.zip` | DoL-MP 联机模组（可直接添加） |
| `mod-src/` | DoL-MP 模组源码（`boot.json` / JS / CSS / Twee / 图标） |
| `server/` | 联机服务器（`server.js` + 已内置 `ws` 依赖） |
| `start-game.bat` | 启动游戏 |
| `start-host.bat` | 启动服务器并打开游戏 |
| `说明书.md` | 完整中文说明书 |

---

## 快速开始（Windows）

1. 下载 Release 里的整合包 zip，解压到任意目录。
2. 双击 `start-game.bat` 打开游戏。
3. **首次使用**：按 `Alt+M` 打开 Mod 管理器
   - 关闭「安全模式」
   - 点「添加模组」，进入 `mods/`，**全选三个 zip**，确定
   - 点「重新载入」，等待加载完成
4. 读档或开新档即可。

> 如果之前装过旧版 DoL-MP，先在 Mod 管理器里「移除」旧的 DoL-MP，再添加新的。
> 存档在浏览器本地（`file://` 源的 IndexedDB），换目录一般不会丢，但升级前建议先导出备份。

详细步骤、常见问题见 [`说明书.md`](说明书.md)。

---

## 联机

1. 房主双击 `start-host.bat`（需要安装 Node.js 18+）。脚本会显示本机 IPv4 并启动服务器（端口 `8787`）。
2. 首次运行如果 Windows 防火墙弹窗，请允许 Node.js 通过。
3. 游戏内右下角「联机」：
   - 同机双开：`ws://127.0.0.1:8787`
   - 局域网：`ws://主机IP:8787`
   - Radmin / ZeroTier / Tailscale 等虚拟局域网：填虚拟网卡 IP
4. 房主「创建房间」，把 4 位房间码发给朋友；朋友输入房间码「加入」。

手动启动服务器：

```bash
cd server
node server.js
```

`node_modules/ws` 已随仓库提供，正常不需要 `npm install`。如果依赖缺失：

```bash
npm install
```

---

## v1.0.0 更新要点

- 18 个 twee，约 588 个独立 passage
- 8 个新区域：雾角灯塔、地下机括城、沉没修道院、秘密温室庄园、黑铁货运站、古德鲁伊石环、峭壁天鹅绒暗层、旧学园天文翼楼
- 6 个新 NPC：塞拉、维斯珀、诺艾尔、林、莫奈、阿什
- 5 个软坏结局、5 个精英遭遇战
- 伴侣系统、同行互动、12 条跨周大支线、主线和信物收集
- 联机服务器支持房间、同步、PvP 与离线队友转伴侣

### 已知问题

- 部分区域事件的结构比较统一，后续版本会继续打磨文风。
- 少数场景仍有模板句残留；如果发现具体 passage 名，欢迎提 Issue。

---

## 目录结构

```
DoL-MP-Package/
├── game/                 # 游戏本体
├── mods/                 # 三个可安装模组
├── mod-src/              # DoL-MP 源码
├── server/               # 联机服务器
├── start-game.bat
├── start-host.bat
├── 说明书.md
├── LICENSE
├── THIRD-PARTY-NOTICES.md
└── README.md
```

---

## 版权与许可

- **Degrees of Lewdity** © Vrelnir，采用 [CC BY-NC-SA 4.0](LICENSE) 许可。官方源码：<https://gitgud.io/Vrelnir/degrees-of-lewdity>，作者博客：<https://vrelnir.blogspot.com/>
- **ModLoader**：<https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader> · 构建版：<https://github.com/Lyoko-Jeremie/DoLModLoaderBuild>
- **汉化包 / 图片包**：<https://github.com/Eltirosto/Degrees-of-Lewdity-Chinese-Localization>
- **DoL-MP 模组**：本仓库作者，同样以 CC BY-NC-SA 4.0 分享

本整合包仅作非商业分享。所有第三方内容的版权归原作者所有；如原作者认为不妥，请在 Issue 中联系，我会立即移除相关内容。

详见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

---

## 免责声明

- 本项目与 Vrelnir、Eltirosto、Lyoko-Jeremie 均无隶属或背书关系。
- 游戏内容为虚构作品，请遵守所在地法律法规。
- 使用本整合包产生的任何后果由使用者自行承担。
