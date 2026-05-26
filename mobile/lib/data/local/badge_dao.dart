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

  Future<void> insertIfMissing(Map<String, dynamic> badgeJson) async {
    final rawId = badgeJson['badge_id'] ?? badgeJson['id'];
    if (rawId == null) return;
    final id = rawId is int ? rawId : (int.tryParse(rawId.toString()) ?? 0);
    if (id == 0) return;

    final db = await _database.database;
    final existing = await db.query(
      LocalDatabase.badgesTable,
      columns: ['id'],
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (existing.isNotEmpty) return;

    final area = badgeJson['area'];
    final areaName = area is Map
        ? (area['area_name'] ?? area['name'])?.toString() ?? ''
        : (badgeJson['area_name'] ?? '').toString();

    final stage = badgeJson['progression_stage'];
    String stageCode = '';
    if (stage is Map) {
      final sc = stage['stage_code'];
      if (sc is Map) {
        stageCode = (sc['stage_code'] ?? '').toString();
      } else if (sc is String) {
        stageCode = sc;
      }
    }

    await db.insert(LocalDatabase.badgesTable, {
      'id': id,
      'slug': badgeJson['badge_slug'] ?? badgeJson['slug'] ?? '',
      'title': badgeJson['badge_title'] ?? badgeJson['title'] ?? '',
      'badge_type': badgeJson['badge_type'] ?? 'Standard',
      'points': badgeJson['badge_points'] ?? badgeJson['points'] ?? 0,
      'expiration_days': badgeJson['expiration_duration_days'],
      'estimated_time':
          badgeJson['estimated_time_to_acquire'] ?? badgeJson['estimated_duration'],
      'description': badgeJson['badge_description'] ?? badgeJson['description'],
      'img_url': badgeJson['badge_img_url'] ?? badgeJson['img_url'],
      'area_id': badgeJson['area_id'] ?? 0,
      'area_name': areaName,
      'stage_code': stageCode,
      'service_line_id': badgeJson['service_line_id'] ?? 0,
      'learning_path_id': badgeJson['learning_path_id'] ?? 0,
      'progression_stage_id': badgeJson['progression_stage_id'] ?? 0,
      'synced_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<void> replaceAllFromJson(List<Map<String, dynamic>> rows) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.badgesTable);

    for (final row in rows) {
      final area = row['area'];
      final areaName = area is Map
          ? (area['area_name'] ?? area['name'])?.toString() ?? ''
          : (row['area_name'] ?? '').toString();

      final stage = row['progression_stage'];
      String stageCode = '';
      if (stage is Map) {
        final sc = stage['stage_code'];
        if (sc is Map) {
          stageCode = (sc['stage_code'] ?? '').toString();
        } else if (sc is String) {
          stageCode = sc;
        }
      }

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
        'area_name': areaName,
        'stage_code': stageCode,
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
    final area = (row['area_name'] as String?) ?? '';
    final level = (row['stage_code'] as String?) ?? '';
    final points = row['points'] as int? ?? 0;
    final duration = (row['estimated_time'] as String?) ?? '';

    return BadgeModel(
      id: row['id'] as int,
      slug: slug,
      title: title,
      category: area,
      points: points,
      level: level,
      duration: duration,
      medalColor: BadgeVisuals.medalColor(seed),
      ribbonColor: BadgeVisuals.ribbonColor(seed),
      description: (row['description'] as String?) ?? '',
      skills: const [],
      attributes: BadgeModel.buildAttributes(
        area: area,
        points: points,
        stageCode: level,
        duration: duration,
      ),
      requirements: const [],
    );
  }
}
