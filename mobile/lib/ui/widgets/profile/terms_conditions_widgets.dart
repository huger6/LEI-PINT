import 'package:flutter/material.dart';

import '../../../core/database/database_helper.dart';
import '../../../data/local/gdpr_policy_dao.dart';
import '../../../injection_container.dart';
import '../../../models/gdpr_policy_model.dart';
import '../../../presentation/state/language_controller.dart';

class TermsConditionsContent extends StatefulWidget {
  const TermsConditionsContent({super.key});

  @override
  State<TermsConditionsContent> createState() => _TermsConditionsContentState();
}

class _TermsConditionsContentState extends State<TermsConditionsContent> {
  List<GdprPolicyModel>? _policies;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPolicies();
  }

  Future<void> _loadPolicies() async {
    final dao = GdprPolicyDao(getIt<LocalDatabase>());
    final policies = await dao.getAll();
    if (mounted) {
      setState(() {
        _policies = policies;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_policies != null && _policies!.isNotEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final policy in _policies!)
            _SectionCard(
              title: _policyTypeLabel(policy.policyType, tr),
              body: policy.policyText,
            ),
          const SizedBox(height: 8),
          if (_policies!.first.createdAt != null)
            Center(
              child: Text(
                '${tr.tr('termsLastUpdate')}: ${_formatDate(_policies!.first.createdAt!)}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 1; i <= 9; i++)
          _SectionCard(
            title: tr.tr('termsSection${i}Title'),
            body: tr.tr('termsSection${i}Body'),
          ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            tr.tr('termsLastUpdate'),
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[500],
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  String _policyTypeLabel(String type, dynamic tr) {
    switch (type) {
      case 'Privacy':
        return tr.tr('policyTypePrivacy');
      case 'Terms':
        return tr.tr('policyTypeTerms');
      case 'Cookies':
        return tr.tr('policyTypeCookies');
      default:
        return type;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1E2932),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
              color: Color(0xFF4A5662),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
