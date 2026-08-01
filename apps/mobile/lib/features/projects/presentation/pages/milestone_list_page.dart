import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class MilestoneListPage extends ConsumerStatefulWidget {
  const MilestoneListPage({super.key});
  static const String routeName = 'milestones';
  static const String routePath = '/projects/milestones';
  @override
  ConsumerState<MilestoneListPage> createState() => _MilestoneListPageState();
}

class _MilestoneListPageState extends ConsumerState<MilestoneListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(milestoneListControllerProvider);
    final controller = ref.read(milestoneListControllerProvider.notifier);
    final palette = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Milestones')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} milestone${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(MilestoneListState state, MilestoneListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<Milestone>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No milestones found',
      emptyMessage: 'Milestones created in UniERP will appear here.',
      itemBuilder: (_, Milestone milestone, __) => _MilestoneTile(milestone: milestone),
    );
  }
}

class _MilestoneTile extends StatelessWidget {
  const _MilestoneTile({required this.milestone});
  final Milestone milestone;

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
                child: Text(milestone.title,
                    style: Theme.of(context).textTheme.titleSmall,),
              ),
              UiStatusBadge(
                label: milestone.status,
                tone: _statusTone(milestone.status),
              ),
            ],),
            const SizedBox(height: Spacing.x1),
            Row(children: [
              Icon(Icons.event, size: TypeScale.sm, color: t.textTertiary),
              const SizedBox(width: Spacing.x0_5),
              Text('Due ${Formatters.date(milestone.dueDate)}',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),),
            ],),
          ],
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'PENDING' => UiTone.neutral,
        'IN_PROGRESS' => UiTone.info,
        'ACHIEVED' => UiTone.success,
        'MISSED' => UiTone.danger,
        'CANCELLED' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}
