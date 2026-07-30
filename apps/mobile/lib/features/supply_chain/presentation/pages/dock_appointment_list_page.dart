import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class DockAppointmentListPage extends ConsumerStatefulWidget {
  const DockAppointmentListPage({super.key});
  static const String routeName = 'dock-appointments';
  static const String routePath = '/supply-chain/dock-appointments';
  @override
  ConsumerState<DockAppointmentListPage> createState() => _DockAppointmentListPageState();
}

class _DockAppointmentListPageState extends ConsumerState<DockAppointmentListPage> {
  final TextEditingController _search = TextEditingController();
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-scheduledAt': 'Soonest first',
    'scheduledAt': 'Latest first',
    '-createdAt': 'Newest',
  };

  static const Map<String, String> _statusFilters = <String, String>{
    'SCHEDULED': 'Scheduled',
    'CHECKED_IN': 'Checked in',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dockAppointmentListControllerProvider);
    final controller = ref.read(dockAppointmentListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dock Appointments'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('dock-appointment-new'),
        icon: const Icon(Icons.add),
        label: const Text('New Appointment'),
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
                hintText: 'Search reference',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty ? null : IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () { _search.clear(); controller.search(''); },
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(state.isLoading ? 'Loading...' : '${state.meta.total} appointment${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              const Spacer(),
              DropdownButton<String?>(
                value: _statusFilter,
                hint: const Text('Status'),
                underline: const SizedBox.shrink(),
                items: [
                  const DropdownMenuItem(value: null, child: Text('All')),
                  ..._statusFilters.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))),
                ],
                onChanged: (v) {
                  setState(() => _statusFilter = v);
                  if (v == null) { controller.applyFilters({}); }
                  else { controller.applyFilters({'status': v}); }
                },
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(DockAppointmentListState state, DockAppointmentListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<DockAppointment>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No appointments',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Dock appointments scheduled in UniERP will appear here.',
      itemBuilder: (_, DockAppointment appt, __) => _AppointmentTile(
        appointment: appt,
        onTap: () => context.pushNamed('dock-appointment-detail',
          pathParameters: <String, String>{'id': appt.id}),
      ),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  const _AppointmentTile({required this.appointment, required this.onTap});
  final DockAppointment appointment;
  final VoidCallback onTap;

  UiTone _statusTone(String status) => switch (status) {
    'SCHEDULED' => UiTone.info,
    'CHECKED_IN' => UiTone.warning,
    'COMPLETED' => UiTone.success,
    'CANCELLED' => UiTone.danger,
    _ => UiTone.neutral,
  };

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
                Expanded(child: Text(appointment.reference ?? 'Dock appointment',
                    style: Theme.of(context).textTheme.titleSmall)),
                UiStatusBadge(label: appointment.status, tone: _statusTone(appointment.status)),
              ]),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Icon(Icons.warehouse, size: TypeScale.sm, color: t.textTertiary),
                const SizedBox(width: Spacing.x1),
                Expanded(child: Text(appointment.warehouseName ?? '—',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs))),
              ]),
              if (appointment.scheduledAt != null) ...[
                const SizedBox(height: Spacing.x0_5),
                Text('Scheduled: ${Formatters.dateTime(appointment.scheduledAt!)}',
                    style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}