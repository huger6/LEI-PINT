import 'package:flutter/material.dart';

class TermsConditionsContent extends StatelessWidget {
  const TermsConditionsContent({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionCard(
          title: '1. Aceitação dos Termos',
          body:
              'Ao aceder e utilizar a plataforma Softinsa Badge Platform, '
              'o utilizador concorda em cumprir os presentes Termos e Condições. '
              'Caso não concorde com alguma das condições aqui descritas, '
              'não deverá utilizar a plataforma.',
        ),
        _SectionCard(
          title: '2. Descrição do Serviço',
          body:
              'A Softinsa Badge Platform é um sistema de credenciais digitais '
              'que permite aos consultores da Softinsa acompanhar, validar e '
              'partilhar as suas competências e certificações tecnológicas '
              'através de Learning Paths, Service Lines e Áreas.',
        ),
        _SectionCard(
          title: '3. Registo e Conta',
          body:
              'O utilizador é responsável por manter a confidencialidade das '
              'suas credenciais de acesso. Qualquer atividade realizada na '
              'conta é da responsabilidade do titular. É proibida a partilha '
              'de credenciais com terceiros.',
        ),
        _SectionCard(
          title: '4. Utilização da Plataforma',
          body:
              'A plataforma destina-se exclusivamente a uso profissional no '
              'âmbito das atividades da Softinsa. O utilizador compromete-se a '
              'não utilizar a plataforma para fins ilícitos, não carregar '
              'conteúdos ofensivos ou inadequados e a respeitar a propriedade '
              'intelectual de todos os materiais disponibilizados.',
        ),
        _SectionCard(
          title: '5. Badges e Certificações',
          body:
              'Os badges obtidos representam competências validadas pela '
              'Softinsa. Os pontos acumulados são permanentemente preservados '
              'no perfil do consultor, mesmo que o badge atinja a data de '
              'expiração. Cada credencial obtida gera um URL público único '
              'para verificação externa.',
        ),
        _SectionCard(
          title: '6. Proteção de Dados (RGPD)',
          body:
              'A Softinsa compromete-se a proteger os dados pessoais dos '
              'utilizadores em conformidade com o Regulamento Geral de '
              'Proteção de Dados (RGPD). Os dados recolhidos são utilizados '
              'exclusivamente para o funcionamento da plataforma e não serão '
              'partilhados com terceiros sem o consentimento prévio do '
              'utilizador, exceto quando exigido por lei.',
        ),
        _SectionCard(
          title: '7. Propriedade Intelectual',
          body:
              'Todos os conteúdos, logótipos, design e funcionalidades da '
              'plataforma são propriedade da Softinsa. A reprodução, '
              'distribuição ou modificação de qualquer conteúdo sem '
              'autorização prévia é estritamente proibida.',
        ),
        _SectionCard(
          title: '8. Alterações aos Termos',
          body:
              'A Softinsa reserva-se o direito de modificar os presentes '
              'Termos e Condições a qualquer momento. Os utilizadores serão '
              'notificados de alterações significativas através da plataforma.',
        ),
        _SectionCard(
          title: '9. Contacto',
          body:
              'Para questões relacionadas com estes termos, contacte a equipa '
              'de suporte da Softinsa através dos canais internos disponíveis '
              'na plataforma.',
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            'Última atualização: maio de 2026',
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
