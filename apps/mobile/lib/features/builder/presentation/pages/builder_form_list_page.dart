import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/builder.dart';
import '../providers/builder_providers.dart';

class BuilderFormListPage extends ConsumerStatefulWidget {
  const BuilderFormListPage({super.key});
  static const String routeName = 'builder-forms';
  static const String routePath = '/builder/forms';
  @override
  ConsumerState<BuilderFormListPage> createState() => _BuilderFormListPageState();
}

class _BuilderFormListPageState extends ConsumerState<BuilderFormListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'title': 'Title A-Z',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(builderFormListControllerProvider);
    final controller = ref.read(builderFormListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Builder Forms'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value),),)
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
                hintText: 'Search forms...',
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
                    : '${state.meta.total} form${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(BuilderFormListState state, BuilderFormListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<BuilderForm>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No forms found',
      emptyMessage: 'Forms created in UniERP Builder will appear here.',
      itemBuilder: (_, BuilderForm f, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(f.title,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: f.status,
                  tone: _statusTone(f.status),
                ),
              ],),
              const SizedBox(height: Spacing.x1),
if (f.description != null)
                  Text(f.description!,
                    style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),),
              const SizedBox(height: Spacing.x1),
              Text('v${f.version} \u2022 ${f.fields.length} field${f.fields.length == 1 ? '' : 's'}',
                  style: const TextStyle(fontSize: TypeScale.xs),),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral,
        'PUBLISHED' => UiTone.success,
        'ARCHIVED' => UiTone.warning,
        _ => UiTone.neutral,
      };
}

class BuilderPageListPage extends ConsumerStatefulWidget {
  const BuilderPageListPage({super.key});
  static const String routeName = 'builder-pages';
  static const String routePath = '/builder/pages';
  @override
  ConsumerState<BuilderPageListPage> createState() => _BuilderPageListPageState();
}

class _BuilderPageListPageState extends ConsumerState<BuilderPageListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(builderPageListControllerProvider);
    final controller = ref.read(builderPageListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Builder Pages')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search pages...',
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

  Widget _body(BuilderPageListState state, BuilderPageListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<BuilderPage>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No pages found',
      emptyMessage: 'Pages created in UniERP Builder will appear here.',
      itemBuilder: (_, BuilderPage p, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(p.title, style: Theme.of(context).textTheme.titleSmall)),
                UiStatusBadge(label: p.status, tone: p.status == 'PUBLISHED' ? UiTone.success : UiTone.neutral),
              ],),
              const SizedBox(height: Spacing.x2),
Text('Layout: ${p.layout} \u2022 ${p.sections.length} section${p.sections.length == 1 ? '' : 's'}',
                    style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),),
            ],
          ),
        ),
      ),
    );
  }
}