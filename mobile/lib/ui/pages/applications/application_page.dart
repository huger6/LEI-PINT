import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dotted_border/dotted_border.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/sync_manager.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../../presentation/state/applications_store.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/badges/attached_files_list.dart';
import '../../widgets/applications/application_page_widgets.dart';
import 'badge_email_confirmation_screen.dart';

class ApplicationScreen extends StatefulWidget {
  const ApplicationScreen({super.key, required this.badge});

  final BadgeModel badge;

  @override
  State<ApplicationScreen> createState() => _ApplicationScreenState();
}

class _ApplicationScreenState extends State<ApplicationScreen> {
  bool isTermsAccepted = false;
  bool _isSubmitting = false;
  late final Map<int, List<AttachedDocument>> _filesByRequirement;

  @override
  void initState() {
    super.initState();
    _filesByRequirement = {
      for (final req in widget.badge.requirements)
        if (req.id != null) req.id!: <AttachedDocument>[],
    };
  }

  bool get _allRequirementsHaveEvidence {
    if (_filesByRequirement.isEmpty) return false;
    return _filesByRequirement.values.every((files) => files.isNotEmpty);
  }

  Future<void> _pickFilesForRequirement(int requirementId) async {
    final result = await FilePicker.pickFiles(
      allowMultiple: false,
      type: FileType.any,
      withData: false,
    );

    if (result == null || !mounted) return;

    final tr = LanguageScope.of(context);
    final file = result.files.first;

    if (file.path == null) return;

    setState(() {
      _filesByRequirement[requirementId] = [
        AttachedDocument(
          name: file.name,
          subtitle: tr.tr('applicationAttachedFileSubtitle'),
          filePath: file.path,
          requirementId: requirementId,
        ),
      ];
    });
  }

  String _mimeTypeForFile(String fileName) {
    final ext = fileName.split('.').last.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }

  Future<void> _submitApplication() async {
    if (_isSubmitting) return;

    setState(() => _isSubmitting = true);

    final appStore = context.read<ApplicationsStore>();
    final messenger = ScaffoldMessenger.of(context);
    final badge = widget.badge;

    try {
      final startResult = await appStore.startApplication(badgeId: badge.id);
      final isExisting = startResult['code'] == 'APP_ALREADY_EXISTS';
      if (startResult['success'] != true && !isExisting) {
        final msg = startResult['message']?.toString() ?? 'Erro ao iniciar candidatura.';
        messenger.showSnackBar(SnackBar(
          content: Text(msg),
          backgroundColor: const Color(0xFFD94A2A),
        ));
        return;
      }

      final appData = startResult['data'];
      final applicationGuid =
          (appData is Map
                  ? (appData['application_guid'] ?? appData['applicationGuid'])
                  : null)
              ?.toString() ??
          '';

      if (applicationGuid.isEmpty) {
        messenger.showSnackBar(const SnackBar(
          content: Text('Erro: GUID da candidatura não recebido.'),
          backgroundColor: Color(0xFFD94A2A),
        ));
        return;
      }

      final dio = Dio();

      for (final entry in _filesByRequirement.entries) {
        final requirementId = entry.key;
        final files = entry.value;

        for (final file in files) {
          if (file.filePath == null) continue;

          final uploadResult = await appStore.getUploadUrl(
            applicationGuid: applicationGuid,
            requirementId: requirementId,
            fileName: file.name,
          );

          if (uploadResult['success'] != true) continue;

          final uploadUrl = uploadResult['uploadUrl']?.toString() ?? '';
          final finalFileUrl = uploadResult['finalFileUrl']?.toString() ?? '';

          if (uploadUrl.isNotEmpty) {
            final fileBytes = await File(file.filePath!).readAsBytes();
            await dio.put(
              uploadUrl,
              data: Stream.fromIterable([fileBytes]),
              options: Options(
                headers: {
                  'Content-Type': _mimeTypeForFile(file.name),
                  'Content-Length': fileBytes.length,
                },
              ),
            );
          }

          if (finalFileUrl.isNotEmpty) {
            await appStore.upsertEvidence(
              applicationGuid: applicationGuid,
              requirementId: requirementId,
              evidenceFileUrl: finalFileUrl,
              evidenceTitle: file.name,
              evidenceFileType: _mimeTypeForFile(file.name),
            );
          }
        }
      }

      final submitResult = await appStore.submitApplication(applicationGuid);
      if (!mounted) return;

      if (submitResult['success'] != true) {
        final msg = submitResult['message']?.toString() ?? 'Erro ao submeter candidatura.';
        messenger.showSnackBar(SnackBar(
          content: Text(msg),
          backgroundColor: const Color(0xFFD94A2A),
        ));
        return;
      }

      final submittedApplication = ApplicationSummaryModel(
        applicationGuid: applicationGuid,
        applicationState: 'Submitted',
        badge: badge,
        submittedAt: DateTime.now(),
        openedAt: DateTime.now(),
      );

      if (!mounted) return;

      final userEmail =
          context.read<AuthStore>().currentUser?.email ?? '';

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => BadgeEmailConfirmationScreen(
            application: submittedApplication,
            userEmail: userEmail,
          ),
        ),
      );
      return;
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(
        content: Text('Erro: ${e.toString()}'),
        backgroundColor: const Color(0xFFD94A2A),
      ));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final canSubmit = isTermsAccepted && _allRequirementsHaveEvidence && !_isSubmitting;

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
            if (widget.badge.requirements.isEmpty)
              ApplicationCardContainer(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Text(
                    tr.tr('noRequirementsLinked'),
                    style: const TextStyle(
                      color: ApplicationColors.mutedText,
                    ),
                  ),
                ),
              )
            else
              ...widget.badge.requirements.map((req) {
                final reqId = req.id;
                if (reqId == null) return const SizedBox.shrink();
                final files = _filesByRequirement[reqId] ?? [];
                final hasFiles = files.isNotEmpty;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: ApplicationColors.cardBackground,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: hasFiles
                          ? ApplicationColors.primaryAction.withValues(alpha: 0.5)
                          : ApplicationColors.cardBorder,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            hasFiles
                                ? Icons.check_circle_rounded
                                : Icons.check_circle_outline_rounded,
                            color: hasFiles
                                ? const Color(0xFF4CAF50)
                                : ApplicationColors.primaryAction,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              req.text,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: ApplicationColors.primaryText,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      if (files.isNotEmpty) ...[
                        AttachedFilesList(
                          files: files,
                          onDelete: (index) {
                            setState(() => files.removeAt(index));
                          },
                        ),
                      ],
                      if (!hasFiles) DottedBorder(
                        options: RoundedRectDottedBorderOptions(
                          color: ApplicationColors.dashedBorder,
                          radius: const Radius.circular(10),
                          dashPattern: const [7, 4],
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(10),
                          onTap: _isSubmitting
                              ? null
                              : () => _pickFilesForRequirement(reqId),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: ApplicationColors.cardBackground,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.attach_file_rounded,
                                  color: ApplicationColors.iconMuted,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    tr.tr('applicationAttachFile'),
                                    style: const TextStyle(
                                      color: ApplicationColors.secondaryText,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                                const Icon(
                                  Icons.upload_file_rounded,
                                  color: ApplicationColors.iconMuted,
                                  size: 20,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),

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
                    onChanged: _isSubmitting
                        ? null
                        : (value) {
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
                onPressed: canSubmit ? _submitApplication : null,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.check_circle_outline_rounded),
                label: Text(_isSubmitting ? 'A submeter...' : tr.tr('submit')),
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

}
