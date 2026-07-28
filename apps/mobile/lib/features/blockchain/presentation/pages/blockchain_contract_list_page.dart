import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/blockchain.dart';
import '../providers/blockchain_providers.dart';

class BlockchainContractListPage extends ConsumerStatefulWidget {
  const BlockchainContractListPage({super.key});
  static const String routeName = 'blockchain-contracts';
  static const String routePath = '/blockchain/contracts';
  @override
  ConsumerState<BlockchainContractListPage> createState() => _BlockchainContractListPageState();
}

class _BlockchainContractListPageState extends ConsumerState<BlockchainContractListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(blockchainContractListControllerProvider);
    final controller = ref.read(blockchainContractListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Contracts'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by name or address',
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
                    : '${state.meta.total} contract${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(BlockchainContractListState state, BlockchainContractListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<BlockchainContract>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No contracts',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Smart contracts deployed via UniERP will appear here.',
      itemBuilder: (_, BlockchainContract contract, __) => _ContractTile(
        contract: contract,
      ),
    );
  }
}

class _ContractTile extends StatelessWidget {
  const _ContractTile({required this.contract});
  final BlockchainContract contract;

  UiTone _statusTone(String status) => switch (status) {
        'DEPLOYED' => UiTone.success,
        'DEPLOYING' => UiTone.warning,
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
                child: Text(contract.name,
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              UiStatusBadge(
                label: contract.status,
                tone: _statusTone(contract.status),
              ),
            ]),
            const SizedBox(height: Spacing.x1),
            Text(contract.address.length > 20
                ? '${contract.address.substring(0, 20)}...'
                : contract.address,
                style: TextStyle(color: t.textSecondary)),
            const SizedBox(height: Spacing.x1),
            Row(children: [
              Text(contract.network,
                  style: Theme.of(context).textTheme.labelLarge),
              const Spacer(),
              if (contract.owner != null)
                Text(contract.owner!.length > 12
                    ? 'Owner: ${contract.owner!.substring(0, 12)}...'
                    : 'Owner: ${contract.owner}',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
            ]),
          ],
        ),
      ),
    );
  }
}
