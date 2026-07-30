import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/procurement_providers.dart';

class SupplierContractFormPage extends ConsumerStatefulWidget {
  const SupplierContractFormPage({this.contractId, super.key});
  static const String routeName = 'supplier-contract-new';
  static const String routeEditName = 'supplier-contract-edit';
  static const String routePath = '/procurement/contracts/new';
  static const String routeEditPath = '/procurement/contracts/:id/edit';
  final String? contractId;

  @override
  ConsumerState<SupplierContractFormPage> createState() => _SupplierContractFormPageState();
}

class _SupplierContractFormPageState extends ConsumerState<SupplierContractFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _supplierCtrl = TextEditingController();
  final _typeCtrl = TextEditingController();
  final _startDateCtrl = TextEditingController();
  final _endDateCtrl = TextEditingController();
  final _termsCtrl = TextEditingController();
  final _valueCtrl = TextEditingController();
  final _currencyCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _status = 'DRAFT';
  bool _saving = false;

  bool get _isEditing => widget.contractId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final c = ref.read(supplierContractDetailProvider(widget.contractId!)).valueOrNull;
      if (c != null) {
        _supplierCtrl.text = c.supplierName;
        _typeCtrl.text = c.type;
        _startDateCtrl.text = c.startDate?.toIso8601String() ?? '';
        _endDateCtrl.text = c.endDate?.toIso8601String() ?? '';
        _termsCtrl.text = c.terms ?? '';
        _valueCtrl.text = c.value.toString();
        _currencyCtrl.text = c.currency;
        _notesCtrl.text = c.notes ?? '';
        _status = c.status;
      }
    }
  }

  @override
  void dispose() {
    _supplierCtrl.dispose(); _typeCtrl.dispose(); _startDateCtrl.dispose();
    _endDateCtrl.dispose(); _termsCtrl.dispose(); _valueCtrl.dispose();
    _currencyCtrl.dispose(); _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'supplierName': _supplierCtrl.text.trim(),
      'type': _typeCtrl.text.trim(),
      'startDate': _startDateCtrl.text.trim().isEmpty ? null : _startDateCtrl.text.trim(),
      'endDate': _endDateCtrl.text.trim().isEmpty ? null : _endDateCtrl.text.trim(),
      'terms': _termsCtrl.text.trim().isEmpty ? null : _termsCtrl.text.trim(),
      'value': double.tryParse(_valueCtrl.text) ?? 0,
      'currency': _currencyCtrl.text.trim().isEmpty ? 'USD' : _currencyCtrl.text.trim(),
      'status': _status,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };

    final result = await ref.read(supplierContractListControllerProvider.notifier)
        .save(payload, id: widget.contractId);

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
        title: Text(_isEditing ? 'Edit Contract' : 'New Contract'),
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
              controller: _supplierCtrl,
              decoration: const InputDecoration(labelText: 'Supplier *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _typeCtrl,
              decoration: const InputDecoration(labelText: 'Contract Type *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _startDateCtrl,
              decoration: const InputDecoration(labelText: 'Start Date'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _endDateCtrl,
              decoration: const InputDecoration(labelText: 'End Date'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _valueCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Contract Value'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _currencyCtrl,
              decoration: const InputDecoration(labelText: 'Currency'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'DRAFT', child: Text('Draft')),
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'EXPIRED', child: Text('Expired')),
                DropdownMenuItem(value: 'TERMINATED', child: Text('Terminated')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _termsCtrl,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Terms', alignLabelWithHint: true),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}