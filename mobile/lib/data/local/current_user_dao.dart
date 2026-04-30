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
    return _fromRow(rows.first);
  }

  Future<void> save(UserModel user) async {
    final db = await _database.database;
    final now = DateTime.now().millisecondsSinceEpoch;

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
        'gdpr_accepted': user.gdprAccepted ? 1 : 0,
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

  Future<void> clear() async {
    final db = await _database.database;
    await db.delete(LocalDatabase.currentUserTable);
  }

  UserModel _fromRow(Map<String, dynamic> row) {
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
    );
  }
}
