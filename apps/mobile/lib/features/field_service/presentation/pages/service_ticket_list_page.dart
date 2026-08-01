import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';

import '../../domain/entities/field_service.dart';
import '../providers/field_service_providers.dart';

class ServiceTicketListPage extends ConsumerStatefulWidget {
  const ServiceTicketListPage({super.key});
  static const String routeName = 'service-tickets';
  static const String routePath = '/field-service/tickets';
  @override
  ConsumerState<ServiceTicketListPage> createState() => _ServiceTicketListPageState();
}

class _ServiceTicketListPageState extends ConsumerState<ServiceTicketListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-priority': 'Highest priority',
    'priority': 'Lowest priority',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(serviceTicketListControllerProvider);
    final controller = ref.read(serviceTicketListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Tickets'),
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
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search ticket or customer',
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
                    : '${state.meta.total} ticket${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ServiceTicketListState state, ServiceTicketListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<ServiceTicket>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No service tickets',
      emptyMessage: 'Service tickets created in UniERP will appear here.',
      itemBuilder: (_, ServiceTicket t, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(t.ticketNumber,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: t.status,
                  tone: _statusTone(t.status),
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Text(t.title,
                  style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.sm),),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Text(t.customerName ?? 'Unknown customer',
                    style: const TextStyle(fontSize: TypeScale.xs),),
                const Spacer(),
                UiStatusBadge(
                  label: t.priority,
                  tone: _priorityTone(t.priority),
                ),
              ],),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'OPEN' => UiTone.info,
        'DISPATCHED' => UiTone.warning,
        'IN_PROGRESS' => UiTone.warning,
        'COMPLETED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };

  UiTone _priorityTone(String priority) => switch (priority) {
        'HIGH' => UiTone.danger,
        'URGENT' => UiTone.danger,
        'MEDIUM' => UiTone.warning,
        'LOW' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}
