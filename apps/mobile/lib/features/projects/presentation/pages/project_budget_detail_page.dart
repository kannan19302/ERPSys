import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectBudgetDetailPage extends ConsumerWidget {
  const ProjectBudgetDetailPage({required this.budgetId, super.key});
  static const String routeName = 'project-budget-detail';
  static const String routePath = '/projects/budgets/:id';
  final String budgetId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final budgetAsync = ref.watch(projectBudgetDetailProvider(budgetId));

    return Scaffold(
      appBar: AppBar(title: const Text('Budget')),
      body: budgetAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load budget.'),
          onRetry: () => ref.invalidate(projectBudgetDetailProvider(budgetId)),
        ),
        data: (b) => _BudgetDetail(budget: b),
      ),
    );
  }
}

class _BudgetDetail extends StatelessWidget {
  const _BudgetDetail({required this.budget});
  final ProjectBudget budget;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final double spentPct = budget.budgetedAmount > 0
        ? (budget.spentAmount / budget.budgetedAmount) * 100
        : 0;
    final bool overBudget = budget.remainingAmount < 0;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(budget.category, style: Theme.of(context).textTheme.titleLarge),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Amounts'),
            _Row('Budgeted', Formatters.currency(budget.budgetedAmount)),
            _Row('Spent', Formatters.currency(budget.spentAmount)),
            const Divider(height: Spacing.x4),
            _Row('Remaining', Formatters.currency(budget.remainingAmount)),
            if (overBudget)
              Padding(
                padding: const EdgeInsets.only(top: Spacing.x1),
                child: Text('Over budget!', style: TextStyle(color: t.danger, fontWeight: TypeScale.semibold)),
              ),
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Utilization'),
            const SizedBox(height: Spacing.x1),
            ClipRRect(
              borderRadius: Radii.pill,
              child: LinearProgressIndicator(
                value: (spentPct / 100).clamp(0, 1),
                minHeight: 8,
                backgroundColor: t.bgSunken,
                color: spentPct > 90 ? t.danger : spentPct > 75 ? t.warning : t.primary,
              ),
            ),
            const SizedBox(height: Spacing.x1),
            Text('${spentPct.toStringAsFixed(1)}% of budget used',
                style: TextStyle(color: t.textSecondary),),
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