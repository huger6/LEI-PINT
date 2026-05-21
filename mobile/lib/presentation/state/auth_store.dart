import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/services/fcm_service.dart';
import '../../data/remote/api_client.dart';
import '../../data/remote/supabase_storage_service.dart';
import '../../data/repositories/auth_repo.dart';
import '../../models/area_model.dart';
import '../../models/dtos/registration_data.dart';
import '../../models/user_model.dart';

class AuthStore extends ChangeNotifier {
  AuthStore(
    this._authRepository,
    this._apiClient, {
    SupabaseStorageService? storageService,
  }) : _storageService = storageService;

  final AuthRepository _authRepository;
  final ApiClient _apiClient;
  final SupabaseStorageService? _storageService;

  static const String _rememberKey = 'remember_me';
  static const String _sessionExpiryKey = 'session_expiry';

  String? _accessToken;
  UserModel? _currentUser;
  RegistrationData _draftRegistration = RegistrationData();
  String? _lastRegistrationError;

  String? get accessToken => _accessToken;
  UserModel? get currentUser => _currentUser;
  RegistrationData get draftRegistration => _draftRegistration;
  String? get lastRegistrationError => _lastRegistrationError;
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

      if (remember) {
        final expiryMs = DateTime.now()
            .add(const Duration(days: 30))
            .millisecondsSinceEpoch;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_rememberKey, true);
        await prefs.setInt(_sessionExpiryKey, expiryMs);
      }

      notifyListeners();
      await FCMService.subscribe();
    }

    return result;
  }

  Future<bool> tryRestoreSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final remember = prefs.getBool(_rememberKey) ?? false;
      if (!remember) return false;

      final expiryMs = prefs.getInt(_sessionExpiryKey) ?? 0;
      if (DateTime.now().millisecondsSinceEpoch > expiryMs) {
        await prefs.remove(_rememberKey);
        await prefs.remove(_sessionExpiryKey);
        return false;
      }

      final refreshResult = await _authRepository.refreshToken();
      if (refreshResult['success'] != true) return false;

      final data = refreshResult['data'];
      final token = data is Map ? data['token']?.toString() : null;
      if (token == null || token.isEmpty) return false;

      _accessToken = token;
      _apiClient.setAccessToken(_accessToken);

      final user = await _authRepository.getMe(accessToken: _accessToken);
      if (user != null) {
        _currentUser = user;
      }

      notifyListeners();
      await FCMService.subscribe();
      return true;
    } catch (e) {
      debugPrint('Session restore failed: $e');
      return false;
    }
  }

  Future<bool> submitRegistration() async {
    try {
      _lastRegistrationError = null;
      String? profileImageUrl;

      final image = _draftRegistration.profileImage;
      if (image != null && _storageService != null) {
        profileImageUrl = await _storageService.uploadProfileImageToTemp(image);
      }

      final payload = _draftRegistration.toJson(profileImageUrl);
      final result = await _authRepository.register(payload);

      if (result['success'] != true) {
        _lastRegistrationError =
            result['message']?.toString() ?? 'Erro ao criar conta.';
        notifyListeners();
        return false;
      }

      _draftRegistration = RegistrationData();
      notifyListeners();

      return true;
    } catch (e) {
      debugPrint('Registration submission error: $e');
      _lastRegistrationError = 'Erro ao criar conta. Tente novamente.';
      notifyListeners();
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

  Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
  ) async {
    final result = await _authRepository.updateProfile(data);
    if (result['success'] == true) {
      final refreshed = await _authRepository.getMe(accessToken: _accessToken);
      if (refreshed != null) {
        _currentUser = refreshed;
        notifyListeners();
      }
    }
    return result;
  }

  Future<Map<String, dynamic>> changeLanguage(int languageId) async {
    final result = await _authRepository.changeLanguage(languageId);
    if (result['success'] == true) {
      final refreshed = await _authRepository.getMe(accessToken: _accessToken);
      if (refreshed != null) {
        _currentUser = refreshed;
        notifyListeners();
      }
    }
    return result;
  }

  Future<Map<String, dynamic>> resendConfirmation(String email) {
    return _authRepository.resendConfirmation(email);
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) {
    return _authRepository.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }

  Future<void> clearSession() async {
    await FCMService.unsubscribe();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_rememberKey);
    await prefs.remove(_sessionExpiryKey);

    _accessToken = null;
    _currentUser = null;
    _draftRegistration = RegistrationData();
    _apiClient.setAccessToken(null);
    notifyListeners();
  }
}
