import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';

import '../../domain/entities/field_service.dart';
import '../providers/field_service_providers.dart';

class TechnicianListPage extends ConsumerStatefulWidget {
  const TechnicianListPage({super.key});
  static const String routeName = 'technicians';
  static const String routePath = '/field-service/technicians';
  @override
  ConsumerState<TechnicianListPage> createState() => _TechnicianListPageState();
}

class _TechnicianListPageState extends ConsumerState<TechnicianListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(technicianListControllerProvider);
    final controller = ref.read(technicianListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Technicians')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search technician name',
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
                    : '${state.meta.total} technician${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(TechnicianListState state, TechnicianListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<Technician>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No technicians found',
      emptyMessage: 'Technicians added in UniERP will appear here.',
      itemBuilder: (_, Technician tech, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(tech.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: tech.status,
                  tone: _statusTone(tech.status),
                ),
              ]),
              if (tech.specialization != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(tech.specialization!,
                    style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
              ],
              if (tech.phone != null) ...[
                const SizedBox(height: Spacing.x1),
                Row(children: [
                  Icon(Icons.phone, size: TypeScale.xs, color: context.tokens.textTertiary),
                  const SizedBox(width: Spacing.x1),
                  Text(tech.phone!, style: TextStyle(fontSize: TypeScale.xs)),
                ]),
              ],
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'AVAILABLE' => UiTone.success,
        'BUSY' => UiTone.warning,
        'OFF_DUTY' => UiTone.neutral,
        'ON_LEAVE' => UiTone.info,
        _ => UiTone.neutral,
      };
}
