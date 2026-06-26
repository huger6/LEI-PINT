/// A user's effective notification preference for a single notification type
/// (definition), as returned by `GET /api/notifications/preferences`.
class NotificationPreferenceModel {
  const NotificationPreferenceModel({
    required this.definitionId,
    required this.code,
    required this.name,
    required this.description,
    required this.isEnabled,
    required this.sendPush,
    required this.sendEmail,
  });

  final int definitionId;
  final String code;
  final String name;
  final String description;

  /// Effective values (global default merged with the user's override).
  final bool isEnabled;
  final bool sendPush;
  final bool sendEmail;

  factory NotificationPreferenceModel.fromJson(Map<String, dynamic> json) {
    final effective = json['effective'];
    final eff = effective is Map ? Map<String, dynamic>.from(effective) : const {};

    bool readBool(dynamic value, {bool fallback = true}) {
      if (value is bool) return value;
      if (value is num) return value != 0;
      if (value is String) return value.toLowerCase() == 'true';
      return fallback;
    }

    return NotificationPreferenceModel(
      definitionId: (json['definition_id'] as num?)?.toInt() ?? 0,
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      isEnabled: readBool(eff['is_enabled']),
      sendPush: readBool(eff['send_push']),
      sendEmail: readBool(eff['send_email']),
    );
  }

  NotificationPreferenceModel copyWith({
    bool? isEnabled,
    bool? sendPush,
    bool? sendEmail,
  }) {
    return NotificationPreferenceModel(
      definitionId: definitionId,
      code: code,
      name: name,
      description: description,
      isEnabled: isEnabled ?? this.isEnabled,
      sendPush: sendPush ?? this.sendPush,
      sendEmail: sendEmail ?? this.sendEmail,
    );
  }
}
