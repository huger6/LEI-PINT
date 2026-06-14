import '../../models/stage_code_model.dart';
import '../../core/database/database_helper.dart';

class StageCodeDao {
  final LocalDatabase _database;

  StageCodeDao(this._database);

  Future<List<StageCodeModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.stageCodesTable,
      orderBy: 'id ASC',
    );

    return rows
        .map((row) => StageCodeModel(
              id: row['id'] as int,
              code: row['code'] as String,
            ))
        .toList();
  }

  Future<void> replaceAll(List<StageCodeModel> codes) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.stageCodesTable);

    for (final sc in codes) {
      batch.insert(LocalDatabase.stageCodesTable, {
        'id': sc.id,
        'code': sc.code,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }
}
