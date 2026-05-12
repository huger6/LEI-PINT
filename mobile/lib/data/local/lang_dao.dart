import 'package:sqflite/sqflite.dart';

import '../../core/database/database_helper.dart';
import '../../models/lang_model.dart';

class LanguageDao {
  final LocalDatabase _database;

  LanguageDao(this._database);

  Future<List<LanguageModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.languagesTable,
      orderBy: 'id ASC',
    );

    return rows
        .map(
          (row) => LanguageModel(
            id: row['id'] as int,
            code: row['code'] as String,
            name: row['name'] as String,
          ),
        )
        .toList();
  }

  Future<LanguageModel?> getById(int id) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.languagesTable,
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    final row = rows.first;
    return LanguageModel(
      id: row['id'] as int,
      code: row['code'] as String,
      name: row['name'] as String,
    );
  }

  Future<void> replaceAll(List<LanguageModel> languages) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;
    final uniqueLanguages = {
      for (final language in languages) language.id: language,
    };

    batch.delete(LocalDatabase.languagesTable);

    for (final language in uniqueLanguages.values) {
      batch.insert(LocalDatabase.languagesTable, {
        'id': language.id,
        'code': language.code,
        'name': language.name,
        'synced_at': now,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }

    await batch.commit(noResult: true);
  }
}
