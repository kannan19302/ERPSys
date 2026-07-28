import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class LeadListPage extends ConsumerStatefulWidget {
  const LeadListPage({super.key});

  static const String routeName = 'leads';
  static const String routePath = '/crm/leads';

  @override
  ConsumerState<LeadListPage> createState() => _LeadListPageState();
}

class _LeadListPageState extends ConsumerState<LeadListPage> {
  final TextEditingController _search = TextEditingController();
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-updatedAt': 'Recently updated',
    '-estimatedRevenue': 'Highest revenue',
    'estimatedRevenue': 'Lowest revenue',
    '-createdAt': 'Newest',
  };

  static const Map<String, String> _statusFilters = <String, String>{
    'NEW': 'New',
    'CONTACTED': 'Contacted',
    'QUALIFIED': 'Qualified',
    'DISQUALIFIED': 'Disqualified',
    'CONVERTED': 'Converted',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final CrmListState<Lead> state = ref.watch(leadsProvider);
    final LeadsController controller = ref.read(leadsProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leads'),
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
              decoration: InputDecoration(
                hintText: 'Search leads',
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
                      : '${state.meta.total} lead${state.meta.total == 1 ? '' : 's'}',
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

  Widget _body(CrmListState<Lead> state, LeadsController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Lead>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No leads found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Leads created in UniERP will appear here.',
      itemBuilder: (BuildContext context, Lead lead, _) => _LeadTile(
        lead: lead,
        onTap: () => context.pushNamed(
          'lead-detail',
          pathParameters: <String, String>{'id': lead.id},
        ),
        onConvert: lead.status == 'QUALIFIED'
            ? () => _performAction(controller.convert(lead.id))
            : null,
        onQualify: lead.status == 'NEW' || lead.status == 'CONTACTED'
            ? () => _performAction(controller.qualify(lead.id))
            : null,
      ),
    );
  }

  Future<void> _performAction(Future<Result<Lead>> action) async {
    final Result<Lead> result = await action;
    if (!context.mounted) return;
    result.fold(
      (Failure failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Lead updated'))),
    );
  }
}

class _LeadTile extends StatelessWidget {
  const _LeadTile({
    required this.lead,
    this.onTap,
    this.onConvert,
    this.onQualify,
  });

  final Lead lead;
  final VoidCallback? onTap;
  final VoidCallback? onConvert;
  final VoidCallback? onQualify;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (lead.status) {
      'NEW' => ('New', t.info, t.infoLight),
      'CONTACTED' => ('Contacted', t.warning, t.warningLight),
      'QUALIFIED' => ('Qualified', t.success, t.successLight),
      'DISQUALIFIED' => ('Disqualified', t.danger, t.dangerLight),
      'CONVERTED' => ('Converted', t.success, t.successLight),
      _ => (lead.status, t.textSecondary, t.bgSunken),
    };

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Container(
                height: Spacing.x10,
                width: Spacing.x10,
                decoration: BoxDecoration(
                  color: t.bgSunken,
                  borderRadius: Radii.control,
                ),
                alignment: Alignment.center,
                child: Icon(
                  Icons.person_outline,
                  size: TypeScale.xl,
                  color: t.textSecondary,
                ),
              ),
              const SizedBox(width: Spacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      '${lead.firstName ?? ''} ${lead.lastName ?? ''}'.trim(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    if (lead.company != null)
                      Text(
                        lead.company!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: t.textTertiary,
                          fontSize: TypeScale.xs,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: Spacing.x2),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Spacing.x2_5,
                  vertical: Spacing.x1,
                ),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: Radii.pill,
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: TypeScale.xs,
                    fontWeight: TypeScale.medium,
                  ),
                ),
              ),
            ],
          ),
          if (lead.email != null || lead.estimatedRevenue != null) ...<Widget>[
            const SizedBox(height: Spacing.x2),
            Row(
              children: <Widget>[
                if (lead.email != null)
                  Text(lead.email!,
                      style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                const Spacer(),
                if (lead.estimatedRevenue != null)
                  Text(
                    '\$${lead.estimatedRevenue!.toStringAsFixed(0)}',
                    style: TextStyle(
                      color: t.textSecondary,
                      fontSize: TypeScale.xs,
                      fontWeight: TypeScale.medium,
                    ),
                  ),
              ],
            ),
          ],
          if (onQualify != null || onConvert != null) ...<Widget>[
            const SizedBox(height: Spacing.x2),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: <Widget>[
                if (onQualify != null)
                  TextButton.icon(
                    onPressed: onQualify,
                    icon: const Icon(Icons.check_circle_outline, size: TypeScale.base),
                    label: const Text('Qualify'),
                  ),
                if (onConvert != null)
                  TextButton.icon(
                    onPressed: onConvert,
                    icon: const Icon(Icons.swap_horiz, size: TypeScale.base),
                    label: const Text('Convert'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}


