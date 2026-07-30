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
import '../../domain/entities/storage.dart';
import '../providers/storage_providers.dart';

class BucketDetailPage extends ConsumerWidget {
  const BucketDetailPage({required this.bucketId, super.key});
  static const String routeName = 'bucket-detail';
  static const String routePath = '/storage/buckets/:id';
  final String bucketId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(storageBucketDetailProvider(bucketId));
    return Scaffold(
      appBar: AppBar(title: const Text('Bucket')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load bucket.'), onRetry: () => ref.invalidate(storageBucketDetailProvider(bucketId))),
        data: (b) => _BucketDetail(bucket: b),
      ),
    );
  }
}

class _BucketDetail extends StatelessWidget {
  const _BucketDetail({required this.bucket}); final StorageBucket bucket;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.cloud_outlined, color: t.primary, size: 40), const SizedBox(width: Spacing.x3),
            Expanded(child: Text(bucket.bucketName, style: Theme.of(context).textTheme.titleLarge)),
          ]),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Configuration'),
          _FieldRow('Provider', bucket.provider), _FieldRow('Region', bucket.region),
          _FieldRow('Quota', '${bucket.maxQuotaGb} GB'), _FieldRow('Used', '${bucket.currentSizeGb.toStringAsFixed(2)} GB'),
          _FieldRow('Public', bucket.isPublic ? 'Yes' : 'No'), _FieldRow('Versioning', bucket.versioning ? 'Enabled' : 'Disabled'),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Timeline'),
          if (bucket.createdAt != null) _FieldRow('Created', Formatters.dateTime(bucket.createdAt!)),
          if (bucket.updatedAt != null) _FieldRow('Updated', Formatters.dateTime(bucket.updatedAt!)),
        ])),
      ],
    );
  }
}

class StorageFileDetailPage extends ConsumerWidget {
  const StorageFileDetailPage({required this.fileId, super.key});
  static const String routeName = 'storage-file-detail';
  static const String routePath = '/storage/files/:id';
  final String fileId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(storageFileDetailProvider(fileId));
    return Scaffold(
      appBar: AppBar(title: const Text('File')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load file.'), onRetry: () => ref.invalidate(storageFileDetailProvider(fileId))),
        data: (f) => _FileDetail(file: f),
      ),
    );
  }
}

class _FileDetail extends StatelessWidget {
  const _FileDetail({required this.file}); final StorageFile file;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.insert_drive_file_outlined, color: t.primary, size: 40), const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(file.name, style: Theme.of(context).textTheme.titleLarge), if (file.mimeType != null) Text(file.mimeType!, style: TextStyle(color: t.textSecondary)),
            ])),
          ]),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'File Info'),
          _FieldRow('Size', file.size > 0 ? '${(file.size / 1024).toStringAsFixed(1)} KB' : '—'),
          _FieldRow('MIME Type', file.mimeType ?? '—'), _FieldRow('Bucket', file.bucket),
          _FieldRow('Key', file.fileKey),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Timeline'),
          if (file.createdAt != null) _FieldRow('Created', Formatters.dateTime(file.createdAt!)),
          if (file.updatedAt != null) _FieldRow('Updated', Formatters.dateTime(file.updatedAt!)),
        ])),
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