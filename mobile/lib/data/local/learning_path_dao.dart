import '../../models/learning_path_model.dart';
import '../../core/database/database_helper.dart';

class LearningPathDao {
  final LocalDatabase _database;

  LearningPathDao(this._database);

  Future<List<LearningPathModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.learningPathsTable,
      orderBy: 'title ASC',
    );

    return rows
        .map(
          (row) => LearningPathModel(
            id: row['id'] as int,
            title: row['title'] as String,
            slug: row['slug'] as String?,
            description: row['description'] as String?,
            imgUrl: row['img_url'] as String?,
          ),
        )
        .toList();
  }

  Future<void> replaceAll(List<LearningPathModel> paths) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.learningPathsTable);

    for (final lp in paths) {
      batch.insert(LocalDatabase.learningPathsTable, {
        'id': lp.id,
        'title': lp.title,
        'slug': lp.slug,
        'description': lp.description,
        'img_url': lp.imgUrl,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }
}
