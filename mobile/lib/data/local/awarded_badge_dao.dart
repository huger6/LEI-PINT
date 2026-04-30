import '../../models/awarded_badge_model.dart';
import '../../core/database/database_helper.dart';

class AwardedBadgeDao {
  final LocalDatabase _database;

  AwardedBadgeDao(this._database);

  Future<List<AwardedBadgeModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.awardedBadgesTable,
      orderBy: 'awarded_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<AwardedBadgeModel>> getFeatured() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.awardedBadgesTable,
      where: 'is_featured = 1',
      orderBy: 'display_order ASC, awarded_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<AwardedBadgeModel?> getByBadge(int badgeId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.awardedBadgesTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<void> replaceAll(List<AwardedBadgeModel> awarded) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.awardedBadgesTable);

    for (final ab in awarded) {
      batch.insert(LocalDatabase.awardedBadgesTable, {
        'id': ab.id,
        'application_id': ab.applicationId,
        'badge_id': ab.badgeId,
        'awarded_at': ab.awardedAt.millisecondsSinceEpoch,
        'expiration_at': ab.expirationAt?.millisecondsSinceEpoch,
        'points_snapshot': ab.pointsSnapshot,
        'verification_link': ab.verificationLink,
        'is_published': ab.isPublished ? 1 : 0,
        'is_featured': ab.isFeatured ? 1 : 0,
        'display_order': ab.displayOrder,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  AwardedBadgeModel _fromRow(Map<String, dynamic> row) {
    return AwardedBadgeModel(
      id: row['id'] as int,
      applicationId: row['application_id'] as int,
      badgeId: row['badge_id'] as int,
      awardedAt: DateTime.fromMillisecondsSinceEpoch(row['awarded_at'] as int),
      expirationAt: row['expiration_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['expiration_at'] as int)
          : null,
      pointsSnapshot: row['points_snapshot'] as int?,
      verificationLink: row['verification_link'] as String?,
      isPublished: (row['is_published'] as int?) == 1,
      isFeatured: (row['is_featured'] as int?) == 1,
      displayOrder: row['display_order'] as int?,
    );
  }
}
