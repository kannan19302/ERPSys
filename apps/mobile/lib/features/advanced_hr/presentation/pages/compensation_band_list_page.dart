import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/advanced_hr.dart';
import '../providers/advanced_hr_providers.dart';

class CompensationBandListPage extends ConsumerStatefulWidget {
  const CompensationBandListPage({super.key});
  static const String routeName = 'compensation-bands';
  static const String routePath = '/advanced-hr/compensation-bands';
  @override
  ConsumerState<CompensationBandListPage> createState() => _CompensationBandListPageState();
}

class _CompensationBandListPageState extends ConsumerState<CompensationBandListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name',
    '-minSalary': 'Highest min salary',
    'minSalary': 'Lowest min salary',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(compensationBandListControllerProvider);
    final controller = ref.read(compensationBandListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compensation Bands'),
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
                hintText: 'Search by name or grade',
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
                    : '${state.meta.total} band${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(CompensationBandListState state, CompensationBandListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<CompensationBand>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No compensation bands',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Compensation bands configured in UniERP will appear here.',
      itemBuilder: (_, CompensationBand band, __) => _BandTile(
        band: band,
      ),
    );
  }
}

class _BandTile extends StatelessWidget {
  const _BandTile({required this.band});
  final CompensationBand band;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(band.name,
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              UiStatusBadge(
                label: band.status,
                tone: band.status == 'ACTIVE' ? UiTone.success : UiTone.neutral,
              ),
            ]),
            const SizedBox(height: Spacing.x1),
            Text('${Formatters.currency(band.minSalary)} - ${Formatters.currency(band.maxSalary)}',
                style: Theme.of(context).textTheme.labelLarge),
            if (band.grade != null) ...[
              const SizedBox(height: Spacing.x1),
              Text('Grade: ${band.grade}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
            ],
          ],
        ),
      ),
    );
  }
}
