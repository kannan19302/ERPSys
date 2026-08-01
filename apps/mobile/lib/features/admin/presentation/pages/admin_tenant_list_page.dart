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

class AdminTenantListPage extends ConsumerStatefulWidget {
  const AdminTenantListPage({super.key});
  static const String routeName = 'admin-tenants';
  static const String routePath = '/admin/tenants';
  @override
  ConsumerState<AdminTenantListPage> createState() => _AdminTenantListPageState();
}

class _AdminTenantListPageState extends ConsumerState<AdminTenantListPage> {
  final TextEditingController _search = TextEditingController();
  String? _planFilter;
  String? _statusFilter;

  static const Map<String, String> _plans = <String, String>{
    'free': 'Free', 'starter': 'Starter', 'business': 'Business', 'enterprise': 'Enterprise',
  };
  static const Map<String, String> _statuses = <String, String>{
    'ACTIVE': 'Active', 'SUSPENDED': 'Suspended', 'CANCELED': 'Canceled',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AdminTenantListState state = ref.watch(adminTenantListControllerProvider);
    final AdminTenantListController controller = ref.read(adminTenantListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tenants'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.adminTenantCreate,
            child: IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'New tenant',
              onPressed: () => context.pushNamed('admin-tenant-new'),
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
                hintText: 'Search tenants',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty ? null : IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () { _search.clear(); controller.search(''); },
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: <Widget>[
              DropdownButton<String?>(
                value: _planFilter,
                hint: const Text('Plan'),
                underline: const SizedBox.shrink(),
                items: _plans.entries.map((e) => DropdownMenuItem<String?>(value: e.key, child: Text(e.value))).toList()
                  ..insert(0, const DropdownMenuItem<String?>(value: null, child: Text('All plans'))),
                onChanged: (String? v) {
                  setState(() => _planFilter = v);
                  controller.applyFilters(v != null ? <String, String>{'plan': v} : <String, String>{});
                },
              ),
              const SizedBox(width: Spacing.x2),
              DropdownButton<String?>(
                value: _statusFilter,
                hint: const Text('Status'),
                underline: const SizedBox.shrink(),
                items: _statuses.entries.map((e) => DropdownMenuItem<String?>(value: e.key, child: Text(e.value))).toList()
                  ..insert(0, const DropdownMenuItem<String?>(value: null, child: Text('All statuses'))),
                onChanged: (String? v) {
                  setState(() => _statusFilter = v);
                  final Map<String, String> filters = <String, String>{};
                  if (_planFilter != null) filters['plan'] = _planFilter!;
                  if (v != null) filters['status'] = v;
                  controller.applyFilters(filters);
                },
              ),
            ],),
          ),
          Expanded(child: _body(state, controller, t)),
        ],
      ),
    );
  }

  Widget _body(AdminTenantListState state, AdminTenantListController controller, Palette t) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) return FailureView(failure: failure, onRetry: controller.refresh);

    return PaginatedListView<AdminTenant>(
      items: state.items, meta: state.meta,
      isLoadingMore: state.isLoadingMore, loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh, onLoadMore: controller.loadMore,
      emptyTitle: 'No tenants found',
      emptyMessage: 'Tenants are organizations using the system.',
      itemBuilder: (BuildContext context, AdminTenant tenant, _) => UiCard(
        onTap: () => context.pushNamed('admin-tenant-detail',
            pathParameters: <String, String>{'id': tenant.id},),
        padding: const EdgeInsets.all(Spacing.x3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(children: <Widget>[
              Expanded(child: Text(tenant.name, style: Theme.of(context).textTheme.labelLarge)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                decoration: BoxDecoration(
                  color: tenant.status == 'ACTIVE' ? t.successLight : (tenant.status == 'SUSPENDED' ? t.warningLight : t.bgSunken),
                  borderRadius: Radii.pill,
                ),
                child: Text(tenant.status == 'ACTIVE' ? 'Active' : (tenant.status == 'SUSPENDED' ? 'Suspended' : 'Canceled'),
                    style: TextStyle(
                      color: tenant.status == 'ACTIVE' ? t.success : (tenant.status == 'SUSPENDED' ? t.warning : t.textSecondary),
                      fontSize: TypeScale.xs, fontWeight: TypeScale.medium,
                    ),),
              ),
            ],),
            const SizedBox(height: Spacing.x1),
            Text(tenant.slug, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
            if (tenant.domain != null) Text(tenant.domain!, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
            const SizedBox(height: Spacing.x1),
            Row(children: <Widget>[
              Text('${tenant.userCount} users', style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              const SizedBox(width: Spacing.x2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x2, vertical: Spacing.x0_5),
                decoration: BoxDecoration(color: t.primaryLight, borderRadius: Radii.pill),
                child: Text(tenant.plan, style: TextStyle(color: t.primary, fontSize: TypeScale.xs)),
              ),
            ],),
          ],
        ),
      ),
    );
  }
}