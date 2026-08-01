import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../app/theme/design_tokens.dart';
import '../utils/formatters.dart';

// ── Form field wrapper ─────────────────────────────────────────────────────

class UiFormField extends StatelessWidget {
  const UiFormField({
    required this.child,
    this.label,
    this.errorText,
    this.isRequired = false,
    super.key,
  });

  final Widget child;
  final String? label;
  final String? errorText;
  final bool isRequired;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (label != null)
          Padding(
            padding: const EdgeInsets.only(bottom: Spacing.x1_5),
            child: Row(
              children: <Widget>[
                Text(
                  label!,
                  style: TextStyle(
                    fontSize: TypeScale.sm,
                    fontWeight: TypeScale.medium,
                    color: t.textSecondary,
                  ),
                ),
                if (isRequired)
                  Padding(
                    padding: const EdgeInsets.only(left: Spacing.x0_5),
                    child: Text(
                      '*',
                      style: TextStyle(
                        fontSize: TypeScale.sm,
                        color: t.danger,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        child,
        if (errorText != null && errorText!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: Spacing.x1_5),
            child: Text(
              errorText!,
              style: TextStyle(
                fontSize: TypeScale.xs,
                color: t.danger,
              ),
            ),
          ),
      ],
    );
  }
}

// ── Text field ─────────────────────────────────────────────────────────────

class UiTextField extends StatelessWidget {
  const UiTextField({
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.readOnly = false,
    this.enabled = true,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
    this.obscureText = false,
    this.maxLength,
    this.maxLines = 1,
    this.minLines,
    this.prefixIcon,
    this.suffixIcon,
    this.suffixText,
    this.autofillHints,
    this.inputFormatters,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.validator,
    super.key,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool readOnly;
  final bool enabled;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final bool obscureText;
  final int? maxLength;
  final int? maxLines;
  final int? minLines;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? suffixText;
  final Iterable<String>? autofillHints;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onTap;
  final FormFieldValidator<String>? validator;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiFormField(
      label: label,
      errorText: errorText,
      isRequired: isRequired,
      child: TextFormField(
        controller: controller,
        focusNode: focusNode,
        readOnly: readOnly,
        enabled: enabled,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        textCapitalization: textCapitalization,
        obscureText: obscureText,
        maxLength: maxLength,
        maxLines: maxLines,
        minLines: minLines,
        autofillHints: autofillHints,
        inputFormatters: inputFormatters,
        onChanged: onChanged,
        onFieldSubmitted: onSubmitted,
        onTap: onTap,
        validator: validator,
        decoration: InputDecoration(
          hintText: hintText,
          prefixIcon: prefixIcon,
          suffixIcon: suffixIcon,
          suffixText: suffixText,
        ),
        style: TextStyle(
          color: t.text,
          fontSize: TypeScale.base,
        ),
      ),
    );
  }
}

// ── Number field ───────────────────────────────────────────────────────────

class UiNumberField extends StatelessWidget {
  const UiNumberField({
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.enabled = true,
    this.min,
    this.max,
    this.decimalPlaces = 0,
    this.prefixIcon,
    this.suffixText,
    this.onChanged,
    super.key,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final num? min;
  final num? max;
  final int decimalPlaces;
  final Widget? prefixIcon;
  final String? suffixText;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return UiTextField(
      controller: controller,
      focusNode: focusNode,
      label: label,
      hintText: hintText ?? (decimalPlaces > 0 ? '0.00' : '0'),
      errorText: errorText,
      isRequired: isRequired,
      enabled: enabled,
      keyboardType: TextInputType.numberWithOptions(
        decimal: decimalPlaces > 0,
        signed: min != null && min! < 0,
      ),
      prefixIcon: prefixIcon,
      suffixText: suffixText,
      onChanged: onChanged,
      inputFormatters: <TextInputFormatter>[
        FilteringTextInputFormatter.allow(
          RegExp(r'^-?\d*\.?\d{0,' '$decimalPlaces'),
        ),
      ],
      validator: (String? value) {
        if (isRequired && (value == null || value.trim().isEmpty)) {
          return 'This field is required';
        }
        if (value != null && value.trim().isNotEmpty) {
          final num? parsed = decimalPlaces > 0
              ? double.tryParse(value.trim())
              : int.tryParse(value.trim());
          if (parsed == null) return 'Enter a valid number';
          if (min != null && parsed < min!) {
            return 'Minimum value is $min';
          }
          if (max != null && parsed > max!) {
            return 'Maximum value is $max';
          }
        }
        return null;
      },
    );
  }
}

// ── Currency field ─────────────────────────────────────────────────────────

class UiCurrencyField extends StatelessWidget {
  const UiCurrencyField({
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.enabled = true,
    this.currencyCode,
    this.onChanged,
    super.key,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final String? currencyCode;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final String code = currencyCode ?? Formatters.defaultCurrencyCode;

    return UiTextField(
      controller: controller,
      focusNode: focusNode,
      label: label,
      hintText: hintText ?? '0.00',
      errorText: errorText,
      isRequired: isRequired,
      enabled: enabled,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      prefixIcon: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.x2),
        child: Center(
          child: Text(
            NumberFormat.simpleCurrency(name: code).currencySymbol,
            style: TextStyle(
              fontSize: TypeScale.base,
              fontWeight: TypeScale.medium,
              color: context.tokens.textSecondary,
            ),
          ),
        ),
      ),
      onChanged: onChanged,
      inputFormatters: <TextInputFormatter>[
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
      ],
      validator: (String? value) {
        if (isRequired && (value == null || value.trim().isEmpty)) {
          return 'This field is required';
        }
        if (value != null && value.trim().isNotEmpty) {
          if (double.tryParse(value.trim()) == null) {
            return 'Enter a valid amount';
          }
        }
        return null;
      },
    );
  }
}

// ── Email field ────────────────────────────────────────────────────────────

class UiEmailField extends StatelessWidget {
  const UiEmailField({
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = true,
    this.enabled = true,
    this.onChanged,
    super.key,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final ValueChanged<String>? onChanged;

  static final RegExp _emailRegExp = RegExp(
    r'^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@[a-zA-Z0-9]'
    r'(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9]'
    r'(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
  );

  @override
  Widget build(BuildContext context) {
    return UiTextField(
      controller: controller,
      focusNode: focusNode,
      label: label ?? 'Email',
      hintText: hintText ?? 'name@example.com',
      errorText: errorText,
      isRequired: isRequired,
      enabled: enabled,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      textCapitalization: TextCapitalization.none,
      autofillHints: const <String>[AutofillHints.email],
      prefixIcon: const Icon(Icons.email_outlined),
      onChanged: onChanged,
      validator: (String? value) {
        if (isRequired && (value == null || value.trim().isEmpty)) {
          return 'Email is required';
        }
        if (value != null && value.trim().isNotEmpty) {
          if (!_emailRegExp.hasMatch(value.trim())) {
            return 'Enter a valid email address';
          }
        }
        return null;
      },
    );
  }
}

// ── Phone field ────────────────────────────────────────────────────────────

class UiPhoneField extends StatelessWidget {
  const UiPhoneField({
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.enabled = true,
    this.prefixText = '+1',
    this.onChanged,
    super.key,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final String? prefixText;
  final ValueChanged<String>? onChanged;

  static final RegExp _phoneRegExp = RegExp(r'^\+?\d{7,15}$');

  @override
  Widget build(BuildContext context) {
    return UiTextField(
      controller: controller,
      focusNode: focusNode,
      label: label ?? 'Phone',
      hintText: hintText ?? '(555) 123-4567',
      errorText: errorText,
      isRequired: isRequired,
      enabled: enabled,
      keyboardType: TextInputType.phone,
      textInputAction: TextInputAction.next,
      /* prefixText: prefixText, */
      autofillHints: const <String>[AutofillHints.telephoneNumber],
      onChanged: onChanged,
      inputFormatters: <TextInputFormatter>[
        FilteringTextInputFormatter.digitsOnly,
      ],
      validator: (String? value) {
        if (isRequired && (value == null || value.trim().isEmpty)) {
          return 'Phone number is required';
        }
        if (value != null && value.trim().isNotEmpty) {
          final String cleaned = value.trim().replaceAll(RegExp(r'[\s\-\(\)\.]'), '');
          if (!_phoneRegExp.hasMatch(cleaned)) {
            return 'Enter a valid phone number';
          }
        }
        return null;
      },
    );
  }
}

// ── Text area ──────────────────────────────────────────────────────────────

class UiTextAreaField extends StatelessWidget {
  const UiTextAreaField({
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.enabled = true,
    this.maxLength,
    this.minLines = 3,
    this.maxLines = 6,
    this.onChanged,
    super.key,
  });

  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final int? maxLength;
  final int? minLines;
  final int? maxLines;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return UiTextField(
      controller: controller,
      focusNode: focusNode,
      label: label,
      hintText: hintText,
      errorText: errorText,
      isRequired: isRequired,
      enabled: enabled,
      maxLength: maxLength,
      minLines: minLines,
      maxLines: maxLines,
      textInputAction: TextInputAction.newline,
      keyboardType: TextInputType.multiline,
      onChanged: onChanged,
    );
  }
}

// ── Switch field ───────────────────────────────────────────────────────────

class UiSwitchField extends StatelessWidget {
  const UiSwitchField({
    required this.label,
    required this.value,
    this.subtitle,
    this.enabled = true,
    this.onChanged,
    super.key,
  });

  final String label;
  final String? subtitle;
  final bool value;
  final bool enabled;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Opacity(
      opacity: enabled ? 1.0 : 0.5,
      child: InkWell(
        onTap: enabled && onChanged != null ? () => onChanged!(!value) : null,
        borderRadius: BorderRadius.circular(Radii.sm),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
          child: Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: TypeScale.base,
                        color: t.text,
                      ),
                    ),
                    if (subtitle != null) ...<Widget>[
                      const SizedBox(height: Spacing.x0_5),
                      Text(
                        subtitle!,
                        style: TextStyle(
                          fontSize: TypeScale.xs,
                          color: t.textTertiary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: Spacing.x3),
              Switch.adaptive(
                value: value,
                onChanged: enabled ? onChanged : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Dropdown field ─────────────────────────────────────────────────────────

class UiDropdownField<T> extends StatelessWidget {
  const UiDropdownField({
    required this.items,
    required this.itemLabel,
    this.selectedItem,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.enabled = true,
    this.searchable = false,
    this.onChanged,
    super.key,
  });

  final List<T> items;
  final String Function(T) itemLabel;
  final T? selectedItem;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final bool searchable;
  final ValueChanged<T?>? onChanged;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final String? displayValue = selectedItem != null ? itemLabel(selectedItem as T) : null;

    return UiFormField(
      label: label,
      errorText: errorText,
      isRequired: isRequired,
      child: InkWell(
        onTap: enabled ? () => _openPicker(context) : null,
        borderRadius: Radii.control,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Spacing.x3,
            vertical: Spacing.x3,
          ),
          decoration: BoxDecoration(
            color: enabled ? t.bgElevated : t.bgSunken,
            borderRadius: Radii.control,
            border: Border.all(
              color: errorText != null ? t.danger : t.border,
            ),
          ),
          child: Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  displayValue ?? hintText ?? 'Select...',
                  style: TextStyle(
                    fontSize: TypeScale.base,
                    color: displayValue != null ? t.text : t.textTertiary,
                  ),
                ),
              ),
              Icon(
                Icons.arrow_drop_down,
                color: t.textTertiary,
                size: Spacing.x5,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openPicker(BuildContext context) async {
    if (searchable) {
      final T? result = await showSearch<T?>(
        context: context,
        delegate: _DropdownSearchDelegate<T>(
          items: items,
          itemLabel: itemLabel,
        ),
      );
      if (result != null || items.contains(null)) {
        onChanged?.call(result);
      }
    } else {
      final T? result = await showModalBottomSheet<T>(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.x2l)),
        ),
        builder: (BuildContext sheetContext) => _DropdownSheet<T>(
          items: items,
          itemLabel: itemLabel,
          selectedItem: selectedItem,
        ),
      );
      if (result != null || items.contains(null)) {
        onChanged?.call(result);
      }
    }
  }
}

class _DropdownSheet<T> extends StatelessWidget {
  const _DropdownSheet({
    required this.items,
    required this.itemLabel,
    this.selectedItem,
  });

  final List<T> items;
  final String Function(T) itemLabel;
  final T? selectedItem;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4,
              Spacing.x3,
              Spacing.x4,
              Spacing.x2,
            ),
            child: Text(
              'Select',
              style: TextStyle(
                fontSize: TypeScale.lg,
                fontWeight: TypeScale.semibold,
                color: t.text,
              ),
            ),
          ),
          const Divider(height: 1),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (BuildContext context, int index) {
                final T item = items[index];
                final bool isSelected = item == selectedItem;

                return ListTile(
                  title: Text(itemLabel(item)),
                  trailing: isSelected
                      ? Icon(Icons.check, color: t.primary)
                      : null,
                  onTap: () => Navigator.of(context).pop(item),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _DropdownSearchDelegate<T> extends SearchDelegate<T?> {
  _DropdownSearchDelegate({
    required this.items,
    required this.itemLabel,
  });

  final List<T> items;
  final String Function(T) itemLabel;

  @override
  String get searchFieldLabel => 'Search...';

  @override
  List<Widget>? buildActions(BuildContext context) {
    return <Widget>[
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () => query = '',
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) => _buildList(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildList(context);

  Widget _buildList(BuildContext context) {
    final List<T> filtered = query.isEmpty
        ? items
        : items.where(
            (T item) => itemLabel(item).toLowerCase().contains(query.toLowerCase()),
          ).toList(growable: false);

    if (filtered.isEmpty) {
      return Center(
        child: Text(
          'No matches found',
          style: TextStyle(color: context.tokens.textTertiary),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
      itemCount: filtered.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (BuildContext context, int index) {
        final T item = filtered[index];
        return ListTile(
          title: Text(itemLabel(item)),
          onTap: () => close(context, item),
        );
      },
    );
  }
}

// ── Date picker field ──────────────────────────────────────────────────────

class UiDatePickerField extends StatelessWidget {
  const UiDatePickerField({
    this.selectedDate,
    this.label,
    this.hintText,
    this.errorText,
    this.isRequired = false,
    this.enabled = true,
    this.firstDate,
    this.lastDate,
    this.onChanged,
    super.key,
  });

  final DateTime? selectedDate;
  final String? label;
  final String? hintText;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final ValueChanged<DateTime?>? onChanged;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final String? displayValue = selectedDate != null
        ? Formatters.date(selectedDate!)
        : null;

    return UiFormField(
      label: label,
      errorText: errorText,
      isRequired: isRequired,
      child: InkWell(
        onTap: enabled ? () => _pickDate(context) : null,
        borderRadius: Radii.control,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Spacing.x3,
            vertical: Spacing.x3,
          ),
          decoration: BoxDecoration(
            color: enabled ? t.bgElevated : t.bgSunken,
            borderRadius: Radii.control,
            border: Border.all(
              color: errorText != null ? t.danger : t.border,
            ),
          ),
          child: Row(
            children: <Widget>[
              Icon(Icons.calendar_today_outlined, size: TypeScale.lg, color: t.textTertiary),
              const SizedBox(width: Spacing.x2),
              Expanded(
                child: Text(
                  displayValue ?? hintText ?? 'Select date',
                  style: TextStyle(
                    fontSize: TypeScale.base,
                    color: displayValue != null ? t.text : t.textTertiary,
                  ),
                ),
              ),
              if (selectedDate != null)
                IconButton(
                  icon: Icon(Icons.close, size: TypeScale.lg, color: t.textTertiary),
                  onPressed: enabled && onChanged != null
                      ? () => onChanged!(null)
                      : null,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate ?? DateTime.now(),
      firstDate: firstDate ?? DateTime(2000),
      lastDate: lastDate ?? DateTime(2100),
    );
    if (picked != null && context.mounted) {
      onChanged?.call(picked);
    }
  }
}

// ── Status dropdown ────────────────────────────────────────────────────────

class UiStatusDropdown extends StatelessWidget {
  const UiStatusDropdown({
    required this.items,
    required this.selectedItem,
    this.label,
    this.errorText,
    this.isRequired = false,
    this.enabled = true,
    this.statusColor,
    this.onChanged,
    super.key,
  });

  final List<String> items;
  final String selectedItem;
  final String? label;
  final String? errorText;
  final bool isRequired;
  final bool enabled;
  final Color Function(String)? statusColor;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiFormField(
      label: label,
      errorText: errorText,
      isRequired: isRequired,
      child: InkWell(
        onTap: enabled ? () => _openSheet(context) : null,
        borderRadius: Radii.control,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Spacing.x3,
            vertical: Spacing.x2,
          ),
          decoration: BoxDecoration(
            color: enabled ? t.bgElevated : t.bgSunken,
            borderRadius: Radii.control,
            border: Border.all(
              color: errorText != null ? t.danger : t.border,
            ),
          ),
          child: Row(
            children: <Widget>[
              _StatusPill(
                label: selectedItem,
                color: statusColor?.call(selectedItem),
              ),
              const Spacer(),
              Icon(
                Icons.arrow_drop_down,
                color: t.textTertiary,
                size: Spacing.x5,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openSheet(BuildContext context) async {
    final Palette t = context.tokens;

    final String? result = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.x2l)),
      ),
      builder: (BuildContext sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Spacing.x4,
                Spacing.x3,
                Spacing.x4,
                Spacing.x2,
              ),
              child: Text(
                'Select status',
                style: TextStyle(
                  fontSize: TypeScale.lg,
                  fontWeight: TypeScale.semibold,
                  color: t.text,
                ),
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                itemCount: items.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (BuildContext context, int index) {
                  final String item = items[index];
                  final bool isSelected = item == selectedItem;

                  return ListTile(
                    leading: _StatusPill(
                      label: item,
                      color: statusColor?.call(item),
                    ),
                    trailing: isSelected
                        ? Icon(Icons.check, color: t.primary)
                        : null,
                    onTap: () => Navigator.of(context).pop(item),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );

    if (result != null && context.mounted) {
      onChanged?.call(result);
    }
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final Color bg = color ?? t.primaryLight;
    final Color fg = color ?? t.primary;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.x2_5,
        vertical: Spacing.x1,
      ),
      decoration: BoxDecoration(
        color: bg.withAlpha(40),
        borderRadius: Radii.pill,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: TypeScale.xs,
          fontWeight: TypeScale.medium,
          color: fg,
        ),
      ),
    );
  }
}
