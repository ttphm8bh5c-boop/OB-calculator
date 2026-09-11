import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        
        // 允許離線載入本機資源
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = true
        
        // 載入 WebResources 目錄內的 index.html
        if let resourcePath = Bundle.main.resourcePath {
            let webDir = URL(fileURLWithPath: resourcePath).appendingPathComponent("WebResources")
            let htmlFile = webDir.appendingPathComponent("index.html")
            
            if FileManager.default.fileExists(atPath: htmlFile.path) {
                webView.loadFileURL(htmlFile, allowingReadAccessTo: webDir)
            } else if let altPath = Bundle.main.path(forResource: "index", ofType: "html") {
                let altUrl = URL(fileURLWithPath: altPath)
                webView.loadFileURL(altUrl, allowingReadAccessTo: altUrl.deletingLastPathComponent())
            }
        }
        
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // 不需要動態刷新
    }
}

struct ContentView: View {
    var body: some View {
        WebView()
            .ignoresSafeArea()
    }
}

