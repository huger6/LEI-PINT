import '../../models/redemption_model.dart';
import '../../core/database/database_helper.dart';

class RedemptionDao {
  final LocalDatabase _database;

  RedemptionDao(this._database);

  Future<List<RedemptionModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myRedemptionsTable,
      orderBy: 'redeemed_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<void> replaceAll(List<RedemptionModel> redemptions) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.myRedemptionsTable);

    for (final r in redemptions) {
      batch.insert(LocalDatabase.myRedemptionsTable, {
        'redemption_guid': r.redemptionGuid,
        'reward_name': r.name,
        'access_link': r.accessLink,
        'access_info': r.accessInfo,
        'points_spent': r.pointsSpent,
        'redeemed_at': r.redeemedAt.millisecondsSinceEpoch,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  RedemptionModel _fromRow(Map<String, dynamic> row) {
    return RedemptionModel(
      id: row['id'] as int,
      redemptionGuid: row['redemption_guid'] as String? ?? '',
      name: row['reward_name'] as String?,
      accessLink: row['access_link'] as String?,
      accessInfo: row['access_info'] as String?,
      pointsSpent: row['points_spent'] as int? ?? 0,
      redeemedAt: DateTime.fromMillisecondsSinceEpoch(
        row['redeemed_at'] as int? ?? 0,
      ),
    );
  }
}
