import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../constants/api_endpoints.dart';
import '../data/dao/language_dao.dart';
import '../models/language_model.dart';
import '../services/api_client.dart';

class LanguageRepository {
  final ApiClient _apiClient;
  final LanguageDao _languageDao;

  LanguageRepository(this._apiClient, this._languageDao);

  Future<List<LanguageModel>> getAvailableLanguages() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.getLanguages);
      final payload = _extractList(response.data);
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
      debugPrint('Erro API (languages): ${e.message}');
      return _languageDao.getAll();
    } catch (e) {
      debugPrint('Erro inesperado (languages): $e');
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
