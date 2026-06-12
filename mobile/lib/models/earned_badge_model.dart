import 'badge_model.dart';
import 'awarded_badge_model.dart';

class EarnedBadge {
  final BadgeModel badge;
  final AwardedBadgeModel award;

  const EarnedBadge({required this.badge, required this.award});
}
