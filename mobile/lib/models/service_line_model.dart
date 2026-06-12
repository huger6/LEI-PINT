class ServiceLineModel {
  final int id;
  final int? learningPathId;
  final String name;
  final String? slug;
  final String? description;
  final String? imgUrl;

  ServiceLineModel({
    required this.id,
    this.learningPathId,
    required this.name,
    this.slug,
    this.description,
    this.imgUrl,
  });

  factory ServiceLineModel.fromJson(Map<String, dynamic> json) {
    return ServiceLineModel(
      id: _toInt(json['id'] ?? json['service_line_id']),
      learningPathId: json['learning_path_id'] != null
          ? _toInt(json['learning_path_id'])
          : null,
      name: (json['name'] ?? json['service_line_name'] ?? '').toString(),
      slug: json['slug']?.toString() ?? json['sl_slug']?.toString(),
      description: json['description']?.toString() ??
          json['service_line_description']?.toString(),
      imgUrl: json['img_url']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
