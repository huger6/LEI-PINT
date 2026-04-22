import '../../models/area_model.dart';
import '../local_database.dart';

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
            name: row['name'] as String,
            slug: row['slug'] as String?,
          ),
        )
        .toList();
  }

  Future<void> replaceAll(List<AreaModel> areas) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.areasTable);

    for (final area in areas) {
      batch.insert(LocalDatabase.areasTable, {
        'id': area.id,
        'name': area.name,
        'slug': area.slug,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }
}
