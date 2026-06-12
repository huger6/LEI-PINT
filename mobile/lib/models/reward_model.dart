class RewardModel {
  final int id;
  final int? badgeId;
  final String? title;
  final String? portraitSvg;

  RewardModel({
    required this.id,
    this.badgeId,
    this.title,
    this.portraitSvg,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) {
    return RewardModel(
      id: _toInt(json['id'] ?? json['reward_id']),
      badgeId: json['badge_id'] != null ? _toInt(json['badge_id']) : null,
      title: json['title']?.toString() ?? json['special_title']?.toString(),
      portraitSvg: json['portrait_svg']?.toString() ??
          json['special_portrait_svg']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
