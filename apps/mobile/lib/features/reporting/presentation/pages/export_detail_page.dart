import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/reporting.dart';
import '../providers/reporting_providers.dart';

class ReportExportDetailPage extends ConsumerWidget {
  const ReportExportDetailPage({required this.exportId, super.key});
  static const String routeName = 'export-detail';
  static const String routePath = '/reporting/exports/:id';
  final String exportId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(reportExportDetailProvider(exportId));
    return Scaffold(
      appBar: AppBar(title: const Text('Export')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(
          failure: e is Failure ? e : const ServerFailure('Could not load export.'),
          onRetry: () => ref.invalidate(reportExportDetailProvider(exportId)),
        ),
        data: (export) => _ExportDetail(export: export),
      ),
    );
  }
}

class _ExportDetail extends StatelessWidget {
  const _ExportDetail({required this.export});
  final ReportExport export;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (String statusLabel, Color statusColor, Color statusBg) = switch (export.status) {
      'COMPLETED' => ('Completed', t.success, t.successLight),
      'PROCESSING' => ('Processing', t.info, t.infoLight),
      'FAILED' => ('Failed', t.danger, t.dangerLight),
      _ => ('Pending', t.textSecondary, t.bgSunken),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.file_download_outlined, color: t.primary, size: 40),
              const SizedBox(width: Spacing.x3),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(export.reportName ?? 'Export', style: Theme.of(context).textTheme.titleLarge),
              ],),),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
                child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
              ),
            ],),
          ],),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Export Type', export.format),
          _FieldRow('Status', statusLabel),
          if (export.fileUrl != null) _FieldRow('File URL', export.fileUrl!),
          if (export.fileSize != null) _FieldRow('Size', '${(export.fileSize! / 1024).toStringAsFixed(1)} KB'),
          if (export.createdAt != null) _FieldRow('Created', Formatters.dateTime(export.createdAt!)),
        ],),),
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
