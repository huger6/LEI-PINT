import '../../models/notification_model.dart';
import '../../core/database/database_helper.dart';

class NotificationDao {
  final LocalDatabase _database;

  NotificationDao(this._database);

  Future<List<NotificationModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.notificationsTable,
      orderBy: 'sent_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<NotificationModel>> getUnread() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.notificationsTable,
      where: 'is_read = 0',
      orderBy: 'sent_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<int> countUnread() async {
    final db = await _database.database;
    final rows = await db.rawQuery(
      'SELECT COUNT(*) AS c FROM ${LocalDatabase.notificationsTable} WHERE is_read = 0',
    );
    return rows.isNotEmpty ? (rows.first['c'] as int? ?? 0) : 0;
  }

  Future<void> markRead(int id) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.notificationsTable,
      {'is_read': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> markAllRead() async {
    final db = await _database.database;
    await db.update(LocalDatabase.notificationsTable, {'is_read': 1});
  }

  Future<void> replaceAll(List<NotificationModel> notifications) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.notificationsTable);

    for (final n in notifications) {
      batch.insert(LocalDatabase.notificationsTable, {
        'id': n.id,
        'definition_id': n.definitionId,
        'payload': n.payload,
        'url': n.url,
        'is_read': n.isRead ? 1 : 0,
        'sent_at': n.sentAt.millisecondsSinceEpoch,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  NotificationModel _fromRow(Map<String, dynamic> row) {
    return NotificationModel(
      id: row['id'] as int,
      definitionId: row['definition_id'] as int,
      payload: row['payload'] as String?,
      url: row['url'] as String?,
      isRead: (row['is_read'] as int?) == 1,
      sentAt: DateTime.fromMillisecondsSinceEpoch(row['sent_at'] as int),
    );
  }
}
