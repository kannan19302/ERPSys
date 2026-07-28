import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class ReorderSuggestionListPage extends ConsumerStatefulWidget {
  const ReorderSuggestionListPage({super.key});
  static const String routeName = 'reorder-suggestions';
  static const String routePath = '/supply-chain/reorder-suggestions';
  @override
  ConsumerState<ReorderSuggestionListPage> createState() => _ReorderSuggestionListPageState();
}

class _ReorderSuggestionListPageState extends ConsumerState<ReorderSuggestionListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reorderSuggestionListControllerProvider);
    final controller = ref.read(reorderSuggestionListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reorder Suggestions'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} suggestion${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ReorderSuggestionListState state, ReorderSuggestionListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ReorderSuggestion>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No suggestions',
      emptyMessage: 'Reorder suggestions generated in UniERP will appear here.',
      itemBuilder: (_, ReorderSuggestion suggestion, __) => _SuggestionTile(
        suggestion: suggestion,
        onApprove: suggestion.status != 'APPROVED'
            ? () => controller.approve(suggestion.id)
            : null,
      ),
    );
  }
}

class _SuggestionTile extends StatelessWidget {
  const _SuggestionTile({required this.suggestion, this.onApprove});
  final ReorderSuggestion suggestion;
  final VoidCallback? onApprove;

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
                child: Text(suggestion.productName,
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              if (suggestion.status != null)
                UiStatusBadge(
                  label: suggestion.status!,
                  tone: suggestion.status == 'APPROVED'
                      ? UiTone.success
                      : UiTone.warning,
                ),
            ]),
            const SizedBox(height: Spacing.x1),
            Text('Reorder qty: ${suggestion.reorderQuantity}',
                style: TextStyle(color: t.textSecondary)),
            if (onApprove != null) ...[
              const SizedBox(height: Spacing.x2),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.icon(
                  onPressed: onApprove,
                  icon: const Icon(Icons.check, size: TypeScale.sm),
                  label: const Text('Approve'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.x3, vertical: Spacing.x1_5,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
