import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/education_providers.dart';

class GradebookFormPage extends ConsumerStatefulWidget {
  const GradebookFormPage({this.gradeId, super.key});
  static const String routeName = 'gradebook-new';
  static const String routeEditName = 'gradebook-edit';
  static const String routePath = '/education/gradebook/new';
  static const String routeEditPath = '/education/gradebook/:id/edit';
  final String? gradeId;

  @override
  ConsumerState<GradebookFormPage> createState() => _GradebookFormPageState();
}

class _GradebookFormPageState extends ConsumerState<GradebookFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _studentIdCtrl = TextEditingController();
  final _courseIdCtrl = TextEditingController();
  final _scoreCtrl = TextEditingController();
  final _maxScoreCtrl = TextEditingController(text: '100');
  final _gradeCtrl = TextEditingController();
  final _remarksCtrl = TextEditingController();

  bool _saving = false;

  @override
  void dispose() {
    _studentIdCtrl.dispose(); _courseIdCtrl.dispose(); _scoreCtrl.dispose();
    _maxScoreCtrl.dispose(); _gradeCtrl.dispose(); _remarksCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final result = await ref.read(gradeEntryListControllerProvider.notifier).save({
      'studentId': _studentIdCtrl.text.trim(), 'courseId': _courseIdCtrl.text.trim(),
      'score': double.tryParse(_scoreCtrl.text) ?? 0,
      'maxScore': double.tryParse(_maxScoreCtrl.text) ?? 100,
      'grade': _gradeCtrl.text.trim().isEmpty ? null : _gradeCtrl.text.trim(),
      'remarks': _remarksCtrl.text.trim().isEmpty ? null : _remarksCtrl.text.trim(),
      'gradeDate': DateTime.now().toIso8601String(),
    }, id: widget.gradeId);
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
        title: const Text('Grade Entry'),
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
              Expanded(child: TextFormField(controller: _scoreCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Score *'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null)),
              const SizedBox(width: Spacing.x4),
              Expanded(child: TextFormField(controller: _maxScoreCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max Score'))),
            ]),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _gradeCtrl, decoration: const InputDecoration(
              labelText: 'Grade', helperText: 'e.g. A, B+, 85%')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _remarksCtrl, maxLines: 3, decoration: const InputDecoration(
              labelText: 'Remarks', alignLabelWithHint: true)),
          ],
        ),
      ),
    );
  }
}