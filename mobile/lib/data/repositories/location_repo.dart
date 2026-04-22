import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/api_endpoints.dart';
import '../data/dao/location_dao.dart';
import '../models/location_model.dart';
import '../services/api_client.dart';

class LocationRepository {
  final ApiClient _apiClient;
  final LocationDao _locationDao;

  LocationRepository(this._apiClient, this._locationDao);

  Future<List<LocationModel>> getAvailableLocations() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.getLocations);
      final payload = _extractList(response.data);
      final locations = payload
          .whereType<Map>()
          .map(
            (json) => LocationModel.fromJson(Map<String, dynamic>.from(json)),
          )
          .toList();

      if (locations.isNotEmpty) {
        await _locationDao.replaceAll(locations);
      }

      return locations;
    } on DioException catch (e) {
      debugPrint('Erro API (locations): ${e.message}');
      return _locationDao.getAll();
    } catch (e) {
      debugPrint('Erro inesperado (locations): $e');
      return _locationDao.getAll();
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
