import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';

class LocalDatabase {
  LocalDatabase._();

  static final LocalDatabase instance = LocalDatabase._();

  static const _databaseName = 'badges_softinsa.db';
  static const _databaseVersion = 13;

  // ── Reference / cache tables (pulled from server, read-only locally) ─────
  static const locationsTable = 'locations_cache';
  static const languagesTable = 'languages_cache';
  static const areasTable = 'areas_cache';
  static const serviceLinesTable = 'service_lines_cache';
  static const learningPathsTable = 'learning_paths_cache';
  static const stageCodesTable = 'stage_codes_cache';
  static const progressionStagesTable = 'progression_stages_cache';
  static const badgesTable = 'badges_cache';
  static const badgeRequirementsTable = 'badge_requirements_cache';
  static const skillsTable = 'skills_cache';
  static const rewardsTable = 'rewards_cache';
  static const myRedemptionsTable = 'my_redemptions_cache';
  static const myUnlockedTitlesTable = 'my_unlocked_titles';
  static const deletedNotificationsTable = 'deleted_notification_ids';
  static const announcementsTable = 'announcements_cache';
  static const gdprPoliciesTable = 'gdpr_policies_cache';
  static const translationCacheTable = 'translation_cache';

  // ── Sync tracking ────────────────────────────────────────────────────────
  static const syncMetadataTable = 'sync_metadata';

  // ── Own-user data (pulled from server, keyed to the logged-in consultant) ─
  static const currentUserTable = 'current_user_profile';
  static const notificationsTable = 'notifications_cache';
  static const awardedBadgesTable = 'awarded_badges_cache';
  static const pointsHistoryTable = 'points_history_cache';

  // Validation logs: reviewer user_id is intentionally excluded
  // so no other user's identifier is persisted on-device.
  static const validationLogsTable = 'validation_logs_cache';

  // ── Offline-first write tables (pending_sync=1 means not yet pushed) ─────
  static const myApplicationsTable = 'my_applications';
  static const myEvidencesTable = 'my_evidences';
  static const myCertificatesTable = 'my_certificates';
  static const myGoalsTable = 'my_goals';
  static const myFavoriteBadgesTable = 'my_favorite_badges';
  static const mySelectedSkillsTable = 'my_selected_skills';
  static const myAreasTable = 'my_areas';

  static const List<String> userOwnedTables = [
    syncMetadataTable,
    currentUserTable,
    notificationsTable,
    deletedNotificationsTable,
    awardedBadgesTable,
    pointsHistoryTable,
    validationLogsTable,
    myRedemptionsTable,
    myUnlockedTitlesTable,
    myApplicationsTable,
    myEvidencesTable,
    myCertificatesTable,
    myGoalsTable,
    myFavoriteBadgesTable,
    mySelectedSkillsTable,
    myAreasTable,
  ];

  static const List<String> offlineWriteTables = [
    myApplicationsTable,
    myEvidencesTable,
    myCertificatesTable,
    myGoalsTable,
    myFavoriteBadgesTable,
    mySelectedSkillsTable,
    myAreasTable,
  ];

  Database? _database;

  Future<Database> get database async {
    _database ??= await _openDatabase();
    return _database!;
  }

  Future<void> close() async {
    await _database?.close();
    _database = null;
  }

  Future<Database> _openDatabase() async {
    final databasesPath = await getDatabasesPath();
    final dbPath = path.join(databasesPath, _databaseName);
    return openDatabase(
      dbPath,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Schema lifecycle
  // ──────────────────────────────────────────────────────────────────────────

  Future<void> _onCreate(Database db, int version) async {
    await _createAllTables(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('DROP TABLE IF EXISTS locations_cache');
      await db.execute('DROP TABLE IF EXISTS languages_cache');
      await db.execute('DROP TABLE IF EXISTS areas_cache');
      await _createAllTables(db);
    }
    if (oldVersion < 3) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $syncMetadataTable (
          update_code INTEGER PRIMARY KEY,
          synced_at   TEXT    NOT NULL
        )
      ''');
    }
    if (oldVersion < 4) {
      await db.execute(
        'ALTER TABLE $awardedBadgesTable ADD COLUMN application_guid TEXT',
      );
    }
    if (oldVersion < 5) {
      await db.execute(
        'ALTER TABLE $badgesTable ADD COLUMN area_name TEXT NOT NULL DEFAULT \'\'',
      );
      await db.execute(
        'ALTER TABLE $badgesTable ADD COLUMN stage_code TEXT NOT NULL DEFAULT \'\'',
      );
    }
    if (oldVersion < 6) {
      for (final table in userOwnedTables) {
        await db.execute('DELETE FROM $table');
      }
      for (final table in offlineWriteTables) {
        await db.execute('DELETE FROM $table');
      }
    }
    if (oldVersion < 7) {
      await db.execute(
        "ALTER TABLE $notificationsTable ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'SYSTEM'",
      );
    }
    if (oldVersion < 8) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $translationCacheTable (
          source_key  TEXT    NOT NULL,
          target_lang TEXT    NOT NULL,
          translated  TEXT    NOT NULL,
          cached_at   INTEGER NOT NULL,
          PRIMARY KEY (source_key, target_lang)
        )
      ''');
    }
    if (oldVersion < 9) {
      await db.execute(
        'ALTER TABLE $badgesTable ADD COLUMN created_at INTEGER',
      );
    }
    if (oldVersion < 10) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $gdprPoliciesTable (
          policy_id    INTEGER PRIMARY KEY,
          policy_type  TEXT    NOT NULL,
          version      TEXT    NOT NULL,
          policy_text  TEXT    NOT NULL,
          is_mandatory INTEGER NOT NULL DEFAULT 1,
          created_at   INTEGER,
          synced_at    INTEGER NOT NULL
        )
      ''');
    }
    if (oldVersion < 11) {
      await db.execute('DROP TABLE IF EXISTS $rewardsTable');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $rewardsTable (
          id                 INTEGER PRIMARY KEY,
          reward_guid        TEXT    NOT NULL,
          reward_name        TEXT    NOT NULL,
          reward_description TEXT,
          cost_points        INTEGER NOT NULL DEFAULT 0,
          reward_category    TEXT,
          img_url            TEXT,
          synced_at          INTEGER NOT NULL
        )
      ''');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $myRedemptionsTable (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          redemption_guid TEXT    NOT NULL,
          reward_name     TEXT,
          access_link     TEXT,
          access_info     TEXT,
          points_spent    INTEGER NOT NULL,
          redeemed_at     INTEGER NOT NULL,
          synced_at       INTEGER NOT NULL
        )
      ''');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $myUnlockedTitlesTable (
          title     TEXT PRIMARY KEY,
          synced_at INTEGER NOT NULL
        )
      ''');
      try {
        await db.execute(
          'ALTER TABLE $currentUserTable ADD COLUMN active_title TEXT',
        );
      } catch (_) {}
    }
    if (oldVersion < 12) {
      try {
        await db.execute(
          'ALTER TABLE $currentUserTable ADD COLUMN registered_at INTEGER',
        );
      } catch (_) {}
    }
    if (oldVersion < 13) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $deletedNotificationsTable (
          id         INTEGER PRIMARY KEY,
          deleted_at INTEGER NOT NULL
        )
      ''');
    }
  }

  Future<void> _createAllTables(Database db) async {
    final sqls = [
      ..._syncSqls(),
      ..._referenceSqls(),
      ..._ownUserSqls(),
      ..._offlineWriteSqls(),
    ];
    final batch = db.batch();
    for (final sql in sqls) {
      batch.execute(sql);
    }
    await batch.commit(noResult: true);
  }

  // ── Sync metadata ─────────────────────────────────────────────────────────

  List<String> _syncSqls() => [
    '''
      CREATE TABLE IF NOT EXISTS $syncMetadataTable (
        update_code INTEGER PRIMARY KEY,
        synced_at   TEXT    NOT NULL
      )
    ''',
  ];

  // ── Reference tables ──────────────────────────────────────────────────────

  List<String> _referenceSqls() => [
    '''
      CREATE TABLE IF NOT EXISTS $locationsTable (
        id        INTEGER PRIMARY KEY,
        name      TEXT    NOT NULL,
        synced_at INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $languagesTable (
        id        INTEGER PRIMARY KEY,
        code      TEXT    NOT NULL,
        name      TEXT    NOT NULL,
        synced_at INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $areasTable (
        id              INTEGER PRIMARY KEY,
        service_line_id INTEGER,
        name            TEXT    NOT NULL,
        slug            TEXT,
        description     TEXT,
        img_url         TEXT,
        synced_at       INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $serviceLinesTable (
        id               INTEGER PRIMARY KEY,
        learning_path_id INTEGER,
        name             TEXT    NOT NULL,
        slug             TEXT,
        description      TEXT,
        img_url          TEXT,
        synced_at        INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $learningPathsTable (
        id          INTEGER PRIMARY KEY,
        title       TEXT    NOT NULL,
        slug        TEXT,
        description TEXT,
        img_url     TEXT,
        synced_at   INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $stageCodesTable (
        id        INTEGER PRIMARY KEY,
        code      TEXT    NOT NULL,
        synced_at INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $progressionStagesTable (
        id            INTEGER PRIMARY KEY,
        area_id       INTEGER NOT NULL,
        stage_code_id INTEGER NOT NULL,
        title         TEXT    NOT NULL,
        sequence      INTEGER,
        description   TEXT,
        synced_at     INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $badgesTable (
        id                   INTEGER PRIMARY KEY,
        slug                 TEXT    NOT NULL,
        title                TEXT    NOT NULL,
        badge_type           TEXT    NOT NULL,
        points               INTEGER NOT NULL DEFAULT 0,
        expiration_days      INTEGER,
        estimated_time       TEXT,
        description          TEXT,
        img_url              TEXT,
        area_id              INTEGER NOT NULL,
        area_name            TEXT    NOT NULL DEFAULT '',
        stage_code           TEXT    NOT NULL DEFAULT '',
        service_line_id      INTEGER NOT NULL,
        learning_path_id     INTEGER NOT NULL,
        progression_stage_id INTEGER NOT NULL,
        created_at           INTEGER,
        synced_at            INTEGER NOT NULL
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_badges_cache_area ON $badgesTable (area_id)',
    'CREATE INDEX IF NOT EXISTS idx_badges_cache_sl ON $badgesTable (service_line_id)',
    '''
      CREATE TABLE IF NOT EXISTS $badgeRequirementsTable (
        id          INTEGER PRIMARY KEY,
        badge_id    INTEGER NOT NULL,
        title       TEXT    NOT NULL,
        sequence    INTEGER,
        description TEXT    NOT NULL,
        img_url     TEXT,
        points      INTEGER NOT NULL DEFAULT 0,
        synced_at   INTEGER NOT NULL
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_req_cache_badge ON $badgeRequirementsTable (badge_id)',
    '''
      CREATE TABLE IF NOT EXISTS $skillsTable (
        id          INTEGER PRIMARY KEY,
        badge_id    INTEGER,
        name        TEXT    NOT NULL,
        description TEXT,
        synced_at   INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $rewardsTable (
        id                 INTEGER PRIMARY KEY,
        reward_guid        TEXT    NOT NULL,
        reward_name        TEXT    NOT NULL,
        reward_description TEXT,
        cost_points        INTEGER NOT NULL DEFAULT 0,
        reward_category    TEXT,
        img_url            TEXT,
        synced_at          INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $announcementsTable (
        id        INTEGER PRIMARY KEY,
        title     TEXT    NOT NULL,
        message   TEXT    NOT NULL,
        starts_at INTEGER,
        ends_at   INTEGER,
        type      TEXT,
        is_global INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        synced_at INTEGER NOT NULL
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_ann_active ON $announcementsTable (is_active)',
    '''
      CREATE TABLE IF NOT EXISTS $gdprPoliciesTable (
        policy_id    INTEGER PRIMARY KEY,
        policy_type  TEXT    NOT NULL,
        version      TEXT    NOT NULL,
        policy_text  TEXT    NOT NULL,
        is_mandatory INTEGER NOT NULL DEFAULT 1,
        created_at   INTEGER,
        synced_at    INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $translationCacheTable (
        source_key  TEXT    NOT NULL,
        target_lang TEXT    NOT NULL,
        translated  TEXT    NOT NULL,
        cached_at   INTEGER NOT NULL,
        PRIMARY KEY (source_key, target_lang)
      )
    ''',
  ];

  // ── Own-user tables ───────────────────────────────────────────────────────

  List<String> _ownUserSqls() => [
    // Single-row table for the logged-in consultant.
    // user_id is the consultant's own ID — safe to store for internal queries.
    '''
      CREATE TABLE IF NOT EXISTS $currentUserTable (
        user_id           INTEGER PRIMARY KEY,
        full_name         TEXT    NOT NULL,
        username          TEXT    NOT NULL,
        email_address     TEXT    NOT NULL,
        profile_img_url   TEXT,
        preferred_lang_id INTEGER NOT NULL DEFAULT 1,
        location_id       INTEGER,
        biography         TEXT,
        gdpr_accepted     INTEGER NOT NULL DEFAULT 0,
        total_points      INTEGER NOT NULL DEFAULT 0,
        active_title      TEXT,
        registered_at     INTEGER,
        synced_at         INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $notificationsTable (
        id                 INTEGER PRIMARY KEY,
        definition_id      INTEGER NOT NULL,
        payload            TEXT,
        url                TEXT,
        notification_type  TEXT    NOT NULL DEFAULT 'SYSTEM',
        is_read            INTEGER NOT NULL DEFAULT 0,
        sent_at            INTEGER NOT NULL,
        synced_at          INTEGER NOT NULL
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_notif_unread ON $notificationsTable (is_read)',
    'CREATE INDEX IF NOT EXISTS idx_notif_sent ON $notificationsTable (sent_at)',
    '''
      CREATE TABLE IF NOT EXISTS $deletedNotificationsTable (
        id         INTEGER PRIMARY KEY,
        deleted_at INTEGER NOT NULL
      )
    ''',
    // Own awarded badges only — no other user's ID is stored.
    '''
      CREATE TABLE IF NOT EXISTS $awardedBadgesTable (
        id                INTEGER PRIMARY KEY,
        application_id    INTEGER NOT NULL,
        application_guid  TEXT,
        badge_id          INTEGER NOT NULL,
        awarded_at        INTEGER NOT NULL,
        expiration_at     INTEGER,
        points_snapshot   INTEGER,
        verification_link TEXT,
        is_published      INTEGER NOT NULL DEFAULT 0,
        is_featured       INTEGER NOT NULL DEFAULT 0,
        display_order     INTEGER,
        synced_at         INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $pointsHistoryTable (
        id             INTEGER PRIMARY KEY,
        requirement_id INTEGER,
        badge_id       INTEGER,
        points_delta   INTEGER NOT NULL,
        justification  TEXT,
        synced_at      INTEGER NOT NULL
      )
    ''',
    // Reviewer's user_id from application_validation_logs is intentionally
    // omitted — only the role (validator_function) and action are cached.
    '''
      CREATE TABLE IF NOT EXISTS $validationLogsTable (
        id                 INTEGER PRIMARY KEY,
        application_id     INTEGER NOT NULL,
        validator_function TEXT    NOT NULL,
        validator_action   TEXT    NOT NULL,
        comments           TEXT,
        validated_at       INTEGER NOT NULL,
        synced_at          INTEGER NOT NULL
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_vlog_app ON $validationLogsTable (application_id)',
    '''
      CREATE TABLE IF NOT EXISTS $myRedemptionsTable (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        redemption_guid TEXT    NOT NULL,
        reward_name     TEXT,
        access_link     TEXT,
        access_info     TEXT,
        points_spent    INTEGER NOT NULL,
        redeemed_at     INTEGER NOT NULL,
        synced_at       INTEGER NOT NULL
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $myUnlockedTitlesTable (
        title     TEXT PRIMARY KEY,
        synced_at INTEGER NOT NULL
      )
    ''',
  ];

  // ── Offline-write tables ──────────────────────────────────────────────────

  List<String> _offlineWriteSqls() => [
    // local_id is the device PK; server_id is null until pushed successfully.
    '''
      CREATE TABLE IF NOT EXISTS $myApplicationsTable (
        local_id         INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id        INTEGER,
        badge_id         INTEGER NOT NULL,
        application_guid TEXT    NOT NULL,
        state            TEXT    NOT NULL DEFAULT 'Open',
        reviewer_notes   TEXT,
        opened_at        INTEGER NOT NULL,
        submitted_at     INTEGER,
        closed_at        INTEGER,
        synced_at        INTEGER,
        pending_sync     INTEGER NOT NULL DEFAULT 1
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_myapps_badge ON $myApplicationsTable (badge_id)',
    'CREATE INDEX IF NOT EXISTS idx_myapps_pending ON $myApplicationsTable (pending_sync)',
    '''
      CREATE TABLE IF NOT EXISTS $myEvidencesTable (
        local_id             INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id            INTEGER,
        application_local_id INTEGER NOT NULL,
        requirement_id       INTEGER,
        file_url             TEXT    NOT NULL,
        title                TEXT,
        description          TEXT,
        file_type            TEXT,
        is_local_file        INTEGER NOT NULL DEFAULT 0,
        uploaded_at          INTEGER NOT NULL,
        synced_at            INTEGER,
        pending_sync         INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (application_local_id)
          REFERENCES $myApplicationsTable (local_id) ON DELETE CASCADE
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_myev_app ON $myEvidencesTable (application_local_id)',
    'CREATE INDEX IF NOT EXISTS idx_myev_pending ON $myEvidencesTable (pending_sync)',
    '''
      CREATE TABLE IF NOT EXISTS $myCertificatesTable (
        local_id             INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id            INTEGER,
        application_local_id INTEGER NOT NULL,
        title                TEXT    NOT NULL,
        issuing_entity       TEXT,
        issue_date           TEXT,
        file_url             TEXT,
        is_local_file        INTEGER NOT NULL DEFAULT 0,
        synced_at            INTEGER,
        pending_sync         INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (application_local_id)
          REFERENCES $myApplicationsTable (local_id) ON DELETE CASCADE
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_mycert_pending ON $myCertificatesTable (pending_sync)',
    '''
      CREATE TABLE IF NOT EXISTS $myGoalsTable (
        local_id             INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id            INTEGER,
        badge_id             INTEGER,
        application_local_id INTEGER,
        title                TEXT    NOT NULL,
        description          TEXT,
        start_date           INTEGER,
        end_date             INTEGER,
        reminder_at          INTEGER,
        synced_at            INTEGER,
        pending_sync         INTEGER NOT NULL DEFAULT 1
      )
    ''',
    'CREATE INDEX IF NOT EXISTS idx_mygoals_pending ON $myGoalsTable (pending_sync)',
    // Only FAVORITE interactions need local persistence.
    // VIEW and SHARE_LINKEDIN are fire-and-forget (pushed when online).
    '''
      CREATE TABLE IF NOT EXISTS $myFavoriteBadgesTable (
        badge_id     INTEGER PRIMARY KEY,
        favorited_at INTEGER NOT NULL,
        pending_sync INTEGER NOT NULL DEFAULT 1
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $mySelectedSkillsTable (
        skills_id    INTEGER PRIMARY KEY,
        pending_sync INTEGER NOT NULL DEFAULT 1
      )
    ''',
    '''
      CREATE TABLE IF NOT EXISTS $myAreasTable (
        area_id      INTEGER PRIMARY KEY,
        is_primary   INTEGER NOT NULL DEFAULT 1,
        pending_sync INTEGER NOT NULL DEFAULT 1
      )
    ''',
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // Convenience helpers
  // ──────────────────────────────────────────────────────────────────────────

  /// Wipes all tables that hold the logged-in consultant's data.
  /// Call on logout so the next user starts with a clean slate.
  Future<void> clearUserData() async {
    final db = await database;
    final batch = db.batch();
    for (final table in userOwnedTables) {
      batch.delete(table);
    }
    await batch.commit(noResult: true);
  }

  /// Returns true when there are locally created/modified rows not yet pushed.
  Future<bool> hasPendingSync() async {
    final db = await database;
    for (final table in offlineWriteTables) {
      final rows = await db.rawQuery(
        'SELECT COUNT(*) AS c FROM $table WHERE pending_sync = 1',
      );
      final count = rows.isNotEmpty ? (rows.first['c'] as int? ?? 0) : 0;
      if (count > 0) return true;
    }
    return false;
  }
}
