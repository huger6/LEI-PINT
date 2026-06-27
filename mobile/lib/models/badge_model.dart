import 'package:flutter/material.dart';

import '../core/utils/badge_visuals.dart';
import 'skill_model.dart';
import '../ui/widgets/shared/app_icon/app_icon_data.dart';

class BadgeModel {
  const BadgeModel({
    this.id = 0,
    this.slug = '',
    this.badgeType = 'Standard',
    required this.title,
    required this.category,
    required this.points,
    required this.level,
    required this.duration,
    this.expirationDays,
    this.createdAt,
    required this.medalColor,
    required this.ribbonColor,
    required this.description,
    this.imageUrl,
    this.serviceLine,
    this.learningPath,
    this.skills = const [],
    this.rewards = const [],
    required this.attributes,
    required this.requirements,
  });

  bool get isSpecial => badgeType.toLowerCase() == 'special';

  factory BadgeModel.empty({required String title}) {
    final seed = title.trim().isEmpty ? 'badge' : title;
    return BadgeModel(
      id: 0,
      slug: '',
      badgeType: 'Standard',
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
    // "Level" is the progression stage of the area (e.g. "Júnior",
    // "Intermédio", "Sénior"). We prefer the readable stage title and only
    // fall back to the raw stage code letter when the title is unavailable.
    final stageCode = _readNestedString(
      json,
      const ['progression_stage', 'stage_title'],
      fallback: _readNestedString(
        json,
        const ['progression_stage', 'stage_code', 'stage_code'],
        fallback: _readString(json, const ['stage_title', 'stage_code']),
      ),
    );

    final points = _readInt(json, const ['badge_points', 'points']);

    final badgeType = _readString(json, const ['badge_type']);

    final expDays = json['expiration_duration_days'] ?? json['expirationDays'];
    final createdRaw = json['created_at'] ?? json['createdAt'];

    final imgUrl = _readString(json, const ['badge_img_url', 'imageUrl', 'image_url']);
    final slName = _readNestedString(json, const ['service_line', 'service_line_name'],
        fallback: _readString(json, const ['service_line_name']));
    final lpName = _readNestedString(json, const ['learning_path', 'learning_path_title'],
        fallback: _readString(json, const ['learning_path_title']));

    return BadgeModel(
      id: _readInt(json, const ['badge_id', 'id']),
      slug: _readString(json, const ['badge_slug', 'slug']),
      badgeType: badgeType.isEmpty ? 'Standard' : badgeType,
      title: _readString(json, const ['badge_title', 'title', 'name']),
      category: area,
      points: points,
      level: stageCode,
      duration: _readString(json, const ['estimated_duration', 'duration', 'estimated_time_to_acquire']),
      expirationDays: expDays is int ? expDays : (int.tryParse(expDays?.toString() ?? '')),
      createdAt: createdRaw != null ? DateTime.tryParse(createdRaw.toString()) : null,
      medalColor: BadgeVisuals.medalColor(seed),
      ribbonColor: BadgeVisuals.ribbonColor(seed),
      description: _readString(json, const [
        'badge_description',
        'description',
      ]),
      imageUrl: imgUrl.isEmpty ? null : imgUrl,
      serviceLine: slName.isEmpty ? null : slName,
      learningPath: lpName.isEmpty ? null : lpName,
      skills: _extractSkills(json['skills']),
      rewards: _extractRewards(json['rewards']),
      attributes: buildAttributes(
        area: area,
        points: points,
        stageCode: stageCode,
        duration: _readString(json, const ['estimated_duration', 'duration', 'estimated_time_to_acquire']),
      ),
      requirements: _extractRequirements(json),
    );
  }

  factory BadgeModel.fromApiDetail(Map<String, dynamic> json) {
    final summary = BadgeModel.fromApiSummary(json);

    final skills = _extractSkills(json['skills']);
    final rewards = _extractRewards(json['rewards']);
    final requirements = _extractRequirements(json);

    return BadgeModel(
      id: summary.id,
      slug: summary.slug,
      badgeType: summary.badgeType,
      title: summary.title,
      category: summary.category,
      points: summary.points,
      level: summary.level,
      duration: summary.duration,
      expirationDays: summary.expirationDays,
      createdAt: summary.createdAt,
      medalColor: summary.medalColor,
      ribbonColor: summary.ribbonColor,
      description: summary.description,
      imageUrl: summary.imageUrl,
      serviceLine: summary.serviceLine,
      learningPath: summary.learningPath,
      skills: skills,
      rewards: rewards,
      attributes: summary.attributes,
      requirements: requirements,
    );
  }

  final int id;
  final String slug;
  final String badgeType;
  final String title;
  final String category;
  final int points;
  final String level;
  final String duration;
  final int? expirationDays;
  final DateTime? createdAt;
  final Color medalColor;
  final Color ribbonColor;
  final String description;
  final String? imageUrl;
  final String? serviceLine;
  final String? learningPath;
  final List<SkillModel> skills;
  final List<BadgeReward> rewards;
  final List<BadgeAttribute> attributes;
  final List<BadgeRequirement> requirements;

  static List<BadgeAttribute> buildAttributes({
    required String area,
    required int points,
    required String stageCode,
    required String duration,
  }) {
    final attributes = <BadgeAttribute>[];

    if (area.trim().isNotEmpty) {
      attributes.add(
        BadgeAttribute(
          icon: AppIcons.area,
          label: 'area',
          value: area,
        ),
      );
    }

    if (points > 0) {
      attributes.add(
        BadgeAttribute(
          icon: AppIcons.trophy,
          label: 'points',
          value: points.toString(),
        ),
      );
    }

    if (stageCode.trim().isNotEmpty) {
      attributes.add(
        BadgeAttribute(
          icon: AppIcons.ranking,
          label: 'level',
          value: stageCode,
        ),
      );
    }

    if (duration.trim().isNotEmpty) {
      attributes.add(
        BadgeAttribute(
          icon: AppIcons.time,
          label: 'duration',
          value: duration,
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
          final id = _readInt(item, const [
            'requirement_id',
            'id',
          ]);
          return BadgeRequirement(
            id: id > 0 ? id : null,
            icon: AppIcons.checkCircle,
            text: text,
          );
        })
        .where((item) => item.text.trim().isNotEmpty)
        .toList();
  }

  static List<BadgeReward> _extractRewards(dynamic raw) {
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((item) => BadgeReward.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  static List<SkillModel> _extractSkills(dynamic raw) {
    if (raw is! List) return const [];

    return raw.map((item) {
      if (item is Map) {
        return SkillModel.fromJson(Map<String, dynamic>.from(item));
      }
      final name = item.toString().trim();
      if (name.isEmpty) return null;
      return SkillModel(id: 0, name: name);
    }).whereType<SkillModel>().toList();
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

  final String icon;
  final String label;
  final String value;
}

class BadgeRequirement {
  const BadgeRequirement({this.id, required this.icon, required this.text});

  final int? id;
  final String icon;
  final String text;
}

class BadgeReward {
  const BadgeReward({
    required this.rewardId,
    this.specialTitle,
  });

  final int rewardId;
  final String? specialTitle;

  factory BadgeReward.fromJson(Map<String, dynamic> json) {
    return BadgeReward(
      rewardId: json['reward_id'] as int? ?? 0,
      specialTitle: json['special_title']?.toString(),
    );
  }
}
