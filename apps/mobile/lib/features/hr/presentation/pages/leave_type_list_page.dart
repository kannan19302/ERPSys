import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class LeaveTypeListPage extends ConsumerWidget {
  const LeaveTypeListPage({super.key});

  static const String routeName = 'leave-types';
  static const String routePath = '/hr/leave-types';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<LeaveType>> asyncTypes = ref.watch(leaveTypesProvider);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leave Types'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'New leave type',
            onPressed: () => context.pushNamed('leave-type-new'),
          ),
        ],
      ),
      body: asyncTypes.when(
        loading: () => const LoadingView(),
        error: (Object e, StackTrace _) => FailureView(
          failure: e is Failure ? e : ServerFailure(e.toString()),
          onRetry: () => ref.invalidate(leaveTypesProvider),
        ),
        data: (List<LeaveType> types) {
          if (types.isEmpty) {
            return ListView(
              children: <Widget>[
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.6,
                  child: const EmptyView(
                    title: 'No leave types',
                    message: 'Leave types configured here will appear.',
                  ),
                ),
              ],
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(Spacing.x4),
            itemCount: types.length,
            separatorBuilder: (_, __) => const SizedBox(height: Spacing.x3),
            itemBuilder: (BuildContext context, int index) {
              final LeaveType lt = types[index];
              final Color? color = lt.color != null
                  ? _parseColor(lt.color!)
                  : null;

              return UiCard(
                onTap: () => context.pushNamed(
                  'leave-type-detail',
                  pathParameters: <String, String>{'id': lt.id},
                ),
                padding: const EdgeInsets.all(Spacing.x3),
                child: Row(
                  children: <Widget>[
                    Container(
                      width: Spacing.x4,
                      height: Spacing.x4,
                      decoration: BoxDecoration(
                        color: color ?? t.primary,
                        borderRadius: const BorderRadius.all(Radius.circular(Radii.sm)),
                      ),
                    ),
                    const SizedBox(width: Spacing.x3),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            lt.name,
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          const SizedBox(height: Spacing.x0_5),
                          Text(
                            '${lt.daysAllowed.toInt()} days',
                            style: TextStyle(
                              color: t.textSecondary,
                              fontSize: TypeScale.xs,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: Spacing.x2),
                    if (lt.isPaid)
                      const UiStatusBadge(
                        label: 'Paid',
                        tone: UiTone.success,
                      )
                    else
                      const UiStatusBadge(
                        label: 'Unpaid',
                        tone: UiTone.neutral,
                      ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Color _parseColor(String hex) {
    final String clean = hex.replaceFirst('#', '');
    if (clean.length == 6) {
      return Color(int.parse('FF$clean', radix: 16));
    }
    return const Color(0xFF6366F1);
  }
}