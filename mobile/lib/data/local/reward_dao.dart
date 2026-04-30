import '../../models/reward_model.dart';
import '../../core/database/database_helper.dart';

class RewardDao {
  final LocalDatabase _database;

  RewardDao(this._database);

  Future<List<RewardModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(LocalDatabase.rewardsTable);

    return rows.map(_fromRow).toList();
  }

  Future<RewardModel?> getByBadge(int badgeId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.rewardsTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<void> replaceAll(List<RewardModel> rewards) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.rewardsTable);

    for (final reward in rewards) {
      batch.insert(LocalDatabase.rewardsTable, {
        'id': reward.id,
        'badge_id': reward.badgeId,
        'title': reward.title,
        'portrait_svg': reward.portraitSvg,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  RewardModel _fromRow(Map<String, dynamic> row) {
    return RewardModel(
      id: row['id'] as int,
      badgeId: row['badge_id'] as int?,
      title: row['title'] as String?,
      portraitSvg: row['portrait_svg'] as String?,
    );
  }
}
