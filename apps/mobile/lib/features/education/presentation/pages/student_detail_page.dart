import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/education.dart';
import '../providers/education_providers.dart';

class StudentDetailPage extends ConsumerWidget {
  const StudentDetailPage({required this.studentId, super.key});

  static const String routeName = 'student-detail';
  static const String routePath = '/education/students/:id';

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Student> studentAsync =
        ref.watch(studentDetailProvider(studentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.productDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete student',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: studentAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load student.'),
          onRetry: () => ref.invalidate(studentDetailProvider(studentId)),
        ),
        data: (Student student) => _StudentDetail(student: student),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete student?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    final result = await ref.read(studentListControllerProvider.notifier).delete(studentId);
    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _StudentDetail extends StatelessWidget {
  const _StudentDetail({required this.student});

  final Student student;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  CircleAvatar(
                    backgroundColor: t.primaryLight,
                    child: Text(student.fullName.isNotEmpty ? student.fullName[0].toUpperCase() : '?',
                      style: TextStyle(color: t.primary, fontWeight: TypeScale.semibold),
                    ),
                  ),
                  const SizedBox(width: Spacing.x3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(student.fullName, style: Theme.of(context).textTheme.titleLarge),
                        if (student.enrollmentNumber != null)
                          Text(student.enrollmentNumber!, style: TextStyle(color: t.textSecondary)),
                      ],
                    ),
                  ),
                  _StatusPill(status: student.status, t: t),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
            const _SectionTitle('Contact Info'),
            _FieldRow('Email', student.email ?? '—'),
            _FieldRow('Phone', student.phone ?? '—'),
            _FieldRow('Address', student.address ?? '—'),
          ]),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
            const _SectionTitle('Personal Details'),
            _FieldRow('Date of Birth', student.dateOfBirth != null ? Formatters.date(student.dateOfBirth!) : '—'),
            _FieldRow('Gender', student.gender ?? '—'),
            _FieldRow('Guardian', student.guardianName ?? '—'),
            _FieldRow('Guardian Phone', student.guardianPhone ?? '—'),
          ]),
        ),
      ],
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status, required this.t});
  final String status; final Palette t;

  @override
  Widget build(BuildContext context) {
    final (String l, Color c, Color b) = switch (status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'INACTIVE' => ('Inactive', t.textSecondary, t.bgSunken),
      _ => (status, t.textSecondary, t.bgSunken),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
      decoration: BoxDecoration(color: b, borderRadius: Radii.pill),
      child: Text(l, style: TextStyle(color: c, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: Spacing.x3),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);
  final String label; final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}