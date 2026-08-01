import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class DepartmentListPage extends ConsumerStatefulWidget {
  const DepartmentListPage({super.key});

  static const String routeName = 'departments';
  static const String routePath = '/hr/departments';

  @override
  ConsumerState<DepartmentListPage> createState() => _DepartmentListPageState();
}

class _DepartmentListPageState extends ConsumerState<DepartmentListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<List<Department>> asyncDepts = ref.watch(departmentsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Departments')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('department-new'),
        icon: const Icon(Icons.add),
        label: const Text('New department'),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search departments...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _search.clear();
                          setState(() {});
                        },
                      ),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(child: _buildBody(asyncDepts)),
        ],
      ),
    );
  }

  Widget _buildBody(AsyncValue<List<Department>> asyncDepts) {
    return asyncDepts.when(
      loading: () => const LoadingView(),
error: (Object e, StackTrace _) => FailureView(
          failure: e is Failure ? e : ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(departmentsProvider),
      ),
      data: (List<Department> departments) {
        final List<Department> filtered = _search.text.isEmpty
            ? departments
            : departments
                .where((Department d) => d.name
                    .toLowerCase()
                    .contains(_search.text.toLowerCase()),)
                .toList(growable: false);

        if (filtered.isEmpty) {
          return ListView(
            children: <Widget>[
              SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.6,
                child: EmptyView(
                  title: 'No departments found',
                  message: _search.text.isNotEmpty
                      ? 'Nothing matches "${_search.text}".'
                      : 'Departments created in UniERP will appear here.',
                ),
              ),
            ],
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(Spacing.x4),
          itemCount: filtered.length,
          separatorBuilder: (_, __) => const SizedBox(height: Spacing.x3),
          itemBuilder: (BuildContext context, int index) {
            final Department dept = filtered[index];
            final List<Department> children = _childrenOf(departments, dept.id);

            return UiCard(
              onTap: () => context.pushNamed(
                'department-detail',
                pathParameters: <String, String>{'id': dept.id},
              ),
              padding: const EdgeInsets.all(Spacing.x3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Icon(Icons.account_tree_outlined,
                          color: context.tokens.textSecondary,),
                      const SizedBox(width: Spacing.x2),
                      Expanded(
                        child: Text(
                          dept.name,
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                      ),
                      if (children.isNotEmpty)
                        Text(
                          '${children.length} sub',
                          style: TextStyle(
                            color: context.tokens.textTertiary,
                            fontSize: TypeScale.xs,
                          ),
                        ),
                    ],
                  ),
                  if (dept.headName != null) ...<Widget>[
                    const SizedBox(height: Spacing.x1),
                    Text(
                      'Head: ${dept.headName}',
                      style: TextStyle(
                        color: context.tokens.textSecondary,
                        fontSize: TypeScale.xs,
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  List<Department> _childrenOf(List<Department> all, String parentId) =>
      all.where((Department d) => d.parentDepartmentId == parentId).toList(growable: false);
}

