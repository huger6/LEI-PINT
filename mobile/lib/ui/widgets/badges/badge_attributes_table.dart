import 'package:flutter/material.dart';

import '../../models/badge_model.dart';

class BadgeAttributesTable extends StatelessWidget {
  const BadgeAttributesTable({
    super.key,
    required this.attributes,
    this.rowSpacing = 12,
  });

  final List<BadgeAttribute> attributes;
  final double rowSpacing;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: attributes
          .map(
            (attribute) => Padding(
              padding: EdgeInsets.only(bottom: rowSpacing),
              child: Row(
                children: [
                  Icon(
                    attribute.icon,
                    size: 24,
                    color: const Color(0xFF4C565E),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      attribute.label,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF1F252A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    attribute.value,
                    style: const TextStyle(
                      color: Color(0xFF4A67A3),
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
