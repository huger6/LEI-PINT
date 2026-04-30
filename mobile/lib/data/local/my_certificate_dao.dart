import '../../models/my_certificate_model.dart';
import '../../core/database/database_helper.dart';

class MyCertificateDao {
  final LocalDatabase _database;

  MyCertificateDao(this._database);

  Future<List<MyCertificateModel>> getByApplication(
    int applicationLocalId,
  ) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myCertificatesTable,
      where: 'application_local_id = ?',
      whereArgs: [applicationLocalId],
    );

    return rows.map(_fromRow).toList();
  }

  Future<MyCertificateModel?> getByLocalId(int localId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myCertificatesTable,
      where: 'local_id = ?',
      whereArgs: [localId],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<List<MyCertificateModel>> getPending() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myCertificatesTable,
      where: 'pending_sync = 1',
    );

    return rows.map(_fromRow).toList();
  }

  Future<int> insert(MyCertificateModel cert) async {
    final db = await _database.database;
    return db.insert(LocalDatabase.myCertificatesTable, cert.toRow());
  }

  Future<void> update(MyCertificateModel cert) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myCertificatesTable,
      cert.toRow(),
      where: 'local_id = ?',
      whereArgs: [cert.localId],
    );
  }

  Future<void> markSynced(int localId, int serverId) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myCertificatesTable,
      {
        'server_id': serverId,
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
      LocalDatabase.myCertificatesTable,
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  MyCertificateModel _fromRow(Map<String, dynamic> row) {
    return MyCertificateModel(
      localId: row['local_id'] as int,
      serverId: row['server_id'] as int?,
      applicationLocalId: row['application_local_id'] as int,
      title: row['title'] as String,
      issuingEntity: row['issuing_entity'] as String?,
      issueDate: row['issue_date'] as String?,
      fileUrl: row['file_url'] as String?,
      isLocalFile: (row['is_local_file'] as int?) == 1,
      syncedAt: row['synced_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['synced_at'] as int)
          : null,
      pendingSync: (row['pending_sync'] as int?) == 1,
    );
  }
}
