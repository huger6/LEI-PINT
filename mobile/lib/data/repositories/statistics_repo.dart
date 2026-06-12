import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../remote/api_client.dart';

class StatisticsRepository {
  StatisticsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<Map<String, dynamic>>> getTimeline() async {
    try {
      final response = _asMap(
        await _apiClient.get(ApiEndpoints.getTimeline),
      );
      final data = response['data'];
      if (data is List) {
        return data
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      return [];
    } on DioException {
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getPointsHistory({
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = _asMap(
        await _apiClient.get(
          ApiEndpoints.getPointsHistory,
          queryParameters: {'page': page, 'limit': limit},
        ),
      );
      return {
        'totalPoints': response['data']?['totalPoints'] ?? 0,
        'history': (response['data']?['history'] as List?) ?? [],
      };
    } on DioException {
      return {'totalPoints': 0, 'history': []};
    } catch (_) {
      return {'totalPoints': 0, 'history': []};
    }
  }

  Future<List<Map<String, dynamic>>> getLearningPathProgress() async {
    try {
      final response = _asMap(
        await _apiClient.get(ApiEndpoints.getLearningPathProgress),
      );
      final data = response['data'];
      if (data is List) {
        return data
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      return [];
    } on DioException {
      return [];
    } catch (_) {
      return [];
    }
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return {};
  }
}
