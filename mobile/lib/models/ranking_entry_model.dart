class RankingEntryModel {
  RankingEntryModel({
    required this.userGuid,
    required this.fullName,
    required this.username,
    this.profileImgUrl,
    required this.totalPoints,
  });

  final String userGuid;
  final String fullName;
  final String username;
  final String? profileImgUrl;
  final int totalPoints;

  factory RankingEntryModel.fromJson(Map<String, dynamic> json) {
    return RankingEntryModel(
      userGuid: (json['user_guid'] ?? '').toString(),
      fullName: (json['full_name'] ?? json['name'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      profileImgUrl: json['profile_img_url']?.toString(),
      totalPoints: _toInt(json['total_points']),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
