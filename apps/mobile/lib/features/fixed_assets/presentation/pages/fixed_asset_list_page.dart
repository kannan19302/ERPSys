import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/fixed_assets.dart';
import '../providers/fixed_assets_providers.dart';

class FixedAssetListPage extends ConsumerStatefulWidget {
  const FixedAssetListPage({super.key});
  static const String routeName = 'fixed-assets';
  static const String routePath = '/fixed-assets/assets';
  @override
  ConsumerState<FixedAssetListPage> createState() => _FixedAssetListPageState();
}

class _FixedAssetListPageState extends ConsumerState<FixedAssetListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name',
    '-purchaseCost': 'Highest cost',
    'purchaseCost': 'Lowest cost',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fixedAssetListControllerProvider);
    final controller = ref.read(fixedAssetListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fixed Assets'),
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
                hintText: 'Search asset name',
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
                    : '${state.meta.total} asset${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(FixedAssetListState state, FixedAssetListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<FixedAsset>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No fixed assets',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Fixed assets created in UniERP will appear here.',
      itemBuilder: (_, FixedAsset a, __) => _FixedAssetTile(asset: a),
    );
  }
}

class _FixedAssetTile extends StatelessWidget {
  const _FixedAssetTile({required this.asset});
  final FixedAsset asset;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return UiCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Expanded(
              child: Text(asset.name,
                  style: Theme.of(context).textTheme.titleSmall),
            ),
            UiStatusBadge(
              label: asset.status,
              tone: _statusTone(asset.status),
            ),
          ]),
          const SizedBox(height: Spacing.x1),
          Text(asset.assetCategory,
              style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
          const SizedBox(height: Spacing.x1),
          Row(children: [
            Text('\$${asset.purchaseCost.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.labelMedium),
            const Spacer(),
            Text('NBV: \$${asset.netBookValue.toStringAsFixed(2)}',
                style: TextStyle(fontSize: TypeScale.xs, color: t.textSecondary)),
          ]),
        ],
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'MAINTENANCE' => UiTone.warning,
        'DISPOSED' => UiTone.danger,
        'RETIRED' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}
