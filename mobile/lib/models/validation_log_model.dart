// Reviewer's user_id is intentionally excluded — only the role
// (validatorFunction) and action are stored to avoid persisting
// other users' identifiers on-device.
class ValidationLogModel {
  final int id;
  final int applicationId;
  final String validatorFunction;
  final String validatorAction;
  final String? comments;
  final DateTime validatedAt;

  ValidationLogModel({
    required this.id,
    required this.applicationId,
    required this.validatorFunction,
    required this.validatorAction,
    this.comments,
    required this.validatedAt,
  });

  factory ValidationLogModel.fromJson(Map<String, dynamic> json) {
    return ValidationLogModel(
      id: _toInt(json['id'] ?? json['validation_log_id']),
      applicationId: _toInt(json['application_id']),
      validatorFunction:
          (json['validator_function'] ?? '').toString(),
      validatorAction: (json['validator_action'] ?? '').toString(),
      comments: json['comments']?.toString() ??
          json['validations_comments']?.toString() ??
          json['validation_comment']?.toString(),
      validatedAt: _parseDate(json['validated_at']) ?? DateTime.now(),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    return DateTime.tryParse(value.toString());
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
