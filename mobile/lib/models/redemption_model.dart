class RedemptionModel {
  final int id;
  final String redemptionGuid;
  final String? name;
  final String? accessLink;
  final String? accessInfo;
  final int pointsSpent;
  final DateTime redeemedAt;

  RedemptionModel({
    this.id = 0,
    required this.redemptionGuid,
    this.name,
    this.accessLink,
    this.accessInfo,
    required this.pointsSpent,
    required this.redeemedAt,
  });

  factory RedemptionModel.fromJson(Map<String, dynamic> json) {
    return RedemptionModel(
      id: _toInt(json['id'] ?? json['redemption_id'] ?? 0),
      redemptionGuid: (json['redemptionGuid'] ?? json['redemption_guid'] ?? '').toString(),
      name: json['name']?.toString() ?? json['reward_name']?.toString(),
      accessLink: json['accessLink']?.toString() ?? json['access_link']?.toString(),
      accessInfo: json['accessInfo']?.toString() ?? json['access_info']?.toString(),
      pointsSpent: _toInt(json['pointsSpent'] ?? json['points_spent'] ?? 0),
      redeemedAt: _parseDate(json['redeemedAt'] ?? json['redeemed_at']),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static DateTime _parseDate(dynamic value) {
    if (value is DateTime) return value;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    if (value is String) {
      return DateTime.tryParse(value) ?? DateTime.now();
    }
    return DateTime.now();
  }
}
