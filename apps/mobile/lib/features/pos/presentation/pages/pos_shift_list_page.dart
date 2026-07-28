import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/pos.dart';
import '../providers/pos_providers.dart';

class PosShiftListPage extends ConsumerStatefulWidget {
  const PosShiftListPage({super.key});

  static const String routeName = 'pos-shifts';
  static const String routePath = '/pos/shifts';

  @override
  ConsumerState<PosShiftListPage> createState() => _PosShiftListPageState();
}

class _PosShiftListPageState extends ConsumerState<PosShiftListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-openedAt': 'Recently opened',
    'openedAt': 'Oldest first',
    '-totalSales': 'Highest sales',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final PosListState<PosShift> state = ref.watch(posShiftsProvider);
    final PosShiftsController controller = ref.read(posShiftsProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('POS Shifts'),
        actions: <Widget>[
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((MapEntry<String, String> entry) => PopupMenuItem<String>(
                      value: entry.key,
                      child: Text(entry.value),
                    ))
                .toList(),
          ),
        ],
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search shifts',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _search.clear();
                          controller.search('');
                        },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading...'
                      : '${state.meta.total} shift${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(PosListState<PosShift> state, PosShiftsController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<PosShift>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No shifts',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Shift records from POS registers will appear here.',
      itemBuilder: (BuildContext context, PosShift shift, _) => _PosShiftTile(
        shift: shift,
        onTap: () => context.pushNamed(
          'pos-shift-detail',
          pathParameters: <String, String>{'id': shift.id},
        ),
      ),
    );
  }
}

class _PosShiftTile extends StatelessWidget {
  const _PosShiftTile({required this.shift, this.onTap});

  final PosShift shift;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(children: <Widget>[
            Expanded(
              child: Text(
                'Shift ${shift.id.substring(0, 8)}...',
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
            UiStatusBadge(
              label: shift.status,
              tone: _statusTone(shift.status),
            ),
          ]),
          const SizedBox(height: Spacing.x1),
          Row(children: <Widget>[
            Icon(Icons.person_outline, size: TypeScale.base, color: t.textTertiary),
            const SizedBox(width: Spacing.x1),
            Text('User ${shift.userId.substring(0, 8)}...',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm)),
          ]),
          const SizedBox(height: Spacing.x1),
          Row(children: <Widget>[
            Icon(Icons.schedule, size: TypeScale.base, color: t.textTertiary),
            const SizedBox(width: Spacing.x1),
            Text(
              'Opened: ${_formatDate(shift.openedAt)}',
              style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),
            ),
          ]),
          const SizedBox(height: Spacing.x1),
          Text(
            Formatters.currency(shift.totalSales),
            style: Theme.of(context).textTheme.labelLarge,
          ),
        ],
      ),
    );
  }

  static String _formatDate(DateTime dt) =>
      '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'OPEN' => UiTone.success,
        'CLOSED' => UiTone.neutral,
        'RECONCILING' => UiTone.warning,
        _ => UiTone.neutral,
      };
}