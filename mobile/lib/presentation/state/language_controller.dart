import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class LanguageController extends ChangeNotifier {
  LanguageController();

  String _languageCode = '1';

  String get languageCode => _languageCode;

  Locale get locale {
    switch (_languageCode) {
      case '2':
        return const Locale('en');
      case '3':
        return const Locale('es');
      case '4':
        return const Locale('fr');
      case '1':
      default:
        return const Locale('pt');
    }
  }

  Future<void> initialize() async {}

  Future<void> setLanguageCode(String code) async {
    if (_languageCode == code) {
      return;
    }

    _languageCode = code;
    notifyListeners();
  }

  String tr(String key) => key;

  static String languageName(String languageCode) {
    switch (languageCode) {
      case '2':
        return 'English';
      case '3':
        return 'Espanol';
      case '4':
        return 'Francais';
      case '1':
      default:
        return 'Portugues';
    }
  }
}

class LanguageScope extends InheritedNotifier<LanguageController> {
  const LanguageScope({
    super.key,
    required LanguageController controller,
    required super.child,
  }) : super(notifier: controller);

  static LanguageController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<LanguageScope>();
    assert(scope != null, 'LanguageScope not found in widget tree.');
    return scope!.notifier!;
  }
}
