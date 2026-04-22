import 'dart:io';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:path_provider/path_provider.dart';

import '../constants/api_endpoints.dart';
import '../utils/auth_store.dart';

class ApiClient {
  late final Dio dio;
  late final PersistCookieJar cookieJar;
  final AuthStore authStore;

  ApiClient(this.authStore) {
    final configuredBaseUrl = dotenv.env['API_BASE_URL']?.trim();
    final fallbackHost = Platform.isAndroid ? '10.0.2.2' : 'localhost';
    final fallbackUrl = 'http://$fallbackHost:3000/api';

    dio = Dio(
      BaseOptions(
        baseUrl: (configuredBaseUrl != null && configuredBaseUrl.isNotEmpty)
            ? configuredBaseUrl
            : fallbackUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        contentType: 'application/json',
        headers: {'Accept': 'application/json'},
      ),
    );
  }

  Future<void> init() async {
    final appDocDir = await getApplicationDocumentsDirectory();
    final cookiePath = '${appDocDir.path}/.cookies/';

    cookieJar = PersistCookieJar(
      ignoreExpires: false,
      storage: FileStorage(cookiePath),
    );

    dio.interceptors.add(CookieManager(cookieJar));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (authStore.accessToken != null) {
            options.headers['Authorization'] =
                'Bearer ${authStore.accessToken}';
          } else {
            options.headers.remove('Authorization');
          }

          handler.next(options);
        },
        onError: (error, handler) async {
          final statusCode = error.response?.statusCode;
          final path = error.requestOptions.path;
          final isAuthRoute =
              path.contains(ApiEndpoints.login) ||
              path.contains(ApiEndpoints.refresh);

          if (statusCode == 401 && !isAuthRoute) {
            final refreshedToken = await _tryRefreshToken();
            if (refreshedToken != null) {
              try {
                final retryRequest = _cloneRequestWithToken(
                  error.requestOptions,
                  refreshedToken,
                );
                final response = await dio.fetch<dynamic>(retryRequest);
                return handler.resolve(response);
              } on DioException catch (retryError) {
                return handler.next(retryError);
              }
            }

            await authStore.clearSession();
            await cookieJar.deleteAll();
          }

          handler.next(error);
        },
      ),
    );
  }

  Future<String?> _tryRefreshToken() async {
    try {
      final response = await dio.post(ApiEndpoints.refresh);
      final payload = response.data;
      if (payload is Map<String, dynamic>) {
        final data = payload['data'];
        if (data is Map<String, dynamic>) {
          final token = data['token']?.toString();
          if (token != null && token.isNotEmpty) {
            authStore.setAccessToken(token);
            return token;
          }
        }
      }
    } on DioException {
      return null;
    }

    return null;
  }

  RequestOptions _cloneRequestWithToken(RequestOptions request, String token) {
    final headers = Map<String, dynamic>.from(request.headers);
    headers['Authorization'] = 'Bearer $token';

    return request.copyWith(
      headers: headers,
      data: request.data,
      queryParameters: request.queryParameters,
      extra: request.extra,
    );
  }
}
