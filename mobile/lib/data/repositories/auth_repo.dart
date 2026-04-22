import 'package:dio/dio.dart';

import '../constants/api_endpoints.dart';
import '../models/user_model.dart';
import '../services/api_client.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository(this._apiClient);

  // 1. CORREÇÃO: Adicionado o 3º parâmetro 'remember'
  Future<Map<String, dynamic>> login(
    String identifier,
    String password,
    bool remember,
  ) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.login,
        data: {
          'identifier': identifier,
          'password': password,
          'remember': remember, // Agora usa a variável que passas
        },
      );

      final responseMap = _asMap(response.data);
      final payload = _asMap(responseMap['data']);
      final token = payload['token']?.toString();

      if (response.statusCode == 200 && token != null && token.isNotEmpty) {
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

  // 2. NOVO MÉTODO: verifySession
  Future<Map<String, dynamic>> verifySession() async {
    try {
      // Usamos o getMe para validar se o token atual ainda funciona
      final user = await getMe();
      if (user != null) {
        return {'success': true, 'user': user};
      }
      return {'success': false, 'message': 'Sessão inválida ou expirada.'};
    } catch (e) {
      return {'success': false, 'message': 'Erro ao verificar sessão: $e'};
    }
  }

  // 3. NOVO MÉTODO: refreshToken
  Future<Map<String, dynamic>> refreshToken() async {
    try {
      // ATENÇÃO: Substitui '/refresh-endpoint' pelo endpoint real da tua API (ou cria em ApiEndpoints)
      final response = await _apiClient.dio.post('/refresh-endpoint');
      final responseMap = _asMap(response.data);

      if (response.statusCode == 200) {
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
      final response = await _apiClient.dio.post(
        ApiEndpoints.register,
        data: userData,
      );

      final responseMap = _asMap(response.data);
      final isSuccess = responseMap['success'] == true;

      if ((response.statusCode == 201 || response.statusCode == 200) &&
          isSuccess) {
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
      final response = await _apiClient.dio.post(
        ApiEndpoints.forgotPassword,
        data: {'email': email},
      );
      final responseMap = _asMap(response.data);
      if (response.statusCode == 200 && responseMap['success'] == true) {
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
      final response = await _apiClient.dio.get(
        ApiEndpoints.me,
        options: accessToken != null
            ? Options(headers: {'Authorization': 'Bearer $accessToken'})
            : null,
      );
      if (response.statusCode == 200) {
        final responseMap = _asMap(response.data);
        final payload = _asMap(responseMap['data']);
        if (payload.isNotEmpty) {
          return UserModel.fromJson(payload);
        }
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
      await _apiClient.dio.post(ApiEndpoints.logout);
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
    final message = payload['message']?.toString();
    if (message != null && message.isNotEmpty) {
      return message;
    }

    final error = payload['error']?.toString();
    if (error != null && error.isNotEmpty) {
      return error;
    }

    final errors = payload['errors'];
    if (errors is List && errors.isNotEmpty) {
      final firstError = errors.first;
      if (firstError is Map && firstError['message'] != null) {
        return firstError['message'].toString();
      }
    }

    return fallback;
  }
}
