import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';

import '../../domain/entities/healthcare.dart';
import '../providers/healthcare_providers.dart';

class AppointmentListPage extends ConsumerStatefulWidget {
  const AppointmentListPage({super.key});
  static const String routeName = 'appointments';
  static const String routePath = '/healthcare/appointments';
  @override
  ConsumerState<AppointmentListPage> createState() => _AppointmentListPageState();
}

class _AppointmentListPageState extends ConsumerState<AppointmentListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appointmentListControllerProvider);
    final controller = ref.read(appointmentListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Appointments')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search patient or doctor',
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
                    : '${state.meta.total} appointment${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(AppointmentListState state, AppointmentListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<Appointment>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No appointments found',
      emptyMessage: 'Appointments scheduled in UniERP will appear here.',
      itemBuilder: (_, Appointment a, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(a.patientName,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: a.status,
                  tone: _statusTone(a.status),
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Text(a.doctorName ?? 'No doctor assigned',
                  style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
              const SizedBox(height: Spacing.x1),
              Text(
                '${a.appointmentDate.day}/${a.appointmentDate.month}/${a.appointmentDate.year}',
                style: TextStyle(fontSize: TypeScale.xs),
              ),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'SCHEDULED' => UiTone.info,
        'CONFIRMED' => UiTone.success,
        'IN_PROGRESS' => UiTone.warning,
        'COMPLETED' => UiTone.neutral,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
