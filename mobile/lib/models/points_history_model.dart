class PointsHistoryModel {
  final int id;
  final int? requirementId;
  final int? badgeId;
  final int pointsDelta;
  final String? justification;

  PointsHistoryModel({
    required this.id,
    this.requirementId,
    this.badgeId,
    required this.pointsDelta,
    this.justification,
  });

  factory PointsHistoryModel.fromJson(Map<String, dynamic> json) {
    return PointsHistoryModel(
      id: _toInt(json['id'] ?? json['points_history_id']),
      requirementId: json['requirement_id'] != null
          ? _toInt(json['requirement_id'])
          : null,
      badgeId: json['badge_id'] != null ? _toInt(json['badge_id']) : null,
      pointsDelta: _toInt(json['points_delta'] ?? json['delta'] ?? 0),
      justification: json['justification']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
