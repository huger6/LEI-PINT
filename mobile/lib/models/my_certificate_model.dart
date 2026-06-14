class MyCertificateModel {
  final int localId;
  final int? serverId;
  final int applicationLocalId;
  final String title;
  final String? issuingEntity;
  final String? issueDate;
  final String? fileUrl;
  final bool isLocalFile;
  final DateTime? syncedAt;
  final bool pendingSync;

  MyCertificateModel({
    required this.localId,
    this.serverId,
    required this.applicationLocalId,
    required this.title,
    this.issuingEntity,
    this.issueDate,
    this.fileUrl,
    this.isLocalFile = false,
    this.syncedAt,
    this.pendingSync = true,
  });

  factory MyCertificateModel.fromJson(
    Map<String, dynamic> json, {
    required int applicationLocalId,
  }) {
    return MyCertificateModel(
      localId: 0,
      serverId: _toInt(json['id'] ?? json['certificate_id']),
      applicationLocalId: applicationLocalId,
      title: (json['title'] ?? json['certificate_title'] ?? '').toString(),
      issuingEntity: json['issuing_entity']?.toString() ??
          json['issuingEntity']?.toString(),
      issueDate:
          json['issue_date']?.toString() ?? json['issueDate']?.toString(),
      fileUrl:
          json['file_url']?.toString() ?? json['fileUrl']?.toString(),
      isLocalFile: false,
      syncedAt: DateTime.now(),
      pendingSync: false,
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  MyCertificateModel copyWith({
    int? serverId,
    String? fileUrl,
    bool? isLocalFile,
    DateTime? syncedAt,
    bool? pendingSync,
  }) {
    return MyCertificateModel(
      localId: localId,
      serverId: serverId ?? this.serverId,
      applicationLocalId: applicationLocalId,
      title: title,
      issuingEntity: issuingEntity,
      issueDate: issueDate,
      fileUrl: fileUrl ?? this.fileUrl,
      isLocalFile: isLocalFile ?? this.isLocalFile,
      syncedAt: syncedAt ?? this.syncedAt,
      pendingSync: pendingSync ?? this.pendingSync,
    );
  }

  Map<String, dynamic> toRow() {
    return {
      if (serverId != null) 'server_id': serverId,
      'application_local_id': applicationLocalId,
      'title': title,
      'issuing_entity': issuingEntity,
      'issue_date': issueDate,
      'file_url': fileUrl,
      'is_local_file': isLocalFile ? 1 : 0,
      'synced_at': syncedAt?.millisecondsSinceEpoch,
      'pending_sync': pendingSync ? 1 : 0,
    };
  }
}
