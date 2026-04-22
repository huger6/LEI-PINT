import 'dart:io';

import 'package:flutter/foundation.dart';

import '../../data/remote/api_client.dart';
import '../../data/repositories/auth_repo.dart';
import '../../models/area_model.dart';
import '../../models/dtos/registration_data.dart';
import '../../models/lang_model.dart';
import '../../models/location_model.dart';
import '../../models/user_model.dart';

class AuthStore extends ChangeNotifier {
  AuthStore(this._authRepository, this._apiClient);

  final AuthRepository _authRepository;
  final ApiClient _apiClient;

  String? _accessToken;
  UserModel? _currentUser;
  RegistrationData _draftRegistration = RegistrationData();

  String? get accessToken => _accessToken;
  UserModel? get currentUser => _currentUser;
  RegistrationData get draftRegistration => _draftRegistration;
  bool get isAuthenticated => _accessToken != null && _accessToken!.isNotEmpty;

  Future<Map<String, dynamic>> login(
    String identifier,
    String password,
    bool remember,
  ) async {
    final result = await _authRepository.login(identifier, password, remember);

    if (result['success'] == true) {
      _accessToken = result['accessToken']?.toString();
      _currentUser = result['user'] as UserModel?;
      _apiClient.setAccessToken(_accessToken);
      notifyListeners();
    }

    return result;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) {
    return _authRepository.register(userData);
  }

  Future<Map<String, dynamic>> submitDraftRegistration({
    String? profileImageUrl,
  }) {
    return _authRepository.register(_draftRegistration.toJson(profileImageUrl));
  }

  Future<Map<String, dynamic>> verifySession() {
    return _authRepository.verifySession();
  }

  Future<Map<String, dynamic>> forgotPassword(String email) {
    return _authRepository.forgotPassword(email);
  }

  void setAccessToken(String? token) {
    _accessToken = token;
    _apiClient.setAccessToken(token);
    notifyListeners();
  }

  void saveBasicRegistrationData({
    required String fullName,
    required String username,
    required String email,
    required String password,
    String? phone,
    String? birthDate,
    String? bio,
    File? profileImage,
    LocationModel? location,
    LanguageModel? preferredLanguage,
  }) {
    _draftRegistration
      ..fullName = fullName
      ..username = username
      ..email = email
      ..password = password
      ..phone = phone
      ..birthDate = birthDate
      ..bio = bio
      ..profileImage = profileImage
      ..location = location
      ..preferredLanguage = preferredLanguage;

    notifyListeners();
  }

  void saveRegistrationDraft(RegistrationData registrationData) {
    _draftRegistration = registrationData;
    notifyListeners();
  }

  void saveSelectedAreas(List<AreaModel> selectedAreas, AreaModel? mainArea) {
    _draftRegistration
      ..selectedAreas = List<AreaModel>.from(selectedAreas)
      ..mainArea = mainArea;

    notifyListeners();
  }

  Future<void> clearSession() async {
    _accessToken = null;
    _currentUser = null;
    _apiClient.setAccessToken(null);
    notifyListeners();
  }
}
