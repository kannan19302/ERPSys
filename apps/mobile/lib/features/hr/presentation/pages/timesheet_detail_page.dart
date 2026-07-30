import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class TimesheetDetailPage extends ConsumerWidget {
  const TimesheetDetailPage({required this.timesheetId, super.key});

  static const String routeName = 'hr-timesheet-detail';
  static const String routePath = '/hr/timesheets/:id';

  final String timesheetId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Timesheet> asyncTs =
        ref.watch(timesheetDetailProvider(timesheetId));
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Timesheet'),
        actions: <Widget>[
          if (asyncTs.valueOrNull?.status == TimesheetStatus.draft)
            IconButton(
              icon: const Icon(Icons.send_outlined),
              tooltip: 'Submit',
              onPressed: () => _submit(context, ref),
            ),
        ],
      ),
      body: asyncTs.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load timesheet.'),
          onRetry: () => ref.invalidate(timesheetDetailProvider(timesheetId)),
        ),
        data: (Timesheet ts) => _TimesheetDetail(timesheet: ts),
      ),
    );
  }

  Future<void> _submit(BuildContext context, WidgetRef ref) async {
    final result = await ref
        .read(timesheetListControllerProvider.notifier)
        .submit(timesheetId);
    if (!context.mounted) return;
    result.fold(
      (Failure failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Timesheet submitted')),
        );
        ref.invalidate(timesheetDetailProvider(timesheetId));
      },
    );
  }
}

class _TimesheetDetail extends StatelessWidget {
  const _TimesheetDetail({required this.timesheet});

  final Timesheet timesheet;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String label, UiTone tone) = switch (timesheet.status) {
      TimesheetStatus.draft => ('Draft', UiTone.neutral),
      TimesheetStatus.submitted => ('Submitted', UiTone.warning),
      TimesheetStatus.approved => ('Approved', UiTone.success),
      TimesheetStatus.rejected => ('Rejected', UiTone.danger),
      _ => (timesheet.status, UiTone.neutral),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      timesheet.employeeName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: label, tone: tone),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              _Row(
                'Week',
                'Week of ${Formatters.date(timesheet.weekStart)}',
              ),
              _Row('Total Hours', '${timesheet.totalHours.toStringAsFixed(1)} h'),
              if (timesheet.createdAt != null)
                _Row('Created', Formatters.dateTime(timesheet.createdAt!)),
            ],
          ),
        ),
        if (timesheet.entries.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          const UiSectionHeader(title: 'Time Entries'),
          ...timesheet.entries.map(
            (TimesheetEntry entry) => UiCard(
              padding: const EdgeInsets.all(Spacing.x3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          Formatters.date(entry.date),
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                      ),
                      Text(
                        '${entry.hours.toStringAsFixed(1)} h',
                        style: TextStyle(
                          fontWeight: TypeScale.semibold,
                          color: t.primary,
                        ),
                      ),
                    ],
                  ),
                  if (entry.projectName != null ||
                      entry.taskName != null) ...<Widget>[
                    const SizedBox(height: Spacing.x1),
                    Text(
                      [
                        if (entry.projectName != null) entry.projectName!,
                        if (entry.taskName != null) entry.taskName!,
                      ].join(' / '),
                      style: TextStyle(
                        color: t.textSecondary,
                        fontSize: TypeScale.xs,
                      ),
                    ),
                  ],
                  if (entry.description != null &&
                      entry.description!.isNotEmpty) ...<Widget>[
                    const SizedBox(height: Spacing.x1),
                    Text(
                      entry.description!,
                      style: TextStyle(
                        color: t.textTertiary,
                        fontSize: TypeScale.xs,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
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