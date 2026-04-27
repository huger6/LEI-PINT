import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../models/user_model.dart';
import '../remote/api_client.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository(this._apiClient);

  Future<Map<String, dynamic>> login(
    String identifier,
    String password,
    bool remember,
  ) async {
    try {
      final responseMap = _asMap(
        await _apiClient.post(
          ApiEndpoints.login,
          data: {
            'identifier': identifier,
            'password': password,
            'remember': remember,
          },
        ),
      );
      final payload = _asMap(responseMap['data']);
      final token = payload['token']?.toString();

      if (token != null && token.isNotEmpty) {
        final profileUser = await getMe(accessToken: token);
        final fallbackUser = UserModel.fromLoginPayload(
          _asMap(payload['user']),
          identifier: identifier,
        );

        return {
          'success': true,
          'accessToken': token,
          'user': profileUser ?? fallbackUser,
        };
      }

      final message = _extractMessage(
        responseMap,
        fallback: 'Credenciais inválidas.',
      );
      return {'success': false, 'message': message};
    } on DioException catch (e) {
      final msg = _extractMessage(
        _asMap(e.response?.data),
        fallback: 'Erro ao fazer login.',
      );
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Erro ao fazer login: $e'};
    }
  }

  Future<Map<String, dynamic>> verifySession() async {
    try {
      final user = await getMe();
      if (user != null) {
        return {'success': true, 'user': user};
      }
      return {'success': false, 'message': 'Sessão inválida ou expirada.'};
    } catch (e) {
      return {'success': false, 'message': 'Erro ao verificar sessão: $e'};
    }
  }

  Future<Map<String, dynamic>> refreshToken() async {
    try {
      final responseMap = _asMap(await _apiClient.post(ApiEndpoints.refresh));

      if (responseMap['success'] == true) {
        return {'success': true, 'data': responseMap['data']};
      }
      return {
        'success': false,
        'message': 'Não foi possível atualizar o token.',
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro de refresh',
        ),
      };
    } catch (e) {
      return {'success': false, 'message': 'Erro inesperado no refresh: $e'};
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final responseMap = _asMap(
        await _apiClient.post(
          ApiEndpoints.register,
          data: userData,
          options: Options(
            connectTimeout: const Duration(seconds: 20),
            sendTimeout: const Duration(seconds: 45),
            receiveTimeout: const Duration(seconds: 45),
          ),
        ),
      );
      final isSuccess = responseMap['success'] == true;

      if (isSuccess) {
        return {'success': true};
      }

      return {
        'success': false,
        'message': _extractMessage(
          responseMap,
          fallback: 'Erro inesperado no registo.',
        ),
      };
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError) {
        return {
          'success': false,
          'message':
              'Nao foi possivel ligar ao servidor. Confirme se a API esta ativa e se o URL esta correto.',
        };
      }

      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return {
          'success': false,
          'message':
              'A ligacao ao servidor demorou demasiado tempo. Tente novamente.',
        };
      }

      final message = _extractMessage(
        _asMap(e.response?.data),
        fallback: 'Erro ao criar conta.',
      );
      return {'success': false, 'message': message};
    } catch (e) {
      return {'success': false, 'message': 'Erro ao criar conta: $e'};
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final responseMap = _asMap(
        await _apiClient.post(
          ApiEndpoints.forgotPassword,
          data: {'email': email},
        ),
      );

      if (responseMap['success'] == true) {
        return {'success': true};
      }
      return {
        'success': false,
        'message': _extractMessage(
          responseMap,
          fallback: 'Email não encontrado ou erro.',
        ),
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao tentar recuperar password.',
        ),
      };
    } catch (e) {
      return {'success': false, 'message': 'Erro ao tentar recuperar password'};
    }
  }

  Future<UserModel?> getMe({String? accessToken}) async {
    try {
      final responseMap = _asMap(
        await _apiClient.get(
          ApiEndpoints.me,
          options: accessToken != null
              ? Options(headers: {'Authorization': 'Bearer $accessToken'})
              : null,
        ),
      );

      final payload = _asMap(responseMap['data']);
      if (payload.isNotEmpty) {
        return UserModel.fromJson(payload);
      }
    } on DioException {
      return null;
    } catch (_) {
      return null;
    }
    return null;
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {}
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return <String, dynamic>{};
  }

  String _extractMessage(
    Map<String, dynamic> payload, {
    required String fallback,
  }) {
    final errors = payload['errors'];
    if (errors is List && errors.isNotEmpty) {
      final firstError = errors.first;
      if (firstError is Map) {
        final field = firstError['field']?.toString();
        final detail = firstError['message']?.toString();
        if (detail != null && detail.isNotEmpty) {
          if (field != null && field.isNotEmpty) {
            return '$field: $detail';
          }
          return detail;
        }
      }
    }

    final message = payload['message']?.toString();
    if (message != null && message.isNotEmpty) {
      return message;
    }

    final error = payload['error']?.toString();
    if (error != null && error.isNotEmpty) {
      return error;
    }

    return fallback;
  }
}
