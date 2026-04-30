import 'package:sqflite/sqflite.dart';

import '../../core/database/database_helper.dart';

class MyAreaDao {
  final LocalDatabase _database;

  MyAreaDao(this._database);

  Future<List<Map<String, dynamic>>> getAll() async {
    final db = await _database.database;
    return db.query(LocalDatabase.myAreasTable);
  }

  Future<int?> getPrimaryAreaId() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myAreasTable,
      where: 'is_primary = 1',
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return rows.first['area_id'] as int;
  }

  Future<List<int>> getPendingAreaIds() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myAreasTable,
      columns: ['area_id'],
      where: 'pending_sync = 1',
    );

    return rows.map((r) => r['area_id'] as int).toList();
  }

  Future<void> upsert(int areaId, {bool isPrimary = false}) async {
    final db = await _database.database;

    if (isPrimary) {
      // Only one area can be primary — clear the flag on others first.
      await db.update(
        LocalDatabase.myAreasTable,
        {'is_primary': 0},
      );
    }

    await db.insert(
      LocalDatabase.myAreasTable,
      {'area_id': areaId, 'is_primary': isPrimary ? 1 : 0, 'pending_sync': 1},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> remove(int areaId) async {
    final db = await _database.database;
    await db.delete(
      LocalDatabase.myAreasTable,
      where: 'area_id = ?',
      whereArgs: [areaId],
    );
  }

  Future<void> markSynced(int areaId) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myAreasTable,
      {'pending_sync': 0},
      where: 'area_id = ?',
      whereArgs: [areaId],
    );
  }

  Future<void> replaceAll(List<Map<String, dynamic>> areas) async {
    final db = await _database.database;
    final batch = db.batch();

    batch.delete(LocalDatabase.myAreasTable);

    for (final area in areas) {
      batch.insert(LocalDatabase.myAreasTable, {
        'area_id': area['area_id'],
        'is_primary': area['is_primary'] ?? 0,
        'pending_sync': 0,
      });
    }

    await batch.commit(noResult: true);
  }
}
