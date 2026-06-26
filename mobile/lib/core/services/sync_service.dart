import 'dart:async';
import 'dart:io';

import '../../data/local/announcement_dao.dart';
import '../../data/local/area_dao.dart';
import '../../data/local/gdpr_policy_dao.dart';
import '../../data/local/redemption_dao.dart';
import '../../data/local/reward_dao.dart';
import '../../data/local/title_dao.dart';
import '../../data/local/awarded_badge_dao.dart';
import '../../data/local/badge_dao.dart';
import '../../data/local/current_user_dao.dart';
import '../../data/local/learning_path_dao.dart';
import '../../data/local/my_application_dao.dart';
import '../../data/local/my_skill_dao.dart';
import '../../data/local/notification_dao.dart';
import '../../data/local/points_history_dao.dart';
import '../../data/local/progression_stage_dao.dart';
import '../../data/local/service_line_dao.dart';
import '../../data/local/skill_dao.dart';
import '../../data/local/sync_metadata_dao.dart';
import '../../data/remote/api_client.dart';
import '../../models/announcement_model.dart';
import '../../models/gdpr_policy_model.dart';
import '../../models/redemption_model.dart';
import '../../models/reward_model.dart';
import '../../models/area_model.dart';
import '../../models/awarded_badge_model.dart';
import '../../models/learning_path_model.dart';
import '../../models/my_application_model.dart';
import '../../models/notification_model.dart';
import '../../models/points_history_model.dart';
import '../../models/progression_stage_model.dart';
import '../../models/service_line_model.dart';
import '../../models/skill_model.dart';
import '../../models/user_model.dart';
import '../constants/api_endpoints.dart';
import '../constants/screen_data_scope.dart';
import '../constants/sync_codes.dart';
import '../database/database_helper.dart';

class SyncService {
  SyncService(this._apiClient, this._database);

  final ApiClient _apiClient;
  final LocalDatabase _database;

  late final _syncDao = SyncMetadataDao(_database);
  late final _learningPathDao = LearningPathDao(_database);
  late final _serviceLineDao = ServiceLineDao(_database);
  late final _areaDao = AreaDao(_database);
  late final _badgeDao = BadgeDao(_database);
  late final _progressionStageDao = ProgressionStageDao(_database);
  late final _announcementDao = AnnouncementDao(_database);
  late final _notificationDao = NotificationDao(_database);
  late final _awardedBadgeDao = AwardedBadgeDao(_database);
  late final _pointsHistoryDao = PointsHistoryDao(_database);
  late final _myApplicationDao = MyApplicationDao(_database);
  late final _currentUserDao = CurrentUserDao(_database);
  late final _skillDao = SkillDao(_database);
  late final _mySkillDao = MySkillDao(_database);
  late final _gdprPolicyDao = GdprPolicyDao(_database);
  late final _rewardDao = RewardDao(_database);
  late final _redemptionDao = RedemptionDao(_database);
  late final _titleDao = TitleDao(_database);

  String? _activeRoute;

  final _syncController = StreamController<int>.broadcast();

  Stream<int> get onSyncComplete => _syncController.stream;

  // ── Screen-driven sync API ────────────────────────────────────────────────

  void setActiveRoute(String route) {
    _activeRoute = route;
  }

  Future<bool> syncForScreen(String route) async {
    final codes = ScreenDataScope.requiredSyncCodes(route);
    if (codes.isEmpty) return true;

    final results = await Future.wait(codes.map(_syncCode));
    final allOk = results.every((ok) => ok);

    for (var i = 0; i < codes.length; i++) {
      if (results[i]) {
        await _syncDao.setLastSync(codes[i], DateTime.now().toUtc());
        if (!_syncController.isClosed) _syncController.add(codes[i]);
      }
    }
    return allOk;
  }

  Future<bool> hasLocalDataForScreen(String route) async {
    final tables = ScreenDataScope.requiredTables(route);
    if (tables.isEmpty) return true;

    final db = await _database.database;
    for (final table in tables) {
      final rows = await db.rawQuery('SELECT COUNT(*) AS c FROM $table');
      final count = rows.isNotEmpty ? (rows.first['c'] as int? ?? 0) : 0;
      if (count == 0) return false;
    }
    return true;
  }

  Future<bool> _syncCode(int code) {
    switch (code) {
      case SyncCodes.userProfile:
      case SyncCodes.userSession:
        return _syncUserProfile();
      case SyncCodes.learningPaths:
        return _syncLearningPaths();
      case SyncCodes.serviceLines:
        return _syncServiceLines();
      case SyncCodes.areas:
        return _syncAreas();
      case SyncCodes.progressionStages:
        return _syncProgressionStages();
      case SyncCodes.badges:
        return _syncBadges();
      case SyncCodes.applications:
      case SyncCodes.evidences:
        return _syncApplications();
      case SyncCodes.awardedBadges:
        return _syncAwardedBadges();
      case SyncCodes.points:
        return _syncPointsHistory();
      case SyncCodes.announcements:
        return _syncAnnouncements();
      case SyncCodes.notifications:
        return _syncNotifications();
      case SyncCodes.gdprPolicies:
        return _syncGdprPolicies();
      case SyncCodes.rewards:
        return _syncRewards();
      default:
        return Future.value(true);
    }
  }

  // ── FCM-driven sync (existing) ────────────────────────────────────────────

  Future<void> handleUpdate(int updateCode, String timestampStr) async {
    if (!SyncCodes.isRelevantForMobile(updateCode)) return;

    if (_activeRoute != null && updateCode != SyncCodes.notifications) {
      final relevantCodes = ScreenDataScope.requiredSyncCodes(_activeRoute!);
      if (relevantCodes.isNotEmpty && !relevantCodes.contains(updateCode)) {
        return;
      }
    }

    final incoming = DateTime.tryParse(timestampStr)?.toUtc();
    if (incoming == null) return;

    final lastSync = await _syncDao.getLastSync(updateCode);
    if (lastSync != null && !incoming.isAfter(lastSync)) return;

    bool success = false;
    switch (updateCode) {
      case SyncCodes.userProfile:
      case SyncCodes.userSession:
        success = await _syncUserProfile();
      case SyncCodes.learningPaths:
        success = await _syncLearningPaths();
      case SyncCodes.serviceLines:
        success = await _syncServiceLines();
      case SyncCodes.areas:
        success = await _syncAreas();
      case SyncCodes.progressionStages:
        success = await _syncProgressionStages();
      case SyncCodes.stageCodes:
        success = true;
      case SyncCodes.badges:
        success = await _syncBadges();
      case SyncCodes.applications:
      case SyncCodes.evidences:
        success = await _syncApplications();
      case SyncCodes.awardedBadges:
        success = await _syncAwardedBadges();
      case SyncCodes.validationLogs:
        success = true;
      case SyncCodes.points:
        success = await _syncPointsHistory();
      case SyncCodes.announcements:
        success = await _syncAnnouncements();
      case SyncCodes.notifications:
        success = await _syncNotifications();
      case SyncCodes.gdprPolicies:
        success = await _syncGdprPolicies();
      case SyncCodes.rewards:
        success = await _syncRewards();
      default:
        return;
    }

    if (success) {
      await _syncDao.setLastSync(updateCode, incoming);
      if (!_syncController.isClosed) _syncController.add(updateCode);
    }
  }

  void dispose() {
    _syncController.close();
  }

  // ── Generic helpers ────────────────────────────────────────────────────────

  List<dynamic> _extractList(dynamic payload) {
    if (payload is List) return payload;
    if (payload is Map) {
      final data = payload['data'];
      if (data is List) return data;
    }
    return const [];
  }

  int _extractTotalPages(dynamic payload) {
    if (payload is Map) {
      final pagination = payload['pagination'];
      if (pagination is Map) {
        final totalPages = pagination['totalPages'];
        if (totalPages is int) return totalPages;
        return int.tryParse(totalPages?.toString() ?? '') ?? 1;
      }
    }
    return 1;
  }

  Future<bool> _syncList<T>({
    required String endpoint,
    required T Function(Map<String, dynamic>) fromJson,
    required Future<void> Function(List<T>) replaceAll,
    Future<void> Function(List<T>)? upsertAll,
    DateTime? lastSync,
  }) async {
    try {
      final isIncremental = lastSync != null && upsertAll != null;
      final queryParams = <String, dynamic>{};
      if (isIncremental) {
        queryParams['synced_at'] = lastSync.toUtc().toIso8601String();
      }

      final response = await _apiClient.get(
        endpoint,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      final list = _extractList(response);
      final items = list
          .whereType<Map>()
          .map((e) => fromJson(Map<String, dynamic>.from(e)))
          .toList();

      if (isIncremental) {
        if (items.isNotEmpty) {
          await upsertAll(items);
        }
      } else {
        await replaceAll(items);
      }
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  // ── Sync handlers ─────────────────────────────────────────────────────────

  Future<bool> _syncUserProfile() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.getProfile);
      final data = response is Map<String, dynamic>
          ? (response['data'] ?? response)
          : response;
      if (data is! Map) return false;
      final map = Map<String, dynamic>.from(data);
      final user = UserModel.fromJson(map);
      await _currentUserDao.save(user);
      await _syncSelectedSkills(map);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Mirrors the consultant's selected skills (their "competências") from the
  /// profile payload into the local skill tables that the profile UI reads
  /// from. The profile endpoint may expose them under `skills` or
  /// `selected_skills`; when neither is present this is a no-op, so the UI
  /// stays empty until the API provides the data and lights up automatically
  /// once it does.
  Future<void> _syncSelectedSkills(Map<String, dynamic> profile) async {
    final raw = profile['skills'] ?? profile['selected_skills'];
    if (raw is! List) return;

    final skills = raw
        .whereType<Map>()
        .map((e) => SkillModel.fromJson(Map<String, dynamic>.from(e)))
        .where((s) => s.id != 0 && s.name.trim().isNotEmpty)
        .toList();

    await _skillDao.replaceAll(skills);
    await _mySkillDao.replaceAll(skills.map((s) => s.id).toList());
  }

  Future<bool> _syncLearningPaths() async {
    final lastSync = await _syncDao.getLastSync(SyncCodes.learningPaths);
    return _syncList(
      endpoint: ApiEndpoints.getLearningPaths,
      fromJson: LearningPathModel.fromJson,
      replaceAll: _learningPathDao.replaceAll,
      upsertAll: _learningPathDao.upsertAll,
      lastSync: lastSync,
    );
  }

  Future<bool> _syncServiceLines() async {
    final lastSync = await _syncDao.getLastSync(SyncCodes.serviceLines);
    return _syncList(
      endpoint: ApiEndpoints.getServiceLines,
      fromJson: ServiceLineModel.fromJson,
      replaceAll: _serviceLineDao.replaceAll,
      upsertAll: _serviceLineDao.upsertAll,
      lastSync: lastSync,
    );
  }

  Future<bool> _syncAreas() async {
    final lastSync = await _syncDao.getLastSync(SyncCodes.areas);
    return _syncList(
      endpoint: ApiEndpoints.getAreas,
      fromJson: AreaModel.fromJson,
      replaceAll: _areaDao.replaceAll,
      upsertAll: _areaDao.upsertAll,
      lastSync: lastSync,
    );
  }

  Future<bool> _syncProgressionStages() async {
    final lastSync = await _syncDao.getLastSync(SyncCodes.progressionStages);
    return _syncList(
      endpoint: ApiEndpoints.getLevels,
      fromJson: ProgressionStageModel.fromJson,
      replaceAll: _progressionStageDao.replaceAll,
      upsertAll: _progressionStageDao.upsertAll,
      lastSync: lastSync,
    );
  }

  Future<bool> _syncBadges() async {
    try {
      final lastSync = await _syncDao.getLastSync(SyncCodes.badges);

      if (lastSync != null) {
        final response = await _apiClient.get(
          ApiEndpoints.getBadges,
          queryParameters: {
            'synced_at': lastSync.toUtc().toIso8601String(),
          },
        );
        final rows = _extractList(response)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        if (rows.isNotEmpty) {
          await _badgeDao.upsertAllFromJson(rows);
        }
        return true;
      }

      // Full sync: page through everything
      final rows = <Map<String, dynamic>>[];
      var page = 1;
      while (true) {
        final response = await _apiClient.get(
          ApiEndpoints.getBadges,
          queryParameters: {'page': page, 'limit': 100},
        );
        final pageRows = _extractList(response)
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        rows.addAll(pageRows);
        final totalPages = _extractTotalPages(response);
        if (pageRows.isEmpty || page >= totalPages || page >= 100) break;
        page++;
      }
      if (rows.isNotEmpty) {
        await _badgeDao.replaceAllFromJson(rows);
      }
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _syncApplications() => _syncList(
    endpoint: ApiEndpoints.getApplications,
    fromJson: MyApplicationModel.fromJson,
    replaceAll: _myApplicationDao.replaceAll,
  );

  Future<bool> _syncAwardedBadges() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.getEarnedBadges);
      final list = _extractList(response);
      final rawMaps = list
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      for (final json in rawMaps) {
        final badgeData = json['badge'];
        if (badgeData is Map) {
          await _badgeDao.insertIfMissing(Map<String, dynamic>.from(badgeData));
        }
      }

      final items = rawMaps
          .map((json) => AwardedBadgeModel.fromJson({
                'id': json['awardedBadgeId'] ??
                    json['awarded_badges_id'] ??
                    json['id'],
                'application_id':
                    json['applicationId'] ?? json['application_id'] ?? 0,
                'application_guid':
                    json['applicationGuid'] ?? json['application_guid'],
                'badge_id': json['badge']?['id'] ??
                    json['badge']?['badge_id'] ??
                    json['badge_id'] ??
                    0,
                'awarded_at': json['awardedDate'] ?? json['awarded_at'],
                'expiration_at':
                    json['expirationDate'] ?? json['expiration_at'],
                'points_snapshot':
                    json['pointsSnapshot'] ?? json['points_snapshot'],
                'verification_link': json['verificationLink'] ??
                    json['public_verification_link'],
                'is_published':
                    json['isPublished'] ?? json['is_published'] ?? false,
                'is_featured':
                    json['isFeatured'] ?? json['is_featured'] ?? false,
                'display_order':
                    json['displayOrder'] ?? json['display_order'],
              }))
          .toList();

      await _awardedBadgeDao.replaceAll(items);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _syncPointsHistory() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.getPointsHistory);
      final data = response is Map<String, dynamic>
          ? (response['data'] ?? response)
          : response;
      List<dynamic> historyList;
      if (data is Map) {
        historyList = (data['history'] as List?) ?? [];
      } else if (data is List) {
        historyList = data;
      } else {
        return false;
      }
      final items = historyList
          .whereType<Map>()
          .map((e) => PointsHistoryModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      await _pointsHistoryDao.replaceAll(items);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _syncAnnouncements() async {
    final lastSync = await _syncDao.getLastSync(SyncCodes.announcements);
    return _syncList(
      endpoint: ApiEndpoints.getAnnouncements,
      fromJson: AnnouncementModel.fromJson,
      replaceAll: _announcementDao.replaceAll,
      upsertAll: _announcementDao.upsertAll,
      lastSync: lastSync,
    );
  }

  Future<bool> _syncNotifications() async {
    try {
      final items = <NotificationModel>[];
      var page = 1;
      while (true) {
        final response = await _apiClient.get(
          ApiEndpoints.getNotifications,
          queryParameters: {'page': page, 'limit': 100},
        );
        final pageRows = _extractList(response)
            .whereType<Map>()
            .map((e) =>
                NotificationModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        items.addAll(pageRows);
        final totalPages = _extractTotalPages(response);
        if (pageRows.isEmpty || page >= totalPages || page >= 50) break;
        page++;
      }
      await _notificationDao.replaceAll(items);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _syncRewards() async {
    try {
      // 1. Sync rewards catalog
      final storeResponse = await _apiClient.get(ApiEndpoints.getRewards);
      final storeData = storeResponse is Map<String, dynamic>
          ? (storeResponse['data'] ?? storeResponse)
          : storeResponse;
      if (storeData is Map) {
        final rewardsList = (storeData['rewards'] as List?) ?? [];
        final rewards = rewardsList
            .whereType<Map>()
            .map((e) => RewardModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        await _rewardDao.replaceAll(rewards);
      }

      // 2. Sync redemption history
      final redemptionsResponse =
          await _apiClient.get(ApiEndpoints.getRedemptions);
      final redemptionsData = redemptionsResponse is Map<String, dynamic>
          ? (redemptionsResponse['data'] ?? redemptionsResponse)
          : redemptionsResponse;
      final redemptionsList =
          redemptionsData is List ? redemptionsData : <dynamic>[];
      final redemptions = redemptionsList
          .whereType<Map>()
          .map((e) => RedemptionModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      await _redemptionDao.replaceAll(redemptions);

      // 3. Sync unlocked titles + active title
      final titlesResponse = await _apiClient.get(ApiEndpoints.getTitles);
      final titlesData = titlesResponse is Map<String, dynamic>
          ? (titlesResponse['data'] ?? titlesResponse)
          : titlesResponse;
      if (titlesData is Map) {
        final titlesList = (titlesData['titles'] as List?)
                ?.map((e) => e.toString())
                .toList() ??
            [];
        await _titleDao.replaceAll(titlesList);

        final activeTitle = titlesData['activeTitle']?.toString();
        await _currentUserDao.updateActiveTitle(activeTitle);
      }

      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _syncGdprPolicies() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.getGdprPolicies);
      final list = _extractList(
        response is Map<String, dynamic>
            ? (response['data'] ?? response)
            : response,
      );
      final items = list
          .whereType<Map>()
          .map((e) => GdprPolicyModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      await _gdprPolicyDao.replaceAll(items);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }
}
