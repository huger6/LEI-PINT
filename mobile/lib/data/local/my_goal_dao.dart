import '../../models/my_goal_model.dart';
import '../../core/database/database_helper.dart';

class MyGoalDao {
  final LocalDatabase _database;

  MyGoalDao(this._database);

  Future<List<MyGoalModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myGoalsTable,
      orderBy: 'start_date ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<MyGoalModel>> getByBadge(int badgeId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myGoalsTable,
      where: 'badge_id = ?',
      whereArgs: [badgeId],
      orderBy: 'start_date ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<MyGoalModel>> getPending() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.myGoalsTable,
      where: 'pending_sync = 1',
    );

    return rows.map(_fromRow).toList();
  }

  Future<int> insert(MyGoalModel goal) async {
    final db = await _database.database;
    return db.insert(LocalDatabase.myGoalsTable, goal.toRow());
  }

  Future<void> update(MyGoalModel goal) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myGoalsTable,
      goal.toRow(),
      where: 'local_id = ?',
      whereArgs: [goal.localId],
    );
  }

  Future<void> markSynced(int localId, int serverId) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.myGoalsTable,
      {
        'server_id': serverId,
        'pending_sync': 0,
        'synced_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  /// Replaces all server-confirmed goals (pending_sync = 0) with the provided
  /// list. Locally-created rows not yet pushed are kept.
  Future<void> replaceAll(List<MyGoalModel> goals) async {
    final db = await _database.database;
    final batch = db.batch();

    batch.delete(
      LocalDatabase.myGoalsTable,
      where: 'pending_sync = 0',
    );

    for (final goal in goals) {
      batch.insert(LocalDatabase.myGoalsTable, goal.toRow());
    }

    await batch.commit(noResult: true);
  }

  Future<void> delete(int localId) async {
    final db = await _database.database;
    await db.delete(
      LocalDatabase.myGoalsTable,
      where: 'local_id = ?',
      whereArgs: [localId],
    );
  }

  MyGoalModel _fromRow(Map<String, dynamic> row) {
    return MyGoalModel(
      localId: row['local_id'] as int,
      serverId: row['server_id'] as int?,
      badgeId: row['badge_id'] as int?,
      applicationLocalId: row['application_local_id'] as int?,
      title: row['title'] as String,
      description: row['description'] as String?,
      startDate: row['start_date'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['start_date'] as int)
          : null,
      endDate: row['end_date'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['end_date'] as int)
          : null,
      reminderAt: row['reminder_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['reminder_at'] as int)
          : null,
      syncedAt: row['synced_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['synced_at'] as int)
          : null,
      pendingSync: (row['pending_sync'] as int?) == 1,
    );
  }
}
