import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/utils/app_links.dart';
import '../../../models/earned_badge_model.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/badge_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/email_signature/email_signature_widgets.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

class EmailSignatureScreen extends StatefulWidget {
  const EmailSignatureScreen({super.key});

  @override
  State<EmailSignatureScreen> createState() => _EmailSignatureScreenState();
}

class _EmailSignatureScreenState extends State<EmailSignatureScreen> {
  final Set<int> _selectedBadgeIds = {};
  final _searchController = TextEditingController();
  String _filterTab = 'all';

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
    if (_filterTab == 'recent') {
      final sorted = [...earned]
        ..sort((a, b) => b.award.awardedAt.compareTo(a.award.awardedAt));
      list = sorted.take(6).toList();
    }

    if (query.isEmpty) return list;
    return list
        .where((e) => e.badge.title.toLowerCase().contains(query))
        .toList();
  }

  String _generateHtml(List<EarnedBadge> earned, String userName, String areaName, String userEmail) {
    final selectedBadges = earned.where((e) => _selectedBadgeIds.contains(e.badge.id)).toList();

    final badgeCells = selectedBadges.map((eb) {
      final badge = eb.badge;
      // Public verification URL on our web platform (/verify/:link).
      final verifyUrl = AppLinks.verificationUrl(eb.award.verificationLink ?? '');
      final imageUrl = badge.imageUrl?.trim() ?? '';
      // Prefer the badge's real artwork; fall back to a colored medal disc.
      final visual = imageUrl.isNotEmpty
          ? '<img src="$imageUrl" alt="${badge.title}" width="40" height="40" style="display:inline-block;border:0;" />'
          : '<div style="width:36px;height:36px;border-radius:50%;background:#${badge.medalColor.toARGB32().toRadixString(16).substring(2)};border:2px solid #876E2C;display:inline-block;line-height:36px;color:#FFF6C7;font-size:18px;">&#9733;</div>';
      final cell = '<td style="text-align:center;padding:4px 8px;">'
          '<a href="$verifyUrl" style="text-decoration:none;">'
          '$visual'
          '<br><span style="font-size:10px;color:#3A4A57;">${badge.title}</span>'
          '</a></td>';
      return cell;
    }).join('\n');

    return '''<table style="font-family:'Segoe UI',Arial,sans-serif;border-collapse:collapse;">
<tr>
<td style="padding-right:12px;vertical-align:top;">
<strong style="font-size:14px;color:#172733;">$userName</strong><br>
${areaName.isNotEmpty ? '<span style="font-size:12px;color:#3B8DBD;">$areaName</span><br>' : ''}
${userEmail.isNotEmpty ? '<span style="font-size:12px;color:#5B6773;">$userEmail</span>' : ''}
</td>
</tr>
${selectedBadges.isNotEmpty ? '<tr><td style="padding-top:8px;"><table><tr>$badgeCells</tr></table></td></tr>' : ''}
</table>''';
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badgeStore = context.watch<BadgeStore>();
    final authStore = context.watch<AuthStore>();
    final earned = badgeStore.earnedBadges;
    final filtered = _filteredBadges(earned);

    final user = authStore.currentUser;
    final userName = (user?.fullName.trim().isNotEmpty ?? false)
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty ?? false)
            ? user!.username.trim()
            : tr.tr('userFallback');
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
        title: Text(
          tr.tr('emailSignature'),
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        leading: IconButton(
          icon: const AppIcon(AppIcons.chevronBackward, color: Color(0xFF1E2932)),
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
              Text(
                tr.tr('selectBadgesToShow'),
                style: const TextStyle(
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
                  hintText: tr.tr('myBadgesSearchHint'),
                  prefixIcon: const AppIcon(AppIcons.search),
                  suffixIcon: IconButton(
                    onPressed: () {},
                    icon: const AppIcon(AppIcons.filter),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _filterTab = 'all'),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: _filterTab == 'all'
                              ? const Color(0xFF5D9FD1)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFF5D9FD1)),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          tr.tr('filterAll'),
                          style: TextStyle(
                            color: _filterTab == 'all'
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
                      onTap: () => setState(() => _filterTab = 'recent'),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: _filterTab == 'recent'
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
                              tr.tr('recentFilter'),
                              style: TextStyle(
                                color: _filterTab == 'recent'
                                    ? Colors.white
                                    : const Color(0xFF5D9FD1),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (_filterTab == 'recent')
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
                      tr.tr('noEarnedBadgesYet'),
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
                                  imageUrl: badge.imageUrl,
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
                                child: const AppIcon(
                                  AppIcons.check,
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

              Text(
                tr.tr('previewLabel'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2932),
                ),
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const CircleAvatar(
                          radius: 24,
                          backgroundColor: Color(0xFFD5EAF6),
                          child: AppIcon(
                            AppIcons.user,
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
                    if (_selectedBadgeIds.isNotEmpty) ...[
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
                            final badge = match.first.badge;

                            return Tooltip(
                              message: badge.title,
                              child: EmailSignatureBadgeMedalIcon(
                                medalColor: badge.medalColor,
                                ribbonColor: badge.ribbonColor,
                                imageUrl: badge.imageUrl,
                                size: 30,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (_selectedBadgeIds.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F4F8),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFD7DDE4)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'HTML',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF5B6773),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _generateHtml(earned, userName, areaName, userEmail),
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: Color(0xFF3A4A57),
                        ),
                        maxLines: 8,
                        overflow: TextOverflow.fade,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final html = _generateHtml(earned, userName, areaName, userEmail);
                      Clipboard.setData(ClipboardData(text: html));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(tr.tr('htmlCopied')),
                          backgroundColor: const Color(0xFF2E9E4D),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                    icon: const Icon(Icons.copy_rounded, size: 20),
                    label: Text(tr.tr('copyHtmlCode')),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF5D9FD1),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      textStyle: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              Text(
                tr.tr('emailSignatureInstructions'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2932),
                ),
              ),
              const SizedBox(height: 12),
              _InstructionCard(
                icon: AppIcons.email,
                title: 'Gmail',
                description: tr.tr('gmailInstructions'),
              ),
              const SizedBox(height: 10),
              _InstructionCard(
                icon: AppIcons.email,
                title: 'Outlook',
                description: tr.tr('outlookInstructions'),
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

class _InstructionCard extends StatelessWidget {
  final String icon;
  final String title;
  final String description;

  const _InstructionCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: const BoxDecoration(
              color: Color(0xFFD5EAF6),
              shape: BoxShape.circle,
            ),
            child: AppIcon(icon, color: const Color(0xFF4D9ECC), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E2932),
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    color: Color(0xFF5B6773),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
