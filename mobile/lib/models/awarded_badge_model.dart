class AwardedBadgeModel {
  final int id;
  final int applicationId;
  final String? applicationGuid;
  final int badgeId;
  final DateTime awardedAt;
  final DateTime? expirationAt;
  final int? pointsSnapshot;
  final String? verificationLink;
  final bool isPublished;
  final bool isFeatured;
  final int? displayOrder;

  AwardedBadgeModel({
    required this.id,
    required this.applicationId,
    this.applicationGuid,
    required this.badgeId,
    required this.awardedAt,
    this.expirationAt,
    this.pointsSnapshot,
    this.verificationLink,
    this.isPublished = false,
    this.isFeatured = false,
    this.displayOrder,
  });

  bool get isExpired {
    if (expirationAt == null) return false;
    return DateTime.now().isAfter(expirationAt!);
  }

  factory AwardedBadgeModel.fromJson(Map<String, dynamic> json) {
    return AwardedBadgeModel(
      id: _toInt(json['id'] ?? json['awarded_badges_id']),
      applicationId: _toInt(json['application_id']),
      applicationGuid: json['application_guid']?.toString(),
      badgeId: _toInt(json['badge_id']),
      awardedAt: _parseDate(json['awarded_at']) ?? DateTime.now(),
      expirationAt: _parseDate(json['expiration_at']),
      pointsSnapshot: json['points_snapshot'] != null
          ? _toInt(json['points_snapshot'])
          : null,
      verificationLink: json['verification_link']?.toString() ??
          json['public_verification_link']?.toString(),
      isPublished: json['is_published'] == true || json['is_published'] == 1,
      isFeatured: json['is_featured'] == true || json['is_featured'] == 1,
      displayOrder: json['display_order'] != null
          ? _toInt(json['display_order'])
          : null,
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
