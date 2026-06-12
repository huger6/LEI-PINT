class AreaModel {
  final int id;
  final int? serviceLineId;
  final String name;
  final String? slug;
  final String? description;
  final String? imgUrl;

  AreaModel({
    required this.id,
    this.serviceLineId,
    required this.name,
    this.slug,
    this.description,
    this.imgUrl,
  });

  factory AreaModel.fromJson(Map<String, dynamic> json) {
    return AreaModel(
      id: _toInt(json['id'] ?? json['area_id']),
      serviceLineId: json['service_line_id'] != null
          ? _toInt(json['service_line_id'])
          : null,
      name: (json['name'] ?? json['area_name'] ?? '').toString(),
      slug: json['slug']?.toString() ?? json['area_slug']?.toString(),
      description: json['description']?.toString() ??
          json['area_description']?.toString(),
      imgUrl: json['img_url']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (serviceLineId != null) 'service_line_id': serviceLineId,
      'name': name,
      if (slug != null) 'slug': slug,
      if (description != null) 'description': description,
      if (imgUrl != null) 'img_url': imgUrl,
    };
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
