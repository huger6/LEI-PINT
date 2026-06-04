import 'package:flutter/material.dart';

import '../../../presentation/state/language_controller.dart';

class TranslatedText extends StatefulWidget {
  const TranslatedText(
    this.text, {
    super.key,
    this.namespace = 'dynamic',
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.softWrap,
  });

  final String text;
  final String namespace;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;
  final bool? softWrap;

  @override
  State<TranslatedText> createState() => _TranslatedTextState();
}

class _TranslatedTextState extends State<TranslatedText> {
  String _languageCode = '';
  String _translatedText = '';
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    _translatedText = widget.text;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _translateIfNeeded();
  }

  @override
  void didUpdateWidget(covariant TranslatedText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text ||
        oldWidget.namespace != widget.namespace) {
      _translatedText = widget.text;
      _translateIfNeeded();
    }
  }

  Future<void> _translateIfNeeded() async {
    final controller = LanguageScope.of(context);
    final nextLanguage = controller.languageCode;
    final requestId = ++_requestId;

    if (nextLanguage == _languageCode &&
        _translatedText != widget.text &&
        widget.text.isNotEmpty) {
      return;
    }

    _languageCode = nextLanguage;

    if (widget.text.trim().isEmpty || nextLanguage == 'pt') {
      if (mounted) {
        setState(() => _translatedText = widget.text);
      }
      return;
    }

    final translated = await controller.translateText(
      widget.text,
      namespace: widget.namespace,
    );

    if (!mounted || requestId != _requestId) return;
    setState(() => _translatedText = translated);
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      _translatedText,
      style: widget.style,
      textAlign: widget.textAlign,
      maxLines: widget.maxLines,
      overflow: widget.overflow,
      softWrap: widget.softWrap,
    );
  }
}
