class UserModel {
  final int id;
  final String email;
  final String fullName;
  final String username;
  final String? profilePicture;
  final String? role;
  final String? biography;
  final bool gdprAccepted;
  final int totalPoints;
  final int? preferredLangId;
  final int? locationId;
  final String? serviceLineName;
  final String? learningPathTitle;
  final List<UserArea> areas;

  /// Account registration date. Only available if the profile endpoint exposes
  /// it (e.g. `created_at`); otherwise null.
  final DateTime? registeredAt;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.username,
    this.profilePicture,
    this.role,
    this.biography,
    this.gdprAccepted = false,
    this.totalPoints = 0,
    this.preferredLangId,
    this.locationId,
    this.serviceLineName,
    this.learningPathTitle,
    this.areas = const [],
    this.registeredAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final fullName =
        (json['fullName'] ?? json['full_name'] ?? json['name'] ?? '')
            .toString();

    final sl = json['serviceLine'];
    final slName = sl is Map
        ? (sl['name'] ?? sl['service_line_name'])?.toString()
        : json['service_line_name']?.toString();

    final lp = json['learningPath'];
    final lpTitle = lp is Map
        ? (lp['title'] ?? lp['path_title'])?.toString()
        : json['learning_path_title']?.toString();

    final rawAreas = json['areas'];
    final parsedAreas = <UserArea>[];
    if (rawAreas is List) {
      for (final a in rawAreas) {
        if (a is Map) {
          parsedAreas.add(UserArea.fromJson(Map<String, dynamic>.from(a)));
        }
      }
    }

    int? langId;
    final lang = json['lang'];
    if (lang is Map) {
      langId = lang['id'] is int ? lang['id'] as int : null;
    }
    langId ??= json['preferred_lang_id'] != null
        ? _toInt(json['preferred_lang_id'])
        : null;

    return UserModel(
      id: _toInt(json['id'] ?? json['user_id'] ?? 0),
      email: (json['email'] ?? json['email_address'] ?? '').toString(),
      fullName: fullName,
      username: (json['username'] ?? '').toString(),
      profilePicture: (json['profileImg'] ??
              json['profilePicture'] ??
              json['profile_picture'] ??
              json['profile_img_url'])
          ?.toString(),
      role: json['role']?.toString(),
      biography: json['biography']?.toString(),
      gdprAccepted: json['gdpr_accepted'] == true ||
          json['gdpr_accepted'] == 1,
      totalPoints: _toInt(json['total_points'] ?? json['totalPoints'] ?? 0),
      preferredLangId: langId,
      locationId: json['location_id'] != null
          ? _toInt(json['location_id'])
          : null,
      serviceLineName: slName,
      learningPathTitle: lpTitle,
      areas: parsedAreas,
      registeredAt: _toDate(json['registeredAt'] ??
          json['registered_at'] ??
          json['created_at'] ??
          json['createdAt'] ??
          json['registration_date']),
    );
  }

  static DateTime? _toDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    return DateTime.tryParse(value.toString());
  }

  factory UserModel.fromLoginPayload(
    Map<String, dynamic> json, {
    required String identifier,
  }) {
    return UserModel(
      id: 0,
      email: identifier.contains('@') ? identifier : '',
      fullName: (json['full_name'] ?? json['name'] ?? '').toString(),
      username: (json['username'] ?? identifier).toString(),
      profilePicture: json['profile_img_url']?.toString(),
      role: json['role']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'username': username,
      'profile_picture': profilePicture,
      'role': role,
      if (biography != null) 'biography': biography,
      'gdpr_accepted': gdprAccepted,
      'total_points': totalPoints,
      if (preferredLangId != null) 'preferred_lang_id': preferredLangId,
      if (locationId != null) 'location_id': locationId,
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

class UserArea {
  final String name;
  final String? slug;
  final bool isPrimary;

  const UserArea({required this.name, this.slug, this.isPrimary = false});

  factory UserArea.fromJson(Map<String, dynamic> json) {
    return UserArea(
      name: (json['name'] ?? json['area_name'] ?? '').toString(),
      slug: json['slug']?.toString() ?? json['area_slug']?.toString(),
      isPrimary: json['isPrimary'] == true || json['is_primary'] == true,
    );
  }
}
