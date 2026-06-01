import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../models/application_summary_model.dart';
import '../remote/api_client.dart';

class ApplicationsRepository {
  ApplicationsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<ApplicationSummaryModel>> getApplications({
    List<String>? state,
    int page = 1,
    int limit = 20,
  }) async {
    final payload = await _apiClient.get(
      ApiEndpoints.getApplications,
      queryParameters: {
        if (state != null && state.isNotEmpty) 'state': state,
        'page': page,
        'limit': limit,
      },
    );

    final list = _extractList(payload);
    return list
        .whereType<Map>()
        .map(
          (item) =>
              ApplicationSummaryModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  Future<ApplicationSummaryModel?> getApplicationById(
    String applicationId,
  ) async {
    if (applicationId.trim().isEmpty) {
      return null;
    }

    final payload = await _apiClient.get(
      ApiEndpoints.applicationById(applicationId),
    );

    final map = _extractMap(payload);
    final data = _extractMap(map['data']);
    if (data.isEmpty) {
      return null;
    }

    return ApplicationSummaryModel.fromJson(data);
  }

  static final _longTimeout = Options(
    receiveTimeout: const Duration(seconds: 60),
    sendTimeout: const Duration(seconds: 60),
  );

  Future<Map<String, dynamic>> startApplication({
    required int badgeId,
    int? goalId,
  }) async {
    final payload = await _apiClient.post(
      ApiEndpoints.startApplication,
      data: {
        'badgeId': badgeId,
        ...?(goalId == null ? null : {'goalId': goalId}),
      },
      options: _longTimeout,
    );

    return _extractMap(payload);
  }

  Future<Map<String, dynamic>> getUploadUrl({
    required String applicationGuid,
    required int requirementId,
    required String fileName,
  }) async {
    final payload = await _apiClient.post(
      ApiEndpoints.getUploadUrl(applicationGuid),
      data: {
        'requirementId': requirementId,
        'fileName': fileName,
      },
    );

    return _extractMap(payload);
  }

  Future<Map<String, dynamic>> upsertEvidence({
    required String applicationGuid,
    required int requirementId,
    required String evidenceFileUrl,
    required String evidenceTitle,
    String? evidenceDescription,
    String? evidenceFileType,
  }) async {
    final payload = await _apiClient.post(
      ApiEndpoints.upsertEvidence(applicationGuid),
      data: {
        'requirementId': requirementId,
        'evidenceFileUrl': evidenceFileUrl,
        'evidenceTitle': evidenceTitle,
        ...?evidenceDescription == null ? null : {'evidenceDescription': evidenceDescription},
        ...?evidenceFileType == null ? null : {'evidenceFileType': evidenceFileType},
      },
      options: _longTimeout,
    );

    return _extractMap(payload);
  }

  Future<Map<String, dynamic>> submitApplication(String applicationGuid) async {
    final payload = await _apiClient.post(
      ApiEndpoints.submitApplication(applicationGuid),
      options: _longTimeout,
    );

    return _extractMap(payload);
  }

  Future<Map<String, dynamic>> resendBadgeConfirmation(
    String applicationGuid,
  ) async {
    try {
      final payload = await _apiClient.post(
        ApiEndpoints.resendBadgeConfirmation(applicationGuid),
      );
      return _extractMap(payload);
    } on DioException catch (_) {
      return {
        'success': false,
        'message': 'O reenvio de email não está disponível de momento.',
      };
    }
  }

  List<dynamic> _extractList(dynamic payload) {
    if (payload is List) {
      return payload;
    }

    if (payload is Map<String, dynamic>) {
      final data = payload['data'];
      if (data is List) {
        return data;
      }
    }

    return const [];
  }

  Map<String, dynamic> _extractMap(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return payload;
    }
    if (payload is Map) {
      return Map<String, dynamic>.from(payload);
    }

    return <String, dynamic>{};
  }
}
