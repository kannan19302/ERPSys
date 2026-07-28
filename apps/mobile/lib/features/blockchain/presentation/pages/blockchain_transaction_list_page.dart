import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/blockchain.dart';
import '../providers/blockchain_providers.dart';

class BlockchainTransactionListPage extends ConsumerStatefulWidget {
  const BlockchainTransactionListPage({super.key});
  static const String routeName = 'blockchain-transactions';
  static const String routePath = '/blockchain/transactions';
  @override
  ConsumerState<BlockchainTransactionListPage> createState() => _BlockchainTransactionListPageState();
}

class _BlockchainTransactionListPageState extends ConsumerState<BlockchainTransactionListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-value': 'Highest value',
    'value': 'Lowest value',
    'status': 'Status',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(blockchainTransactionListControllerProvider);
    final controller = ref.read(blockchainTransactionListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Blockchain Transactions'),
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
                hintText: 'Search by tx hash or address',
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
                    : '${state.meta.total} tx${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(BlockchainTransactionListState state, BlockchainTransactionListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<BlockchainTransaction>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No transactions',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Blockchain transactions will appear here.',
      itemBuilder: (_, BlockchainTransaction tx, __) => _TxTile(
        tx: tx,
      ),
    );
  }
}

class _TxTile extends StatelessWidget {
  const _TxTile({required this.tx});
  final BlockchainTransaction tx;

  UiTone _statusTone(String status) => switch (status) {
        'CONFIRMED' => UiTone.success,
        'PENDING' => UiTone.warning,
        'FAILED' => UiTone.danger,
        _ => UiTone.neutral,
      };

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
                child: Text(tx.txHash.length > 20 ? '${tx.txHash.substring(0, 20)}...' : tx.txHash,
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              UiStatusBadge(
                label: tx.status,
                tone: _statusTone(tx.status),
              ),
            ]),
            const SizedBox(height: Spacing.x1),
            if (tx.network != null)
              Text(tx.network!, style: TextStyle(color: t.textSecondary)),
            const SizedBox(height: Spacing.x1),
            Row(children: [
              Text('${tx.value.toStringAsFixed(6)} ETH',
                  style: Theme.of(context).textTheme.labelLarge),
              const Spacer(),
              if (tx.confirmations > 0)
                Text('${tx.confirmations} conf',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
            ]),
          ],
        ),
      ),
    );
  }
}
