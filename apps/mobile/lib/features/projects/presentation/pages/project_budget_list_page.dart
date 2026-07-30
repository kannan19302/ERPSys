import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectBudgetListPage extends ConsumerStatefulWidget {
  const ProjectBudgetListPage({super.key});
  static const String routeName = 'project-budgets';
  static const String routePath = '/projects/budgets';
  @override
  ConsumerState<ProjectBudgetListPage> createState() => _ProjectBudgetListPageState();
}

class _ProjectBudgetListPageState extends ConsumerState<ProjectBudgetListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(projectBudgetListControllerProvider);
    final controller = ref.read(projectBudgetListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Project Budgets')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} budget${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ProjectBudgetListState state, ProjectBudgetListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ProjectBudget>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: () {},
      emptyTitle: 'No budgets',
      emptyMessage: 'Budget entries will appear here.',
      itemBuilder: (_, ProjectBudget b, __) => _BudgetTile(
        budget: b,
        onTap: () => context.pushNamed(
          'project-budget-detail',
          pathParameters: <String, String>{'id': b.id},
        ),
      ),
    );
  }
}

class _BudgetTile extends StatelessWidget {
  const _BudgetTile({required this.budget, required this.onTap});
  final ProjectBudget budget;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final double spentPct = budget.budgetedAmount > 0
        ? (budget.spentAmount / budget.budgetedAmount) * 100
        : 0;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(budget.category,
                    style: Theme.of(context).textTheme.titleSmall)),
                Text(Formatters.currency(budget.budgetedAmount),
                    style: Theme.of(context).textTheme.labelLarge),
              ]),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Text('Spent: ${Formatters.currency(budget.spentAmount)}',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                const Spacer(),
                Text('Remaining: ${Formatters.currency(budget.remainingAmount)}',
                    style: TextStyle(
                      color: budget.remainingAmount < 0 ? t.danger : t.success,
                      fontSize: TypeScale.xs,
                      fontWeight: TypeScale.semibold,
                    )),
              ]),
              const SizedBox(height: Spacing.x1),
              ClipRRect(
                borderRadius: Radii.pill,
                child: LinearProgressIndicator(
                  value: (spentPct / 100).clamp(0, 1),
                  minHeight: 4,
                  backgroundColor: t.bgSunken,
                  color: spentPct > 90 ? t.danger : spentPct > 75 ? t.warning : t.primary,
                ),
              ),
              const SizedBox(height: Spacing.x0_5),
              Text('${spentPct.toStringAsFixed(0)}% used',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
            ],
          ),
        ),
      ),
    );
  }
}