import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class TimesheetDetailPage extends ConsumerWidget {
  const TimesheetDetailPage({required this.timesheetId, super.key});
  static const String routeName = 'timesheet-detail';
  static const String routePath = '/projects/timesheets/:id';
  final String timesheetId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tsAsync = ref.watch(timesheetDetailProvider(timesheetId));

    return Scaffold(
      appBar: AppBar(title: const Text('Timesheet')),
      body: tsAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load timesheet.'),
          onRetry: () => ref.invalidate(timesheetDetailProvider(timesheetId)),
        ),
        data: (ts) => _TimesheetDetail(ts: ts),
      ),
    );
  }
}

class _TimesheetDetail extends StatelessWidget {
  const _TimesheetDetail({required this.ts});
  final Timesheet ts;

  UiTone _statusTone(String status) => switch (status) {
        'APPROVED' => UiTone.success,
        'SUBMITTED' => UiTone.info,
        'DRAFT' => UiTone.neutral,
        'REJECTED' => UiTone.danger,
        _ => UiTone.neutral,
      };

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(
                ts.projectName ?? 'Timesheet',
                style: Theme.of(context).textTheme.titleLarge,),),
              UiStatusBadge(label: ts.status, tone: _statusTone(ts.status)),
            ],),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Details'),
            _Row('Project', ts.projectName ?? '—'),
            _Row('Employee', ts.employeeName ?? ts.employeeId),
            _Row('Date', Formatters.date(ts.date)),
            _Row('Hours', '${ts.hours.toStringAsFixed(1)}h'),
            if (ts.description != null && ts.description!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: Spacing.x2),
                child: Text(ts.description!, style: Theme.of(context).textTheme.bodyMedium),
              ),
          ],
        ),),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}