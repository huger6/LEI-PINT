import '../../models/badge_model.dart';
import '../../core/database/database_helper.dart';
import '../../core/utils/badge_visuals.dart';

class BadgeDao {
  final LocalDatabase _database;

  BadgeDao(this._database);

  Future<List<BadgeModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.badgesTable,
      orderBy: 'title ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<BadgeModel>> getByArea(int areaId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.badgesTable,
      where: 'area_id = ?',
      whereArgs: [areaId],
      orderBy: 'title ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<List<BadgeModel>> getByServiceLine(int serviceLineId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.badgesTable,
      where: 'service_line_id = ?',
      whereArgs: [serviceLineId],
      orderBy: 'title ASC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<BadgeModel?> getById(int id) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.badgesTable,
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<BadgeModel?> getBySlug(String slug) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.badgesTable,
      where: 'slug = ?',
      whereArgs: [slug],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<void> replaceAll(List<BadgeModel> badges) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.badgesTable);

    for (final badge in badges) {
      batch.insert(LocalDatabase.badgesTable, {
        'id': badge.id,
        'slug': badge.slug,
        'title': badge.title,
        'badge_type': 'Standard',
        'points': badge.points,
        'expiration_days': null,
        'estimated_time': badge.duration.isNotEmpty ? badge.duration : null,
        'description': badge.description.isNotEmpty ? badge.description : null,
        'img_url': null,
        'area_id': 0,
        'service_line_id': 0,
        'learning_path_id': 0,
        'progression_stage_id': 0,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  Future<void> replaceAllFromJson(List<Map<String, dynamic>> rows) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.badgesTable);

    for (final row in rows) {
      batch.insert(LocalDatabase.badgesTable, {
        'id': row['badge_id'] ?? row['id'],
        'slug': row['badge_slug'] ?? row['slug'] ?? '',
        'title': row['badge_title'] ?? row['title'] ?? '',
        'badge_type': row['badge_type'] ?? 'Standard',
        'points': row['badge_points'] ?? row['points'] ?? 0,
        'expiration_days': row['expiration_duration_days'],
        'estimated_time': row['estimated_time_to_acquire'] ??
            row['estimated_duration'],
        'description': row['badge_description'] ?? row['description'],
        'img_url': row['badge_img_url'] ?? row['img_url'],
        'area_id': row['area_id'] ?? 0,
        'service_line_id': row['service_line_id'] ?? 0,
        'learning_path_id': row['learning_path_id'] ?? 0,
        'progression_stage_id': row['progression_stage_id'] ?? 0,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  BadgeModel _fromRow(Map<String, dynamic> row) {
    final slug = (row['slug'] as String?) ?? '';
    final title = (row['title'] as String?) ?? '';
    final seed = slug.isNotEmpty ? slug : title;

    return BadgeModel(
      id: row['id'] as int,
      slug: slug,
      title: title,
      category: '',
      points: row['points'] as int? ?? 0,
      level: '',
      duration: (row['estimated_time'] as String?) ?? '',
      medalColor: BadgeVisuals.medalColor(seed),
      ribbonColor: BadgeVisuals.ribbonColor(seed),
      description: (row['description'] as String?) ?? '',
      skills: const [],
      attributes: const [],
      requirements: const [],
    );
  }
}
