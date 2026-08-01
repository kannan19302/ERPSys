import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

/// `GET /hr/employees/:id`
class EmployeeDetailPage extends ConsumerWidget {
  const EmployeeDetailPage({required this.employeeId, super.key});

  static const String routeName = 'employee-detail';
  static const String routePath = '/hr/employees/:id';

  final String employeeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Employee> employeeAsync =
        ref.watch(employeeDetailProvider(employeeId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Employee'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete employee',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: employeeAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load employee.'),
          onRetry: () => ref.invalidate(employeeDetailProvider(employeeId)),
        ),
        data: (Employee employee) => _EmployeeDetail(employee: employee),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete employee?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(employeeListControllerProvider.notifier)
        .delete(employeeId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _EmployeeDetail extends StatelessWidget {
  const _EmployeeDetail({required this.employee});

  final Employee employee;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  CircleAvatar(
                    radius: Spacing.x6,
                    backgroundColor: t.bgSunken,
                    backgroundImage: employee.imageUrl != null
                        ? NetworkImage(employee.imageUrl!)
                        : null,
                    child: employee.imageUrl == null
                        ? Icon(Icons.person_outline,
                            size: TypeScale.x2l, color: t.textSecondary,)
                        : null,
                  ),
                  const SizedBox(width: Spacing.x3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          employee.fullName,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: Spacing.x1),
                        Text(
                          employee.employeeNumber,
                          style: TextStyle(color: t.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  UiStatusBadge(
                    label: _statusLabel(employee.status),
                    tone: _statusTone(employee.status),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x3),
              if (employee.position != null) ...<Widget>[
                Text(employee.position!,
                    style: TextStyle(color: t.textSecondary),),
                const SizedBox(height: Spacing.x2),
              ],
              if (employee.department != null)
                Text(employee.department!,
                    style: TextStyle(color: t.textSecondary),),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Contact'),
              _Row('Email', employee.email),
              _Row('Phone', employee.phone ?? '—'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const UiSectionHeader(title: 'Employment Details'),
              _Row('Department', employee.department ?? '—'),
              _Row('Position', employee.position ?? '—'),
              _Row(
                'Hire date',
                employee.hireDate != null
                    ? Formatters.date(employee.hireDate!)
                    : '—',
              ),
              _Row('Salary mode', employee.salaryMode ?? '—'),
              _Row(
                'Base salary',
                employee.baseSalary != null
                    ? Formatters.currency(employee.baseSalary!)
                    : '—',
              ),
            ],
          ),
        ),
        if (employee.updatedAt != null) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'System'),
                _Row('Updated', Formatters.dateTime(employee.updatedAt!)),
                if (employee.createdAt != null)
                  _Row('Created', Formatters.dateTime(employee.createdAt!)),
              ],
            ),
          ),
        ],
      ],
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

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
