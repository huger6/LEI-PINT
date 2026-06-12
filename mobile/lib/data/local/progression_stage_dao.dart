import 'package:sqflite/sqflite.dart';

import '../../models/progression_stage_model.dart';
import '../../core/database/database_helper.dart';

class ProgressionStageDao {
  final LocalDatabase _database;

  ProgressionStageDao(this._database);

  Future<List<ProgressionStageModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.progressionStagesTable,
      orderBy: 'area_id ASC, sequence ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<ProgressionStageModel>> getByArea(int areaId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.progressionStagesTable,
      where: 'area_id = ?',
      whereArgs: [areaId],
      orderBy: 'sequence ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<void> replaceAll(List<ProgressionStageModel> stages) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.progressionStagesTable);

    for (final stage in stages) {
      batch.insert(LocalDatabase.progressionStagesTable, {
        'id': stage.id,
        'area_id': stage.areaId,
        'stage_code_id': stage.stageCodeId,
        'title': stage.title,
        'sequence': stage.sequence,
        'description': stage.description,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  Future<void> upsertAll(List<ProgressionStageModel> stages) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    for (final stage in stages) {
      batch.insert(
        LocalDatabase.progressionStagesTable,
        {
          'id': stage.id,
          'area_id': stage.areaId,
          'stage_code_id': stage.stageCodeId,
          'title': stage.title,
          'sequence': stage.sequence,
          'description': stage.description,
          'synced_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
  }

  ProgressionStageModel _fromRow(Map<String, dynamic> row) {
    return ProgressionStageModel(
      id: row['id'] as int,
      areaId: row['area_id'] as int,
      stageCodeId: row['stage_code_id'] as int,
      title: row['title'] as String,
      sequence: row['sequence'] as int?,
      description: row['description'] as String?,
    );
  }
}
