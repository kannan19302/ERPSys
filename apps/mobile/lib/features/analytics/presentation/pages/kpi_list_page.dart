import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/analytics.dart';
import '../providers/analytics_providers.dart';

class KpiListPage extends ConsumerStatefulWidget {
  const KpiListPage({super.key});
  static const String routeName = 'kpis';
  static const String routePath = '/analytics/kpis';
  @override
  ConsumerState<KpiListPage> createState() => _KpiListPageState();
}

class _KpiListPageState extends ConsumerState<KpiListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-value': 'Highest value',
    'value': 'Lowest value',
    'name': 'Name',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(kpiListControllerProvider);
    final controller = ref.read(kpiListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('KPIs'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value),),)
                .toList(),
          ),
        ],
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () {},
          icon: const Icon(Icons.add),
          label: const Text('New KPI'),
        ),
      ),
      body: Column(
        children: [
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search KPIs',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () { _search.clear(); controller.search(''); },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} KPI${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(KpiListState state, KpiListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<AnalyticsKpi>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No KPIs',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'KPIs created in UniERP will appear here.',
      itemBuilder: (_, AnalyticsKpi kpi, __) => _KpiTile(
        kpi: kpi,
        onTap: () {},
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  const _KpiTile({required this.kpi, required this.onTap});
  final AnalyticsKpi kpi;
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
                  child: Text(kpi.name,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: kpi.status,
                  tone: _statusTone(kpi.status),
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Text('${kpi.value.toStringAsFixed(1)}${kpi.unit ?? ''}',
                    style: Theme.of(context).textTheme.labelLarge,),
                if (kpi.target != null) ...[
                  const SizedBox(width: Spacing.x2),
                  Text('of ${kpi.target}',
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),),
                ],
              ],),
              if (kpi.trend != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(kpi.trend!, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'INACTIVE' => UiTone.neutral,
        'ARCHIVED' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}
