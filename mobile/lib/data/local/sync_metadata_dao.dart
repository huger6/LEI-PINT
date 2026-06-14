import 'package:sqflite/sqflite.dart';

import '../../core/database/database_helper.dart';

class SyncMetadataDao {
  final LocalDatabase _database;

  SyncMetadataDao(this._database);

  Future<DateTime?> getLastSync(int updateCode) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.syncMetadataTable,
      where: 'update_code = ?',
      whereArgs: [updateCode],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    final ts = rows.first['synced_at'] as String?;
    return ts != null ? DateTime.tryParse(ts)?.toUtc() : null;
  }

  Future<void> setLastSync(int updateCode, DateTime timestamp) async {
    final db = await _database.database;
    await db.insert(
      LocalDatabase.syncMetadataTable,
      {
        'update_code': updateCode,
        'synced_at': timestamp.toUtc().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> clearAll() async {
    final db = await _database.database;
    await db.delete(LocalDatabase.syncMetadataTable);
  }
}
