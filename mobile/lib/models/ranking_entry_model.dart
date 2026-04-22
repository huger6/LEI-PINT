class RankingEntryModel {
  RankingEntryModel({
    required this.userId,
    required this.fullName,
    required this.totalPoints,
    required this.totalBadges,
  });

  final int userId;
  final String fullName;
  final int totalPoints;
  final int totalBadges;

  factory RankingEntryModel.fromJson(Map<String, dynamic> json) {
    return RankingEntryModel(
      userId: _toInt(json['user_id'] ?? json['id']),
      fullName: (json['full_name'] ?? json['name'] ?? '').toString(),
      totalPoints: _toInt(json['total_points']),
      totalBadges: _toInt(json['total_badges']),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
