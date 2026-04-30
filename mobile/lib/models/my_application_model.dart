class MyApplicationModel {
  final int localId;
  final int? serverId;
  final int badgeId;
  final String applicationGuid;
  final String state;
  final String? reviewerNotes;
  final DateTime openedAt;
  final DateTime? submittedAt;
  final DateTime? closedAt;
  final DateTime? syncedAt;
  final bool pendingSync;

  MyApplicationModel({
    required this.localId,
    this.serverId,
    required this.badgeId,
    required this.applicationGuid,
    this.state = 'Open',
    this.reviewerNotes,
    required this.openedAt,
    this.submittedAt,
    this.closedAt,
    this.syncedAt,
    this.pendingSync = true,
  });

  bool get isOpen => state == 'Open';
  bool get isSubmitted => state == 'Submitted';
  bool get isInValidation => state == 'In validation';
  bool get isAccepted => state == 'Accepted';
  bool get isRejected => state == 'Rejected';
  bool get isClosed => isAccepted || isRejected;

  MyApplicationModel copyWith({
    int? serverId,
    String? state,
    String? reviewerNotes,
    DateTime? submittedAt,
    DateTime? closedAt,
    DateTime? syncedAt,
    bool? pendingSync,
  }) {
    return MyApplicationModel(
      localId: localId,
      serverId: serverId ?? this.serverId,
      badgeId: badgeId,
      applicationGuid: applicationGuid,
      state: state ?? this.state,
      reviewerNotes: reviewerNotes ?? this.reviewerNotes,
      openedAt: openedAt,
      submittedAt: submittedAt ?? this.submittedAt,
      closedAt: closedAt ?? this.closedAt,
      syncedAt: syncedAt ?? this.syncedAt,
      pendingSync: pendingSync ?? this.pendingSync,
    );
  }

  factory MyApplicationModel.fromJson(Map<String, dynamic> json) {
    return MyApplicationModel(
      localId: 0,
      serverId: _toInt(json['id'] ?? json['application_id']),
      badgeId: _toInt(json['badge_id']),
      applicationGuid:
          (json['application_guid'] ?? json['applicationGuid'] ?? '')
              .toString(),
      state:
          (json['application_state'] ?? json['state'] ?? 'Open').toString(),
      reviewerNotes: json['reviewer_notes']?.toString() ??
          json['reviewerNotes']?.toString(),
      openedAt:
          _parseDate(json['opened_at'] ?? json['openedAt']) ?? DateTime.now(),
      submittedAt: _parseDate(json['submitted_at'] ?? json['submittedAt']),
      closedAt: _parseDate(json['closed_at'] ?? json['closedAt']),
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

  Map<String, dynamic> toRow() {
    return {
      if (serverId != null) 'server_id': serverId,
      'badge_id': badgeId,
      'application_guid': applicationGuid,
      'state': state,
      'reviewer_notes': reviewerNotes,
      'opened_at': openedAt.millisecondsSinceEpoch,
      'submitted_at': submittedAt?.millisecondsSinceEpoch,
      'closed_at': closedAt?.millisecondsSinceEpoch,
      'synced_at': syncedAt?.millisecondsSinceEpoch,
      'pending_sync': pendingSync ? 1 : 0,
    };
  }
}
