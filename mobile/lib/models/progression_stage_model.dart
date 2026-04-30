class ProgressionStageModel {
  final int id;
  final int areaId;
  final int stageCodeId;
  final String title;
  final int? sequence;
  final String? description;

  ProgressionStageModel({
    required this.id,
    required this.areaId,
    required this.stageCodeId,
    required this.title,
    this.sequence,
    this.description,
  });

  factory ProgressionStageModel.fromJson(Map<String, dynamic> json) {
    return ProgressionStageModel(
      id: _toInt(json['id'] ?? json['progression_stage_id']),
      areaId: _toInt(json['area_id']),
      stageCodeId: _toInt(json['stage_code_id']),
      title: (json['title'] ?? json['stage_title'] ?? '').toString(),
      sequence: json['sequence'] != null || json['stage_sequence'] != null
          ? _toInt(json['sequence'] ?? json['stage_sequence'])
          : null,
      description: json['description']?.toString() ??
          json['stage_description']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
