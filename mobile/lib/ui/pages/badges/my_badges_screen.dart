import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import '../../../data/local/current_user_dao.dart';
import '../../../data/repositories/applications_repo.dart';
import '../../../data/repositories/badge_repo.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../../models/earned_badge_model.dart';
import '../../../injection_container.dart';
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

    await Future.wait([
      badgeStore.loadBadges(),
      badgeStore.loadEarnedBadges(),
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
      final applications = await applicationsRepo.getApplications(limit: 60);
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
          const SnackBar(
            content: Text('Badge partilhado com sucesso!'),
            backgroundColor: Color(0xFF59C13E),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final badgeStore = context.watch<BadgeStore>();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: Colors.grey[100],
        body: SafeArea(
          child: Column(
            children: [
              Container(
                color: Colors.grey[100],
                child: const TabBar(
                  tabs: [
                    Tab(text: 'Badges Obtidos'),
                    Tab(text: 'Candidaturas'),
                  ],
                  labelColor: Color(0xFF1E2932),
                  unselectedLabelColor: Color(0xFF1E2932),
                  labelStyle: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                  unselectedLabelStyle: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                  indicator: UnderlineTabIndicator(
                    borderSide: BorderSide(
                      color: Color(0xFF62B7E4),
                      width: 3.2,
                    ),
                    insets: EdgeInsets.symmetric(horizontal: 10),
                  ),
                  dividerColor: Color(0xFFDCE3E9),
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
            hintText: 'Procure badges',
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
                          ? 'Nenhum badge encontrado.'
                          : 'Ainda não obteve nenhum badge.',
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
                    onShare: () => _handleShare(item),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildApplicationsTab() {
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
                  label: Text(filter.label),
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
            hintText: 'Procure candidaturas, badges',
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
                      child: const Text(
                        'Não foi possível carregar candidaturas. A mostrar dados locais.',
                        style: TextStyle(
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
                          'Nenhuma candidatura encontrada.',
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
                              application.badge ??
                              BadgeModel.empty(title: 'Badge');

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
    final normalized = status.toLowerCase();

    if (normalized.contains('accepted') || normalized.contains('approved') || normalized.contains('aprov')) {
      return const ApplicationStateVisual(
        label: 'Aprovado',
        color: Color(0xFF59C13E),
        filter: ApplicationFilter.approved,
      );
    }

    if (normalized.contains('reject') ||
        normalized.contains('rejeit') ||
        normalized.contains('devolv')) {
      return const ApplicationStateVisual(
        label: 'Rejeitado',
        color: Color(0xFFD94A2A),
        filter: ApplicationFilter.rejected,
      );
    }

    return const ApplicationStateVisual(
      label: 'Em validação',
      color: Color(0xFFC9A625),
      filter: ApplicationFilter.inReview,
    );
  }

  String _buildUpdateText(ApplicationStateVisual state, DateTime? date) {
    final relative = _relativeLower(date);

    if (state.filter == ApplicationFilter.approved) {
      return 'Aprovado pelo Talent Manager $relative';
    }

    if (state.filter == ApplicationFilter.rejected) {
      return 'Rejeitado pelo Service Line Leader $relative';
    }

    return relative;
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
    if (date == null) {
      return 'há pouco tempo';
    }

    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) {
      final minutes = diff.inMinutes <= 0 ? 1 : diff.inMinutes;
      return 'há $minutes minutos';
    }
    if (diff.inHours < 24) {
      final hours = diff.inHours;
      return 'há $hours horas';
    }

    final days = diff.inDays;
    return 'há $days dias';
  }
}
