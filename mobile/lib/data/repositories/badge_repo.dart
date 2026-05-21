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
    final payload = await _apiClient.get(ApiEndpoints.getBadges);
    final list = _extractList(payload);
    final rows = list
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
    await _badgeDao.replaceAllFromJson(rows);
    return _badgeDao.getAll();
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

  Future<List<EarnedBadge>> getEarnedBadgesLocal() async {
    final awarded = await _awardedBadgeDao.getAll();
    final result = <EarnedBadge>[];

    for (final award in awarded) {
      final badge = await _badgeDao.getById(award.badgeId);
      if (badge != null) {
        result.add(EarnedBadge(badge: badge, award: award));
      }
    }

    return result;
  }

  Future<List<EarnedBadge>> getEarnedBadges() async {
    final payload = await _apiClient.get(ApiEndpoints.getEarnedBadges);
    final list = _extractList(payload);

    final awarded = list
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .map(_parseAwardedFromApi)
        .toList();

    await _awardedBadgeDao.replaceAll(awarded);
    return getEarnedBadgesLocal();
  }

  Future<void> shareBadge(int badgeId) async {
    await _apiClient.post(
      ApiEndpoints.shareBadge,
      data: {'badgeId': badgeId},
    );
  }

  Future<void> toggleBadgeGallery(int awardedBadgeId, bool featured) async {
    await _apiClient.patch(
      ApiEndpoints.toggleBadgeGallery(awardedBadgeId),
      data: {'is_featured': featured},
    );
    await _awardedBadgeDao.updateFeatured(awardedBadgeId, featured);
  }

  Future<List<int>> getFavorites() async {
    try {
      final payload = await _apiClient.get(ApiEndpoints.getFavorites);
      final list = _extractList(payload);
      final ids = list.whereType<int>().toList();
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
      await _apiClient.post(ApiEndpoints.addFavorite(badgeId));
      await _favoriteDao.markSynced(badgeId);
    } catch (_) {}
  }

  Future<void> removeFavorite(int badgeId) async {
    await _favoriteDao.remove(badgeId);
    try {
      await _apiClient.delete(ApiEndpoints.removeFavorite(badgeId));
    } catch (_) {}
  }

  Future<void> acceptShareGdpr() async {
    await _apiClient.put(
      ApiEndpoints.acceptShareGdpr,
      data: {'gdpr_accepted': true},
    );
  }

  AwardedBadgeModel _parseAwardedFromApi(Map<String, dynamic> json) {
    return AwardedBadgeModel.fromJson({
      'id': json['awardedBadgeId'] ?? json['awarded_badges_id'] ?? json['id'],
      'application_id': json['applicationId'] ?? json['application_id'] ?? 0,
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
}
