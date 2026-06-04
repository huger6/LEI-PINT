import 'package:sqflite/sqflite.dart';

import '../../core/database/database_helper.dart';

class TranslationCacheDao {
  final LocalDatabase _database;

  TranslationCacheDao(this._database);

  Future<Map<String, String>> getAll(String targetLang) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.translationCacheTable,
      where: 'target_lang = ?',
      whereArgs: [targetLang],
    );
    return {
      for (final row in rows)
        row['source_key'] as String: row['translated'] as String,
    };
  }

  Future<void> insertBatch(
    String targetLang,
    Map<String, String> translations,
  ) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    for (final entry in translations.entries) {
      batch.insert(
        LocalDatabase.translationCacheTable,
        {
          'source_key': entry.key,
          'target_lang': targetLang,
          'translated': entry.value,
          'cached_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
  }

  Future<void> clearLang(String targetLang) async {
    final db = await _database.database;
    await db.delete(
      LocalDatabase.translationCacheTable,
      where: 'target_lang = ?',
      whereArgs: [targetLang],
    );
  }

  Future<void> clearAll() async {
    final db = await _database.database;
    await db.delete(LocalDatabase.translationCacheTable);
  }
}
