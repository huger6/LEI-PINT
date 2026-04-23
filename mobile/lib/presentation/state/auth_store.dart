import 'package:flutter/foundation.dart';

import '../../data/remote/api_client.dart';
import '../../data/remote/supabase_storage_service.dart';
import '../../data/repositories/auth_repo.dart';
import '../../models/area_model.dart';
import '../../models/dtos/registration_data.dart';
import '../../models/user_model.dart';

class AuthStore extends ChangeNotifier {
  AuthStore(this._authRepository, this._apiClient, {SupabaseStorageService? storageService})
      : _storageService = storageService;

  final AuthRepository _authRepository;
  final ApiClient _apiClient;
  final SupabaseStorageService? _storageService;

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

    if (result['accessToken'] != null || result['token'] != null) {
      _accessToken = (result['accessToken'] ?? result['token']).toString();
      _currentUser = result['user'] as UserModel?;
      _apiClient.setAccessToken(_accessToken);
      notifyListeners();
    }

    return result;
  }

  Future<bool> submitRegistration() async {
    try {
      String? profileImageUrl;

      final image = _draftRegistration.profileImage;
      if (image != null && _storageService != null) {
        profileImageUrl = await _storageService.uploadProfileImageToTemp(image);
      }

      final payload = _draftRegistration.toJson(profileImageUrl);

      await _authRepository.register(payload);

      _draftRegistration = RegistrationData();
      notifyListeners();

      return true;
    } catch (e) {
      debugPrint('Registration submission error: $e');
      return false;
    }
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
    _draftRegistration =
        RegistrationData();
    _apiClient.setAccessToken(null);
    notifyListeners();
  }
}
