import '../../models/skill_model.dart';
import '../../core/database/database_helper.dart';

class SkillDao {
  final LocalDatabase _database;

  SkillDao(this._database);

  Future<List<SkillModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.skillsTable,
      orderBy: 'name ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<SkillModel>> getByBadge(int badgeId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.skillsTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
      orderBy: 'name ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<void> replaceAll(List<SkillModel> skills) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.skillsTable);

    for (final skill in skills) {
      batch.insert(LocalDatabase.skillsTable, {
        'id': skill.id,
        'badge_id': skill.badgeId,
        'name': skill.name,
        'description': skill.description,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  SkillModel _fromRow(Map<String, dynamic> row) {
    return SkillModel(
      id: row['id'] as int,
      badgeId: row['badge_id'] as int?,
      name: row['name'] as String,
      description: row['description'] as String?,
    );
  }
}
