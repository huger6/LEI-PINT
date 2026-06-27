import 'package:dio/dio.dart';

import '../../core/constants/api_endpoints.dart';
import '../../models/application_summary_model.dart';
import '../../models/my_application_model.dart';
import '../local/badge_dao.dart';
import '../local/my_application_dao.dart';
import '../remote/api_client.dart';

class ApplicationsRepository {
  ApplicationsRepository(
    this._apiClient,
    this._myApplicationDao,
    this._badgeDao,
  );

  final ApiClient _apiClient;
  final MyApplicationDao _myApplicationDao;
  final BadgeDao _badgeDao;

  Future<List<ApplicationSummaryModel>> getApplications({
    List<String>? state,
    int page = 1,
    int limit = 20,
  }) async {
    // Offline-first: every screen must keep working from the local database
    // when the network is unavailable. We try the API for the freshest data,
    // but fall back to the applications already synced into the local store so
    // the consultant's requests never disappear from "Candidaturas" or the
    // dashboard's recent submissions.
    try {
      final payload = await _apiClient.get(
        ApiEndpoints.getApplications,
        queryParameters: {
          if (state != null && state.isNotEmpty) 'state': state,
          'page': page,
          'limit': limit,
        },
      );

      final list = _extractList(payload);
      final applications = list
          .whereType<Map>()
          .map(
            (item) => ApplicationSummaryModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();

      // Persist the freshest list locally so an offline reopen still shows it.
      await _cacheApplications(list);

      if (applications.isNotEmpty) {
        return applications;
      }

      // API returned nothing usable – fall through to whatever is cached.
      return getApplicationsLocal(state: state);
    } catch (_) {
      return getApplicationsLocal(state: state);
    }
  }

  /// Builds the application summaries straight from the local database,
  /// joining each request to its badge in the local catalog. Used as the
  /// offline-first source whenever the API cannot be reached.
  Future<List<ApplicationSummaryModel>> getApplicationsLocal({
    List<String>? state,
  }) async {
    final locals = await _myApplicationDao.getAll();
    final result = <ApplicationSummaryModel>[];

    for (final app in locals) {
      if (state != null && state.isNotEmpty && !state.contains(app.state)) {
        continue;
      }

      final badge = await _badgeDao.getById(app.badgeId);
      result.add(
        ApplicationSummaryModel(
          applicationGuid: app.applicationGuid,
          applicationState: app.state,
          badge: badge,
          submittedAt: app.submittedAt,
          openedAt: app.openedAt,
          updatedAt: app.closedAt,
          latestObservation: app.reviewerNotes,
        ),
      );
    }

    return result;
  }

  /// Mirrors the freshly fetched server applications into the local store so
  /// the offline fallback stays up to date even on screens whose sync scope
  /// does not refresh applications on its own.
  Future<void> _cacheApplications(List<dynamic> rawList) async {
    final models = rawList
        .whereType<Map>()
        .map((item) => MyApplicationModel.fromJson(Map<String, dynamic>.from(item)))
        .where((app) => app.applicationGuid.isNotEmpty)
        .toList();

    if (models.isEmpty) {
      return;
    }

    await _myApplicationDao.replaceAll(models);
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
    required String badgeSlug,
    int? goalId,
  }) async {
    final payload = await _apiClient.post(
      ApiEndpoints.startApplication,
      data: {
        'badgeSlug': badgeSlug,
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
    required String contentType,
    required int fileSize,
  }) async {
    final payload = await _apiClient.post(
      ApiEndpoints.getUploadUrl(applicationGuid),
      data: {
        'requirementId': requirementId,
        'fileName': fileName,
        'contentType': contentType,
        'fileSize': fileSize,
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
      data: {},
      options: _longTimeout,
    );

    return _extractMap(payload);
  }

  Future<String> downloadEvidence({
    required String applicationGuid,
    required int evidenceId,
  }) async {
    final payload = await _apiClient.get(
      ApiEndpoints.downloadEvidence(applicationGuid, evidenceId),
    );

    final map = _extractMap(payload);
    final data = _extractMap(map['data']);
    final downloadUrl = (data['downloadUrl'] ?? '').toString();
    if (downloadUrl.isEmpty) {
      throw Exception('Download URL not available.');
    }

    return downloadUrl;
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
