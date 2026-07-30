import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/fixed_assets_providers.dart';

class DisposalFormPage extends ConsumerStatefulWidget {
  const DisposalFormPage({super.key, this.id});
  static const String routeName = 'disposal-form';
  static const String routePath = '/disposal-form';

  final String? id;

  @override
  ConsumerState<DisposalFormPage> createState() => _DisposalFormPageState();
}

class _DisposalFormPageState extends ConsumerState<DisposalFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _assetIdController = TextEditingController();
  final _assetNameController = TextEditingController();
  final _proceedsController = TextEditingController();
  final _disposalCostController = TextEditingController();
  final _approvedByController = TextEditingController();
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();
  String _disposalMethod = 'SALE';
  String _status = 'DRAFT';
  DateTime? _disposalDate;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final disposal = await ref.read(assetDisposalDetailProvider(widget.id!).future);
    if (!mounted) return;
    _assetIdController.text = disposal.assetId;
    _assetNameController.text = disposal.assetName ?? '';
    _proceedsController.text = disposal.proceedsFromSale.toString();
    _disposalCostController.text = disposal.disposalCost.toString();
    _approvedByController.text = disposal.approvedBy ?? '';
    _reasonController.text = disposal.reason ?? '';
    _notesController.text = disposal.notes ?? '';
    _disposalMethod = disposal.disposalMethod;
    _status = disposal.status;
    _disposalDate = disposal.disposalDate;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _assetIdController.dispose();
    _assetNameController.dispose();
    _proceedsController.dispose();
    _disposalCostController.dispose();
    _approvedByController.dispose();
    _reasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'assetId': _assetIdController.text.trim(),
      'assetName': _assetNameController.text.trim(),
      'proceedsFromSale': double.tryParse(_proceedsController.text.trim()) ?? 0,
      'disposalCost': double.tryParse(_disposalCostController.text.trim()) ?? 0,
      'approvedBy': _approvedByController.text.trim(),
      'reason': _reasonController.text.trim(),
      'notes': _notesController.text.trim(),
      'disposalMethod': _disposalMethod,
      'status': _status,
      if (_disposalDate != null) 'disposalDate': _disposalDate!.toIso8601String(),
    };
    final result = await ref.read(disposalListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Disposal')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Disposal' : 'New Disposal')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Asset ID',
              controller: _assetIdController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Asset Name', controller: _assetNameController),
            UiDropdownField(
              label: 'Disposal Method',
              itemLabel: (v) => v.toString(),
              selectedItem: _disposalMethod,
              items: const ['SALE', 'SCRAP', 'DONATION', 'TRANSFER'],
              onChanged: (v) => setState(() => _disposalMethod = v!),
            ),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiDatePickerField(
              label: 'Disposal Date',
              selectedDate: _disposalDate,
              onChanged: (v) => setState(() => _disposalDate = v),
            ),
            UiTextField(label: 'Proceeds from Sale', controller: _proceedsController, keyboardType: TextInputType.number),
            UiTextField(label: 'Disposal Cost', controller: _disposalCostController, keyboardType: TextInputType.number),
            UiTextField(label: 'Approved By', controller: _approvedByController),
            UiTextField(label: 'Reason', controller: _reasonController, maxLines: 3),
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