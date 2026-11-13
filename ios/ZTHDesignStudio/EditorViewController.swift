import UIKit
import WebKit

/// A stable private origin gives bundled fonts, ES modules and IndexedDB one namespace.
final class BundledAssets: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url, url.host == "app",
              let root = Bundle.main.resourceURL?.appendingPathComponent("App") else {
            task.didFailWithError(URLError(.badURL)); return
        }
        let relative = url.path == "/" ? "index.html" : String(url.path.dropFirst())
        let file = root.appendingPathComponent(relative).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path + "/"),
              let data = try? Data(contentsOf: file) else {
            task.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let types = ["js": "text/javascript", "mjs": "text/javascript", "html": "text/html",
                     "css": "text/css", "json": "application/json", "png": "image/png",
                     "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp",
                     "svg": "image/svg+xml", "woff2": "font/woff2", "webmanifest": "application/manifest+json"]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
            "Content-Type": types[file.pathExtension] ?? "application/octet-stream",
            "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache"
        ])!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) { }
}

final class EditorViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, UIDocumentPickerDelegate {
    private var webView: WKWebView!
    private var exportDirectory: URL?
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .all }
    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 247/255, green: 246/255, blue: 249/255, alpha: 1)
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.setURLSchemeHandler(BundledAssets(), forURLScheme: "zth-studio")
        configuration.userContentController.add(self, name: "zthSave")
        // Reuse the editor's native save contract. The callback fires after Files accepts/cancels.
        configuration.userContentController.addUserScript(WKUserScript(source:
            "if(!crypto.randomUUID){crypto.randomUUID=function(){var b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;return Array.from(b,function(v,i){return ([4,6,8,10].indexOf(i)>=0?'-':'')+v.toString(16).padStart(2,'0');}).join('');};}window.ZTHAndroid={save:function(name,encoded){window.webkit.messageHandlers.zthSave.postMessage({name:name,encoded:encoded});}};window.ZTHiOS=window.ZTHAndroid;",
            injectionTime: .atDocumentStart, forMainFrameOnly: true))
        // WebKit's accept filter can grey out custom project extensions in Files.
        // The editor's import parser still validates formats and project limits.
        configuration.userContentController.addUserScript(WKUserScript(source:
            "document.getElementById('projectInput')?.removeAttribute('accept');",
            injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor)
        ])
        webView.load(URLRequest(url: URL(string: "zth-studio://app/index.html")!))
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let url = navigationAction.request.url
        decisionHandler(url?.scheme == "zth-studio" && url?.host == "app" ? .allow : .cancel)
    }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.scheme == "zth-studio",
              exportDirectory == nil, presentedViewController == nil,
              let body = message.body as? [String: String], let name = body["name"],
              let encoded = body["encoded"], encoded.count <= 100_000_000,
              ["zthpmsj", "png", "jpg", "svg", "pdf"].contains((name as NSString).pathExtension.lowercased()),
              let bytes = Data(base64Encoded: encoded) else { saved(false); return }
        let safeName = name.components(separatedBy: CharacterSet(charactersIn: "\\/:*?\"<>|")).joined(separator: "-")
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let file = directory.appendingPathComponent(safeName)
            try bytes.write(to: file, options: .atomic)
            exportDirectory = directory
            let picker = UIDocumentPickerViewController(forExporting: [file], asCopy: true)
            picker.delegate = self
            present(picker, animated: true)
        } catch { try? FileManager.default.removeItem(at: directory); saved(false) }
    }
    private func saved(_ success: Bool) {
        webView.evaluateJavaScript("window.ZTHAndroidSaved&&window.ZTHAndroidSaved(\(success ? "true" : "false"))")
    }
    private func finishExport(_ success: Bool) {
        if let directory = exportDirectory { try? FileManager.default.removeItem(at: directory) }
        exportDirectory = nil
        saved(success)
    }
    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { finishExport(false) }
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) { finishExport(!urls.isEmpty) }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let dialog = UIAlertController(title: "ZTH Design Studio", message: message, preferredStyle: .alert)
        dialog.addAction(UIAlertAction(title: "确定 / OK", style: .default) { _ in completionHandler() })
        present(dialog, animated: true)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let dialog = UIAlertController(title: "ZTH Design Studio", message: message, preferredStyle: .alert)
        dialog.addAction(UIAlertAction(title: "取消 / Cancel", style: .cancel) { _ in completionHandler(false) })
        dialog.addAction(UIAlertAction(title: "确定 / OK", style: .default) { _ in completionHandler(true) })
        present(dialog, animated: true)
    }
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let dialog = UIAlertController(title: "ZTH Design Studio", message: prompt, preferredStyle: .alert)
        dialog.addTextField { $0.text = defaultText }
        dialog.addAction(UIAlertAction(title: "取消 / Cancel", style: .cancel) { _ in completionHandler(nil) })
        dialog.addAction(UIAlertAction(title: "确定 / OK", style: .default) { _ in completionHandler(dialog.textFields?.first?.text) })
        present(dialog, animated: true)
    }
}
