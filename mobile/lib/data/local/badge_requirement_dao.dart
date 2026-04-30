import '../../models/badge_requirement_model.dart';
import '../../core/database/database_helper.dart';

class BadgeRequirementDao {
  final LocalDatabase _database;

  BadgeRequirementDao(this._database);

  Future<List<BadgeRequirementModel>> getByBadge(int badgeId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.badgeRequirementsTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
      orderBy: 'sequence ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<void> replaceAll(List<BadgeRequirementModel> requirements) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.badgeRequirementsTable);

    for (final req in requirements) {
      batch.insert(LocalDatabase.badgeRequirementsTable, {
        'id': req.id,
        'badge_id': req.badgeId,
        'title': req.title,
        'sequence': req.sequence,
        'description': req.description,
        'img_url': req.imgUrl,
        'points': req.points,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  Future<void> replaceForBadge(
    int badgeId,
    List<BadgeRequirementModel> requirements,
  ) async {
    final db = await _database.database;
    final now = DateTime.now().millisecondsSinceEpoch;

    await db.delete(
      LocalDatabase.badgeRequirementsTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
    );

    final batch = db.batch();
    for (final req in requirements) {
      batch.insert(LocalDatabase.badgeRequirementsTable, {
        'id': req.id,
        'badge_id': req.badgeId,
        'title': req.title,
        'sequence': req.sequence,
        'description': req.description,
        'img_url': req.imgUrl,
        'points': req.points,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  BadgeRequirementModel _fromRow(Map<String, dynamic> row) {
    return BadgeRequirementModel(
      id: row['id'] as int,
      badgeId: row['badge_id'] as int,
      title: row['title'] as String,
      sequence: row['sequence'] as int?,
      description: row['description'] as String,
      imgUrl: row['img_url'] as String?,
      points: row['points'] as int? ?? 0,
    );
  }
}
