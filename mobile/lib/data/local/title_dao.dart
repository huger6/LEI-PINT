import 'package:sqflite/sqflite.dart';

import '../../core/database/database_helper.dart';

class TitleDao {
  final LocalDatabase _database;

  TitleDao(this._database);

  Future<void> addTitle(String title) async {
    final db = await _database.database;
    await db.insert(
      LocalDatabase.myUnlockedTitlesTable,
      {'title': title, 'synced_at': DateTime.now().millisecondsSinceEpoch},
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  Future<List<String>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(LocalDatabase.myUnlockedTitlesTable);

    return rows
        .map((row) => row['title'] as String?)
        .whereType<String>()
        .toList();
  }

  Future<void> replaceAll(List<String> titles) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.myUnlockedTitlesTable);

    for (final title in titles) {
      batch.insert(LocalDatabase.myUnlockedTitlesTable, {
        'title': title,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }
}
