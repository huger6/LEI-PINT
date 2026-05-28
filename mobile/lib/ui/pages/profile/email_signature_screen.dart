import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../models/earned_badge_model.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/badge_store.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/email_signature/email_signature_widgets.dart';

class EmailSignatureScreen extends StatefulWidget {
  const EmailSignatureScreen({super.key});

  @override
  State<EmailSignatureScreen> createState() => _EmailSignatureScreenState();
}

class _EmailSignatureScreenState extends State<EmailSignatureScreen> {
  final Set<int> _selectedBadgeIds = {};
  bool _showPreview = false;
  final _searchController = TextEditingController();
  String _filterTab = 'Todos';
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BadgeStore>().loadEarnedBadges();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<EarnedBadge> _filteredBadges(List<EarnedBadge> earned) {
    final query = _searchController.text.trim().toLowerCase();

    var list = earned;
    if (_filterTab == 'Recentes') {
      final sorted = [...earned]
        ..sort((a, b) => b.award.awardedAt.compareTo(a.award.awardedAt));
      list = sorted.take(6).toList();
    }

    if (query.isEmpty) return list;
    return list
        .where((e) => e.badge.title.toLowerCase().contains(query))
        .toList();
  }

  Future<void> _handleConfirm(List<EarnedBadge> earned) async {
    if (_selectedBadgeIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Selecione pelo menos um badge.'),
          backgroundColor: Color(0xFFD94827),
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      await Future.delayed(const Duration(milliseconds: 500));

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Assinatura de email guardada com sucesso.'),
          backgroundColor: Color(0xFF2E9E4D),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erro ao guardar a assinatura de email.'),
          backgroundColor: Color(0xFFD94827),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _openVerificationLink(String? link) async {
    if (link == null || link.isEmpty) return;
    final uri = Uri.tryParse(link);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final badgeStore = context.watch<BadgeStore>();
    final authStore = context.watch<AuthStore>();
    final earned = badgeStore.earnedBadges;
    final filtered = _filteredBadges(earned);

    final user = authStore.currentUser;
    final userName = (user?.fullName.trim().isNotEmpty ?? false)
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty ?? false)
            ? user!.username.trim()
            : 'Utilizador';
    final userEmail = user?.email ?? '';
    final userAreas = user?.areas ?? const [];
    final primaryArea = userAreas.where((a) => a.isPrimary).firstOrNull;
    final areaName = primaryArea?.name.trim().isNotEmpty == true
        ? primaryArea!.name.trim()
        : (userAreas.isNotEmpty ? userAreas.first.name : '');

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        title: const Text(
          'Assinatura de email',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E2932)),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              const Text(
                'Selecione os Badges a mostrar',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E2932),
                ),
              ),
              const SizedBox(height: 12),

              TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Procure badges',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.tune_rounded),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _filterTab = 'Todos'),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: _filterTab == 'Todos'
                              ? const Color(0xFF5D9FD1)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFF5D9FD1)),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Todos',
                          style: TextStyle(
                            color: _filterTab == 'Todos'
                                ? Colors.white
                                : const Color(0xFF5D9FD1),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _filterTab = 'Recentes'),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: _filterTab == 'Recentes'
                              ? const Color(0xFF5D9FD1)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFF5D9FD1)),
                        ),
                        alignment: Alignment.center,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Recentes',
                              style: TextStyle(
                                color: _filterTab == 'Recentes'
                                    ? Colors.white
                                    : const Color(0xFF5D9FD1),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (_filterTab == 'Recentes')
                              const Padding(
                                padding: EdgeInsets.only(left: 6),
                                child: SizedBox(
                                  width: 8,
                                  height: 8,
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: Color(0xFF59D17A),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              if (badgeStore.isLoadingEarned && earned.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (earned.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Text(
                      'Ainda não obteve nenhum badge.',
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                )
              else
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.82,
                  children: filtered.map((item) {
                    final badge = item.badge;
                    final isSelected = _selectedBadgeIds.contains(badge.id);

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedBadgeIds.remove(badge.id);
                          } else {
                            _selectedBadgeIds.add(badge.id);
                          }
                        });
                      },
                      child: Stack(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: isSelected
                                  ? Border.all(
                                      color: const Color(0xFF3E88C8),
                                      width: 2,
                                    )
                                  : null,
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x14000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                EmailSignatureBadgeMedalIcon(
                                  medalColor: badge.medalColor,
                                  ribbonColor: badge.ribbonColor,
                                  size: 48,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  badge.title,
                                  textAlign: TextAlign.center,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF172733),
                                    fontSize: 12,
                                    height: 1.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Positioned(
                              right: 6,
                              top: 6,
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF3E88C8),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.check,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                ),

              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Pré-visualização',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1E2932),
                    ),
                  ),
                  Row(
                    children: [
                      const Text(
                        'Antes',
                        style: TextStyle(
                          color: Color(0xFF5B6773),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Switch(
                        value: _showPreview,
                        onChanged: (v) => setState(() => _showPreview = v),
                        activeThumbColor: const Color(0xFF5D9FD1),
                      ),
                      const Text(
                        'Depois',
                        style: TextStyle(
                          color: Color(0xFF5B6773),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x14000000),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const CircleAvatar(
                          radius: 24,
                          backgroundColor: Color(0xFFD5EAF6),
                          child: Icon(
                            Icons.person,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                userName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF172733),
                                ),
                              ),
                              if (areaName.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  areaName,
                                  style: const TextStyle(
                                    color: Color(0xFF3B8DBD),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                              if (userEmail.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  userEmail,
                                  style: const TextStyle(
                                    color: Color(0xFF5B6773),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (_showPreview && _selectedBadgeIds.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Divider(color: Colors.grey[300], height: 1),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 48,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _selectedBadgeIds.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(width: 8),
                          itemBuilder: (_, index) {
                            final badgeId =
                                _selectedBadgeIds.toList()[index];
                            final match = earned.where(
                              (e) => e.badge.id == badgeId,
                            );
                            if (match.isEmpty) {
                              return const SizedBox.shrink();
                            }
                            final earnedBadge = match.first;
                            final badge = earnedBadge.badge;
                            final link = earnedBadge.award.verificationLink;

                            return GestureDetector(
                              onTap: link != null && link.isNotEmpty
                                  ? () => _openVerificationLink(link)
                                  : null,
                              child: Tooltip(
                                message: badge.title,
                                child: SizedBox(
                                  width: 38,
                                  height: 48,
                                  child: Stack(
                                    alignment: Alignment.topCenter,
                                    children: [
                                      EmailSignatureBadgeMedalIcon(
                                        medalColor: badge.medalColor,
                                        ribbonColor: badge.ribbonColor,
                                        size: 30,
                                      ),
                                      if (link != null && link.isNotEmpty)
                                        const Positioned(
                                          bottom: 0,
                                          child: Icon(
                                            Icons.link_rounded,
                                            size: 12,
                                            color: Color(0xFF5D9FD1),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ] else if (_showPreview)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          'Nenhum badge selecionado',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x14000000),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: _isSaving ? null : () => _handleConfirm(earned),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: const BoxDecoration(
                              color: Color(0xFFD5EAF6),
                              shape: BoxShape.circle,
                            ),
                            child: _isSaving
                                ? const Padding(
                                    padding: EdgeInsets.all(10),
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Color(0xFF5D9FD1),
                                    ),
                                  )
                                : const Icon(
                                    Icons.check_circle_outline_rounded,
                                    color: Color(0xFF4D9ECC),
                                  ),
                          ),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Confirmar Assinatura de email',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF1E2932),
                                    fontSize: 15,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Guardar e enviar a sua assinatura',
                                  style: TextStyle(
                                    color: Color(0xFF6E7A86),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.chevron_right_rounded,
                            color: Color(0xFF5D9FD1),
                            size: 28,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.profile),
    );
  }
}
