import 'dart:io';
import '../area_model.dart';
import '../location_model.dart';
import '../lang_model.dart';

class RegistrationData {
  String fullName = '';
  String username = '';
  String email = '';
  String password = '';
  String? phone;
  String? birthDate;
  String? bio;
  File? profileImage;
  LocationModel? location;
  LanguageModel? preferredLanguage;
  List<AreaModel> selectedAreas = [];
  AreaModel? mainArea;

  Map<String, dynamic> toJson(String? profileImageUrl) {
    final mainAreaId =
        mainArea?.id ??
        (selectedAreas.isNotEmpty ? selectedAreas.first.id : null);

    final selectedAreasPayload = selectedAreas
        .map(
          (area) => {
            'area_id': area.id,
            'is_primary': mainAreaId != null && mainAreaId == area.id,
          },
        )
        .toList();

    return {
      'full_name': fullName,
      'username': username,
      'email_address': email,
      'password': password,
      'user_role': 'Consultant',
      if (phone != null && phone!.trim().isNotEmpty) 'phone_number': phone,
      if (birthDate != null && birthDate!.trim().isNotEmpty)
        'birthdate': _toApiDate(birthDate!),
      if (bio != null && bio!.trim().isNotEmpty) 'biography': bio,
      if (profileImageUrl != null && profileImageUrl.isNotEmpty)
        'profile_img_url': profileImageUrl,
      if (location != null) 'location_id': location!.id,
      if (preferredLanguage != null) 'preferred_lang_id': preferredLanguage!.id,
      'areas': selectedAreasPayload,
    };
  }

  String _toApiDate(String input) {
    final parts = input.split('/');
    if (parts.length != 3) {
      return input;
    }

    final day = parts[0].padLeft(2, '0');
    final month = parts[1].padLeft(2, '0');
    final year = parts[2];
    return '$year-$month-$day';
  }
}
