import 'package:dotted_border/dotted_border.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../models/badge_model.dart';
import '../widgets/badge/attached_files_list.dart';
import 'candidatura_status_screen.dart';

class ApplicationScreen extends StatefulWidget {
  const ApplicationScreen({super.key, required this.badge});

  final BadgeModel badge;

  @override
  State<ApplicationScreen> createState() => _ApplicationScreenState();
}

class _ApplicationScreenState extends State<ApplicationScreen> {
  bool isTermsAccepted = false;
  final List<AttachedDocument> attachedFiles = [];
  late final List<String> _requirements;

  @override
  void initState() {
    super.initState();
    _requirements = widget.badge.requirements.map((item) => item.text).toList();

    if (_requirements.isEmpty) {
      _requirements.add('Sem requisito associado');
    }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.any,
      withData: false,
    );

    if (result == null) {
      return;
    }

    setState(() {
      for (final file in result.files) {
        attachedFiles.add(
          AttachedDocument(
            name: file.name,
            subtitle: 'Associado a todos os requisitos da badge',
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = isTermsAccepted;

    return Scaffold(
      backgroundColor: _ApplicationColors.pageBackground,
      appBar: AppBar(
        title: const Text('Candidatura'),
        elevation: 0,
        backgroundColor: _ApplicationColors.pageBackground,
        foregroundColor: _ApplicationColors.primaryText,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionTitle(number: 1, title: 'Badge selecionado'),
            const SizedBox(height: 10),
            _CardContainer(child: _SelectedBadgeCard(badge: widget.badge)),

            const SizedBox(height: 18),
            _SectionTitle(number: 2, title: 'Enviar evidências'),
            const SizedBox(height: 10),
            _buildAttachBox(),
            const SizedBox(height: 10),
            if (attachedFiles.isNotEmpty)
              AttachedFilesList(
                files: attachedFiles,
                onDelete: (index) {
                  setState(() => attachedFiles.removeAt(index));
                },
              ),
            _CardContainer(
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                collapsedIconColor: _ApplicationColors.secondaryText,
                iconColor: _ApplicationColors.secondaryText,
                title: const Text(
                  'Requisitos',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: _ApplicationColors.primaryText,
                  ),
                ),
                children: _requirements
                    .map(
                      (item) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(
                          Icons.check_circle_outline_rounded,
                          color: _ApplicationColors.primaryAction,
                          size: 20,
                        ),
                        title: Text(
                          item,
                          style: const TextStyle(
                            color: _ApplicationColors.primaryText,
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),

            const SizedBox(height: 18),
            _SectionTitle(number: 3, title: 'Termos e Condições'),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: _ApplicationColors.cardBackground,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: _ApplicationColors.cardBorder),
              ),
              child: Column(
                children: [
                  CheckboxListTile(
                    value: isTermsAccepted,
                    activeColor: _ApplicationColors.primaryAction,
                    onChanged: (value) {
                      setState(() => isTermsAccepted = value ?? false);
                    },
                    title: RichText(
                      text: const TextSpan(
                        style: TextStyle(
                          color: _ApplicationColors.secondaryText,
                          fontSize: 14,
                        ),
                        children: [
                          TextSpan(text: 'Aceito os '),
                          TextSpan(
                            text: 'termos e condições',
                            style: TextStyle(
                              color: _ApplicationColors.primaryAction,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          TextSpan(text: ' e a '),
                          TextSpan(
                            text: 'política de privacidade',
                            style: TextStyle(
                              color: _ApplicationColors.primaryAction,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          TextSpan(text: '.'),
                        ],
                      ),
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  const Padding(
                    padding: EdgeInsets.fromLTRB(14, 0, 14, 12),
                    child: Text(
                      'Ao submeter esta candidatura, confirma que as evidências são verdadeiras e autorizas a validação pela equipa responsável.',
                      style: TextStyle(
                        fontSize: 12,
                        height: 1.35,
                        color: _ApplicationColors.mutedText,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),
            _SectionTitle(number: 4, title: 'Submissão'),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: canSubmit
                    ? () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => CandidaturaStatusScreen(
                              badge: widget.badge,
                              attachedFiles: attachedFiles,
                            ),
                          ),
                        );
                      }
                    : null,
                icon: const Icon(Icons.check_circle_outline_rounded),
                label: const Text('Submeter'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  backgroundColor: _ApplicationColors.primaryAction,
                  disabledBackgroundColor: _ApplicationColors.buttonDisabled,
                  foregroundColor: Colors.white,
                  disabledForegroundColor: Colors.white70,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachBox() {
    return DottedBorder(
      color: _ApplicationColors.dashedBorder,
      borderType: BorderType.RRect,
      radius: const Radius.circular(14),
      dashPattern: const [7, 4],
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: _pickFiles,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
          decoration: BoxDecoration(
            color: _ApplicationColors.cardBackground,
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Row(
            children: [
              Icon(
                Icons.attach_file_rounded,
                color: _ApplicationColors.iconMuted,
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Anexar ficheiro',
                  style: TextStyle(
                    color: _ApplicationColors.secondaryText,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Icon(
                Icons.upload_file_rounded,
                color: _ApplicationColors.iconMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.number, required this.title});

  final int number;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 13,
          backgroundColor: _ApplicationColors.primaryAction,
          child: Text(
            number.toString(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: _ApplicationColors.primaryText,
          ),
        ),
      ],
    );
  }
}

class _SelectedBadgeCard extends StatelessWidget {
  const _SelectedBadgeCard({required this.badge});

  final BadgeModel badge;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        _SelectedBadgeMedal(
          medalColor: badge.medalColor,
          ribbonColor: badge.ribbonColor,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                badge.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: _ApplicationColors.primaryText,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${badge.category} • ${badge.level}',
                style: const TextStyle(
                  color: _ApplicationColors.mutedText,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        const Icon(
          Icons.lock_outline_rounded,
          color: _ApplicationColors.iconMuted,
          size: 16,
        ),
      ],
    );
  }
}

class _SelectedBadgeMedal extends StatelessWidget {
  const _SelectedBadgeMedal({
    required this.medalColor,
    required this.ribbonColor,
  });

  final Color medalColor;
  final Color ribbonColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 58,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 27,
            child: Row(
              children: [
                Icon(Icons.bookmark, color: ribbonColor, size: 15),
                const SizedBox(width: 2),
                Icon(Icons.bookmark, color: ribbonColor, size: 15),
              ],
            ),
          ),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: medalColor,
              border: Border.all(color: const Color(0xFF876E2C), width: 1.2),
            ),
            child: const Icon(
              Icons.star_rounded,
              color: Color(0xFFFFF6C7),
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}

class _CardContainer extends StatelessWidget {
  const _CardContainer({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: _ApplicationColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _ApplicationColors.cardBorder),
      ),
      child: child,
    );
  }
}

class _ApplicationColors {
  static const Color pageBackground = Color(0xFFE8EEF3);
  static const Color cardBackground = Colors.white;
  static const Color inputBackground = Color(0xFFF5F8FB);
  static const Color cardBorder = Color(0xFFD2DCE6);
  static const Color dashedBorder = Color(0xFF9DB3C6);
  static const Color primaryAction = Color(0xFF5EAEDC);
  static const Color chipSelected = Color(0xFFE3F1FB);
  static const Color buttonDisabled = Color(0xFFAFC4D3);
  static const Color primaryText = Color(0xFF1D2A35);
  static const Color secondaryText = Color(0xFF394B59);
  static const Color mutedText = Color(0xFF61717F);
  static const Color iconMuted = Color(0xFF556571);
  static const Color danger = Color(0xFFD45555);
}
