import 'package:flutter/material.dart';
import 'app_icon/app_icon.dart';
import 'app_icon/app_icon_data.dart';

class CustomTextField extends StatefulWidget {
  final String label;
  final bool isRequired;
  final String hintText;
  final String prefixIcon;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final TextEditingController? controller;
  final bool obscureText;
  final String? errorText;
  final bool hasError;
  final ValueChanged<String>? onChanged;
  final int maxLines;
  final bool readOnly;
  final VoidCallback? onTap;

  const CustomTextField({
    super.key,
    required this.label,
    this.isRequired = false,
    required this.hintText,
    required this.prefixIcon,
    this.keyboardType = TextInputType.text,
    this.validator,
    this.controller,
    this.obscureText = false,
    this.errorText,
    this.hasError = false,
    this.onChanged,
    this.maxLines = 1,
    this.readOnly = false,
    this.onTap,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    final errorColor = Theme.of(context).colorScheme.error;
    final showError = widget.hasError || widget.errorText != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: showError ? errorColor : null,
            ),
            children: [
              TextSpan(text: widget.label),
              if (widget.isRequired)
                TextSpan(
                  text: ' *',
                  style: TextStyle(
                    color: errorColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          obscureText: _obscureText,
          maxLines: widget.obscureText ? 1 : widget.maxLines,
          validator: widget.validator,
          onChanged: widget.onChanged,
          readOnly: widget.readOnly,
          onTap: widget.onTap,
          decoration: InputDecoration(
            hintText: widget.hintText,
            prefixIcon: AppIcon(widget.prefixIcon),
            suffixIcon: widget.obscureText
                ? IconButton(
                    onPressed: () {
                      setState(() {
                        _obscureText = !_obscureText;
                      });
                    },
                    icon: AppIcon(
                      _obscureText ? AppIcons.eyeSlash : AppIcons.eye,
                    ),
                  )
                : null,
            enabledBorder: showError
                ? OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide(color: errorColor, width: 1.5),
                  )
                : null,
            focusedBorder: showError
                ? OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide(color: errorColor, width: 2),
                  )
                : null,
          ),
        ),

        if (widget.errorText != null) ...[
          const SizedBox(height: 6),
          Text(
            widget.errorText!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: errorColor,
            ),
          ),
        ],

        const SizedBox(height: 18),
      ],
    );
  }
}
