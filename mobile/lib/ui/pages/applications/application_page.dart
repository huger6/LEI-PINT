import 'dart:io';

import 'package:dotted_border/dotted_border.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart' as dio_pkg;
import 'package:provider/provider.dart';

import '../../../core/sync_manager.dart';
import '../../../models/application_summary_model.dart';
import '../../../models/badge_model.dart';
import '../../../presentation/state/applications_store.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/badges/attached_files_list.dart';
import '../../widgets/badges/my_badges_widgets.dart';
import '../../widgets/applications/application_page_widgets.dart';
import '../../widgets/shared/translated_text.dart';
import 'badge_email_confirmation_screen.dart';
import '../../widgets/shared/app_icon/app_icon.dart';
import '../../widgets/shared/app_icon/app_icon_data.dart';

class ApplicationScreen extends StatefulWidget {
  const ApplicationScreen({super.key, required this.badge});

  final BadgeModel badge;

  @override
  State<ApplicationScreen> createState() => _ApplicationScreenState();
}

class _ApplicationScreenState extends State<ApplicationScreen> {
  static const int _maxFileSizeMB = 10;
  static const int _maxFileSizeBytes = _maxFileSizeMB * 1024 * 1024;

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

    final fileSize = File(file.path!).lengthSync();
    if (fileSize > _maxFileSizeBytes) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(
          tr.tr('fileTooLarge').replaceAll('{size}', '$_maxFileSizeMB'),
        ),
        backgroundColor: const Color(0xFFD94A2A),
      ));
      return;
    }

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

    final tr = LanguageScope.of(context);

    try {
      final startResult = await appStore.startApplication(badgeSlug: badge.slug);
      final isExisting = startResult['code'] == 'APP_ALREADY_EXISTS';
      if (startResult['success'] != true && !isExisting) {
        final msg = startResult['message']?.toString() ?? tr.tr('applicationStartError');
        messenger.showSnackBar(SnackBar(
          content: Text(msg),
          backgroundColor: const Color(0xFFD94A2A),
        ));
        return;
      }

      final appData = startResult['data'];

      if (isExisting) {
        final existingState = (appData is Map ? appData['currentState'] : null)?.toString() ?? '';
        if (existingState.isNotEmpty && existingState != 'Open') {
          messenger.showSnackBar(SnackBar(
            content: Text(tr.tr('applicationExistsInState').replaceAll('{state}', existingState)),
            backgroundColor: const Color(0xFFD94A2A),
          ));
          return;
        }
      }

      String applicationGuid;

      if (isExisting) {
        final existing = await appStore.loadLatestForBadgeSlug(badge.slug);
        applicationGuid = existing?.applicationGuid ?? '';
      } else {
        applicationGuid =
            (appData is Map
                    ? (appData['application_guid'] ?? appData['applicationGuid'])
                    : null)
                ?.toString() ??
            '';
      }

      if (applicationGuid.isEmpty) {
        messenger.showSnackBar(SnackBar(
          content: Text(tr.tr('applicationGuidError')),
          backgroundColor: const Color(0xFFD94A2A),
        ));
        return;
      }

      final uploadFutures = <Future<void>>[];
      for (final entry in _filesByRequirement.entries) {
        final requirementId = entry.key;
        for (final file in entry.value) {
          if (file.filePath == null) continue;
          uploadFutures.add(() async {
            final localFile = File(file.filePath!);
            final fileLength = await localFile.length();
            final contentType = _mimeTypeForFile(file.name);

            final urlResult = await appStore.getUploadUrl(
              applicationGuid: applicationGuid,
              requirementId: requirementId,
              fileName: file.name,
              contentType: contentType,
              fileSize: fileLength.toInt(),
            );
            if (urlResult['success'] != true) {
              throw Exception(urlResult['message'] ?? 'Failed to get upload URL');
            }
            final uploadUrl = urlResult['uploadUrl'] as String;
            final finalFileUrl = urlResult['finalFileUrl'] as String;
            await dio_pkg.Dio().put(
              uploadUrl,
              data: localFile.openRead(),
              options: dio_pkg.Options(
                contentType: contentType,
                headers: {
                  'Content-Length': fileLength,
                },
              ),
            );

            await appStore.upsertEvidence(
              applicationGuid: applicationGuid,
              requirementId: requirementId,
              evidenceFileUrl: finalFileUrl,
              evidenceTitle: file.name,
              evidenceFileType: contentType,
            );
          }());
        }
      }
      await Future.wait(uploadFutures);

      final submitResult = await appStore.submitApplication(applicationGuid);
      if (!mounted) return;

      if (submitResult['success'] != true) {
        final msg = submitResult['message']?.toString() ?? tr.tr('applicationSubmitError');
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
      final tr = LanguageScope.of(context);
      final errorMsg = e.toString().toLowerCase();
      String userMessage;
      if (errorMsg.contains('size') ||
          errorMsg.contains('too large') ||
          errorMsg.contains('payload') ||
          errorMsg.contains('413')) {
        userMessage = tr.tr('fileTooLarge').replaceAll('{size}', '$_maxFileSizeMB');
      } else {
        userMessage = tr.tr('fileUploadError');
      }
      messenger.showSnackBar(SnackBar(
        content: Text(userMessage),
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
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  BadgeMedalIcon(
                    medalColor: widget.badge.medalColor,
                    ribbonColor: widget.badge.ribbonColor,
                    compact: true,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TranslatedText(
                          widget.badge.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF172733),
                            fontSize: 17,
                            height: 1.15,
                          ),
                        ),
                        if (widget.badge.category.trim().isNotEmpty ||
                            widget.badge.level.trim().isNotEmpty) ...[
                          const SizedBox(height: 4),
                          TranslatedText(
                            [
                              if (widget.badge.category.trim().isNotEmpty) widget.badge.category,
                              if (widget.badge.level.trim().isNotEmpty) widget.badge.level,
                            ].join(' - '),
                            style: const TextStyle(
                              color: Color(0xFF445967),
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
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
                          AppIcon(
                            hasFiles
                                ? AppIcons.checkCircle
                                : AppIcons.checkCircle,
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
                                const AppIcon(
                                  AppIcons.attachFile,
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
                                const AppIcon(
                                  AppIcons.upload,
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
                    : const AppIcon(AppIcons.checkCircle),
                label: Text(_isSubmitting ? tr.tr('submitting') : tr.tr('submit')),
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
