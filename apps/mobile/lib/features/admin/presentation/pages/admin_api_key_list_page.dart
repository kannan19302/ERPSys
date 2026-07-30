import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminApiKeyListPage extends ConsumerStatefulWidget {
  const AdminApiKeyListPage({super.key});
  static const String routeName = 'admin-api-keys';
  static const String routePath = '/admin/api-keys';
  @override
  ConsumerState<AdminApiKeyListPage> createState() => _AdminApiKeyListPageState();
}

class _AdminApiKeyListPageState extends ConsumerState<AdminApiKeyListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AdminApiKeyListState state = ref.watch(adminApiKeyListControllerProvider);
    final AdminApiKeyListController controller = ref.read(adminApiKeyListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('API Keys'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.adminApiKeyCreate,
            child: IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'New API key',
              onPressed: () => context.pushNamed('admin-api-key-new'),
            ),
          ),
        ],
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by name',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty ? null : IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () { _search.clear(); controller.search(''); },
                ),
              ),
            ),
          ),
          Expanded(child: _body(state, controller, t)),
        ],
      ),
    );
  }

  Widget _body(AdminApiKeyListState state, AdminApiKeyListController controller, Palette t) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) return FailureView(failure: failure, onRetry: controller.refresh);

    return PaginatedListView<AdminApiKey>(
      items: state.items, meta: state.meta,
      isLoadingMore: state.isLoadingMore, loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh, onLoadMore: controller.loadMore,
      emptyTitle: 'No API keys found',
      emptyMessage: 'API keys for programmatic access will appear here.',
      itemBuilder: (BuildContext context, AdminApiKey key, _) => UiCard(
        onTap: () => context.pushNamed('admin-api-key-detail',
            pathParameters: <String, String>{'id': key.id}),
        padding: const EdgeInsets.all(Spacing.x3),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(children: <Widget>[
                    Expanded(child: Text(key.name, style: Theme.of(context).textTheme.labelLarge)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: Spacing.x2, vertical: Spacing.x0_5),
                      decoration: BoxDecoration(
                        color: key.isActive ? t.successLight : t.bgSunken,
                        borderRadius: Radii.pill,
                      ),
                      child: Text(key.isActive ? 'Active' : 'Inactive',
                          style: TextStyle(
                            color: key.isActive ? t.success : t.textSecondary,
                            fontSize: TypeScale.xs, fontWeight: TypeScale.medium,
                          )),
                    ),
                  ]),
                  if (key.maskedKey != null) ...<Widget>[
                    const SizedBox(height: Spacing.x1),
                    Text(key.maskedKey!, style: TextStyle(
                      color: t.textTertiary, fontSize: TypeScale.xs, fontFamily: 'monospace',
                    )),
                  ],
                  if (key.lastUsedAt != null) ...<Widget>[
                    const SizedBox(height: Spacing.x0_5),
                    Text('Last used: ${_fmt(key.lastUsedAt!)}',
                        style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(DateTime dt) => '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
}