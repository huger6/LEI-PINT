class FormValidators {
  // Validação de email
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'O email é obrigatório';
    }
    
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    
    if (!emailRegex.hasMatch(value)) {
      return 'Por favor, insira um email válido';
    }
    
    return null;
  }

  // Validação de password
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'A password é obrigatória';
    }
    
    if (value.length < 6) {
      return 'A password deve ter pelo menos 6 caracteres';
    }
    
    return null;
  }

  // Validação de confirmação de password
  static String? validatePasswordConfirm(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Por favor, confirme a password';
    }
    
    if (value != password) {
      return 'As passwords não coincidem';
    }
    
    return null;
  }

  // Validação de nome
  static String? validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'O nome é obrigatório';
    }
    
    if (value.length < 2) {
      return 'O nome deve ter pelo menos 2 caracteres';
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
