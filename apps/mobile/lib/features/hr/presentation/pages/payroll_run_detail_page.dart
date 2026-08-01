import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class PayrollRunDetailPage extends ConsumerWidget {
  const PayrollRunDetailPage({required this.payrollRunId, super.key});

  static const String routeName = 'payroll-run-detail';
  static const String routePath = '/hr/payroll/:id';

  final String payrollRunId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<PayrollRun> asyncRun =
        ref.watch(payrollRunDetailProvider(payrollRunId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payroll Run'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.assignment_outlined),
            tooltip: 'View payslips',
            onPressed: () => context.pushNamed(
              'payroll-entries',
              pathParameters: <String, String>{'id': payrollRunId},
            ),
          ),
        ],
      ),
      body: asyncRun.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load payroll run.'),
          onRetry: () =>
              ref.invalidate(payrollRunDetailProvider(payrollRunId)),
        ),
        data: (PayrollRun run) => _PayrollRunDetail(run: run),
      ),
    );
  }
}

class _PayrollRunDetail extends StatelessWidget {
  const _PayrollRunDetail({required this.run});

  final PayrollRun run;

  @override
  Widget build(BuildContext context) {
    final (String label, UiTone tone) = switch (run.status) {
      PayrollRunStatus.draft => ('Draft', UiTone.neutral),
      PayrollRunStatus.completed => ('Completed', UiTone.success),
      PayrollRunStatus.reversed => ('Reversed', UiTone.danger),
      _ => (run.status, UiTone.neutral),
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
                      run.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: label, tone: tone),
                ],
              ),
              const SizedBox(height: Spacing.x3),
              _Row('Period',
                  '${Formatters.date(run.periodStart)} – ${Formatters.date(run.periodEnd)}',),
              _Row('Employees', '${run.totalEmployees}'),
              _Row('Total Salary', Formatters.currency(run.totalSalary)),
              if (run.runDate != null)
                _Row('Run Date', Formatters.dateTime(run.runDate!)),
              if (run.createdAt != null)
                _Row('Created', Formatters.dateTime(run.createdAt!)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Summary'),
              _Row('Base Salary', Formatters.currency(run.totalSalary)),
              _Row('Total Employees', '${run.totalEmployees}'),
              const Divider(),
              _Row('Net Pay Total', Formatters.currency(run.totalSalary)),
            ],
          ),
        ),
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