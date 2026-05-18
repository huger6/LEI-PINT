import '../../core/constants/api_endpoints.dart';
import '../../models/badge_model.dart';
import '../local/badge_dao.dart';
import '../remote/api_client.dart';

class BadgeRepository {
  BadgeRepository(this._apiClient, this._badgeDao);

  final ApiClient _apiClient;
  final BadgeDao _badgeDao;

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
