import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/saas.dart';
import '../providers/saas_providers.dart';

class SaasTenantListPage extends ConsumerStatefulWidget {
  const SaasTenantListPage({super.key});
  static const String routeName = 'saas-tenants';
  static const String routePath = '/saas/tenants';
  @override
  ConsumerState<SaasTenantListPage> createState() => _SaasTenantListPageState();
}

class _SaasTenantListPageState extends ConsumerState<SaasTenantListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(saasTenantListControllerProvider);
    final controller = ref.read(saasTenantListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('SaaS Tenants')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search organization name',
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
                    : '${state.meta.total} tenant${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(SaasTenantListState state, SaasTenantListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<SaasTenant>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No tenants found',
      emptyMessage: 'SaaS tenants will appear here.',
      itemBuilder: (_, SaasTenant tenant, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(tenant.organizationName,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: tenant.status,
                  tone: tenant.status == 'ACTIVE' ? UiTone.success : UiTone.neutral,
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              if (tenant.domain != null)
                Text(tenant.domain!,
                    style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              if (tenant.planName != null) ...[
                const SizedBox(height: Spacing.x1),
                Text('Plan: ${tenant.planName}',
                    style: TextStyle(fontSize: TypeScale.xs, color: palette.textTertiary)),
              ],
              Row(children: [
                Text('${tenant.userCount} users',
                    style: TextStyle(fontSize: TypeScale.xs, color: palette.textTertiary)),
                const SizedBox(width: Spacing.x4),
                Text('${tenant.storageUsed.toStringAsFixed(0)} MB',
                    style: TextStyle(fontSize: TypeScale.xs, color: palette.textTertiary)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
