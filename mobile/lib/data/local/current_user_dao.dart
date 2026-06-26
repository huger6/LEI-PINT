import 'package:sqflite/sqflite.dart';

import '../../models/user_model.dart';
import '../../core/database/database_helper.dart';

class CurrentUserDao {
  final LocalDatabase _database;

  CurrentUserDao(this._database);

  Future<UserModel?> get() async {
    final db = await _database.database;
    final rows = await db.query(LocalDatabase.currentUserTable, limit: 1);

    if (rows.isEmpty) return null;

    final areas = await _loadAreas(db);
    return _fromRow(rows.first, areas: areas);
  }

  Future<List<UserArea>> _loadAreas(Database db) async {
    final rows = await db.rawQuery('''
      SELECT ma.area_id, ma.is_primary, ac.name
      FROM ${LocalDatabase.myAreasTable} ma
      LEFT JOIN ${LocalDatabase.areasTable} ac ON ac.id = ma.area_id
      ORDER BY ma.is_primary DESC, ac.name ASC
    ''');

    return rows.map((r) => UserArea(
      name: (r['name'] as String?) ?? '',
      isPrimary: (r['is_primary'] as int?) == 1,
    )).toList();
  }

  Future<void> save(UserModel user) async {
    final db = await _database.database;
    final now = DateTime.now().millisecondsSinceEpoch;

    final existing = await get();
    final preservedGdpr =
        user.gdprAccepted || (existing?.gdprAccepted ?? false);

    await db.insert(
      LocalDatabase.currentUserTable,
      {
        'user_id': user.id,
        'full_name': user.fullName,
        'username': user.username,
        'email_address': user.email,
        'profile_img_url': user.profilePicture,
        'preferred_lang_id': user.preferredLangId ?? 1,
        'location_id': user.locationId,
        'biography': user.biography,
        'gdpr_accepted': preservedGdpr ? 1 : 0,
        'total_points': user.totalPoints,
        'synced_at': now,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> updatePoints(int totalPoints) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.currentUserTable,
      {'total_points': totalPoints},
    );
  }

  /// Mirrors the server-side RGPD consent state locally so the offline-first UI
  /// stops re-prompting once the consent has been recorded on the API.
  Future<void> updateActiveTitle(String? title) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.currentUserTable,
      {'active_title': title},
    );
  }

  Future<String?> getActiveTitle() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.currentUserTable,
      columns: ['active_title'],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return rows.first['active_title'] as String?;
  }

  Future<void> setGdprAccepted(bool accepted) async {
    final db = await _database.database;
    await db.update(
      LocalDatabase.currentUserTable,
      {'gdpr_accepted': accepted ? 1 : 0},
    );
  }

  Future<void> clear() async {
    final db = await _database.database;
    await db.delete(LocalDatabase.currentUserTable);
  }

  UserModel _fromRow(Map<String, dynamic> row, {List<UserArea> areas = const []}) {
    return UserModel(
      id: row['user_id'] as int,
      email: row['email_address'] as String,
      fullName: row['full_name'] as String,
      username: row['username'] as String,
      profilePicture: row['profile_img_url'] as String?,
      role: 'Consultant',
      biography: row['biography'] as String?,
      gdprAccepted: (row['gdpr_accepted'] as int?) == 1,
      totalPoints: row['total_points'] as int? ?? 0,
      preferredLangId: row['preferred_lang_id'] as int?,
      locationId: row['location_id'] as int?,
      areas: areas,
    );
  }
}
