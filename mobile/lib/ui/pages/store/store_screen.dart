import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../presentation/state/auth_store.dart';
import '../../../presentation/state/language_controller.dart';
import '../../../presentation/state/reward_store.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';
import '../../widgets/store/redemption_list_item.dart';
import '../../widgets/store/reward_card.dart';

class StoreScreen extends StatefulWidget {
  const StoreScreen({super.key});

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RewardStore>().loadAll();
      context.read<AuthStore>().fetchPoints();
    });
  }

  Future<void> _confirmRedeem(RewardStore store, String rewardGuid,
      String name, int cost, String? category, LanguageController tr) async {
    final isTitle = category?.toLowerCase() == 'title';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(tr.tr('storeConfirmTitle')),
        content: Text(
          tr
              .tr('storeConfirmText')
              .replaceAll('{name}', tr.tr(name))
              .replaceAll('{cost}', cost.toString()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr.tr('cancel')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(tr.tr('storeRedeem')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      final result = await store.redeemReward(rewardGuid);
      if (!mounted) return;
      context.read<AuthStore>().fetchPoints();
      final displayName = tr.tr(result['name']?.toString() ?? name);
      _showSuccessDialog(
        displayName,
        result['accessLink']?.toString(),
        result['accessInfo']?.toString(),
        isTitle: isTitle,
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(store.errorMessage ?? ''),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showSuccessDialog(
      String name, String? accessLink, String? accessInfo,
      {bool isTitle = false}) {
    final tr = LanguageScope.of(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            AppIcon(
              isTitle ? AppIcons.certificate : AppIcons.checkCircle,
              size: 28,
              color: isTitle ? const Color(0xFF7B1FA2) : AppColors.success,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                isTitle
                    ? tr.tr('storeTitleUnlockedTitle')
                    : tr.tr('storeSuccessTitle'),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isTitle
                  ? tr.tr('storeTitleUnlockedText').replaceAll('{name}', name)
                  : tr.tr('storeSuccessText').replaceAll('{name}', name),
            ),
            if (isTitle) ...[
              const SizedBox(height: 10),
              Text(
                tr.tr('storeTitleUnlockedHint'),
                style: const TextStyle(fontSize: 13, color: AppColors.bodyText),
              ),
            ],
            if (!isTitle && accessInfo != null && accessInfo.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(accessInfo,
                  style: const TextStyle(fontSize: 13, color: AppColors.bodyText)),
            ],
            if (!isTitle) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const AppIcon(AppIcons.email,
                      size: 14, color: AppColors.outline),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      tr.tr('storeEmailNote'),
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.outline),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final store = context.watch<RewardStore>();
    final authStore = context.watch<AuthStore>();
    final balance = authStore.currentUser?.totalPoints ?? 0;

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      body: SafeArea(
        child: store.isLoading && store.rewards.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: () => store.loadAll(),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                  children: [
                    _buildHeader(tr, balance),
                    const SizedBox(height: 16),
                    if (store.availableRewards.isEmpty)
                      _buildEmpty(tr)
                    else
                      ...store.availableRewards.map(
                        (r) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: RewardCard(
                            reward: r,
                            affordable: balance >= r.costPoints,
                            onRedeem: () => _confirmRedeem(
                                store, r.rewardGuid, r.rewardName,
                                r.costPoints, r.rewardCategory, tr),
                          ),
                        ),
                      ),
                    if (store.redemptions.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _buildRedemptionHistory(tr, store),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildHeader(LanguageController tr, int balance) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                tr.tr('storeTitle'),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.titleDark,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                tr.tr('storeSubtitle'),
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.bodyText,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 6,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const AppIcon(AppIcons.starPoints,
                  size: 18, color: AppColors.warning),
              const SizedBox(width: 6),
              Text(
                balance.toString(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.titleDark,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEmpty(LanguageController tr) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Text(
          tr.tr('storeEmpty'),
          style: const TextStyle(fontSize: 14, color: AppColors.bodyText),
        ),
      ),
    );
  }

  Widget _buildRedemptionHistory(LanguageController tr, RewardStore store) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.secondaryContainer,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const AppIcon(AppIcons.time,
                    size: 20, color: AppColors.secondary),
              ),
              const SizedBox(width: 10),
              Text(
                tr.tr('storeMyRedemptions'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.titleDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...store.redemptions
              .map((r) => RedemptionListItem(redemption: r)),
        ],
      ),
    );
  }
}
