import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class TimesheetListPage extends ConsumerStatefulWidget {
  const TimesheetListPage({super.key});
  static const String routeName = 'project-timesheets';
  static const String routePath = '/projects/timesheets';
  @override
  ConsumerState<TimesheetListPage> createState() => _TimesheetListPageState();
}

class _TimesheetListPageState extends ConsumerState<TimesheetListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-date': 'Newest first',
    'date': 'Oldest first',
    '-hours': 'Most hours',
    'hours': 'Least hours',
    '-createdAt': 'Recently created',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(timesheetListControllerProvider);
    final controller = ref.read(timesheetListControllerProvider.notifier);
    final t = context.tokens;

    final double totalHours = state.items.fold<double>(
      0, (double sum, Timesheet ts) => sum + ts.hours);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Timesheets'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      body: Column(
        children: [
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by project or employee',
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
                    : '${state.meta.total} entry${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
              const Spacer(),
              Text(
                '${totalHours.toStringAsFixed(1)}h total',
                style: TextStyle(
                  color: t.textSecondary, fontSize: TypeScale.xs,
                  fontWeight: TypeScale.semibold,
                ),
              ),
            ]),
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
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Timesheet entries will appear here.',
      itemBuilder: (_, Timesheet ts, __) => _TimesheetTile(
        ts: ts,
        onTap: () => context.pushNamed(
          'timesheet-detail',
          pathParameters: <String, String>{'id': ts.id},
        ),
      ),
    );
  }
}

class _TimesheetTile extends StatelessWidget {
  const _TimesheetTile({required this.ts, required this.onTap});
  final Timesheet ts;
  final VoidCallback onTap;

  UiTone _statusTone(String status) => switch (status) {
        'APPROVED' => UiTone.success,
        'SUBMITTED' => UiTone.info,
        'DRAFT' => UiTone.neutral,
        'REJECTED' => UiTone.danger,
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
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (ts.projectName != null)
                      Text(ts.projectName!, style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: Spacing.x0_5),
                    Text(Formatters.date(ts.date),
                        style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                    if (ts.employeeName != null) ...[
                      const SizedBox(height: Spacing.x0_5),
                      Row(children: [
                        Icon(Icons.person_outline, size: TypeScale.sm, color: t.textTertiary),
                        const SizedBox(width: Spacing.x0_5),
                        Text(ts.employeeName!, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                      ]),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${ts.hours.toStringAsFixed(1)}h',
                      style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: Spacing.x0_5),
                  UiStatusBadge(label: ts.status, tone: _statusTone(ts.status)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}