import '../../models/reward_model.dart';
import '../../core/database/database_helper.dart';

class RewardDao {
  final LocalDatabase _database;

  RewardDao(this._database);

  Future<List<RewardModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.rewardsTable,
      orderBy: 'cost_points ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<RewardModel?> getByGuid(String rewardGuid) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.rewardsTable,
      where: 'reward_guid = ?',
      whereArgs: [rewardGuid],
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
        'reward_guid': reward.rewardGuid,
        'reward_name': reward.rewardName,
        'reward_description': reward.rewardDescription,
        'cost_points': reward.costPoints,
        'reward_category': reward.rewardCategory,
        'img_url': reward.imgUrl,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  RewardModel _fromRow(Map<String, dynamic> row) {
    return RewardModel(
      id: row['id'] as int,
      rewardGuid: row['reward_guid'] as String? ?? '',
      rewardName: row['reward_name'] as String? ?? '',
      rewardDescription: row['reward_description'] as String?,
      costPoints: row['cost_points'] as int? ?? 0,
      rewardCategory: row['reward_category'] as String?,
      imgUrl: row['img_url'] as String?,
    );
  }
}
