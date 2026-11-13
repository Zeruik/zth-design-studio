# ZTH Design Studio 4.0

**赋形造物工作室 · 离线平面设计器**

ZeroToHand Studio / 理工阿白菌 · TechABJ ([Zeruik](https://github.com/Zeruik))

为工作室、社团和个人制作海报、产品图、活动图、名片与项目展板。编辑、二维码、字体和品牌素材均在本机运行，无需账号或后端服务。

An offline graphic editor with editable `.zthpmsj` projects, local history, reusable templates and bundled fonts. No account or cloud backend is required.

> **4.0 当前为开发与验证版本，尚未作为正式发行版发布。** 本页描述当前源码；已发布下载以 [GitHub Releases](https://github.com/Zeruik/zth-design-studio/releases) 为准。安装验收与最终发行包记录仍在补充，详见 [4.0 验证记录](docs/QA-4.0.md)。

## 4.0 的变化

- **重新组织的工作台**：文件菜单、操作搜索、专注画布、设计 / 图层 / 历史面板；手机使用可收起的侧边面板。支持跟随系统或关闭界面动效。
- **整个作品的操作历史**：文字、颜色、描边、阴影、图层、组合、页面增删和画布尺寸可撤销 / 重做；可跳到某一步。连续文字输入会合并记录，重新打开作品开始新的操作记录。
- **49 套模板**：在原有 25 套基础上新增 24 套原创构图，覆盖会议日程、演示提案、研究摘要、数据卡、名片、菜单、简历、证书、流程长图与知识卡。按分类、用途、方向和比例筛选，预览时可查看文字与导出建议。
- **20 个尺寸参考、14 篇设计知识**：屏幕、长图、A4/A5/A3、名片和明信片预设，以及层级、对齐、字体、配色、矢量 / 位图、二维码和输出检查。尺寸是常用参考，不代表某个平台的永久规则。
- **更完整的元素操作**：保留 48 个可搜索、可换色的原创矢量素材；文字和图形可调整填充、描边、底色、透明度与阴影。手机也可从“更多”菜单组合和拆分元素。
- **保存与备份分开**：“保存”将作品和版本留在当前设备；“文件 → 备份工程 .zthpmsj”导出可携带文件。恢复操作执行期间的保存等待最终状态。

## 保留的创作能力

- 原模板只读，使用时建立独立作品副本；也可将当前作品另存为个人模板。
- 我的作品自动保存草稿；手动保存保留最近 10 个版本。支持回收站、撤销删除，以及保存 / 不保存 / 取消切换。已有手动版本的作品丢弃改动后保留最近手动版本，丢弃内容可从回收站恢复为副本。
- HEX / RGB 自选色与最近 5 色；文字、图形、描边、背景和二维码可以使用自己的颜色。
- 点选元素查看尺寸、属性、替换、锁定、复制和删除。锁定元素及包含锁定元素的组合受编辑保护。
- 二维码支持网址 / 文字生成，也支持上传替换。生成器保留四模块留白；导出后仍应按实际展示尺寸扫码检查。
- 7 款默认品牌标志在本机去除纯色底，保留原始素材。工程内嵌处理后的图片。
- 4 种离线字体：ZTH Sans、站酷小薇、马善政毛笔、Roboto Mono。工程与 SVG 可携带实际使用的内置字体；系统字体依赖接收设备。
- 图片裁切、取色抠图、图层、分组、规则排版、多页工程，以及 PNG / JPG / SVG / PDF 导出。
- 保留手机安全区、横屏布局及明暗主题；具体设备适配仍需实机验收。

## 常用操作

1. 从空白画布开始，或在模板库预览后创建可编辑副本。
2. 点选元素进入“设计”面板；手机使用“更多 → 尺寸与属性”。“图层”面板可查找和选择对象。
3. 点颜色输入 HEX / RGB；描边图标可直接换线条颜色。编辑后检查长文字的换行与边缘。
4. 使用撤销 / 重做或“历史”面板回到之前的状态。操作记录与“我的作品”中持久保存的版本是两种不同的历史。
5. “保存”写入本机作品库；定期从文件菜单导出 `.zthpmsj` 备份，再导出图片用于分享。
6. 从“知识”浏览尺寸与设计建议。印刷预设按 300 ppi 约算，不自动添加出血、裁切标记或印刷色彩配置。

| 快捷键 | 操作 |
|---|---|
| Ctrl / Cmd + S | 保存到本机作品库 |
| Ctrl / Cmd + Shift + S | 备份工程文件 |
| Ctrl / Cmd + Z | 撤销 |
| Ctrl / Cmd + Shift + Z，或 Ctrl / Cmd + Y | 重做 |
| Ctrl / Cmd + K | 查找操作 |
| Ctrl / Cmd + D | 复制选中元素 |

文字编辑和输入框保留自身输入行为；画布快捷键不会替代文字输入过程中的撤销。

## 下载与平台状态

[已发布版本](https://github.com/Zeruik/zth-design-studio/releases) 与当前开发源码分开管理。以下为 4.0 的构建目标和预期文件名，**不表示这些文件已经上传或完成安装验收**。

| 平台 | 4.0 构建目标 | 当前边界 |
|---|---|---|
| Windows 10/11 x64 | `ZTH-Design-Studio-4.0.0-Setup.exe` | 含语言、协议、路径与卸载向导；原生 GUI 安装验证待许可确认 |
| Android 9+ | `ZTH-Design-Studio-4.0.0-Android.apk` | 沿用持久签名身份的构建流程；未进行实体手机安装与触控测试 |
| iOS / iPadOS 18+ | Xcode 工程、模拟器构建流程 | 当前没有可直接安装到任意 iPhone 的签名 IPA；真机包需 Apple 团队签名 |
| 浏览器 | `ZTH-Design-Studio-4.0.0-Web.zip` | 需要 HTTP(S) 静态服务；具体部署版本以页面与部署记录为准 |

[在线版入口](https://zeruik.github.io/zth-design-studio/)：iPhone 可用 Safari 打开后选择“分享 → 添加到主屏幕”。在线部署可能与开发源码版本不同；首次完整加载后可使用离线缓存。这是主屏幕网页应用，不是签名 IPA。

Windows 安装包没有商业代码签名。Android 构建要求保留既有签名身份；旧 1.0 预览包签名无法仅从源码确认。升级前请在旧版导出 `.zthpmsj` 备份，不应假定所有旧包都能直接覆盖安装。

## 文件、字体与隐私

`.zthpmsj` 是 UTF-8 JSON，`format=zthpmsj`、`schema=1`，内嵌页面、图片、实际使用的内置字体、锁定和图片槽信息；文件没有加密。历史位于当前设备 IndexedDB。清除应用 / 浏览器数据或卸载手机应用可能删除本地作品，跨设备请导出文件。

四种字体的 OFL 文本保存在 [`app/assets/fonts/`](app/assets/fonts/)，新增三种字体的来源、版本和 SHA-256 记录见 [`SOURCES.json`](app/assets/fonts/SOURCES.json)。Roboto Mono 用于英文和数字，不包含中文。字体与第三方组件说明见 [THIRD-PARTY.md](THIRD-PARTY.md)。

支持图片、SVG、PDF 和基础 PPTX 导入。PDF 按页成为图片；当前 PDF 导出也为当前页整页图像，不是分层可编辑印刷 PDF。PPTX 母版、复杂形状、文字混排和动画无法保证还原。不声明 PSD / AI / CDR / Canva 私有格式的无损兼容。

每个工程最多 30 页、2500 个对象；输入工程上限 60 MB；单页最多 2400 万像素，栅格导出最多 4800 万像素。操作历史按步数和内存预算回收较早记录。抠图使用取色算法，不是通用人像分割；规则排版不调用大模型。

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

Windows requires NSIS 3 (`ZTH_MAKENSIS` can select the compiler). Android uses a JDK and Android SDK platform/build-tools 35; see [native build notes](docs/NATIVE-BUILD.md). Signing keys must remain outside Git. `build:ios` prepares shared assets; compilation requires macOS/Xcode. See [iOS instructions](ios/README.md) and [the CI workflow](.github/workflows/ios-build.yml).

## Validation

本轮核心回归 96 项通过。49 套模板的 518 个文字对象使用实际字体逐个渲染，字形和文本框越界均为 0；四种内置字体加载成功。二维码测试检查实际 PNG 的留白、全部模块与独立解码结果。浏览器已完成工程备份 / 回导及实际 PNG 下载检查。

范围和未完成项见 [QA-4.0.md](docs/QA-4.0.md)。[QA-3.0.md](QA-3.0.md) 与 [QA.md](QA.md) 保留旧版本证据，不能替代 4.0 安装验收。**原生 GUI 安装、升级和卸载待许可确认后验证；未进行实体 Android / iPhone 测试。**

Code: MIT. Brand artwork rights are reserved separately. See [LICENSE](LICENSE) and [THIRD-PARTY.md](THIRD-PARTY.md).
