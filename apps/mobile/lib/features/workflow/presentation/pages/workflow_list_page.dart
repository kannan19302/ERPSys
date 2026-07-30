import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/workflow.dart';
import '../providers/workflow_providers.dart';

class WorkflowListPage extends ConsumerStatefulWidget {
  const WorkflowListPage({super.key});
  static const String routeName = 'workflows';
  static const String routePath = '/workflow/workflows';
  @override
  ConsumerState<WorkflowListPage> createState() => _WorkflowListPageState();
}

class _WorkflowListPageState extends ConsumerState<WorkflowListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name A-Z',
    '-name': 'Name Z-A',
    'version': 'Version',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(workflowDefinitionListControllerProvider);
    final controller = ref.read(workflowDefinitionListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Workflow Definitions'),
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
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search workflows...',
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
                    : '${state.meta.total} workflow${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(WorkflowDefinitionListState state, WorkflowDefinitionListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<WorkflowDefinition>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No workflow definitions',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Workflow definitions will appear here.',
      itemBuilder: (_, WorkflowDefinition def, __) => _WorkflowDefinitionTile(
        definition: def,
        onTap: () {},
        onToggleActive: def.isActive
            ? () => controller.deactivate(def.id)
            : () => controller.activate(def.id),
      ),
    );
  }
}

class _WorkflowDefinitionTile extends StatelessWidget {
  const _WorkflowDefinitionTile({
    required this.definition,
    required this.onTap,
    required this.onToggleActive,
  });

  final WorkflowDefinition definition;
  final VoidCallback onTap;
  final VoidCallback onToggleActive;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(definition.name,
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              UiStatusBadge(
                label: definition.isActive ? 'ACTIVE' : 'INACTIVE',
                tone: definition.isActive ? UiTone.success : UiTone.neutral,
              ),
            ]),
            if (definition.description != null) ...[
              const SizedBox(height: Spacing.x1),
              Text(definition.description!,
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm)),
            ],
            const SizedBox(height: Spacing.x2),
            Row(children: [
              if (definition.module != null) ...[
                Text(definition.module!,
                    style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                const SizedBox(width: Spacing.x3),
              ],
              Text('v${definition.version}',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
              const Spacer(),
              Text(Formatters.date(definition.updatedAt),
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
            ]),
            const SizedBox(height: Spacing.x2),
            Row(mainAxisAlignment: MainAxisAlignment.end, children: [
              IconButton(
                icon: Icon(
                  definition.isActive ? Icons.toggle_off_outlined : Icons.toggle_on_outlined,
                  color: definition.isActive ? t.danger : t.success,
                ),
                tooltip: definition.isActive ? 'Deactivate' : 'Activate',
                onPressed: onToggleActive,
              ),
            ]),
          ],
        ),
      ),
    );
  }
}
