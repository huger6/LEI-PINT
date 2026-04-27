import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/repositories/applications_repo.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../../presentation/state/badge_store.dart';
import '../../widgets/badges/badge_catalog.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';

class MyBadgesScreen extends StatefulWidget {
  const MyBadgesScreen({super.key});

  @override
  State<MyBadgesScreen> createState() => _MyBadgesScreenState();
}

class _MyBadgesScreenState extends State<MyBadgesScreen> {
  final TextEditingController _badgesSearchController = TextEditingController();
  final TextEditingController _applicationsSearchController =
      TextEditingController();

  bool _isLoadingApplications = true;
  String? _applicationsError;
  List<ApplicationSummaryModel> _applications = const [];
  _ApplicationFilter _selectedFilter = _ApplicationFilter.all;

  @override
  void initState() {
    super.initState();
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
          _SearchBar(
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

                  return _AchievedBadgeCard(
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
              itemCount: _ApplicationFilter.values.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final filter = _ApplicationFilter.values[index];
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
          _SearchBar(
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

                        return _ApplicationCard(
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
    if (_selectedFilter == _ApplicationFilter.all) {
      return true;
    }

    return _stateOf(application.applicationState).filter == _selectedFilter;
  }

  _ApplicationStateVisual _stateOf(String status) {
    final normalized = status.toLowerCase();

    if (normalized.contains('approved') || normalized.contains('aprov')) {
      return const _ApplicationStateVisual(
        label: 'Aprovado',
        color: Color(0xFF59C13E),
        filter: _ApplicationFilter.approved,
      );
    }

    if (normalized.contains('reject') ||
        normalized.contains('rejeit') ||
        normalized.contains('devolv')) {
      return const _ApplicationStateVisual(
        label: 'Rejeitado',
        color: Color(0xFFD94A2A),
        filter: _ApplicationFilter.rejected,
      );
    }

    return const _ApplicationStateVisual(
      label: 'Em validação',
      color: Color(0xFFC9A625),
      filter: _ApplicationFilter.inReview,
    );
  }

  String _buildUpdateText(_ApplicationStateVisual state, DateTime? date) {
    final relative = _relativeLower(date);

    if (state.filter == _ApplicationFilter.approved) {
      return 'Aprovado pelo Talent Manager $relative';
    }

    if (state.filter == _ApplicationFilter.rejected) {
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
    return [
      ApplicationSummaryModel(
        applicationGuid: 'mock-1',
        applicationState: 'Approved',
        badge: BadgeCatalog.all[0],
        submittedAt: DateTime.now().subtract(const Duration(days: 2)),
      ),
      ApplicationSummaryModel(
        applicationGuid: 'mock-2',
        applicationState: 'In review',
        badge: BadgeCatalog.all[1],
        submittedAt: DateTime.now().subtract(const Duration(hours: 3)),
      ),
      ApplicationSummaryModel(
        applicationGuid: 'mock-3',
        applicationState: 'Rejected',
        badge: BadgeCatalog.all[2],
        submittedAt: DateTime.now().subtract(const Duration(hours: 23)),
      ),
    ];
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({
    required this.controller,
    required this.hintText,
    required this.onChanged,
  });

  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFD8E8F3),
        borderRadius: BorderRadius.circular(15),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        textAlignVertical: TextAlignVertical.center,
        decoration: InputDecoration(
          hintText: hintText,
          border: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: Color(0xFF41525E),
            size: 26,
          ),
          suffixIcon: IconButton(
            onPressed: () {},
            icon: const Icon(
              Icons.tune_rounded,
              color: Color(0xFF41525E),
              size: 24,
            ),
          ),
        ),
      ),
    );
  }
}

class _AchievedBadgeCard extends StatelessWidget {
  const _AchievedBadgeCard({
    required this.badge,
    required this.completionDate,
    required this.fallbackLevel,
    required this.fallbackPoints,
  });

  final BadgeModel badge;
  final DateTime completionDate;
  final String fallbackLevel;
  final int fallbackPoints;

  @override
  Widget build(BuildContext context) {
    final level = badge.level.trim().isNotEmpty ? badge.level : fallbackLevel;
    final points = badge.points > 0 ? badge.points : fallbackPoints;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _BadgeMedalIcon(
                medalColor: badge.medalColor,
                ribbonColor: badge.ribbonColor,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            badge.title,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF172733),
                              height: 1.1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$level  $points',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF213241),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 3),
                        const Icon(
                          Icons.workspace_premium_outlined,
                          size: 17,
                          color: Color(0xFF445967),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_month_rounded,
                          size: 17,
                          color: Color(0xFF445967),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          _formatDate(completionDate),
                          style: const TextStyle(
                            color: Color(0xFF445967),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.download_rounded, size: 18),
                  label: const Text('Comprovativo'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF263542),
                    side: const BorderSide(color: Color(0xFFC2CDD7)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.share_outlined, size: 18),
                  label: const Text('Partilhar'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF263542),
                    side: const BorderSide(color: Color(0xFFC2CDD7)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    return '$day/$month/$year';
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({
    required this.badge,
    required this.state,
    required this.date,
    required this.updateText,
  });

  final BadgeModel badge;
  final _ApplicationStateVisual state;
  final String date;
  final String updateText;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: state.color.withOpacity(0.7), width: 1.7),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BadgeMedalIcon(
            medalColor: badge.medalColor,
            ribbonColor: badge.ribbonColor,
            compact: true,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  badge.title,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E2A35),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_month_rounded,
                      size: 16,
                      color: Color(0xFF445967),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      date,
                      style: const TextStyle(
                        color: Color(0xFF445967),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: state.color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      state.label,
                      style: TextStyle(
                        color: state.color,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.sync_rounded,
                      size: 16,
                      color: Color(0xFF4F6170),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        updateText,
                        style: const TextStyle(
                          color: Color(0xFF4F6170),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BadgeMedalIcon extends StatelessWidget {
  const _BadgeMedalIcon({
    required this.medalColor,
    required this.ribbonColor,
    this.compact = false,
  });

  final Color medalColor;
  final Color ribbonColor;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final medalSize = compact ? 44.0 : 58.0;
    final ribbonIconSize = compact ? 18.0 : 22.0;
    final iconSize = compact ? 25.0 : 33.0;
    final topOffset = compact ? 35.0 : 45.0;

    return SizedBox(
      width: compact ? 54 : 72,
      height: compact ? 78 : 94,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: topOffset,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: ribbonIconSize),
                const SizedBox(width: 2),
                Icon(Icons.bookmark, color: ribbonColor, size: ribbonIconSize),
              ],
            ),
          ),
          Container(
            width: medalSize,
            height: medalSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF7A7A7A), width: 1.4),
            ),
            child: Icon(
              Icons.star_rounded,
              color: Colors.white,
              size: iconSize,
            ),
          ),
        ],
      ),
    );
  }
}

enum _ApplicationFilter {
  all('Todos'),
  approved('Aprovadas'),
  inReview('Em análise'),
  rejected('Rejeitadas');

  const _ApplicationFilter(this.label);

  final String label;
}

class _ApplicationStateVisual {
  const _ApplicationStateVisual({
    required this.label,
    required this.color,
    required this.filter,
  });

  final String label;
  final Color color;
  final _ApplicationFilter filter;
}
