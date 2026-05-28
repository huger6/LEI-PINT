class NotificationModel {
  final int id;
  final int definitionId;
  final String? payload;
  final String? url;
  final String notificationType;
  final bool isRead;
  final DateTime sentAt;

  NotificationModel({
    required this.id,
    required this.definitionId,
    this.payload,
    this.url,
    this.notificationType = 'SYSTEM',
    required this.isRead,
    required this.sentAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: _toInt(json['id'] ?? json['notification_id']),
      definitionId: _toInt(json['definition_id']),
      payload: json['payload']?.toString() ??
          json['notification_payload']?.toString(),
      url: json['url']?.toString() ?? json['notification_url']?.toString(),
      notificationType: (json['notification_type'] ?? json['type'] ?? 'SYSTEM')
          .toString()
          .toUpperCase(),
      isRead: json['is_read'] == true || json['is_read'] == 1,
      sentAt: _parseDate(json['sent_at']) ?? DateTime.now(),
    );
  }

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      definitionId: definitionId,
      payload: payload,
      url: url,
      notificationType: notificationType,
      isRead: isRead ?? this.isRead,
      sentAt: sentAt,
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    return DateTime.tryParse(value.toString());
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
