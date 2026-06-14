import 'package:dio/dio.dart';

import '../../models/goal_model.dart';
import '../remote/api_client.dart';

class GoalsRepository {
  GoalsRepository(this._apiClient);

  final ApiClient _apiClient;

  static const String _goalsEndpoint = '/api/goals';

  Future<List<GoalModel>> getGoals({int page = 1, int limit = 50}) async {
    try {
      final payload = await _apiClient.get(
        '$_goalsEndpoint?page=$page&limit=$limit',
      );

      final map = _asMap(payload);
      final data = map['data'];
      if (data is List) {
        return data
            .whereType<Map>()
            .map((e) => GoalModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }

      return const [];
    } on DioException catch (_) {
      return const [];
    } catch (_) {
      return const [];
    }
  }

  Future<Map<String, dynamic>> createGoal({
    required int badgeId,
    required String title,
    String description = '',
  }) async {
    try {
      final payload = await _apiClient.post(
        _goalsEndpoint,
        data: {
          'badgeId': badgeId,
          'eventTitle': title,
          'eventDescription': description,
        },
      );

      final map = _asMap(payload);
      if (map['success'] == true || map['data'] != null) {
        return {'success': true};
      }

      return {
        'success': false,
        'message': map['message']?.toString() ?? 'Erro ao criar objetivo.',
      };
    } on DioException catch (e) {
      final data = _asMap(e.response?.data);
      final code = data['code']?.toString() ?? '';
      if (code == 'GOAL_ALREADY_EXISTS') {
        return {'success': false, 'message': 'Este badge já foi adicionado como objetivo.'};
      }
      return {
        'success': false,
        'message': data['message']?.toString() ?? 'Erro ao criar objetivo.',
      };
    } catch (_) {
      return {'success': false, 'message': 'Erro inesperado.'};
    }
  }

  Future<Map<String, dynamic>> deleteGoal(int goalId) async {
    try {
      final payload = await _apiClient.delete(
        '$_goalsEndpoint/$goalId',
      );

      final map = _asMap(payload);
      if (map['success'] == true) {
        return {'success': true};
      }

      return {
        'success': false,
        'message': map['message']?.toString() ?? 'Erro ao remover objetivo.',
      };
    } on DioException catch (e) {
      final data = _asMap(e.response?.data);
      return {
        'success': false,
        'message': data['message']?.toString() ?? 'Erro ao remover objetivo.',
      };
    } catch (_) {
      return {'success': false, 'message': 'Erro inesperado.'};
    }
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return <String, dynamic>{};
  }
}
