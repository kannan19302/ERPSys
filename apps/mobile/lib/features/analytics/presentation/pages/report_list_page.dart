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

class AnalyticsReportListPage extends ConsumerStatefulWidget {
  const AnalyticsReportListPage({super.key});
  static const String routeName = 'analytics-reports';
  static const String routePath = '/analytics/reports';
  @override
  ConsumerState<AnalyticsReportListPage> createState() => _AnalyticsReportListPageState();
}

class _AnalyticsReportListPageState extends ConsumerState<AnalyticsReportListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'title': 'Title',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reportListControllerProvider);
    final controller = ref.read(reportListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics Reports'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () {},
          icon: const Icon(Icons.add),
          label: const Text('New Report'),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search reports',
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
                    : '${state.meta.total} report${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ReportListState state, ReportListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<AnalyticsReport>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No reports',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Reports created in UniERP will appear here.',
      itemBuilder: (_, AnalyticsReport r, __) => _ReportTile(
        report: r,
        onTap: () {},
      ),
    );
  }
}

class _ReportTile extends StatelessWidget {
  const _ReportTile({required this.report, required this.onTap});
  final AnalyticsReport report;
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
                  child: Text(report.title,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: report.status,
                  tone: _statusTone(report.status),
                ),
              ]),
              if (report.description != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(report.description!,
                    style: TextStyle(color: t.textSecondary)),
              ],
              if (report.reportType != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(report.reportType!,
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'PUBLISHED' => UiTone.success,
        'DRAFT' => UiTone.neutral,
        'ARCHIVED' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}
