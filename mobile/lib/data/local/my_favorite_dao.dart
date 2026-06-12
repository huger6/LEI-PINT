import 'package:sqflite/sqflite.dart';

import '../../core/database/database_helper.dart';

class MyFavoriteDao {
  final LocalDatabase _database;

  MyFavoriteDao(this._database);

  Future<List<int>> getFavoriteBadgeIds() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myFavoriteBadgesTable,
      columns: ['badge_id'],
    );

    return rows.map((r) => r['badge_id'] as int).toList();
  }

  Future<bool> isFavorite(int badgeId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myFavoriteBadgesTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
      limit: 1,
    );

    return rows.isNotEmpty;
  }

  Future<void> add(int badgeId) async {
    final db = await _database.database;
    await db.insert(
      LocalDatabase.myFavoriteBadgesTable,
      {
        'badge_id': badgeId,
        'favorited_at': DateTime.now().millisecondsSinceEpoch,
        'pending_sync': 1,
      },
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  Future<void> remove(int badgeId) async {
    final db = await _database.database;
    await db.delete(
      LocalDatabase.myFavoriteBadgesTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
    );
  }

  Future<List<Map<String, dynamic>>> getPending() async {
    final db = await _database.database;
    return db.query(
      LocalDatabase.myFavoriteBadgesTable,
      where: 'pending_sync = 1',
    );
  }

  Future<void> markSynced(int badgeId) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myFavoriteBadgesTable,
      {'pending_sync': 0},
      where: 'badge_id = ?',
      whereArgs: [badgeId],
    );
  }

  Future<void> replaceAll(List<int> badgeIds) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.myFavoriteBadgesTable);

    for (final id in badgeIds) {
      batch.insert(LocalDatabase.myFavoriteBadgesTable, {
        'badge_id': id,
        'favorited_at': now,
        'pending_sync': 0,
      });
    }

    await batch.commit(noResult: true);
  }
}
