import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/reporting.dart';
import '../providers/reporting_providers.dart';

class ReportTemplateListPage extends ConsumerStatefulWidget {
  const ReportTemplateListPage({super.key});
  static const String routeName = 'report-templates';
  static const String routePath = '/reporting/templates';
  @override
  ConsumerState<ReportTemplateListPage> createState() => _ReportTemplateListPageState();
}

class _ReportTemplateListPageState extends ConsumerState<ReportTemplateListPage> {
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
    final state = ref.watch(reportTemplateListControllerProvider);
    final controller = ref.read(reportTemplateListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Templates'),
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
          label: const Text('New Template'),
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
                hintText: 'Search templates',
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
                    : '${state.meta.total} template${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ReportTemplateListState state, ReportTemplateListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ReportTemplate>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No report templates',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Report templates created in UniERP will appear here.',
      itemBuilder: (_, ReportTemplate tpl, __) => _TemplateTile(
        template: tpl,
        onTap: () {},
      ),
    );
  }
}

class _TemplateTile extends StatelessWidget {
  const _TemplateTile({required this.template, required this.onTap});
  final ReportTemplate template;
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
                  child: Text(template.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: template.status,
                  tone: _statusTone(template.status),
                ),
              ]),
              if (template.description != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(template.description!,
                    style: TextStyle(color: t.textSecondary)),
              ],
              if (template.reportType != null) ...[
                const SizedBox(height: Spacing.x1),
                Row(children: [
                  Text(template.reportType!,
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                  const SizedBox(width: Spacing.x2),
                  Text(template.format,
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                ]),
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
