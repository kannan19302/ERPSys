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
import '../../domain/entities/reporting.dart';
import '../providers/reporting_providers.dart';

class ReportJobDetailPage extends ConsumerWidget {
  const ReportJobDetailPage({required this.jobId, super.key});
  static const String routeName = 'job-detail';
  static const String routePath = '/reporting/jobs/:id';
  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(reportJobDetailProvider(jobId));
    return Scaffold(
      appBar: AppBar(title: const Text('Report Job')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(
          failure: e is Failure ? e : const ServerFailure('Could not load job.'),
          onRetry: () => ref.invalidate(reportJobDetailProvider(jobId)),
        ),
        data: (job) => _JobDetail(job: job),
      ),
    );
  }
}

class _JobDetail extends StatelessWidget {
  const _JobDetail({required this.job});
  final ReportJob job;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final (String statusLabel, Color statusColor, Color statusBg) = switch (job.status) {
      'COMPLETED' => ('Completed', t.success, t.successLight),
      'RUNNING' => ('Running', t.info, t.infoLight),
      'FAILED' => ('Failed', t.danger, t.dangerLight),
      _ => ('Pending', t.textSecondary, t.bgSunken),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.schedule, color: t.primary, size: 40),
              const SizedBox(width: Spacing.x3),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(job.templateName ?? 'Report Job', style: Theme.of(context).textTheme.titleLarge),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
                child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
              ),
            ]),
            if (job.error != null) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(job.error!, style: TextStyle(color: t.danger))),
          ]),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Details'),
          _FieldRow('Status', statusLabel),
          _FieldRow('Template', job.templateName ?? '—'),
          if (job.startedAt != null) _FieldRow('Started', Formatters.dateTime(job.startedAt!)),
          if (job.completedAt != null) _FieldRow('Completed', Formatters.dateTime(job.completedAt!)),
          if (job.duration != null) _FieldRow('Duration', Formatters.compact(job.duration!.inSeconds)),
          if (job.createdAt != null) _FieldRow('Created', Formatters.dateTime(job.createdAt!)),
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
