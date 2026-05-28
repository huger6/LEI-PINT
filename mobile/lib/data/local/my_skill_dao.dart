import 'package:sqflite/sqflite.dart';

import '../../core/database/database_helper.dart';
import '../../models/skill_model.dart';

class MySkillDao {
  final LocalDatabase _database;

  MySkillDao(this._database);

  Future<List<int>> getSelectedSkillIds() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.mySelectedSkillsTable,
      columns: ['skills_id'],
    );

    return rows.map((r) => r['skills_id'] as int).toList();
  }

  Future<List<SkillModel>> getSelectedSkills() async {
    final db = await _database.database;
    final rows = await db.rawQuery('''
      SELECT s.id, s.badge_id, s.name, s.description
      FROM ${LocalDatabase.mySelectedSkillsTable} ms
      INNER JOIN ${LocalDatabase.skillsTable} s ON s.id = ms.skills_id
      ORDER BY s.name ASC
    ''');

    return rows.map((r) => SkillModel(
      id: r['id'] as int,
      badgeId: r['badge_id'] as int?,
      name: r['name'] as String,
      description: r['description'] as String?,
    )).toList();
  }

  Future<List<int>> getPendingSkillIds() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.mySelectedSkillsTable,
      columns: ['skills_id'],
      where: 'pending_sync = 1',
    );

    return rows.map((r) => r['skills_id'] as int).toList();
  }

  Future<void> add(int skillId) async {
    final db = await _database.database;
    await db.insert(
      LocalDatabase.mySelectedSkillsTable,
      {'skills_id': skillId, 'pending_sync': 1},
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  Future<void> remove(int skillId) async {
    final db = await _database.database;
    await db.delete(
      LocalDatabase.mySelectedSkillsTable,
      where: 'skills_id = ?',
      whereArgs: [skillId],
    );
  }

  Future<void> markSynced(int skillId) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.mySelectedSkillsTable,
      {'pending_sync': 0},
      where: 'skills_id = ?',
      whereArgs: [skillId],
    );
  }

  Future<void> replaceAll(List<int> skillIds) async {
    final db = await _database.database;
    final batch = db.batch();

    batch.delete(LocalDatabase.mySelectedSkillsTable);

    for (final id in skillIds) {
      batch.insert(LocalDatabase.mySelectedSkillsTable, {
        'skills_id': id,
        'pending_sync': 0,
      });
    }

    await batch.commit(noResult: true);
  }
}
