import '../../models/location_model.dart';
import '../local_database.dart';

class LocationDao {
  final LocalDatabase _database;

  LocationDao(this._database);

  Future<List<LocationModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.locationsTable,
      orderBy: 'name ASC',
    );

    return rows
        .map(
          (row) =>
              LocationModel(id: row['id'] as int, name: row['name'] as String),
        )
        .toList();
  }

  Future<void> replaceAll(List<LocationModel> locations) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.locationsTable);

    for (final location in locations) {
      batch.insert(LocalDatabase.locationsTable, {
        'id': location.id,
        'name': location.name,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }
}
