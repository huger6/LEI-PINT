import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../injection_container.dart';
import 'sync_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();

  try {
    await setupDependencies();
  } catch (e) {
    debugPrint('FCM background: dependency init failed: $e');
  }

  await FCMService._handleMessage(message);
}

class FCMService {
  static const String _topicName = 'new_data';

  static Future<void> initialize() async {
    final messaging = FirebaseMessaging.instance;

    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('FCM: Permissions granted.');

      FirebaseMessaging.onBackgroundMessage(
        firebaseMessagingBackgroundHandler,
      );

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('FCM: Foreground message received.');
        _handleMessage(message);
      });
    } else {
      debugPrint('FCM: Permissions denied.');
    }
  }

  static Future<void> subscribe() async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(_topicName);
      debugPrint('FCM: Subscribed to $_topicName.');
    } catch (e) {
      debugPrint('FCM: Subscribe error: $e');
    }
  }

  static Future<void> unsubscribe() async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(_topicName);
      await FirebaseMessaging.instance.deleteToken();
      debugPrint('FCM: Unsubscribed and token cleared.');
    } catch (e) {
      debugPrint('FCM: Unsubscribe error: $e');
    }
  }

  static Future<void> _handleMessage(RemoteMessage message) async {
    final data = message.data;

    debugPrint('═══════════════════════════════════════════════════');
    debugPrint('FCM: Firebase message received');
    debugPrint('FCM: Full data payload: $data');
    if (message.notification != null) {
      debugPrint(
        'FCM: Notification title=${message.notification!.title} '
        'body=${message.notification!.body}',
      );
    }
    debugPrint('═══════════════════════════════════════════════════');

    final updateCodeRaw = data['update_code'];
    final timestamp = data['timestamp'];

    if (updateCodeRaw == null || timestamp == null) {
      debugPrint('FCM: Missing update_code or timestamp, ignoring message.');
      return;
    }

    final updateCode = int.tryParse(updateCodeRaw.toString());
    if (updateCode == null) {
      debugPrint('FCM: Invalid update_code format: $updateCodeRaw');
      return;
    }

    debugPrint('FCM: Parsed update_code=$updateCode timestamp=$timestamp');

    try {
      final syncService = getIt<SyncService>();
      // handleUpdate already filters by active screen relevance
      await syncService.handleUpdate(updateCode, timestamp.toString());
    } catch (e) {
      debugPrint('FCM: Sync handling failed: $e');
    }
  }
}
