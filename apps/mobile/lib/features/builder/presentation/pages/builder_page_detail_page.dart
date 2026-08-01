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

class BuilderPageDetailPage extends ConsumerWidget {
  const BuilderPageDetailPage({required this.pageId, super.key});

  static const String routeName = 'builder-page-detail';
  static const String routePath = '/builder/pages/:id';

  final String pageId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<BuilderPage> pageAsync =
        ref.watch(builderPageDetailProvider(pageId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Builder Page'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete page',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: pageAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load page.'),
          onRetry: () => ref.invalidate(builderPageDetailProvider(pageId)),
        ),
        data: (BuilderPage page) => _BuilderPageDetail(page: page),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete page?'),
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
        .read(builderPageListControllerProvider.notifier)
        .delete(pageId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _BuilderPageDetail extends StatelessWidget {
  const _BuilderPageDetail({required this.page});

  final BuilderPage page;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (page.status) {
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
                      page.title,
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
              const SizedBox(height: Spacing.x2),
              _FieldRow('Layout', page.layout),
              _FieldRow('Slug', page.slug ?? '—'),
              _FieldRow('Sections', '${page.sections.length}'),
              _FieldRow('Created', Formatters.date(page.createdAt ?? DateTime.now())),
            ],
          ),
        ),
        if (page.sections.isNotEmpty) ...<Widget>[
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
                Text('Sections', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: Spacing.x3),
                ...page.sections.map((BuilderPageSection section) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
                  child: Row(
                    children: <Widget>[
                      Icon(Icons.view_column, size: TypeScale.lg, color: t.primary),
                      const SizedBox(width: Spacing.x2),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(section.title ?? section.type, style: const TextStyle(fontWeight: TypeScale.medium)),
                            Text(section.type, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                          ],
                        ),
                      ),
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