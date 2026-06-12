class GoalModel {
  final int goalId;
  final int? badgeId;
  final int? applicationId;
  final String title;
  final String description;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? reminderAt;
  final bool isCompleted;
  final GoalBadge? badge;

  const GoalModel({
    required this.goalId,
    this.badgeId,
    this.applicationId,
    required this.title,
    this.description = '',
    this.startDate,
    this.endDate,
    this.reminderAt,
    this.isCompleted = false,
    this.badge,
  });

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    final badgeJson = json['badge'];

    return GoalModel(
      goalId: _toInt(json['goalId'] ?? json['goal_id']),
      badgeId: json['badgeId'] != null || json['badge_id'] != null
          ? _toInt(json['badgeId'] ?? json['badge_id'])
          : null,
      applicationId: json['applicationId'] != null || json['application_id'] != null
          ? _toInt(json['applicationId'] ?? json['application_id'])
          : null,
      title: (json['title'] ?? json['event_title'] ?? '').toString(),
      description: (json['description'] ?? json['event_description'] ?? '').toString(),
      startDate: _parseDate(json['startDate'] ?? json['event_start_date']),
      endDate: _parseDate(json['endDate'] ?? json['event_end_date']),
      reminderAt: _parseDate(json['reminderAt'] ?? json['reminder_at']),
      isCompleted: json['isCompleted'] == true,
      badge: badgeJson is Map<String, dynamic>
          ? GoalBadge.fromJson(badgeJson)
          : null,
    );
  }

  GoalModel copyWith({bool? isCompleted, DateTime? endDate}) {
    return GoalModel(
      goalId: goalId,
      badgeId: badgeId,
      applicationId: applicationId,
      title: title,
      description: description,
      startDate: startDate,
      endDate: endDate ?? this.endDate,
      reminderAt: reminderAt,
      isCompleted: isCompleted ?? this.isCompleted,
      badge: badge,
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    return DateTime.tryParse(value.toString());
  }
}

class GoalBadge {
  final int id;
  final String title;
  final String slug;
  final String? imageUrl;
  final int points;

  const GoalBadge({
    required this.id,
    required this.title,
    this.slug = '',
    this.imageUrl,
    this.points = 0,
  });

  factory GoalBadge.fromJson(Map<String, dynamic> json) {
    return GoalBadge(
      id: json['id'] is int ? json['id'] : (int.tryParse(json['id']?.toString() ?? '') ?? 0),
      title: (json['title'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      imageUrl: json['imageUrl']?.toString(),
      points: json['points'] is int ? json['points'] : (int.tryParse(json['points']?.toString() ?? '') ?? 0),
    );
  }
}
