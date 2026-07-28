import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class TaskListPage extends ConsumerStatefulWidget {
  const TaskListPage({super.key});
  static const String routeName = 'tasks';
  static const String routePath = '/projects/tasks';
  @override
  ConsumerState<TaskListPage> createState() => _TaskListPageState();
}

class _TaskListPageState extends ConsumerState<TaskListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'title': 'Title A-Z',
    '-title': 'Title Z-A',
    '-priority': 'Highest priority',
    'priority': 'Lowest priority',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(taskListControllerProvider);
    final controller = ref.read(taskListControllerProvider.notifier);
    final palette = context.tokens;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tasks'),
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
                hintText: 'Search task title',
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
                    : '${state.meta.total} task${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(TaskListState state, TaskListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<Task>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No tasks found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Tasks created in UniERP will appear here.',
      itemBuilder: (_, Task task, __) => _TaskTile(task: task),
    );
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile({required this.task});
  final Task task;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(task.title,
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              UiStatusBadge(
                label: task.status,
                tone: _statusTone(task.status),
              ),
            ]),
            const SizedBox(height: Spacing.x1),
            Row(children: [
              UiStatusBadge(
                label: task.priority,
                tone: _priorityTone(task.priority),
              ),
              const SizedBox(width: Spacing.x2),
              if (task.assigneeName != null) ...[
                Icon(Icons.person_outline, size: TypeScale.sm, color: t.textTertiary),
                const SizedBox(width: Spacing.x0_5),
                Text(task.assigneeName!,
                    style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
              ],
            ]),
            if (task.dueDate != null || task.estimatedHours != null) ...[
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (task.dueDate != null) ...[
                  Icon(Icons.event_outlined, size: TypeScale.sm, color: t.textTertiary),
                  const SizedBox(width: Spacing.x0_5),
                  Text(Formatters.date(task.dueDate!),
                      style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                ],
                if (task.estimatedHours != null) ...[
                  const Spacer(),
                  Text('${task.estimatedHours!.toStringAsFixed(1)}h est.',
                      style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                ],
              ]),
            ],
          ],
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'TODO' => UiTone.neutral,
        'IN_PROGRESS' => UiTone.info,
        'IN_REVIEW' => UiTone.warning,
        'DONE' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };

  UiTone _priorityTone(String priority) => switch (priority) {
        'LOW' => UiTone.neutral,
        'MEDIUM' => UiTone.info,
        'HIGH' => UiTone.warning,
        'URGENT' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
