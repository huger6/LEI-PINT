import 'dart:convert';

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

  /// The server stores the payload as a JSON document shaped like
  /// `{"title": ..., "body": ..., "meta": ...}`. Decode it once and cache it so
  /// the card can render a friendly title/body instead of the raw JSON string.
  Map<String, dynamic>? _decodedPayload;
  bool _payloadDecoded = false;

  Map<String, dynamic>? get _payloadMap {
    if (_payloadDecoded) return _decodedPayload;
    _payloadDecoded = true;
    final raw = payload;
    if (raw == null || raw.trim().isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        _decodedPayload = Map<String, dynamic>.from(decoded);
      }
    } catch (_) {
      // Legacy/plain-text payloads: keep them accessible as the body.
      _decodedPayload = {'body': raw};
    }
    return _decodedPayload;
  }

  /// Human-friendly title extracted from the payload, when present.
  String? get title {
    final value = _payloadMap?['title']?.toString().trim();
    return (value == null || value.isEmpty) ? null : value;
  }

  /// Human-friendly body extracted from the payload, when present.
  String? get body {
    final value = _payloadMap?['body']?.toString().trim();
    return (value == null || value.isEmpty) ? null : value;
  }

  /// Optional structured metadata carried alongside the notification.
  Map<String, dynamic>? get meta {
    final value = _payloadMap?['meta'];
    if (value is Map) return Map<String, dynamic>.from(value);
    return null;
  }

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
