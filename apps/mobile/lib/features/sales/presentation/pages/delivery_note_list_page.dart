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

class DeliveryNoteListPage extends ConsumerStatefulWidget {
  const DeliveryNoteListPage({super.key});

  static const String routeName = 'delivery-notes';
  static const String routePath = '/sales/delivery-notes';

  @override
  ConsumerState<DeliveryNoteListPage> createState() => _DeliveryNoteListPageState();
}

class _DeliveryNoteListPageState extends ConsumerState<DeliveryNoteListPage> {
  final TextEditingController _search = TextEditingController();
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Recently created',
    'customerName': 'Customer (A–Z)',
    '-customerName': 'Customer (Z–A)',
    'deliveryDate': 'Delivery date',
  };

  static const Map<String, String> _statusFilters = <String, String>{
    'DRAFT': 'Draft',
    'SUBMITTED': 'Submitted',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final SalesListState<DeliveryNote> state = ref.watch(deliveryNotesProvider);
    final DeliveryNotesController controller =
        ref.read(deliveryNotesProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Notes'),
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
          onPressed: () => context.pushNamed('delivery-note-new'),
          icon: const Icon(Icons.add),
          label: const Text('New delivery note'),
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
                hintText: 'Search by number or customer',
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
                      : '${state.meta.total} delivery note${state.meta.total == 1 ? '' : 's'}',
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

  Widget _body(
    SalesListState<DeliveryNote> state,
    DeliveryNotesController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<DeliveryNote>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No delivery notes found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Delivery notes created in UniERP will appear here.',
      itemBuilder: (BuildContext context, DeliveryNote note, _) =>
          _DeliveryNoteTile(
        note: note,
        onTap: () => context.pushNamed(
          'delivery-note-detail',
          pathParameters: <String, String>{'id': note.id},
        ),
      ),
    );
  }
}

class _DeliveryNoteTile extends StatelessWidget {
  const _DeliveryNoteTile({required this.note, this.onTap});

  final DeliveryNote note;
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
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  note.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ),
              UiStatusBadge(
                label: note.status,
                tone: _statusTone(note.status),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x1),
          Text(
            '#${note.id.length > 8 ? note.id.substring(0, 8) : note.id} · ${note.items.length} item${note.items.length == 1 ? '' : 's'}',
            style: TextStyle(
              color: t.textSecondary,
              fontSize: TypeScale.xs,
            ),
          ),
          if (note.deliveryDate != null) ...[
            const SizedBox(height: Spacing.x0_5),
            Text(
              'Delivery: ${Formatters.date(note.deliveryDate!)}',
              style: TextStyle(
                color: t.textTertiary,
                fontSize: TypeScale.xs,
              ),
            ),
          ],
        ],
      ),
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'DRAFT' => UiTone.neutral,
        'SUBMITTED' => UiTone.info,
        'DELIVERED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
