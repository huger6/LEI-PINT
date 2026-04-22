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

      final success = payload['success'] == true;
      return {
        'success': success,
        'message': payload['message']?.toString(),
        'data': payload['data'],
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> submitApplication(String applicationGuid) async {
    try {
      final payload = await _applicationsRepository.submitApplication(
        applicationGuid,
      );

      final success = payload['success'] == true;
      return {
        'success': success,
        'message': payload['message']?.toString(),
        'data': payload['data'],
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
