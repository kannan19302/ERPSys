import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/education.dart';
import '../providers/education_providers.dart';

class CourseFormPage extends ConsumerStatefulWidget {
  const CourseFormPage({this.courseId, super.key});
  static const String routeName = 'course-new';
  static const String routeEditName = 'course-edit';
  static const String routePath = '/education/courses/new';
  static const String routeEditPath = '/education/courses/:id/edit';
  final String? courseId;

  @override
  ConsumerState<CourseFormPage> createState() => _CourseFormPageState();
}

class _CourseFormPageState extends ConsumerState<CourseFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _codeCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _departmentCtrl = TextEditingController();
  final _instructorCtrl = TextEditingController();
  final _creditsCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;
  bool get _isEditing => widget.courseId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final c = ref.read(courseDetailProvider(widget.courseId!)).valueOrNull;
      if (c != null) {
        _codeCtrl.text = c.code; _nameCtrl.text = c.name; _departmentCtrl.text = c.department ?? '';
        _instructorCtrl.text = c.instructor ?? ''; _creditsCtrl.text = c.credits.toString();
        _durationCtrl.text = c.durationHours.toString(); _descriptionCtrl.text = c.description ?? '';
        _status = c.status;
      }
    }
  }

  @override
  void dispose() {
    _codeCtrl.dispose(); _nameCtrl.dispose(); _departmentCtrl.dispose();
    _instructorCtrl.dispose(); _creditsCtrl.dispose(); _durationCtrl.dispose(); _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final result = await ref.read(courseListControllerProvider.notifier).save({
      'code': _codeCtrl.text.trim(), 'name': _nameCtrl.text.trim(),
      'department': _departmentCtrl.text.trim().isEmpty ? null : _departmentCtrl.text.trim(),
      'instructor': _instructorCtrl.text.trim().isEmpty ? null : _instructorCtrl.text.trim(),
      'credits': int.tryParse(_creditsCtrl.text) ?? 0,
      'durationHours': int.tryParse(_durationCtrl.text) ?? 0,
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'status': _status,
    }, id: widget.courseId);
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
        title: Text(_isEditing ? 'Edit Course' : 'New Course'),
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
            TextFormField(controller: _codeCtrl, decoration: const InputDecoration(labelText: 'Course Code *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Course Name *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              Expanded(child: TextFormField(controller: _departmentCtrl, decoration: const InputDecoration(labelText: 'Department'))),
              const SizedBox(width: Spacing.x4),
              Expanded(child: TextFormField(controller: _instructorCtrl, decoration: const InputDecoration(labelText: 'Instructor'))),
            ]),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              Expanded(child: TextFormField(controller: _creditsCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Credits'))),
              const SizedBox(width: Spacing.x4),
              Expanded(child: TextFormField(controller: _durationCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Duration (hours)'))),
            ]),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _descriptionCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status, decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}