# ZTH Design Studio 2.0 — iOS / iPadOS

这是原生 iOS Xcode 工程，内置完整离线编辑器；支持 iPhone / iPad、横竖屏、安全区、文件导入和“存储到文件”。它不是签名 IPA，也不是 App Store/TestFlight 发布。

## 在 Mac 上构建

需要 Xcode、iOS SDK 和 Node.js。最低部署版本 iOS 18（包含 PDF 导入所需的现代 WebKit）。从仓库根目录运行：

```sh
npm run build:ios
xcodebuild -project ios/ZTHDesignStudio.xcodeproj -scheme ZTHDesignStudio -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO build
```

工程打开后选择 Signing & Capabilities 的实际开发团队；连接 iPhone，再运行。`studio.zerotohand.design` 如果已被其他团队占用，需要使用你的团队可注册的 Bundle ID。

设备归档：

```sh
xcodebuild -project ios/ZTHDesignStudio.xcodeproj -scheme ZTHDesignStudio -configuration Release -destination 'generic/platform=iOS' -archivePath ios/build/ZTHDesignStudio.xcarchive DEVELOPMENT_TEAM=YOUR_TEAM_ID -allowProvisioningUpdates archive
```

在 Xcode Organizer 选择 Distribute App，使用适合你的账号和设备的开发、Ad Hoc、TestFlight 或 App Store 分发方式。Apple 签名证书、设备注册和 provisioning profile 是真机安装的必要条件；不能用改名 ZIP 或无签名应用代替可安装 IPA。不要把证书、私钥、描述文件或账号凭据提交到 GitHub。

## 版本状态

Windows 环境已准备工程及资源；没有在当前 Windows 机器上执行 Xcode 编译或 iPhone 实机验收。必须在 Mac 上完成编译、文件导入/导出、IndexedDB 历史恢复、横竖屏、键盘与安全区验证，再发布签名 IPA。

采用 UIKit + WKWebView 自定义本地资源源，不运行外部服务器。安全区约束在原生层执行。用户点保存时通过 UIDocumentPicker 导出，取消保存会传回取消状态；文件导入使用 WebKit 的系统文件选择器。

参考：[Apple development provisioning](https://developer.apple.com/help/account/provisioning-profiles/create-a-development-provisioning-profile)、[WKURLSchemeHandler](https://developer.apple.com/documentation/webkit/wkurlschemehandler)、[Files export picker](https://developer.apple.com/documentation/uikit/uidocumentpickerviewcontroller/init(forexporting:ascopy:))。
