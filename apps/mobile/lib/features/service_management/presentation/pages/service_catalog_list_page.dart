import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/service_management.dart';
import '../providers/service_management_providers.dart';

class ServiceCatalogListPage extends ConsumerStatefulWidget {
  const ServiceCatalogListPage({super.key});
  static const String routeName = 'service-catalogs';
  static const String routePath = '/service-management/catalogs';
  @override
  ConsumerState<ServiceCatalogListPage> createState() => _ServiceCatalogListPageState();
}

class _ServiceCatalogListPageState extends ConsumerState<ServiceCatalogListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name A-Z',
    '-price': 'Highest price',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(serviceCatalogListControllerProvider);
    final controller = ref.read(serviceCatalogListControllerProvider.notifier);
    final palette = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Catalog'),
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
                hintText: 'Search services...',
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
                    : '${state.meta.total} service${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ServiceCatalogListState state, ServiceCatalogListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<ServiceCatalog>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No services found',
      emptyMessage: 'Services added to the catalog will appear here.',
      itemBuilder: (_, ServiceCatalog s, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(s.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(label: s.status, tone: s.status == 'ACTIVE' ? UiTone.success : UiTone.neutral),
              ]),
              if (s.description != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(s.description!,
                    maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              ],
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Text('\$${s.price.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(width: Spacing.x2),
                if (s.category != null)
                  Chip(label: Text(s.category!, style: const TextStyle(fontSize: TypeScale.xs))),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}

class ServiceRequestListPage extends ConsumerStatefulWidget {
  const ServiceRequestListPage({super.key});
  static const String routeName = 'service-requests';
  static const String routePath = '/service-management/requests';
  @override
  ConsumerState<ServiceRequestListPage> createState() => _ServiceRequestListPageState();
}

class _ServiceRequestListPageState extends ConsumerState<ServiceRequestListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(serviceRequestListControllerProvider);
    final controller = ref.read(serviceRequestListControllerProvider.notifier);
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Service Requests')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search requests...',
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

  Widget _body(ServiceRequestListState state, ServiceRequestListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<ServiceRequest>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No requests found',
      emptyMessage: 'Service requests will appear here.',
      itemBuilder: (_, ServiceRequest r, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(r.subject,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(label: r.status, tone: _requestStatusTone(r.status)),
              ]),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (r.priority != 'MEDIUM')
                  UiStatusBadge(label: r.priority, tone: _priorityTone(r.priority)),
                const SizedBox(width: Spacing.x2),
                if (r.catalogName != null)
                  Text(r.catalogName!,
                      style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _requestStatusTone(String status) => switch (status) {
        'OPEN' => UiTone.warning,
        'IN_PROGRESS' => UiTone.info,
        'RESOLVED' => UiTone.success,
        'CLOSED' => UiTone.neutral,
        _ => UiTone.neutral,
      };

  UiTone _priorityTone(String priority) => switch (priority) {
        'LOW' => UiTone.neutral,
        'MEDIUM' => UiTone.info,
        'HIGH' => UiTone.warning,
        'CRITICAL' => UiTone.danger,
        _ => UiTone.neutral,
      };
}