import 'package:shared_preferences/shared_preferences.dart';

class Milestone {
  const Milestone({
    required this.key,
    required this.badgeCount,
    required this.titleKey,
    required this.descriptionKey,
    required this.icon,
  });

  final String key;
  final int badgeCount;
  final String titleKey;
  final String descriptionKey;
  final String icon;
}

const List<Milestone> milestones = [
  Milestone(
    key: 'first_badge',
    badgeCount: 1,
    titleKey: 'celebrationFirstBadgeTitle',
    descriptionKey: 'celebrationFirstBadgeDesc',
    icon: 'star',
  ),
  Milestone(
    key: '3_badges',
    badgeCount: 3,
    titleKey: 'celebration3BadgesTitle',
    descriptionKey: 'celebration3BadgesDesc',
    icon: 'fire',
  ),
  Milestone(
    key: '5_badges',
    badgeCount: 5,
    titleKey: 'celebration5BadgesTitle',
    descriptionKey: 'celebration5BadgesDesc',
    icon: 'rocket',
  ),
  Milestone(
    key: '10_badges',
    badgeCount: 10,
    titleKey: 'celebration10BadgesTitle',
    descriptionKey: 'celebration10BadgesDesc',
    icon: 'trophy',
  ),
  Milestone(
    key: '20_badges',
    badgeCount: 20,
    titleKey: 'celebration20BadgesTitle',
    descriptionKey: 'celebration20BadgesDesc',
    icon: 'medal',
  ),
  Milestone(
    key: '35_badges',
    badgeCount: 35,
    titleKey: 'celebration35BadgesTitle',
    descriptionKey: 'celebration35BadgesDesc',
    icon: 'trophy',
  ),
  Milestone(
    key: '50_badges',
    badgeCount: 50,
    titleKey: 'celebration50BadgesTitle',
    descriptionKey: 'celebration50BadgesDesc',
    icon: 'crown',
  ),
];

class CelebrationService {
  static const _prefix = 'celebration_shown_';

  Future<Milestone?> checkForNewMilestone(int earnedBadgeCount) async {
    if (earnedBadgeCount <= 0) return null;

    final prefs = await SharedPreferences.getInstance();

    for (final milestone in milestones) {
      if (earnedBadgeCount >= milestone.badgeCount) {
        final alreadyShown = prefs.getBool('$_prefix${milestone.key}') ?? false;
        if (!alreadyShown) {
          return milestone;
        }
      }
    }

    return null;
  }

  Future<void> markMilestoneShown(Milestone milestone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('$_prefix${milestone.key}', true);
  }

  Future<void> resetAll() async {
    final prefs = await SharedPreferences.getInstance();
    for (final milestone in milestones) {
      await prefs.remove('$_prefix${milestone.key}');
    }
  }
}
