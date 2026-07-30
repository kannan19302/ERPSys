import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/real_estate.dart';
import '../providers/real_estate_providers.dart';

class UnitFormPage extends ConsumerStatefulWidget {
  const UnitFormPage({this.unitId, this.propertyId, super.key});
  static const String routeName = 'unit-new';
  static const String routeEditName = 'unit-edit';
  static const String routePath = '/real-estate/units/new';
  static const String routeEditPath = '/real-estate/units/:id/edit';
  final String? unitId; final String? propertyId;

  @override
  ConsumerState<UnitFormPage> createState() => _UnitFormPageState();
}

class _UnitFormPageState extends ConsumerState<UnitFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _labelCtrl = TextEditingController(); final _areaCtrl = TextEditingController();
  final _rentCtrl = TextEditingController(); final _descriptionCtrl = TextEditingController();
  String _status = 'VACANT'; bool _saving = false;
  bool get _isEditing => widget.unitId != null;

  @override
  void dispose() { _labelCtrl.dispose(); _areaCtrl.dispose(); _rentCtrl.dispose(); _descriptionCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return; setState(() => _saving = true);
    final payload = <String, dynamic>{
      'label': _labelCtrl.text.trim(), 'propertyId': widget.propertyId, 'status': _status,
      'area': double.tryParse(_areaCtrl.text) ?? 0, 'rent': double.tryParse(_rentCtrl.text) ?? 0,
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
    };
    final result = await ref.read(propertyListControllerProvider.notifier).saveUnit(payload, id: widget.unitId);
    if (!context.mounted) return; setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Unit' : 'New Unit'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _labelCtrl, decoration: const InputDecoration(labelText: 'Unit Label *', hintText: 'e.g. 101'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status'), items: const [
          DropdownMenuItem(value: 'VACANT', child: Text('Vacant')), DropdownMenuItem(value: 'OCCUPIED', child: Text('Occupied')),
          DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')), DropdownMenuItem(value: 'RESERVED', child: Text('Reserved')),
        ], onChanged: (v) { if (v != null) setState(() => _status = v); }),
        const SizedBox(height: Spacing.x4),
        Row(children: [Expanded(child: TextFormField(controller: _areaCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Area (sqft)'))), const SizedBox(width: Spacing.x3), Expanded(child: TextFormField(controller: _rentCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Rent')))],
        ),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _descriptionCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
      ])),
    );
  }
}

class TenantFormPage extends ConsumerStatefulWidget {
  const TenantFormPage({this.tenantId, super.key});
  static const String routeName = 'real-estate-tenant-new';
  static const String routeEditName = 'real-estate-tenant-edit';
  static const String routePath = '/real-estate/tenants/new';
  static const String routeEditPath = '/real-estate/tenants/:id/edit';
  final String? tenantId;

  @override
  ConsumerState<TenantFormPage> createState() => _TenantFormPageState();
}

class _TenantFormPageState extends ConsumerState<TenantFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController(); final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController(); final _companyCtrl = TextEditingController();
  final _emergencyContactCtrl = TextEditingController(); final _emergencyPhoneCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _status = 'ACTIVE'; bool _saving = false;
  bool get _isEditing => widget.tenantId != null;

  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _phoneCtrl.dispose(); _companyCtrl.dispose(); _emergencyContactCtrl.dispose(); _emergencyPhoneCtrl.dispose(); _notesCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return; setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(), 'email': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(), 'company': _companyCtrl.text.trim().isEmpty ? null : _companyCtrl.text.trim(),
      'emergencyContact': _emergencyContactCtrl.text.trim().isEmpty ? null : _emergencyContactCtrl.text.trim(),
      'emergencyPhone': _emergencyPhoneCtrl.text.trim().isEmpty ? null : _emergencyPhoneCtrl.text.trim(), 'status': _status,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };
    final result = await ref.read(propertyListControllerProvider.notifier).saveTenant(payload, id: widget.tenantId);
    if (!context.mounted) return; setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Tenant' : 'New Tenant'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone')),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _companyCtrl, decoration: const InputDecoration(labelText: 'Company')),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status'), items: const [
          DropdownMenuItem(value: 'ACTIVE', child: Text('Active')), DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
        ], onChanged: (v) { if (v != null) setState(() => _status = v); }),
        const SizedBox(height: Spacing.x4),
        Row(children: [Expanded(child: TextFormField(controller: _emergencyContactCtrl, decoration: const InputDecoration(labelText: 'Emergency Contact'))), const SizedBox(width: Spacing.x3), Expanded(child: TextFormField(controller: _emergencyPhoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Emergency Phone')))]),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _notesCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true)),
      ])),
    );
  }
}