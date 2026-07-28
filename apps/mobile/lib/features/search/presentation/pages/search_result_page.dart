import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/search.dart';
import '../providers/search_providers.dart';

class SearchResultPage extends ConsumerStatefulWidget {
  const SearchResultPage({super.key});
  static const String routeName = 'search';
  static const String routePath = '/search';
  @override
  ConsumerState<SearchResultPage> createState() => _SearchResultPageState();
}

class _SearchResultPageState extends ConsumerState<SearchResultPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, IconData> _typeIcons = <String, IconData>{
    'invoice': Icons.receipt_outlined,
    'purchase_order': Icons.shopping_cart_outlined,
    'product': Icons.inventory_2_outlined,
    'customer': Icons.person_outlined,
    'vendor': Icons.business_outlined,
    'employee': Icons.badge_outlined,
    'project': Icons.folder_outlined,
    'ticket': Icons.support_agent_outlined,
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(searchResultListControllerProvider);
    final controller = ref.read(searchResultListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Search')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search across all modules',
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
          if (_search.text.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
              child: Row(children: [
                Text(
                  state.isLoading
                      ? 'Searching...'
                      : '${state.meta.total} result${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                ),
              ]),
            ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(SearchResultListState state, SearchResultListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    if (_search.text.isEmpty) {
      return const EmptyView(title: 'Search everything', message: 'Type a query to search across all modules.');
    }
    return PaginatedListView<SearchResult>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No results found',
      emptyMessage: 'Nothing matches "${_search.text}". Try a different search term.',
      itemBuilder: (_, SearchResult result, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                _typeIcons[result.resourceType] ?? Icons.description_outlined,
                size: Spacing.x5,
                color: palette.textSecondary,
              ),
              const SizedBox(width: Spacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(result.title,
                        style: Theme.of(context).textTheme.titleSmall),
                    if (result.subtitle != null) ...[
                      const SizedBox(height: Spacing.x1),
                      Text(result.subtitle!,
                          style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
                    ],
                    if (result.description != null) ...[
                      const SizedBox(height: Spacing.x1),
                      Text(result.description!,
                          maxLines: 2, overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: palette.textTertiary, fontSize: TypeScale.xs)),
                    ],
                  ],
                ),
              ),
              if (result.score != null)
                Text(result.score!.toStringAsFixed(1),
                    style: TextStyle(fontSize: TypeScale.xs, color: palette.textTertiary)),
            ],
          ),
        ),
      ),
    );
  }
}
