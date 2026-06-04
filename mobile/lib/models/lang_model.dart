class LanguageModel {
  final int id;
  final String code;
  final String name;

  LanguageModel({required this.id, required this.code, required this.name});

  factory LanguageModel.fromJson(Map<String, dynamic> json) {
    // Accepts both the /api/languages shape (language_id/language_iso/
    // language_name), the /api/me lang shape (id/iso/name) and legacy keys.
    final id = _toInt(
      json['id'] ?? json['language_id'] ?? json['preferred_lang_id'],
    );
    final rawCode =
        json['code'] ?? json['language_iso'] ?? json['iso'] ?? json['preferred_lang'];
    final code = _normalizeToBcp(rawCode, id);

    return LanguageModel(
      id: id,
      code: code,
      name: (json['name'] ??
              json['language_name'] ??
              json['preferred_lang_name'] ??
              _friendlyName(code))
          .toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'code': code, 'name': name};
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 1;
  }

  static String _normalizeToBcp(dynamic rawCode, int fallbackId) {
    if (rawCode != null) {
      final value = rawCode.toString().trim().toLowerCase();
      if (value.contains('-')) return value.split('-').first;
      if (value.length >= 2 && RegExp(r'^[a-z]+$').hasMatch(value)) {
        return value;
      }
      final numId = int.tryParse(value);
      if (numId != null) return _codeFromId(numId);
    }
    return _codeFromId(fallbackId);
  }

  static String _codeFromId(int id) {
    switch (id) {
      case 2:
        return 'en';
      case 3:
        return 'es';
      default:
        return 'pt';
    }
  }

  static String _friendlyName(String code) {
    switch (code) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      case 'de':
        return 'Deutsch';
      case 'it':
        return 'Italiano';
      case 'pt':
      default:
        return 'Português';
    }
  }
}
