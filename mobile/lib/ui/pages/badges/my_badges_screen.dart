import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/repositories/applications_repo.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../../presentation/state/badge_store.dart';
import '../../widgets/badges/badge_catalog.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/badges/my_badges_widgets.dart';

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

    await badgeStore.loadBadges();

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
    final sourceBadges = badgeStore.badges.isNotEmpty
        ? badgeStore.badges
        : BadgeCatalog.all;

    final badges = sourceBadges
        .where((badge) => badge.title.toLowerCase().contains(query))
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
          if (badgeStore.isLoading && badgeStore.badges.isEmpty)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else
            Expanded(
              child: ListView.builder(
                itemCount: badges.length,
                itemBuilder: (context, index) {
                  final badge = badges[index];
                  final completionDate = DateTime.now().subtract(
                    Duration(days: (index + 1) * 12),
                  );

                  return AchievedBadgeCard(
                    badge: badge,
                    completionDate: completionDate,
                    fallbackLevel: _fallbackLevel(index),
                    fallbackPoints: 80 + (index * 20),
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

    final sourceApplications = _applications.isNotEmpty
        ? _applications
        : _mockApplications();

    final filtered = sourceApplications
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

    if (normalized.contains('approved') || normalized.contains('aprov')) {
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

  String _fallbackLevel(int index) {
    const levels = ['A', 'B', 'C', 'D', 'E'];
    return levels[index % levels.length];
  }

  List<ApplicationSummaryModel> _mockApplications() {
    return mockApplications();
  }
}
