import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Shows on-device (local) notifications. Used to render push notifications
/// ourselves: the server sends a silent data-only message with a translation
/// key, the app translates it, and then fires the visible notification here.
class LocalNotificationsService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'softinsa_default',
    'Notificações',
    description: 'Notificações da Plataforma de Badges da Softinsa',
    importance: Importance.high,
  );

  /// Idempotent. Safe to call from the background isolate (initializes the
  /// plugin and the Android channel, and requests the runtime permission).
  static Future<void> init() async {
    if (_initialized) return;

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );

    final android13 = _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await android13?.createNotificationChannel(_channel);
    await android13?.requestNotificationsPermission();

    _initialized = true;
  }

  /// Builds and fires a visible notification (vibrates / shows text).
  static Future<void> show({
    required String title,
    required String body,
    String? payload,
  }) async {
    await init();
    if (title.isEmpty && body.isEmpty) return;

    final id = DateTime.now().millisecondsSinceEpoch.remainder(100000);
    await _plugin.show(
      id,
      title.isEmpty ? null : title,
      body.isEmpty ? null : body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: payload,
    );
  }
}
