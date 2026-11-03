# BanG Dream 桌角 Live House

[在线游玩](https://stevenyang723.github.io/band-desk-live-house/)

一个竖屏像素风同人挂机小游戏。选一支喜欢的乐队，演出赚金币、招募成员、收集乐器，在十二站巡演里搭配临时灵感。

- 69 位成员，金币随机招募，重复成员转为专属技能点。
- 随机乐器、装备位强化、词条重铸和角色适配加成。
- 每场展示金币、声望、零件和装备奖励；自动模式停留 3 秒继续，手动模式点击继续。
- 同一舞台完成 3 场且最佳评价达到 A 后解锁离线收益。每天 6 小时，每次升级 +3 小时，最多每天 24 小时，北京时间零点刷新。
- 支持手机、电脑浏览器和本地自动存档，可导入、导出 JSON。

## 存档

纯静态版本，没有账号、服务器结算或跨设备云存档。进度保存在当前浏览器。换设备、换网址、清理浏览器数据前，请在游戏右上角或「事务所 → 存档管理」导出存档，在新页面导入。

从旧网址迁移时，需要先在旧网址导出，再在这里导入。支持旧网页版及桌面版导出的存档。

## 本地运行

需要 Node.js 24，无第三方依赖：

```sh
node scripts/build.mjs
node scripts/check.mjs
node scripts/test-economy.cjs
node scripts/serve.mjs
```

打开 `http://127.0.0.1:4173/`。

## GitHub Pages

仓库的 **Settings → Pages → Source** 选择 **GitHub Actions**。推送到 `main` 后，工作流会构建、检查并发布 `dist/`。也可在 Actions 中手动运行 `Build and publish game`。

所有游戏资源使用相对路径，支持 GitHub Pages 的仓库子目录地址。网站无需数据库、服务器密钥或额外安装包。

## 项目内容

- `src/`：游戏逻辑、像素界面和浏览器存档。
- `assets/`：像素角色、字体和图标。
- `scripts/`：构建、检查、规则测试和本地预览。
- `licenses/`：字体许可。

## 说明

本项目为 BanG Dream! 非官方同人小游戏，角色及企划相关权利属于原权利方。像素角色为本项目重绘，不包含官方歌曲。字体为 Fusion Pixel Font，使用 OFL 许可，详见 `licenses/`。公开仓库不代表获得原作角色、美术或商标的商业使用授权。
