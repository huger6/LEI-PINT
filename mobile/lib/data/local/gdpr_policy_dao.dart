import 'package:sqflite/sqflite.dart';

import '../../models/gdpr_policy_model.dart';
import '../../core/database/database_helper.dart';

class GdprPolicyDao {
  final LocalDatabase _database;

  GdprPolicyDao(this._database);

  Future<List<GdprPolicyModel>> getAll() async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.gdprPoliciesTable,
      orderBy: 'policy_type ASC',
    );
    return rows.map(_fromRow).toList();
  }

  Future<GdprPolicyModel?> getByType(String type) async {
    final db = await _database.database;
    final rows = await db.query(
      LocalDatabase.gdprPoliciesTable,
      where: 'policy_type = ?',
      whereArgs: [type],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return _fromRow(rows.first);
  }

  Future<void> replaceAll(List<GdprPolicyModel> policies) async {
    final db = await _database.database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;

    batch.delete(LocalDatabase.gdprPoliciesTable);

    for (final policy in policies) {
      batch.insert(LocalDatabase.gdprPoliciesTable, {
        'policy_id': policy.policyId,
        'policy_type': policy.policyType,
        'version': policy.version,
        'policy_text': policy.policyText,
        'is_mandatory': policy.isMandatory ? 1 : 0,
        'created_at': policy.createdAt?.millisecondsSinceEpoch,
        'synced_at': now,
      });
    }

    await batch.commit(noResult: true);
  }

  GdprPolicyModel _fromRow(Map<String, dynamic> row) {
    return GdprPolicyModel(
      policyId: row['policy_id'] as int,
      policyType: row['policy_type'] as String,
      version: row['version'] as String,
      policyText: row['policy_text'] as String,
      isMandatory: (row['is_mandatory'] as int?) == 1,
      createdAt: row['created_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['created_at'] as int)
          : null,
    );
  }
}
