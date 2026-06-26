import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:super_clipboard/super_clipboard.dart';

import '../../../core/theme/app_colors.dart';
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
  bool _includePhoto = true;
  bool _includeName = true;
  String _viewMode = 'signature'; // 'signature' | 'email'
  bool _isCopying = false;

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

  String _roleLabel(String? role, LanguageController tr) {
    switch (role) {
      case 'Talent Manager':
        return tr.tr('roleTalentManager');
      case 'Service Line Leader':
        return tr.tr('roleServiceLineLeader');
      case 'Administrator':
        return tr.tr('roleAdministrator');
      case 'Consultant':
      default:
        return tr.tr('roleConsultant');
    }
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

  Future<String> _imageUrlToBase64(String url) async {
    try {
      final response = await Dio().get<List<int>>(
        url,
        options: Options(responseType: ResponseType.bytes),
      );
      if (response.data != null) {
        final contentType =
            response.headers.value('content-type') ?? 'image/svg+xml';
        final mimeType = contentType.split(';').first.trim();
        final encoded = base64Encode(response.data!);
        return 'data:$mimeType;base64,$encoded';
      }
    } catch (_) {}
    return url;
  }

  Future<void> _copySignatureToClipboard({
    required List<EarnedBadge> earned,
    required String userName,
    required String roleLabel,
    required String userEmail,
    required String? photoUrl,
  }) async {
    final tr = LanguageScope.of(context);
    setState(() => _isCopying = true);

    try {
      final selectedBadges =
          earned.where((e) => _selectedBadgeIds.contains(e.badge.id)).toList();

      final imageOverrides = <int, String>{};
      for (final eb in selectedBadges) {
        final url = eb.badge.imageUrl?.trim() ?? '';
        if (url.isNotEmpty) {
          imageOverrides[eb.badge.id] = await _imageUrlToBase64(url);
        }
      }

      final html = _viewMode == 'email'
          ? _generateEmailTemplateHtml(
              earned: earned,
              userName: userName,
              roleLabel: roleLabel,
              userEmail: userEmail,
              photoUrl: photoUrl,
              imageOverrides: imageOverrides,
            )
          : _generateSignatureHtml(
              earned: earned,
              userName: userName,
              roleLabel: roleLabel,
              userEmail: userEmail,
              photoUrl: photoUrl,
              imageOverrides: imageOverrides,
            );

      final clipboard = SystemClipboard.instance;
      if (clipboard != null) {
        final item = DataWriterItem();
        item.add(Formats.htmlText(html));
        item.add(Formats.plainText('$userName · Softinsa'));
        await clipboard.write([item]);
      } else {
        await Clipboard.setData(ClipboardData(text: html));
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr.tr('htmlCopied')),
            backgroundColor: const Color(0xFF2E9E4D),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr.tr('genericError')),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCopying = false);
      }
    }
  }

  String _generateSignatureHtml({
    required List<EarnedBadge> earned,
    required String userName,
    required String roleLabel,
    required String userEmail,
    required String? photoUrl,
    Map<int, String>? imageOverrides,
  }) {
    final selectedBadges =
        earned.where((e) => _selectedBadgeIds.contains(e.badge.id)).toList();

    final badgeItems = selectedBadges.map((eb) {
      final badge = eb.badge;
      final verifyUrl =
          AppLinks.verificationUrl(eb.award.verificationLink ?? '');
      final imageUrl = imageOverrides?[badge.id] ?? badge.imageUrl?.trim() ?? '';
      final imgTag = imageUrl.isNotEmpty
          ? '<img src="$imageUrl" alt="${badge.title}" height="56" width="56" style="border:0;border-radius:8px;vertical-align:middle;" />'
          : '<span style="display:inline-block;padding:4px 10px;margin-right:8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;color:#1f2937;">${badge.title}</span>';
      final wrapped = verifyUrl.isNotEmpty
          ? '<a href="$verifyUrl" target="_blank" rel="noopener" style="text-decoration:none;margin-right:8px;display:inline-block;">$imgTag</a>'
          : '<span style="margin-right:8px;display:inline-block;">$imgTag</span>';
      return wrapped;
    }).join('');

    final nameRow = _includeName
        ? '<tr><td style="font-size:15px;font-weight:bold;color:#1f2937;">$userName</td></tr>'
        : '';
    final emailRow = userEmail.isNotEmpty
        ? '<tr><td style="font-size:12px;padding-top:4px;"><a href="mailto:$userEmail" style="color:#2575bd;text-decoration:none;">$userEmail</a></td></tr>'
        : '';
    final badgeRow = badgeItems.isNotEmpty
        ? '<tr><td style="padding-top:10px;">$badgeItems</td></tr>'
        : '';

    final infoTable =
        '<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;">'
        '$nameRow'
        '<tr><td style="font-size:12px;color:#6b7280;padding-top:2px;">$roleLabel · Softinsa</td></tr>'
        '$emailRow'
        '$badgeRow'
        '</table>';

    if (_includePhoto && photoUrl != null && photoUrl.isNotEmpty) {
      return '<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;"><tr>'
          '<td style="padding-right:12px;vertical-align:middle;"><img src="$photoUrl" alt="$userName" width="64" height="64" style="border:0;border-radius:50%;object-fit:cover;display:block;" /></td>'
          '<td style="vertical-align:middle;">$infoTable</td>'
          '</tr></table>';
    }

    return infoTable;
  }

  String _generateEmailTemplateHtml({
    required List<EarnedBadge> earned,
    required String userName,
    required String roleLabel,
    required String userEmail,
    required String? photoUrl,
    Map<int, String>? imageOverrides,
  }) {
    final selectedBadges =
        earned.where((e) => _selectedBadgeIds.contains(e.badge.id)).toList();

    final cards = selectedBadges.map((eb) {
      final badge = eb.badge;
      final verifyUrl =
          AppLinks.verificationUrl(eb.award.verificationLink ?? '');
      final imageUrl = imageOverrides?[badge.id] ?? badge.imageUrl?.trim() ?? '';
      final imgTag = imageUrl.isNotEmpty
          ? '<img src="$imageUrl" alt="${badge.title}" width="84" height="84" style="border:0;border-radius:12px;display:block;margin:0 auto;" />'
          : '<div style="width:84px;height:84px;border-radius:12px;background:#eef2f7;margin:0 auto;"></div>';
      final verify = verifyUrl.isNotEmpty
          ? '<a href="$verifyUrl" target="_blank" rel="noopener" style="font-size:11px;color:#2575bd;text-decoration:none;">Verify</a>'
          : '';
      return '<td style="padding:8px;text-align:center;vertical-align:top;width:120px;">$imgTag<div style="font-size:12px;font-weight:bold;color:#1f2937;padding-top:6px;">${badge.title}</div><div style="padding-top:2px;">$verify</div></td>';
    }).toList();

    final rows = <String>[];
    for (var i = 0; i < cards.length; i += 3) {
      rows.add('<tr>${cards.sublist(i, i + 3 > cards.length ? cards.length : i + 3).join('')}</tr>');
    }
    final grid = rows.isNotEmpty
        ? '<table cellpadding="0" cellspacing="0" style="margin:12px 0;">${rows.join('')}</table>'
        : '';

    final photoCell = (_includePhoto && photoUrl != null && photoUrl.isNotEmpty)
        ? '<td style="padding-right:12px;vertical-align:middle;"><img src="$photoUrl" alt="$userName" width="56" height="56" style="border:0;border-radius:50%;object-fit:cover;display:block;" /></td>'
        : '';
    final nameDiv = _includeName
        ? '<div style="font-size:16px;font-weight:bold;color:#1f2937;">$userName</div>'
        : '';

    final header =
        '<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;"><tr>'
        '$photoCell'
        '<td style="vertical-align:middle;">'
        '$nameDiv'
        '<div style="font-size:12px;color:#6b7280;">$roleLabel · Softinsa</div>'
        '</td></tr></table>';

    return '<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:520px;">'
        '$header'
        '$grid'
        '${_includeName ? '<p style="font-size:14px;font-weight:bold;color:#1f2937;margin:4px 0 0;">$userName</p>' : ''}'
        '${userEmail.isNotEmpty ? '<p style="margin:2px 0 0;"><a href="mailto:$userEmail" style="font-size:12px;color:#2575bd;text-decoration:none;">$userEmail</a></p>' : ''}'
        '</div>';
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final badgeStore = context.watch<BadgeStore>();
    final authStore = context.watch<AuthStore>();
    final earned = badgeStore.earnedBadges;
    final filtered = _filteredBadges(earned);

    final user = authStore.currentUser;
    final isConsultant = user?.role == 'Consultant';

    final userName = (user?.fullName.trim().isNotEmpty ?? false)
        ? user!.fullName.trim()
        : (user?.username.trim().isNotEmpty ?? false)
            ? user!.username.trim()
            : tr.tr('userFallback');
    final userEmail = user?.email ?? '';
    final photoUrl = user?.profilePicture;
    final roleLabel = _roleLabel(user?.role, tr);

    final selectedBadges =
        earned.where((e) => _selectedBadgeIds.contains(e.badge.id)).toList();

    final activeHtml = _viewMode == 'email'
        ? _generateEmailTemplateHtml(
            earned: earned,
            userName: userName,
            roleLabel: roleLabel,
            userEmail: userEmail,
            photoUrl: photoUrl,
          )
        : _generateSignatureHtml(
            earned: earned,
            userName: userName,
            roleLabel: roleLabel,
            userEmail: userEmail,
            photoUrl: photoUrl,
          );

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
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
              // ── Badge selection (consultants only) ──────────────────
              if (isConsultant) ...[
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
                    Expanded(child: _FilterChip(
                      label: tr.tr('filterAll'),
                      active: _filterTab == 'all',
                      onTap: () => setState(() => _filterTab = 'all'),
                    )),
                    const SizedBox(width: 8),
                    Expanded(child: _FilterChip(
                      label: tr.tr('recentFilter'),
                      active: _filterTab == 'recent',
                      onTap: () => setState(() => _filterTab = 'recent'),
                    )),
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
                        style: TextStyle(fontSize: 15, color: Colors.grey[600], fontWeight: FontWeight.w600),
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
                        onTap: () => setState(() {
                          if (isSelected) {
                            _selectedBadgeIds.remove(badge.id);
                          } else {
                            _selectedBadgeIds.add(badge.id);
                          }
                        }),
                        child: Stack(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: isSelected
                                    ? Border.all(color: AppColors.secondary, width: 2)
                                    : null,
                                boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 2))],
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
                                    style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF172733), fontSize: 12, height: 1.2),
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
                                  decoration: const BoxDecoration(color: AppColors.secondary, shape: BoxShape.circle),
                                  child: const AppIcon(AppIcons.check, color: Colors.white, size: 18),
                                ),
                              ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                const SizedBox(height: 20),
              ],

              // ── Preview section ─────────────────────────────────────
              Text(
                tr.tr('previewLabel'),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E2932)),
              ),
              const SizedBox(height: 12),

              // View toggle (consultant only)
              if (isConsultant) ...[
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      Expanded(child: _ViewToggleBtn(
                        label: tr.tr('viewSignature'),
                        active: _viewMode == 'signature',
                        onTap: () => setState(() => _viewMode = 'signature'),
                      )),
                      Expanded(child: _ViewToggleBtn(
                        label: tr.tr('viewEmailTemplate'),
                        active: _viewMode == 'email',
                        onTap: () => setState(() => _viewMode = 'email'),
                      )),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
              ],

              // Non-consultant note
              if (!isConsultant)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    tr.tr('signatureNoBadgesNote'),
                    style: const TextStyle(fontSize: 13, color: AppColors.onPrimaryContainer, fontWeight: FontWeight.w500),
                  ),
                ),

              // Include options
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 6, offset: Offset(0, 2))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr.tr('includeOptions'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF5B6773)),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _OptionCheck(
                          label: tr.tr('includePhoto'),
                          value: _includePhoto,
                          enabled: photoUrl != null && photoUrl.isNotEmpty,
                          onChanged: (v) => setState(() => _includePhoto = v),
                        ),
                        const SizedBox(width: 20),
                        _OptionCheck(
                          label: tr.tr('includeName'),
                          value: _includeName,
                          enabled: true,
                          onChanged: (v) => setState(() => _includeName = v),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Live preview card (Flutter-rendered)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 2))],
                ),
                child: _viewMode == 'signature'
                    ? _SignaturePreview(
                        userName: userName,
                        roleLabel: roleLabel,
                        userEmail: userEmail,
                        photoUrl: photoUrl,
                        selectedBadges: selectedBadges,
                        includePhoto: _includePhoto,
                        includeName: _includeName,
                      )
                    : _EmailTemplatePreview(
                        userName: userName,
                        roleLabel: roleLabel,
                        userEmail: userEmail,
                        photoUrl: photoUrl,
                        selectedBadges: selectedBadges,
                        includePhoto: _includePhoto,
                        includeName: _includeName,
                      ),
              ),

              // ── HTML copy section ───────────────────────────────────
              const SizedBox(height: 20),
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
                    const Text('HTML', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF5B6773))),
                    const SizedBox(height: 6),
                    Text(
                      activeHtml,
                      style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Color(0xFF3A4A57)),
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
                  onPressed: _isCopying
                      ? null
                      : () => _copySignatureToClipboard(
                            earned: earned,
                            userName: userName,
                            roleLabel: roleLabel,
                            userEmail: userEmail,
                            photoUrl: photoUrl,
                          ),
                  icon: _isCopying
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.copy_rounded, size: 20),
                  label: Text(_viewMode == 'email'
                      ? tr.tr('copyEmailTemplate')
                      : tr.tr('copySignature')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    elevation: 0,
                  ),
                ),
              ),

              // ── Instructions ────────────────────────────────────────
              const SizedBox(height: 24),
              Text(
                tr.tr('emailSignatureInstructions'),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E2932)),
              ),
              const SizedBox(height: 12),
              _InstructionCard(icon: AppIcons.email, title: 'Gmail', description: tr.tr('gmailInstructions')),
              const SizedBox(height: 10),
              _InstructionCard(icon: AppIcons.email, title: 'Outlook', description: tr.tr('outlookInstructions')),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.profile),
    );
  }
}

// ── Small reusable widgets ──────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 42,
        decoration: BoxDecoration(
          color: active ? AppColors.secondary : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.secondary),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(color: active ? Colors.white : AppColors.secondary, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}

class _ViewToggleBtn extends StatelessWidget {
  const _ViewToggleBtn({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.secondary : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: active ? Colors.white : AppColors.secondary,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _OptionCheck extends StatelessWidget {
  const _OptionCheck({required this.label, required this.value, required this.enabled, required this.onChanged});
  final String label;
  final bool value;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? () => onChanged(!value) : null,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: Checkbox(
              value: value,
              onChanged: enabled ? (v) => onChanged(v ?? value) : null,
              activeColor: AppColors.secondary,
              side: BorderSide(color: enabled ? AppColors.secondary : Colors.grey[400]!, width: 1.5),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: enabled ? const Color(0xFF1E2932) : Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Preview widgets ─────────────────────────────────────────────────────────

class _SignaturePreview extends StatelessWidget {
  const _SignaturePreview({
    required this.userName,
    required this.roleLabel,
    required this.userEmail,
    required this.photoUrl,
    required this.selectedBadges,
    required this.includePhoto,
    required this.includeName,
  });

  final String userName;
  final String roleLabel;
  final String userEmail;
  final String? photoUrl;
  final List<EarnedBadge> selectedBadges;
  final bool includePhoto;
  final bool includeName;

  @override
  Widget build(BuildContext context) {
    final hasPhoto = includePhoto && photoUrl != null && photoUrl!.isNotEmpty;

    final infoColumn = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (includeName)
          Text(userName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF172733))),
        const SizedBox(height: 2),
        Text(
          '$roleLabel · Softinsa',
          style: const TextStyle(fontSize: 12, color: Color(0xFF6b7280), fontWeight: FontWeight.w500),
        ),
        if (userEmail.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(userEmail, style: const TextStyle(color: Color(0xFF2575bd), fontWeight: FontWeight.w600, fontSize: 12)),
        ],
        if (selectedBadges.isNotEmpty) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              shrinkWrap: true,
              itemCount: selectedBadges.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final badge = selectedBadges[i].badge;
                return Tooltip(
                  message: badge.title,
                  child: EmailSignatureBadgeMedalIcon(
                    medalColor: badge.medalColor,
                    ribbonColor: badge.ribbonColor,
                    imageUrl: badge.imageUrl,
                    size: 40,
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );

    if (hasPhoto) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipOval(
            child: Image.network(
              photoUrl!,
              width: 56,
              height: 56,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _AvatarPlaceholder(size: 56),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: infoColumn),
        ],
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _AvatarPlaceholder(size: 48),
        const SizedBox(width: 12),
        Expanded(child: infoColumn),
      ],
    );
  }
}

class _AvatarPlaceholder extends StatelessWidget {
  const _AvatarPlaceholder({required this.size});
  final double size;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: AppColors.primaryContainer,
      child: AppIcon(AppIcons.user, color: AppColors.onPrimaryContainer, size: size * 0.55),
    );
  }
}

class _EmailTemplatePreview extends StatelessWidget {
  const _EmailTemplatePreview({
    required this.userName,
    required this.roleLabel,
    required this.userEmail,
    required this.photoUrl,
    required this.selectedBadges,
    required this.includePhoto,
    required this.includeName,
  });

  final String userName;
  final String roleLabel;
  final String userEmail;
  final String? photoUrl;
  final List<EarnedBadge> selectedBadges;
  final bool includePhoto;
  final bool includeName;

  @override
  Widget build(BuildContext context) {
    final hasPhoto = includePhoto && photoUrl != null && photoUrl!.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          children: [
            if (hasPhoto) ...[
              ClipOval(
                child: Image.network(
                  photoUrl!,
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => _AvatarPlaceholder(size: 48),
                ),
              ),
              const SizedBox(width: 10),
            ],
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (includeName)
                  Text(userName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1f2937))),
                Text('$roleLabel · Softinsa', style: const TextStyle(fontSize: 12, color: Color(0xFF6b7280))),
              ],
            ),
          ],
        ),
        if (selectedBadges.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: selectedBadges.map((eb) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  EmailSignatureBadgeMedalIcon(
                    medalColor: eb.badge.medalColor,
                    ribbonColor: eb.badge.ribbonColor,
                    imageUrl: eb.badge.imageUrl,
                    size: 56,
                  ),
                  const SizedBox(height: 4),
                  SizedBox(
                    width: 72,
                    child: Text(
                      eb.badge.title,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF1f2937)),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
        if (includeName) ...[
          const SizedBox(height: 10),
          Text(userName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1f2937))),
        ],
        if (userEmail.isNotEmpty)
          Text(userEmail, style: const TextStyle(fontSize: 12, color: Color(0xFF2575bd))),
      ],
    );
  }
}

class _InstructionCard extends StatelessWidget {
  const _InstructionCard({required this.icon, required this.title, required this.description});
  final String icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: const BoxDecoration(color: AppColors.primaryContainer, shape: BoxShape.circle),
            child: AppIcon(icon, color: AppColors.secondary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1E2932), fontSize: 15)),
                const SizedBox(height: 4),
                Text(description, style: const TextStyle(color: Color(0xFF5B6773), fontSize: 13, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
