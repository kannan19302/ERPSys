import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';

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

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(vendorListControllerProvider);
    final controller = ref.read(vendorListControllerProvider.notifier);
    final palette = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Vendors')),
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
                style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),
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
      emptyMessage: 'Vendors created in UniERP will appear here.',
      itemBuilder: (_, Vendor v, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(v.name, style: Theme.of(context).textTheme.titleSmall),
              if (v.email != null) Text(v.email!, style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
              if (v.phone != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(v.phone!, style: TextStyle(fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
