import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

/// Server-paginated employee list with search, department/status filter, sort.
class EmployeeListPage extends ConsumerStatefulWidget {
  const EmployeeListPage({super.key});

  static const String routeName = 'employees';
  static const String routePath = '/hr/employees';

  @override
  ConsumerState<EmployeeListPage> createState() => _EmployeeListPageState();
}

class _EmployeeListPageState extends ConsumerState<EmployeeListPage> {
  final TextEditingController _search = TextEditingController();
  String? _departmentFilter;
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-updatedAt': 'Recently updated',
    'firstName': 'Name (A–Z)',
    '-firstName': 'Name (Z–A)',
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'employeeNumber': 'Employee #',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadDepartments());
  }

  Future<void> _loadDepartments() async {
    if (!mounted) return;
    ref.read(departmentsProvider);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final EmployeeListState state = ref.watch(employeeListControllerProvider);
    final EmployeeListController controller =
        ref.read(employeeListControllerProvider.notifier);
    final Palette t = context.tokens;
    final AsyncValue<List<Department>> departmentsAsync =
        ref.watch(departmentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees'),
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
          onPressed: () => context.pushNamed('employee-new'),
          icon: const Icon(Icons.person_add),
          label: const Text('New employee'),
        ),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4,
              Spacing.x3,
              Spacing.x4,
              Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search name, email or employee #',
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
                Expanded(
                  child: _StatusFilter(
                    value: _statusFilter,
                    onChanged: (String? v) {
                      setState(() => _statusFilter = v);
                      final Map<String, String> filters = <String, String>{};
                      if (v != null && v.isNotEmpty) filters['status'] = v;
                      if (_departmentFilter != null &&
                          _departmentFilter!.isNotEmpty) {
                        filters['departmentId'] = _departmentFilter!;
                      }
                      controller.applyFilters(filters);
                    },
                  ),
                ),
                const SizedBox(width: Spacing.x2),
                Expanded(
                  child: _DepartmentFilter(
                    departments: departmentsAsync.valueOrNull ?? const <Department>[],
                    value: _departmentFilter,
                    onChanged: (String? v) {
                      setState(() => _departmentFilter = v);
                      final Map<String, String> filters = <String, String>{};
                      if (_statusFilter != null &&
                          _statusFilter!.isNotEmpty) {
                        filters['status'] = _statusFilter!;
                      }
                      if (v != null && v.isNotEmpty) filters['departmentId'] = v;
                      controller.applyFilters(filters);
                    },
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Text(
              state.isLoading
                  ? 'Loading…'
                  : '${state.meta.total} employee${state.meta.total == 1 ? '' : 's'}',
              style: TextStyle(
                color: t.textSecondary,
                fontSize: TypeScale.xs,
              ),
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(EmployeeListState state, EmployeeListController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Employee>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No employees found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Employees created in UniERP will appear here.',
      itemBuilder: (BuildContext context, Employee employee, _) =>
          _EmployeeTile(
        employee: employee,
        onTap: () => context.pushNamed(
          'employee-detail',
          pathParameters: <String, String>{'id': employee.id},
        ),
      ),
    );
  }
}

class _EmployeeTile extends StatelessWidget {
  const _EmployeeTile({required this.employee, this.onTap});

  final Employee employee;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: Spacing.x5,
            backgroundColor: t.bgSunken,
            backgroundImage: employee.imageUrl != null
                ? NetworkImage(employee.imageUrl!)
                : null,
            child: employee.imageUrl == null
                ? Icon(Icons.person_outline, color: t.textSecondary)
                : null,
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  employee.fullName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  employee.employeeNumber,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: t.textTertiary,
                    fontSize: TypeScale.xs,
                  ),
                ),
                if (employee.position != null) ...<Widget>[
                  const SizedBox(height: Spacing.x0_5),
                  Text(
                    employee.position!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: t.textSecondary,
                      fontSize: TypeScale.xs,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          UiStatusBadge(
            label: _statusLabel(employee.status),
            tone: _statusTone(employee.status),
          ),
        ],
      ),
    );
  }

  static String _statusLabel(String status) => switch (status) {
        EmployeeStatus.active => 'Active',
        EmployeeStatus.inactive => 'Inactive',
        EmployeeStatus.terminated => 'Terminated',
        _ => status,
      };

  static UiTone _statusTone(String status) => switch (status) {
        EmployeeStatus.active => UiTone.success,
        EmployeeStatus.inactive => UiTone.neutral,
        EmployeeStatus.terminated => UiTone.danger,
        _ => UiTone.neutral,
      };
}

class _StatusFilter extends StatelessWidget {
  const _StatusFilter({
    required this.value,
    required this.onChanged,
  });

  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value ?? '',
      decoration: const InputDecoration(
        contentPadding: EdgeInsets.symmetric(horizontal: Spacing.x3),
        labelText: 'Status',
      ),
      isExpanded: true,
      items: <String>['', EmployeeStatus.active, EmployeeStatus.inactive, EmployeeStatus.terminated]
          .map(
            (String v) => DropdownMenuItem<String>(
              value: v,
              child: Text(
                v.isEmpty ? 'All statuses' : _label(v),
                style: const TextStyle(fontSize: TypeScale.xs),
              ),
            ),
          )
          .toList(),
      onChanged: onChanged,
    );
  }

  static String _label(String s) => s == EmployeeStatus.active
      ? 'Active'
      : s == EmployeeStatus.inactive
          ? 'Inactive'
          : 'Terminated';
}

class _DepartmentFilter extends StatelessWidget {
  const _DepartmentFilter({
    required this.departments,
    required this.value,
    required this.onChanged,
  });

  final List<Department> departments;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value ?? '',
      decoration: const InputDecoration(
        contentPadding: EdgeInsets.symmetric(horizontal: Spacing.x3),
        labelText: 'Department',
      ),
      isExpanded: true,
      items: <String>['', ...departments.map((Department d) => d.id)]
          .map(
            (String v) => DropdownMenuItem<String>(
              value: v,
              child: Text(
                v.isEmpty
                    ? 'All departments'
                    : departments
                            .where((Department d) => d.id == v)
                            .firstOrNull
                            ?.name ??
                        v,
                style: const TextStyle(fontSize: TypeScale.xs),
              ),
            ),
          )
          .toList(),
      onChanged: onChanged,
    );
  }
}
