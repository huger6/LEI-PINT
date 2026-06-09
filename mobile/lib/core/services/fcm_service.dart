import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../data/remote/api_client.dart';
import '../../injection_container.dart';
import '../constants/api_endpoints.dart';
import '../constants/sync_codes.dart';
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

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('FCM: Notification tapped (app was in background).');
        _handleMessage(message);
      });

      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('FCM: App opened from terminated state via notification.');
        _handleMessage(initialMessage);
      }

      messaging.onTokenRefresh.listen((newToken) async {
        debugPrint('FCM: Token refreshed, re-registering with API.');
        try {
          final apiClient = getIt<ApiClient>();
          await _registerTokenWithApi(apiClient, newToken);
        } catch (e) {
          debugPrint('FCM: Token refresh re-registration failed: $e');
        }
      });
    } else {
      debugPrint('FCM: Permissions denied.');
    }
  }

  static Future<void> subscribe(ApiClient apiClient) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(_topicName);
      debugPrint('FCM: Subscribed to $_topicName.');
    } catch (e) {
      debugPrint('FCM: Subscribe error: $e');
    }

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _registerTokenWithApi(apiClient, token);
      } else {
        debugPrint('FCM: No device token available.');
      }
    } catch (e) {
      debugPrint('FCM: Device token registration failed: $e');
    }
  }

  static Future<void> unsubscribe(ApiClient apiClient) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _unregisterTokenWithApi(apiClient, token);
      }
    } catch (e) {
      debugPrint('FCM: Device token unregistration failed: $e');
    }

    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(_topicName);
      await FirebaseMessaging.instance.deleteToken();
      debugPrint('FCM: Unsubscribed and token cleared.');
    } catch (e) {
      debugPrint('FCM: Unsubscribe error: $e');
    }
  }

  static Future<void> _registerTokenWithApi(
    ApiClient apiClient,
    String fcmToken,
  ) async {
    final platform = Platform.isIOS ? 'ios' : 'android';

    final response = await apiClient.dio.post(
      ApiEndpoints.registerDeviceToken,
      data: {
        'fcm_token': fcmToken,
        'platform': platform,
      },
    );

    final code = response.data?['code'] ?? '';
    debugPrint('FCM: Device token registered ($code).');
  }

  static Future<void> _unregisterTokenWithApi(
    ApiClient apiClient,
    String fcmToken,
  ) async {
    await apiClient.dio.post(
      ApiEndpoints.unregisterDeviceToken,
      data: {'fcm_token': fcmToken},
    );
    debugPrint('FCM: Device token unregistered from API.');
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

    if (data.containsKey('notification_id')) {
      debugPrint('FCM: User-targeted push notification received.');
      try {
        final syncService = getIt<SyncService>();
        await syncService.handleUpdate(
          SyncCodes.notifications,
          DateTime.now().toIso8601String(),
        );
      } catch (e) {
        debugPrint('FCM: Notification sync failed: $e');
      }
      return;
    }

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
      await syncService.handleUpdate(updateCode, timestamp.toString());
    } catch (e) {
      debugPrint('FCM: Sync handling failed: $e');
    }
  }
}
