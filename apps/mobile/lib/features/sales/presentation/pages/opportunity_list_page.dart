import '../../../../core/error/exceptions.dart';
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
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class OpportunityListPage extends ConsumerStatefulWidget {
  const OpportunityListPage({super.key});

  static const String routeName = 'opportunities';
  static const String routePath = '/sales/opportunities';

  @override
  ConsumerState<OpportunityListPage> createState() => _OpportunityListPageState();
}

class _OpportunityListPageState extends ConsumerState<OpportunityListPage> {
  final TextEditingController _search = TextEditingController();
  String? _stageFilter;
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Recently created',
    'title': 'Name (A–Z)',
    '-expectedRevenue': 'Highest revenue',
    'expectedRevenue': 'Lowest revenue',
    'closeDate': 'Close date',
    '-probability': 'Highest probability',
  };

  static const Map<String, String> _stageFilters = <String, String>{
    'PROSPECTING': 'Prospecting',
    'QUALIFICATION': 'Qualification',
    'NEGOTIATION': 'Negotiation',
    'CLOSED_WON': 'Closed Won',
    'CLOSED_LOST': 'Closed Lost',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final SalesListState<Opportunity> state = ref.watch(opportunitiesProvider);
    final OpportunitiesController controller =
        ref.read(opportunitiesProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Opportunities'),
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
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('opportunity-new'),
          icon: const Icon(Icons.add),
          label: const Text('New opportunity'),
        ),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search name, company or contact',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Clear search',
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
                      ? 'Loading…'
                      : '${state.meta.total} opportunit${state.meta.total == 1 ? 'y' : 'ies'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
                const Spacer(),
                DropdownButton<String?>(
                  value: _stageFilter,
                  hint: const Text('Stage'),
                  underline: const SizedBox.shrink(),
                  items: _stageFilters.entries
                      .map(
                        (MapEntry<String, String> e) => DropdownMenuItem<String>(
                          value: e.key,
                          child: Text(e.value),
                        ),
                      )
                      .toList(),
                  onChanged: (String? value) {
                    setState(() => _stageFilter = value);
                    if (value == null) {
                      controller.applyFilters(const <String, String>{});
                    } else {
                      controller.applyFilters(<String, String>{'stage': value});
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

  Widget _body(
    SalesListState<Opportunity> state,
    OpportunitiesController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Opportunity>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No opportunities found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Opportunities created in UniERP will appear here.',
      itemBuilder: (BuildContext context, Opportunity opp, _) =>
          _OpportunityTile(
        opp: opp,
        onTap: () => context.pushNamed(
          'opportunity-detail',
          pathParameters: <String, String>{'id': opp.id},
        ),
      ),
    );
  }
}

class _OpportunityTile extends StatelessWidget {
  const _OpportunityTile({required this.opp, this.onTap});

  final Opportunity opp;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final double pct = (opp.probability ?? 0).clamp(0, 100);

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  opp.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ),
              UiStatusBadge(
                label: opp.stage,
                tone: _stageTone(opp.stage),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x1),
          Text(
            opp.company ?? opp.customerName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: t.textSecondary,
              fontSize: TypeScale.sm,
            ),
          ),
          const SizedBox(height: Spacing.x1),
          Row(
            children: <Widget>[
              if (opp.expectedRevenue != null)
                Text(
                  Formatters.currency(opp.expectedRevenue!),
                  style: TextStyle(
                    fontWeight: TypeScale.semibold,
                    color: t.text,
                    fontSize: TypeScale.sm,
                  ),
                ),
              const Spacer(),
              Text(
                '${pct.round()}%',
                style: TextStyle(
                  color: _probabilityColor(t, pct),
                  fontSize: TypeScale.xs,
                  fontWeight: TypeScale.medium,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x1),
          ClipRRect(
            borderRadius: Radii.pill,
            child: LinearProgressIndicator(
              value: pct / 100,
              backgroundColor: t.bgSunken,
              valueColor: AlwaysStoppedAnimation<Color>(
                _probabilityColor(t, pct),
              ),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  static Color _probabilityColor(Palette t, double pct) {
    if (pct >= 75) return t.success;
    if (pct >= 40) return t.warning;
    return t.textTertiary;
  }

  static UiTone _stageTone(String stage) => switch (stage.toUpperCase()) {
        'PROSPECTING' => UiTone.info,
        'QUALIFICATION' => UiTone.neutral,
        'NEGOTIATION' => UiTone.warning,
        'CLOSED_WON' => UiTone.success,
        'CLOSED_LOST' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
