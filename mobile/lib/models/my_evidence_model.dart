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

  factory MyEvidenceModel.fromJson(
    Map<String, dynamic> json, {
    required int applicationLocalId,
  }) {
    return MyEvidenceModel(
      localId: 0,
      serverId: _toInt(json['id'] ?? json['evidence_id']),
      applicationLocalId: applicationLocalId,
      requirementId: json['requirement_id'] != null
          ? _toInt(json['requirement_id'])
          : null,
      fileUrl: (json['file_url'] ?? json['fileUrl'] ?? '').toString(),
      title: json['title']?.toString(),
      description: json['description']?.toString(),
      fileType:
          json['file_type']?.toString() ?? json['fileType']?.toString(),
      isLocalFile: false,
      uploadedAt:
          _parseDate(json['uploaded_at'] ?? json['uploadedAt']) ??
          DateTime.now(),
      syncedAt: DateTime.now(),
      pendingSync: false,
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
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

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
