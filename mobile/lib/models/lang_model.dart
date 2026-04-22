class LanguageModel {
  final int id;
  final String code;
  final String name;

  LanguageModel({required this.id, required this.code, required this.name});

  factory LanguageModel.fromJson(Map<String, dynamic> json) {
    final id = _toInt(json['id'] ?? json['preferred_lang_id']);
    final normalizedCode = _normalizeCode(
      json['code'] ?? json['preferred_lang'],
      id,
    );

    return LanguageModel(
      id: id,
      code: normalizedCode,
      name: (json['name'] ?? json['preferred_lang_name'] ?? _friendlyName(id))
          .toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'code': code, 'name': name};
  }

  static int _toInt(dynamic value) {
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value.toString()) ?? 1;
  }

  static String _normalizeCode(dynamic rawCode, int fallbackId) {
    if (rawCode != null) {
      final value = rawCode.toString().trim().toLowerCase();
      if (value == '1' || value.startsWith('pt')) {
        return '1';
      }
      if (value == '2' || value.startsWith('en')) {
        return '2';
      }
      if (value == '3' || value.startsWith('es')) {
        return '3';
      }
      if (value == '4' || value.startsWith('fr')) {
        return '4';
      }
    }

    if (fallbackId >= 1 && fallbackId <= 4) {
      return fallbackId.toString();
    }

    return '1';
  }

  static String _friendlyName(int languageId) {
    switch (languageId) {
      case 2:
        return 'English';
      case 3:
        return 'Espanol';
      case 4:
        return 'Francais';
      case 1:
      default:
        return 'Portugues';
    }
  }
}
