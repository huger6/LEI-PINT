import 'dart:io';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:path_provider/path_provider.dart';

import '../../core/constants/api_endpoints.dart';
import '../../core/utils/api_logger.dart';

class ApiClient {
  late final Dio dio;
  late final PersistCookieJar cookieJar;
  String? _accessToken;

  ApiClient(this.dio) {
    final configuredBaseUrl = dotenv.env['API_BASE_URL']?.trim();
    final fallbackHost = Platform.isAndroid ? '10.0.2.2' : 'localhost';
    final fallbackUrl = 'http://$fallbackHost:3000/api';

    dio.options = BaseOptions(
      baseUrl: (configuredBaseUrl != null && configuredBaseUrl.isNotEmpty)
          ? configuredBaseUrl
          : fallbackUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      contentType: 'application/json',
      headers: {'Accept': 'application/json'},
    );

    dio.interceptors.add(ApiLoggerInterceptor());
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
          if (_accessToken != null && _accessToken!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_accessToken';
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

            _accessToken = null;
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
            _accessToken = token;
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

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final response = await dio.get(
      path,
      queryParameters: queryParameters,
      options: options,
    );

    return response.data;
  }

  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final response = await dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );

    return response.data;
  }

  Future<dynamic> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final response = await dio.put(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );

    return response.data;
  }

  Future<dynamic> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final response = await dio.delete(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );

    return response.data;
  }
}
