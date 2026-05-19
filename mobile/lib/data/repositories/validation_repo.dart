import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../remote/api_client.dart';

class ValidationRepository {
  final ApiClient _apiClient;

  ValidationRepository(this._apiClient);

  Future<Map<String, dynamic>> checkEmailAvailability(String email) async {
    try {
      final responseMap = _asMap(
        await _apiClient.get(
          ApiEndpoints.checkEmail,
          queryParameters: {'value': email.trim()},
        ),
      );

      return {
        'success': true,
        'available': responseMap['data']?['available'] ?? false,
        'message': responseMap['data']?['message'],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'available': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao validar email.',
        ),
      };
    } catch (e) {
      return {
        'success': false,
        'available': false,
        'message': 'Erro ao validar email: $e',
      };
    }
  }

  Future<Map<String, dynamic>> checkUsernameAvailability(
    String username,
  ) async {
    try {
      final responseMap = _asMap(
        await _apiClient.get(
          ApiEndpoints.checkUsername,
          queryParameters: {'value': username.trim()},
        ),
      );

      return {
        'success': true,
        'available': responseMap['data']?['available'] ?? false,
        'message': responseMap['data']?['message'],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'available': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao validar username.',
        ),
      };
    } catch (e) {
      return {
        'success': false,
        'available': false,
        'message': 'Erro ao validar username: $e',
      };
    }
  }

  /// Validate content (e.g., name, username, bio) for prohibited/profane content.
  /// Returns a map with 'valid' (bool) and optional 'message' (String).
  Future<Map<String, dynamic>> validateContent({
    String? fullName,
    String? username,
    String? bio,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (fullName != null && fullName.trim().isNotEmpty) {
        data['full_name'] = fullName.trim();
      }
      if (username != null && username.trim().isNotEmpty) {
        data['username'] = username.trim();
      }
      if (bio != null && bio.trim().isNotEmpty) {
        data['bio'] = bio.trim();
      }

      if (data.isEmpty) {
        return {'success': true, 'valid': true};
      }

      final responseMap = _asMap(
        await _apiClient.post(
          ApiEndpoints.validateContent,
          data: data,
        ),
      );

      return {
        'success': true,
        'valid': responseMap['data']?['valid'] ?? true,
        'message': responseMap['data']?['message'],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'valid': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao validar conteúdo.',
        ),
      };
    } catch (e) {
      return {
        'success': false,
        'valid': false,
        'message': 'Erro ao validar conteúdo: $e',
      };
    }
  }

  static Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return {};
  }

  static String _extractMessage(
    Map<String, dynamic> responseMap, {
    required String fallback,
  }) {
    final message = responseMap['message'];
    if (message is String && message.isNotEmpty) {
      return message;
    }
    final errors = responseMap['errors'];
    if (errors is Map) {
      final firstError = errors.values.firstOrNull;
      if (firstError is String && firstError.isNotEmpty) {
        return firstError;
      }
      if (firstError is List && firstError.isNotEmpty) {
        final msg = firstError.first;
        if (msg is String && msg.isNotEmpty) {
          return msg;
        }
      }
    }
    return fallback;
  }
}
