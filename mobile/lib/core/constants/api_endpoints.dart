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

  // PUT /me/areas - replace the areas the consultant belongs to
  static const String updateMyAreas = '/api/me/areas';

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

  // GET /applications/:applicationGuid/evidences/:evidenceId/download
  static String downloadEvidence(String applicationGuid, int evidenceId) =>
      '/api/applications/$applicationGuid/evidences/$evidenceId/download';

  // POST /applications/:applicationId/submit
  static String submitApplication(String applicationId) =>
      '/api/applications/$applicationId/submit';

  // POST /applications/:applicationGuid/certificate
  static String getCertificate(String applicationGuid) =>
      '/api/applications/$applicationGuid/certificate';

  // POST /applications/:applicationGuid/resend-confirmation
  static String resendBadgeConfirmation(String applicationGuid) =>
      '/api/applications/$applicationGuid/resend-confirmation';

  // === GDPR ===
  // GET /gdpr/policies - all active policies
  static const String getGdprPolicies = '/api/gdpr/policies';

  // GET /gdpr/policies/latest/:type - latest active policy of a given type
  static String latestGdprPolicy(String type) =>
      '/api/gdpr/policies/latest/$type';

  // POST /gdpr/consent - record the user's consent/revocation for a policy
  static const String recordGdprConsent = '/api/gdpr/consent';

  // === Ranking ===
  // GET /ranking
  static const String getRanking = '/api/ranking';

  // === Gamification ===
  // POST /gamification/interactions - record interaction (VIEW, FAVORITE, SHARE_LINKEDIN)
  static const String trackInteraction = '/api/gamification/interactions';

  // GET /gamification/interactions - get user's interaction history
  static const String getInteractions = '/api/gamification/interactions';

  // === Gamification ===
  // GET /gamification/points - get consultant's total points + history
  static const String getPoints = '/api/gamification/points';

  // GET /gamification/consultant-stats - get comprehensive consultant stats
  static const String getConsultantStats = '/api/gamification/consultant-stats';

  // === Device Tokens (FCM push notifications) ===
  static const String registerDeviceToken =
      '/api/notifications/device-tokens';
  static const String unregisterDeviceToken =
      '/api/notifications/device-tokens/unregister';

  // === Sync-only endpoints (used by SyncService) ===
  static const String getLearningPaths = '/api/learning-paths';
  static const String getServiceLines = '/api/service-lines';
  static const String getLevels = '/api/levels';
  static const String getAnnouncements = '/api/announcements';
  static const String getNotifications = '/api/notifications';

  // GET /notifications/preferences - list the user's notification preferences.
  static const String notificationPreferences =
      '/api/notifications/preferences';

  // PUT /notifications/preferences/:definitionId - update one preference.
  static String updateNotificationPreference(int definitionId) =>
      '/api/notifications/preferences/$definitionId';
  static const String getEarnedBadges = '/api/gamification/earned-badges';

  // PATCH /gamification/earned-badges/:verificationLink/featured - toggle
  // whether an earned badge is shown on the public profile gallery.
  // The verification link may be a full URL; URI-encode it so the embedded
  // slashes do not fragment the path and Express can decode the param back.
  static String setBadgeFeatured(String verificationLink) =>
      '/api/gamification/earned-badges/${Uri.encodeComponent(verificationLink)}/featured';
  static const String getPointsHistory =
      '/api/statistics/consultant/points-history';
  static const String getTimeline =
      '/api/statistics/consultant/timeline';
  static const String getLearningPathProgress =
      '/api/statistics/consultant/learning-paths';

  // === Rewards Store ===
  static const String getRewards = '/api/rewards';
  static const String getRedemptions = '/api/rewards/redemptions';
  static String redeemReward(String guid) => '/api/rewards/$guid/redeem';
  static const String getTitles = '/api/rewards/titles';
  static const String setActiveTitle = '/api/rewards/active-title';
}
