import 'package:flutter/material.dart';

import '../../../core/sync_manager.dart';

class AttachedDocument {
  const AttachedDocument({required this.name, required this.subtitle});

  final String name;
  final String subtitle;
}

class AttachedFilesList extends StatelessWidget {
  const AttachedFilesList({
    super.key,
    required this.files,
    this.readOnly = false,
    this.onDelete,
  });

  final List<AttachedDocument> files;
  final bool readOnly;
  final void Function(int index)? onDelete;

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);

    return Column(
      children: files.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFFFF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFD2DCE6)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.description_outlined, color: Color(0xFF556571)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF1D2A35),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.subtitle,
                      style: const TextStyle(
                        color: Color(0xFF61717F),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: tr.tr('openLink'),
                onPressed: () {},
                icon: const Icon(Icons.link_rounded, color: Color(0xFF556571)),
              ),
              if (!readOnly)
                IconButton(
                  tooltip: tr.tr('removeFile'),
                  onPressed: () => onDelete?.call(index),
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    color: Color(0xFFD45555),
                  ),
                ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
