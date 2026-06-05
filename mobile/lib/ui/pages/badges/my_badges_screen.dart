import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/local/current_user_dao.dart';
import '../../../data/repositories/applications_repo.dart';
import '../../../data/repositories/badge_repo.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../../models/earned_badge_model.dart';
import '../../../injection_container.dart';
import '../../widgets/badges/download_confirmation_sheet.dart';
import '../../widgets/badges/rgpd_consent_sheet.dart';
import '../../widgets/badges/share_badge_sheet.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/badges/my_badges_widgets.dart';
import '../applications/application_detail_screen.dart';

class MyBadgesScreen extends StatefulWidget {
  const MyBadgesScreen({super.key});

  @override
  State<MyBadgesScreen> createState() => _MyBadgesScreenState();
}

class _MyBadgesScreenState extends State<MyBadgesScreen> {
  late final TextEditingController _badgesSearchController;
  late final TextEditingController _applicationsSearchController;

  bool _isLoadingApplications = true;
  String? _applicationsError;
  List<ApplicationSummaryModel> _applications = const [];
  ApplicationFilter _selectedFilter = ApplicationFilter.all;

  bool _localGdprAccepted = false;

  @override
  void initState() {
    super.initState();
    _badgesSearchController = TextEditingController();
    _applicationsSearchController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadScreenData();
    });
  }

  @override
  void dispose() {
    _badgesSearchController.dispose();
    _applicationsSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadScreenData() async {
    final badgeStore = context.read<BadgeStore>();
    final applicationsRepo = context.read<ApplicationsRepository>();

    // Load the catalog first so earned badges and applications can resolve
    // their area / points / progression-stage against it.
    await badgeStore.loadBadges(forceRefresh: true);
    await Future.wait([
      badgeStore.loadEarnedBadges(forceRefresh: true),
      badgeStore.loadFavorites(),
    ]);

    final userDao = getIt<CurrentUserDao>();
    final user = await userDao.get();
    if (mounted) {
      setState(() {
        _localGdprAccepted = user?.gdprAccepted ?? false;
      });
    }

    setState(() {
      _isLoadingApplications = true;
      _applicationsError = null;
    });

    try {
      // Pull every request the consultant has ever submitted (all states).
      final applications = await applicationsRepo.getApplications(limit: 200);
      if (!mounted) {
        return;
      }

      setState(() {
        _applications = applications;
      });
    } catch (e) {
      if (!mounted) {
        return;
      }

      setState(() {
        _applicationsError = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingApplications = false;
        });
      }
    }
  }

  Future<void> _handleShare(EarnedBadge earned) async {
    if (!_localGdprAccepted) {
      final accepted = await showRgpdConsentSheet(context);
      if (!accepted || !mounted) return;

      setState(() {
        _localGdprAccepted = true;
      });

      try {
        final badgeRepo = context.read<BadgeRepository>();
        await badgeRepo.acceptShareGdpr();
      } catch (_) {}
    }

    if (!mounted) return;

    final verificationBaseUrl =
        dotenv.env['FRONTEND_URL']?.trim() ?? 'https://softinsa.pt';

    final shared = await showShareBadgeSheet(
      context,
      badge: earned.badge,
      award: earned.award,
      verificationBaseUrl: verificationBaseUrl,
    );

    if (shared && mounted) {
      try {
        final badgeRepo = context.read<BadgeRepository>();
        await badgeRepo.shareBadge(earned.badge.id);
      } catch (_) {}

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(LanguageScope.of(context).tr('badgeSharedSuccess')),
            backgroundColor: const Color(0xFF59C13E),
          ),
        );
      }
    }
  }

  Future<void> _handleCardTap(EarnedBadge earned) async {
    final award = earned.award;
    final link = award.verificationLink;

    if (link == null || link.isEmpty) return;

    final verificationBaseUrl =
        dotenv.env['FRONTEND_URL']?.trim() ?? 'https://softinsa.pt';

    final fullUrl = link.startsWith('http')
        ? link
        : '$verificationBaseUrl/verify/$link';

    final uri = Uri.tryParse(fullUrl);
    if (uri == null) return;

    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(LanguageScope.of(context).tr('couldNotOpenLink')),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _handleDownload(EarnedBadge earned) async {
    final badge = earned.badge;
    final award = earned.award;
    final applicationGuid = award.applicationGuid;

    if (applicationGuid == null || applicationGuid.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            LanguageScope.of(context).tr('couldNotIdentifyApplication'),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final dateStr =
        '${award.awardedAt.day.toString().padLeft(2, '0')}-'
        '${award.awardedAt.month.toString().padLeft(2, '0')}-'
        '${award.awardedAt.year}';

    final safeTitle = badge.title
        .replaceAll(RegExp(r'[^\w\s-]'), '')
        .replaceAll(RegExp(r'\s+'), '_');

    final fileName = 'Comprovativo_${safeTitle}_$dateStr.pdf';

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(LanguageScope.of(context).tr('downloadingProof')),
        duration: const Duration(seconds: 30),
        backgroundColor: const Color(0xFF3D5A80),
      ),
    );

    try {
      final badgeRepo = context.read<BadgeRepository>();
      final filePath = await badgeRepo.downloadCertificate(
        applicationGuid: applicationGuid,
        fileName: fileName,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();

      await showDownloadConfirmationSheet(
        context,
        fileName: fileName,
        badgeTitle: badge.title,
        filePath: filePath,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();

      final errorMsg = e.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            errorMsg.isNotEmpty
                ? errorMsg
                : LanguageScope.of(context).tr('proofDownloadError'),
          ),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final badgeStore = context.watch<BadgeStore>();
    final tr = LanguageScope.of(context);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        body: SafeArea(
          child: Column(
            children: [
              Container(
                color: Colors.grey[100],
                child: TabBar(
                  tabs: [
                    Tab(text: tr.tr('tabEarnedBadges')),
                    Tab(text: tr.tr('tabApplications')),
                  ],
                  labelColor: const Color(0xFF1E2932),
                  unselectedLabelColor: const Color(0xFF1E2932),
                  labelStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                  indicator: const UnderlineTabIndicator(
                    borderSide: BorderSide(
                      color: Color(0xFF62B7E4),
                      width: 3.2,
                    ),
                    insets: EdgeInsets.symmetric(horizontal: 10),
                  ),
                  dividerColor: const Color(0xFFDCE3E9),
                ),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildBadgesTab(badgeStore),
                    _buildApplicationsTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.badges),
      ),
    );
  }

  Widget _buildBadgesTab(BadgeStore badgeStore) {
    final tr = LanguageScope.of(context);
    final query = _badgesSearchController.text.trim().toLowerCase();
    final earned = badgeStore.earnedBadges
        .where((e) => e.badge.title.toLowerCase().contains(query))
        .toList(growable: false);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Column(
        children: [
          BadgesSearchBar(
            controller: _badgesSearchController,
            hintText: tr.tr('myBadgesSearchHint'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          if (badgeStore.isLoadingEarned && badgeStore.earnedBadges.isEmpty)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (earned.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.emoji_events_outlined,
                      size: 56,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      query.isNotEmpty
                          ? tr.tr('noBadgesFound')
                          : tr.tr('noEarnedBadgesYet'),
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                itemCount: earned.length,
                itemBuilder: (context, index) {
                  final item = earned[index];

                  return AchievedBadgeCard(
                    badge: item.badge,
                    completionDate: item.award.awardedAt,
                    fallbackLevel: item.badge.level,
                    fallbackPoints: item.award.pointsSnapshot ?? 0,
                    onTap: () => _handleCardTap(item),
                    onShare: () => _handleShare(item),
                    onDownload: () => _handleDownload(item),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  /// The applications list endpoint returns the badge without its area,
  /// points or progression-stage, so resolve those from the local catalog by
  /// slug (or id), falling back to whatever the application carried.
  BadgeModel _resolveApplicationBadge(
    ApplicationSummaryModel application,
    List<BadgeModel> catalog,
  ) {
    final fromApp = application.badge;
    if (fromApp == null) {
      return BadgeModel.empty(title: 'Badge');
    }

    for (final badge in catalog) {
      if (fromApp.slug.isNotEmpty && badge.slug == fromApp.slug) {
        return badge;
      }
      if (fromApp.id != 0 && badge.id == fromApp.id) {
        return badge;
      }
    }

    return fromApp;
  }

  Widget _buildApplicationsTab() {
    final tr = LanguageScope.of(context);
    final catalog = context.read<BadgeStore>().badges;
    final query = _applicationsSearchController.text.trim().toLowerCase();

    final filtered = _applications
        .where((application) {
          if (!_matchesFilter(application)) {
            return false;
          }

          if (query.isEmpty) {
            return true;
          }

          final badgeTitle = application.badge?.title.toLowerCase() ?? '';
          return badgeTitle.contains(query) ||
              application.applicationState.toLowerCase().contains(query);
        })
        .toList(growable: false);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Column(
        children: [
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: ApplicationFilter.values.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final filter = ApplicationFilter.values[index];
                final selected = filter == _selectedFilter;
                return ChoiceChip(
                  label: Text(tr.tr(filter.labelKey)),
                  selected: selected,
                  onSelected: (_) {
                    setState(() {
                      _selectedFilter = filter;
                    });
                  },
                  side: BorderSide(
                    color: selected
                        ? const Color(0xFF66B6E6)
                        : const Color(0xFFC5D2DD),
                  ),
                  backgroundColor: Colors.white,
                  selectedColor: const Color(0xFFD8ECF9),
                  labelStyle: TextStyle(
                    color: const Color(0xFF24313D),
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          BadgesSearchBar(
            controller: _applicationsSearchController,
            hintText: tr.tr('applicationsSearchHint'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          if (_isLoadingApplications)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else
            Expanded(
              child: Column(
                children: [
                  if (_applicationsError != null)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF3D8),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFF1CD7A)),
                      ),
                      child: Text(
                        tr.tr('applicationsLoadFailedLocal'),
                        style: const TextStyle(
                          color: Color(0xFF695428),
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  if (filtered.isEmpty)
                    Expanded(
                      child: Center(
                        child: Text(
                          tr.tr('noApplicationsFound'),
                          style: TextStyle(
                            fontSize: 15,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final application = filtered[index];
                          final state = _stateOf(application.applicationState);
                          final badge =
                              _resolveApplicationBadge(application, catalog);

                          return ApplicationCard(
                            badge: badge,
                            state: state,
                            date: _formatDate(application.latestDate),
                            updateText: _buildUpdateText(
                              state,
                              application.latestDate,
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ApplicationDetailScreen(
                                    application: application,
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  bool _matchesFilter(ApplicationSummaryModel application) {
    if (_selectedFilter == ApplicationFilter.all) {
      return true;
    }

    return _stateOf(application.applicationState).filter == _selectedFilter;
  }

  ApplicationStateVisual _stateOf(String status) {
    final tr = LanguageScope.of(context);
    final normalized = status.toLowerCase();

    if (normalized.contains('accepted') || normalized.contains('approved') || normalized.contains('aprov')) {
      return ApplicationStateVisual(
        label: tr.tr('stateApproved'),
        color: const Color(0xFF59C13E),
        filter: ApplicationFilter.approved,
      );
    }

    if (normalized.contains('reject') ||
        normalized.contains('rejeit') ||
        normalized.contains('devolv')) {
      return ApplicationStateVisual(
        label: tr.tr('stateRejected'),
        color: const Color(0xFFD94A2A),
        filter: ApplicationFilter.rejected,
      );
    }

    return ApplicationStateVisual(
      label: tr.tr('stateInValidation'),
      color: const Color(0xFFC9A625),
      filter: ApplicationFilter.inReview,
    );
  }

  String _buildUpdateText(ApplicationStateVisual state, DateTime? date) {
    if (state.filter == ApplicationFilter.approved) {
      return _approvedRelative(date);
    }

    final tr = LanguageScope.of(context);
    if (state.filter == ApplicationFilter.rejected) {
      return '${tr.tr('stateRejected')} ${_relativeLower(date)}';
    }

    return _relativeLower(date);
  }

  String _approvedRelative(DateTime? date) {
    final tr = LanguageScope.of(context);
    if (date == null) return tr.tr('stateApproved');

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateDay = DateTime(date.year, date.month, date.day);
    final days = today.difference(dateDay).inDays;

    if (days <= 0) return tr.tr('approvedToday');
    if (days == 1) return tr.tr('approvedOneDayAgo');
    return tr.tr('approvedDaysAgo').replaceAll('{days}', '$days');
  }

  String _formatDate(DateTime? date) {
    if (date == null) {
      return '-';
    }

    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    return '$day/$month/$year';
  }

  String _relativeLower(DateTime? date) {
    final tr = LanguageScope.of(context);
    if (date == null) {
      return tr.tr('shortTimeAgo');
    }

    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) {
      final minutes = diff.inMinutes <= 0 ? 1 : diff.inMinutes;
      return tr.tr('minutesAgo').replaceAll('{minutes}', '$minutes');
    }
    if (diff.inHours < 24) {
      final hours = diff.inHours;
      return tr.tr('hoursAgo').replaceAll('{hours}', '$hours');
    }

    final days = diff.inDays;
    return tr.tr('daysAgo').replaceAll('{days}', '$days');
  }
}
