import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/api_platform.dart';
import '../providers/api_platform_providers.dart';

class UsageLogListPage extends ConsumerStatefulWidget {
  const UsageLogListPage({super.key});
  static const String routeName = 'api-usage-logs';
  static const String routePath = '/api-platform/usage-logs';
  @override
  ConsumerState<UsageLogListPage> createState() => _UsageLogListPageState();
}

class _UsageLogListPageState extends ConsumerState<UsageLogListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(usageLogListControllerProvider);
    final controller = ref.read(usageLogListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('API Usage Logs')),
      body: _body(state, controller),
    );
  }

  Widget _body(UsageLogListState state, UsageLogListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<ApiUsageLog>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No usage logs',
      emptyMessage: 'API usage activity will be recorded here.',
      itemBuilder: (_, ApiUsageLog log, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Row(children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${log.method} ${log.endpoint}',
                      style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: Spacing.x1),
                  Text('${log.statusCode} · ${log.responseMs}ms',
                      style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
