abstract class SyncCodes {
  static const int userProfile = 7;
  static const int userSession = 8;
  static const int learningPaths = 9;
  static const int serviceLines = 10;
  static const int areas = 11;
  static const int progressionStages = 12;
  static const int stageCodes = 13;
  static const int badges = 14;
  static const int applications = 15;
  static const int evidences = 16;
  static const int awardedBadges = 17;
  static const int validationLogs = 18;
  static const int points = 19;
  static const int announcements = 20;
  static const int notifications = 21;
  static const int gdprPolicies = 22;

  static bool isRelevantForMobile(int code) => code >= 7 && code <= 22;
}
