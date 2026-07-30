import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AuditLogListPage extends ConsumerStatefulWidget {
  const AuditLogListPage({super.key});
  static const String routeName = 'admin-audit-log';
  static const String routePath = '/admin/audit-log';
  @override
  ConsumerState<AuditLogListPage> createState() => _AuditLogListPageState();
}

class _AuditLogListPageState extends ConsumerState<AuditLogListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(auditLogListControllerProvider);
    final controller = ref.read(auditLogListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Audit Log')),
      body: _body(state, controller),
    );
  }

  Widget _body(AuditLogListState state, AuditLogListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<AdminAuditLog>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No audit logs',
      emptyMessage: 'System activity will be recorded here.',
      itemBuilder: (_, AdminAuditLog log, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text('${log.action} · ${log.entityType}',
                      style: Theme.of(context).textTheme.titleSmall),
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Text('${log.userId} · ${log.entityId}',
                  style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
            ],
          ),
        ),
      ),
    );
  }
}
