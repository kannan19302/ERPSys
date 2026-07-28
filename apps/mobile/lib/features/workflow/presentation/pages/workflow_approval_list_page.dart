import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/workflow.dart';
import '../providers/workflow_providers.dart';

class WorkflowApprovalListPage extends ConsumerStatefulWidget {
  const WorkflowApprovalListPage({super.key});
  static const String routeName = 'workflow-approvals';
  static const String routePath = '/workflow/approvals';
  @override
  ConsumerState<WorkflowApprovalListPage> createState() => _WorkflowApprovalListPageState();
}

class _WorkflowApprovalListPageState extends ConsumerState<WorkflowApprovalListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(workflowTaskListControllerProvider);
    final controller = ref.read(workflowTaskListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Approvals'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            tooltip: 'Filter',
            initialValue: state.query.filters['status'] ?? 'PENDING',
            onSelected: (status) {
              controller.applyFilters({'status': status});
            },
            itemBuilder: (_) => const <PopupMenuEntry<String>>[
              PopupMenuItem<String>(value: 'PENDING', child: Text('Pending')),
              PopupMenuItem<String>(value: 'APPROVED', child: Text('Approved')),
              PopupMenuItem<String>(value: 'REJECTED', child: Text('Rejected')),
              PopupMenuItem<String>(value: 'ESCALATED', child: Text('Escalated')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} task${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(WorkflowTaskListState state, WorkflowTaskListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<WorkflowTask>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No approval tasks',
      emptyMessage: 'All caught up — no pending approvals.',
      itemBuilder: (_, WorkflowTask task, __) => _ApprovalTaskTile(
        task: task,
        onApprove: task.status == 'PENDING'
            ? () => controller.approve(task.id)
            : null,
        onReject: task.status == 'PENDING'
            ? () => controller.reject(task.id)
            : null,
        onEscalate: task.status == 'PENDING'
            ? () => controller.escalate(task.id)
            : null,
      ),
    );
  }
}

class _ApprovalTaskTile extends StatelessWidget {
  const _ApprovalTaskTile({
    required this.task,
    this.onApprove,
    this.onReject,
    this.onEscalate,
  });

  final WorkflowTask task;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final VoidCallback? onEscalate;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(
              child: Text(
                task.stepName ?? 'Approval Step',
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
            UiStatusBadge(
              label: task.status,
              tone: _statusTone(task.status),
            ),
          ]),
          const SizedBox(height: Spacing.x1),
          if (task.assignedTo != null)
            Text('Assigned to: ${task.assignedTo}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm)),
          const SizedBox(height: Spacing.x1),
          Row(children: [
            Text('Created ${Formatters.relative(task.createdAt)}',
                style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
            if (task.dueDate != null) ...[
              const Spacer(),
              Icon(Icons.access_time, size: 14, color: task.dueDate!.isBefore(DateTime.now()) ? t.danger : t.textTertiary),
              const SizedBox(width: Spacing.x1),
              Text(
                Formatters.date(task.dueDate!),
                style: TextStyle(
                  color: task.dueDate!.isBefore(DateTime.now()) ? t.danger : t.textTertiary,
                  fontSize: TypeScale.xs,
                ),
              ),
            ],
          ]),
          if (onApprove != null || onReject != null) ...[
            const SizedBox(height: Spacing.x3),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (onReject != null)
                  OutlinedButton.icon(
                    onPressed: onReject,
                    icon: const Icon(Icons.close, size: 16),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(foregroundColor: t.danger),
                  ),
                const SizedBox(width: Spacing.x2),
                if (onApprove != null)
                  FilledButton.icon(
                    onPressed: onApprove,
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Approve'),
                  ),
                if (onEscalate != null) ...[
                  const SizedBox(width: Spacing.x2),
                  IconButton(
                    icon: const Icon(Icons.arrow_upward, size: 16),
                    tooltip: 'Escalate',
                    onPressed: onEscalate,
                    style: IconButton.styleFrom(foregroundColor: t.warning),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'PENDING' => UiTone.warning,
        'APPROVED' => UiTone.success,
        'REJECTED' => UiTone.danger,
        'DELEGATED' => UiTone.info,
        'ESCALATED' => UiTone.info,
        _ => UiTone.neutral,
      };
}
