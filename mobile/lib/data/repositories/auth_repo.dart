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

        final userPayload = _asMap(payload['user']);
        final forcePasswordChange = payload['fpc'] == true;
        final firstLogin = userPayload['first_login'] == true;

        return {
          'success': true,
          'accessToken': token,
          'user': profileUser ?? fallbackUser,
          'forcePasswordChange': forcePasswordChange,
          'firstLogin': firstLogin,
        };
      }

      final message = _extractMessage(
        responseMap,
        fallback: 'Credenciais inválidas.',
      );
      return {
        'success': false,
        'message': message,
        if (_isEmailNotConfirmed(responseMap)) 'emailNotConfirmed': true,
      };
    } on DioException catch (e) {
      final data = _asMap(e.response?.data);
      final msg = _extractMessage(data, fallback: 'Erro ao fazer login.');
      final code = data['code']?.toString() ?? '';
      final statusCode = e.response?.statusCode ?? 0;
      return {
        'success': false,
        'message': msg,
        'code': code,
        'statusCode': statusCode,
        if (_isEmailNotConfirmed(data)) 'emailNotConfirmed': true,
      };
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

      final data = _asMap(e.response?.data);
      final code = data['code']?.toString() ?? '';

      if (code == 'AUTH_REGISTER_EMAIL_FAILED') {
        return {'success': true, 'emailFailed': true};
      }

      final message = _extractMessage(
        data,
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
          ApiEndpoints.getProfile,
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

  Future<Map<String, dynamic>> updateProfile(
    Map<String, dynamic> data,
  ) async {
    try {
      final responseMap = _asMap(
        await _apiClient.put(ApiEndpoints.updateProfile, data: data),
      );

      if (responseMap['success'] == true) {
        return {'success': true};
      }

      return {
        'success': false,
        'message': _extractMessage(
          responseMap,
          fallback: 'Erro ao atualizar perfil.',
        ),
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao atualizar perfil.',
        ),
      };
    } catch (e) {
      return {'success': false, 'message': 'Erro ao atualizar perfil: $e'};
    }
  }

  Future<Map<String, dynamic>> changeLanguage(int languageId) async {
    try {
      final responseMap = _asMap(
        await _apiClient.patch(ApiEndpoints.changeLanguage(languageId)),
      );

      if (responseMap['success'] == true) {
        return {'success': true};
      }

      return {
        'success': false,
        'message': _extractMessage(
          responseMap,
          fallback: 'Erro ao alterar idioma.',
        ),
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao alterar idioma.',
        ),
      };
    } catch (e) {
      return {'success': false, 'message': 'Erro ao alterar idioma: $e'};
    }
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final responseMap = _asMap(
        await _apiClient.post(
          ApiEndpoints.changePassword,
          data: {
            'currentPassword': currentPassword,
            'newPassword': newPassword,
          },
        ),
      );

      if (responseMap['success'] == true) {
        return {'success': true};
      }

      return {
        'success': false,
        'message': _extractMessage(
          responseMap,
          fallback: 'Erro ao alterar password.',
        ),
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao alterar password.',
        ),
      };
    } catch (e) {
      return {'success': false, 'message': 'Erro ao alterar password: $e'};
    }
  }

  Future<Map<String, dynamic>> resendConfirmation(String email) async {
    try {
      final responseMap = _asMap(
        await _apiClient.post(
          ApiEndpoints.resendConfirmation,
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
          fallback: 'Erro ao reenviar email de confirmação.',
        ),
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': _extractMessage(
          _asMap(e.response?.data),
          fallback: 'Erro ao reenviar email de confirmação.',
        ),
      };
    } catch (e) {
      return {'success': false, 'message': 'Erro ao reenviar email: $e'};
    }
  }

  Future<Map<String, dynamic>> fetchPoints() async {
    try {
      final responseMap = _asMap(
        await _apiClient.get(ApiEndpoints.getPoints),
      );

      if (responseMap['success'] == true) {
        final data = _asMap(responseMap['data']);
        return {
          'success': true,
          'totalPoints': data['totalPoints'] ?? 0,
        };
      }

      return {'success': false};
    } catch (_) {
      return {'success': false};
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {}
  }

  bool _isEmailNotConfirmed(Map<String, dynamic> payload) {
    if (payload['email_confirmed'] == false ||
        payload['emailConfirmed'] == false) {
      return true;
    }
    final data = payload['data'];
    if (data is Map) {
      if (data['email_confirmed'] == false ||
          data['emailConfirmed'] == false) {
        return true;
      }
    }
    final message = (payload['message'] ?? '').toString().toLowerCase();
    if (message.contains('confirm') && message.contains('email')) {
      return true;
    }
    return false;
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
