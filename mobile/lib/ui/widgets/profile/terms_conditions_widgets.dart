import 'package:flutter/material.dart';

import '../../../presentation/state/language_controller.dart';

class TermsConditionsContent extends StatelessWidget {
  const TermsConditionsContent({super.key});

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

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
