class ApiEndpoints {
  // === Authentication Endpoints ===
  static const String register = '/api/auth/register';
  static const String login = '/api/auth/login';
  static const String refresh = '/api/auth/refresh';
  static const String logout = '/api/auth/logout';
  static const String me = '/api/auth/me';
  static const String verifySession = '/api/auth/verify-session';

  // === Account Confirmation ===
  static const String confirmEmail = '/api/auth/confirm-email';
  static const String resendConfirmation = '/api/auth/resend-confirmation';

  // === Password Recovery ===
  static const String forgotPassword = '/api/auth/forgot-password';

  // Note: App needs to append '/$token' when calling this GET route
  static const String validateResetToken = '/api/auth/validate-reset-token';
  static const String resetPassword = '/api/auth/reset-password';

  // === Security ===
  static const String changePassword = '/api/auth/change-password';

  // === Locations ===
  // GET /locations
  static const String getLocations = '/api/locations';

  // === Languages ===
  // GET /languages
  static const String getLanguages = '/api/languages';

  // === Areas ===
  // GET /areas
  static const String getAreas = '/api/areas';
}
