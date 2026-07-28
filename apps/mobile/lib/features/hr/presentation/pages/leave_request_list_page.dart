import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';

import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

/// Paginated leave requests with status filter.
class LeaveRequestListPage extends ConsumerStatefulWidget {
  const LeaveRequestListPage({super.key});

  static const String routeName = 'leave-requests';
  static const String routePath = '/hr/leave-requests';

  @override
  ConsumerState<LeaveRequestListPage> createState() =>
      _LeaveRequestListPageState();
}

class _LeaveRequestListPageState
    extends ConsumerState<LeaveRequestListPage> {
  @override
  Widget build(BuildContext context) {
    final LeaveRequestListState state =
        ref.watch(leaveRequestListControllerProvider);
    final LeaveRequestListController controller =
        ref.read(leaveRequestListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Leave Requests')),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4,
              Spacing.x3,
              Spacing.x4,
              Spacing.x2,
            ),
            child: _StatusFilterRow(
              value: state.statusFilter,
              onChanged: controller.applyStatusFilter,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Text(
              state.isLoading
                  ? 'Loading…'
                  : '${state.meta.total} leave request${state.meta.total == 1 ? '' : 's'}',
              style: TextStyle(
                color: t.textSecondary,
                fontSize: TypeScale.xs,
              ),
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(
    LeaveRequestListState state,
    LeaveRequestListController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<LeaveRequest>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No leave requests',
      emptyMessage: 'Leave requests submitted by employees will appear here.',
      itemBuilder: (BuildContext context, LeaveRequest lr, _) =>
          _LeaveRequestTile(
        leaveRequest: lr,
        onApprove: lr.status == LeaveRequestStatus.pending
            ? () => _approve(context, controller, lr)
            : null,
        onReject: lr.status == LeaveRequestStatus.pending
            ? () => _reject(context, controller, lr)
            : null,
      ),
    );
  }

  Future<void> _approve(
    BuildContext context,
    LeaveRequestListController controller,
    LeaveRequest lr,
  ) async {
    final result = await controller.approve(lr.id);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Leave approved')),
      ),
    );
  }

  Future<void> _reject(
    BuildContext context,
    LeaveRequestListController controller,
    LeaveRequest lr,
  ) async {
    final result = await controller.reject(lr.id);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Leave rejected')),
      ),
    );
  }
}

class _StatusFilterRow extends StatelessWidget {
  const _StatusFilterRow({required this.value, required this.onChanged});

  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value ?? '',
      decoration: const InputDecoration(
        contentPadding: EdgeInsets.symmetric(horizontal: Spacing.x3),
        labelText: 'Status',
      ),
      isExpanded: true,
      items: <String>[
        '',
        LeaveRequestStatus.pending,
        LeaveRequestStatus.approved,
        LeaveRequestStatus.rejected,
        LeaveRequestStatus.cancelled,
      ].map(
        (String v) => DropdownMenuItem<String>(
          value: v,
          child: Text(
            v.isEmpty ? 'All statuses' : _label(v),
            style: const TextStyle(fontSize: TypeScale.xs),
          ),
        ),
      ).toList(),
      onChanged: onChanged,
    );
  }

  static String _label(String s) => switch (s) {
        LeaveRequestStatus.pending => 'Pending',
        LeaveRequestStatus.approved => 'Approved',
        LeaveRequestStatus.rejected => 'Rejected',
        LeaveRequestStatus.cancelled => 'Cancelled',
        _ => s,
      };
}

class _LeaveRequestTile extends StatelessWidget {
  const _LeaveRequestTile({
    required this.leaveRequest,
    this.onApprove,
    this.onReject,
  });

  final LeaveRequest leaveRequest;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              CircleAvatar(
                radius: Spacing.x4,
                backgroundColor: t.bgSunken,
                child: Text(
                  _initials(leaveRequest.employeeName),
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ),
              const SizedBox(width: Spacing.x2),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      leaveRequest.employeeName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    Text(
                      leaveRequest.leaveTypeName,
                      style: TextStyle(
                        color: t.textSecondary,
                        fontSize: TypeScale.xs,
                      ),
                    ),
                  ],
                ),
              ),
              UiStatusBadge(
                label: _statusLabel(leaveRequest.status),
                tone: _statusTone(leaveRequest.status),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x3),
          Row(
            children: <Widget>[
              Icon(Icons.date_range_outlined,
                  size: TypeScale.base, color: t.textTertiary),
              const SizedBox(width: Spacing.x1),
              Text(
                '${Formatters.date(leaveRequest.fromDate)} – ${Formatters.date(leaveRequest.toDate)}',
                style: const TextStyle(fontSize: TypeScale.sm),
              ),
              const Spacer(),
              Text(
                '${leaveRequest.days.toInt()} day${leaveRequest.days == 1 ? '' : 's'}',
                style: TextStyle(
                  fontWeight: TypeScale.medium,
                  fontSize: TypeScale.sm,
                ),
              ),
            ],
          ),
          if (leaveRequest.reason != null &&
              leaveRequest.reason!.isNotEmpty) ...<Widget>[
            const SizedBox(height: Spacing.x2),
            Text(
              leaveRequest.reason!,
              style: TextStyle(
                color: t.textSecondary,
                fontSize: TypeScale.xs,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          if (onApprove != null || onReject != null) ...<Widget>[
            const SizedBox(height: Spacing.x3),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: <Widget>[
                if (onReject != null)
                  OutlinedButton(
                    onPressed: onReject,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: t.danger,
                      side: BorderSide(color: t.danger),
                    ),
                    child: const Text('Reject'),
                  ),
                if (onApprove != null) ...<Widget>[
                  const SizedBox(width: Spacing.x2),
                  FilledButton(
                    onPressed: onApprove,
                    child: const Text('Approve'),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  static String _initials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  static String _statusLabel(String status) => switch (status) {
        LeaveRequestStatus.pending => 'Pending',
        LeaveRequestStatus.approved => 'Approved',
        LeaveRequestStatus.rejected => 'Rejected',
        LeaveRequestStatus.cancelled => 'Cancelled',
        _ => status,
      };

  static UiTone _statusTone(String status) => switch (status) {
        LeaveRequestStatus.pending => UiTone.warning,
        LeaveRequestStatus.approved => UiTone.success,
        LeaveRequestStatus.rejected => UiTone.danger,
        _ => UiTone.neutral,
      };
}
