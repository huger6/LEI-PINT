import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';

import '../../core/utils/badge_visuals.dart';
import '../../data/repositories/applications_repo.dart';
import '../../data/repositories/badge_repo.dart';
import '../../data/repositories/ranking_repo.dart';
import '../../data/repositories/statistics_repo.dart';
import '../../models/application_summary_model.dart';
import '../../models/badge_model.dart';
import '../../models/earned_badge_model.dart';
import '../../models/ranking_entry_model.dart';
import '../../models/user_model.dart';

class DashboardAreaMetric {
  DashboardAreaMetric({required this.label, required this.count});

  final String label;
  final int count;
}

class DashboardSubmission {
  DashboardSubmission({
    required this.badge,
    required this.status,
    required this.statusColor,
    required this.timestamp,
  });

  final BadgeModel badge;
  final String status;
  final Color statusColor;
  final String timestamp;
}

class MonthBadgeCount {
  MonthBadgeCount({required this.year, required this.month, required this.count});

  final int year;
  final int month;
  final int count;
}

class DashboardStore extends ChangeNotifier {
  DashboardStore(
    this._badgeRepository,
    this._applicationsRepository,
    this._rankingRepository,
    this._statisticsRepository,
  );

  final BadgeRepository _badgeRepository;
  final ApplicationsRepository _applicationsRepository;
  final RankingRepository _rankingRepository;
  final StatisticsRepository _statisticsRepository;

  bool _isLoading = false;
  String? _errorMessage;
  List<BadgeModel> _recommendedBadges = [];
  List<DashboardSubmission> _recentSubmissions = [];
  List<DashboardAreaMetric> _areaMetrics = [];
  int _totalPoints = 0;
  int _completedBadges = 0;
  int _totalApplications = 0;
  int _growthPercent = 0;
  String _selectedMonth = '-';
  List<String> _recentMonths = [];
  int _topPercent = 0;
  List<Map<String, dynamic>> _timeline = [];
  List<Map<String, dynamic>> _lpProgress = [];
  List<Map<String, dynamic>> _pointsHistory = [];
  List<MonthBadgeCount> _monthlyBadgeCounts = [];

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<BadgeModel> get recommendedBadges => _recommendedBadges;
  List<DashboardSubmission> get recentSubmissions => _recentSubmissions;
  List<DashboardAreaMetric> get areaMetrics => _areaMetrics;
  int get totalPoints => _totalPoints;
  int get completedBadges => _completedBadges;
  int get totalApplications => _totalApplications;
  int get growthPercent => _growthPercent;
  String get selectedMonth => _selectedMonth;
  List<String> get recentMonths => _recentMonths;
  int get topPercent => _topPercent;
  List<Map<String, dynamic>> get timeline => _timeline;
  List<Map<String, dynamic>> get lpProgress => _lpProgress;
  List<Map<String, dynamic>> get pointsHistory => _pointsHistory;
  List<MonthBadgeCount> get monthlyBadgeCounts => _monthlyBadgeCounts;

  Future<void> loadDashboard(UserModel? currentUser) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final badgesFuture = _badgeRepository.getBadges().catchError((_) => <BadgeModel>[]);
      final appsFuture = _applicationsRepository.getApplications(limit: 50).catchError((_) => <ApplicationSummaryModel>[]);
      final rankingFuture = _rankingRepository.getRanking(limit: 100).catchError((_) => <RankingEntryModel>[]);

      final results = await Future.wait([badgesFuture, appsFuture, rankingFuture]);

      final badges = results[0] as List<BadgeModel>;
      final applications = results[1] as List<ApplicationSummaryModel>;
      final ranking = results[2] as List<RankingEntryModel>;

      List<EarnedBadge> earnedBadges = [];
      try {
        earnedBadges = await _badgeRepository.getEarnedBadges();
      } catch (_) {
        earnedBadges = await _badgeRepository.getEarnedBadgesLocal();
      }

      _recommendedBadges = _buildRecommendedBadges(badges, currentUser);
      _recentSubmissions = _buildSubmissions(applications, badges);
      _areaMetrics = _buildAreaMetricsFromEarned(earnedBadges);

      _completedBadges = earnedBadges.length;

      _totalApplications = applications.length;
      _monthlyBadgeCounts = _buildMonthlyBadgeCounts(applications);
      _growthPercent = _totalApplications == 0
          ? 0
          : ((_completedBadges / totalApplications) * 100).round();

      _recentMonths = _extractRecentMonths(applications);
      _selectedMonth = _recentMonths.isNotEmpty ? _recentMonths[2] : '-';

      _totalPoints = _extractUserPoints(currentUser, ranking);
      _topPercent = _extractTopPercent(currentUser, ranking);

      final statsResults = await Future.wait([
        _statisticsRepository.getTimeline(),
        _statisticsRepository.getLearningPathProgress(),
        _statisticsRepository.getPointsHistory(limit: 200),
      ]);
      _timeline = statsResults[0] as List<Map<String, dynamic>>;
      _lpProgress = statsResults[1] as List<Map<String, dynamic>>;
      final phResult = statsResults[2] as Map<String, dynamic>;
      final rawHistory = phResult['history'] as List? ?? [];
      _pointsHistory = rawHistory
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      if (_totalPoints == 0) {
        final statsPoints = phResult['totalPoints'];
        if (statsPoints is int && statsPoints > 0) {
          _totalPoints = statsPoints;
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<DashboardSubmission> _buildSubmissions(
    List<ApplicationSummaryModel> applications,
    List<BadgeModel> badges,
  ) {
    final sorted = [...applications]
      ..sort((a, b) {
        final aDate = a.latestDate ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bDate = b.latestDate ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bDate.compareTo(aDate);
      });

    return sorted
        .take(3)
        .map((app) {
          final badge = _resolveBadge(app, badges);
          return DashboardSubmission(
            badge: badge,
            status: app.applicationState,
            statusColor: BadgeVisuals.statusColor(app.applicationState),
            timestamp: _formatRelative(app.latestDate),
          );
        })
        .toList(growable: false);
  }

  BadgeModel _resolveBadge(
    ApplicationSummaryModel app,
    List<BadgeModel> badges,
  ) {
    final fromApp = app.badge;
    if (fromApp == null) {
      return BadgeModel.empty(title: 'Badge');
    }

    final exact = badges.where((item) => item.slug == fromApp.slug).toList();
    if (exact.isNotEmpty) {
      return exact.first;
    }

    return fromApp;
  }

  List<BadgeModel> _buildRecommendedBadges(
    List<BadgeModel> badges,
    UserModel? currentUser,
  ) {
    if (badges.isEmpty) return const [];

    final userAreas = currentUser?.areas ?? [];
    final primaryAreaName = userAreas
        .where((a) => a.isPrimary)
        .map((a) => a.name.toLowerCase())
        .firstOrNull;
    final otherAreaNames = userAreas
        .where((a) => !a.isPrimary)
        .map((a) => a.name.toLowerCase())
        .toSet();

    if (primaryAreaName == null && otherAreaNames.isEmpty) {
      return badges.take(5).toList(growable: false);
    }

    final sorted = List<BadgeModel>.from(badges);
    sorted.sort((a, b) {
      final aCat = a.category.toLowerCase();
      final bCat = b.category.toLowerCase();

      int aPriority = 2;
      int bPriority = 2;

      if (primaryAreaName != null && aCat == primaryAreaName) {
        aPriority = 0;
      } else if (otherAreaNames.contains(aCat)) {
        aPriority = 1;
      }

      if (primaryAreaName != null && bCat == primaryAreaName) {
        bPriority = 0;
      } else if (otherAreaNames.contains(bCat)) {
        bPriority = 1;
      }

      return aPriority.compareTo(bPriority);
    });

    return sorted.take(5).toList(growable: false);
  }

  List<DashboardAreaMetric> _buildAreaMetricsFromEarned(
    List<EarnedBadge> earned,
  ) {
    final grouped = <String, int>{};
    for (final e in earned) {
      final key = e.badge.category.trim().isEmpty
          ? 'Sem categoria'
          : e.badge.category;
      grouped[key] = (grouped[key] ?? 0) + 1;
    }

    final entries = grouped.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return entries
        .map(
          (entry) => DashboardAreaMetric(label: entry.key, count: entry.value),
        )
        .toList(growable: false);
  }

  List<String> _extractRecentMonths(
    List<ApplicationSummaryModel> applications,
  ) {
    final months = <String>{};
    for (final app in applications) {
      final date = app.latestDate;
      if (date == null) {
        continue;
      }
      months.add('${date.year}-${date.month.toString().padLeft(2, '0')}');
    }

    final sorted = months.toList()..sort();
    if (sorted.length >= 5) {
      return sorted.sublist(sorted.length - 5);
    }

    if (sorted.isEmpty) {
      final now = DateTime.now();
      return List.generate(5, (index) {
        final date = DateTime(now.year, now.month - (4 - index));
        return '${date.year}-${date.month.toString().padLeft(2, '0')}';
      });
    }

    while (sorted.length < 5) {
      sorted.insert(0, sorted.first);
    }

    return sorted;
  }

  int _extractUserPoints(UserModel? user, List<RankingEntryModel> ranking) {
    if (user == null) {
      return 0;
    }

    for (final entry in ranking) {
      if (entry.username == user.username) {
        return entry.totalPoints;
      }
    }

    return 0;
  }

  int _extractTopPercent(UserModel? user, List<RankingEntryModel> ranking) {
    if (user == null || ranking.isEmpty) {
      return 0;
    }

    final index =
        ranking.indexWhere((entry) => entry.username == user.username);
    if (index < 0) {
      return 0;
    }

    return (((index + 1) / ranking.length) * 100).ceil();
  }

  List<MonthBadgeCount> _buildMonthlyBadgeCounts(
    List<ApplicationSummaryModel> applications,
  ) {
    final now = DateTime.now();
    final months = List.generate(5, (i) {
      return DateTime(now.year, now.month - (4 - i));
    });

    final accepted = applications.where((app) {
      final state = app.applicationState.toLowerCase();
      return state.contains('accepted') ||
          state.contains('approved') ||
          state.contains('aprov');
    }).toList();

    return months.map((month) {
      final count = accepted.where((app) {
        final date = app.latestDate;
        if (date == null) return false;
        return date.year == month.year && date.month == month.month;
      }).length;
      return MonthBadgeCount(year: month.year, month: month.month, count: count);
    }).toList();
  }

  String _formatRelative(DateTime? date) {
    if (date == null) {
      return '-';
    }

    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours}h';
    }

    return '${diff.inDays}d';
  }
}
