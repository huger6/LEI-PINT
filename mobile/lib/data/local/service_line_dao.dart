import '../../models/service_line_model.dart';
import '../../core/database/database_helper.dart';

class ServiceLineDao {
  final LocalDatabase _database;

  ServiceLineDao(this._database);

  Future<List<ServiceLineModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.serviceLinesTable,
      orderBy: 'name ASC',
    );

    return rows
        .map(
          (row) => ServiceLineModel(
            id: row['id'] as int,
            learningPathId: row['learning_path_id'] as int?,
            name: row['name'] as String,
            slug: row['slug'] as String?,
            description: row['description'] as String?,
            imgUrl: row['img_url'] as String?,
          ),
        )
        .toList();
  }

  Future<void> replaceAll(List<ServiceLineModel> serviceLines) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.serviceLinesTable);

    for (final sl in serviceLines) {
      batch.insert(LocalDatabase.serviceLinesTable, {
        'id': sl.id,
        'learning_path_id': sl.learningPathId,
        'name': sl.name,
        'slug': sl.slug,
        'description': sl.description,
        'img_url': sl.imgUrl,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }
}
