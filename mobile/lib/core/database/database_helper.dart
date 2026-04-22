import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';

class LocalDatabase {
  static const _databaseName = 'badges_softinsa.db';
  static const _databaseVersion = 1;

  static const locationsTable = 'locations_cache';
  static const languagesTable = 'languages_cache';
  static const areasTable = 'areas_cache';

  Database? _database;

  Future<Database> get database async {
    if (_database != null) {
      return _database!;
    }

    _database = await _openDatabase();
    return _database!;
  }

  Future<Database> _openDatabase() async {
    final databasesPath = await getDatabasesPath();
    final dbPath = path.join(databasesPath, _databaseName);

    return openDatabase(dbPath, version: _databaseVersion, onCreate: _onCreate);
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $locationsTable (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        synced_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE $languagesTable (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        synced_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE $areasTable (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT,
        synced_at INTEGER NOT NULL
      )
    ''');
  }
}
