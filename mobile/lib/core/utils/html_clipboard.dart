import 'package:flutter/services.dart';

class HtmlClipboard {
  static const _channel = MethodChannel('com.softinsa.badges_platform/clipboard');

  static Future<void> copyHtml(String html) async {
    try {
      await _channel.invokeMethod('copyHtml', {'html': html});
    } on MissingPluginException {
      await Clipboard.setData(ClipboardData(text: html));
    }
  }
}
