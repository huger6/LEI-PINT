import 'package:sqflite/sqflite.dart';

import '../../models/announcement_model.dart';
import '../../core/database/database_helper.dart';

class AnnouncementDao {
  final LocalDatabase _database;

  AnnouncementDao(this._database);

  Future<List<AnnouncementModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.announcementsTable,
      orderBy: 'starts_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<AnnouncementModel>> getActive() async {
    final db = await _database.database;
    final now = DateTime.now().millisecondsSinceEpoch;
    final rows = await db.rawQuery(
      '''
      SELECT * FROM ${LocalDatabase.announcementsTable}
      WHERE is_active = 1
        AND (starts_at IS NULL OR starts_at <= ?)
        AND (ends_at IS NULL OR ends_at >= ?)
      ORDER BY starts_at DESC
      ''',
      [now, now],
    );

    return rows.map(_fromRow).toList();
  }

  Future<void> replaceAll(List<AnnouncementModel> announcements) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.announcementsTable);

    for (final ann in announcements) {
      batch.insert(LocalDatabase.announcementsTable, {
        'id': ann.id,
        'title': ann.title,
        'message': ann.message,
        'starts_at': ann.startsAt?.millisecondsSinceEpoch,
        'ends_at': ann.endsAt?.millisecondsSinceEpoch,
        'type': ann.type,
        'is_global': ann.isGlobal ? 1 : 0,
        'is_active': ann.isActive ? 1 : 0,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  Future<void> upsertAll(List<AnnouncementModel> announcements) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    for (final ann in announcements) {
      batch.insert(
        LocalDatabase.announcementsTable,
        {
          'id': ann.id,
          'title': ann.title,
          'message': ann.message,
          'starts_at': ann.startsAt?.millisecondsSinceEpoch,
          'ends_at': ann.endsAt?.millisecondsSinceEpoch,
          'type': ann.type,
          'is_global': ann.isGlobal ? 1 : 0,
          'is_active': ann.isActive ? 1 : 0,
          'synced_at': now,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }

    await batch.commit(noResult: true);
  }

  AnnouncementModel _fromRow(Map<String, dynamic> row) {
    return AnnouncementModel(
      id: row['id'] as int,
      title: row['title'] as String,
      message: row['message'] as String,
      startsAt: row['starts_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['starts_at'] as int)
          : null,
      endsAt: row['ends_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['ends_at'] as int)
          : null,
      type: row['type'] as String?,
      isGlobal: (row['is_global'] as int?) == 1,
      isActive: (row['is_active'] as int?) == 1,
    );
  }
}
