class MyEvidenceModel {
  final int localId;
  final int? serverId;
  final int applicationLocalId;
  final int? requirementId;
  final String fileUrl;
  final String? title;
  final String? description;
  final String? fileType;
  final bool isLocalFile;
  final DateTime uploadedAt;
  final DateTime? syncedAt;
  final bool pendingSync;

  MyEvidenceModel({
    required this.localId,
    this.serverId,
    required this.applicationLocalId,
    this.requirementId,
    required this.fileUrl,
    this.title,
    this.description,
    this.fileType,
    this.isLocalFile = false,
    required this.uploadedAt,
    this.syncedAt,
    this.pendingSync = true,
  });

  MyEvidenceModel copyWith({
    int? serverId,
    String? fileUrl,
    bool? isLocalFile,
    DateTime? syncedAt,
    bool? pendingSync,
  }) {
    return MyEvidenceModel(
      localId: localId,
      serverId: serverId ?? this.serverId,
      applicationLocalId: applicationLocalId,
      requirementId: requirementId,
      fileUrl: fileUrl ?? this.fileUrl,
      title: title,
      description: description,
      fileType: fileType,
      isLocalFile: isLocalFile ?? this.isLocalFile,
      uploadedAt: uploadedAt,
      syncedAt: syncedAt ?? this.syncedAt,
      pendingSync: pendingSync ?? this.pendingSync,
    );
  }

  Map<String, dynamic> toRow() {
    return {
      if (serverId != null) 'server_id': serverId,
      'application_local_id': applicationLocalId,
      'requirement_id': requirementId,
      'file_url': fileUrl,
      'title': title,
      'description': description,
      'file_type': fileType,
      'is_local_file': isLocalFile ? 1 : 0,
      'uploaded_at': uploadedAt.millisecondsSinceEpoch,
      'synced_at': syncedAt?.millisecondsSinceEpoch,
      'pending_sync': pendingSync ? 1 : 0,
    };
  }
}
