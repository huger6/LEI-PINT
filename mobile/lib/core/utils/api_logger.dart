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

      try {
        await _initFile();
        await _logFile!.writeAsString(logEntry, mode: FileMode.append);
      } catch (_) {}
    }
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      final method = options.method.toUpperCase();
      final url = options.uri.toString();
      final body = _formatForLog(options.data);
      final headers = _formatForLog(options.headers);

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
      final data = _formatForLog(response.data);

      _writeLog('RESPONSE', 'Status: $status\nURL: $url\nData: $data');
    }
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      final url = err.requestOptions.uri.toString();
      final status = err.response?.statusCode ?? 'Sem Status';
      final errorData = _formatForLog(err.response?.data) ?? err.message;

      _writeLog('ERROR', 'Status: $status\nURL: $url\nDetalhes: $errorData');
    }
    super.onError(err, handler);
  }

  String? _formatForLog(dynamic data) {
    if (data == null) return null;
    final sanitized = _sanitizeForLog(data);
    if (sanitized is String) {
      final trimmed = sanitized.trimLeft().toLowerCase();
      if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
        return '[HTML response omitted, length=${sanitized.length}]';
      }
    }

    try {
      const encoder = JsonEncoder.withIndent('  ');
      return encoder.convert(sanitized);
    } catch (e) {
      return sanitized.toString();
    }
  }

  dynamic _sanitizeForLog(dynamic data) {
    if (data is Map) {
      return data.map((key, value) {
        final keyText = key.toString();
        return MapEntry(
          keyText,
          _isSensitiveKey(keyText) ? '[REDACTED]' : _sanitizeForLog(value),
        );
      });
    }

    if (data is Iterable && data is! String) {
      return data.map(_sanitizeForLog).toList();
    }

    return data;
  }

  bool _isSensitiveKey(String key) {
    final normalized = key.toLowerCase();
    return normalized.contains('password') ||
        normalized.contains('token') ||
        normalized.contains('secret') ||
        normalized == 'authorization' ||
        normalized == 'cookie' ||
        normalized == 'set-cookie';
  }
}
