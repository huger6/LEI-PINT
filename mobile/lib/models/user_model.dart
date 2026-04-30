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
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final fullName =
        (json['fullName'] ?? json['full_name'] ?? json['name'] ?? '')
            .toString();

    return UserModel(
      id: _toInt(json['id']),
      email: (json['email'] ?? json['email_address'] ?? '').toString(),
      fullName: fullName,
      username: (json['username'] ?? '').toString(),
      profilePicture: (json['profilePicture'] ??
              json['profile_picture'] ??
              json['profile_img_url'] ??
              json['profileImg'])
          ?.toString(),
      role: json['role']?.toString(),
      biography: json['biography']?.toString(),
      gdprAccepted: json['gdpr_accepted'] == true ||
          json['gdpr_accepted'] == 1,
      totalPoints: _toInt(json['total_points'] ?? json['totalPoints'] ?? 0),
      preferredLangId: json['preferred_lang_id'] != null
          ? _toInt(json['preferred_lang_id'])
          : null,
      locationId: json['location_id'] != null
          ? _toInt(json['location_id'])
          : null,
    );
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
