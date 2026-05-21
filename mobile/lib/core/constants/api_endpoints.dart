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

  // === Validation ===
  // GET /utils/check/email?value=... - check email availability
  static const String checkEmail = '/api/utils/check/email';

  // GET /utils/check/username?value=... - check username availability
  static const String checkUsername = '/api/utils/check/username';

  // POST /auth/validate-content - check for prohibited/profane content
  static const String validateContent = '/api/auth/validate-content';

  // === Profile ===
  // GET /me - get current user profile
  static const String getProfile = '/api/me';

  // PUT /me - update current user profile
  static const String updateProfile = '/api/me';

  // PATCH /me/language/:id - change preferred language
  static String changeLanguage(int languageId) =>
      '/api/me/language/$languageId';

  // === Locations ===
  // GET /locations
  static const String getLocations = '/api/locations';

  // === Languages ===
  // GET /languages
  static const String getLanguages = '/api/languages';

  // === Areas ===
  // GET /areas
  static const String getAreas = '/api/areas';

  // === Badges ===
  // GET /badges
  static const String getBadges = '/api/badges';

  // GET /badges/:badgeSlug
  static String badgeBySlug(String badgeSlug) => '/api/badges/$badgeSlug';

  // === Applications ===
  // GET /applications
  static const String getApplications = '/api/applications';

  // GET /applications/:applicationId
  static String applicationById(String applicationId) =>
      '/api/applications/$applicationId';

  // POST /applications/start
  static const String startApplication = '/api/applications/start';

  // POST /applications/:applicationGuid/upload-url
  static String getUploadUrl(String applicationGuid) =>
      '/api/applications/$applicationGuid/upload-url';

  // POST /applications/:applicationGuid/evidences
  static String upsertEvidence(String applicationGuid) =>
      '/api/applications/$applicationGuid/evidences';

  // POST /applications/:applicationId/submit
  static String submitApplication(String applicationId) =>
      '/api/applications/$applicationId/submit';

  // === Ranking ===
  // GET /ranking
  static const String getRanking = '/api/ranking';

  // === Gamification ===
  static const String shareBadge = '/api/gamification/share-badge';
  static const String acceptShareGdpr = '/api/me/accept-share-gdpr';

  // PATCH /gamification/earned-badges/:awardedBadgeId/gallery
  static String toggleBadgeGallery(int awardedBadgeId) =>
      '/api/gamification/earned-badges/$awardedBadgeId/gallery';

  // === Favorites ===
  // GET /gamification/favorites
  static const String getFavorites = '/api/gamification/favorites';

  // POST /gamification/favorites/:badgeId
  static String addFavorite(int badgeId) =>
      '/api/gamification/favorites/$badgeId';

  // DELETE /gamification/favorites/:badgeId
  static String removeFavorite(int badgeId) =>
      '/api/gamification/favorites/$badgeId';

  // === Sync-only endpoints (used by SyncService) ===
  static const String getLearningPaths = '/api/learning-paths';
  static const String getServiceLines = '/api/service-lines';
  static const String getLevels = '/api/levels';
  static const String getStageCodes = '/api/stage-codes';
  static const String getAnnouncements = '/api/announcements';
  static const String getNotifications = '/api/notifications';
  static const String getEarnedBadges = '/api/gamification/earned-badges';
  static const String getPointsHistory =
      '/api/statistics/consultant/points-history';
  static const String getTimeline =
      '/api/statistics/consultant/timeline';
  static const String getLearningPathProgress =
      '/api/statistics/consultant/learning-paths';
  static const String getValidationLogs = '/api/applications/validation-logs';
}
