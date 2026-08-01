import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class ActivityFormPage extends ConsumerStatefulWidget {
  const ActivityFormPage({super.key});

  static const String routeName = 'activity-new';
  static const String routePath = '/crm/activities/new';

  @override
  ConsumerState<ActivityFormPage> createState() => _ActivityFormPageState();
}

class _ActivityFormPageState extends ConsumerState<ActivityFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _subjectCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();

  String _type = 'TASK';
  String _status = 'OPEN';
  DateTime? _dueDate;
  String? _customerId;
  String? _contactId;
  String? _leadId;
  bool _saving = false;

  static const List<String> _types = <String>[
    'CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE',
  ];

  static const List<String> _statuses = <String>[
    'OPEN', 'COMPLETED', 'CANCELLED',
  ];

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'type': _type,
      'subject': _subjectCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty
          ? null
          : _descriptionCtrl.text.trim(),
      'status': _status,
      if (_dueDate != null) 'dueDate': _dueDate!.toIso8601String(),
      if (_customerId != null) 'customerId': _customerId,
      if (_contactId != null) 'contactId': _contactId,
      if (_leadId != null) 'leadId': _leadId,
    };

    final Result<Activity> result = await ref
        .read(activitiesProvider.notifier)
        .create(payload);

    if (!context.mounted) return;
    setState(() => _saving = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) => Navigator.of(context).pop(),
    );
  }

  Future<void> _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _dueDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Activity'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: Spacing.x5,
                    width: Spacing.x5,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            DropdownButtonFormField<String>(
              initialValue: _type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: _types
                  .map(
                    (String t) => DropdownMenuItem<String>(
                      value: t,
                      child: Text(t),
                    ),
                  )
                  .toList(),
              onChanged: (String? v) {
                if (v != null) setState(() => _type = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _subjectCtrl,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Subject'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: _statuses
                  .map(
                    (String s) => DropdownMenuItem<String>(
                      value: s,
                      child: Text(s),
                    ),
                  )
                  .toList(),
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Due Date'),
                child: Text(
                  _dueDate != null
                      ? '${_dueDate!.month}/${_dueDate!.day}/${_dueDate!.year}'
                      : 'Tap to select',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
