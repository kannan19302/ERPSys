import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/reporting.dart';
import '../providers/reporting_providers.dart';

class ReportExportListPage extends ConsumerStatefulWidget {
  const ReportExportListPage({super.key});
  static const String routeName = 'report-exports';
  static const String routePath = '/reporting/exports';
  @override
  ConsumerState<ReportExportListPage> createState() => _ReportExportListPageState();
}

class _ReportExportListPageState extends ConsumerState<ReportExportListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reportExportListControllerProvider);
    final controller = ref.read(reportExportListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Exports'),
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
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search exports',
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
                    : '${state.meta.total} export${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ReportExportListState state, ReportExportListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ReportExport>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No exports',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Exported reports will appear here.',
      itemBuilder: (_, ReportExport exp, __) => _ExportTile(
        exportItem: exp,
        onTap: () {},
      ),
    );
  }
}

class _ExportTile extends StatelessWidget {
  const _ExportTile({required this.exportItem, required this.onTap});
  final ReportExport exportItem;
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
                  child: Text(exportItem.reportName ?? exportItem.id,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: exportItem.status,
                  tone: _statusTone(exportItem.status),
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Text(exportItem.format,
                    style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(width: Spacing.x2),
                if (exportItem.fileSize != null)
                  Text(_formatSize(exportItem.fileSize!),
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm)),
              ]),
              if (exportItem.createdAt != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(DateFormat.yMMMd().add_jm().format(exportItem.createdAt!.toLocal()),
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  UiTone _statusTone(String status) => switch (status) {
        'COMPLETED' => UiTone.success,
        'GENERATING' => UiTone.warning,
        'PENDING' => UiTone.info,
        'FAILED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
