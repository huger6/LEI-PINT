import '../../core/constants/api_endpoints.dart';
import '../../models/notification_model.dart';
import '../local/notification_dao.dart';
import '../remote/api_client.dart';

class NotificationRepository {
  NotificationRepository(this._apiClient, this._notificationDao);

  final ApiClient _apiClient;
  final NotificationDao _notificationDao;

  Future<List<NotificationModel>> getLocal() {
    return _notificationDao.getAll();
  }

  Future<List<NotificationModel>> fetchAndCache() async {
    final items = <NotificationModel>[];
    var page = 1;
    while (true) {
      final payload = await _apiClient.get(
        ApiEndpoints.getNotifications,
        queryParameters: {'page': page, 'limit': 100},
      );
      final pageRows = _extractList(payload)
          .whereType<Map>()
          .map((e) =>
              NotificationModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      items.addAll(pageRows);
      final totalPages = _extractTotalPages(payload);
      if (pageRows.isEmpty || page >= totalPages || page >= 50) break;
      page++;
    }
    await _notificationDao.replaceAll(items);
    return items;
  }

  Future<void> markRead(int notificationId) async {
    await _notificationDao.markRead(notificationId);
    try {
      await _apiClient.put('/api/notifications/$notificationId/read');
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    await _notificationDao.markAllRead();
    try {
      await _apiClient.put('/api/notifications/read-all');
    } catch (_) {}
  }

  List<dynamic> _extractList(dynamic payload) {
    if (payload is List) return payload;
    if (payload is Map<String, dynamic>) {
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
}
