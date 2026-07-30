import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/localization.dart';
import '../providers/localization_providers.dart';

class LanguageListPage extends ConsumerStatefulWidget {
  const LanguageListPage({super.key});
  static const String routeName = 'languages';
  static const String routePath = '/localization/languages';
  @override
  ConsumerState<LanguageListPage> createState() => _LanguageListPageState();
}

class _LanguageListPageState extends ConsumerState<LanguageListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(languageListControllerProvider);
    final controller = ref.read(languageListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Languages')),
      body: _body(state, controller),
    );
  }

  Widget _body(LanguageListState state, LanguageListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<LocalizationLanguage>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No languages found',
      emptyMessage: 'Languages configured in UniERP will appear here.',
      itemBuilder: (_, LocalizationLanguage l, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Row(children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l.name, style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: Spacing.x1),
                  Text('${l.code} · ${l.direction}',
                      style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
                ],
              ),
            ),
            if (l.isDefault)
              Icon(Icons.star, color: context.tokens.warning, size: TypeScale.base),
          ]),
        ),
      ),
    );
  }
}
