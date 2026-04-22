import 'package:flutter/material.dart';

class BadgeModel {
  const BadgeModel({
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
