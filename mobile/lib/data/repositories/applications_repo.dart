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

  Future<Map<String, dynamic>> startApplication({
    required int badgeId,
    int? goalId,
  }) async {
    final payload = await _apiClient.post(
      ApiEndpoints.startApplication,
      data: {'badgeId': badgeId, if (goalId != null) 'goalId': goalId},
    );

    return _extractMap(payload);
  }

  Future<Map<String, dynamic>> submitApplication(String applicationGuid) async {
    final payload = await _apiClient.post(
      ApiEndpoints.submitApplication(applicationGuid),
    );

    return _extractMap(payload);
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
