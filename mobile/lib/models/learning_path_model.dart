class LearningPathModel {
  final int id;
  final String title;
  final String? slug;
  final String? description;
  final String? imgUrl;

  LearningPathModel({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.imgUrl,
  });

  factory LearningPathModel.fromJson(Map<String, dynamic> json) {
    return LearningPathModel(
      id: _toInt(json['id'] ?? json['learning_path_id']),
      title: (json['title'] ?? json['path_title'] ?? '').toString(),
      slug: json['slug']?.toString() ?? json['path_slug']?.toString(),
      description: json['description']?.toString() ??
          json['path_description']?.toString(),
      imgUrl: json['img_url']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
