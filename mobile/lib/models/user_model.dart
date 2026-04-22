class UserModel {
  final int id;
  final String email;
  final String fullName;
  final String username;
  final String? profilePicture;
  final String? role;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.username,
    this.profilePicture,
    this.role,
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
      profilePicture:
          (json['profilePicture'] ??
                  json['profile_picture'] ??
                  json['profileImg'])
              ?.toString(),
      role: json['role']?.toString(),
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
