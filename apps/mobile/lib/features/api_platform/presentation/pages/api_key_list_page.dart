import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/api_platform.dart';
import '../providers/api_platform_providers.dart';

class ApiKeyListPage extends ConsumerStatefulWidget {
  const ApiKeyListPage({super.key});
  static const String routeName = 'api-keys';
  static const String routePath = '/api-platform/keys';
  @override
  ConsumerState<ApiKeyListPage> createState() => _ApiKeyListPageState();
}

class _ApiKeyListPageState extends ConsumerState<ApiKeyListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(apiKeyListControllerProvider);
    final controller = ref.read(apiKeyListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('API Keys')),
      body: _body(state, controller),
    );
  }

  Widget _body(ApiKeyListState state, ApiKeyListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<ApiKey>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No API keys',
      emptyMessage: 'API keys created in UniERP will appear here.',
      itemBuilder: (_, ApiKey k, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Row(children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(k.name, style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: Spacing.x1),
                  Text('${k.prefix}... · ${k.status}',
                      style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
                ],
              ),
            ),
            Text('${k.rateLimit}/min', style: TextStyle(color: context.tokens.textTertiary, fontSize: TypeScale.xs)),
          ]),
        ),
      ),
    );
  }
}
