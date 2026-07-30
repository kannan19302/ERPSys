import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/documents.dart';
import '../providers/documents_providers.dart';

class FolderDetailPage extends ConsumerWidget {
  const FolderDetailPage({required this.folderId, super.key});

  static const String routeName = 'folder-detail';
  static const String routePath = '/documents/folders/:id';

  final String folderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<DocumentFolder> folderAsync =
        ref.watch(folderDetailProvider(folderId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Folder'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete folder',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: folderAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load folder.'),
          onRetry: () => ref.invalidate(folderDetailProvider(folderId)),
        ),
        data: (DocumentFolder folder) => _FolderDetail(folder: folder),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete folder?'),
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
        .read(folderListControllerProvider.notifier)
        .delete(folderId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _FolderDetail extends StatelessWidget {
  const _FolderDetail({required this.folder});

  final DocumentFolder folder;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

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
                  Icon(Icons.folder_outlined, size: Spacing.x8, color: t.primary),
                  const SizedBox(width: Spacing.x3),
                  Expanded(
                    child: Text(
                      folder.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                ],
              ),
              if (folder.description != null && folder.description!.isNotEmpty) ...<Widget>[
                const SizedBox(height: Spacing.x2),
                Text(folder.description!, style: TextStyle(color: t.textSecondary)),
              ],
            ],
          ),
        ),
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
              const Text('Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: Spacing.x3),
              _FieldRow('Documents', '${folder.documentCount}'),
              _FieldRow('Parent Folder', folder.parentId ?? '—'),
              _FieldRow('Created', Formatters.date(folder.createdAt)),
              _FieldRow('Updated', Formatters.date(folder.updatedAt)),
            ],
          ),
        ),
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