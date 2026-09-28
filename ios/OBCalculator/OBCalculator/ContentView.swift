import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        ZStack {
            Color(red: 0.93, green: 0.95, blue: 0.97) // #EDF2F7 背景畫布
                .ignoresSafeArea()
            
            WebViewContainer()
                .ignoresSafeArea(.keyboard, edges: .bottom)
        }
    }
}

struct WebViewContainer: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences = preferences
        config.websiteDataStore = WKWebsiteDataStore.nonPersistent()
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
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
    }
}

