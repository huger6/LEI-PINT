import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';

import '../../data/local/announcement_dao.dart';
import '../../data/local/area_dao.dart';
import '../../data/local/awarded_badge_dao.dart';
import '../../data/local/badge_dao.dart';
import '../../data/local/current_user_dao.dart';
import '../../data/local/learning_path_dao.dart';
import '../../data/local/my_application_dao.dart';
import '../../data/local/notification_dao.dart';
import '../../data/local/points_history_dao.dart';
import '../../data/local/progression_stage_dao.dart';
import '../../data/local/service_line_dao.dart';
import '../../data/local/sync_metadata_dao.dart';
import '../../data/remote/api_client.dart';
import '../../models/announcement_model.dart';
import '../../models/area_model.dart';
import '../../models/awarded_badge_model.dart';
import '../../models/learning_path_model.dart';
import '../../models/my_application_model.dart';
import '../../models/notification_model.dart';
import '../../models/points_history_model.dart';
import '../../models/progression_stage_model.dart';
import '../../models/service_line_model.dart';
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

  String? _activeRoute;

  final _syncController = StreamController<int>.broadcast();

  Stream<int> get onSyncComplete => _syncController.stream;

  // ── Screen-driven sync API ────────────────────────────────────────────────

  void setActiveRoute(String route) {
    _activeRoute = route;
    debugPrint('SyncService: Active route set to $route');
  }

  Future<bool> syncForScreen(String route) async {
    final codes = ScreenDataScope.requiredSyncCodes(route);
    if (codes.isEmpty) return true;

    debugPrint('SyncService: Syncing ${codes.length} codes for $route');
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
      default:
        return Future.value(true);
    }
  }

  // ── FCM-driven sync (existing) ────────────────────────────────────────────

  Future<void> handleUpdate(int updateCode, String timestampStr) async {
    if (!SyncCodes.isRelevantForMobile(updateCode)) return;

    if (_activeRoute != null) {
      final relevantCodes = ScreenDataScope.requiredSyncCodes(_activeRoute!);
      if (relevantCodes.isNotEmpty && !relevantCodes.contains(updateCode)) {
        debugPrint(
          'SyncService: Code $updateCode skipped (not relevant for $_activeRoute)',
        );
        return;
      }
    }

    final incoming = DateTime.tryParse(timestampStr)?.toUtc();
    if (incoming == null) return;

    final lastSync = await _syncDao.getLastSync(updateCode);
    if (lastSync != null && !incoming.isAfter(lastSync)) {
      debugPrint('SyncService: Code $updateCode already up-to-date');
      return;
    }

    debugPrint('SyncService: Syncing code $updateCode');

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
      default:
        return;
    }

    if (success) {
      await _syncDao.setLastSync(updateCode, incoming);
      if (!_syncController.isClosed) _syncController.add(updateCode);
      debugPrint('SyncService: Code $updateCode synced');
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
  }) async {
    try {
      final response = await _apiClient.get(endpoint);
      debugPrint('───────────────────────────────────────────────────');
      debugPrint('SyncService: API response from $endpoint:');
      debugPrint('SyncService: Raw data: $response');
      debugPrint('───────────────────────────────────────────────────');
      final list = _extractList(response);
      final items = list
          .whereType<Map>()
          .map((e) => fromJson(Map<String, dynamic>.from(e)))
          .toList();
      debugPrint('SyncService: Parsed ${items.length} items from $endpoint');
      await replaceAll(items);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (e) {
      debugPrint('SyncService: $endpoint failed: $e');
      return false;
    }
  }

  // ── Sync handlers ─────────────────────────────────────────────────────────

  Future<bool> _syncUserProfile() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.getProfile);
      debugPrint('───────────────────────────────────────────────────');
      debugPrint('SyncService: API response from ${ApiEndpoints.getProfile}:');
      debugPrint('SyncService: Raw data: $response');
      debugPrint('───────────────────────────────────────────────────');
      final data = response is Map<String, dynamic>
          ? (response['data'] ?? response)
          : response;
      if (data is! Map) return false;
      final user = UserModel.fromJson(Map<String, dynamic>.from(data));
      await _currentUserDao.save(user);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (e) {
      debugPrint('SyncService: user profile failed: $e');
      return false;
    }
  }

  Future<bool> _syncLearningPaths() => _syncList(
    endpoint: ApiEndpoints.getLearningPaths,
    fromJson: LearningPathModel.fromJson,
    replaceAll: _learningPathDao.replaceAll,
  );

  Future<bool> _syncServiceLines() => _syncList(
    endpoint: ApiEndpoints.getServiceLines,
    fromJson: ServiceLineModel.fromJson,
    replaceAll: _serviceLineDao.replaceAll,
  );

  Future<bool> _syncAreas() => _syncList(
    endpoint: ApiEndpoints.getAreas,
    fromJson: AreaModel.fromJson,
    replaceAll: _areaDao.replaceAll,
  );

  Future<bool> _syncProgressionStages() => _syncList(
    endpoint: ApiEndpoints.getLevels,
    fromJson: ProgressionStageModel.fromJson,
    replaceAll: _progressionStageDao.replaceAll,
  );

  Future<bool> _syncBadges() async {
    try {
      // Fetch the whole catalog so the local copy (the only local source of
      // area / points / progression-stage) stays complete. The API caps
      // `limit` at 100, so page through every page rather than requesting an
      // oversized limit (which is rejected with 400, leaving the catalog empty).
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
      debugPrint('SyncService: fetched ${rows.length} badges across $page page(s)');
      if (rows.isNotEmpty) {
        await _badgeDao.replaceAllFromJson(rows);
      }
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (e) {
      debugPrint('SyncService: badges failed: $e');
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
    } catch (e) {
      debugPrint('SyncService: awarded badges failed: $e');
      return false;
    }
  }

  Future<bool> _syncPointsHistory() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.getPointsHistory);
      debugPrint('───────────────────────────────────────────────────');
      debugPrint(
          'SyncService: API response from ${ApiEndpoints.getPointsHistory}:');
      debugPrint('SyncService: Raw data: $response');
      debugPrint('───────────────────────────────────────────────────');
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
      debugPrint('SyncService: Parsed ${items.length} points history items');
      await _pointsHistoryDao.replaceAll(items);
      return true;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (e) {
      debugPrint('SyncService: points history failed: $e');
      return false;
    }
  }

  Future<bool> _syncAnnouncements() => _syncList(
    endpoint: ApiEndpoints.getAnnouncements,
    fromJson: AnnouncementModel.fromJson,
    replaceAll: _announcementDao.replaceAll,
  );

  Future<bool> _syncNotifications() => _syncList(
    endpoint: ApiEndpoints.getNotifications,
    fromJson: NotificationModel.fromJson,
    replaceAll: _notificationDao.replaceAll,
  );
}
