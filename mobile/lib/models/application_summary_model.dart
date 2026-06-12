import 'badge_model.dart';

class EvidenceSummary {
  const EvidenceSummary({
    required this.requirementId,
    required this.fileUrl,
    required this.title,
    this.fileType,
    this.requirementTitle,
  });

  final int requirementId;
  final String fileUrl;
  final String title;
  final String? fileType;
  final String? requirementTitle;

  factory EvidenceSummary.fromJson(Map<String, dynamic> json) {
    final req = json['requirement'];
    return EvidenceSummary(
      requirementId: json['requirement_id'] as int? ?? 0,
      fileUrl: (json['evidence_file_url'] ?? '').toString(),
      title: (json['evidence_title'] ?? '').toString(),
      fileType: json['evidence_file_type']?.toString(),
      requirementTitle: req is Map ? req['requirement_title']?.toString() : null,
    );
  }
}

class ApplicationSummaryModel {
  ApplicationSummaryModel({
    required this.applicationGuid,
    required this.applicationState,
    this.badge,
    this.submittedAt,
    this.openedAt,
    this.updatedAt,
    this.latestObservation,
    this.rejectedByRole,
    this.evidences = const [],
  });

  final String applicationGuid;
  final String applicationState;
  final BadgeModel? badge;
  final DateTime? submittedAt;
  final DateTime? openedAt;
  final DateTime? updatedAt;
  final String? latestObservation;
  final String? rejectedByRole;
  final List<EvidenceSummary> evidences;

  DateTime? get latestDate => updatedAt ?? submittedAt ?? openedAt;

  factory ApplicationSummaryModel.fromJson(Map<String, dynamic> json) {
    final badgePayload = json['badge'];
    final badge = badgePayload is Map<String, dynamic>
        ? BadgeModel.fromApiSummary(badgePayload)
        : null;

    String? latestObservation;
    String? rejectedByRole;
    final validationLogs = json['application_validation_logs'];
    if (validationLogs is List && validationLogs.isNotEmpty) {
      final latest = validationLogs.first;
      if (latest is Map<String, dynamic>) {
        latestObservation =
            latest['validations_comments']?.toString() ??
            latest['validation_comment']?.toString() ??
            latest['comment']?.toString();

        final action = (latest['validator_action'] ?? '').toString().toLowerCase();
        if (action.contains('reject')) {
          rejectedByRole = latest['validator_function']?.toString();
          if (rejectedByRole == null || rejectedByRole.isEmpty) {
            final user = latest['user'];
            if (user is Map) {
              rejectedByRole = user['user_role']?.toString();
            }
          }
        }
      }
    }

    final rawEvidences = json['requirements_evidences'];
    final evidences = rawEvidences is List
        ? rawEvidences
            .whereType<Map>()
            .map((e) => EvidenceSummary.fromJson(Map<String, dynamic>.from(e)))
            .toList()
        : <EvidenceSummary>[];

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
      updatedAt: _parseDate(
        _readString(json, const ['updated_at', 'updatedAt']),
      ),
      latestObservation: latestObservation,
      rejectedByRole: rejectedByRole,
      evidences: evidences,
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
