import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class ActivityListPage extends ConsumerStatefulWidget {
  const ActivityListPage({super.key});

  static const String routeName = 'activities';
  static const String routePath = '/crm/activities';

  @override
  ConsumerState<ActivityListPage> createState() => _ActivityListPageState();
}

class _ActivityListPageState extends ConsumerState<ActivityListPage> {
  String? _typeFilter;
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-dueDate': 'Due date (newest)',
    'dueDate': 'Due date (oldest)',
    '-createdAt': 'Recently created',
  };

  static const Map<String, String> _typeFilters = <String, String>{
    'CALL': 'Call',
    'EMAIL': 'Email',
    'MEETING': 'Meeting',
    'TASK': 'Task',
    'NOTE': 'Note',
  };

  static const Map<String, String> _statusFilters = <String, String>{
    'OPEN': 'Open',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  };

  @override
  Widget build(BuildContext context) {
    final CrmListState<Activity> state = ref.watch(activitiesProvider);
    final ActivitiesController controller = ref.read(activitiesProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activities'),
        actions: <Widget>[
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map(
                  (MapEntry<String, String> entry) => PopupMenuItem<String>(
                    value: entry.key,
                    child: Text(entry.value),
                  ),
                )
                .toList(),
          ),
        ],
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.crmActivityCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('activity-new'),
          icon: const Icon(Icons.add),
          label: const Text('New activity'),
        ),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: Row(
              children: <Widget>[
                Expanded(
                  child: DropdownButton<String?>(
                    value: _typeFilter,
                    hint: const Text('Type'),
                    underline: const SizedBox.shrink(),
                    isExpanded: true,
                    items: _typeFilters.entries
                        .map(
                          (MapEntry<String, String> e) => DropdownMenuItem<String>(
                            value: e.key,
                            child: Text(e.value),
                          ),
                        )
                        .toList(),
                    onChanged: (String? value) {
                      setState(() => _typeFilter = value);
                      if (value == null) {
                        controller.applyFilters(const <String, String>{});
                      } else {
                        controller.applyFilters(<String, String>{'type': value});
                      }
                    },
                  ),
                ),
                const SizedBox(width: Spacing.x3),
                Expanded(
                  child: DropdownButton<String?>(
                    value: _statusFilter,
                    hint: const Text('Status'),
                    underline: const SizedBox.shrink(),
                    isExpanded: true,
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
                      final Map<String, String> filters = <String, String>{};
                      if (_typeFilter != null) filters['type'] = _typeFilter!;
                      if (value != null) filters['status'] = value;
                      controller.applyFilters(filters);
                    },
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading…'
                      : '${state.meta.total} activit${state.meta.total == 1 ? 'y' : 'ies'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(CrmListState<Activity> state, ActivitiesController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Activity>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No activities found',
      emptyMessage: 'Activities will appear here.',
      itemBuilder: (BuildContext context, Activity activity, _) => _ActivityTile(
        activity: activity,
        onTap: () => context.pushNamed(
          'activity-detail',
          pathParameters: <String, String>{'id': activity.id},
        ),
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {

  const _ActivityTile({required this.activity, this.onTap});

  static const Map<String, Color> _typeColors = {
    'CALL': Colors.blue,
    'EMAIL': Colors.green,
    'MEETING': Colors.orange,
    'TASK': Colors.purple,
  };

  static const Map<String, IconData> _typeIcons = {
    'CALL': Icons.phone,
    'EMAIL': Icons.email,
    'MEETING': Icons.event,
    'TASK': Icons.check_circle_outline,
  };

  final Activity activity;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final Color typeColor = _typeColors[activity.type] ?? t.textSecondary;
    final IconData typeIcon = _typeIcons[activity.type] ?? Icons.circle_outlined;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: typeColor.withValues(alpha: 0.1),
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(typeIcon, size: TypeScale.xl, color: typeColor),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  activity.subject,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Row(
                  children: <Widget>[
                    Text(
                      activity.type,
                      style: TextStyle(
                        color: typeColor,
                        fontSize: TypeScale.xs,
                        fontWeight: TypeScale.medium,
                      ),
                    ),
                    if (activity.dueDate != null) ...<Widget>[
                      const SizedBox(width: Spacing.x2),
                      Text(
                        'Due: ${Formatters.date(activity.dueDate!)}',
                        style: TextStyle(
                          color: t.textTertiary,
                          fontSize: TypeScale.xs,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          if (activity.status != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.x2_5,
                vertical: Spacing.x1,
              ),
              decoration: BoxDecoration(
                color: activity.status == 'COMPLETED' ? t.successLight : t.bgSunken,
                borderRadius: Radii.pill,
              ),
              child: Text(
                activity.status!,
                style: TextStyle(
                  color: activity.status == 'COMPLETED' ? t.success : t.textSecondary,
                  fontSize: TypeScale.xs,
                  fontWeight: TypeScale.medium,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
