class StageCodeModel {
  final int id;
  final String code;

  StageCodeModel({required this.id, required this.code});

  factory StageCodeModel.fromJson(Map<String, dynamic> json) {
    return StageCodeModel(
      id: _toInt(json['id'] ?? json['stage_code_id']),
      code: (json['code'] ?? json['stage_code'] ?? '').toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
