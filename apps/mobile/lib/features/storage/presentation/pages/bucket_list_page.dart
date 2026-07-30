import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/storage.dart';
import '../providers/storage_providers.dart';

class BucketListPage extends ConsumerStatefulWidget {
  const BucketListPage({super.key});
  static const String routeName = 'storage-buckets';
  static const String routePath = '/storage/buckets';
  @override
  ConsumerState<BucketListPage> createState() => _BucketListPageState();
}

class _BucketListPageState extends ConsumerState<BucketListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(bucketListControllerProvider);
    final controller = ref.read(bucketListControllerProvider.notifier);
    final palette = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Storage Buckets')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search buckets',
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
                    : '${state.meta.total} bucket${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(BucketListState state, BucketListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<StorageBucket>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No buckets found',
      emptyMessage: 'Storage buckets created in UniERP will appear here.',
      itemBuilder: (_, StorageBucket b, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(b.bucketName, style: Theme.of(context).textTheme.titleSmall),
                ),
                Text(b.provider, style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
              ]),
              const SizedBox(height: Spacing.x1),
              Text('${b.currentSizeGb.toStringAsFixed(1)} GB / ${b.maxQuotaGb} GB',
                  style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
            ],
          ),
        ),
      ),
    );
  }
}
