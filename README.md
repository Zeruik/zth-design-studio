# ZTH Design Studio 4.0

**赋形造物工作室 · 离线平面设计器**

ZeroToHand Studio / 理工阿白菌 · TechABJ ([Zeruik](https://github.com/Zeruik))

为工作室、社团和个人制作海报、产品图、活动图、名片与项目展板。编辑、二维码、字体和品牌素材均在本机运行，无需账号或后端服务。

An offline graphic editor with editable `.zthpmsj` projects, local history, reusable templates and bundled fonts. No account or cloud backend is required.

许可和数据说明：[许可与使用说明](docs/TERMS.txt) · [隐私与本地数据](docs/PRIVACY.txt) · [MIT 原文](LICENSE) · [第三方来源与许可](THIRD-PARTY.md)。应用内可从“设置 → 关于 → 许可与隐私”离线阅读完整副本。代码保持 MIT；品牌标识和第三方素材按各自权利处理，用户作品不因此转让给开发者。

`.zthpmsj` 工程备份未加密。“我的作品”的删除和丢弃草稿支持回收恢复，不是永久擦除；Windows 卸载保留本地作品，手机清除应用数据或卸载可能丢失作品。请定期分别备份重要工程。网页版仍会向托管站点请求静态资源，系统文件选择器也可能指向你选择的云盘，详情见上述隐私说明。

> **4.0 Windows 安装验收已完成。** 本页描述当前源码与验证结果；是否已正式发布及可下载文件以 [GitHub Releases](https://github.com/Zeruik/zth-design-studio/releases) 的实际状态为准。验收范围见 [4.0 验证记录](docs/QA-4.0.md)。

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

[已发布版本](https://github.com/Zeruik/zth-design-studio/releases) 与当前源码分开管理。以下为 4.0 的交付文件名与验证范围；文件是否已上传或公开，以 GitHub 实际发行元数据为准。

| 平台 | 4.0 构建目标 | 当前边界 |
|---|---|---|
| Windows 10/11 x64 | `ZTH-Design-Studio-4.0.0-Setup.exe` | 最终包的新中文空格路径安装、4→4 覆盖安装、正常关闭及用户手动卸载后检查通过 |
| Android 9+ | `ZTH-Design-Studio-4.0.0-Android.apk` | 沿用持久签名身份的构建流程；未进行实体手机安装与触控测试 |
| iOS / iPadOS 18+ | Xcode 工程、模拟器构建流程 | 当前没有可直接安装到任意 iPhone 的签名 IPA；真机包需 Apple 团队签名 |
| 浏览器 | `ZTH-Design-Studio-4.0.0-Web.zip` | 需要 HTTP(S) 静态服务；具体部署版本以页面与部署记录为准 |

[在线版入口](https://zeruik.github.io/zth-design-studio/)：iPhone 可用 Safari 打开后选择“分享 → 添加到主屏幕”。在线部署可能与开发源码版本不同；首次完整加载后可使用离线缓存。这是主屏幕网页应用，不是签名 IPA。

Windows 安装包没有商业代码签名。Android 构建要求保留既有签名身份；旧 1.0 预览包签名无法仅从源码确认。升级前请在旧版导出 `.zthpmsj` 备份，不应假定所有旧包都能直接覆盖安装。

用户已同意本轮 3.0 / 4.0 安装测试使用的相同许可。各候选的成功和失败均按安装包哈希保留在 [安装验收记录](qa/windows-install-v4.json)。最终包（SHA-256 前缀 `dcc5114f`）已完成新中文空格路径安装、同路径 4→4 覆盖安装和正常关闭。随后由用户手动卸载，代理只读后检查确认安装目录移除、注册和快捷方式回到基线，原资料保留；代理未操作卸载界面。3→4 升级与历史迁移的实际结果只对应中间包 `e7dbeba7`。隔离测试资料、导出测试文件及旧包清理仍待完成。

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

本轮最新完整 `npm test` 为 **109 项通过、0 失败、0 跳过**，包含运行日志排除、新目录和 8.3 短路径边界修复后的回归；19 个原生安装路径场景均通过。这些源代码与隔离测试结果和实际 GUI 安装结果分开记录，不同轮次和定向场景不重复累加。49 套模板的 518 个文字对象使用实际字体逐个渲染，字形和文本框越界均为 0；四种内置字体加载成功。二维码测试检查实际 PNG 的留白、全部模块与独立解码结果。浏览器已完成工程备份 / 回导及实际 PNG 下载检查。

范围和未完成项见 [QA-4.0.md](docs/QA-4.0.md)。[QA-3.0.md](QA-3.0.md) 与 [QA.md](QA.md) 保留旧版本证据，不能替代 4.0 安装验收。**最终包首次启动已查看两页内容和三份历史（两份原手动版本、一份恢复检查点），并通过页面撤销 / 重做；覆盖安装后确认了作品名、两页及当前页箭头，未重复检查第一页和历史。正常关闭及用户手动卸载后的核验均已完成，原资料已恢复并保留；测试物与旧包清理仍待完成。未进行实体 Android / iPhone 测试。**

Code: MIT. Brand artwork rights are reserved separately. See [LICENSE](LICENSE) and [THIRD-PARTY.md](THIRD-PARTY.md).
