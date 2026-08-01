import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/inventory.dart';
import '../../domain/usecases/inventory_usecases.dart';
import '../providers/inventory_providers.dart';

class WarehouseFormPage extends ConsumerStatefulWidget {
  const WarehouseFormPage({this.warehouse, super.key});

  static const String routeName = 'warehouse-new';
  static const String routeEditName = 'warehouse-edit';
  static const String routePath = '/inventory/warehouses/new';
  static const String routeEditPath = '/inventory/warehouses/:id/edit';

  final Warehouse? warehouse;

  @override
  ConsumerState<WarehouseFormPage> createState() => _WarehouseFormPageState();
}

class _WarehouseFormPageState extends ConsumerState<WarehouseFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _addressCtrl;
  late final TextEditingController _cityCtrl;
  late final TextEditingController _countryCtrl;
  late final TextEditingController _capacityCtrl;
  bool _isActive = true;
  bool _submitting = false;

  bool get _isEditing => widget.warehouse != null;

  @override
  void initState() {
    super.initState();
    final w = widget.warehouse;
    _nameCtrl = TextEditingController(text: w?.name ?? '');
    _addressCtrl = TextEditingController(text: w?.address ?? '');
    _cityCtrl = TextEditingController(text: w?.city ?? '');
    _countryCtrl = TextEditingController(text: w?.country ?? '');
    _capacityCtrl = TextEditingController(
      text: w != null ? w.capacity.toStringAsFixed(0) : '',
    );
    _isActive = w?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _countryCtrl.dispose();
    _capacityCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Warehouse' : 'New Warehouse'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _addressCtrl,
              decoration: const InputDecoration(labelText: 'Address'),
              maxLines: 2,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _cityCtrl,
              decoration: const InputDecoration(labelText: 'City'),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _countryCtrl,
              decoration: const InputDecoration(labelText: 'Country'),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _capacityCtrl,
              decoration: const InputDecoration(labelText: 'Capacity'),
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Active'),
              value: _isActive,
              contentPadding: EdgeInsets.zero,
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: Spacing.x6),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: Spacing.x5,
                      width: Spacing.x5,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_isEditing ? 'Save Changes' : 'Create Warehouse'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
      'city': _cityCtrl.text.trim(),
      'country': _countryCtrl.text.trim(),
      'capacity': double.tryParse(_capacityCtrl.text) ?? 0,
      'isActive': _isActive,
    };

    final result = await SaveWarehouseUseCase(
      ref.read(inventoryRepositoryProvider),
    )(
      SaveWarehouseParams(
        payload: payload,
        id: _isEditing ? widget.warehouse!.id : null,
      ),
    );

    if (!context.mounted) return;
    setState(() => _submitting = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing
                ? 'Warehouse updated'
                : 'Warehouse created',),
          ),
        );
        Navigator.of(context).pop();
      },
    );
  }
}
