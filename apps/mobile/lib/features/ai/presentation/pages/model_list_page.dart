import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiModelListPage extends ConsumerStatefulWidget {
  const AiModelListPage({super.key});
  static const String routeName = 'ai-models';
  static const String routePath = '/ai/models';
  @override
  ConsumerState<AiModelListPage> createState() => _AiModelListPageState();
}

class _AiModelListPageState extends ConsumerState<AiModelListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiModelListControllerProvider);
    final controller = ref.read(aiModelListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Models'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value),),)
                .toList(),
          ),
        ],
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () {},
          icon: const Icon(Icons.add),
          label: const Text('New Model'),
        ),
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
                hintText: 'Search models',
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
                    : '${state.meta.total} model${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(AiModelListState state, AiModelListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<AiModel>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No AI models',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'AI models configured in UniERP will appear here.',
      itemBuilder: (_, AiModel model, __) => _ModelTile(
        model: model,
        onTap: () {},
      ),
    );
  }
}

class _ModelTile extends StatelessWidget {
  const _ModelTile({required this.model, required this.onTap});
  final AiModel model;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(model.name,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: model.status,
                  tone: _statusTone(model.status),
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (model.provider != null)
                  Text(model.provider!,
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),),
                if (model.version != null) ...[
                  const SizedBox(width: Spacing.x2),
                  Text('v${model.version}',
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),),
                ],
              ],),
              if (model.capabilities.isNotEmpty) ...[
                const SizedBox(height: Spacing.x1),
                Text(model.capabilities.join(', '),
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
              ],
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'INACTIVE' => UiTone.neutral,
        'DEPRECATED' => UiTone.warning,
        _ => UiTone.neutral,
      };
}
