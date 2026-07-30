import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/marketplace.dart';
import '../providers/marketplace_providers.dart';

class MarketplaceAppListPage extends ConsumerStatefulWidget {
  const MarketplaceAppListPage({super.key});
  static const String routeName = 'marketplace-apps';
  static const String routePath = '/marketplace/apps';
  @override
  ConsumerState<MarketplaceAppListPage> createState() => _MarketplaceAppListPageState();
}

class _MarketplaceAppListPageState extends ConsumerState<MarketplaceAppListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name A-Z',
    '-downloadCount': 'Most downloads',
    '-rating': 'Highest rated',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(marketplaceAppListControllerProvider);
    final controller = ref.read(marketplaceAppListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace Apps'),
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
                hintText: 'Search apps...',
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
                    : '${state.meta.total} app${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(MarketplaceAppListState state, MarketplaceAppListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<MarketplaceApp>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No apps found',
      emptyMessage: 'Apps published to the marketplace will appear here.',
      itemBuilder: (_, MarketplaceApp a, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(a.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(label: a.status, tone: _statusTone(a.status)),
              ]),
              const SizedBox(height: Spacing.x1),
              if (a.description != null)
                Text(a.description!,
                    maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (a.developer != null)
                  Text(a.developer!,
                      style: TextStyle(fontSize: TypeScale.xs)),
                const Spacer(),
                if (a.rating != null && a.rating! > 0)
                  Text('\u2605 ${a.rating!.toStringAsFixed(1)}',
                      style: TextStyle(fontSize: TypeScale.xs)),
                const SizedBox(width: Spacing.x1),
                Text('${a.downloadCount} downloads',
                    style: TextStyle(fontSize: TypeScale.xs, color: palette.textSecondary)),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral,
        'PUBLISHED' => UiTone.success,
        'UNPUBLISHED' => UiTone.warning,
        'REJECTED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}

class MarketplaceSubmissionListPage extends ConsumerStatefulWidget {
  const MarketplaceSubmissionListPage({super.key});
  static const String routeName = 'marketplace-submissions';
  static const String routePath = '/marketplace/submissions';
  @override
  ConsumerState<MarketplaceSubmissionListPage> createState() => _MarketplaceSubmissionListPageState();
}

class _MarketplaceSubmissionListPageState extends ConsumerState<MarketplaceSubmissionListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(marketplaceSubmissionListControllerProvider);
    final controller = ref.read(marketplaceSubmissionListControllerProvider.notifier);
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Submissions')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search submissions...',
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
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(MarketplaceSubmissionListState state, MarketplaceSubmissionListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<MarketplaceSubmission>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No submissions found',
      emptyMessage: 'App submissions will appear here.',
      itemBuilder: (_, MarketplaceSubmission s, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(s.appName ?? 'Submission',
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(label: s.status, tone: _submissionTone(s.status)),
              ]),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Text('Type: ${s.type}',
                    style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
                const Spacer(),
                if (s.submitterName != null)
                  Text(s.submitterName!,
                      style: TextStyle(fontSize: TypeScale.xs)),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _submissionTone(String status) => switch (status) {
        'PENDING' => UiTone.warning,
        'APPROVED' => UiTone.success,
        'REJECTED' => UiTone.danger,
        'NEEDS_INFO' => UiTone.info,
        _ => UiTone.neutral,
      };
}