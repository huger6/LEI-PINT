class AnnouncementModel {
  final int id;
  final String title;
  final String message;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? type;
  final bool isGlobal;
  final bool isActive;

  AnnouncementModel({
    required this.id,
    required this.title,
    required this.message,
    this.startsAt,
    this.endsAt,
    this.type,
    this.isGlobal = true,
    this.isActive = true,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) {
    return AnnouncementModel(
      id: _toInt(json['id'] ?? json['announcement_id']),
      title: (json['title'] ?? json['announcement_title'] ?? '').toString(),
      message: (json['message'] ?? json['announcement_message'] ?? '')
          .toString(),
      startsAt: _parseDate(json['starts_at']),
      endsAt: _parseDate(json['ends_at']),
      type: json['type']?.toString() ?? json['announcement_type']?.toString(),
      isGlobal: json['is_global'] == true || json['is_global'] == 1,
      isActive: json['is_active'] != false && json['is_active'] != 0,
    );
  }

  bool get isCurrentlyActive {
    if (!isActive) return false;
    final now = DateTime.now();
    if (startsAt != null && now.isBefore(startsAt!)) return false;
    if (endsAt != null && now.isAfter(endsAt!)) return false;
    return true;
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is int) {
      return DateTime.fromMillisecondsSinceEpoch(value);
    }
    return DateTime.tryParse(value.toString());
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
