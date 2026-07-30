import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class VendorListPage extends ConsumerStatefulWidget {
  const VendorListPage({super.key});
  static const String routeName = 'vendors';
  static const String routePath = '/procurement/vendors';
  @override
  ConsumerState<VendorListPage> createState() => _VendorListPageState();
}

class _VendorListPageState extends ConsumerState<VendorListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name (A-Z)',
    '-name': 'Name (Z-A)',
    '-totalPurchases': 'Highest purchases',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(vendorListControllerProvider);
    final controller = ref.read(vendorListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vendors'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('vendor-new'),
        icon: const Icon(Icons.add),
        label: const Text('New Vendor'),
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
                hintText: 'Search vendor name',
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
                    : '${state.meta.total} vendor${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(VendorListState state, VendorListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<Vendor>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No vendors found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Vendors created in UniERP will appear here.',
      itemBuilder: (_, Vendor v, __) => UiCard(
        onTap: () => context.pushNamed('vendor-detail', pathParameters: <String, String>{'id': v.id}),
        padding: const EdgeInsets.all(Spacing.x3),
        child: Row(children: [
          Container(
            height: Spacing.x10, width: Spacing.x10,
            decoration: BoxDecoration(color: context.tokens.bgSunken, borderRadius: Radii.control),
            alignment: Alignment.center,
            child: Icon(Icons.business_outlined, size: TypeScale.xl, color: context.tokens.textSecondary),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(v.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge),
              if (v.email != null)
                Text(v.email!, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: context.tokens.textTertiary, fontSize: TypeScale.xs)),
            ],
          )),
          const SizedBox(width: Spacing.x2),
          UiStatusBadge(label: v.status, tone: v.status == 'ACTIVE' ? UiTone.success : UiTone.neutral),
        ]),
      ),
    );
  }
}