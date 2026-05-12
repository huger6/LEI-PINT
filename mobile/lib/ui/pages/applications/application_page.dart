import 'package:dotted_border/dotted_border.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/sync_manager.dart';
import '../../../models/badge_model.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/badges/attached_files_list.dart';
import '../../widgets/applications/application_page_widgets.dart';
import 'success_submission_screen.dart';

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

  static const String _fallbackConfirmationEmail = 'jorge.jesus@softinsa.pt';

  @override
  void initState() {
    super.initState();
    _requirements = widget.badge.requirements.map((item) => item.text).toList();
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.pickFiles(
      allowMultiple: true,
      type: FileType.any,
      withData: false,
    );

    if (result == null) {
      return;
    }

    if (!mounted) {
      return;
    }

    final tr = LanguageScope.of(context);

    setState(() {
      for (final file in result.files) {
        attachedFiles.add(
          AttachedDocument(
            name: file.name,
            subtitle: tr.tr('applicationAttachedFileSubtitle'),
          ),
        );
      }
    });
  }

  String _resolveConfirmationEmail() {
    final userEmail = context.read<AuthStore>().currentUser?.email.trim();
    if (userEmail != null && userEmail.isNotEmpty) {
      return userEmail;
    }

    return _fallbackConfirmationEmail;
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final canSubmit = isTermsAccepted && attachedFiles.isNotEmpty;

    return Scaffold(
      backgroundColor: ApplicationColors.pageBackground,
      appBar: AppBar(
        title: Text(tr.tr('applicationTitle')),
        elevation: 0,
        backgroundColor: ApplicationColors.pageBackground,
        foregroundColor: ApplicationColors.primaryText,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ApplicationSectionTitle(
              number: 1,
              title: tr.tr('applicationSectionBadge'),
            ),
            const SizedBox(height: 10),
            ApplicationCardContainer(
              child: SelectedBadgeCard(badge: widget.badge),
            ),

            const SizedBox(height: 18),
            ApplicationSectionTitle(
              number: 2,
              title: tr.tr('applicationSectionEvidence'),
            ),
            const SizedBox(height: 10),
            _buildAttachBox(tr),
            const SizedBox(height: 10),
            if (attachedFiles.isNotEmpty)
              AttachedFilesList(
                files: attachedFiles,
                onDelete: (index) {
                  setState(() => attachedFiles.removeAt(index));
                },
              ),
            ApplicationCardContainer(
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                collapsedIconColor: ApplicationColors.secondaryText,
                iconColor: ApplicationColors.secondaryText,
                title: Text(
                  tr.tr('requirements'),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: ApplicationColors.primaryText,
                  ),
                ),
                children:
                    (_requirements.isEmpty
                            ? [tr.tr('noRequirementsLinked')]
                            : _requirements)
                        .map(
                          (item) => ListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            leading: const Icon(
                              Icons.check_circle_outline_rounded,
                              color: ApplicationColors.primaryAction,
                              size: 20,
                            ),
                            title: Text(
                              item,
                              style: const TextStyle(
                                color: ApplicationColors.primaryText,
                              ),
                            ),
                          ),
                        )
                        .toList(),
              ),
            ),

            const SizedBox(height: 18),
            ApplicationSectionTitle(
              number: 3,
              title: tr.tr('applicationSectionTerms'),
            ),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: ApplicationColors.cardBackground,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: ApplicationColors.cardBorder),
              ),
              child: Column(
                children: [
                  CheckboxListTile(
                    value: isTermsAccepted,
                    activeColor: ApplicationColors.primaryAction,
                    onChanged: (value) {
                      setState(() => isTermsAccepted = value ?? false);
                    },
                    title: RichText(
                      text: TextSpan(
                        style: const TextStyle(
                          color: ApplicationColors.secondaryText,
                          fontSize: 14,
                        ),
                        children: [
                          TextSpan(text: tr.tr('acceptTermsPrefix')),
                          TextSpan(
                            text: tr.tr('termsAndConditions'),
                            style: const TextStyle(
                              color: ApplicationColors.primaryAction,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          TextSpan(text: tr.tr('andThe')),
                          TextSpan(
                            text: tr.tr('privacyPolicy'),
                            style: const TextStyle(
                              color: ApplicationColors.primaryAction,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                    child: Text(
                      tr.tr('applicationSubmissionDisclaimer'),
                      style: const TextStyle(
                        fontSize: 12,
                        height: 1.35,
                        color: ApplicationColors.mutedText,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),
            ApplicationSectionTitle(
              number: 4,
              title: tr.tr('applicationSectionSubmission'),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: canSubmit
                    ? () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SuccessSubmissionScreen(
                              badge: widget.badge,
                              attachedFiles: List<AttachedDocument>.from(
                                attachedFiles,
                              ),
                              confirmationEmail: _resolveConfirmationEmail(),
                              submittedAt: DateTime.now(),
                            ),
                          ),
                        );
                      }
                    : null,
                icon: const Icon(Icons.check_circle_outline_rounded),
                label: Text(tr.tr('submit')),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  backgroundColor: ApplicationColors.primaryAction,
                  disabledBackgroundColor: ApplicationColors.buttonDisabled,
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

  Widget _buildAttachBox(LanguageController tr) {
    return DottedBorder(
      options: RoundedRectDottedBorderOptions(
        color: ApplicationColors.dashedBorder,
        radius: const Radius.circular(14),
        dashPattern: const [7, 4],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: _pickFiles,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
          decoration: BoxDecoration(
            color: ApplicationColors.cardBackground,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.attach_file_rounded,
                color: ApplicationColors.iconMuted,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  tr.tr('applicationAttachFile'),
                  style: const TextStyle(
                    color: ApplicationColors.secondaryText,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Icon(
                Icons.upload_file_rounded,
                color: ApplicationColors.iconMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
