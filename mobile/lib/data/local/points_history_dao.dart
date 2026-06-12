import '../../models/points_history_model.dart';
import '../../core/database/database_helper.dart';

class PointsHistoryDao {
  final LocalDatabase _database;

  PointsHistoryDao(this._database);

  Future<List<PointsHistoryModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.pointsHistoryTable,
      orderBy: 'id DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<int> totalPoints() async {
    final db = await _database.database;
    final rows = await db.rawQuery(
      'SELECT SUM(points_delta) AS total FROM ${LocalDatabase.pointsHistoryTable}',
    );
    return rows.isNotEmpty ? (rows.first['total'] as int? ?? 0) : 0;
  }

  Future<void> replaceAll(List<PointsHistoryModel> history) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.pointsHistoryTable);

    for (final entry in history) {
      batch.insert(LocalDatabase.pointsHistoryTable, {
        'id': entry.id,
        'requirement_id': entry.requirementId,
        'badge_id': entry.badgeId,
        'points_delta': entry.pointsDelta,
        'justification': entry.justification,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  PointsHistoryModel _fromRow(Map<String, dynamic> row) {
    return PointsHistoryModel(
      id: row['id'] as int,
      requirementId: row['requirement_id'] as int?,
      badgeId: row['badge_id'] as int?,
      pointsDelta: row['points_delta'] as int,
      justification: row['justification'] as String?,
    );
  }
}
