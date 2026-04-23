import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../core/constants/api_endpoints.dart';
import '../local/area_dao.dart';
import '../../models/area_model.dart';
import '../remote/api_client.dart';

class AreaRepository {
  final ApiClient _apiClient;
  final AreaDao _areaDao;

  AreaRepository(this._apiClient, this._areaDao);

  Future<List<AreaModel>> getAvailableAreas() async {
    try {
      final payload = _extractList(await _apiClient.get(ApiEndpoints.getAreas));
      final areas = payload
          .whereType<Map>()
          .map((json) => AreaModel.fromJson(Map<String, dynamic>.from(json)))
          .toList();

      if (areas.isNotEmpty) {
        await _areaDao.replaceAll(areas);
      }

      return areas;
    } on DioException catch (e) {
      debugPrint('API error (areas): ${e.message}');
      return _areaDao.getAll();
    } catch (e) {
      debugPrint('Unexpected error (areas): $e');
      return _areaDao.getAll();
    }
  }

  List<dynamic> _extractList(dynamic payload) {
    if (payload is List) {
      return payload;
    }

    if (payload is Map<String, dynamic> && payload['data'] is List) {
      return payload['data'] as List<dynamic>;
    }

    return const [];
  }
}
