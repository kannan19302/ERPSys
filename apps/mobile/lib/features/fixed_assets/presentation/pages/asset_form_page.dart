import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/fixed_assets_providers.dart';

class AssetFormPage extends ConsumerStatefulWidget {
  const AssetFormPage({super.key, this.id});
  static const String routeName = 'asset-form';
  static const String routePath = '/asset-form';

  final String? id;

  @override
  ConsumerState<AssetFormPage> createState() => _AssetFormPageState();
}

class _AssetFormPageState extends ConsumerState<AssetFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _assetCategoryController = TextEditingController();
  final _assetTagController = TextEditingController();
  final _serialNumberController = TextEditingController();
  final _locationController = TextEditingController();
  final _departmentController = TextEditingController();
  final _purchaseCostController = TextEditingController();
  final _salvageValueController = TextEditingController();
  final _usefulLifeController = TextEditingController();
  final _insurancePolicyController = TextEditingController();
  final _notesController = TextEditingController();
  String _status = 'ACTIVE';
  String _depreciationMethod = 'STRAIGHT_LINE';
  DateTime? _purchaseDate;
  DateTime? _warrantyExpiry;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final asset = await ref.read(fixedAssetDetailProvider(widget.id!).future);
    if (!mounted) return;
    _nameController.text = asset.name;
    _assetCategoryController.text = asset.assetCategory;
    _assetTagController.text = asset.assetTag ?? '';
    _serialNumberController.text = asset.serialNumber ?? '';
    _locationController.text = asset.location ?? '';
    _departmentController.text = asset.department ?? '';
    _purchaseCostController.text = asset.purchaseCost.toString();
    _salvageValueController.text = asset.salvageValue.toString();
    _usefulLifeController.text = asset.usefulLifeYears.toString();
    _insurancePolicyController.text = asset.insurancePolicy ?? '';
    _notesController.text = asset.notes ?? '';
    _status = asset.status;
    _depreciationMethod = asset.depreciationMethod;
    _purchaseDate = asset.purchaseDate;
    _warrantyExpiry = asset.warrantyExpiry;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _assetCategoryController.dispose();
    _assetTagController.dispose();
    _serialNumberController.dispose();
    _locationController.dispose();
    _departmentController.dispose();
    _purchaseCostController.dispose();
    _salvageValueController.dispose();
    _usefulLifeController.dispose();
    _insurancePolicyController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'name': _nameController.text.trim(),
      'assetCategory': _assetCategoryController.text.trim(),
      'assetTag': _assetTagController.text.trim(),
      'serialNumber': _serialNumberController.text.trim(),
      'location': _locationController.text.trim(),
      'department': _departmentController.text.trim(),
      'purchaseCost': double.tryParse(_purchaseCostController.text.trim()) ?? 0,
      'salvageValue': double.tryParse(_salvageValueController.text.trim()) ?? 0,
      'usefulLifeYears': int.tryParse(_usefulLifeController.text.trim()) ?? 0,
      'insurancePolicy': _insurancePolicyController.text.trim(),
      'notes': _notesController.text.trim(),
      'status': _status,
      'depreciationMethod': _depreciationMethod,
      if (_purchaseDate != null) 'purchaseDate': _purchaseDate!.toIso8601String(),
      if (_warrantyExpiry != null) 'warrantyExpiry': _warrantyExpiry!.toIso8601String(),
    };
    final result = await ref.read(fixedAssetListControllerProvider.notifier).save(payload, id: widget.id);
    if (!mounted) return;
    setState(() => _isLoading = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(true),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.id != null && !_isInitialized) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit Asset')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Asset' : 'New Asset')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Name',
              controller: _nameController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(
              label: 'Asset Category',
              controller: _assetCategoryController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Asset Tag', controller: _assetTagController),
            UiTextField(label: 'Serial Number', controller: _serialNumberController),
            UiTextField(label: 'Location', controller: _locationController),
            UiTextField(label: 'Department', controller: _departmentController),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['ACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED', 'SOLD'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiTextField(label: 'Purchase Cost', controller: _purchaseCostController, keyboardType: TextInputType.number),
            UiTextField(label: 'Salvage Value', controller: _salvageValueController, keyboardType: TextInputType.number),
            UiTextField(label: 'Useful Life (Years)', controller: _usefulLifeController, keyboardType: TextInputType.number),
            UiDropdownField(
              label: 'Depreciation Method',
              itemLabel: (v) => v.toString(),
              selectedItem: _depreciationMethod,
              items: const ['STRAIGHT_LINE', 'DOUBLE_DECLINING', 'SUM_OF_YEARS'],
              onChanged: (v) => setState(() => _depreciationMethod = v!),
            ),
            UiDatePickerField(
              label: 'Purchase Date',
              selectedDate: _purchaseDate,
              onChanged: (v) => setState(() => _purchaseDate = v),
            ),
            UiDatePickerField(
              label: 'Warranty Expiry',
              selectedDate: _warrantyExpiry,
              onChanged: (v) => setState(() => _warrantyExpiry = v),
            ),
            UiTextField(label: 'Insurance Policy', controller: _insurancePolicyController),
            UiTextField(label: 'Notes', controller: _notesController, maxLines: 3),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}