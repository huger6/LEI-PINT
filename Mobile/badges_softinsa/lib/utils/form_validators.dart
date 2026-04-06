import 'app_strings.dart';

class FormValidators {
  static String _languageCode = AppStrings.defaultLanguageCode;

  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );
  static final RegExp _usernameRegex = RegExp(r'^[a-zA-Z0-9._]+$');

  static void setLanguageCode(String code) {
    _languageCode = AppStrings.supportedLanguageCodes.contains(code)
        ? code
        : AppStrings.defaultLanguageCode;
  }

  static String _t(String key) => AppStrings.translate(_languageCode, key);

  // Validação de email
  static String? validateEmail(String? value) {
    final sanitized = (value ?? '').replaceAll(RegExp(r'\s+'), '');

    if (sanitized.isEmpty) {
      return _t('emailRequired');
    }

    if (sanitized.length > 255) {
      return _t('emailMax');
    }

    if (!_emailRegex.hasMatch(sanitized)) {
      return _t('emailInvalid');
    }

    return null;
  }

  // Validação de password
  static String? validatePassword(String? value) {
    final password = value ?? '';

    if (password.isEmpty) {
      return _t('passwordRequired');
    }

    if (password.length < 8) {
      return _t('passwordMin');
    }

    if (password.length > 100) {
      return _t('passwordMax');
    }

    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      return _t('passwordUpper');
    }

    if (!RegExp(r'[a-z]').hasMatch(password)) {
      return _t('passwordLower');
    }

    if (!RegExp(r'[0-9]').hasMatch(password)) {
      return _t('passwordNumber');
    }

    if (!RegExp(r'[^a-zA-Z0-9]').hasMatch(password)) {
      return _t('passwordSpecial');
    }

    return null;
  }

  // Validação de confirmação de password
  static String? validatePasswordConfirm(String? value, String password) {
    if (value == null || value.isEmpty) {
      return _t('confirmPasswordRequired');
    }

    if (value != password) {
      return _t('passwordMismatch');
    }

    return null;
  }

  // Validação de nome
  static String? validateName(String? value) {
    final name = (value ?? '').trim();

    if (name.isEmpty) {
      return _t('nameRequired');
    }

    if (name.length < 2) {
      return _t('nameMin');
    }

    if (name.length > 255) {
      return _t('nameMax');
    }

    return null;
  }

  // Validação de username
  static String? validateUsername(String? value) {
    final username = (value ?? '').trim();

    if (username.isEmpty) {
      return _t('usernameRequired');
    }

    if (username.length < 3) {
      return _t('usernameMinChars');
    }

    if (username.length > 50) {
      return _t('usernameMax');
    }

    if (!_usernameRegex.hasMatch(username)) {
      return _t('usernameFormat');
    }

    return null;
  }

  // Validação de biografia (campo opcional)
  static String? validateBiography(String? value) {
    final biography = (value ?? '').trim();
    if (biography.isEmpty) {
      return null;
    }

    if (biography.length > 5000) {
      return _t('bioMaxChars');
    }

    final words = biography.split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
    if (words.length > 500) {
      return _t('bioMaxWords');
    }

    if (filter.check(biography)) {
      return _t('bioInappropriate');
    }

    return null;
  }

  // Validação de data de nascimento (obrigatória, mínimo 16 anos)
  static String? validateBirthdate(String? value) {
    final birthdateText = (value ?? '').trim();

    if (birthdateText.isEmpty) {
      return _t('birthdateRequired');
    }

    final dateRegex = RegExp(r'^\d{2}/\d{2}/\d{4}$');
    if (!dateRegex.hasMatch(birthdateText)) {
      return _t('birthdateInvalid');
    }

    final parts = birthdateText.split('/');
    final day = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);

    if (day == null || month == null || year == null) {
      return _t('birthdateInvalid');
    }

    DateTime birthdate;
    try {
      birthdate = DateTime(year, month, day);
    } catch (_) {
      return _t('birthdateInvalid');
    }

    if (birthdate.year != year ||
        birthdate.month != month ||
        birthdate.day != day) {
      return _t('birthdateInvalid');
    }

    final now = DateTime.now();
    var age = now.year - birthdate.year;
    final hasHadBirthdayThisYear =
        now.month > birthdate.month ||
        (now.month == birthdate.month && now.day >= birthdate.day);

    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }

    if (age < 16) {
      return _t('mustBe16');
    }

    return null;
  }

  // Validação genérica
  static String? validateRequired(String? value, String fieldName) {
    if (value == null || value.isEmpty) {
      return '$fieldName é obrigatório';
    }
    return null;
  }
}

class _SimpleContentFilter {
  final List<String> _blockedTerms = const ['palavrao1', 'palavrao2'];

  bool check(String val) {
    final lower = val.toLowerCase();
    return _blockedTerms.any((term) => lower.contains(term));
  }
}

final filter = _SimpleContentFilter();
