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
    final badgeJson = json['badge'] ?? json['badge_badge'];
    final appJson = json['application'];

    final appState = appJson is Map
        ? (appJson['application_state'] ?? appJson['applicationState'] ?? '').toString().toLowerCase()
        : '';
    final completed = json['isCompleted'] == true ||
        appState.contains('accepted') ||
        appState.contains('approved');

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
      isCompleted: completed,
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
      id: _readInt(json, 'badge_id') ?? _readInt(json, 'id') ?? 0,
      title: (json['badge_title'] ?? json['title'] ?? '').toString(),
      slug: (json['badge_slug'] ?? json['slug'] ?? '').toString(),
      imageUrl: (json['badge_img_url'] ?? json['imageUrl'])?.toString(),
      points: _readInt(json, 'badge_points') ?? _readInt(json, 'points') ?? 0,
    );
  }

  static int? _readInt(Map<String, dynamic> json, String key) {
    final v = json[key];
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '');
  }
}
