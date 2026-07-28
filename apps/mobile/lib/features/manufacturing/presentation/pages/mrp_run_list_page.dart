import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/manufacturing.dart';
import '../providers/manufacturing_providers.dart';

class MrpRunListPage extends ConsumerStatefulWidget {
  const MrpRunListPage({super.key});
  static const String routeName = 'mrp-runs';
  static const String routePath = '/manufacturing/mrp';
  @override
  ConsumerState<MrpRunListPage> createState() => _MrpRunListPageState();
}

class _MrpRunListPageState extends ConsumerState<MrpRunListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mrpRunListControllerProvider);
    final controller = ref.read(mrpRunListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('MRP Runs')),
      body: Column(
        children: [
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} run${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(MrpRunListState state, MrpRunListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<MrpRun>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No MRP runs',
      emptyMessage: 'MRP runs will appear here after you run Material Requirements Planning.',
      itemBuilder: (_, MrpRun run, __) => _MrpRunTile(
        run: run,
        onTap: () => context.pushNamed(
          'mrp-run-detail',
          pathParameters: <String, String>{'id': run.id},
        ),
      ),
    );
  }
}

class _MrpRunTile extends StatelessWidget {
  const _MrpRunTile({required this.run, required this.onTap});
  final MrpRun run;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

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
                Expanded(
                  child: Text(run.productName,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: run.status,
                  tone: _statusTone(run.status),
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Text('Demand: ${Formatters.number(run.demandQuantity)}',
                  style: TextStyle(color: t.textSecondary)),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Text('Supply: ${Formatters.number(run.supplyQuantity)}',
                    style: const TextStyle(fontSize: TypeScale.xs)),
                const SizedBox(width: Spacing.x4),
                Text('Net: ${Formatters.number(run.netRequirement)}',
                    style: TextStyle(
                      fontSize: TypeScale.xs,
                      fontWeight: TypeScale.semibold,
                      color: run.netRequirement > 0 ? t.danger : t.success,
                    )),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral,
        'RUNNING' => UiTone.warning,
        'COMPLETED' => UiTone.success,
        'FAILED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
