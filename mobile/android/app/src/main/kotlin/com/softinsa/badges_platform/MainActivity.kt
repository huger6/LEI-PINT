package com.softinsa.badges_platform

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.softinsa.badges_platform/clipboard")
            .setMethodCallHandler { call, result ->
                if (call.method == "copyHtml") {
                    val html = call.argument<String>("html") ?: ""
                    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newHtmlText("Signature", html, html)
                    clipboard.setPrimaryClip(clip)
                    result.success(null)
                } else {
                    result.notImplemented()
                }
            }
    }
}
