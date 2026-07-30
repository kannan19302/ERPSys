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
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/drive.dart';
import '../providers/drive_providers.dart';

class DriveFileDetailPage extends ConsumerWidget {
  const DriveFileDetailPage({required this.fileId, super.key});
  static const String routeName = 'drive-file-detail';
  static const String routePath = '/drive/files/:id';
  final String fileId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(driveFileDetailProvider(fileId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('File'),
        actions: [IconButton(
          icon: const Icon(Icons.delete_outline), tooltip: 'Delete file',
          onPressed: () async {
            final confirmed = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
              title: const Text('Delete file?'), content: const Text('Move to trash.'),
              actions: [TextButton(onPressed: () => Navigator.of(c).pop(false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.of(c).pop(true), child: const Text('Delete'))],
            ));
            if (confirmed != true || !context.mounted) return;
            final r = await ref.read(driveFileListControllerProvider.notifier).delete(fileId);
            if (!context.mounted) return;
            r.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
          },
        )],
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load file.'), onRetry: () => ref.invalidate(driveFileDetailProvider(fileId))),
        data: (f) => _DriveFileDetail(file: f),
      ),
    );
  }
}

class _DriveFileDetail extends StatelessWidget {
  const _DriveFileDetail({required this.file});
  final DriveFile file;

  IconData _fileIcon() => switch (file.mimeType) {
    'application/pdf' => Icons.picture_as_pdf,
    'image/' when file.mimeType.startsWith('image/') => Icons.image,
    'video/' when file.mimeType.startsWith('video/') => Icons.videocam,
    'audio/' when file.mimeType.startsWith('audio/') => Icons.audiotrack,
    'text/' when file.mimeType.startsWith('text/') => Icons.article,
    _ => Icons.insert_drive_file_outlined,
  };

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(_fileIcon(), color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(file.name, style: Theme.of(context).textTheme.titleLarge),
              Text(_formatSize(file.size), style: TextStyle(color: t.textSecondary)),
            ])),
            if (file.isStarred) Icon(Icons.star, color: t.warning, size: 24),
          ]),
          if (file.description != null && file.description!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(file.description!, style: TextStyle(color: t.textSecondary))),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Type', file.mimeType),
          _FieldRow('Extension', file.extension ?? '—'),
          _FieldRow('Size', _formatSize(file.size)),
          _FieldRow('Version', 'v${file.currentVersion}'),
          _FieldRow('Checksum', file.checksum != null ? file.checksum!.substring(0, 16) : '—'),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Storage'),
          _FieldRow('Path', file.storagePath),
          _FieldRow('Owner', file.ownerId),
          if (file.isDeleted && file.deletedAt != null) _FieldRow('Deleted', Formatters.dateTime(file.deletedAt!)),
        ])),
        if (file.createdAt != null) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const _SectionTitle(title: 'Timeline'),
            _FieldRow('Created', Formatters.dateTime(file.createdAt!)),
            if (file.updatedAt != null) _FieldRow('Modified', Formatters.dateTime(file.updatedAt!)),
          ])),
        ],
      ],
    );
  }
}

class DriveFolderDetailPage extends ConsumerWidget {
  const DriveFolderDetailPage({required this.folderId, super.key});
  static const String routeName = 'drive-folder-detail';
  static const String routePath = '/drive/folders/:id';
  final String folderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(driveFolderDetailProvider(folderId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Folder'),
        actions: [IconButton(
          icon: const Icon(Icons.delete_outline), tooltip: 'Delete folder',
          onPressed: () async {
            final confirmed = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
              title: const Text('Delete folder?'), content: const Text('Move to trash.'),
              actions: [TextButton(onPressed: () => Navigator.of(c).pop(false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.of(c).pop(true), child: const Text('Delete'))],
            ));
            if (confirmed != true || !context.mounted) return;
            final r = await ref.read(driveFolderListControllerProvider.notifier).delete(folderId);
            if (!context.mounted) return;
            r.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
          },
        )],
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load folder.'), onRetry: () => ref.invalidate(driveFolderDetailProvider(folderId))),
        data: (f) => _DriveFolderDetail(folder: f),
      ),
    );
  }
}

class _DriveFolderDetail extends StatelessWidget {
  const _DriveFolderDetail({required this.folder});
  final DriveFolder folder;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(folder.icon != null ? Icons.folder_special : Icons.folder, color: folder.color != null ? Color(int.parse(folder.color!.replaceFirst('#', '0xFF'))) : t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(folder.name, style: Theme.of(context).textTheme.titleLarge),
              if (folder.path != null) Text(folder.path!, style: TextStyle(color: t.textSecondary)),
            ])),
            if (folder.isStarred) Icon(Icons.star, color: t.warning, size: 24),
          ]),
          if (folder.description != null && folder.description!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(folder.description!, style: TextStyle(color: t.textSecondary))),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Files', '${folder.fileCount}'),
          _FieldRow('Size', '${folder.size} bytes'),
          _FieldRow('Owner', folder.ownerId),
          if (folder.parentId != null) _FieldRow('Parent', folder.parentId!),
        ])),
        if (folder.createdAt != null) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const _SectionTitle(title: 'Timeline'),
            _FieldRow('Created', Formatters.dateTime(folder.createdAt!)),
            if (folder.updatedAt != null) _FieldRow('Modified', Formatters.dateTime(folder.updatedAt!)),
          ])),
        ],
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child}); final Widget child;
  @override Widget build(BuildContext context) { final t = context.tokens; return Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4), decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)), child: child); }
}
class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title}); final String title;
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: Spacing.x3), child: Text(title, style: Theme.of(context).textTheme.titleMedium));
}
class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value); final String label; final String value;
  @override Widget build(BuildContext context) { final t = context.tokens; return Padding(padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5), child: Row(children: [Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))), Text(value, style: Theme.of(context).textTheme.labelLarge)])); }
}