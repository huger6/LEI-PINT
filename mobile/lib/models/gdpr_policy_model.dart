class GdprPolicyModel {
  final int policyId;
  final String policyType;
  final String version;
  final String policyText;
  final bool isMandatory;
  final DateTime? createdAt;

  GdprPolicyModel({
    required this.policyId,
    required this.policyType,
    required this.version,
    required this.policyText,
    this.isMandatory = true,
    this.createdAt,
  });

  factory GdprPolicyModel.fromJson(Map<String, dynamic> json) {
    return GdprPolicyModel(
      policyId: json['policy_id'] as int,
      policyType: json['policy_type'] as String,
      version: json['version'] as String,
      policyText: json['policy_text'] as String,
      isMandatory: json['is_mandatory'] == true || json['is_mandatory'] == 1,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }
}
