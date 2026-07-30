import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/reporting.dart';
import '../providers/reporting_providers.dart';

class ReportComplianceListPage extends ConsumerStatefulWidget {
  const ReportComplianceListPage({super.key});
  static const String routeName = 'report-compliance';
  static const String routePath = '/reporting/compliance';
  @override
  ConsumerState<ReportComplianceListPage> createState() => _ReportComplianceListPageState();
}

class _ReportComplianceListPageState extends ConsumerState<ReportComplianceListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reportComplianceListControllerProvider);
    final controller = ref.read(reportComplianceListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compliance'),
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
                hintText: 'Search compliance records',
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
                    : '${state.meta.total} record${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ReportComplianceListState state, ReportComplianceListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ReportCompliance>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No compliance records',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Compliance records will appear here.',
      itemBuilder: (_, ReportCompliance c, __) => _ComplianceTile(
        compliance: c,
        onTap: () {},
      ),
    );
  }
}

class _ComplianceTile extends StatelessWidget {
  const _ComplianceTile({required this.compliance, required this.onTap});
  final ReportCompliance compliance;
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
                  child: Text(compliance.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: compliance.status,
                  tone: _statusTone(compliance.status),
                ),
              ]),
              if (compliance.regulation != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(compliance.regulation!,
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm)),
              ],
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (compliance.findings > 0)
                  Text('${compliance.findings} finding${compliance.findings == 1 ? '' : 's'}',
                      style: TextStyle(color: t.danger, fontSize: TypeScale.xs)),
                const Spacer(),
                if (compliance.lastRunAt != null)
                  Text('Last: ${DateFormat.yMMMd().format(compliance.lastRunAt!.toLocal())}',
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              ]),
              if (compliance.isOverdue) ...[
                const SizedBox(height: Spacing.x1),
                Text('Overdue', style: TextStyle(color: t.danger, fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'OVERDUE' => UiTone.danger,
        'INACTIVE' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}
