class AreaModel {
  final int id;
  final String name;
  final String? slug;

  AreaModel({required this.id, required this.name, this.slug});

  factory AreaModel.fromJson(Map<String, dynamic> json) {
    return AreaModel(
      id: _toInt(json['id'] ?? json['area_id']),
      name: (json['name'] ?? json['area_name'] ?? '').toString(),
      slug: json['slug']?.toString() ?? json['area_slug']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, if (slug != null) 'slug': slug};
  }

  static int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value.toString()) ?? 0;
  }
}
