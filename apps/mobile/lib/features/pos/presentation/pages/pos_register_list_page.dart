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

class PosRegisterListPage extends ConsumerStatefulWidget {
  const PosRegisterListPage({super.key});

  static const String routeName = 'pos-registers';
  static const String routePath = '/pos/registers';

  @override
  ConsumerState<PosRegisterListPage> createState() => _PosRegisterListPageState();
}

class _PosRegisterListPageState extends ConsumerState<PosRegisterListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Recently created',
    'name': 'Name (A-Z)',
    '-name': 'Name (Z-A)',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final PosListState<PosRegister> state = ref.watch(posRegistersProvider);
    final PosRegistersController controller = ref.read(posRegistersProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('POS Registers'),
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
                hintText: 'Search register name',
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
                      : '${state.meta.total} register${state.meta.total == 1 ? '' : 's'}',
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

  Widget _body(PosListState<PosRegister> state, PosRegistersController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<PosRegister>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No POS registers',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Registers configured in UniERP will appear here.',
      itemBuilder: (BuildContext context, PosRegister register, _) =>
          _PosRegisterTile(
        register: register,
        onTap: () => context.pushNamed(
          'pos-register-detail',
          pathParameters: <String, String>{'id': register.id},
        ),
      ),
    );
  }
}

class _PosRegisterTile extends StatelessWidget {
  const _PosRegisterTile({required this.register, this.onTap});

  final PosRegister register;
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
              child: Text(register.name,
                  style: Theme.of(context).textTheme.titleSmall),
            ),
            UiStatusBadge(
              label: register.status,
              tone: _statusTone(register.status),
            ),
          ]),
          const SizedBox(height: Spacing.x1),
          if (register.location != null)
            Text(register.location!,
                style: TextStyle(color: t.textSecondary)),
          const SizedBox(height: Spacing.x1),
          Text(
            'Opening: ${Formatters.currency(register.openingBalance)}',
            style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),
          ),
          if (register.closingBalance != null)
            Text(
              'Closing: ${Formatters.currency(register.closingBalance!)}',
              style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),
            ),
        ],
      ),
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'OPEN' => UiTone.success,
        'CLOSED' => UiTone.neutral,
        'BALANCING' => UiTone.warning,
        _ => UiTone.neutral,
      };
}