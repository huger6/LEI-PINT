class BadgeRequirementModel {
  final int id;
  final int badgeId;
  final String title;
  final int? sequence;
  final String description;
  final String? imgUrl;
  final int points;

  BadgeRequirementModel({
    required this.id,
    required this.badgeId,
    required this.title,
    this.sequence,
    required this.description,
    this.imgUrl,
    this.points = 0,
  });

  factory BadgeRequirementModel.fromJson(Map<String, dynamic> json) {
    return BadgeRequirementModel(
      id: _toInt(json['id'] ?? json['requirement_id']),
      badgeId: _toInt(json['badge_id']),
      title: (json['title'] ?? json['requirement_title'] ?? '').toString(),
      sequence: json['sequence'] != null || json['requirement_sequence'] != null
          ? _toInt(json['sequence'] ?? json['requirement_sequence'])
          : null,
      description: (json['description'] ??
              json['requirement_description'] ??
              '')
          .toString(),
      imgUrl: json['img_url']?.toString() ??
          json['requirement_img_url']?.toString(),
      points: _toInt(json['points'] ?? json['badge_points'] ?? 0),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
