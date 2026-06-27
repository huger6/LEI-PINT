import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if let controller = window?.rootViewController as? FlutterViewController {
      let channel = FlutterMethodChannel(
        name: "com.softinsa.badges_platform/clipboard",
        binaryMessenger: controller.binaryMessenger
      )
      channel.setMethodCallHandler { (call, result) in
        if call.method == "copyHtml" {
          if let args = call.arguments as? [String: Any],
             let html = args["html"] as? String {
            let pasteboard = UIPasteboard.general
            pasteboard.items = [[
              "public.html": html.data(using: .utf8) ?? Data(),
              "public.utf8-plain-text": html
            ]]
            result(nil)
          } else {
            result(FlutterError(code: "INVALID_ARGS", message: "Missing html argument", details: nil))
          }
        } else {
          result(FlutterMethodNotImplemented)
        }
      }
    }
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
