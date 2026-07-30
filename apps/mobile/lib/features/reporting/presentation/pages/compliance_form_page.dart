import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/utils/formatters.dart';
import '../providers/reporting_providers.dart';

class ComplianceFormPage extends ConsumerStatefulWidget {
  const ComplianceFormPage({this.complianceId, super.key});
  static const String routeName = 'compliance-new';
  static const String routeEditName = 'compliance-edit';
  static const String routePath = '/reporting/compliance/new';
  static const String routeEditPath = '/reporting/compliance/:id/edit';
  final String? complianceId;

  @override
  ConsumerState<ComplianceFormPage> createState() => _ComplianceFormPageState();
}

class _ComplianceFormPageState extends ConsumerState<ComplianceFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _regulationCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _findingsCtrl = TextEditingController();
  DateTime? _dueDate;
  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.complianceId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  Future<void> _load() async {
    final c = ref.read(reportComplianceDetailProvider(widget.complianceId!)).valueOrNull;
    if (c != null) {
      _nameCtrl.text = c.name;
      _regulationCtrl.text = c.regulation ?? '';
      _status = c.status;
      _findingsCtrl.text = c.findings.toString();
      _dueDate = c.nextRunAt;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _regulationCtrl.dispose();
    _notesCtrl.dispose();
    _findingsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'regulation': _regulationCtrl.text.trim().isEmpty ? null : _regulationCtrl.text.trim(),
      'status': _status,
      'findings': int.tryParse(_findingsCtrl.text) ?? 0,
      'nextRunAt': _dueDate?.toIso8601String(),
    };
    final result = await ref.read(reportComplianceListControllerProvider.notifier).save(payload, id: widget.complianceId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Compliance' : 'New Compliance'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _regulationCtrl,
              decoration: const InputDecoration(labelText: 'Regulation'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _dueDate ?? DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                );
                if (picked != null) setState(() => _dueDate = picked);
              },
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: 'Due Date',
                  suffixIcon: const Icon(Icons.calendar_today),
                ),
                child: Text(_dueDate != null ? Formatters.date(_dueDate!) : 'Select date'),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _findingsCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Findings Count'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}
