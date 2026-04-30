import '../../models/my_evidence_model.dart';
import '../../core/database/database_helper.dart';

class MyEvidenceDao {
  final LocalDatabase _database;

  MyEvidenceDao(this._database);

  Future<List<MyEvidenceModel>> getByApplication(
    int applicationLocalId,
  ) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myEvidencesTable,
      where: 'application_local_id = ?',
      whereArgs: [applicationLocalId],
      orderBy: 'uploaded_at ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<MyEvidenceModel?> getByLocalId(int localId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myEvidencesTable,
      where: 'local_id = ?',
      whereArgs: [localId],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<List<MyEvidenceModel>> getPending() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myEvidencesTable,
      where: 'pending_sync = 1',
    );

    return rows.map(_fromRow).toList();
  }

  Future<int> insert(MyEvidenceModel evidence) async {
    final db = await _database.database;
    return db.insert(LocalDatabase.myEvidencesTable, evidence.toRow());
  }

  Future<void> update(MyEvidenceModel evidence) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myEvidencesTable,
      evidence.toRow(),
      where: 'local_id = ?',
      whereArgs: [evidence.localId],
    );
  }

  Future<void> markSynced(int localId, int serverId, String remoteUrl) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myEvidencesTable,
      {
        'server_id': serverId,
        'file_url': remoteUrl,
        'is_local_file': 0,
        'pending_sync': 0,
        'synced_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  Future<void> delete(int localId) async {
    final db = await _database.database;
    await db.delete(
      LocalDatabase.myEvidencesTable,
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  MyEvidenceModel _fromRow(Map<String, dynamic> row) {
    return MyEvidenceModel(
      localId: row['local_id'] as int,
      serverId: row['server_id'] as int?,
      applicationLocalId: row['application_local_id'] as int,
      requirementId: row['requirement_id'] as int?,
      fileUrl: row['file_url'] as String,
      title: row['title'] as String?,
      description: row['description'] as String?,
      fileType: row['file_type'] as String?,
      isLocalFile: (row['is_local_file'] as int?) == 1,
      uploadedAt: DateTime.fromMillisecondsSinceEpoch(
        row['uploaded_at'] as int,
      ),
      syncedAt: row['synced_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['synced_at'] as int)
          : null,
      pendingSync: (row['pending_sync'] as int?) == 1,
    );
  }
}
