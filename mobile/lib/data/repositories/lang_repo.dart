import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../core/constants/api_endpoints.dart';
import '../local/lang_dao.dart';
import '../../models/lang_model.dart';
import '../remote/api_client.dart';

class LanguageRepository {
  final ApiClient _apiClient;
  final LanguageDao _languageDao;

  LanguageRepository(this._apiClient, this._languageDao);

  Future<List<LanguageModel>> getAvailableLanguages() async {
    try {
      final payload = _extractList(
        await _apiClient.get(ApiEndpoints.getLanguages),
      );
      final languages = payload
          .whereType<Map>()
          .map(
            (json) => LanguageModel.fromJson(Map<String, dynamic>.from(json)),
          )
          .toList();

      if (languages.isNotEmpty) {
        await _languageDao.replaceAll(languages);
      }

      return languages;
    } on DioException catch (e) {
      debugPrint('API error (languages): ${e.message}');
      return _languageDao.getAll();
    } catch (e) {
      debugPrint('Unexpected error (languages): $e');
      return _languageDao.getAll();
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
