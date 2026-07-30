import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/real_estate.dart';
import '../providers/real_estate_providers.dart';

class PropertyFormPage extends ConsumerStatefulWidget {
  const PropertyFormPage({this.propertyId, super.key});
  static const String routeName = 'property-new';
  static const String routeEditName = 'property-edit';
  static const String routePath = '/real-estate/properties/new';
  static const String routeEditPath = '/real-estate/properties/:id/edit';
  final String? propertyId;

  @override
  ConsumerState<PropertyFormPage> createState() => _PropertyFormPageState();
}

class _PropertyFormPageState extends ConsumerState<PropertyFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _zipCtrl = TextEditingController();
  final _totalUnitsCtrl = TextEditingController();
  final _totalAreaCtrl = TextEditingController();
  final _purchasePriceCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _amenitiesCtrl = TextEditingController();

  String _propertyType = 'COMMERCIAL';
  String _status = 'ACTIVE';
  bool _saving = false;
  bool get _isEditing => widget.propertyId != null;

  @override
  void initState() { super.initState(); if (_isEditing) _load(); }

  Future<void> _load() async {
    final p = ref.read(propertyDetailProvider(widget.propertyId!)).valueOrNull;
    if (p != null) { _nameCtrl.text = p.name; _addressCtrl.text = p.address ?? ''; _cityCtrl.text = p.city ?? ''; _stateCtrl.text = p.state ?? ''; _zipCtrl.text = p.zipCode ?? ''; _totalUnitsCtrl.text = '${p.totalUnits}'; _totalAreaCtrl.text = '${p.totalArea}'; _purchasePriceCtrl.text = p.purchasePrice?.toString() ?? ''; _descriptionCtrl.text = p.description ?? ''; _amenitiesCtrl.text = p.amenities.join(', '); _propertyType = p.propertyType; _status = p.status; }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _addressCtrl.dispose(); _cityCtrl.dispose(); _stateCtrl.dispose(); _zipCtrl.dispose(); _totalUnitsCtrl.dispose(); _totalAreaCtrl.dispose(); _purchasePriceCtrl.dispose(); _descriptionCtrl.dispose(); _amenitiesCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(), 'address': _addressCtrl.text.trim().isEmpty ? null : _addressCtrl.text.trim(),
      'city': _cityCtrl.text.trim().isEmpty ? null : _cityCtrl.text.trim(), 'state': _stateCtrl.text.trim().isEmpty ? null : _stateCtrl.text.trim(),
      'zipCode': _zipCtrl.text.trim().isEmpty ? null : _zipCtrl.text.trim(), 'propertyType': _propertyType, 'status': _status,
      'totalUnits': int.tryParse(_totalUnitsCtrl.text) ?? 0, 'totalArea': double.tryParse(_totalAreaCtrl.text) ?? 0,
      'purchasePrice': double.tryParse(_purchasePriceCtrl.text), 'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'amenities': _amenitiesCtrl.text.trim().isEmpty ? [] : _amenitiesCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
    };
    final result = await ref.read(propertyListControllerProvider.notifier).save(payload, id: widget.propertyId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Property' : 'New Property'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _propertyType, decoration: const InputDecoration(labelText: 'Property Type'), items: const [
          DropdownMenuItem(value: 'COMMERCIAL', child: Text('Commercial')), DropdownMenuItem(value: 'RESIDENTIAL', child: Text('Residential')),
          DropdownMenuItem(value: 'INDUSTRIAL', child: Text('Industrial')), DropdownMenuItem(value: 'LAND', child: Text('Land')),
        ], onChanged: (v) { if (v != null) setState(() => _propertyType = v); }),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status'), items: const [
          DropdownMenuItem(value: 'ACTIVE', child: Text('Active')), DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
          DropdownMenuItem(value: 'MAINTENANCE', child: Text('Maintenance')),
        ], onChanged: (v) { if (v != null) setState(() => _status = v); }),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _addressCtrl, maxLines: 2, textCapitalization: TextCapitalization.sentences, decoration: const InputDecoration(labelText: 'Address', alignLabelWithHint: true)),
        const SizedBox(height: Spacing.x4),
        Row(children: [Expanded(child: TextFormField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City'))), const SizedBox(width: Spacing.x3), Expanded(child: TextFormField(controller: _stateCtrl, decoration: const InputDecoration(labelText: 'State')))]),
        const SizedBox(height: Spacing.x4),
        Row(children: [Expanded(child: TextFormField(controller: _zipCtrl, decoration: const InputDecoration(labelText: 'Zip Code'))), const SizedBox(width: Spacing.x3), Expanded(child: TextFormField(controller: _totalUnitsCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Total Units')))]),
        const SizedBox(height: Spacing.x4),
        Row(children: [Expanded(child: TextFormField(controller: _totalAreaCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Total Area (sqft)'))), const SizedBox(width: Spacing.x3), Expanded(child: TextFormField(controller: _purchasePriceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Purchase Price')))]),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _descriptionCtrl, maxLines: 3, textCapitalization: TextCapitalization.sentences, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _amenitiesCtrl, decoration: const InputDecoration(labelText: 'Amenities', helperText: 'Comma-separated')),
      ])),
    );
  }
}