import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../data/remote/api_client.dart';
import '../../injection_container.dart';
import '../constants/api_endpoints.dart';
import '../constants/sync_codes.dart';
import '../utils/notification_translator.dart';
import 'local_notifications_service.dart';
import 'sync_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();

  try {
    await setupDependencies();
  } catch (_) {}

  await FCMService._handleMessage(message);
}

class FCMService {
  static const String _topicName = 'new_data';

  static Future<void> initialize() async {
    await LocalNotificationsService.init();

    final messaging = FirebaseMessaging.instance;

    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      FirebaseMessaging.onBackgroundMessage(
        firebaseMessagingBackgroundHandler,
      );

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        // Foreground: the OS does not auto-display a notification block, so we
        // render it ourselves.
        _handleMessage(message, renderNotificationBlock: true);
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleMessage(message);
      });

      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessage(initialMessage);
      }

      messaging.onTokenRefresh.listen((newToken) async {
        try {
          final apiClient = getIt<ApiClient>();
          await _registerTokenWithApi(apiClient, newToken);
        } catch (_) {}
      });
    }
  }

  static Future<void> subscribe(ApiClient apiClient) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(_topicName);
    } catch (_) {}

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _registerTokenWithApi(apiClient, token);
      }
    } catch (_) {}
  }

  static Future<void> unsubscribe(ApiClient apiClient) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _unregisterTokenWithApi(apiClient, token);
      }
    } catch (_) {}

    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(_topicName);
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {}
  }

  static Future<void> _registerTokenWithApi(
    ApiClient apiClient,
    String fcmToken,
  ) async {
    final platform = Platform.isIOS ? 'ios' : 'android';

    await apiClient.dio.post(
      ApiEndpoints.registerDeviceToken,
      data: {
        'fcm_token': fcmToken,
        'platform': platform,
      },
    );
  }

  static Future<void> _unregisterTokenWithApi(
    ApiClient apiClient,
    String fcmToken,
  ) async {
    await apiClient.dio.post(
      ApiEndpoints.unregisterDeviceToken,
      data: {'fcm_token': fcmToken},
    );
  }

  static Future<void> _handleMessage(
    RemoteMessage message, {
    bool renderNotificationBlock = false,
  }) async {
    final data = message.data;
    final notification = message.notification;

    // Server-sent OS notification block (already translated, e.g. the hardcoded
    // PT "application submitted" push). When the app is in the background or
    // terminated the OS renders it itself, so we only render it here in the
    // foreground. Either way we still trigger a background sync.
    if (notification != null) {
      if (renderNotificationBlock) {
        await LocalNotificationsService.show(
          title: notification.title ?? '',
          body: notification.body ?? '',
          payload: data['notification_url']?.toString(),
        );
      }

      try {
        final syncService = getIt<SyncService>();
        await syncService.handleUpdate(
          SyncCodes.notifications,
          DateTime.now().toIso8601String(),
        );
      } catch (_) {}
      return;
    }

    if (data.containsKey('notification_id')) {
      // Build and fire the visible notification ourselves: the server sends a
      // silent data-only message carrying translation keys; translate them into
      // the device's language, then show it (vibrate + readable text).
      await _showTranslatedNotification(data);

      try {
        final syncService = getIt<SyncService>();
        await syncService.handleUpdate(
          SyncCodes.notifications,
          DateTime.now().toIso8601String(),
        );
      } catch (_) {}
      return;
    }

    final updateCodeRaw = data['update_code'];
    final timestamp = data['timestamp'];

    if (updateCodeRaw == null || timestamp == null) return;

    final updateCode = int.tryParse(updateCodeRaw.toString());
    if (updateCode == null) return;

    try {
      final syncService = getIt<SyncService>();
      await syncService.handleUpdate(updateCode, timestamp.toString());
    } catch (_) {}
  }

  /// Translates the push payload's title/body keys into the device's language
  /// (interpolating `meta`) and fires a visible local notification.
  static Future<void> _showTranslatedNotification(
    Map<String, dynamic> data,
  ) async {
    try {
      final translated = await translatePush(
        titleKey: data['title_key']?.toString(),
        bodyKey: data['body_key']?.toString(),
        metaJson: data['meta']?.toString(),
      );

      if (translated.title.isEmpty && translated.body.isEmpty) return;

      await LocalNotificationsService.show(
        title: translated.title,
        body: translated.body,
        payload: data['notification_url']?.toString(),
      );
    } catch (_) {}
  }
}
