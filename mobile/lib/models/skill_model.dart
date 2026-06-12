class SkillModel {
  final int id;
  final int? badgeId;
  final String name;
  final String? description;

  SkillModel({
    required this.id,
    this.badgeId,
    required this.name,
    this.description,
  });

  factory SkillModel.fromJson(Map<String, dynamic> json) {
    return SkillModel(
      id: _toInt(json['id'] ?? json['skills_id']),
      badgeId: json['badge_id'] != null ? _toInt(json['badge_id']) : null,
      name: (json['name'] ?? json['skill_name'] ?? '').toString(),
      description: json['description']?.toString() ??
          json['skill_description']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
