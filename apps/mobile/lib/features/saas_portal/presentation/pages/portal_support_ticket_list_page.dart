import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/saas_portal.dart';
import '../providers/saas_portal_providers.dart';

class PortalSupportTicketListPage extends ConsumerStatefulWidget {
  const PortalSupportTicketListPage({super.key});
  static const String routeName = 'portal-support';
  static const String routePath = '/saas-portal/support';
  @override
  ConsumerState<PortalSupportTicketListPage> createState() => _PortalSupportTicketListPageState();
}

class _PortalSupportTicketListPageState extends ConsumerState<PortalSupportTicketListPage> {
  final TextEditingController _search = TextEditingController();

  static final Map<String, UiTone> _statusTones = <String, UiTone>{
    'OPEN': UiTone.info,
    'IN_PROGRESS': UiTone.warning,
    'RESOLVED': UiTone.success,
    'CLOSED': UiTone.neutral,
  };

  static final Map<String, UiTone> _priorityTones = <String, UiTone>{
    'LOW': UiTone.neutral,
    'MEDIUM': UiTone.info,
    'HIGH': UiTone.warning,
    'URGENT': UiTone.danger,
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(portalSupportTicketListControllerProvider);
    final controller = ref.read(portalSupportTicketListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Support Tickets')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search tickets',
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

  Widget _body(PortalSupportTicketListState state, PortalSupportTicketListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<PortalSupportTicket>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No tickets',
      emptyMessage: 'Support tickets submitted via the portal will appear here.',
      itemBuilder: (_, PortalSupportTicket ticket, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(ticket.subject,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: ticket.priority,
                  tone: _priorityTones[ticket.priority] ?? UiTone.neutral,
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                UiStatusBadge(
                  label: ticket.status,
                  tone: _statusTones[ticket.status] ?? UiTone.neutral,
                ),
                if (ticket.category != null) ...[
                  const SizedBox(width: Spacing.x2),
                  Text(ticket.category!,
                      style: TextStyle(color: palette.textTertiary, fontSize: TypeScale.xs),),
                ],
              ],),
            ],
          ),
        ),
      ),
    );
  }
}
