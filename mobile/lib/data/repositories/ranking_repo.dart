import '../../core/constants/api_endpoints.dart';
import '../../models/ranking_entry_model.dart';
import '../remote/api_client.dart';

class RankingRepository {
  RankingRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<RankingEntryModel>> getRanking({
    int page = 1,
    int limit = 50,
  }) async {
    final payload = await _apiClient.get(
      ApiEndpoints.getRanking,
      queryParameters: {'page': page, 'limit': limit},
    );

    final list = _extractList(payload);
    return list
        .whereType<Map>()
        .map(
          (item) => RankingEntryModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
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
}
