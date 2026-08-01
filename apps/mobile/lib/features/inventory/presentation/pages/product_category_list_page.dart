import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/inventory.dart';
import '../providers/inventory_providers.dart';

class ProductCategoryListPage extends ConsumerStatefulWidget {
  const ProductCategoryListPage({super.key});

  static const String routeName = 'product-categories';
  static const String routePath = '/inventory/categories';

  @override
  ConsumerState<ProductCategoryListPage> createState() =>
      _ProductCategoryListPageState();
}

class _ProductCategoryListPageState
    extends ConsumerState<ProductCategoryListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ProductCategoryListState state =
        ref.watch(productCategoryListControllerProvider);
    final ProductCategoryListController controller =
        ref.read(productCategoryListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('product-category-new'),
          icon: const Icon(Icons.add),
          label: const Text('New category'),
        ),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search categories',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Clear search',
                        onPressed: () {
                          _search.clear();
                          controller.search('');
                        },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading…'
                      : '${state.meta.total} categor${state.meta.total == 1 ? 'y' : 'ies'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(
    ProductCategoryListState state,
    ProductCategoryListController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ProductCategory>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No categories found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Product categories created in UniERP will appear here.',
      itemBuilder: (BuildContext context, ProductCategory category, _) =>
          _CategoryTile(
        category: category,
        onTap: () => context.pushNamed(
          'product-category-detail',
          pathParameters: <String, String>{'id': category.id},
        ),
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.category, this.onTap});

  final ProductCategory category;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: t.bgSunken,
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(
              category.parentId == null
                  ? Icons.folder_outlined
                  : Icons.subdirectory_arrow_right_outlined,
              size: TypeScale.xl,
              color: t.textSecondary,
            ),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  category.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                if (category.description != null &&
                    category.description!.isNotEmpty)
                  Text(
                    category.description!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: t.textTertiary,
                      fontSize: TypeScale.xs,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          UiStatusBadge(
            label: category.isActive ? 'Active' : 'Inactive',
            tone: category.isActive ? UiTone.success : UiTone.neutral,
          ),
        ],
      ),
    );
  }
}
