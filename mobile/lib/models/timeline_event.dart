/// Kind of event shown in the evolution timeline. The widget layer maps each
/// type to an icon and theme color (no styling is stored on the model).
enum TimelineEventType {
  registration,
  badgeEarned,
  pointsGained,
}

/// A single entry in the consultant's evolution timeline (activity feed).
class TimelineEvent {
  const TimelineEvent({
    required this.type,
    required this.date,
    required this.title,
    this.subtitle,
    this.points,
  });

  final TimelineEventType type;
  final DateTime date;
  final String title;
  final String? subtitle;

  /// Points delta associated with the event, when applicable.
  final int? points;
}
