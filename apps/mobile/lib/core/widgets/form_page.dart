import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme/design_tokens.dart';

// ── Route arguments ────────────────────────────────────────────────────────

class FormArguments {
  const FormArguments({
    this.mode = FormMode.create,
    this.entityId,
    this.initialData = const <String, dynamic>{},
  });

  final FormMode mode;
  final String? entityId;
  final Map<String, dynamic> initialData;

  bool get isEdit => mode == FormMode.edit;
  bool get isCreate => mode == FormMode.create;
}

enum FormMode { create, edit }

// ── Form page scaffold ─────────────────────────────────────────────────────

class FormPage<T> extends StatelessWidget {
  const FormPage({
    required this.title,
    required this.onSave,
    this.mode = FormMode.create,
    this.child,
    this.formKey,
    this.isSaving = false,
    this.validationErrors = const <String, String>{},
    this.saveLabel,
    this.showSaveInAppBar = false,
    this.enableSave = true,
    this.actions,
    this.bottomBar,
    super.key,
  });

  /// Title displayed in the AppBar.
  final String title;

  /// Called when the save button is pressed.
  final Future<void> Function() onSave;

  /// Whether this is create or edit mode.
  final FormMode mode;

  /// The form body content — typically a [ListView] or [Form] wrapping
  /// form field widgets.
  final Widget? child;

  /// Global key for the optional [Form] wrapper inside [child].
  final GlobalKey<FormState>? formKey;

  /// Whether a save operation is in flight.
  final bool isSaving;

  /// Field-level validation errors keyed by field name.
  final Map<String, String> validationErrors;

  /// Override for the save button label (default: 'Save' / 'Update').
  final String? saveLabel;

  /// Show a save button in the AppBar instead of the FAB / bottom bar.
  final bool showSaveInAppBar;

  /// Disable the save button when the form is unchanged or invalid.
  final bool enableSave;

  /// Extra AppBar actions (appended after the save button if [showSaveInAppBar]).
  final List<Widget>? actions;

  /// Optional bottom bar replacement (e.g. [BatchOperationsBar]). When null,
  /// the default FAB is shown.
  final Widget? bottomBar;

  bool get isCreate => mode == FormMode.create;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final String buttonLabel = saveLabel ?? (isCreate ? 'Save' : 'Update');

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.close),
          tooltip: 'Close',
          onPressed: () => _onClose(context),
        ),
        actions: <Widget>[
          if (showSaveInAppBar)
            TextButton(
              onPressed: enableSave && !isSaving ? onSave : null,
              child: isSaving
                  ? SizedBox(
                      width: TypeScale.xl,
                      height: TypeScale.xl,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: t.onPrimary,
                      ),
                    )
                  : Text(buttonLabel),
            ),
          if (actions != null) ...actions!,
        ],
      ),
      body: _FormBody(
        formKey: formKey,
        isSaving: isSaving,
        validationErrors: validationErrors,
        child: child ?? const SizedBox.shrink(),
      ),
      floatingActionButton: bottomBar ?? _defaultSaveFAB(t, buttonLabel),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget? _defaultSaveFAB(Palette t, String buttonLabel) {
    if (showSaveInAppBar) return null;

    return FloatingActionButton.extended(
      onPressed: enableSave && !isSaving ? onSave : null,
      backgroundColor: enableSave ? t.primary : t.border,
      foregroundColor: t.onPrimary,
      icon: isSaving
          ? SizedBox(
              width: TypeScale.xl,
              height: TypeScale.xl,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: t.onPrimary,
              ),
            )
          : const Icon(Icons.check),
      label: Text(isSaving ? 'Saving...' : buttonLabel),
    );
  }

  void _onClose(BuildContext context) {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else {
      context.goNamed('home');
    }
  }
}

// ── Form body ──────────────────────────────────────────────────────────────

class _FormBody extends StatelessWidget {
  const _FormBody({
    this.formKey,
    required this.isSaving,
    required this.validationErrors,
    required this.child,
  });

  final GlobalKey<FormState>? formKey;
  final bool isSaving;
  final Map<String, String> validationErrors;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final bool hasErrors = validationErrors.isNotEmpty;

    return Column(
      children: <Widget>[
        if (hasErrors)
          Container(
            width: double.infinity,
            color: t.dangerLight,
            padding: const EdgeInsets.all(Spacing.x4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Icon(Icons.error_outline, color: t.danger, size: TypeScale.xl),
                const SizedBox(width: Spacing.x2),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: validationErrors.entries.map(
                      (MapEntry<String, String> entry) => Padding(
                        padding: const EdgeInsets.only(bottom: Spacing.x1),
                        child: Text(
                          '${entry.key}: ${entry.value}',
                          style: TextStyle(
                            fontSize: TypeScale.xs,
                            color: t.danger,
                          ),
                        ),
                      ),
                    ).toList(),
                  ),
                ),
              ],
            ),
          ),
        Expanded(
          child: AbsorbPointer(
            absorbing: isSaving,
            child: child,
          ),
        ),
      ],
    );
  }
}
