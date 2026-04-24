import 'dart:io';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

class ApiLoggerInterceptor extends Interceptor {
  static const String _fileName = 'api_debug.log';
  File? _logFile;

  Future<void> _initFile() async {
    if (_logFile != null) return;
    final directory = await getApplicationDocumentsDirectory();
    _logFile = File('${directory.path}/$_fileName');
  }

  Future<void> _writeLog(String type, String message) async {
    // Only runs if in debug mode
    if (kDebugMode) {
      final timestamp = DateTime.now().toIso8601String();
      final logEntry =
          '[$timestamp] [$type] $message\n----------------------------------------\n';

      debugPrint('[$type] $message');

      try {
        await _initFile();
        await _logFile!.writeAsString(logEntry, mode: FileMode.append);
      } catch (e) {
        debugPrint('Erro ao escrever no ficheiro de log: $e');
      }
    }
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      final method = options.method.toUpperCase();
      final url = options.uri.toString();
      final body = _prettyJson(options.data);
      final headers = _prettyJson(options.headers);

      _writeLog(
        'REQUEST',
        'Metodo: $method\nURL: $url\nHeaders: $headers\nBody: $body',
      );
    }
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      final url = response.requestOptions.uri.toString();
      final status = response.statusCode;
      final data = _prettyJson(response.data);

      _writeLog('RESPONSE', 'Status: $status\nURL: $url\nData: $data');
    }
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      final url = err.requestOptions.uri.toString();
      final status = err.response?.statusCode ?? 'Sem Status';
      final errorData = _prettyJson(err.response?.data) ?? err.message;

      _writeLog('ERROR', 'Status: $status\nURL: $url\nDetalhes: $errorData');
    }
    super.onError(err, handler);
  }

  String? _prettyJson(dynamic data) {
    if (data == null) return null;
    try {
      const encoder = JsonEncoder.withIndent('  ');
      return encoder.convert(data);
    } catch (e) {
      return data.toString();
    }
  }
}
