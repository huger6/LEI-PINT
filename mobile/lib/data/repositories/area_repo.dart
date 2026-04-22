import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/api_endpoints.dart';
import '../data/dao/area_dao.dart';
import '../models/area_model.dart';
import '../services/api_client.dart';

class AreaRepository {
  final ApiClient _apiClient;
  final AreaDao _areaDao;

  AreaRepository(this._apiClient, this._areaDao);

  Future<List<AreaModel>> getAvailableAreas() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.getAreas);
      final payload = _extractList(response.data);
      final areas = payload
          .whereType<Map>()
          .map((json) => AreaModel.fromJson(Map<String, dynamic>.from(json)))
          .toList();

      if (areas.isNotEmpty) {
        await _areaDao.replaceAll(areas);
      }

      return areas;
    } on DioException catch (e) {
      debugPrint('Erro API (areas): ${e.message}');
      return _areaDao.getAll();
    } catch (e) {
      debugPrint('Erro inesperado (areas): $e');
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
