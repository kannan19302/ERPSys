import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/advanced_finance.dart';
import '../providers/advanced_finance_providers.dart';

class FinancialCloseTaskDetailPage extends ConsumerWidget {
  const FinancialCloseTaskDetailPage({required this.taskId, super.key});

  static const String routeName = 'financial-close-task-detail';
  static const String routePath = '/advanced-finance/close-tasks/:id';

  final String taskId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<FinancialCloseTask> taskAsync =
        ref.watch(financialCloseTaskDetailProvider(taskId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Close Task'),
      ),
      body: taskAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load close task.'),
          onRetry: () => ref.invalidate(financialCloseTaskDetailProvider(taskId)),
        ),
        data: (FinancialCloseTask task) => _FinancialCloseTaskDetail(task: task),
      ),
    );
  }
}

class _FinancialCloseTaskDetail extends StatelessWidget {
  const _FinancialCloseTaskDetail({required this.task});

  final FinancialCloseTask task;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (task.status) {
      'COMPLETED' => ('Completed', t.success, t.successLight),
      'IN_PROGRESS' => ('In Progress', t.info, t.infoLight),
      'PENDING' => ('Pending', t.warning, t.warningLight),
      _ => ('Pending', t.warning, t.warningLight),
    };

    final (String priorityLabel, Color priorityColor, Color priorityBg) =
        switch (task.priority) {
      'HIGH' => ('High', t.danger, t.dangerLight),
      'MEDIUM' => ('Medium', t.warning, t.warningLight),
      'LOW' => ('Low', t.textSecondary, t.bgSunken),
      _ => ('Medium', t.warning, t.warningLight),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                task.title,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: Spacing.x2),
              Row(
                children: <Widget>[
                  _pill(statusLabel, statusColor, statusBg),
                  const SizedBox(width: Spacing.x2),
                  _pill(priorityLabel, priorityColor, priorityBg),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Task Details'),
              _FieldRow('Period', task.period),
              _FieldRow('Status', statusLabel),
              _FieldRow('Priority', priorityLabel),
              _FieldRow('Assigned To', task.assignedTo ?? '—'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Timeline'),
              _FieldRow('Due Date', task.dueDate != null ? Formatters.date(task.dueDate!) : '—'),
              _FieldRow('Completed At', task.completedAt != null ? Formatters.dateTime(task.completedAt!) : '—'),
              _FieldRow('Created', task.createdAt != null ? Formatters.dateTime(task.createdAt!) : '—'),
            ],
          ),
        ),
        if (task.notes != null && task.notes!.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const _SectionTitle(title: 'Notes'),
                Text(task.notes!),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _pill(String label, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.x2_5,
        vertical: Spacing.x1,
      ),
      decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: TypeScale.xs,
          fontWeight: TypeScale.medium,
        ),
      ),
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
