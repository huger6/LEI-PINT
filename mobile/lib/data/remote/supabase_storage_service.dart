import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseStorageService {
  SupabaseStorageService(this._client);

  final SupabaseClient _client;

  static const String bucket = 'public-assets';
  static const String tempFolder = 'temp';

  Future<String> uploadProfileImageToTemp(File file) async {
    final extension = p.extension(file.path).toLowerCase();
    final safeExt = extension.isEmpty ? '.jpg' : extension;
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final fileName = 'profile_$timestamp$safeExt';
    final objectPath = '$tempFolder/$fileName';

    await _client.storage
        .from(bucket)
        .upload(
          objectPath,
          file,
          fileOptions: FileOptions(contentType: _contentTypeFor(safeExt)),
        );

    return _client.storage.from(bucket).getPublicUrl(objectPath);
  }

  Future<String> uploadFileToTemp(File file, {String prefix = 'evidence'}) async {
    final extension = p.extension(file.path).toLowerCase();
    final safeExt = extension.isEmpty ? '' : extension;
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final fileName = '${prefix}_$timestamp$safeExt';
    final objectPath = '$tempFolder/$fileName';

    await _client.storage
        .from(bucket)
        .upload(
          objectPath,
          file,
          fileOptions: FileOptions(contentType: _contentTypeFor(safeExt)),
        );

    return _client.storage.from(bucket).getPublicUrl(objectPath);
  }

  String? _contentTypeFor(String extension) {
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.pdf':
        return 'application/pdf';
      case '.doc':
        return 'application/msword';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }
}
