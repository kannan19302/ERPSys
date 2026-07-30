import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/saved_views.dart';
import '../providers/saved_views_providers.dart';

class SavedViewListPage extends ConsumerStatefulWidget {
  const SavedViewListPage({super.key});
  static const String routeName = 'saved-views';
  static const String routePath = '/saved-views';
  @override
  ConsumerState<SavedViewListPage> createState() => _SavedViewListPageState();
}

class _SavedViewListPageState extends ConsumerState<SavedViewListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(savedViewListControllerProvider);
    final controller = ref.read(savedViewListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Saved Views')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search views by name',
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
                    : '${state.meta.total} view${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(SavedViewListState state, SavedViewListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<SavedView>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No saved views',
      emptyMessage: 'Views saved in UniERP will appear here.',
      itemBuilder: (_, SavedView view, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(view.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                if (view.isDefault)
                  UiStatusBadge(label: 'DEFAULT', tone: UiTone.info),
              ]),
              const SizedBox(height: Spacing.x1),
              Text(view.resourceType,
                  style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              if (view.description != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(view.description!,
                    style: TextStyle(color: palette.textTertiary, fontSize: TypeScale.xs)),
              ],
              if (view.ownerName != null) ...[
                const SizedBox(height: Spacing.x1),
                Row(children: [
                  Icon(Icons.person_outline, size: TypeScale.xs, color: palette.textTertiary),
                  const SizedBox(width: Spacing.x1),
                  Text(view.ownerName!,
                      style: TextStyle(fontSize: TypeScale.xs, color: palette.textTertiary)),
                  if (view.isShared) ...[
                    const SizedBox(width: Spacing.x2),
                    Icon(Icons.share_outlined, size: TypeScale.xs, color: palette.textTertiary),
                  ],
                ]),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
