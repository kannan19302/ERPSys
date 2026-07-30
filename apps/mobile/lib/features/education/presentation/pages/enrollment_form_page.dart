import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/education.dart';
import '../providers/education_providers.dart';

class EnrollmentFormPage extends ConsumerStatefulWidget {
  const EnrollmentFormPage({this.enrollmentId, super.key});
  static const String routeName = 'enrollment-new';
  static const String routeEditName = 'enrollment-edit';
  static const String routePath = '/education/enrollments/new';
  static const String routeEditPath = '/education/enrollments/:id/edit';
  final String? enrollmentId;

  @override
  ConsumerState<EnrollmentFormPage> createState() => _EnrollmentFormPageState();
}

class _EnrollmentFormPageState extends ConsumerState<EnrollmentFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _studentIdCtrl = TextEditingController();
  final _courseIdCtrl = TextEditingController();
  final _semesterCtrl = TextEditingController();
  final _academicYearCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;
  bool get _isEditing => widget.enrollmentId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final e = ref.read(enrollmentDetailProvider(widget.enrollmentId!)).valueOrNull;
      if (e != null) {
        _studentIdCtrl.text = e.studentId; _courseIdCtrl.text = e.courseId;
        _semesterCtrl.text = e.semester ?? ''; _academicYearCtrl.text = e.academicYear ?? '';
        _status = e.status;
      }
    }
  }

  @override
  void dispose() {
    _studentIdCtrl.dispose(); _courseIdCtrl.dispose(); _semesterCtrl.dispose(); _academicYearCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final result = await ref.read(enrollmentListControllerProvider.notifier).save({
      'studentId': _studentIdCtrl.text.trim(), 'courseId': _courseIdCtrl.text.trim(),
      'semester': _semesterCtrl.text.trim().isEmpty ? null : _semesterCtrl.text.trim(),
      'academicYear': _academicYearCtrl.text.trim().isEmpty ? null : _academicYearCtrl.text.trim(),
      'status': _status,
      'enrollmentDate': DateTime.now().toIso8601String(),
    }, id: widget.enrollmentId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Enrollment' : 'New Enrollment'),
        actions: [TextButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Save'),
        )],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(controller: _studentIdCtrl, decoration: const InputDecoration(labelText: 'Student ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _courseIdCtrl, decoration: const InputDecoration(labelText: 'Course ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              Expanded(child: TextFormField(controller: _semesterCtrl, decoration: const InputDecoration(labelText: 'Semester'))),
              const SizedBox(width: Spacing.x4),
              Expanded(child: TextFormField(controller: _academicYearCtrl, decoration: const InputDecoration(labelText: 'Academic Year'))),
            ]),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status, decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
                DropdownMenuItem(value: 'COMPLETED', child: Text('Completed')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}