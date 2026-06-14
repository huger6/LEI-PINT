import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/database/database_helper.dart';
import '../../core/services/fcm_service.dart';
import '../../data/local/current_user_dao.dart';
import '../../data/remote/api_client.dart';
import '../../data/remote/supabase_storage_service.dart';
import '../../data/repositories/auth_repo.dart';
import '../../models/area_model.dart';
import '../../models/dtos/registration_data.dart';
import '../../models/user_model.dart';

class AuthStore extends ChangeNotifier {
  AuthStore(
    this._authRepository,
    this._apiClient,
    this._currentUserDao, {
    SupabaseStorageService? storageService,
  }) : _storageService = storageService;

  final AuthRepository _authRepository;
  final ApiClient _apiClient;
  final CurrentUserDao _currentUserDao;
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

      if (_currentUser != null) {
        await _currentUserDao.save(_currentUser!);
      }

      if (remember) {
        final expiryMs = DateTime.now()
            .add(const Duration(days: 30))
            .millisecondsSinceEpoch;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_rememberKey, true);
        await prefs.setInt(_sessionExpiryKey, expiryMs);
        debugPrint('login: remember=true, saved expiry=$expiryMs');
      } else {
        debugPrint('login: remember=false, session not persisted');
      }

      notifyListeners();
      await FCMService.subscribe(_apiClient);
    }

    return result;
  }

  Future<bool> tryRestoreSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final remember = prefs.getBool(_rememberKey) ?? false;
      debugPrint('tryRestoreSession: remember=$remember');
      if (!remember) return false;

      final expiryMs = prefs.getInt(_sessionExpiryKey) ?? 0;
      final now = DateTime.now().millisecondsSinceEpoch;
      debugPrint('tryRestoreSession: expiryMs=$expiryMs, now=$now, expired=${now > expiryMs}');
      if (now > expiryMs) {
        await prefs.remove(_rememberKey);
        await prefs.remove(_sessionExpiryKey);
        return false;
      }

      final cookies = await _apiClient.cookieJar.loadForRequest(
        Uri.parse('${_apiClient.dio.options.baseUrl}/api/auth/refresh'),
      );
      debugPrint('tryRestoreSession: cookies for refresh endpoint = ${cookies.map((c) => '${c.name}=${c.value.substring(0, 8)}...').toList()}');

      final refreshResult = await _authRepository.refreshToken();
      debugPrint('tryRestoreSession: refreshResult success=${refreshResult['success']}');
      if (refreshResult['success'] != true) return false;

      final data = refreshResult['data'];
      final token = data is Map ? data['token']?.toString() : null;
      debugPrint('tryRestoreSession: got token=${token != null && token.isNotEmpty}');
      if (token == null || token.isEmpty) return false;

      _accessToken = token;
      _apiClient.setAccessToken(_accessToken);

      final user = await _authRepository.getMe(accessToken: _accessToken);
      if (user != null) {
        _currentUser = user;
        await _currentUserDao.save(user);
      } else {
        _currentUser = await _currentUserDao.get();
      }

      notifyListeners();
      await FCMService.subscribe(_apiClient);
      debugPrint('tryRestoreSession: SUCCESS');
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

  /// Persists the consultant's chosen areas. Following the app's offline-first
  /// model, the selection is written to the locally cached profile (the source
  /// of truth for every screen) and pushed to the API best-effort. The areas
  /// are only sent here, on explicit confirmation; navigating away without
  /// calling this leaves the previous selection untouched.
  Future<Map<String, dynamic>> updateMyAreas(
    List<AreaModel> selectedAreas,
    AreaModel? mainArea,
  ) async {
    final payload = selectedAreas
        .map(
          (area) => <String, dynamic>{
            'area_id': area.id,
            'is_primary': mainArea != null && area.id == mainArea.id,
          },
        )
        .toList();

    // Best-effort remote push; the local write below is what the UI reads.
    final result = await _authRepository.updateMyAreas(payload);

    if (_currentUser != null) {
      if (result['success'] == true) {
        // Server accepted it: take the canonical profile back from the API.
        final refreshed =
            await _authRepository.getMe(accessToken: _accessToken);
        _currentUser =
            refreshed ?? _withAreas(_currentUser!, selectedAreas, mainArea);
      } else {
        // Offline / endpoint unavailable: keep the choice locally so the
        // profile and recommendations reflect it immediately.
        _currentUser = _withAreas(_currentUser!, selectedAreas, mainArea);
      }
      await _currentUserDao.save(_currentUser!);
      notifyListeners();
    }

    // The selection is always stored locally, so report success to the UI.
    return {'success': true, if (result['success'] != true) 'localOnly': true};
  }

  /// Returns a copy of [user] whose areas reflect [selectedAreas], marking
  /// [mainArea] as primary. The profile only carries area name/slug/isPrimary.
  UserModel _withAreas(
    UserModel user,
    List<AreaModel> selectedAreas,
    AreaModel? mainArea,
  ) {
    final areas = selectedAreas
        .map(
          (area) => UserArea(
            name: area.name,
            slug: area.slug,
            isPrimary: mainArea != null && area.id == mainArea.id,
          ),
        )
        .toList();

    return UserModel(
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      profilePicture: user.profilePicture,
      role: user.role,
      biography: user.biography,
      gdprAccepted: user.gdprAccepted,
      totalPoints: user.totalPoints,
      preferredLangId: user.preferredLangId,
      locationId: user.locationId,
      serviceLineName: user.serviceLineName,
      learningPathTitle: user.learningPathTitle,
      areas: areas,
    );
  }

  Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
  ) async {
    final result = await _authRepository.updateProfile(data);
    if (result['success'] == true) {
      final refreshed = await _authRepository.getMe(accessToken: _accessToken);
      if (refreshed != null) {
        _currentUser = refreshed;
      } else if (_currentUser != null) {
        _currentUser = _applyProfilePatch(_currentUser!, data);
      }
      if (_currentUser != null) {
        await _currentUserDao.save(_currentUser!);
      }
      notifyListeners();
    }
    return result;
  }

  Future<Map<String, dynamic>> changeLanguage(int languageId) async {
    final result = await _authRepository.changeLanguage(languageId);
    if (result['success'] == true) {
      final refreshed = await _authRepository.getMe(accessToken: _accessToken);
      if (refreshed != null) {
        _currentUser = refreshed;
      }
      if (_currentUser != null) {
        await _currentUserDao.save(_currentUser!);
      }
      notifyListeners();
    }
    return result;
  }

  Future<Map<String, dynamic>> resendConfirmation(String email) {
    return _authRepository.resendConfirmation(email);
  }

  Future<void> fetchPoints() async {
    final result = await _authRepository.fetchPoints();
    if (result['success'] == true && _currentUser != null) {
      final pts = result['totalPoints'];
      final totalPoints = pts is int ? pts : int.tryParse(pts.toString()) ?? 0;
      _currentUser = UserModel(
        id: _currentUser!.id,
        email: _currentUser!.email,
        fullName: _currentUser!.fullName,
        username: _currentUser!.username,
        profilePicture: _currentUser!.profilePicture,
        role: _currentUser!.role,
        biography: _currentUser!.biography,
        gdprAccepted: _currentUser!.gdprAccepted,
        totalPoints: totalPoints,
        preferredLangId: _currentUser!.preferredLangId,
        locationId: _currentUser!.locationId,
        serviceLineName: _currentUser!.serviceLineName,
        learningPathTitle: _currentUser!.learningPathTitle,
        areas: _currentUser!.areas,
      );
      notifyListeners();
    }
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
    await FCMService.unsubscribe(_apiClient);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_rememberKey);
    await prefs.remove(_sessionExpiryKey);

    _accessToken = null;
    _currentUser = null;
    _draftRegistration = RegistrationData();
    _apiClient.setAccessToken(null);
    await _currentUserDao.clear();

    await LocalDatabase.instance.clearUserData();

    notifyListeners();
  }

  UserModel _applyProfilePatch(UserModel user, Map<String, dynamic> data) {
    return UserModel(
      id: user.id,
      email: user.email,
      fullName: (data['full_name'] as String?) ?? user.fullName,
      username: (data['username'] as String?) ?? user.username,
      profilePicture: user.profilePicture,
      role: user.role,
      biography: data.containsKey('biography')
          ? data['biography']?.toString()
          : user.biography,
      gdprAccepted: (data['gdpr_accepted'] as bool?) ?? user.gdprAccepted,
      totalPoints: user.totalPoints,
      preferredLangId: user.preferredLangId,
      locationId: data.containsKey('location_id')
          ? data['location_id'] as int?
          : user.locationId,
      serviceLineName: user.serviceLineName,
      learningPathTitle: user.learningPathTitle,
      areas: user.areas,
    );
  }
}
