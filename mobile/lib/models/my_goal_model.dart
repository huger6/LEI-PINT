class MyGoalModel {
  final int localId;
  final int? serverId;
  final int? badgeId;
  final int? applicationLocalId;
  final String title;
  final String? description;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? reminderAt;
  final DateTime? syncedAt;
  final bool pendingSync;

  MyGoalModel({
    required this.localId,
    this.serverId,
    this.badgeId,
    this.applicationLocalId,
    required this.title,
    this.description,
    this.startDate,
    this.endDate,
    this.reminderAt,
    this.syncedAt,
    this.pendingSync = true,
  });

  factory MyGoalModel.fromJson(
    Map<String, dynamic> json, {
    int? applicationLocalId,
  }) {
    return MyGoalModel(
      localId: 0,
      serverId: _toInt(json['id'] ?? json['goal_id']),
      badgeId: json['badge_id'] != null ? _toInt(json['badge_id']) : null,
      applicationLocalId: applicationLocalId,
      title: (json['title'] ?? json['goal_title'] ?? '').toString(),
      description: json['description']?.toString() ??
          json['goal_description']?.toString(),
      startDate: _parseDate(json['start_date'] ?? json['startDate']),
      endDate: _parseDate(json['end_date'] ?? json['endDate']),
      reminderAt: _parseDate(json['reminder_at'] ?? json['reminderAt']),
      syncedAt: DateTime.now(),
      pendingSync: false,
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
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  MyGoalModel copyWith({
    int? serverId,
    String? title,
    String? description,
    DateTime? startDate,
    DateTime? endDate,
    DateTime? reminderAt,
    DateTime? syncedAt,
    bool? pendingSync,
  }) {
    return MyGoalModel(
      localId: localId,
      serverId: serverId ?? this.serverId,
      badgeId: badgeId,
      applicationLocalId: applicationLocalId,
      title: title ?? this.title,
      description: description ?? this.description,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      reminderAt: reminderAt ?? this.reminderAt,
      syncedAt: syncedAt ?? this.syncedAt,
      pendingSync: pendingSync ?? this.pendingSync,
    );
  }

  Map<String, dynamic> toRow() {
    return {
      if (serverId != null) 'server_id': serverId,
      'badge_id': badgeId,
      'application_local_id': applicationLocalId,
      'title': title,
      'description': description,
      'start_date': startDate?.millisecondsSinceEpoch,
      'end_date': endDate?.millisecondsSinceEpoch,
      'reminder_at': reminderAt?.millisecondsSinceEpoch,
      'synced_at': syncedAt?.millisecondsSinceEpoch,
      'pending_sync': pendingSync ? 1 : 0,
    };
  }
}
