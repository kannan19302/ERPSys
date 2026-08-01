import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../domain/entities/builder.dart';
import '../providers/builder_providers.dart';

class BuilderFormDetailPage extends ConsumerWidget {
  const BuilderFormDetailPage({required this.formId, super.key});

  static const String routeName = 'builder-form-detail';
  static const String routePath = '/builder/forms/:id';

  final String formId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<BuilderForm> formAsync =
        ref.watch(builderFormDetailProvider(formId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Builder Form'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete form',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: formAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load form.'),
          onRetry: () => ref.invalidate(builderFormDetailProvider(formId)),
        ),
        data: (BuilderForm form) => _BuilderFormDetail(form: form),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete form?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(builderFormListControllerProvider.notifier)
        .delete(formId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _BuilderFormDetail extends StatelessWidget {
  const _BuilderFormDetail({required this.form});

  final BuilderForm form;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (form.status) {
      'PUBLISHED' => ('Published', t.success, t.successLight),
      'DRAFT' => ('Draft', t.textSecondary, t.bgSunken),
      _ => ('Archived', t.warning, t.warningLight),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      form.title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.x2_5,
                      vertical: Spacing.x1,
                    ),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: Radii.pill,
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: TypeScale.xs,
                        fontWeight: TypeScale.medium,
                      ),
                    ),
                  ),
                ],
              ),
              if (form.description != null && form.description!.isNotEmpty) ...<Widget>[
                const SizedBox(height: Spacing.x2),
                Text(form.description!, style: TextStyle(color: t.textSecondary)),
              ],
              const SizedBox(height: Spacing.x2),
              _FieldRow('Version', 'v${form.version}'),
              _FieldRow('Fields', '${form.fields.length}'),
              _FieldRow('Created', Formatters.date(form.createdAt ?? DateTime.now())),
            ],
          ),
        ),
        if (form.fields.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(Spacing.x4),
            decoration: BoxDecoration(
              color: t.bgElevated,
              borderRadius: Radii.card,
              border: Border.all(color: t.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Fields', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: Spacing.x3),
                ...form.fields.map((BuilderFormField field) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
                  child: Row(
                    children: <Widget>[
                      Icon(Icons.text_fields, size: TypeScale.lg, color: t.primary),
                      const SizedBox(width: Spacing.x2),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(field.label, style: const TextStyle(fontWeight: TypeScale.medium)),
                            Text(field.fieldType, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                          ],
                        ),
                      ),
                      if (field.required)
                        Icon(Icons.star, size: TypeScale.sm, color: t.danger),
                    ],
                  ),
                ),),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}