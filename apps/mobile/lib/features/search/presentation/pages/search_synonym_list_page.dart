import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/search.dart';
import '../providers/search_providers.dart';

class SearchSynonymListPage extends ConsumerStatefulWidget {
  const SearchSynonymListPage({super.key});
  static const String routeName = 'search-synonyms';
  static const String routePath = '/search/synonyms';
  @override
  ConsumerState<SearchSynonymListPage> createState() => _SearchSynonymListPageState();
}

class _SearchSynonymListPageState extends ConsumerState<SearchSynonymListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(searchSynonymListControllerProvider);
    final controller = ref.read(searchSynonymListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Search Synonyms')),
      body: _body(state, controller, t),
    );
  }

  Widget _body(SearchSynonymListState state, SearchSynonymListController controller, Palette t) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<SearchSynonymGroup>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No synonym groups',
      emptyMessage: 'Synonym groups created for search will appear here.',
      itemBuilder: (_, SearchSynonymGroup group, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(group.terms.join(', '),
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: group.isActive ? 'ACTIVE' : 'INACTIVE',
                  tone: group.isActive ? UiTone.success : UiTone.neutral,
                ),
              ]),
              if (group.locale != null) ...[
                const SizedBox(height: Spacing.x1),
                Text('Locale: ${group.locale}',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              ],
              const SizedBox(height: Spacing.x1),
              Wrap(
                spacing: Spacing.x1,
                runSpacing: Spacing.x1,
                children: group.terms.map((t) => Chip(
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  label: Text(t, style: const TextStyle(fontSize: TypeScale.xs)),
                )).toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
