import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class EmailTemplateDetailPage extends ConsumerWidget {
  const EmailTemplateDetailPage({required this.templateId, super.key});

  static const String routeName = 'email-template-detail';
  static const String routePath = '/crm/email-templates/:id';

  final String templateId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<EmailTemplate> templateAsync =
        ref.watch(emailTemplateDetailProvider(templateId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Email Template'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.crmTemplateUpdate,
            child: IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit template',
              onPressed: () => context.pushNamed(
                'email-template-edit',
                pathParameters: <String, String>{'id': templateId},
              ),
            ),
          ),
          PermissionGate(
            permission: Permissions.crmTemplateDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete template',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: templateAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load template.'),
          onRetry: () => ref.invalidate(emailTemplateDetailProvider(templateId)),
        ),
        data: (EmailTemplate template) => _TemplateDetail(template: template),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete template?'),
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
        .read(emailTemplatesProvider.notifier)
        .delete(templateId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _TemplateDetail extends StatelessWidget {
  const _TemplateDetail({required this.template});

  final EmailTemplate template;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                template.name,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              if (template.category != null) ...<Widget>[
                const SizedBox(height: Spacing.x2),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Spacing.x2_5,
                    vertical: Spacing.x1,
                  ),
                  decoration: BoxDecoration(
                    color: t.bgSunken,
                    borderRadius: Radii.pill,
                  ),
                  child: Text(
                    template.category!,
                    style: TextStyle(
                      color: t.textSecondary,
                      fontSize: TypeScale.xs,
                      fontWeight: TypeScale.medium,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Details'),
              _FieldRow('Name', template.name),
              _FieldRow('Subject', template.subject),
              _FieldRow('Category', template.category ?? '—'),
            ],
          ),
        ),
        if (template.body != null && template.body!.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const _SectionTitle(title: 'Body'),
                const SizedBox(height: Spacing.x2),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(Spacing.x3),
                  decoration: BoxDecoration(
                    color: t.bgSunken,
                    borderRadius: Radii.control,
                  ),
                  child: SelectableText(
                    template.body!,
                    style: TextStyle(
                      color: t.text,
                      fontSize: TypeScale.sm,
                      height: 1.6,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(
        color: t.bgElevated,
        borderRadius: Radii.card,
        border: Border.all(color: t.border),
      ),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Text(title, style: Theme.of(context).textTheme.titleMedium),
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
