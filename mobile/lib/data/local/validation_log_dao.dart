import '../../models/validation_log_model.dart';
import '../../core/database/database_helper.dart';

class ValidationLogDao {
  final LocalDatabase _database;

  ValidationLogDao(this._database);

  Future<List<ValidationLogModel>> getByApplication(int applicationId) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.validationLogsTable,
      where: 'application_id = ?',
      whereArgs: [applicationId],
      orderBy: 'validated_at DESC',
    );

    return rows.map(_fromRow).toList();
  }

  Future<void> replaceAll(List<ValidationLogModel> logs) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.validationLogsTable);

    for (final log in logs) {
      batch.insert(LocalDatabase.validationLogsTable, {
        'id': log.id,
        'application_id': log.applicationId,
        'validator_function': log.validatorFunction,
        'validator_action': log.validatorAction,
        'comments': log.comments,
        'validated_at': log.validatedAt.millisecondsSinceEpoch,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  Future<void> replaceForApplication(
    int applicationId,
    List<ValidationLogModel> logs,
  ) async {
    final db = await _database.database;
    final now = DateTime.now().millisecondsSinceEpoch;

    await db.delete(
      LocalDatabase.validationLogsTable,
      where: 'application_id = ?',
      whereArgs: [applicationId],
    );

    final batch = db.batch();
    for (final log in logs) {
      batch.insert(LocalDatabase.validationLogsTable, {
        'id': log.id,
        'application_id': log.applicationId,
        'validator_function': log.validatorFunction,
        'validator_action': log.validatorAction,
        'comments': log.comments,
        'validated_at': log.validatedAt.millisecondsSinceEpoch,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  ValidationLogModel _fromRow(Map<String, dynamic> row) {
    return ValidationLogModel(
      id: row['id'] as int,
      applicationId: row['application_id'] as int,
      validatorFunction: row['validator_function'] as String,
      validatorAction: row['validator_action'] as String,
      comments: row['comments'] as String?,
      validatedAt: DateTime.fromMillisecondsSinceEpoch(
        row['validated_at'] as int,
      ),
    );
  }
}
