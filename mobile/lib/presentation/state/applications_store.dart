import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../data/repositories/applications_repo.dart';
import '../../models/application_summary_model.dart';

class ApplicationsStore extends ChangeNotifier {
  ApplicationsStore(this._applicationsRepository);

  final ApplicationsRepository _applicationsRepository;

  bool _isLoading = false;
  String? _errorMessage;
  final Map<String, ApplicationSummaryModel> _latestByBadgeSlug = {};

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  ApplicationSummaryModel? latestForBadgeSlug(String badgeSlug) {
    return _latestByBadgeSlug[badgeSlug];
  }

  Future<ApplicationSummaryModel?> loadLatestForBadgeSlug(
    String badgeSlug,
  ) async {
    if (badgeSlug.trim().isEmpty) {
      return null;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final apps = await _applicationsRepository.getApplications(limit: 50);
      final match = apps.where((app) => app.badge?.slug == badgeSlug).toList();
      match.sort((a, b) {
        final aDate = a.latestDate ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bDate = b.latestDate ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bDate.compareTo(aDate);
      });

      final latest = match.isNotEmpty ? match.first : null;
      if (latest != null) {
        _latestByBadgeSlug[badgeSlug] = latest;
      }

      return latest;
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> startApplication({required int badgeId}) async {
    try {
      final payload = await _applicationsRepository.startApplication(
        badgeId: badgeId,
      );

      final success = payload['success'] ?? true;
      return {
        'success': success != false,
        'message': payload['message']?.toString(),
        'data': payload['data'],
      };
    } on DioException catch (e) {
      final responseData = e.response?.data;
      if (responseData is Map<String, dynamic> &&
          responseData['code'] == 'APP_ALREADY_EXISTS') {
        return {
          'success': false,
          'code': 'APP_ALREADY_EXISTS',
          'data': responseData['data'],
        };
      }
      return {'success': false, 'message': e.toString()};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> getUploadUrl({
    required String applicationGuid,
    required int requirementId,
    required String fileName,
  }) async {
    try {
      final payload = await _applicationsRepository.getUploadUrl(
        applicationGuid: applicationGuid,
        requirementId: requirementId,
        fileName: fileName,
      );

      final success = payload['success'] ?? true;
      final data = payload['data'];
      return {
        'success': success != false,
        'uploadUrl': data is Map ? data['uploadUrl'] : null,
        'finalFileUrl': data is Map ? data['finalFileUrl'] : null,
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> upsertEvidence({
    required String applicationGuid,
    required int requirementId,
    required String evidenceFileUrl,
    required String evidenceTitle,
    String? evidenceFileType,
  }) async {
    try {
      final payload = await _applicationsRepository.upsertEvidence(
        applicationGuid: applicationGuid,
        requirementId: requirementId,
        evidenceFileUrl: evidenceFileUrl,
        evidenceTitle: evidenceTitle,
        evidenceFileType: evidenceFileType,
      );

      final success = payload['success'] ?? true;
      return {'success': success != false, 'data': payload['data']};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> submitApplication(String applicationGuid) async {
    try {
      final payload = await _applicationsRepository.submitApplication(
        applicationGuid,
      );

      final success = payload['success'] ?? true;
      return {
        'success': success != false,
        'message': payload['message']?.toString(),
        'data': payload['data'],
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
