import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class PayrollRunListPage extends ConsumerStatefulWidget {
  const PayrollRunListPage({super.key});

  static const String routeName = 'payroll-runs';
  static const String routePath = '/hr/payroll';

  @override
  ConsumerState<PayrollRunListPage> createState() => _PayrollRunListPageState();
}

class _PayrollRunListPageState extends ConsumerState<PayrollRunListPage> {
  @override
  Widget build(BuildContext context) {
    final PayrollRunListState state =
        ref.watch(payrollRunListControllerProvider);
    final PayrollRunListController controller =
        ref.read(payrollRunListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Payroll Runs')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('payroll-run-new'),
        icon: const Icon(Icons.add),
        label: const Text('New run'),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: Text(
              state.isLoading
                  ? 'Loading…'
                  : '${state.meta.total} run${state.meta.total == 1 ? '' : 's'}',
              style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(PayrollRunListState state, PayrollRunListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<PayrollRun>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No payroll runs',
      emptyMessage: 'Payroll runs will appear here.',
      itemBuilder: (BuildContext context, PayrollRun run, _) =>
          _PayrollRunTile(
        run: run,
        onTap: () => context.pushNamed(
          'payroll-run-detail',
          pathParameters: <String, String>{'id': run.id},
        ),
      ),
    );
  }
}

class _PayrollRunTile extends StatelessWidget {
  const _PayrollRunTile({required this.run, this.onTap});

  final PayrollRun run;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String label, UiTone tone) = switch (run.status) {
      PayrollRunStatus.draft => ('Draft', UiTone.neutral),
      PayrollRunStatus.completed => ('Completed', UiTone.success),
      PayrollRunStatus.reversed => ('Reversed', UiTone.danger),
      _ => (run.status, UiTone.neutral),
    };

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: Spacing.x4,
            backgroundColor: t.bgSunken,
            child: Icon(Icons.receipt_long_outlined,
                color: t.textSecondary, size: TypeScale.lg,),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  run.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  '${Formatters.date(run.periodStart)} – ${Formatters.date(run.periodEnd)}',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  '${run.totalEmployees} employees | ${Formatters.currency(run.totalSalary)}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          UiStatusBadge(label: label, tone: tone),
        ],
      ),
    );
  }
}