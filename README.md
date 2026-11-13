# ZTH Design Studio 3.0

**赋形造物工作室 · 离线平面设计器**
ZeroToHand Studio / 理工阿白菌 · TechABJ ([Zeruik](https://github.com/Zeruik))

为工作室、社团和个人制作海报、产品图、活动图与项目展板。编辑、二维码、字体和品牌素材均在本机运行，无账号或后端服务。

An offline graphic editor for posters, product cards and project boards. Shared editable `.zthpmsj` projects work across desktop and mobile. No account or cloud backend is required.

## 下载 / Download

[GitHub Releases](https://github.com/Zeruik/zth-design-studio/releases) 包含安装包、源码包与校验值。项目统一使用本仓库，`v1.0` 保留原始代码，`v2.0` 保留 2.0，`v3.0` 为 3.0 版本分支，`main` 为当前版本。

[打开在线版](https://zeruik.github.io/zth-design-studio/)：iPhone 可用 Safari 打开后选择“分享 → 添加到主屏幕”。首次联网加载后可离线使用；作品仍保存在本机。这是主屏幕网页应用，不是签名 IPA。

| 平台 | 交付 | 安装方式 |
|---|---|---|
| Windows 10/11 x64 | `ZTH-Design-Studio-3.0.0-Setup.exe` | 向导选择语言、阅读协议、选择路径；运行时已内置 |
| Android 9+ | `ZTH-Design-Studio-3.0.0-Android.apk` | 下载到手机安装；需要较新的系统 WebView |
| iOS / iPadOS 18+ | 主屏幕网页版、仓库中的 Xcode 工程 | 本次 3.0 安装包交付为 Android / Windows；iOS 真机包仍需 Apple 团队签名 |
| 浏览器 | `ZTH-Design-Studio-3.0.0-Web.zip` | 放在 HTTP(S) 静态服务器，支持安装到主屏幕及离线缓存 |

**当前没有可直接安装到任意 iPhone 的签名 IPA。** 原生 iOS 工程已提供，模拟器构建状态以 Actions 结果为准。

Windows 包未配置商业代码签名。Android 3.0 沿用 2.0 私有构建密钥；旧 1.0 预览包签名无法从源码确认，因此不能保证直接覆盖旧版。升级前在旧版导出 `.zthpmsj` 备份；若系统提示签名冲突，先备份再卸载旧版、安装新版并导入。

## 3.0 的变化

- **空白起稿**：首次打开默认空白画布，顶部“新建”开始新的草稿。
- **可恢复删除**：不需要的自动副本可移到回收站，支持撤销删除与恢复。
- **切换时自己决定保存**：保存并继续、不保存继续或取消；丢弃会取消旧保存任务，避免草稿被自动保存重新写回。
- **分类矢量素材**：箭头、符号和工具图标可以搜索、换色与编辑。
- **文字与图形外观**：支持描边、阴影、无填充及底色，修改可撤销。
- **更多离线字体**：新增可分发字体，许可证随包保留；作品可携带所用内置字体。

## 延续 2.0 的能力

- **模板原件只读**：点击模板建立新的作品副本。修改和保存副本不会覆盖原模板；自定义模板另存为新模板。
- **我的作品与历史**：自动保存每个作品的草稿；手动保存保留最近 10 个版本，可预览、继续编辑、恢复或导出。恢复前会保存当前状态。历史在当前设备，跨设备请导出文件。
- **自由选色**：文字、填充、描边、背景与二维码颜色均支持色谱、HEX、RGB，显示最近使用的 5 个颜色。
- **选中就能操作**：点选元素显示名称和尺寸；“•••”内有属性、替换、锁定、复制、删除。属性中可精确设置宽高、位置、角度、透明度、字体和图层。
- **二维码直接替换**：选中二维码或占位框，填写网址/文字生成真实二维码，或上传已有二维码。保留位置、旋转及图层；导出后建议扫码检查。
- **透明品牌素材**：7 款默认标志在本机去除纯色底，保留原始素材；彩色核心像素保留。预览显示透明棋盘，工程内嵌透明版本。
- **25 套模板**：包含横版 16:9、方形、竖屏 9:16、4:5、宽幅横幅、A4、横版招新及明信片。不同尺寸有独立构图。
- **手机安全区与旋转**：Android 原生容器避让状态栏、刘海、手势区和键盘；网页/iOS 使用安全区。横屏切换侧边工具栏，画布方向由模板或画布尺寸独立控制。
- 保留中英文界面、明暗/系统主题、图片裁切、取色抠图、图层、分组、规则排版、工程导入导出。

## 常用操作

1. 从空白草稿开始，或选模板建立可编辑副本。原模板不会被修改。
2. 点元素编辑；手机使用选中工具条的“••• → 尺寸与属性”。
3. 点颜色，输入 HEX/RGB 后应用；最近 5 色在所有颜色选择器中共享。
4. “我的作品”可命名、保存版本、恢复历史。“保存作品”同时导出可携带文件。
5. 产品图模板锁住品牌位置；选中产品图片，使用“替换图片”保留版式。修改锁定元素前先解锁。
6. 导出 PNG/JPG/SVG/PDF；SVG 保留矢量，PDF 为当前页整页图像。

## 文件与隐私

`.zthpmsj` 为 UTF-8 JSON，`format=zthpmsj`、`schema=1`，内嵌页面、图片、实际使用的内置字体、锁定与图片槽。没有加密。其他系统字体取决于目标设备。

历史保存在设备 IndexedDB；清除应用/浏览器数据或卸载手机应用可能删除本地历史。请定期导出备份。Windows 卸载保留应用用户数据，导出的文件由用户管理。

支持图片、SVG、PDF 和基础 PPTX 导入。PDF 按页成为图片；PPTX 母版、复杂形状、文字混排和动画无法保证还原。无 PSD/AI/CDR/Canva 私有格式的无损兼容声明。

限制：每工程最多 30 页、2500 个对象；输入工程 60 MB；单页 2400 万像素，栅格导出 4800 万像素。复杂图片及历史的容量受设备存储影响。抠图是取色算法，不是通用 AI 人像分割；规则排版不调用大模型。

## Build

```sh
npm ci
npm test
npm start
npm run build:win
npm run build:android
npm run build:ios
npm run build:web
```

Windows requires NSIS 3 (`ZTH_MAKENSIS` can select the compiler). Android uses JDK and Android SDK platform/build-tools 35; see [native build notes](docs/NATIVE-BUILD.md). Android signing keys must stay outside Git. `build:ios` prepares shared web assets; compilation requires macOS/Xcode. See [iOS instructions](ios/README.md) and [the iOS CI workflow](.github/workflows/ios-build.yml).

## Validation

See [QA-3.0.md](QA-3.0.md) for current checks and their limits; [QA.md](QA.md) preserves 2.0 observations. Browser viewport tests and native package compilation are distinct from physical-phone installation and touch testing. Physical Android/iPhone tests remain pending.

Code: MIT. Brand artwork rights are reserved separately. See [LICENSE](LICENSE) and [THIRD-PARTY.md](THIRD-PARTY.md).
