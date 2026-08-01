import 'package:flutter/material.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/education.dart';
import '../providers/education_providers.dart';

class CourseDetailPage extends ConsumerWidget {
  const CourseDetailPage({required this.courseId, super.key});
  static const String routeName = 'course-detail';
  static const String routePath = '/education/courses/:id';
  final String courseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(courseDetailProvider(courseId));
    return Scaffold(
      appBar: AppBar(title: const Text('Course')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load course.'),
          onRetry: () => ref.invalidate(courseDetailProvider(courseId)),),
        data: (Course c) => _CourseDetail(course: c),
      ),
    );
  }
}

class _CourseDetail extends StatelessWidget {
  const _CourseDetail({required this.course});
  final Course course;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(course.name, style: Theme.of(context).textTheme.titleLarge)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                decoration: BoxDecoration(color: course.status == 'ACTIVE' ? t.successLight : t.bgSunken, borderRadius: Radii.pill),
                child: Text(course.status, style: TextStyle(color: course.status == 'ACTIVE' ? t.success : t.textSecondary,
                  fontSize: TypeScale.xs, fontWeight: TypeScale.medium,),),
              ),
            ],),
            const SizedBox(height: Spacing.x1),
            Text(course.code, style: TextStyle(color: t.textSecondary)),
          ],),
        ),
        const SizedBox(height: Spacing.x4),
        Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: Spacing.x3),
            _FieldRow('Department', course.department ?? '—'),
            _FieldRow('Instructor', course.instructor ?? '—'),
            _FieldRow('Credits', '${course.credits}'),
            _FieldRow('Duration', '${course.durationHours} hours'),
            if (course.description != null) ...[_FieldRow('Description', course.description!)],
          ],),
        ),
      ],
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.l, this.v);
  final String l; final String v;
  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [Expanded(child: Text(l, style: TextStyle(color: t.textSecondary))), Text(v, style: Theme.of(context).textTheme.labelLarge)]),
    );
  }
}