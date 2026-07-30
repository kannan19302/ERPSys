import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class TimesheetListPage extends ConsumerStatefulWidget {
  const TimesheetListPage({super.key});

  static const String routeName = 'hr-timesheets';
  static const String routePath = '/hr/timesheets';

  @override
  ConsumerState<TimesheetListPage> createState() => _TimesheetListPageState();
}

class _TimesheetListPageState extends ConsumerState<TimesheetListPage> {
  @override
  Widget build(BuildContext context) {
    final TimesheetListState state =
        ref.watch(timesheetListControllerProvider);
    final TimesheetListController controller =
        ref.read(timesheetListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Timesheets'),
        actions: <Widget>[
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            tooltip: 'Filter status',
            onSelected: (String v) {
              controller.applyFilters(
                v.isEmpty ? <String, String>{} : <String, String>{'status': v},
              );
            },
            itemBuilder: (_) => <String>[
              '',
              TimesheetStatus.draft,
              TimesheetStatus.submitted,
              TimesheetStatus.approved,
              TimesheetStatus.rejected,
            ].map(
              (String v) => PopupMenuItem<String>(
                value: v,
                child: Text(
                  v.isEmpty ? 'All' : _statusLabel(v),
                ),
              ),
            ).toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('timesheet-new'),
        icon: const Icon(Icons.add),
        label: const Text('New timesheet'),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: Text(
              state.isLoading
                  ? 'Loading…'
                  : '${state.meta.total} timesheet${state.meta.total == 1 ? '' : 's'}',
              style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(TimesheetListState state, TimesheetListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Timesheet>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No timesheets',
      emptyMessage: 'Timesheets will appear here.',
      itemBuilder: (BuildContext context, Timesheet ts, _) => _TimesheetTile(
        timesheet: ts,
        onTap: () => context.pushNamed(
          'timesheet-detail',
          pathParameters: <String, String>{'id': ts.id},
        ),
      ),
    );
  }

  static String _statusLabel(String s) => switch (s) {
        TimesheetStatus.draft => 'Draft',
        TimesheetStatus.submitted => 'Submitted',
        TimesheetStatus.approved => 'Approved',
        TimesheetStatus.rejected => 'Rejected',
        _ => s,
      };
}

class _TimesheetTile extends StatelessWidget {
  const _TimesheetTile({required this.timesheet, this.onTap});

  final Timesheet timesheet;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String label, UiTone tone) = switch (timesheet.status) {
      TimesheetStatus.draft => ('Draft', UiTone.neutral),
      TimesheetStatus.submitted => ('Submitted', UiTone.warning),
      TimesheetStatus.approved => ('Approved', UiTone.success),
      TimesheetStatus.rejected => ('Rejected', UiTone.danger),
      _ => (timesheet.status, UiTone.neutral),
    };

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: Spacing.x4,
            backgroundColor: t.bgSunken,
            child: Icon(Icons.access_time_outlined,
                color: t.textSecondary, size: TypeScale.lg),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  timesheet.employeeName,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  'Week of ${Formatters.date(timesheet.weekStart)}',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  '${timesheet.totalHours.toStringAsFixed(1)} h',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          UiStatusBadge(label: label, tone: tone),
        ],
      ),
    );
  }
}