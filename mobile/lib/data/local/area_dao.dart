import '../../models/area_model.dart';
import '../../core/database/database_helper.dart';

class AreaDao {
  final LocalDatabase _database;

  AreaDao(this._database);

  Future<List<AreaModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(LocalDatabase.areasTable, orderBy: 'name ASC');

    return rows
        .map(
          (row) => AreaModel(
            id: row['id'] as int,
            serviceLineId: row['service_line_id'] as int?,
            name: row['name'] as String,
            slug: row['slug'] as String?,
            description: row['description'] as String?,
            imgUrl: row['img_url'] as String?,
          ),
        )
        .toList();
  }

  Future<AreaModel?> getById(int id) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.areasTable,
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (rows.isEmpty) return null;
    final row = rows.first;
    return AreaModel(
      id: row['id'] as int,
      serviceLineId: row['service_line_id'] as int?,
      name: row['name'] as String,
      slug: row['slug'] as String?,
      description: row['description'] as String?,
      imgUrl: row['img_url'] as String?,
    );
  }

  Future<void> replaceAll(List<AreaModel> areas) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.areasTable);

    for (final area in areas) {
      batch.insert(LocalDatabase.areasTable, {
        'id': area.id,
        'service_line_id': area.serviceLineId,
        'name': area.name,
        'slug': area.slug,
        'description': area.description,
        'img_url': area.imgUrl,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }
}
