import 'package:flutter/material.dart';

import '../../../core/routes/app_router.dart';
import '../../../models/badge_model.dart';
import '../../../ui/widgets/badges/badge_catalog.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';

class EmailSignatureScreen extends StatefulWidget {
  const EmailSignatureScreen({super.key});

  @override
  State<EmailSignatureScreen> createState() => _EmailSignatureScreenState();
}

class _EmailSignatureScreenState extends State<EmailSignatureScreen> {
  final Set<int> _selectedBadges = {};
  bool _showPreview = false;
  final _searchController = TextEditingController();
  String _filterTab = 'Todos';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<BadgeModel> get _availableBadges {
    final query = _searchController.text.trim().toLowerCase();
    final badges = BadgeCatalog.all;

    if (query.isEmpty) {
      return badges;
    }

    return badges.where((b) => b.title.toLowerCase().contains(query)).toList();
  }

  @override
  Widget build(BuildContext context) {
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

              // Search bar
              Container(
                height: 46,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFD8E8F3),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  textAlignVertical: TextAlignVertical.center,
                  decoration: InputDecoration(
                    hintText: 'Procure badges',
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
              ),
              const SizedBox(height: 12),

              // Tabs
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

              // Grid of badges
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.75,
                children: _availableBadges.map((badge) {
                  final index = BadgeCatalog.all.indexOf(badge);
                  final isSelected = _selectedBadges.contains(index);

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          _selectedBadges.remove(index);
                        } else {
                          _selectedBadges.add(index);
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
                              _BadgeMedalIcon(
                                medalColor: badge.medalColor,
                                ribbonColor: badge.ribbonColor,
                              ),
                              const SizedBox(height: 8),
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

              // Preview section
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
                        activeColor: const Color(0xFF5D9FD1),
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

              // Email signature preview card
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
                            children: const [
                              Text(
                                'João Dias',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF172733),
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Hybrid Cloud',
                                style: TextStyle(
                                  color: Color(0xFF5B6773),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                'LowCode',
                                style: TextStyle(
                                  color: Color(0xFF5B6773),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: const [
                            Text(
                              '123 456 789',
                              style: TextStyle(
                                color: Color(0xFF5B6773),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'joao.dias@softinsa.pt',
                              style: TextStyle(
                                color: Color(0xFF5B6773),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Viseu (Softinsa - IBM)',
                              style: TextStyle(
                                color: Color(0xFF5B6773),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    if (_selectedBadges.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Divider(color: Colors.grey[300], height: 1),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 40,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _selectedBadges.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, index) {
                            final badgeIndex = _selectedBadges.toList()[index];
                            final badge = BadgeCatalog.all[badgeIndex];

                            return _BadgeMedalIcon(
                              medalColor: badge.medalColor,
                              ribbonColor: badge.ribbonColor,
                              size: 40,
                            );
                          },
                        ),
                      ),
                    ] else
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
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.profile),
    );
  }
}
