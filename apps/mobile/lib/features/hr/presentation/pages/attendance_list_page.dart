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

class AttendanceListPage extends ConsumerStatefulWidget {
  const AttendanceListPage({super.key});

  static const String routeName = 'attendance';
  static const String routePath = '/hr/attendance';

  @override
  ConsumerState<AttendanceListPage> createState() => _AttendanceListPageState();
}

class _AttendanceListPageState extends ConsumerState<AttendanceListPage> {
  final TextEditingController _search = TextEditingController();
  String? _statusFilter;

  static const Map<String, String> _statusFilters = <String, String>{
    'PRESENT': 'Present',
    'ABSENT': 'Absent',
    'LATE': 'Late',
    'HALF_DAY': 'Half Day',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AttendanceListState state = ref.watch(attendanceListControllerProvider);
    final AttendanceListController controller =
        ref.read(attendanceListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('attendance-new'),
        icon: const Icon(Icons.add),
        label: const Text('Mark attendance'),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: const InputDecoration(
                hintText: 'Search employee...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading…'
                      : '${state.meta.total} record${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
                const Spacer(),
                DropdownButton<String?>(
                  value: _statusFilter,
                  hint: const Text('Status'),
                  underline: const SizedBox.shrink(),
                  items: _statusFilters.entries
                      .map(
                        (MapEntry<String, String> e) => DropdownMenuItem<String>(
                          value: e.key,
                          child: Text(e.value),
                        ),
                      )
                      .toList(),
                  onChanged: (String? value) {
                    setState(() => _statusFilter = value);
                    if (value == null) {
                      controller.applyFilters(const <String, String>{});
                    } else {
                      controller.applyFilters(<String, String>{'status': value});
                    }
                  },
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(AttendanceListState state, AttendanceListController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Attendance>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No attendance records',
      emptyMessage: 'Attendance records will appear here.',
      itemBuilder: (BuildContext context, Attendance a, _) => _AttendanceTile(
        attendance: a,
        onTap: () => context.pushNamed(
          'attendance-detail',
          pathParameters: <String, String>{'id': a.id},
        ),
      ),
    );
  }
}

class _AttendanceTile extends StatelessWidget {
  const _AttendanceTile({required this.attendance, this.onTap});

  final Attendance attendance;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) = switch (attendance.status) {
      AttendanceStatus.present => ('Present', t.success, t.successLight),
      AttendanceStatus.absent => ('Absent', t.danger, t.dangerLight),
      AttendanceStatus.late => ('Late', t.warning, t.warningLight),
      AttendanceStatus.halfDay => ('Half Day', t.info, t.infoLight),
      _ => (attendance.status, t.textSecondary, t.bgSunken),
    };

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: Spacing.x4,
            backgroundColor: t.bgSunken,
            child: Icon(Icons.person_outline, color: t.textSecondary, size: TypeScale.lg),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  attendance.employeeName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  Formatters.date(attendance.date),
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
                ),
                if (attendance.hoursWorked != null)
                  Text(
                    '${attendance.hoursWorked!.toStringAsFixed(1)} h',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                  ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.x2_5, vertical: Spacing.x1,
            ),
            decoration: BoxDecoration(color: statusBg, borderRadius: Radii.pill),
            child: Text(
              statusLabel,
              style: TextStyle(
                color: statusColor, fontSize: TypeScale.xs,
                fontWeight: TypeScale.medium,
              ),
            ),
          ),
        ],
      ),
    );
  }
}