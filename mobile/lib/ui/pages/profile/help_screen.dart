import 'package:flutter/material.dart';

import '../../widgets/shared/app_bottom_nav_bar.dart';
import '../../widgets/profile/help_widgets.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  static const _sections = [
    _HelpEntry(
      icon: Icons.dashboard_outlined,
      title: 'Dashboard',
      description:
          'O Dashboard é a sua página inicial. Aqui pode ver um resumo das suas atividades, '
          'anúncios recentes, o seu progresso e ranking geral da plataforma.',
    ),
    _HelpEntry(
      icon: Icons.explore_outlined,
      title: 'Explorar Competências',
      description:
          'Nesta secção pode navegar por todos os badges disponíveis na plataforma. '
          'Utilize os filtros para pesquisar por área, nível, pontos ou data. '
          'Toque num badge para ver os detalhes e iniciar uma candidatura.',
    ),
    _HelpEntry(
      icon: Icons.workspace_premium_outlined,
      title: 'Os Meus Badges',
      description:
          'Consulte os badges que já obteve no separador "Badges Obtidos" e '
          'acompanhe o estado das suas candidaturas no separador "Candidaturas". '
          'Pode partilhar ou transferir badges obtidos.',
    ),
    _HelpEntry(
      icon: Icons.trending_up_outlined,
      title: 'Evolução',
      description:
          'A secção de Evolução mostra o seu progresso ao longo do tempo: '
          'pontos acumulados, badges conquistados e a sua posição no ranking. '
          'Acompanhe o crescimento da sua jornada técnica.',
    ),
    _HelpEntry(
      icon: Icons.person_outline_rounded,
      title: 'Perfil',
      description:
          'No seu perfil pode ver e editar as suas informações pessoais, '
          'alterar o idioma da aplicação, consultar as suas características, '
          'gerir a assinatura de email e aceder às definições da conta.',
    ),
    _HelpEntry(
      icon: Icons.description_outlined,
      title: 'Candidaturas',
      description:
          'Para obter um badge, inicie uma candidatura na página de detalhes do badge. '
          'Anexe as evidências necessárias (ficheiros, certificados) e submeta. '
          'A candidatura será avaliada pelo Talent Manager e depois pelo Service Line Leader.',
    ),
    _HelpEntry(
      icon: Icons.notifications_none_rounded,
      title: 'Notificações',
      description:
          'Receba alertas sobre o estado das suas candidaturas, badges a expirar, '
          'e outras atualizações relevantes. Pode marcar notificações como lidas '
          'individualmente ou todas de uma vez.',
    ),
    _HelpEntry(
      icon: Icons.share_outlined,
      title: 'Partilha de Badges',
      description:
          'Após obter um badge, pode partilhá-lo publicamente. '
          'Na primeira partilha será pedido o consentimento GDPR. '
          'Os badges partilhados ficam acessíveis através de um link público de verificação.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        title: const Text(
          'Ajuda',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E2932),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E2932)),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF5D9FD1), Color(0xFF3A7BB8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  children: [
                    Icon(
                      Icons.help_outline_rounded,
                      color: Colors.white,
                      size: 48,
                    ),
                    SizedBox(height: 10),
                    Text(
                      'Como posso ajudá-lo?',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Explore as funcionalidades da aplicação '
                      'e saiba como tirar o melhor partido da plataforma.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Funcionalidades',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E2932),
                ),
              ),
              const SizedBox(height: 12),
              ..._sections.map(
                (entry) => HelpSection(
                  icon: entry.icon,
                  title: entry.title,
                  description: entry.description,
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavBar(currentTab: AppTab.profile),
    );
  }
}

class _HelpEntry {
  const _HelpEntry({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;
}
