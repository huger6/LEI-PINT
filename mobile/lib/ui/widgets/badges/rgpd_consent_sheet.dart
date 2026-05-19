import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

Future<bool> showRgpdConsentSheet(BuildContext context) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFFF6F7F9),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20.0)),
    ),
    builder: (context) {
      return const _RgpdConsentContent();
    },
  );

  return result ?? false;
}

class _RgpdConsentContent extends StatefulWidget {
  const _RgpdConsentContent();

  @override
  State<_RgpdConsentContent> createState() => _RgpdConsentContentState();
}

class _RgpdConsentContentState extends State<_RgpdConsentContent> {
  bool _accepted = false;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 46,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFD0D5DB),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: Center(
                    child: Text(
                      'Termos de Partilha',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1D2A35),
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context, false),
                  icon: const Icon(Icons.close_rounded),
                  color: const Color(0xFF46535E),
                ),
              ],
            ),
            const Divider(color: Color(0xFFE5E8EC), height: 14),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E8EC)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Consentimento RGPD para Partilha de Badge',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1D2A35),
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'Ao partilhar o seu badge na plataforma LinkedIn, os seguintes '
                    'dados serão disponibilizados publicamente:',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF46535E),
                      height: 1.5,
                    ),
                  ),
                  SizedBox(height: 10),
                  _BulletItem(text: 'Nome do badge obtido'),
                  _BulletItem(text: 'Link público de verificação'),
                  _BulletItem(text: 'Data de obtenção do badge'),
                  _BulletItem(text: 'O seu nome associado à credencial'),
                  SizedBox(height: 12),
                  Text(
                    'Os seus dados pessoais serão tratados em conformidade com o '
                    'Regulamento Geral sobre a Proteção de Dados (RGPD). '
                    'Poderá revogar este consentimento a qualquer momento '
                    'através das definições do seu perfil.',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF46535E),
                      height: 1.5,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'A Softinsa não partilha os seus dados com terceiros para '
                    'fins de marketing. O link de verificação serve exclusivamente '
                    'para validar a autenticidade da credencial.',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF46535E),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    value: _accepted,
                    onChanged: (value) {
                      setState(() {
                        _accepted = value ?? false;
                      });
                    },
                    activeColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _accepted = !_accepted;
                      });
                    },
                    child: const Text(
                      'Li e aceito os termos de partilha de dados e a política '
                      'de privacidade da Softinsa.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF1D2A35),
                        height: 1.4,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _accepted ? () => Navigator.pop(context, true) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  disabledBackgroundColor: const Color(0xFFD0D5DB),
                  foregroundColor: AppColors.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                child: const Text('Aceitar e Continuar'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BulletItem extends StatelessWidget {
  const _BulletItem({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6, right: 8),
            child: Icon(
              Icons.circle,
              size: 6,
              color: Color(0xFF46535E),
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF46535E),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
