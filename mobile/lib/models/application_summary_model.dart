import 'badge_model.dart';

class ApplicationSummaryModel {
  ApplicationSummaryModel({
    required this.applicationGuid,
    required this.applicationState,
    this.badge,
    this.submittedAt,
    this.openedAt,
    this.latestObservation,
  });

  final String applicationGuid;
  final String applicationState;
  final BadgeModel? badge;
  final DateTime? submittedAt;
  final DateTime? openedAt;
  final String? latestObservation;

  DateTime? get latestDate => submittedAt ?? openedAt;

  factory ApplicationSummaryModel.fromJson(Map<String, dynamic> json) {
    final badgePayload = json['badge'];
    final badge = badgePayload is Map<String, dynamic>
        ? BadgeModel.fromApiSummary(badgePayload)
        : null;

    String? latestObservation;
    final validationLogs = json['application_validation_logs'];
    if (validationLogs is List && validationLogs.isNotEmpty) {
      final latest = validationLogs.first;
      if (latest is Map<String, dynamic>) {
        latestObservation =
            latest['validation_comment']?.toString() ??
            latest['comment']?.toString();
      }
    }

    return ApplicationSummaryModel(
      applicationGuid: _readString(json, const [
        'application_guid',
        'applicationGuid',
        'application_id',
        'id',
      ]),
      applicationState: _readString(json, const [
        'application_state',
        'applicationState',
        'state',
      ]),
      badge: badge,
      submittedAt: _parseDate(
        _readString(json, const ['submitted_at', 'submittedAt']),
      ),
      openedAt: _parseDate(_readString(json, const ['opened_at', 'openedAt'])),
      latestObservation: latestObservation,
    );
  }

  static String _readString(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value != null) {
        final text = value.toString().trim();
        if (text.isNotEmpty) {
          return text;
        }
      }
    }

    return '';
  }

  static DateTime? _parseDate(String input) {
    if (input.isEmpty) {
      return null;
    }

    return DateTime.tryParse(input);
  }
}
