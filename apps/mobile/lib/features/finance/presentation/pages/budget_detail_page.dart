import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class BudgetDetailPage extends ConsumerWidget {
  const BudgetDetailPage({required this.budgetId, super.key});

  static const String routeName = 'budget-detail';
  static const String routePath = '/finance/budgets/:id';

  final String budgetId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Budget> budgetAsync =
        ref.watch(budgetDetailProvider(budgetId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Budget'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete budget',
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      body: budgetAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load budget.'),
          onRetry: () => ref.invalidate(budgetDetailProvider(budgetId)),
        ),
        data: (Budget budget) => _BudgetDetail(budget: budget),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete budget?'),
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
        .read(budgetsProvider.notifier)
        .delete(budgetId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _BudgetDetail extends StatelessWidget {
  const _BudgetDetail({required this.budget});

  final Budget budget;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, UiTone tone) = switch (budget.status) {
      'ACTIVE' => ('Active', UiTone.success),
      'CLOSED' => ('Closed', UiTone.neutral),
      _ => ('Draft', UiTone.warning),
    };

    final double spentPct = budget.totalAmount > 0
        ? (budget.spentAmount / budget.totalAmount * 100).clamp(0, 100)
        : 0;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      budget.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: statusLabel, tone: tone),
                ],
              ),
              const SizedBox(height: Spacing.x2),
              Text('FY ${budget.fiscalYear}', style: TextStyle(color: t.textSecondary)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Budget vs Actuals'),
              const SizedBox(height: Spacing.x2),
              Row(
                children: <Widget>[
                  _MetricColumn(label: 'Budget', value: Formatters.currency(budget.totalAmount), t: t),
                  const SizedBox(width: Spacing.x3),
                  _MetricColumn(label: 'Spent', value: Formatters.currency(budget.spentAmount), t: t),
                  const SizedBox(width: Spacing.x3),
                  _MetricColumn(label: 'Remaining', value: Formatters.currency(budget.remainingAmount), t: t),
                ],
              ),
              const SizedBox(height: Spacing.x4),
              ClipRRect(
                borderRadius: Radii.pill,
                child: LinearProgressIndicator(
                  value: spentPct / 100,
                  minHeight: 8,
                  backgroundColor: t.bgSunken,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    spentPct > 90 ? t.danger : t.primary,
                  ),
                ),
              ),
              const SizedBox(height: Spacing.x1),
              Text(
                '${spentPct.toStringAsFixed(1)}% spent',
                style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Details'),
              _FieldRow('Name', budget.name),
              _FieldRow('Fiscal Year', budget.fiscalYear),
              _FieldRow('Status', budget.status),
              _FieldRow('Created', budget.createdAt != null ? Formatters.date(budget.createdAt!) : '—'),
            ],
          ),
        ),
      ],
    );
  }
}

class _MetricColumn extends StatelessWidget {
  const _MetricColumn({required this.label, required this.value, required this.t});

  final String label;
  final String value;
  final Palette t;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
          const SizedBox(height: Spacing.x1),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
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
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
