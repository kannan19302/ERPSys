import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/education_providers.dart';

class ExamFormPage extends ConsumerStatefulWidget {
  const ExamFormPage({this.examId, super.key});
  static const String routeName = 'exam-new';
  static const String routeEditName = 'exam-edit';
  static const String routePath = '/education/exams/new';
  static const String routeEditPath = '/education/exams/:id/edit';
  final String? examId;

  @override
  ConsumerState<ExamFormPage> createState() => _ExamFormPageState();
}

class _ExamFormPageState extends ConsumerState<ExamFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _courseIdCtrl = TextEditingController();
  final _maxScoreCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();
  final _roomCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _status = 'SCHEDULED';
  String _examType = 'MIDTERM';
  DateTime _examDate = DateTime.now().add(const Duration(days: 30));
  bool _saving = false;
  bool get _isEditing => widget.examId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final e = ref.read(examDetailProvider(widget.examId!)).valueOrNull;
      if (e != null) {
        _titleCtrl.text = e.title; _courseIdCtrl.text = e.courseId;
        _maxScoreCtrl.text = e.maxScore.toString(); _durationCtrl.text = e.durationMinutes?.toString() ?? '';
        _roomCtrl.text = e.room ?? ''; _notesCtrl.text = e.notes ?? '';
        _status = e.status; _examType = e.examType ?? 'MIDTERM'; _examDate = e.examDate;
      }
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose(); _courseIdCtrl.dispose(); _maxScoreCtrl.dispose();
    _durationCtrl.dispose(); _roomCtrl.dispose(); _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final result = await ref.read(examListControllerProvider.notifier).save({
      'title': _titleCtrl.text.trim(), 'courseId': _courseIdCtrl.text.trim(),
      'examDate': _examDate.toIso8601String(), 'status': _status,
      'examType': _examType, 'maxScore': double.tryParse(_maxScoreCtrl.text) ?? 100,
      'durationMinutes': int.tryParse(_durationCtrl.text), 'room': _roomCtrl.text.trim().isEmpty ? null : _roomCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    }, id: widget.examId);
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
        title: Text(_isEditing ? 'Edit Exam' : 'New Exam'),
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
            TextFormField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _courseIdCtrl, decoration: const InputDecoration(labelText: 'Course ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              Expanded(child: DropdownButtonFormField<String>(
                value: _examType, decoration: const InputDecoration(labelText: 'Exam Type'),
                items: const [
                  DropdownMenuItem(value: 'MIDTERM', child: Text('Midterm')),
                  DropdownMenuItem(value: 'FINAL', child: Text('Final')),
                  DropdownMenuItem(value: 'QUIZ', child: Text('Quiz')),
                  DropdownMenuItem(value: 'ASSIGNMENT', child: Text('Assignment')),
                ],
                onChanged: (v) { if (v != null) setState(() => _examType = v); },
              )),
              const SizedBox(width: Spacing.x4),
              Expanded(child: DropdownButtonFormField<String>(
                value: _status, decoration: const InputDecoration(labelText: 'Status'),
                items: const [
                  DropdownMenuItem(value: 'SCHEDULED', child: Text('Scheduled')),
                  DropdownMenuItem(value: 'IN_PROGRESS', child: Text('In Progress')),
                  DropdownMenuItem(value: 'COMPLETED', child: Text('Completed')),
                  DropdownMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
                ],
                onChanged: (v) { if (v != null) setState(() => _status = v); },
              )),
            ]),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context, initialDate: _examDate,
                  firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) setState(() => _examDate = picked);
              },
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Exam Date *'),
                child: Text('${_examDate.toLocal()}'.substring(0, 10)),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              Expanded(child: TextFormField(controller: _maxScoreCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max Score'))),
              const SizedBox(width: Spacing.x4),
              Expanded(child: TextFormField(controller: _durationCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Duration (min)'))),
            ]),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _roomCtrl, decoration: const InputDecoration(labelText: 'Room')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _notesCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true)),
          ],
        ),
      ),
    );
  }
}