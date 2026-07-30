import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/real_estate.dart';
import '../providers/real_estate_providers.dart';

class PropertyListPage extends ConsumerStatefulWidget {
  const PropertyListPage({super.key});
  static const String routeName = 'real-estate-properties';
  static const String routePath = '/real-estate/properties';
  @override
  ConsumerState<PropertyListPage> createState() => _PropertyListPageState();
}

class _PropertyListPageState extends ConsumerState<PropertyListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name',
    '-totalArea': 'Largest area',
    'totalArea': 'Smallest area',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(propertyListControllerProvider);
    final controller = ref.read(propertyListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Properties'),
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
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search property name',
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
                    : '${state.meta.total} property${state.meta.total == 1 ? '' : 'ies'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(PropertyListState state, PropertyListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Property>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No properties',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Properties created in UniERP will appear here.',
      itemBuilder: (_, Property p, __) => _PropertyTile(property: p),
    );
  }
}

class _PropertyTile extends StatelessWidget {
  const _PropertyTile({required this.property});
  final Property property;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return UiCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(
              child: Text(property.name,
                  style: Theme.of(context).textTheme.titleSmall),
            ),
            UiStatusBadge(
              label: property.status,
              tone: _statusTone(property.status),
            ),
          ]),
          const SizedBox(height: Spacing.x1),
          Text('${property.propertyType} - ${property.city ?? property.state ?? 'N/A'}',
              style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
          const SizedBox(height: Spacing.x1),
          Row(children: [
            if (property.totalArea > 0)
              Text('${property.totalArea.toStringAsFixed(0)} ${property.areaUnit}',
                  style: Theme.of(context).textTheme.labelMedium),
            const Spacer(),
            Text('${property.occupiedUnits}/${property.totalUnits} units',
                style: TextStyle(fontSize: TypeScale.xs, color: t.textSecondary)),
          ]),
        ],
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'MAINTENANCE' => UiTone.warning,
        'VACANT' => UiTone.neutral,
        'RETIRED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
