import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/saas.dart';
import '../providers/saas_providers.dart';

class SaasSubscriptionListPage extends ConsumerStatefulWidget {
  const SaasSubscriptionListPage({super.key});
  static const String routeName = 'saas-subscriptions';
  static const String routePath = '/saas/subscriptions';
  @override
  ConsumerState<SaasSubscriptionListPage> createState() => _SaasSubscriptionListPageState();
}

class _SaasSubscriptionListPageState extends ConsumerState<SaasSubscriptionListPage> {
  final TextEditingController _search = TextEditingController();

  static final Map<String, UiTone> _statusTones = <String, UiTone>{
    'ACTIVE': UiTone.success,
    'TRIALING': UiTone.info,
    'PAST_DUE': UiTone.warning,
    'CANCELED': UiTone.danger,
    'INCOMPLETE': UiTone.neutral,
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(saasSubscriptionListControllerProvider);
    final controller = ref.read(saasSubscriptionListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Subscriptions')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by plan or tenant',
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
                    : '${state.meta.total} subscription${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(SaasSubscriptionListState state, SaasSubscriptionListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<SaasSubscription>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No subscriptions',
      emptyMessage: 'Subscriptions created in UniERP will appear here.',
      itemBuilder: (_, SaasSubscription sub, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(sub.planName,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: sub.status,
                  tone: _statusTones[sub.status] ?? UiTone.neutral,
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Text(sub.tenantId,
                  style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              if (sub.currentPeriodEnd != null) ...[
                const SizedBox(height: Spacing.x1),
                Text('Renews ${_formatDate(sub.currentPeriodEnd!)}',
                    style: TextStyle(fontSize: TypeScale.xs, color: palette.textTertiary)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
