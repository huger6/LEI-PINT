import 'package:flutter/material.dart';

import '../../../models/badge_model.dart';

class BadgeCatalog {
  static final List<BadgeModel> all = [
    BadgeModel(
      title: 'Master of sprints',
      category: 'Agile',
      points: 220,
      level: 'Intermédio',
      duration: '3 meses',
      medalColor: const Color(0xFFD2D5DA),
      ribbonColor: const Color(0xFFAF5353),
      description: 'Entrega consistente em ciclos curtos.',
      skills: const ['Scrum', 'Planning', 'Delivery'],
      attributes: const [
        BadgeAttribute(
          icon: Icons.flag_outlined,
          label: 'Formato',
          value: 'Sprint',
        ),
        BadgeAttribute(
          icon: Icons.emoji_events_outlined,
          label: 'Pontos',
          value: '220',
        ),
      ],
      requirements: const [
        BadgeRequirement(
          icon: Icons.task_alt_outlined,
          text: 'Participar em 3 sprints',
        ),
        BadgeRequirement(
          icon: Icons.task_alt_outlined,
          text: 'Entregar 2 histórias por sprint',
        ),
      ],
    ),
    BadgeModel(
      title: 'Master of DevOps',
      category: 'Cloud',
      points: 310,
      level: 'Avançado',
      duration: '6 meses',
      medalColor: const Color(0xFFDFC24C),
      ribbonColor: const Color(0xFF5B84D6),
      description: 'Domínio em integração e entrega contínua.',
      skills: const ['CI/CD', 'Automation', 'Kubernetes'],
      attributes: const [
        BadgeAttribute(
          icon: Icons.cloud_outlined,
          label: 'Área',
          value: 'DevOps',
        ),
        BadgeAttribute(
          icon: Icons.emoji_events_outlined,
          label: 'Pontos',
          value: '310',
        ),
      ],
      requirements: const [
        BadgeRequirement(
          icon: Icons.task_alt_outlined,
          text: 'Implementar pipeline CI/CD',
        ),
        BadgeRequirement(
          icon: Icons.task_alt_outlined,
          text: 'Automatizar deploys',
        ),
      ],
    ),
    BadgeModel(
      title: 'IBM Front-End Dev',
      category: 'Frontend',
      points: 180,
      level: 'Iniciante',
      duration: '2 meses',
      medalColor: const Color(0xFFC4C6D6),
      ribbonColor: const Color(0xFF5B84D6),
      description: 'Componentes visuais consistentes e responsivos.',
      skills: const ['Flutter', 'UI', 'Responsive'],
      attributes: const [
        BadgeAttribute(
          icon: Icons.devices_outlined,
          label: 'Canal',
          value: 'Front-end',
        ),
        BadgeAttribute(
          icon: Icons.emoji_events_outlined,
          label: 'Pontos',
          value: '180',
        ),
      ],
      requirements: const [
        BadgeRequirement(
          icon: Icons.task_alt_outlined,
          text: 'Criar 1 interface responsiva',
        ),
      ],
    ),
    BadgeModel(
      title: 'Data Explorer',
      category: 'Data',
      points: 260,
      level: 'Intermédio',
      duration: '4 meses',
      medalColor: const Color(0xFFB9C4E9),
      ribbonColor: const Color(0xFF7B4DE4),
      description: 'Exploração e leitura de métricas com foco em insights.',
      skills: const ['SQL', 'Dashboards', 'Reporting'],
      attributes: const [
        BadgeAttribute(
          icon: Icons.query_stats_outlined,
          label: 'Área',
          value: 'Data',
        ),
        BadgeAttribute(
          icon: Icons.emoji_events_outlined,
          label: 'Pontos',
          value: '260',
        ),
      ],
      requirements: const [
        BadgeRequirement(
          icon: Icons.task_alt_outlined,
          text: 'Criar 2 relatórios',
        ),
      ],
    ),
  ];

  static List<BadgeModel> recommended() => all.take(3).toList(growable: false);
}
