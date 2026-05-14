import '../../models/my_application_model.dart';
import '../../core/database/database_helper.dart';

class MyApplicationDao {
  final LocalDatabase _database;

  MyApplicationDao(this._database);

  Future<List<MyApplicationModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myApplicationsTable,
      orderBy: 'opened_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<MyApplicationModel?> getByLocalId(int localId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myApplicationsTable,
      where: 'local_id = ?',
      whereArgs: [localId],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<MyApplicationModel?> getByServerId(int serverId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myApplicationsTable,
      where: 'server_id = ?',
      whereArgs: [serverId],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<MyApplicationModel?> getByGuid(String guid) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myApplicationsTable,
      where: 'application_guid = ?',
      whereArgs: [guid],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<List<MyApplicationModel>> getByBadge(int badgeId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myApplicationsTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
      orderBy: 'opened_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<MyApplicationModel>> getPending() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myApplicationsTable,
      where: 'pending_sync = 1',
      orderBy: 'opened_at ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<int> insert(MyApplicationModel app) async {
    final db = await _database.database;
    return db.insert(LocalDatabase.myApplicationsTable, app.toRow());
  }

  Future<void> update(MyApplicationModel app) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myApplicationsTable,
      app.toRow(),
      where: 'local_id = ?',
      whereArgs: [app.localId],
    );
  }

  Future<void> markSynced(int localId, int serverId) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myApplicationsTable,
      {
        'server_id': serverId,
        'pending_sync': 0,
        'synced_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  Future<void> updateStateFromServer(
    int serverId,
    String state, {
    String? reviewerNotes,
    DateTime? submittedAt,
    DateTime? closedAt,
  }) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myApplicationsTable,
      {
        'state': state,
        ...?(reviewerNotes == null
            ? null
            : {'reviewer_notes': reviewerNotes}),
        ...?(submittedAt == null
            ? null
            : {'submitted_at': submittedAt.millisecondsSinceEpoch}),
        ...?(closedAt == null
            ? null
            : {'closed_at': closedAt.millisecondsSinceEpoch}),
        'pending_sync': 0,
        'synced_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'server_id = ?',
      whereArgs: [serverId],
    );
  }

  /// Replaces all server-confirmed applications (pending_sync = 0) with the
  /// provided list. Locally-created rows that have not yet been pushed are kept.
  Future<void> replaceAll(List<MyApplicationModel> applications) async {
    final db = await _database.database;
    final batch = db.batch();

    batch.delete(
      LocalDatabase.myApplicationsTable,
      where: 'pending_sync = 0',
    );

    for (final app in applications) {
      batch.insert(LocalDatabase.myApplicationsTable, app.toRow());
    }

    await batch.commit(noResult: true);
  }

  Future<void> delete(int localId) async {
    final db = await _database.database;
    await db.delete(
      LocalDatabase.myApplicationsTable,
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  MyApplicationModel _fromRow(Map<String, dynamic> row) {
    return MyApplicationModel(
      localId: row['local_id'] as int,
      serverId: row['server_id'] as int?,
      badgeId: row['badge_id'] as int,
      applicationGuid: row['application_guid'] as String,
      state: row['state'] as String,
      reviewerNotes: row['reviewer_notes'] as String?,
      openedAt: DateTime.fromMillisecondsSinceEpoch(row['opened_at'] as int),
      submittedAt: row['submitted_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['submitted_at'] as int)
          : null,
      closedAt: row['closed_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['closed_at'] as int)
          : null,
      syncedAt: row['synced_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['synced_at'] as int)
          : null,
      pendingSync: (row['pending_sync'] as int?) == 1,
    );
  }
}
