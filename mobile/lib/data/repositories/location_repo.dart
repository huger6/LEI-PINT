import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../local/location_dao.dart';
import '../../models/location_model.dart';
import '../remote/api_client.dart';

class LocationRepository {
  final ApiClient _apiClient;
  final LocationDao _locationDao;

  LocationRepository(this._apiClient, this._locationDao);

  Future<List<LocationModel>> getAvailableLocations() async {
    try {
      final payload = _extractList(
        await _apiClient.get(ApiEndpoints.getLocations),
      );
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
    } on DioException catch (_) {
      return _locationDao.getAll();
    } catch (_) {
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
