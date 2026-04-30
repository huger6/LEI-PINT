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
