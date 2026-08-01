import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class LeaveTypeDetailPage extends ConsumerWidget {
  const LeaveTypeDetailPage({required this.leaveTypeId, super.key});

  static const String routeName = 'leave-type-detail';
  static const String routePath = '/hr/leave-types/:id';

  final String leaveTypeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<LeaveType>> asyncTypes = ref.watch(leaveTypesProvider);
    return asyncTypes.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Leave Type')),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (Object e, _) => Scaffold(
        appBar: AppBar(title: const Text('Leave Type')),
        body: Center(child: Text('$e')),
      ),
      data: (List<LeaveType> types) {
        final LeaveType? lt =
            types.where((LeaveType t) => t.id == leaveTypeId).firstOrNull;

        if (lt == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Leave Type')),
            body: const Center(child: Text('Leave type not found')),
          );
        }

        final Color? color = lt.color != null
            ? _parseColor(lt.color!)
            : null;

        return Scaffold(
          appBar: AppBar(
            title: Text(lt.name),
            actions: <Widget>[
              IconButton(
                icon: const Icon(Icons.edit_outlined),
                tooltip: 'Edit',
                onPressed: () => context.pushNamed(
                  'leave-type-edit',
                  pathParameters: <String, String>{'id': lt.id},
                ),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(Spacing.x4),
            children: <Widget>[
              if (color != null)
                Container(
                  height: Spacing.x2,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: const BorderRadius.all(Radius.circular(Radii.sm)),
                  ),
                ),
              const SizedBox(height: Spacing.x4),
              UiCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const UiSectionHeader(title: 'Leave Type Details'),
                    _Row('Name', lt.name),
                    _Row('Max Days', lt.daysAllowed.toInt().toString()),
                    _Row('Type', lt.isPaid ? 'Paid Leave' : 'Unpaid Leave'),
                    _Row(
                      'Requires Approval',
                      lt.requiresApproval ? 'Yes' : 'No',
                    ),
                  ],
                ),
              ),
              if (lt.createdAt != null) ...<Widget>[
                const SizedBox(height: Spacing.x4),
                UiCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const UiSectionHeader(title: 'System'),
                      _Row('Created', Formatters.dateTime(lt.createdAt!)),
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

  Color _parseColor(String hex) {
    final String clean = hex.replaceFirst('#', '');
    if (clean.length == 6) {
      return Color(int.parse('FF$clean', radix: 16));
    }
    return const Color(0xFF6366F1);
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