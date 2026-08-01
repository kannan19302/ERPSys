import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class DepartmentDetailPage extends ConsumerWidget {
  const DepartmentDetailPage({required this.departmentId, super.key});

  static const String routeName = 'department-detail';
  static const String routePath = '/hr/departments/:id';

  final String departmentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<Department>> asyncDepts = ref.watch(departmentsProvider);
    final Palette t = context.tokens;

    return asyncDepts.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Department')),
        body: const LoadingView(),
      ),
      error: (Object error, StackTrace _) => Scaffold(
        appBar: AppBar(title: const Text('Department')),
        body: FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load department.'),
          onRetry: () => ref.invalidate(departmentsProvider),
        ),
      ),
      data: (List<Department> departments) {
        final Department? dept = departments.where(
          (Department d) => d.id == departmentId,
        ).firstOrNull;

        if (dept == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Department')),
            body: const Center(
              child: Text('Department not found'),
            ),
          );
        }

        final Department? parent = dept.parentDepartmentId != null
            ? departments.where(
                (Department d) => d.id == dept.parentDepartmentId,
              ).firstOrNull
            : null;

        final List<Department> children = departments
            .where((Department d) => d.parentDepartmentId == dept.id)
            .toList(growable: false);

        return Scaffold(
          appBar: AppBar(title: Text(dept.name)),
          body: ListView(
            padding: const EdgeInsets.all(Spacing.x4),
            children: <Widget>[
              UiCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const UiSectionHeader(title: 'Department Info'),
                    _Row('Name', dept.name),
                    _Row('Head', dept.headName ?? '—'),
                    _Row('Parent', parent?.name ?? 'None'),
                    if (dept.description != null && dept.description!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: Spacing.x2),
                        child: Text(
                          dept.description!,
                          style: TextStyle(color: t.textSecondary),
                        ),
                      ),
                  ],
                ),
              ),
              if (children.isNotEmpty) ...<Widget>[
                const SizedBox(height: Spacing.x4),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const UiSectionHeader(title: 'Sub-departments'),
                      ...children.map(
                        (Department child) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
                          child: Text(child.name),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (dept.createdAt != null) ...<Widget>[
                const SizedBox(height: Spacing.x4),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const UiSectionHeader(title: 'System'),
                      _Row('Created', Formatters.dateTime(dept.createdAt!)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
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