import 'package:flutter/material.dart';

import '../core/utils/badge_visuals.dart';

class BadgeModel {
  const BadgeModel({
    this.id = 0,
    this.slug = '',
    required this.title,
    required this.category,
    required this.points,
    required this.level,
    required this.duration,
    required this.medalColor,
    required this.ribbonColor,
    required this.description,
    required this.skills,
    required this.attributes,
    required this.requirements,
  });

  factory BadgeModel.empty({required String title}) {
    final seed = title.trim().isEmpty ? 'badge' : title;
    return BadgeModel(
      id: 0,
      slug: '',
      title: title,
      category: '',
      points: 0,
      level: '',
      duration: '',
      medalColor: BadgeVisuals.medalColor(seed),
      ribbonColor: BadgeVisuals.ribbonColor(seed),
      description: '',
      skills: const [],
      attributes: const [],
      requirements: const [],
    );
  }

  factory BadgeModel.fromApiSummary(Map<String, dynamic> json) {
    final seed = _readString(json, const [
      'badge_slug',
      'slug',
      'badge_id',
      'id',
      'badge_title',
      'title',
    ]);

    final area = _readNestedString(json, const [
      'area',
      'area_name',
    ], fallback: _readString(json, const ['area_name', 'category']));
    final stageCode = _readNestedString(
      json,
      const ['stage_code', 'stage_code'],
      fallback: _readNestedString(json, const [
        'progression_stage',
        'stage_code',
        'stage_code',
      ]),
    );

    final points = _readInt(json, const ['badge_points', 'points']);

    return BadgeModel(
      id: _readInt(json, const ['badge_id', 'id']),
      slug: _readString(json, const ['badge_slug', 'slug']),
      title: _readString(json, const ['badge_title', 'title', 'name']),
      category: area,
      points: points,
      level: stageCode,
      duration: _readString(json, const ['estimated_duration', 'duration']),
      medalColor: BadgeVisuals.medalColor(seed),
      ribbonColor: BadgeVisuals.ribbonColor(seed),
      description: _readString(json, const [
        'badge_description',
        'description',
      ]),
      skills: _extractStringList(json['skills']),
      attributes: _buildAttributes(
        area: area,
        points: points,
        stageCode: stageCode,
      ),
      requirements: _extractRequirements(json),
    );
  }

  factory BadgeModel.fromApiDetail(Map<String, dynamic> json) {
    final summary = BadgeModel.fromApiSummary(json);

    final skills = _extractStringList(json['skills']);
    final requirements = _extractRequirements(json);

    return BadgeModel(
      id: summary.id,
      slug: summary.slug,
      title: summary.title,
      category: summary.category,
      points: summary.points,
      level: summary.level,
      duration: summary.duration,
      medalColor: summary.medalColor,
      ribbonColor: summary.ribbonColor,
      description: summary.description,
      skills: skills,
      attributes: summary.attributes,
      requirements: requirements,
    );
  }

  final int id;
  final String slug;
  final String title;
  final String category;
  final int points;
  final String level;
  final String duration;
  final Color medalColor;
  final Color ribbonColor;
  final String description;
  final List<String> skills;
  final List<BadgeAttribute> attributes;
  final List<BadgeRequirement> requirements;

  static List<BadgeAttribute> _buildAttributes({
    required String area,
    required int points,
    required String stageCode,
  }) {
    final attributes = <BadgeAttribute>[];

    if (area.trim().isNotEmpty) {
      attributes.add(
        BadgeAttribute(
          icon: Icons.category_outlined,
          label: 'Area',
          value: area,
        ),
      );
    }

    if (points > 0) {
      attributes.add(
        BadgeAttribute(
          icon: Icons.emoji_events_outlined,
          label: 'Pontos',
          value: points.toString(),
        ),
      );
    }

    if (stageCode.trim().isNotEmpty) {
      attributes.add(
        BadgeAttribute(
          icon: Icons.stairs_outlined,
          label: 'Nivel',
          value: stageCode,
        ),
      );
    }

    return attributes;
  }

  static List<BadgeRequirement> _extractRequirements(
    Map<String, dynamic> json,
  ) {
    final raw = json['badge_requirements'];
    if (raw is! List) {
      return const [];
    }

    return raw
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .map((item) {
          final text = _readString(item, const [
            'requirement_title',
            'title',
            'requirement_text',
          ]);
          return BadgeRequirement(icon: Icons.task_alt_outlined, text: text);
        })
        .where((item) => item.text.trim().isNotEmpty)
        .toList();
  }

  static List<String> _extractStringList(dynamic raw) {
    if (raw is! List) {
      return const [];
    }

    return raw
        .map((item) => item.toString().trim())
        .where((text) => text.isNotEmpty)
        .toList();
  }

  static String _readString(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value != null) {
        final text = value.toString().trim();
        if (text.isNotEmpty) {
          return text;
        }
      }
    }

    return '';
  }

  static String _readNestedString(
    Map<String, dynamic> json,
    List<String> keys, {
    String fallback = '',
  }) {
    dynamic current = json;
    for (final key in keys) {
      if (current is Map && current[key] != null) {
        current = current[key];
      } else {
        return fallback;
      }
    }

    final text = current.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  static int _readInt(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value is int) {
        return value;
      }
      if (value is num) {
        return value.toInt();
      }

      final parsed = int.tryParse(value?.toString() ?? '');
      if (parsed != null) {
        return parsed;
      }
    }

    return 0;
  }
}

class BadgeAttribute {
  const BadgeAttribute({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;
}

class BadgeRequirement {
  const BadgeRequirement({required this.icon, required this.text});

  final IconData icon;
  final String text;
}
