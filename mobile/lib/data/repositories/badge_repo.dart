import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

import '../../core/constants/api_endpoints.dart';
import '../../models/awarded_badge_model.dart';
import '../../models/badge_model.dart';
import '../../models/earned_badge_model.dart';
import '../local/awarded_badge_dao.dart';
import '../local/badge_dao.dart';
import '../local/my_favorite_dao.dart';
import '../remote/api_client.dart';

class BadgeRepository {
  BadgeRepository(
    this._apiClient,
    this._badgeDao,
    this._awardedBadgeDao,
    this._favoriteDao,
  );

  final ApiClient _apiClient;
  final BadgeDao _badgeDao;
  final AwardedBadgeDao _awardedBadgeDao;
  final MyFavoriteDao _favoriteDao;

  Future<List<BadgeModel>> getBadgesLocal() async {
    return _badgeDao.getAll();
  }

  Future<List<BadgeModel>> getBadges() async {
    // The catalog must be as complete as possible: it is the only local source
    // of area / points / progression-stage for earned badges and applications,
    // whose list endpoints don't return those fields. The API caps `limit` at
    // 100, so page through the whole catalog instead of requesting it in one
    // oversized call (which is rejected with 400 and leaves the catalog empty).
    final rows = <Map<String, dynamic>>[];
    var page = 1;
    while (true) {
      final payload = await _apiClient.get(
        ApiEndpoints.getBadges,
        queryParameters: {'page': page, 'limit': 100},
      );
      final pageRows = _extractList(payload)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      rows.addAll(pageRows);
      final totalPages = _extractTotalPages(payload);
      if (pageRows.isEmpty || page >= totalPages || page >= 100) break;
      page++;
    }
    debugPrint('BadgeRepo.getBadges: parsed ${rows.length} badge rows');
    if (rows.isNotEmpty) {
      await _badgeDao.replaceAllFromJson(rows);
    }
    return rows.map((json) => BadgeModel.fromApiSummary(json)).toList();
  }

  Future<BadgeModel?> getBadgeBySlug(String badgeSlug) async {
    if (badgeSlug.trim().isEmpty) {
      return null;
    }

    final payload = await _apiClient.get(ApiEndpoints.badgeBySlug(badgeSlug));
    final map = _extractMap(payload);
    final data = _extractMap(map['data']);
    if (data.isEmpty) {
      return null;
    }

    return BadgeModel.fromApiDetail(data);
  }

  /// Badge ids the consultant currently owns (awarded), read from the local
  /// cache that mirrors the server. Used to decide whether a goal whose badge
  /// has been earned can be marked as concluded.
  Future<Set<int>> ownedBadgeIdsLocal() async {
    final awarded = await _awardedBadgeDao.getAll();
    return awarded.map((a) => a.badgeId).toSet();
  }

  /// Refreshes the local awarded-badge cache from the API and reports whether
  /// the given badge is now owned. Falls back to the cached state when offline.
  Future<bool> isBadgeOwned(int badgeId) async {
    try {
      await getEarnedBadges();
    } catch (_) {
      // Offline or transient failure: fall back to the local cache below.
    }
    final owned = await _awardedBadgeDao.getByBadge(badgeId);
    return owned != null;
  }

  Future<List<EarnedBadge>> getEarnedBadgesLocal() async {
    final awarded = await _awardedBadgeDao.getAll();
    final result = <EarnedBadge>[];

    for (final award in awarded) {
      final badge = await _badgeDao.getById(award.badgeId);
      if (badge != null) {
        result.add(EarnedBadge(badge: badge, award: award));
      } else {
        debugPrint('BadgeRepo: awarded badge id=${award.id} has badge_id=${award.badgeId} NOT found in catalog — dropped');
      }
    }

    return result;
  }

  Future<List<EarnedBadge>> getEarnedBadges() async {
    final payload = await _apiClient.get(ApiEndpoints.getEarnedBadges);
    debugPrint('BadgeRepo.getEarnedBadges: payload type=${payload.runtimeType}');
    final list = _extractList(payload);
    debugPrint('BadgeRepo.getEarnedBadges: extracted ${list.length} items');

    final rawMaps = list
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();

    for (final json in rawMaps) {
      final badgeData = json['badge'];
      debugPrint('BadgeRepo.getEarnedBadges: badge=${badgeData != null}, badgeId=${badgeData is Map ? badgeData['id'] : 'N/A'}');
      if (badgeData is Map) {
        await _badgeDao.insertIfMissing(Map<String, dynamic>.from(badgeData));
      }
    }

    final awarded = rawMaps.map(_parseAwardedFromApi).toList();
    debugPrint('BadgeRepo.getEarnedBadges: parsed ${awarded.length} awarded badges');
    await _awardedBadgeDao.replaceAll(awarded);
    final result = await getEarnedBadgesLocal();
    debugPrint('BadgeRepo.getEarnedBadges: joined ${result.length} earned badges from local DB');
    return result;
  }

  Future<void> shareBadge(int badgeId) async {
    await _apiClient.post(
      ApiEndpoints.trackInteraction,
      data: {'badgeId': badgeId, 'interactionType': 'SHARE_LINKEDIN'},
    );
  }

  Future<void> toggleBadgeGallery(int awardedBadgeId, bool featured) async {
    await _apiClient.patch(
      ApiEndpoints.getEarnedBadges,
      data: {'is_featured': featured},
    );
    await _awardedBadgeDao.updateFeatured(awardedBadgeId, featured);
  }

  Future<List<int>> getFavorites() async {
    try {
      final payload = await _apiClient.get(ApiEndpoints.getInteractions);
      final list = _extractList(payload);
      final ids = <int>[];
      for (final item in list) {
        if (item is Map) {
          final type = item['interaction_type']?.toString();
          final badgeId = item['badge_id'];
          if (type == 'FAVORITE' && badgeId is int) {
            ids.add(badgeId);
          }
        }
      }
      await _favoriteDao.replaceAll(ids);
      return ids;
    } catch (_) {
      return _favoriteDao.getFavoriteBadgeIds();
    }
  }

  Future<List<int>> getFavoritesLocal() async {
    return _favoriteDao.getFavoriteBadgeIds();
  }

  Future<void> addFavorite(int badgeId) async {
    await _favoriteDao.add(badgeId);
    try {
      await _apiClient.post(
        ApiEndpoints.trackInteraction,
        data: {'badgeId': badgeId, 'interactionType': 'FAVORITE'},
      );
      await _favoriteDao.markSynced(badgeId);
    } catch (_) {}
  }

  Future<void> removeFavorite(int badgeId) async {
    await _favoriteDao.remove(badgeId);
    try {
      await _apiClient.post(
        ApiEndpoints.trackInteraction,
        data: {'badgeId': badgeId, 'interactionType': 'FAVORITE'},
      );
    } catch (_) {}
  }

  /// Records the consultant's RGPD consent for badge sharing on the server.
  ///
  /// Instead of locally flipping a flag, this persists the decision through the
  /// dedicated GDPR consent endpoint: it logs an entry in the consent history
  /// and (server-side) sets the consultant's `gdpr_accepted` flag. The consent
  /// is recorded against the active "Privacy" policy. Throws if no active
  /// policy is available or the request fails, so callers can avoid proceeding
  /// with the share when consent was not actually registered.
  Future<void> acceptShareGdpr() async {
    final policyPayload =
        await _apiClient.get(ApiEndpoints.latestGdprPolicy('Privacy'));
    final policy = _extractMap(_extractMap(policyPayload)['data']);
    final policyId = policy['policy_id'];
    if (policyId == null) {
      throw Exception('No active GDPR policy available.');
    }

    await _apiClient.post(
      ApiEndpoints.recordGdprConsent,
      data: {'policy_id': policyId, 'action': 'ACCEPTED'},
    );
  }

  Future<String> downloadCertificate({
    required String applicationGuid,
    required String fileName,
    String lang = 'pt',
  }) async {
    final dynamic payload;
    try {
      payload = await _apiClient.post(
        ApiEndpoints.getCertificate(applicationGuid),
        data: {'lang': lang},
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      final code = data is Map ? data['code']?.toString() ?? '' : '';
      if (code == 'CERTIFICATE_NOT_ELIGIBLE') {
        throw Exception('Esta candidatura não é elegível para comprovativo. Verifique se está no estado "Aceite".');
      }
      throw Exception('Não foi possível gerar o comprovativo. Tente novamente mais tarde.');
    }

    final map = _extractMap(payload);
    final data = _extractMap(map['data']);
    final certificateUrl = (data['certificateUrl'] ?? '').toString();
    if (certificateUrl.isEmpty) {
      throw Exception('O comprovativo ainda não está disponível para este badge.');
    }

    final dir = await getApplicationDocumentsDirectory();
    final filePath = '${dir.path}/$fileName';

    try {
      await Dio().download(certificateUrl, filePath);
    } on DioException catch (_) {
      throw Exception('Falha ao transferir o ficheiro. Verifique a sua ligação.');
    }

    return filePath;
  }

  AwardedBadgeModel _parseAwardedFromApi(Map<String, dynamic> json) {
    return AwardedBadgeModel.fromJson({
      'id': json['awardedBadgeId'] ?? json['awarded_badges_id'] ?? json['id'],
      'application_id': json['applicationId'] ?? json['application_id'] ?? 0,
      'application_guid': json['applicationGuid'] ?? json['application_guid'],
      'badge_id': json['badge']?['id'] ??
          json['badge']?['badge_id'] ??
          json['badge_id'] ??
          0,
      'awarded_at': json['awardedDate'] ?? json['awarded_at'],
      'expiration_at': json['expirationDate'] ?? json['expiration_at'],
      'points_snapshot': json['pointsSnapshot'] ?? json['points_snapshot'],
      'verification_link':
          json['verificationLink'] ?? json['public_verification_link'],
      'is_published': json['isPublished'] ?? json['is_published'] ?? false,
      'is_featured': json['isFeatured'] ?? json['is_featured'] ?? false,
      'display_order': json['displayOrder'] ?? json['display_order'],
    });
  }

  List<dynamic> _extractList(dynamic payload) {
    if (payload is List) {
      return payload;
    }

    if (payload is Map<String, dynamic>) {
      final data = payload['data'];
      if (data is List) {
        return data;
      }
    }

    return const [];
  }

  Map<String, dynamic> _extractMap(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return payload;
    }
    if (payload is Map) {
      return Map<String, dynamic>.from(payload);
    }

    return <String, dynamic>{};
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
}
